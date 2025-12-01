using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Authentication;

/// <summary>
/// Authentication handler for API key-based authentication.
/// Used by external/public APIs for third-party integrations.
/// </summary>
public class ApiKeyAuthenticationHandler : AuthenticationHandler<ApiKeyAuthenticationOptions>
{
    public const string SchemeName = "ApiKey";
    public const string ApiKeyHeaderName = "X-API-Key";

    private readonly QivrDbContext _dbContext;

    public ApiKeyAuthenticationHandler(
        IOptionsMonitor<ApiKeyAuthenticationOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        QivrDbContext dbContext)
        : base(options, logger, encoder)
    {
        _dbContext = dbContext;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check for API key in header
        if (!Request.Headers.TryGetValue(ApiKeyHeaderName, out var apiKeyHeaderValues))
        {
            return AuthenticateResult.NoResult();
        }

        var providedApiKey = apiKeyHeaderValues.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(providedApiKey))
        {
            return AuthenticateResult.Fail("API key is empty");
        }

        // Hash the provided key
        var keyHash = HashKey(providedApiKey);

        // Look up the API key with tenant info
        var apiKey = await _dbContext.ApiKeys
            .FirstOrDefaultAsync(k =>
                k.KeyHash == keyHash &&
                k.IsActive &&
                !k.IsDeleted &&
                (k.ExpiresAt == null || k.ExpiresAt > DateTime.UtcNow));

        if (apiKey == null)
        {
            Logger.LogWarning("Invalid or expired API key attempted: {KeyPrefix}...",
                providedApiKey.Length > 8 ? providedApiKey[..8] : providedApiKey);
            return AuthenticateResult.Fail("Invalid or expired API key");
        }

        // Check if tenant is active
        var tenant = await _dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == apiKey.TenantId && t.IsActive);

        if (tenant == null)
        {
            Logger.LogWarning("API key used for inactive or missing tenant: {TenantId}", apiKey.TenantId);
            return AuthenticateResult.Fail("Tenant is not active");
        }

        // Update last used timestamp (fire and forget)
        _ = UpdateLastUsedAsync(apiKey.Id);

        // Create claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, apiKey.Id.ToString()),
            new Claim("tenant_id", apiKey.TenantId.ToString()),
            new Claim("api_key_name", apiKey.Name),
            new Claim("auth_type", "api_key")
        };

        // Add scopes as claims
        foreach (var scope in apiKey.Scopes)
        {
            claims.Add(new Claim("scope", scope));
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        Logger.LogInformation("API key authenticated: {KeyName} for tenant {TenantId}",
            apiKey.Name, apiKey.TenantId);

        return AuthenticateResult.Success(ticket);
    }

    private async Task UpdateLastUsedAsync(Guid apiKeyId)
    {
        try
        {
            await _dbContext.ApiKeys
                .Where(k => k.Id == apiKeyId)
                .ExecuteUpdateAsync(s => s.SetProperty(k => k.LastUsedAt, DateTime.UtcNow));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to update LastUsedAt for API key {ApiKeyId}", apiKeyId);
        }
    }

    private static string HashKey(string key)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(key);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}

public class ApiKeyAuthenticationOptions : AuthenticationSchemeOptions
{
}
