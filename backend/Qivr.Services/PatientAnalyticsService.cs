using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IPatientAnalyticsService
{
    Task<PatientDashboardData> GetPatientDashboardAsync(Guid patientId, CancellationToken cancellationToken = default);
    Task<PatientProgressData> GetPatientProgressAsync(Guid patientId, DateTime from, DateTime to, CancellationToken cancellationToken = default);
}

public class PatientAnalyticsService : IPatientAnalyticsService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<PatientAnalyticsService> _logger;

    public PatientAnalyticsService(QivrDbContext context, ILogger<PatientAnalyticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PatientDashboardData> GetPatientDashboardAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        var patient = await _context.Users.FindAsync(new object[] { patientId }, cancellationToken);
        if (patient == null) throw new KeyNotFoundException("Patient not found");

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        // Appointments
        var appointments = await _context.Appointments
            .Where(a => a.PatientId == patientId)
            .ToListAsync(cancellationToken);

        var upcomingAppointments = appointments.Count(a => a.ScheduledStart > now);
        var completedAppointments = appointments.Count(a => a.Status == AppointmentStatus.Completed);
        var totalAppointments = appointments.Count;

        // PROM scores
        var promScores = await _context.PromResponses
            .Where(p => p.PatientId == patientId)
            .OrderBy(p => p.CompletedAt)
            .ToListAsync(cancellationToken);

        var currentScore = promScores.LastOrDefault()?.Score ?? 0;
        var firstScore = promScores.FirstOrDefault()?.Score ?? 0;
        var improvement = promScores.Count >= 2 ? currentScore - firstScore : 0;

        // Streaks
        var recentProm = await _context.PromResponses
            .Where(p => p.PatientId == patientId && p.CompletedAt >= thirtyDaysAgo)
            .OrderByDescending(p => p.CompletedAt)
            .ToListAsync(cancellationToken);

        var currentStreak = CalculateStreak(recentProm.Select(p => p.CompletedAt).ToList());

        // Pain tracking
        var painMaps = await _context.PainMaps
            .Include(pm => pm.Evaluation)
            .Where(pm => pm.Evaluation!.PatientId == patientId)
            .OrderBy(pm => pm.CreatedAt)
            .ToListAsync(cancellationToken);

        var currentPain = painMaps.LastOrDefault()?.PainIntensity ?? 0;
        var initialPain = painMaps.FirstOrDefault()?.PainIntensity ?? 0;
        var painReduction = initialPain - currentPain;

        // Achievements
        var achievements = CalculateAchievements(completedAppointments, promScores.Count, currentStreak, improvement);

        return new PatientDashboardData
        {
            UpcomingAppointments = upcomingAppointments,
            CompletedAppointments = completedAppointments,
            TotalAppointments = totalAppointments,
            CurrentPromScore = Math.Round((double)currentScore, 1),
            PromImprovement = Math.Round((double)improvement, 1),
            CurrentStreak = currentStreak,
            LongestStreak = currentStreak, // TODO: Track historical streaks
            CurrentPainLevel = currentPain,
            PainReduction = painReduction,
            TotalPromCompleted = promScores.Count,
            Achievements = achievements,
            Level = CalculateLevel(completedAppointments, promScores.Count),
            PointsToNextLevel = CalculatePointsToNextLevel(completedAppointments, promScores.Count)
        };
    }

    public async Task<PatientProgressData> GetPatientProgressAsync(Guid patientId, DateTime from, DateTime to, CancellationToken cancellationToken = default)
    {
        // PROM score timeline
        var promScores = await _context.PromResponses
            .Where(p => p.PatientId == patientId && p.CompletedAt >= from && p.CompletedAt <= to)
            .OrderBy(p => p.CompletedAt)
            .Select(p => new ScorePoint
            {
                Date = p.CompletedAt,
                Score = (double)p.Score,
                Type = p.PromType
            })
            .ToListAsync(cancellationToken);

        // Pain intensity timeline
        var painPoints = await _context.PainMaps
            .Include(pm => pm.Evaluation)
            .Where(pm => pm.Evaluation!.PatientId == patientId && pm.CreatedAt >= from && pm.CreatedAt <= to)
            .OrderBy(pm => pm.CreatedAt)
            .Select(pm => new PainPoint
            {
                Date = pm.CreatedAt,
                Intensity = pm.PainIntensity,
                BodyRegion = pm.BodyRegion
            })
            .ToListAsync(cancellationToken);

        // Appointment attendance
        var appointments = await _context.Appointments
            .Where(a => a.PatientId == patientId && a.ScheduledStart >= from && a.ScheduledStart <= to)
            .ToListAsync(cancellationToken);

        var attendanceRate = appointments.Any()
            ? (double)appointments.Count(a => a.Status == AppointmentStatus.Completed) / appointments.Count * 100
            : 0;

        return new PatientProgressData
        {
            PromScoreTimeline = promScores,
            PainIntensityTimeline = painPoints,
            AttendanceRate = Math.Round(attendanceRate, 1),
            TotalAppointments = appointments.Count,
            CompletedAppointments = appointments.Count(a => a.Status == AppointmentStatus.Completed)
        };
    }

    private int CalculateStreak(List<DateTime> completionDates)
    {
        if (!completionDates.Any()) return 0;

        var streak = 1;
        var sortedDates = completionDates.OrderByDescending(d => d).ToList();

        for (int i = 0; i < sortedDates.Count - 1; i++)
        {
            var daysDiff = (sortedDates[i].Date - sortedDates[i + 1].Date).Days;
            if (daysDiff <= 7) // Within a week counts as streak
                streak++;
            else
                break;
        }

        return streak;
    }

    private List<Achievement> CalculateAchievements(int appointments, int proms, int streak, decimal improvement)
    {
        var achievements = new List<Achievement>();

        if (appointments >= 1) achievements.Add(new Achievement { Name = "First Visit", Icon = "🎯", Description = "Completed your first appointment" });
        if (appointments >= 5) achievements.Add(new Achievement { Name = "Committed", Icon = "💪", Description = "5 appointments completed" });
        if (appointments >= 10) achievements.Add(new Achievement { Name = "Dedicated", Icon = "🏆", Description = "10 appointments completed" });
        
        if (proms >= 1) achievements.Add(new Achievement { Name = "Self-Aware", Icon = "📊", Description = "Completed first PROM" });
        if (proms >= 5) achievements.Add(new Achievement { Name = "Tracker", Icon = "📈", Description = "5 PROMs completed" });
        
        if (streak >= 3) achievements.Add(new Achievement { Name = "On Fire", Icon = "🔥", Description = $"{streak} week streak!" });
        if (streak >= 8) achievements.Add(new Achievement { Name = "Unstoppable", Icon = "⚡", Description = $"{streak} week streak!" });
        
        if (improvement >= 10) achievements.Add(new Achievement { Name = "Improving", Icon = "📈", Description = "10+ point improvement" });
        if (improvement >= 25) achievements.Add(new Achievement { Name = "Transformed", Icon = "✨", Description = "25+ point improvement" });

        return achievements;
    }

    private int CalculateLevel(int appointments, int proms)
    {
        var points = (appointments * 10) + (proms * 5);
        return (points / 50) + 1; // Level up every 50 points
    }

    private int CalculatePointsToNextLevel(int appointments, int proms)
    {
        var points = (appointments * 10) + (proms * 5);
        var currentLevelPoints = ((points / 50) * 50);
        var nextLevelPoints = currentLevelPoints + 50;
        return nextLevelPoints - points;
    }
}

