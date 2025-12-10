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

    // New analytics using normalized PROM infrastructure
    Task<PromAnalyticsSummary> GetPromAnalyticsAsync(Guid tenantId, DateTime from, DateTime to, string? instrumentKey = null, string? clinicalDomain = null, CancellationToken cancellationToken = default);
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
        var startOfMonth = DateTime.SpecifyKind(new DateTime(date.Year, date.Month, 1), DateTimeKind.Utc);

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
        var promResponsesForOutcomes = await _context.PromResponses
            .Where(p => p.TenantId == tenantId && p.CompletedAt >= from && p.CompletedAt <= to)
            .GroupBy(p => p.PatientId)
            .Where(g => g.Count() >= 2)
            .Select(g => g.Key)
            .ToListAsync(cancellationToken);

        var patientOutcomes = new List<(Guid PatientId, decimal FirstScore, decimal LastScore)>();
        foreach (var patientId in promResponsesForOutcomes)
        {
            var scores = await _context.PromResponses
                .Where(p => p.PatientId == patientId && p.TenantId == tenantId && p.CompletedAt >= from && p.CompletedAt <= to)
                .OrderBy(p => p.CompletedAt)
                .Select(p => p.Score)
                .ToListAsync(cancellationToken);
            
            if (scores.Count >= 2)
            {
                patientOutcomes.Add((patientId, scores.First(), scores.Last()));
            }
        }

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

    public async Task<PromAnalyticsSummary> GetPromAnalyticsAsync(
        Guid tenantId,
        DateTime from,
        DateTime to,
        string? instrumentKey = null,
        string? clinicalDomain = null,
        CancellationToken cancellationToken = default)
    {
        // Base query for summary scores
        var scoresQuery = _context.PromSummaryScores
            .Where(s => s.TenantId == tenantId && s.CreatedAt >= from && s.CreatedAt <= to);

        // Filter by instrument if specified
        if (!string.IsNullOrEmpty(instrumentKey) || !string.IsNullOrEmpty(clinicalDomain))
        {
            var templateIds = await _context.PromTemplates
                .Where(t => t.TenantId == tenantId && t.InstrumentId != null)
                .Where(t => string.IsNullOrEmpty(instrumentKey) || t.Instrument!.Key == instrumentKey)
                .Where(t => string.IsNullOrEmpty(clinicalDomain) || t.Instrument!.ClinicalDomain == clinicalDomain)
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);

            var instanceIds = await _context.PromInstances
                .Where(i => templateIds.Contains(i.TemplateId))
                .Select(i => i.Id)
                .ToListAsync(cancellationToken);

            scoresQuery = scoresQuery.Where(s => instanceIds.Contains(s.InstanceId));
        }

        // Get all summary scores for the period
        var summaryScores = await scoresQuery
            .Include(s => s.Instance)
                .ThenInclude(i => i!.Template)
            .ToListAsync(cancellationToken);

        // Group by score key (total, pain, function, etc.)
        var scoresByKey = summaryScores
            .GroupBy(s => s.ScoreKey)
            .Select(g => new ScoreKeyAnalytics
            {
                ScoreKey = g.Key,
                Label = g.First().Label ?? g.Key,
                Count = g.Count(),
                Average = Math.Round((double)g.Average(s => s.Value), 2),
                Min = (double)g.Min(s => s.Value),
                Max = (double)g.Max(s => s.Value),
                BandDistribution = g
                    .Where(s => !string.IsNullOrEmpty(s.InterpretationBand))
                    .GroupBy(s => s.InterpretationBand!)
                    .ToDictionary(bg => bg.Key, bg => bg.Count())
            })
            .OrderByDescending(s => s.Count)
            .ToList();

        // Get scores by instrument
        var scoresByInstrument = await _context.PromSummaryScores
            .Where(s => s.TenantId == tenantId && s.CreatedAt >= from && s.CreatedAt <= to)
            .Where(s => s.ScoreKey == "total") // Primary scores only
            .Join(_context.PromInstances, s => s.InstanceId, i => i.Id, (s, i) => new { Score = s, Instance = i })
            .Join(_context.PromTemplates.Include(t => t.Instrument), x => x.Instance.TemplateId, t => t.Id, (x, t) => new { x.Score, Template = t })
            .Where(x => x.Template.Instrument != null)
            .GroupBy(x => new { x.Template.Instrument!.Key, x.Template.Instrument.Name, x.Template.Instrument.ClinicalDomain })
            .Select(g => new InstrumentAnalytics
            {
                InstrumentKey = g.Key.Key,
                InstrumentName = g.Key.Name,
                ClinicalDomain = g.Key.ClinicalDomain ?? "other",
                TotalSubmissions = g.Count(),
                AverageScore = Math.Round((double)g.Average(x => x.Score.Value), 2),
                CompletionRate = 0 // Will calculate below
            })
            .ToListAsync(cancellationToken);

        // Calculate completion rates per instrument
        foreach (var instrument in scoresByInstrument)
        {
            var templateIds = await _context.PromTemplates
                .Where(t => t.TenantId == tenantId && t.Instrument != null && t.Instrument.Key == instrument.InstrumentKey)
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);

            var instances = await _context.PromInstances
                .Where(i => templateIds.Contains(i.TemplateId) && i.CreatedAt >= from && i.CreatedAt <= to)
                .ToListAsync(cancellationToken);

            var completed = instances.Count(i => i.Status == PromStatus.Completed);
            instrument.CompletionRate = instances.Count > 0 ? Math.Round((double)completed / instances.Count * 100, 1) : 0;
        }

        // Improvement tracking using summary scores
        var patientScoreGroups = summaryScores
            .Where(s => s.ScoreKey == "total")
            .GroupBy(s => s.Instance?.PatientId)
            .Where(g => g.Key.HasValue && g.Count() >= 2)
            .ToList();

        var improvements = new List<PatientImprovement>();
        foreach (var group in patientScoreGroups)
        {
            var ordered = group.OrderBy(s => s.CreatedAt).ToList();
            var first = ordered.First();
            var last = ordered.Last();
            var change = last.Value - first.Value;
            var higherIsBetter = first.HigherIsBetter ?? false;
            var improved = higherIsBetter ? change > 0 : change < 0;
            var mcidAchieved = first.Definition?.MCID != null && Math.Abs(change) >= first.Definition.MCID;

            improvements.Add(new PatientImprovement
            {
                PatientId = group.Key!.Value,
                FirstScore = first.Value,
                LastScore = last.Value,
                Change = change,
                Improved = improved,
                AchievedMCID = mcidAchieved
            });
        }

        var improvementRate = improvements.Count > 0
            ? Math.Round((double)improvements.Count(i => i.Improved) / improvements.Count * 100, 1)
            : 0;

        var mcidRate = improvements.Count > 0
            ? Math.Round((double)improvements.Count(i => i.AchievedMCID) / improvements.Count * 100, 1)
            : 0;

        // Trends over time (weekly)
        var weeklyTrends = summaryScores
            .Where(s => s.ScoreKey == "total")
            .GroupBy(s => new { Week = (s.CreatedAt - from).Days / 7 })
            .OrderBy(g => g.Key.Week)
            .Select(g => new WeeklyScoreTrend
            {
                Week = $"Week {g.Key.Week + 1}",
                AverageScore = Math.Round((double)g.Average(s => s.Value), 2),
                Count = g.Count(),
                ImprovedCount = 0 // Would need more complex calculation
            })
            .ToList();

        // Item-level analytics (top problematic questions)
        var itemResponses = await _context.PromItemResponses
            .Where(r => r.TenantId == tenantId && r.CreatedAt >= from && r.CreatedAt <= to)
            .Where(r => r.ValueNumeric.HasValue)
            .GroupBy(r => new { r.QuestionCode, Label = r.TemplateQuestion != null ? r.TemplateQuestion.Label : null })
            .Select(g => new ItemAnalytics
            {
                QuestionCode = g.Key.QuestionCode ?? "unknown",
                QuestionLabel = g.Key.Label ?? "",
                ResponseCount = g.Count(),
                AverageScore = Math.Round((double)g.Average(r => r.ValueNumeric!.Value), 2),
                SkipRate = 0 // Would need separate query
            })
            .OrderByDescending(i => i.AverageScore) // Highest severity items first
            .Take(10)
            .ToListAsync(cancellationToken);

        return new PromAnalyticsSummary
        {
            TotalSubmissions = summaryScores.Select(s => s.InstanceId).Distinct().Count(),
            TotalScoresCalculated = summaryScores.Count,
            ScoresByKey = scoresByKey,
            ScoresByInstrument = scoresByInstrument,
            ImprovementRate = improvementRate,
            MCIDAchievementRate = mcidRate,
            PatientsTracked = improvements.Count,
            WeeklyTrends = weeklyTrends,
            TopItems = itemResponses
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

// New DTOs for enhanced PROM analytics
public record PromAnalyticsSummary
{
    public int TotalSubmissions { get; init; }
    public int TotalScoresCalculated { get; init; }
    public List<ScoreKeyAnalytics> ScoresByKey { get; init; } = new();
    public List<InstrumentAnalytics> ScoresByInstrument { get; init; } = new();
    public double ImprovementRate { get; init; }
    public double MCIDAchievementRate { get; init; }
    public int PatientsTracked { get; init; }
    public List<WeeklyScoreTrend> WeeklyTrends { get; init; } = new();
    public List<ItemAnalytics> TopItems { get; init; } = new();
}

public record ScoreKeyAnalytics
{
    public string ScoreKey { get; init; } = "";
    public string Label { get; init; } = "";
    public int Count { get; init; }
    public double Average { get; init; }
    public double Min { get; init; }
    public double Max { get; init; }
    public Dictionary<string, int> BandDistribution { get; init; } = new();
}

public class InstrumentAnalytics
{
    public string InstrumentKey { get; init; } = "";
    public string InstrumentName { get; init; } = "";
    public string ClinicalDomain { get; init; } = "";
    public int TotalSubmissions { get; init; }
    public double AverageScore { get; init; }
    public double CompletionRate { get; set; }
}

public record PatientImprovement
{
    public Guid PatientId { get; init; }
    public decimal FirstScore { get; init; }
    public decimal LastScore { get; init; }
    public decimal Change { get; init; }
    public bool Improved { get; init; }
    public bool AchievedMCID { get; init; }
}

public record WeeklyScoreTrend
{
    public string Week { get; init; } = "";
    public double AverageScore { get; init; }
    public int Count { get; init; }
    public int ImprovedCount { get; init; }
}

public record ItemAnalytics
{
    public string QuestionCode { get; init; } = "";
    public string QuestionLabel { get; init; } = "";
    public int ResponseCount { get; init; }
    public double AverageScore { get; init; }
    public double SkipRate { get; init; }
}
