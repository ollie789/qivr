using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(
        QivrDbContext context,
        ILogger<SettingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get user settings
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserSettingsDto), 200)]
    public async Task<IActionResult> GetSettings()
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // For now, return mock settings. In production, this would query actual user preferences
        var settings = new UserSettingsDto
        {
            Profile = new ProfileSettingsDto
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Phone = "(555) 123-4567",
                DateOfBirth = "1985-06-15",
                Address = "123 Main Street",
                City = "Springfield",
                State = "IL",
                ZipCode = "62701",
                EmergencyContact = "Jane Doe",
                EmergencyPhone = "(555) 987-6543"
            },
            Notifications = new NotificationSettingsDto
            {
                Appointments = true,
                LabResults = true,
                Prescriptions = true,
                Messages = true,
                Promotions = false,
                Channels = new NotificationChannelsDto
                {
                    Email = true,
                    Sms = true,
                    Push = true,
                    Phone = false
                },
                QuietHours = new QuietHoursDto
                {
                    Enabled = true,
                    Start = "22:00",
                    End = "08:00"
                }
            },
            Privacy = new PrivacySettingsDto
            {
                ShareData = false,
                MarketingEmails = false,
                AnonymousAnalytics = true,
                ThirdPartyAccess = Array.Empty<string>()
            },
            Security = new SecuritySettingsDto
            {
                TwoFactorEnabled = false,
                LoginAlerts = true,
                SessionTimeout = 30,
                PasswordLastChanged = "2024-01-01T00:00:00"
            },
            Accessibility = new AccessibilitySettingsDto
            {
                FontSize = 16,
                HighContrast = false,
                ScreenReader = false,
                ReducedMotion = false,
                Language = "en",
                Theme = "light"
            }
        };

        return Ok(settings);
    }

    /// <summary>
    /// Update user settings
    /// </summary>
    [HttpPut]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateSettings([FromBody] UserSettingsDto settings)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Validate settings
        if (settings == null)
        {
            return BadRequest("Invalid settings");
        }

        // In production, save settings to database
        // For now, just log the update
        _logger.LogInformation("User {UserId} updated settings", userId);

        return NoContent();
    }

    /// <summary>
    /// Update specific setting category
    /// </summary>
    [HttpPatch("{category}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateSettingCategory(
        string category,
        [FromBody] object categorySettings)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var validCategories = new[] { "profile", "notifications", "privacy", "security", "accessibility" };
        if (!validCategories.Contains(category.ToLower()))
        {
            return BadRequest("Invalid category");
        }

        // In production, update specific settings category
        _logger.LogInformation("User {UserId} updated {Category} settings", userId, category);

        return NoContent();
    }

    /// <summary>
    /// Change password
    /// </summary>
    [HttpPost("change-password")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordSettingsRequest request)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Validate passwords
        if (string.IsNullOrEmpty(request.CurrentPassword) || 
            string.IsNullOrEmpty(request.NewPassword) ||
            request.NewPassword != request.ConfirmPassword)
        {
            return BadRequest("Invalid password data");
        }

        // In production, verify current password and update
        // This would integrate with your auth system (Cognito, etc.)
        _logger.LogInformation("User {UserId} changed password", userId);

        return NoContent();
    }

    /// <summary>
    /// Enable/disable two-factor authentication
    /// </summary>
    [HttpPost("two-factor")]
    [ProducesResponseType(typeof(TwoFactorResponseDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ToggleTwoFactor([FromBody] TwoFactorRequest request)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (request.Enable)
        {
            // In production, generate QR code for authenticator app
            var response = new TwoFactorResponseDto
            {
                Enabled = true,
                QrCodeUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                Secret = "JBSWY3DPEHPK3PXP"
            };

            _logger.LogInformation("User {UserId} enabled two-factor authentication", userId);
            return Ok(response);
        }
        else
        {
            // In production, verify password before disabling
            _logger.LogInformation("User {UserId} disabled two-factor authentication", userId);
            return Ok(new TwoFactorResponseDto { Enabled = false });
        }
    }

    /// <summary>
    /// Export user data
    /// </summary>
    [HttpPost("export-data")]
    [ProducesResponseType(typeof(ExportDataResponseDto), 202)]
    public async Task<IActionResult> ExportData([FromBody] ExportDataRequest request)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // In production, queue a job to export data and send via email
        var response = new ExportDataResponseDto
        {
            RequestId = Guid.NewGuid().ToString(),
            Status = "Processing",
            Message = "Your data export request has been received. You will receive an email with the download link when it's ready."
        };

        _logger.LogInformation("User {UserId} requested data export", userId);

        return Accepted(response);
    }

    /// <summary>
    /// Delete account
    /// </summary>
    [HttpDelete("account")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Validate confirmation
        if (request.Confirmation != "DELETE")
        {
            return BadRequest("Invalid confirmation");
        }

        // In production, mark account for deletion and schedule cleanup
        _logger.LogWarning("User {UserId} requested account deletion", userId);

        return NoContent();
    }
}

