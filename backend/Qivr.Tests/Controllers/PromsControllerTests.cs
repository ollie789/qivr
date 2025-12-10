using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Qivr.Api.Controllers;
using Qivr.Core.Entities;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Controllers;

public class PromsControllerTests : DatabaseTestBase
{
    private PromsController CreateController(IPromService promService, IPromInstanceService promInstanceService, bool includeUser = true, Guid? userId = null)
    {
        var controller = new PromsController(promService, promInstanceService, NullLogger<PromsController>.Instance);
        controller.ControllerContext = includeUser
            ? CreateControllerContext(userId)
            : ControllerTestHelper.BuildAnonymousContext(TenantId);
        return controller;
    }

    [Fact]
    public async Task CreateTemplate_PersistsStructuredFields()
    {
        // Arrange
        var promService = new PromService(Context, NullLogger<PromService>.Instance, Mock.Of<IPromTemplateSyncService>());
        var promInstanceService = new Mock<IPromInstanceService>();
        var controller = CreateController(promService, promInstanceService.Object);

        var request = new CreatePromTemplateDto
        {
            Key = "phq-9",
            Name = "PHQ-9",
            Description = "Depression screener",
            Category = "Mental Health",
            Frequency = "Weekly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = "q1",
                    ["text"] = "Little interest or pleasure in doing things",
                    ["type"] = "scale",
                    ["required"] = true,
                    ["options"] = new[] { 0, 1, 2, 3 }
                }
            },
            ScoringMethod = new Dictionary<string, object>
            {
                ["type"] = "sum"
            },
            ScoringRules = new Dictionary<string, object>
            {
                ["low"] = 0,
                ["moderate"] = 10,
                ["high"] = 20
            }
        };

        // Act
        var response = await controller.CreateOrVersionTemplate(request, CancellationToken.None);

        // Assert - Controller response
        var created = Assert.IsType<CreatedAtActionResult>(response.Result);
        var dto = Assert.IsType<PromTemplateDto>(created.Value);
        Assert.Equal(request.Category, dto.Category);
        Assert.Equal(request.Frequency, dto.Frequency);
        Assert.Single(dto.Questions);
        Assert.Equal("sum", dto.ScoringMethod?["type"]?.ToString());

        // Assert - Database persistence
        var stored = await Context.PromTemplates
            .AsNoTracking()
            .Where(t => t.TenantId == TenantId)
            .SingleAsync();
        Assert.Equal(request.Category, stored.Category);
        Assert.Equal(request.Frequency, stored.Frequency);
        Assert.Single(stored.Questions);
        Assert.Equal("sum", stored.ScoringMethod?["type"]?.ToString());

        // Assert - Can be retrieved through service
        using var verificationContext = CreateScopedContext();
        var verificationService = new PromService(verificationContext, NullLogger<PromService>.Instance, Mock.Of<IPromTemplateSyncService>());
        var reloaded = await verificationService.GetTemplateAsync(TenantId, request.Key, dto.Version, CancellationToken.None);
        Assert.NotNull(reloaded);
        Assert.Single(reloaded!.Questions);
        Assert.Equal("sum", reloaded.ScoringMethod?["type"]?.ToString());
        Assert.Equal(dto.Id, reloaded.Id);
    }

    [Fact]
    public async Task ListTemplates_ExposesExpandedSummaryFields()
    {
        // Arrange
        var service = new PromService(Context, NullLogger<PromService>.Instance, Mock.Of<IPromTemplateSyncService>());
        var controller = CreateController(service, Mock.Of<IPromInstanceService>());

        // Create a template
        await service.CreateOrVersionTemplateAsync(TenantId, new CreatePromTemplateDto
        {
            Key = "gad-7",
            Name = "GAD-7",
            Category = "Mental Health",
            Frequency = "monthly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = "legacy",
                    ["text"] = "Feeling nervous, anxious, or on edge",
                    ["type"] = "scale",
                    ["required"] = true
                }
            }
        }, CancellationToken.None);

        // Act
        var result = await controller.ListTemplates(ct: CancellationToken.None);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var summaries = Assert.IsAssignableFrom<IReadOnlyList<PromTemplateSummaryDto>>(ok.Value);
        var summary = Assert.Single(summaries);
        Assert.Equal("Mental Health", summary.Category);
        Assert.Equal("monthly", summary.Frequency);
        Assert.True(summary.IsActive);
        Assert.Single(summary.Questions);
        Assert.True(Guid.TryParse(summary.Questions[0]["id"].ToString(), out _));
    }

    [Fact]
    public async Task ListTenantInstances_ReturnsStatsAndPagedData()
    {
        var promService = new Mock<IPromService>();
        var promInstanceService = new Mock<IPromInstanceService>();
        var controller = CreateController(promService.Object, promInstanceService.Object);

        var now = DateTime.UtcNow;

        promInstanceService
            .Setup(s => s.GetPromInstancesAsync(
                TenantId,
                It.IsAny<Guid?>(),
                It.IsAny<string?>(),
                It.IsAny<Guid?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PromInstanceDto>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    TemplateId = Guid.NewGuid(),
                    TemplateName = "Baseline PHQ",
                    PatientId = Guid.NewGuid(),
                    PatientName = "Ada Lovelace",
                    Status = PromStatus.Completed.ToString(),
                    CreatedAt = now.AddDays(-5),
                    ScheduledAt = now.AddDays(-5),
                    DueDate = now.AddDays(-2),
                    CompletedAt = now.AddDays(-2),
                    TotalScore = 9m,
                    QuestionCount = 9,
                    AnsweredCount = 9
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    TemplateId = Guid.NewGuid(),
                    TemplateName = "Follow-up",
                    PatientId = Guid.NewGuid(),
                    PatientName = "Grace Hopper",
                    Status = PromStatus.Pending.ToString(),
                    CreatedAt = now.AddDays(-1),
                    ScheduledAt = now.AddDays(-1),
                    DueDate = now.AddDays(3),
                    TotalScore = null,
                    QuestionCount = 7,
                    AnsweredCount = 0
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    TemplateId = Guid.NewGuid(),
                    TemplateName = "Burst",
                    PatientId = Guid.NewGuid(),
                    PatientName = "Alan Turing",
                    Status = PromStatus.Cancelled.ToString(),
                    CreatedAt = now.AddDays(-4),
                    ScheduledAt = now.AddDays(-4),
                    DueDate = now.AddDays(-1),
                    TotalScore = 0m,
                    QuestionCount = 5,
                    AnsweredCount = 0
                }
            });

        var result = await controller.ListTenantInstances(null, null, null, null, null, page: 1, limit: 2, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PromResponseListDto>(ok.Value);

        Assert.Equal(3, dto.Total);
        Assert.Equal(2, dto.Data.Count);
        Assert.Equal(1, dto.Stats.CompletedCount);
        Assert.Equal(1, dto.Stats.CancelledCount);
        Assert.True(dto.Stats.CompletionRate > 0d);
        Assert.Equal(PromStatus.Completed.ToString(), dto.Data.First().Status);

        promInstanceService.Verify(s => s.GetPromInstancesAsync(
            TenantId,
            null,
            null,
            null,
            null,
            null,
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateTemplate_NormalizesQuestionIdentifiers()
    {
        var promService = new PromService(Context, NullLogger<PromService>.Instance, Mock.Of<IPromTemplateSyncService>());
        var controller = CreateController(promService, Mock.Of<IPromInstanceService>());

        var createRequest = new CreatePromTemplateDto
        {
            Key = "legacy-template",
            Name = "Legacy Template",
            Category = "General",
            Frequency = "weekly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = "legacy-q1",
                    ["text"] = "First question",
                    ["type"] = "scale",
                    ["required"] = true
                },
                new()
                {
                    ["id"] = "legacy-q2",
                    ["text"] = "Second question",
                    ["type"] = "scale",
                    ["required"] = true,
                    ["conditionalLogic"] = new Dictionary<string, object>
                    {
                        ["showIf"] = "legacy-q1",
                        ["operator"] = "equals",
                        ["value"] = 1
                    }
                }
            }
        };

        var createResponse = await controller.CreateOrVersionTemplate(createRequest, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(createResponse.Result);
        var dto = Assert.IsType<PromTemplateDto>(created.Value);

        var updateRequest = new UpdatePromTemplateDto
        {
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = "legacy-q1",
                    ["text"] = "Updated first",
                    ["type"] = "scale",
                    ["required"] = true
                },
                new()
                {
                    ["id"] = "legacy-q2",
                    ["text"] = "Updated second",
                    ["type"] = "scale",
                    ["required"] = true,
                    ["conditionalLogic"] = new Dictionary<string, object>
                    {
                        ["showIf"] = "legacy-q1",
                        ["operator"] = "equals",
                        ["value"] = 2
                    }
                }
            }
        };

        var updateResult = await controller.UpdateTemplate(dto.Id, updateRequest, CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(updateResult.Result);
        var updated = Assert.IsType<PromTemplateDto>(ok.Value);

        var ids = updated.Questions.Select(q => q["id"].ToString()).ToList();
        Assert.All(ids, id => Assert.True(Guid.TryParse(id, out _)));

        var conditional = Assert.IsAssignableFrom<IDictionary<string, object>>(updated.Questions[1]["conditionalLogic"]);
        Assert.Contains(conditional["showIf"].ToString(), ids);

        using var verificationContext = CreateScopedContext();
        var stored = await verificationContext.PromTemplates.AsNoTracking().FirstAsync(t => t.Id == dto.Id);
        Assert.All(stored.Questions, q => Assert.True(Guid.TryParse(q["id"].ToString(), out _)));
    }

    [Fact]
    public async Task DeleteTemplate_SoftDeletesWhenInstancesExist()
    {
        // Arrange
        var promService = new PromService(Context, NullLogger<PromService>.Instance, Mock.Of<IPromTemplateSyncService>());
        var promInstanceService = new Mock<IPromInstanceService>();
        var controller = CreateController(promService, promInstanceService.Object);
        
        // Create a patient user for the instance
        var patient = await CreateUserAsync(UserType.Patient);

        // Create template
        var createRequest = new CreatePromTemplateDto
        {
            Key = "deletable",
            Name = "Deletable",
            Category = "General",
            Frequency = "monthly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = "q1",
                    ["text"] = "Question",
                    ["type"] = "scale",
                    ["required"] = true
                }
            }
        };

        var createResponse = await controller.CreateOrVersionTemplate(createRequest, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(createResponse.Result);
        var dto = Assert.IsType<PromTemplateDto>(created.Value);

        // Create an instance linked to this template
        Context.PromInstances.Add(new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            TemplateId = dto.Id,
            PatientId = patient.Id,
            Status = PromStatus.Completed,
            ScheduledFor = DateTime.UtcNow.AddDays(-2),
            DueDate = DateTime.UtcNow.AddDays(-1),
            CompletedAt = DateTime.UtcNow.AddDays(-1),
            ResponseData = new Dictionary<string, object>()
        });
        await Context.SaveChangesAsync();

        // Act
        var deleteResult = await controller.DeleteTemplate(dto.Id, CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(deleteResult);
        
        using var verificationContext = CreateScopedContext();
        var stored = await verificationContext.PromTemplates
            .AsNoTracking()
            .FirstAsync(t => t.Id == dto.Id);
        Assert.False(stored.IsActive);
    }

    [Fact]
    public async Task DeleteTemplate_RemovesTemplateWhenUnused()
    {
        // Arrange
        var promService = new PromService(Context, NullLogger<PromService>.Instance, Mock.Of<IPromTemplateSyncService>());
        var promInstanceService = new Mock<IPromInstanceService>();
        var controller = CreateController(promService, promInstanceService.Object);

        // Create template
        var createRequest = new CreatePromTemplateDto
        {
            Key = "temp-delete",
            Name = "To delete",
            Category = "General",
            Frequency = "weekly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = "q1",
                    ["text"] = "Question",
                    ["type"] = "text",
                    ["required"] = true
                }
            }
        };

        var createResponse = await controller.CreateOrVersionTemplate(createRequest, CancellationToken.None);
        var created = Assert.IsType<CreatedAtActionResult>(createResponse.Result);
        var dto = Assert.IsType<PromTemplateDto>(created.Value);

        // Act
        var deleteResult = await controller.DeleteTemplate(dto.Id, CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(deleteResult);
        
        using var verificationContext = CreateScopedContext();
        var exists = await verificationContext.PromTemplates
            .AsNoTracking()
            .AnyAsync(t => t.Id == dto.Id);
        Assert.False(exists);
    }

    [Fact]
    public async Task SubmitAnswers_AllowsFlatDictionaryPayload()
    {
        var promService = new Mock<IPromService>();
        var promInstanceService = new Mock<IPromInstanceService>();
        var controller = CreateController(promService.Object, promInstanceService.Object, includeUser: false);

        var instanceId = Guid.NewGuid();
        var completedAt = DateTime.UtcNow;

        promInstanceService
            .Setup(s => s.SubmitPromResponseAsync(
                TenantId,
                instanceId,
                It.IsAny<PromSubmissionRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PromInstanceDto
            {
                Id = instanceId,
                TotalScore = 9m,
                CompletedAt = completedAt
            });

        var payload = JsonDocument
            .Parse("{\"2f9f8fc2-b1c0-4dcf-9f1b-3b0d896ed1d1\":3}")
            .RootElement
            .Clone();

        var response = await controller.SubmitAnswers(instanceId, payload, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var dto = Assert.IsType<SubmitAnswersResult>(ok.Value);
        Assert.Equal(9m, dto.Score);
        Assert.Equal(completedAt, dto.CompletedAt);

        var expectedQuestion = Guid.Parse("2f9f8fc2-b1c0-4dcf-9f1b-3b0d896ed1d1");

        promInstanceService.Verify(s => s.SubmitPromResponseAsync(
            TenantId,
            instanceId,
            It.Is<PromSubmissionRequest>(r =>
                r.Answers.Count == 1 &&
                r.Answers[0].QuestionId == expectedQuestion &&
                Convert.ToInt32(r.Answers[0].Value) == 3),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitAnswers_ParsesWrappedPayloadWithMetadata()
    {
        var promService = new Mock<IPromService>();
        var promInstanceService = new Mock<IPromInstanceService>();
        var controller = CreateController(promService.Object, promInstanceService.Object, includeUser: false);

        var instanceId = Guid.NewGuid();

        promInstanceService
            .Setup(s => s.SubmitPromResponseAsync(
                TenantId,
                instanceId,
                It.IsAny<PromSubmissionRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PromInstanceDto
            {
                Id = instanceId,
                TotalScore = 5m,
                CompletedAt = DateTime.UtcNow
            });

        var json = """
        {
          "answers": [
            { "questionId": "q-legacy", "value": 2 },
            { "questionId": "6cf02d88-6bf1-4f58-bb73-6f8f9549655d", "value": false }
          ],
          "completionSeconds": 180,
          "requestBooking": true,
          "bookingRequest": {
            "preferredDate": "2025-10-01T08:00:00Z",
            "timePreference": "morning"
          },
          "notes": "Follow-up required"
        }
        """;

        using var document = JsonDocument.Parse(json);
        await controller.SubmitAnswers(instanceId, document.RootElement.Clone(), CancellationToken.None);

        promInstanceService.Verify(s => s.SubmitPromResponseAsync(
            TenantId,
            instanceId,
            It.Is<PromSubmissionRequest>(r =>
                r.Answers.Count == 2 &&
                r.RequestBooking &&
                r.BookingRequest != null &&
                r.CompletionSeconds == 180 &&
                r.Notes == "Follow-up required"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetStats_ReturnsServiceResult()
    {
        var promService = new Mock<IPromService>();
        var promInstanceService = new Mock<IPromInstanceService>();
        var controller = CreateController(promService.Object, promInstanceService.Object);

        var templateId = Guid.NewGuid();
        var start = DateTime.UtcNow.AddDays(-7);
        var end = DateTime.UtcNow;

        var expected = new PromInstanceStats
        {
            TotalSent = 5,
            Completed = 3,
            Pending = 1,
            Scheduled = 1,
            Expired = 0,
            CompletionRate = 60,
            AverageCompletionTimeMinutes = 4.5,
            AverageScore = 9.2
        };

        promInstanceService
            .Setup(s => s.GetPromStatsAsync(TenantId, templateId, start, end, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var response = await controller.GetStats(templateId, start, end, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var stats = Assert.IsType<PromInstanceStats>(ok.Value);
        Assert.Equal(expected.TotalSent, stats.TotalSent);
        Assert.Equal(expected.Completed, stats.Completed);
        Assert.Equal(expected.AverageScore, stats.AverageScore);

        promInstanceService.Verify(s => s.GetPromStatsAsync(
            TenantId,
            templateId,
            start,
            end,
            It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
