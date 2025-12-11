using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Text.Json;
using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Options;
using Qivr.Api.Options;
using Qivr.Api.Workers;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/intake")]
[EnableCors("IntakeWidget")]
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
            // SECURITY: Require explicit configuration - no hardcoded fallback
            var configuredDefault = _configuration["Security:DefaultTenantId"];
            if (!Guid.TryParse(clinicId, out var tid))
            {
                if (string.IsNullOrWhiteSpace(configuredDefault))
                {
                    _logger.LogError("Intake submission rejected: no clinic ID provided and Security:DefaultTenantId not configured");
                    return BadRequest(new { error = "Clinic ID is required" });
                }
                tid = Guid.Parse(configuredDefault);
            }
            var tenantId = tid;
            
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
            // RACE CONDITION FIX: Use INSERT ... ON CONFLICT DO NOTHING pattern
            // Two simultaneous intakes for the same email could both try to create
            var patientId = await FindOrCreatePatientAsync(
                intakeContext,
                tenantId,
                request.ContactInfo.Email,
                request.PersonalInfo.FirstName,
                request.PersonalInfo.LastName,
                request.ContactInfo.Phone,
                now,
                cancellationToken);

            // Generate evaluation number
            var evaluationNumber = $"E-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..8]}";

            // Create evaluation using EF Core entity
            var evaluation = new Evaluation
            {
                Id = evaluationId,
                TenantId = tenantId,
                PatientId = patientId,
                EvaluationNumber = evaluationNumber,
                ChiefComplaint = request.ChiefComplaint,
                Symptoms = request.Symptoms,
                QuestionnaireResponses = intakeData,
                MedicalHistory = new Dictionary<string, object>
                {
                    ["conditions"] = request.MedicalHistory.Conditions != null ? string.Join(", ", request.MedicalHistory.Conditions) : "",
                    ["medications"] = request.MedicalHistory.Medications != null ? string.Join(", ", request.MedicalHistory.Medications) : "",
                    ["allergies"] = request.MedicalHistory.Allergies != null ? string.Join(", ", request.MedicalHistory.Allergies) : "",
                    ["previousTreatments"] = request.MedicalHistory.PreviousTreatments ?? ""
                },
                Status = EvaluationStatus.Pending,
                CreatedAt = now,
                UpdatedAt = now
            };
            intakeContext.Evaluations.Add(evaluation);

            // Store pain map data if provided
            if (request.PainMapData != null && request.PainMapData.Regions.Any())
            {
                // Get primary region for body_region field (most intense)
                var primaryRegion = request.PainMapData.Regions
                    .OrderByDescending(r => r.Intensity)
                    .FirstOrDefault();

                var painMap = new PainMap
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    EvaluationId = evaluationId,
                    BodyRegion = primaryRegion?.AnatomicalName ?? "Multiple regions",
                    AnatomicalCode = primaryRegion?.SnomedCode,
                    PainIntensity = primaryRegion?.Intensity ?? 0,
                    DrawingDataJson = JsonSerializer.Serialize(new
                    {
                        regions = request.PainMapData.Regions,
                        cameraView = request.PainMapData.CameraView,
                        timestamp = request.PainMapData.Timestamp
                    }),
                    AvatarType = "male",
                    ViewOrientation = request.PainMapData.CameraView,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                intakeContext.PainMaps.Add(painMap);
            }
            else if (request.PainPoints != null && request.PainPoints.Any())
            {
                // Legacy: Store old pain points format
                foreach (var painPoint in request.PainPoints)
                {
                    var painMap = new PainMap
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        EvaluationId = evaluationId,
                        BodyRegion = painPoint.BodyPart,
                        AnatomicalCode = null,
                        Coordinates = new PainCoordinates
                        {
                            X = painPoint.Position?.X ?? 0,
                            Y = painPoint.Position?.Y ?? 0,
                            Z = painPoint.Position?.Z ?? 0
                        },
                        PainIntensity = painPoint.Intensity,
                        PainType = painPoint.Type ?? "aching",
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    intakeContext.PainMaps.Add(painMap);
                }
            }

            // Create intake submission record for tracking
            var intakeSubmission = new IntakeSubmission
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                EvaluationId = evaluationId,
                PatientName = $"{request.PersonalInfo.FirstName} {request.PersonalInfo.LastName}",
                PatientEmail = request.ContactInfo.Email,
                ConditionType = request.ChiefComplaint,
                PainLevel = request.PainLevel,
                Severity = GetSeverity(request.PainLevel),
                Status = IntakeStatus.Pending,
                SubmittedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            intakeContext.IntakeSubmissions.Add(intakeSubmission);

            // Save all entities in a single transaction
            await intakeContext.SaveChangesAsync(cancellationToken);

            var intakeId = intakeSubmission.Id;
            
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
        var intake = await _dbContext.IntakeSubmissions
            .IgnoreQueryFilters()
            .Where(i => i.Id == id)
            .Select(i => new
            {
                i.Id,
                Status = i.Status.ToString().ToLowerInvariant(),
                i.SubmittedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (intake == null)
        {
            return NotFound();
        }

        var statusMessage = intake.Status switch
        {
            "scheduled" => "Your appointment has been scheduled",
            "reviewing" => "A clinician is reviewing your intake",
            "pending" => "Your intake is in the queue",
            _ => "Please contact the clinic for an update"
        };

        return Ok(new IntakeStatusResponse
        {
            IntakeId = intake.Id,
            Status = intake.Status,
            StatusMessage = statusMessage,
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
    
    /// <summary>
    /// Find or create a patient user with race condition handling.
    /// Uses Postgres INSERT ... ON CONFLICT DO NOTHING to handle simultaneous creates.
    /// </summary>
    private async Task<Guid> FindOrCreatePatientAsync(
        QivrDbContext context,
        Guid tenantId,
        string email,
        string firstName,
        string lastName,
        string phone,
        DateTime now,
        CancellationToken cancellationToken)
    {
        // First attempt: check if user exists
        var existingUserId = await context.Users
            .IgnoreQueryFilters()
            .Where(u => u.TenantId == tenantId && u.Email == email)
            .Select(u => u.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingUserId != Guid.Empty)
        {
            return existingUserId;
        }

        // User doesn't exist - try to create with conflict handling
        var newUserId = Guid.NewGuid();
        var cognitoSub = $"intake-{Guid.NewGuid()}";

        try
        {
            // Use raw SQL with ON CONFLICT DO NOTHING to handle race conditions
            // This is atomic and prevents duplicate key errors
            var rowsAffected = await context.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO public.users (
                    id, tenant_id, cognito_sub, email, email_verified, phone_verified,
                    first_name, last_name, phone, user_type, roles, preferences, consent,
                    created_at, updated_at
                ) VALUES (
                    {newUserId}, {tenantId}, {cognitoSub}, {email}, false, false,
                    {firstName}, {lastName}, {phone}, 'Patient', ARRAY['Patient']::text[], '{{}}'::jsonb, '{{}}'::jsonb,
                    {now}, {now}
                )
                ON CONFLICT (tenant_id, email) DO NOTHING
            ", cancellationToken);

            if (rowsAffected > 0)
            {
                _logger.LogInformation("Created new patient user {UserId} for intake", newUserId);
                return newUserId;
            }

            // Insert was skipped due to conflict - another request created the user
            // Re-fetch the existing user ID
            var actualUserId = await context.Users
                .IgnoreQueryFilters()
                .Where(u => u.TenantId == tenantId && u.Email == email)
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (actualUserId != Guid.Empty)
            {
                _logger.LogDebug("Found existing user {UserId} after conflict", actualUserId);
                return actualUserId;
            }

            // This shouldn't happen, but handle it gracefully
            throw new InvalidOperationException($"Failed to find or create user for email: {email}");
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key") == true ||
                                           ex.InnerException?.Message.Contains("unique constraint") == true)
        {
            // Race condition occurred - retry the lookup
            _logger.LogDebug("Handled duplicate key race condition for email {Email}", email);

            var actualUserId = await context.Users
                .IgnoreQueryFilters()
                .Where(u => u.TenantId == tenantId && u.Email == email)
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (actualUserId != Guid.Empty)
            {
                return actualUserId;
            }

            throw; // Re-throw if we still can't find the user
        }
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
    public PainMapDataDto? PainMapData { get; set; } // NEW: 3D pain map support
    public Dictionary<string, object> QuestionnaireResponses { get; set; } = new();
    public IntakeMedicalHistoryDto MedicalHistory { get; set; } = new();
    public ConsentDto Consent { get; set; } = new();
}

// NEW: 3D Pain Map DTOs
public class PainMapDataDto
{
    public List<PainRegionDto> Regions { get; set; } = new();
    public string CameraView { get; set; } = "front";
    public string Timestamp { get; set; } = string.Empty;
}

public class PainRegionDto
{
    public string MeshName { get; set; } = string.Empty;
    public string? AnatomicalName { get; set; }
    public string Quality { get; set; } = string.Empty;
    public int Intensity { get; set; }
    public string? SnomedCode { get; set; }
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
    public List<string>? Conditions { get; set; }
    public List<string>? Medications { get; set; }
    public List<string>? Allergies { get; set; }
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
