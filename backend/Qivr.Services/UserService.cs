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
            
            // Auto-fix tenant association if needed
            var expectedTenantId = Guid.Parse("b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11");
            if (user.TenantId != expectedTenantId)
            {
                _logger.LogInformation("Fixing tenant association for user {Email}: {OldTenant} -> {NewTenant}", 
                    user.Email, user.TenantId, expectedTenantId);
                user.TenantId = expectedTenantId;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> GetOrCreateUserFromCognitoAsync(string cognitoSub, string email, string? givenName, string? familyName, string? phone, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub, cancellationToken);
        
        if (user == null)
        {
            _logger.LogInformation("Auto-creating user from Cognito: {Email} (sub: {CognitoSub})", email, cognitoSub);
            
            // Use consistent tenant ID that matches frontend expectations
            var expectedTenantId = Guid.Parse("b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11");
            
            // Get or create expected tenant
            var tenant = await _context.Tenants.FindAsync(expectedTenantId, cancellationToken);
            if (tenant == null)
            {
                _logger.LogInformation("Creating expected tenant: {TenantId}", expectedTenantId);
                tenant = new Tenant
                {
                    Id = expectedTenantId,
                    Name = "QIVR Demo Clinic",
                    Slug = "demo-clinic",
                    Settings = new Dictionary<string, object> 
                    { 
                        ["features"] = new[] { "appointments", "analytics", "messaging" } 
                    },
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.Tenants.AddAsync(tenant, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Get or create expected clinic
            var clinic = await _context.Clinics.FirstOrDefaultAsync(c => c.TenantId == tenant.Id, cancellationToken);
            if (clinic == null)
            {
                _logger.LogInformation("Creating expected clinic for tenant {TenantId}", tenant.Id);
                clinic = new Clinic
                {
                    Id = expectedTenantId, // Use same ID for clinic as tenant for consistency
                    TenantId = tenant.Id,
                    Name = tenant.Name,
                    Email = "clinic@qivr.health",
                    Phone = "+61 2 9876 5432",
                    Address = "123 Health Street",
                    City = "Sydney",
                    State = "NSW",
                    ZipCode = "2000",
                    Country = "Australia",
                    IsActive = true,
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
