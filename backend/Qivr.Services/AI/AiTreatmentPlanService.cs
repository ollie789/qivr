using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services.AI;

public interface IAiTreatmentPlanService
{
    Task<GeneratedTreatmentPlan> GeneratePlanAsync(TreatmentPlanGenerationRequest request);
    Task<List<Exercise>> SuggestExercisesAsync(ExerciseSuggestionRequest request);
    Task<TreatmentPlanAdjustment> SuggestAdjustmentsAsync(TreatmentPlanAdjustmentRequest request);
    TreatmentPlan ConvertToTreatmentPlan(GeneratedTreatmentPlan generated, TreatmentPlanGenerationRequest request);
}

public class AiTreatmentPlanService : IAiTreatmentPlanService
{
    private readonly ILogger<AiTreatmentPlanService> _logger;
    private readonly IBedrockService _bedrockService;
    private readonly IDeIdentificationService _deIdentificationService;
    private readonly QivrDbContext _dbContext;

    public AiTreatmentPlanService(
        ILogger<AiTreatmentPlanService> logger,
        IBedrockService bedrockService,
        IDeIdentificationService deIdentificationService,
        QivrDbContext dbContext)
    {
        _logger = logger;
        _bedrockService = bedrockService;
        _deIdentificationService = deIdentificationService;
        _dbContext = dbContext;
    }

