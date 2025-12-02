using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services.AI;

/// <summary>
/// AI-powered triage service for patient symptom analysis and risk detection
/// </summary>
public interface IAiTriageService
{
    Task<TriageSummary> GenerateTriageSummaryAsync(Guid patientId, TriageRequest request);
    Task<List<RiskFlag>> DetectRiskFlagsAsync(TriageData data);
    Task<UrgencyAssessment> AssessUrgencyAsync(TriageData data);
    Task<NextStepGuidance> GenerateNextStepsAsync(TriageSummary summary);
    Task<ClinicianReview> SubmitForClinicianReviewAsync(TriageSummary summary);
}

public class AiTriageService : IAiTriageService
{
    private readonly ILogger<AiTriageService> _logger;
    private readonly IBedrockService _bedrockService;
    private readonly IDeIdentificationService _deIdentificationService;
    private readonly QivrDbContext _dbContext;

    // Critical symptoms that always trigger high priority
    private readonly HashSet<string> _criticalSymptoms = new()
    {
        "chest pain", "difficulty breathing", "severe bleeding", "unconscious",
        "stroke symptoms", "severe allergic reaction", "suicidal thoughts",
        "severe head injury", "seizure", "severe burns", "poisoning",
        "severe abdominal pain", "signs of heart attack", "severe trauma"
    };

    // Red flag conditions requiring immediate attention
    private readonly Dictionary<string, List<string>> _redFlagConditions = new()
    {
        ["cardiac"] = new() { "chest pain", "shortness of breath", "irregular heartbeat", "left arm pain", "jaw pain" },
        ["neurological"] = new() { "sudden confusion", "difficulty speaking", "vision loss", "severe headache", "weakness", "numbness" },
        ["respiratory"] = new() { "difficulty breathing", "wheezing", "blue lips", "persistent cough with blood" },
        ["abdominal"] = new() { "severe pain", "rigid abdomen", "blood in stool", "persistent vomiting" },
        ["mental_health"] = new() { "suicidal ideation", "homicidal thoughts", "severe depression", "psychosis", "mania" }
    };

    public AiTriageService(
        ILogger<AiTriageService> logger,
        IBedrockService bedrockService,
        IDeIdentificationService deIdentificationService,
        QivrDbContext dbContext)
    {
        _logger = logger;
        _bedrockService = bedrockService;
        _deIdentificationService = deIdentificationService;
        _dbContext = dbContext;
    }

