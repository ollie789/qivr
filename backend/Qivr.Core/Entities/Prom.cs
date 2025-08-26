using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class PromTemplate : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty; // daily, weekly, monthly, etc.
    public List<Dictionary<string, object>> Questions { get; set; } = new();
    public Dictionary<string, object>? ScoringMethod { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual ICollection<PromInstance> Instances { get; set; } = new List<PromInstance>();
}

public class PromInstance : TenantEntity
{
    public Guid TemplateId { get; set; }
    public Guid PatientId { get; set; }
    public PromStatus Status { get; set; } = PromStatus.Pending;
    public DateTime ScheduledFor { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime DueDate { get; set; }
    public Dictionary<string, object>? Responses { get; set; }
    public decimal? Score { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    
    // Navigation properties
    public virtual PromTemplate? Template { get; set; }
    public virtual User? Patient { get; set; }
}

public enum PromStatus
{
    Pending,
    InProgress,
    Completed,
    Expired,
    Cancelled
}
