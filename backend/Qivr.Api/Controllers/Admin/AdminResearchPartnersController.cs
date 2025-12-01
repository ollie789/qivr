using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Infrastructure.Services;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Admin management for research partners (medical device companies like Medtronic).
/// Provides CRUD operations, clinic affiliation management, and audit logging.
/// </summary>
[ApiController]
[Route("api/admin/research-partners")]
[Authorize]
public class AdminResearchPartnersController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly AdminReadOnlyDbContext _readOnlyContext;
    private readonly IAdminAuditService _auditService;
    private readonly ILogger<AdminResearchPartnersController> _logger;

    public AdminResearchPartnersController(
        QivrDbContext context,
        AdminReadOnlyDbContext readOnlyContext,
        IAdminAuditService auditService,
        ILogger<AdminResearchPartnersController> logger)
    {
        _context = context;
        _readOnlyContext = readOnlyContext;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// List all research partners with summary stats
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPartners(CancellationToken ct)
    {
        var partners = await _readOnlyContext.ResearchPartners
            .OrderBy(p => p.Name)
            .Select(p => new ResearchPartnerListItem
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ContactEmail = p.ContactEmail,
                LogoUrl = p.LogoUrl,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                ClinicCount = p.ClinicAffiliations.Count(a => a.Status == AffiliationStatus.Active),
                DeviceCount = p.Devices.Count(d => d.IsActive),
                StudyCount = p.Studies.Count(s => s.Status == StudyStatus.Active)
            })
            .ToListAsync(ct);

        return Ok(partners);
    }

    /// <summary>
    /// Get partner details including affiliations, devices, and studies
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPartner(Guid id, CancellationToken ct)
    {
        var partner = await _readOnlyContext.ResearchPartners
            .Include(p => p.ClinicAffiliations)
                .ThenInclude(a => a.Tenant)
            .Include(p => p.Devices)
            .Include(p => p.Studies)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (partner == null) return NotFound();

        // Get device usage counts
        var deviceUsageCounts = await _readOnlyContext.PatientDeviceUsages
            .Where(u => u.Device != null && u.Device.PartnerId == id)
            .GroupBy(u => u.DeviceId)
            .Select(g => new { DeviceId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.DeviceId, x => x.Count, ct);

        return Ok(new ResearchPartnerDetailResponse
        {
            Id = partner.Id,
            Name = partner.Name,
            Slug = partner.Slug,
            ContactEmail = partner.ContactEmail,
            LogoUrl = partner.LogoUrl,
            Description = partner.Description,
            Website = partner.Website,
            IsActive = partner.IsActive,
            CognitoUserPoolId = partner.CognitoUserPoolId,
            CreatedAt = partner.CreatedAt,
            UpdatedAt = partner.UpdatedAt,
            Affiliations = partner.ClinicAffiliations.Select(a => new AffiliationResponse
            {
                Id = a.Id,
                TenantId = a.TenantId,
                TenantName = a.Tenant?.Name ?? "Unknown",
                TenantSlug = a.Tenant?.Slug ?? "",
                Status = a.Status.ToString(),
                DataSharingLevel = a.DataSharingLevel.ToString(),
                ApprovedAt = a.ApprovedAt,
                Notes = a.Notes,
                CreatedAt = a.CreatedAt
            }).ToList(),
            Devices = partner.Devices.Select(d => new DeviceResponse
            {
                Id = d.Id,
                Name = d.Name,
                DeviceCode = d.DeviceCode,
                Category = d.Category,
                BodyRegion = d.BodyRegion,
                IsActive = d.IsActive,
                UsageCount = deviceUsageCounts.GetValueOrDefault(d.Id, 0)
            }).ToList(),
            Studies = partner.Studies.Select(s => new StudyResponse
            {
                Id = s.Id,
                Title = s.Title,
                Status = s.Status.ToString(),
                ProtocolId = s.ProtocolId,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                TargetEnrollment = s.TargetEnrollment,
                CurrentEnrollment = s.Enrollments.Count(e => e.Status == EnrollmentStatus.Enrolled)
            }).ToList()
        });
    }

    /// <summary>
    /// Create a new research partner
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreatePartner([FromBody] CreatePartnerRequest request, CancellationToken ct)
    {
        // Generate slug from name
        var slug = GenerateSlug(request.Name);

        // Check for duplicate slug
        var existingSlug = await _context.ResearchPartners
            .AnyAsync(p => p.Slug == slug, ct);
        if (existingSlug)
        {
            return BadRequest(new { error = "A partner with a similar name already exists" });
        }

        var partner = new ResearchPartner
        {
            Name = request.Name,
            Slug = slug,
            ContactEmail = request.ContactEmail,
            LogoUrl = request.LogoUrl,
            Description = request.Description,
            Website = request.Website,
            IsActive = true
        };

        _context.ResearchPartners.Add(partner);
        await _context.SaveChangesAsync(ct);

        // Audit log
        await _auditService.LogAsync(
            AdminActions.ResearchPartnerCreate,
            "ResearchPartner",
            partner.Id,
            partner.Name,
            newState: JsonSerializer.Serialize(partner),
            ct: ct);

        return CreatedAtAction(nameof(GetPartner), new { id = partner.Id }, new { id = partner.Id, slug = partner.Slug });
    }

    /// <summary>
    /// Update partner details
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePartner(Guid id, [FromBody] UpdatePartnerRequest request, CancellationToken ct)
    {
        var partner = await _context.ResearchPartners.FindAsync(new object[] { id }, ct);
        if (partner == null) return NotFound();

        var previousState = JsonSerializer.Serialize(partner);

        if (!string.IsNullOrEmpty(request.Name)) partner.Name = request.Name;
        if (request.ContactEmail != null) partner.ContactEmail = request.ContactEmail;
        if (request.LogoUrl != null) partner.LogoUrl = request.LogoUrl;
        if (request.Description != null) partner.Description = request.Description;
        if (request.Website != null) partner.Website = request.Website;

        partner.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            AdminActions.ResearchPartnerUpdate,
            "ResearchPartner",
            partner.Id,
            partner.Name,
            previousState: previousState,
            newState: JsonSerializer.Serialize(partner),
            ct: ct);

        return Ok(new { success = true });
    }

    /// <summary>
    /// Activate a partner
    /// </summary>
    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> ActivatePartner(Guid id, CancellationToken ct)
    {
        var partner = await _context.ResearchPartners.FindAsync(new object[] { id }, ct);
        if (partner == null) return NotFound();

        partner.IsActive = true;
        partner.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            AdminActions.ResearchPartnerActivate,
            "ResearchPartner",
            partner.Id,
            partner.Name,
            ct: ct);

        return Ok(new { success = true });
    }

    /// <summary>
    /// Deactivate a partner
    /// </summary>
    [HttpPost("{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivatePartner(Guid id, CancellationToken ct)
    {
        var partner = await _context.ResearchPartners.FindAsync(new object[] { id }, ct);
        if (partner == null) return NotFound();

        partner.IsActive = false;
        partner.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            AdminActions.ResearchPartnerDeactivate,
            "ResearchPartner",
            partner.Id,
            partner.Name,
            ct: ct);

        return Ok(new { success = true });
    }

    /// <summary>
    /// Delete a partner (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePartner(Guid id, CancellationToken ct)
    {
        var partner = await _context.ResearchPartners.FindAsync(new object[] { id }, ct);
        if (partner == null) return NotFound();

        // Check for active affiliations or studies
        var hasActiveAffiliations = await _context.PartnerClinicAffiliations
            .AnyAsync(a => a.PartnerId == id && a.Status == AffiliationStatus.Active, ct);
        var hasActiveStudies = await _context.ResearchStudies
            .AnyAsync(s => s.PartnerId == id && s.Status == StudyStatus.Active, ct);

        if (hasActiveAffiliations || hasActiveStudies)
        {
            return BadRequest(new { error = "Cannot delete partner with active affiliations or studies" });
        }

        // Soft delete by deactivating
        partner.IsActive = false;
        partner.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            AdminActions.ResearchPartnerDelete,
            "ResearchPartner",
            partner.Id,
            partner.Name,
            ct: ct);

        return Ok(new { success = true });
    }

    // ========== Clinic Affiliations ==========

    /// <summary>
    /// List clinic affiliations for a partner
    /// </summary>
    [HttpGet("{id:guid}/affiliations")]
    public async Task<IActionResult> GetAffiliations(Guid id, CancellationToken ct)
    {
        var affiliations = await _readOnlyContext.PartnerClinicAffiliations
            .Include(a => a.Tenant)
            .Where(a => a.PartnerId == id)
            .OrderBy(a => a.Tenant != null ? a.Tenant.Name : "")
            .Select(a => new AffiliationResponse
            {
                Id = a.Id,
                TenantId = a.TenantId,
                TenantName = a.Tenant != null ? a.Tenant.Name : "Unknown",
                TenantSlug = a.Tenant != null ? a.Tenant.Slug : "",
                Status = a.Status.ToString(),
                DataSharingLevel = a.DataSharingLevel.ToString(),
                ApprovedAt = a.ApprovedAt,
                Notes = a.Notes,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(affiliations);
    }

    /// <summary>
    /// Add a clinic affiliation
    /// </summary>
    [HttpPost("{id:guid}/affiliations")]
    public async Task<IActionResult> AddAffiliation(Guid id, [FromBody] CreateAffiliationRequest request, CancellationToken ct)
    {
        var partner = await _context.ResearchPartners.FindAsync(new object[] { id }, ct);
        if (partner == null) return NotFound();

        var tenant = await _context.Tenants.FindAsync(new object[] { request.TenantId }, ct);
        if (tenant == null) return BadRequest(new { error = "Clinic not found" });

        // Check for existing affiliation
        var existing = await _context.PartnerClinicAffiliations
            .AnyAsync(a => a.PartnerId == id && a.TenantId == request.TenantId, ct);
        if (existing)
        {
            return BadRequest(new { error = "Affiliation already exists" });
        }

        var affiliation = new PartnerClinicAffiliation
        {
            PartnerId = id,
            TenantId = request.TenantId,
            Status = Enum.Parse<AffiliationStatus>(request.Status ?? "Pending"),
            DataSharingLevel = Enum.Parse<DataSharingLevel>(request.DataSharingLevel ?? "Aggregated"),
            Notes = request.Notes
        };

        if (affiliation.Status == AffiliationStatus.Active)
        {
            affiliation.ApprovedAt = DateTime.UtcNow;
            // ApprovedBy could be set from the current user's ID
        }

        _context.PartnerClinicAffiliations.Add(affiliation);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            AdminActions.ResearchPartnerAffiliationCreate,
            "PartnerClinicAffiliation",
            affiliation.Id,
            $"{partner.Name} - {tenant.Name}",
            newState: JsonSerializer.Serialize(affiliation),
            ct: ct);

        return Ok(new { id = affiliation.Id });
    }

    /// <summary>
    /// Update an affiliation
    /// </summary>
    [HttpPut("{id:guid}/affiliations/{affiliationId:guid}")]
    public async Task<IActionResult> UpdateAffiliation(Guid id, Guid affiliationId, [FromBody] UpdateAffiliationRequest request, CancellationToken ct)
    {
        var affiliation = await _context.PartnerClinicAffiliations
            .Include(a => a.Partner)
            .Include(a => a.Tenant)
            .FirstOrDefaultAsync(a => a.Id == affiliationId && a.PartnerId == id, ct);

        if (affiliation == null) return NotFound();

        var previousState = JsonSerializer.Serialize(new { affiliation.Status, affiliation.DataSharingLevel });

        if (!string.IsNullOrEmpty(request.Status))
        {
            var newStatus = Enum.Parse<AffiliationStatus>(request.Status);
            if (newStatus == AffiliationStatus.Active && affiliation.Status != AffiliationStatus.Active)
            {
                affiliation.ApprovedAt = DateTime.UtcNow;
            }
            affiliation.Status = newStatus;
        }

        if (!string.IsNullOrEmpty(request.DataSharingLevel))
        {
            affiliation.DataSharingLevel = Enum.Parse<DataSharingLevel>(request.DataSharingLevel);
        }

        if (request.Notes != null)
        {
            affiliation.Notes = request.Notes;
        }

        affiliation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            AdminActions.ResearchPartnerAffiliationUpdate,
            "PartnerClinicAffiliation",
            affiliation.Id,
            $"{affiliation.Partner?.Name} - {affiliation.Tenant?.Name}",
            previousState: previousState,
            newState: JsonSerializer.Serialize(new { affiliation.Status, affiliation.DataSharingLevel }),
            ct: ct);

        return Ok(new { success = true });
    }

    /// <summary>
    /// Remove an affiliation
    /// </summary>
    [HttpDelete("{id:guid}/affiliations/{affiliationId:guid}")]
    public async Task<IActionResult> DeleteAffiliation(Guid id, Guid affiliationId, CancellationToken ct)
    {
        var affiliation = await _context.PartnerClinicAffiliations
            .Include(a => a.Partner)
            .Include(a => a.Tenant)
            .FirstOrDefaultAsync(a => a.Id == affiliationId && a.PartnerId == id, ct);

        if (affiliation == null) return NotFound();

        var name = $"{affiliation.Partner?.Name} - {affiliation.Tenant?.Name}";

        _context.PartnerClinicAffiliations.Remove(affiliation);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            AdminActions.ResearchPartnerAffiliationDelete,
            "PartnerClinicAffiliation",
            affiliationId,
            name,
            ct: ct);

        return Ok(new { success = true });
    }

    /// <summary>
    /// Get available clinics for affiliation (not already affiliated)
    /// </summary>
    [HttpGet("{id:guid}/available-clinics")]
    public async Task<IActionResult> GetAvailableClinics(Guid id, CancellationToken ct)
    {
        var affiliatedTenantIds = await _readOnlyContext.PartnerClinicAffiliations
            .Where(a => a.PartnerId == id)
            .Select(a => a.TenantId)
            .ToListAsync(ct);

        var availableClinics = await _readOnlyContext.Tenants
            .Where(t => !affiliatedTenantIds.Contains(t.Id))
            .OrderBy(t => t.Name)
            .Select(t => new { t.Id, t.Name, t.Slug })
            .ToListAsync(ct);

        return Ok(availableClinics);
    }

    // ========== Helper Methods ==========

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        return slug.Trim('-');
    }
}