    public async Task<GeneratedTreatmentPlan> GeneratePlanAsync(TreatmentPlanGenerationRequest request)
    {
        try
        {
            _logger.LogInformation("Starting treatment plan generation for patient {PatientId}", request.PatientId);
            
            // Fetch additional data if not provided
            await EnrichRequestData(request);
            _logger.LogInformation("Enriched request data. Has evaluation: {HasEval}", request.Evaluation != null);

            // De-identify sensitive data before sending to AI
            var deidentifiedData = await DeIdentifyPatientData(request);
            _logger.LogInformation("De-identified patient data");

            // Build the prompt
            var prompt = BuildGenerationPrompt(request, deidentifiedData);
            _logger.LogInformation("Built prompt, length: {Length}", prompt.Length);

            var systemPrompt = @"You are an expert physiotherapist with extensive experience in creating evidence-based rehabilitation treatment plans.

Your role is to create comprehensive, personalized treatment plans based on:
- Patient evaluations and pain assessments
- Medical history and contraindications
- PROM (Patient Reported Outcome Measures) scores
- Current pain levels and affected body regions

Guidelines:
1. Create phased treatment plans (typically 2-4 phases)
2. Start conservatively and progress based on expected recovery
3. Include specific, measurable goals for each phase
4. Prescribe appropriate exercises with clear instructions
5. Consider pain levels when selecting exercise intensity
6. Schedule appropriate PROMs to track progress
7. Include milestones to keep patients motivated
8. Account for any contraindications or limitations

Always provide evidence-based recommendations and avoid exercises that could worsen the patient's condition.";

            _logger.LogInformation("Calling Bedrock for treatment plan generation");
            var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
                prompt,
                systemPrompt,
                new BedrockModelOptions { Temperature = 0.2f, MaxTokens = 4000 }
            );
            _logger.LogInformation("Bedrock response received, parsing...");

            var generatedPlan = ParseGeneratedPlan(response.ParsedContent);

            _logger.LogInformation(
                "Generated treatment plan for patient with {PhaseCount} phases, {ExerciseCount} total exercises",
                generatedPlan.Phases.Count,
                generatedPlan.Phases.Sum(p => p.Exercises.Count));

            return generatedPlan;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating treatment plan for patient {PatientId}", request.PatientId);
            throw new TreatmentPlanGenerationException("Failed to generate treatment plan", ex);
        }
    }

    public async Task<List<Exercise>> SuggestExercisesAsync(ExerciseSuggestionRequest request)
    {
        try
        {
            var prompt = $@"
Suggest {request.MaxResults} physiotherapy exercises for the following:
- Body Region: {request.BodyRegion ?? "General"}
- Condition: {request.Condition ?? "General rehabilitation"}
- Difficulty Level: {request.Difficulty ?? "Beginner"}
{(request.ExcludeExercises?.Any() == true ? $"- Exclude: {string.Join(", ", request.ExcludeExercises)}" : "")}

Return JSON array with format:
[
  {{
    ""name"": ""Exercise name"",
    ""description"": ""Brief description"",
    ""instructions"": ""Step-by-step instructions"",
    ""sets"": 3,
    ""reps"": 10,
    ""holdSeconds"": null,
    ""frequency"": ""Daily"",
    ""category"": ""Stretching|Strengthening|Balance|Mobility"",
    ""bodyRegion"": ""Lower Back"",
    ""difficulty"": ""Beginner|Intermediate|Advanced""
  }}
]";

            var systemPrompt = @"You are a physiotherapy exercise expert. Suggest appropriate therapeutic exercises that are safe and effective for rehabilitation. Include clear, detailed instructions for each exercise.";

            var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
                prompt,
                systemPrompt,
                new BedrockModelOptions { Temperature = 0.3f }
            );

            return ParseExercises(response.ParsedContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error suggesting exercises");
            return new List<Exercise>();
        }
    }

    public async Task<TreatmentPlanAdjustment> SuggestAdjustmentsAsync(TreatmentPlanAdjustmentRequest request)
    {
        try
        {
            var plan = await _dbContext.TreatmentPlans
                .FirstOrDefaultAsync(p => p.Id == request.TreatmentPlanId);

            if (plan == null)
            {
                throw new InvalidOperationException($"Treatment plan {request.TreatmentPlanId} not found");
            }

            var prompt = $@"
Suggest adjustments to this treatment plan based on patient progress:

Current Plan:
- Title: {plan.Title}
- Diagnosis: {plan.Diagnosis}
- Current Week: {plan.CurrentWeek} of {plan.DurationWeeks}
- Progress: {plan.ProgressPercentage}%
- Completed Sessions: {plan.CompletedSessions}

Patient Status:
- Reason for Review: {request.Reason}
- Current Pain Level: {request.CurrentPainLevel}/10
- Current PROM Score: {request.CurrentPromScore}

Return JSON with format:
{{
  ""recommendation"": ""Continue|Modify|Pause|Progress"",
  ""suggestedChanges"": [""Change 1"", ""Change 2""],
  ""newExercises"": [...] or null,
  ""newSessionsPerWeek"": null or number,
  ""rationale"": ""Clinical reasoning""
}}";

            var systemPrompt = @"You are a physiotherapy expert reviewing treatment plan progress. Provide evidence-based recommendations for plan adjustments based on patient outcomes.";

            var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
                prompt,
                systemPrompt,
                new BedrockModelOptions { Temperature = 0.3f }
            );

            return ParseAdjustment(response.ParsedContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error suggesting treatment plan adjustments");
            throw;
        }
    }

    public TreatmentPlan ConvertToTreatmentPlan(GeneratedTreatmentPlan generated, TreatmentPlanGenerationRequest request)
    {
        var startDate = DateTime.UtcNow.Date;
        var phases = new List<TreatmentPhase>();
        var currentPhaseStart = startDate;

        foreach (var genPhase in generated.Phases)
        {
            var phase = new TreatmentPhase
            {
                Id = Guid.NewGuid().ToString(),
                PhaseNumber = genPhase.PhaseNumber,
                Name = genPhase.Name,
                Description = genPhase.Description,
                DurationWeeks = genPhase.DurationWeeks,
                StartDate = currentPhaseStart,
                EndDate = currentPhaseStart.AddDays(genPhase.DurationWeeks * 7),
                Status = genPhase.PhaseNumber == 1 ? PhaseStatus.InProgress : PhaseStatus.NotStarted,
                Goals = genPhase.Goals,
                SessionsPerWeek = genPhase.SessionsPerWeek,
                PromTemplateKey = genPhase.PromTemplateKey,
                Exercises = genPhase.Exercises.Select(e => new Exercise
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = e.Name,
                    Description = e.Description,
                    Instructions = e.Instructions,
                    Sets = e.Sets,
                    Reps = e.Reps,
                    HoldSeconds = e.HoldSeconds,
                    Frequency = e.Frequency,
                    Category = e.Category,
                    BodyRegion = e.BodyRegion,
                    Difficulty = ParseDifficulty(e.Difficulty)
                }).ToList()
            };

            phases.Add(phase);
            currentPhaseStart = phase.EndDate.Value;
        }

        var milestones = generated.Milestones.Select(m => new TreatmentMilestone
        {
            Id = Guid.NewGuid().ToString(),
            Title = m.Title,
            Description = m.Description,
            Type = ParseMilestoneType(m.Type),
            TargetValue = m.TargetValue,
            CurrentValue = 0,
            IsCompleted = false,
            PointsAwarded = m.PointsAwarded,
            Icon = GetMilestoneIcon(m.Type)
        }).ToList();

        // Calculate total sessions
        var totalSessions = phases.Sum(p => p.SessionsPerWeek * p.DurationWeeks);

        return new TreatmentPlan
        {
            PatientId = request.PatientId,
            ProviderId = request.ProviderId,
            TenantId = request.TenantId,
            Title = generated.Title,
            Diagnosis = generated.Diagnosis,
            Goals = string.Join("; ", phases.SelectMany(p => p.Goals).Take(5)),
            StartDate = startDate,
            EndDate = phases.LastOrDefault()?.EndDate ?? startDate.AddDays(generated.TotalDurationWeeks * 7),
            DurationWeeks = generated.TotalDurationWeeks,
            Status = TreatmentPlanStatus.Draft,
            Phases = phases,
            Milestones = milestones,
            TotalSessions = totalSessions,
            CompletedSessions = 0,
            ProgressPercentage = 0,
            CurrentWeek = 1,
            AiGeneratedSummary = generated.Summary,
            AiConfidence = generated.Confidence,
            AiGeneratedAt = DateTime.UtcNow,
            AiRationale = generated.Rationale,
            SourceEvaluationId = request.EvaluationId,
            PromConfig = generated.PromSchedule != null ? new TreatmentPlanPromConfig
            {
                AutoSchedule = generated.PromSchedule.AutoSchedule,
                DefaultIntervalWeeks = generated.PromSchedule.IntervalWeeks,
                PhasePromTemplates = phases
                    .Where(p => !string.IsNullOrEmpty(p.PromTemplateKey))
                    .ToDictionary(p => p.PhaseNumber, p => p.PromTemplateKey!)
            } : null
        };
    }

    #region Private Methods

    private async Task EnrichRequestData(TreatmentPlanGenerationRequest request)
    {
        // Fetch evaluation if ID provided but data not included
        if (request.EvaluationId.HasValue && request.Evaluation == null)
        {
            var evaluation = await _dbContext.Evaluations
                .Include(e => e.PainMaps)
                .FirstOrDefaultAsync(e => e.Id == request.EvaluationId);

            if (evaluation != null)
            {
                // Extract questionnaire data
                var q = evaluation.QuestionnaireResponses ?? new Dictionary<string, object>();
                
                request.Evaluation = new EvaluationDataForAi
                {
                    ChiefComplaint = evaluation.ChiefComplaint,
                    Symptoms = evaluation.Symptoms,
                    AiSummary = evaluation.AiSummary,
                    Duration = q.TryGetValue("duration", out var dur) ? dur?.ToString() : null,
                    Onset = q.TryGetValue("onset", out var onset) ? onset?.ToString() : null,
                    Pattern = q.TryGetValue("pattern", out var pat) ? pat?.ToString() : null,
                    AggravatingFactors = ExtractStringList(q, "aggravatingFactors"),
                    RelievingFactors = ExtractStringList(q, "relievingFactors"),
                    TreatmentGoals = q.TryGetValue("treatmentGoals", out var goals) ? goals?.ToString() : null
                };

                // Extract medical history from questionnaire
                request.MedicalHistory ??= new MedicalHistoryForAi
                {
                    Conditions = q.TryGetValue("medicalConditions", out var cond) ? cond?.ToString() : null,
                    Medications = q.TryGetValue("currentMedications", out var meds) ? meds?.ToString() : null,
                    Allergies = q.TryGetValue("allergies", out var allerg) ? allerg?.ToString() : null,
                    PreviousTreatments = q.TryGetValue("previousTreatments", out var prev) ? prev?.ToString() : null,
                    Surgeries = q.TryGetValue("surgeries", out var surg) ? surg?.ToString() : null
                };

                request.PainMaps = evaluation.PainMaps.Select(pm => new PainRegionForAi
                {
                    BodyRegion = pm.BodyRegion,
                    AnatomicalName = pm.AnatomicalCode,
                    Intensity = pm.PainIntensity,
                    PainType = pm.PainType,
                    PainQuality = pm.PainQuality
                }).ToList();
                
                _logger.LogInformation("Enriched from evaluation: complaint={Complaint}, painMaps={PainCount}, hasMedHistory={HasMed}",
                    evaluation.ChiefComplaint?.Substring(0, Math.Min(50, evaluation.ChiefComplaint?.Length ?? 0)),
                    request.PainMaps.Count,
                    request.MedicalHistory != null);
            }
        }

        // Fetch recent PROM history
        if (request.PromHistory == null)
        {
            var promResponses = await _dbContext.PromResponses
                .Where(r => r.PatientId == request.PatientId)
                .OrderByDescending(r => r.CompletedAt)
                .Take(5)
                .ToListAsync();

            request.PromHistory = promResponses.Select(r => new PromResponseSummary
            {
                PromType = r.PromType,
                Score = r.Score,
                Severity = r.Severity,
                CompletedAt = r.CompletedAt
            }).ToList();
            
            _logger.LogInformation("Found {PromCount} PROM responses for patient", request.PromHistory.Count);
        }
    }
    
    private List<string> ExtractStringList(Dictionary<string, object> dict, string key)
    {
        if (!dict.TryGetValue(key, out var value) || value == null)
            return new List<string>();
            
        if (value is List<string> list)
            return list;
            
        if (value is System.Text.Json.JsonElement jsonElement && jsonElement.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            return jsonElement.EnumerateArray()
                .Select(e => e.GetString() ?? "")
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList();
        }
        
        return new List<string>();
    }

    private async Task<DeidentifiedPatientData> DeIdentifyPatientData(TreatmentPlanGenerationRequest request)
    {
        var data = new DeidentifiedPatientData();

        if (request.Evaluation?.ChiefComplaint != null)
        {
            var result = await _deIdentificationService.DeIdentifyAsync(request.Evaluation.ChiefComplaint);
            data.ChiefComplaint = result.DeIdentifiedText;
        }

        if (request.Evaluation?.Symptoms?.Any() == true)
        {
            data.Symptoms = request.Evaluation.Symptoms;
        }
        
        // Copy evaluation data
        if (request.Evaluation != null)
        {
            data.Duration = request.Evaluation.Duration;
            data.Onset = request.Evaluation.Onset;
            data.AggravatingFactors = request.Evaluation.AggravatingFactors;
            data.RelievingFactors = request.Evaluation.RelievingFactors;
            data.TreatmentGoals = request.Evaluation.TreatmentGoals;
        }

        if (request.MedicalHistory != null)
        {
            data.MedicalConditions = request.MedicalHistory.Conditions;
            data.Medications = request.MedicalHistory.Medications;
            data.Allergies = request.MedicalHistory.Allergies;
            data.PreviousTreatments = request.MedicalHistory.PreviousTreatments;
            data.Age = request.MedicalHistory.Age;
        }

        data.PainRegions = request.PainMaps ?? new List<PainRegionForAi>();

        return data;
    }

    private string BuildGenerationPrompt(TreatmentPlanGenerationRequest request, DeidentifiedPatientData data)
    {
        var painSummary = data.PainRegions.Any()
            ? string.Join("\n", data.PainRegions.Select(p =>
                $"  - {p.BodyRegion}: {p.PainType ?? "unspecified"} pain, intensity {p.Intensity}/10, quality: {string.Join(", ", p.PainQuality)}"))
            : "  No specific pain regions documented";

        var promSummary = request.PromHistory?.Any() == true
            ? string.Join("\n", request.PromHistory.Select(p =>
                $"  - {p.PromType}: Score {p.Score}, Severity: {p.Severity} ({p.CompletedAt:MMM dd})"))
            : "  No prior PROM data available";

        return $@"
Generate a comprehensive physiotherapy treatment plan for this patient.

PATIENT DATA:
- Chief Complaint: {data.ChiefComplaint ?? "Not specified"}
- Symptoms: {(data.Symptoms.Any() ? string.Join(", ", data.Symptoms) : "Not specified")}
- Duration: {data.Duration ?? "Not specified"}
- Onset: {data.Onset ?? "Not specified"}
- Treatment Goals: {data.TreatmentGoals ?? "Not specified"}

PAIN ASSESSMENT:
{painSummary}

AGGRAVATING FACTORS: {(data.AggravatingFactors.Any() ? string.Join(", ", data.AggravatingFactors) : "Not specified")}
RELIEVING FACTORS: {(data.RelievingFactors.Any() ? string.Join(", ", data.RelievingFactors) : "Not specified")}

MEDICAL HISTORY:
- Conditions: {data.MedicalConditions ?? "None documented"}
- Medications: {data.Medications ?? "None documented"}
- Allergies: {data.Allergies ?? "None documented"}
- Previous Treatments: {data.PreviousTreatments ?? "None documented"}

PROM HISTORY:
{promSummary}

PREFERENCES:
- Preferred Duration: {request.PreferredDurationWeeks?.ToString() ?? "8-12"} weeks
- Sessions per Week: {request.SessionsPerWeek?.ToString() ?? "2-3"}
- Focus Areas: {(request.FocusAreas?.Any() == true ? string.Join(", ", request.FocusAreas) : "Based on assessment")}
- Contraindications: {(request.Contraindications?.Any() == true ? string.Join(", ", request.Contraindications) : "None specified")}

Return a JSON treatment plan with this structure:
{{
  ""title"": ""Descriptive plan title (e.g., 'Lower Back Rehabilitation Program')"",
  ""diagnosis"": ""Primary diagnosis based on evaluation"",
  ""summary"": ""Brief clinical summary (2-3 sentences)"",
  ""totalDurationWeeks"": 8,
  ""phases"": [
    {{
      ""phaseNumber"": 1,
      ""name"": ""Phase name (e.g., 'Acute Pain Management')"",
      ""description"": ""Phase description"",
      ""durationWeeks"": 2,
      ""goals"": [""Specific goal 1"", ""Specific goal 2""],
      ""sessionsPerWeek"": 2,
      ""exercises"": [
        {{
          ""name"": ""Exercise name"",
          ""description"": ""Brief description"",
          ""instructions"": ""Detailed step-by-step instructions"",
          ""sets"": 3,
          ""reps"": 10,
          ""holdSeconds"": null,
          ""frequency"": ""Daily"",
          ""category"": ""Stretching"",
          ""bodyRegion"": ""Lower Back"",
          ""difficulty"": ""Beginner""
        }}
      ],
      ""promTemplateKey"": ""ODI""
    }}
  ],
  ""milestones"": [
    {{
      ""title"": ""First Week Complete"",
      ""description"": ""Completed first week of treatment"",
      ""type"": ""WeekComplete"",
      ""targetValue"": 1,
      ""pointsAwarded"": 50
    }},
    {{
      ""title"": ""5 Sessions Done"",
      ""description"": ""Completed 5 treatment sessions"",
      ""type"": ""SessionCount"",
      ""targetValue"": 5,
      ""pointsAwarded"": 100
    }},
    {{
      ""title"": ""Pain Reduced"",
      ""description"": ""Pain level reduced by 2 points"",
      ""type"": ""PainReduction"",
      ""targetValue"": 2,
      ""pointsAwarded"": 150
    }}
  ],
  ""promSchedule"": {{
    ""autoSchedule"": true,
    ""intervalWeeks"": 2
  }},
  ""confidence"": 0.85,
  ""rationale"": ""Clinical reasoning for this treatment approach""
}}

PROM Template Keys available: PHQ-9 (depression), GAD-7 (anxiety), ODI (Oswestry Disability Index for back), NDI (Neck Disability Index), DASH (arm/shoulder), KOOS (knee), HOOS (hip), FAAM (ankle/foot).

Ensure:
1. Exercises progress in difficulty across phases
2. Goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
3. Include 3-6 exercises per phase
4. Include at least 4 milestones
5. Match PROM template to the condition being treated
";
    }

    private GeneratedTreatmentPlan ParseGeneratedPlan(Dictionary<string, object> content)
    {
        var plan = new GeneratedTreatmentPlan
        {
            Title = content.GetValueOrDefault("title")?.ToString() ?? "Treatment Plan",
            Diagnosis = content.GetValueOrDefault("diagnosis")?.ToString(),
            Summary = content.GetValueOrDefault("summary")?.ToString(),
            TotalDurationWeeks = Convert.ToInt32(content.GetValueOrDefault("totalDurationWeeks") ?? 8),
            Confidence = Convert.ToDouble(content.GetValueOrDefault("confidence") ?? 0.8),
            Rationale = content.GetValueOrDefault("rationale")?.ToString()
        };

        // Parse phases
        if (content.TryGetValue("phases", out var phasesObj) && phasesObj is JsonElement phasesElement)
        {
            plan.Phases = ParsePhases(phasesElement);
        }

        // Parse milestones
        if (content.TryGetValue("milestones", out var milestonesObj) && milestonesObj is JsonElement milestonesElement)
        {
            plan.Milestones = ParseMilestones(milestonesElement);
        }

        // Parse PROM schedule
        if (content.TryGetValue("promSchedule", out var promObj) && promObj is JsonElement promElement)
        {
            plan.PromSchedule = new GeneratedPromSchedule
            {
                AutoSchedule = promElement.TryGetProperty("autoSchedule", out var auto) && auto.GetBoolean(),
                IntervalWeeks = promElement.TryGetProperty("intervalWeeks", out var interval) ? interval.GetInt32() : 2
            };
        }

        return plan;
    }

    private List<GeneratedPhase> ParsePhases(JsonElement element)
    {
        var phases = new List<GeneratedPhase>();

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var phaseElement in element.EnumerateArray())
            {
                var phase = new GeneratedPhase
                {
                    PhaseNumber = phaseElement.TryGetProperty("phaseNumber", out var pn) ? pn.GetInt32() : phases.Count + 1,
                    Name = phaseElement.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
                    Description = phaseElement.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                    DurationWeeks = phaseElement.TryGetProperty("durationWeeks", out var dw) ? dw.GetInt32() : 2,
                    SessionsPerWeek = phaseElement.TryGetProperty("sessionsPerWeek", out var spw) ? spw.GetInt32() : 2,
                    PromTemplateKey = phaseElement.TryGetProperty("promTemplateKey", out var prom) ? prom.GetString() : null
                };

                // Parse goals
                if (phaseElement.TryGetProperty("goals", out var goalsElement) && goalsElement.ValueKind == JsonValueKind.Array)
                {
                    phase.Goals = goalsElement.EnumerateArray()
                        .Select(g => g.GetString() ?? "")
                        .Where(g => !string.IsNullOrEmpty(g))
                        .ToList();
                }

                // Parse exercises
                if (phaseElement.TryGetProperty("exercises", out var exercisesElement) && exercisesElement.ValueKind == JsonValueKind.Array)
                {
                    phase.Exercises = ParseExercisesFromJson(exercisesElement);
                }

                phases.Add(phase);
            }
        }

        return phases;
    }

    private List<GeneratedExercise> ParseExercisesFromJson(JsonElement element)
    {
        var exercises = new List<GeneratedExercise>();

        foreach (var ex in element.EnumerateArray())
        {
            exercises.Add(new GeneratedExercise
            {
                Name = ex.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
                Description = ex.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                Instructions = ex.TryGetProperty("instructions", out var inst) ? inst.GetString() : null,
                Sets = ex.TryGetProperty("sets", out var sets) ? sets.GetInt32() : 3,
                Reps = ex.TryGetProperty("reps", out var reps) ? reps.GetInt32() : 10,
                HoldSeconds = ex.TryGetProperty("holdSeconds", out var hold) && hold.ValueKind == JsonValueKind.Number ? hold.GetInt32() : null,
                Frequency = ex.TryGetProperty("frequency", out var freq) ? freq.GetString() : "Daily",
                Category = ex.TryGetProperty("category", out var cat) ? cat.GetString() : null,
                BodyRegion = ex.TryGetProperty("bodyRegion", out var region) ? region.GetString() : null,
                Difficulty = ex.TryGetProperty("difficulty", out var diff) ? diff.GetString() : "Beginner"
            });
        }

        return exercises;
    }

    private List<GeneratedMilestone> ParseMilestones(JsonElement element)
    {
        var milestones = new List<GeneratedMilestone>();

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var m in element.EnumerateArray())
            {
                milestones.Add(new GeneratedMilestone
                {
                    Title = m.TryGetProperty("title", out var title) ? title.GetString() ?? "" : "",
                    Description = m.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                    Type = m.TryGetProperty("type", out var type) ? type.GetString() ?? "SessionCount" : "SessionCount",
                    TargetValue = m.TryGetProperty("targetValue", out var target) ? target.GetInt32() : 1,
                    PointsAwarded = m.TryGetProperty("pointsAwarded", out var points) ? points.GetInt32() : 50
                });
            }
        }

        return milestones;
    }

    private List<Exercise> ParseExercises(Dictionary<string, object> content)
    {
        var exercises = new List<Exercise>();

        // The response might be an array at root level or nested
        if (content.TryGetValue("exercises", out var exercisesObj) && exercisesObj is JsonElement element)
        {
            foreach (var ex in element.EnumerateArray())
            {
                exercises.Add(new Exercise
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = ex.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
                    Description = ex.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                    Instructions = ex.TryGetProperty("instructions", out var inst) ? inst.GetString() : null,
                    Sets = ex.TryGetProperty("sets", out var sets) ? sets.GetInt32() : 3,
                    Reps = ex.TryGetProperty("reps", out var reps) ? reps.GetInt32() : 10,
                    HoldSeconds = ex.TryGetProperty("holdSeconds", out var hold) && hold.ValueKind == JsonValueKind.Number ? hold.GetInt32() : null,
                    Frequency = ex.TryGetProperty("frequency", out var freq) ? freq.GetString() : "Daily",
                    Category = ex.TryGetProperty("category", out var cat) ? cat.GetString() : null,
                    BodyRegion = ex.TryGetProperty("bodyRegion", out var region) ? region.GetString() : null,
                    Difficulty = ParseDifficulty(ex.TryGetProperty("difficulty", out var diff) ? diff.GetString() : "Beginner")
                });
            }
        }

        return exercises;
    }

    private TreatmentPlanAdjustment ParseAdjustment(Dictionary<string, object> content)
    {
        var adjustment = new TreatmentPlanAdjustment
        {
            Recommendation = content.GetValueOrDefault("recommendation")?.ToString() ?? "Continue",
            Rationale = content.GetValueOrDefault("rationale")?.ToString()
        };

        if (content.TryGetValue("suggestedChanges", out var changes) && changes is JsonElement changesElement)
        {
            adjustment.SuggestedChanges = changesElement.EnumerateArray()
                .Select(c => c.GetString() ?? "")
                .Where(c => !string.IsNullOrEmpty(c))
                .ToList();
        }

        if (content.TryGetValue("newSessionsPerWeek", out var sessions) && sessions is JsonElement sessionsElement
            && sessionsElement.ValueKind == JsonValueKind.Number)
        {
            adjustment.NewSessionsPerWeek = sessionsElement.GetInt32();
        }

        return adjustment;
    }

    private DifficultyLevel ParseDifficulty(string? difficulty)
    {
        return difficulty?.ToLower() switch
        {
            "intermediate" => DifficultyLevel.Intermediate,
            "advanced" => DifficultyLevel.Advanced,
            _ => DifficultyLevel.Beginner
        };
    }

    private MilestoneType ParseMilestoneType(string type)
    {
        return type switch
        {
            "SessionCount" => MilestoneType.SessionCount,
            "PainReduction" => MilestoneType.PainReduction,
            "PromImprovement" => MilestoneType.PromImprovement,
            "PhaseComplete" => MilestoneType.PhaseComplete,
            "ExerciseStreak" => MilestoneType.ExerciseStreak,
            "WeekComplete" => MilestoneType.WeekComplete,
            _ => MilestoneType.SessionCount
        };
    }

    private string GetMilestoneIcon(string type)
    {
        return type switch
        {
            "SessionCount" => "CheckCircle",
            "PainReduction" => "TrendingDown",
            "PromImprovement" => "TrendingUp",
            "PhaseComplete" => "Flag",
            "ExerciseStreak" => "LocalFireDepartment",
            "WeekComplete" => "CalendarMonth",
            _ => "Star"
        };
    }

    #endregion
}

#region Helper Classes

internal class DeidentifiedPatientData
{
    public string? ChiefComplaint { get; set; }
    public List<string> Symptoms { get; set; } = new();
    public List<PainRegionForAi> PainRegions { get; set; } = new();
    public string? MedicalConditions { get; set; }
    public string? Medications { get; set; }
    public string? Allergies { get; set; }
    public string? PreviousTreatments { get; set; }
    public string? Duration { get; set; }
    public string? Onset { get; set; }
    public List<string> AggravatingFactors { get; set; } = new();
    public List<string> RelievingFactors { get; set; } = new();
    public string? TreatmentGoals { get; set; }
    public int? Age { get; set; }
}

#endregion

#region Exceptions

public class TreatmentPlanGenerationException : Exception
{
    public TreatmentPlanGenerationException(string message) : base(message) { }
    public TreatmentPlanGenerationException(string message, Exception innerException) : base(message, innerException) { }
}

#endregion
