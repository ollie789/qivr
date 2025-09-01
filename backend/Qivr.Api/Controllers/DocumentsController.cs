using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Core.Interfaces;
using Qivr.Infrastructure.Data;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IStorageService _storageService;
    private readonly ILogger<DocumentsController> _logger;
    private readonly IResourceAuthorizationService _authorizationService;

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
        IResourceAuthorizationService authorizationService)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
        _authorizationService = authorizationService;
    }

    /// <summary>
    /// Upload a document for a patient
    /// </summary>
    [HttpPost("patient/{patientId}")]
    [RequestSizeLimit(10_485_760)] // 10MB limit
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
            // Generate unique file name
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var storageKey = $"documents/patients/{patientId}/{uniqueFileName}";

            // Upload to storage
            string fileUrl;
            using (var stream = file.OpenReadStream())
            {
                var metadata = new Dictionary<string, string>
                {
                    { "patientId", patientId.ToString() },
                    { "documentType", documentType },
                    { "uploadedBy", User.Identity?.Name ?? "Unknown" }
                };
                fileUrl = await _storageService.UploadAsync(stream, storageKey, file.ContentType, metadata);
            }

            // Get current user ID from claims
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("user_id")?.Value;
            Guid? uploadedByGuid = null;
            if (Guid.TryParse(userId, out var parsedUserId))
            {
                uploadedByGuid = parsedUserId;
            }

            // Save document metadata to database
            var document = new Document
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientId,
                FileName = file.FileName,
                FileSizeBytes = file.Length,
                ContentType = file.ContentType,
                StoragePath = storageKey,
                DocumentType = documentType,
                Description = description ?? string.Empty,
                UploadedBy = uploadedByGuid,
                Tags = "[]", // Empty JSON array
                Metadata = "{}" // Empty JSON object
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} uploaded for patient {PatientId}", document.Id, patientId);

            return CreatedAtAction(
                nameof(GetDocument),
                new { documentId = document.Id },
                new DocumentResponseDto
                {
                    Id = document.Id,
                    FileName = document.FileName,
                    FileSize = FormatFileSize(document.FileSizeBytes),
                    DocumentType = document.DocumentType,
                    Description = document.Description,
                    UploadedBy = document.UploadedBy?.ToString() ?? "Unknown",
                    UploadedAt = document.CreatedAt,
                    DownloadUrl = fileUrl
                });
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
            // Generate unique file name
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var storageKey = $"documents/appointments/{appointmentId}/{uniqueFileName}";

            // Upload to storage
            string fileUrl;
            using (var stream = file.OpenReadStream())
            {
                var metadata = new Dictionary<string, string>
                {
                    { "appointmentId", appointmentId.ToString() },
                    { "patientId", appointment.PatientId.ToString() },
                    { "documentType", documentType },
                    { "uploadedBy", User.Identity?.Name ?? "Unknown" }
                };
                fileUrl = await _storageService.UploadAsync(stream, storageKey, file.ContentType, metadata);
            }

            // Get current user ID from claims
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("user_id")?.Value;
            Guid? uploadedByGuid = null;
            if (Guid.TryParse(userId, out var parsedUserId))
            {
                uploadedByGuid = parsedUserId;
            }

            // Save document metadata to database
            var document = new Document
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = appointment.PatientId,
                FileName = file.FileName,
                FileSizeBytes = file.Length,
                ContentType = file.ContentType,
                StoragePath = storageKey,
                DocumentType = documentType,
                Description = description ?? string.Empty,
                UploadedBy = uploadedByGuid,
                Tags = "[]", // Empty JSON array
                Metadata = $"{{\"appointmentId\":\"{appointmentId}\"}}" // Store appointment ID in metadata
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} uploaded for appointment {AppointmentId}", document.Id, appointmentId);

            return CreatedAtAction(
                nameof(GetDocument),
                new { documentId = document.Id },
                new DocumentResponseDto
                {
                    Id = document.Id,
                    FileName = document.FileName,
                    FileSize = FormatFileSize(document.FileSizeBytes),
                    DocumentType = document.DocumentType,
                    Description = document.Description,
                    UploadedBy = document.UploadedBy?.ToString() ?? "Unknown",
                    UploadedAt = document.CreatedAt,
                    DownloadUrl = fileUrl
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for appointment {AppointmentId}", appointmentId);
            return StatusCode(500, "An error occurred while uploading the document");
        }
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

        // Generate download URL with 1 hour expiry
        var downloadUrl = await _storageService.GetPresignedUrlAsync(document.StoragePath, TimeSpan.FromHours(1));

        return Ok(new DocumentResponseDto
        {
            Id = document.Id,
            FileName = document.FileName,
            FileSize = FormatFileSize(document.FileSizeBytes),
            DocumentType = document.DocumentType,
            Description = document.Description,
            UploadedBy = document.UploadedBy?.ToString() ?? "Unknown",
            UploadedAt = document.CreatedAt,
            DownloadUrl = downloadUrl
        });
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
            .Select(d => new DocumentResponseDto
            {
                Id = d.Id,
                FileName = d.FileName,
                FileSize = FormatFileSize(d.FileSizeBytes),
                DocumentType = d.DocumentType,
                Description = d.Description,
                UploadedBy = d.UploadedBy != null ? d.UploadedBy.ToString() : "Unknown",
                UploadedAt = d.CreatedAt
            })
            .ToListAsync();

        // Add download URLs
        foreach (var doc in documents)
        {
            var document = await _context.Documents.FindAsync(doc.Id);
            if (document != null)
            {
                doc.DownloadUrl = await _storageService.GetPresignedUrlAsync(document.StoragePath, TimeSpan.FromHours(1));
            }
        }

        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        
        return Ok(documents);
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
}

// DTOs
public class DocumentResponseDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileSize { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string? DownloadUrl { get; set; }
}

public class DocumentUploadDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
    
    [Required]
    public string DocumentType { get; set; } = string.Empty;
    
    public string? Description { get; set; }
}