// DTOs
public class UserSettingsDto
{
    public ProfileSettingsDto Profile { get; set; } = new();
    public NotificationSettingsDto Notifications { get; set; } = new();
    public PrivacySettingsDto Privacy { get; set; } = new();
    public SecuritySettingsDto Security { get; set; } = new();
    public AccessibilitySettingsDto Accessibility { get; set; } = new();
}

public class ProfileSettingsDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string DateOfBirth { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public string EmergencyContact { get; set; } = string.Empty;
    public string EmergencyPhone { get; set; } = string.Empty;
}

public class NotificationSettingsDto
{
    public bool Appointments { get; set; }
    public bool LabResults { get; set; }
    public bool Prescriptions { get; set; }
    public bool Messages { get; set; }
    public bool Promotions { get; set; }
    public NotificationChannelsDto Channels { get; set; } = new();
    public QuietHoursDto QuietHours { get; set; } = new();
}

public class NotificationChannelsDto
{
    public bool Email { get; set; }
    public bool Sms { get; set; }
    public bool Push { get; set; }
    public bool Phone { get; set; }
}

public class QuietHoursDto
{
    public bool Enabled { get; set; }
    public string Start { get; set; } = string.Empty;
    public string End { get; set; } = string.Empty;
}

public class PrivacySettingsDto
{
    public bool ShareData { get; set; }
    public bool MarketingEmails { get; set; }
    public bool AnonymousAnalytics { get; set; }
    public string[] ThirdPartyAccess { get; set; } = Array.Empty<string>();
}

public class SecuritySettingsDto
{
    public bool TwoFactorEnabled { get; set; }
    public bool LoginAlerts { get; set; }
    public int SessionTimeout { get; set; }
    public string PasswordLastChanged { get; set; } = string.Empty;
}

public class AccessibilitySettingsDto
{
    public int FontSize { get; set; }
    public bool HighContrast { get; set; }
    public bool ScreenReader { get; set; }
    public bool ReducedMotion { get; set; }
    public string Language { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
}

public class ChangePasswordSettingsRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class TwoFactorRequest
{
    public bool Enable { get; set; }
    public string? VerificationCode { get; set; }
    public string? Password { get; set; }
}

public class TwoFactorResponseDto
{
    public bool Enabled { get; set; }
    public string? QrCodeUrl { get; set; }
    public string? Secret { get; set; }
}

public class ExportDataRequest
{
    public bool MedicalRecords { get; set; }
    public bool Appointments { get; set; }
    public bool LabResults { get; set; }
    public bool Prescriptions { get; set; }
    public bool Messages { get; set; }
}

public class ExportDataResponseDto
{
    public string RequestId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class DeleteAccountRequest
{
    public string Confirmation { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
