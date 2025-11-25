using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Security.Cryptography;
using System.Text;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/api-keys")]
[Authorize(Policy = "StaffOnly")]
public class ApiKeysController : BaseApiController
{
    private readonly QivrDbContext _context;
    private readonly ILogger<ApiKeysController> _logger;

    public ApiKeysController(QivrDbContext context, ILogger<ApiKeysController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> ListKeys()
    {
        var tenantId = RequireTenantId();
        
        var keys = await _context.ApiKeys
            .Where(k => k.TenantId == tenantId && !k.IsDeleted)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyDto
            {
                Id = k.Id,
                Name = k.Name,
                KeyPrefix = k.KeyPrefix,
                Description = k.Description,
                IsActive = k.IsActive,
                LastUsedAt = k.LastUsedAt,
                ExpiresAt = k.ExpiresAt,
                CreatedAt = k.CreatedAt,
                Scopes = k.Scopes
            })
            .ToListAsync();

        return Ok(keys);
    }

    [HttpPost]
    public async Task<IActionResult> CreateKey([FromBody] CreateApiKeyRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        // Generate secure key
        var key = GenerateApiKey();
        var keyHash = HashKey(key);
        var keyPrefix = key.Substring(0, 8);

        var apiKey = new ApiKey
        {
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            KeyHash = keyHash,
            KeyPrefix = keyPrefix,
            IsActive = true,
            CreatedBy = userId,
            ExpiresAt = request.ExpiresInDays.HasValue 
                ? DateTime.UtcNow.AddDays(request.ExpiresInDays.Value) 
                : null,
            Scopes = request.Scopes ?? new List<string> { "read", "write" }
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();

        return Ok(new CreateApiKeyResponse
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            Key = key, // Only returned once!
            KeyPrefix = keyPrefix,
            ExpiresAt = apiKey.ExpiresAt,
            Scopes = apiKey.Scopes
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RevokeKey(Guid id)
    {
        var tenantId = RequireTenantId();
        
        var apiKey = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == id && k.TenantId == tenantId);

        if (apiKey == null)
            return NotFound();

        apiKey.IsActive = false;
        apiKey.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleKey(Guid id)
    {
        var tenantId = RequireTenantId();
        
        var apiKey = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == id && k.TenantId == tenantId && !k.IsDeleted);

        if (apiKey == null)
            return NotFound();

        apiKey.IsActive = !apiKey.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { isActive = apiKey.IsActive });
    }

    private static string GenerateApiKey()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return $"qivr_{Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "")}";
    }

    private static string HashKey(string key)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(key);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}

public class ApiKeyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Scopes { get; set; } = new();
}

public class CreateApiKeyRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ExpiresInDays { get; set; }
    public List<string>? Scopes { get; set; }
}

public class CreateApiKeyResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public List<string> Scopes { get; set; } = new();
}
