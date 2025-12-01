using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Medical device in a partner's catalog (e.g., Medtronic Infuse Bone Graft)
/// </summary>
public class MedicalDevice : BaseEntity
{
    public Guid PartnerId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Manufacturer SKU or product code
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>
    /// Device category (e.g., "Spinal Implant", "Bone Graft", "Joint Replacement")
    /// </summary>
    [MaxLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// Body region (e.g., "Lumbar", "Cervical", "Knee")
    /// </summary>
    [MaxLength(100)]
    public string? BodyRegion { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Technical specifications of the device
    /// </summary>
    [MaxLength(4000)]
    public string? TechnicalSpecifications { get; set; }

    /// <summary>
    /// Global availability and regulatory status
    /// </summary>
    [MaxLength(2000)]
    public string? GlobalAvailability { get; set; }

    /// <summary>
    /// FDA UDI (Unique Device Identifier) if available
    /// </summary>
    [MaxLength(100)]
    public string? UdiCode { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ResearchPartner? Partner { get; set; }
    public virtual ICollection<PatientDeviceUsage> UsageRecords { get; set; } = new List<PatientDeviceUsage>();
}

/// <summary>
/// Record of a medical device used in a patient procedure
/// </summary>
public class PatientDeviceUsage : TenantEntity
{
    public Guid DeviceId { get; set; }
    public Guid PatientId { get; set; }

    /// <summary>
    /// Optional link to appointment where device was used
    /// </summary>
    public Guid? AppointmentId { get; set; }

    /// <summary>
    /// Optional link to treatment plan
    /// </summary>
    public Guid? TreatmentPlanId { get; set; }

    public DateTime ProcedureDate { get; set; }

    /// <summary>
    /// Type of procedure (e.g., "Lumbar Fusion L4-L5")
    /// </summary>
    [MaxLength(300)]
    public string? ProcedureType { get; set; }

    /// <summary>
    /// Specific implant location (e.g., "L4-L5", "C5-C6")
    /// </summary>
    [MaxLength(100)]
    public string? ImplantLocation { get; set; }

    /// <summary>
    /// Number of devices used (default 1)
    /// </summary>
    public int Quantity { get; set; } = 1;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Clinician who recorded the device usage
    /// </summary>
    public Guid RecordedBy { get; set; }

    // === Baseline PROM Scores for Outcome Tracking ===
    /// <summary>
    /// Baseline PROM instance ID captured at or near procedure time
    /// </summary>
    public Guid? BaselinePromInstanceId { get; set; }

    /// <summary>
    /// Baseline PROM score (e.g., ODI score before surgery)
    /// </summary>
    public decimal? BaselineScore { get; set; }

    /// <summary>
    /// PROM template key used for baseline (e.g., "ODI", "NDI", "PHQ-9")
    /// </summary>
    [MaxLength(50)]
    public string? BaselinePromType { get; set; }

    /// <summary>
    /// Date the baseline PROM was captured
    /// </summary>
    public DateTime? BaselineCapturedAt { get; set; }

    // Navigation properties
    public virtual MedicalDevice? Device { get; set; }
    public virtual User? Patient { get; set; }
    public virtual Appointment? Appointment { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
    public virtual User? RecordedByUser { get; set; }
    public virtual PromInstance? BaselinePromInstance { get; set; }
}
