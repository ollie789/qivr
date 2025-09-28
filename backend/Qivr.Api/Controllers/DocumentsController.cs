using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Core.Interfaces;
using Qivr.Infrastructure.Data;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.RateLimiting;
using Qivr.Api.Middleware;

namespace Qivr.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/documents")]
[Route("api/documents")] // Maintain backward compatibility
[Authorize]
[EnableRateLimiting("api")]
public class DocumentsController : ControllerBase
{
    private const string SharesMetadataKey = "shares";
    private const string ReviewMetadataKey = "review";

    private readonly QivrDbContext _context;
    private readonly IStorageService _storageService;
    private readonly ILogger<DocumentsController> _logger;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly IEnhancedAuditService _auditService;

    // File upload limits and allowed types
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".txt", ".csv", ".xls", ".xlsx"
    };
    
    private static readonly Dictionary<string, string> ContentTypeMapping = new()
    {
        { ".pdf", "application/pdf" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".doc", "application/msword" },
        { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        { ".txt", "text/plain" },
        { ".csv", "text/csv" },
        { ".xls", "application/vnd.ms-excel" },
        { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    };

    public DocumentsController(
        QivrDbContext context,
        IStorageService storageService,
        ILogger<DocumentsController> logger,
        IResourceAuthorizationService authorizationService,
        IEnhancedAuditService auditService)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
        _authorizationService = authorizationService;
        _auditService = auditService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DocumentResponseDto>), 200)]
    public async Task<ActionResult<IEnumerable<DocumentResponseDto>>> GetDocuments([FromQuery] DocumentListQuery request, CancellationToken cancellationToken)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest("Tenant information is missing");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);

        var query = _context.Documents
            .Include(d => d.Patient)
            .Where(d => d.TenantId == tenantId && !d.IsArchived);

        if (request.PatientId.HasValue)
        {
            if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, request.PatientId.Value))
            {
                return Forbid();
            }

            query = query.Where(d => d.PatientId == request.PatientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            query = query.Where(d => d.DocumentType == request.Category);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = $"%{request.Search.Trim()}%";
            query = query.Where(d =>
                EF.Functions.ILike(d.FileName, searchTerm) ||
                EF.Functions.ILike(d.Description ?? string.Empty, searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(request.ProviderId))
        {
            query = query.Where(d => d.Metadata.Contains(request.ProviderId));
        }

        if (request.RequiresReview.HasValue)
        {
            query = query.Where(d => d.RequiresReview == request.RequiresReview.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = Math.Max(1, request.Page);
        var pageSize = request.PageSize;

        var documents = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = await MapDocumentsWithUrlsAsync(documents, cancellationToken);

        Response.Headers["X-Total-Count"] = totalCount.ToString();
        return Ok(dtos);
    }

    /// <summary>
    /// Upload a document for a patient
    /// </summary>
    /// <param name="patientId">The patient ID</param>
    /// <param name="file">The file to upload (max 10MB)</param>
    /// <param name="documentType">Type of document</param>
    /// <param name="description">Optional description</param>
    /// <returns>The uploaded document information</returns>
    /// <response code="201">Document uploaded successfully</response>
    /// <response code="400">Invalid file or request</response>
    /// <response code="403">Access denied</response>
    [HttpPost("patient/{patientId}")]
    [RequestSizeLimit(10_485_760)] // 10MB limit
    [EnableRateLimiting("file-upload")]
    [ProducesResponseType(typeof(DocumentResponseDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> UploadPatientDocument(
        Guid patientId,
        [FromForm] IFormFile file,
        [FromForm] string documentType,
        [FromForm] string? description)
    {
        // Validate patient access
        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, patientId))
        {
            return Forbid("You do not have access to this patient's documents");
        }

        // Validate file
        var validationResult = ValidateFile(file);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ErrorMessage);
        }

        // Get tenant ID from context
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest("Tenant information is missing");
        }

        try
        {
            var uploadedByGuid = _authorizationService.GetCurrentUserId(User);

            _auditService.TrackEntityChanges(_context);

            var metadata = new Dictionary<string, object>
            {
                ["category"] = documentType,
                ["source"] = "patient-upload"
            };

            var (document, downloadUrl) = await SaveDocumentAsync(
                tenantId,
                patientId,
                uploadedByGuid,
                $"documents/patients/{patientId}",
                file,
                documentType,
                description,
                null,
                metadata,
                HttpContext.RequestAborted);

            await _auditService.SaveTrackedChangesAsync(_context, tenantId, uploadedByGuid);
            await _auditService.LogEntityChangeAsync(
                tenantId,
                uploadedByGuid,
                "UPLOAD",
                document,
                additionalMetadata: new Dictionary<string, object>
                {
                    ["documentType"] = documentType,
                    ["patientId"] = patientId,
                    ["fileSize"] = file.Length,
                    ["fileName"] = file.FileName
                });

            _logger.LogInformation("Document {DocumentId} uploaded for patient {PatientId}", document.Id, patientId);

            return CreatedAtAction(
                nameof(GetDocument),
                new { documentId = document.Id },
                MapDocumentToDto(document, downloadUrl));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for patient {PatientId}", patientId);
            return StatusCode(500, "An error occurred while uploading the document");
        }
    }

    /// <summary>
    /// Upload a document for an appointment
    /// </summary>
    [HttpPost("appointment/{appointmentId}")]
    [RequestSizeLimit(10_485_760)]
    [ProducesResponseType(typeof(DocumentResponseDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> UploadAppointmentDocument(
        Guid appointmentId,
        [FromForm] IFormFile file,
        [FromForm] string documentType,
        [FromForm] string? description)
    {
        // Validate appointment access
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId);
        
        if (appointment == null)
        {
            return NotFound("Appointment not found");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessAppointmentAsync(currentUserId, appointmentId))
        {
            return Forbid("You do not have access to this appointment's documents");
        }

        // Validate file
        var validationResult = ValidateFile(file);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ErrorMessage);
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest("Tenant information is missing");
        }

        try
        {
            var uploadedByGuid = _authorizationService.GetCurrentUserId(User);

            var metadata = new Dictionary<string, object>
            {
                ["appointmentId"] = appointmentId,
                ["providerId"] = appointment.ProviderId,
                ["source"] = "appointment-upload"
            };

            var (document, downloadUrl) = await SaveDocumentAsync(
                tenantId,
                appointment.PatientId,
                uploadedByGuid,
                $"documents/appointments/{appointmentId}",
                file,
                documentType,
                description,
                null,
                metadata,
                HttpContext.RequestAborted);

            _logger.LogInformation("Document {DocumentId} uploaded for appointment {AppointmentId}", document.Id, appointmentId);

            return CreatedAtAction(
                nameof(GetDocument),
                new { documentId = document.Id },
                MapDocumentToDto(document, downloadUrl));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for appointment {AppointmentId}", appointmentId);
            return StatusCode(500, "An error occurred while uploading the document");
        }
    }

    /// <summary>
    /// Upload a document to the current tenant (optionally scoped to a patient).
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(10_485_760)]
    [ProducesResponseType(typeof(DocumentResponseDto), 201)]
    public async Task<ActionResult<DocumentResponseDto>> UploadDocument(
        [FromForm] GeneralDocumentUploadRequest request,
        CancellationToken cancellationToken)
    {
        var validationResult = ValidateFile(request.File);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ErrorMessage);
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest("Tenant information is missing");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);

        Guid patientId;
        if (request.PatientId.HasValue && request.PatientId.Value != Guid.Empty)
        {
            if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, request.PatientId.Value))
            {
                return Forbid();
            }

            patientId = request.PatientId.Value;
        }
        else if (User.IsInRole("Patient"))
        {
            patientId = currentUserId;
        }
        else
        {
            return BadRequest("patientId is required when uploading on behalf of a patient");
        }

        var tags = ParseTags(request.Tags);
        var metadata = new Dictionary<string, object>
        {
            ["category"] = request.Category,
            ["source"] = "manual-upload"
        };

        if (request.ProviderId.HasValue && request.ProviderId.Value != Guid.Empty)
        {
            metadata["providerId"] = request.ProviderId.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.ProviderName))
        {
            metadata["providerName"] = request.ProviderName;
        }

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            metadata["description"] = request.Description;
        }

        _auditService.TrackEntityChanges(_context);

        var (document, downloadUrl) = await SaveDocumentAsync(
            tenantId,
            patientId,
            currentUserId,
            $"documents/patients/{patientId}",
            request.File,
            request.Category,
            request.Description,
            tags,
            metadata,
            cancellationToken);

        await _auditService.SaveTrackedChangesAsync(_context, tenantId, currentUserId);
        await _auditService.LogEntityChangeAsync(
            tenantId,
            currentUserId,
            "UPLOAD",
            document,
            additionalMetadata: new Dictionary<string, object>
            {
                ["documentType"] = request.Category,
                ["patientId"] = patientId,
                ["fileSize"] = request.File.Length,
                ["fileName"] = request.File.FileName
            });

        _logger.LogInformation("Document {DocumentId} uploaded via general endpoint", document.Id);

        return CreatedAtAction(nameof(GetDocument), new { documentId = document.Id }, MapDocumentToDto(document, downloadUrl));
    }

    /// <summary>
    /// Get a specific document
    /// </summary>
    [HttpGet("{documentId}")]
    [ProducesResponseType(typeof(DocumentResponseDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDocument(Guid documentId)
    {
        var document = await _context.Documents
            .Include(d => d.Patient)
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        // Check access
        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to this document");
        }

        var downloadUrl = await _storageService.GetPresignedUrlAsync(document.StoragePath, TimeSpan.FromHours(1));

        return Ok(MapDocumentToDto(document, downloadUrl));
    }

    /// <summary>
    /// Download a document
    /// </summary>
    [HttpGet("{documentId}/download")]
    [ProducesResponseType(typeof(FileStreamResult), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DownloadDocument(Guid documentId)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        // Check access
        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to this document");
        }

        try
        {
            // Download from storage
            var fileStream = await _storageService.DownloadAsync(document.StoragePath);
            
            // Return file
            return File(fileStream, document.ContentType, document.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading document {DocumentId}", documentId);
            return StatusCode(500, "An error occurred while downloading the document");
        }
    }

    /// <summary>
    /// Share a document with another user in the tenant
    /// </summary>
    [HttpPost("{documentId}/share")]
    [ProducesResponseType(typeof(DocumentShareDto), 201)]
    public async Task<ActionResult<DocumentShareDto>> ShareDocument(
        Guid documentId,
        [FromBody] DocumentShareRequest request,
        CancellationToken cancellationToken)
    {
        if (request.UserId == Guid.Empty)
        {
            return BadRequest(new { error = "A target user is required" });
        }

        if (request.ExpiresAt.HasValue && request.ExpiresAt.Value <= DateTime.UtcNow)
        {
            return BadRequest(new { error = "Expiration must be in the future" });
        }

        var document = await _context.Documents
            .Include(d => d.Patient)
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived, cancellationToken);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to this document");
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        var recipient = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.TenantId == tenantId, cancellationToken);

        if (recipient == null)
        {
            return NotFound("Recipient user not found");
        }

        var currentUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);

        var metadata = ParseMetadata(document.Metadata);
        var shares = ExtractShares(metadata);

        var accessLevel = string.IsNullOrWhiteSpace(request.AccessLevel)
            ? "view"
            : request.AccessLevel!.Trim().ToLowerInvariant();

        var shareEntry = new DocumentShareMetadata
        {
            ShareId = Guid.NewGuid(),
            SharedWithUserId = recipient.Id,
            SharedWithName = string.IsNullOrWhiteSpace(recipient.FullName) ? recipient.Email ?? recipient.Id.ToString() : recipient.FullName,
            SharedByUserId = currentUserId,
            SharedByName = currentUser != null && !string.IsNullOrWhiteSpace(currentUser.FullName)
                ? currentUser.FullName
                : currentUser?.Email ?? currentUserId.ToString(),
            SharedAt = DateTime.UtcNow,
            ExpiresAt = request.ExpiresAt?.ToUniversalTime(),
            AccessLevel = accessLevel,
            Message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim(),
            Revoked = false
        };

        shares.Add(shareEntry);
        StoreShares(metadata, shares);

        document.Metadata = SerializeMetadata(metadata);
        document.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var dto = MapShareToDto(shareEntry);
        return CreatedAtAction(nameof(GetDocumentShares), new { documentId }, dto);
    }

    /// <summary>
    /// List document shares
    /// </summary>
    [HttpGet("{documentId}/shares")]
    [ProducesResponseType(typeof(IEnumerable<DocumentShareDto>), 200)]
    public async Task<ActionResult<IEnumerable<DocumentShareDto>>> GetDocumentShares(Guid documentId, CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .Include(d => d.Patient)
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived, cancellationToken);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to this document");
        }

        var metadata = ParseMetadata(document.Metadata);
        var shares = ExtractShares(metadata)
            .Select(MapShareToDto)
            .OrderByDescending(s => s.SharedAt)
            .ToList();

        return Ok(shares);
    }

    /// <summary>
    /// Revoke a document share link
    /// </summary>
    [HttpDelete("{documentId}/shares/{shareId}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> RevokeDocumentShare(Guid documentId, Guid shareId, CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .Include(d => d.Patient)
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived, cancellationToken);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to this document");
        }

        var metadata = ParseMetadata(document.Metadata);
        var shares = ExtractShares(metadata);
        var share = shares.FirstOrDefault(s => s.ShareId == shareId);
        if (share == null)
        {
            return NotFound("Share not found");
        }

        if (!share.Revoked)
        {
            share.Revoked = true;
            share.RevokedAt = DateTime.UtcNow;

            StoreShares(metadata, shares);
            document.Metadata = SerializeMetadata(metadata);
            document.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
        }

        return NoContent();
    }

    /// <summary>
    /// List documents for a patient
    /// </summary>
    [HttpGet("patient/{patientId}")]
    [ProducesResponseType(typeof(IEnumerable<DocumentResponseDto>), 200)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> ListPatientDocuments(
        Guid patientId,
        [FromQuery] string? documentType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Validate patient access
        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, patientId))
        {
            return Forbid("You do not have access to this patient's documents");
        }

        var query = _context.Documents
            .Include(d => d.Patient)
            .Where(d => d.PatientId == patientId && !d.IsArchived);

        if (!string.IsNullOrEmpty(documentType))
        {
            query = query.Where(d => d.DocumentType == documentType);
        }

        var totalCount = await query.CountAsync();
        var documents = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = await MapDocumentsWithUrlsAsync(documents, HttpContext.RequestAborted);

        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(result);
    }

    [HttpGet("categories")]
    [ProducesResponseType(typeof(IEnumerable<string>), 200)]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories(CancellationToken cancellationToken)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest("Tenant information is missing");
        }

        var defaults = new[]
        {
            "intake",
            "imaging",
            "lab-report",
            "insurance",
            "treatment-plan",
            "billing",
            "consent",
            "other"
        };

        var categories = await _context.Documents
            .Where(d => d.TenantId == tenantId && !d.IsArchived)
            .Select(d => d.DocumentType)
            .Distinct()
            .ToListAsync(cancellationToken);

        var merged = defaults
            .Concat(categories)
            .Select(c => c.Trim())
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c)
            .ToArray();

        return Ok(merged);
    }

    /// <summary>
    /// Request a clinician review for a document
    /// </summary>
    [HttpPost("{documentId}/review/request")]
    [ProducesResponseType(typeof(DocumentResponseDto), 202)]
    public async Task<ActionResult<DocumentResponseDto>> RequestDocumentReview(
        Guid documentId,
        [FromBody] DocumentReviewRequest request,
        CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .Include(d => d.Patient)
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived, cancellationToken);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to this document");
        }

        User? assignedUser = null;
        if (request.AssignedToUserId.HasValue && request.AssignedToUserId.Value != Guid.Empty)
        {
            assignedUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == request.AssignedToUserId.Value && u.TenantId == document.TenantId, cancellationToken);

            if (assignedUser == null)
            {
                return NotFound("Assigned reviewer not found");
            }
        }

        var currentUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);

        var metadata = ParseMetadata(document.Metadata);
        var review = new DocumentReviewMetadata
        {
            Status = "pending",
            RequestedAt = DateTime.UtcNow,
            RequestedByUserId = currentUserId,
            RequestedByName = currentUser != null && !string.IsNullOrWhiteSpace(currentUser.FullName)
                ? currentUser.FullName
                : currentUser?.Email ?? currentUserId.ToString(),
            AssignedToUserId = assignedUser?.Id,
            AssignedToName = assignedUser != null && !string.IsNullOrWhiteSpace(assignedUser.FullName)
                ? assignedUser.FullName
                : assignedUser?.Email,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        StoreReviewMetadata(metadata, review);

        document.RequiresReview = true;
        document.ReviewedAt = null;
        document.ReviewedBy = null;
        document.Metadata = SerializeMetadata(metadata);
        document.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Accepted(MapDocumentToDto(document));
    }

    /// <summary>
    /// Complete a document review
    /// </summary>
    [HttpPost("{documentId}/review/complete")]
    [ProducesResponseType(typeof(DocumentResponseDto), 200)]
    public async Task<ActionResult<DocumentResponseDto>> CompleteDocumentReview(
        Guid documentId,
        [FromBody] DocumentReviewCompleteRequest request,
        CancellationToken cancellationToken)
    {
        var document = await _context.Documents
            .Include(d => d.Patient)
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived, cancellationToken);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to this document");
        }

        var currentUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);

        var metadata = ParseMetadata(document.Metadata);
        var review = ExtractReviewMetadata(metadata) ?? new DocumentReviewMetadata
        {
            Status = "pending",
            RequestedAt = DateTime.UtcNow,
            RequestedByUserId = currentUserId,
            RequestedByName = currentUser != null && !string.IsNullOrWhiteSpace(currentUser.FullName)
                ? currentUser.FullName
                : currentUser?.Email ?? currentUserId.ToString()
        };

        review.Status = string.IsNullOrWhiteSpace(request.Status) ? "completed" : request.Status!.Trim();
        review.ReviewedAt = DateTime.UtcNow;
        review.ReviewedByUserId = currentUserId;
        review.ReviewedByName = currentUser != null && !string.IsNullOrWhiteSpace(currentUser.FullName)
            ? currentUser.FullName
            : currentUser?.Email ?? currentUserId.ToString();
        review.Notes = string.IsNullOrWhiteSpace(request.Notes) ? review.Notes : request.Notes!.Trim();
        review.AgreesWithAssessment = request.AgreesWithAssessment ?? review.AgreesWithAssessment;
        review.Recommendations = string.IsNullOrWhiteSpace(request.Recommendations) ? review.Recommendations : request.Recommendations!.Trim();

        StoreReviewMetadata(metadata, review);

        document.RequiresReview = false;
        document.ReviewedAt = review.ReviewedAt;
        document.ReviewedBy = currentUserId;
        document.Metadata = SerializeMetadata(metadata);
        document.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(MapDocumentToDto(document));
    }

    /// <summary>
    /// Delete a document (soft delete)
    /// </summary>
    [HttpDelete("{documentId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDocument(Guid documentId)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsArchived);

        if (document == null)
        {
            return NotFound("Document not found");
        }

        // Check access
        var currentUserId = _authorizationService.GetCurrentUserId(User);
        if (!await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, document.PatientId))
        {
            return Forbid("You do not have access to delete this document");
        }

        try
        {
            // Soft delete in database
            document.IsArchived = true;
            document.ArchivedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Optionally delete from storage (you might want to keep for audit)
            // await _storageService.DeleteAsync(document.StoragePath);

            _logger.LogInformation("Document {DocumentId} deleted by {User}", documentId, User.Identity?.Name);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
            return StatusCode(500, "An error occurred while deleting the document");
        }
    }

    private FileValidationResult ValidateFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return new FileValidationResult { IsValid = false, ErrorMessage = "No file was uploaded" };
        }

        if (file.Length > MaxFileSize)
        {
            return new FileValidationResult 
            { 
                IsValid = false, 
                ErrorMessage = $"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)}MB" 
            };
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return new FileValidationResult 
            { 
                IsValid = false, 
                ErrorMessage = $"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", AllowedExtensions)}" 
            };
        }

        // Additional security check: verify file content matches extension
        // This helps prevent malicious files with fake extensions
        if (!IsValidFileContent(file, extension))
        {
            return new FileValidationResult 
            { 
                IsValid = false, 
                ErrorMessage = "File content does not match the file extension" 
            };
        }

        return new FileValidationResult { IsValid = true };
    }

    private bool IsValidFileContent(IFormFile file, string extension)
    {
        // Basic content validation - you can expand this based on your needs
        try
        {
            using var stream = file.OpenReadStream();
            var buffer = new byte[512];
            stream.Read(buffer, 0, 512);
            stream.Seek(0, SeekOrigin.Begin);

            return extension switch
            {
                ".pdf" => buffer.Length >= 4 && buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46,
                ".jpg" or ".jpeg" => buffer.Length >= 3 && buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF,
                ".png" => buffer.Length >= 8 && buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47,
                _ => true // For other file types, skip content validation for now
            };
        }
        catch
        {
            return false;
        }
    }

    private DocumentResponseDto MapDocumentToDto(Document document, string? downloadUrl = null)
    {
        var tags = ParseTags(document.Tags);
        var metadata = ParseMetadata(document.Metadata);
        var shares = ExtractShares(metadata);
        var shareDtos = shares
            .Select(MapShareToDto)
            .OrderByDescending(s => s.SharedAt)
            .ToArray();

        var reviewMetadata = ExtractReviewMetadata(metadata);
        var reviewStatus = DetermineReviewStatus(document, reviewMetadata);

        var metadataCopy = new Dictionary<string, object>(metadata, StringComparer.OrdinalIgnoreCase)
        {
            [SharesMetadataKey] = shareDtos
        };

        if (reviewMetadata != null)
        {
            metadataCopy[ReviewMetadataKey] = reviewMetadata;
        }

        var patientName = document.Patient != null ? document.Patient.FullName.Trim() : string.Empty;
        var uploadedById = document.UploadedBy;
        var uploadedByDisplay = metadata.TryGetValue("uploadedByDisplay", out var display) && display is string name && !string.IsNullOrWhiteSpace(name)
            ? name
            : uploadedById?.ToString() ?? "Unknown";

        return new DocumentResponseDto
        {
            Id = document.Id,
            PatientId = document.PatientId,
            PatientName = patientName,
            ProviderId = metadata.TryGetValue("providerId", out var provider) && Guid.TryParse(provider?.ToString(), out var providerId)
                ? providerId
                : null,
            ProviderName = metadata.TryGetValue("providerName", out var providerName) ? providerName?.ToString() : null,
            FileName = document.FileName,
            MimeType = document.ContentType ?? "application/octet-stream",
            Category = document.DocumentType,
            Description = document.Description,
            FileSize = document.FileSizeBytes,
            FileSizeFormatted = FormatFileSize(document.FileSizeBytes),
            UploadedById = uploadedById,
            UploadedBy = uploadedByDisplay,
            UploadedAt = document.CreatedAt,
            Tags = tags,
            Metadata = metadataCopy,
            Url = downloadUrl,
            ThumbnailUrl = metadata.TryGetValue("thumbnailUrl", out var thumbnail) ? thumbnail?.ToString() : null,
            RequiresReview = document.RequiresReview,
            ReviewStatus = reviewStatus,
            ReviewNotes = reviewMetadata?.Notes,
            ReviewedById = document.ReviewedBy,
            ReviewedBy = reviewMetadata?.ReviewedByName,
            ReviewedAt = document.ReviewedAt ?? reviewMetadata?.ReviewedAt,
            Shares = shareDtos
        };
    }

    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len /= 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    private class FileValidationResult
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
    }

    private static IReadOnlyList<string> ParseTags(string? tagsJson)
    {
        if (string.IsNullOrWhiteSpace(tagsJson))
        {
            return Array.Empty<string>();
        }

        try
        {
            var tags = JsonSerializer.Deserialize<List<string>>(tagsJson);
            return tags?.Where(t => !string.IsNullOrWhiteSpace(t)).ToArray() ?? Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static IDictionary<string, object> ParseMetadata(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return new Dictionary<string, object>();
        }

        try
        {
            var metadata = JsonSerializer.Deserialize<Dictionary<string, object>>(metadataJson);
            return metadata ?? new Dictionary<string, object>();
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }

    private static string SerializeTags(IEnumerable<string>? tags)
    {
        return JsonSerializer.Serialize(tags ?? Enumerable.Empty<string>());
    }

private static string SerializeMetadata(IDictionary<string, object>? metadata)
{
    return JsonSerializer.Serialize(metadata ?? new Dictionary<string, object>());
}

private static T? DeserializeMetadataValue<T>(object? raw)
{
    if (raw == null)
    {
        return default;
    }

    try
    {
        if (raw is JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Null || element.ValueKind == JsonValueKind.Undefined)
            {
                return default;
            }

            return element.Deserialize<T>();
        }

        if (raw is string str)
        {
            if (string.IsNullOrWhiteSpace(str))
            {
                return default;
            }

            return JsonSerializer.Deserialize<T>(str);
        }

        return JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(raw));
    }
    catch
    {
        return default;
    }
}

