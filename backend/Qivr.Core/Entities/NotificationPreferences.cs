using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class NotificationPreferences : TenantEntity
{
    public Guid UserId { get; set; }
    
    // Channel preferences
    public bool EmailEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public bool InAppEnabled { get; set; } = true;
    
    // Type preferences
    public bool AppointmentReminders { get; set; } = true;
    public bool PromReminders { get; set; } = true;
    public bool EvaluationNotifications { get; set; } = true;
    public bool ClinicAnnouncements { get; set; } = true;
    public bool SystemNotifications { get; set; } = true;
    
    // Timing preferences
    public int ReminderHoursBefore { get; set; } = 24; // Default 24 hours before
    public string PreferredTimeZone { get; set; } = "UTC";
    public int? QuietHoursStart { get; set; } // e.g., 22 for 10 PM
    public int? QuietHoursEnd { get; set; } // e.g., 8 for 8 AM
    
    // Navigation properties
    public virtual User? User { get; set; }
}
