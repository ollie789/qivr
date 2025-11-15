using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Document : TenantEntity, IAuditable
{
    public Guid PatientId { get; set; }
    public Guid UploadedBy { get; set; }
    
    // File information
    public string DocumentType { get; set; } = string.Empty; // referral, consent, progress_note, lab_report, assessment, other
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string S3Key { get; set; } = string.Empty;
    public string S3Bucket { get; set; } = string.Empty;
    public string Status { get; set; } = "processing"; // processing, ready, failed, archived
    
    // OCR extracted data
    public string? ExtractedText { get; set; }
    public string? ExtractedPatientName { get; set; }
    public DateTime? ExtractedDob { get; set; }
    public Dictionary<string, object>? ExtractedIdentifiers { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public DateTime? OcrCompletedAt { get; set; }
    
    // Metadata
    public List<string> Tags { get; set; } = new();
    public string? Notes { get; set; }
    public bool IsUrgent { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    
    // Audit
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual User? UploadedByUser { get; set; }
    public virtual User? AssignedToUser { get; set; }
    public virtual ICollection<DocumentAuditLog> AuditLogs { get; set; } = new List<DocumentAuditLog>();
}

public class DocumentAuditLog
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty; // uploaded, viewed, downloaded, deleted, classified, assigned
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Document? Document { get; set; }
    public virtual User? User { get; set; }
}
