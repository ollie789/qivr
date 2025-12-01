using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Qivr.Services.AI;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/treatment-plans")]
[Authorize]  // Base auth - specific endpoints add StaffOnly
public class TreatmentPlansController : BaseApiController
{
    private readonly QivrDbContext _context;
    private readonly IAiTreatmentPlanService _aiService;
    private readonly ITreatmentPlanSchedulingService _schedulingService;
    private readonly ILogger<TreatmentPlansController> _logger;

    public TreatmentPlansController(
        QivrDbContext context,
        IAiTreatmentPlanService aiService,
        ITreatmentPlanSchedulingService schedulingService,
        ILogger<TreatmentPlansController> logger)
    {
        _context = context;
        _aiService = aiService;
        _schedulingService = schedulingService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> List([FromQuery] Guid? patientId)
    {
        var tenantId = RequireTenantId();
        var query = _context.TreatmentPlans
            .Where(t => t.TenantId == tenantId && t.DeletedAt == null)
            .Include(t => t.Patient)
            .Include(t => t.Provider)
            .AsQueryable();

        if (patientId.HasValue)
            query = query.Where(t => t.PatientId == patientId.Value);

        var plans = await query.OrderByDescending(t => t.CreatedAt)
            .Select(t => new TreatmentPlanListDto
            {
                Id = t.Id,
                Title = t.Title,
                Diagnosis = t.Diagnosis,
                Goals = t.Goals,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                DurationWeeks = t.DurationWeeks,
                Status = t.Status,
                ProgressPercentage = t.ProgressPercentage,
                CompletedSessions = t.CompletedSessions,
                TotalSessions = t.TotalSessions,
                CurrentWeek = t.CurrentWeek,
                PatientId = t.PatientId,
                PatientName = t.Patient != null ? t.Patient.FullName : "Unknown",
                ProviderId = t.ProviderId,
                ProviderName = t.Provider != null ? t.Provider.FullName : "Unknown",
                CreatedAt = t.CreatedAt,
                ReviewDate = t.ReviewDate
            })
            .ToListAsync();
        return Ok(plans);
    }

    [HttpGet("current")]
    [Authorize]
    public async Task<IActionResult> GetCurrent()
    {
        var tenantId = CurrentTenantId;
        var userId = CurrentUserId;

        if (tenantId == null || tenantId == Guid.Empty)
            return BadRequest(new { message = "Tenant context required" });

        var plan = await _context.TreatmentPlans
            .Include(t => t.Provider)
            .Where(t => t.TenantId == tenantId && t.PatientId == userId && t.DeletedAt == null)
            .Where(t => t.Status == TreatmentPlanStatus.Active)
            .OrderByDescending(t => t.StartDate)
            .FirstOrDefaultAsync();

        if (plan == null)
            return NotFound(new { message = "No active treatment plan found" });

        return Ok(new TreatmentPlanListDto
        {
            Id = plan.Id,
            Title = plan.Title,
            Diagnosis = plan.Diagnosis,
            Goals = plan.Goals,
            StartDate = plan.StartDate,
            EndDate = plan.EndDate,
            DurationWeeks = plan.DurationWeeks,
            Status = plan.Status,
            ProgressPercentage = plan.ProgressPercentage,
            CompletedSessions = plan.CompletedSessions,
            TotalSessions = plan.TotalSessions,
            CurrentWeek = plan.CurrentWeek,
            PatientId = plan.PatientId,
            PatientName = "Current User",
            ProviderId = plan.ProviderId,
            ProviderName = plan.Provider?.FullName ?? "Unknown",
            CreatedAt = plan.CreatedAt,
            ReviewDate = plan.ReviewDate
        });
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> Get(Guid id)
    {
        var tenantId = RequireTenantId();
        var plan = await _context.TreatmentPlans
            .Include(t => t.Patient)
            .Include(t => t.Provider)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        return Ok(new TreatmentPlanDetailDto
        {
            Id = plan.Id,
            Title = plan.Title,
            Diagnosis = plan.Diagnosis,
            Goals = plan.Goals,
            StartDate = plan.StartDate,
            EndDate = plan.EndDate,
            DurationWeeks = plan.DurationWeeks,
            Status = plan.Status,
            ProgressPercentage = plan.ProgressPercentage,
            CompletedSessions = plan.CompletedSessions,
            TotalSessions = plan.TotalSessions,
            CurrentWeek = plan.CurrentWeek,
            ExerciseStreak = plan.ExerciseStreak,
            PointsEarned = plan.PointsEarned,
            PatientId = plan.PatientId,
            PatientName = plan.Patient?.FullName ?? "Unknown",
            ProviderId = plan.ProviderId,
            ProviderName = plan.Provider?.FullName ?? "Unknown",
            CreatedAt = plan.CreatedAt,
            ReviewDate = plan.ReviewDate,
            Notes = plan.Notes,
            Sessions = plan.Sessions,
            Exercises = plan.Exercises,
            Phases = plan.Phases,
            Milestones = plan.Milestones,
            PromConfig = plan.PromConfig,
            AiGeneratedSummary = plan.AiGeneratedSummary,
            AiConfidence = plan.AiConfidence,
            AiRationale = plan.AiRationale,
            AiGeneratedAt = plan.AiGeneratedAt,
            Patient = plan.Patient != null ? new PatientSummaryDto
            {
                Id = plan.Patient.Id,
                FirstName = plan.Patient.FirstName ?? "",
                LastName = plan.Patient.LastName ?? "",
                Email = plan.Patient.Email,
                Phone = plan.Patient.Phone
            } : null
        });
    }

    [HttpPost]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> Create([FromBody] CreateTreatmentPlanRequest request)
    {
        try
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
                Phases = request.Phases ?? new(),
                Milestones = new(),
                Notes = BuildNotes(request),
                // AI generation metadata
                AiGeneratedSummary = request.AiGeneratedSummary,
                AiRationale = request.AiRationale,
                AiConfidence = request.AiConfidence,
                AiGeneratedAt = request.AiGeneratedSummary != null ? DateTime.UtcNow : null,
                SourceEvaluationId = request.SourceEvaluationId
            };

            _context.TreatmentPlans.Add(plan);
            await _context.SaveChangesAsync();

            // If a device was linked, find/create the device usage record and link it
            if (request.LinkedDeviceId.HasValue)
            {
                // Find the most recent device usage for this patient with this device
                var deviceUsage = await _context.PatientDeviceUsages
                    .Where(u => u.PatientId == request.PatientId
                        && u.DeviceId == request.LinkedDeviceId.Value
                        && u.TenantId == tenantId)
                    .OrderByDescending(u => u.CreatedAt)
                    .FirstOrDefaultAsync();

                if (deviceUsage != null)
                {
                    // Link the treatment plan to the device usage
                    deviceUsage.TreatmentPlanId = plan.Id;
                    plan.LinkedDeviceUsageId = deviceUsage.Id;
                    await _context.SaveChangesAsync();
                }
            }

            return CreatedAtAction(nameof(Get), new { id = plan.Id }, plan);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating treatment plan");
            return StatusCode(500, new { error = "Failed to create treatment plan", detail = ex.Message });
        }
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
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTreatmentPlanRequest request)
    {
        var tenantId = RequireTenantId();
        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null);

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
    [Authorize(Policy = "StaffOnly")]
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

