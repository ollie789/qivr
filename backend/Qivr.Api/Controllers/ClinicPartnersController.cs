using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/clinic/partners")]
[Authorize(Policy = "StaffOnly")]
public class ClinicPartnersController : ControllerBase
{
    private readonly QivrDbContext _db;

    public ClinicPartnersController(QivrDbContext db) => _db = db;

    private Guid GetTenantId() => Guid.Parse(User.FindFirst("tenant_id")?.Value ?? Guid.Empty.ToString());

    /// <summary>
    /// Get all available research partners and clinic's affiliation status
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPartners(CancellationToken ct)
    {
        var tenantId = GetTenantId();
        
        var partners = await _db.ResearchPartners
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Slug,
                p.LogoUrl,
                p.Description,
                p.Website,
                DeviceCount = p.Devices.Count(d => d.IsActive),
                Affiliation = p.ClinicAffiliations
                    .Where(a => a.TenantId == tenantId)
                    .Select(a => new { a.Id, a.Status, a.DataSharingLevel, a.ApprovedAt })
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        return Ok(new { partners });
    }

    /// <summary>
    /// Request affiliation with a research partner (opt-in)
    /// </summary>
    [HttpPost("{partnerId:guid}/request")]
    public async Task<IActionResult> RequestAffiliation(
        Guid partnerId,
        [FromBody] AffiliationRequest request,
        CancellationToken ct)
    {
        var tenantId = GetTenantId();

        var partner = await _db.ResearchPartners.FindAsync([partnerId], ct);
        if (partner == null || !partner.IsActive)
            return NotFound(new { error = "Partner not found" });

        var existing = await _db.PartnerClinicAffiliations
            .FirstOrDefaultAsync(a => a.PartnerId == partnerId && a.TenantId == tenantId, ct);

        if (existing != null)
            return BadRequest(new { error = "Affiliation already exists", status = existing.Status.ToString() });

        var affiliation = new PartnerClinicAffiliation
        {
            PartnerId = partnerId,
            TenantId = tenantId,
            Status = AffiliationStatus.Pending,
            DataSharingLevel = Enum.Parse<DataSharingLevel>(request.DataSharingLevel ?? "Aggregated"),
            Notes = request.Notes
        };

        _db.PartnerClinicAffiliations.Add(affiliation);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Affiliation request submitted", affiliationId = affiliation.Id });
    }

    /// <summary>
    /// Update data sharing level for an existing affiliation
    /// </summary>
    [HttpPut("{partnerId:guid}")]
    public async Task<IActionResult> UpdateAffiliation(
        Guid partnerId,
        [FromBody] AffiliationRequest request,
        CancellationToken ct)
    {
        var tenantId = GetTenantId();

        var affiliation = await _db.PartnerClinicAffiliations
            .FirstOrDefaultAsync(a => a.PartnerId == partnerId && a.TenantId == tenantId, ct);

        if (affiliation == null)
            return NotFound(new { error = "Affiliation not found" });

        if (!string.IsNullOrEmpty(request.DataSharingLevel))
            affiliation.DataSharingLevel = Enum.Parse<DataSharingLevel>(request.DataSharingLevel);
        
        affiliation.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Affiliation updated" });
    }

    /// <summary>
    /// Revoke affiliation (opt-out)
    /// </summary>
    [HttpDelete("{partnerId:guid}")]
    public async Task<IActionResult> RevokeAffiliation(Guid partnerId, CancellationToken ct)
    {
        var tenantId = GetTenantId();

        var affiliation = await _db.PartnerClinicAffiliations
            .FirstOrDefaultAsync(a => a.PartnerId == partnerId && a.TenantId == tenantId, ct);

        if (affiliation == null)
            return NotFound(new { error = "Affiliation not found" });

        affiliation.Status = AffiliationStatus.Revoked;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Affiliation revoked" });
    }
}

public class AffiliationRequest
{
    public string? DataSharingLevel { get; set; }
    public string? Notes { get; set; }
}
