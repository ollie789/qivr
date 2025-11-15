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
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(IDocumentService documentService, ILogger<DocumentsController> logger)
    {
        _documentService = documentService;
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
        await _documentService.LogAuditAsync(id, CurrentUserId, "viewed", GetClientIpAddress(), cancellationToken);

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
        await _documentService.LogAuditAsync(id, CurrentUserId, "downloaded", GetClientIpAddress(), cancellationToken);

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
        var document = await _documentService.ClassifyDocumentAsync(id, request.DocumentType, CurrentUserId, cancellationToken);
        return Ok(new DocumentResponse(document));
    }

    /// <summary>
    /// Assign document to practitioner
    /// </summary>
    [HttpPatch("{id}/assign")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignDocument(Guid id, [FromBody] AssignRequest request, CancellationToken cancellationToken)
    {
        var document = await _documentService.AssignDocumentAsync(id, request.AssignedTo, CurrentUserId, cancellationToken);
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
