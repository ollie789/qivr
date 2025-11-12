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
        {
            // Update existing tenant with sample data if needed
            await SeedSampleDataForExistingTenant();
            return;
        }

        // Create test clinics (SaaS User Pools will be created later via API)
        var clinic1 = await CreateTestClinic("Demo Physio Clinic", "demo@qivr.pro");
        var clinic2 = await CreateTestClinic("Test Health Center", "test@qivr.pro");

        // Create system roles
        await CreateSystemRoles();

        // Create test users for each clinic
        await CreateTestUsers(clinic1.Id, "demo@qivr.pro");
        await CreateTestUsers(clinic2.Id, "test@qivr.pro");

        // Add sample data for analytics
        await SeedSampleAnalyticsData(clinic1.Id);

        await _context.SaveChangesAsync();
    }

    private async Task SeedSampleDataForExistingTenant()
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id.ToString() == "tenant_qivr_demo");
        if (tenant != null)
        {
            await SeedSampleAnalyticsData(tenant.Id);
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedSampleAnalyticsData(Guid tenantId)
    {
        // Skip if sample data already exists
        if (await _context.Providers.AnyAsync(p => p.Name == "Dr. Sarah Johnson"))
            return;

        // Create sample provider
        var provider = new Provider
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = "Dr. Sarah Johnson",
            Specialization = "General Practice",
            Email = "sarah.johnson@clinic.com",
            Phone = "+1-555-0123",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Providers.Add(provider);
        await _context.SaveChangesAsync(); // Save to get the provider ID

        // Create sample appointments
        var appointments = new[]
        {
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = Guid.NewGuid(),
                ProviderId = provider.Id,
                ProviderProfileId = Guid.NewGuid(),
                ScheduledStart = DateTime.UtcNow.AddDays(-2).AddHours(9),
                ScheduledEnd = DateTime.UtcNow.AddDays(-2).AddHours(9.5),
                Status = AppointmentStatus.Completed,
                AppointmentType = "Consultation",
                Notes = "Regular checkup completed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = Guid.NewGuid(),
                ProviderId = provider.Id,
                ProviderProfileId = Guid.NewGuid(),
                ScheduledStart = DateTime.UtcNow.AddDays(-2).AddHours(14.5),
                ScheduledEnd = DateTime.UtcNow.AddDays(-2).AddHours(14.75),
                Status = AppointmentStatus.Completed,
                AppointmentType = "Follow-up",
                Notes = "Follow-up visit completed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = Guid.NewGuid(),
                ProviderId = provider.Id,
                ProviderProfileId = Guid.NewGuid(),
                ScheduledStart = DateTime.UtcNow.AddDays(-1).AddHours(10.25),
                ScheduledEnd = DateTime.UtcNow.AddDays(-1).AddHours(10.75),
                Status = AppointmentStatus.NoShow,
                AppointmentType = "Consultation",
                Notes = "Patient did not show up",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = Guid.NewGuid(),
                ProviderId = provider.Id,
                ProviderProfileId = Guid.NewGuid(),
                ScheduledStart = DateTime.UtcNow.AddHours(11),
                ScheduledEnd = DateTime.UtcNow.AddHours(11.5),
                Status = AppointmentStatus.Scheduled,
                AppointmentType = "Consultation",
                Notes = "Upcoming appointment",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = Guid.NewGuid(),
                ProviderId = provider.Id,
                ProviderProfileId = Guid.NewGuid(),
                ScheduledStart = DateTime.UtcNow.AddHours(15.5),
                ScheduledEnd = DateTime.UtcNow.AddHours(15.75),
                Status = AppointmentStatus.Scheduled,
                AppointmentType = "Follow-up",
                Notes = "Upcoming follow-up",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Appointments.AddRange(appointments);
    }

    private async Task<Tenant> CreateTestClinic(string name, string email)
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = name.ToLower().Replace(" ", "-"),
            Status = TenantStatus.Active,
            CreatedAt = DateTime.UtcNow,
            Address = "123 Healthcare Ave, Medical District, City 12345",
            Phone = "+1-555-CLINIC",
            Email = email,
            Settings = new Dictionary<string, object>
            {
                ["theme"] = "default",
                ["features"] = new[] { "appointments", "patients", "analytics" },
                ["operations"] = new Dictionary<string, object>
                {
                    ["workingHours"] = new Dictionary<string, object>
                    {
                        ["monday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["tuesday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["wednesday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["thursday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["friday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["saturday"] = new { start = "09:00", end = "13:00", enabled = false },
                        ["sunday"] = new { start = "09:00", end = "13:00", enabled = false }
                    },
                    ["appointmentDuration"] = 30,
                    ["bufferTime"] = 15,
                    ["maxAdvanceBooking"] = 90,
                    ["allowOnlineBooking"] = true,
                    ["requireConfirmation"] = true,
                    ["sendReminders"] = true,
                    ["reminderHours"] = 24
                }
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
            new Role { Id = Guid.NewGuid(), Name = "Admin", Description = "System Administrator", IsSystem = true },
            new Role { Id = Guid.NewGuid(), Name = "Clinician", Description = "Healthcare Provider", IsSystem = true },
            new Role { Id = Guid.NewGuid(), Name = "Receptionist", Description = "Front Desk Staff", IsSystem = true }
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
            CreatedAt = DateTime.UtcNow
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
