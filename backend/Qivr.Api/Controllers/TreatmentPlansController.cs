using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/treatment-plans")]
[Authorize(Policy = "StaffOnly")]
public class TreatmentPlansController : BaseApiController
{
    private readonly QivrDbContext _context;

    public TreatmentPlansController(QivrDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? patientId)
    {
        var tenantId = RequireTenantId();
        var query = _context.TreatmentPlans
            .Where(t => t.TenantId == tenantId && !t.IsDeleted)
            .Include(t => t.Patient)
            .Include(t => t.Provider)
            .AsQueryable();

        if (patientId.HasValue)
            query = query.Where(t => t.PatientId == patientId.Value);

        var plans = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var tenantId = RequireTenantId();
        var plan = await _context.TreatmentPlans
            .Include(t => t.Patient)
            .Include(t => t.Provider)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);

        if (plan == null)
            return NotFound();

        return Ok(plan);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTreatmentPlanRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var plan = new TreatmentPlan
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            ProviderId = userId,
            Title = request.Title,
            Diagnosis = request.Diagnosis,
            Goals = request.Goals,
            StartDate = request.StartDate,
            DurationWeeks = request.DurationWeeks,
            Status = TreatmentPlanStatus.Draft,
            Sessions = request.Sessions ?? new(),
            Exercises = request.Exercises ?? new(),
            Notes = request.Notes
        };

        _context.TreatmentPlans.Add(plan);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTreatmentPlanRequest request)
    {
        var tenantId = RequireTenantId();
        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);

        if (plan == null)
            return NotFound();

        plan.Title = request.Title;
        plan.Diagnosis = request.Diagnosis;
        plan.Goals = request.Goals;
        plan.DurationWeeks = request.DurationWeeks;
        plan.Status = request.Status;
        plan.Sessions = request.Sessions ?? plan.Sessions;
        plan.Exercises = request.Exercises ?? plan.Exercises;
        plan.Notes = request.Notes;
        plan.EndDate = request.EndDate;
        plan.ReviewDate = request.ReviewDate;

        await _context.SaveChangesAsync();
        return Ok(plan);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = RequireTenantId();
        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

        if (plan == null)
            return NotFound();

        plan.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class CreateTreatmentPlanRequest
{
    public Guid PatientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string? Goals { get; set; }
    public DateTime StartDate { get; set; }
    public int DurationWeeks { get; set; }
    public List<TreatmentSession>? Sessions { get; set; }
    public List<Exercise>? Exercises { get; set; }
    public string? Notes { get; set; }
}

public class UpdateTreatmentPlanRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string? Goals { get; set; }
    public int DurationWeeks { get; set; }
    public TreatmentPlanStatus Status { get; set; }
    public List<TreatmentSession>? Sessions { get; set; }
    public List<Exercise>? Exercises { get; set; }
    public string? Notes { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ReviewDate { get; set; }
}
