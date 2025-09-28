namespace Qivr.Api.Models;

public class WaitlistRequest
{
    public Guid PatientId { get; set; } = Guid.Empty;
    public Guid? ProviderId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public List<DateTime>? PreferredDates { get; set; }
}
