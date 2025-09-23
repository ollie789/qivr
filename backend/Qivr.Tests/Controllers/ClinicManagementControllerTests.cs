using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Qivr.Api.Controllers;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Controllers;

public class ClinicManagementControllerTests
{
    [Fact]
    public async Task GetClinics_ReturnsSeededClinicData()
    {
        var tenantId = Guid.NewGuid();
        var controller = CreateController(tenantId, out var context);

        var clinic = new Clinic
        {
            Name = "Integrated Care Center",
            Address = "123 Health St",
            City = "Springfield",
            State = "IL",
            ZipCode = "62701",
            Country = "USA",
            Phone = "+1-555-0100",
            Email = "info@care.local",
            Metadata = new Dictionary<string, object>()
        };
        context.Clinics.Add(clinic);

        var providerUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "jane.smith@care.local",
            FirstName = "Jane",
            LastName = "Smith",
            UserType = UserType.Staff,
            Roles = new List<string> { "Provider" }
        };
        var patientUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "john.doe@example.com",
            FirstName = "John",
            LastName = "Doe",
            UserType = UserType.Patient
        };
        context.Users.AddRange(providerUser, patientUser);

        var provider = new Provider
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = providerUser.Id,
            ClinicId = clinic.Id,
            Title = "Dr",
            Specialty = "General Practice",
            IsActive = true
        };
        context.Providers.Add(provider);

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ClinicId = clinic.Id,
            PatientId = patientUser.Id,
            ProviderId = providerUser.Id,
            AppointmentType = "Consult",
            Status = AppointmentStatus.Scheduled,
            ScheduledStart = DateTime.UtcNow.Date.AddHours(9),
            ScheduledEnd = DateTime.UtcNow.Date.AddHours(10)
        };
        context.Appointments.Add(appointment);

        var template = new PromTemplate
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Key = "phq-9",
            Version = 1,
            Name = "PHQ-9",
            Category = "Mental Health",
            Frequency = "Weekly",
            Questions = new List<Dictionary<string, object>>
            {
                new() { ["id"] = "q1", ["text"] = "How often?", ["type"] = "scale" }
            }
        };
        context.PromTemplates.Add(template);

        var promInstance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TemplateId = template.Id,
            PatientId = patientUser.Id,
            Status = PromStatus.Pending,
            ScheduledFor = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(7)
        };
        context.PromInstances.Add(promInstance);

        await context.SaveChangesAsync();

        var result = await controller.GetClinics();
        var ok = Assert.IsType<OkObjectResult>(result);
        var payload = ok.Value ?? throw new InvalidOperationException("Expected payload");

        var itemsProp = payload.GetType().GetProperty("items") ?? throw new InvalidOperationException("items property missing");
        var totalProp = payload.GetType().GetProperty("totalItems") ?? throw new InvalidOperationException("totalItems property missing");

        var items = Assert.IsAssignableFrom<ClinicDto[]>(itemsProp.GetValue(payload));
        Assert.Single(items);
        var clinicDto = items[0];
        Assert.Equal("Integrated Care Center", clinicDto.Name);
        Assert.Equal(1, clinicDto.ProviderCount);
        Assert.Equal(1, clinicDto.AppointmentsToday);
        Assert.Equal(1, clinicDto.PendingPROMs);

        var totalItems = Assert.IsType<int>(totalProp.GetValue(payload));
        Assert.Equal(1, totalItems);
    }

    [Fact]
    public async Task GetClinicDetails_ReturnsStatistics()
    {
        var tenantId = Guid.NewGuid();
        var controller = CreateController(tenantId, out var context);

        var clinic = new Clinic
        {
            Name = "Downtown Wellness",
            Address = "456 Wellness Ave",
            City = "Metropolis",
            State = "NY",
            ZipCode = "10001",
            Country = "USA",
            Metadata = new Dictionary<string, object>()
        };
        context.Clinics.Add(clinic);

        var providerUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "sarah.lee@wellness.local",
            FirstName = "Sarah",
            LastName = "Lee",
            UserType = UserType.Staff,
            Roles = new List<string> { "Provider" }
        };
        var patientUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "amy.pond@example.com",
            FirstName = "Amy",
            LastName = "Pond",
            UserType = UserType.Patient
        };
        context.Users.AddRange(providerUser, patientUser);

        context.Providers.Add(new Provider
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = providerUser.Id,
            ClinicId = clinic.Id,
            Title = "Dr",
            Specialty = "Physiotherapy",
            IsActive = true
        });

        context.Appointments.Add(new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ClinicId = clinic.Id,
            PatientId = patientUser.Id,
            ProviderId = providerUser.Id,
            AppointmentType = "Initial",
            Status = AppointmentStatus.Scheduled,
            ScheduledStart = DateTime.UtcNow.Date.AddHours(11),
            ScheduledEnd = DateTime.UtcNow.Date.AddHours(12)
        });

        await context.SaveChangesAsync();

        var result = await controller.GetClinicDetails(clinic.Id);
        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<ClinicDetailDto>(ok.Value);
        Assert.Equal(clinic.Id, dto.Id);
        Assert.Equal(1, dto.ProviderCount);
        Assert.Equal(1, dto.AppointmentsToday);
        Assert.Equal("USA", dto.Address.Country);
    }

    private static ClinicManagementController CreateController(Guid tenantId, out QivrDbContext context)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("tenant_id", tenantId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "SystemAdmin")
            }, "Test"))
        };

        var accessor = new HttpContextAccessor { HttpContext = httpContext };

        var options = new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        context = new QivrDbContext(options, accessor);
        context.Database.EnsureCreated();

        var clinicService = new ClinicManagementService(context, NullLogger<ClinicManagementService>.Instance);
        var authorizationService = new ResourceAuthorizationService(context, NullLogger<ResourceAuthorizationService>.Instance);

        var controller = new ClinicManagementController(
            context,
            authorizationService,
            NullLogger<ClinicManagementController>.Instance,
            clinicService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };

        return controller;
    }
}