    #region AI Generation Endpoints

    /// <summary>
    /// Generate a treatment plan using AI based on patient data
    /// </summary>
    [HttpPost("generate")]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> GenerateWithAi([FromBody] GenerateTreatmentPlanRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        try
        {
            var generationRequest = new TreatmentPlanGenerationRequest
            {
                PatientId = request.PatientId,
                EvaluationId = request.EvaluationId,
                ProviderId = userId,
                TenantId = tenantId,
                PreferredDurationWeeks = request.PreferredDurationWeeks,
                SessionsPerWeek = request.SessionsPerWeek,
                FocusAreas = request.FocusAreas,
                Contraindications = request.Contraindications
            };

            // Generate the plan using AI
            var generatedPlan = await _aiService.GeneratePlanAsync(generationRequest);

            // Convert to TreatmentPlan entity (stays in Draft status)
            var plan = _aiService.ConvertToTreatmentPlan(generatedPlan, generationRequest);

            _context.TreatmentPlans.Add(plan);
            await _context.SaveChangesAsync();

            // Load relations for response
            await _context.Entry(plan).Reference(p => p.Patient).LoadAsync();
            await _context.Entry(plan).Reference(p => p.Provider).LoadAsync();

            return Ok(new
            {
                plan,
                generatedData = generatedPlan,
                message = "Treatment plan generated successfully. Review and approve to activate."
            });
        }
        catch (TreatmentPlanGenerationException ex)
        {
            _logger.LogError(ex, "Treatment plan generation failed for patient {PatientId}", request.PatientId);
            var errorDetail = ex.InnerException?.Message ?? ex.Message;
            return BadRequest(new { error = $"Failed to generate treatment plan: {errorDetail}" });
        }
    }

    /// <summary>
    /// Approve a draft treatment plan and activate it
    /// </summary>
    [HttpPost("{id}/approve")]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        if (plan.Status != TreatmentPlanStatus.Draft)
            return BadRequest(new { error = "Only draft plans can be approved" });

        plan.Status = TreatmentPlanStatus.Active;
        plan.ApprovedAt = DateTime.UtcNow;
        plan.ApprovedBy = userId;

        // Set the first phase to InProgress
        if (plan.Phases.Any())
        {
            plan.Phases[0].Status = PhaseStatus.InProgress;
        }

        await _context.SaveChangesAsync();

        // Trigger auto-scheduling of appointments and PROMs
        await _schedulingService.OnPlanApprovedAsync(plan.Id);

