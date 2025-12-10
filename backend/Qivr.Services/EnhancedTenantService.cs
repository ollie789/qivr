using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IEnhancedTenantService : ITenantService
{
    new Task<TenantDto> CreateSaasTenantAsync(string name, string address, string phone, string email, Guid userId, CancellationToken cancellationToken = default);
}

public class EnhancedTenantService : IEnhancedTenantService
{
    private readonly QivrDbContext _context;
    private readonly IMapper _mapper;
    private readonly ISaasTenantService _saasTenantService;
    private readonly ILogger<EnhancedTenantService> _logger;

    public EnhancedTenantService(
        QivrDbContext context, 
        IMapper mapper, 
        ISaasTenantService saasTenantService,
        ILogger<EnhancedTenantService> logger)
    {
        _context = context;
        _mapper = mapper;
        _saasTenantService = saasTenantService;
        _logger = logger;
    }

    // Implement ITenantService methods by delegating to existing logic
    public async Task<TenantDto?> GetTenantAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, cancellationToken);
        return _mapper.Map<TenantDto>(tenant);
    }

    public async Task<TenantDto?> GetTenantBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == slug, cancellationToken);
        return _mapper.Map<TenantDto>(tenant);
    }

    public async Task<IReadOnlyList<TenantAccessDto>> GetTenantsForUserAsync(Guid userId, string? cognitoSub, CancellationToken cancellationToken = default)
    {
        var tenants = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.Tenant)
            .Where(t => t != null)
            .Select(t => new TenantAccessDto(t!.Id, t.Name, t.Slug, true))
            .ToListAsync(cancellationToken);

        return tenants;
    }

    public async Task<TenantDto> CreateTenantAsync(string name, string address, string phone, string email, Guid userId, CancellationToken cancellationToken = default)
    {
        return await CreateSaasTenantAsync(name, address, phone, email, userId, cancellationToken);
    }

    public async Task<TenantDto> CreateSaasTenantAsync(string name, string address, string phone, string email, Guid userId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating SaaS tenant {TenantName} for user {UserId}", name, userId);

        // Generate and validate slug uniqueness
        var slug = GenerateSlug(name);
        var slugExists = await _context.Tenants.AnyAsync(t => t.Slug == slug, cancellationToken);
        if (slugExists)
        {
            // Append a unique suffix to make it unique
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
        }

        // Create Cognito User Pool for tenant isolation
        var userPoolId = await _saasTenantService.CreateTenantUserPoolAsync(name, cancellationToken);
        var userPoolClientId = await _saasTenantService.CreateTenantUserPoolClientAsync(userPoolId, name, cancellationToken);

        var tenant = new Tenant
        {
            Name = name,
            Slug = slug,
            Status = TenantStatus.Active,
            Plan = "starter",
            Timezone = "Australia/Sydney",
            Locale = "en-AU",
            CognitoUserPoolId = userPoolId,
            CognitoUserPoolClientId = userPoolClientId,
            Settings = new Dictionary<string, object>
            {
                ["address"] = address,
                ["phone"] = phone,
                ["email"] = email
            }
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(cancellationToken);

        // Associate user with the new tenant
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.TenantId = tenant.Id;
            await _context.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation("Created SaaS tenant {TenantId} with user pool {UserPoolId}", tenant.Id, userPoolId);

        return _mapper.Map<TenantDto>(tenant);
    }

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return $"clinic-{Guid.NewGuid().ToString("N")[..8]}";

        var slug = name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("'", "")
            .Replace("\"", "");

        // Keep only alphanumeric and hyphens
        slug = new string(slug.Where(c => char.IsLetterOrDigit(c) || c == '-').ToArray());

        // Remove consecutive hyphens and trim hyphens from ends
        while (slug.Contains("--"))
            slug = slug.Replace("--", "-");
        slug = slug.Trim('-');

        // Ensure minimum length and valid format
        if (string.IsNullOrEmpty(slug) || slug.Length < 3)
            slug = $"clinic-{Guid.NewGuid().ToString("N")[..8]}";

        // Max length 50 for URLs
        if (slug.Length > 50)
            slug = slug[..50].TrimEnd('-');

        return slug;
    }
}
