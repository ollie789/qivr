using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Services;

public interface ISettingsService
{
    Task<UserSettings> GetUserSettingsAsync(Guid tenantId, Guid userId);
    Task UpdateUserSettingsAsync(Guid tenantId, Guid userId, UserSettings settings);
    Task UpdateSettingsCategoryAsync(Guid tenantId, Guid userId, string category, object categorySettings);
    Task<NotificationPreferences> GetNotificationPreferencesAsync(Guid tenantId, Guid userId);
    Task UpdateNotificationPreferencesAsync(Guid tenantId, Guid userId, NotificationPreferences preferences);
}

public class SettingsService : ISettingsService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<SettingsService> _logger;

    public SettingsService(QivrDbContext context, ILogger<SettingsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UserSettings> GetUserSettingsAsync(Guid tenantId, Guid userId)
    {
        // Get user with preferences
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == userId);

        if (user == null)
        {
            throw new InvalidOperationException($"User {userId} not found in tenant {tenantId}");
        }

        // Get notification preferences
        var notificationPrefs = await _context.NotificationPreferences
            .FirstOrDefaultAsync(n => n.TenantId == tenantId && n.UserId == userId);

        // Build settings from user data and preferences
        var settings = new UserSettings
        {
            Profile = new ProfileSettings
            {
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                Email = user.Email,
                Phone = user.Phone ?? "",
                DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd") ?? "",
                Gender = user.Gender ?? "",
                AvatarUrl = user.AvatarUrl
            },
            Notifications = BuildNotificationSettings(notificationPrefs),
            Privacy = GetPrivacySettings(user.Preferences),
            Security = GetSecuritySettings(user.Preferences),
            Accessibility = GetAccessibilitySettings(user.Preferences)
        };

        // Add address if stored in preferences
        if (user.Preferences.ContainsKey("address"))
        {
            var addressData = user.Preferences["address"].ToString();
            if (!string.IsNullOrEmpty(addressData))
            {
                try
                {
                    var address = JsonSerializer.Deserialize<UserAddress>(addressData);
                    if (address != null)
                    {
                        settings.Profile.Address = address.Street;
                        settings.Profile.City = address.City;
                        settings.Profile.State = address.State;
                        settings.Profile.ZipCode = address.PostalCode;
                        settings.Profile.Country = address.Country;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize address for user {UserId}", userId);
                }
            }
        }

        // Add emergency contact if stored
        if (user.Preferences.ContainsKey("emergencyContact"))
        {
            var emergencyData = user.Preferences["emergencyContact"].ToString();
            if (!string.IsNullOrEmpty(emergencyData))
            {
                try
                {
                    var emergency = JsonSerializer.Deserialize<EmergencyContact>(emergencyData);
                    if (emergency != null)
                    {
                        settings.Profile.EmergencyContact = emergency.Name;
                        settings.Profile.EmergencyPhone = emergency.Phone;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize emergency contact for user {UserId}", userId);
                }
            }
        }

        return settings;
    }

    public async Task UpdateUserSettingsAsync(Guid tenantId, Guid userId, UserSettings settings)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == userId);

        if (user == null)
        {
            throw new InvalidOperationException($"User {userId} not found in tenant {tenantId}");
        }

        // Update basic profile information
        if (settings.Profile != null)
        {
            user.FirstName = settings.Profile.FirstName;
            user.LastName = settings.Profile.LastName;
            user.Email = settings.Profile.Email;
            user.Phone = settings.Profile.Phone;
            
            if (!string.IsNullOrEmpty(settings.Profile.DateOfBirth))
            {
                if (DateTime.TryParse(settings.Profile.DateOfBirth, out var dob))
                {
                    user.DateOfBirth = dob;
                }
            }
            
            user.Gender = settings.Profile.Gender;

            // Store address in preferences
            if (!string.IsNullOrEmpty(settings.Profile.Address))
            {
                var address = new UserAddress
                {
                    Street = settings.Profile.Address,
                    City = settings.Profile.City,
                    State = settings.Profile.State,
                    PostalCode = settings.Profile.ZipCode,
                    Country = settings.Profile.Country ?? "USA"
                };
                user.Preferences["address"] = JsonSerializer.Serialize(address);
            }

            // Store emergency contact
            if (!string.IsNullOrEmpty(settings.Profile.EmergencyContact))
            {
                var emergency = new EmergencyContact
                {
                    Name = settings.Profile.EmergencyContact,
                    Phone = settings.Profile.EmergencyPhone,
                    Relationship = user.Preferences.ContainsKey("emergencyRelationship") 
                        ? user.Preferences["emergencyRelationship"].ToString() ?? "" 
                        : ""
                };
                user.Preferences["emergencyContact"] = JsonSerializer.Serialize(emergency);
            }
        }

        // Update notification preferences
        if (settings.Notifications != null)
        {
            await UpdateNotificationSettingsAsync(tenantId, userId, settings.Notifications);
        }

        // Store privacy settings
        if (settings.Privacy != null)
        {
            user.Preferences["privacy"] = JsonSerializer.Serialize(settings.Privacy);
        }

        // Store security settings
        if (settings.Security != null)
        {
            user.Preferences["security"] = JsonSerializer.Serialize(settings.Security);
        }

        // Store accessibility settings
        if (settings.Accessibility != null)
        {
            user.Preferences["accessibility"] = JsonSerializer.Serialize(settings.Accessibility);
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated settings for user {UserId} in tenant {TenantId}", userId, tenantId);
    }

    public async Task UpdateSettingsCategoryAsync(Guid tenantId, Guid userId, string category, object categorySettings)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == userId);

        if (user == null)
        {
            throw new InvalidOperationException($"User {userId} not found in tenant {tenantId}");
        }

        var settingsJson = JsonSerializer.Serialize(categorySettings);
        
        switch (category.ToLower())
        {
            case "profile":
                // Deserialize and update profile fields
                var profileSettings = JsonSerializer.Deserialize<ProfileSettings>(settingsJson);
                if (profileSettings != null)
                {
                    user.FirstName = profileSettings.FirstName;
                    user.LastName = profileSettings.LastName;
                    user.Email = profileSettings.Email;
                    user.Phone = profileSettings.Phone;
                    
                    if (!string.IsNullOrEmpty(profileSettings.DateOfBirth))
                    {
                        if (DateTime.TryParse(profileSettings.DateOfBirth, out var dob))
                        {
                            user.DateOfBirth = dob;
                        }
                    }
                }
                break;
                
            case "notifications":
                var notificationSettings = JsonSerializer.Deserialize<NotificationSettings>(settingsJson);
                if (notificationSettings != null)
                {
                    await UpdateNotificationSettingsAsync(tenantId, userId, notificationSettings);
                }
                break;
                
            case "privacy":
            case "security":
            case "accessibility":
                user.Preferences[category] = settingsJson;
                break;
                
            default:
                throw new ArgumentException($"Invalid settings category: {category}");
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated {Category} settings for user {UserId} in tenant {TenantId}", 
            category, userId, tenantId);
    }

    public async Task<NotificationPreferences> GetNotificationPreferencesAsync(Guid tenantId, Guid userId)
    {
        var preferences = await _context.NotificationPreferences
            .FirstOrDefaultAsync(n => n.TenantId == tenantId && n.UserId == userId);

        if (preferences == null)
        {
            // Create default preferences
            preferences = new NotificationPreferences
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                UserId = userId,
                EmailEnabled = true,
                SmsEnabled = true,
                PushEnabled = true,
                InAppEnabled = true,
                AppointmentReminders = true,
                PromReminders = true,
                EvaluationNotifications = true,
                ClinicAnnouncements = true,
                SystemNotifications = true,
                ReminderHoursBefore = 24,
                PreferredTimeZone = "UTC",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.NotificationPreferences.Add(preferences);
            await _context.SaveChangesAsync();
        }

        return preferences;
    }

    public async Task UpdateNotificationPreferencesAsync(Guid tenantId, Guid userId, NotificationPreferences preferences)
    {
        var existing = await _context.NotificationPreferences
            .FirstOrDefaultAsync(n => n.TenantId == tenantId && n.UserId == userId);

        if (existing == null)
        {
            preferences.Id = Guid.NewGuid();
            preferences.TenantId = tenantId;
            preferences.UserId = userId;
            preferences.CreatedAt = DateTime.UtcNow;
            preferences.UpdatedAt = DateTime.UtcNow;
            _context.NotificationPreferences.Add(preferences);
        }
        else
        {
            existing.EmailEnabled = preferences.EmailEnabled;
            existing.SmsEnabled = preferences.SmsEnabled;
            existing.PushEnabled = preferences.PushEnabled;
            existing.InAppEnabled = preferences.InAppEnabled;
            existing.AppointmentReminders = preferences.AppointmentReminders;
            existing.PromReminders = preferences.PromReminders;
            existing.EvaluationNotifications = preferences.EvaluationNotifications;
            existing.ClinicAnnouncements = preferences.ClinicAnnouncements;
            existing.SystemNotifications = preferences.SystemNotifications;
            existing.ReminderHoursBefore = preferences.ReminderHoursBefore;
            existing.PreferredTimeZone = preferences.PreferredTimeZone;
            existing.QuietHoursStart = preferences.QuietHoursStart;
            existing.QuietHoursEnd = preferences.QuietHoursEnd;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private async Task UpdateNotificationSettingsAsync(Guid tenantId, Guid userId, NotificationSettings settings)
    {
        var prefs = await GetNotificationPreferencesAsync(tenantId, userId);
        
        prefs.AppointmentReminders = settings.Appointments;
        prefs.PromReminders = settings.LabResults; // Mapping lab results to PROM reminders
        prefs.EvaluationNotifications = settings.Messages;
        prefs.ClinicAnnouncements = settings.Promotions;
        
        if (settings.Channels != null)
        {
            prefs.EmailEnabled = settings.Channels.Email;
            prefs.SmsEnabled = settings.Channels.Sms;
            prefs.PushEnabled = settings.Channels.Push;
            // Phone notifications mapped to SMS for simplicity
        }
        
        if (settings.QuietHours != null && settings.QuietHours.Enabled)
        {
            // Parse quiet hours (e.g., "22:00" -> 22)
            if (!string.IsNullOrEmpty(settings.QuietHours.Start))
            {
                var parts = settings.QuietHours.Start.Split(':');
                if (parts.Length > 0 && int.TryParse(parts[0], out var startHour))
                {
                    prefs.QuietHoursStart = startHour;
                }
            }
            
            if (!string.IsNullOrEmpty(settings.QuietHours.End))
            {
                var parts = settings.QuietHours.End.Split(':');
                if (parts.Length > 0 && int.TryParse(parts[0], out var endHour))
                {
                    prefs.QuietHoursEnd = endHour;
                }
            }
        }
        else
        {
            prefs.QuietHoursStart = null;
            prefs.QuietHoursEnd = null;
        }

        prefs.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private NotificationSettings BuildNotificationSettings(NotificationPreferences? prefs)
    {
        if (prefs == null)
        {
            return new NotificationSettings();
        }

        return new NotificationSettings
        {
            Appointments = prefs.AppointmentReminders,
            LabResults = prefs.PromReminders,
            Prescriptions = true, // Default as we don't have specific field
            Messages = prefs.EvaluationNotifications,
            Promotions = prefs.ClinicAnnouncements,
            Channels = new NotificationChannels
            {
                Email = prefs.EmailEnabled,
                Sms = prefs.SmsEnabled,
                Push = prefs.PushEnabled,
                Phone = prefs.SmsEnabled // Map to SMS
            },
            QuietHours = (prefs.QuietHoursStart.HasValue && prefs.QuietHoursEnd.HasValue)
                ? new QuietHours
                {
                    Enabled = true,
                    Start = $"{prefs.QuietHoursStart:D2}:00",
                    End = $"{prefs.QuietHoursEnd:D2}:00"
                }
                : new QuietHours { Enabled = false }
        };
    }

    private PrivacySettings GetPrivacySettings(Dictionary<string, object> preferences)
    {
        if (preferences.ContainsKey("privacy"))
        {
            try
            {
                var privacyJson = preferences["privacy"].ToString();
                if (!string.IsNullOrEmpty(privacyJson))
                {
                    return JsonSerializer.Deserialize<PrivacySettings>(privacyJson) ?? new PrivacySettings();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize privacy settings");
            }
        }

        return new PrivacySettings();
    }

    private SecuritySettings GetSecuritySettings(Dictionary<string, object> preferences)
    {
        if (preferences.ContainsKey("security"))
        {
            try
            {
                var securityJson = preferences["security"].ToString();
                if (!string.IsNullOrEmpty(securityJson))
                {
                    return JsonSerializer.Deserialize<SecuritySettings>(securityJson) ?? new SecuritySettings();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize security settings");
            }
        }

        return new SecuritySettings
        {
            TwoFactorEnabled = false,
            LoginAlerts = true,
            SessionTimeout = 30,
            PasswordLastChanged = DateTime.UtcNow.AddMonths(-3).ToString("yyyy-MM-ddTHH:mm:ss")
        };
    }

    private AccessibilitySettings GetAccessibilitySettings(Dictionary<string, object> preferences)
    {
        if (preferences.ContainsKey("accessibility"))
        {
            try
            {
                var accessibilityJson = preferences["accessibility"].ToString();
                if (!string.IsNullOrEmpty(accessibilityJson))
                {
                    return JsonSerializer.Deserialize<AccessibilitySettings>(accessibilityJson) 
                        ?? new AccessibilitySettings();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize accessibility settings");
            }
        }

        return new AccessibilitySettings
        {
            FontSize = 16,
            HighContrast = false,
            ScreenReader = false,
            ReducedMotion = false,
            Language = "en",
            Theme = "light"
        };
    }
}

// Data models
public class UserSettings
{
    public ProfileSettings Profile { get; set; } = new();
    public NotificationSettings Notifications { get; set; } = new();
    public PrivacySettings Privacy { get; set; } = new();
    public SecuritySettings Security { get; set; } = new();
    public AccessibilitySettings Accessibility { get; set; } = new();
}

public class ProfileSettings
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string DateOfBirth { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string EmergencyContact { get; set; } = string.Empty;
    public string EmergencyPhone { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public class NotificationSettings
{
    public bool Appointments { get; set; } = true;
    public bool LabResults { get; set; } = true;
    public bool Prescriptions { get; set; } = true;
    public bool Messages { get; set; } = true;
    public bool Promotions { get; set; } = false;
    public NotificationChannels Channels { get; set; } = new();
    public QuietHours QuietHours { get; set; } = new();
}

public class NotificationChannels
{
    public bool Email { get; set; } = true;
    public bool Sms { get; set; } = true;
    public bool Push { get; set; } = true;
    public bool Phone { get; set; } = false;
}

public class QuietHours
{
    public bool Enabled { get; set; }
    public string Start { get; set; } = string.Empty;
    public string End { get; set; } = string.Empty;
}

public class PrivacySettings
{
    public bool ShareData { get; set; }
    public bool MarketingEmails { get; set; }
    public bool AnonymousAnalytics { get; set; } = true;
    public string[] ThirdPartyAccess { get; set; } = Array.Empty<string>();
}

public class SecuritySettings
{
    public bool TwoFactorEnabled { get; set; }
    public bool LoginAlerts { get; set; } = true;
    public int SessionTimeout { get; set; } = 30;
    public string PasswordLastChanged { get; set; } = string.Empty;
}

public class AccessibilitySettings
{
    public int FontSize { get; set; } = 16;
    public bool HighContrast { get; set; }
    public bool ScreenReader { get; set; }
    public bool ReducedMotion { get; set; }
    public string Language { get; set; } = "en";
    public string Theme { get; set; } = "light";
}

public class UserAddress
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}
