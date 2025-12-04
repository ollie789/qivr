using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

/// <summary>
/// Handles automatic scheduling of PROMs and appointments when a treatment plan is approved.
/// </summary>
public interface ITreatmentPlanSchedulingService
{
    /// <summary>
    /// Called when a treatment plan is approved to schedule all PROMs and appointments.
    /// </summary>
    Task OnPlanApprovedAsync(Guid treatmentPlanId, CancellationToken ct = default);

    /// <summary>
    /// Schedules appointments for a treatment plan based on sessions per week and duration.
    /// </summary>
    Task<List<Appointment>> ScheduleAppointmentsAsync(Guid treatmentPlanId, CancellationToken ct = default);

    /// <summary>
    /// Schedules PROMs for a treatment plan based on the PromConfig.
    /// </summary>
    Task<List<PromInstanceDto>> SchedulePromsAsync(Guid treatmentPlanId, CancellationToken ct = default);

    /// <summary>
    /// Advances the treatment plan to the next phase and schedules any phase-specific PROMs.
    /// </summary>
    Task<bool> AdvanceToNextPhaseAsync(Guid treatmentPlanId, CancellationToken ct = default);

    /// <summary>
    /// Records a daily check-in from the patient.
    /// </summary>
    Task<bool> RecordCheckInAsync(Guid treatmentPlanId, DailyCheckInRequest request, CancellationToken ct = default);

    /// <summary>
    /// Gets treatment progress data for the Health Progress page.
    /// </summary>
    Task<TreatmentProgressDto?> GetTreatmentProgressAsync(Guid patientId, CancellationToken ct = default);
}

public class TreatmentPlanSchedulingService : ITreatmentPlanSchedulingService
{
    private readonly QivrDbContext _db;
    private readonly IPromInstanceService _promInstanceService;
    private readonly IPromService _promService;
    private readonly IProviderAvailabilityService _availabilityService;
    private readonly ILogger<TreatmentPlanSchedulingService> _logger;

    public TreatmentPlanSchedulingService(
        QivrDbContext db,
        IPromInstanceService promInstanceService,
        IPromService promService,
        IProviderAvailabilityService availabilityService,
        ILogger<TreatmentPlanSchedulingService> logger)
    {
        _db = db;
        _promInstanceService = promInstanceService;
        _promService = promService;
        _availabilityService = availabilityService;
        _logger = logger;
    }

    public async Task OnPlanApprovedAsync(Guid treatmentPlanId, CancellationToken ct = default)
    {
        var plan = await _db.TreatmentPlans
            .Include(p => p.Patient)
            .FirstOrDefaultAsync(p => p.Id == treatmentPlanId, ct);

        if (plan == null)
        {
            _logger.LogWarning("Treatment plan {PlanId} not found for scheduling", treatmentPlanId);
            return;
        }

        _logger.LogInformation("Scheduling PROMs and appointments for approved treatment plan {PlanId}", treatmentPlanId);

        // Schedule appointments
        await ScheduleAppointmentsAsync(treatmentPlanId, ct);

        // Schedule PROMs based on config
        await SchedulePromsAsync(treatmentPlanId, ct);

        // Create initial milestones if not already created
        await EnsureMilestonesCreatedAsync(plan, ct);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Completed scheduling for treatment plan {PlanId}", treatmentPlanId);
    }

