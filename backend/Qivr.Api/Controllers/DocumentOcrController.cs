using Microsoft.AspNetCore.Mvc;
using Amazon.SQS;
using Amazon.SQS.Model;
using System.Text.Json;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/documents/{documentId}/ocr")]
public class DocumentOcrController : ControllerBase
{
    private readonly IAmazonSQS _sqsClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DocumentOcrController> _logger;

    public DocumentOcrController(
        IAmazonSQS sqsClient,
        IConfiguration configuration,
        ILogger<DocumentOcrController> logger)
    {
        _sqsClient = sqsClient;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("trigger")]
    public async Task<IActionResult> TriggerOcr(Guid documentId, CancellationToken cancellationToken)
    {
        var queueUrl = _configuration["AWS:DocumentOcrQueueUrl"];
        if (string.IsNullOrEmpty(queueUrl))
        {
            return StatusCode(500, "OCR queue not configured");
        }

        try
        {
            var message = new
            {
                documentId = documentId.ToString(),
                s3Bucket = _configuration["AWS:S3:BucketName"],
                s3Key = $"documents/{documentId}" // Adjust based on your S3 structure
            };

            await _sqsClient.SendMessageAsync(new SendMessageRequest
            {
                QueueUrl = queueUrl,
                MessageBody = JsonSerializer.Serialize(message)
            }, cancellationToken);

            _logger.LogInformation("OCR triggered for document {DocumentId}", documentId);
            return Accepted();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to trigger OCR for document {DocumentId}", documentId);
            return StatusCode(500, "Failed to trigger OCR");
        }
    }
}
