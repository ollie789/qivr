using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;

namespace Qivr.Api.Services;

public class EmailContent
{
    public required string To { get; set; }
    public required string Subject { get; set; }
    public required string HtmlBody { get; set; }
    public required string PlainBody { get; set; }
    public List<string> Cc { get; set; } = new();
    public List<string> Bcc { get; set; } = new();
}

public interface IEmailService
{
    Task SendEmailAsync(EmailContent content);
    Task SendBulkEmailAsync(List<EmailContent> contents);
}

public class EmailSettings
{
    public string Provider { get; set; } = "ses";
    public string FromEmail { get; set; } = "noreply@qivr.health";
    public string FromName { get; set; } = "QIVR Health";
    public bool Enabled { get; set; } = true;
    public string Region { get; set; } = "ap-southeast-2";
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;
    private readonly IHostEnvironment _environment;

    public EmailService(
        IOptions<EmailSettings> settings,
        ILogger<EmailService> logger,
        IHostEnvironment environment)
    {
        _settings = settings.Value;
        _logger = logger;
        _environment = environment;
    }

    public async Task SendEmailAsync(EmailContent content)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Email service is disabled. Would have sent email to {To} with subject: {Subject}", 
                content.To, content.Subject);
            return;
        }

        try
        {
            // Use ModernEmailService for SES integration
            _logger.LogWarning("EmailService is deprecated. Please use IModernEmailService for SES integration.");
            
            // For backward compatibility, log the email details
            _logger.LogInformation("Email would be sent to {To} with subject: {Subject}", 
                content.To, content.Subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing email to {To}", content.To);
            throw;
        }
    }

    public async Task SendBulkEmailAsync(List<EmailContent> contents)
    {
        var tasks = contents.Select(content => SendEmailAsync(content));
        await Task.WhenAll(tasks);
    }

    private MailMessage CreateMailMessage(EmailContent content)
    {
        // Deprecated - kept for backward compatibility
        // Use IModernEmailService for new implementations
        var message = new MailMessage
        {
            From = new MailAddress(_settings.FromEmail, _settings.FromName),
            Subject = content.Subject,
            Body = content.PlainBody ?? content.HtmlBody ?? string.Empty,
            IsBodyHtml = !string.IsNullOrEmpty(content.HtmlBody)
        };

        message.To.Add(content.To);
        return message;
    }
}
