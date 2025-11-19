using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using Qivr.Api.Options;
using Qivr.Infrastructure.Data;
using System.Text.Json;
using System.Linq;

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
        _logger.LogInformation("Processing intake {IntakeId} for evaluation {EvaluationId} (Tenant: {TenantId})", 
            intakeData.IntakeId, intakeData.EvaluationId, intakeData.TenantId);

        var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();
        
        // Load evaluation with patient data
        var evaluation = await dbContext.Evaluations
            .Include(e => e.Patient)
            .Include(e => e.PainMaps)
            .FirstOrDefaultAsync(e => e.Id == intakeData.EvaluationId, cancellationToken);

        if (evaluation == null)
        {
            _logger.LogWarning("Evaluation {EvaluationId} not found", intakeData.EvaluationId);
            return;
        }

        if (_featuresOptions.EnableAiAnalysis)
        {
            _logger.LogInformation("Running AI triage for evaluation {EvaluationId}", intakeData.EvaluationId);
            
            var aiTriageService = scope.ServiceProvider.GetRequiredService<Qivr.Services.AI.IAiTriageService>();
            
            var triageRequest = new Qivr.Services.AI.TriageRequest
            {
                Symptoms = string.Join(", ", evaluation.Symptoms),
                MedicalHistory = JsonSerializer.Serialize(evaluation.MedicalHistory),
                ChiefComplaint = evaluation.ChiefComplaint,
                Duration = evaluation.MedicalHistory.TryGetValue("painOnset", out var onset) ? onset?.ToString() : null,
                Severity = evaluation.PainMaps.Any() ? evaluation.PainMaps.Max(p => p.Intensity) : 5
            };

            var triageSummary = await aiTriageService.GenerateTriageSummaryAsync(evaluation.PatientId, triageRequest);
            
            // Update evaluation with AI results
            evaluation.AiSummary = triageSummary.Summary;
            evaluation.AiRiskFlags = triageSummary.RiskFlags.Select(r => r.Description).ToList();
            evaluation.Urgency = MapUrgencyLevel(triageSummary.UrgencyAssessment.Level);
            evaluation.AiProcessedAt = DateTime.UtcNow;
            evaluation.Status = Qivr.Core.Entities.EvaluationStatus.Triaged;
            
            await dbContext.SaveChangesAsync(cancellationToken);
            
            _logger.LogInformation("AI triage completed for evaluation {EvaluationId}: Urgency={Urgency}, RiskFlags={RiskCount}", 
                intakeData.EvaluationId, evaluation.Urgency, evaluation.AiRiskFlags.Count);
        }

        if (_featuresOptions.SendEmailNotifications)
        {
            _logger.LogInformation("Sending confirmation email for intake {IntakeId}", intakeData.IntakeId);
            // TODO: Send email
        }
    }

    private Qivr.Core.Entities.UrgencyLevel MapUrgencyLevel(string level)
    {
        return level.ToLowerInvariant() switch
        {
            "low" => Qivr.Core.Entities.UrgencyLevel.Low,
            "medium" => Qivr.Core.Entities.UrgencyLevel.Medium,
            "moderate" => Qivr.Core.Entities.UrgencyLevel.Moderate,
            "high" => Qivr.Core.Entities.UrgencyLevel.High,
            "urgent" => Qivr.Core.Entities.UrgencyLevel.Urgent,
            _ => Qivr.Core.Entities.UrgencyLevel.Medium
        };
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
