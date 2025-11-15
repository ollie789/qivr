using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Qivr.Services;

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
        _logger.LogInformation("Creating evaluation for patient {PatientId}", request.PatientId);
        
        var dto = new CreateEvaluationDto(
            request.PatientId,
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
    [ProducesResponseType(typeof(EvaluationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEvaluation(Guid id, CancellationToken cancellationToken)
    {
        var evaluation = await _evaluationService.GetEvaluationAsync(id, cancellationToken);
        
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
            date = e.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
            chiefComplaint = e.ChiefComplaint,
            symptoms = e.Symptoms ?? new List<string>(),
            status = e.Status?.ToLower() ?? "pending",
            urgency = e.Urgency ?? "medium",
            provider = "Unassigned", // ProviderName not in service DTO
            followUpDate = (DateTime?)null, // FollowUpDate not in service DTO
            score = (decimal?)null, // Score not in service DTO
            trend = (string?)null, // Trend not in service DTO
            lastUpdated = e.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss") // UpdatedAt not in service DTO
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
    /// Submit AI analysis for evaluation
    /// </summary>
    [HttpPost("{id}/analyze")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(typeof(AnalysisResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnalyzeEvaluation(
        Guid id,
        CancellationToken cancellationToken)
    {
        // Clinician review gate placeholder: require staff role and log request
        _logger.LogInformation("AI analysis requested for evaluation {Id}", id);
        return Ok(new AnalysisResponse
        {
            Summary = "Pending clinician-reviewed AI summary.",
            RiskFlags = Array.Empty<string>(),
            RecommendedActions = Array.Empty<string>()
        });
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