private static List<DocumentShareMetadata> ExtractShares(IDictionary<string, object> metadata)
{
    if (!metadata.TryGetValue(SharesMetadataKey, out var raw) || raw == null)
    {
        return new List<DocumentShareMetadata>();
    }

    var shares = DeserializeMetadataValue<List<DocumentShareMetadata>>(raw);
    return shares?.Where(s => s != null).Select(s => s!).ToList() ?? new List<DocumentShareMetadata>();
}

private static void StoreShares(IDictionary<string, object> metadata, IList<DocumentShareMetadata> shares)
{
    metadata[SharesMetadataKey] = shares;
}

private static DocumentReviewMetadata? ExtractReviewMetadata(IDictionary<string, object> metadata)
{
    if (!metadata.TryGetValue(ReviewMetadataKey, out var raw) || raw == null)
    {
        return null;
    }

    return DeserializeMetadataValue<DocumentReviewMetadata>(raw);
}

private static void StoreReviewMetadata(IDictionary<string, object> metadata, DocumentReviewMetadata review)
{
    metadata[ReviewMetadataKey] = review;
}

private DocumentShareDto MapShareToDto(DocumentShareMetadata share)
{
    return new DocumentShareDto
    {
        ShareId = share.ShareId,
        SharedWithUserId = share.SharedWithUserId,
        SharedWithName = string.IsNullOrWhiteSpace(share.SharedWithName)
            ? share.SharedWithUserId.ToString()
            : share.SharedWithName!,
        SharedByUserId = share.SharedByUserId,
        SharedByName = string.IsNullOrWhiteSpace(share.SharedByName)
            ? share.SharedByUserId.ToString()
            : share.SharedByName!,
        SharedAt = share.SharedAt,
        ExpiresAt = share.ExpiresAt,
        AccessLevel = string.IsNullOrWhiteSpace(share.AccessLevel) ? "view" : share.AccessLevel,
        Message = share.Message,
        Revoked = share.Revoked,
        RevokedAt = share.RevokedAt
    };
}

