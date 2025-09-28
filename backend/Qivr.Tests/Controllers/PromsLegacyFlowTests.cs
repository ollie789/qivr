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

public class PromsLegacyFlowTests : DatabaseTestBase
{
    [Fact]
    public async Task Schedule_Submit_And_Stats_Workflow_PersistsResponsesAndBooking()
    {
        // Arrange: create users for scheduling and completion
        var scheduler = await CreateUserAsync(UserType.Staff, email: "scheduler@test.local", firstName: "Scheduler", lastName: "User");
        var patient = await CreateUserAsync(UserType.Patient, email: "patient@test.local", firstName: "Patient", lastName: "Example");

        var promService = new PromService(Context, NullLogger<PromService>.Instance);
        var notificationService = new Mock<INotificationService>();
        var promInstanceService = new PromInstanceService(Context, notificationService.Object, NullLogger<PromInstanceService>.Instance);

        var controller = CreateController(promService, promInstanceService, scheduler.Id);

        // Create template via controller to ensure pipeline works end-to-end
        var templateResult = await controller.CreateOrVersionTemplate(new CreatePromTemplateDto
        {
            Key = "baseline-phq",
            Name = "Baseline PHQ",
            Description = "Baseline depression screener",
            Category = "Mental Health",
            Frequency = "weekly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["id"] = "interest",
                    ["text"] = "Little interest or pleasure in doing things",
                    ["type"] = "scale",
                    ["required"] = true
                },
                new()
                {
                    ["id"] = "down",
                    ["text"] = "Feeling down, depressed, or hopeless",
                    ["type"] = "scale",
                    ["required"] = true,
                    ["conditionalLogic"] = new Dictionary<string, object>
                    {
                        ["showIf"] = "interest",
                        ["operator"] = "greaterThan",
                        ["value"] = 0
                    }
                }
            }
        }, CancellationToken.None);

        var createdTemplate = Assert.IsType<CreatedAtActionResult>(templateResult.Result);
        var template = Assert.IsType<PromTemplateDto>(createdTemplate.Value);

        var scheduleAt = DateTime.UtcNow;
        var scheduleRequest = new SchedulePromRequest
        {
            TemplateKey = template.Key,
            Version = template.Version,
            PatientId = patient.Id,
            ScheduledFor = scheduleAt,
            DueAt = scheduleAt.AddDays(7),
            NotificationMethod = NotificationMethod.Email,
            Tags = new[] { "baseline" },
            Notes = "Initial baseline assessment"
        };

        var scheduleResponse = await controller.Schedule(scheduleRequest, CancellationToken.None);
        var scheduleCreated = Assert.IsType<CreatedAtActionResult>(scheduleResponse.Result);
        var instanceDto = Assert.IsType<PromInstanceDto>(scheduleCreated.Value);
        Assert.Equal("baseline", instanceDto.Tags?.Single());

        var answerIds = template.Questions.Select(q => q["id"].ToString() ?? string.Empty).ToArray();
        var submissionPayload = new
        {
            answers = new Dictionary<string, object>
            {
                [answerIds[0]] = 3,
                [answerIds[1]] = 1
            },
            requestBooking = true,
            bookingRequest = new
            {
                preferredDate = scheduleAt.AddDays(2).ToString("O"),
                timePreference = "morning",
                notes = "Discuss results"
            },
            completionSeconds = 420,
            notes = "Patient requested follow-up"
        };

        using var submissionJson = JsonDocument.Parse(JsonSerializer.Serialize(submissionPayload));
        var submissionResult = await controller.SubmitAnswers(instanceDto.Id, submissionJson.RootElement.Clone(), CancellationToken.None);
        var submissionOk = Assert.IsType<OkObjectResult>(submissionResult.Result);
        var submissionBody = Assert.IsType<SubmitAnswersResult>(submissionOk.Value);
        Assert.Equal(4m, submissionBody.Score);

        await using var verificationContext = CreateScopedContext();
        var storedInstance = await verificationContext.PromInstances
            .Include(i => i.BookingRequests)
            .FirstAsync(i => i.Id == instanceDto.Id);
        Assert.Equal(PromStatus.Completed, storedInstance.Status);
        Assert.Equal(4m, storedInstance.Score);
        Assert.True(storedInstance.BookingRequests.Any());

        var booking = await verificationContext.PromBookingRequests.AsNoTracking().FirstAsync();
        Assert.Equal("morning", booking.TimePreference);

        var response = await verificationContext.PromResponses.AsNoTracking().FirstAsync();
        Assert.Equal(4m, response.Score);
        Assert.Equal(template.Key, response.PromType);

        var statsResponse = await controller.GetStats(template.Id, null, null, CancellationToken.None);
        var statsOk = Assert.IsType<OkObjectResult>(statsResponse.Result);
        var stats = Assert.IsType<PromInstanceStats>(statsOk.Value);
        Assert.Equal(1, stats.TotalSent);
        Assert.Equal(1, stats.Completed);
        Assert.Equal(0, stats.Pending);
        Assert.Equal(0, stats.Scheduled);
        Assert.Equal(0, stats.Expired);
        Assert.Equal(4d, stats.AverageScore);
        Assert.True(stats.AverageCompletionTimeMinutes >= 7d);
    }

    private PromsController CreateController(IPromService promService, IPromInstanceService instanceService, Guid? userId = null)
    {
        return new PromsController(promService, instanceService, NullLogger<PromsController>.Instance)
        {
            ControllerContext = CreateControllerContext(userId ?? TestUserId)
        };
    }
}
