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
            _logger.LogWarning("User not found for Cognito sub: {CognitoSub}. User should be created during tenant registration.", cognitoSub);
            throw new InvalidOperationException("User not found. Please register your clinic first.");
        }
        
        // User exists, return it
        return _mapper.Map<UserDto>(user);
    }
}
