using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ILogger<ProfileController> _logger;
    private readonly IProfileService _profileService;
    
    public ProfileController(ILogger<ProfileController> logger, IProfileService profileService)
    {
        _logger = logger;
        _profileService = profileService;
    }
    
    // GET: api/profile
    [HttpGet]
    [ProducesResponseType(typeof(UserProfileDto), 200)]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        
        // Get tenant ID
        var tenantId = GetTenantId();
        if (!Guid.TryParse(userId, out var userGuid))
        {
            return BadRequest("Invalid user ID");
        }
        
        // Fetch actual user profile from database
        var profile = await _profileService.GetUserProfileAsync(tenantId, userGuid);
        if (profile == null)
        {
            return NotFound("User profile not found");
        }
        
        // Convert to DTO
        var profileDto = new UserProfileDto
        {
            Id = profile.Id.ToString(),
            Email = profile.Email,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            Phone = profile.Phone,
            DateOfBirth = profile.DateOfBirth?.ToString("yyyy-MM-dd"),
            Gender = profile.Gender,
            Address = profile.Address?.Street,
            City = profile.Address?.City,
            State = profile.Address?.State,
            Postcode = profile.Address?.PostalCode,
            EmergencyContact = profile.EmergencyContact != null ? new EmergencyContactDto
            {
                Name = profile.EmergencyContact.Name,
                Relationship = profile.EmergencyContact.Relationship,
                Phone = profile.EmergencyContact.Phone
            } : null,
            MedicalInfo = profile.MedicalInfo != null ? new MedicalInfoDto
            {
                BloodType = profile.MedicalInfo.BloodType,
                Allergies = profile.MedicalInfo.Allergies?.ToArray(),
                Medications = profile.MedicalInfo.Medications?.ToArray(),
                Conditions = profile.MedicalInfo.Conditions?.ToArray()
            } : null,
            Preferences = profile.Preferences != null ? new PreferencesDto
            {
                EmailNotifications = profile.Preferences.EmailNotifications,
                SmsNotifications = profile.Preferences.SmsNotifications,
                AppointmentReminders = profile.Preferences.AppointmentReminders,
                MarketingEmails = profile.Preferences.MarketingEmails
            } : null,
            PhotoUrl = profile.PhotoUrl,
            EmailVerified = profile.EmailVerified,
            PhoneVerified = profile.PhoneVerified
        };
        
        return Ok(profileDto);
    }
    
    // PUT: api/profile
    [HttpPut]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateProfile([FromBody] UserProfileUpdateDto updateDto)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        
        // Validate the update
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        try
        {
            // Get tenant ID
            var tenantId = GetTenantId();
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest("Invalid user ID");
            }
            
            // Convert DTO to service model
            var update = new UserProfileUpdate
            {
                FirstName = updateDto.FirstName,
                LastName = updateDto.LastName,
                Phone = updateDto.Phone,
                DateOfBirth = !string.IsNullOrEmpty(updateDto.DateOfBirth) 
                    ? DateTime.Parse(updateDto.DateOfBirth) 
                    : null,
                Gender = updateDto.Gender,
                Address = !string.IsNullOrEmpty(updateDto.Address) ? new ProfileAddress
                {
                    Street = updateDto.Address,
                    City = updateDto.City ?? "",
                    State = updateDto.State ?? "",
                    PostalCode = updateDto.Postcode ?? "",
                    Country = "USA"
                } : null,
                EmergencyContact = updateDto.EmergencyContact != null ? new EmergencyContact
                {
                    Name = updateDto.EmergencyContact.Name,
                    Relationship = updateDto.EmergencyContact.Relationship,
                    Phone = updateDto.EmergencyContact.Phone
                } : null,
                MedicalInfo = updateDto.MedicalInfo != null ? new MedicalInfo
                {
                    BloodType = updateDto.MedicalInfo.BloodType,
                    Allergies = updateDto.MedicalInfo.Allergies?.ToList() ?? new List<string>(),
                    Medications = updateDto.MedicalInfo.Medications?.ToList() ?? new List<string>(),
                    Conditions = updateDto.MedicalInfo.Conditions?.ToList() ?? new List<string>()
                } : null,
                Preferences = updateDto.Preferences != null ? new UserPreferences
                {
                    EmailNotifications = updateDto.Preferences.EmailNotifications,
                    SmsNotifications = updateDto.Preferences.SmsNotifications,
                    AppointmentReminders = updateDto.Preferences.AppointmentReminders,
                    MarketingEmails = updateDto.Preferences.MarketingEmails
                } : null
            };
            
            // Update user profile in database
            await _profileService.UpdateUserProfileAsync(tenantId, userGuid, update);
            _logger.LogInformation("Updated profile for user {UserId}", userId);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while updating your profile" });
        }
    }
    
    // POST: api/profile/photo
    [HttpPost("photo")]
    [ProducesResponseType(typeof(PhotoUploadResponseDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UploadPhoto([FromForm] IFormFile photo)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        
        if (photo == null || photo.Length == 0)
        {
            return BadRequest(new { message = "No photo provided" });
        }
        
        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
        if (!allowedTypes.Contains(photo.ContentType.ToLower()))
        {
            return BadRequest(new { message = "Invalid file type. Only JPEG, PNG, and GIF are allowed." });
        }
        
        // Validate file size (max 5MB)
        if (photo.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "File size too large. Maximum size is 5MB." });
        }
        
        try
        {
            // Get tenant ID
            var tenantId = GetTenantId();
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest("Invalid user ID");
            }
            
            // Read photo data
            using var memoryStream = new MemoryStream();
            await photo.CopyToAsync(memoryStream);
            var photoData = memoryStream.ToArray();
            
            // Save photo to storage and update user profile
            var photoUrl = await _profileService.UploadPhotoAsync(tenantId, userGuid, photoData, photo.ContentType);
            
            _logger.LogInformation("Photo uploaded for user {UserId}", userId);
            
            return Ok(new PhotoUploadResponseDto
            {
                PhotoUrl = photoUrl,
                Message = "Photo uploaded successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading photo for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while uploading your photo" });
        }
    }
    
    // POST: api/profile/change-password
    [HttpPost("change-password")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        try
        {
            // TODO: Verify current password
            // TODO: Update password in authentication provider (Cognito, Auth0, etc.)
            
            _logger.LogInformation("Password changed for user {UserId}", userId);
            
            // Simulate processing
            await Task.Delay(100);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while changing your password" });
        }
    }
    
    // POST: api/profile/verify-email
    [HttpPost("verify-email")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> VerifyEmail()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }
        
        try
        {
            // Get tenant ID
            var tenantId = GetTenantId();
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest("Invalid user ID");
            }
            
            // TODO: Send actual verification email via email service
            _logger.LogInformation("Email verification requested for user {UserId}", userId);
            
            // For now, just mark as verified
            await _profileService.UpdateEmailVerificationStatusAsync(tenantId, userGuid, true);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending verification email for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while sending verification email" });
        }
    }
    
    // POST: api/profile/verify-phone
    [HttpPost("verify-phone")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> VerifyPhone([FromBody] VerifyPhoneDto verifyPhoneDto)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        
        try
        {
            // TODO: Send SMS verification code
            _logger.LogInformation("Phone verification requested for user {UserId}", userId);
            
            // Simulate sending SMS
            await Task.Delay(100);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending phone verification for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while sending verification code" });
        }
    }
    
    // POST: api/profile/confirm-phone
    [HttpPost("confirm-phone")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ConfirmPhone([FromBody] ConfirmPhoneDto confirmPhoneDto)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        
        try
        {
            // Get tenant ID
            var tenantId = GetTenantId();
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest("Invalid user ID");
            }
            
            // TODO: Verify the actual confirmation code
            // For now, just mark as verified
            await _profileService.UpdatePhoneVerificationStatusAsync(tenantId, userGuid, true);
            
            _logger.LogInformation("Phone confirmed for user {UserId}", userId);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming phone for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while confirming your phone" });
        }
    }
    
    // DELETE: api/profile
    [HttpDelete]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountDto deleteAccountDto)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        
        if (!deleteAccountDto.ConfirmDeletion)
        {
            return BadRequest(new { message = "Account deletion must be confirmed" });
        }
        
        try
        {
            // Get tenant ID
            var tenantId = GetTenantId();
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest("Invalid user ID");
            }
            
            // Soft delete user account
            await _profileService.DeleteUserAccountAsync(tenantId, userGuid);
            
            _logger.LogWarning("Account deletion completed for user {UserId}", userId);
            
            // TODO: Notify relevant services about account deletion
            // TODO: Clean up authentication provider (Cognito, Auth0, etc.)
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while deleting your account" });
        }
    }
    
    // Helper method to get tenant ID from claims
    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }
        // For dev/testing, return a default tenant ID
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
}