private static string DetermineReviewStatus(Document document, DocumentReviewMetadata? reviewMetadata)
{
    if (document.RequiresReview)
    {
        return reviewMetadata?.Status ?? "pending";
    }

    if (document.ReviewedAt.HasValue || reviewMetadata?.ReviewedAt != null)
    {
        return reviewMetadata?.Status ?? "completed";
    }

    return "not-required";
}

    private async Task<(Document document, string downloadUrl)> SaveDocumentAsync(
        Guid tenantId,
        Guid patientId,
        Guid? uploadedBy,
        string storageFolder,
        IFormFile file,
        string category,
        string? description,
        IEnumerable<string>? tags,
        IDictionary<string, object>? metadata,
        CancellationToken cancellationToken)
    {
        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var storageKey = Path.Combine(storageFolder, uniqueFileName).Replace('\\', '/');

        var storageMetadata = new Dictionary<string, string>
        {
            ["patientId"] = patientId.ToString(),
            ["documentType"] = category,
            ["uploadedBy"] = uploadedBy?.ToString() ?? "unknown"
        };

        if (metadata != null)
        {
            foreach (var kv in metadata)
            {
                if (kv.Value != null)
                {
                    storageMetadata[kv.Key] = kv.Value.ToString() ?? string.Empty;
                }
            }
        }

        string fileUrl;
        await using (var stream = file.OpenReadStream())
        {
            fileUrl = await _storageService.UploadAsync(stream, storageKey, file.ContentType, storageMetadata);
        }

        var documentMetadata = metadata != null
            ? new Dictionary<string, object>(metadata)
            : new Dictionary<string, object>();

        if (!documentMetadata.ContainsKey("source"))
        {
            documentMetadata["source"] = "manual-upload";
        }

        if (!documentMetadata.ContainsKey("uploadedByDisplay"))
        {
            documentMetadata["uploadedByDisplay"] = User.Identity?.Name ?? "Unknown";
        }

        var document = new Document
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            FileName = file.FileName,
            DocumentType = category,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileSizeBytes = file.Length,
            StoragePath = storageKey,
            Description = description ?? string.Empty,
            UploadedBy = uploadedBy,
            Tags = SerializeTags(tags),
            Metadata = SerializeMetadata(documentMetadata)
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        await _context.Entry(document).Reference(d => d.Patient).LoadAsync(cancellationToken);

        return (document, fileUrl);
    }

    private async Task<IReadOnlyList<DocumentResponseDto>> MapDocumentsWithUrlsAsync(IEnumerable<Document> documents, CancellationToken cancellationToken)
    {
        var results = new List<DocumentResponseDto>();

        foreach (var document in documents)
        {
            var downloadUrl = await _storageService.GetPresignedUrlAsync(document.StoragePath, TimeSpan.FromHours(1));
            results.Add(MapDocumentToDto(document, downloadUrl));
        }

        return results;
    }
}