        return Ok(new { message = "Treatment plan approved and activated", plan });
    }

    /// <summary>
    /// Get AI suggestions for exercise additions
    /// </summary>
    [HttpPost("suggest-exercises")]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> SuggestExercises([FromBody] ExerciseSuggestionRequest request)
    {
        var exercises = await _aiService.SuggestExercisesAsync(request);
        return Ok(exercises);
    }

    #endregion

    #region Progress Tracking Endpoints

    /// <summary>
    /// Complete a session within a treatment plan
    /// </summary>
    [HttpPost("{id}/sessions/{sessionNumber}/complete")]
    public async Task<IActionResult> CompleteSession(Guid id, int sessionNumber, [FromBody] SessionCompletionRequest request)
    {
        var tenantId = RequireTenantId();

        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        // Find the session
        var session = plan.Sessions.FirstOrDefault(s => s.SessionNumber == sessionNumber);
        if (session == null)
        {
            // Create session if it doesn't exist
            session = new TreatmentSession
            {
                Id = Guid.NewGuid().ToString(),
                SessionNumber = sessionNumber,
                ScheduledDate = DateTime.UtcNow
            };
            plan.Sessions.Add(session);
        }

        session.Completed = true;
        session.CompletedDate = DateTime.UtcNow;
        session.PainLevelAfter = request.PainLevelAfter;
        session.PatientNotes = request.Notes;
        session.AppointmentId = request.AppointmentId;

        // Update plan progress
        plan.CompletedSessions++;
        UpdatePlanProgress(plan);

        // Check milestones
        CheckAndUpdateMilestones(plan);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Session completed",
            completedSessions = plan.CompletedSessions,
            progressPercentage = plan.ProgressPercentage,
            milestonesCompleted = plan.Milestones.Count(m => m.IsCompleted)
        });
    }

    /// <summary>
    /// Complete an exercise within a treatment plan
    /// </summary>
    [HttpPost("{id}/exercises/{exerciseId}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteExercise(Guid id, string exerciseId, [FromBody] ExerciseCompletionRequest request)
    {
        var tenantId = CurrentTenantId;
        if (tenantId == null || tenantId == Guid.Empty)
            return BadRequest(new { message = "Tenant context required" });
        var userId = CurrentUserId;

        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.PatientId == userId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        // Find exercise in phases or legacy exercises
        Exercise? exercise = null;
        foreach (var phase in plan.Phases)
        {
            exercise = phase.Exercises.FirstOrDefault(e => e.Id == exerciseId);
            if (exercise != null) break;
        }
        exercise ??= plan.Exercises.FirstOrDefault(e => e.Id == exerciseId);

        if (exercise == null)
            return NotFound(new { error = "Exercise not found" });

        // Add completion record
        var completion = new ExerciseCompletion
        {
            Id = Guid.NewGuid().ToString(),
            CompletedAt = DateTime.UtcNow,
            PainLevelBefore = request.PainLevelBefore,
            PainLevelAfter = request.PainLevelAfter,
            Notes = request.Notes,
            SetsCompleted = request.SetsCompleted,
            RepsCompleted = request.RepsCompleted
        };
        exercise.Completions.Add(completion);

        // Update streak
        UpdateExerciseStreak(plan);

        // Award points
        plan.PointsEarned += 10;

        // Check milestones
        CheckAndUpdateMilestones(plan);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Exercise completed",
            pointsEarned = 10,
            totalPoints = plan.PointsEarned,
            exerciseStreak = plan.ExerciseStreak
        });
    }

    /// <summary>
    /// Get patient's active treatment plan with today's tasks
    /// </summary>
    [HttpGet("my-plan")]
    public async Task<IActionResult> GetMyActivePlan()
    {
        try
        {
            var tenantId = CurrentTenantId;
            var userId = CurrentUserId;

            if (tenantId == null || tenantId == Guid.Empty)
                return BadRequest(new { message = "Tenant context required" });

            if (userId == Guid.Empty)
                return BadRequest(new { message = "User context required" });

            var plan = await _context.TreatmentPlans
                .Include(t => t.Provider)
                .Include(t => t.Patient)
                .Where(t => t.TenantId == tenantId && t.PatientId == userId && t.DeletedAt == null)
                .Where(t => t.Status == TreatmentPlanStatus.Active)
                .OrderByDescending(t => t.StartDate)
                .FirstOrDefaultAsync();

            if (plan == null)
                return NotFound(new { message = "No active treatment plan found" });

            // Calculate current week
            var daysSinceStart = (DateTime.UtcNow - plan.StartDate).Days;
            plan.CurrentWeek = Math.Max(1, (daysSinceStart / 7) + 1);

            // Get current phase - handle null Phases
            var currentPhase = plan.Phases?.FirstOrDefault(p => p.Status == PhaseStatus.InProgress)
                ?? plan.Phases?.FirstOrDefault(p => p.Status == PhaseStatus.NotStarted);

            // Get today's exercises - handle null safely
            var todaysExercises = currentPhase?.Exercises?
                .Where(e => e.Frequency == "Daily" ||
                           (e.Frequency?.Contains("week") == true && ShouldDoExerciseToday(e)))
                .ToList() ?? new List<Exercise>();

            // Get next appointment
            var nextAppointment = await _context.Appointments
                .Where(a => a.PatientId == userId && a.TreatmentPlanId == plan.Id)
                .Where(a => a.ScheduledStart > DateTime.UtcNow)
                .OrderBy(a => a.ScheduledStart)
                .FirstOrDefaultAsync();

            // Get pending PROM
            var pendingProm = await _context.PromInstances
                .Include(p => p.Template)
                .Where(p => p.PatientId == userId && p.Status == PromStatus.Pending)
                .OrderBy(p => p.DueDate)
                .FirstOrDefaultAsync();

            // Get today's check-in status
            var today = DateTime.UtcNow.Date;
            var todaysCheckIn = plan.CheckIns?.FirstOrDefault(c => c.Date.Date == today);
            var lastCheckIn = plan.CheckIns?.OrderByDescending(c => c.Date).FirstOrDefault();

            // Map today's exercises to TodayTaskDto
            var todaysTasks = todaysExercises.Select(e => {
                var todayCompletion = e.Completions?.FirstOrDefault(c => c.CompletedAt.Date == today);
                return new TodayTaskDto
                {
                    ExerciseId = e.Id.ToString(),
                    Name = e.Name,
                    Sets = e.Sets,
                    Reps = e.Reps,
                    HoldSeconds = e.HoldSeconds,
                    Instructions = e.Instructions,
                    Description = e.Description,
                    Category = e.Category,
                    BodyRegion = e.BodyRegion,
                    Difficulty = e.Difficulty.ToString(),
                    IsCompleted = todayCompletion != null,
                    CompletedAt = todayCompletion?.CompletedAt.ToString("o")
                };
            }).ToList();

            // Map phases to PatientPhaseDto
            var phaseDtos = (plan.Phases ?? new List<TreatmentPhase>()).Select(p => new PatientPhaseDto
            {
                PhaseNumber = p.PhaseNumber,
                Name = p.Name,
                Description = p.Description,
                DurationWeeks = p.DurationWeeks,
                Goals = p.Goals ?? new List<string>(),
                Status = p.Status.ToString(),
                StartDate = p.StartDate != default ? p.StartDate.ToString("o") : null,
                EndDate = p.EndDate?.ToString("o"),
                SessionsPerWeek = p.SessionsPerWeek,
                PhaseProgressPercentage = p.PhaseProgressPercentage,
                Exercises = (p.Exercises ?? new List<Exercise>()).Select(e => new PatientExerciseDto
                {
                    Id = e.Id.ToString(),
                    Name = e.Name,
                    Description = e.Description,
                    Instructions = e.Instructions,
                    Sets = e.Sets,
                    Reps = e.Reps,
                    HoldSeconds = e.HoldSeconds,
                    Frequency = e.Frequency,
                    Category = e.Category,
                    BodyRegion = e.BodyRegion,
                    Difficulty = e.Difficulty.ToString(),
                    VideoUrl = e.VideoUrl,
                    ImageUrl = e.ThumbnailUrl
                }).ToList()
            }).ToList();

            // Map milestones to PatientMilestoneDto
            var milestoneDtos = (plan.Milestones ?? new List<TreatmentMilestone>()).Select(m => new PatientMilestoneDto
            {
                Id = m.Id.ToString(),
                Type = m.Type.ToString(),
                Title = m.Title,
                Description = m.Description,
                TargetDate = null, // Milestones don't have target dates in this model
                AchievedDate = m.CompletedAt?.ToString("o"),
                IsAchieved = m.IsCompleted,
                PointsAwarded = m.PointsAwarded,
                Icon = GetMilestoneIcon(m.Type)
            }).ToList();

            // Calculate estimated end date
            var estimatedEndDate = plan.StartDate.AddDays(plan.DurationWeeks * 7);

            return Ok(new PatientTreatmentPlanView
            {
                Id = plan.Id,
                Title = plan.Title,
                Diagnosis = plan.Diagnosis,
                PatientName = $"{plan.Patient?.FirstName} {plan.Patient?.LastName}".Trim(),
                Status = plan.Status.ToString(),
                StartDate = plan.StartDate.ToString("o"),
                EstimatedEndDate = estimatedEndDate.ToString("o"),
                OverallProgress = plan.ProgressPercentage,
                CurrentPhase = currentPhase?.PhaseNumber ?? 1,
                TotalPhases = plan.Phases?.Count ?? 0,
                CompletedSessions = plan.CompletedSessions,
                TotalSessions = plan.TotalSessions,
                CurrentWeek = plan.CurrentWeek,
                TotalWeeks = plan.DurationWeeks,
                CurrentStreak = plan.ExerciseStreak,
                TotalPoints = plan.PointsEarned,
                TodaysTasks = todaysTasks,
                Phases = phaseDtos,
                Milestones = milestoneDtos,
                CheckInStatus = new CheckInStatusDto
                {
                    HasCheckedInToday = todaysCheckIn != null,
                    LastCheckIn = lastCheckIn != null ? new LastCheckInDto
                    {
                        PainLevel = lastCheckIn.PainLevel,
                        Mood = lastCheckIn.Mood,
                        Notes = lastCheckIn.Notes,
                        Date = lastCheckIn.Date.ToString("o")
                    } : null
                },
                NextAppointment = nextAppointment != null ? new AppointmentSummary
                {
                    Id = nextAppointment.Id,
                    ScheduledStart = nextAppointment.ScheduledStart,
                    AppointmentType = nextAppointment.AppointmentType
                } : null,
                PendingProm = pendingProm != null ? new PromInstanceSummary
                {
                    Id = pendingProm.Id,
                    TemplateName = pendingProm.Template?.Name ?? "Assessment",
                    DueDate = pendingProm.DueDate
                } : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting treatment plan for user");
            return StatusCode(500, new { message = "Error loading treatment plan", error = ex.Message });
        }
    }

    /// <summary>
    /// Get milestones for a treatment plan
    /// </summary>
    [HttpGet("{id}/milestones")]
    [Authorize]
    public async Task<IActionResult> GetMilestones(Guid id)
    {
        var tenantId = CurrentTenantId;
        if (tenantId == null || tenantId == Guid.Empty)
            return BadRequest(new { message = "Tenant context required" });

        var plan = await _context.TreatmentPlans
            .Where(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null)
            .FirstOrDefaultAsync();

        if (plan == null)
            return NotFound();

        return Ok(plan.Milestones);
    }

    /// <summary>
    /// Submit a daily check-in for a treatment plan (patient endpoint)
    /// </summary>
    [HttpPost("{id}/check-in")]
    [Authorize]
    public async Task<IActionResult> SubmitCheckIn(Guid id, [FromBody] DailyCheckInRequest request)
    {
        var tenantId = CurrentTenantId;
        if (tenantId == null || tenantId == Guid.Empty)
            return BadRequest(new { message = "Tenant context required" });
        var userId = CurrentUserId;

        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.PatientId == userId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        var result = await _schedulingService.RecordCheckInAsync(id, request);

        if (!result)
            return BadRequest(new { error = "Failed to record check-in" });

        return Ok(new { message = "Check-in recorded successfully", streak = plan.ExerciseStreak, points = plan.PointsEarned });
    }

    /// <summary>
    /// Get treatment progress data for the Health Progress page
    /// </summary>
    [HttpGet("progress")]
    [Authorize]
    public async Task<IActionResult> GetTreatmentProgress()
    {
        try
        {
            var userId = CurrentUserId;

            var progress = await _schedulingService.GetTreatmentProgressAsync(userId);

            if (progress == null)
                return Ok(new { hasPlan = false, message = "No active treatment plan found" });

            return Ok(new { hasPlan = true, progress });
        }
        catch (Exception ex)
        {
            return Ok(new { hasPlan = false, message = "Error loading progress", error = ex.Message });
        }
    }

    /// <summary>
    /// Manually schedule appointments for a treatment plan
    /// </summary>
    [HttpPost("{id}/schedule-appointments")]
    public async Task<IActionResult> ScheduleAppointments(Guid id)
    {
        var tenantId = RequireTenantId();

        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        var appointments = await _schedulingService.ScheduleAppointmentsAsync(id);

        return Ok(new { message = $"Scheduled {appointments.Count} appointments", appointments });
    }

    /// <summary>
    /// Manually schedule PROMs for a treatment plan
    /// </summary>
    [HttpPost("{id}/schedule-proms")]
    public async Task<IActionResult> ScheduleProms(Guid id)
    {
        var tenantId = RequireTenantId();

        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        var proms = await _schedulingService.SchedulePromsAsync(id);

        return Ok(new { message = $"Scheduled {proms.Count} PROMs", proms });
    }

    /// <summary>
    /// Advance the treatment plan to the next phase
    /// </summary>
    [HttpPost("{id}/advance-phase")]
    public async Task<IActionResult> AdvancePhase(Guid id)
    {
        var tenantId = RequireTenantId();

        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && t.DeletedAt == null);

        if (plan == null)
            return NotFound();

        var result = await _schedulingService.AdvanceToNextPhaseAsync(id);

        if (!result)
            return BadRequest(new { error = "Failed to advance phase" });

        // Reload to get updated state
        await _context.Entry(plan).ReloadAsync();

        return Ok(new { message = "Advanced to next phase", currentPhase = plan.Phases.FirstOrDefault(p => p.Status == PhaseStatus.InProgress) });
    }

    #endregion

    #region Exercise Library

    /// <summary>
    /// Get all exercise templates (system + tenant-specific)
    /// </summary>
    [HttpGet("exercises")]
    public async Task<IActionResult> GetExerciseLibrary(
        [FromQuery] string? category,
        [FromQuery] string? bodyRegion,
        [FromQuery] string? difficulty,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var tenantId = RequireTenantId();

        var query = _context.ExerciseTemplates
            .Where(e => e.IsActive && (e.IsSystemExercise || e.TenantId == tenantId))
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(e => e.Category == category);

        if (!string.IsNullOrEmpty(bodyRegion))
            query = query.Where(e => e.BodyRegion == bodyRegion);

        if (!string.IsNullOrEmpty(difficulty) && Enum.TryParse<DifficultyLevel>(difficulty, true, out var diffLevel))
            query = query.Where(e => e.Difficulty == diffLevel);

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(e =>
                e.Name.ToLower().Contains(searchLower) ||
                (e.Description != null && e.Description.ToLower().Contains(searchLower)));
        }

        var totalCount = await query.CountAsync();
        var exercises = await query
            .OrderBy(e => e.SortOrder)
            .ThenBy(e => e.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ExerciseTemplateDto
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                Instructions = e.Instructions,
                DefaultSets = e.DefaultSets,
                DefaultReps = e.DefaultReps,
                DefaultHoldSeconds = e.DefaultHoldSeconds,
                DefaultFrequency = e.DefaultFrequency,
                VideoUrl = e.VideoUrl,
                ThumbnailUrl = e.ThumbnailUrl,
                ImageUrl = e.ImageUrl,
                Category = e.Category,
                BodyRegion = e.BodyRegion,
                Difficulty = e.Difficulty.ToString(),
                TargetConditions = e.TargetConditions,
                Contraindications = e.Contraindications,
                Equipment = e.Equipment,
                Tags = e.Tags,
                IsSystemExercise = e.IsSystemExercise
            })
            .ToListAsync();

        return Ok(new
        {
            data = exercises,
            pagination = new
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }
        });
    }

    /// <summary>
    /// Get exercise template by ID
    /// </summary>
    [HttpGet("exercises/{id}")]
    public async Task<IActionResult> GetExerciseTemplate(Guid id)
    {
        var tenantId = RequireTenantId();

        var exercise = await _context.ExerciseTemplates
            .Where(e => e.Id == id && e.IsActive && (e.IsSystemExercise || e.TenantId == tenantId))
            .Select(e => new ExerciseTemplateDto
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                Instructions = e.Instructions,
                DefaultSets = e.DefaultSets,
                DefaultReps = e.DefaultReps,
                DefaultHoldSeconds = e.DefaultHoldSeconds,
                DefaultFrequency = e.DefaultFrequency,
                VideoUrl = e.VideoUrl,
                ThumbnailUrl = e.ThumbnailUrl,
                ImageUrl = e.ImageUrl,
                Category = e.Category,
                BodyRegion = e.BodyRegion,
                Difficulty = e.Difficulty.ToString(),
                TargetConditions = e.TargetConditions,
                Contraindications = e.Contraindications,
                Equipment = e.Equipment,
                Tags = e.Tags,
                IsSystemExercise = e.IsSystemExercise
            })
            .FirstOrDefaultAsync();

        if (exercise == null)
            return NotFound();

        return Ok(exercise);
    }

    /// <summary>
    /// Get available categories and body regions for filtering
    /// </summary>
    [HttpGet("exercises/filters")]
    public async Task<IActionResult> GetExerciseFilters()
    {
        var tenantId = RequireTenantId();

        var categories = await _context.ExerciseTemplates
            .Where(e => e.IsActive && (e.IsSystemExercise || e.TenantId == tenantId))
            .Select(e => e.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        var bodyRegions = await _context.ExerciseTemplates
            .Where(e => e.IsActive && (e.IsSystemExercise || e.TenantId == tenantId))
            .Select(e => e.BodyRegion)
            .Distinct()
            .OrderBy(r => r)
            .ToListAsync();

        return Ok(new
        {
            categories,
            bodyRegions,
            difficulties = Enum.GetNames<DifficultyLevel>()
        });
    }

    /// <summary>
    /// Create a custom exercise template (tenant-specific)
    /// </summary>
    [HttpPost("exercises")]
    public async Task<IActionResult> CreateExerciseTemplate([FromBody] CreateExerciseTemplateRequest request)
    {
        var tenantId = RequireTenantId();

        var exercise = new ExerciseTemplate
        {
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            Instructions = request.Instructions,
            DefaultSets = request.DefaultSets ?? 3,
            DefaultReps = request.DefaultReps ?? 10,
            DefaultHoldSeconds = request.DefaultHoldSeconds,
            DefaultFrequency = request.DefaultFrequency ?? "Daily",
            VideoUrl = request.VideoUrl,
            ThumbnailUrl = request.ThumbnailUrl,
            ImageUrl = request.ImageUrl,
            Category = request.Category,
            BodyRegion = request.BodyRegion,
            Difficulty = Enum.TryParse<DifficultyLevel>(request.Difficulty, true, out var diff)
                ? diff : DifficultyLevel.Beginner,
            TargetConditions = request.TargetConditions ?? new List<string>(),
            Contraindications = request.Contraindications ?? new List<string>(),
            Equipment = request.Equipment ?? new List<string>(),
            Tags = request.Tags ?? new List<string>(),
            IsSystemExercise = false,
            IsActive = true
        };

        _context.ExerciseTemplates.Add(exercise);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetExerciseTemplate), new { id = exercise.Id }, new { id = exercise.Id });
    }

    #endregion

    #region Helper Methods

    private void UpdatePlanProgress(TreatmentPlan plan)
    {
        if (plan.TotalSessions > 0)
        {
            plan.ProgressPercentage = (decimal)plan.CompletedSessions / plan.TotalSessions * 100;
        }

        // Update current week
        var daysSinceStart = (DateTime.UtcNow - plan.StartDate).Days;
        plan.CurrentWeek = Math.Max(1, (daysSinceStart / 7) + 1);

        // Check if phase should transition
        UpdatePhaseStatus(plan);
    }

    private void UpdatePhaseStatus(TreatmentPlan plan)
    {
        var currentPhase = plan.Phases.FirstOrDefault(p => p.Status == PhaseStatus.InProgress);
        if (currentPhase == null) return;

        // Check if current phase is complete based on time
        if (currentPhase.EndDate.HasValue && DateTime.UtcNow > currentPhase.EndDate.Value)
        {
            currentPhase.Status = PhaseStatus.Completed;

            // Start next phase
            var nextPhase = plan.Phases.FirstOrDefault(p => p.PhaseNumber == currentPhase.PhaseNumber + 1);
            if (nextPhase != null)
            {
                nextPhase.Status = PhaseStatus.InProgress;
            }
        }
    }

    private void UpdateExerciseStreak(TreatmentPlan plan)
    {
        // Check if there was exercise completion yesterday
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var hadCompletionYesterday = plan.Phases
            .SelectMany(p => p.Exercises)
            .Concat(plan.Exercises)
            .SelectMany(e => e.Completions)
            .Any(c => c.CompletedAt.Date == yesterday);

        if (hadCompletionYesterday)
        {
            plan.ExerciseStreak++;
        }
        else
        {
            // Check if today is the first completion
            var todayCompletions = plan.Phases
                .SelectMany(p => p.Exercises)
                .Concat(plan.Exercises)
                .SelectMany(e => e.Completions)
                .Count(c => c.CompletedAt.Date == DateTime.UtcNow.Date);

            plan.ExerciseStreak = todayCompletions > 0 ? 1 : 0;
        }
    }

    private void CheckAndUpdateMilestones(TreatmentPlan plan)
    {
        foreach (var milestone in plan.Milestones.Where(m => !m.IsCompleted))
        {
            var currentValue = milestone.Type switch
            {
                MilestoneType.SessionCount => plan.CompletedSessions,
                MilestoneType.WeekComplete => plan.CurrentWeek,
                MilestoneType.ExerciseStreak => plan.ExerciseStreak,
                MilestoneType.PhaseComplete => plan.Phases.Count(p => p.Status == PhaseStatus.Completed),
                _ => milestone.CurrentValue
            };

            milestone.CurrentValue = currentValue;

            if (currentValue >= milestone.TargetValue)
            {
                milestone.IsCompleted = true;
                milestone.CompletedAt = DateTime.UtcNow;
                plan.PointsEarned += milestone.PointsAwarded;
            }
        }
    }

    private bool ShouldDoExerciseToday(Exercise exercise)
    {
        // Simple logic for weekly exercises
        var freq = exercise.Frequency?.ToLower() ?? "";
        if (freq.Contains("3x") || freq.Contains("3 times"))
        {
            return DateTime.UtcNow.DayOfWeek is DayOfWeek.Monday or DayOfWeek.Wednesday or DayOfWeek.Friday;
        }
        if (freq.Contains("2x") || freq.Contains("2 times"))
        {
            return DateTime.UtcNow.DayOfWeek is DayOfWeek.Tuesday or DayOfWeek.Thursday;
        }
        return true; // Default to daily
    }

    private static string GetMilestoneIcon(MilestoneType type)
    {
        return type switch
        {
            MilestoneType.SessionCount => "calendar",
            MilestoneType.PainReduction => "heart",
            MilestoneType.PromImprovement => "trending-up",
            MilestoneType.PhaseComplete => "flag",
            MilestoneType.ExerciseStreak => "flame",
            MilestoneType.WeekComplete => "check-circle",
            _ => "star"
        };
    }

    #endregion
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

    // Phase-based fields (for AI-generated plans)
    public List<TreatmentPhase>? Phases { get; set; }
    public string? AiGeneratedSummary { get; set; }
    public string? AiRationale { get; set; }
    public double? AiConfidence { get; set; }
    public Guid? SourceEvaluationId { get; set; }

    // Research partner device tracking
    public Guid? LinkedDeviceId { get; set; }
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

