using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class PromResponse : TenantEntity
{
    public Guid PatientId { get; set; }
    public Guid PromInstanceId { get; set; }
    public Guid? AppointmentId { get; set; }
    public string PromType { get; set; } = string.Empty; // PHQ-9, GAD-7, etc.
    public DateTime CompletedAt { get; set; }
    public decimal Score { get; set; }
    public string Severity { get; set; } = string.Empty; // None, Mild, Moderate, Severe
    public Dictionary<string, object> Answers { get; set; } = new();
    public string? Notes { get; set; }
    
    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual PromInstance? PromInstance { get; set; }
    public virtual Appointment? Appointment { get; set; }
}
