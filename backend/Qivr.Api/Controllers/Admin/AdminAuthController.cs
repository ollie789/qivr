using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Admin authentication is handled by Cognito.
/// This controller provides user info endpoints.
/// </summary>
[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AdminAuthController> _logger;

    public AdminAuthController(QivrDbContext context, ILogger<AdminAuthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get current admin user info from Cognito token
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value 
            ?? User.FindFirst("email")?.Value;
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "Invalid token" });
        }

        _logger.LogInformation("Admin user authenticated: {Email}", email);

        return Ok(new
        {
            id = sub,
            email,
            name = email.Split('@')[0],
            role = "Admin"
        });
    }

    /// <summary>
    /// Verify admin has access (used by frontend to check auth)
    /// </summary>
    [HttpGet("verify")]
    [Authorize]
    public IActionResult VerifyAccess()
    {
        return Ok(new { valid = true });
    }
}