public class GenerateTreatmentPlanRequest
{
    public Guid PatientId { get; set; }
    public Guid? EvaluationId { get; set; }
    public int? PreferredDurationWeeks { get; set; }
    public int? SessionsPerWeek { get; set; }
    public List<string>? FocusAreas { get; set; }
    public List<string>? Contraindications { get; set; }
}

public class SessionCompletionRequest
{
    public int? PainLevelAfter { get; set; }
    public string? Notes { get; set; }
    public Guid? AppointmentId { get; set; }
}

public class ExerciseCompletionRequest
{
    public int? PainLevelBefore { get; set; }
    public int? PainLevelAfter { get; set; }
    public string? Notes { get; set; }
    public int? SetsCompleted { get; set; }
    public int? RepsCompleted { get; set; }
}

public class PatientTreatmentPlanView
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? Diagnosis { get; set; }
    public string PatientName { get; set; } = "";
    public string Status { get; set; } = "";
    public string StartDate { get; set; } = "";
    public string? EstimatedEndDate { get; set; }
    public decimal OverallProgress { get; set; }
    public int CurrentPhase { get; set; }
    public int TotalPhases { get; set; }
    public int CompletedSessions { get; set; }
    public int TotalSessions { get; set; }
    public int CurrentWeek { get; set; }
    public int TotalWeeks { get; set; }
    public int CurrentStreak { get; set; }
    public int TotalPoints { get; set; }
    public List<TodayTaskDto> TodaysTasks { get; set; } = new();
    public List<PatientPhaseDto> Phases { get; set; } = new();
    public List<PatientMilestoneDto> Milestones { get; set; } = new();
    public CheckInStatusDto CheckInStatus { get; set; } = new();
    public AppointmentSummary? NextAppointment { get; set; }
    public PromInstanceSummary? PendingProm { get; set; }
}

