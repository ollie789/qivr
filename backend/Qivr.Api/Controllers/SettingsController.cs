using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Qivr.Api.Exceptions;

namespace Qivr.Api.Controllers;

public class SettingsController : BaseApiController
{
    private readonly QivrDbContext _context;
    private readonly ISettingsService _settingsService;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(
        QivrDbContext context,
        ISettingsService settingsService,
        ILogger<SettingsController> logger)
    {
        _context = context;
        _settingsService = settingsService;
        _logger = logger;
    }

    /// <summary>
    /// Get user settings
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserSettingsDto), 200)]
    public async Task<IActionResult> GetSettings()
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();

        // Get settings from service
        var settings = await _settingsService.GetUserSettingsAsync(tenantId, userId);

            // Convert to DTO
            var settingsDto = new UserSettingsDto
            {
                Profile = new ProfileSettingsDto
                {
                    FirstName = settings.Profile.FirstName,
                    LastName = settings.Profile.LastName,
                    Email = settings.Profile.Email,
                    Phone = settings.Profile.Phone,
                    DateOfBirth = settings.Profile.DateOfBirth,
                    Address = settings.Profile.Address,
                    City = settings.Profile.City,
                    State = settings.Profile.State,
                    ZipCode = settings.Profile.ZipCode,
                    EmergencyContact = settings.Profile.EmergencyContact,
                    EmergencyPhone = settings.Profile.EmergencyPhone
                },
                Notifications = new NotificationSettingsDto
                {
                    Appointments = settings.Notifications.Appointments,
                    LabResults = settings.Notifications.LabResults,
                    Prescriptions = settings.Notifications.Prescriptions,
                    Messages = settings.Notifications.Messages,
                    Promotions = settings.Notifications.Promotions,
                    Channels = new NotificationChannelsDto
                    {
                        Email = settings.Notifications.Channels.Email,
                        Sms = settings.Notifications.Channels.Sms,
                        Push = settings.Notifications.Channels.Push,
                        Phone = settings.Notifications.Channels.Phone
                    },
                    QuietHours = new QuietHoursDto
                    {
                        Enabled = settings.Notifications.QuietHours.Enabled,
                        Start = settings.Notifications.QuietHours.Start,
                        End = settings.Notifications.QuietHours.End
                    }
                },
                Privacy = new PrivacySettingsDto
                {
                    ShareData = settings.Privacy.ShareData,
                    MarketingEmails = settings.Privacy.MarketingEmails,
                    AnonymousAnalytics = settings.Privacy.AnonymousAnalytics,
                    ThirdPartyAccess = settings.Privacy.ThirdPartyAccess
                },
                Security = new SecuritySettingsDto
                {
                    TwoFactorEnabled = settings.Security.TwoFactorEnabled,
                    LoginAlerts = settings.Security.LoginAlerts,
                    SessionTimeout = settings.Security.SessionTimeout,
                    PasswordLastChanged = settings.Security.PasswordLastChanged
                },
                Accessibility = new AccessibilitySettingsDto
                {
                    FontSize = settings.Accessibility.FontSize,
                    HighContrast = settings.Accessibility.HighContrast,
                    ScreenReader = settings.Accessibility.ScreenReader,
                    ReducedMotion = settings.Accessibility.ReducedMotion,
                    Language = settings.Accessibility.Language,
                    Theme = settings.Accessibility.Theme
                }
            };

        return Success(settingsDto);
    }

    /// <summary>
    /// Update user settings
    /// </summary>
    [HttpPut]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateSettings([FromBody] UserSettingsDto settings)
    {
        if (settings == null)
        {
            throw new ValidationException("Invalid settings");
        }

        var userId = CurrentUserId;
        var tenantId = RequireTenantId();

            // Convert DTO to service model
            var userSettings = new UserSettings
            {
                Profile = new ProfileSettings
                {
                    FirstName = settings.Profile?.FirstName ?? "",
                    LastName = settings.Profile?.LastName ?? "",
                    Email = settings.Profile?.Email ?? "",
                    Phone = settings.Profile?.Phone ?? "",
                    DateOfBirth = settings.Profile?.DateOfBirth ?? "",
                    Address = settings.Profile?.Address ?? "",
                    City = settings.Profile?.City ?? "",
                    State = settings.Profile?.State ?? "",
                    ZipCode = settings.Profile?.ZipCode ?? "",
                    EmergencyContact = settings.Profile?.EmergencyContact ?? "",
                    EmergencyPhone = settings.Profile?.EmergencyPhone ?? ""
                },
                Notifications = new NotificationSettings
                {
                    Appointments = settings.Notifications?.Appointments ?? true,
                    LabResults = settings.Notifications?.LabResults ?? true,
                    Prescriptions = settings.Notifications?.Prescriptions ?? true,
                    Messages = settings.Notifications?.Messages ?? true,
                    Promotions = settings.Notifications?.Promotions ?? false,
                    Channels = new NotificationChannels
                    {
                        Email = settings.Notifications?.Channels?.Email ?? true,
                        Sms = settings.Notifications?.Channels?.Sms ?? true,
                        Push = settings.Notifications?.Channels?.Push ?? true,
                        Phone = settings.Notifications?.Channels?.Phone ?? false
                    },
                    QuietHours = new QuietHours
                    {
                        Enabled = settings.Notifications?.QuietHours?.Enabled ?? false,
                        Start = settings.Notifications?.QuietHours?.Start ?? "22:00",
                        End = settings.Notifications?.QuietHours?.End ?? "08:00"
                    }
                },
                Privacy = new PrivacySettings
                {
                    ShareData = settings.Privacy?.ShareData ?? false,
                    MarketingEmails = settings.Privacy?.MarketingEmails ?? false,
                    AnonymousAnalytics = settings.Privacy?.AnonymousAnalytics ?? true,
                    ThirdPartyAccess = settings.Privacy?.ThirdPartyAccess ?? Array.Empty<string>()
                },
                Security = new SecuritySettings
                {
                    TwoFactorEnabled = settings.Security?.TwoFactorEnabled ?? false,
                    LoginAlerts = settings.Security?.LoginAlerts ?? true,
                    SessionTimeout = settings.Security?.SessionTimeout ?? 30,
                    PasswordLastChanged = settings.Security?.PasswordLastChanged ?? DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss")
                },
                Accessibility = new AccessibilitySettings
                {
                    FontSize = settings.Accessibility?.FontSize ?? 16,
                    HighContrast = settings.Accessibility?.HighContrast ?? false,
                    ScreenReader = settings.Accessibility?.ScreenReader ?? false,
                    ReducedMotion = settings.Accessibility?.ReducedMotion ?? false,
                    Language = settings.Accessibility?.Language ?? "en",
                    Theme = settings.Accessibility?.Theme ?? "light"
                }
            };

        // Update settings via service
        await _settingsService.UpdateUserSettingsAsync(tenantId, userId, userSettings);

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
        var validCategories = new[] { "profile", "notifications", "privacy", "security", "accessibility" };
        if (!validCategories.Contains(category.ToLower()))
        {
            throw new ValidationException($"Invalid category: {category}");
        }

        var userId = CurrentUserId;
        var tenantId = RequireTenantId();

        // Update specific category via service
        await _settingsService.UpdateSettingsCategoryAsync(tenantId, userId, category, categorySettings);

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
        var userId = CurrentUserId;

        // Validate passwords
        if (string.IsNullOrEmpty(request.CurrentPassword) || 
            string.IsNullOrEmpty(request.NewPassword) ||
            request.NewPassword != request.ConfirmPassword)
        {
            throw new ValidationException("Invalid password data");
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
        var userId = CurrentUserId;

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
            return Success(response);
        }
        else
        {
            // In production, verify password before disabling
            _logger.LogInformation("User {UserId} disabled two-factor authentication", userId);
            return Success(new TwoFactorResponseDto { Enabled = false });
        }
    }

    /// <summary>
    /// Export user data
    /// </summary>
    [HttpPost("export-data")]
    [ProducesResponseType(typeof(ExportDataResponseDto), 202)]
    public async Task<IActionResult> ExportData([FromBody] ExportDataRequest request)
    {
        var userId = CurrentUserId;

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
        var userId = CurrentUserId;

        // Validate confirmation
        if (request.Confirmation != "DELETE")
        {
            throw new ValidationException("Invalid confirmation. Please type 'DELETE' to confirm.");
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
