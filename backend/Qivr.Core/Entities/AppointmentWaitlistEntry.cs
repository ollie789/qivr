using System;
using System.Collections.Generic;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class AppointmentWaitlistEntry : TenantEntity, IAuditable
{
    public Guid PatientId { get; set; }
    public Guid? ProviderId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public List<DateTime> PreferredDates { get; set; } = new();
    public WaitlistStatus Status { get; set; } = WaitlistStatus.Requested;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime? FulfilledAt { get; set; }
    public Guid? MatchedAppointmentId { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();

    public virtual User? Patient { get; set; }
    public virtual User? Provider { get; set; }
    public virtual Appointment? MatchedAppointment { get; set; }
}

public enum WaitlistStatus
{
    Requested,
    Notified,
    Booked,
    Cancelled
}
