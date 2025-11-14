using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.DTOs;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using static Qivr.Api.Services.CacheService;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/patient-dashboard")]
[Authorize]
public class PatientDashboardController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ICacheService _cacheService;
    private readonly ILogger<PatientDashboardController> _logger;

    public PatientDashboardController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        ICacheService cacheService,
        ILogger<PatientDashboardController> logger)
    {
        _context = context;
        _authorizationService = authorizationService;
        _cacheService = cacheService;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard overview for patient
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(PatientDashboardDto), 200)]
    public async Task<IActionResult> GetDashboardOverview()
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        if (userId == Guid.Empty)
        {
            return Unauthorized("User not authenticated");
        }

        try
        {
            // Try to get from cache first
            var cacheKey = $"dashboard:{userId}:{DateTime.UtcNow:yyyy-MM-dd-HH}";
            var cachedDashboard = await _cacheService.GetAsync<PatientDashboardDto>(cacheKey);
            
            if (cachedDashboard != null)
            {
                _logger.LogDebug("Returning cached dashboard for patient {PatientId}", userId);
                return Ok(cachedDashboard);
            }
            
            var now = DateTime.UtcNow;
            
            // Get upcoming appointments
            var upcomingAppointments = await _context.Appointments
                .Include(a => a.Provider)
                .Where(a => a.PatientId == userId 
                    && a.ScheduledStart > now 
                    && a.Status != AppointmentStatus.Cancelled)
                .OrderBy(a => a.ScheduledStart)
                .Take(5)
                .Select(a => new PatientAppointmentSummaryDto
                {
                    Id = a.Id,
                    ProviderId = a.ProviderId,
                    ProviderName = a.Provider != null 
                        ? $"{a.Provider.FirstName} {a.Provider.LastName}" 
                        : "Unknown Provider",
                    ScheduledStart = a.ScheduledStart,
                    ScheduledEnd = a.ScheduledEnd,
                    AppointmentType = a.AppointmentType,
                    Status = a.Status.ToString(),
                    Location = a.Location ?? "Main Clinic"
                })
                .ToListAsync();

            // Get recent PROM responses
            var recentResponses = await _context.PromResponses
            .Include(r => r.PromInstance)
                .ThenInclude(i => i.Template)
                .Where(r => r.PromInstance.PatientId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .Select(r => new PromResponseSummaryDto
                {
                    Id = r.Id,
                    TemplateName = r.PromInstance.Template.Name,
                    CompletedAt = r.CreatedAt,
                    Score = r.Score,
                    Status = r.PromInstance.Status.ToString()
                })
                .ToListAsync();

            // Get medication reminders (from appointments with medication type)
            var medicationReminders = await _context.Appointments
                .Where(a => a.PatientId == userId 
                    && a.AppointmentType == "Medication Review"
                    && a.ScheduledStart > now
                    && a.ScheduledStart < now.AddDays(30))
                .OrderBy(a => a.ScheduledStart)
                .Select(a => new MedicationReminderDto
                {
                    Id = a.Id,
                    MedicationName = a.Notes ?? "Medication Review",
                    NextDose = a.ScheduledStart,
                    Instructions = "Please attend your medication review appointment"
                })
                .ToListAsync();

            // Get health metrics (from recent PROM scores)
            var healthMetrics = await _context.PromResponses
                .Include(r => r.PromInstance)
                .ThenInclude(i => i.Template)
                .Where(r => r.PromInstance.PatientId == userId)
                .GroupBy(r => r.PromInstance.Template.Name)
                .Select(g => new HealthMetricDto
                {
                    MetricName = g.Key,
                    Value = g.OrderByDescending(r => r.CreatedAt).First().Score,
                    Unit = "points",
                    LastUpdated = g.Max(r => r.CreatedAt),
                    Trend = g.Count() > 1 
                        ? (g.OrderByDescending(r => r.CreatedAt).First().Score > 
                           g.OrderByDescending(r => r.CreatedAt).Skip(1).First().Score ? "up" : "down")
                        : "stable"
                })
                .ToListAsync();

            // Get unread messages count
            var unreadMessagesCount = await _context.Messages
                .Where(m => m.DirectRecipientId == userId && !m.IsRead)
                .CountAsync();

            var dashboard = new PatientDashboardDto
            {
                PatientId = userId,
                LastUpdated = DateTime.UtcNow,
                UpcomingAppointments = upcomingAppointments,
                RecentPromResponses = recentResponses,
                MedicationReminders = medicationReminders,
                HealthMetrics = healthMetrics,
                UnreadMessagesCount = unreadMessagesCount,
                NextAppointment = upcomingAppointments.FirstOrDefault()
            };

            // Cache the dashboard data for 5 minutes
            await _cacheService.SetAsync(cacheKey, dashboard, CacheDuration.Medium);
            
            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard for patient {PatientId}", userId);
            return StatusCode(500, "An error occurred while loading the dashboard");
        }
    }

    /// <summary>
    /// Get patient's appointment history
    /// </summary>
    [HttpGet("appointments/history")]
    [ProducesResponseType(typeof(IEnumerable<PatientAppointmentSummaryDto>), 200)]
    public async Task<IActionResult> GetAppointmentHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }

        var query = _context.Appointments
            .Include(a => a.Provider)
            .Where(a => a.PatientId == userId)
            .OrderByDescending(a => a.ScheduledStart);

        var total = await query.CountAsync();
        
        var appointments = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new PatientAppointmentSummaryDto
            {
                Id = a.Id,
                ProviderId = a.ProviderId,
                ProviderName = a.Provider != null 
                    ? $"{a.Provider.FirstName} {a.Provider.LastName}" 
                    : "Unknown Provider",
                ScheduledStart = a.ScheduledStart,
                ScheduledEnd = a.ScheduledEnd,
                AppointmentType = a.AppointmentType,
                Status = a.Status.ToString(),
                Location = a.Location ?? "Main Clinic",
                Notes = a.Status == AppointmentStatus.Completed ? a.Notes : null
            })
            .ToListAsync();

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"] = page.ToString();
        Response.Headers["X-Page-Size"] = pageSize.ToString();

        return Ok(appointments);
    }

    /// <summary>
    /// Get patient's health summary
    /// </summary>
    [HttpGet("health-summary")]
    [ProducesResponseType(typeof(HealthSummaryDto), 200)]
    public async Task<IActionResult> GetHealthSummary()
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }
        
        // Use cache with longer expiration for health summary
        var cacheKey = CacheKeys.PatientSummary(userId);
        var cachedSummary = await _cacheService.GetAsync<HealthSummaryDto>(cacheKey);
        
        if (cachedSummary != null)
        {
            _logger.LogDebug("Returning cached health summary for patient {PatientId}", userId);
            return Ok(cachedSummary);
        }

        // Get patient info
        var patient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (patient == null)
        {
            return NotFound("Patient not found");
        }

        // Get recent vitals from PROM responses
        var recentVitals = await _context.PromResponses
            .Include(r => r.PromInstance)
            .ThenInclude(i => i.Template)
            .Where(r => r.PromInstance.PatientId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .ToListAsync();

        // Get active conditions (from appointment types)
        var conditions = await _context.Appointments
            .Where(a => a.PatientId == userId && a.Status == AppointmentStatus.Completed)
            .Select(a => a.AppointmentType)
            .Distinct()
            .ToListAsync();

        // Get active medications (simplified - from notes)
        var medications = await _context.Appointments
            .Where(a => a.PatientId == userId 
                && a.AppointmentType == "Medication Review"
                && a.Status == AppointmentStatus.Completed
                && a.Notes != null)
            .Select(a => new PatientMedicationDto
            {
                Name = a.Notes,
                StartDate = a.ScheduledStart,
                Status = "Active"
            })
            .ToListAsync();

        var summary = new HealthSummaryDto
        {
            PatientId = userId,
            PatientName = $"{patient.FirstName} {patient.LastName}",
            DateOfBirth = patient.DateOfBirth,
            LastVisit = await _context.Appointments
                .Where(a => a.PatientId == userId && a.Status == AppointmentStatus.Completed)
                .MaxAsync(a => (DateTime?)a.ScheduledEnd),
            ActiveConditions = conditions,
            ActiveMedications = medications,
            RecentVitals = recentVitals.Select(r => new PatientVitalSignDto
            {
                Type = r.PromInstance.Template.Name,
                Value = r.Score.ToString(),
                Unit = "points",
                RecordedAt = r.CreatedAt
            }).ToList()
        };

        // Cache health summary for 30 minutes
        await _cacheService.SetAsync(cacheKey, summary, CacheDuration.Long);
        
        return Ok(summary);
    }
}

