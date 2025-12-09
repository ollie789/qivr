using System.ComponentModel.DataAnnotations;
using Qivr.Core.Entities;

namespace Qivr.Core.DTOs;

/// <summary>
/// Request to create and send a patient invitation
/// </summary>
public class CreatePatientInvitationRequest
{
    /// <summary>
    /// The intake submission ID (evaluation ID) to link the invitation
    /// </summary>
    public Guid? IntakeSubmissionId { get; set; }

    /// <summary>
    /// Patient's email address
    /// </summary>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(254, ErrorMessage = "Email cannot exceed 254 characters")]
    public string PatientEmail { get; set; } = string.Empty;

    /// <summary>
    /// Patient's full name
    /// </summary>
    [Required(ErrorMessage = "Patient name is required")]
    [MaxLength(200, ErrorMessage = "Patient name cannot exceed 200 characters")]
    public string PatientName { get; set; } = string.Empty;

    /// <summary>
    /// Patient's phone number (optional)
    /// </summary>
    [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string? PatientPhone { get; set; }

    /// <summary>
    /// Optional personal message to include in the invitation email
    /// </summary>
    [MaxLength(1000, ErrorMessage = "Personal message cannot exceed 1000 characters")]
    public string? PersonalMessage { get; set; }

    /// <summary>
    /// Number of days until the invitation expires (default: 7)
    /// </summary>
    [Range(1, 30, ErrorMessage = "Expiry days must be between 1 and 30")]
    public int ExpiryDays { get; set; } = 7;
}

/// <summary>
/// Response DTO for a patient invitation
/// </summary>
public class PatientInvitationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? EvaluationId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public int ResendCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }

    /// <summary>
    /// Whether the invitation can be resent (not accepted/revoked and not expired)
    /// </summary>
    public bool CanResend => Status != nameof(PatientInvitationStatus.Accepted)
                          && Status != nameof(PatientInvitationStatus.Revoked);

    /// <summary>
    /// Whether the invitation is still valid
    /// </summary>
    public bool IsValid => Status == nameof(PatientInvitationStatus.Sent)
                        && DateTime.UtcNow < ExpiresAt;
}

/// <summary>
/// Request to validate an invitation token (public endpoint)
/// </summary>
public class ValidateInvitationRequest
{
    [Required(ErrorMessage = "Token is required")]
    public string Token { get; set; } = string.Empty;
}

/// <summary>
/// Response for token validation (public endpoint)
/// </summary>
public class ValidateInvitationResponse
{
    public bool IsValid { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ClinicName { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request to accept an invitation and create account
/// </summary>
public class AcceptInvitationRequest
{
    [Required(ErrorMessage = "Token is required")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [MaxLength(128, ErrorMessage = "Password cannot exceed 128 characters")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare("Password", ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// Response after accepting an invitation
/// </summary>
public class AcceptInvitationResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public Guid? UserId { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public bool RequiresProfileCompletion { get; set; } = true;
}

/// <summary>
/// Query parameters for listing invitations
/// </summary>
public class ListInvitationsQuery
{
    [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1")]
    public int Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Filter by status
    /// </summary>
    public PatientInvitationStatus? Status { get; set; }

    /// <summary>
    /// Filter by email (partial match)
    /// </summary>
    [MaxLength(254)]
    public string? Email { get; set; }

    /// <summary>
    /// Filter by name (partial match on first or last name)
    /// </summary>
    [MaxLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// Include expired invitations (default: false)
    /// </summary>
    public bool IncludeExpired { get; set; } = false;
}

/// <summary>
/// Request to resend an invitation
/// </summary>
public class ResendInvitationRequest
{
    /// <summary>
    /// Updated personal message (optional)
    /// </summary>
    [MaxLength(1000, ErrorMessage = "Personal message cannot exceed 1000 characters")]
    public string? PersonalMessage { get; set; }

    /// <summary>
    /// Extend expiry by this many days from now (optional, default: use original expiry period)
    /// </summary>
    [Range(1, 30, ErrorMessage = "Expiry days must be between 1 and 30")]
    public int? ExtendExpiryDays { get; set; }
}
