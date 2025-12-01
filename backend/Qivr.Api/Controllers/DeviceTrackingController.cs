using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

/// <summary>
/// Device tracking for clinic staff.
/// Allows recording which medical devices were used in patient procedures.
/// Only shows devices from research partners affiliated with the tenant.
/// </summary>
[ApiController]
[Route("api/device-tracking")]
[Authorize]
public class DeviceTrackingController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<DeviceTrackingController> _logger;

    public DeviceTrackingController(
        QivrDbContext context,
        ILogger<DeviceTrackingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get devices available for this tenant (from affiliated research partners)
    /// </summary>
    [HttpGet("available-devices")]
    public async Task<IActionResult> GetAvailableDevices(
        [FromQuery] string? category,
        [FromQuery] string? bodyRegion,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        // Get devices from affiliated partners (active affiliations only)
        var affiliatedPartnerIds = await _context.PartnerClinicAffiliations
            .Where(a => a.TenantId == tenantId && a.Status == AffiliationStatus.Active)
            .Select(a => a.PartnerId)
            .ToListAsync(ct);

        if (!affiliatedPartnerIds.Any())
        {
            return Ok(new { devices = Array.Empty<object>(), message = "No affiliated research partners. Enable data sharing in Settings → Research Partners." });
        }

        IQueryable<MedicalDevice> query = _context.MedicalDevices
            .Include(d => d.Partner)
            .Where(d => affiliatedPartnerIds.Contains(d.PartnerId) && d.IsActive);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(d => d.Category == category);
        if (!string.IsNullOrEmpty(bodyRegion))
            query = query.Where(d => d.BodyRegion == bodyRegion);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(d => d.Name.Contains(search) || d.DeviceCode.Contains(search));

        var devices = await query
            .OrderBy(d => d.Partner!.Name)
            .ThenBy(d => d.Name)
            .Select(d => new AvailableDeviceResponse
            {
                Id = d.Id,
                Name = d.Name,
                DeviceCode = d.DeviceCode,
                Category = d.Category,
                BodyRegion = d.BodyRegion,
                PartnerName = d.Partner != null ? d.Partner.Name : "Unknown",
                PartnerId = d.PartnerId
            })
            .ToListAsync(ct);

        return Ok(new { devices });
    }

    /// <summary>
    /// Get recent devices used by the current clinician
    /// </summary>
    [HttpGet("recent")]
    public async Task<IActionResult> GetRecentDevices(CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();
        if (tenantId == null || userId == null) return Unauthorized();

        var recentDeviceIds = await _context.PatientDeviceUsages
            .Where(u => u.TenantId == tenantId && u.RecordedBy == userId)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => u.DeviceId)
            .Distinct()
            .Take(5)
            .ToListAsync(ct);

        var devices = await _context.MedicalDevices
            .Where(d => recentDeviceIds.Contains(d.Id) && d.IsActive)
            .Include(d => d.Partner)
            .Select(d => new AvailableDeviceResponse
            {
                Id = d.Id,
                Name = d.Name,
                DeviceCode = d.DeviceCode,
                Category = d.Category,
                BodyRegion = d.BodyRegion,
                PartnerName = d.Partner != null ? d.Partner.Name : "Unknown",
                PartnerId = d.PartnerId
            })
            .ToListAsync(ct);

        // Sort by original order
        var orderedDevices = recentDeviceIds
            .Select(id => devices.FirstOrDefault(d => d.Id == id))
            .Where(d => d != null)
            .ToList();

        return Ok(new { devices = orderedDevices });
    }

    /// <summary>
    /// Record device usage for a patient procedure
    /// </summary>
    [HttpPost("record")]
    public async Task<IActionResult> RecordDeviceUsage([FromBody] RecordDeviceUsageRequest request, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();
        if (tenantId == null || userId == null) return Unauthorized();

        // Verify device exists and is from an affiliated partner
        var device = await _context.MedicalDevices
            .Include(d => d.Partner)
            .FirstOrDefaultAsync(d => d.Id == request.DeviceId, ct);

        if (device == null)
            return BadRequest(new { error = "Device not found" });

        // Verify affiliation
        var hasAffiliation = await _context.PartnerClinicAffiliations
            .AnyAsync(a =>
                a.PartnerId == device.PartnerId &&
                a.TenantId == tenantId &&
                a.Status == AffiliationStatus.Active, ct);

        if (!hasAffiliation)
            return BadRequest(new { error = "Device not available for this clinic" });

        // Verify patient belongs to tenant
        var patient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.PatientId && u.TenantId == tenantId, ct);
        if (patient == null)
            return BadRequest(new { error = "Patient not found" });

        // Verify appointment if provided
        if (request.AppointmentId.HasValue)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId.Value && a.TenantId == tenantId, ct);
            if (appointment == null)
                return BadRequest(new { error = "Appointment not found" });
        }

        var usage = new PatientDeviceUsage
        {
            DeviceId = request.DeviceId,
            PatientId = request.PatientId,
            TenantId = tenantId.Value,
            AppointmentId = request.AppointmentId,
            TreatmentPlanId = request.TreatmentPlanId,
            ProcedureDate = request.ProcedureDate ?? DateTime.UtcNow,
            ProcedureType = request.ProcedureType,
            ImplantLocation = request.ImplantLocation,
            Quantity = request.Quantity ?? 1,
            Notes = request.Notes,
            RecordedBy = userId.Value
        };

        _context.PatientDeviceUsages.Add(usage);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Device {DeviceId} ({DeviceName}) recorded for patient {PatientId} by {UserId}",
            device.Id, device.Name, request.PatientId, userId);

        return Ok(new { id = usage.Id, success = true });
    }

    /// <summary>
    /// Get device usage history for a patient
    /// </summary>
    [HttpGet("patient/{patientId:guid}")]
    public async Task<IActionResult> GetPatientDeviceHistory(Guid patientId, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var usages = await _context.PatientDeviceUsages
            .Where(u => u.PatientId == patientId && u.TenantId == tenantId)
            .Include(u => u.Device)
                .ThenInclude(d => d!.Partner)
            .OrderByDescending(u => u.ProcedureDate)
            .Select(u => new DeviceUsageResponse
            {
                Id = u.Id,
                DeviceId = u.DeviceId,
                DeviceName = u.Device != null ? u.Device.Name : "Unknown",
                DeviceCode = u.Device != null ? u.Device.DeviceCode : "",
                PartnerName = u.Device != null && u.Device.Partner != null ? u.Device.Partner.Name : "Unknown",
                ProcedureDate = u.ProcedureDate,
                ProcedureType = u.ProcedureType,
                ImplantLocation = u.ImplantLocation,
                Quantity = u.Quantity,
                Notes = u.Notes
            })
            .ToListAsync(ct);

        return Ok(new { usages });
    }

    /// <summary>
    /// Delete a device usage record (if recorded by current user and within 24 hours)
    /// </summary>
    [HttpDelete("{usageId:guid}")]
    public async Task<IActionResult> DeleteDeviceUsage(Guid usageId, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();
        if (tenantId == null || userId == null) return Unauthorized();

        var usage = await _context.PatientDeviceUsages
            .FirstOrDefaultAsync(u => u.Id == usageId && u.TenantId == tenantId, ct);

        if (usage == null)
            return NotFound();

        // Only allow deletion by the person who recorded it, within 24 hours
        if (usage.RecordedBy != userId)
            return Forbid();

        if (usage.CreatedAt < DateTime.UtcNow.AddHours(-24))
            return BadRequest(new { error = "Can only delete records within 24 hours of creation" });

        _context.PatientDeviceUsages.Remove(usage);
        await _context.SaveChangesAsync(ct);

        return Ok(new { success = true });
    }

    private Guid? GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value
            ?? User.FindFirst("custom:tenant_id")?.Value;
        return Guid.TryParse(tenantClaim, out var id) ? id : null;
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value
            ?? User.FindFirst("user_id")?.Value;
        return Guid.TryParse(userIdClaim, out var id) ? id : null;
    }
}

// DTOs
public class AvailableDeviceResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public Guid PartnerId { get; set; }
}

public class RecordDeviceUsageRequest
{
    public Guid DeviceId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? AppointmentId { get; set; }
    public Guid? TreatmentPlanId { get; set; }
    public DateTime? ProcedureDate { get; set; }
    public string? ProcedureType { get; set; }
    public string? ImplantLocation { get; set; }
    public int? Quantity { get; set; }
    public string? Notes { get; set; }
}

public class DeviceUsageResponse
{
    public Guid Id { get; set; }
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public string PartnerName { get; set; } = string.Empty;
    public DateTime ProcedureDate { get; set; }
    public string? ProcedureType { get; set; }
    public string? ImplantLocation { get; set; }
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}
