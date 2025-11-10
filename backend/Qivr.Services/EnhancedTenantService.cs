using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IEnhancedTenantService : ITenantService
{
    Task<TenantDto> CreateSaasTenantAsync(string name, string address, string phone, string email, Guid userId, CancellationToken cancellationToken = default);
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

        // Create Cognito User Pool for tenant isolation
        var userPoolId = await _saasTenantService.CreateTenantUserPoolAsync(name, cancellationToken);
        var userPoolClientId = await _saasTenantService.CreateTenantUserPoolClientAsync(userPoolId, name, cancellationToken);

        var tenant = new Tenant
        {
            Name = name,
            Slug = GenerateSlug(name),
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
        return name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("&", "and");
    }
}