// DTOs
public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Postcode { get; set; }
    public EmergencyContactDto? EmergencyContact { get; set; }
    public MedicalInfoDto? MedicalInfo { get; set; }
    public PreferencesDto? Preferences { get; set; }
    public string? PhotoUrl { get; set; }
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
}

public class UserProfileUpdateDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Postcode { get; set; }
    public EmergencyContactDto? EmergencyContact { get; set; }
    public MedicalInfoDto? MedicalInfo { get; set; }
    public PreferencesDto? Preferences { get; set; }
}

public class EmergencyContactDto
{
    public string Name { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class MedicalInfoDto
{
    public string? BloodType { get; set; }
    public string[]? Allergies { get; set; }
    public string[]? Medications { get; set; }
    public string[]? Conditions { get; set; }
}

public class PreferencesDto
{
    public bool EmailNotifications { get; set; }
    public bool SmsNotifications { get; set; }
    public bool AppointmentReminders { get; set; }
    public bool MarketingEmails { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class PhotoUploadResponseDto
{
    public string PhotoUrl { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class VerifyPhoneDto
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class ConfirmPhoneDto
{
    public string Code { get; set; } = string.Empty;
}

public class DeleteAccountDto
{
    public bool ConfirmDeletion { get; set; }
    public string? Reason { get; set; }
}
