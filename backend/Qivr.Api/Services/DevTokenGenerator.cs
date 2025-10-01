using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Qivr.Api.Services;

public class DevTokenGenerator
{
    private readonly IConfiguration _configuration;
    
    public DevTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    public string GenerateDevToken(string email, string userId, string tenantId, string role)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "dev-secret-key-for-testing-only-32-characters-minimum";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, email),
            new Claim("cognito:username", email),
            new Claim("username", email),
            new Claim("tenant_id", tenantId),
            new Claim("custom:tenant_id", tenantId),
            new Claim("role", role),
            new Claim("custom:role", role),
            new Claim(ClaimTypes.Role, role),
            new Claim("cognito:groups", role)
        };
        
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "qivr.health",
            audience: _configuration["Jwt:Audience"] ?? "qivr-api",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}