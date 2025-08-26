using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Notification : TenantEntity
{
    public Guid RecipientId { get; set; }
    public Guid? SenderId { get; set; }
    public string Type { get; set; } = string.Empty; // appointment_reminder, prom_due, evaluation_complete, etc.
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public Dictionary<string, object>? Data { get; set; } // Additional metadata
    public DateTime? ScheduledFor { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    
    // Navigation properties
    public virtual User? Recipient { get; set; }
    public virtual User? Sender { get; set; }
}

public enum NotificationChannel
{
    Email,
    Sms,
    Push,
    InApp
}

public enum NotificationPriority
{
    Low,
    Normal,
    High,
    Urgent
}