// DTOs
public record PatientDashboardData
{
    public int UpcomingAppointments { get; init; }
    public int CompletedAppointments { get; init; }
    public int TotalAppointments { get; init; }
    public double CurrentPromScore { get; init; }
    public double PromImprovement { get; init; }
    public int CurrentStreak { get; init; }
    public int LongestStreak { get; init; }
    public int CurrentPainLevel { get; init; }
    public int PainReduction { get; init; }
    public int TotalPromCompleted { get; init; }
    public List<Achievement> Achievements { get; init; } = new();
    public int Level { get; init; }
    public int PointsToNextLevel { get; init; }
}

public record PatientProgressData
{
    public List<ScorePoint> PromScoreTimeline { get; init; } = new();
    public List<PainPoint> PainIntensityTimeline { get; init; } = new();
    public double AttendanceRate { get; init; }
    public int TotalAppointments { get; init; }
    public int CompletedAppointments { get; init; }
}

public record Achievement
{
    public string Name { get; init; } = "";
    public string Icon { get; init; } = "";
    public string Description { get; init; } = "";
}

public record ScorePoint
{
    public DateTime Date { get; init; }
    public double Score { get; init; }
    public string Type { get; init; } = "";
}

public record PainPoint
{
    public DateTime Date { get; init; }
    public int Intensity { get; init; }
    public string BodyRegion { get; init; } = "";
}
