using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.DTOs;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/clinic-dashboard")]
[Authorize]
public class ClinicDashboardController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ILogger<ClinicDashboardController> _logger;

    public ClinicDashboardController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        ILogger<ClinicDashboardController> logger)
    {
        _context = context;
        _authorizationService = authorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Get clinic dashboard overview
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(ClinicDashboardDto), 200)]
    public async Task<IActionResult> GetDashboardOverview([FromQuery] DateTime? date = null)
    {
        var providerUserId = _authorizationService.GetCurrentUserId(User);
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        
        if (providerUserId == Guid.Empty || tenantId == Guid.Empty)
        {
            return Unauthorized("Provider not authenticated");
        }

        try
        {
            var targetDate = date ?? DateTime.UtcNow.Date;
            var endDate = targetDate.AddDays(1);

            // Get today's appointments for this provider
            var todaysAppointments = await _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.ProviderId == providerUserId
                    && a.ScheduledStart >= targetDate
                    && a.ScheduledStart < endDate
                    && a.Status != AppointmentStatus.Cancelled)
                .OrderBy(a => a.ScheduledStart)
                .Select(a => new ClinicAppointmentDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId,
                    PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
                    ScheduledStart = a.ScheduledStart,
                    ScheduledEnd = a.ScheduledEnd,
                    AppointmentType = a.AppointmentType,
                    Status = a.Status.ToString(),
                    Location = a.Location ?? "Main Clinic",
                    Notes = a.Notes
                })
                .ToListAsync();

            // Get patient queue (checked-in patients)
            var patientQueue = await _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.ProviderId == providerUserId
                    && a.ScheduledStart.Date == targetDate
                    && a.Status == AppointmentStatus.CheckedIn)
                .OrderBy(a => a.ScheduledStart)
                .Select(a => new PatientQueueItemDto
                {
                    AppointmentId = a.Id,
                    PatientId = a.PatientId,
                    PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
                    CheckInTime = a.UpdatedAt,
                    AppointmentTime = a.ScheduledStart,
                    AppointmentType = a.AppointmentType,
                    WaitTime = (int)(DateTime.UtcNow - a.UpdatedAt).TotalMinutes
                })
                .ToListAsync();

            // Get clinic statistics
            var stats = new ClinicStatisticsDto
            {
                TotalAppointmentsToday = todaysAppointments.Count(),
                CompletedAppointments = await _context.Appointments
                    .CountAsync(a => a.ProviderId == providerUserId
                        && a.ScheduledStart >= targetDate
                        && a.ScheduledStart < endDate
                        && a.Status == AppointmentStatus.Completed),
                PendingAppointments = await _context.Appointments
                    .CountAsync(a => a.ProviderId == providerUserId
                        && a.ScheduledStart >= targetDate
                        && a.ScheduledStart < endDate
                        && (a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.Confirmed)),
                AverageWaitTime = patientQueue.Any() ? (int)patientQueue.Average(p => p.WaitTime) : 0,
                TotalPatientsThisWeek = await _context.Appointments
                    .Where(a => a.ProviderId == providerUserId
                        && a.ScheduledStart >= targetDate.AddDays(-7)
                        && a.ScheduledStart < endDate)
                    .Select(a => a.PatientId)
                    .Distinct()
                    .CountAsync(),
                NoShowRate = await CalculateNoShowRate(providerUserId, targetDate.AddDays(-30), targetDate)
            };

            // Get recent PROM submissions for provider's patients
            var recentPromSubmissions = await _context.PromResponses
                .Include(r => r.PromInstance)
                .ThenInclude(i => i.Patient)
                .Include(r => r.PromInstance.Template)
                .Where(r => _context.Appointments
                    .Any(a => a.PatientId == r.PromInstance.PatientId 
                        && a.ProviderId == providerUserId))
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new PromSubmissionDto
                {
                    Id = r.Id,
                    PatientName = $"{r.PromInstance.Patient.FirstName} {r.PromInstance.Patient.LastName}",
                    TemplateName = r.PromInstance.Template.Name,
                    SubmittedAt = r.CreatedAt,
                    Score = r.Score,
                    RequiresReview = r.Score > 70 // High scores may need review
                })
                .ToListAsync();

            var dashboard = new ClinicDashboardDto
            {
                ProviderId = providerUserId,
                Date = targetDate,
                TodaysAppointments = todaysAppointments,
                PatientQueue = patientQueue,
                Statistics = stats,
                RecentPromSubmissions = recentPromSubmissions,
                NextAppointment = todaysAppointments
                    .FirstOrDefault(a => a.ScheduledStart > DateTime.UtcNow)
            };

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting clinic dashboard for provider {ProviderId}", providerUserId);
            return StatusCode(500, "An error occurred while loading the dashboard");
        }
    }

    /// <summary>
    /// Get provider's weekly schedule
    /// </summary>
    [HttpGet("schedule/weekly")]
    [ProducesResponseType(typeof(IEnumerable<ProviderScheduleDto>), 200)]
    public async Task<IActionResult> GetWeeklySchedule([FromQuery] DateTime? startDate = null)
    {
        var providerId = _authorizationService.GetCurrentUserId(User);
        if (providerId == Guid.Empty)
        {
            return Unauthorized();
        }

        var start = startDate ?? DateTime.UtcNow.Date;
        var end = start.AddDays(7);

        var appointments = await _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.ProviderId == providerId
                && a.ScheduledStart >= start
                && a.ScheduledStart < end
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.ScheduledStart)
            .Select(a => new ProviderScheduleDto
            {
                Date = a.ScheduledStart.Date,
                Appointments = new List<ClinicAppointmentDto>()
            })
            .ToListAsync();

        // Group appointments by date
        var schedule = await _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.ProviderId == providerId
                && a.ScheduledStart >= start
                && a.ScheduledStart < end
                && a.Status != AppointmentStatus.Cancelled)
            .GroupBy(a => a.ScheduledStart.Date)
            .Select(g => new ProviderScheduleDto
            {
                Date = g.Key,
                Appointments = g.Select(a => new ClinicAppointmentDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId,
                    PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
                    ScheduledStart = a.ScheduledStart,
                    ScheduledEnd = a.ScheduledEnd,
                    AppointmentType = a.AppointmentType,
                    Status = a.Status.ToString(),
                    Location = a.Location ?? "Main Clinic"
                }).ToList()
            })
            .ToListAsync();

        return Ok(schedule);
    }

    /// <summary>
    /// Get clinic performance metrics
    /// </summary>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(ClinicMetricsDto), 200)]
    public async Task<IActionResult> GetClinicMetrics([FromQuery] int days = 30)
    {
        var providerId = _authorizationService.GetCurrentUserId(User);
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        
        if (providerId == Guid.Empty || tenantId == Guid.Empty)
        {
            return Unauthorized();
        }

        var startDate = DateTime.UtcNow.AddDays(-days);
        var endDate = DateTime.UtcNow;

        var totalAppointmentsQuery = _context.Appointments
            .Where(a => a.ProviderId == providerId && a.ScheduledStart >= startDate);

        var totalAppointments = await totalAppointmentsQuery.CountAsync();

        double averageAppointmentsPerDay = 0;
        if (totalAppointments > 0)
        {
            var dailyCounts = await totalAppointmentsQuery
                .GroupBy(a => a.ScheduledStart.Date)
                .Select(g => g.Count())
                .ToListAsync();

            if (dailyCounts.Count > 0)
            {
                averageAppointmentsPerDay = dailyCounts.Average();
            }
        }

        var appointmentTypeBreakdown = new List<AppointmentTypeMetricDto>();
        if (totalAppointments > 0)
        {
            var typeCounts = await totalAppointmentsQuery
                .GroupBy(a => a.AppointmentType)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToListAsync();

            appointmentTypeBreakdown = typeCounts
                .Select(t => new AppointmentTypeMetricDto
                {
                    Type = string.IsNullOrWhiteSpace(t.Type) ? "Unspecified" : t.Type,
                    Count = t.Count,
                    Percentage = (decimal)t.Count * 100 / totalAppointments
                })
                .ToList();
        }

        var metrics = new ClinicMetricsDto
        {
            TotalPatientsSeen = await _context.Appointments
                .Where(a => a.ProviderId == providerId
                    && a.ScheduledStart >= startDate
                    && a.Status == AppointmentStatus.Completed)
                .Select(a => a.PatientId)
                .Distinct()
                .CountAsync(),

            TotalAppointments = totalAppointments,

            AverageAppointmentsPerDay = averageAppointmentsPerDay,

            PromCompletionRate = await CalculatePromCompletionRate(providerId, startDate, endDate),

            PatientSatisfactionScore = await CalculatePatientSatisfactionScore(providerId, startDate, endDate),

            NoShowRate = await CalculateNoShowRate(providerId, startDate, endDate),

            AppointmentTypeBreakdown = appointmentTypeBreakdown
        };

        return Ok(metrics);
    }

    private async Task<decimal> CalculateNoShowRate(Guid providerId, DateTime start, DateTime end)
    {
        var total = await _context.Appointments
            .CountAsync(a => a.ProviderId == providerId
                && a.ScheduledStart >= start
                && a.ScheduledStart < end
                && a.ScheduledStart < DateTime.UtcNow);
                
        if (total == 0) return 0;
        
        var noShows = await _context.Appointments
            .CountAsync(a => a.ProviderId == providerId
                && a.ScheduledStart >= start
                && a.ScheduledStart < end
                && a.Status == AppointmentStatus.NoShow);
                
        return (decimal)noShows * 100 / total;
    }

    private async Task<decimal> CalculatePromCompletionRate(Guid providerId, DateTime start, DateTime end)
    {
        var patientIds = await _context.Appointments
            .Where(a => a.ProviderId == providerId
                && a.ScheduledStart >= start
                && a.ScheduledStart < end)
            .Select(a => a.PatientId)
            .Distinct()
            .ToListAsync();

        var totalInstances = await _context.PromInstances
            .CountAsync(i => patientIds.Contains(i.PatientId)
                && i.CreatedAt >= start);
                
        if (totalInstances == 0) return 0;
        
        var completedInstances = await _context.PromInstances
            .CountAsync(i => patientIds.Contains(i.PatientId)
                && i.CreatedAt >= start
                && i.Status == PromStatus.Completed);
                
        return (decimal)completedInstances * 100 / totalInstances;
    }

    private async Task<decimal> CalculatePatientSatisfactionScore(Guid providerId, DateTime start, DateTime end)
    {
        // Simplified - in real implementation, this would use specific satisfaction surveys
        var scores = await _context.PromResponses
            .Include(r => r.PromInstance)
            .Where(r => _context.Appointments
                .Any(a => a.PatientId == r.PromInstance.PatientId 
                    && a.ProviderId == providerId
                    && a.ScheduledStart >= start
                    && a.ScheduledStart < end))
            .Select(r => r.Score)
            .ToListAsync();
            
        return scores.Any() ? scores.Average() : 0;
    }
}

