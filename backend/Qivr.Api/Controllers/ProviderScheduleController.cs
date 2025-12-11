using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Constants;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/provider-schedule")]
[Authorize]
public class ProviderScheduleController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IProviderAvailabilityService _availabilityService;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ILogger<ProviderScheduleController> _logger;

    public ProviderScheduleController(
        QivrDbContext context,
        IProviderAvailabilityService availabilityService,
        IResourceAuthorizationService authorizationService,
        ILogger<ProviderScheduleController> logger)
    {
        _context = context;
        _availabilityService = availabilityService;
        _authorizationService = authorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Find provider by Provider.Id or User.Id (supports both ID types from frontend)
    /// </summary>
    private async Task<Provider?> FindProviderAsync(Guid tenantId, Guid providerId, bool includeUser = false)
    {
        var query = _context.Providers.IgnoreQueryFilters().Where(p => p.TenantId == tenantId && (p.Id == providerId || p.UserId == providerId));
        if (includeUser) query = query.Include(p => p.User);
        return await query.FirstOrDefaultAsync();
    }

    /// <summary>
    /// Get all providers with their availability summary
    /// </summary>
    [HttpGet("providers")]
    [Authorize(Roles = $"{AuthorizationRoles.Admin},{AuthorizationRoles.Staff}")]
    public async Task<IActionResult> GetProviders([FromQuery] DateTime? date = null)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var targetDate = date ?? DateTime.UtcNow.Date;
        var providers = await _availabilityService.GetAvailableProviders(targetDate);

        return Ok(providers);
    }

    /// <summary>
    /// Get a provider's weekly schedule (recurring hours)
    /// </summary>
    [HttpGet("{providerId}/weekly-schedule")]
    [Authorize(Roles = $"{AuthorizationRoles.Admin},{AuthorizationRoles.Staff}")]
    public async Task<IActionResult> GetWeeklySchedule(Guid providerId)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Verify provider belongs to this tenant - try by Provider.Id first, then by UserId
        var provider = await _context.Providers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && (p.Id == providerId || p.UserId == providerId));

        if (provider == null)
        {
            return NotFound(new { error = "Provider not found" });
        }

        // Always use the actual Provider.Id for schedule lookup
        var schedules = await _availabilityService.GetProviderWeeklySchedule(provider.Id);

        // Return schedule with defaults if none configured
        var result = Enum.GetValues<DayOfWeek>().Select(day =>
        {
            var schedule = schedules.FirstOrDefault(s => s.DayOfWeek == day);
            if (schedule != null)
            {
                return new WeeklyScheduleDto
                {
                    DayOfWeek = day,
                    DayName = day.ToString(),
                    IsWorkingDay = schedule.IsWorkingDay,
                    StartTime = schedule.StartTime,
                    EndTime = schedule.EndTime,
                    BreakStartTime = schedule.BreakStartTime,
                    BreakEndTime = schedule.BreakEndTime,
                    DefaultSlotDurationMinutes = schedule.DefaultSlotDurationMinutes,
                    BufferMinutes = schedule.BufferMinutes,
                    AllowsTelehealth = schedule.AllowsTelehealth,
                    AllowsInPerson = schedule.AllowsInPerson,
                    MaxAppointmentsPerDay = schedule.MaxAppointmentsPerDay
                };
            }

            // Return default for unconfigured days
            var isWeekday = day != DayOfWeek.Sunday;
            return new WeeklyScheduleDto
            {
                DayOfWeek = day,
                DayName = day.ToString(),
                IsWorkingDay = isWeekday,
                StartTime = isWeekday ? "09:00" : null,
                EndTime = isWeekday ? (day == DayOfWeek.Saturday ? "13:00" : "17:00") : null,
                DefaultSlotDurationMinutes = 30,
                BufferMinutes = 0,
                AllowsTelehealth = true,
                AllowsInPerson = true,
                MaxAppointmentsPerDay = 0
            };
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Update a provider's weekly schedule
    /// </summary>
    [HttpPut("{providerId}/weekly-schedule")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    public async Task<IActionResult> UpdateWeeklySchedule(Guid providerId, [FromBody] List<UpdateWeeklyScheduleDto> scheduleUpdates)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Verify provider belongs to this tenant - try by Provider.Id first, then by UserId
        var provider = await _context.Providers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && (p.Id == providerId || p.UserId == providerId));

        if (provider == null)
        {
            return NotFound(new { error = "Provider not found" });
        }

        // Always use the actual Provider.Id for schedule operations
        var actualProviderId = provider.Id;

        var schedules = scheduleUpdates.Select(dto => new ProviderSchedule
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ProviderId = actualProviderId,
            DayOfWeek = dto.DayOfWeek,
            IsWorkingDay = dto.IsWorkingDay,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            BreakStartTime = dto.BreakStartTime,
            BreakEndTime = dto.BreakEndTime,
            DefaultSlotDurationMinutes = dto.DefaultSlotDurationMinutes,
            BufferMinutes = dto.BufferMinutes,
            AllowsTelehealth = dto.AllowsTelehealth,
            AllowsInPerson = dto.AllowsInPerson,
            MaxAppointmentsPerDay = dto.MaxAppointmentsPerDay
        }).ToList();

        await _availabilityService.SetProviderWeeklySchedule(actualProviderId, schedules);

        _logger.LogInformation("Updated weekly schedule for provider {ProviderId}", actualProviderId);

        return Ok(new { message = "Schedule updated successfully" });
    }

    /// <summary>
    /// Get a provider's calendar for a date range (includes appointments, time off, availability)
    /// </summary>
    [HttpGet("{providerId}/calendar")]
    [Authorize(Roles = $"{AuthorizationRoles.Admin},{AuthorizationRoles.Staff}")]
    public async Task<IActionResult> GetProviderCalendar(
        Guid providerId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var provider = await FindProviderAsync(tenantId, providerId, includeUser: true);
        if (provider == null)
        {
            return NotFound(new { error = "Provider not found" });
        }

        var dailySchedules = await _availabilityService.GetProviderSchedule(provider.Id, startDate, endDate);

        var result = dailySchedules.Select(ds => new ProviderCalendarDayDto
        {
            Date = ds.Date,
            DayOfWeek = ds.Date.DayOfWeek.ToString(),
            IsAvailable = ds.IsAvailable,
            WorkingHours = ds.WorkingHours.IsWorkingDay ? new ProviderWorkingHoursDto
            {
                Start = FormatTimeSpan(ds.WorkingHours.Start),
                End = FormatTimeSpan(ds.WorkingHours.End),
                BreakStart = ds.WorkingHours.BreakStart.HasValue ? FormatTimeSpan(ds.WorkingHours.BreakStart.Value) : null,
                BreakEnd = ds.WorkingHours.BreakEnd.HasValue ? FormatTimeSpan(ds.WorkingHours.BreakEnd.Value) : null
            } : null,
            TimeOffReason = ds.TimeOffReason,
            TimeOffType = ds.TimeOffType?.ToString(),
            AppointmentCount = ds.Appointments.Count,
            AvailableSlotCount = ds.AvailableSlots.Count,
            Appointments = ds.Appointments.Select(a => new CalendarAppointmentDto
            {
                Id = a.Id,
                PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}" : "Unknown",
                AppointmentType = a.AppointmentType ?? "General",
                StartTime = a.ScheduledStart,
                EndTime = a.ScheduledEnd,
                Status = a.Status.ToString()
            }).ToList()
        }).ToList();

        return Ok(new
        {
            providerId,
            providerName = provider.User != null ? $"{provider.User.FirstName} {provider.User.LastName}" : "Unknown",
            startDate,
            endDate,
            days = result
        });
    }

    /// <summary>
    /// Get available time slots for a provider on a specific date
    /// </summary>
    [HttpGet("{providerId}/available-slots")]
    public async Task<IActionResult> GetAvailableSlots(
        Guid providerId,
        [FromQuery] DateTime date,
        [FromQuery] int durationMinutes = 30)
    {
        try
        {
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            if (tenantId == Guid.Empty)
            {
                return Unauthorized(new { error = "Tenant context is required." });
            }

            var provider = await FindProviderAsync(tenantId, providerId);
            if (provider == null)
            {
                return NotFound(new { error = "Provider not found" });
            }

            var slots = await _availabilityService.GetAvailableSlots(provider.Id, date, durationMinutes);

            return Ok(slots.Select(s => new
            {
                start = s.Start,
                end = s.End,
                isAvailable = s.IsAvailable
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available slots for provider {ProviderId} on {Date}", providerId, date);
            return StatusCode(500, new { error = "Failed to get available slots", details = ex.Message });
        }
    }

    /// <summary>
    /// Get a provider's time off entries
    /// </summary>
    [HttpGet("{providerId}/time-off")]
    [Authorize(Roles = $"{AuthorizationRoles.Admin},{AuthorizationRoles.Staff}")]
    public async Task<IActionResult> GetTimeOffs(
        Guid providerId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var provider = await FindProviderAsync(tenantId, providerId);
        if (provider == null)
        {
            return NotFound(new { error = "Provider not found" });
        }

        var timeOffs = await _availabilityService.GetProviderTimeOffs(provider.Id, startDate, endDate);

        return Ok(timeOffs.Select(t => new TimeOffDto
        {
            Id = t.Id,
            StartDateTime = t.StartDateTime,
            EndDateTime = t.EndDateTime,
            IsAllDay = t.IsAllDay,
            Type = t.Type.ToString(),
            Reason = t.Reason,
            IsApproved = t.IsApproved,
            IsRecurring = t.IsRecurring,
            RecurrencePattern = t.RecurrencePattern?.ToString(),
            RecurrenceEndDate = t.RecurrenceEndDate
        }));
    }

    /// <summary>
    /// Add time off for a provider
    /// </summary>
    [HttpPost("{providerId}/time-off")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    public async Task<IActionResult> AddTimeOff(Guid providerId, [FromBody] CreateTimeOffDto dto)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var provider = await FindProviderAsync(tenantId, providerId);
        if (provider == null)
        {
            return NotFound(new { error = "Provider not found" });
        }

        if (!Enum.TryParse<TimeOffType>(dto.Type, true, out var timeOffType))
        {
            return BadRequest(new { error = $"Invalid time off type: {dto.Type}" });
        }

        RecurrencePattern? recurrencePattern = null;
        if (dto.IsRecurring && !string.IsNullOrEmpty(dto.RecurrencePattern))
        {
            if (!Enum.TryParse<RecurrencePattern>(dto.RecurrencePattern, true, out var pattern))
            {
                return BadRequest(new { error = $"Invalid recurrence pattern: {dto.RecurrencePattern}" });
            }
            recurrencePattern = pattern;
        }

        var timeOff = new ProviderTimeOff
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ProviderId = provider.Id,
            StartDateTime = dto.StartDateTime,
            EndDateTime = dto.EndDateTime,
            IsAllDay = dto.IsAllDay,
            Type = timeOffType,
            Reason = dto.Reason,
            IsApproved = dto.AutoApprove,
            IsRecurring = dto.IsRecurring,
            RecurrencePattern = recurrencePattern,
            RecurrenceEndDate = dto.RecurrenceEndDate
        };

        var result = await _availabilityService.AddProviderTimeOff(timeOff);

        _logger.LogInformation("Added time off {TimeOffId} for provider {ProviderId}", result.Id, provider.Id);

        return CreatedAtAction(nameof(GetTimeOffs), new { providerId }, new TimeOffDto
        {
            Id = result.Id,
            StartDateTime = result.StartDateTime,
            EndDateTime = result.EndDateTime,
            IsAllDay = result.IsAllDay,
            Type = result.Type.ToString(),
            Reason = result.Reason,
            IsApproved = result.IsApproved,
            IsRecurring = result.IsRecurring,
            RecurrencePattern = result.RecurrencePattern?.ToString(),
            RecurrenceEndDate = result.RecurrenceEndDate
        });
    }

    /// <summary>
    /// Delete a time off entry
    /// </summary>
    [HttpDelete("{providerId}/time-off/{timeOffId}")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    public async Task<IActionResult> DeleteTimeOff(Guid providerId, Guid timeOffId)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var success = await _availabilityService.DeleteProviderTimeOff(timeOffId);

        if (!success)
        {
            return NotFound(new { error = "Time off entry not found" });
        }

        _logger.LogInformation("Deleted time off {TimeOffId} for provider {ProviderId}", timeOffId, providerId);

        return NoContent();
    }

    /// <summary>
    /// Set a schedule override for a specific date
    /// </summary>
    [HttpPost("{providerId}/schedule-override")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    public async Task<IActionResult> SetScheduleOverride(Guid providerId, [FromBody] CreateScheduleOverrideDto dto)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Verify provider belongs to this tenant
        var provider = await _context.Providers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == providerId && p.TenantId == tenantId);

        if (provider == null)
        {
            return NotFound(new { error = "Provider not found" });
        }

        var scheduleOverride = new ProviderScheduleOverride
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ProviderId = providerId,
            Date = dto.Date.Date,
            IsWorkingDay = dto.IsWorkingDay,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Reason = dto.Reason
        };

        await _availabilityService.SetScheduleOverride(scheduleOverride);

        _logger.LogInformation("Set schedule override for provider {ProviderId} on {Date}", providerId, dto.Date.Date);

        return Ok(new { message = "Schedule override set successfully" });
    }

    /// <summary>
    /// Initialize default schedule for a provider (call when creating a new provider)
    /// </summary>
    [HttpPost("{providerId}/initialize-schedule")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    public async Task<IActionResult> InitializeSchedule(Guid providerId)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Verify provider belongs to this tenant
        var provider = await _context.Providers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == providerId && p.TenantId == tenantId);

        if (provider == null)
        {
            return NotFound(new { error = "Provider not found" });
        }

        await _availabilityService.InitializeProviderDefaultSchedule(providerId);

        return Ok(new { message = "Schedule initialized successfully" });
    }

    private static string FormatTimeSpan(TimeSpan time)
    {
        return $"{time.Hours:D2}:{time.Minutes:D2}";
    }
}

