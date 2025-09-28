using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Qivr.Core.Entities;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Services;

public class PromInstanceServiceTests : DatabaseTestBase
{
    [Fact]
    public async Task GetPromStatsAsync_ComputesAggregateMetrics()
    {
        var now = DateTime.UtcNow;

        var template = new PromTemplate
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            Key = "phq-9",
            Version = 1,
            Name = "PHQ-9",
            Category = "Mental Health",
            Frequency = "weekly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = Guid.NewGuid().ToString(),
                    ["text"] = "How often have you been bothered?",
                    ["type"] = "scale",
                    ["required"] = true
                }
            },
            CreatedAt = now.AddDays(-14),
            UpdatedAt = now.AddDays(-7)
        };

        Context.PromTemplates.Add(template);
        await Context.SaveChangesAsync();

        var patient = await CreateUserAsync(UserType.Patient, email: "patient-stats@test.local");

        Context.PromInstances.AddRange(
            new PromInstance
            {
                Id = Guid.NewGuid(),
                TenantId = TenantId,
                TemplateId = template.Id,
                PatientId = patient.Id,
                Status = PromStatus.Completed,
                ScheduledFor = now.AddDays(-5),
                DueDate = now.AddDays(-4),
                CompletedAt = now.AddDays(-4).AddMinutes(5),
                Score = 12m,
                ResponseData = new Dictionary<string, object>
                {
                    ["completionSeconds"] = 360,
                    ["answers"] = new Dictionary<string, object>()
                },
                CreatedAt = now.AddDays(-6),
                UpdatedAt = now.AddDays(-4)
            },
            new PromInstance
            {
                Id = Guid.NewGuid(),
                TenantId = TenantId,
                TemplateId = template.Id,
                PatientId = patient.Id,
                Status = PromStatus.Completed,
                ScheduledFor = now.AddDays(-10),
                DueDate = now.AddDays(-9),
                CompletedAt = now.AddDays(-9).AddMinutes(3),
                Score = 6m,
                ResponseData = new Dictionary<string, object>
                {
                    ["completionSeconds"] = 180
                },
                CreatedAt = now.AddDays(-11),
                UpdatedAt = now.AddDays(-9)
            },
            new PromInstance
            {
                Id = Guid.NewGuid(),
                TenantId = TenantId,
                TemplateId = template.Id,
                PatientId = patient.Id,
                Status = PromStatus.Pending,
                ScheduledFor = now.AddDays(2),
                DueDate = now.AddDays(5),
                ResponseData = new Dictionary<string, object>(),
                CreatedAt = now,
                UpdatedAt = now
            },
            new PromInstance
            {
                Id = Guid.NewGuid(),
                TenantId = TenantId,
                TemplateId = template.Id,
                PatientId = patient.Id,
                Status = PromStatus.Pending,
                ScheduledFor = now.AddDays(-8),
                DueDate = now.AddDays(-1),
                ResponseData = new Dictionary<string, object>(),
                CreatedAt = now.AddDays(-8),
                UpdatedAt = now.AddDays(-2)
            }
        );

        await Context.SaveChangesAsync();

        var notificationService = new Mock<INotificationService>();
        var service = new PromInstanceService(Context, notificationService.Object, NullLogger<PromInstanceService>.Instance);

        var stats = await service.GetPromStatsAsync(TenantId, template.Id, now.AddDays(-30), now.AddDays(7), CancellationToken.None);

        Assert.Equal(4, stats.TotalSent);
        Assert.Equal(2, stats.Completed);
        Assert.Equal(1, stats.Pending);
        Assert.Equal(1, stats.Scheduled);
        Assert.Equal(1, stats.Expired);
        Assert.Equal(50d, stats.CompletionRate); // 2 completed / 4 total = 50%
        Assert.Equal(4.5d, stats.AverageCompletionTimeMinutes);
        Assert.Equal(9d, stats.AverageScore);
    }
}
