using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Api.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmailVerificationController : ControllerBase
{
    private readonly IEmailVerificationService _verificationService;
    private readonly ILogger<EmailVerificationController> _logger;

    public EmailVerificationController(
        IEmailVerificationService verificationService,
        ILogger<EmailVerificationController> logger)
    {
        _verificationService = verificationService;
        _logger = logger;
    }

    /// <summary>
    /// Verify email address with token
    /// </summary>
    [HttpPost("verify")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Token))
        {
            return BadRequest(new { error = "Invalid token" });
        }

        var success = await _verificationService.VerifyEmailAsync(request.Token);
        
        if (success)
        {
            return Ok(new 
            { 
                success = true, 
                message = "Email verified successfully" 
            });
        }

        return BadRequest(new 
        { 
            error = "Invalid or expired verification token" 
        });
    }

    /// <summary>
    /// Resend verification email
    /// </summary>
    [HttpPost("resend")]
    [AllowAnonymous]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Email))
        {
            return BadRequest(new { error = "Email is required" });
        }

        var success = await _verificationService.ResendVerificationEmailAsync(request.Email);
        
        // Always return success to prevent email enumeration
        return Ok(new 
        { 
            success = true, 
            message = "If the email exists, a verification email has been sent" 
        });
    }

    /// <summary>
    /// Send test verification email (Development only)
    /// </summary>
    [HttpPost("test")]
    [AllowAnonymous]
    public async Task<IActionResult> TestVerificationEmail([FromBody] TestEmailRequest request)
    {
        // Only allow in development
        if (!Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")?.Equals("Development", StringComparison.OrdinalIgnoreCase) ?? false)
        {
            return NotFound();
        }

        await _verificationService.SendVerificationEmailAsync(
            request.Email ?? "test@example.com",
            "test-token-12345");

        return Ok(new 
        { 
            success = true, 
            message = "Test email sent. Check Mailhog at http://localhost:8025" 
        });
    }

    public class VerifyEmailRequest
    {
        public required string Token { get; set; }
    }

    public class ResendVerificationRequest
    {
        public required string Email { get; set; }
    }

    public class TestEmailRequest
    {
        public string Email { get; set; } = "test@example.com";
    }
}
