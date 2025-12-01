using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Research partner organization (e.g., Medtronic) that tracks device outcomes
/// </summary>
public class ResearchPartner : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? ContactEmail { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Separate Cognito user pool for partner users (optional)
    /// </summary>
    [MaxLength(100)]
    public string? CognitoUserPoolId { get; set; }

    /// <summary>
    /// Hashed API key for simple partner authentication
    /// </summary>
    [MaxLength(128)]
    public string? ApiKeyHash { get; set; }

    // Navigation properties
    public virtual ICollection<PartnerClinicAffiliation> ClinicAffiliations { get; set; } = new List<PartnerClinicAffiliation>();
    public virtual ICollection<MedicalDevice> Devices { get; set; } = new List<MedicalDevice>();
    public virtual ICollection<ResearchStudy> Studies { get; set; } = new List<ResearchStudy>();
}

/// <summary>
/// Affiliation between a research partner and a clinic (tenant)
/// </summary>
public class PartnerClinicAffiliation : BaseEntity
{
    public Guid PartnerId { get; set; }
    public Guid TenantId { get; set; }

    public AffiliationStatus Status { get; set; } = AffiliationStatus.Pending;
    public DataSharingLevel DataSharingLevel { get; set; } = DataSharingLevel.Aggregated;

    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedBy { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual ResearchPartner? Partner { get; set; }
    public virtual Tenant? Tenant { get; set; }
    public virtual User? ApprovedByUser { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AffiliationStatus
{
    Pending,
    Active,
    Revoked,
    Suspended
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DataSharingLevel
{
    /// <summary>
    /// Only aggregated/anonymized statistics (K-anonymity enforced)
    /// </summary>
    Aggregated,

    /// <summary>
    /// De-identified patient-level data without direct identifiers
    /// </summary>
    Detailed,

    /// <summary>
    /// Full de-identified data including all available fields
    /// </summary>
    Full
}

/// <summary>
/// Research study managed by a partner
/// </summary>
public class ResearchStudy : BaseEntity
{
    public Guid PartnerId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// IRB protocol number
    /// </summary>
    [MaxLength(100)]
    public string? ProtocolId { get; set; }

    public StudyStatus Status { get; set; } = StudyStatus.Draft;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// JSON inclusion criteria for patient selection
    /// </summary>
    public Dictionary<string, object>? InclusionCriteria { get; set; }

    /// <summary>
    /// JSON exclusion criteria for patient selection
    /// </summary>
    public Dictionary<string, object>? ExclusionCriteria { get; set; }

    public int TargetEnrollment { get; set; }

    // Navigation properties
    public virtual ResearchPartner? Partner { get; set; }
    public virtual ICollection<StudyEnrollment> Enrollments { get; set; } = new List<StudyEnrollment>();
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StudyStatus
{
    Draft,
    Active,
    Paused,
    Completed,
    Archived
}

/// <summary>
/// Patient enrollment in a research study
/// </summary>
public class StudyEnrollment : TenantEntity
{
    public Guid StudyId { get; set; }
    public Guid PatientId { get; set; }

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Enrolled;

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? WithdrawnAt { get; set; }

    [MaxLength(50)]
    public string? ConsentVersion { get; set; }

    public bool BaselineCompleted { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual ResearchStudy? Study { get; set; }
    public virtual User? Patient { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EnrollmentStatus
{
    Enrolled,
    Withdrawn,
    Completed
}
