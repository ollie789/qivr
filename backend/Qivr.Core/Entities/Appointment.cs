using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Appointment : TenantEntity
{
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid? EvaluationId { get; set; }
    public string? ExternalCalendarId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Requested;
    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public LocationType LocationType { get; set; } = LocationType.InPerson;
    public Dictionary<string, object> LocationDetails { get; set; } = new();
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public Guid? CancelledBy { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    
    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual User? Provider { get; set; }
    public virtual Evaluation? Evaluation { get; set; }
    public virtual User? CancelledByUser { get; set; }
    
    public TimeSpan Duration => ScheduledEnd - ScheduledStart;
    public bool IsUpcoming => ScheduledStart > DateTime.UtcNow && Status == AppointmentStatus.Scheduled;
}

public enum AppointmentStatus
{
    Requested,
    Scheduled,
    Confirmed,
    Completed,
    Cancelled,
    NoShow
}

public enum LocationType
{
    InPerson,
    Telehealth
}

public class BrandTheme : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? AccentColor { get; set; }
    public Dictionary<string, object> Typography { get; set; } = new();
    public string? CustomCss { get; set; }
    public Dictionary<string, object> WidgetConfig { get; set; } = new();
    
    // Navigation property
    public virtual Tenant? Tenant { get; set; }
}
