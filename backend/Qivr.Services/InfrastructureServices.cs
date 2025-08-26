using System.Net;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Text.Json;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Qivr.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly SmtpClient _smtpClient;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Configure SMTP client (using Mailhog for development)
        _smtpClient = new SmtpClient
        {
            Host = _configuration["Smtp:Host"] ?? "localhost",
            Port = int.Parse(_configuration["Smtp:Port"] ?? "1025"),
            EnableSsl = false, // Mailhog doesn't use SSL
            DeliveryMethod = SmtpDeliveryMethod.Network
        };
    }

    public async Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        try
        {
            var fromEmail = _configuration["Smtp:FromEmail"] ?? "noreply@qivr.health";
            var fromName = _configuration["Smtp:FromName"] ?? "Qivr Health";

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(to));

            await _smtpClient.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Email sent successfully to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }

    public async Task SendTemplateEmailAsync(string to, string templateId, Dictionary<string, string> variables, CancellationToken cancellationToken = default)
    {
        // Load template (in production, templates would be stored in database or S3)
        var template = GetEmailTemplate(templateId);
        
        // Replace variables
        var body = template;
        foreach (var variable in variables)
        {
            body = body.Replace($"{{{{{variable.Key}}}}}", variable.Value);
        }

        await SendEmailAsync(to, GetTemplateSubject(templateId), body, cancellationToken);
    }

    private string GetEmailTemplate(string templateId)
    {
        return templateId switch
        {
            "appointment_confirmation" => @"
                <h2>Appointment Confirmed</h2>
                <p>Dear {{PatientName}},</p>
                <p>Your appointment has been confirmed for {{AppointmentDate}} at {{AppointmentTime}}.</p>
                <p>Provider: {{ProviderName}}</p>
                <p>Location: {{Location}}</p>
                <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
                <p>Best regards,<br>Qivr Health Team</p>",
            "evaluation_complete" => @"
                <h2>Evaluation Complete</h2>
                <p>Dear {{PatientName}},</p>
                <p>Thank you for completing your evaluation. Your healthcare provider will review it shortly.</p>
                <p>Evaluation Number: {{EvaluationNumber}}</p>
                <p>You can view your evaluation details in your patient portal.</p>
                <p>Best regards,<br>Qivr Health Team</p>",
            _ => "<p>{{Content}}</p>"
        };
    }

    private string GetTemplateSubject(string templateId)
    {
        return templateId switch
        {
            "appointment_confirmation" => "Appointment Confirmation",
            "evaluation_complete" => "Evaluation Received",
            _ => "Qivr Health Notification"
        };
    }
}

public class SmsService : ISmsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmsService> _logger;

    public SmsService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<SmsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendSmsAsync(string to, string message, CancellationToken cancellationToken = default)
    {
        try
        {
            // For development, just log the SMS
            if (_configuration["Environment"] == "Development")
            {
                _logger.LogInformation("SMS (Dev Mode) to {To}: {Message}", to, message);
                return;
            }

            // Production: Use MessageMedia API
            var client = _httpClientFactory.CreateClient("MessageMedia");
            var fromNumber = _configuration["MessageMedia:FromNumber"];

            var payload = new
            {
                messages = new[]
                {
                    new
                    {
                        content = message,
                        destination_number = to,
                        source_number = fromNumber
                    }
                }
            };

            var response = await client.PostAsJsonAsync("messages", payload, cancellationToken);
            response.EnsureSuccessStatusCode();

            _logger.LogInformation("SMS sent successfully to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {To}", to);
            throw;
        }
    }
}

public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly IConfiguration _configuration;
    private readonly ILogger<S3StorageService> _logger;
    private readonly string _bucketName;

    public S3StorageService(IConfiguration configuration, ILogger<S3StorageService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _bucketName = _configuration["S3:BucketName"] ?? "qivr-uploads";

        // For development, use MinIO
        if (_configuration["Environment"] == "Development")
        {
            var config = new AmazonS3Config
            {
                ServiceURL = _configuration["S3:Endpoint"] ?? "http://localhost:9000",
                ForcePathStyle = true,
                UseHttp = true
            };

            _s3Client = new AmazonS3Client(
                _configuration["S3:AccessKey"] ?? "minioadmin",
                _configuration["S3:SecretKey"] ?? "minioadmin",
                config
            );
        }
        else
        {
            // Production: Use default AWS credentials
            _s3Client = new AmazonS3Client();
        }
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = $"{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}/{fileName}";

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = fileStream,
                ContentType = contentType,
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
            };

            var response = await _s3Client.PutObjectAsync(request, cancellationToken);

            _logger.LogInformation("File uploaded successfully: {Key}", key);
            return key;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file {FileName}", fileName);
            throw;
        }
    }

    public async Task<Stream> GetFileAsync(string fileKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = fileKey
            };

            var response = await _s3Client.GetObjectAsync(request, cancellationToken);
            return response.ResponseStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get file {FileKey}", fileKey);
            throw;
        }
    }

    public async Task DeleteFileAsync(string fileKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = fileKey
            };

            await _s3Client.DeleteObjectAsync(request, cancellationToken);
            _logger.LogInformation("File deleted successfully: {Key}", fileKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file {FileKey}", fileKey);
            throw;
        }
    }
}
