using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Document : TenantEntity
{
    
    [Required]
    public Guid PatientId { get; set; }
    public virtual User Patient { get; set; }
    
    public Guid? UploadedBy { get; set; } // User ID who uploaded
    
    [Required]
    [StringLength(255)]
    public string FileName { get; set; }
    
    [Required]
    [StringLength(100)]
    public string DocumentType { get; set; } // e.g., "Lab Report", "Insurance Card", "Prescription"
    
    [StringLength(50)]
    public string ContentType { get; set; } // MIME type
    
    public long FileSizeBytes { get; set; }
    
    [Required]
    public string StoragePath { get; set; } // Local path or S3 key
    
    [StringLength(500)]
    public string Description { get; set; }
    
    public bool IsArchived { get; set; } = false;
    
    // UploadedAt is inherited from BaseEntity as CreatedAt
    
    public DateTime? ArchivedAt { get; set; }
    
    // For sensitive documents
    public bool IsConfidential { get; set; } = false;
    
    // For documents that need review
    public bool RequiresReview { get; set; } = false;
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedBy { get; set; }
    
    // Metadata
    public string Tags { get; set; } // JSON array of tags
    public string Metadata { get; set; } // JSON object for additional metadata
}

public enum DocumentType
{
    LabReport,
    ImagingResult,
    InsuranceCard,
    Prescription,
    Referral,
    ConsentForm,
    MedicalHistory,
    VaccinationRecord,
    Other
}

