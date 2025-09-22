using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Qivr.Api.Controllers;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Controllers;

public class PromsControllerTests
{
    [Fact]
    public async Task CreateTemplate_PersistsStructuredFields()
    {
        var tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new QivrDbContext(options);
        var promService = new PromService(context, NullLogger<PromService>.Instance);
        var promInstanceService = new Mock<IPromInstanceService>();

        var controller = new PromsController(promService, promInstanceService.Object, NullLogger<PromsController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("tenant_id", tenantId.ToString()),
                        new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                        new Claim(ClaimTypes.Role, "Admin")
                    }, "Test"))
                }
            }
        };

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

        var response = await controller.CreateOrVersionTemplate(request, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(response.Result);
        var dto = Assert.IsType<PromTemplateDto>(created.Value);
        Assert.Equal(request.Category, dto.Category);
        Assert.Equal(request.Frequency, dto.Frequency);
        Assert.Single(dto.Questions);
        var dtoQuestion = Assert.Single(dto.Questions);
        Assert.True(Guid.TryParse(dtoQuestion["id"].ToString(), out _));
        Assert.Equal(0, Convert.ToInt32(dtoQuestion["order"]));
        Assert.True(dtoQuestion.TryGetValue("required", out var requiredValue) && requiredValue is bool required && required);
        Assert.Equal("sum", dto.ScoringMethod?["type"]?.ToString());
        Assert.NotEqual(default, dto.CreatedAt);
        Assert.NotEqual(default, dto.UpdatedAt);

        var stored = await context.PromTemplates.AsNoTracking().SingleAsync();
        Assert.Equal(request.Category, stored.Category);
        Assert.Equal(request.Frequency, stored.Frequency);
        var storedQuestion = Assert.Single(stored.Questions);
        Assert.True(Guid.TryParse(storedQuestion["id"].ToString(), out _));
        Assert.Equal("scale", storedQuestion["type"].ToString());
        Assert.Equal("Little interest or pleasure in doing things", storedQuestion["text"].ToString());
        Assert.Equal("sum", stored.ScoringMethod?["type"]?.ToString());

        await using var verificationContext = new QivrDbContext(options);
        var verificationService = new PromService(verificationContext, NullLogger<PromService>.Instance);
        var reloaded = await verificationService.GetTemplateAsync(tenantId, request.Key, dto.Version, CancellationToken.None);
        Assert.NotNull(reloaded);
        var reloadedQuestion = Assert.Single(reloaded!.Questions);
        Assert.True(Guid.TryParse(reloadedQuestion["id"].ToString(), out _));
        Assert.Equal(dtoQuestion["id"].ToString(), reloadedQuestion["id"].ToString());
        Assert.Equal("sum", reloaded.ScoringMethod?["type"]?.ToString());
        Assert.Equal(dto.Id, reloaded.Id);
    }

    [Fact]
    public async Task ListTemplates_ReturnsSummaryMetadata()
    {
        var tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var templateRequest = new CreatePromTemplateDto
        {
            Key = "gad-7",
            Name = "GAD-7",
            Category = "Mental Health",
            Frequency = "Monthly",
            Questions = new List<Dictionary<string, object>>
            {
                new()
                {
                    ["text"] = "Feeling nervous, anxious, or on edge",
                    ["type"] = "scale",
                    ["required"] = true
                }
            }
        };

        await using (var context = new QivrDbContext(options))
        {
            var service = new PromService(context, NullLogger<PromService>.Instance);
            await service.CreateOrVersionTemplateAsync(tenantId, templateRequest, CancellationToken.None);
        }

        await using var verificationContext = new QivrDbContext(options);
        var verificationService = new PromService(verificationContext, NullLogger<PromService>.Instance);
        var summaries = await verificationService.ListTemplatesAsync(tenantId, 1, 10, CancellationToken.None);

        var summary = Assert.Single(summaries);
        Assert.Equal(templateRequest.Key, summary.Key);
        Assert.Equal(templateRequest.Category, summary.Category);
        Assert.Equal(templateRequest.Frequency, summary.Frequency);
        Assert.True(summary.IsActive);
        Assert.NotEqual(default, summary.CreatedAt);
        Assert.NotEqual(default, summary.UpdatedAt);
    }
}
