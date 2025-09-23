using System;
using System.Collections.Generic;
using System.Linq;
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
using Xunit;

namespace Qivr.Tests.Controllers;

public class AnalyticsControllerTests
{
    [Fact]
    public async Task GetHealthMetrics_ReturnsCalculatedMetrics()
    {
        var tenantId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var controller = CreateController(tenantId, patientId, out var context);

        SeedPromData(context, tenantId, patientId);
        await context.SaveChangesAsync();

        var result = await controller.GetHealthMetrics();
        var ok = Assert.IsType<OkObjectResult>(result);
        var metrics = Assert.IsAssignableFrom<List<AnalyticsHealthMetricDto>>(ok.Value);

        Assert.Contains(metrics, m => m.Name == "Latest PROM Score" && m.Value > 0);
        Assert.Contains(metrics, m => m.Name == "PROM Completion Rate" && m.Value >= 0);
        Assert.Contains(metrics, m => m.Name == "Pending PROMs");
        Assert.Contains(metrics, m => m.Name == "Upcoming Appointments");
    }

    [Fact]
    public async Task GetPromAnalytics_GroupsResponsesByTemplate()
    {
        var tenantId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var controller = CreateController(tenantId, patientId, out var context);

        SeedPromData(context, tenantId, patientId);
        await context.SaveChangesAsync();

        var result = await controller.GetPromAnalytics();
        var ok = Assert.IsType<OkObjectResult>(result);
        var analytics = Assert.IsAssignableFrom<List<PROMAnalyticsDto>>(ok.Value);

        Assert.Single(analytics);
        var item = analytics[0];
        Assert.Equal("PHQ-9", item.TemplateName);
        Assert.True(item.CompletionRate >= 0);
        Assert.NotEmpty(item.TrendData);
    }

    [Fact]
    public async Task GetPatientTrends_ReturnsPromTrendSummary()
    {
        var tenantId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var controller = CreateController(tenantId, patientId, out var context);

        SeedPromData(context, tenantId, patientId);
        await context.SaveChangesAsync();

        var result = await controller.GetPatientTrends();
        var ok = Assert.IsType<OkObjectResult>(result);
        var trends = Assert.IsType<PatientTrendsDto>(ok.Value);

        Assert.NotEmpty(trends.PromTrends);
        Assert.Equal(trends.PromTrends.Count, trends.Summary.TotalDataPoints);
        Assert.False(string.IsNullOrWhiteSpace(trends.Summary.OverallTrend));
    }

    private static AnalyticsController CreateController(Guid tenantId, Guid patientId, out QivrDbContext context)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("tenant_id", tenantId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, patientId.ToString()),
                new Claim(ClaimTypes.Role, "Patient")
            }, "Test"))
        };
        httpContext.Request.Headers["X-Tenant-Id"] = tenantId.ToString();

        var accessor = new HttpContextAccessor { HttpContext = httpContext };

        var options = new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        context = new QivrDbContext(options, accessor);
        context.Database.EnsureCreated();

        var authorizationService = new ResourceAuthorizationService(context, NullLogger<ResourceAuthorizationService>.Instance);

        var controller = new AnalyticsController(
            context,
            NullLogger<AnalyticsController>.Instance,
            authorizationService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };

        return controller;
    }

    private static void SeedPromData(QivrDbContext context, Guid tenantId, Guid patientId)
    {
        var template = new PromTemplate
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Key = "phq-9",
            Version = 1,
            Name = "PHQ-9",
            Category = "Mental Health",
            Frequency = "Weekly",
            Questions = new List<Dictionary<string, object>>()
        };

        var completedInstance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TemplateId = template.Id,
            Template = template,
            PatientId = patientId,
            Status = PromStatus.Completed,
            ScheduledFor = DateTime.UtcNow.AddDays(-3),
            DueDate = DateTime.UtcNow.AddDays(-2)
        };

        var pendingInstance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TemplateId = template.Id,
            Template = template,
            PatientId = patientId,
            Status = PromStatus.Pending,
            ScheduledFor = DateTime.UtcNow.AddDays(-1),
            DueDate = DateTime.UtcNow.AddDays(2)
        };

        var previousInstance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TemplateId = template.Id,
            Template = template,
            PatientId = patientId,
            Status = PromStatus.Completed,
            ScheduledFor = DateTime.UtcNow.AddDays(-40),
            DueDate = DateTime.UtcNow.AddDays(-39)
        };

        var recentResponse = new PromResponse
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            PromInstanceId = completedInstance.Id,
            PromInstance = completedInstance,
            CompletedAt = DateTime.UtcNow.AddDays(-2),
            Score = 78,
            Severity = "Moderate",
            Answers = new Dictionary<string, object> { { "q1", 3 } }
        };
        completedInstance.Responses.Add(recentResponse);

        var previousResponse = new PromResponse
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            PromInstanceId = previousInstance.Id,
            PromInstance = previousInstance,
            CompletedAt = DateTime.UtcNow.AddDays(-38),
            Score = 60,
            Severity = "Mild",
            Answers = new Dictionary<string, object> { { "q1", 2 } }
        };
        previousInstance.Responses.Add(previousResponse);

        context.PromTemplates.Add(template);
        context.PromInstances.AddRange(completedInstance, pendingInstance, previousInstance);
        context.PromResponses.AddRange(recentResponse, previousResponse);

        var clinicId = Guid.NewGuid();
        context.Clinics.Add(new Clinic
        {
            Id = clinicId,
            TenantId = tenantId,
            Name = "Primary Clinic",
            Address = "100 Health Way",
            City = "Metropolis",
            State = "NY",
            ZipCode = "10001",
            Country = "USA",
            Phone = "+1-555-0100",
            Email = "clinic@example.com"
        });

        context.Appointments.AddRange(
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientId,
                ProviderId = Guid.NewGuid(),
                ClinicId = clinicId,
                Status = AppointmentStatus.Scheduled,
                AppointmentType = "Consult",
                ScheduledStart = DateTime.UtcNow.AddDays(5),
                ScheduledEnd = DateTime.UtcNow.AddDays(5).AddHours(1)
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientId,
                ProviderId = Guid.NewGuid(),
                ClinicId = clinicId,
                Status = AppointmentStatus.Completed,
                AppointmentType = "Follow-up",
                ScheduledStart = DateTime.UtcNow.AddDays(-5),
                ScheduledEnd = DateTime.UtcNow.AddDays(-5).AddHours(1)
            });
    }
}