    public async Task<List<Appointment>> ScheduleAppointmentsAsync(Guid treatmentPlanId, CancellationToken ct = default)
    {
        var plan = await _db.TreatmentPlans
            .Include(p => p.Patient)
            .Include(p => p.Provider)
            .FirstOrDefaultAsync(p => p.Id == treatmentPlanId, ct);

        if (plan == null)
        {
            _logger.LogWarning("Treatment plan {PlanId} not found", treatmentPlanId);
            return new List<Appointment>();
        }

        var appointments = new List<Appointment>();
        var sessionNumber = 1;

        // Get provider profile for scheduling
        var providerProfile = await _db.Providers
            .FirstOrDefaultAsync(p => p.UserId == plan.ProviderId && p.TenantId == plan.TenantId, ct);

        if (providerProfile == null)
        {
            _logger.LogWarning("Provider profile not found for provider {ProviderId}", plan.ProviderId);
            return appointments;
        }

        const int sessionDurationMinutes = 60;

        // Preferred days for treatment sessions (Mon, Wed, Fri for 3/week, etc.)
        var preferredDaysOfWeek = GetPreferredDaysOfWeek(plan.Phases.FirstOrDefault()?.SessionsPerWeek ?? 2);

        foreach (var phase in plan.Phases.OrderBy(p => p.PhaseNumber))
        {
            var phaseStartDate = phase.StartDate;

            for (var week = 0; week < phase.DurationWeeks; week++)
            {
                var weekStart = phaseStartDate.AddDays(week * 7);
                var sessionsScheduledThisWeek = 0;

                // Try to schedule on preferred days first
                foreach (var dayOfWeek in preferredDaysOfWeek)
                {
                    if (sessionsScheduledThisWeek >= phase.SessionsPerWeek)
                        break;

                    // Find the date for this day of week
                    var daysUntil = ((int)dayOfWeek - (int)weekStart.DayOfWeek + 7) % 7;
                    var appointmentDate = weekStart.AddDays(daysUntil);

                    // Skip if in the past
                    if (appointmentDate.Date < DateTime.UtcNow.Date)
                    {
                        continue;
                    }

                    // Use ProviderAvailabilityService to check if provider is available and get slots
                    var isProviderAvailable = await _availabilityService.IsProviderAvailableOnDate(providerProfile.Id, appointmentDate);
                    if (!isProviderAvailable)
                    {
                        _logger.LogDebug("Provider {ProviderId} is not available on {Date} (time off or non-working day)",
                            providerProfile.Id, appointmentDate);
                        continue;
                    }

                    // Get available slots from the availability service
                    var availableSlots = await _availabilityService.GetAvailableSlots(providerProfile.Id, appointmentDate, sessionDurationMinutes);

                    // Filter out slots that conflict with appointments we've already scheduled in this batch
                    availableSlots = availableSlots
                        .Where(slot => !appointments.Any(a =>
                            a.ScheduledStart.Date == appointmentDate.Date &&
                            ((slot.Start >= a.ScheduledStart && slot.Start < a.ScheduledEnd) ||
                             (slot.End > a.ScheduledStart && slot.End <= a.ScheduledEnd))))
                        .ToList();

                    if (!availableSlots.Any())
                    {
                        _logger.LogDebug("No available slot on {Date} for provider {ProviderId}",
                            appointmentDate, providerProfile.Id);
                        continue;
                    }

                    // Pick the first available slot
                    var slot = availableSlots.First();

                    var appointment = new Appointment
                    {
                        Id = Guid.NewGuid(),
                        TenantId = plan.TenantId,
                        PatientId = plan.PatientId ?? Guid.Empty,
                        ProviderId = plan.ProviderId,
                        ProviderProfileId = providerProfile.Id,
                        TreatmentPlanId = plan.Id,
                        AppointmentType = "Treatment Session",
                        Status = AppointmentStatus.Scheduled,
                        ScheduledStart = slot.Start,
                        ScheduledEnd = slot.End,
                        LocationType = LocationType.InPerson,
                        Notes = $"Treatment Plan Session {sessionNumber} - Phase {phase.PhaseNumber}: {phase.Name}",
                        CreatedAt = DateTime.UtcNow
                    };

                    appointments.Add(appointment);

                    plan.Sessions.Add(new TreatmentSession
                    {
                        Id = Guid.NewGuid().ToString(),
                        SessionNumber = sessionNumber,
                        PhaseNumber = phase.PhaseNumber,
                        ScheduledDate = slot.Start,
                        AppointmentId = appointment.Id,
                        Focus = phase.Name
                    });

                    sessionNumber++;
                    sessionsScheduledThisWeek++;
                }
            }
        }

        if (appointments.Any())
        {
            _db.Appointments.AddRange(appointments);
            plan.TotalSessions = appointments.Count;
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Scheduled {Count} appointments for treatment plan {PlanId}",
                appointments.Count, treatmentPlanId);
        }

