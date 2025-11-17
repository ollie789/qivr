using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Services;

public interface IProfileService
{
    Task<UserProfile?> GetUserProfileAsync(Guid tenantId, Guid userId);
    Task UpdateUserProfileAsync(Guid tenantId, Guid userId, UserProfileUpdate update);
    Task<string> UploadPhotoAsync(Guid tenantId, Guid userId, byte[] photoData, string contentType);
    Task UpdateEmailVerificationStatusAsync(Guid tenantId, Guid userId, bool verified);
    Task UpdatePhoneVerificationStatusAsync(Guid tenantId, Guid userId, bool verified);
    Task DeleteUserAccountAsync(Guid tenantId, Guid userId);
}

public class ProfileService : IProfileService
{
    private readonly QivrDbContext _db;
    private readonly ILogger<ProfileService> _logger;

    public ProfileService(QivrDbContext db, ILogger<ProfileService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<UserProfile?> GetUserProfileAsync(Guid tenantId, Guid userId)
        {
            var user = await _db.Users
                .Where(u => u.TenantId == tenantId && u.Id == userId)
                .FirstOrDefaultAsync();

        if (user == null) return null;

        user.Preferences ??= new Dictionary<string, object>();

        // Get emergency contact from preferences or separate table
        var emergencyContact = user.Preferences?.ContainsKey("emergencyContact") == true
            ? JsonSerializer.Deserialize<EmergencyContact>(user.Preferences["emergencyContact"].ToString() ?? "{}")
            : null;

        // Get medical info from patient record
        MedicalInfo? medicalInfo = null;
        try
        {
            var medicalInfoSql = @"
                SELECT medical_history FROM patient_records 
                WHERE tenant_id = {0} AND patient_id = {1}
                LIMIT 1";

            var historyJson = await _db.Database
                .SqlQueryRaw<string>(medicalInfoSql, tenantId, userId)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(historyJson))
            {
                try
                {
                    var history = JsonSerializer.Deserialize<MedicalHistory>(historyJson);
                    medicalInfo = new MedicalInfo
                    {
                        BloodType = user.Preferences?.ContainsKey("bloodType") == true
                            ? user.Preferences["bloodType"].ToString()
                            : null,
                        Allergies = history?.Allergies ?? new List<string>(),
                        Medications = history?.CurrentMedications?.Select(m => $"{m.Name} {m.Dosage}").ToList() ?? new List<string>(),
                        Conditions = history?.ChronicConditions ?? new List<string>()
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize medical history for user {UserId}", userId);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load medical history for user {UserId}", userId);
        }

        // Get preferences
        var preferences = new UserPreferences
        {
            EmailNotifications = user.Preferences?.ContainsKey("emailNotifications") == true && 
                                Convert.ToBoolean(user.Preferences["emailNotifications"]),
            SmsNotifications = user.Preferences?.ContainsKey("smsNotifications") == true && 
                              Convert.ToBoolean(user.Preferences["smsNotifications"]),
            AppointmentReminders = user.Preferences?.ContainsKey("appointmentReminders") == true && 
                                  Convert.ToBoolean(user.Preferences["appointmentReminders"]),
            MarketingEmails = user.Preferences?.ContainsKey("marketingEmails") == true && 
                             Convert.ToBoolean(user.Preferences["marketingEmails"])
        };

        return new UserProfile
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            DateOfBirth = user.DateOfBirth,
            Gender = user.Gender,
            Address = ConvertToProfileAddress(user.Preferences),
            EmergencyContact = emergencyContact,
            MedicalInfo = medicalInfo,
            Preferences = preferences,
            PhotoUrl = user.Preferences?.ContainsKey("profilePhotoUrl") == true ? user.Preferences["profilePhotoUrl"].ToString() : null,
            EmailVerified = user.EmailVerified,
            PhoneVerified = user.PhoneVerified
        };
    }

    public async Task UpdateUserProfileAsync(Guid tenantId, Guid userId, UserProfileUpdate update)
    {
        var user = await _db.Users
            .Where(u => u.TenantId == tenantId && u.Id == userId)
            .FirstOrDefaultAsync();

        if (user == null) throw new InvalidOperationException("User not found");

        // Update basic info
        if (!string.IsNullOrEmpty(update.FirstName))
            user.FirstName = update.FirstName;
        
        if (!string.IsNullOrEmpty(update.LastName))
            user.LastName = update.LastName;
        
        if (!string.IsNullOrEmpty(update.Phone))
            user.Phone = update.Phone;
        
        if (update.DateOfBirth.HasValue)
            user.DateOfBirth = update.DateOfBirth.Value;
        
        if (!string.IsNullOrEmpty(update.Gender))
            user.Gender = update.Gender;
        
        // Update address in preferences
        if (update.Address != null)
        {
            user.Preferences["address"] = JsonSerializer.Serialize(update.Address);
        }

        // Update preferences
        if (user.Preferences == null)
            user.Preferences = new Dictionary<string, object>();

        if (update.EmergencyContact != null)
        {
            user.Preferences["emergencyContact"] = JsonSerializer.Serialize(update.EmergencyContact);
        }

        if (update.Preferences != null)
        {
            user.Preferences["emailNotifications"] = update.Preferences.EmailNotifications;
            user.Preferences["smsNotifications"] = update.Preferences.SmsNotifications;
            user.Preferences["appointmentReminders"] = update.Preferences.AppointmentReminders;
            user.Preferences["marketingEmails"] = update.Preferences.MarketingEmails;
        }

        // Update medical info if provided
        if (update.MedicalInfo != null)
        {
            if (!string.IsNullOrEmpty(update.MedicalInfo.BloodType))
            {
                user.Preferences["bloodType"] = update.MedicalInfo.BloodType;
            }

            // Update medical history in patient_records table
            var updateSql = @"
                UPDATE qivr.patient_records 
                SET medical_history = jsonb_set(
                    COALESCE(medical_history, '{}'::jsonb),
                    '{Allergies}',
                    {0}::jsonb
                )
                WHERE tenant_id = {1} AND patient_id = {2}";
            
            if (update.MedicalInfo.Allergies != null)
            {
                await _db.Database.ExecuteSqlRawAsync(updateSql,
                    JsonSerializer.Serialize(update.MedicalInfo.Allergies),
                    tenantId,
                    userId);
            }

            if (update.MedicalInfo.Conditions != null)
            {
                updateSql = @"
                    UPDATE qivr.patient_records 
                    SET medical_history = jsonb_set(
                        COALESCE(medical_history, '{}'::jsonb),
                        '{ChronicConditions}',
                        {0}::jsonb
                    )
                    WHERE tenant_id = {1} AND patient_id = {2}";
                
                await _db.Database.ExecuteSqlRawAsync(updateSql,
                    JsonSerializer.Serialize(update.MedicalInfo.Conditions),
                    tenantId,
                    userId);
            }
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<string> UploadPhotoAsync(Guid tenantId, Guid userId, byte[] photoData, string contentType)
    {
        // Use document service to store photo
        var fileName = $"profile-photo-{userId}.{GetExtensionFromMimeType(contentType)}";
        
        var document = new Document
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = userId,
            FileName = fileName,
            DocumentType = "Profile Photo",
            MimeType = contentType,
            FileSize = photoData.Length,
            S3Key = $"profiles/{tenantId}/{userId}/{fileName}",
            S3Bucket = "qivr-documents-prod",
            Status = "ready",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Store the actual file (simplified - in production would use proper storage service)
        // For now, just save the path reference
        _db.Documents.Add(document);
        
        // Update user record with photo URL
        var user = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == userId);
        if (user != null)
        {
            user.Preferences["profilePhotoUrl"] = document.S3Key;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return document.S3Key;
    }

    public async Task UpdateEmailVerificationStatusAsync(Guid tenantId, Guid userId, bool verified)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == userId);
        if (user != null)
        {
            user.EmailVerified = verified;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task UpdatePhoneVerificationStatusAsync(Guid tenantId, Guid userId, bool verified)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == userId);
        if (user != null)
        {
            user.PhoneVerified = verified;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task DeleteUserAccountAsync(Guid tenantId, Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == userId);
        if (user != null)
        {
            // Soft delete - just mark as deleted
            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            
            // Anonymize personal data
            user.Email = $"deleted-{userId}@deleted.com";
            user.FirstName = "Deleted";
            user.LastName = "User";
            user.Phone = null;
            user.DateOfBirth = null;
            user.Gender = null;
            user.Preferences["address"] = null;
            user.Preferences["profilePhotoUrl"] = null;
            user.Preferences = new Dictionary<string, object> { ["deleted"] = true };
            
            await _db.SaveChangesAsync();
            
            _logger.LogInformation("User account {UserId} soft deleted for tenant {TenantId}", userId, tenantId);
        }
    }

    private static string GetExtensionFromMimeType(string mimeType)
    {
        return mimeType?.ToLower() switch
        {
            "image/jpeg" or "image/jpg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            "image/webp" => "webp",
            _ => "jpg"
        };
    }
    
    private static ProfileAddress? ConvertToProfileAddress(Dictionary<string, object>? preferences)
    {
        if (preferences?.ContainsKey("address") == true)
        {
            try
            {
                return JsonSerializer.Deserialize<ProfileAddress>(preferences["address"].ToString() ?? "{}");
            }
            catch
            {
                return null;
            }
        }
        return null;
    }
}

// Service models
public class UserProfile
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public ProfileAddress? Address { get; set; }
    public EmergencyContact? EmergencyContact { get; set; }
    public MedicalInfo? MedicalInfo { get; set; }
    public UserPreferences? Preferences { get; set; }
    public string? PhotoUrl { get; set; }
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
}

public class UserProfileUpdate
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public ProfileAddress? Address { get; set; }
    public EmergencyContact? EmergencyContact { get; set; }
    public MedicalInfo? MedicalInfo { get; set; }
    public UserPreferences? Preferences { get; set; }
}

public class ProfileAddress
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

public class EmergencyContact
{
    public string Name { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class MedicalInfo
{
    public string? BloodType { get; set; }
    public List<string> Allergies { get; set; } = new();
    public List<string> Medications { get; set; } = new();
    public List<string> Conditions { get; set; } = new();
}

public class UserPreferences
{
    public bool EmailNotifications { get; set; }
    public bool SmsNotifications { get; set; }
    public bool AppointmentReminders { get; set; }
    public bool MarketingEmails { get; set; }
}
