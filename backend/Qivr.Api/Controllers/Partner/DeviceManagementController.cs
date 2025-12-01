using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Api.Controllers.Partner;

[ApiController]
[Route("api/partner/devices")]
[Authorize(Policy = "Partner")]
public class DeviceManagementController : ControllerBase
{
    private readonly AdminReadOnlyDbContext _db;

    public DeviceManagementController(AdminReadOnlyDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get partner ID from JWT claims or X-Partner-Id header.
    /// Returns null if no valid partner ID can be determined.
    /// </summary>
    private Guid? GetPartnerId()
    {
        // Try JWT claim first (production auth)
        var partnerIdClaim = User.FindFirst("partner_id")?.Value
            ?? User.FindFirst("custom:partner_id")?.Value;
        if (Guid.TryParse(partnerIdClaim, out var partnerId))
            return partnerId;

        // Fallback to header for development/testing
        var headerPartnerId = Request.Headers["X-Partner-Id"].FirstOrDefault();
        if (Guid.TryParse(headerPartnerId, out var headerParsedId))
            return headerParsedId;

        // No valid partner ID - return null (caller must handle)
        return null;
    }

    /// <summary>
    /// Get partner ID or return 401 Unauthorized
    /// </summary>
    private ActionResult<Guid> RequirePartnerId()
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
        {
            return Unauthorized(new { message = "Partner authentication required. Please provide a valid partner_id claim or X-Partner-Id header." });
        }
        return partnerId.Value;
    }

