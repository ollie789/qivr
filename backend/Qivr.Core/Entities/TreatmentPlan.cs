using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public enum TreatmentPlanStatus
{
    Draft,
    Active,
    Completed,
    Cancelled,
    OnHold
}

public class TreatmentPlan : DeletableEntity
{
    [Required]
    public Guid PatientId { get; set; }
    public virtual User? Patient { get; set; }

    [Required]
    public Guid ProviderId { get; set; }
    public virtual User? Provider { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Diagnosis { get; set; }
    public string? Goals { get; set; }
    
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int DurationWeeks { get; set; }
    
    public TreatmentPlanStatus Status { get; set; } = TreatmentPlanStatus.Draft;
    
    public List<TreatmentSession> Sessions { get; set; } = new();
    public List<Exercise> Exercises { get; set; } = new();
    
    public string? Notes { get; set; }
    public DateTime? ReviewDate { get; set; }
}

public class TreatmentSession
{
    public int SessionNumber { get; set; }
    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string? Focus { get; set; }
    public string? Notes { get; set; }
    public bool Completed { get; set; }
}

public class Exercise
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Sets { get; set; }
    public int Reps { get; set; }
    public string? Frequency { get; set; }
    public string? VideoUrl { get; set; }
    public bool Completed { get; set; }
}
