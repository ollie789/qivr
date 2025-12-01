using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Qivr.Services.AI;

namespace Qivr.Tests.AI;

/// <summary>
/// Integration tests for AI services - tests actual Bedrock calls
/// Run with: dotnet test --filter "Category=Integration"
/// </summary>
public class AiServicesIntegrationTests
{
    private readonly Mock<ILogger<BedrockService>> _loggerMock;

    public AiServicesIntegrationTests()
    {
        _loggerMock = new Mock<ILogger<BedrockService>>();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task BedrockService_InvokeNovaLite_ReturnsResponse()
    {
        // Arrange - requires AWS credentials configured
        var configData = new Dictionary<string, string?>
        {
            ["Bedrock:Region"] = "ap-southeast-2",
            ["Bedrock:ModelProvider"] = "nova"
        };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var service = new BedrockService(config, _loggerMock.Object);

        // Act
        var result = await service.InvokeClaudeAsync("Say 'Hello' in one word.");

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task BedrockService_StructuredOutput_ReturnsValidJson()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["Bedrock:Region"] = "ap-southeast-2",
            ["Bedrock:ModelProvider"] = "nova"
        };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var service = new BedrockService(config, _loggerMock.Object);

        // Act
        var result = await service.InvokeClaudeWithStructuredOutputAsync(
            "Generate a simple treatment plan with title and duration.",
            "Return JSON with format: {\"title\": string, \"durationWeeks\": number}",
            new BedrockModelOptions { Temperature = 0.3f }
        );

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.RawContent);
    }
}

/// <summary>
/// Unit tests for AI services with mocked Bedrock
/// </summary>
public class AiServicesUnitTests
{
    [Fact]
    public void BedrockModelOptions_DefaultValues_AreSet()
    {
        var options = new BedrockModelOptions();

        Assert.Equal(2048, options.MaxTokens);
        Assert.Equal(0.7f, options.Temperature);
        Assert.Equal(0.9f, options.TopP);
    }

    [Fact]
    public void BedrockResponse_TotalTokens_CalculatesCorrectly()
    {
        var usage = new ModelUsage
        {
            InputTokens = 100,
            OutputTokens = 50
        };

        Assert.Equal(150, usage.TotalTokens);
    }
}

/// <summary>
/// Tests for treatment plan generation prompts and parsing
/// </summary>
public class TreatmentPlanGenerationTests
{
    [Fact]
    public void TreatmentPlanRequest_WithMinimalData_IsValid()
    {
        var request = new TreatmentPlanGenerationRequest
        {
            PatientId = Guid.NewGuid(),
            PreferredDurationWeeks = 8,
            SessionsPerWeek = 2
        };

        Assert.NotEqual(Guid.Empty, request.PatientId);
        Assert.Equal(8, request.PreferredDurationWeeks);
        Assert.Equal(2, request.SessionsPerWeek);
    }

    [Fact]
    public void TreatmentPlanRequest_WithFocusAreas_ContainsAreas()
    {
        var request = new TreatmentPlanGenerationRequest
        {
            PatientId = Guid.NewGuid(),
            FocusAreas = new List<string> { "Lower Back", "Hip" }
        };

        Assert.Equal(2, request.FocusAreas.Count);
        Assert.Contains("Lower Back", request.FocusAreas);
    }
}

/// <summary>
/// Tests for triage risk detection logic
/// </summary>
public class TriageRiskDetectionTests
{
    private readonly HashSet<string> _criticalSymptoms = new(StringComparer.OrdinalIgnoreCase)
    {
        "chest pain", "difficulty breathing", "severe bleeding", "unconscious",
        "stroke symptoms", "severe allergic reaction", "suicidal thoughts"
    };

    [Theory]
    [InlineData("chest pain", true)]
    [InlineData("difficulty breathing", true)]
    [InlineData("mild headache", false)]
    [InlineData("back pain", false)]
    public void CriticalSymptoms_AreDetectedCorrectly(string symptom, bool isCritical)
    {
        var result = _criticalSymptoms.Contains(symptom);
        Assert.Equal(isCritical, result);
    }

    [Fact]
    public void UrgencyLevel_HighPriority_ForCriticalSymptoms()
    {
        var symptoms = new List<string> { "chest pain", "shortness of breath" };
        var hasCritical = symptoms.Any(s => 
            _criticalSymptoms.Any(c => s.Contains(c, StringComparison.OrdinalIgnoreCase)));

        Assert.True(hasCritical);
    }

    [Fact]
    public void UrgencyLevel_Normal_ForNonCriticalSymptoms()
    {
        var symptoms = new List<string> { "mild back pain", "stiff neck" };
        var hasCritical = symptoms.Any(s => 
            _criticalSymptoms.Any(c => s.Contains(c, StringComparison.OrdinalIgnoreCase)));

        Assert.False(hasCritical);
    }
}
