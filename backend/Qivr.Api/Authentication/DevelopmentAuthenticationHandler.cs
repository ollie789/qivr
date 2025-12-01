using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Qivr.Api.Config;

namespace Qivr.Api.Authentication;

public class DevelopmentAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly DevAuthSettings _devAuthSettings;
    private readonly TokenValidationParameters _tokenValidationParameters;

    public DevelopmentAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IOptions<DevAuthSettings> devAuthOptions,
        IConfiguration configuration) : base(options, logger, encoder)
    {
        _devAuthSettings = devAuthOptions.Value;
        var secret = configuration["Jwt:SecretKey"] ?? "dev-secret-key-for-testing-only-32-characters-minimum";
        _tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authorizationHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authorizationHeader) && authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = authorizationHeader[7..].Trim();
            return Task.FromResult(ValidateToken(token));
        }

        if (!_devAuthSettings.Enabled)
        {
            return Task.FromResult(AuthenticateResult.Fail("Development authentication disabled"));
        }

        var principal = BuildPrincipal(
            _devAuthSettings.DefaultUser.Id,
            _devAuthSettings.DefaultUser.Email,
            _devAuthSettings.DefaultUser.FirstName,
            _devAuthSettings.DefaultUser.LastName,
            _devAuthSettings.DefaultUser.Role,
            ResolveTenantId(_devAuthSettings.DefaultUser.TenantId));

        var ticket = new AuthenticationTicket(principal, DevelopmentAuthenticationDefaults.AuthenticationScheme);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    private AuthenticateResult ValidateToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, _tokenValidationParameters, out _);
            var ticket = new AuthenticationTicket(principal, DevelopmentAuthenticationDefaults.AuthenticationScheme);
            return AuthenticateResult.Success(ticket);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Invalid development token received");
            return AuthenticateResult.Fail("Invalid token");
        }
    }

    private ClaimsPrincipal BuildPrincipal(
        string userId,
        string email,
        string firstName,
        string lastName,
        string role,
        string tenantId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, email),
            new(ClaimTypes.Email, email),
            new("username", email),
            new("cognito:username", email),
            new("tenant_id", tenantId),
            new("custom:tenant_id", tenantId),
            new(ClaimTypes.Role, role),
            new("role", role),
            new("custom:role", role),
            new(ClaimTypes.GivenName, firstName),
            new(ClaimTypes.Surname, lastName)
        };

        var identity = new ClaimsIdentity(claims, DevelopmentAuthenticationDefaults.AuthenticationScheme);
        return new ClaimsPrincipal(identity);
    }

    private string ResolveTenantId(string? configuredTenant)
    {
        if (!string.IsNullOrWhiteSpace(configuredTenant))
        {
            return configuredTenant;
        }

        if (!string.IsNullOrWhiteSpace(_devAuthSettings.DefaultTenantId))
        {
            return _devAuthSettings.DefaultTenantId!;
        }

        // Use the first available tenant from the database
        // This allows the system to work with any existing tenant
        return "dynamic-tenant-resolution";
    }
}
