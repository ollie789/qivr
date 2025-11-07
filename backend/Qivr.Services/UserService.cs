using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public class UserService : IUserService
{
    private readonly QivrDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;

    public UserService(QivrDbContext context, IMapper mapper, ILogger<UserService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Guid> CreateUserAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating user {Email}", dto.Email);

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email, cancellationToken);
        if (existingUser != null)
        {
            _logger.LogWarning("User with email {Email} already exists", dto.Email);
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var user = _mapper.Map<User>(dto);
        // In a real scenario, we'd get the tenant from the context
        // For now, we'll use the demo tenant
        var demoTenant = await _context.Tenants.FirstAsync(t => t.Slug == "demo-clinic", cancellationToken);
        user.TenantId = demoTenant.Id;

        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {Email} created successfully with ID {UserId}", dto.Email, user.Id);
        return user.Id;
    }

    public async Task<UserDto?> GetUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto?> GetUserByCognitoSubAsync(string cognitoSub, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub, cancellationToken);
        if (user != null)
        {
            _logger.LogInformation("Found user {Email} with UserType: {UserType}", user.Email, user.UserType);
        }
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> GetOrCreateUserFromCognitoAsync(string cognitoSub, string email, string? givenName, string? familyName, string? phone, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub, cancellationToken);
        
        if (user == null)
        {
            _logger.LogInformation("Auto-creating user from Cognito: {Email} (sub: {CognitoSub})", email, cognitoSub);
            
            // Get or create default tenant
            var tenant = await _context.Tenants.FirstOrDefaultAsync(cancellationToken);
            if (tenant == null)
            {
                _logger.LogInformation("Creating default tenant");
                tenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = "Default Clinic",
                    Slug = "default-clinic",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.Tenants.AddAsync(tenant, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Get or create default clinic
            var clinic = await _context.Clinics.FirstOrDefaultAsync(c => c.TenantId == tenant.Id, cancellationToken);
            if (clinic == null)
            {
                _logger.LogInformation("Creating default clinic for tenant {TenantId}", tenant.Id);
                clinic = new Clinic
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    Name = tenant.Name,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.Clinics.AddAsync(clinic, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }

            user = new User
            {
                Id = Guid.NewGuid(),
                CognitoSub = cognitoSub,
                Email = email,
                FirstName = givenName ?? email.Split('@')[0],
                LastName = familyName ?? "",
                Phone = phone,
                UserType = UserType.Admin,
                TenantId = tenant.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            
            // Create provider profile for admin users
            var existingProvider = await _context.Providers.FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);
            if (existingProvider == null)
            {
                _logger.LogInformation("Creating provider profile for user {UserId}", user.Id);
                var provider = new Core.Entities.Provider
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    TenantId = tenant.Id,
                    ClinicId = clinic.Id,
                    Specialty = "General Practice",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.Providers.AddAsync(provider, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }
            
            _logger.LogInformation("Auto-created user {Email} with ID {UserId}", email, user.Id);
        }

        return _mapper.Map<UserDto>(user);
    }
}

public class TenantService : ITenantService
{
    private readonly QivrDbContext _context;
    private readonly IMapper _mapper;

    public TenantService(QivrDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

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
        var tenantIds = new HashSet<Guid>();

        var primaryUser = await _context.Users
            .Include(u => u.Tenant)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (primaryUser == null && !string.IsNullOrWhiteSpace(cognitoSub))
        {
            primaryUser = await _context.Users
                .Include(u => u.Tenant)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub, cancellationToken);
        }

        Guid? primaryTenantId = primaryUser?.TenantId;

        if (primaryUser != null && primaryUser.TenantId != Guid.Empty)
        {
            tenantIds.Add(primaryUser.TenantId);
        }

        if (primaryUser != null)
        {
            foreach (var linkedTenantId in ExtractLinkedTenantIds(primaryUser))
            {
                if (linkedTenantId != Guid.Empty)
                {
                    tenantIds.Add(linkedTenantId);
                }
            }
        }

        if (!tenantIds.Any() && primaryTenantId.HasValue)
        {
            tenantIds.Add(primaryTenantId.Value);
        }

        if (!tenantIds.Any() && !string.IsNullOrWhiteSpace(cognitoSub))
        {
            var tenantIdFromSub = await _context.Users.AsNoTracking()
                .Where(u => u.CognitoSub == cognitoSub)
                .Select(u => u.TenantId)
                .FirstOrDefaultAsync(cancellationToken);

            if (tenantIdFromSub != Guid.Empty)
            {
                tenantIds.Add(tenantIdFromSub);
                primaryTenantId ??= tenantIdFromSub;
            }
        }

        if (!tenantIds.Any())
        {
            return Array.Empty<TenantAccessDto>();
        }

        var tenantRecords = await _context.Tenants
            .AsNoTracking()
            .Where(t => tenantIds.Contains(t.Id))
            .Select(t => new { t.Id, t.Name, t.Slug })
            .ToListAsync(cancellationToken);

        var dto = tenantRecords
            .Select(t => new TenantAccessDto(
                t.Id,
                string.IsNullOrWhiteSpace(t.Name) ? t.Id.ToString() : t.Name,
                t.Slug,
                primaryTenantId.HasValue && t.Id == primaryTenantId.Value))
            .OrderByDescending(t => t.IsDefault)
            .ThenBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return dto;
    }

    private static IEnumerable<Guid> ExtractLinkedTenantIds(User user)
    {
        if (user.Preferences == null)
        {
            yield break;
        }

        if (user.Preferences.TryGetValue("linkedTenants", out var rawValue) && rawValue is not null)
        {
            foreach (var tenantId in ParseTenantIdentifiers(rawValue))
            {
                yield return tenantId;
            }
        }

        if (user.Preferences.TryGetValue("additionalTenants", out var extraValue) && extraValue is not null)
        {
            foreach (var tenantId in ParseTenantIdentifiers(extraValue))
            {
                yield return tenantId;
            }
        }
    }

    private static IEnumerable<Guid> ParseTenantIdentifiers(object value)
    {
        switch (value)
        {
            case Guid guidValue:
                yield return guidValue;
                yield break;
            case string stringValue:
                foreach (var parsed in ParseTenantIdentifiersFromString(stringValue))
                {
                    yield return parsed;
                }
                yield break;
            case JsonElement jsonElement:
                foreach (var parsed in ParseTenantIdentifiersFromJson(jsonElement))
                {
                    yield return parsed;
                }
                yield break;
            case IEnumerable<object> enumerable:
                foreach (var item in enumerable)
                {
                    foreach (var parsed in ParseTenantIdentifiers(item))
                    {
                        yield return parsed;
                    }
                }
                yield break;
        }

        yield break;
    }

    private static IEnumerable<Guid> ParseTenantIdentifiersFromJson(JsonElement jsonElement)
    {
        if (jsonElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in jsonElement.EnumerateArray())
            {
                foreach (var parsed in ParseTenantIdentifiersFromJson(item))
                {
                    yield return parsed;
                }
            }
        }
        else if (jsonElement.ValueKind == JsonValueKind.String)
        {
            foreach (var parsed in ParseTenantIdentifiersFromString(jsonElement.GetString()))
            {
                yield return parsed;
            }
        }
        else if (jsonElement.ValueKind == JsonValueKind.Object &&
                 jsonElement.TryGetProperty("id", out var idProperty) &&
                 idProperty.ValueKind == JsonValueKind.String &&
                 Guid.TryParse(idProperty.GetString(), out var guid))
        {
            yield return guid;
        }
    }

    private static IEnumerable<Guid> ParseTenantIdentifiersFromString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) yield break;

        var trimmed = value.Trim();

        if (Guid.TryParse(trimmed, out var directGuid))
        {
            yield return directGuid;
            yield break;
        }

        if (trimmed.StartsWith("[") && trimmed.EndsWith("]", StringComparison.Ordinal))
        {
            List<string>? array = null;
            try
            {
                array = JsonSerializer.Deserialize<List<string>>(trimmed);
            }
            catch
            {
                // Ignore deserialization errors and fall through to delimiter parsing
            }
            
            if (array != null)
            {
                foreach (var item in array)
                {
                    foreach (var parsed in ParseTenantIdentifiersFromString(item))
                    {
                        yield return parsed;
                    }
                }
                yield break;
            }
        }

        var parts = trimmed.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var part in parts)
        {
            if (Guid.TryParse(part, out var guid))
            {
                yield return guid;
            }
        }
    }
}