    public async Task<TriageSummary> GenerateTriageSummaryAsync(Guid patientId, TriageRequest request)
    {
        // Track if AI processing succeeded
        bool aiProcessingSucceeded = true;
        string? aiFailureReason = null;

        try
        {
            // De-identify patient data before AI processing
            var deidentifiedSymptoms = await _deIdentificationService.DeIdentifyAsync(
                request.Symptoms,
                new DeIdentificationOptions { EnableReIdentification = true, UseAiDetection = true }
            );

            var deidentifiedHistory = request.MedicalHistory != null
                ? await _deIdentificationService.DeIdentifyAsync(request.MedicalHistory,
                    new DeIdentificationOptions { UseAiDetection = true })
                : null;

            // De-identify medications to prevent PHI leakage via rare drug names
            // Convert brand names to generic class where possible
            var sanitizedMedications = SanitizeMedications(request.CurrentMedications);

            // Create triage data object with de-identified data
            var triageData = new TriageData
            {
                PatientId = patientId,
                Symptoms = deidentifiedSymptoms.DeIdentifiedText ?? "",
                MedicalHistory = deidentifiedHistory?.DeIdentifiedText,
                VitalSigns = request.VitalSigns,
                Duration = request.Duration,
                Severity = request.Severity,
                Medications = sanitizedMedications,
                Allergies = SanitizeAllergies(request.Allergies), // Also sanitize allergies
                Age = request.Age,
                Timestamp = DateTime.UtcNow
            };

            // Initialize with fallback values
            AiTriageSummaryResult aiSummary;
            List<RiskFlag> riskFlags;
            UrgencyAssessment urgency;

            // Attempt AI triage with fallback handling
            try
            {
                aiSummary = await GenerateAiTriageSummary(triageData);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI triage summary generation failed, using fallback");
                aiProcessingSucceeded = false;
                aiFailureReason = "AI summary generation failed";
                aiSummary = CreateFallbackAiSummary(triageData);
            }

            // Detect risk flags - use rule-based even if AI fails
            try
            {
                riskFlags = await DetectRiskFlagsAsync(triageData);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Risk flag detection failed, using rule-based only");
                riskFlags = DetectRuleBasedRiskFlags(triageData);
            }

            // Assess urgency with fallback
            try
            {
                urgency = await AssessUrgencyAsync(triageData);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI urgency assessment failed, using rule-based");
                aiProcessingSucceeded = false;
                aiFailureReason ??= "AI urgency assessment failed";
                urgency = CreateFallbackUrgencyAssessment(triageData, riskFlags);
            }

            // Create comprehensive triage summary
            var summary = new TriageSummary
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                RequestId = request.Id,
                ChiefComplaint = aiSummary.ChiefComplaint,
                SummaryText = aiSummary.Summary,
                SymptomAnalysis = aiSummary.SymptomAnalysis,
                RiskFlags = riskFlags,
                UrgencyLevel = urgency.Level,
                UrgencyScore = urgency.Score,
                UrgencyRationale = urgency.Rationale,
                RecommendedTimeframe = urgency.RecommendedTimeframe,
                PossibleConditions = aiSummary.PossibleConditions,
                // Mark for clinician review if AI failed OR if high risk detected
                RequiresClinicianReview = !aiProcessingSucceeded ||
                                        riskFlags.Any(r => r.Severity == RiskSeverity.Critical) ||
                                        urgency.Level.ToLower() == "urgent",
                GeneratedAt = DateTime.UtcNow,
                DeIdentificationMappingId = deidentifiedSymptoms.MappingId,
                Confidence = aiProcessingSucceeded ? aiSummary.Confidence : 0.0,
                AiProcessingStatus = aiProcessingSucceeded ? "completed" : "fallback",
                AiFailureReason = aiFailureReason
            };

            // Store triage summary
            await SaveTriageSummary(summary);

            // If high risk or AI failed, automatically submit for clinician review
            if (summary.RequiresClinicianReview)
            {
                await SubmitForClinicianReviewAsync(summary);
            }

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Critical error generating triage summary for patient {PatientId}", patientId);

            // Even on critical failure, return a manual-review summary rather than failing completely
            return CreateManualReviewSummary(patientId, request, ex.Message);
        }
    }

    /// <summary>
    /// Sanitize medication list to prevent PHI leakage via rare/identifying drug combinations
    /// </summary>
    private List<string> SanitizeMedications(List<string>? medications)
    {
        if (medications == null || !medications.Any())
            return new List<string>();

        return medications.Select(med =>
        {
            // Remove dosage specifics that could be identifying
            var sanitized = Regex.Replace(med, @"\d+\s*(mg|mcg|ml|units?|iu)\b", "[DOSE]", RegexOptions.IgnoreCase);

            // Remove prescriber names that might be embedded ("prescribed by Dr. Smith")
            sanitized = Regex.Replace(sanitized, @"\b(dr\.?|doctor)\s+[a-z]+\b", "[PRESCRIBER]", RegexOptions.IgnoreCase);

            // Remove pharmacy names
            sanitized = Regex.Replace(sanitized, @"\b(pharmacy|cvs|walgreens|chemist|priceline)\b", "[PHARMACY]", RegexOptions.IgnoreCase);

            return sanitized.Trim();
        }).ToList();
    }

    /// <summary>
    /// Sanitize allergies list similarly
    /// </summary>
    private List<string> SanitizeAllergies(List<string>? allergies)
    {
        if (allergies == null || !allergies.Any())
            return new List<string>();

        return allergies.Select(allergy =>
        {
            // Remove incident details that might contain identifying info
            var sanitized = Regex.Replace(allergy, @"\b(at|in|during)\s+[a-z0-9\s]+\s+(hospital|clinic|surgery)\b", "", RegexOptions.IgnoreCase);
            return sanitized.Trim();
        }).ToList();
    }

    /// <summary>
    /// Create a fallback AI summary when Bedrock is unavailable
    /// </summary>
    private AiTriageSummaryResult CreateFallbackAiSummary(TriageData data)
    {
        return new AiTriageSummaryResult
        {
            ChiefComplaint = ExtractChiefComplaint(data.Symptoms),
            Summary = "AI analysis unavailable. Manual clinical review required.",
            SymptomAnalysis = new Dictionary<string, object>
            {
                ["primary_symptoms"] = data.Symptoms.Split(new[] { ',', ';', '.' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .Where(s => s.Length > 2)
                    .Take(5)
                    .ToList(),
                ["status"] = "pending_manual_review"
            },
            PossibleConditions = new List<PossibleCondition>(),
            Confidence = 0.0
        };
    }

    /// <summary>
    /// Create fallback urgency assessment based on rules
    /// </summary>
    private UrgencyAssessment CreateFallbackUrgencyAssessment(TriageData data, List<RiskFlag> riskFlags)
    {
        // Use rule-based urgency when AI fails
        var hasCriticalFlags = riskFlags.Any(r => r.Severity == RiskSeverity.Critical);
        var hasHighFlags = riskFlags.Any(r => r.Severity == RiskSeverity.High);
        var hasCriticalSymptoms = _criticalSymptoms.Any(cs => data.Symptoms.ToLower().Contains(cs));

        string level;
        int score;
        string timeframe;

        if (hasCriticalFlags || hasCriticalSymptoms)
        {
            level = "urgent";
            score = 9;
            timeframe = "immediate";
        }
        else if (hasHighFlags)
        {
            level = "high";
            score = 7;
            timeframe = "within 1 hour";
        }
        else
        {
            // Default to cautious assessment when AI unavailable
            level = "high";
            score = 6;
            timeframe = "within 4 hours";
        }

        return new UrgencyAssessment
        {
            Level = level,
            Score = score,
            RecommendedTimeframe = timeframe,
            Rationale = "AI assessment unavailable - urgency determined by rule-based analysis. Manual review required.",
            AssessedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Create a manual review summary when everything fails
    /// </summary>
    private TriageSummary CreateManualReviewSummary(Guid patientId, TriageRequest request, string errorMessage)
    {
        var summary = new TriageSummary
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            RequestId = request.Id,
            ChiefComplaint = ExtractChiefComplaint(request.Symptoms),
            SummaryText = "System error during triage processing. Immediate manual review required.",
            SymptomAnalysis = new Dictionary<string, object>
            {
                ["raw_symptoms"] = request.Symptoms,
                ["error"] = "Processing failed"
            },
            RiskFlags = new List<RiskFlag>
            {
                new RiskFlag
                {
                    Type = RiskType.Other,
                    Description = "Automated triage failed - manual review required",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = true
                }
            },
            UrgencyLevel = "high",
            UrgencyScore = 7,
            UrgencyRationale = "Default high priority due to system error",
            RecommendedTimeframe = "within 1 hour",
            PossibleConditions = new List<PossibleCondition>(),
            RequiresClinicianReview = true,
            GeneratedAt = DateTime.UtcNow,
            Confidence = 0.0,
            AiProcessingStatus = "failed",
            AiFailureReason = errorMessage
        };

        // Fire and forget save - don't let save failure cascade
        Task.Run(async () =>
        {
            try
            {
                await SaveTriageSummary(summary);
                await SubmitForClinicianReviewAsync(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save manual review summary");
            }
        });

        return summary;
    }

    /// <summary>
    /// Extract chief complaint from symptoms text
    /// </summary>
    private string ExtractChiefComplaint(string symptoms)
    {
        if (string.IsNullOrWhiteSpace(symptoms))
            return "Unspecified complaint";

        // Take first sentence or first 100 chars
        var firstSentence = symptoms.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        if (firstSentence != null && firstSentence.Length <= 100)
            return firstSentence.Trim();

        return symptoms.Length > 100 ? symptoms.Substring(0, 100) + "..." : symptoms;
    }

    /// <summary>
    /// Detect risk flags using rules only (no AI)
    /// </summary>
    private List<RiskFlag> DetectRuleBasedRiskFlags(TriageData data)
    {
        var riskFlags = new List<RiskFlag>();
        var symptomLower = data.Symptoms.ToLower();

        // Check for critical symptoms
        foreach (var criticalSymptom in _criticalSymptoms)
        {
            if (symptomLower.Contains(criticalSymptom))
            {
                riskFlags.Add(new RiskFlag
                {
                    Type = RiskType.CriticalSymptom,
                    Description = $"Critical symptom detected: {criticalSymptom}",
                    Severity = RiskSeverity.Critical,
                    RequiresImmediateAction = true
                });
            }
        }

        // Check vital signs
        if (data.VitalSigns != null)
        {
            riskFlags.AddRange(AssessVitalSignRisks(data.VitalSigns));
        }

        // Check red flag conditions
        foreach (var condition in _redFlagConditions)
        {
            var matchCount = condition.Value.Count(symptom => symptomLower.Contains(symptom));
            if (matchCount >= 2)
            {
                riskFlags.Add(new RiskFlag
                {
                    Type = RiskType.RedFlagCondition,
                    Description = $"Multiple {condition.Key} red flags detected",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = matchCount >= 3
                });
            }
        }

        return riskFlags;
    }

    public async Task<List<RiskFlag>> DetectRiskFlagsAsync(TriageData data)
    {
        var riskFlags = new List<RiskFlag>();

        try
        {
            // Check for critical symptoms using pattern matching
            var symptomLower = data.Symptoms.ToLower();
            foreach (var criticalSymptom in _criticalSymptoms)
            {
                if (symptomLower.Contains(criticalSymptom))
                {
                    riskFlags.Add(new RiskFlag
                    {
                        Type = RiskType.CriticalSymptom,
                        Description = $"Critical symptom detected: {criticalSymptom}",
                        Severity = RiskSeverity.Critical,
                        RequiresImmediateAction = true
                    });
                }
            }

            // Check for red flag condition combinations
            foreach (var condition in _redFlagConditions)
            {
                var matchCount = condition.Value.Count(symptom => symptomLower.Contains(symptom));
                if (matchCount >= 2)
                {
                    riskFlags.Add(new RiskFlag
                    {
                        Type = RiskType.RedFlagCondition,
                        Description = $"Multiple {condition.Key} red flags detected",
                        Severity = RiskSeverity.High,
                        RequiresImmediateAction = matchCount >= 3
                    });
                }
            }

            // Check vital signs if provided
            if (data.VitalSigns != null)
            {
                var vitalRisks = AssessVitalSignRisks(data.VitalSigns);
                riskFlags.AddRange(vitalRisks);
            }

            // Use AI for complex risk detection
            var aiRiskFlags = await DetectAiRiskFlags(data);
            riskFlags.AddRange(aiRiskFlags);

            // Check medication interactions
            if (data.Medications?.Any() == true)
            {
                var medicationRisks = await CheckMedicationRisks(data.Medications, data.Symptoms);
                riskFlags.AddRange(medicationRisks);
            }

            // Age-based risk factors
            if (data.Age.HasValue)
            {
                var ageRisks = AssessAgeRelatedRisks(data.Age.Value, symptomLower);
                riskFlags.AddRange(ageRisks);
            }

            return riskFlags.OrderByDescending(r => r.Severity).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting risk flags");
            return riskFlags;
        }
    }

    public async Task<UrgencyAssessment> AssessUrgencyAsync(TriageData data)
    {
        try
        {
            // Build pain map context if available
            var painMapContext = "";
            if (data.PainMapData?.Regions?.Any() == true)
            {
                var regions = data.PainMapData.Regions
                    .OrderByDescending(r => r.Intensity)
                    .Select(r => $"{r.AnatomicalName ?? r.MeshName}: {r.Quality} pain (intensity {r.Intensity}/10)")
                    .ToList();
                
                painMapContext = $@"
                Pain Map Analysis:
                - Number of affected regions: {data.PainMapData.Regions.Count}
                - Pain locations: {string.Join(", ", regions)}
                - Maximum intensity: {data.PainMapData.Regions.Max(r => r.Intensity)}/10
                - Pain patterns: {AnalyzePainPattern(data.PainMapData.Regions)}
                ";
            }

            var prompt = $@"
                Assess the urgency level for this patient presentation.
                Return JSON with format:
                {{
                    ""urgency_level"": ""Emergency|Urgent|SemiUrgent|NonUrgent"",
                    ""urgency_score"": 1-10,
                    ""recommended_timeframe"": ""immediate|within 1 hour|within 4 hours|within 24 hours|within 72 hours"",
                    ""rationale"": ""explanation"",
                    ""key_factors"": [""factor1"", ""factor2""]
                }}
                
                Symptoms: {data.Symptoms}
                Duration: {data.Duration}
                Severity: {data.Severity}
                Age: {data.Age}
                Vital Signs: {JsonSerializer.Serialize(data.VitalSigns)}
                {painMapContext}
            ";

            var systemPrompt = @"You are an emergency triage expert. Assess urgency based on:
                - Symptom severity and acuity
                - Duration and progression
                - Vital sign abnormalities
                - Age-related risk factors
                - Potential for rapid deterioration
                - Pain location, quality, and intensity patterns
                - Bilateral vs unilateral pain distribution
                - Dermatomal patterns suggesting nerve involvement
                Use standard emergency department triage categories.";

            var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
                prompt,
                systemPrompt,
                new BedrockModelOptions { Temperature = 0.2f }
            );

            var urgencyLevel = ParseUrgencyLevel(response.ParsedContent.GetValueOrDefault("urgency_level")?.ToString());
            var score = Convert.ToInt32(response.ParsedContent.GetValueOrDefault("urgency_score") ?? 5);
            var timeframe = response.ParsedContent.GetValueOrDefault("recommended_timeframe")?.ToString() ?? "within 24 hours";
            var rationale = response.ParsedContent.GetValueOrDefault("rationale")?.ToString() ?? "";

            return new UrgencyAssessment
            {
                Level = urgencyLevel,
                Score = score,
                RecommendedTimeframe = timeframe,
                Rationale = rationale,
                AssessedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assessing urgency");
            // Default to cautious assessment
            return new UrgencyAssessment
            {
                Level = "high",
                Score = 6,
                RecommendedTimeframe = "within 4 hours",
                Rationale = "Unable to complete full assessment - defaulting to high priority",
                AssessedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<NextStepGuidance> GenerateNextStepsAsync(TriageSummary summary)
    {
        try
        {
            var prompt = $@"
                Generate next step guidance for this triage summary.
                Return JSON with format:
                {{
                    ""immediate_actions"": [""action1"", ""action2""],
                    ""recommended_care_level"": ""Emergency Room|Urgent Care|Primary Care|Telemedicine|Self Care"",
                    ""diagnostic_tests"": [""test1"", ""test2""],
                    ""self_care_instructions"": [""instruction1"", ""instruction2""],
                    ""warning_signs"": [""sign1"", ""sign2""],
                    ""follow_up_timeframe"": ""timeframe"",
                    ""education_topics"": [""topic1"", ""topic2""]
                }}
                
                Chief Complaint: {summary.ChiefComplaint}
                Urgency: {summary.UrgencyLevel}
                Risk Flags: {JsonSerializer.Serialize(summary.RiskFlags.Select(r => r.Description))}
                Possible Conditions: {JsonSerializer.Serialize(summary.PossibleConditions)}
            ";

            var systemPrompt = @"You are a clinical decision support expert. Provide actionable next steps including:
                - Immediate actions if needed
                - Appropriate care setting
                - Relevant diagnostic workup
                - Self-care measures when appropriate
                - Red flags to watch for
                - Patient education priorities
                Be specific and evidence-based.";

            var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
                prompt,
                systemPrompt,
                new BedrockModelOptions { Temperature = 0.3f }
            );

            var guidance = new NextStepGuidance
            {
                Id = Guid.NewGuid(),
                TriageSummaryId = summary.Id,
                ImmediateActions = ParseStringList(response.ParsedContent.GetValueOrDefault("immediate_actions")),
                RecommendedCareLevel = response.ParsedContent.GetValueOrDefault("recommended_care_level")?.ToString() ?? "Primary Care",
                DiagnosticTests = ParseStringList(response.ParsedContent.GetValueOrDefault("diagnostic_tests")),
                SelfCareInstructions = ParseStringList(response.ParsedContent.GetValueOrDefault("self_care_instructions")),
                WarningSignsToWatch = ParseStringList(response.ParsedContent.GetValueOrDefault("warning_signs")),
                FollowUpTimeframe = response.ParsedContent.GetValueOrDefault("follow_up_timeframe")?.ToString(),
                EducationTopics = ParseStringList(response.ParsedContent.GetValueOrDefault("education_topics")),
                GeneratedAt = DateTime.UtcNow
            };

            // Store guidance
            await SaveNextStepGuidance(guidance);

            return guidance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating next step guidance");
            throw new TriageException("Failed to generate next step guidance", ex);
        }
    }

    public async Task<ClinicianReview> SubmitForClinicianReviewAsync(TriageSummary summary)
    {
        try
        {
            var review = new ClinicianReview
            {
                Id = Guid.NewGuid(),
                TriageSummaryId = summary.Id,
                PatientId = summary.PatientId,
                Status = ReviewStatus.Pending,
                Priority = DetermineReviewPriority(summary),
                SubmittedAt = DateTime.UtcNow,
                RequiredByTime = CalculateRequiredReviewTime(summary),
                RiskFlags = summary.RiskFlags,
                UrgencyLevel = summary.UrgencyLevel,
                ChiefComplaint = summary.ChiefComplaint
            };

            // Store review request
            _dbContext.Set<ClinicianReview>().Add(review);
            await _dbContext.SaveChangesAsync();

            // Send notification to available clinicians
            await NotifyCliniciansAsync(review);

            return review;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting for clinician review");
            throw new TriageException("Failed to submit for clinician review", ex);
        }
    }

    private async Task<AiTriageSummaryResult> GenerateAiTriageSummary(TriageData data)
    {
        var prompt = $@"
            Analyze these patient symptoms and generate a clinical triage summary.
            Return JSON with format:
            {{
                ""chief_complaint"": ""main presenting problem"",
                ""summary"": ""clinical summary"",
                ""symptom_analysis"": {{
                    ""primary_symptoms"": [],
                    ""associated_symptoms"": [],
                    ""onset_pattern"": """",
                    ""progression"": """"
                }},
                ""possible_conditions"": [
                    {{""condition"": """", ""likelihood"": ""high|medium|low"", ""rationale"": """"}}
                ],
                ""confidence"": 0.0-1.0
            }}
            
            Symptoms: {data.Symptoms}
            Medical History: {data.MedicalHistory}
            Duration: {data.Duration}
            Severity: {data.Severity}
        ";

        var systemPrompt = @"You are an experienced emergency medicine physician performing triage assessment.
            Analyze symptoms systematically and identify potential conditions.
            Be thorough but concise. Focus on clinically relevant information.";

        var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
            prompt,
            systemPrompt,
            new BedrockModelOptions { Temperature = 0.2f }
        );

        return ParseAiTriageSummary(response.ParsedContent);
    }

    private async Task<List<RiskFlag>> DetectAiRiskFlags(TriageData data)
    {
        var prompt = $@"
            Identify clinical risk factors and red flags in this presentation.
            Return JSON with format:
            {{
                ""risk_flags"": [
                    {{
                        ""type"": ""symptom|condition|vital_sign|drug_interaction"",
                        ""description"": ""specific risk"",
                        ""severity"": ""critical|high|moderate|low"",
                        ""requires_immediate_action"": boolean,
                        ""clinical_rationale"": ""explanation""
                    }}
                ]
            }}
            
            Patient Data: {JsonSerializer.Serialize(data)}
        ";

        var systemPrompt = @"You are a clinical risk assessment expert. Identify:
            - Life-threatening conditions
            - Time-sensitive diagnoses
            - High-risk symptom combinations
            - Medication safety concerns
            - Age or comorbidity-related risks
            Be thorough in identifying potential risks.";

        var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
            prompt,
            systemPrompt,
            new BedrockModelOptions { Temperature = 0.1f }
        );

        return ParseAiRiskFlags(response.ParsedContent);
    }

    private List<RiskFlag> AssessVitalSignRisks(VitalSigns vitals)
    {
        var risks = new List<RiskFlag>();

        // Blood pressure assessment
        if (vitals.SystolicBP.HasValue && vitals.DiastolicBP.HasValue)
        {
            if (vitals.SystolicBP > 180 || vitals.DiastolicBP > 120)
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.VitalSign,
                    Description = "Hypertensive crisis",
                    Severity = RiskSeverity.Critical,
                    RequiresImmediateAction = true
                });
            }
            else if (vitals.SystolicBP < 90 || vitals.DiastolicBP < 60)
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.VitalSign,
                    Description = "Hypotension",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = true
                });
            }
        }

        // Heart rate assessment
        if (vitals.HeartRate.HasValue)
        {
            if (vitals.HeartRate > 150)
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.VitalSign,
                    Description = "Severe tachycardia",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = true
                });
            }
            else if (vitals.HeartRate < 40)
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.VitalSign,
                    Description = "Severe bradycardia",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = true
                });
            }
        }

        // Oxygen saturation
        if (vitals.OxygenSaturation.HasValue && vitals.OxygenSaturation < 90)
        {
            risks.Add(new RiskFlag
            {
                Type = RiskType.VitalSign,
                Description = "Hypoxemia",
                Severity = RiskSeverity.Critical,
                RequiresImmediateAction = true
            });
        }

        // Temperature
        if (vitals.Temperature.HasValue)
        {
            if (vitals.Temperature > 104)
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.VitalSign,
                    Description = "High fever",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = false
                });
            }
            else if (vitals.Temperature < 95)
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.VitalSign,
                    Description = "Hypothermia",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = true
                });
            }
        }

        return risks;
    }

    private async Task<List<RiskFlag>> CheckMedicationRisks(List<string> medications, string symptoms)
    {
        // This would integrate with a drug interaction database
        // For now, using AI to identify potential interactions
        var risks = new List<RiskFlag>();

        if (!medications.Any())
            return risks;

        var prompt = $@"
            Identify medication-related risks or interactions.
            Medications: {JsonSerializer.Serialize(medications)}
            Symptoms: {symptoms}
            
            Return any concerning interactions or contraindications.
        ";

        try
        {
            var result = await _bedrockService.InvokeClaudeAsync(prompt);
            if (!string.IsNullOrEmpty(result) && result.Contains("interaction", StringComparison.OrdinalIgnoreCase))
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.DrugInteraction,
                    Description = result,
                    Severity = RiskSeverity.Moderate,
                    RequiresImmediateAction = false
                });
            }
        }
        catch
        {
            // Log but don't fail
        }

        return risks;
    }

    private List<RiskFlag> AssessAgeRelatedRisks(int age, string symptoms)
    {
        var risks = new List<RiskFlag>();

        if (age < 1)
        {
            if (symptoms.Contains("fever") || symptoms.Contains("lethargy"))
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.AgeRelated,
                    Description = "Infant with concerning symptoms",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = true
                });
            }
        }
        else if (age > 65)
        {
            if (symptoms.Contains("chest pain") || symptoms.Contains("confusion"))
            {
                risks.Add(new RiskFlag
                {
                    Type = RiskType.AgeRelated,
                    Description = "Elderly patient with high-risk symptoms",
                    Severity = RiskSeverity.High,
                    RequiresImmediateAction = false
                });
            }
        }

        return risks;
    }

    private ReviewPriority DetermineReviewPriority(TriageSummary summary)
    {
        if (summary.RiskFlags.Any(r => r.Severity == RiskSeverity.Critical))
            return ReviewPriority.Stat;
        if (summary.UrgencyLevel.ToLower() == "urgent")
            return ReviewPriority.Urgent;
        if (summary.UrgencyLevel.ToLower() == "high")
            return ReviewPriority.High;
        return ReviewPriority.Normal;
    }

    private DateTime CalculateRequiredReviewTime(TriageSummary summary)
    {
        return summary.UrgencyLevel.ToLower() switch
        {
            "urgent" => DateTime.UtcNow.AddMinutes(15),
            "high" => DateTime.UtcNow.AddHours(1),
            "medium" => DateTime.UtcNow.AddHours(4),
            "low" => DateTime.UtcNow.AddHours(24),
            _ => DateTime.UtcNow.AddHours(24)
        };
    }

    private async Task NotifyCliniciansAsync(ClinicianReview review)
    {
        // Implementation would send notifications to available clinicians
        // Via email, SMS, push notifications, etc.
        await Task.CompletedTask;
    }

    private async Task SaveTriageSummary(TriageSummary summary)
    {
        _dbContext.Set<TriageSummary>().Add(summary);
        await _dbContext.SaveChangesAsync();
    }

    private async Task SaveNextStepGuidance(NextStepGuidance guidance)
    {
        _dbContext.Set<NextStepGuidance>().Add(guidance);
        await _dbContext.SaveChangesAsync();
    }

    private string ParseUrgencyLevel(string? level)
    {
        return level?.ToLower() switch
        {
            "emergency" => "urgent",
            "urgent" => "urgent",
            "semiurgent" => "high",
            "nonurgent" => "medium",
            "high" => "high",
            "medium" => "medium",
            "low" => "low",
            _ => "medium"
        };
    }

    private AiTriageSummaryResult ParseAiTriageSummary(Dictionary<string, object> content)
    {
        var result = new AiTriageSummaryResult
        {
            ChiefComplaint = content.GetValueOrDefault("chief_complaint")?.ToString() ?? "",
            Summary = content.GetValueOrDefault("summary")?.ToString() ?? "",
            Confidence = Convert.ToDouble(content.GetValueOrDefault("confidence") ?? 0.5)
        };

        if (content.TryGetValue("symptom_analysis", out var analysis) && analysis is Dictionary<string, object> symptomAnalysis)
        {
            result.SymptomAnalysis = symptomAnalysis;
        }

        if (content.TryGetValue("possible_conditions", out var conditions) && conditions is List<object> conditionList)
        {
            result.PossibleConditions = conditionList
                .OfType<Dictionary<string, object>>()
                .Select(c => new PossibleCondition
                {
                    Condition = c.GetValueOrDefault("condition")?.ToString() ?? "",
                    Likelihood = c.GetValueOrDefault("likelihood")?.ToString() ?? "low",
                    Rationale = c.GetValueOrDefault("rationale")?.ToString()
                })
                .ToList();
        }

        return result;
    }

    private List<RiskFlag> ParseAiRiskFlags(Dictionary<string, object> content)
    {
        var flags = new List<RiskFlag>();

        if (content.TryGetValue("risk_flags", out var riskFlags) && riskFlags is List<object> flagList)
        {
            foreach (var flag in flagList.OfType<Dictionary<string, object>>())
            {
                flags.Add(new RiskFlag
                {
                    Type = ParseRiskType(flag.GetValueOrDefault("type")?.ToString()),
                    Description = flag.GetValueOrDefault("description")?.ToString() ?? "",
                    Severity = ParseRiskSeverity(flag.GetValueOrDefault("severity")?.ToString()),
                    RequiresImmediateAction = Convert.ToBoolean(flag.GetValueOrDefault("requires_immediate_action") ?? false),
                    ClinicalRationale = flag.GetValueOrDefault("clinical_rationale")?.ToString()
                });
            }
        }

        return flags;
    }

    private RiskType ParseRiskType(string? type)
    {
        return type?.ToLower() switch
        {
            "symptom" => RiskType.CriticalSymptom,
            "condition" => RiskType.RedFlagCondition,
            "vital_sign" => RiskType.VitalSign,
            "drug_interaction" => RiskType.DrugInteraction,
            _ => RiskType.Other
        };
    }

    private RiskSeverity ParseRiskSeverity(string? severity)
    {
        return severity?.ToLower() switch
        {
            "critical" => RiskSeverity.Critical,
            "high" => RiskSeverity.High,
            "moderate" => RiskSeverity.Moderate,
            "low" => RiskSeverity.Low,
            _ => RiskSeverity.Moderate
        };
    }

    private List<string> ParseStringList(object? value)
    {
        if (value is List<object> list)
        {
            return list.Select(item => item?.ToString() ?? "").Where(s => !string.IsNullOrEmpty(s)).ToList();
        }
        return new List<string>();
    }

    private string AnalyzePainPattern(List<PainRegion> regions)
    {
        var patterns = new List<string>();

        // Check for bilateral pain (left/right symmetry)
        var leftRegions = regions.Where(r => r.MeshName.Contains("left")).ToList();
        var rightRegions = regions.Where(r => r.MeshName.Contains("right")).ToList();
        if (leftRegions.Any() && rightRegions.Any())
        {
            patterns.Add("bilateral distribution");
        }

        // Check for radiating pain (multiple connected regions)
        if (regions.Count >= 3)
        {
            patterns.Add("multiple regions affected");
        }

        // Check for high intensity pain
        var maxIntensity = regions.Max(r => r.Intensity);
        if (maxIntensity >= 8)
        {
            patterns.Add("severe pain (8+/10)");
        }

        // Check for specific pain qualities
        var qualities = regions.Select(r => r.Quality.ToLower()).Distinct().ToList();
        if (qualities.Contains("sharp") || qualities.Contains("burning"))
        {
            patterns.Add("neuropathic characteristics");
        }

        // Check for spinal/back involvement
        if (regions.Any(r => r.MeshName.Contains("back") || r.MeshName.Contains("spine")))
        {
            patterns.Add("spinal involvement");
        }

        return patterns.Any() ? string.Join(", ", patterns) : "localized pain";
    }
}

// Internal Models
internal class AiTriageSummaryResult
{
    public string ChiefComplaint { get; set; } = "";
    public string Summary { get; set; } = "";
    public Dictionary<string, object> SymptomAnalysis { get; set; } = new();
    public List<PossibleCondition> PossibleConditions { get; set; } = new();
    public double Confidence { get; set; }
}

// Exception
public class TriageException : Exception
{
    public TriageException(string message) : base(message) { }
    public TriageException(string message, Exception innerException) : base(message, innerException) { }
}
