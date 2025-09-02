using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using System.Text.Json;
using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Options;
using Qivr.Api.Options;
using Qivr.Api.Workers;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class IntakeController : ControllerBase
{
    private readonly QivrDbContext _dbContext;
    private readonly ILogger<IntakeController> _logger;
    private readonly string _intakeConn;
    private readonly IConfiguration _configuration;
    private readonly IAmazonSQS? _sqsClient;
    private readonly SqsOptions _sqsOptions;
    private readonly FeaturesOptions _featuresOptions;

    public IntakeController(
        QivrDbContext dbContext,
        ILogger<IntakeController> logger,
        IOptions<IntakeDbOptions> intakeOptions,
        IOptions<SqsOptions> sqsOptions,
        IOptions<FeaturesOptions> featuresOptions,
        IConfiguration configuration,
        IAmazonSQS? sqsClient = null)
    {
        _dbContext = dbContext;
        _logger = logger;
        _intakeConn = intakeOptions.Value.ConnectionString ?? throw new InvalidOperationException("Missing Intake:ConnectionString");
        _configuration = configuration;
        _sqsClient = sqsClient;
        _sqsOptions = sqsOptions.Value;
        _featuresOptions = featuresOptions.Value;
    }

    /// <summary>
    /// Public endpoint for widget intake submissions
    /// </summary>
    [EnableRateLimiting("intake")]
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
            
            // If no clinic ID provided, use default from Security settings
            var tenantId = Guid.TryParse(clinicId, out var tid) 
                ? tid 
                : Guid.Parse(_configuration["Security:DefaultTenantId"] ?? "00000000-0000-0000-0000-000000000001");
            
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

            // Use intake connection (restricted role) for DB write
            await using var intakeContext = new QivrDbContext(
                new DbContextOptionsBuilder<QivrDbContext>()
                    .UseNpgsql(_intakeConn,
                        o => o.MigrationsAssembly("Qivr.Infrastructure"))
                    .UseSnakeCaseNamingConvention()
                    .Options);

            // Ensure RLS tenant context is set for this connection (public/anonymous flow)
            await intakeContext.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.tenant_id', {tenantId.ToString()}, true)", cancellationToken);

            // Ensure a patient user exists (or create one) to satisfy NOT NULL FK
            Guid patientId;
            await using (var conn = intakeContext.Database.GetDbConnection())
            {
                if (conn.State != System.Data.ConnectionState.Open)
                {
                    await conn.OpenAsync(cancellationToken);
                }

                await using (var findCmd = conn.CreateCommand())
                {
                    findCmd.CommandText = "SELECT id FROM qivr.users WHERE tenant_id = @tenant AND email = @mail LIMIT 1";
                    var pTenant = findCmd.CreateParameter();
                    pTenant.ParameterName = "@tenant";
                    pTenant.Value = tenantId;
                    findCmd.Parameters.Add(pTenant);
                    var pMail = findCmd.CreateParameter();
                    pMail.ParameterName = "@mail";
                    pMail.Value = request.ContactInfo.Email;
                    findCmd.Parameters.Add(pMail);

                    var existing = await findCmd.ExecuteScalarAsync(cancellationToken);
                    if (existing != null && existing != DBNull.Value)
                    {
                        patientId = (Guid)existing;
                    }
                    else
                    {
                        patientId = Guid.NewGuid();
                        await using var insertCmd = conn.CreateCommand();
                        insertCmd.CommandText = @"INSERT INTO qivr.users (
                                id, tenant_id, email, first_name, last_name, phone, user_type, created_at, updated_at
                            ) VALUES (
                                @id, @tenant, @email, @first, @last, @phone, 'patient', NOW(), NOW()
                            ) RETURNING id";
                        var pId = insertCmd.CreateParameter(); pId.ParameterName = "@id"; pId.Value = patientId; insertCmd.Parameters.Add(pId);
                        var pT = insertCmd.CreateParameter(); pT.ParameterName = "@tenant"; pT.Value = tenantId; insertCmd.Parameters.Add(pT);
                        var pE = insertCmd.CreateParameter(); pE.ParameterName = "@email"; pE.Value = request.ContactInfo.Email; insertCmd.Parameters.Add(pE);
                        var pF = insertCmd.CreateParameter(); pF.ParameterName = "@first"; pF.Value = request.PersonalInfo.FirstName; insertCmd.Parameters.Add(pF);
                        var pL = insertCmd.CreateParameter(); pL.ParameterName = "@last"; pL.Value = request.PersonalInfo.LastName; insertCmd.Parameters.Add(pL);
                        var pPh = insertCmd.CreateParameter(); pPh.ParameterName = "@phone"; pPh.Value = request.ContactInfo.Phone; insertCmd.Parameters.Add(pPh);
                        var newId = await insertCmd.ExecuteScalarAsync(cancellationToken);
                        if (newId == null || newId == DBNull.Value)
                        {
                            throw new InvalidOperationException("Failed to create patient user");
                        }
                    }
                }
            }

            // Generate evaluation number
            var evaluationNumber = $"E-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..8]}";

            // Insert evaluation aligned to schema
            await intakeContext.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO qivr.evaluations (
                    id, tenant_id, patient_id, evaluation_number, status, questionnaire_responses, created_at, updated_at
                ) VALUES (
                    {evaluationId}, {tenantId}, {patientId},
                    {evaluationNumber}, 'pending', {JsonSerializer.Serialize(intakeData)}::jsonb,
                    {now}, {now}
                )", cancellationToken);
            
            // Store pain map data if provided
            if (request.PainPoints != null && request.PainPoints.Any())
            {
                foreach (var painPoint in request.PainPoints)
                {
                    var painMapId = Guid.NewGuid();
                    var coordsJson = JsonSerializer.Serialize(new { x = painPoint.Position?.X ?? 0, y = painPoint.Position?.Y ?? 0, z = painPoint.Position?.Z ?? 0 });
                    await intakeContext.Database.ExecuteSqlInterpolatedAsync($@"
                        INSERT INTO qivr.pain_maps (
                            id, tenant_id, evaluation_id, body_region, anatomical_code, coordinates,
                            pain_intensity, pain_type, created_at, updated_at
                        ) VALUES (
                            {painMapId}, {tenantId}, {evaluationId},
                            {painPoint.BodyPart}, NULL, {coordsJson}::jsonb,
                            {painPoint.Intensity}, {painPoint.Type ?? "aching"},
                            {now}, {now}
                        )", cancellationToken);
                }
            }
            
            // Create intake submission record for tracking
            var intakeId = Guid.NewGuid();
            await intakeContext.Database.ExecuteSqlInterpolatedAsync($@"
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
            
            // Enqueue for async processing if enabled
            if (_featuresOptions.EnableAsyncProcessing && _sqsClient != null && !string.IsNullOrEmpty(_sqsOptions.QueueUrl))
            {
                await EnqueueIntakeForProcessing(intakeId, evaluationId, tenantId, 
                    request.ContactInfo.Email, 
                    $"{request.PersonalInfo.FirstName} {request.PersonalInfo.LastName}",
                    now, cancellationToken);
            }
            else
            {
                _logger.LogWarning("Async processing is disabled or SQS not configured. Skipping queue.");
            }
            
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
                       END as statusmessage
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
    
    private async Task EnqueueIntakeForProcessing(
        Guid intakeId, 
        Guid evaluationId, 
        Guid tenantId,
        string patientEmail,
        string patientName,
        DateTime submittedAt,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get correlation ID from current request context
            var requestId = HttpContext.Request.Headers["X-Request-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
            
            var message = new IntakeQueueMessage
            {
                IntakeId = intakeId,
                EvaluationId = evaluationId,
                TenantId = tenantId,
                PatientEmail = patientEmail,
                PatientName = patientName,
                SubmittedAt = submittedAt,
                RequestId = requestId,
                Metadata = new Dictionary<string, object>
                {
                    ["Source"] = "Widget",
                    ["Version"] = "1.0",
                    ["RequestId"] = requestId
                }
            };

            var sendRequest = new Amazon.SQS.Model.SendMessageRequest
            {
                QueueUrl = _sqsOptions.QueueUrl,
                MessageBody = JsonSerializer.Serialize(message),
                MessageAttributes = new Dictionary<string, Amazon.SQS.Model.MessageAttributeValue>
                {
                    ["IntakeId"] = new Amazon.SQS.Model.MessageAttributeValue { StringValue = intakeId.ToString(), DataType = "String" },
                    ["TenantId"] = new Amazon.SQS.Model.MessageAttributeValue { StringValue = tenantId.ToString(), DataType = "String" },
                    ["MessageType"] = new Amazon.SQS.Model.MessageAttributeValue { StringValue = "IntakeSubmission", DataType = "String" },
                    ["x-request-id"] = new Amazon.SQS.Model.MessageAttributeValue { StringValue = requestId, DataType = "String" }
                }
            };

            var response = await _sqsClient!.SendMessageAsync(sendRequest, cancellationToken);
            _logger.LogInformation("Enqueued intake {IntakeId} to SQS with MessageId {MessageId}", 
                intakeId, response.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enqueue intake {IntakeId} to SQS", intakeId);
            // Don't fail the intake submission if queue is down
        }
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
    [System.Text.Json.Serialization.JsonPropertyName("statusmessage")]
    public string StatusMessage { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}
