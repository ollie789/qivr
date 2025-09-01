using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
        try
        {
            // De-identify patient data before AI processing
            var deidentifiedSymptoms = await _deIdentificationService.DeIdentifyAsync(
                request.Symptoms,
                new DeIdentificationOptions { EnableReIdentification = true }
            );

            var deidentifiedHistory = request.MedicalHistory != null
                ? await _deIdentificationService.DeIdentifyAsync(request.MedicalHistory)
                : null;

            // Create triage data object
            var triageData = new TriageData
            {
                PatientId = patientId,
                Symptoms = deidentifiedSymptoms.DeIdentifiedText ?? "",
                MedicalHistory = deidentifiedHistory?.DeIdentifiedText,
                VitalSigns = request.VitalSigns,
                Duration = request.Duration,
                Severity = request.Severity,
                Medications = request.CurrentMedications,
                Allergies = request.Allergies,
                Age = request.Age,
                Timestamp = DateTime.UtcNow
            };

            // Generate AI triage summary
            var aiSummary = await GenerateAiTriageSummary(triageData);

            // Detect risk flags
            var riskFlags = await DetectRiskFlagsAsync(triageData);

            // Assess urgency
            var urgency = await AssessUrgencyAsync(triageData);

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
                RequiresClinicianReview = riskFlags.Any(r => r.Severity == RiskSeverity.Critical) || 
                                        urgency.Level == UrgencyLevel.Urgent,
                GeneratedAt = DateTime.UtcNow,
                DeIdentificationMappingId = deidentifiedSymptoms.MappingId,
                Confidence = aiSummary.Confidence
            };

            // Store triage summary
            await SaveTriageSummary(summary);

            // If high risk, automatically submit for clinician review
            if (summary.RequiresClinicianReview)
            {
                await SubmitForClinicianReviewAsync(summary);
            }

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating triage summary for patient {PatientId}", patientId);
            throw new TriageException("Failed to generate triage summary", ex);
        }
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
            ";

            var systemPrompt = @"You are an emergency triage expert. Assess urgency based on:
                - Symptom severity and acuity
                - Duration and progression
                - Vital sign abnormalities
                - Age-related risk factors
                - Potential for rapid deterioration
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
                Level = UrgencyLevel.High,
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
        if (summary.UrgencyLevel == UrgencyLevel.Urgent)
            return ReviewPriority.Urgent;
        if (summary.UrgencyLevel == UrgencyLevel.High)
            return ReviewPriority.High;
        return ReviewPriority.Normal;
    }

    private DateTime CalculateRequiredReviewTime(TriageSummary summary)
    {
        return summary.UrgencyLevel switch
        {
            UrgencyLevel.Urgent => DateTime.UtcNow.AddMinutes(15),
            UrgencyLevel.High => DateTime.UtcNow.AddHours(1),
            UrgencyLevel.Medium => DateTime.UtcNow.AddHours(4),
            UrgencyLevel.Low => DateTime.UtcNow.AddHours(24),
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

    private UrgencyLevel ParseUrgencyLevel(string? level)
    {
        return level?.ToLower() switch
        {
            "emergency" => UrgencyLevel.Urgent,
            "urgent" => UrgencyLevel.Urgent,
            "semiurgent" => UrgencyLevel.High,
            "nonurgent" => UrgencyLevel.Medium,
            "high" => UrgencyLevel.High,
            "medium" => UrgencyLevel.Medium,
            "low" => UrgencyLevel.Low,
            _ => UrgencyLevel.Medium
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
