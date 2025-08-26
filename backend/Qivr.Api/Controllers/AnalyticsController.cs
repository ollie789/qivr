using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using System.Security.Claims;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        QivrDbContext context,
        ILogger<AnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardAnalyticsDto>> GetDashboardAnalytics(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var tenantId = GetTenantId();
        fromDate ??= DateTime.UtcNow.AddMonths(-1);
        toDate ??= DateTime.UtcNow;

        var analytics = new DashboardAnalyticsDto
        {
            TotalPatients = await _context.Set<Core.Entities.User>()
                .Where(u => u.TenantId == tenantId && u.Role == "Patient")
                .CountAsync(),
            
            AppointmentsThisMonth = await _context.Set<Core.Entities.Appointment>()
                .Where(a => a.TenantId == tenantId 
                    && a.ScheduledStart >= fromDate 
                    && a.ScheduledStart <= toDate)
                .CountAsync(),
            
            CompletedEvaluations = await _context.Set<Core.Entities.Evaluation>()
                .Where(e => e.TenantId == tenantId 
                    && e.CreatedAt >= fromDate 
                    && e.CreatedAt <= toDate)
                .CountAsync(),
            
            AveragePatientSatisfaction = 4.7m, // Mock for now
            
            RevenueThisMonth = 125430m, // Mock for now
        };

        return Ok(analytics);
    }

    [HttpGet("prom-analytics")]
    public async Task<ActionResult<PromAnalyticsDto>> GetPromAnalytics(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] Guid? patientId)
    {
        var tenantId = GetTenantId();
        fromDate ??= DateTime.UtcNow.AddMonths(-3);
        toDate ??= DateTime.UtcNow;

        var query = _context.Set<Core.Entities.PromInstance>()
            .Where(p => p.TenantId == tenantId 
                && p.ScheduledFor >= fromDate 
                && p.ScheduledFor <= toDate);

        if (patientId.HasValue)
            query = query.Where(p => p.PatientId == patientId.Value);

        var instances = await query
            .Include(p => p.Template)
            .ToListAsync();

        var analytics = new PromAnalyticsDto
        {
            TotalCompleted = instances.Count(i => i.Status == Core.Entities.PromStatus.Completed),
            TotalPending = instances.Count(i => i.Status == Core.Entities.PromStatus.Pending),
            CompletionRate = instances.Any() 
                ? (decimal)instances.Count(i => i.Status == Core.Entities.PromStatus.Completed) / instances.Count * 100 
                : 0,
            
            AverageScore = instances
                .Where(i => i.Score.HasValue)
                .Select(i => i.Score!.Value)
                .DefaultIfEmpty(0)
                .Average(),
            
            CompletionByType = instances
                .GroupBy(i => i.Template?.Category ?? "Unknown")
                .Select(g => new CompletionByTypeDto
                {
                    Category = g.Key,
                    Completed = g.Count(i => i.Status == Core.Entities.PromStatus.Completed),
                    Pending = g.Count(i => i.Status == Core.Entities.PromStatus.Pending),
                    CompletionRate = g.Any() 
                        ? (decimal)g.Count(i => i.Status == Core.Entities.PromStatus.Completed) / g.Count() * 100 
                        : 0
                })
                .ToList()
        };

        return Ok(analytics);
    }

    [HttpGet("patient-trends")]
    [Authorize(Roles = "Patient,Clinician,Admin")]
    public async Task<ActionResult<PatientTrendsDto>> GetPatientTrends(
        [FromQuery] Guid? patientId,
        [FromQuery] int days = 30)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();
        
        // If user is a patient, they can only see their own data
        if (User.IsInRole("Patient"))
            patientId = userId;
        
        if (!patientId.HasValue)
            return BadRequest(new { message = "Patient ID is required" });

        var fromDate = DateTime.UtcNow.AddDays(-days);

        // Get PROM scores over time
        var promScores = await _context.Set<Core.Entities.PromInstance>()
            .Where(p => p.TenantId == tenantId 
                && p.PatientId == patientId.Value
                && p.Status == Core.Entities.PromStatus.Completed
                && p.CompletedAt >= fromDate)
            .OrderBy(p => p.CompletedAt)
            .Select(p => new ScoreTrendDto
            {
                Date = p.CompletedAt!.Value,
                Score = p.Score ?? 0,
                Category = p.Template!.Category
            })
            .ToListAsync();

        // Get evaluation data
        var evaluations = await _context.Set<Core.Entities.Evaluation>()
            .Where(e => e.TenantId == tenantId 
                && e.PatientId == patientId.Value
                && e.CreatedAt >= fromDate)
            .OrderBy(e => e.CreatedAt)
            .Select(e => new EvaluationTrendDto
            {
                Date = e.CreatedAt,
                PainLevel = e.PainLevel ?? 0,
                MobilityScore = e.MobilityScore ?? 0,
                QualityOfLife = e.QualityOfLifeScore ?? 0
            })
            .ToListAsync();

        var trends = new PatientTrendsDto
        {
            PatientId = patientId.Value,
            PromScores = promScores,
            EvaluationTrends = evaluations,
            
            // Calculate improvements
            PainImprovement = CalculateImprovement(evaluations.Select(e => e.PainLevel).ToList(), true),
            MobilityImprovement = CalculateImprovement(evaluations.Select(e => e.MobilityScore).ToList(), false),
            OverallImprovement = CalculateOverallImprovement(promScores)
        };

        return Ok(trends);
    }

    [HttpGet("appointment-trends")]
    [Authorize(Roles = "Admin,Clinician")]
    public async Task<ActionResult<AppointmentTrendsDto>> GetAppointmentTrends(
        [FromQuery] int days = 30)
    {
        var tenantId = GetTenantId();
        var fromDate = DateTime.UtcNow.AddDays(-days);

        var appointments = await _context.Set<Core.Entities.Appointment>()
            .Where(a => a.TenantId == tenantId && a.ScheduledStart >= fromDate)
            .GroupBy(a => a.ScheduledStart.Date)
            .Select(g => new DailyAppointmentDto
            {
                Date = g.Key,
                Total = g.Count(),
                Completed = g.Count(a => a.Status == "completed"),
                Cancelled = g.Count(a => a.Status == "cancelled"),
                NoShow = g.Count(a => a.Status == "no_show")
            })
            .OrderBy(d => d.Date)
            .ToListAsync();

        var trends = new AppointmentTrendsDto
        {
            DailyAppointments = appointments,
            TotalAppointments = appointments.Sum(a => a.Total),
            CompletionRate = appointments.Any() 
                ? (decimal)appointments.Sum(a => a.Completed) / appointments.Sum(a => a.Total) * 100 
                : 0,
            CancellationRate = appointments.Any() 
                ? (decimal)appointments.Sum(a => a.Cancelled) / appointments.Sum(a => a.Total) * 100 
                : 0
        };

        return Ok(trends);
    }

    private decimal CalculateImprovement(List<decimal> values, bool lowerIsBetter)
    {
        if (values.Count < 2) return 0;
        
        var first = values.Take(3).Average();
        var last = values.TakeLast(3).Average();
        
        var change = last - first;
        if (lowerIsBetter) change = -change;
        
        return first != 0 ? (change / Math.Abs(first)) * 100 : 0;
    }

    private decimal CalculateOverallImprovement(List<ScoreTrendDto> scores)
    {
        if (scores.Count < 2) return 0;
        
        var firstScores = scores.Take(3).Select(s => s.Score).DefaultIfEmpty(0).Average();
        var lastScores = scores.TakeLast(3).Select(s => s.Score).DefaultIfEmpty(0).Average();
        
        return firstScores != 0 ? ((lastScores - firstScores) / firstScores) * 100 : 0;
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
public class DashboardAnalyticsDto
{
    public int TotalPatients { get; set; }
    public int AppointmentsThisMonth { get; set; }
    public int CompletedEvaluations { get; set; }
    public decimal AveragePatientSatisfaction { get; set; }
    public decimal RevenueThisMonth { get; set; }
}

public class PromAnalyticsDto
{
    public int TotalCompleted { get; set; }
    public int TotalPending { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal AverageScore { get; set; }
    public List<CompletionByTypeDto> CompletionByType { get; set; } = new();
}

public class CompletionByTypeDto
{
    public string Category { get; set; } = string.Empty;
    public int Completed { get; set; }
    public int Pending { get; set; }
    public decimal CompletionRate { get; set; }
}

public class PatientTrendsDto
{
    public Guid PatientId { get; set; }
    public List<ScoreTrendDto> PromScores { get; set; } = new();
    public List<EvaluationTrendDto> EvaluationTrends { get; set; } = new();
    public decimal PainImprovement { get; set; }
    public decimal MobilityImprovement { get; set; }
    public decimal OverallImprovement { get; set; }
}

public class ScoreTrendDto
{
    public DateTime Date { get; set; }
    public decimal Score { get; set; }
    public string Category { get; set; } = string.Empty;
}

public class EvaluationTrendDto
{
    public DateTime Date { get; set; }
    public decimal PainLevel { get; set; }
    public decimal MobilityScore { get; set; }
    public decimal QualityOfLife { get; set; }
}

public class AppointmentTrendsDto
{
    public List<DailyAppointmentDto> DailyAppointments { get; set; } = new();
    public int TotalAppointments { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal CancellationRate { get; set; }
}

public class DailyAppointmentDto
{
    public DateTime Date { get; set; }
    public int Total { get; set; }
    public int Completed { get; set; }
    public int Cancelled { get; set; }
    public int NoShow { get; set; }
}
