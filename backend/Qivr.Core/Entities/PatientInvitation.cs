using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Represents an invitation sent to a patient to complete their registration
/// and book their first appointment.
/// </summary>
public class PatientInvitation : TenantEntity
{
    /// <summary>
    /// The user record created during intake (unverified at this point)
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Optional link to the evaluation/intake that triggered this invitation
    /// </summary>
    public Guid? EvaluationId { get; set; }

    /// <summary>
    /// Unique token for the invitation link
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Patient's email address for sending the invitation
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Patient's first name (for personalization)
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Patient's last name
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Current status of the invitation
    /// </summary>
    public PatientInvitationStatus Status { get; set; } = PatientInvitationStatus.Pending;

    /// <summary>
    /// When the invitation token expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// When the invitation was sent via email
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// When the patient accepted the invitation
    /// </summary>
    public DateTime? AcceptedAt { get; set; }

    /// <summary>
    /// When the invitation was revoked (if applicable)
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Number of times the invitation email was resent
    /// </summary>
    public int ResendCount { get; set; } = 0;

    /// <summary>
    /// When the last reminder was sent
    /// </summary>
    public DateTime? LastReminderAt { get; set; }

    /// <summary>
    /// ID of the clinic staff member who created/sent the invitation
    /// </summary>
    public Guid? CreatedBy { get; set; }

    /// <summary>
    /// Optional message included in the invitation email
    /// </summary>
    public string? PersonalMessage { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Evaluation? Evaluation { get; set; }
    public virtual User? CreatedByUser { get; set; }
}

public enum PatientInvitationStatus
{
    /// <summary>
    /// Invitation created but not yet sent
    /// </summary>
    Pending,

    /// <summary>
    /// Invitation email has been sent
    /// </summary>
    Sent,

    /// <summary>
    /// Patient has accepted and created their account
    /// </summary>
    Accepted,

    /// <summary>
    /// Invitation has expired (token no longer valid)
    /// </summary>
    Expired,

    /// <summary>
    /// Invitation was revoked by clinic staff
    /// </summary>
    Revoked
}
