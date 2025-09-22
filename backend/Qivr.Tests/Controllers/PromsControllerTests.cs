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
        Assert.Equal("sum", dto.ScoringMethod?["type"]?.ToString());

        var stored = await context.PromTemplates.AsNoTracking().SingleAsync();
        Assert.Equal(request.Category, stored.Category);
        Assert.Equal(request.Frequency, stored.Frequency);
        Assert.Single(stored.Questions);
        Assert.Equal("sum", stored.ScoringMethod?["type"]?.ToString());

        await using var verificationContext = new QivrDbContext(options);
        var verificationService = new PromService(verificationContext, NullLogger<PromService>.Instance);
        var reloaded = await verificationService.GetTemplateAsync(tenantId, request.Key, dto.Version, CancellationToken.None);
        Assert.NotNull(reloaded);
        Assert.Single(reloaded!.Questions);
        Assert.Equal("sum", reloaded.ScoringMethod?["type"]?.ToString());
        Assert.Equal(dto.Id, reloaded.Id);
    }
}
