using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Infrastructure.Services;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Admin controller for managing external API keys.
/// Allows creating, revoking, and monitoring API keys for partners.
/// </summary>
[ApiController]
[Route("api/admin/external-api")]
[Authorize]
public class AdminExternalApiController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly AdminReadOnlyDbContext _readOnlyContext;
    private readonly IAdminAuditService _auditService;
    private readonly ILogger<AdminExternalApiController> _logger;

    public AdminExternalApiController(
        QivrDbContext context,
        AdminReadOnlyDbContext readOnlyContext,
        IAdminAuditService auditService,
        ILogger<AdminExternalApiController> logger)
    {
        _context = context;
        _readOnlyContext = readOnlyContext;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// List all external API keys
    /// </summary>
    [HttpGet("keys")]
    public async Task<IActionResult> GetApiKeys(
        [FromQuery] Guid? tenantId = null,
        [FromQuery] bool includeRevoked = false,
        CancellationToken ct = default)
    {
        var query = _readOnlyContext.ApiKeys
            .Include(k => k.Tenant)
            .Where(k => !k.IsDeleted);

        if (!includeRevoked)
            query = query.Where(k => k.IsActive);

        if (tenantId.HasValue)
            query = query.Where(k => k.TenantId == tenantId.Value);

        var keys = await query
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new
            {
                k.Id,
                k.Name,
                k.KeyPrefix,
                k.Description,
                k.PartnerName,
                k.ContactEmail,
                k.TenantId,
                tenantName = k.Tenant != null ? k.Tenant.Name : null,
                tenantSlug = k.Tenant != null ? k.Tenant.Slug : null,
                k.Scopes,
                k.IsActive,
                k.ExpiresAt,
                k.LastUsedAt,
                k.RateLimitPerHour,
                k.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { keys });
    }

    /// <summary>
    /// Get API key details
    /// </summary>
    [HttpGet("keys/{id:guid}")]
    public async Task<IActionResult> GetApiKey(Guid id, CancellationToken ct)
    {
        var key = await _readOnlyContext.ApiKeys
            .Include(k => k.Tenant)
            .Where(k => k.Id == id && !k.IsDeleted)
            .Select(k => new
            {
                k.Id,
                k.Name,
                k.KeyPrefix,
                k.Description,
                k.PartnerName,
                k.ContactEmail,
                k.TenantId,
                tenantName = k.Tenant != null ? k.Tenant.Name : null,
                tenantSlug = k.Tenant != null ? k.Tenant.Slug : null,
                k.Scopes,
                k.IsActive,
                k.ExpiresAt,
                k.LastUsedAt,
                k.RateLimitPerHour,
                k.RequestsThisHour,
                k.RateLimitResetAt,
                k.CreatedAt,
                k.CreatedBy
            })
            .FirstOrDefaultAsync(ct);

        if (key == null)
            return NotFound(new { error = "API key not found" });

        return Ok(key);
    }

    /// <summary>
    /// Create a new external API key for a tenant
    /// </summary>
    [HttpPost("keys")]
    public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyRequest request, CancellationToken ct)
    {
        // Validate tenant exists
        var tenant = await _readOnlyContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == request.TenantId, ct);

        if (tenant == null)
            return NotFound(new { error = "Tenant not found" });

        // Generate secure API key
        var rawKey = GenerateApiKey();
        var keyHash = HashKey(rawKey);
        var keyPrefix = rawKey[..8];

        var adminEmail = User.FindFirst("email")?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value;
        var adminId = Guid.TryParse(User.FindFirst("sub")?.Value, out var id) ? id : Guid.Empty;

        var apiKey = new ApiKey
        {
            Name = request.Name,
            KeyHash = keyHash,
            KeyPrefix = keyPrefix,
            Description = request.Description,
            PartnerName = request.PartnerName,
            ContactEmail = request.ContactEmail,
            TenantId = request.TenantId,
            Scopes = request.Scopes ?? new List<string> { "read" },
            ExpiresAt = request.ExpiresAt,
            RateLimitPerHour = request.RateLimitPerHour ?? 1000,
            IsActive = true,
            CreatedBy = adminId
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            "external-api.key.create",
            "ApiKey",
            apiKey.Id,
            apiKey.Name,
            newState: new
            {
                apiKey.Name,
                apiKey.TenantId,
                tenantName = tenant.Name,
                apiKey.PartnerName,
                apiKey.Scopes,
                apiKey.ExpiresAt,
                apiKey.RateLimitPerHour
            },
            metadata: new Dictionary<string, object>
            {
                ["createdBy"] = adminEmail ?? "unknown"
            },
            ct: ct);

        _logger.LogInformation("API key created: {KeyName} for tenant {TenantName} by {Admin}",
            apiKey.Name, tenant.Name, adminEmail);

        // Return the full key only once - it cannot be retrieved again
        return Ok(new
        {
            id = apiKey.Id,
            name = apiKey.Name,
            apiKey = rawKey, // Only returned on creation!
            keyPrefix = keyPrefix,
            tenantId = apiKey.TenantId,
            tenantName = tenant.Name,
            scopes = apiKey.Scopes,
            expiresAt = apiKey.ExpiresAt,
            rateLimitPerHour = apiKey.RateLimitPerHour,
            warning = "Save this API key securely - it cannot be retrieved again!"
        });
    }

    /// <summary>
    /// Update an API key (name, description, rate limit, expiry)
    /// </summary>
    [HttpPut("keys/{id:guid}")]
    public async Task<IActionResult> UpdateApiKey(Guid id, [FromBody] UpdateApiKeyRequest request, CancellationToken ct)
    {
        var apiKey = await _context.ApiKeys
            .Include(k => k.Tenant)
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, ct);

        if (apiKey == null)
            return NotFound(new { error = "API key not found" });

        var previousState = new
        {
            apiKey.Name,
            apiKey.Description,
            apiKey.PartnerName,
            apiKey.ContactEmail,
            apiKey.Scopes,
            apiKey.ExpiresAt,
            apiKey.RateLimitPerHour
        };

        // Update fields
        if (!string.IsNullOrEmpty(request.Name))
            apiKey.Name = request.Name;
        if (request.Description != null)
            apiKey.Description = request.Description;
        if (request.PartnerName != null)
            apiKey.PartnerName = request.PartnerName;
        if (request.ContactEmail != null)
            apiKey.ContactEmail = request.ContactEmail;
        if (request.Scopes != null)
            apiKey.Scopes = request.Scopes;
        if (request.ExpiresAt.HasValue)
            apiKey.ExpiresAt = request.ExpiresAt;
        if (request.RateLimitPerHour.HasValue)
            apiKey.RateLimitPerHour = request.RateLimitPerHour.Value;

        apiKey.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        // Audit log
        var adminEmail = User.FindFirst("email")?.Value;
        await _auditService.LogAsync(
            "external-api.key.update",
            "ApiKey",
            apiKey.Id,
            apiKey.Name,
            previousState: previousState,
            newState: new
            {
                apiKey.Name,
                apiKey.Description,
                apiKey.PartnerName,
                apiKey.ContactEmail,
                apiKey.Scopes,
                apiKey.ExpiresAt,
                apiKey.RateLimitPerHour
            },
            ct: ct);

        return Ok(new
        {
            id = apiKey.Id,
            name = apiKey.Name,
            updated = true
        });
    }

    /// <summary>
    /// Revoke (deactivate) an API key
    /// </summary>
    [HttpPost("keys/{id:guid}/revoke")]
    public async Task<IActionResult> RevokeApiKey(Guid id, [FromBody] RevokeKeyRequest? request, CancellationToken ct)
    {
        var apiKey = await _context.ApiKeys
            .Include(k => k.Tenant)
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, ct);

        if (apiKey == null)
            return NotFound(new { error = "API key not found" });

        apiKey.IsActive = false;
        apiKey.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        // Audit log
        var adminEmail = User.FindFirst("email")?.Value;
        await _auditService.LogAsync(
            "external-api.key.revoke",
            "ApiKey",
            apiKey.Id,
            apiKey.Name,
            newState: new
            {
                reason = request?.Reason ?? "No reason provided",
                revokedBy = adminEmail
            },
            ct: ct);

        _logger.LogWarning("API key revoked: {KeyName} ({KeyId}) by {Admin}. Reason: {Reason}",
            apiKey.Name, apiKey.Id, adminEmail, request?.Reason ?? "Not specified");

        return Ok(new { id = apiKey.Id, revoked = true });
    }

    /// <summary>
    /// Reactivate a revoked API key
    /// </summary>
    [HttpPost("keys/{id:guid}/activate")]
    public async Task<IActionResult> ActivateApiKey(Guid id, CancellationToken ct)
    {
        var apiKey = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, ct);

        if (apiKey == null)
            return NotFound(new { error = "API key not found" });

        apiKey.IsActive = true;
        apiKey.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        // Audit log
        var adminEmail = User.FindFirst("email")?.Value;
        await _auditService.LogAsync(
            "external-api.key.activate",
            "ApiKey",
            apiKey.Id,
            apiKey.Name,
            newState: new { activatedBy = adminEmail },
            ct: ct);

        return Ok(new { id = apiKey.Id, activated = true });
    }

    /// <summary>
    /// Delete an API key permanently
    /// </summary>
    [HttpDelete("keys/{id:guid}")]
    public async Task<IActionResult> DeleteApiKey(Guid id, CancellationToken ct)
    {
        var apiKey = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, ct);

        if (apiKey == null)
            return NotFound(new { error = "API key not found" });

        apiKey.DeletedAt = DateTime.UtcNow;
        apiKey.IsActive = false;
        await _context.SaveChangesAsync(ct);

        // Audit log
        var adminEmail = User.FindFirst("email")?.Value;
        await _auditService.LogAsync(
            "external-api.key.delete",
            "ApiKey",
            apiKey.Id,
            apiKey.Name,
            newState: new { deletedBy = adminEmail },
            ct: ct);

        return Ok(new { id = apiKey.Id, deleted = true });
    }

    /// <summary>
    /// Regenerate an API key (creates new key, keeps same settings)
    /// </summary>
    [HttpPost("keys/{id:guid}/regenerate")]
    public async Task<IActionResult> RegenerateApiKey(Guid id, CancellationToken ct)
    {
        var apiKey = await _context.ApiKeys
            .Include(k => k.Tenant)
            .FirstOrDefaultAsync(k => k.Id == id && !k.IsDeleted, ct);

        if (apiKey == null)
            return NotFound(new { error = "API key not found" });

        // Generate new key
        var rawKey = GenerateApiKey();
        var keyHash = HashKey(rawKey);
        var keyPrefix = rawKey[..8];

        apiKey.KeyHash = keyHash;
        apiKey.KeyPrefix = keyPrefix;
        apiKey.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        // Audit log
        var adminEmail = User.FindFirst("email")?.Value;
        await _auditService.LogAsync(
            "external-api.key.regenerate",
            "ApiKey",
            apiKey.Id,
            apiKey.Name,
            newState: new
            {
                regeneratedBy = adminEmail,
                newKeyPrefix = keyPrefix
            },
            ct: ct);

        _logger.LogWarning("API key regenerated: {KeyName} ({KeyId}) by {Admin}",
            apiKey.Name, apiKey.Id, adminEmail);

        return Ok(new
        {
            id = apiKey.Id,
            name = apiKey.Name,
            apiKey = rawKey, // Only returned on regeneration!
            keyPrefix = keyPrefix,
            warning = "Save this API key securely - the old key is now invalid!"
        });
    }

    /// <summary>
    /// Get API usage statistics
    /// </summary>
    [HttpGet("usage")]
    public async Task<IActionResult> GetUsageStats(
        [FromQuery] Guid? tenantId = null,
        [FromQuery] int days = 30,
        CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddDays(-days);

        var query = _readOnlyContext.ApiKeys
            .Where(k => !k.IsDeleted && k.LastUsedAt != null);

        if (tenantId.HasValue)
            query = query.Where(k => k.TenantId == tenantId.Value);

        var activeKeys = await query
            .Where(k => k.LastUsedAt >= since)
            .CountAsync(ct);

        var totalKeys = await _readOnlyContext.ApiKeys
            .Where(k => !k.IsDeleted && k.IsActive)
            .CountAsync(ct);

        // Get top users
        var topKeys = await query
            .OrderByDescending(k => k.LastUsedAt)
            .Take(10)
            .Select(k => new
            {
                k.Id,
                k.Name,
                k.PartnerName,
                k.TenantId,
                k.LastUsedAt,
                k.RequestsThisHour
            })
            .ToListAsync(ct);

        return Ok(new
        {
            period = $"Last {days} days",
            totalActiveKeys = totalKeys,
            keysUsedInPeriod = activeKeys,
            topKeys
        });
    }

    /// <summary>
    /// Get external API documentation info
    /// </summary>
    [HttpGet("docs")]
    public IActionResult GetApiDocs()
    {
        return Ok(new
        {
            version = "1.0.0",
            baseUrl = "/api/external",
            authentication = new
            {
                method = "API Key",
                header = "X-API-Key",
                description = "Include your API key in the X-API-Key header"
            },
            endpoints = new object[]
            {
                new
                {
                    path = "/clinic-performance",
                    method = "GET",
                    description = "Get clinic performance overview including patient volumes, appointments, PROM completion rates",
                    parameters = new[] { "startDate", "endDate" }
                },
                new
                {
                    path = "/prom-outcomes",
                    method = "GET",
                    description = "Get PROM outcome benchmarks with improvement tracking",
                    parameters = new[] { "promType", "bodyRegion", "startDate", "endDate" }
                },
                new
                {
                    path = "/treatment-outcomes",
                    method = "GET",
                    description = "Get treatment plan completion rates and outcome metrics",
                    parameters = new[] { "startDate", "endDate" }
                },
                new
                {
                    path = "/health",
                    method = "GET",
                    description = "API health check (no authentication required)",
                    parameters = Array.Empty<string>()
                }
            },
            rateLimits = new
            {
                description = "Rate limits are applied per API key",
                defaultLimit = "1000 requests/hour",
                headers = new[] { "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset" }
            },
            privacy = new
            {
                description = "All data is anonymized and aggregated",
                kAnonymity = "Minimum 5 patients per aggregation group"
            }
        });
    }

    private static string GenerateApiKey()
    {
        // Generate a secure random API key: qivr_<32 random chars>
        var bytes = new byte[24];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return "qivr_" + Convert.ToBase64String(bytes)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")[..32];
    }

    private static string HashKey(string key)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(key);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}

public class CreateApiKeyRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PartnerName { get; set; }
    public string? ContactEmail { get; set; }
    public Guid TenantId { get; set; }
    public List<string>? Scopes { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? RateLimitPerHour { get; set; }
}

public class UpdateApiKeyRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? PartnerName { get; set; }
    public string? ContactEmail { get; set; }
    public List<string>? Scopes { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? RateLimitPerHour { get; set; }
}

public class RevokeKeyRequest
{
    public string? Reason { get; set; }
}
