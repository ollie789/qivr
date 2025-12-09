using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Exceptions;
using Qivr.Api.Services;
using Qivr.Core.DTOs;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Security.Cryptography;

namespace Qivr.Api.Controllers;

/// <summary>
/// Controller for managing patient invitations during the onboarding process
/// </summary>
[Route("api/patient-invitations")]
[EnableRateLimiting("api")]
public class PatientInvitationsController : BaseApiController
{
    private readonly QivrDbContext _context;
    private readonly IModernEmailService _emailService;
    private readonly ILogger<PatientInvitationsController> _logger;
    private readonly IConfiguration _configuration;

    public PatientInvitationsController(
        QivrDbContext context,
        IModernEmailService emailService,
        ILogger<PatientInvitationsController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Create and send a patient invitation
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Provider,admin,provider")]
    public async Task<IActionResult> CreateInvitation([FromBody] CreatePatientInvitationRequest request)
    {
        ValidateModel();
        var tenantId = RequireTenantId();

        // Parse the patient name into first/last
        var nameParts = (request.PatientName ?? "").Trim().Split(' ', 2);
        var firstName = nameParts.Length > 0 ? nameParts[0] : "";
        var lastName = nameParts.Length > 1 ? nameParts[1] : "";

        // Check for existing pending invitation by email
        var existingInvitation = await _context.PatientInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Email == request.PatientEmail
                && i.TenantId == tenantId
                && (i.Status == PatientInvitationStatus.Pending || i.Status == PatientInvitationStatus.Sent));

        if (existingInvitation != null)
        {
            throw new ValidationException("An active invitation already exists for this patient. Please resend or revoke it first.");
        }

        // Look up or create the user from evaluation/intake
        Guid? evaluationId = null;
        User? user = null;

        if (request.IntakeSubmissionId.HasValue)
        {
            // First check if this is an IntakeSubmission ID or Evaluation ID
            var intake = await _context.IntakeSubmissions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == request.IntakeSubmissionId && i.TenantId == tenantId);

            if (intake != null)
            {
                evaluationId = intake.EvaluationId;
            }
            else
            {
                // Try as evaluation ID directly
                var evaluation = await _context.Evaluations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(e => e.Id == request.IntakeSubmissionId && e.TenantId == tenantId);

                if (evaluation != null)
                {
                    evaluationId = evaluation.Id;
                }
            }
        }

