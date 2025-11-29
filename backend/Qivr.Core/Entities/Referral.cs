using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Referral : TenantEntity
{
    public Guid PatientId { get; set; }
    public Guid ReferringProviderId { get; set; }

    // Referral details
    public ReferralType Type { get; set; } = ReferralType.Specialist;
    public string Specialty { get; set; } = string.Empty; // e.g., "Radiology", "Orthopedics", "Physiotherapy"
    public string? SpecificService { get; set; } // e.g., "MRI Lumbar Spine", "X-Ray Chest"
    public ReferralPriority Priority { get; set; } = ReferralPriority.Routine;
    public ReferralStatus Status { get; set; } = ReferralStatus.Draft;

    // Destination
    public string? ExternalProviderName { get; set; } // Name of external specialist/clinic
    public string? ExternalProviderPhone { get; set; }
    public string? ExternalProviderEmail { get; set; }
    public string? ExternalProviderAddress { get; set; }
    public string? ExternalProviderFax { get; set; }

    // Clinical information
    public string? ReasonForReferral { get; set; }
    public string? ClinicalHistory { get; set; }
    public string? CurrentMedications { get; set; }
    public string? Allergies { get; set; }
    public string? RelevantTestResults { get; set; }
    public string? SpecificQuestions { get; set; } // Questions for the specialist

    // Dates and tracking
    public DateTime? ReferralDate { get; set; }
    public DateTime? ExpiryDate { get; set; } // When the referral expires
    public DateTime? SentAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Response from external provider
    public string? ResponseNotes { get; set; }
    public DateTime? AppointmentDate { get; set; }
    public string? AppointmentLocation { get; set; }

    // Linked documents
    public Guid? ReferralDocumentId { get; set; } // The generated/uploaded referral letter
    public Guid? ResponseDocumentId { get; set; } // Report from specialist

    // Internal tracking
    public string? InternalNotes { get; set; }
    public bool PatientNotified { get; set; }
    public DateTime? PatientNotifiedAt { get; set; }
    public bool RequiresFollowUp { get; set; }
    public DateTime? FollowUpDate { get; set; }

    // Cancellation
    public string? CancellationReason { get; set; }
    public Guid? CancelledBy { get; set; }

    // Soft delete
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual User? ReferringProvider { get; set; }
    public virtual Document? ReferralDocument { get; set; }
    public virtual Document? ResponseDocument { get; set; }
    public virtual User? CancelledByUser { get; set; }
}

public enum ReferralType
{
    Specialist,      // To a medical specialist
    Imaging,         // X-Ray, MRI, CT, Ultrasound
    Laboratory,      // Blood tests, pathology
    Therapy,         // Physiotherapy, OT, Speech
    Hospital,        // Hospital admission/procedure
    EmergencyDept,   // ED referral
    AlliedHealth,    // Podiatry, Dietitian, Psychology
    Other
}

public enum ReferralPriority
{
    Routine,         // Standard timeframe
    SemiUrgent,      // Within 2-4 weeks
    Urgent,          // Within 1 week
    Emergency        // Immediate/same day
}

public enum ReferralStatus
{
    Draft,           // Being prepared
    PendingApproval, // Awaiting internal approval
    Sent,            // Sent to external provider
    Acknowledged,    // External provider acknowledged receipt
    Scheduled,       // Appointment scheduled with specialist
    Completed,       // Appointment completed, awaiting results
    ResultsReceived, // Results/report received
    Closed,          // Fully processed and closed
    Cancelled,       // Cancelled
    Expired          // Referral expired without action
}