// DTOs
public class PatientDashboardDto
{
    public Guid PatientId { get; set; }
    public DateTime LastUpdated { get; set; }
    public List<PatientAppointmentSummaryDto> UpcomingAppointments { get; set; } = new();
    public List<PromResponseSummaryDto> RecentPromResponses { get; set; } = new();
    public List<MedicationReminderDto> MedicationReminders { get; set; } = new();
    public List<HealthMetricDto> HealthMetrics { get; set; } = new();
    public int UnreadMessagesCount { get; set; }
    public PatientAppointmentSummaryDto? NextAppointment { get; set; }
}

// AppointmentSummaryDto moved to a separate DTO due to differences with SharedDtos version
public class PatientAppointmentSummaryDto  
{
    public Guid Id { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class PromResponseSummaryDto
{
    public Guid Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
    public decimal Score { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class MedicationReminderDto
{
    public Guid Id { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public DateTime NextDose { get; set; }
    public string Instructions { get; set; } = string.Empty;
}

public class HealthMetricDto
{
    public string MetricName { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
    public string Trend { get; set; } = string.Empty;
}

public class HealthSummaryDto
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public DateTime? LastVisit { get; set; }
    public List<string> ActiveConditions { get; set; } = new();
    public List<PatientMedicationDto> ActiveMedications { get; set; } = new();
    public List<PatientVitalSignDto> RecentVitals { get; set; } = new();
}

// Using custom DTOs for this controller due to differences with SharedDtos
public class PatientMedicationDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class PatientVitalSignDto
{
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public DateTime RecordedAt { get; set; }
}
