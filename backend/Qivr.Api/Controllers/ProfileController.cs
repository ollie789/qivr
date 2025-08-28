using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ILogger<ProfileController> _logger;
    
    public ProfileController(ILogger<ProfileController> logger)
    {
        _logger = logger;
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
        
        // TODO: Fetch actual user profile from database
        // For now, return mock data
        var profile = new UserProfileDto
        {
            Id = userId,
            Email = User.FindFirst(ClaimTypes.Email)?.Value ?? "user@example.com",
            FirstName = "John",
            LastName = "Doe",
            Phone = "+1-555-0123",
            DateOfBirth = "1985-03-15",
            Gender = "male",
            Address = "123 Main St",
            City = "Springfield",
            State = "IL",
            Postcode = "62701",
            EmergencyContact = new EmergencyContactDto
            {
                Name = "Jane Doe",
                Relationship = "Spouse",
                Phone = "+1-555-0124"
            },
            MedicalInfo = new MedicalInfoDto
            {
                BloodType = "O+",
                Allergies = new[] { "Penicillin", "Peanuts" },
                Medications = new[] { "Metformin 500mg", "Lisinopril 10mg" },
                Conditions = new[] { "Diabetes Type 2", "Hypertension" }
            },
            Preferences = new PreferencesDto
            {
                EmailNotifications = true,
                SmsNotifications = true,
                AppointmentReminders = true,
                MarketingEmails = false
            },
            PhotoUrl = null,
            EmailVerified = true,
            PhoneVerified = false
        };
        
        return Ok(profile);
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
            // TODO: Update user profile in database
            _logger.LogInformation("Updating profile for user {UserId}", userId);
            
            // Simulate processing
            await Task.Delay(100);
            
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
            // TODO: Save photo to storage (e.g., S3, Azure Blob, etc.)
            // TODO: Update user profile with photo URL
            
            var photoUrl = $"https://storage.example.com/profiles/{userId}/{Guid.NewGuid()}.jpg";
            
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
