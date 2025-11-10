using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;

namespace Qivr.Infrastructure.Data;

public class DataSeeder
{
    private readonly QivrDbContext _context;

    public DataSeeder(QivrDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        // Skip if data already exists
        if (await _context.Tenants.AnyAsync())
            return;

        // Create test clinics (SaaS User Pools will be created later via API)
        var clinic1 = await CreateTestClinic("Demo Physio Clinic", "demo@qivr.pro");
        var clinic2 = await CreateTestClinic("Test Health Center", "test@qivr.pro");

        // Create system roles
        await CreateSystemRoles();

        // Create test users for each clinic
        await CreateTestUsers(clinic1.Id, "demo@qivr.pro");
        await CreateTestUsers(clinic2.Id, "test@qivr.pro");

        await _context.SaveChangesAsync();
    }

    private async Task<Tenant> CreateTestClinic(string name, string email)
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = name,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            Settings = new Dictionary<string, object>
            {
                ["theme"] = "default",
                ["features"] = new[] { "appointments", "patients", "analytics" }
            }
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        return tenant;
    }

    private async Task CreateSystemRoles()
    {
        var roles = new[]
        {
            new Role { Id = Guid.NewGuid(), Name = "Admin", Description = "System Administrator", IsSystem = true, TenantId = null },
            new Role { Id = Guid.NewGuid(), Name = "Clinician", Description = "Healthcare Provider", IsSystem = true, TenantId = null },
            new Role { Id = Guid.NewGuid(), Name = "Receptionist", Description = "Front Desk Staff", IsSystem = true, TenantId = null }
        };

        _context.Roles.AddRange(roles);
    }

    private async Task CreateTestUsers(Guid tenantId, string email)
    {
        var adminRole = await _context.Roles.FirstAsync(r => r.Name == "Admin" && r.IsSystem);
        
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = email,
            FirstName = "Test",
            LastName = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            Preferences = new Dictionary<string, object>
            {
                ["theme"] = "light",
                ["notifications"] = true
            }
        };

        _context.Users.Add(user);
        
        // Assign admin role
        _context.UserRoles.Add(new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RoleId = adminRole.Id,
            TenantId = tenantId,
            AssignedAt = DateTime.UtcNow
        });
    }
}
