using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;

namespace Qivr.Api.Services;

public class EmailContent
{
    public string To { get; set; }
    public string Subject { get; set; }
    public string HtmlBody { get; set; }
    public string PlainBody { get; set; }
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
    public string Provider { get; set; } = "smtp";
    public string SmtpHost { get; set; } = "localhost";
    public int SmtpPort { get; set; } = 1025;
    public string SmtpUsername { get; set; }
    public string SmtpPassword { get; set; }
    public bool SmtpUseSsl { get; set; } = false;
    public string FromEmail { get; set; } = "noreply@qivr.health";
    public string FromName { get; set; } = "Qivr Health";
    public bool Enabled { get; set; } = true;
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
            if (_settings.Provider.ToLower() == "smtp")
            {
                await SendSmtpEmailAsync(content);
            }
            else if (_settings.Provider.ToLower() == "mailhog" || _environment.IsDevelopment())
            {
                // In development, use Mailhog which is running in Docker
                await SendMailhogEmailAsync(content);
            }
            else
            {
                _logger.LogWarning("Unknown email provider: {Provider}", _settings.Provider);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {To}", content.To);
            throw;
        }
    }

    public async Task SendBulkEmailAsync(List<EmailContent> contents)
    {
        var tasks = contents.Select(content => SendEmailAsync(content));
        await Task.WhenAll(tasks);
    }

    private async Task SendSmtpEmailAsync(EmailContent content)
    {
        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.SmtpUseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        if (!string.IsNullOrEmpty(_settings.SmtpUsername))
        {
            client.Credentials = new NetworkCredential(_settings.SmtpUsername, _settings.SmtpPassword);
        }

        var message = CreateMailMessage(content);
        
        await client.SendMailAsync(message);
        _logger.LogInformation("Email sent successfully to {To} via SMTP", content.To);
    }

    private async Task SendMailhogEmailAsync(EmailContent content)
    {
        // Mailhog configuration for local development
        var mailhogHost = _environment.IsDevelopment() ? "localhost" : "mailhog";
        var mailhogPort = 1025;

        using var client = new SmtpClient(mailhogHost, mailhogPort)
        {
            EnableSsl = false,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        var message = CreateMailMessage(content);
        
        await client.SendMailAsync(message);
        _logger.LogInformation("Email sent to Mailhog for {To}. View at http://localhost:8025", content.To);
    }

    private MailMessage CreateMailMessage(EmailContent content)
    {
        var message = new MailMessage
        {
            From = new MailAddress(_settings.FromEmail, _settings.FromName),
            Subject = content.Subject,
            IsBodyHtml = !string.IsNullOrEmpty(content.HtmlBody),
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8
        };

        message.To.Add(content.To);

        // Add CC recipients
        foreach (var cc in content.Cc ?? new List<string>())
        {
            message.CC.Add(cc);
        }

        // Add BCC recipients
        foreach (var bcc in content.Bcc ?? new List<string>())
        {
            message.Bcc.Add(bcc);
        }

        // Set body
        if (!string.IsNullOrEmpty(content.HtmlBody))
        {
            message.Body = content.HtmlBody;
            
            // Add plain text alternative view if provided
            if (!string.IsNullOrEmpty(content.PlainBody))
            {
                var plainView = AlternateView.CreateAlternateViewFromString(
                    content.PlainBody, 
                    Encoding.UTF8, 
                    "text/plain");
                
                var htmlView = AlternateView.CreateAlternateViewFromString(
                    content.HtmlBody, 
                    Encoding.UTF8, 
                    "text/html");
                
                message.AlternateViews.Add(plainView);
                message.AlternateViews.Add(htmlView);
            }
        }
        else
        {
            message.Body = content.PlainBody ?? string.Empty;
            message.IsBodyHtml = false;
        }

        return message;
    }
}
