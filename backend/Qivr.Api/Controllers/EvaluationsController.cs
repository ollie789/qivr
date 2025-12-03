using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Qivr.Core.Entities;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/evaluations")]
[Authorize]
public class EvaluationsController : BaseApiController
{
    private readonly IEvaluationService _evaluationService;
    private readonly ILogger<EvaluationsController> _logger;
    private readonly QivrDbContext _context;

    public EvaluationsController(
        IEvaluationService evaluationService,
        ILogger<EvaluationsController> logger,
        QivrDbContext context)
    {
        _evaluationService = evaluationService;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Create a new evaluation (patient intake)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateEvaluationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateEvaluation(
        [FromBody] CreateEvaluationRequest request,
        CancellationToken cancellationToken)
    {
        // Use the authenticated user's ID if no patient ID provided, or if it doesn't exist
        var patientId = request.PatientId;

        _logger.LogInformation("Creating evaluation for patient {PatientId}", patientId);

        // Get tenant from patient record (patients don't send X-Tenant-Id header)
        var patient = await _context.Users.FirstOrDefaultAsync(u => u.Id == patientId, cancellationToken);

        // If patient not found by provided ID, try to use the current authenticated user
        if (patient == null)
        {
            var currentUserId = CurrentUserId;
            if (currentUserId != Guid.Empty)
            {
                patient = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);
                if (patient != null)
                {
                    patientId = currentUserId;
                    _logger.LogInformation("Using authenticated user {UserId} instead of provided patient ID", currentUserId);
                }
            }
        }

        if (patient == null)
        {
            _logger.LogWarning("Patient not found for evaluation. Provided ID: {PatientId}, Current User: {CurrentUser}",
                request.PatientId, CurrentUserId);
            return BadRequest(new { message = "Patient not found. Please ensure you are logged in with a valid account." });
        }
        
        var dto = new CreateEvaluationDto(
            patientId,
            request.ChiefComplaint,
            request.Symptoms,
            request.QuestionnaireResponses,
            request.PainMaps.Select(p => new PainMapDto(
                p.BodyRegion,
                p.Coordinates.X,
                p.Coordinates.Y,
                p.Coordinates.Z,
                p.Intensity,
                p.Type,
                p.Qualities
            )).ToList()
        );
        
        var evaluationId = await _evaluationService.CreateEvaluationAsync(dto, cancellationToken);
        
        return CreatedAtAction(
            nameof(GetEvaluation),
            new { id = evaluationId },
            new CreateEvaluationResponse { Id = evaluationId });
    }

    /// <summary>
    /// Get evaluation by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EvaluationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEvaluation(Guid id, CancellationToken cancellationToken)
    {
        var evaluation = await _evaluationService.GetEvaluationDetailAsync(id, cancellationToken);
        
        if (evaluation == null)
        {
            return NotFound();
        }
        
        return Ok(evaluation);
    }

    /// <summary>
    /// Get all evaluations (with optional patient filter)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<EvaluationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEvaluations(
        [FromQuery] Guid? patientId,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();