    /// <summary>
    /// Get all devices for the partner with management info
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDevices([FromQuery] bool includeInactive = false)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var query = _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId.Value);

        if (!includeInactive)
            query = query.Where(d => d.IsActive);

        var devices = await query
            .OrderBy(d => d.Category)
            .ThenBy(d => d.Name)
            .Select(d => new DeviceListItem
            {
                Id = d.Id,
                Name = d.Name,
                DeviceCode = d.DeviceCode,
                Category = d.Category,
                BodyRegion = d.BodyRegion,
                Description = d.Description,
                UdiCode = d.UdiCode,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt,
                UsageCount = d.UsageRecords.Count(),
                PatientCount = d.UsageRecords.Select(u => u.PatientId).Distinct().Count()
            })
            .ToListAsync();

        return Ok(new { devices });
    }

    /// <summary>
    /// Get a single device by ID
    /// </summary>
    [HttpGet("{deviceId:guid}")]
    public async Task<IActionResult> GetDevice(Guid deviceId)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var device = await _db.Set<MedicalDevice>()
            .Where(d => d.Id == deviceId && d.PartnerId == partnerId.Value)
            .Select(d => new DeviceDetail
            {
                Id = d.Id,
                Name = d.Name,
                DeviceCode = d.DeviceCode,
                Category = d.Category,
                BodyRegion = d.BodyRegion,
                Description = d.Description,
                UdiCode = d.UdiCode,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                UsageCount = d.UsageRecords.Count(),
                PatientCount = d.UsageRecords.Select(u => u.PatientId).Distinct().Count()
            })
            .FirstOrDefaultAsync();

        if (device == null)
            return NotFound(new { error = "Device not found" });

        return Ok(device);
    }

    /// <summary>
    /// Create a new device
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateDevice([FromBody] CreateDeviceRequest request)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        // Check for duplicate device code
        var existingCode = await _db.Set<MedicalDevice>()
            .AnyAsync(d => d.PartnerId == partnerId.Value && d.DeviceCode == request.DeviceCode);

        if (existingCode)
            return BadRequest(new { error = "A device with this code already exists" });

        var device = new MedicalDevice
        {
            Id = Guid.NewGuid(),
            PartnerId = partnerId.Value,
            Name = request.Name,
            DeviceCode = request.DeviceCode,
            Category = request.Category,
            BodyRegion = request.BodyRegion,
            Description = request.Description,
            UdiCode = request.UdiCode,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Set<MedicalDevice>().Add(device);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDevice), new { deviceId = device.Id }, new
        {
            id = device.Id,
            message = "Device created successfully"
        });
    }

    /// <summary>
    /// Update an existing device
    /// </summary>
    [HttpPut("{deviceId:guid}")]
    public async Task<IActionResult> UpdateDevice(Guid deviceId, [FromBody] UpdateDeviceRequest request)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var device = await _db.Set<MedicalDevice>()
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.PartnerId == partnerId.Value);

        if (device == null)
            return NotFound(new { error = "Device not found" });

        // Check for duplicate device code if changed
        if (request.DeviceCode != device.DeviceCode)
        {
            var existingCode = await _db.Set<MedicalDevice>()
                .AnyAsync(d => d.PartnerId == partnerId.Value && d.DeviceCode == request.DeviceCode && d.Id != deviceId);

            if (existingCode)
                return BadRequest(new { error = "A device with this code already exists" });
        }

        device.Name = request.Name;
        device.DeviceCode = request.DeviceCode;
        device.Category = request.Category;
        device.BodyRegion = request.BodyRegion;
        device.Description = request.Description;
        device.UdiCode = request.UdiCode;
        device.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Device updated successfully" });
    }

    /// <summary>
    /// Archive (soft-delete) a device
    /// </summary>
    [HttpPost("{deviceId:guid}/archive")]
    public async Task<IActionResult> ArchiveDevice(Guid deviceId)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var device = await _db.Set<MedicalDevice>()
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.PartnerId == partnerId.Value);

        if (device == null)
            return NotFound(new { error = "Device not found" });

        device.IsActive = false;
        device.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Device archived successfully" });
    }

    /// <summary>
    /// Restore an archived device
    /// </summary>
    [HttpPost("{deviceId:guid}/restore")]
    public async Task<IActionResult> RestoreDevice(Guid deviceId)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var device = await _db.Set<MedicalDevice>()
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.PartnerId == partnerId.Value);

        if (device == null)
            return NotFound(new { error = "Device not found" });

        device.IsActive = true;
        device.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Device restored successfully" });
    }

    /// <summary>
    /// Bulk create devices (CSV import)
    /// </summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreateDevices([FromBody] BulkCreateRequest request)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var existingCodes = await _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId.Value)
            .Select(d => d.DeviceCode)
            .ToListAsync();

        var created = new List<string>();
        var skipped = new List<string>();

        foreach (var item in request.Devices)
        {
            if (existingCodes.Contains(item.DeviceCode))
            {
                skipped.Add(item.DeviceCode);
                continue;
            }

            var device = new MedicalDevice
            {
                Id = Guid.NewGuid(),
                PartnerId = partnerId.Value,
                Name = item.Name,
                DeviceCode = item.DeviceCode,
                Category = item.Category,
                BodyRegion = item.BodyRegion,
                Description = item.Description,
                UdiCode = item.UdiCode,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Set<MedicalDevice>().Add(device);
            created.Add(item.DeviceCode);
            existingCodes.Add(item.DeviceCode);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            created = created.Count,
            skipped = skipped.Count,
            skippedCodes = skipped,
            message = $"Created {created.Count} devices, skipped {skipped.Count} duplicates"
        });
    }

    /// <summary>
    /// Get common categories and body regions for autocomplete
    /// </summary>
    [HttpGet("metadata")]
    public async Task<IActionResult> GetMetadata()
    {
        var partnerId = GetPartnerId();

        var devices = await _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId)
            .ToListAsync();

        var categories = devices
            .Where(d => !string.IsNullOrEmpty(d.Category))
            .Select(d => d.Category!)
            .Distinct()
            .OrderBy(c => c)
            .ToList();

        var bodyRegions = devices
            .Where(d => !string.IsNullOrEmpty(d.BodyRegion))
            .Select(d => d.BodyRegion!)
            .Distinct()
            .OrderBy(r => r)
            .ToList();

        // Also include common defaults
        var defaultCategories = new[] { "Spinal Implant", "Bone Graft", "Joint Replacement", "Orthopedic Hardware", "Biologics", "Surgical Instrument" };
        var defaultRegions = new[] { "Cervical", "Thoracic", "Lumbar", "Sacral", "Hip", "Knee", "Shoulder", "Ankle" };

        categories = categories.Union(defaultCategories).Distinct().OrderBy(c => c).ToList();
        bodyRegions = bodyRegions.Union(defaultRegions).Distinct().OrderBy(r => r).ToList();

        return Ok(new { categories, bodyRegions });
    }
}

// DTOs
public class DeviceListItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public string? Description { get; set; }
    public string? UdiCode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int UsageCount { get; set; }
    public int PatientCount { get; set; }
}

public class DeviceDetail : DeviceListItem
{
    public DateTime? UpdatedAt { get; set; }
}

public class CreateDeviceRequest
{
    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DeviceCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Category { get; set; }

    [MaxLength(100)]
    public string? BodyRegion { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? UdiCode { get; set; }
}

public class UpdateDeviceRequest : CreateDeviceRequest { }

public class BulkCreateRequest
{
    public List<CreateDeviceRequest> Devices { get; set; } = new();
}