// DTOs
public class ClinicDashboardDto
{
    public Guid ProviderId { get; set; }
    public DateTime Date { get; set; }
    public List<ClinicAppointmentDto> TodaysAppointments { get; set; } = new();
    public List<PatientQueueItemDto> PatientQueue { get; set; } = new();
    public ClinicStatisticsDto Statistics { get; set; } = new();
    public List<PromSubmissionDto> RecentPromSubmissions { get; set; } = new();
    public ClinicAppointmentDto? NextAppointment { get; set; }
}

// ClinicAppointmentDto is now in SharedDtos

public class PatientQueueItemDto
{
    public Guid AppointmentId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime CheckInTime { get; set; }
    public DateTime AppointmentTime { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public int WaitTime { get; set; }
}

// ClinicStatisticsDto is now in SharedDtos

public class PromSubmissionDto
{
    public Guid Id { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public decimal Score { get; set; }
    public bool RequiresReview { get; set; }
}

// ProviderScheduleDto is now in SharedDtos

public class ClinicMetricsDto
{
    public int TotalPatientsSeen { get; set; }
    public int TotalAppointments { get; set; }
    public double AverageAppointmentsPerDay { get; set; }
    public decimal PromCompletionRate { get; set; }
    public decimal PatientSatisfactionScore { get; set; }
    public decimal NoShowRate { get; set; }
    public List<AppointmentTypeMetricDto> AppointmentTypeBreakdown { get; set; } = new();
}

public class AppointmentTypeMetricDto
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}
