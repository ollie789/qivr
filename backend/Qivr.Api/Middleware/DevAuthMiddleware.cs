using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Qivr.Api.Config;
using Microsoft.Extensions.Options;

namespace Qivr.Api.Middleware;

/// <summary>
/// Development authentication middleware that simplifies auth for local development.
/// Automatically creates tokens for any request missing auth in dev mode.
/// </summary>
public class DevAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DevAuthMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly JwtSettings _jwtSettings;

    public DevAuthMiddleware(
        RequestDelegate next,
        ILogger<DevAuthMiddleware> logger,
        IWebHostEnvironment environment,
        IOptions<JwtSettings> jwtSettings)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only active in development
        if (!_environment.IsDevelopment())
        {
            await _next(context);
            return;
        }

        // Skip for health checks and public endpoints
        var path = context.Request.Path.Value?.ToLower() ?? "";
        if (path.Contains("/health") || 
            path.Contains("/swagger") || 
            path.Contains("/cors-test"))
        {
            await _next(context);
            return;
        }

        // Check if request already has authentication
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            // No auth header - create a dev token automatically
            _logger.LogDebug("No auth header found, creating dev token for {Path}", context.Request.Path);
            
            // Determine role based on path
            var role = "Patient";
            if (path.Contains("superadmin")) role = "SuperAdmin";
            else if (path.Contains("clinic") || path.Contains("management")) role = "ClinicAdmin";
            else if (path.Contains("provider")) role = "Provider";

            // Create dev claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim("sub", Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Email, $"dev-{role.ToLower()}@qivr.health"),
                new Claim(ClaimTypes.Name, $"Dev {role}"),
                new Claim(ClaimTypes.Role, role),
                new Claim("tenant_id", "11111111-1111-1111-1111-111111111111"),
                new Claim("custom:tenant_id", "11111111-1111-1111-1111-111111111111"),
                new Claim("dev_generated", "true")
            };

            // Create token
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            
            // Add to request header
            context.Request.Headers["Authorization"] = $"Bearer {tokenString}";
            
            // Set user principal
            var identity = new ClaimsIdentity(claims, "Bearer");
            context.User = new ClaimsPrincipal(identity);
            
            _logger.LogInformation("Dev token auto-generated for role {Role}", role);
        }

        await _next(context);
    }
}