public class TodayTaskDto
{
    public string ExerciseId { get; set; } = "";
    public string Name { get; set; } = "";
    public int Sets { get; set; }
    public int Reps { get; set; }
    public int? HoldSeconds { get; set; }
    public string? Instructions { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public string? Difficulty { get; set; }
    public bool IsCompleted { get; set; }
    public string? CompletedAt { get; set; }
}

public class PatientPhaseDto
{
    public int PhaseNumber { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int DurationWeeks { get; set; }
    public List<string> Goals { get; set; } = new();
    public string Status { get; set; } = "NotStarted";
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public List<PatientExerciseDto> Exercises { get; set; } = new();
    public int SessionsPerWeek { get; set; }
    public decimal PhaseProgressPercentage { get; set; }
}

public class PatientExerciseDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public int Sets { get; set; }
    public int Reps { get; set; }
    public int? HoldSeconds { get; set; }
    public string? Frequency { get; set; }
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public string? Difficulty { get; set; }
    public string? VideoUrl { get; set; }
    public string? ImageUrl { get; set; }
}

public class PatientMilestoneDto
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? TargetDate { get; set; }
    public string? AchievedDate { get; set; }
    public bool IsAchieved { get; set; }
    public int PointsAwarded { get; set; }
    public string? Icon { get; set; }
}

