using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Security.Claims;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AppointmentsController> _logger;

    public AppointmentsController(
        QivrDbContext context,
        ILogger<AppointmentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAppointments(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] AppointmentStatus? status)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

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
            query = query.Where(a => a.ScheduledStart >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(a => a.ScheduledStart <= endDate.Value);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        var appointments = await query
            .OrderBy(a => a.ScheduledStart)
            .Select(a => new AppointmentDto
            {
                Id = a.Id,
                PatientId = a.PatientId,
                PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}" : null,
                ProviderId = a.ProviderId,
                ProviderName = a.Provider != null ? $"{a.Provider.FirstName} {a.Provider.LastName}" : null,
                EvaluationId = a.EvaluationId,
                AppointmentType = a.AppointmentType,
                Status = a.Status,
                ScheduledStart = a.ScheduledStart,
                ScheduledEnd = a.ScheduledEnd,
                ActualStart = a.ActualStart,
                ActualEnd = a.ActualEnd,
                LocationType = a.LocationType,
                LocationDetails = a.LocationDetails,
                Notes = a.Notes,
                ExternalCalendarId = a.ExternalCalendarId,
                CancellationReason = a.CancellationReason,
                CancelledAt = a.CancelledAt,
                ReminderSentAt = a.ReminderSentAt,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return Ok(appointments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentDto>> GetAppointment(Guid id)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Include(a => a.Evaluation)
            .Where(a => a.TenantId == tenantId && a.Id == id)
            .FirstOrDefaultAsync();

        if (appointment == null)
            return NotFound();

        // Check access permissions
        if (User.IsInRole("Patient") && appointment.PatientId != userId)
            return Forbid();

        if (User.IsInRole("Clinician") && appointment.ProviderId != userId)
            return Forbid();

        return Ok(new AppointmentDto
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient != null ? $"{appointment.Patient.FirstName} {appointment.Patient.LastName}" : null,
            ProviderId = appointment.ProviderId,
            ProviderName = appointment.Provider != null ? $"{appointment.Provider.FirstName} {appointment.Provider.LastName}" : null,
            EvaluationId = appointment.EvaluationId,
            AppointmentType = appointment.AppointmentType,
            Status = appointment.Status,
            ScheduledStart = appointment.ScheduledStart,
            ScheduledEnd = appointment.ScheduledEnd,
            ActualStart = appointment.ActualStart,
            ActualEnd = appointment.ActualEnd,
            LocationType = appointment.LocationType,
            LocationDetails = appointment.LocationDetails,
            Notes = appointment.Notes,
            ExternalCalendarId = appointment.ExternalCalendarId,
            CancellationReason = appointment.CancellationReason,
            CancelledAt = appointment.CancelledAt,
            ReminderSentAt = appointment.ReminderSentAt,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAppointment(CreateAppointmentRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        // Validate provider exists
        var provider = await _context.Users
            .Where(u => u.Id == request.ProviderId && u.TenantId == tenantId)
            .FirstOrDefaultAsync();
        
        if (provider == null)
            return BadRequest(new { message = "Provider not found" });

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
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);
        try
        {
            await _context.SaveChangesAsync();
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

        return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, new AppointmentDto
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient != null ? $"{appointment.Patient.FirstName} {appointment.Patient.LastName}" : null,
            ProviderId = appointment.ProviderId,
            ProviderName = appointment.Provider != null ? $"{appointment.Provider.FirstName} {appointment.Provider.LastName}" : null,
            EvaluationId = appointment.EvaluationId,
            AppointmentType = appointment.AppointmentType,
            Status = appointment.Status,
            ScheduledStart = appointment.ScheduledStart,
            ScheduledEnd = appointment.ScheduledEnd,
            LocationType = appointment.LocationType,
            LocationDetails = appointment.LocationDetails,
            Notes = appointment.Notes,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAppointment(Guid id, UpdateAppointmentRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

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
        var tenantId = GetTenantId();
        var userId = GetUserId();

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

    [HttpPost("{id}/confirm")]
    public async Task<IActionResult> ConfirmAppointment(Guid id)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

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
        var tenantId = GetTenantId();
        var userId = GetUserId();

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

    [HttpGet("availability")]
    public async Task<ActionResult<IEnumerable<AvailableSlotDto>>> GetAvailability(
        [FromQuery] Guid providerId,
        [FromQuery] DateTime date,
        [FromQuery] int durationMinutes = 30)
    {
        var tenantId = GetTenantId();

        // Get provider's working hours (simplified - normally from provider settings)
        var workingHours = new
        {
            Start = new TimeSpan(9, 0, 0),  // 9 AM
            End = new TimeSpan(17, 0, 0)    // 5 PM
        };

        // Get existing appointments for the provider on that date
        var existingAppointments = await _context.Appointments
            .Where(a => a.TenantId == tenantId
                && a.ProviderId == providerId
                && a.ScheduledStart.Date == date.Date
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.ScheduledStart)
            .ToListAsync();

        var availableSlots = new List<AvailableSlotDto>();
        var currentTime = date.Date.Add(workingHours.Start);
        var endTime = date.Date.Add(workingHours.End);

        while (currentTime.AddMinutes(durationMinutes) <= endTime)
        {
            var slotEnd = currentTime.AddMinutes(durationMinutes);
            
            // Check if slot conflicts with existing appointments
            bool isAvailable = !existingAppointments.Any(a => 
                a.ScheduledStart < slotEnd && a.ScheduledEnd > currentTime);

            if (isAvailable)
            {
                availableSlots.Add(new AvailableSlotDto
                {
                    StartTime = currentTime,
                    EndTime = slotEnd,
                    Available = true,
                    ProviderId = providerId
                });
            }

            currentTime = currentTime.AddMinutes(30); // Move to next slot
        }

        return Ok(availableSlots);
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetUpcomingAppointments()
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

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
            .Select(a => new AppointmentDto
            {
                Id = a.Id,
                PatientId = a.PatientId,
                PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}" : null,
                ProviderId = a.ProviderId,
                ProviderName = a.Provider != null ? $"{a.Provider.FirstName} {a.Provider.LastName}" : null,
                AppointmentType = a.AppointmentType,
                Status = a.Status,
                ScheduledStart = a.ScheduledStart,
                ScheduledEnd = a.ScheduledEnd,
                LocationType = a.LocationType,
                LocationDetails = a.LocationDetails,
                Notes = a.Notes
            })
            .ToListAsync();

        return Ok(appointments);
    }

    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var tenantId))
            return tenantId;
        throw new UnauthorizedAccessException("Tenant ID not found");
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
            return userId;
        throw new UnauthorizedAccessException("User ID not found");
    }
}

// DTOs
public class AppointmentDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string? PatientName { get; set; }
    public Guid ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public Guid? EvaluationId { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; }
    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public LocationType LocationType { get; set; }
    public Dictionary<string, object> LocationDetails { get; set; } = new();
    public string? Notes { get; set; }
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

public class AvailableSlotDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool Available { get; set; }
    public Guid ProviderId { get; set; }
}
