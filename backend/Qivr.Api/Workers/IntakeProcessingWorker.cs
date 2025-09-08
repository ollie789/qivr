using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using Qivr.Api.Options;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Api.Workers;

public class IntakeProcessingWorker : BackgroundService
{
    private readonly ILogger<IntakeProcessingWorker> _logger;
    private readonly IAmazonSQS _sqsClient;
    private readonly SqsOptions _sqsOptions;
    private readonly FeaturesOptions _featuresOptions;
    private readonly IServiceScopeFactory _scopeFactory;

    public IntakeProcessingWorker(
        ILogger<IntakeProcessingWorker> logger,
        IAmazonSQS sqsClient,
        IOptions<SqsOptions> sqsOptions,
        IOptions<FeaturesOptions> featuresOptions,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _sqsClient = sqsClient;
        _sqsOptions = sqsOptions.Value;
        _featuresOptions = featuresOptions.Value;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_featuresOptions.ProcessIntakeQueue)
        {
            _logger.LogInformation("Intake queue processing is disabled");
            return;
        }

        if (string.IsNullOrEmpty(_sqsOptions.QueueUrl))
        {
            _logger.LogError("SQS Queue URL is not configured");
            return;
        }

        _logger.LogInformation("Starting intake processing worker for queue: {QueueUrl}", _sqsOptions.QueueUrl);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessQueueMessages(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing SQS messages");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }

    private async Task ProcessQueueMessages(CancellationToken cancellationToken)
    {
        var receiveRequest = new ReceiveMessageRequest
        {
            QueueUrl = _sqsOptions.QueueUrl,
            MaxNumberOfMessages = _sqsOptions.MaxNumberOfMessages,
            WaitTimeSeconds = _sqsOptions.WaitTimeSeconds,
            VisibilityTimeout = _sqsOptions.VisibilityTimeout,
            MessageAttributeNames = new List<string> { "All" }
        };

        var response = await _sqsClient.ReceiveMessageAsync(receiveRequest, cancellationToken);

        if (response.Messages.Count == 0)
        {
            _logger.LogDebug("No messages available in queue");
            return;
        }

        _logger.LogInformation("Received {Count} messages from queue", response.Messages.Count);

        var tasks = response.Messages.Select(message => ProcessMessage(message, cancellationToken));
        await Task.WhenAll(tasks);
    }

    private async Task ProcessMessage(Message message, CancellationToken cancellationToken)
    {
        try
        {
            // Extract correlation ID from message attributes for logging scope
            string? requestId = null;
            if (message.MessageAttributes != null && 
                message.MessageAttributes.TryGetValue("x-request-id", out var attr))
            {
                requestId = attr.StringValue;
            }
            
            using (_logger.BeginScope(new Dictionary<string, object?> { ["requestId"] = requestId }))
            {
                _logger.LogInformation("Processing message {MessageId}", message.MessageId);

                var intakeData = JsonSerializer.Deserialize<IntakeQueueMessage>(message.Body);
                if (intakeData == null)
                {
                    _logger.LogWarning("Failed to deserialize message: {MessageId}", message.MessageId);
                    await DeleteMessage(message, cancellationToken);
                    return;
                }

                // Check idempotency and set tenant context
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();
                
                await using var connection = dbContext.Database.GetDbConnection() as NpgsqlConnection;
                if (connection == null)
                {
                    throw new InvalidOperationException("Expected NpgsqlConnection");
                }
                
                await connection.OpenAsync(cancellationToken);
                
                // Start a transaction for tenant context and idempotency
                await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
                
                // Set tenant context for RLS
                await using (var tenantCmd = new NpgsqlCommand(
                    "SELECT set_config('app.tenant_id', @tid, true);", connection, transaction))
                {
                    tenantCmd.Parameters.AddWithValue("tid", intakeData.TenantId.ToString());
                    await tenantCmd.ExecuteNonQueryAsync(cancellationToken);
                }
                
                // Check idempotency - try to insert message ID
                await using (var dedupeCmd = new NpgsqlCommand(
                    @"INSERT INTO qivr.intake_dedupe(message_id) 
                      VALUES(@id) 
                      ON CONFLICT DO NOTHING 
                      RETURNING 1;", connection, transaction))
                {
                    dedupeCmd.Parameters.AddWithValue("id", message.MessageId);
                    var inserted = await dedupeCmd.ExecuteScalarAsync(cancellationToken);
                    
                    if (inserted == null)
                    {
                        _logger.LogInformation("Duplicate SQS message {MessageId}, skipping", message.MessageId);
                        await DeleteMessage(message, cancellationToken);
                        return;
                    }
                }
                
                await transaction.CommitAsync(cancellationToken);
                
                // Process the intake with tenant context established
                await ProcessIntake(intakeData, scope, cancellationToken);
                await DeleteMessage(message, cancellationToken);
                
                _logger.LogInformation("Successfully processed intake {IntakeId} for tenant {TenantId}", 
                    intakeData.IntakeId, intakeData.TenantId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process message {MessageId}", message.MessageId);
            // Message will return to queue after visibility timeout
        }
    }

    private async Task ProcessIntake(IntakeQueueMessage intakeData, IServiceScope scope, CancellationToken cancellationToken)
    {
        // Tenant context is already established by the caller
        var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();
        
        _logger.LogInformation("Processing intake {IntakeId} for evaluation {EvaluationId} (Tenant: {TenantId})", 
            intakeData.IntakeId, intakeData.EvaluationId, intakeData.TenantId);

        try
        {
            // 1. Retrieve the evaluation data
            var evaluation = await dbContext.Database
                .SqlQuery<EvaluationData>($@"
                    SELECT id, questionnaire_responses, created_at
                    FROM qivr.evaluations 
                    WHERE id = {intakeData.EvaluationId}
                    AND tenant_id = {intakeData.TenantId}")
                .FirstOrDefaultAsync(cancellationToken);
                
            if (evaluation == null)
            {
                _logger.LogWarning("Evaluation {EvaluationId} not found", intakeData.EvaluationId);
                return;
            }

            // 2. Process with AI if enabled
            if (_featuresOptions.EnableAiAnalysis)
            {
                _logger.LogInformation("Triggering AI analysis for intake {IntakeId}", intakeData.IntakeId);
                
                try
                {
                    var aiService = scope.ServiceProvider.GetService<IAiTriageService>();
                    if (aiService != null)
                    {
                        // Parse evaluation data
                        var evaluationJson = JsonSerializer.Deserialize<Dictionary<string, object>>(evaluation.QuestionnaireResponses);
                        var symptoms = evaluationJson?.GetValueOrDefault("symptoms")?.ToString() ?? "";
                        var chiefComplaint = evaluationJson?.GetValueOrDefault("chiefComplaint")?.ToString() ?? "";
                        var painLevel = Convert.ToInt32(evaluationJson?.GetValueOrDefault("painLevel") ?? 5);
                        
                        // Create triage request
                        var triageRequest = new TriageRequest
                        {
                            Id = Guid.NewGuid(),
                            Symptoms = $"{chiefComplaint}. {symptoms}",
                            Severity = painLevel > 7 ? "High" : painLevel > 4 ? "Medium" : "Low",
                            Duration = evaluationJson?.GetValueOrDefault("duration")?.ToString(),
                            MedicalHistory = evaluationJson?.GetValueOrDefault("medicalHistory")?.ToString()
                        };
                        
                        // Generate AI triage summary
                        var triageSummary = await aiService.GenerateTriageSummaryAsync(
                            intakeData.EvaluationId, 
                            triageRequest
                        );
                        
                        // Store AI summary in evaluation
                        await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                            UPDATE qivr.evaluations 
                            SET 
                                ai_summary = {JsonSerializer.Serialize(triageSummary)}::jsonb,
                                triage_priority = {triageSummary.UrgencyLevel.ToString()},
                                updated_at = NOW()
                            WHERE id = {intakeData.EvaluationId}
                            AND tenant_id = {intakeData.TenantId}",
                            cancellationToken);
                            
                        _logger.LogInformation("AI analysis completed for intake {IntakeId}. Urgency: {Urgency}", 
                            intakeData.IntakeId, triageSummary.UrgencyLevel);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "AI analysis failed for intake {IntakeId}, continuing processing", intakeData.IntakeId);
                }
            }

            // 3. Create or update patient record
            await CreateOrUpdatePatientRecord(intakeData, dbContext, cancellationToken);

            // 4. Send confirmation email
            if (_featuresOptions.SendEmailNotifications)
            {
                _logger.LogInformation("Sending confirmation email for intake {IntakeId}", intakeData.IntakeId);
                
                var emailService = scope.ServiceProvider.GetService<IEmailService>();
                if (emailService != null)
                {
                    await emailService.SendIntakeConfirmationAsync(
                        intakeData.PatientEmail,
                        intakeData.PatientName,
                        intakeData.IntakeId.ToString()
                    );
                }
            }

            // 5. Notify clinic staff
            await NotifyClinicStaff(intakeData, scope, cancellationToken);

            // 6. Update intake status to processed
            await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE qivr.intake_submissions 
                SET 
                    status = 'processed',
                    processed_at = NOW(),
                    updated_at = NOW()
                WHERE id = {intakeData.IntakeId}
                AND tenant_id = {intakeData.TenantId}",
                cancellationToken);
                
            _logger.LogInformation("Successfully processed intake {IntakeId}", intakeData.IntakeId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing intake {IntakeId}", intakeData.IntakeId);
            
            // Update intake status to failed
            await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE qivr.intake_submissions 
                SET 
                    status = 'failed',
                    error_message = {ex.Message},
                    updated_at = NOW()
                WHERE id = {intakeData.IntakeId}
                AND tenant_id = {intakeData.TenantId}",
                cancellationToken);
                
            throw;
        }
    }
    
    private async Task CreateOrUpdatePatientRecord(
        IntakeQueueMessage intakeData, 
        QivrDbContext dbContext, 
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if patient record exists
            var existingPatient = await dbContext.Database
                .SqlQuery<Guid?>($@"
                    SELECT id FROM qivr.patients 
                    WHERE email = {intakeData.PatientEmail} 
                    AND tenant_id = {intakeData.TenantId}
                    LIMIT 1")
                .FirstOrDefaultAsync(cancellationToken);
                
            if (existingPatient == null)
            {
                // Create new patient record
                var patientId = Guid.NewGuid();
                await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                    INSERT INTO qivr.patients (
                        id, tenant_id, user_id, first_name, last_name, 
                        email, medical_record_number, created_at, updated_at
                    ) VALUES (
                        {patientId}, {intakeData.TenantId}, {intakeData.EvaluationId},
                        {intakeData.PatientName.Split(' ')[0]}, 
                        {string.Join(" ", intakeData.PatientName.Split(' ').Skip(1))},
                        {intakeData.PatientEmail}, 
                        {$"MRN-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8]}"},
                        NOW(), NOW()
                    )",
                    cancellationToken);
                    
                _logger.LogInformation("Created new patient record {PatientId} for intake {IntakeId}", 
                    patientId, intakeData.IntakeId);
            }
            else
            {
                // Link intake to existing patient
                await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                    UPDATE qivr.intake_submissions 
                    SET patient_id = {existingPatient.Value}
                    WHERE id = {intakeData.IntakeId}",
                    cancellationToken);
                    
                _logger.LogInformation("Linked intake {IntakeId} to existing patient {PatientId}", 
                    intakeData.IntakeId, existingPatient.Value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create/update patient record for intake {IntakeId}", intakeData.IntakeId);
        }
    }
    
    private async Task NotifyClinicStaff(
        IntakeQueueMessage intakeData, 
        IServiceScope scope, 
        CancellationToken cancellationToken)
    {
        try
        {
            var notificationService = scope.ServiceProvider.GetService<INotificationService>();
            if (notificationService != null)
            {
                await notificationService.NotifyNewIntakeAsync(
                    intakeData.TenantId,
                    intakeData.IntakeId,
                    intakeData.PatientName,
                    "New intake submission requires review"
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to notify clinic staff for intake {IntakeId}", intakeData.IntakeId);
        }
    }

    private async Task DeleteMessage(Message message, CancellationToken cancellationToken)
    {
        try
        {
            var deleteRequest = new DeleteMessageRequest
            {
                QueueUrl = _sqsOptions.QueueUrl,
                ReceiptHandle = message.ReceiptHandle
            };

            await _sqsClient.DeleteMessageAsync(deleteRequest, cancellationToken);
            _logger.LogDebug("Deleted message {MessageId} from queue", message.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete message {MessageId}", message.MessageId);
        }
    }
}

public class IntakeQueueMessage
{
    public Guid IntakeId { get; set; }
    public Guid EvaluationId { get; set; }
    public Guid TenantId { get; set; }
    public string PatientEmail { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public string? RequestId { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