// DTOs
public class DocumentResponseDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileSizeFormatted { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? UploadedById { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public IReadOnlyList<string> Tags { get; set; } = Array.Empty<string>();
    public IDictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
    public string? Url { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool RequiresReview { get; set; }
    public string ReviewStatus { get; set; } = "not-required";
    public string? ReviewNotes { get; set; }
    public Guid? ReviewedById { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public IReadOnlyList<DocumentShareDto> Shares { get; set; } = Array.Empty<DocumentShareDto>();
}

public class DocumentShareDto
{
    public Guid ShareId { get; set; }
    public Guid SharedWithUserId { get; set; }
    public string SharedWithName { get; set; } = string.Empty;
    public Guid SharedByUserId { get; set; }
    public string SharedByName { get; set; } = string.Empty;
    public DateTime SharedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string AccessLevel { get; set; } = "view";
    public string? Message { get; set; }
    public bool Revoked { get; set; }
    public DateTime? RevokedAt { get; set; }
}

public class DocumentListQuery
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public Guid? PatientId { get; set; }
    public string? Category { get; set; }
    public string? ProviderId { get; set; }
    public string? Search { get; set; }
    public bool? RequiresReview { get; set; }
    public int Page { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = Math.Clamp(value, 1, MaxPageSize);
    }
}

public class DocumentShareRequest
{
    [Required]
    public Guid UserId { get; set; }