        // If user is a patient, only return their evaluations
        if (User.IsInRole("Patient"))
        {
            var cognitoId = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Patient request - CognitoId: {CognitoId}", cognitoId);
            
            if (!string.IsNullOrEmpty(cognitoId))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoId, cancellationToken);
                if (user != null)
                {
                    _logger.LogInformation("Found user {UserId} for CognitoId {CognitoId}", user.Id, cognitoId);
                    patientId = user.Id;
                }
                else
                {
                    _logger.LogWarning("No user found for CognitoId {CognitoId}", cognitoId);
                }
            }
        }
        
        _logger.LogInformation("Fetching evaluations for TenantId: {TenantId}, PatientId: {PatientId}", tenantId, patientId);
        var evaluations = await _evaluationService.GetEvaluationsAsync(tenantId, patientId, cancellationToken);
        
        // Transform to match frontend expectations
        var response = evaluations.Select(e => new
        {
            id = e.Id.ToString(),
            evaluationNumber = e.EvaluationNumber,
            patientName = e.PatientName,
            patientEmail = e.PatientEmail ?? "n/a@unknown",
            patientPhone = e.PatientPhone ?? "000-000-0000",
            date = e.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
            chiefComplaint = e.ChiefComplaint,
            symptoms = e.Symptoms ?? new List<string>(),
            status = e.Status?.ToLower() ?? "pending",
            urgency = e.Urgency ?? "medium",
            provider = "Unassigned", // ProviderName not in service DTO
            followUpDate = (DateTime?)null, // FollowUpDate not in service DTO
            score = (decimal?)null, // Score not in service DTO
            trend = (string?)null, // Trend not in service DTO
            lastUpdated = e.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"), // UpdatedAt not in service DTO
            aiSummary = e.AiSummary,
            aiRiskFlags = e.AiRiskFlags ?? new List<string>(),
            aiProcessedAt = e.AiProcessedAt?.ToString("yyyy-MM-ddTHH:mm:ss")
        }).ToList();
        
        return Ok(response);
    }

    /// <summary>
    /// Update evaluation status
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEvaluationStatus(
        Guid id,
        [FromBody] UpdateStatusRequest request,
        CancellationToken cancellationToken)
    {
        await _evaluationService.UpdateEvaluationStatusAsync(id, request.Status, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Submit AI analysis for evaluation (legacy endpoint)
    /// </summary>
    [HttpPost("{id}/analyze")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(typeof(AnalysisResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnalyzeEvaluation(
        Guid id,
        CancellationToken cancellationToken)
    {
        // Redirect to new ai-triage endpoint
        return await GenerateAiTriage(id, new AiTriageRequest(), cancellationToken);
    }

    /// <summary>
    /// Generate AI triage analysis for an evaluation
    /// Analyzes symptoms, pain levels, and medical history to provide triage recommendations
    /// </summary>
    [HttpPost("{id}/ai-triage")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(typeof(AiTriageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GenerateAiTriage(
        Guid id,
        [FromBody] AiTriageRequest request,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();

        var evaluation = await _context.Evaluations
            .Include(e => e.PainMaps)
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId, cancellationToken);

        if (evaluation == null)
            return NotFound();

        _logger.LogInformation("Generating AI triage for evaluation {Id}", id);

        // Build context from evaluation data
        var painLevel = evaluation.PainMaps?.MaxBy(p => p.PainIntensity)?.PainIntensity ?? request.PainLevel ?? 5;
        var symptoms = evaluation.Symptoms ?? request.Symptoms ?? new List<string>();
        var chiefComplaint = evaluation.ChiefComplaint ?? request.ChiefComplaint ?? "Not specified";

        // Generate triage analysis (rule-based for now, can be replaced with actual AI)
        var (summary, riskFactors, recommendations, urgency) = GenerateTriageAnalysis(
            chiefComplaint,
            symptoms,
            painLevel,
            request.Duration,
            request.MedicalHistory,
            request.CurrentMedications,
            request.Allergies
        );

        // Save AI triage results to evaluation
        evaluation.AiSummary = summary;
        evaluation.AiRiskFlags = riskFactors;
        evaluation.AiRecommendations = recommendations;
        evaluation.AiProcessedAt = DateTime.UtcNow;
        evaluation.Urgency = MapUrgencyToEnum(urgency);
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("AI triage generated for evaluation {Id}: urgency={Urgency}", id, urgency);

        return Ok(new AiTriageResponse
        {
            Summary = summary,
            RiskFactors = riskFactors,
            Recommendations = recommendations,
            Urgency = urgency
        });
    }

    private (string summary, List<string> riskFactors, List<string> recommendations, string urgency) GenerateTriageAnalysis(
        string chiefComplaint,
        List<string> symptoms,
        int painLevel,
        string? duration,
        string? medicalHistory,
        string? currentMedications,
        string? allergies)
    {
        var riskFactors = new List<string>();
        var recommendations = new List<string>();
        var urgencyScore = 0;

        // Pain level assessment
        if (painLevel >= 8)
        {
            riskFactors.Add("Severe pain level (8+/10)");
            urgencyScore += 3;
        }
        else if (painLevel >= 6)
        {
            riskFactors.Add("Moderate-high pain level (6-7/10)");
            urgencyScore += 2;
        }
        else if (painLevel >= 4)
        {
            urgencyScore += 1;
        }

        // Symptom analysis
        var severeSymptoms = new[] { "numbness", "tingling", "weakness", "loss of function", "radiating pain", "difficulty breathing", "chest pain" };
        var moderateSymptoms = new[] { "swelling", "stiffness", "limited range of motion", "muscle spasm" };

        foreach (var symptom in symptoms.Select(s => s.ToLowerInvariant()))
        {
            if (severeSymptoms.Any(ss => symptom.Contains(ss)))
            {
                riskFactors.Add($"Concerning symptom: {symptom}");
                urgencyScore += 2;
            }
            else if (moderateSymptoms.Any(ms => symptom.Contains(ms)))
            {
                urgencyScore += 1;
            }
        }

        // Duration assessment
        if (!string.IsNullOrEmpty(duration))
        {
            var durationLower = duration.ToLowerInvariant();
            if (durationLower.Contains("acute") || durationLower.Contains("sudden") || durationLower.Contains("today") || durationLower.Contains("hours"))
            {
                riskFactors.Add("Acute onset");
                urgencyScore += 2;
            }
            else if (durationLower.Contains("chronic") || durationLower.Contains("months") || durationLower.Contains("years"))
            {
                recommendations.Add("Consider chronic pain management program");
            }
        }

        // Chief complaint keywords
        var urgentKeywords = new[] { "accident", "injury", "fall", "trauma", "sudden", "worst", "unbearable" };
        if (urgentKeywords.Any(k => chiefComplaint.ToLowerInvariant().Contains(k)))
        {
            riskFactors.Add("Chief complaint suggests acute injury/trauma");
            urgencyScore += 2;
        }

        // Medical history considerations
        if (!string.IsNullOrEmpty(medicalHistory))
        {
            var historyLower = medicalHistory.ToLowerInvariant();
            if (historyLower.Contains("diabetes") || historyLower.Contains("heart") || historyLower.Contains("cancer"))
            {
                riskFactors.Add("Relevant medical history requires consideration");
                recommendations.Add("Review patient's comorbidities before treatment planning");
            }
        }

        // Determine urgency level
        string urgency;
        if (urgencyScore >= 6)
            urgency = "critical";
        else if (urgencyScore >= 4)
            urgency = "high";
        else if (urgencyScore >= 2)
            urgency = "medium";
        else
            urgency = "low";

        // Generate recommendations based on analysis
        if (urgency == "critical" || urgency == "high")
        {
            recommendations.Insert(0, "Priority scheduling recommended");
            recommendations.Add("Consider same-day or next-day appointment");
        }

        if (painLevel >= 6)
        {
            recommendations.Add("Assess need for pain management intervention");
        }

        if (symptoms.Any(s => s.ToLowerInvariant().Contains("numbness") || s.ToLowerInvariant().Contains("tingling")))
        {
            recommendations.Add("Neurological assessment recommended");
        }

        if (recommendations.Count == 0)
        {
            recommendations.Add("Standard evaluation appointment recommended");
        }

        // Generate summary
        var summaryParts = new List<string>
        {
            $"Patient presents with {chiefComplaint}.",
            $"Pain level: {painLevel}/10.",
        };

        if (symptoms.Any())
        {
            summaryParts.Add($"Associated symptoms: {string.Join(", ", symptoms.Take(3))}.");
        }

        summaryParts.Add($"Triage assessment: {urgency.ToUpperInvariant()} priority.");

        if (riskFactors.Any())
        {
            summaryParts.Add($"Key considerations: {string.Join("; ", riskFactors.Take(2))}.");
        }

        var summary = string.Join(" ", summaryParts);

        return (summary, riskFactors, recommendations, urgency);
    }

    private static UrgencyLevel MapUrgencyToEnum(string urgency) => urgency.ToLowerInvariant() switch
    {
        "critical" => UrgencyLevel.Urgent,
        "high" => UrgencyLevel.High,
        "medium" => UrgencyLevel.Medium,
        "low" => UrgencyLevel.Low,
        _ => UrgencyLevel.Medium
    };

    /// <summary>
    /// Get lightweight evaluation history for the current patient (Patient App)
    /// Returns only essential fields to minimize payload
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(List<EvaluationHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        // Get the current patient's ID
        Guid patientId;
        if (User.IsInRole("Patient"))
        {
            var cognitoId = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(cognitoId))
            {
                return Unauthorized(new { message = "Unable to identify patient" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoId, cancellationToken);
            if (user == null)
            {
                return NotFound(new { message = "Patient not found" });
            }
            patientId = user.Id;
        }
        else
        {
            // Staff can view their own evaluations too (if they are also patients)
            patientId = CurrentUserId;
        }

        // Fetch lightweight history - only essential fields
        var query = _context.Evaluations
            .AsNoTracking()
            .Where(e => e.PatientId == patientId)
            .OrderByDescending(e => e.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var history = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EvaluationHistoryDto
            {
                Id = e.Id,
                EvaluationNumber = e.EvaluationNumber,
                Date = e.CreatedAt,
                Status = e.Status.ToString().ToLowerInvariant(),
                ChiefComplaint = e.ChiefComplaint,
                // Get primary pain region from the first pain map
                PrimaryPainRegion = e.PainMaps.OrderByDescending(p => p.PainIntensity).Select(p => p.BodyRegion).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            data = history,
            pagination = new
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }
        });
    }

    /// <summary>
    /// Add clinical notes to an evaluation (Staff only)
    /// Notes are appended, preserving patient's original submission
    /// </summary>
    [HttpPost("{id}/notes")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddClinicalNote(
        Guid id,
        [FromBody] AddNoteRequest request,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var evaluation = await _context.Evaluations
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId, cancellationToken);

        if (evaluation == null)
            return NotFound();

        // Get current user info for attribution
        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        var userName = currentUser != null ? $"{currentUser.FirstName} {currentUser.LastName}".Trim() : "Staff";

        // Create structured note with timestamp and attribution
        var clinicalNote = new ClinicalNote
        {
            Id = Guid.NewGuid(),
            AuthorId = userId,
            AuthorName = userName,
            Content = request.Content,
            NoteType = request.NoteType ?? "general",
            CreatedAt = DateTime.UtcNow
        };

        // Append to existing clinical notes (stored in QuestionnaireResponses for now)
        // In production, consider a dedicated ClinicalNotes table
        var responses = evaluation.QuestionnaireResponses ?? new Dictionary<string, object>();

        var existingNotes = new List<ClinicalNote>();
        if (responses.TryGetValue("clinicalNotes", out var notesObj) && notesObj is List<object> notesList)
        {
            // Deserialize existing notes
            foreach (var note in notesList)
            {
                if (note is System.Text.Json.JsonElement jsonElement)
                {
                    var existing = System.Text.Json.JsonSerializer.Deserialize<ClinicalNote>(jsonElement.GetRawText());
                    if (existing != null) existingNotes.Add(existing);
                }
            }
        }

        existingNotes.Add(clinicalNote);
        responses["clinicalNotes"] = existingNotes;
        evaluation.QuestionnaireResponses = responses;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Clinical note added to evaluation {EvaluationId} by {UserId}", id, userId);

        return Ok(new
        {
            id = clinicalNote.Id,
            content = clinicalNote.Content,
            createdAt = clinicalNote.CreatedAt,
            createdBy = userName,
            type = clinicalNote.NoteType
        });
    }

    /// <summary>
    /// Get all clinical notes for an evaluation
    /// </summary>
    [HttpGet("{id}/notes")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClinicalNotes(
        Guid id,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();

        var evaluation = await _context.Evaluations
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId, cancellationToken);

        if (evaluation == null)
            return NotFound();

        var notes = new List<object>();
        var responses = evaluation.QuestionnaireResponses ?? new Dictionary<string, object>();

        if (responses.TryGetValue("clinicalNotes", out var notesObj))
        {
            if (notesObj is List<object> notesList)
            {
                foreach (var note in notesList)
                {
                    if (note is System.Text.Json.JsonElement jsonElement)
                    {
                        var existing = System.Text.Json.JsonSerializer.Deserialize<ClinicalNote>(jsonElement.GetRawText());
                        if (existing != null)
                        {
                            notes.Add(new
                            {
                                id = existing.Id,
                                content = existing.Content,
                                createdAt = existing.CreatedAt,
                                createdBy = existing.AuthorName,
                                type = existing.NoteType
                            });
                        }
                    }
                }
            }
            else if (notesObj is System.Text.Json.JsonElement jsonArray && jsonArray.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var noteElement in jsonArray.EnumerateArray())
                {
                    var existing = System.Text.Json.JsonSerializer.Deserialize<ClinicalNote>(noteElement.GetRawText());
                    if (existing != null)
                    {
                        notes.Add(new
                        {
                            id = existing.Id,
                            content = existing.Content,
                            createdAt = existing.CreatedAt,
                            createdBy = existing.AuthorName,
                            type = existing.NoteType
                        });
                    }
                }
            }
        }

        return Ok(notes);
    }

    /// <summary>
    /// Delete an evaluation
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEvaluation(Guid id, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var evaluation = await _context.Evaluations
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId, cancellationToken);

        if (evaluation == null)
            return NotFound();

        _context.Evaluations.Remove(evaluation);
        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Deleted evaluation {Id}", id);
        return NoContent();
    }

    /// <summary>
    /// Link evaluation to medical record
    /// </summary>
    [HttpPost("{id}/link-medical-record")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LinkToMedicalRecord(Guid id, [FromBody] LinkMedicalRecordRequest request, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();

        // Validate the target patient exists and belongs to this tenant
        var targetPatient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.PatientId && u.TenantId == tenantId, cancellationToken);

        if (targetPatient == null)
        {
            _logger.LogWarning("Attempted to link evaluation {EvaluationId} to non-existent or cross-tenant patient {PatientId}",
                id, request.PatientId);
            return BadRequest(new { message = "Patient not found or does not belong to this clinic" });
        }

        // Validate user is a Patient type
        if (targetPatient.UserType != UserType.Patient)
        {
            _logger.LogWarning("Attempted to link evaluation {EvaluationId} to non-patient user {UserId} with type {UserType}",
                id, request.PatientId, targetPatient.UserType);
            return BadRequest(new { message = "Target user is not a patient" });
        }

        var evaluation = await _context.Evaluations
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId, cancellationToken);

        if (evaluation == null)
            return NotFound();

        // Prevent re-linking already archived evaluations
        if (evaluation.Status == EvaluationStatus.Archived && evaluation.PatientId != Guid.Empty)
        {
            _logger.LogWarning("Attempted to re-link already archived evaluation {EvaluationId}", id);
            return BadRequest(new { message = "Evaluation is already linked to a patient record" });
        }

        evaluation.PatientId = request.PatientId;
        evaluation.Status = EvaluationStatus.Archived;
        evaluation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Linked evaluation {Id} to patient {PatientId} by user {UserId}",
            id, request.PatientId, CurrentUserId);
        return Ok(new { linkedAt = DateTime.UtcNow, patientName = $"{targetPatient.FirstName} {targetPatient.LastName}".Trim() });
    }
}

// Request/Response Models
public class CreateEvaluationRequest
{
    public Guid PatientId { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public List<string> Symptoms { get; set; } = new();
    public Dictionary<string, object> QuestionnaireResponses { get; set; } = new();
    public List<PainMapRequest> PainMaps { get; set; } = new();
}

public class PainMapRequest
{
    public string BodyRegion { get; set; } = string.Empty;
    public CoordinatesRequest Coordinates { get; set; } = new();
    public int Intensity { get; set; }
    public string? Type { get; set; }
    public List<string> Qualities { get; set; } = new();
}

public class CoordinatesRequest
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}

public class CreateEvaluationResponse
{
    public Guid Id { get; set; }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class AnalysisResponse
{
    public string Summary { get; set; } = string.Empty;
    public string[] RiskFlags { get; set; } = Array.Empty<string>();
    public string[] RecommendedActions { get; set; } = Array.Empty<string>();
}

public class LinkMedicalRecordRequest
{
    public Guid PatientId { get; set; }
}

public class EvaluationHistoryDto
{
    public Guid Id { get; set; }
    public string EvaluationNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ChiefComplaint { get; set; } = string.Empty;
    public string? PrimaryPainRegion { get; set; }
}

public class AddNoteRequest
{
    public string Content { get; set; } = string.Empty;
    public string? NoteType { get; set; }
}

public class ClinicalNote
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string NoteType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AiTriageRequest
{
    public List<string>? Symptoms { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Duration { get; set; }
    public int? PainLevel { get; set; }
    public string? MedicalHistory { get; set; }
    public string? CurrentMedications { get; set; }
    public string? Allergies { get; set; }
}

public class AiTriageResponse
{
    public string Summary { get; set; } = string.Empty;
    public List<string> RiskFactors { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public string Urgency { get; set; } = string.Empty;
}
