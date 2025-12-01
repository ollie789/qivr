using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Partner;

[ApiController]
[Route("api/auth")]
public class PartnerAuthController : ControllerBase
{
    private readonly AdminReadOnlyDbContext _context;
    private readonly IConfiguration _config;

    public PartnerAuthController(AdminReadOnlyDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("partner-login")]
    public async Task<IActionResult> Login([FromBody] PartnerLoginRequest request, CancellationToken ct)
    {
        // Find partner by email (slug) or contact email
        var partner = await _context.ResearchPartners
            .FirstOrDefaultAsync(p => 
                p.IsActive && 
                (p.Slug == request.Email.ToLower() || p.ContactEmail == request.Email), ct);

        if (partner == null)
            return Unauthorized(new { error = "Invalid credentials" });

        // Verify API key
        var keyHash = HashApiKey(request.Password);
        if (partner.ApiKeyHash != keyHash)
            return Unauthorized(new { error = "Invalid credentials" });

        // Generate JWT with partner_id claim
        var token = GenerateToken(partner.Id, partner.Name);

        return Ok(new
        {
            token,
            partner = new { id = partner.Id, name = partner.Name, slug = partner.Slug, logoUrl = partner.LogoUrl }
        });
    }

    private string GenerateToken(Guid partnerId, string partnerName)
    {
        var key = _config["Jwt:Key"] ?? "qivr-partner-default-key-change-in-production-32chars";
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key.PadRight(32)));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("partner_id", partnerId.ToString()),
            new Claim("partner_name", partnerName),
            new Claim(JwtRegisteredClaimNames.Sub, partnerId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "qivr-partner",
            audience: "qivr-partner-portal",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string HashApiKey(string apiKey)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(apiKey));
        return Convert.ToBase64String(bytes);
    }
}

public class PartnerLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
