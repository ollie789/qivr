using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IClinicAnalyticsService
{
    Task<DashboardMetrics> GetDashboardMetricsAsync(Guid tenantId, DateTime date, CancellationToken cancellationToken = default);
    Task<ClinicalAnalytics> GetClinicalAnalyticsAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken cancellationToken = default);
    Task<PainMapAnalytics> GetPainMapAnalyticsAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken cancellationToken = default);
}

public class ClinicAnalyticsService : IClinicAnalyticsService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<ClinicAnalyticsService> _logger;

    public ClinicAnalyticsService(QivrDbContext context, ILogger<ClinicAnalyticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DashboardMetrics> GetDashboardMetricsAsync(Guid tenantId, DateTime date, CancellationToken cancellationToken = default)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        var startOfWeek = startOfDay.AddDays(-(int)startOfDay.DayOfWeek);
        var startOfMonth = new DateTime(date.Year, date.Month, 1);

        // Today's appointments
        var todayAppointments = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.ScheduledStart >= startOfDay && a.ScheduledStart < endOfDay)
            .ToListAsync(cancellationToken);

        // This week's data
        var weekAppointments = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.ScheduledStart >= startOfWeek && a.ScheduledStart < endOfDay)
            .ToListAsync(cancellationToken);

        // Patient counts
        var totalPatients = await _context.Users
            .Where(u => u.TenantId == tenantId && u.UserType == UserType.Patient)
            .CountAsync(cancellationToken);

        var newPatientsThisMonth = await _context.Users
            .Where(u => u.TenantId == tenantId && u.UserType == UserType.Patient && u.CreatedAt >= startOfMonth)
            .CountAsync(cancellationToken);

        // Pending intakes
        var pendingIntakes = await _context.Evaluations
            .Where(e => e.TenantId == tenantId && e.Status == EvaluationStatus.Pending)
            .CountAsync(cancellationToken);

        // Calculate metrics
        var completedToday = todayAppointments.Count(a => a.Status == AppointmentStatus.Completed);
        var cancelledToday = todayAppointments.Count(a => a.Status == AppointmentStatus.Cancelled);
        var noShowToday = todayAppointments.Count(a => a.Status == AppointmentStatus.NoShow);

        var completionRate = todayAppointments.Count() > 0 
            ? (double)completedToday / todayAppointments.Count() * 100 
            : 0;

        var noShowRate = weekAppointments.Count() > 0
            ? (double)weekAppointments.Count(a => a.Status == AppointmentStatus.NoShow) / weekAppointments.Count() * 100
            : 0;

        // Calculate average wait time (ActualStart - ScheduledStart for completed appointments)
        var appointmentsWithWaitTime = todayAppointments
            .Where(a => a.ActualStart.HasValue && a.Status == AppointmentStatus.Completed)
            .ToList();
        
        var avgWaitTime = appointmentsWithWaitTime.Any()
            ? (int)appointmentsWithWaitTime.Average(a => (a.ActualStart!.Value - a.ScheduledStart).TotalMinutes)
            : 0;

        // Calculate staff utilization (appointments completed vs available slots)
        var providers = await _context.Users
            .Where(u => u.TenantId == tenantId && u.UserType == UserType.Staff)
            .CountAsync(cancellationToken);

        // Assume 8-hour workday, 30-min appointments = 16 slots per provider per day
        var totalAvailableSlots = providers * 16;
        var staffUtilization = totalAvailableSlots > 0
            ? (double)todayAppointments.Count() / totalAvailableSlots * 100
            : 0;

        // Revenue (if you have pricing data)
        var todayRevenue = completedToday * 150; // Placeholder - replace with actual pricing

        return new DashboardMetrics
        {
            TodayAppointments = todayAppointments.Count(),
            CompletedToday = completedToday,
            CancelledToday = cancelledToday,
            NoShowToday = noShowToday,
            CompletionRate = Math.Round(completionRate, 1),
            PendingIntakes = pendingIntakes,
            TotalPatients = totalPatients,
            NewPatientsThisMonth = newPatientsThisMonth,
            EstimatedRevenue = todayRevenue,
            NoShowRate = Math.Round(noShowRate, 1),
            AverageWaitTime = avgWaitTime,
            StaffUtilization = (int)Math.Round(staffUtilization),
        };
    }

    public async Task<ClinicalAnalytics> GetClinicalAnalyticsAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken cancellationToken = default)
    {
        // PROM scores
        var promResponses = await _context.PromResponses
            .Where(p => p.TenantId == tenantId && p.CompletedAt >= from && p.CompletedAt <= to)
            .ToListAsync(cancellationToken);

        var avgPromScore = promResponses.Any() ? (double)promResponses.Average(p => p.Score) : 0;

        // Evaluations by condition
        var evaluations = await _context.Evaluations
            .Where(e => e.TenantId == tenantId && e.CreatedAt >= from && e.CreatedAt <= to)
            .GroupBy(e => e.ChiefComplaint)
            .Select(g => new ConditionCount { Condition = g.Key ?? "Unknown", Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .Take(10)
            .ToListAsync(cancellationToken);

        // Pain intensity trends
        var painMaps = await _context.PainMaps
            .Include(pm => pm.Evaluation)
            .Where(pm => pm.TenantId == tenantId && pm.CreatedAt >= from && pm.CreatedAt <= to)
            .ToListAsync(cancellationToken);

        var avgPainIntensity = painMaps.Any() ? painMaps.Average(pm => pm.PainIntensity) : 0;

        // Body region distribution
        var bodyRegions = painMaps
            .GroupBy(pm => pm.BodyRegion)
            .Select(g => new BodyRegionCount { Region = g.Key, Count = g.Count(), AvgIntensity = g.Average(pm => pm.PainIntensity) })
            .OrderByDescending(b => b.Count)
            .Take(10)
            .ToList();

        // Treatment outcomes (patients with multiple PROMs showing improvement)
        var patientOutcomes = await _context.PromResponses
            .Where(p => p.TenantId == tenantId && p.CompletedAt >= from && p.CompletedAt <= to)
            .GroupBy(p => p.PatientId)
            .Where(g => g.Count() >= 2)
            .Select(g => new
            {
                PatientId = g.Key,
                FirstScore = g.OrderBy(p => p.CompletedAt).First().Score,
                LastScore = g.OrderByDescending(p => p.CompletedAt).First().Score
            })
            .ToListAsync(cancellationToken);

        var improvedCount = patientOutcomes.Count(o => o.LastScore > o.FirstScore);
        var improvementRate = patientOutcomes.Any() ? (double)improvedCount / patientOutcomes.Count * 100 : 0;

        // Appointment trends (last 7 days)
        var appointmentTrendsRaw = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.ScheduledStart >= from && a.ScheduledStart <= to)
            .GroupBy(a => a.ScheduledStart.Date)
            .Select(g => new 
            {
                Date = g.Key,
                Scheduled = g.Count(),
                Completed = g.Count(a => a.Status == AppointmentStatus.Completed),
                Cancelled = g.Count(a => a.Status == AppointmentStatus.Cancelled)
            })
            .OrderBy(t => t.Date)
            .ToListAsync(cancellationToken);

        var appointmentTrends = appointmentTrendsRaw.Select(t => new AppointmentTrend
        {
            Date = t.Date.ToString("yyyy-MM-dd"),
            Scheduled = t.Scheduled,
            Completed = t.Completed,
            Cancelled = t.Cancelled
        }).ToList();

        // PROM completion data (weekly) - simplified grouping
        var promsByWeek = await _context.PromInstances
            .Where(p => p.TenantId == tenantId && p.CreatedAt >= from && p.CreatedAt <= to)
            .ToListAsync(cancellationToken);

        var promCompletion = promsByWeek
            .GroupBy(p => (p.CreatedAt - from).Days / 7)
            .Select(g => new PromCompletion
            {
                Week = $"Week {g.Key + 1}",
                Completed = g.Count(p => p.Status == PromStatus.Completed),
                Pending = g.Count(p => p.Status == PromStatus.Pending || p.Status == PromStatus.InProgress),
                CompletionRate = g.Any() ? Math.Round((double)g.Count(p => p.Status == PromStatus.Completed) / g.Count() * 100, 1) : 0
            })
            .OrderBy(p => p.Week)
            .ToList();

        // Patient satisfaction (from completed PROMs with satisfaction questions)
        var satisfactionScores = await _context.PromResponses
            .Where(p => p.TenantId == tenantId && p.CompletedAt >= from && p.CompletedAt <= to && p.Score > 0)
            .Select(p => p.Score)
            .ToListAsync(cancellationToken);
        
        var avgSatisfaction = satisfactionScores.Any() ? (double)satisfactionScores.Average() / 20.0 : 4.5; // Normalize to 5-star scale

        return new ClinicalAnalytics
        {
            AveragePromScore = Math.Round(avgPromScore, 1),
            TotalEvaluations = evaluations.Sum(e => e.Count),
            TopConditions = evaluations,
            AveragePainIntensity = Math.Round(avgPainIntensity, 1),
            BodyRegionDistribution = bodyRegions,
            PatientImprovementRate = Math.Round(improvementRate, 1),
            TotalPatientsTracked = patientOutcomes.Count,
            AppointmentTrends = appointmentTrends,
            PromCompletionData = promCompletion,
            PatientSatisfaction = Math.Round(avgSatisfaction, 1)
        };
    }

    public async Task<PainMapAnalytics> GetPainMapAnalyticsAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken cancellationToken = default)
    {
        var painMaps = await _context.PainMaps
            .Where(pm => pm.TenantId == tenantId && pm.CreatedAt >= from && pm.CreatedAt <= to)
            .ToListAsync(cancellationToken);

        // 3D coordinates for heatmap
        var painPoints = painMaps.Select(pm => new PainPoint3D
        {
            X = pm.Coordinates.X,
            Y = pm.Coordinates.Y,
            Z = pm.Coordinates.Z,
            Intensity = pm.PainIntensity,
            BodyRegion = pm.BodyRegion,
            PainType = pm.PainType ?? "Unknown"
        }).ToList();

        // Pain type distribution
        var painTypes = painMaps
            .GroupBy(pm => pm.PainType ?? "Unknown")
            .Select(g => new PainTypeCount { Type = g.Key, Count = g.Count() })
            .OrderByDescending(p => p.Count)
            .ToList();

        // Intensity distribution
        var intensityDistribution = painMaps
            .GroupBy(pm => pm.PainIntensity / 2 * 2) // Group by 2s (0-2, 2-4, etc)
            .Select(g => new IntensityRange { Range = $"{g.Key}-{g.Key + 2}", Count = g.Count() })
            .OrderBy(i => i.Range)
            .ToList();

        return new PainMapAnalytics
        {
            TotalPainMaps = painMaps.Count,
            PainPoints3D = painPoints,
            PainTypeDistribution = painTypes,
            IntensityDistribution = intensityDistribution,
            AverageIntensity = painMaps.Any() ? Math.Round(painMaps.Average(pm => pm.PainIntensity), 1) : 0,
            MostCommonRegion = painMaps.GroupBy(pm => pm.BodyRegion).OrderByDescending(g => g.Count()).FirstOrDefault()?.Key ?? "None"
        };
    }
}

