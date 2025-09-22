using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Qivr.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Qivr.Api.Config;
using Microsoft.Extensions.Options;
using Qivr.Core.Entities;

namespace Qivr.Api.Controllers;

/// <summary>
/// SuperAdmin controller for managing all tenants, users, and authentication.
/// Only accessible to founders/super admins.
/// </summary>
[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : ControllerBase
{
    private readonly QivrDbContext _dbContext;
    private readonly ILogger<SuperAdminController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly JwtSettings _jwtSettings;

    public SuperAdminController(
        QivrDbContext dbContext,
        ILogger<SuperAdminController> logger,
        IWebHostEnvironment environment,
        IOptions<JwtSettings> jwtSettings)
    {
        _dbContext = dbContext;
        _logger = logger;
        _environment = environment;
        _jwtSettings = jwtSettings.Value;
    }

    // ========== TENANT MANAGEMENT ==========

    [HttpGet("tenants")]
    public async Task<IActionResult> GetAllTenants()
    {
        var tenants = await _dbContext.Tenants
            .Include(t => t.Users)
            .OrderBy(t => t.Name)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                Status = t.Status.ToString(),
                t.Plan,
                t.Timezone,
                t.Locale,
                UserCount = t.Users.Count,
                t.CreatedAt,
                t.UpdatedAt,
                t.Settings,
                t.Metadata,
                IsDeleted = t.DeletedAt.HasValue
            })
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = request.Slug,
            Status = TenantStatus.Active,
            Plan = request.Plan ?? "starter",
            Timezone = request.Timezone ?? "Australia/Sydney",
            Locale = request.Locale ?? "en-AU",
            Settings = request.Settings ?? new Dictionary<string, object>(),
            Metadata = request.Metadata ?? new Dictionary<string, object>()
        };

        _dbContext.Tenants.Add(tenant);
        var mainTenantId = tenants[0].Id;
        var demoPatient = users.First(u => u.UserType == UserType.Patient);

        if (!await _dbContext.PromTemplates.AnyAsync(t => t.TenantId == mainTenantId && t.Key == "phq9"))
        {
            var templateId = Guid.NewGuid();
            var template = new PromTemplate
            {
                Id = templateId,
                TenantId = mainTenantId,
                Key = "phq9",
                Version = 1,
                Name = "PHQ-9 Depression Scale",
                Description = "Patient Health Questionnaire for depression severity",
                Category = "Mental Health",
                Frequency = "Weekly",
                IsActive = true,
                Questions = new List<Dictionary<string, object>>
                {
                    new()
                    {
                        ["id"] = "q1",
                        ["text"] = "Little interest or pleasure in doing things",
                        ["type"] = "scale",
                        ["required"] = true,
                        ["options"] = new[] { "0", "1", "2", "3" }
                    },
                    new()
                    {
                        ["id"] = "q2",
                        ["text"] = "Feeling down, depressed, or hopeless",
                        ["type"] = "scale",
                        ["required"] = true,
                        ["options"] = new[] { "0", "1", "2", "3" }
                    }
                },
                ScoringMethod = new Dictionary<string, object>
                {
                    ["type"] = "sum"
                },
                ScoringRules = new Dictionary<string, object>
                {
                    ["low"] = 0,
                    ["medium"] = 10,
                    ["high"] = 15
                }
            };

            _dbContext.PromTemplates.Add(template);

            var instanceId = Guid.NewGuid();
            var scheduledAt = DateTime.UtcNow.AddDays(-7);
            var completedAt = DateTime.UtcNow.AddDays(-3);

            var instance = new PromInstance
            {
                Id = instanceId,
                TenantId = mainTenantId,
                TemplateId = templateId,
                PatientId = demoPatient.Id,
                Status = PromStatus.Completed,
                ScheduledFor = scheduledAt,
                DueDate = scheduledAt.AddDays(7),
                CompletedAt = completedAt,
                Score = 6m,
                ResponseData = new Dictionary<string, object>
                {
                    ["answers"] = new Dictionary<string, object>
                    {
                        ["q1"] = 3,
                        ["q2"] = 3
                    },
                    ["notificationMethod"] = "Email"
                }
            };

            _dbContext.PromInstances.Add(instance);

            _dbContext.PromResponses.Add(new PromResponse
            {
                Id = Guid.NewGuid(),
                TenantId = mainTenantId,
                PatientId = demoPatient.Id,
                PromInstanceId = instanceId,
                PromType = template.Key,
                CompletedAt = completedAt,
                Score = 6m,
                Severity = "moderate",
                Answers = new Dictionary<string, object>
                {
                    ["q1"] = 3,
                    ["q2"] = 3
                }
            });
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Tenant {TenantName} created with ID {TenantId}", 
            tenant.Name, tenant.Id);

        return Ok(new { tenant.Id, Message = "Tenant created successfully" });
    }

    [HttpPut("tenants/{tenantId}")]
    public async Task<IActionResult> UpdateTenant(Guid tenantId, [FromBody] UpdateTenantRequest request)
    {
        var tenant = await _dbContext.Tenants.FindAsync(tenantId);
        if (tenant == null) return NotFound();

        if (!string.IsNullOrEmpty(request.Name))
            tenant.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Slug))
            tenant.Slug = request.Slug;
        if (request.Status.HasValue)
            tenant.Status = request.Status.Value;
        if (!string.IsNullOrEmpty(request.Plan))
            tenant.Plan = request.Plan;
        if (!string.IsNullOrEmpty(request.Timezone))
            tenant.Timezone = request.Timezone;
        if (!string.IsNullOrEmpty(request.Locale))
            tenant.Locale = request.Locale;
        if (request.Settings != null)
            tenant.Settings = request.Settings;
        if (request.Metadata != null)
            tenant.Metadata = request.Metadata;

        tenant.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        
        return Ok(new { Message = "Tenant updated successfully" });
    }

    [HttpDelete("tenants/{tenantId}")]
    public async Task<IActionResult> DeleteTenant(Guid tenantId)
    {
        // Soft delete
        var tenant = await _dbContext.Tenants.FindAsync(tenantId);
        if (tenant == null) return NotFound();

        tenant.DeletedAt = DateTime.UtcNow;
        tenant.Status = TenantStatus.Cancelled;
        await _dbContext.SaveChangesAsync();
        
        return Ok(new { Message = "Tenant deleted" });
    }

    [HttpPost("tenants/{tenantId}/toggle-status")]
    public async Task<IActionResult> ToggleTenantStatus(Guid tenantId)
    {
        var tenant = await _dbContext.Tenants.FindAsync(tenantId);
        if (tenant == null) return NotFound();

        tenant.Status = tenant.Status == TenantStatus.Active 
            ? TenantStatus.Suspended 
            : TenantStatus.Active;
        
        tenant.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(new { 
            Message = $"Tenant status changed to {tenant.Status}",
            Status = tenant.Status.ToString()
        });
    }

    // ========== USER MANAGEMENT ==========

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers([FromQuery] Guid? tenantId = null)
    {
        var query = _dbContext.Users.AsQueryable();
        
        if (tenantId.HasValue)
            query = query.Where(u => u.TenantId == tenantId);

        var users = await query
            .Include(u => u.Tenant)
            .OrderBy(u => u.Email)
            .Select(u => new
            {
                u.Id,
                u.CognitoSub,
                u.Email,
                u.EmailVerified,
                u.Phone,
                u.PhoneVerified,
                u.FirstName,
                u.LastName,
                FullName = u.FullName,
                u.DateOfBirth,
                u.Gender,
                UserType = u.UserType.ToString(),
                u.Roles,
                u.AvatarUrl,
                u.TenantId,
                TenantName = u.Tenant != null ? u.Tenant.Name : null,
                u.CreatedAt,
                u.UpdatedAt,
                u.LastLoginAt,
                IsDeleted = u.DeletedAt.HasValue,
                u.DeletedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("users/{userId}")]
    public async Task<IActionResult> GetUser(Guid userId)
    {
        var user = await _dbContext.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.CognitoSub,
            user.Email,
            user.EmailVerified,
            user.Phone,
            user.PhoneVerified,
            user.FirstName,
            user.LastName,
            FullName = user.FullName,
            user.DateOfBirth,
            user.Gender,
            UserType = user.UserType.ToString(),
            user.Roles,
            user.AvatarUrl,
            user.TenantId,
            TenantName = user.Tenant?.Name,
            user.CreatedAt,
            user.UpdatedAt,
            user.LastLoginAt,
            user.Preferences,
            user.Consent,
            IsDeleted = user.DeletedAt.HasValue,
            user.DeletedAt
        });
    }

    [HttpPost("users/{userId}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(Guid userId, [FromBody] ResetPasswordRequest request)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return NotFound();

        // In a real system with Cognito, you'd reset through AWS
        // For dev purposes, we'll just log it
        _logger.LogWarning("Password reset requested for user {Email} to: {Password}", 
            user.Email, request.NewPassword);

        // Note: Real implementation would use Cognito API
        // await _cognitoService.AdminSetUserPassword(user.CognitoSub, request.NewPassword);
        
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "superadmin";
        await _dbContext.SaveChangesAsync();

        return Ok(new { Message = "Password reset successfully" });
    }

    [HttpPost("users/{userId}/toggle-delete")]
    public async Task<IActionResult> ToggleUserDelete(Guid userId)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (user.DeletedAt.HasValue)
        {
            // Restore user
            user.DeletedAt = null;
        }
        else
        {
            // Soft delete user
            user.DeletedAt = DateTime.UtcNow;
        }

        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "superadmin";
        await _dbContext.SaveChangesAsync();

        return Ok(new { 
            Message = user.DeletedAt.HasValue ? "User deleted" : "User restored",
            IsDeleted = user.DeletedAt.HasValue
        });
    }

    [HttpPut("users/{userId}/roles")]
    public async Task<IActionResult> UpdateUserRoles(Guid userId, [FromBody] UpdateRolesRequest request)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.Roles = request.Roles;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "superadmin";
        await _dbContext.SaveChangesAsync();

        return Ok(new { Message = "Roles updated successfully" });
    }

    [HttpPut("users/{userId}/type")]
    public async Task<IActionResult> UpdateUserType(Guid userId, [FromBody] UpdateUserTypeRequest request)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.UserType = request.UserType;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "superadmin";
        await _dbContext.SaveChangesAsync();

        return Ok(new { Message = "User type updated successfully" });
    }

    // ========== IMPERSONATION ==========

    [HttpPost("impersonate")]
    public IActionResult ImpersonateUser([FromBody] ImpersonateRequest request)
    {
        // Generate a token for the specified user
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, request.UserId.ToString()),
            new Claim("sub", request.UserId.ToString()),
            new Claim(ClaimTypes.Email, request.Email ?? "impersonated@qivr.health"),
            new Claim(ClaimTypes.Name, request.Name ?? "Impersonated User"),
            new Claim(ClaimTypes.Role, request.Role ?? "Patient"),
            new Claim("tenant_id", request.TenantId.ToString()),
            new Claim("custom:tenant_id", request.TenantId.ToString()),
            new Claim("impersonated_by", User.FindFirst(ClaimTypes.Email)?.Value ?? "superadmin"),
            new Claim("impersonation", "true")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(4); // Short-lived for security

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        _logger.LogWarning("Impersonation token generated for User {UserId} by {AdminEmail}",
            request.UserId, User.FindFirst(ClaimTypes.Email)?.Value);

        return Ok(new
        {
            token = tokenString,
            expiresIn = 14400,
            message = "Use this token to impersonate the user"
        });
    }

    // ========== SYSTEM HEALTH & DIAGNOSTICS ==========

    [HttpGet("health")]
    public async Task<IActionResult> GetSystemHealth()
    {
        var stats = new
        {
            TenantCount = await _dbContext.Tenants.CountAsync(),
            ActiveTenants = await _dbContext.Tenants.CountAsync(t => t.Status == TenantStatus.Active),
            SuspendedTenants = await _dbContext.Tenants.CountAsync(t => t.Status == TenantStatus.Suspended),
            UserCount = await _dbContext.Users.CountAsync(),
            DeletedUsers = await _dbContext.Users.CountAsync(u => u.DeletedAt.HasValue),
            PatientCount = await _dbContext.Users.CountAsync(u => u.UserType == UserType.Patient),
            StaffCount = await _dbContext.Users.CountAsync(u => u.UserType == UserType.Staff),
            AdminCount = await _dbContext.Users.CountAsync(u => u.UserType == UserType.Admin),
            Environment = _environment.EnvironmentName,
            Database = _dbContext.Database.CanConnect() ? "Connected" : "Disconnected",
            AuthMode = _environment.IsDevelopment() ? "Development (Simplified)" : "Production"
        };

        return Ok(stats);
    }

    [HttpPost("test-auth")]
    [AllowAnonymous]
    public IActionResult TestAuth([FromBody] TestAuthRequest request)
    {
        if (!_environment.IsDevelopment())
            return Forbid("Only available in development");

        try
        {
            // Try to decode the token
            var handler = new JwtSecurityTokenHandler();
            var token = handler.ReadJwtToken(request.Token);
            
            return Ok(new
            {
                Valid = token.ValidTo > DateTime.UtcNow,
                Claims = token.Claims.Select(c => new { c.Type, c.Value }),
                ExpiresAt = token.ValidTo,
                Issuer = token.Issuer,
                Audience = token.Audiences.FirstOrDefault()
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("cors-test")]
    [AllowAnonymous]
    public IActionResult TestCors()
    {
        return Ok(new 
        { 
            Message = "CORS is working",
            Origin = Request.Headers["Origin"].ToString(),
            Method = Request.Method,
            Headers = Request.Headers.Select(h => new { h.Key, Value = h.Value.ToString() })
        });
    }

    // ========== SEED DATA FOR TESTING ==========

    [HttpPost("seed-test-data")]
    public async Task<IActionResult> SeedTestData()
    {
        if (!_environment.IsDevelopment())
            return Forbid("Only available in development");

        // Create test tenants
        var tenants = new[]
        {
            new Tenant
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Demo Clinic",
                Slug = "demo",
                Status = TenantStatus.Active,
                Plan = "professional",
                Timezone = "Australia/Sydney",
                Locale = "en-AU"
            },
            new Tenant
            {
                Id = Guid.NewGuid(),
                Name = "Test Physiotherapy",
                Slug = "test-physio",
                Status = TenantStatus.Active,
                Plan = "starter"
            }
        };

        foreach (var tenant in tenants)
        {
            if (!await _dbContext.Tenants.AnyAsync(t => t.Id == tenant.Id))
            {
                _dbContext.Tenants.Add(tenant);
            }
        }

        // Create test users
        var users = new[]
        {
            new User
            {
                Id = Guid.NewGuid(),
                CognitoSub = Guid.NewGuid().ToString(),
                Email = "admin@qivr.health",
                FirstName = "Super",
                LastName = "Admin",
                TenantId = tenants[0].Id,
                UserType = UserType.Admin,
                Roles = new List<string> { "SuperAdmin" },
                EmailVerified = true
            },
            new User
            {
                Id = Guid.NewGuid(),
                CognitoSub = Guid.NewGuid().ToString(),
                Email = "clinic@demo.com",
                FirstName = "Clinic",
                LastName = "Admin",
                TenantId = tenants[0].Id,
                UserType = UserType.Admin,
                Roles = new List<string> { "ClinicAdmin" },
                EmailVerified = true
            },
            new User
            {
                Id = Guid.NewGuid(),
                CognitoSub = Guid.NewGuid().ToString(),
                Email = "staff@demo.com",
                FirstName = "Staff",
                LastName = "Member",
                TenantId = tenants[0].Id,
                UserType = UserType.Staff,
                Roles = new List<string> { "Practitioner" },
                EmailVerified = true
            },
            new User
            {
                Id = Guid.NewGuid(),
                CognitoSub = Guid.NewGuid().ToString(),
                Email = "patient@demo.com",
                FirstName = "Test",
                LastName = "Patient",
                TenantId = tenants[0].Id,
                UserType = UserType.Patient,
                Roles = new List<string> { "Patient" },
                EmailVerified = true
            }
        };

        foreach (var user in users)
        {
            if (!await _dbContext.Users.AnyAsync(u => u.Email == user.Email))
            {
                _dbContext.Users.Add(user);
            }
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new 
        { 
            Message = "Test data seeded successfully",
            Tenants = tenants.Select(t => new { t.Id, t.Name, t.Slug }),
            Users = users.Select(u => new { u.Email, u.FirstName, u.LastName, UserType = u.UserType.ToString() })
        });
    }
}

// Request DTOs

public class CreateTenantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Plan { get; set; }
    public string? Timezone { get; set; }
    public string? Locale { get; set; }
    public Dictionary<string, object>? Settings { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class UpdateTenantRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public TenantStatus? Status { get; set; }
    public string? Plan { get; set; }
    public string? Timezone { get; set; }
    public string? Locale { get; set; }
    public Dictionary<string, object>? Settings { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class UpdateUserTypeRequest
{
    public UserType UserType { get; set; }
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateRolesRequest
{
    public List<string> Roles { get; set; } = new();
}

public class ImpersonateRequest
{
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Role { get; set; }
}

public class TestAuthRequest
{
    public string Token { get; set; } = string.Empty;
}
