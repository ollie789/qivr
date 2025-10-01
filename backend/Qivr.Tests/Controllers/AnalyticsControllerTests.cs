using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Qivr.Api.Controllers;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Xunit;

namespace Qivr.Tests.Controllers;

public class AnalyticsControllerTests : DatabaseTestBase
{
    private AnalyticsController CreateController(Guid? userId = null)
    {
        var authService = new ResourceAuthorizationService(Context, NullLogger<ResourceAuthorizationService>.Instance);
        return new AnalyticsController(Context, NullLogger<AnalyticsController>.Instance, authService)
        {
            ControllerContext = CreateControllerContext(userId ?? TestUserId, role: "Patient")
        };
    }

    [Fact]
    public async Task GetHealthMetrics_ReturnsCalculatedMetrics()
    {
        await SeedPromDataAsync(TestUserId);

        var controller = CreateController();

        var result = await controller.GetHealthMetrics();
        var ok = Assert.IsType<OkObjectResult>(result);
        var metrics = Assert.IsAssignableFrom<List<AnalyticsHealthMetricDto>>(ok.Value);

        Assert.NotEmpty(metrics);
        Assert.Contains(metrics, m => m.Name == "Latest PROM Score" && m.Value > 0);
        Assert.Contains(metrics, m => m.Name == "PROM Completion Rate");
        Assert.Contains(metrics, m => m.Name == "Pending PROMs");
        Assert.Contains(metrics, m => m.Name == "Upcoming Appointments");
    }

    [Fact]
    public async Task GetPromAnalytics_GroupsResponsesByTemplate()
    {
        await SeedPromDataAsync(TestUserId);

        var controller = CreateController();

        var result = await controller.GetPromAnalytics();
        var ok = Assert.IsType<OkObjectResult>(result);
        var analytics = Assert.IsAssignableFrom<List<PROMAnalyticsDto>>(ok.Value);

        Assert.Single(analytics);
        var item = analytics[0];
        Assert.Equal("Baseline PHQ", item.TemplateName);
        Assert.True(item.CompletionRate >= 0);
        Assert.NotEmpty(item.TrendData);
    }

    [Fact]
    public async Task GetPatientTrends_ReturnsPromTrendSummary()
    {
        await SeedPromDataAsync(TestUserId);

        var controller = CreateController();

        var result = await controller.GetPatientTrends();
        var ok = Assert.IsType<OkObjectResult>(result);
        var trends = Assert.IsType<PatientTrendsDto>(ok.Value);

        Assert.NotEmpty(trends.PromTrends);
        Assert.True(trends.Summary.TotalDataPoints >= trends.PromTrends.Count);
        Assert.False(string.IsNullOrWhiteSpace(trends.Summary.OverallTrend));
    }

    private async Task SeedPromDataAsync(Guid patientId)
    {
        var now = DateTime.UtcNow;

        var template = new PromTemplate
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            Key = "baseline-phq",
            Version = 1,
            Name = "Baseline PHQ",
            Category = "Mental Health",
            Frequency = "weekly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = Guid.NewGuid().ToString(),
                    ["text"] = "Little interest or pleasure in doing things",
                    ["type"] = "scale",
                    ["required"] = true
                }
            },
            CreatedAt = now.AddDays(-30),
            UpdatedAt = now.AddDays(-5)
        };

        var completedInstance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            TemplateId = template.Id,
            Template = template,
            PatientId = patientId,
            Status = PromStatus.Completed,
            ScheduledFor = now.AddDays(-5),
            DueDate = now.AddDays(-4),
            CompletedAt = now.AddDays(-4).AddHours(1),
            CreatedAt = now.AddDays(-6),
            UpdatedAt = now.AddDays(-4),
            Score = 12m,
            ResponseData = new Dictionary<string, object>
            {
                ["completionSeconds"] = 360
            }
        };

        var completedResponse = new PromResponse
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            PatientId = patientId,
            PromInstanceId = completedInstance.Id,
            PromInstance = completedInstance,
            CompletedAt = completedInstance.CompletedAt ?? now.AddDays(-4),
            CreatedAt = completedInstance.CompletedAt ?? now.AddDays(-4),
            Score = 12m,
            Severity = "moderate",
            Answers = new Dictionary<string, object>()
        };

        completedInstance.Responses.Add(completedResponse);

        var previousInstance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            TemplateId = template.Id,
            Template = template,
            PatientId = patientId,
            Status = PromStatus.Completed,
            ScheduledFor = now.AddDays(-20),
            DueDate = now.AddDays(-19),
            CompletedAt = now.AddDays(-19).AddHours(2),
            CreatedAt = now.AddDays(-21),
            UpdatedAt = now.AddDays(-19),
            Score = 8m,
            ResponseData = new Dictionary<string, object>
            {
                ["completionSeconds"] = 300
            }
        };

        var previousResponse = new PromResponse
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            PatientId = patientId,
            PromInstanceId = previousInstance.Id,
            PromInstance = previousInstance,
            CompletedAt = previousInstance.CompletedAt ?? now.AddDays(-19),
            CreatedAt = previousInstance.CompletedAt ?? now.AddDays(-19),
            Score = 8m,
            Severity = "mild",
            Answers = new Dictionary<string, object>()
        };

        previousInstance.Responses.Add(previousResponse);

        var pendingInstance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            TemplateId = template.Id,
            Template = template,
            PatientId = patientId,
            Status = PromStatus.Pending,
            ScheduledFor = now.AddDays(2),
            DueDate = now.AddDays(3),
            CreatedAt = now,
            UpdatedAt = now,
            ResponseData = new Dictionary<string, object>()
        };

        Context.PromTemplates.Add(template);
        Context.PromInstances.AddRange(completedInstance, previousInstance, pendingInstance);
        Context.PromResponses.AddRange(completedResponse, previousResponse);

        var provider = await CreateProviderAsync();

        Context.Appointments.Add(new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            PatientId = patientId,
            ProviderId = provider.UserId,
            ProviderProfileId = provider.Id,
            AppointmentType = "follow-up",
            Status = AppointmentStatus.Scheduled,
            ScheduledStart = now.AddDays(4),
            ScheduledEnd = now.AddDays(4).AddMinutes(30),
            LocationType = LocationType.Telehealth,
            LocationDetails = new Dictionary<string, object>
            {
                ["meetingUrl"] = "https://video.test"
            },
            CreatedAt = now,
            UpdatedAt = now
        });

        await Context.SaveChangesAsync();
    }
}
