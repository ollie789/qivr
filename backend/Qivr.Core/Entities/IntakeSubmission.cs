using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class IntakeSubmission : TenantEntity
{
    public Guid? PatientId { get; set; }
    public Guid? EvaluationId { get; set; }
    public string? PatientName { get; set; }
    public string? PatientEmail { get; set; }
    public string? ConditionType { get; set; }
    public int PainLevel { get; set; }
    public string? Severity { get; set; }
    public Dictionary<string, object> FormData { get; set; } = new();
    public IntakeStatus Status { get; set; } = IntakeStatus.Pending;
    public DateTime? SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public Guid? ProcessedBy { get; set; }
    public string? Notes { get; set; }
    
    // Navigation
    public Evaluation? Evaluation { get; set; }
}

public enum IntakeStatus
{
    Pending,
    Invited,
    Registered,
    InProgress,
    Completed,
    Cancelled
}
