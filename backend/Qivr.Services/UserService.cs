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

    public async Task<UserDto> GetOrCreateUserFromCognitoAsync(string cognitoSub, string email, string? givenName, string? familyName, string? phone, string? issuer = null, CancellationToken cancellationToken = default)
    {
        // First try to find by Cognito sub
        var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub, cancellationToken);
        
        if (user != null)
        {
            return _mapper.Map<UserDto>(user);
        }
        
        // Try to find by email (user may have been created via intake)
        user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        
        if (user != null)
        {
            // Link existing user to Cognito sub
            user.CognitoSub = cognitoSub;
            user.EmailVerified = true;
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Linked existing user {Email} to Cognito sub {Sub}", email, cognitoSub);
            return _mapper.Map<UserDto>(user);
        }
        
        // Create new user - find tenant from issuer (contains Cognito pool ID)
        Tenant? tenant = null;
        
        if (!string.IsNullOrEmpty(issuer))
        {
            // Issuer format: https://cognito-idp.{region}.amazonaws.com/{poolId}
            var poolId = issuer.Split('/').LastOrDefault();
            if (!string.IsNullOrEmpty(poolId))
            {
                tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.CognitoUserPoolId == poolId, cancellationToken);
                _logger.LogInformation("Found tenant by pool ID {PoolId}: {TenantId}", poolId, tenant?.Id);
            }
        }
        
        // Fall back to demo tenant
        tenant ??= await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == "demo-clinic", cancellationToken)
            ?? await _context.Tenants.FirstAsync(cancellationToken);
        
        user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CognitoSub = cognitoSub,
            Email = email,
            FirstName = givenName ?? "",
            LastName = familyName ?? "",
            Phone = phone,
            UserType = UserType.Patient,
            EmailVerified = true,
            PhoneVerified = false,
            Roles = new List<string>(),
            Preferences = new Dictionary<string, object>(),
            Consent = new Dictionary<string, object>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Created new user {Email} in tenant {TenantId} from Cognito sub {Sub}", 
            email, tenant.Id, cognitoSub);
        
        return _mapper.Map<UserDto>(user);
    }
}
