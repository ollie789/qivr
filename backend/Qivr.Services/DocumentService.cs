using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IDocumentService
{
    Task<Document> UploadDocumentAsync(UploadDocumentDto dto, Stream fileStream, CancellationToken cancellationToken = default);
    Task<Document?> GetDocumentAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<Document>> GetDocumentsAsync(Guid tenantId, DocumentFilterDto? filter = null, CancellationToken cancellationToken = default);
    Task<string> GetDownloadUrlAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
    Task DeleteDocumentAsync(Guid id, Guid tenantId, Guid userId, CancellationToken cancellationToken = default);
    Task<Document?> ClassifyDocumentAsync(Guid id, Guid tenantId, string documentType, Guid userId, CancellationToken cancellationToken = default);
    Task<Document?> AssignDocumentAsync(Guid id, Guid tenantId, Guid assignedTo, Guid userId, CancellationToken cancellationToken = default);
    Task LogAuditAsync(Guid documentId, Guid userId, string action, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);
}

public class DocumentService : IDocumentService
{
    private readonly QivrDbContext _context;
    private readonly IS3Service _s3Service;
    private readonly ITextractService _textractService;
    private readonly IResilientOcrService _resilientOcrService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(
        QivrDbContext context,
        IS3Service s3Service,
        ITextractService textractService,
        IResilientOcrService resilientOcrService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<DocumentService> logger)
    {
        _context = context;
        _s3Service = s3Service;
        _textractService = textractService;
        _resilientOcrService = resilientOcrService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<Document> UploadDocumentAsync(UploadDocumentDto dto, Stream fileStream, CancellationToken cancellationToken = default)
    {
        // Upload to S3
        var s3Key = await _s3Service.UploadFileAsync(fileStream, dto.FileName, dto.ContentType, cancellationToken);
        
        // Create document record
        var document = new Document
        {
            TenantId = dto.TenantId,
            PatientId = dto.PatientId,
            UploadedBy = dto.UploadedBy,
            DocumentType = dto.DocumentType ?? "other",
            FileName = dto.FileName,
            FileSize = dto.FileSize,
            MimeType = dto.ContentType,
            S3Key = s3Key,
            S3Bucket = "qivr-documents-prod", // TODO: Get from config
            Status = "processing",
            Tags = dto.Tags ?? new List<string>(),
            Notes = dto.Notes,
            IsUrgent = dto.IsUrgent,
            AssignedTo = dto.AssignedTo,
            DueDate = dto.DueDate
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        // Log audit
        await LogAuditAsync(document.Id, dto.UploadedBy, "uploaded", dto.IpAddress, null, cancellationToken);

        // Queue for resilient OCR processing (with retry support)
        var priority = dto.IsUrgent ? 10 : 0; // Higher priority for urgent documents
        await _resilientOcrService.QueueForOcrAsync(
            document.Id,
            dto.TenantId,
            document.S3Bucket,
            s3Key,
            priority,
            cancellationToken);

        _logger.LogInformation("Document uploaded: {DocumentId} for patient {PatientId}", document.Id, dto.PatientId);
        return document;
    }

    public async Task<Document?> GetDocumentAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Documents
            .Include(d => d.Patient)
            .Include(d => d.UploadedByUser)
            .Include(d => d.AssignedToUser)
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && d.DeletedAt == null, cancellationToken);
    }

    public async Task<List<Document>> GetDocumentsAsync(Guid tenantId, DocumentFilterDto? filter = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Documents
            .Include(d => d.Patient)
            .Include(d => d.UploadedByUser)
            .Include(d => d.AssignedToUser)
            .Where(d => d.TenantId == tenantId && d.DeletedAt == null);

        if (filter != null)
        {
            if (filter.PatientId.HasValue)
                query = query.Where(d => d.PatientId == filter.PatientId.Value);
            
            if (!string.IsNullOrEmpty(filter.DocumentType))
                query = query.Where(d => d.DocumentType == filter.DocumentType);
            
            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(d => d.Status == filter.Status);
            
            if (filter.AssignedTo.HasValue)
                query = query.Where(d => d.AssignedTo == filter.AssignedTo.Value);
            
            if (filter.IsUrgent.HasValue)
                query = query.Where(d => d.IsUrgent == filter.IsUrgent.Value);
            
            if (filter.FromDate.HasValue)
                query = query.Where(d => d.CreatedAt >= filter.FromDate.Value);
            
            if (filter.ToDate.HasValue)
                query = query.Where(d => d.CreatedAt <= filter.ToDate.Value);
        }

        return await query.OrderByDescending(d => d.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task<string> GetDownloadUrlAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var document = await GetDocumentAsync(id, tenantId, cancellationToken);
        if (document == null)
            throw new Exception("Document not found");

        return await _s3Service.GetPresignedDownloadUrlAsync(document.S3Key);
    }

    public async Task DeleteDocumentAsync(Guid id, Guid tenantId, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await GetDocumentAsync(id, tenantId, cancellationToken);
        if (document == null)
            throw new Exception("Document not found");

        document.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        
        await LogAuditAsync(id, userId, "deleted", cancellationToken: cancellationToken);
        
        _logger.LogInformation("Document soft deleted: {DocumentId}", id);
    }

    public async Task<Document?> ClassifyDocumentAsync(Guid id, Guid tenantId, string documentType, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && d.DeletedAt == null, cancellationToken);

        if (document == null)
            return null;

        document.DocumentType = documentType;
        await _context.SaveChangesAsync(cancellationToken);

        await LogAuditAsync(id, userId, "classified", cancellationToken: cancellationToken);

        return document;
    }

    public async Task<Document?> AssignDocumentAsync(Guid id, Guid tenantId, Guid assignedTo, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && d.DeletedAt == null, cancellationToken);

        if (document == null)
            return null;

        document.AssignedTo = assignedTo;
        await _context.SaveChangesAsync(cancellationToken);

        await LogAuditAsync(id, userId, "assigned", cancellationToken: cancellationToken);

        return document;
    }

    public async Task LogAuditAsync(Guid documentId, Guid userId, string action, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        var auditLog = new DocumentAuditLog
        {
            DocumentId = documentId,
            UserId = userId,
            Action = action,
            IpAddress = ipAddress ?? GetClientIp(httpContext),
            UserAgent = userAgent ?? httpContext?.Request.Headers["User-Agent"].FirstOrDefault(),
            CorrelationId = httpContext?.TraceIdentifier
        };

        _context.DocumentAuditLogs.Add(auditLog);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string? GetClientIp(HttpContext? context)
    {
        if (context == null) return null;

        // Check for forwarded header (load balancer/proxy)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }
}

// DTOs
public class UploadDocumentDto
{
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public Guid UploadedBy { get; set; }
    public string? DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
    public bool IsUrgent { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public string? IpAddress { get; set; }
}

public class DocumentFilterDto
{
    public Guid? PatientId { get; set; }
    public string? DocumentType { get; set; }
    public string? Status { get; set; }
    public Guid? AssignedTo { get; set; }
    public bool? IsUrgent { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
