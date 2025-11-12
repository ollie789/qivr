using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using Microsoft.Extensions.Options;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Text.Json;

namespace Qivr.Api.Services;

public class EmailConfiguration
{
    public string FromEmail { get; set; } = "noreply@qivr.health";
    public string FromName { get; set; } = "QIVR Health";
    public string Region { get; set; } = "ap-southeast-2";
    public bool Enabled { get; set; } = true;
    public string? SecretsManagerKey { get; set; }
}

public interface IModernEmailService
{
    Task SendEmailAsync(EmailContent content, Guid? tenantId = null);
    Task SendBulkEmailAsync(List<EmailContent> contents, Guid? tenantId = null);
    Task SendTemplatedEmailAsync(string templateName, object templateData, string recipient, Guid? tenantId = null);
}

public class ModernEmailService : IModernEmailService
{
    private readonly IAmazonSimpleEmailService _sesClient;
    private readonly IAmazonSecretsManager _secretsManager;
    private readonly EmailConfiguration _config;
    private readonly ILogger<ModernEmailService> _logger;

    public ModernEmailService(
        IAmazonSimpleEmailService sesClient,
        IAmazonSecretsManager secretsManager,
        IOptions<EmailConfiguration> config,
        ILogger<ModernEmailService> logger)
    {
        _sesClient = sesClient;
        _secretsManager = secretsManager;
        _config = config.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(EmailContent content, Guid? tenantId = null)
    {
        if (!_config.Enabled)
        {
            _logger.LogInformation("Email service disabled. Would send to {To}: {Subject}", 
                content.To, content.Subject);
            return;
        }

        try
        {
            var request = new SendEmailRequest
            {
                Source = $"{_config.FromName} <{_config.FromEmail}>",
                Destination = new Destination
                {
                    ToAddresses = new List<string> { content.To }
                },
                Message = new Message
                {
                    Subject = new Content(content.Subject),
                    Body = new Body
                    {
                        Html = new Content(content.HtmlBody),
                        Text = new Content(content.PlainBody)
                    }
                }
            };

            // Add CC and BCC if provided
            if (content.Cc?.Any() == true)
                request.Destination.CcAddresses.AddRange(content.Cc);
            
            if (content.Bcc?.Any() == true)
                request.Destination.BccAddresses.AddRange(content.Bcc);

            // Add tenant tracking tag
            if (tenantId.HasValue)
            {
                request.Tags.Add(new MessageTag 
                { 
                    Name = "TenantId", 
                    Value = tenantId.Value.ToString() 
                });
            }

            var response = await _sesClient.SendEmailAsync(request);
            
            _logger.LogInformation("Email sent successfully to {To}, MessageId: {MessageId}", 
                content.To, response.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", content.To);
            throw;
        }
    }

    public async Task SendBulkEmailAsync(List<EmailContent> contents, Guid? tenantId = null)
    {
        // Process in batches to avoid rate limits
        const int batchSize = 10;
        
        for (int i = 0; i < contents.Count; i += batchSize)
        {
            var batch = contents.Skip(i).Take(batchSize);
            var tasks = batch.Select(content => SendEmailAsync(content, tenantId));
            
            await Task.WhenAll(tasks);
            
            // Small delay between batches to respect rate limits
            if (i + batchSize < contents.Count)
                await Task.Delay(100);
        }
    }

    public async Task SendTemplatedEmailAsync(string templateName, object templateData, string recipient, Guid? tenantId = null)
    {
        try
        {
            var request = new SendTemplatedEmailRequest
            {
                Source = $"{_config.FromName} <{_config.FromEmail}>",
                Destination = new Destination
                {
                    ToAddresses = new List<string> { recipient }
                },
                Template = templateName,
                TemplateData = JsonSerializer.Serialize(templateData)
            };

            if (tenantId.HasValue)
            {
                request.Tags.Add(new MessageTag 
                { 
                    Name = "TenantId", 
                    Value = tenantId.Value.ToString() 
                });
            }

            var response = await _sesClient.SendTemplatedEmailAsync(request);
            
            _logger.LogInformation("Templated email sent to {To}, Template: {Template}, MessageId: {MessageId}", 
                recipient, templateName, response.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send templated email to {To} using template {Template}", 
                recipient, templateName);
            throw;
        }
    }
}
