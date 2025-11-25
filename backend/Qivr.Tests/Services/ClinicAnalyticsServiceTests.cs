using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Services;

public class ClinicAnalyticsServiceTests : IDisposable
{
    private readonly QivrDbContext _context;
    private readonly ClinicAnalyticsService _service;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();
    private readonly Guid _providerId = Guid.NewGuid();

    public ClinicAnalyticsServiceTests()
    {
        var options = new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new QivrDbContext(options);
        var logger = new Mock<ILogger<ClinicAnalyticsService>>();
        _service = new ClinicAnalyticsService(_context, logger.Object);

        SeedTestData();
    }

    private void SeedTestData()
    {
        var today = DateTime.UtcNow.Date;

        // Add patients
        _context.Users.AddRange(
            new User { Id = _patientId, TenantId = _tenantId, UserType = UserType.Patient, Email = "patient1@test.com", CreatedAt = today.AddDays(-30) },
            new User { Id = Guid.NewGuid(), TenantId = _tenantId, UserType = UserType.Patient, Email = "patient2@test.com", CreatedAt = today.AddDays(-5) },
            new User { Id = Guid.NewGuid(), TenantId = _tenantId, UserType = UserType.Patient, Email = "patient3@test.com", CreatedAt = today.AddDays(-2) }
        );

        // Add provider
        _context.Users.Add(new User { Id = _providerId, TenantId = _tenantId, UserType = UserType.Staff, Email = "provider@test.com" });

        // Add today's appointments
        _context.Appointments.AddRange(
            new Appointment { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, ProviderId = _providerId, ScheduledStart = today.AddHours(9), ActualStart = today.AddHours(9).AddMinutes(10), Status = AppointmentStatus.Completed },
            new Appointment { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, ProviderId = _providerId, ScheduledStart = today.AddHours(10), Status = AppointmentStatus.Scheduled },
            new Appointment { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, ProviderId = _providerId, ScheduledStart = today.AddHours(11), Status = AppointmentStatus.Cancelled },
            new Appointment { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, ProviderId = _providerId, ScheduledStart = today.AddHours(14), Status = AppointmentStatus.NoShow }
        );

        // Add past appointments for trends
        for (int i = 1; i <= 7; i++)
        {
            _context.Appointments.Add(new Appointment 
            { 
                Id = Guid.NewGuid(), 
                TenantId = _tenantId, 
                PatientId = _patientId, 
                ProviderId = _providerId, 
                ScheduledStart = today.AddDays(-i).AddHours(10), 
                Status = AppointmentStatus.Completed 
            });
        }

        // Add evaluations
        _context.Evaluations.AddRange(
            new Evaluation { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, ChiefComplaint = "Lower Back Pain", Status = EvaluationStatus.Completed, CreatedAt = today.AddDays(-5) },
            new Evaluation { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, ChiefComplaint = "Lower Back Pain", Status = EvaluationStatus.Completed, CreatedAt = today.AddDays(-3) },
            new Evaluation { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, ChiefComplaint = "Knee Pain", Status = EvaluationStatus.Pending, CreatedAt = today }
        );

        // Add PROM responses showing improvement
        var promInstance1 = new PromInstance { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, Status = PromStatus.Completed, CreatedAt = today.AddDays(-14) };
        var promInstance2 = new PromInstance { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, Status = PromStatus.Completed, CreatedAt = today.AddDays(-7) };
        var promInstance3 = new PromInstance { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, Status = PromStatus.Pending, CreatedAt = today };

        _context.PromInstances.AddRange(promInstance1, promInstance2, promInstance3);

        _context.PromResponses.AddRange(
            new PromResponse { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, PromInstanceId = promInstance1.Id, Score = 60, CompletedAt = today.AddDays(-14) },
            new PromResponse { Id = Guid.NewGuid(), TenantId = _tenantId, PatientId = _patientId, PromInstanceId = promInstance2.Id, Score = 75, CompletedAt = today.AddDays(-7) }
        );

        // Add pain maps
        _context.PainMaps.AddRange(
            new PainMap { Id = Guid.NewGuid(), TenantId = _tenantId, BodyRegion = "Lower Back", PainIntensity = 7, PainType = "Sharp", XCoordinate = 0, YCoordinate = -50, ZCoordinate = 0, CreatedAt = today.AddDays(-5) },
            new PainMap { Id = Guid.NewGuid(), TenantId = _tenantId, BodyRegion = "Lower Back", PainIntensity = 6, PainType = "Dull", XCoordinate = 0, YCoordinate = -50, ZCoordinate = 0, CreatedAt = today.AddDays(-3) },
            new PainMap { Id = Guid.NewGuid(), TenantId = _tenantId, BodyRegion = "Knee", PainIntensity = 5, PainType = "Sharp", XCoordinate = 10, YCoordinate = -100, ZCoordinate = 0, CreatedAt = today.AddDays(-1) }
        );

        _context.SaveChanges();
    }

    [Fact]
    public async Task GetDashboardMetrics_CalculatesCorrectly()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetDashboardMetricsAsync(_tenantId, today);

