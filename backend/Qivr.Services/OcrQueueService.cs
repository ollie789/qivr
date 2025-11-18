using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Qivr.Services;

public interface IOcrQueueService
{
    Task QueueDocumentForOcrAsync(Guid documentId, string s3Bucket, string s3Key, CancellationToken cancellationToken = default);
}

public class OcrQueueService : IOcrQueueService
{
    private readonly IAmazonSQS _sqsClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OcrQueueService> _logger;

    public OcrQueueService(
        IAmazonSQS sqsClient,
        IConfiguration configuration,
        ILogger<OcrQueueService> logger)
    {
        _sqsClient = sqsClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task QueueDocumentForOcrAsync(Guid documentId, string s3Bucket, string s3Key, CancellationToken cancellationToken = default)
    {
        var queueUrl = _configuration["AWS:OcrQueueUrl"];
        if (string.IsNullOrEmpty(queueUrl))
        {
            _logger.LogWarning("OCR queue URL not configured, skipping OCR processing");
            return;
        }

        try
        {
            var message = new
            {
                documentId = documentId.ToString(),
                s3Bucket,
                s3Key
            };

            await _sqsClient.SendMessageAsync(new SendMessageRequest
            {
                QueueUrl = queueUrl,
                MessageBody = JsonSerializer.Serialize(message)
            }, cancellationToken);

            _logger.LogInformation("Queued document {DocumentId} for OCR processing", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to queue document {DocumentId} for OCR", documentId);
            // Don't throw - OCR is optional
        }
    }
}
