using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class IntakeSubmission : TenantEntity
{
    public Guid EvaluationId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientEmail { get; set; } = string.Empty;
    public string? ConditionType { get; set; }
    public int PainLevel { get; set; }
    public string Severity { get; set; } = "low";
    public IntakeStatus Status { get; set; } = IntakeStatus.Pending;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public virtual Evaluation? Evaluation { get; set; }
}

public enum IntakeStatus
{
    Pending,
    Reviewing,
    Invited,      // Invitation sent, waiting for patient to register
    Registered,   // Patient created account
    Scheduled,    // Patient booked appointment
    Completed,
    Cancelled
}