        return appointments;
    }

    private static DayOfWeek[] GetPreferredDaysOfWeek(int sessionsPerWeek)
    {
        return sessionsPerWeek switch
        {
            1 => new[] { DayOfWeek.Wednesday },
            2 => new[] { DayOfWeek.Tuesday, DayOfWeek.Thursday },
            3 => new[] { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday },
            4 => new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Thursday, DayOfWeek.Friday },
            5 => new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday },
            _ => new[] { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday }
        };
    }

    public async Task<List<PromInstanceDto>> SchedulePromsAsync(Guid treatmentPlanId, CancellationToken ct = default)
    {
        var plan = await _db.TreatmentPlans
            .Include(p => p.Patient)
            .FirstOrDefaultAsync(p => p.Id == treatmentPlanId, ct);

        if (plan == null || plan.PromConfig == null || !plan.PromConfig.AutoSchedule)
        {
            return new List<PromInstanceDto>();
        }

        var scheduledProms = new List<PromInstanceDto>();
        var config = plan.PromConfig;

        // Get available PROM templates for this tenant
        var templates = await _db.PromTemplates
            .Where(t => t.TenantId == plan.TenantId && t.IsActive)
            .ToListAsync(ct);

        var templateLookup = templates.ToDictionary(t => t.Key, t => t, StringComparer.OrdinalIgnoreCase);

        foreach (var phase in plan.Phases.OrderBy(p => p.PhaseNumber))
        {
            var phaseStart = phase.StartDate;
            var phaseEnd = phase.EndDate ?? phase.StartDate.AddDays(phase.DurationWeeks * 7);

            // Get the PROM template for this phase
            string? promTemplateKey = phase.PromTemplateKey;
            if (string.IsNullOrEmpty(promTemplateKey) && config.PhasePromTemplates.TryGetValue(phase.PhaseNumber, out var configKey))
            {
                promTemplateKey = configKey;
            }

            if (string.IsNullOrEmpty(promTemplateKey) || !templateLookup.TryGetValue(promTemplateKey, out var template))
            {
                continue;
            }

            // Schedule at phase start
            if (config.ScheduleAtPhaseStart)
            {
                var promAtStart = await SchedulePromInstanceAsync(
                    plan, template, phaseStart, $"Phase {phase.PhaseNumber} Start", ct);
                if (promAtStart != null) scheduledProms.Add(promAtStart);
            }

            // Schedule at phase end
            if (config.ScheduleAtPhaseEnd)
            {
                var promAtEnd = await SchedulePromInstanceAsync(
                    plan, template, phaseEnd, $"Phase {phase.PhaseNumber} End", ct);
                if (promAtEnd != null) scheduledProms.Add(promAtEnd);
            }

            // Schedule at regular intervals within the phase
            if (config.DefaultIntervalWeeks > 0 && phase.DurationWeeks > config.DefaultIntervalWeeks)
            {
                var currentDate = phaseStart.AddDays(config.DefaultIntervalWeeks * 7);
                while (currentDate < phaseEnd)
                {
                    var promInterval = await SchedulePromInstanceAsync(
                        plan, template, currentDate, $"Phase {phase.PhaseNumber} Progress Check", ct);
                    if (promInterval != null) scheduledProms.Add(promInterval);

                    currentDate = currentDate.AddDays(config.DefaultIntervalWeeks * 7);
                }
            }
        }

        _logger.LogInformation("Scheduled {Count} PROMs for treatment plan {PlanId}",
            scheduledProms.Count, treatmentPlanId);

        return scheduledProms;
    }

    private async Task<PromInstanceDto?> SchedulePromInstanceAsync(
        TreatmentPlan plan,
        PromTemplate template,
        DateTime scheduledFor,
        string tag,
        CancellationToken ct)
    {
        try
        {
            // Skip if in the past
            if (scheduledFor < DateTime.UtcNow)
            {
                return null;
            }

            var request = new SendPromRequest
            {
                TemplateId = template.Id,
                PatientId = plan.PatientId ?? Guid.Empty,
                ScheduledAt = scheduledFor,
                DueDate = scheduledFor.AddDays(7),
                NotificationMethod = NotificationMethod.Email | NotificationMethod.InApp,
                SentBy = "Treatment Plan Auto-Scheduler",
                Tags = new List<string> { tag, $"TreatmentPlan:{plan.Id}" },
                Notes = $"Auto-scheduled for treatment plan: {plan.Title}"
            };

            return await _promInstanceService.SendPromToPatientAsync(plan.TenantId, request, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to schedule PROM for treatment plan {PlanId} at {Date}",
                plan.Id, scheduledFor);
            return null;
        }
    }

    public async Task<bool> AdvanceToNextPhaseAsync(Guid treatmentPlanId, CancellationToken ct = default)
    {
        var plan = await _db.TreatmentPlans
            .FirstOrDefaultAsync(p => p.Id == treatmentPlanId, ct);

        if (plan == null || plan.Phases.Count == 0)
        {
            return false;
        }

        var currentPhase = plan.Phases
            .FirstOrDefault(p => p.Status == PhaseStatus.InProgress);

        if (currentPhase != null)
        {
            // Complete current phase
            currentPhase.Status = PhaseStatus.Completed;
            currentPhase.EndDate = DateTime.UtcNow;
            currentPhase.PhaseProgressPercentage = 100;
        }

        // Find next phase
        var nextPhaseNumber = (currentPhase?.PhaseNumber ?? 0) + 1;
        var nextPhase = plan.Phases.FirstOrDefault(p => p.PhaseNumber == nextPhaseNumber);

        if (nextPhase != null)
        {
            nextPhase.Status = PhaseStatus.InProgress;
            nextPhase.StartDate = DateTime.UtcNow;

            // Create milestone for phase completion
            await AwardMilestoneAsync(plan, MilestoneType.PhaseComplete, nextPhaseNumber - 1, ct);
        }
        else
        {
            // All phases complete
            plan.Status = TreatmentPlanStatus.Completed;
            plan.ProgressPercentage = 100;
        }

        // Update overall progress
        var completedPhases = plan.Phases.Count(p => p.Status == PhaseStatus.Completed);
        plan.ProgressPercentage = (decimal)completedPhases / plan.Phases.Count * 100;
        plan.CurrentWeek = CalculateCurrentWeek(plan);

        await _db.SaveChangesAsync(ct);

        return true;
    }

    public async Task<bool> RecordCheckInAsync(Guid treatmentPlanId, DailyCheckInRequest request, CancellationToken ct = default)
    {
        var plan = await _db.TreatmentPlans
            .FirstOrDefaultAsync(p => p.Id == treatmentPlanId, ct);

        if (plan == null)
        {
            return false;
        }

        var today = DateTime.UtcNow.Date;

        // Check if already checked in today
        var existingCheckIn = plan.CheckIns.FirstOrDefault(c => c.Date.Date == today);
        if (existingCheckIn != null)
        {
            // Update existing check-in
            existingCheckIn.PainLevel = request.PainLevel;
            existingCheckIn.Mood = request.Mood;
            existingCheckIn.Notes = request.Notes;
            existingCheckIn.ExercisesCompleted = request.ExercisesCompleted;
        }
        else
        {
            // Get last check-in date to calculate streak
            var lastCheckIn = plan.CheckIns
                .OrderByDescending(c => c.Date)
                .FirstOrDefault();

            var lastCheckInDate = lastCheckIn?.Date.Date;
            var continuedStreak = lastCheckInDate == today.AddDays(-1);

            // Update streak
            if (continuedStreak)
            {
                plan.ExerciseStreak++;
            }
            else if (lastCheckInDate != today)
            {
                // Streak broken or first check-in
                plan.ExerciseStreak = 1;
            }

            // Award points for completing exercises
            var pointsEarned = request.ExercisesCompleted * 10;
            plan.PointsEarned += pointsEarned;

            // Get current phase to count assigned exercises
            var currentPhase = plan.Phases.FirstOrDefault(p => p.Status == PhaseStatus.InProgress);
            var assignedExercises = currentPhase?.Exercises.Count ?? 0;

            // Create and persist check-in
            var checkIn = new DailyCheckIn
            {
                Id = Guid.NewGuid().ToString(),
                Date = DateTime.UtcNow,
                PainLevel = request.PainLevel,
                Mood = request.Mood,
                Notes = request.Notes,
                ExercisesCompleted = request.ExercisesCompleted,
                ExercisesAssigned = assignedExercises,
                PointsEarned = pointsEarned,
                ContinuedStreak = continuedStreak
            };
            plan.CheckIns.Add(checkIn);

            _logger.LogInformation(
                "Recorded check-in for plan {PlanId}: Pain={Pain}, Mood={Mood}, Exercises={Completed}/{Assigned}, Streak={Streak}",
                treatmentPlanId, request.PainLevel, request.Mood, request.ExercisesCompleted, assignedExercises, plan.ExerciseStreak);
        }

        // Check for milestone achievements
        await CheckAndAwardMilestonesAsync(plan, ct);

        await _db.SaveChangesAsync(ct);

        return true;
    }

    public async Task<TreatmentProgressDto?> GetTreatmentProgressAsync(Guid patientId, CancellationToken ct = default)
    {
        var plan = await _db.TreatmentPlans
            .AsNoTracking()
            .Include(p => p.Patient)
            .Where(p => p.PatientId == patientId && p.Status == TreatmentPlanStatus.Active)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (plan == null)
        {
            return null;
        }

        var currentPhase = plan.Phases.FirstOrDefault(p => p.Status == PhaseStatus.InProgress);
        var completedPhases = plan.Phases.Count(p => p.Status == PhaseStatus.Completed);
        var totalExercises = plan.Phases.Sum(p => p.Exercises.Count);
        var completedExercises = plan.Phases.Sum(p => p.Exercises.Count(e => e.Completed));

        // Get today's exercises
        var todaysExercises = currentPhase?.Exercises
            .Where(e => !e.Completed || e.Completions.Any(c => c.CompletedAt.Date == DateTime.UtcNow.Date))
            .ToList() ?? new List<Exercise>();

        var todaysCompleted = todaysExercises.Count(e =>
            e.Completions.Any(c => c.CompletedAt.Date == DateTime.UtcNow.Date));

        // Get milestone data
        var unlockedMilestones = plan.Milestones.Where(m => m.IsCompleted).ToList();
        var upcomingMilestones = plan.Milestones.Where(m => !m.IsCompleted).ToList();

        return new TreatmentProgressDto
        {
            TreatmentPlanId = plan.Id,
            PlanTitle = plan.Title,
            Diagnosis = plan.Diagnosis ?? string.Empty,
            Status = plan.Status.ToString(),
            StartDate = plan.StartDate,
            EstimatedEndDate = plan.EndDate,

            // Progress metrics
            OverallProgress = plan.ProgressPercentage,
            CurrentWeek = plan.CurrentWeek,
            TotalWeeks = plan.DurationWeeks,
            CurrentPhase = currentPhase?.PhaseNumber ?? 0,
            TotalPhases = plan.Phases.Count,

            // Session tracking
            CompletedSessions = plan.CompletedSessions,
            TotalSessions = plan.TotalSessions,

            // Exercise tracking
            TotalExercises = totalExercises,
            CompletedExercises = completedExercises,
            TodaysExercises = todaysExercises.Count,
            TodaysCompletedExercises = todaysCompleted,

            // Engagement metrics
            CurrentStreak = plan.ExerciseStreak,
            TotalPoints = plan.PointsEarned,

            // Milestones
            UnlockedMilestones = unlockedMilestones.Select(m => new MilestoneProgressDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                Type = m.Type.ToString(),
                PointsAwarded = m.PointsAwarded,
                CompletedAt = m.CompletedAt,
                Icon = m.Icon
            }).ToList(),

            UpcomingMilestones = upcomingMilestones.Select(m => new MilestoneProgressDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                Type = m.Type.ToString(),
                PointsAwarded = m.PointsAwarded,
                TargetValue = m.TargetValue,
                CurrentValue = m.CurrentValue,
                Icon = m.Icon
            }).ToList(),

            // Phase breakdown
            Phases = plan.Phases.Select(p => new PhaseProgressDto
            {
                PhaseNumber = p.PhaseNumber,
                Name = p.Name,
                Status = p.Status.ToString(),
                DurationWeeks = p.DurationWeeks,
                ProgressPercentage = p.PhaseProgressPercentage,
                ExerciseCount = p.Exercises.Count,
                CompletedExercises = p.Exercises.Count(e => e.Completed),
                Goals = p.Goals
            }).ToList()
        };
    }

    private async Task EnsureMilestonesCreatedAsync(TreatmentPlan plan, CancellationToken ct)
    {
        if (plan.Milestones.Any())
        {
            return; // Already created
        }

        // Create default milestones
        var milestones = new List<TreatmentMilestone>
        {
            new()
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Getting Started",
                Description = "Complete your first exercise session",
                Type = MilestoneType.SessionCount,
                TargetValue = 1,
                PointsAwarded = 50,
                Icon = "star"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Week Warrior",
                Description = "Complete a full week of exercises",
                Type = MilestoneType.WeekComplete,
                TargetValue = 1,
                PointsAwarded = 100,
                Icon = "trophy"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Consistency Champion",
                Description = "Maintain a 7-day exercise streak",
                Type = MilestoneType.ExerciseStreak,
                TargetValue = 7,
                PointsAwarded = 150,
                Icon = "fire"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Halfway There",
                Description = "Complete 50% of your treatment plan",
                Type = MilestoneType.SessionCount,
                TargetValue = plan.TotalSessions / 2,
                PointsAwarded = 200,
                Icon = "medal"
            },
            new()
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Pain Progress",
                Description = "Report a 2-point reduction in pain level",
                Type = MilestoneType.PainReduction,
                TargetValue = 2,
                PointsAwarded = 150,
                Icon = "heart"
            }
        };

        // Add phase completion milestones
        foreach (var phase in plan.Phases)
        {
            milestones.Add(new TreatmentMilestone
            {
                Id = Guid.NewGuid().ToString(),
                Title = $"Phase {phase.PhaseNumber} Complete",
                Description = $"Successfully complete {phase.Name}",
                Type = MilestoneType.PhaseComplete,
                TargetValue = phase.PhaseNumber,
                PointsAwarded = 100 + (phase.PhaseNumber * 25),
                Icon = "flag"
            });
        }

        plan.Milestones = milestones;
        await _db.SaveChangesAsync(ct);
    }

    private async Task CheckAndAwardMilestonesAsync(TreatmentPlan plan, CancellationToken ct)
    {
        foreach (var milestone in plan.Milestones.Where(m => !m.IsCompleted))
        {
            var shouldAward = milestone.Type switch
            {
                MilestoneType.SessionCount => plan.CompletedSessions >= milestone.TargetValue,
                MilestoneType.ExerciseStreak => plan.ExerciseStreak >= milestone.TargetValue,
                MilestoneType.WeekComplete => plan.CurrentWeek >= milestone.TargetValue,
                MilestoneType.PhaseComplete => plan.Phases.Count(p => p.Status == PhaseStatus.Completed) >= milestone.TargetValue,
                _ => false
            };

            if (shouldAward)
            {
                await AwardMilestoneAsync(plan, milestone, ct);
            }
        }
    }

    private async Task AwardMilestoneAsync(TreatmentPlan plan, TreatmentMilestone milestone, CancellationToken ct)
    {
        milestone.IsCompleted = true;
        milestone.CompletedAt = DateTime.UtcNow;
        milestone.CurrentValue = milestone.TargetValue;
        plan.PointsEarned += milestone.PointsAwarded;

        _logger.LogInformation("Awarded milestone '{Title}' (+{Points} points) for treatment plan {PlanId}",
            milestone.Title, milestone.PointsAwarded, plan.Id);
    }

    private async Task AwardMilestoneAsync(TreatmentPlan plan, MilestoneType type, int targetValue, CancellationToken ct)
    {
        var milestone = plan.Milestones
            .FirstOrDefault(m => m.Type == type && m.TargetValue == targetValue && !m.IsCompleted);

        if (milestone != null)
        {
            await AwardMilestoneAsync(plan, milestone, ct);
        }
    }

    private int CalculateCurrentWeek(TreatmentPlan plan)
    {
        var daysSinceStart = (DateTime.UtcNow - plan.StartDate).TotalDays;
        return Math.Min((int)(daysSinceStart / 7) + 1, plan.DurationWeeks);
    }
}