        // Find existing user by email or create placeholder
        user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.PatientEmail && u.TenantId == tenantId);

        if (user == null)
        {
            // Create a placeholder user for the invitation
            user = new User
            {
                TenantId = tenantId,
                Email = request.PatientEmail,
                FirstName = firstName,
                LastName = lastName,
                Phone = request.PatientPhone,
                UserType = UserType.Patient,
                EmailVerified = false
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        // Generate secure token
        var token = GenerateSecureToken();

        var invitation = new PatientInvitation
        {
            TenantId = tenantId,
            UserId = user.Id,
            EvaluationId = evaluationId,
            Token = token,
            Email = request.PatientEmail,
            FirstName = firstName,
            LastName = lastName,
            Status = PatientInvitationStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(request.ExpiryDays),
            CreatedBy = CurrentUserId,
            PersonalMessage = request.PersonalMessage
        };

        _context.PatientInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        // Send the invitation email
        await SendInvitationEmailAsync(invitation, tenantId);

        // Update status to Sent
        invitation.Status = PatientInvitationStatus.Sent;
        invitation.SentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Update intake submission status if linked
        if (request.IntakeSubmissionId.HasValue)
        {
            var intake = await _context.IntakeSubmissions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == request.IntakeSubmissionId && i.TenantId == tenantId);

            if (intake != null)
            {
                intake.Status = IntakeStatus.Invited;
                await _context.SaveChangesAsync();
            }
        }

        _logger.LogInformation("Patient invitation created and sent: {InvitationId} for email {Email}",
            invitation.Id, invitation.Email);

        return Created($"/api/patient-invitations/{invitation.Id}", MapToDto(invitation));
    }

    /// <summary>
    /// List all invitations for the current tenant
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Provider,admin,provider")]
    public async Task<IActionResult> ListInvitations([FromQuery] ListInvitationsQuery query)
    {
        var tenantId = RequireTenantId();

        var invitationsQuery = _context.PatientInvitations
            .IgnoreQueryFilters()
            .Where(i => i.TenantId == tenantId);

        // Apply filters
        if (query.Status.HasValue)
        {
            invitationsQuery = invitationsQuery.Where(i => i.Status == query.Status.Value);
        }

        if (!query.IncludeExpired)
        {
            invitationsQuery = invitationsQuery.Where(i =>
                i.Status != PatientInvitationStatus.Expired &&
                (i.ExpiresAt > DateTime.UtcNow || i.Status == PatientInvitationStatus.Accepted));
        }

        if (!string.IsNullOrWhiteSpace(query.Email))
        {
            invitationsQuery = invitationsQuery.Where(i =>
                i.Email.ToLower().Contains(query.Email.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(query.Name))
        {
            var searchTerm = query.Name.ToLower();
            invitationsQuery = invitationsQuery.Where(i =>
                (i.FirstName != null && i.FirstName.ToLower().Contains(searchTerm)) ||
                (i.LastName != null && i.LastName.ToLower().Contains(searchTerm)));
        }

        var totalCount = await invitationsQuery.CountAsync();

        var invitations = await invitationsQuery
            .OrderByDescending(i => i.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(i => i.CreatedByUser)
            .ToListAsync();

        // Check for expired invitations and update status
        foreach (var inv in invitations.Where(i =>
            i.Status == PatientInvitationStatus.Sent && i.ExpiresAt < DateTime.UtcNow))
        {
            inv.Status = PatientInvitationStatus.Expired;
        }
        await _context.SaveChangesAsync();

        var dtos = invitations.Select(i => MapToDto(i, i.CreatedByUser)).ToList();

        return SuccessPaginated(dtos, totalCount, query.Page, query.PageSize);
    }

    /// <summary>
    /// Get a specific invitation by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Provider,admin,provider")]
    public async Task<IActionResult> GetInvitation(Guid id)
    {
        var tenantId = RequireTenantId();

        var invitation = await _context.PatientInvitations
            .IgnoreQueryFilters()
            .Include(i => i.CreatedByUser)
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invitation == null)
        {
            throw new NotFoundException("Invitation not found");
        }

        return Success(MapToDto(invitation, invitation.CreatedByUser));
    }

    /// <summary>
    /// Resend an invitation email
    /// </summary>
    [HttpPost("{id:guid}/resend")]
    [Authorize(Roles = "Admin,Provider,admin,provider")]
    public async Task<IActionResult> ResendInvitation(Guid id, [FromBody] ResendInvitationRequest? request = null)
    {
        var tenantId = RequireTenantId();

        var invitation = await _context.PatientInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invitation == null)
        {
            throw new NotFoundException("Invitation not found");
        }

        if (invitation.Status == PatientInvitationStatus.Accepted)
        {
            throw new ValidationException("Cannot resend an accepted invitation");
        }

        if (invitation.Status == PatientInvitationStatus.Revoked)
        {
            throw new ValidationException("Cannot resend a revoked invitation");
        }

        // Update personal message if provided
        if (request?.PersonalMessage != null)
        {
            invitation.PersonalMessage = request.PersonalMessage;
        }

        // Extend expiry if requested or if expired
        if (request?.ExtendExpiryDays.HasValue == true || invitation.ExpiresAt < DateTime.UtcNow)
        {
            invitation.ExpiresAt = DateTime.UtcNow.AddDays(request?.ExtendExpiryDays ?? 7);
        }

        // Generate new token for security
        invitation.Token = GenerateSecureToken();
        invitation.ResendCount++;
        invitation.LastReminderAt = DateTime.UtcNow;

        // Send the email
        await SendInvitationEmailAsync(invitation, tenantId);

        invitation.Status = PatientInvitationStatus.Sent;
        invitation.SentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Patient invitation resent: {InvitationId}, ResendCount: {ResendCount}",
            invitation.Id, invitation.ResendCount);

        return Success(MapToDto(invitation));
    }

    /// <summary>
    /// Revoke an invitation
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Provider,admin,provider")]
    public async Task<IActionResult> RevokeInvitation(Guid id)
    {
        var tenantId = RequireTenantId();

        var invitation = await _context.PatientInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invitation == null)
        {
            throw new NotFoundException("Invitation not found");
        }

        if (invitation.Status == PatientInvitationStatus.Accepted)
        {
            throw new ValidationException("Cannot revoke an accepted invitation");
        }

        invitation.Status = PatientInvitationStatus.Revoked;
        invitation.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Patient invitation revoked: {InvitationId}", invitation.Id);

        return NoContent();
    }

    /// <summary>
    /// Validate an invitation token (public endpoint for patient portal)
    /// </summary>
    [HttpGet("validate/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateToken(string token)
    {
        var invitation = await _context.PatientInvitations
            .IgnoreQueryFilters()
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.Token == token);

        if (invitation == null)
        {
            return Ok(new ValidateInvitationResponse
            {
                IsValid = false,
                ErrorMessage = "Invalid invitation link"
            });
        }

        if (invitation.Status == PatientInvitationStatus.Accepted)
        {
            return Ok(new ValidateInvitationResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has already been accepted"
            });
        }

        if (invitation.Status == PatientInvitationStatus.Revoked)
        {
            return Ok(new ValidateInvitationResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has been revoked"
            });
        }

        if (invitation.ExpiresAt < DateTime.UtcNow)
        {
            invitation.Status = PatientInvitationStatus.Expired;
            await _context.SaveChangesAsync();

            return Ok(new ValidateInvitationResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has expired. Please contact the clinic for a new invitation."
            });
        }

        // Get clinic/tenant name
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == invitation.TenantId);

        return Ok(new ValidateInvitationResponse
        {
            IsValid = true,
            Email = invitation.Email,
            FirstName = invitation.FirstName,
            LastName = invitation.LastName,
            ClinicName = tenant?.Name ?? "QIVR Health"
        });
    }

    /// <summary>
    /// Accept an invitation and create account (public endpoint for patient portal)
    /// </summary>
    [HttpPost("accept")]
    [AllowAnonymous]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationRequest request)
    {
        ValidateModel();

        var invitation = await _context.PatientInvitations
            .IgnoreQueryFilters()
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.Token == request.Token);

        if (invitation == null)
        {
            throw new ValidationException("Invalid invitation token");
        }

        if (invitation.Status == PatientInvitationStatus.Accepted)
        {
            throw new ValidationException("This invitation has already been accepted");
        }

        if (invitation.Status == PatientInvitationStatus.Revoked)
        {
            throw new ValidationException("This invitation has been revoked");
        }

        if (invitation.ExpiresAt < DateTime.UtcNow)
        {
            invitation.Status = PatientInvitationStatus.Expired;
            await _context.SaveChangesAsync();
            throw new ValidationException("This invitation has expired. Please contact the clinic for a new invitation.");
        }

        // TODO: Create Cognito account here
        // For now, we'll just mark the invitation as accepted and return success
        // The actual Cognito account creation will be implemented when integrating with AWS Cognito

        invitation.Status = PatientInvitationStatus.Accepted;
        invitation.AcceptedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Update intake submission status if linked
        if (invitation.EvaluationId.HasValue)
        {
            var intake = await _context.IntakeSubmissions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.EvaluationId == invitation.EvaluationId && i.TenantId == invitation.TenantId);

            if (intake != null)
            {
                intake.Status = IntakeStatus.Registered;
                await _context.SaveChangesAsync();
            }
        }

        _logger.LogInformation("Patient invitation accepted: {InvitationId} for user {UserId}",
            invitation.Id, invitation.UserId);

        return Ok(new AcceptInvitationResponse
        {
            Success = true,
            Message = "Account created successfully",
            UserId = invitation.UserId,
            RequiresProfileCompletion = true
            // AccessToken and RefreshToken will be set when Cognito integration is complete
        });
    }

    #region Private Helper Methods

    private static string GenerateSecureToken()
    {
        var bytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }

    private async Task SendInvitationEmailAsync(PatientInvitation invitation, Guid tenantId)
    {
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        var clinicName = tenant?.Name ?? "QIVR Health";
        var portalUrl = _configuration["PatientPortal:BaseUrl"] ?? "https://portal.qivr.health";
        var inviteUrl = $"{portalUrl}/accept-invite?token={invitation.Token}";

        var htmlBody = GenerateInvitationEmailHtml(invitation, clinicName, inviteUrl);
        var plainBody = GenerateInvitationEmailPlain(invitation, clinicName, inviteUrl);

        var emailContent = new EmailContent
        {
            To = invitation.Email,
            Subject = $"Complete your registration at {clinicName}",
            HtmlBody = htmlBody,
            PlainBody = plainBody
        };

        await _emailService.SendEmailAsync(emailContent, tenantId);
    }

    private static string GenerateInvitationEmailHtml(PatientInvitation invitation, string clinicName, string inviteUrl)
    {
        var firstName = invitation.FirstName ?? "there";
        var personalMessage = !string.IsNullOrWhiteSpace(invitation.PersonalMessage)
            ? $"<p style=\"margin: 16px 0; padding: 16px; background-color: #f5f5f5; border-radius: 8px; font-style: italic;\">\"{invitation.PersonalMessage}\"</p>"
            : "";

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
</head>
<body style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""text-align: center; margin-bottom: 32px;"">
        <h1 style=""color: #2563eb; margin: 0;"">{clinicName}</h1>
    </div>

    <h2 style=""color: #1f2937; margin-bottom: 16px;"">Hi {firstName},</h2>

    <p style=""margin-bottom: 16px;"">Great news! Your intake has been reviewed and approved by <strong>{clinicName}</strong>.</p>

    {personalMessage}

    <p style=""margin-bottom: 16px;"">Click the button below to:</p>

    <ul style=""margin-bottom: 24px; padding-left: 20px;"">
        <li>Create your secure account</li>
        <li>Complete your health profile</li>
        <li>Book your first appointment</li>
    </ul>

    <div style=""text-align: center; margin: 32px 0;"">
        <a href=""{inviteUrl}"" style=""display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;"">Get Started</a>
    </div>

    <p style=""margin-bottom: 16px; color: #6b7280; font-size: 14px;"">This link expires in 7 days.</p>

    <p style=""margin-bottom: 8px; color: #6b7280; font-size: 14px;"">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style=""margin-bottom: 24px; color: #2563eb; font-size: 14px; word-break: break-all;"">{inviteUrl}</p>

    <hr style=""border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"">

    <p style=""color: #9ca3af; font-size: 12px; text-align: center;"">
        If you didn't request this invitation or have questions, please contact us.
    </p>
</body>
</html>";
    }

    private static string GenerateInvitationEmailPlain(PatientInvitation invitation, string clinicName, string inviteUrl)
    {
        var firstName = invitation.FirstName ?? "there";
        var personalMessage = !string.IsNullOrWhiteSpace(invitation.PersonalMessage)
            ? $"\n\"{invitation.PersonalMessage}\"\n"
            : "";

        return $@"
{clinicName}

Hi {firstName},

Great news! Your intake has been reviewed and approved by {clinicName}.
{personalMessage}
Click the link below to:
- Create your secure account
- Complete your health profile
- Book your first appointment

{inviteUrl}

This link expires in 7 days.

If you didn't request this invitation or have questions, please contact us.
";
    }

    private static PatientInvitationDto MapToDto(PatientInvitation invitation, User? createdByUser = null)
    {
        return new PatientInvitationDto
        {
            Id = invitation.Id,
            UserId = invitation.UserId,
            EvaluationId = invitation.EvaluationId,
            Email = invitation.Email,
            FirstName = invitation.FirstName,
            LastName = invitation.LastName,
            Status = invitation.Status.ToString(),
            ExpiresAt = invitation.ExpiresAt,
            SentAt = invitation.SentAt,
            AcceptedAt = invitation.AcceptedAt,
            ResendCount = invitation.ResendCount,
            CreatedAt = invitation.CreatedAt,
            CreatedBy = invitation.CreatedBy,
            CreatedByName = createdByUser != null
                ? $"{createdByUser.FirstName} {createdByUser.LastName}".Trim()
                : null
        };
    }

    #endregion
}
