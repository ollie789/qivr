using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Appointment : TenantEntity
{
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid ProviderProfileId { get; set; }
    public Guid? ClinicId { get; set; }  // Added ClinicId
    public Guid? EvaluationId { get; set; }
    public Guid? TreatmentPlanId { get; set; }
    public string? ExternalCalendarId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public Guid? ServiceTypeId { get; set; } // Links to service_types for pricing
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Requested;
    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }
    public DateTime ScheduledAt => ScheduledStart;  // Added alias for backward compatibility
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public LocationType LocationType { get; set; } = LocationType.InPerson;
    public Dictionary<string, object> LocationDetails { get; set; } = new();
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public Guid? CancelledBy { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    
    // Payment tracking
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAt { get; set; }
    public string? PaymentMethod { get; set; } // Cash, Card, Insurance, etc.
    public string? PaymentReference { get; set; } // Receipt number or reference
    public decimal? PaymentAmount { get; set; }
    public string? PaymentNotes { get; set; }
    
    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual User? Provider { get; set; }
    public virtual Provider? ProviderProfile { get; set; }
    public virtual Evaluation? Evaluation { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
    public virtual User? CancelledByUser { get; set; }
    public virtual ServiceType? ServiceType { get; set; }
    
    public TimeSpan Duration => ScheduledEnd - ScheduledStart;
    public bool IsUpcoming => ScheduledStart > DateTime.UtcNow && Status == AppointmentStatus.Scheduled;
    
    // Helper property for Location string
    public string? Location => LocationType == LocationType.InPerson 
        ? LocationDetails?.GetValueOrDefault("address")?.ToString() 
        : "Telehealth";
}

public enum AppointmentStatus
{
    Requested,
    Scheduled,
    Confirmed,
    CheckedIn,
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
