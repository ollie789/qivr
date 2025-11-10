using System.Linq;
using System.Security.Claims;
using Amazon.CognitoIdentityProvider.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Qivr.Api.Services;

namespace Qivr.Api.Controllers;

/// <summary>
/// Authentication and authorization endpoints
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ICognitoAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    public AuthController(
        ICognitoAuthService authService,
        ILogger<AuthController> logger,
        IConfiguration configuration)
    {
        _authService = authService;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Authenticate user with username and password
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>Authentication tokens and user information</returns>
    /// <response code="200">Login successful</response>
    /// <response code="401">Invalid credentials</response>
    /// <response code="429">Too many login attempts</response>
    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(429)]
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
                    session = result.Session,
                    challengeName = result.ChallengeName?.ToString()
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
    [HttpPost("register")] // Alias for signup
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> SignUp([FromBody] Qivr.Api.Services.SignUpRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.SignUpAsync(request);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });

        return Ok(new
        {
            userSub = result.UserSub,
            userId = result.UserId,
            tenantId = result.TenantId,
            cognitoPoolId = _configuration["Cognito:UserPoolId"],
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
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest? request = null)
    {
        // Get refresh token from cookie
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
        {
            refreshToken = request?.RefreshToken;
        }

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

    [HttpGet("debug")]
    [Authorize]
    public IActionResult Debug()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value
            ?? User.FindFirst("custom:tenant_id")?.Value;
        var headerTenantId = Request.Headers["X-Tenant-Id"].FirstOrDefault();

        HttpContext.Items.TryGetValue("TenantId", out var tenantContext);
        HttpContext.Items.TryGetValue("ValidatedTenant", out var validatedTenant);

        var defaultTenant = _configuration["Security:DefaultTenantId"];

        var response = new
        {
            authenticated = User.Identity?.IsAuthenticated ?? false,
            user = new
            {
                subject = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value,
                email = User.FindFirst(ClaimTypes.Email)?.Value,
                name = User.FindFirst(ClaimTypes.Name)?.Value,
                givenName = User.FindFirst(ClaimTypes.GivenName)?.Value,
                familyName = User.FindFirst(ClaimTypes.Surname)?.Value,
                roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
                    .Concat(User.FindAll("cognito:groups").Select(c => c.Value))
                    .Distinct()
            },
            tenant = new
            {
                fromClaim = tenantClaim,
                fromHeader = headerTenantId,
                fromContext = tenantContext?.ToString(),
                contextValidated = validatedTenant as bool? ?? tenantContext is not null,
                defaultTenantId = defaultTenant
            },
            claims = User.Claims
                .Select(claim => new { claim.Type, claim.Value })
                .ToArray(),
            diagnostics = new
            {
                traceId = HttpContext.TraceIdentifier,
                issuedAt = DateTimeOffset.UtcNow
            }
        };

        return Ok(response);
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
        // Pass SMS_MFA as default challenge type
        var result = await _authService.VerifyMfaAsync(request.Session, request.MfaCode, Amazon.CognitoIdentityProvider.ChallengeNameType.SMS_MFA);
        
        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage ?? "Invalid MFA code" });
        }

        var refreshToken = result.RefreshToken;
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            refreshToken = Request.Cookies["refreshToken"];
        }

        SetAuthCookies(result.AccessToken!, refreshToken, result.ExpiresIn ?? 0);

        return Ok(new
        {
            expiresIn = result.ExpiresIn,
            userInfo = result.UserInfo
        });
    }

    [HttpGet("user-info")]
    [Authorize]
    public async Task<IActionResult> GetUserInfo()
    {
        // Try to get token from cookie first, fallback to header
        var accessToken = Request.Cookies["accessToken"] ?? 
                         Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        if (string.IsNullOrEmpty(accessToken))
        {
            // If no token in cookies or header, return user info from claims
            return Ok(new
            {
                sub = User.FindFirst("sub")?.Value,
                email = User.FindFirst("email")?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value,
                given_name = User.FindFirst("given_name")?.Value ?? User.FindFirst(ClaimTypes.GivenName)?.Value,
                family_name = User.FindFirst("family_name")?.Value ?? User.FindFirst(ClaimTypes.Surname)?.Value,
                username = User.FindFirst("cognito:username")?.Value ?? User.FindFirst("username")?.Value
            });
        }
        
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
    private void SetAuthCookies(string accessToken, string? refreshToken, int expiresInSeconds)
    {
        var isSecureRequest = HttpContext.Request.IsHttps ||
            string.Equals(HttpContext.Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);

        // Access token cookie
        var accessTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isSecureRequest,
            SameSite = SameSiteMode.Lax, // Lax to support OAuth redirects while working over HTTP in dev
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds)
        };
        Response.Cookies.Append("accessToken", accessToken, accessTokenOptions);

        // Refresh token cookie (longer expiry)
        var refreshTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isSecureRequest,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(30) // 30 days
        };
        if (!string.IsNullOrEmpty(refreshToken))
        {
            Response.Cookies.Append("refreshToken", refreshToken, refreshTokenOptions);
        }
    }

    private void ClearAuthCookies()
    {
        var clearOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = HttpContext.Request.IsHttps ||
                     string.Equals(HttpContext.Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase),
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
    public string? ChallengeName { get; set; }
}

public class SocialCallbackRequest
{
    public string AuthorizationCode { get; set; } = string.Empty;
}
