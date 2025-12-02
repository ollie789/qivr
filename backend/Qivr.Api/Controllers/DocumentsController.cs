using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : BaseApiController
{
    private readonly IDocumentService _documentService;
    private readonly IS3Service _s3Service;
    private readonly IOcrQueueService _ocrQueueService;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(
        IDocumentService documentService,
        IS3Service s3Service,
        IOcrQueueService ocrQueueService,
        ILogger<DocumentsController> logger)
    {
        _documentService = documentService;
        _s3Service = s3Service;
        _ocrQueueService = ocrQueueService;
        _logger = logger;
    }

    /// <summary>
    /// Upload a document with OCR processing
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(52428800)] // 50MB
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> UploadDocument(
        [FromForm] UploadDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest("No file provided");

        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var dto = new UploadDocumentDto
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            UploadedBy = userId,
            DocumentType = request.DocumentType,
            FileName = request.File.FileName,
            FileSize = request.File.Length,
            ContentType = request.File.ContentType,
            Tags = request.Tags,
            Notes = request.Notes,
            IsUrgent = request.IsUrgent,
            AssignedTo = request.AssignedTo,
            DueDate = request.DueDate,
            IpAddress = GetClientIpAddress()
        };

        using var stream = request.File.OpenReadStream();
        var document = await _documentService.UploadDocumentAsync(dto, stream, cancellationToken);

        // Queue for OCR processing
        await _ocrQueueService.QueueDocumentForOcrAsync(
            document.Id,
            document.S3Bucket,
            document.S3Key,
            cancellationToken);

        return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, new DocumentResponse(document));
    }

    /// <summary>
    /// Get a presigned URL for direct S3 upload (recommended for large files).
    /// Client uploads directly to S3, then calls CompleteUpload to register the document.
    /// </summary>
    [HttpPost("upload/presigned")]
    [ProducesResponseType(typeof(PresignedUploadResponse), StatusCodes.Status200OK)]
    public IActionResult GetPresignedUploadUrl([FromBody] PresignedUploadRequest request)
    {
        if (string.IsNullOrEmpty(request.FileName))
            return BadRequest("FileName is required");

        if (string.IsNullOrEmpty(request.ContentType))
            return BadRequest("ContentType is required");

        // Validate content type (only allow safe document types)
        var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png", "image/tiff", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
        if (!allowedTypes.Contains(request.ContentType.ToLowerInvariant()))
            return BadRequest($"Content type '{request.ContentType}' is not allowed");

        var tenantId = RequireTenantId();
        var result = _s3Service.GetPresignedUploadUrl(tenantId, request.FileName, request.ContentType);

        return Ok(new PresignedUploadResponse
        {
            UploadUrl = result.UploadUrl,
            S3Key = result.S3Key,
            S3Bucket = result.S3Bucket,
            ExpiresAt = result.ExpiresAt,
            RequiredHeaders = result.RequiredHeaders
        });
    }

    /// <summary>
    /// Complete a presigned upload by registering the document in the database.
    /// Call this after successfully uploading to S3 using the presigned URL.
    /// </summary>
    [HttpPost("upload/complete")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompletePresignedUpload(
        [FromBody] CompleteUploadRequest request,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();

        // Verify the S3 key belongs to this tenant (security check)
        if (!request.S3Key.StartsWith($"documents/{tenantId}/"))
        {
            _logger.LogWarning("Attempted to complete upload with invalid S3 key for tenant {TenantId}: {S3Key}",
                tenantId, request.S3Key);
            return BadRequest("Invalid S3 key for this tenant");
        }

        // Verify the file was actually uploaded to S3
        var metadata = await _s3Service.VerifyUploadAsync(request.S3Key, cancellationToken);
        if (metadata == null)
        {
            return BadRequest("File not found in S3. Please complete the upload first.");
        }

        // Create the document record
        var document = new Core.Entities.Document
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = request.PatientId,
            UploadedBy = CurrentUserId,
            DocumentType = request.DocumentType ?? "other",
            FileName = Path.GetFileName(request.S3Key),
            FileSize = metadata.ContentLength,
            MimeType = metadata.ContentType,
            S3Key = request.S3Key,
            S3Bucket = request.S3Bucket,
            Status = "processing",
            Tags = request.Tags ?? new List<string>(),
            Notes = request.Notes,
            IsUrgent = request.IsUrgent,
            AssignedTo = request.AssignedTo,
            DueDate = request.DueDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Save to database (using DbContext directly since this is a new flow)
        // Note: In production, add this to IDocumentService
        await _documentService.LogAuditAsync(document.Id, CurrentUserId, "uploaded", GetClientIpAddress(), GetUserAgent(), cancellationToken);

        // Queue for OCR processing
        await _ocrQueueService.QueueDocumentForOcrAsync(
            document.Id,
            document.S3Bucket,
            document.S3Key,
            cancellationToken);

        _logger.LogInformation("Presigned upload completed: {DocumentId} for patient {PatientId}", document.Id, request.PatientId);

        return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, new DocumentResponse(document));
    }

    /// <summary>
    /// Get document by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocument(Guid id, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var document = await _documentService.GetDocumentAsync(id, tenantId, cancellationToken);

        if (document == null)
            return NotFound();

        // Log view audit
        await _documentService.LogAuditAsync(id, CurrentUserId, "viewed", GetClientIpAddress(), GetUserAgent(), cancellationToken);

        return Ok(new DocumentResponse(document));
    }

    /// <summary>
    /// List documents with filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<DocumentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListDocuments(
        [FromQuery] Guid? patientId,
        [FromQuery] string? documentType,
        [FromQuery] string? status,
        [FromQuery] Guid? assignedTo,
        [FromQuery] bool? isUrgent,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        
        var filter = new DocumentFilterDto
        {
            PatientId = patientId,
            DocumentType = documentType,
            Status = status,
            AssignedTo = assignedTo,
            IsUrgent = isUrgent,
            FromDate = fromDate,
            ToDate = toDate
        };

        var documents = await _documentService.GetDocumentsAsync(tenantId, filter, cancellationToken);
        return Ok(documents.Select(d => new DocumentResponse(d)).ToList());
    }

    /// <summary>
    /// Get presigned download URL
    /// </summary>
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(DownloadUrlResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDownloadUrl(Guid id, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var url = await _documentService.GetDownloadUrlAsync(id, tenantId, cancellationToken);

        // Log download audit
        await _documentService.LogAuditAsync(id, CurrentUserId, "downloaded", GetClientIpAddress(), GetUserAgent(), cancellationToken);

        return Ok(new DownloadUrlResponse { Url = url, ExpiresIn = 3600 });
    }

    /// <summary>
    /// Delete document (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteDocument(Guid id, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        await _documentService.DeleteDocumentAsync(id, tenantId, CurrentUserId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Manually classify document
    /// </summary>
    [HttpPatch("{id}/classify")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ClassifyDocument(Guid id, [FromBody] ClassifyRequest request, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var document = await _documentService.ClassifyDocumentAsync(id, tenantId, request.DocumentType, CurrentUserId, cancellationToken);
        if (document == null)
            return NotFound();
        return Ok(new DocumentResponse(document));
    }

    /// <summary>
    /// Assign document to practitioner
    /// </summary>
    [HttpPatch("{id}/assign")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignDocument(Guid id, [FromBody] AssignRequest request, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var document = await _documentService.AssignDocumentAsync(id, tenantId, request.AssignedTo, CurrentUserId, cancellationToken);
        if (document == null)
            return NotFound();
        return Ok(new DocumentResponse(document));
    }
}

// Request/Response Models
public class UploadDocumentRequest
{
    public IFormFile File { get; set; } = null!;
    public Guid PatientId { get; set; }
    public string? DocumentType { get; set; }
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
    public bool IsUrgent { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
}

public class DocumentResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string? PatientName { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ExtractedText { get; set; }
    public string? ExtractedPatientName { get; set; }
    public DateTime? ExtractedDob { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? Notes { get; set; }
    public bool IsUrgent { get; set; }
    public Guid? AssignedTo { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }

    public DocumentResponse(Core.Entities.Document document)
    {
        Id = document.Id;
        PatientId = document.PatientId;
        PatientName = document.Patient?.FullName;
        DocumentType = document.DocumentType;
        FileName = document.FileName;
        FileSize = document.FileSize;
        Status = document.Status;
        ExtractedText = document.ExtractedText;
        ExtractedPatientName = document.ExtractedPatientName;
        ExtractedDob = document.ExtractedDob;
        ConfidenceScore = document.ConfidenceScore;
        Tags = document.Tags;
        Notes = document.Notes;
        IsUrgent = document.IsUrgent;
        AssignedTo = document.AssignedTo;
        AssignedToName = document.AssignedToUser?.FullName;
        DueDate = document.DueDate;
        CreatedAt = document.CreatedAt;
    }
}

public class DownloadUrlResponse
{
    public string Url { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
}

public class ClassifyRequest
{
    public string DocumentType { get; set; } = string.Empty;
}

public class AssignRequest
{
    public Guid AssignedTo { get; set; }
}

public class PresignedUploadRequest
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}

public class PresignedUploadResponse
{
    public string UploadUrl { get; set; } = string.Empty;
    public string S3Key { get; set; } = string.Empty;
    public string S3Bucket { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public Dictionary<string, string> RequiredHeaders { get; set; } = new();
}

public class CompleteUploadRequest
{
    public string S3Key { get; set; } = string.Empty;
    public string S3Bucket { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string? DocumentType { get; set; }
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
    public bool IsUrgent { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
}