// ========== Request/Response DTOs ==========

public class ResearchPartnerListItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ClinicCount { get; set; }
    public int DeviceCount { get; set; }
    public int StudyCount { get; set; }
}

public class ResearchPartnerDetailResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }
    public string? Website { get; set; }
    public bool IsActive { get; set; }
    public string? CognitoUserPoolId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<AffiliationResponse> Affiliations { get; set; } = new();
    public List<DeviceResponse> Devices { get; set; } = new();
    public List<StudyResponse> Studies { get; set; } = new();
}

public class AffiliationResponse
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantSlug { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DataSharingLevel { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DeviceResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public bool IsActive { get; set; }
    public int UsageCount { get; set; }
}

public class StudyResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ProtocolId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int TargetEnrollment { get; set; }
    public int CurrentEnrollment { get; set; }
}

public class CreatePartnerRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }
    public string? Website { get; set; }
}

public class UpdatePartnerRequest
{
    public string? Name { get; set; }
    public string? ContactEmail { get; set; }
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }
    public string? Website { get; set; }
}

public class CreateAffiliationRequest
{
    public Guid TenantId { get; set; }
    public string? Status { get; set; }
    public string? DataSharingLevel { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAffiliationRequest
{
    public string? Status { get; set; }
    public string? DataSharingLevel { get; set; }
    public string? Notes { get; set; }
}