// DTOs

public record WeeklyScheduleDto
{
    public DayOfWeek DayOfWeek { get; init; }
    public string DayName { get; init; } = string.Empty;
    public bool IsWorkingDay { get; init; }
    public string? StartTime { get; init; }
    public string? EndTime { get; init; }
    public string? BreakStartTime { get; init; }
    public string? BreakEndTime { get; init; }
    public int DefaultSlotDurationMinutes { get; init; }
    public int BufferMinutes { get; init; }
    public bool AllowsTelehealth { get; init; }
    public bool AllowsInPerson { get; init; }
    public int MaxAppointmentsPerDay { get; init; }
}

public record UpdateWeeklyScheduleDto
{
    public DayOfWeek DayOfWeek { get; init; }
    public bool IsWorkingDay { get; init; }
    public string? StartTime { get; init; }
    public string? EndTime { get; init; }
    public string? BreakStartTime { get; init; }
    public string? BreakEndTime { get; init; }
    public int DefaultSlotDurationMinutes { get; init; } = 30;
    public int BufferMinutes { get; init; } = 0;
    public bool AllowsTelehealth { get; init; } = true;
    public bool AllowsInPerson { get; init; } = true;
    public int MaxAppointmentsPerDay { get; init; } = 0;
}

public record ProviderCalendarDayDto
{
    public DateTime Date { get; init; }
    public string DayOfWeek { get; init; } = string.Empty;
    public bool IsAvailable { get; init; }
    public ProviderWorkingHoursDto? WorkingHours { get; init; }
    public string? TimeOffReason { get; init; }
    public string? TimeOffType { get; init; }
    public int AppointmentCount { get; init; }
    public int AvailableSlotCount { get; init; }
    public List<CalendarAppointmentDto> Appointments { get; init; } = new();
}