public class CheckInStatusDto
{
    public bool HasCheckedInToday { get; set; }
    public LastCheckInDto? LastCheckIn { get; set; }
}

public class LastCheckInDto
{
    public int PainLevel { get; set; }
    public int Mood { get; set; }
    public string? Notes { get; set; }
    public string Date { get; set; } = "";
}

public class TreatmentPhaseView
{
    public int PhaseNumber { get; set; }
    public string Name { get; set; } = "";
    public List<string> Goals { get; set; } = new();
    public decimal ProgressPercentage { get; set; }
}

public class AppointmentSummary
{
    public Guid Id { get; set; }
    public DateTime ScheduledStart { get; set; }
    public string? AppointmentType { get; set; }
}

public class PromInstanceSummary
{
    public Guid Id { get; set; }
    public string TemplateName { get; set; } = "";
    public DateTime DueDate { get; set; }
}

public class ExerciseTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public int DefaultSets { get; set; }
    public int DefaultReps { get; set; }
    public int? DefaultHoldSeconds { get; set; }
    public string? DefaultFrequency { get; set; }
    public string? VideoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = "";
    public string BodyRegion { get; set; } = "";
    public string Difficulty { get; set; } = "";
    public List<string> TargetConditions { get; set; } = new();
    public List<string> Contraindications { get; set; } = new();
    public List<string> Equipment { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public bool IsSystemExercise { get; set; }
}

