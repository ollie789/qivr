using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Evaluation : TenantEntity
{
    public Guid PatientId { get; set; }
    public string EvaluationNumber { get; set; } = string.Empty;
    public string? ChiefComplaint { get; set; }
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
    
    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual User? Reviewer { get; set; }
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
    
    // Navigation property
    public virtual Evaluation? Evaluation { get; set; }
}

public class PainCoordinates
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}
