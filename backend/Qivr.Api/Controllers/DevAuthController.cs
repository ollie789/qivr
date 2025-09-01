using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Qivr.Api.Config;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Qivr.Api.Controllers;

/// <summary>
/// Simple authentication controller for development.
/// In dev mode, this bypasses all complex auth and just works.
/// </summary>
[ApiController]
[Route("api/auth")]
public class DevAuthController : ControllerBase
{
    private readonly JwtSettings _jwtSettings;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DevAuthController> _logger;

    public DevAuthController(
        IOptions<JwtSettings> jwtSettings, 
        IWebHostEnvironment environment,
        ILogger<DevAuthController> logger)
    {
        _jwtSettings = jwtSettings.Value;
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("dev-login")]
    [AllowAnonymous]
    public IActionResult DevLogin([FromBody] DevLoginRequest request)
    {
        // Only allow in development
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        // Create test user based on role
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, request.UserId ?? Guid.NewGuid().ToString()),
            new Claim("sub", request.UserId ?? Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Email, request.Email ?? "test@qivr.health"),
            new Claim(ClaimTypes.Name, request.Name ?? "Test User"),
            new Claim(ClaimTypes.Role, request.Role ?? "Patient"),
            new Claim("tenant_id", request.TenantId ?? "11111111-1111-1111-1111-111111111111"),
            new Claim("custom:tenant_id", request.TenantId ?? "11111111-1111-1111-1111-111111111111")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        _logger.LogInformation("Dev token generated for {Email} with role {Role}", 
            request.Email ?? "test@qivr.health", 
            request.Role ?? "Patient");

        return Ok(new
        {
            token = tokenString,
            expiresIn = _jwtSettings.ExpiryMinutes * 60,
            tokenType = "Bearer",
            user = new
            {
                id = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value,
                email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value,
                name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value,
                role = claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value,
                tenantId = claims.FirstOrDefault(c => c.Type == "tenant_id")?.Value
            }
        });
    }

    [HttpGet("dev-token")]
    [AllowAnonymous]
    public IActionResult GetDevToken()
    {
        // Only allow in development
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        // Generate a quick test token for testing
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim("sub", Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Email, "test@qivr.health"),
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim(ClaimTypes.Role, "Patient"),
            new Claim("tenant_id", "11111111-1111-1111-1111-111111111111"),
            new Claim("custom:tenant_id", "11111111-1111-1111-1111-111111111111")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(24); // Long expiry for dev

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            token = tokenString,
            expiresIn = 86400,
            usage = "Add this token to your requests as: Authorization: Bearer <token>"
        });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login([FromBody] DevLoginCredentials request)
    {
        // In development, accept any credentials and generate a token
        if (_environment.IsDevelopment())
        {
            _logger.LogInformation("Dev login attempt for {Email}", request.Email);
            
            // Determine role based on email pattern
            var role = "Patient"; // Default
            if (request.Email?.Contains("admin") == true) role = "SuperAdmin";
            else if (request.Email?.Contains("clinic") == true) role = "ClinicAdmin";
            else if (request.Email?.Contains("provider") == true) role = "Provider";
            
            var devRequest = new DevLoginRequest
            {
                Email = request.Email,
                Name = request.Email?.Split('@')[0] ?? "Test User",
                Role = role,
                TenantId = "11111111-1111-1111-1111-111111111111"
            };
            return DevLogin(devRequest);
        }

        // In production, would validate against real auth provider
        return Unauthorized(new { message = "Invalid credentials" });
    }

    [HttpGet("validate")]
    [Authorize]
    public IActionResult ValidateToken()
    {
        return Ok(new
        {
            valid = true,
            userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            email = User.FindFirst(ClaimTypes.Email)?.Value,
            role = User.FindFirst(ClaimTypes.Role)?.Value
        });
    }
}

public class DevLoginRequest
{
    public string? UserId { get; set; }
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Role { get; set; }
    public string? TenantId { get; set; }
}

public class DevLoginCredentials
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