#region DTOs

public class DailyCheckInRequest
{
    public int PainLevel { get; set; }
    public int Mood { get; set; }
    public string? Notes { get; set; }
    public int ExercisesCompleted { get; set; }
}

// DailyCheckIn entity is now in Qivr.Core.Entities.TreatmentPlan

public class TreatmentProgressDto
{
    public Guid TreatmentPlanId { get; set; }
    public string PlanTitle { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EstimatedEndDate { get; set; }

    // Progress metrics
    public decimal OverallProgress { get; set; }
    public int CurrentWeek { get; set; }
    public int TotalWeeks { get; set; }
    public int CurrentPhase { get; set; }
    public int TotalPhases { get; set; }

    // Session tracking
    public int CompletedSessions { get; set; }
    public int TotalSessions { get; set; }

    // Exercise tracking
    public int TotalExercises { get; set; }
    public int CompletedExercises { get; set; }
    public int TodaysExercises { get; set; }
    public int TodaysCompletedExercises { get; set; }

    // Engagement metrics
    public int CurrentStreak { get; set; }
    public int TotalPoints { get; set; }

    // Milestones
    public List<MilestoneProgressDto> UnlockedMilestones { get; set; } = new();
    public List<MilestoneProgressDto> UpcomingMilestones { get; set; } = new();

    // Phase breakdown
    public List<PhaseProgressDto> Phases { get; set; } = new();
}

public class MilestoneProgressDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public int PointsAwarded { get; set; }
    public int TargetValue { get; set; }
    public int CurrentValue { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Icon { get; set; }
}

public class PhaseProgressDto
{
    public int PhaseNumber { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int DurationWeeks { get; set; }
    public decimal ProgressPercentage { get; set; }
    public int ExerciseCount { get; set; }
    public int CompletedExercises { get; set; }
    public List<string> Goals { get; set; } = new();
}

#endregion
