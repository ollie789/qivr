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
public class PromsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<PromsController> _logger;

    public PromsController(
        QivrDbContext context,
        ILogger<PromsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("templates")]
    public async Task<ActionResult<IEnumerable<PromTemplateDto>>> GetTemplates()
    {
        var tenantId = GetTenantId();

        var templates = await _context.Set<PromTemplate>()
            .Where(t => t.TenantId == tenantId && t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new PromTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Category = t.Category,
                Frequency = t.Frequency,
                Questions = t.Questions,
                ScoringMethod = t.ScoringMethod,
                IsActive = t.IsActive
            })
            .ToListAsync();

        return Ok(templates);
    }

    [HttpGet("templates/{id}")]
    public async Task<ActionResult<PromTemplateDto>> GetTemplate(Guid id)
    {
        var tenantId = GetTenantId();

        var template = await _context.Set<PromTemplate>()
            .Where(t => t.TenantId == tenantId && t.Id == id)
            .Select(t => new PromTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Category = t.Category,
                Frequency = t.Frequency,
                Questions = t.Questions,
                ScoringMethod = t.ScoringMethod,
                IsActive = t.IsActive
            })
            .FirstOrDefaultAsync();

        if (template == null)
            return NotFound();

        return Ok(template);
    }

    [HttpPost("templates")]
    [Authorize(Roles = "Admin,Clinician")]
    public async Task<ActionResult<PromTemplateDto>> CreateTemplate(CreatePromTemplateRequest request)
    {
        var tenantId = GetTenantId();

        var template = new PromTemplate
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            Category = request.Category,
            Frequency = request.Frequency,
            Questions = request.Questions,
            ScoringMethod = request.ScoringMethod,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<PromTemplate>().Add(template);
        await _context.SaveChangesAsync();

        _logger.LogInformation("PROM template created: {TemplateId}", template.Id);

        return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, new PromTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Category = template.Category,
            Frequency = template.Frequency,
            Questions = template.Questions,
            ScoringMethod = template.ScoringMethod,
            IsActive = template.IsActive
        });
    }

    [HttpGet("instances")]
    public async Task<ActionResult<IEnumerable<PromInstanceDto>>> GetInstances(
        [FromQuery] PromStatus? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var query = _context.Set<PromInstance>()
            .Include(i => i.Template)
            .Where(i => i.TenantId == tenantId);

        // Filter by user role
        if (User.IsInRole("Patient"))
        {
            query = query.Where(i => i.PatientId == userId);
        }

        if (status.HasValue)
            query = query.Where(i => i.Status == status.Value);

        if (fromDate.HasValue)
            query = query.Where(i => i.ScheduledFor >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(i => i.ScheduledFor <= toDate.Value);

        var instances = await query
            .OrderByDescending(i => i.ScheduledFor)
            .Select(i => new PromInstanceDto
            {
                Id = i.Id,
                TemplateId = i.TemplateId,
                TemplateName = i.Template!.Name,
                PatientId = i.PatientId,
                Status = i.Status,
                ScheduledFor = i.ScheduledFor,
                CompletedAt = i.CompletedAt,
                DueDate = i.DueDate,
                Responses = i.Responses,
                Score = i.Score,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();

        return Ok(instances);
    }

    [HttpGet("instances/{id}")]
    public async Task<ActionResult<PromInstanceDto>> GetInstance(Guid id)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var instance = await _context.Set<PromInstance>()
            .Include(i => i.Template)
            .Where(i => i.TenantId == tenantId && i.Id == id)
            .FirstOrDefaultAsync();

        if (instance == null)
            return NotFound();

        // Check access permissions
        if (User.IsInRole("Patient") && instance.PatientId != userId)
            return Forbid();

        return Ok(new PromInstanceDto
        {
            Id = instance.Id,
            TemplateId = instance.TemplateId,
            TemplateName = instance.Template?.Name,
            PatientId = instance.PatientId,
            Status = instance.Status,
            ScheduledFor = instance.ScheduledFor,
            CompletedAt = instance.CompletedAt,
            DueDate = instance.DueDate,
            Responses = instance.Responses,
            Score = instance.Score,
            CreatedAt = instance.CreatedAt,
            UpdatedAt = instance.UpdatedAt
        });
    }

    [HttpPost("instances")]
    public async Task<ActionResult<PromInstanceDto>> CreateInstance(CreatePromInstanceRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        // Verify template exists
        var template = await _context.Set<PromTemplate>()
            .Where(t => t.TenantId == tenantId && t.Id == request.TemplateId)
            .FirstOrDefaultAsync();

        if (template == null)
            return BadRequest(new { message = "Template not found" });

        var instance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TemplateId = request.TemplateId,
            PatientId = User.IsInRole("Patient") ? userId : request.PatientId,
            Status = PromStatus.Pending,
            ScheduledFor = request.ScheduledFor,
            DueDate = request.DueDate ?? request.ScheduledFor.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<PromInstance>().Add(instance);
        await _context.SaveChangesAsync();

        _logger.LogInformation("PROM instance created: {InstanceId}", instance.Id);

        return CreatedAtAction(nameof(GetInstance), new { id = instance.Id }, new PromInstanceDto
        {
            Id = instance.Id,
            TemplateId = instance.TemplateId,
            TemplateName = template.Name,
            PatientId = instance.PatientId,
            Status = instance.Status,
            ScheduledFor = instance.ScheduledFor,
            DueDate = instance.DueDate,
            CreatedAt = instance.CreatedAt
        });
    }

    [HttpPut("instances/{id}/submit")]
    public async Task<IActionResult> SubmitResponses(Guid id, [FromBody] SubmitPromResponsesRequest request)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var instance = await _context.Set<PromInstance>()
            .Include(i => i.Template)
            .Where(i => i.TenantId == tenantId && i.Id == id)
            .FirstOrDefaultAsync();

        if (instance == null)
            return NotFound();

        // Check permissions
        if (User.IsInRole("Patient") && instance.PatientId != userId)
            return Forbid();

        if (instance.Status == PromStatus.Completed)
            return BadRequest(new { message = "PROM has already been completed" });

        // Calculate score based on template scoring method
        var score = CalculateScore(instance.Template!, request.Responses);

        instance.Responses = request.Responses;
        instance.Score = score;
        instance.Status = PromStatus.Completed;
        instance.CompletedAt = DateTime.UtcNow;
        instance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("PROM instance completed: {InstanceId}, Score: {Score}", instance.Id, score);

        return Ok(new { score, message = "Responses submitted successfully" });
    }

    [HttpGet("instances/{id}/reminder")]
    [Authorize(Roles = "Admin,Clinician")]
    public async Task<IActionResult> SendReminder(Guid id)
    {
        var tenantId = GetTenantId();

        var instance = await _context.Set<PromInstance>()
            .Include(i => i.Patient)
            .Where(i => i.TenantId == tenantId && i.Id == id)
            .FirstOrDefaultAsync();

        if (instance == null)
            return NotFound();

        if (instance.Status != PromStatus.Pending)
            return BadRequest(new { message = "Can only send reminders for pending PROMs" });

        // TODO: Integrate with notification service to send reminder
        instance.ReminderSentAt = DateTime.UtcNow;
        instance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("PROM reminder sent: {InstanceId}", instance.Id);

        return Ok(new { message = "Reminder sent successfully" });
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin,Clinician")]
    public async Task<ActionResult<PromAnalyticsResult>> GetAnalytics(
        [FromQuery] Guid? patientId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        var tenantId = GetTenantId();

        var query = _context.Set<PromInstance>()
            .Where(i => i.TenantId == tenantId 
                && i.Status == PromStatus.Completed
                && i.CompletedAt >= fromDate 
                && i.CompletedAt <= toDate);

        if (patientId.HasValue)
            query = query.Where(i => i.PatientId == patientId.Value);

        var instances = await query
            .Include(i => i.Template)
            .ToListAsync();

        var analytics = new PromAnalyticsResult
        {
            TotalCompleted = instances.Count,
            AverageScore = instances.Any() ? instances.Average(i => i.Score ?? 0) : 0,
            CompletionRate = await CalculateCompletionRate(tenantId, patientId, fromDate, toDate),
            ScoresByCategory = instances
                .GroupBy(i => i.Template?.Category ?? "Unknown")
                .Select(g => new PromCategoryScore
                {
                    Category = g.Key,
                    AverageScore = g.Average(i => i.Score ?? 0),
                    Count = g.Count()
                })
                .ToList(),
            TrendData = instances
                .GroupBy(i => i.CompletedAt!.Value.Date)
                .Select(g => new PromTrendPoint
                {
                    Date = g.Key,
                    AverageScore = g.Average(i => i.Score ?? 0),
                    Count = g.Count()
                })
                .OrderBy(t => t.Date)
                .ToList()
        };

        return Ok(analytics);
    }

    private decimal CalculateScore(PromTemplate template, Dictionary<string, object> responses)
    {
        // Simple scoring implementation - can be enhanced based on template scoring method
        if (template.ScoringMethod?.ContainsKey("type") == true)
        {
            var scoringType = template.ScoringMethod["type"].ToString();
            
            switch (scoringType)
            {
                case "sum":
                    return responses.Values
                        .Where(v => decimal.TryParse(v?.ToString(), out _))
                        .Sum(v => decimal.Parse(v.ToString()!));
                
                case "average":
                    var numericValues = responses.Values
                        .Where(v => decimal.TryParse(v?.ToString(), out _))
                        .Select(v => decimal.Parse(v.ToString()!))
                        .ToList();
                    return numericValues.Any() ? numericValues.Average() : 0;
                
                case "percentage":
                    var maxScore = template.Questions.Count * 10; // Assuming max 10 per question
                    var totalScore = responses.Values
                        .Where(v => decimal.TryParse(v?.ToString(), out _))
                        .Sum(v => decimal.Parse(v.ToString()!));
                    return (totalScore / maxScore) * 100;
                
                default:
                    return 0;
            }
        }

        return 0;
    }

    private async Task<decimal> CalculateCompletionRate(Guid tenantId, Guid? patientId, DateTime fromDate, DateTime toDate)
    {
        var query = _context.Set<PromInstance>()
            .Where(i => i.TenantId == tenantId 
                && i.ScheduledFor >= fromDate 
                && i.ScheduledFor <= toDate);

        if (patientId.HasValue)
            query = query.Where(i => i.PatientId == patientId.Value);

        var total = await query.CountAsync();
        if (total == 0) return 100;

        var completed = await query.Where(i => i.Status == PromStatus.Completed).CountAsync();
        return (decimal)completed / total * 100;
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
public class PromTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public List<Dictionary<string, object>> Questions { get; set; } = new();
    public Dictionary<string, object>? ScoringMethod { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePromTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public List<Dictionary<string, object>> Questions { get; set; } = new();
    public Dictionary<string, object> ScoringMethod { get; set; } = new();
}

public class PromInstanceDto
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public Guid PatientId { get; set; }
    public PromStatus Status { get; set; }
    public DateTime ScheduledFor { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime DueDate { get; set; }
    public Dictionary<string, object>? Responses { get; set; }
    public decimal? Score { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreatePromInstanceRequest
{
    public Guid TemplateId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime ScheduledFor { get; set; }
    public DateTime? DueDate { get; set; }
}

public class SubmitPromResponsesRequest
{
    public Dictionary<string, object> Responses { get; set; } = new();
}

// Renamed to avoid conflicts with AnalyticsController
public class PromAnalyticsResult
{
    public int TotalCompleted { get; set; }
    public decimal AverageScore { get; set; }
    public decimal CompletionRate { get; set; }
    public List<PromCategoryScore> ScoresByCategory { get; set; } = new();
    public List<PromTrendPoint> TrendData { get; set; } = new();
}

public class PromCategoryScore
{
    public string Category { get; set; } = string.Empty;
    public decimal AverageScore { get; set; }
    public int Count { get; set; }
}

public class PromTrendPoint
{
    public DateTime Date { get; set; }
    public decimal AverageScore { get; set; }
    public int Count { get; set; }
}
