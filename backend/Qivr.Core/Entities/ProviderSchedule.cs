using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Represents a provider's recurring weekly schedule (working hours)
/// </summary>
public class ProviderSchedule : TenantEntity
{
    [Required]
    public Guid ProviderId { get; set; }
    public virtual Provider? Provider { get; set; }

    /// <summary>
    /// Day of the week (0 = Sunday, 6 = Saturday)
    /// </summary>
    [Required]
    public DayOfWeek DayOfWeek { get; set; }

    /// <summary>
    /// Whether the provider works on this day
    /// </summary>
    public bool IsWorkingDay { get; set; } = true;

    /// <summary>
    /// Start time of the work day (e.g., "09:00")
    /// </summary>
    [MaxLength(5)]
    public string? StartTime { get; set; } = "09:00";

    /// <summary>
    /// End time of the work day (e.g., "17:00")
    /// </summary>
    [MaxLength(5)]
    public string? EndTime { get; set; } = "17:00";

    /// <summary>
    /// Break/lunch start time (optional)
    /// </summary>
    [MaxLength(5)]
    public string? BreakStartTime { get; set; }

    /// <summary>
    /// Break/lunch end time (optional)
    /// </summary>
    [MaxLength(5)]
    public string? BreakEndTime { get; set; }

    /// <summary>
    /// Location where the provider works on this day (optional)
    /// </summary>
    public Guid? LocationId { get; set; }

    /// <summary>
    /// Default appointment duration in minutes for this day
    /// </summary>
    public int DefaultSlotDurationMinutes { get; set; } = 30;

    /// <summary>
    /// Buffer time in minutes between appointments
    /// </summary>
    public int BufferMinutes { get; set; } = 0;

    /// <summary>
    /// Whether the provider accepts telehealth appointments on this day
    /// </summary>
    public bool AllowsTelehealth { get; set; } = true;

    /// <summary>
    /// Whether the provider accepts in-person appointments on this day
    /// </summary>
    public bool AllowsInPerson { get; set; } = true;

    /// <summary>
    /// Maximum number of appointments allowed on this day (0 = unlimited)
    /// </summary>
    public int MaxAppointmentsPerDay { get; set; } = 0;

    // Helper methods
    public TimeSpan? GetStartTimeSpan() => ParseTimeString(StartTime);
    public TimeSpan? GetEndTimeSpan() => ParseTimeString(EndTime);
    public TimeSpan? GetBreakStartTimeSpan() => ParseTimeString(BreakStartTime);
    public TimeSpan? GetBreakEndTimeSpan() => ParseTimeString(BreakEndTime);

    private static TimeSpan? ParseTimeString(string? timeString)
    {
        if (string.IsNullOrEmpty(timeString)) return null;
        return TimeSpan.TryParse(timeString, out var result) ? result : null;
    }
}

/// <summary>
/// Represents a provider's time off (vacation, sick leave, blocked time)
/// </summary>
public class ProviderTimeOff : TenantEntity
{
    [Required]
    public Guid ProviderId { get; set; }
    public virtual Provider? Provider { get; set; }

    /// <summary>
    /// Start date/time of the time off period
    /// </summary>
    [Required]
    public DateTime StartDateTime { get; set; }

    /// <summary>
    /// End date/time of the time off period
    /// </summary>
    [Required]
    public DateTime EndDateTime { get; set; }

    /// <summary>
    /// Whether this is an all-day event
    /// </summary>
    public bool IsAllDay { get; set; } = true;

    /// <summary>
    /// Type of time off
    /// </summary>
    public TimeOffType Type { get; set; } = TimeOffType.Vacation;

    /// <summary>
    /// Reason or notes for the time off
    /// </summary>
    [MaxLength(500)]
    public string? Reason { get; set; }

    /// <summary>
    /// Whether the time off is approved
    /// </summary>
    public bool IsApproved { get; set; } = true;

    /// <summary>
    /// ID of the user who approved the time off
    /// </summary>
    public Guid? ApprovedBy { get; set; }

    /// <summary>
    /// Date/time when the time off was approved
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// Whether this is a recurring time off (e.g., every Monday afternoon)
    /// </summary>
    public bool IsRecurring { get; set; } = false;

    /// <summary>
    /// Recurrence pattern (if recurring): Daily, Weekly, Monthly
    /// </summary>
    public RecurrencePattern? RecurrencePattern { get; set; }

    /// <summary>
    /// End date for recurring time off (null = no end)
    /// </summary>
    public DateTime? RecurrenceEndDate { get; set; }
}

public enum TimeOffType
{
    Vacation,
    SickLeave,
    PersonalDay,
    Training,
    Conference,
    AdminTime,
    BlockedTime,
    Holiday,
    Other
}

public enum RecurrencePattern
{
    Daily,
    Weekly,
    BiWeekly,
    Monthly
}

/// <summary>
/// Represents a special schedule override for a specific date
/// (e.g., working different hours on a particular day)
/// </summary>
public class ProviderScheduleOverride : TenantEntity
{
    [Required]
    public Guid ProviderId { get; set; }
    public virtual Provider? Provider { get; set; }

    /// <summary>
    /// The specific date this override applies to
    /// </summary>
    [Required]
    public DateTime Date { get; set; }

    /// <summary>
    /// Whether the provider is working on this specific date
    /// </summary>
    public bool IsWorkingDay { get; set; } = true;

    /// <summary>
    /// Start time for this specific date
    /// </summary>
    [MaxLength(5)]
    public string? StartTime { get; set; }

    /// <summary>
    /// End time for this specific date
    /// </summary>
    [MaxLength(5)]
    public string? EndTime { get; set; }

    /// <summary>
    /// Reason for the schedule override
    /// </summary>
    [MaxLength(500)]
    public string? Reason { get; set; }

    // Helper methods
    public TimeSpan? GetStartTimeSpan() => ParseTimeString(StartTime);
    public TimeSpan? GetEndTimeSpan() => ParseTimeString(EndTime);

    private static TimeSpan? ParseTimeString(string? timeString)
    {
        if (string.IsNullOrEmpty(timeString)) return null;
        return TimeSpan.TryParse(timeString, out var result) ? result : null;
    }
}
