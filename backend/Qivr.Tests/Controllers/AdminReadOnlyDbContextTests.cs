using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Xunit;

namespace Qivr.Tests.Controllers;

/// <summary>
/// Tests to verify AdminReadOnlyDbContext works correctly for cross-tenant queries
/// </summary>
public class AdminReadOnlyDbContextTests
{
    [Fact]
    public void AdminReadOnlyDbContext_CanQueryResearchPartners_WithoutTenantFilter()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AdminReadOnlyDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new AdminReadOnlyDbContext(options);
        
        var partner = new ResearchPartner
        {
            Id = Guid.NewGuid(),
            Name = "Test Partner",
            Slug = "test-partner",
            ContactEmail = "test@partner.com",
            IsActive = true
        };
        context.ResearchPartners.Add(partner);
        context.SaveChanges();

        // Act
        var result = context.ResearchPartners.FirstOrDefault(p => p.Slug == "test-partner");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Partner", result.Name);
    }

    [Fact]
    public void AdminReadOnlyDbContext_CanQueryMedicalDevices_WithoutTenantFilter()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AdminReadOnlyDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new AdminReadOnlyDbContext(options);
        
        var partnerId = Guid.NewGuid();
        var partner = new ResearchPartner
        {
            Id = partnerId,
            Name = "Device Partner",
            Slug = "device-partner",
            ContactEmail = "devices@partner.com",
            IsActive = true
        };
        context.ResearchPartners.Add(partner);

        var device = new MedicalDevice
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId,
            Name = "Test Device",
            DeviceCode = "TD-001",
            Category = "Test Category",
            IsActive = true
        };
        context.MedicalDevices.Add(device);
        context.SaveChanges();

        // Act
        var result = context.MedicalDevices.FirstOrDefault(d => d.DeviceCode == "TD-001");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Device", result.Name);
    }

    [Fact]
    public void AdminReadOnlyDbContext_CanQueryPartnerAffiliations_AcrossTenants()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AdminReadOnlyDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new AdminReadOnlyDbContext(options);
        
        var partnerId = Guid.NewGuid();
        var tenant1Id = Guid.NewGuid();
        var tenant2Id = Guid.NewGuid();

        var partner = new ResearchPartner
        {
            Id = partnerId,
            Name = "Multi-Tenant Partner",
            Slug = "multi-tenant",
            ContactEmail = "multi@partner.com",
            IsActive = true
        };
        context.ResearchPartners.Add(partner);

        // Add affiliations from different tenants
        context.PartnerClinicAffiliations.Add(new PartnerClinicAffiliation
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId,
            TenantId = tenant1Id,
            Status = AffiliationStatus.Active,
            DataSharingLevel = DataSharingLevel.Aggregated
        });
        context.PartnerClinicAffiliations.Add(new PartnerClinicAffiliation
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId,
            TenantId = tenant2Id,
            Status = AffiliationStatus.Active,
            DataSharingLevel = DataSharingLevel.Detailed
        });
        context.SaveChanges();

        // Act - should get affiliations from ALL tenants
        var affiliations = context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId)
            .ToList();

        // Assert
        Assert.Equal(2, affiliations.Count);
    }

    [Fact]
    public void AdminReadOnlyDbContext_CanQueryTenants_ForAdminOperations()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AdminReadOnlyDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new AdminReadOnlyDbContext(options);
        
        context.Tenants.Add(new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Clinic A",
            Slug = "clinic-a",
            IsActive = true
        });
        context.Tenants.Add(new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Clinic B",
            Slug = "clinic-b",
            IsActive = true
        });
        context.SaveChanges();

        // Act
        var tenants = context.Tenants.ToList();

        // Assert
        Assert.Equal(2, tenants.Count);
    }

    [Fact]
    public void AdminReadOnlyDbContext_IgnoresAppointmentNavigationProperties()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AdminReadOnlyDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new AdminReadOnlyDbContext(options);
        
        var tenantId = Guid.NewGuid();
        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            ScheduledStart = DateTime.UtcNow,
            ScheduledEnd = DateTime.UtcNow.AddHours(1),
            Status = AppointmentStatus.Scheduled
        };
        context.Appointments.Add(appointment);
        
        // Act & Assert - should not throw due to navigation property issues
        var exception = Record.Exception(() => context.SaveChanges());
        Assert.Null(exception);

        var result = context.Appointments.FirstOrDefault();
        Assert.NotNull(result);
    }

    [Fact]
    public void AdminReadOnlyDbContext_CanQueryPatientDeviceUsage_AcrossTenants()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AdminReadOnlyDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new AdminReadOnlyDbContext(options);
        
        var deviceId = Guid.NewGuid();
        var tenant1Id = Guid.NewGuid();
        var tenant2Id = Guid.NewGuid();

        // Add device usage from different tenants
        context.PatientDeviceUsages.Add(new PatientDeviceUsage
        {
            Id = Guid.NewGuid(),
            DeviceId = deviceId,
            TenantId = tenant1Id,
            PatientId = Guid.NewGuid(),
            TreatmentPlanId = Guid.NewGuid(),
            ProcedureDate = DateTime.UtcNow.AddMonths(-1)
        });
        context.PatientDeviceUsages.Add(new PatientDeviceUsage
        {
            Id = Guid.NewGuid(),
            DeviceId = deviceId,
            TenantId = tenant2Id,
            PatientId = Guid.NewGuid(),
            TreatmentPlanId = Guid.NewGuid(),
            ProcedureDate = DateTime.UtcNow.AddMonths(-2)
        });
        context.SaveChanges();

        // Act - should get usage from ALL tenants
        var usages = context.PatientDeviceUsages
            .Where(u => u.DeviceId == deviceId)
            .ToList();

        // Assert
        Assert.Equal(2, usages.Count);
    }
}
