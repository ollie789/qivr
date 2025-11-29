using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminAuthController> _logger;

    public AdminAuthController(QivrDbContext context, IConfiguration config, ILogger<AdminAuthController> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest request, CancellationToken ct)
    {
        // Find user with Admin UserType
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.UserType == UserType.Admin, ct);

        if (user == null)
        {
            _logger.LogWarning("Admin login failed: user not found {Email}", request.Email);
            return Unauthorized(new { message = "Invalid credentials" });
        }

        // In production, verify password hash via Cognito
        // For now, check against a configured admin password
        var adminPassword = _config["Admin:Password"] ?? "admin123";
        if (request.Password != adminPassword)
        {
            _logger.LogWarning("Admin login failed: invalid password for {Email}", request.Email);
            return Unauthorized(new { message = "Invalid credentials" });
        }

        var role = user.UserType == UserType.Admin ? "Admin" : "Staff";
        var token = GenerateJwtToken(user.Id, user.Email!, role);

        _logger.LogInformation("Admin login successful: {Email}", request.Email);

        return Ok(new
        {
            token,
            user = new
            {
                id = user.Id,
                email = user.Email,
                name = user.FullName,
                role
            }
        });
    }

    [HttpGet("me")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst("user_id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _context.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return NotFound();

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            name = user.FullName,
            role = user.UserType.ToString()
        });
    }

    private string GenerateJwtToken(Guid userId, string email, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Secret"] ?? "qivr-admin-secret-key-min-32-chars!!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("user_id", userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
        };

        var token = new JwtSecurityToken(
            issuer: "qivr-admin",
            audience: "qivr-admin-portal",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class AdminLoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}