public class CreateExerciseTemplateRequest
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public int? DefaultSets { get; set; }
    public int? DefaultReps { get; set; }
    public int? DefaultHoldSeconds { get; set; }
    public string? DefaultFrequency { get; set; }
    public string? VideoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = "";
    public string BodyRegion { get; set; } = "";
    public string? Difficulty { get; set; }
    public List<string>? TargetConditions { get; set; }
    public List<string>? Contraindications { get; set; }
    public List<string>? Equipment { get; set; }
    public List<string>? Tags { get; set; }
}

public class TreatmentPlanListDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? Diagnosis { get; set; }
    public string? Goals { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int DurationWeeks { get; set; }
    public TreatmentPlanStatus Status { get; set; }
    public decimal ProgressPercentage { get; set; }
    public int CompletedSessions { get; set; }
    public int TotalSessions { get; set; }
    public int CurrentWeek { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = "";
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewDate { get; set; }
}

public class TreatmentPlanDetailDto : TreatmentPlanListDto
{
    public int ExerciseStreak { get; set; }
    public int PointsEarned { get; set; }
    public string? Notes { get; set; }
    public List<TreatmentSession> Sessions { get; set; } = new();
    public List<Exercise> Exercises { get; set; } = new();
    public List<TreatmentPhase> Phases { get; set; } = new();
    public List<TreatmentMilestone> Milestones { get; set; } = new();
    public TreatmentPlanPromConfig? PromConfig { get; set; }
    public string? AiGeneratedSummary { get; set; }
    public double? AiConfidence { get; set; }
    public string? AiRationale { get; set; }
    public DateTime? AiGeneratedAt { get; set; }
    public PatientSummaryDto? Patient { get; set; }
}

public class PatientSummaryDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
}
