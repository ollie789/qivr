using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Qivr.Api.Controllers;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Controllers;

public class ClinicAnalyticsControllerTests
{
    private readonly Mock<IClinicAnalyticsService> _mockService;
    private readonly Mock<ILogger<ClinicAnalyticsController>> _mockLogger;
    private readonly ClinicAnalyticsController _controller;
    private readonly Guid _tenantId = Guid.NewGuid();

    public ClinicAnalyticsControllerTests()
    {
        _mockService = new Mock<IClinicAnalyticsService>();
        _mockLogger = new Mock<ILogger<ClinicAnalyticsController>>();
        _controller = new ClinicAnalyticsController(_mockService.Object, _mockLogger.Object);

        // Setup HttpContext with tenant ID
        var httpContext = new DefaultHttpContext();
        httpContext.Items["TenantId"] = _tenantId;
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task GetDashboardMetrics_ReturnsOkWithData()
    {
        // Arrange
        var expectedMetrics = new DashboardMetrics
        {
            TodayAppointments = 10,
            CompletedToday = 8,
            CancelledToday = 1,
            NoShowToday = 1,
            CompletionRate = 80.0,
            TotalPatients = 150,
            NewPatientsThisMonth = 12,
            EstimatedRevenue = 1200,
            NoShowRate = 5.5,
            AverageWaitTime = 15,
            StaffUtilization = 75
        };

        _mockService
            .Setup(s => s.GetDashboardMetricsAsync(_tenantId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _controller.GetDashboardMetrics(null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var metrics = Assert.IsType<DashboardMetrics>(okResult.Value);
        Assert.Equal(10, metrics.TodayAppointments);
        Assert.Equal(80.0, metrics.CompletionRate);
    }

    [Fact]
    public async Task GetDashboardMetrics_UsesProvidedDate()
    {
        // Arrange
        var specificDate = new DateTime(2025, 11, 20);
        DateTime? capturedDate = null;

        _mockService
            .Setup(s => s.GetDashboardMetricsAsync(_tenantId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, DateTime, CancellationToken>((_, date, _) => capturedDate = date)
            .ReturnsAsync(new DashboardMetrics());

        // Act
        await _controller.GetDashboardMetrics(specificDate, CancellationToken.None);

        // Assert
        Assert.NotNull(capturedDate);
        Assert.Equal(specificDate, capturedDate.Value);
    }

    [Fact]
    public async Task GetClinicalAnalytics_ReturnsOkWithData()
    {
        // Arrange
        var expectedAnalytics = new ClinicalAnalytics
        {
            AveragePromScore = 75.5,
            TotalEvaluations = 120,
            TopConditions = new List<ConditionCount>
            {
                new() { Condition = "Lower Back Pain", Count = 45 },
                new() { Condition = "Knee Pain", Count = 32 }
            },
            AveragePainIntensity = 5.8,
            PatientImprovementRate = 68.5,
            TotalPatientsTracked = 85,
            AppointmentTrends = new List<AppointmentTrend>(),
            PromCompletionData = new List<PromCompletion>(),
            PatientSatisfaction = 4.5
        };

        _mockService
            .Setup(s => s.GetClinicalAnalyticsAsync(_tenantId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetClinicalAnalytics(null, null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var analytics = Assert.IsType<ClinicalAnalytics>(okResult.Value);
        Assert.Equal(75.5, analytics.AveragePromScore);
        Assert.Equal(2, analytics.TopConditions.Count);
        Assert.Equal("Lower Back Pain", analytics.TopConditions[0].Condition);
    }

    [Fact]
    public async Task GetClinicalAnalytics_UsesDefaultDateRange()
    {
        // Arrange
        DateTime? capturedFrom = null;
        DateTime? capturedTo = null;

        _mockService
            .Setup(s => s.GetClinicalAnalyticsAsync(_tenantId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, DateTime, DateTime, CancellationToken>((_, from, to, _) =>
            {
                capturedFrom = from;
                capturedTo = to;
            })
            .ReturnsAsync(new ClinicalAnalytics());

        // Act
        await _controller.GetClinicalAnalytics(null, null, CancellationToken.None);

        // Assert
        Assert.NotNull(capturedFrom);
        Assert.NotNull(capturedTo);
        Assert.True((capturedTo.Value - capturedFrom.Value).TotalDays >= 29); // Default 30 days
    }

    [Fact]
    public async Task GetPainMapAnalytics_ReturnsOkWithData()
    {
        // Arrange
        var expectedAnalytics = new PainMapAnalytics
        {
            TotalPainMaps = 85,
            AverageIntensity = 6.2,
            MostCommonRegion = "Lower Back",
            PainPoints3D = new List<PainPoint3D>
            {
                new() { X = 0, Y = -50, Z = 0, Intensity = 7, BodyRegion = "Lower Back", PainType = "Sharp" }
            },
            PainTypeDistribution = new List<PainTypeCount>
            {
                new() { Type = "Sharp", Count = 45 },
                new() { Type = "Dull", Count = 40 }
            },
            IntensityDistribution = new List<IntensityCount>
            {
                new() { Range = "Mild (1-3)", Count = 15 },
                new() { Range = "Moderate (4-6)", Count = 35 },
                new() { Range = "Severe (7-10)", Count = 35 }
            }
        };

        _mockService
            .Setup(s => s.GetPainMapAnalyticsAsync(_tenantId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetPainMapAnalytics(null, null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var analytics = Assert.IsType<PainMapAnalytics>(okResult.Value);
        Assert.Equal(85, analytics.TotalPainMaps);
        Assert.Equal(6.2, analytics.AverageIntensity);
        Assert.Equal("Lower Back", analytics.MostCommonRegion);
        Assert.Single(analytics.PainPoints3D);
        Assert.Equal(2, analytics.PainTypeDistribution.Count);
        Assert.Equal(3, analytics.IntensityDistribution.Count);
    }

    [Fact]
    public async Task GetDashboardMetrics_CallsServiceWithCorrectTenantId()
    {
        // Arrange
        Guid? capturedTenantId = null;

        _mockService
            .Setup(s => s.GetDashboardMetricsAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, DateTime, CancellationToken>((tenantId, _, _) => capturedTenantId = tenantId)
            .ReturnsAsync(new DashboardMetrics());

        // Act
        await _controller.GetDashboardMetrics(null, CancellationToken.None);

        // Assert
        Assert.Equal(_tenantId, capturedTenantId);
    }

    [Fact]
    public async Task GetClinicalAnalytics_ReturnsEmptyListsWhenNoData()
    {
        // Arrange
        var emptyAnalytics = new ClinicalAnalytics
        {
            AveragePromScore = 0,
            TotalEvaluations = 0,
            TopConditions = new List<ConditionCount>(),
            AveragePainIntensity = 0,
            PatientImprovementRate = 0,
            TotalPatientsTracked = 0,
            AppointmentTrends = new List<AppointmentTrend>(),
            PromCompletionData = new List<PromCompletion>(),
            PatientSatisfaction = 0
        };

        _mockService
            .Setup(s => s.GetClinicalAnalyticsAsync(_tenantId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyAnalytics);

        // Act
        var result = await _controller.GetClinicalAnalytics(null, null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var analytics = Assert.IsType<ClinicalAnalytics>(okResult.Value);
        Assert.Empty(analytics.TopConditions);
        Assert.Empty(analytics.AppointmentTrends);
        Assert.Empty(analytics.PromCompletionData);
    }
}