// DTOs
public record DashboardMetrics
{
    public int TodayAppointments { get; init; }
    public int CompletedToday { get; init; }
    public int CancelledToday { get; init; }
    public int NoShowToday { get; init; }
    public double CompletionRate { get; init; }
    public int PendingIntakes { get; init; }
    public int TotalPatients { get; init; }
    public int NewPatientsThisMonth { get; init; }
    public int EstimatedRevenue { get; init; }
    public double NoShowRate { get; init; }
    public int AverageWaitTime { get; init; }
    public int StaffUtilization { get; init; }
}

public record ClinicalAnalytics
{
    public double AveragePromScore { get; init; }
    public int TotalEvaluations { get; init; }
    public List<ConditionCount> TopConditions { get; init; } = new();
    public double AveragePainIntensity { get; init; }
    public List<BodyRegionCount> BodyRegionDistribution { get; init; } = new();
    public double PatientImprovementRate { get; init; }
    public int TotalPatientsTracked { get; init; }
    public List<AppointmentTrend> AppointmentTrends { get; init; } = new();
    public List<PromCompletion> PromCompletionData { get; init; } = new();
    public double PatientSatisfaction { get; init; }
}

public record PainMapAnalytics
{
    public int TotalPainMaps { get; init; }
    public List<PainPoint3D> PainPoints3D { get; init; } = new();
    public List<PainTypeCount> PainTypeDistribution { get; init; } = new();
    public List<IntensityRange> IntensityDistribution { get; init; } = new();
    public double AverageIntensity { get; init; }
    public string MostCommonRegion { get; init; } = "";
}

public record ConditionCount
{
    public string Condition { get; init; } = "";
    public int Count { get; init; }
}

public record BodyRegionCount
{
    public string Region { get; init; } = "";
    public int Count { get; init; }
    public double AvgIntensity { get; init; }
}

public record PainPoint3D
{
    public float X { get; init; }
    public float Y { get; init; }
    public float Z { get; init; }
    public int Intensity { get; init; }
    public string BodyRegion { get; init; } = "";
    public string PainType { get; init; } = "";
}

public record PainTypeCount
{
    public string Type { get; init; } = "";
    public int Count { get; init; }
}

public record IntensityRange
{
    public string Range { get; init; } = "";
    public int Count { get; init; }
}

public record AppointmentTrend
{
    public string Date { get; init; } = "";
    public int Scheduled { get; init; }
    public int Completed { get; init; }
    public int Cancelled { get; init; }
}

public record PromCompletion
{
    public string Week { get; init; } = "";
    public int Completed { get; init; }
    public int Pending { get; init; }
    public double CompletionRate { get; init; }
}
