using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class IntakeController : ControllerBase
{
    private readonly QivrDbContext _dbContext;
    private readonly ILogger<IntakeController> _logger;
    private readonly IConfiguration _configuration;

    public IntakeController(
        QivrDbContext dbContext,
        ILogger<IntakeController> logger,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Public endpoint for widget intake submissions
    /// </summary>
    [HttpPost("submit")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IntakeSubmissionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitIntake(
        [FromBody] IntakeSubmissionRequest request,
        [FromHeader(Name = "X-Clinic-Id")] string? clinicId,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Intake submission received from {Email}", request.ContactInfo.Email);
            
            // If no clinic ID provided, use default
            var tenantId = Guid.TryParse(clinicId, out var tid) 
                ? tid 
                : Guid.Parse(_configuration["DefaultTenantId"] ?? "00000000-0000-0000-0000-000000000001");
            
            // Create evaluation record
            var evaluationId = Guid.NewGuid();
            var now = DateTime.UtcNow;
            
            // Store the evaluation in the database - using minimal required fields
            var intakeData = new Dictionary<string, object>
            {
                ["personalInfo"] = new { 
                    request.PersonalInfo.FirstName, 
                    request.PersonalInfo.LastName, 
                    request.PersonalInfo.DateOfBirth, 
                    request.PersonalInfo.Gender 
                },
                ["contactInfo"] = new { 
                    request.ContactInfo.Email, 
                    request.ContactInfo.Phone, 
                    request.ContactInfo.Address,
                    request.ContactInfo.City,
                    request.ContactInfo.State,
                    request.ContactInfo.Postcode
                },
                ["chiefComplaint"] = request.ChiefComplaint,
                ["symptoms"] = request.Symptoms,
                ["painLevel"] = request.PainLevel,
                ["duration"] = request.Duration,
                ["medicalHistory"] = request.MedicalHistory,
                ["consent"] = request.Consent
            };

            await _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO qivr.evaluations (
                    id, tenant_id, patient_id, status, responses, created_at, updated_at
                ) VALUES (
                    {evaluationId}, {tenantId}, {Guid.NewGuid()},
                    'pending', {JsonSerializer.Serialize(intakeData)}::jsonb,
                    {now}, {now}
                )", cancellationToken);
            
            // Store pain map data if provided
            if (request.PainPoints != null && request.PainPoints.Any())
            {
                foreach (var painPoint in request.PainPoints)
                {
                    var painMapId = Guid.NewGuid();
                    await _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                        INSERT INTO qivr.pain_maps (
                            id, tenant_id, evaluation_id, body_part, intensity,
                            pain_type, coordinate_x, coordinate_y, coordinate_z,
                            created_at, updated_at
                        ) VALUES (
                            {painMapId}, {tenantId}, {evaluationId},
                            {painPoint.BodyPart}, {painPoint.Intensity},
                            {painPoint.Type ?? "aching"}, 
                            {painPoint.Position?.X ?? 0}, 
                            {painPoint.Position?.Y ?? 0}, 
                            {painPoint.Position?.Z ?? 0},
                            {now}, {now}
                        )", cancellationToken);
                }
            }
            
            // Create intake submission record for tracking
            var intakeId = Guid.NewGuid();
            await _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO qivr.intake_submissions (
                    id, tenant_id, evaluation_id, patient_name, patient_email,
                    condition_type, pain_level, severity, status,
                    submitted_at, created_at, updated_at
                ) VALUES (
                    {intakeId}, {tenantId}, {evaluationId},
                    {request.PersonalInfo.FirstName + " " + request.PersonalInfo.LastName},
                    {request.ContactInfo.Email}, {request.ChiefComplaint},
                    {request.PainLevel}, {GetSeverity(request.PainLevel)}, 'pending',
                    {now}, {now}, {now}
                )", cancellationToken);
            
            _logger.LogInformation("Intake submission created with ID {IntakeId}", intakeId);
            
            // TODO: Send confirmation email
            // TODO: Trigger AI analysis if configured
            // TODO: Notify clinic staff
            
            return CreatedAtAction(
                nameof(GetIntakeStatus),
                new { id = intakeId },
                new IntakeSubmissionResponse 
                { 
                    IntakeId = intakeId,
                    EvaluationId = evaluationId,
                    Message = "Your intake has been submitted successfully. We will contact you within 24 hours.",
                    EstimatedResponseTime = "24 hours"
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process intake submission");
            return StatusCode(500, new { error = "An error occurred processing your submission. Please try again." });
        }
    }

    /// <summary>
    /// Check status of an intake submission (public)
    /// </summary>
    [HttpGet("{id}/status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IntakeStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIntakeStatus(Guid id, CancellationToken cancellationToken)
    {
        var intake = await _dbContext.Database
            .SqlQuery<IntakeStatusDto>($@"
                SELECT id, status, submitted_at as SubmittedAt, 
                       CASE 
                           WHEN status = 'scheduled' THEN 'Your appointment has been scheduled'
                           WHEN status = 'reviewing' THEN 'A clinician is reviewing your intake'
                           WHEN status = 'pending' THEN 'Your intake is in the queue'
                           ELSE 'Please contact the clinic for an update'
                       END as StatusMessage
                FROM qivr.intake_submissions 
                WHERE id = {id}
            ")
            .FirstOrDefaultAsync(cancellationToken);
        
        if (intake == null)
        {
            return NotFound();
        }
        
        return Ok(new IntakeStatusResponse
        {
            IntakeId = intake.Id,
            Status = intake.Status,
            StatusMessage = intake.StatusMessage,
            SubmittedAt = intake.SubmittedAt
        });
    }
    
    private static string GetSeverity(int painLevel)
    {
        return painLevel switch
        {
            >= 8 => "critical",
            >= 6 => "high",
            >= 4 => "medium",
            _ => "low"
        };
    }
}

// Request/Response DTOs
public class IntakeSubmissionRequest
{
    public PersonalInfoDto PersonalInfo { get; set; } = new();
    public ContactInfoDto ContactInfo { get; set; } = new();
    public string ChiefComplaint { get; set; } = string.Empty;
    public List<string> Symptoms { get; set; } = new();
    public int PainLevel { get; set; }
    public string Duration { get; set; } = string.Empty;
    public List<PainPointDto> PainPoints { get; set; } = new();
    public Dictionary<string, object> QuestionnaireResponses { get; set; } = new();
    public IntakeMedicalHistoryDto MedicalHistory { get; set; } = new();
    public ConsentDto Consent { get; set; } = new();
}

public class PersonalInfoDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DateOfBirth { get; set; }
    public string? Gender { get; set; }
}

public class ContactInfoDto
{
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Postcode { get; set; }
}

public class PainPointDto
{
    public string BodyPart { get; set; } = string.Empty;
    public int Intensity { get; set; }
    public string? Type { get; set; }
    public PositionDto? Position { get; set; }
}

public class PositionDto
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}

public class IntakeMedicalHistoryDto
{
    public string? Conditions { get; set; }
    public string? Medications { get; set; }
    public string? Allergies { get; set; }
    public string? PreviousTreatments { get; set; }
}

public class ConsentDto
{
    public bool ConsentToTreatment { get; set; }
    public bool ConsentToPrivacy { get; set; }
    public bool ConsentToMarketing { get; set; }
}

public class IntakeSubmissionResponse
{
    public Guid IntakeId { get; set; }
    public Guid EvaluationId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string EstimatedResponseTime { get; set; } = string.Empty;
}

public class IntakeStatusResponse
{
    public Guid IntakeId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StatusMessage { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}

internal class IntakeStatusDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StatusMessage { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}
