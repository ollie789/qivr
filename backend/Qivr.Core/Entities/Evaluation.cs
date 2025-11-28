using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Evaluation : TenantEntity
{
    public Guid PatientId { get; set; }
    public string EvaluationNumber { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string ChiefComplaint { get; set; } = string.Empty;
    
    public List<string> Symptoms { get; set; } = new();
    public Dictionary<string, object> MedicalHistory { get; set; } = new();
    public Dictionary<string, object> QuestionnaireResponses { get; set; } = new();
    public string? AiSummary { get; set; }
    public List<string> AiRiskFlags { get; set; } = new();
    public DateTime? AiProcessedAt { get; set; }
    public string? ClinicianNotes { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public EvaluationStatus Status { get; set; } = EvaluationStatus.Pending;
    public UrgencyLevel? Urgency { get; set; }
    public Guid? MedicalRecordId { get; set; }
    
    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual User? Reviewer { get; set; }
    public virtual MedicalRecord? MedicalRecord { get; set; }
    public virtual ICollection<PainMap> PainMaps { get; set; } = new List<PainMap>();
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public enum EvaluationStatus
{
    Pending,
    Reviewed,
    Triaged,
    Archived
}

public enum UrgencyLevel
{
    Low,
    Medium,
    Moderate, // Database has 'moderate' values
    High,
    Urgent
}

public class PainMap : TenantEntity
{
    public Guid EvaluationId { get; set; }
    public string BodyRegion { get; set; } = string.Empty;
    public string? AnatomicalCode { get; set; } // SNOMED CT or similar
    public PainCoordinates Coordinates { get; set; } = new();
    public int PainIntensity { get; set; } // 0-10
    public string? PainType { get; set; }
    public List<string> PainQuality { get; set; } = new();
    public DateTime? OnsetDate { get; set; }
    public string? Notes { get; set; }
    
    // Phase 1: Drawing support fields (stored as JSON)
    public string? AvatarType { get; set; } // male, female, child
    public string? BodySubdivision { get; set; } // simple, dermatome, myotome
    public string? ViewOrientation { get; set; } // front, back, side + zoom state
    public string? DepthIndicator { get; set; } // superficial, deep
    public string? SubmissionSource { get; set; } // portal, mobile, no-login, clinic
    public string? DrawingDataJson { get; set; } // JSON: paths, annotations, heatmap
    
    // Navigation property
    public virtual Evaluation? Evaluation { get; set; }
}

public class PainCoordinates
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}
