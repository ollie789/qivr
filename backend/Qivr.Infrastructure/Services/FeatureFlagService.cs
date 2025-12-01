using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Qivr.Core.Interfaces;
using Qivr.Infrastructure.Data;

namespace Qivr.Infrastructure.Services;

public class FeatureFlagService : IFeatureFlagService
{
    private readonly QivrDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<FeatureFlagService> _logger;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public FeatureFlagService(QivrDbContext context, IMemoryCache cache, ILogger<FeatureFlagService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<bool> IsEnabledAsync(Guid tenantId, string feature, CancellationToken ct = default)
    {
        var flags = await GetAllFlagsAsync(tenantId, ct);
        return flags.TryGetValue(feature, out var enabled) && enabled;
    }

    public async Task<Dictionary<string, bool>> GetAllFlagsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var cacheKey = $"features:{tenantId}";
        
        if (_cache.TryGetValue(cacheKey, out Dictionary<string, bool>? cached) && cached != null)
            return cached;

        var tenant = await _context.Tenants
            .AsNoTracking()
            .Where(t => t.Id == tenantId)
            .Select(t => new { t.Settings, t.Plan })
            .FirstOrDefaultAsync(ct);

        if (tenant == null)
        {
            _logger.LogWarning("Tenant {TenantId} not found for feature flags", tenantId);
            return new Dictionary<string, bool>();
        }

        // Start with plan defaults, then overlay tenant-specific settings
        var flags = GetPlanDefaults(tenant.Plan);
        
        foreach (var (key, value) in tenant.Settings)
        {
            if (flags.ContainsKey(key) && value is bool boolValue)
                flags[key] = boolValue;
            else if (flags.ContainsKey(key) && bool.TryParse(value?.ToString(), out var parsed))
                flags[key] = parsed;
        }

        _cache.Set(cacheKey, flags, CacheDuration);
        return flags;
    }

    private static Dictionary<string, bool> GetPlanDefaults(string plan) => plan.ToLower() switch
    {
        "starter" => new Dictionary<string, bool>
        {
            [Features.AiTriage] = false,
            [Features.AiTreatmentPlans] = false,
            [Features.DocumentOcr] = true,
            [Features.SmsReminders] = false,
            [Features.ApiAccess] = false,
            [Features.CustomBranding] = false,
            [Features.HipaaAuditLogs] = false,
        },
        "professional" => new Dictionary<string, bool>
        {
            [Features.AiTriage] = true,
            [Features.AiTreatmentPlans] = true,
            [Features.DocumentOcr] = true,
            [Features.SmsReminders] = true,
            [Features.ApiAccess] = false,
            [Features.CustomBranding] = false,
            [Features.HipaaAuditLogs] = true,
        },
        "enterprise" => new Dictionary<string, bool>
        {
            [Features.AiTriage] = true,
            [Features.AiTreatmentPlans] = true,
            [Features.DocumentOcr] = true,
            [Features.SmsReminders] = true,
            [Features.ApiAccess] = true,
            [Features.CustomBranding] = true,
            [Features.HipaaAuditLogs] = true,
        },
        _ => new Dictionary<string, bool>
        {
            [Features.AiTriage] = false,
            [Features.AiTreatmentPlans] = false,
            [Features.DocumentOcr] = true,
            [Features.SmsReminders] = false,
            [Features.ApiAccess] = false,
            [Features.CustomBranding] = false,
            [Features.HipaaAuditLogs] = false,
        }
    };
}
