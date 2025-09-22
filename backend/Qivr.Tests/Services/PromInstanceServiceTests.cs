using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Services;

public class PromInstanceServiceTests
{
    [Fact]
    public async Task SubmitPromResponse_AppliesWeightedScoringAndSeverityRanges()
    {
        var tenantId = Guid.NewGuid();
        var question1Id = Guid.NewGuid();
        var question2Id = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new QivrDbContext(options);
        var promService = new PromService(context, NullLogger<PromService>.Instance);

        var templateDto = await promService.CreateOrVersionTemplateAsync(
            tenantId,
            new CreatePromTemplateDto
            {
                Key = "weighted-test",
                Name = "Weighted Test",
                Category = "Test",
                Frequency = "Monthly",
                Questions = new List<Dictionary<string, object>>
                {
                    new()
                    {
                        ["id"] = question1Id.ToString(),
                        ["text"] = "Pain level",
                        ["type"] = "scale",
                        ["required"] = true
                    },
                    new()
                    {
                        ["id"] = question2Id.ToString(),
                        ["text"] = "Mobility",
                        ["type"] = "scale",
                        ["required"] = true
                    }
                },
                ScoringMethod = new Dictionary<string, object>
                {
                    ["type"] = "weighted"
                },
                ScoringRules = new Dictionary<string, object>
                {
                    ["questions"] = new List<Dictionary<string, object>>
                    {
                        new()
                        {
                            ["id"] = question1Id.ToString(),
                            ["weight"] = 2
                        },
                        new()
                        {
                            ["id"] = question2Id.ToString(),
                            ["weight"] = 1
                        }
                    },
                    ["ranges"] = new List<Dictionary<string, object>>
                    {
                        new()
                        {
                            ["min"] = 0,
                            ["max"] = 1.9m,
                            ["label"] = "low"
                        },
                        new()
                        {
                            ["min"] = 2m,
                            ["max"] = 3.5m,
                            ["label"] = "medium"
                        },
                        new()
                        {
                            ["min"] = 3.6m,
                            ["label"] = "high"
                        }
                    }
                }
            },
            CancellationToken.None);

        var storedQuestion1Id = Guid.Parse(templateDto.Questions[0]["id"].ToString()!);
        var storedQuestion2Id = Guid.Parse(templateDto.Questions[1]["id"].ToString()!);

        var patient = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CognitoSub = Guid.NewGuid().ToString(),
            Email = "patient@example.com",
            UserType = UserType.Patient,
            FirstName = "Patient",
            LastName = "One"
        };

        context.Users.Add(patient);

        var templateEntity = await context.PromTemplates.SingleAsync();
        var instance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TemplateId = templateEntity.Id,
            Template = templateEntity,
            PatientId = patient.Id,
            Patient = patient,
            ScheduledFor = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(7)
        };

        context.PromInstances.Add(instance);
        await context.SaveChangesAsync();

        var notificationService = new Mock<INotificationService>();
        var service = new PromInstanceService(context, notificationService.Object, NullLogger<PromInstanceService>.Instance);

        var request = new PromSubmissionRequest
        {
            SubmittedAt = DateTime.UtcNow,
            Answers = new List<PromAnswer>
            {
                new() { QuestionId = storedQuestion1Id, Value = 3 },
                new() { QuestionId = storedQuestion2Id, Value = 2 }
            }
        };

        var dto = await service.SubmitPromResponseAsync(tenantId, instance.Id, request, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.True(dto.TotalScore.HasValue);
        Assert.Equal(8m / 3m, dto.TotalScore!.Value);

        var storedInstance = await context.PromInstances.FindAsync(instance.Id);
        Assert.Equal(8m / 3m, storedInstance!.Score);

        var storedResponse = await context.PromResponses.SingleAsync();
        Assert.Equal("medium", storedResponse.Severity);
    }
}
