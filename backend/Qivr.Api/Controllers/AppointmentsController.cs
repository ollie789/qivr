using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Models;
using Qivr.Api.Middleware;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/appointments")] // Maintain backward compatibility
[Authorize]
[EnableRateLimiting("api")]
public class AppointmentsController : BaseApiController
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AppointmentsController> _logger;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly IProviderAvailabilityService _availabilityService;
    private readonly ICacheService _cacheService;
    private readonly IEnhancedAuditService _auditService;
    private readonly IAppointmentWaitlistService _waitlistService;
    private readonly INotificationGate _notificationGate;
    private readonly IRealTimeNotificationService _realTimeNotificationService;

    public AppointmentsController(
        QivrDbContext context,
        ILogger<AppointmentsController> logger,
        IResourceAuthorizationService authorizationService,
        IProviderAvailabilityService availabilityService,
        ICacheService cacheService,
        IEnhancedAuditService auditService,
        IAppointmentWaitlistService waitlistService,
        INotificationGate notificationGate,
        IRealTimeNotificationService realTimeNotificationService)
    {
        _context = context;
        _logger = logger;
        _authorizationService = authorizationService;
        _availabilityService = availabilityService;
        _cacheService = cacheService;
        _auditService = auditService;
        _waitlistService = waitlistService;
        _notificationGate = notificationGate;
        _realTimeNotificationService = realTimeNotificationService;
    }

    /// <summary>
    /// Get appointments with cursor-based pagination
    /// </summary>
    /// <param name="cursor">Pagination cursor for next/previous page</param>
    /// <param name="limit">Number of items per page (max 100)</param>
    /// <param name="startDate">Filter appointments starting from this date</param>
    /// <param name="endDate">Filter appointments ending before this date</param>
    /// <param name="status">Filter by appointment status</param>
    /// <param name="sortDescending">Sort in descending order (newest first)</param>
    /// <returns>Paginated list of appointments</returns>
    /// <response code="200">Returns the list of appointments</response>
    /// <response code="401">Unauthorized - Authentication required</response>
    /// <response code="429">Too many requests - Rate limit exceeded</response>
    [HttpGet]
    [ProducesResponseType(typeof(CursorPaginationResponse<AppointmentDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(429)]
    public async Task<ActionResult<CursorPaginationResponse<AppointmentDto>>> GetAppointments(
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 20,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] AppointmentStatus? status = null,
        [FromQuery] bool sortDescending = false)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Include(a => a.Evaluation)
            .Where(a => a.TenantId == tenantId);

        // Filter by user role
        if (User.IsInRole("Patient"))
        {
            query = query.Where(a => a.PatientId == userId);
        }
        else if (User.IsInRole("Clinician"))
        {
            query = query.Where(a => a.ProviderId == userId);
        }

        if (startDate.HasValue)
            query = query.Where(a => a.ScheduledStart >= ToUtc(startDate.Value));

        if (endDate.HasValue)
            query = query.Where(a => a.ScheduledStart <= ToUtc(endDate.Value));

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        // Use cursor pagination
        var paginationRequest = new CursorPaginationRequest
        {
            Cursor = cursor,
            Limit = limit,
            SortBy = "ScheduledStart",
            SortDescending = sortDescending
        };

        var paginatedResult = await query.ToCursorPageAsync(
            a => a.ScheduledStart,
            a => a.Id,
            paginationRequest);

        // Convert to DTOs
        var response = new CursorPaginationResponse<AppointmentDto>
        {
            Items = paginatedResult.Items.Select(MapAppointmentToDto).ToList(),
            NextCursor = paginatedResult.NextCursor,
            PreviousCursor = paginatedResult.PreviousCursor,
            HasNext = paginatedResult.HasNext,
            HasPrevious = paginatedResult.HasPrevious,
            Count = paginatedResult.Count
        };

        return Ok(response);
    }

    /// <summary>
    /// Get appointments with traditional pagination (legacy endpoint)
    /// </summary>
    [HttpGet("page")]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAppointmentsPaged(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] AppointmentStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Include(a => a.Evaluation)
            .Where(a => a.TenantId == tenantId);

        // Filter by user role
        if (User.IsInRole("Patient"))
        {
            query = query.Where(a => a.PatientId == userId);
        }
        else if (User.IsInRole("Clinician"))
        {
            query = query.Where(a => a.ProviderId == userId);
        }

        if (startDate.HasValue)
            query = query.Where(a => a.ScheduledStart >= ToUtc(startDate.Value));

        if (endDate.HasValue)
            query = query.Where(a => a.ScheduledStart <= ToUtc(endDate.Value));

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        var appointments = await query
            .OrderBy(a => a.ScheduledStart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(appointments.Select(MapAppointmentToDto).ToList());
    }

    /// <summary>
    /// Get a specific appointment by ID
    /// </summary>
    /// <param name="id">The appointment ID</param>
    /// <returns>The appointment details</returns>
    /// <response code="200">Returns the appointment</response>
    /// <response code="404">Appointment not found or access denied</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AppointmentDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AppointmentDto>> GetAppointment(Guid id)
    {
        var tenantId = RequireTenantId();
        var userId = _authorizationService.GetCurrentUserId(User);

        // IDOR Protection: Check if user can access this appointment
        if (!await _authorizationService.UserCanAccessAppointmentAsync(userId, id))
        {
            _logger.LogWarning("User {UserId} attempted to access unauthorized appointment {AppointmentId}", userId, id);
            return NotFound(); // Return 404 instead of 403 to avoid information leakage
        }

        // Try to get from cache first
        var cacheKey = CacheService.CacheKeys.AppointmentDetails(id);
        var cachedAppointment = await _cacheService.GetAsync<AppointmentDto>(cacheKey);
        if (cachedAppointment != null)
        {
            _logger.LogDebug("Returning cached appointment {AppointmentId}", id);
            return Ok(cachedAppointment);
        }

        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Include(a => a.Evaluation)
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync();

        if (appointment == null)
            return NotFound();

        // Cache the appointment for 5 minutes
        var dto = MapAppointmentToDto(appointment);
        await _cacheService.SetAsync(cacheKey, dto, CacheService.CacheDuration.Medium);

        return Ok(dto);
    }

    /// <summary>
    /// Create a new appointment
    /// </summary>
    /// <param name="request">Appointment creation request</param>
    /// <returns>The created appointment</returns>
    /// <response code="201">Appointment created successfully</response>
    /// <response code="400">Invalid request or time slot not available</response>
    /// <response code="409">Time slot conflict - double booking detected</response>
    [HttpPost]
    [EnableRateLimiting("api")]
    [ProducesResponseType(typeof(AppointmentDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<ActionResult<AppointmentDto>> CreateAppointment(CreateAppointmentRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        // Validate provider exists
        var provider = await _context.Users
            .Where(u => u.Id == request.ProviderId && u.TenantId == tenantId)
            .FirstOrDefaultAsync();
        
        if (provider == null)
            return BadRequest(new { message = "Provider not found" });

        // Validate patient exists and is actually a patient
        if (!User.IsInRole("Patient"))
        {
            var patient = await _context.Users
                .Where(u => u.Id == request.PatientId && u.TenantId == tenantId && u.UserType == UserType.Patient)
                .FirstOrDefaultAsync();
            
            if (patient == null)
                return BadRequest(new { message = "Patient not found" });
        }

        var providerProfileId = await _context.Providers
            .Where(p => p.TenantId == tenantId && p.UserId == request.ProviderId)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();

        if (!providerProfileId.HasValue)
            return BadRequest(new { message = "Provider profile not found" });

        // Check for double booking
        var conflictingAppointment = await _context.Appointments
            .Where(a => a.TenantId == tenantId 
                && a.ProviderId == request.ProviderId
                && a.Status != AppointmentStatus.Cancelled
                && a.ScheduledStart < request.ScheduledEnd
                && a.ScheduledEnd > request.ScheduledStart)
            .AnyAsync();

        if (conflictingAppointment)
            return BadRequest(new { message = "Time slot is not available" });

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = User.IsInRole("Patient") ? userId : request.PatientId,
            ProviderId = request.ProviderId,
            EvaluationId = request.EvaluationId,
            AppointmentType = request.AppointmentType,
            Status = AppointmentStatus.Requested,
            ScheduledStart = request.ScheduledStart,
            ScheduledEnd = request.ScheduledEnd,
            LocationType = request.LocationType,
            LocationDetails = request.LocationDetails ?? new Dictionary<string, object>(),
            Notes = request.Notes,
            ProviderProfileId = providerProfileId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);
        try
        {
            // Track entity changes for audit
            _auditService.TrackEntityChanges(_context);
            
            await _context.SaveChangesAsync();
            
            // Log the appointment creation
            await _auditService.SaveTrackedChangesAsync(_context, tenantId, userId);
            await _auditService.LogEntityChangeAsync(
                tenantId,
                userId,
                "CREATE",
                appointment,
                additionalMetadata: new Dictionary<string, object>
                {
                    ["appointmentType"] = appointment.AppointmentType,
                    ["provider"] = provider.Email,
                    ["scheduledTime"] = appointment.ScheduledStart
                });
            
            // Invalidate relevant caches
            var userRole = User.IsInRole("Patient") ? "Patient" : "Clinician";
            var appointmentListKey = CacheService.CacheKeys.AppointmentList(tenantId, userId, userRole, request.ScheduledStart.Date, request.ScheduledEnd.Date);
            await _cacheService.RemoveAsync(appointmentListKey);
            await _cacheService.RemoveAsync(CacheService.CacheKeys.UserAppointments(userId));
            if (request.PatientId != userId)
            {
                await _cacheService.RemoveAsync(CacheService.CacheKeys.UserAppointments(request.PatientId));
            }
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uq_appointments_provider_time") == true || ex.InnerException?.Message.Contains("no_double_booking") == true)
        {
            _logger.LogWarning(ex, "Unique index prevented double booking for provider {ProviderId}", request.ProviderId);
            return Conflict(new { message = "Time slot is not available (double booking)" });
        }

        _logger.LogInformation("Appointment created: {AppointmentId}", appointment.Id);

        // Load related data for response
        await _context.Entry(appointment)
            .Reference(a => a.Patient)
            .LoadAsync();
        await _context.Entry(appointment)
            .Reference(a => a.Provider)
            .LoadAsync();

        return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, MapAppointmentToDto(appointment));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAppointment(Guid id, UpdateAppointmentRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var appointment = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync();

        if (appointment == null)
            return NotFound();

        // Check permissions
        if (User.IsInRole("Patient") && appointment.PatientId != userId)
            return Forbid();

        if (request.ScheduledStart.HasValue || request.ScheduledEnd.HasValue)
        {
            var newStart = request.ScheduledStart ?? appointment.ScheduledStart;
            var newEnd = request.ScheduledEnd ?? appointment.ScheduledEnd;

            // Check for conflicts
            var hasConflict = await _context.Appointments
                .Where(a => a.TenantId == tenantId 
                    && a.Id != id
                    && a.ProviderId == appointment.ProviderId
                    && a.Status != AppointmentStatus.Cancelled
                    && a.ScheduledStart < newEnd
                    && a.ScheduledEnd > newStart)
                .AnyAsync();

            if (hasConflict)
                return BadRequest(new { message = "Time slot is not available" });

            appointment.ScheduledStart = newStart;
            appointment.ScheduledEnd = newEnd;
        }

        if (request.Status.HasValue)
            appointment.Status = request.Status.Value;

        if (request.Notes != null)
            appointment.Notes = request.Notes;

        if (request.ActualStart.HasValue)
            appointment.ActualStart = request.ActualStart;

        if (request.ActualEnd.HasValue)
            appointment.ActualEnd = request.ActualEnd;

        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Appointment updated: {AppointmentId}", appointment.Id);

        return NoContent();
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelAppointment(Guid id, [FromBody] CancelAppointmentRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var appointment = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync();

        if (appointment == null)
            return NotFound();

        // Check permissions
        if (User.IsInRole("Patient") && appointment.PatientId != userId)
            return Forbid();

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.CancellationReason = request.Reason;
        appointment.CancelledAt = DateTime.UtcNow;
        appointment.CancelledBy = userId;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Appointment cancelled: {AppointmentId}", appointment.Id);

        return NoContent();
    }

    [HttpPost("{id}/send-reminder")]
    public async Task<IActionResult> SendReminder(Guid id, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();

        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment == null)
            return NotFound();

        var tenantTimezone = await _context.Tenants
            .Where(t => t.Id == tenantId)
            .Select(t => t.Timezone ?? "Australia/Sydney")
            .FirstOrDefaultAsync(cancellationToken) ?? "Australia/Sydney";

        var (canSendEmail, emailReason) = await _notificationGate.CanSendEmailAsync(tenantId, appointment.PatientId, cancellationToken);

        var reminder = new AppointmentReminderDto
        {
            AppointmentId = appointment.Id,
            ProviderId = appointment.ProviderId,
            ProviderName = appointment.Provider != null 
                ? $"{appointment.Provider.FirstName} {appointment.Provider.LastName}".Trim() 
                : "Clinician",
            AppointmentTime = appointment.ScheduledStart,
            Location = appointment.Location ?? appointment.LocationDetails.GetValueOrDefault("address")?.ToString()
        };

        await _realTimeNotificationService.SendAppointmentReminderAsync(appointment.PatientId, reminder);

        appointment.ReminderSentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Appointment reminder sent for appointment {AppointmentId}", appointment.Id);

        return Accepted(new
        {
            appointmentId = appointment.Id,
            status = "sent",
            requestedAt = DateTime.UtcNow,
            channels = new
            {
                inApp = true,
                email = canSendEmail,
                emailGateReason = canSendEmail ? null : emailReason
            },
            timezone = tenantTimezone
        });
    }

    [HttpPost("{id}/confirm")]
    public async Task<IActionResult> ConfirmAppointment(Guid id)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var appointment = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync();

        if (appointment == null)
            return NotFound();

        // Check permissions
        if (User.IsInRole("Patient") && appointment.PatientId != userId)
            return Forbid();

        if (appointment.Status != AppointmentStatus.Scheduled)
            return BadRequest(new { message = "Only scheduled appointments can be confirmed" });

        appointment.Status = AppointmentStatus.Confirmed;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Appointment confirmed: {AppointmentId}", appointment.Id);

        return NoContent();
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteAppointment(Guid id, [FromBody] CompleteAppointmentRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var appointment = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync();

        if (appointment == null)
            return NotFound();

        // Only providers can mark appointments as complete
        if (appointment.ProviderId != userId)
            return Forbid();

        appointment.Status = AppointmentStatus.Completed;
        appointment.ActualStart = request.ActualStart ?? appointment.ScheduledStart;
        appointment.ActualEnd = request.ActualEnd ?? DateTime.UtcNow;
        appointment.Notes = request.Notes ?? appointment.Notes;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Appointment completed: {AppointmentId}", appointment.Id);

        return NoContent();
    }

    [HttpGet("waitlist")]
    public async Task<ActionResult<IEnumerable<WaitlistEntryDto>>> GetWaitlist(CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        Guid? patientFilter = null;
        if (User.IsInRole("Patient"))
        {
            patientFilter = CurrentUserId;
        }

        var entries = await _waitlistService.GetEntriesAsync(tenantId, patientFilter, cancellationToken);
        return Ok(entries.Select(MapWaitlistEntryToDto));
    }

    [HttpPost("waitlist")]
    public async Task<ActionResult<WaitlistEntryDto>> AddToWaitlist([FromBody] WaitlistRequest request, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var patientId = request.PatientId == Guid.Empty ? userId : request.PatientId;

        if (!await _authorizationService.UserCanAccessPatientDataAsync(userId, patientId))
        {
            return Forbid();
        }

        request.PatientId = patientId;

        var entry = await _waitlistService.AddEntryAsync(tenantId, userId, request, cancellationToken);

        return Accepted(MapWaitlistEntryToDto(entry));
    }

    [HttpGet("availability")]
    public async Task<ActionResult<IEnumerable<AvailableSlotDto>>> GetAvailability(
        [FromQuery] Guid providerId,
        [FromQuery] DateTime date,
        [FromQuery] int durationMinutes = 30)
    {
        // Use the availability service to get available slots
        var slots = await _availabilityService.GetAvailableSlots(providerId, date, durationMinutes);
        
        var availableSlots = slots.Select(s => new AvailableSlotDto
        {
            StartTime = s.Start,
            EndTime = s.End,
            Available = s.IsAvailable,
            ProviderId = providerId
        }).ToList();

        return Ok(availableSlots);
    }
    
    /// <summary>
    /// Get available providers for a given date
    /// </summary>
    [HttpGet("providers/available")]
    public async Task<ActionResult<IEnumerable<object>>> GetAvailableProviders(
        [FromQuery] DateTime date,
        [FromQuery] string? specialization = null)
    {
        var providers = await _availabilityService.GetAvailableProviders(date, specialization);
        return Ok(providers);
    }
    
    /// <summary>
    /// Book an appointment using the availability service
    /// </summary>
    [HttpPost("book")]
    public async Task<ActionResult<AppointmentDto>> BookAppointment([FromBody] BookAppointmentRequest request)
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        var patientId = User.IsInRole("Patient") ? userId : request.PatientId;
        
        // Book the appointment using the service
        var success = await _availabilityService.BookAppointment(
            patientId, 
            request.ProviderId, 
            request.StartTime, 
            request.DurationMinutes, 
            request.AppointmentType);
        
        if (!success)
        {
            return BadRequest(new { message = "Unable to book appointment. The slot may no longer be available." });
        }
        
        // Get the created appointment
        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Where(a => a.PatientId == patientId 
                && a.ProviderId == request.ProviderId 
                && a.ScheduledStart == request.StartTime)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync();
        
        if (appointment == null)
        {
            return StatusCode(500, "Appointment was created but could not be retrieved");
        }
        
        return Ok(MapAppointmentToDto(appointment));
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetUpcomingAppointments()
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Where(a => a.TenantId == tenantId
                && a.ScheduledStart > DateTime.UtcNow
                && (a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.Confirmed));

        // Filter by user role
        if (User.IsInRole("Patient"))
        {
            query = query.Where(a => a.PatientId == userId);
        }
        else if (User.IsInRole("Clinician"))
        {
            query = query.Where(a => a.ProviderId == userId);
        }

        var appointments = await query
            .OrderBy(a => a.ScheduledStart)
            .Take(10)
            .ToListAsync();

        return Ok(appointments.Select(MapAppointmentToDto));
    }

    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAppointmentHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Where(a => a.TenantId == tenantId
                && (a.ScheduledStart <= DateTime.UtcNow || a.Status == AppointmentStatus.Completed || a.Status == AppointmentStatus.Cancelled));

        // Filter by user role
        if (User.IsInRole("Patient"))
        {
            query = query.Where(a => a.PatientId == userId);
        }
        else if (User.IsInRole("Clinician"))
        {
            query = query.Where(a => a.ProviderId == userId);
        }

        var totalCount = await query.CountAsync();

        var appointments = await query
            .OrderByDescending(a => a.ScheduledStart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            items = appointments.Select(MapAppointmentToDto).ToList(),
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpPost("{id}/reschedule")]
    public async Task<IActionResult> RescheduleAppointment(Guid id, [FromBody] RescheduleAppointmentRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var appointment = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync();

        if (appointment == null)
            return NotFound();

        // Check permissions
        if (User.IsInRole("Patient") && appointment.PatientId != userId)
            return Forbid();

        // Check for conflicts with the new time
        var hasConflict = await _context.Appointments
            .Where(a => a.TenantId == tenantId 
                && a.Id != id
                && a.ProviderId == appointment.ProviderId
                && a.Status != AppointmentStatus.Cancelled
                && a.ScheduledStart < request.NewEndTime
                && a.ScheduledEnd > request.NewStartTime)
            .AnyAsync();

        if (hasConflict)
            return BadRequest(new { message = "The new time slot is not available" });

        // Update the appointment
        appointment.ScheduledStart = request.NewStartTime;
        appointment.ScheduledEnd = request.NewEndTime;
        appointment.Status = AppointmentStatus.Scheduled; // Reset to scheduled status
        appointment.UpdatedAt = DateTime.UtcNow;
        
        // Add rescheduling note
        var reschedulingNote = $"\n[Rescheduled on {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC]";
        if (!string.IsNullOrEmpty(request.Reason))
            reschedulingNote += $" Reason: {request.Reason}";
        
        appointment.Notes = (appointment.Notes ?? "") + reschedulingNote;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Appointment rescheduled: {AppointmentId} to {NewTime}", appointment.Id, request.NewStartTime);

        // TODO: Send notifications to patient and provider about the rescheduling

        return NoContent();
    }

    private static AppointmentDto MapAppointmentToDto(Appointment appointment)
    {
        var locationDetails = appointment.LocationDetails ?? new Dictionary<string, object>();
        var patientPreferences = appointment.Patient?.Preferences ?? new Dictionary<string, object>();

        var videoLink = ExtractStringValue(locationDetails, "meetingUrl")
                        ?? ExtractStringValue(locationDetails, "videoLink");

        var dto = new AppointmentDto
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient != null ? $"{appointment.Patient.FirstName} {appointment.Patient.LastName}" : null,
            PatientEmail = appointment.Patient?.Email,
            PatientPhone = appointment.Patient?.Phone,
            ProviderId = appointment.ProviderId,
            ProviderProfileId = appointment.ProviderProfileId,
            ProviderName = appointment.Provider != null 
                ? $"{appointment.Provider.FirstName} {appointment.Provider.LastName}" 
                : null,
            ProviderEmail = appointment.Provider?.Email,
            ProviderPhone = appointment.Provider?.Phone,
            EvaluationId = appointment.EvaluationId,
            AppointmentType = appointment.AppointmentType,
            Status = appointment.Status,
            ScheduledStart = appointment.ScheduledStart,
            ScheduledEnd = appointment.ScheduledEnd,
            ActualStart = appointment.ActualStart,
            ActualEnd = appointment.ActualEnd,
            LocationType = appointment.LocationType,
            LocationDetails = CloneDictionary(locationDetails),
            Location = appointment.Location,
            VideoLink = videoLink,
            Notes = appointment.Notes,
            ReasonForVisit = ExtractStringValue(locationDetails, "reason") ?? appointment.Notes,
            InsuranceVerified = ExtractBoolValue(locationDetails, "insuranceVerified")
                                 ?? ExtractBoolValue(patientPreferences, "insuranceVerified"),
            CopayAmount = appointment.PaymentAmount,
            FollowUpRequired = ExtractBoolValue(locationDetails, "followUpRequired"),
            InsuranceProvider = ExtractStringValue(patientPreferences, "insuranceProvider"),
            ExternalCalendarId = appointment.ExternalCalendarId,
            CancellationReason = appointment.CancellationReason,
            CancelledAt = appointment.CancelledAt,
            ReminderSentAt = appointment.ReminderSentAt,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        return dto;
    }

    private static Dictionary<string, object> CloneDictionary(Dictionary<string, object> source)
    {
        var clone = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

        foreach (var kvp in source)
        {
            var normalized = NormalizeJsonValue(kvp.Value);
            if (normalized != null)
            {
                clone[kvp.Key] = normalized;
            }
        }

        return clone;
    }

    private static string? ExtractStringValue(Dictionary<string, object> source, string key)
    {
        if (!source.TryGetValue(key, out var raw) || raw is null)
        {
            return null;
        }

        var normalized = NormalizeJsonValue(raw);
        return normalized switch
        {
            null => null,
            string s when string.IsNullOrWhiteSpace(s) => null,
            string s => s,
            bool b => b.ToString(),
            int i => i.ToString(CultureInfo.InvariantCulture),
            long l => l.ToString(CultureInfo.InvariantCulture),
            double d => d.ToString(CultureInfo.InvariantCulture),
            decimal m => m.ToString(CultureInfo.InvariantCulture),
            JsonElement json => json.ValueKind == JsonValueKind.String ? json.GetString() : json.ToString(),
            _ => normalized.ToString()
        };
    }

    private static bool? ExtractBoolValue(Dictionary<string, object> source, string key)
    {
        if (!source.TryGetValue(key, out var raw) || raw is null)
        {
            return null;
        }

        var normalized = NormalizeJsonValue(raw);
        return normalized switch
        {
            bool b => b,
            string s when bool.TryParse(s, out var parsed) => parsed,
            JsonElement json when json.ValueKind == JsonValueKind.True => true,
            JsonElement json when json.ValueKind == JsonValueKind.False => false,
            _ => null
        };
    }

    private static object? NormalizeJsonValue(object? value)
    {
        if (value is JsonElement json)
        {
            switch (json.ValueKind)
            {
                case JsonValueKind.Object:
                    return JsonSerializer.Deserialize<Dictionary<string, object>>(json.GetRawText()) ?? new Dictionary<string, object>();
                case JsonValueKind.Array:
                    return JsonSerializer.Deserialize<List<object>>(json.GetRawText()) ?? new List<object>();
                case JsonValueKind.String:
                    return json.GetString();
                case JsonValueKind.Number:
                    if (json.TryGetInt64(out var longValue))
                        return longValue;
                    if (json.TryGetDecimal(out var decimalValue))
                        return decimalValue;
                    if (json.TryGetDouble(out var doubleValue))
                        return doubleValue;
                    return json.GetRawText();
                case JsonValueKind.True:
                    return true;
                case JsonValueKind.False:
                    return false;
                case JsonValueKind.Null:
                    return null;
                default:
                    return json.GetRawText();
            }
        }

        return value;
    }

    private static WaitlistEntryDto MapWaitlistEntryToDto(AppointmentWaitlistEntry entry)
    {
        var preferredDates = entry.PreferredDates
            .Select(date => date.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(date, DateTimeKind.Utc) : date.ToUniversalTime())
            .ToList();

        var patientName = entry.Patient != null ? entry.Patient.FullName.Trim() : string.Empty;
        var providerName = entry.Provider != null ? entry.Provider.FullName.Trim() : null;

        return new WaitlistEntryDto
        {
            Id = entry.Id,
            PatientId = entry.PatientId,
            PatientName = patientName,
            PatientEmail = entry.Patient?.Email ?? string.Empty,
            ProviderId = entry.ProviderId,
            ProviderName = providerName,
            AppointmentType = entry.AppointmentType,
            Status = entry.Status.ToString().ToLowerInvariant(),
            Notes = entry.Notes,
            PreferredDates = preferredDates,
            CreatedAt = entry.CreatedAt,
            UpdatedAt = entry.UpdatedAt
        };
    }

    private DateTime ToUtc(DateTime dateTime)
    {
        return dateTime.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(dateTime, DateTimeKind.Utc) 
            : dateTime.ToUniversalTime();
    }

    // GetTenantId and GetUserId methods removed - using BaseApiController properties instead
}

// DTOs
public class AppointmentDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string? PatientName { get; set; }
    public string? PatientEmail { get; set; }
    public string? PatientPhone { get; set; }
    public Guid ProviderId { get; set; }
    public Guid ProviderProfileId { get; set; }
    public string? ProviderName { get; set; }
    public string? ProviderEmail { get; set; }
    public string? ProviderPhone { get; set; }
    public Guid? EvaluationId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public LocationType LocationType { get; set; }
    public Dictionary<string, object> LocationDetails { get; set; } = new();
    public string? Location { get; set; }
    public string? VideoLink { get; set; }
    public string? Notes { get; set; }
    public string? ReasonForVisit { get; set; }
    public bool? InsuranceVerified { get; set; }
    public decimal? CopayAmount { get; set; }
    public bool? FollowUpRequired { get; set; }
    public string? InsuranceProvider { get; set; }
    public string? ExternalCalendarId { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAppointmentRequest
{
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid? EvaluationId { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }
    public string AppointmentType { get; set; } = "consultation";
    public LocationType LocationType { get; set; } = LocationType.InPerson;
    public Dictionary<string, object>? LocationDetails { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAppointmentRequest
{
    public DateTime? ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public AppointmentStatus? Status { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public string? Notes { get; set; }
}

public class CancelAppointmentRequest
{
    public string? Reason { get; set; }
}

public class CompleteAppointmentRequest
{
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public string? Notes { get; set; }
}

public class RescheduleAppointmentRequest
{
    public DateTime NewStartTime { get; set; }
    public DateTime NewEndTime { get; set; }
    public string? Reason { get; set; }
}

public class WaitlistEntryDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientEmail { get; set; } = string.Empty;
    public Guid? ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = WaitlistStatus.Requested.ToString().ToLowerInvariant();
    public string? Notes { get; set; }
    public IEnumerable<DateTime> PreferredDates { get; set; } = Array.Empty<DateTime>();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AvailableSlotDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool Available { get; set; }
    public Guid ProviderId { get; set; }
}

public class BookAppointmentRequest
{
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public string AppointmentType { get; set; } = "consultation";
}