public record ProviderWorkingHoursDto
{
    public string Start { get; init; } = string.Empty;
    public string End { get; init; } = string.Empty;
    public string? BreakStart { get; init; }
    public string? BreakEnd { get; init; }
}

public record CalendarAppointmentDto
{
    public Guid Id { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string AppointmentType { get; init; } = string.Empty;
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string Status { get; init; } = string.Empty;
}

public record TimeOffDto
{
    public Guid Id { get; init; }
    public DateTime StartDateTime { get; init; }
    public DateTime EndDateTime { get; init; }
    public bool IsAllDay { get; init; }
    public string Type { get; init; } = string.Empty;
    public string? Reason { get; init; }
    public bool IsApproved { get; init; }
    public bool IsRecurring { get; init; }
    public string? RecurrencePattern { get; init; }
    public DateTime? RecurrenceEndDate { get; init; }
}

public record CreateTimeOffDto
{
    public DateTime StartDateTime { get; init; }
    public DateTime EndDateTime { get; init; }
    public bool IsAllDay { get; init; } = true;
    public string Type { get; init; } = "Vacation";
    public string? Reason { get; init; }
    public bool AutoApprove { get; init; } = true;
    public bool IsRecurring { get; init; } = false;
    public string? RecurrencePattern { get; init; }
    public DateTime? RecurrenceEndDate { get; init; }
}

public record CreateScheduleOverrideDto
{
    public DateTime Date { get; init; }
    public bool IsWorkingDay { get; init; }
    public string? StartTime { get; init; }
    public string? EndTime { get; init; }
    public string? Reason { get; init; }
}
