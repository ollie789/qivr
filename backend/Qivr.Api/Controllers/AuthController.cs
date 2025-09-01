using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Qivr.Api.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ICognitoAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ICognitoAuthService authService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.AuthenticateAsync(request.Username, request.Password);
        
        if (!result.Success)
        {
            if (result.RequiresMfa)
            {
                return Ok(new
                {
                    requiresMfa = true,
                    session = result.Session
                });
            }
            
            return Unauthorized(new { message = result.ErrorMessage });
        }

        // Set tokens as httpOnly cookies
        SetAuthCookies(result.AccessToken!, result.RefreshToken!, result.ExpiresIn!.Value);

        // Return user info without tokens
        return Ok(new 
        {
            expiresIn = result.ExpiresIn!.Value,
            userInfo = result.UserInfo
        });
    }

    [HttpPost("signup")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.SignUpAsync(request);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });

        return Ok(new
        {
            userSub = result.UserSub,
            userConfirmed = result.UserConfirmed,
            codeDeliveryDetails = result.CodeDeliveryDetails
        });
    }

    [HttpPost("confirm-signup")]
    public async Task<IActionResult> ConfirmSignUp([FromBody] ConfirmSignUpRequest request)
    {
        var success = await _authService.ConfirmSignUpAsync(request.Username, request.ConfirmationCode);
        
        if (!success)
            return BadRequest(new { message = "Confirmation failed" });

        return Ok(new { message = "Account confirmed successfully" });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
        // Get refresh token from cookie
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "No refresh token provided" });

        var result = await _authService.RefreshTokenAsync(refreshToken);
        
        if (!result.Success)
        {
            // Clear invalid cookies
            ClearAuthCookies();
            return Unauthorized(new { message = result.ErrorMessage });
        }

        // REFRESH TOKEN ROTATION: Always issue a new refresh token
        // This prevents token replay attacks
        var newRefreshToken = result.RefreshToken ?? GenerateNewRefreshToken();
        
        // Update cookies with new tokens (including rotated refresh token)
        SetAuthCookies(result.AccessToken!, newRefreshToken, result.ExpiresIn!.Value);
        
        // Invalidate the old refresh token in the backend
        await _authService.InvalidateRefreshTokenAsync(refreshToken);

        return Ok(new
        {
            expiresIn = result.ExpiresIn
        });
    }
    
    private string GenerateNewRefreshToken()
    {
        // Generate a cryptographically secure refresh token
        var randomBytes = new byte[64];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("password-reset")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var success = await _authService.InitiateForgotPasswordAsync(request.Username);
        
        if (!success)
            return BadRequest(new { message = "Failed to initiate password reset" });

        return Ok(new { message = "Password reset code sent" });
    }

    [HttpPost("confirm-forgot-password")]
    [EnableRateLimiting("password-reset")]
    public async Task<IActionResult> ConfirmForgotPassword([FromBody] ConfirmForgotPasswordRequest request)
    {
        var success = await _authService.ConfirmForgotPasswordAsync(
            request.Username, 
            request.ConfirmationCode, 
            request.NewPassword);
        
        if (!success)
            return BadRequest(new { message = "Failed to reset password" });

        return Ok(new { message = "Password reset successfully" });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        // Try to get token from cookie first, fallback to header
        var accessToken = Request.Cookies["accessToken"] ?? 
                         Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        var success = await _authService.ChangePasswordAsync(
            accessToken, 
            request.OldPassword, 
            request.NewPassword);
        
        if (!success)
            return BadRequest(new { message = "Failed to change password" });

        return Ok(new { message = "Password changed successfully" });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        // Try to get token from cookie first, fallback to header
        var accessToken = Request.Cookies["accessToken"] ?? 
                         Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        var success = await _authService.SignOutAsync(accessToken);
        
        // Clear cookies regardless of backend sign-out success
        ClearAuthCookies();
        
        if (!success)
            _logger.LogWarning("Backend sign-out failed but cookies cleared");

        return Ok(new { message = "Signed out successfully" });
    }

    [HttpPost("mfa/setup")]
    [Authorize]
    public async Task<IActionResult> SetupMfa()
    {
        var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var success = await _authService.SetupMfaAsync(accessToken);
        
        if (!success)
            return BadRequest(new { message = "Failed to setup MFA" });

        return Ok(new { message = "MFA setup initiated" });
    }

    [HttpPost("mfa/verify")]
    public async Task<IActionResult> VerifyMfa([FromBody] VerifyMfaRequest request)
    {
        var success = await _authService.VerifyMfaAsync(request.Session, request.MfaCode);
        
        if (!success)
            return BadRequest(new { message = "Invalid MFA code" });

        return Ok(new { message = "MFA verified successfully" });
    }

    [HttpGet("user-info")]
    [Authorize]
    public async Task<IActionResult> GetUserInfo()
    {
        var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var userInfo = await _authService.GetUserInfoAsync(accessToken);
        
        return Ok(userInfo);
    }

    [HttpPut("user-attributes")]
    [Authorize]
    public async Task<IActionResult> UpdateUserAttributes([FromBody] Dictionary<string, string> attributes)
    {
        var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var success = await _authService.UpdateUserAttributesAsync(accessToken, attributes);
        
        if (!success)
            return BadRequest(new { message = "Failed to update attributes" });

        return Ok(new { message = "Attributes updated successfully" });
    }

    [HttpPost("social/callback/{provider}")]
    public async Task<IActionResult> SocialCallback(string provider, [FromBody] SocialCallbackRequest request)
    {
        var result = await _authService.SocialSignInAsync(provider, request.AuthorizationCode);
        
        if (!result.Success)
            return Unauthorized(new { message = result.ErrorMessage });

        // Set cookies for social login too
        SetAuthCookies(result.AccessToken!, result.RefreshToken!, result.ExpiresIn!.Value);

        return Ok(new
        {
            expiresIn = result.ExpiresIn!.Value
        });
    }
    
    // Helper methods for cookie management
    private void SetAuthCookies(string accessToken, string refreshToken, int expiresInSeconds)
    {
        // Access token cookie
        var accessTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.Host.Host.Contains("localhost"), // Allow non-secure for localhost
            SameSite = SameSiteMode.Lax, // Lax to support OAuth redirects
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds)
        };
        Response.Cookies.Append("accessToken", accessToken, accessTokenOptions);

        // Refresh token cookie (longer expiry)
        var refreshTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.Host.Host.Contains("localhost"),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(30) // 30 days
        };
        Response.Cookies.Append("refreshToken", refreshToken, refreshTokenOptions);
    }

    private void ClearAuthCookies()
    {
        var clearOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.Request.Host.Host.Contains("localhost"),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        };
        
        Response.Cookies.Delete("accessToken", clearOptions);
        Response.Cookies.Delete("refreshToken", clearOptions);
    }
}

// Request/Response DTOs
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string IdToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
}

public class ConfirmSignUpRequest
{
    public string Username { get; set; } = string.Empty;
    public string ConfirmationCode { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Username { get; set; } = string.Empty;
}

public class ConfirmForgotPasswordRequest
{
    public string Username { get; set; } = string.Empty;
    public string ConfirmationCode { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class VerifyMfaRequest
{
    public string Session { get; set; } = string.Empty;
    public string MfaCode { get; set; } = string.Empty;
}

public class SocialCallbackRequest
{
    public string AuthorizationCode { get; set; } = string.Empty;
}
