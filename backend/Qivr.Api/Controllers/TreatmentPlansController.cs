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

    [HttpGet("current")]
    [AllowAnonymous]
    [Authorize]
    public async Task<IActionResult> GetCurrent()
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var plan = await _context.TreatmentPlans
            .Include(t => t.Provider)
            .Where(t => t.TenantId == tenantId && t.PatientId == userId && !t.IsDeleted)
            .Where(t => t.Status == TreatmentPlanStatus.Active)
            .OrderByDescending(t => t.StartDate)
            .FirstOrDefaultAsync();

        if (plan == null)
            return NotFound(new { message = "No active treatment plan found" });

        return Ok(plan);
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
            Title = request.Title ?? "Treatment Plan",
            Diagnosis = request.Diagnosis,
            Goals = request.Goals ?? string.Join(", ", request.GoalsList ?? new List<string>()),
            StartDate = request.StartDate != default ? request.StartDate : DateTime.UtcNow,
            DurationWeeks = request.DurationWeeks > 0 ? request.DurationWeeks : ParseDurationWeeks(request.Duration),
            Status = TreatmentPlanStatus.Active,
            Sessions = request.Sessions ?? new(),
            Exercises = request.Exercises ?? new(),
            Notes = BuildNotes(request)
        };

        _context.TreatmentPlans.Add(plan);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = plan.Id }, plan);
    }

    private int ParseDurationWeeks(string? duration)
    {
        if (string.IsNullOrEmpty(duration)) return 6;
        
        var lower = duration.ToLower();
        if (lower.Contains("week"))
        {
            var parts = lower.Split(' ');
            if (parts.Length > 0 && int.TryParse(parts[0], out int weeks))
                return weeks;
        }
        return 6;
    }

    private string BuildNotes(CreateTreatmentPlanRequest request)
    {
        var notes = new List<string>();
        
        if (!string.IsNullOrEmpty(request.Frequency))
            notes.Add($"Frequency: {request.Frequency}");
        
        if (request.SessionLength > 0)
            notes.Add($"Session Length: {request.SessionLength} minutes");
        
        if (request.Modalities?.Any() == true)
            notes.Add($"Modalities: {string.Join(", ", request.Modalities)}");
        
        if (!string.IsNullOrEmpty(request.HomeExercises))
            notes.Add($"Home Exercises: {request.HomeExercises}");
        
        if (!string.IsNullOrEmpty(request.ExpectedOutcomes))
            notes.Add($"Expected Outcomes: {request.ExpectedOutcomes}");
        
        if (!string.IsNullOrEmpty(request.PromSchedule))
            notes.Add($"PROM Schedule: {request.PromSchedule}");
        
        if (request.ReviewMilestones?.Any() == true)
            notes.Add($"Review Milestones: {string.Join(", ", request.ReviewMilestones)}");
        
        if (!string.IsNullOrEmpty(request.Notes))
            notes.Add(request.Notes);
        
        return string.Join("\n\n", notes);
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
    public string? Title { get; set; }
    public string? Diagnosis { get; set; }
    public string? Goals { get; set; }
    public List<string>? GoalsList { get; set; }
    public DateTime StartDate { get; set; }
    public int DurationWeeks { get; set; }
    public string? Duration { get; set; }
    public string? Frequency { get; set; }
    public int SessionLength { get; set; }
    public List<string>? Modalities { get; set; }
    public string? HomeExercises { get; set; }
    public string? ExpectedOutcomes { get; set; }
    public string? PromSchedule { get; set; }
    public List<string>? ReviewMilestones { get; set; }
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