        // Assert
        Assert.Equal(4, result.TodayAppointments); // 4 appointments today
        Assert.Equal(1, result.CompletedToday); // 1 completed
        Assert.Equal(1, result.CancelledToday); // 1 cancelled
        Assert.Equal(1, result.NoShowToday); // 1 no-show
        Assert.Equal(25.0, result.CompletionRate); // 1/4 = 25%
        Assert.Equal(1, result.PendingIntakes); // 1 pending evaluation
        Assert.Equal(3, result.TotalPatients); // 3 patients total
        Assert.Equal(2, result.NewPatientsThisMonth); // 2 patients created this month
        Assert.Equal(10, result.AverageWaitTime); // 10 minutes wait time
    }

    [Fact]
    public async Task GetClinicalAnalytics_CalculatesAveragePromScore()
    {
        // Arrange
        var from = DateTime.UtcNow.Date.AddDays(-30);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetClinicalAnalyticsAsync(_tenantId, from, to);

        // Assert
        Assert.Equal(67.5, result.AveragePromScore); // (60 + 75) / 2 = 67.5
    }

    [Fact]
    public async Task GetClinicalAnalytics_CalculatesTopConditions()
    {
        // Arrange
        var from = DateTime.UtcNow.Date.AddDays(-30);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetClinicalAnalyticsAsync(_tenantId, from, to);

        // Assert
        Assert.NotEmpty(result.TopConditions);
        Assert.Equal("Lower Back Pain", result.TopConditions[0].Condition);
        Assert.Equal(2, result.TopConditions[0].Count);
    }

    [Fact]
    public async Task GetClinicalAnalytics_CalculatesPatientImprovement()
    {
        // Arrange
        var from = DateTime.UtcNow.Date.AddDays(-30);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetClinicalAnalyticsAsync(_tenantId, from, to);

        // Assert
        Assert.Equal(100.0, result.PatientImprovementRate); // 1 patient improved (75 > 60)
        Assert.Equal(1, result.TotalPatientsTracked);
    }

    [Fact]
    public async Task GetClinicalAnalytics_CalculatesAppointmentTrends()
    {
        // Arrange
        var from = DateTime.UtcNow.Date.AddDays(-7);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetClinicalAnalyticsAsync(_tenantId, from, to);

        // Assert
        Assert.NotNull(result.AppointmentTrends);
        Assert.NotEmpty(result.AppointmentTrends);
        Assert.True(result.AppointmentTrends.Count >= 7); // At least 7 days of data
    }

    [Fact]
    public async Task GetClinicalAnalytics_CalculatesPromCompletion()
    {
        // Arrange
        var from = DateTime.UtcNow.Date.AddDays(-30);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetClinicalAnalyticsAsync(_tenantId, from, to);

        // Assert
        Assert.NotNull(result.PromCompletionData);
        Assert.NotEmpty(result.PromCompletionData);
        var weekData = result.PromCompletionData.First();
        Assert.True(weekData.Completed >= 0);
        Assert.True(weekData.Pending >= 0);
        Assert.True(weekData.CompletionRate >= 0 && weekData.CompletionRate <= 100);
    }

    [Fact]
    public async Task GetPainMapAnalytics_CalculatesCorrectly()
    {
        // Arrange
        var from = DateTime.UtcNow.Date.AddDays(-30);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetPainMapAnalyticsAsync(_tenantId, from, to);

        // Assert
        Assert.Equal(3, result.TotalPainMaps);
        Assert.Equal(6.0, result.AverageIntensity); // (7 + 6 + 5) / 3 = 6
        Assert.Equal("Lower Back", result.MostCommonRegion);
        Assert.Equal(3, result.PainPoints3D.Count);
        Assert.NotEmpty(result.PainTypeDistribution);
        Assert.NotEmpty(result.IntensityDistribution);
    }

    [Fact]
    public async Task GetPainMapAnalytics_GroupsPainTypeDistribution()
    {
        // Arrange
        var from = DateTime.UtcNow.Date.AddDays(-30);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetPainMapAnalyticsAsync(_tenantId, from, to);

        // Assert
        var sharpPain = result.PainTypeDistribution.FirstOrDefault(p => p.Type == "Sharp");
        Assert.NotNull(sharpPain);
        Assert.Equal(2, sharpPain.Count); // 2 sharp pain entries
    }

    [Fact]
    public async Task GetDashboardMetrics_IsolatesByTenant()
    {
        // Arrange
        var otherTenantId = Guid.NewGuid();
        var today = DateTime.UtcNow.Date;
        
        // Add data for different tenant
        _context.Appointments.Add(new Appointment 
        { 
            Id = Guid.NewGuid(), 
            TenantId = otherTenantId, 
            PatientId = Guid.NewGuid(), 
            ProviderId = Guid.NewGuid(), 
            ScheduledStart = today.AddHours(9), 
            Status = AppointmentStatus.Completed 
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetDashboardMetricsAsync(_tenantId, today);

        // Assert
        Assert.Equal(4, result.TodayAppointments); // Should only count original tenant's appointments
    }

    [Fact]
    public async Task GetClinicalAnalytics_HandlesEmptyData()
    {
        // Arrange
        var emptyTenantId = Guid.NewGuid();
        var from = DateTime.UtcNow.Date.AddDays(-30);
        var to = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetClinicalAnalyticsAsync(emptyTenantId, from, to);

        // Assert
        Assert.Equal(0, result.AveragePromScore);
        Assert.Equal(0, result.TotalEvaluations);
        Assert.Empty(result.TopConditions);
        Assert.Equal(0, result.AveragePainIntensity);
        Assert.Equal(0, result.PatientImprovementRate);
    }

    [Fact]
    public async Task GetDashboardMetrics_CalculatesStaffUtilization()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;

        // Act
        var result = await _service.GetDashboardMetricsAsync(_tenantId, today);

        // Assert
        // 1 provider * 16 slots = 16 available slots
        // 4 appointments / 16 slots = 25% utilization
        Assert.Equal(25, result.StaffUtilization);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
