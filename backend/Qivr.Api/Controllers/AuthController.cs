using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        return Ok(new 
        {
            accessToken = result.AccessToken!,
            refreshToken = result.RefreshToken!,
            idToken = result.IdToken!,
            expiresIn = result.ExpiresIn!.Value,
            userInfo = result.UserInfo
        });
    }

    [HttpPost("signup")]
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
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken);
        
        if (!result.Success)
            return Unauthorized(new { message = result.ErrorMessage });

        return Ok(new
        {
            accessToken = result.AccessToken,
            idToken = result.IdToken,
            expiresIn = result.ExpiresIn
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var success = await _authService.InitiateForgotPasswordAsync(request.Username);
        
        if (!success)
            return BadRequest(new { message = "Failed to initiate password reset" });

        return Ok(new { message = "Password reset code sent" });
    }

    [HttpPost("confirm-forgot-password")]
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
        var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
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
        var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var success = await _authService.SignOutAsync(accessToken);
        
        if (!success)
            return BadRequest(new { message = "Failed to sign out" });

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

        return Ok(new LoginResponse
        {
            AccessToken = result.AccessToken!,
            RefreshToken = result.RefreshToken!,
            IdToken = result.IdToken!,
            ExpiresIn = result.ExpiresIn!.Value
        });
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