    public DateTime? ExpiresAt { get; set; }

    [StringLength(1000)]
    public string? Message { get; set; }

    [StringLength(32)]
    public string AccessLevel { get; set; } = "view";
}

public class DocumentReviewRequest
{
    public Guid? AssignedToUserId { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class DocumentReviewCompleteRequest
{
    [StringLength(2000)]
    public string? Notes { get; set; }

    public bool? AgreesWithAssessment { get; set; }

    [StringLength(2000)]
    public string? Recommendations { get; set; }

    [StringLength(32)]
    public string? Status { get; set; }
}

public class GeneralDocumentUploadRequest
{
    [Required]
    public IFormFile File { get; set; } = null!;

    [Required]
    public string Category { get; set; } = string.Empty;

    public Guid? PatientId { get; set; }
    public Guid? ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
}
private sealed class DocumentShareMetadata
{
    public Guid ShareId { get; set; }
    public Guid SharedWithUserId { get; set; }
    public string? SharedWithName { get; set; }
    public Guid SharedByUserId { get; set; }
    public string? SharedByName { get; set; }
    public DateTime SharedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string AccessLevel { get; set; } = "view";
    public string? Message { get; set; }
    public bool Revoked { get; set; }
    public DateTime? RevokedAt { get; set; }
}

private sealed class DocumentReviewMetadata
{
    public string Status { get; set; } = "pending";
    public Guid RequestedByUserId { get; set; }
    public string? RequestedByName { get; set; }
    public DateTime RequestedAt { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? Notes { get; set; }
    public bool? AgreesWithAssessment { get; set; }
    public string? Recommendations { get; set; }
}
