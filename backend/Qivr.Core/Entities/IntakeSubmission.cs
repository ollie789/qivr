using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class IntakeSubmission : TenantEntity
{
    public Guid? PatientId { get; set; }
    public Dictionary<string, object> FormData { get; set; } = new();
    public string? Status { get; set; } = "pending";
    public DateTime? SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public Guid? ProcessedBy { get; set; }
    public string? Notes { get; set; }
}
