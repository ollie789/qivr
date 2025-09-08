using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Qivr.Core.Interfaces;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using System.Text.Json;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ILogger<ProfileController> _logger;
    private readonly QivrDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly IAmazonCognitoIdentityProvider _cognitoClient;
    private readonly IConfiguration _configuration;
    
    public ProfileController(
        ILogger<ProfileController> logger,
        QivrDbContext dbContext,
        IStorageService storageService,
        IAmazonCognitoIdentityProvider cognitoClient,
        IConfiguration configuration)
    {
        _logger = logger;
        _dbContext = dbContext;
        _storageService = storageService;
        _cognitoClient = cognitoClient;
        _configuration = configuration;
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
        
        try
        {
            // Get tenant ID from claims
            var tenantId = User.FindFirst("custom:tenant_id")?.Value ?? 
                          User.FindFirst("tenant_id")?.Value;
            
            // Fetch user profile from database
            var userGuid = Guid.Parse(userId);
            var user = await _dbContext.Database
                .SqlQuery<UserData>($@"
                    SELECT id, email, first_name, last_name, phone, 
                           date_of_birth, gender, address, city, state, postcode,
                           photo_url, email_verified, phone_verified,
                           profile_data, preferences
                    FROM qivr.users 
                    WHERE id = {userGuid}
                    LIMIT 1")
                .FirstOrDefaultAsync();
                
            if (user == null)
            {
                return NotFound(new { message = "User profile not found" });
            }
            
            // Parse JSON fields
            var profileData = user.ProfileData != null 
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(user.ProfileData) 
                : new Dictionary<string, object>();
                
            var preferences = user.Preferences != null
                ? JsonSerializer.Deserialize<PreferencesDto>(user.Preferences)
                : new PreferencesDto();
            
            // Build response
            var profile = new UserProfileDto
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
                Gender = user.Gender,
                Address = user.Address,
                City = user.City,
                State = user.State,
                Postcode = user.Postcode,
                PhotoUrl = user.PhotoUrl,
                EmailVerified = user.EmailVerified,
                PhoneVerified = user.PhoneVerified,
                Preferences = preferences
            };
            
            // Extract emergency contact if exists
            if (profileData.ContainsKey("emergencyContact"))
            {
                profile.EmergencyContact = JsonSerializer.Deserialize<EmergencyContactDto>(
                    profileData["emergencyContact"].ToString()!);
            }
            
            // Extract medical info if exists
            if (profileData.ContainsKey("medicalInfo"))
            {
                profile.MedicalInfo = JsonSerializer.Deserialize<MedicalInfoDto>(
                    profileData["medicalInfo"].ToString()!);
            }
            
            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching profile for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while fetching your profile" });
        }
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
            var userGuid = Guid.Parse(userId);
            
            // Build profile data JSON
            var profileData = new Dictionary<string, object>();
            if (updateDto.EmergencyContact != null)
            {
                profileData["emergencyContact"] = updateDto.EmergencyContact;
            }
            if (updateDto.MedicalInfo != null)
            {
                profileData["medicalInfo"] = updateDto.MedicalInfo;
            }
            
            var profileJson = JsonSerializer.Serialize(profileData);
            var preferencesJson = updateDto.Preferences != null 
                ? JsonSerializer.Serialize(updateDto.Preferences) 
                : null;
            
            // Update user profile in database
            await _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE qivr.users 
                SET 
                    first_name = COALESCE({updateDto.FirstName}, first_name),
                    last_name = COALESCE({updateDto.LastName}, last_name),
                    phone = COALESCE({updateDto.Phone}, phone),
                    date_of_birth = COALESCE({updateDto.DateOfBirth != null ? DateTime.Parse(updateDto.DateOfBirth) : (DateTime?)null}, date_of_birth),
                    gender = COALESCE({updateDto.Gender}, gender),
                    address = COALESCE({updateDto.Address}, address),
                    city = COALESCE({updateDto.City}, city),
                    state = COALESCE({updateDto.State}, state),
                    postcode = COALESCE({updateDto.Postcode}, postcode),
                    profile_data = CASE WHEN {profileJson}::jsonb != '{}'::jsonb THEN {profileJson}::jsonb ELSE profile_data END,
                    preferences = COALESCE({preferencesJson}::jsonb, preferences),
                    updated_at = NOW()
                WHERE id = {userGuid}");
            
            _logger.LogInformation("Profile updated for user {UserId}", userId);
            
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
            var userGuid = Guid.Parse(userId);
            
            // Generate unique filename
            var fileExtension = Path.GetExtension(photo.FileName);
            var fileName = $"profile-photos/{userId}/{Guid.NewGuid()}{fileExtension}";
            
            // Upload to S3/MinIO
            using var stream = photo.OpenReadStream();
            var photoUrl = await _storageService.UploadFileAsync(
                stream, 
                fileName, 
                photo.ContentType,
                new Dictionary<string, string>
                {
                    ["user-id"] = userId,
                    ["upload-date"] = DateTime.UtcNow.ToString("O")
                }
            );
            
            // Update user profile with photo URL
            await _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE qivr.users 
                SET 
                    photo_url = {photoUrl},
                    updated_at = NOW()
                WHERE id = {userGuid}");
            
            _logger.LogInformation("Photo uploaded for user {UserId}, URL: {PhotoUrl}", userId, photoUrl);
            
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
        var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(accessToken))
        {
            return Unauthorized();
        }
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        try
        {
            // Change password in Cognito
            var changePasswordRequest = new ChangePasswordRequest
            {
                AccessToken = accessToken,
                PreviousPassword = changePasswordDto.CurrentPassword,
                ProposedPassword = changePasswordDto.NewPassword
            };
            
            var response = await _cognitoClient.ChangePasswordAsync(changePasswordRequest);
            
            if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
            {
                _logger.LogInformation("Password changed successfully for user {UserId}", userId);
                return NoContent();
            }
            else
            {
                _logger.LogWarning("Password change failed for user {UserId}, Status: {Status}", 
                    userId, response.HttpStatusCode);
                return BadRequest(new { message = "Failed to change password" });
            }
        }
        catch (NotAuthorizedException ex)
        {
            _logger.LogWarning(ex, "Invalid current password for user {UserId}", userId);
            return BadRequest(new { message = "Current password is incorrect" });
        }
        catch (InvalidPasswordException ex)
        {
            _logger.LogWarning(ex, "Invalid new password for user {UserId}", userId);
            return BadRequest(new { message = "New password does not meet requirements" });
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
            // TODO: Send verification email
            _logger.LogInformation("Email verification requested for user {UserId}", userId);
            
            // Simulate sending email
            await Task.Delay(100);
            
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
            // TODO: Verify the confirmation code
            // TODO: Update phone verification status
            
            _logger.LogInformation("Phone confirmed for user {UserId}", userId);
            
            // Simulate verification
            await Task.Delay(100);
            
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
            // TODO: Soft delete or hard delete user account
            // TODO: Clean up related data
            // TODO: Notify relevant services
            
            _logger.LogWarning("Account deletion requested for user {UserId}", userId);
            
            // Simulate deletion
            await Task.Delay(100);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while deleting your account" });
        }
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

// Internal data model for database query
internal class UserData
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Postcode { get; set; }
    public string? PhotoUrl { get; set; }
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
    public string? ProfileData { get; set; }
    public string? Preferences { get; set; }
}
