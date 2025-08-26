using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Qivr.Core.Interfaces;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using System.Text.RegularExpressions;

namespace Qivr.Services.Notifications;

public class SmsNotificationService : ISmsNotificationService
{
    private readonly ILogger<SmsNotificationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _accountSid;
    private readonly string _authToken;
    private readonly string _fromNumber;
    private readonly bool _isEnabled;

    public SmsNotificationService(
        ILogger<SmsNotificationService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _accountSid = _configuration["Twilio:AccountSid"] ?? "";
        _authToken = _configuration["Twilio:AuthToken"] ?? "";
        _fromNumber = _configuration["Twilio:FromNumber"] ?? "";
        _isEnabled = !string.IsNullOrEmpty(_accountSid) && !string.IsNullOrEmpty(_authToken);

        if (_isEnabled)
        {
            TwilioClient.Init(_accountSid, _authToken);
        }
    }

    public async Task<SmsResult> SendSmsAsync(SmsMessage message)
    {
        if (!_isEnabled)
        {
            _logger.LogWarning("SMS service is not configured. Message not sent to {To}", message.To);
            return new SmsResult
            {
                Success = false,
                Error = "SMS service not configured"
            };
        }

        try
        {
            // Validate and format phone number
            var formattedNumber = FormatPhoneNumber(message.To);
            if (string.IsNullOrEmpty(formattedNumber))
            {
                return new SmsResult
                {
                    Success = false,
                    Error = "Invalid phone number format"
                };
            }

            // Apply template if provided
            var messageBody = message.TemplateId != null 
                ? ApplyTemplate(message.TemplateId, message.TemplateData)
                : message.Body;

            // Check for quiet hours (9 PM to 9 AM local time)
            if (message.RespectQuietHours && IsInQuietHours(message.RecipientTimeZone))
            {
                _logger.LogInformation("Message queued for quiet hours. Will send after 9 AM local time");
                // In production, this would queue the message
                return new SmsResult
                {
                    Success = true,
                    MessageId = Guid.NewGuid().ToString(),
                    Status = "queued",
                    QueuedUntil = GetNextSendTime(message.RecipientTimeZone)
                };
            }

            var twilioMessage = await MessageResource.CreateAsync(
                body: messageBody,
                from: new PhoneNumber(_fromNumber),
                to: new PhoneNumber(formattedNumber),
                statusCallback: message.StatusCallbackUrl != null ? new Uri(message.StatusCallbackUrl) : null
            );

            _logger.LogInformation("SMS sent successfully to {To} with SID {Sid}", 
                formattedNumber, twilioMessage.Sid);

            return new SmsResult
            {
                Success = true,
                MessageId = twilioMessage.Sid,
                Status = twilioMessage.Status.ToString(),
                Cost = twilioMessage.Price,
                Currency = twilioMessage.PriceUnit
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {To}", message.To);
            return new SmsResult
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async Task<SmsResult> SendBulkSmsAsync(List<SmsMessage> messages)
    {
        var results = new List<SmsResult>();
        var tasks = messages.Select(message => SendSmsAsync(message));
        var individualResults = await Task.WhenAll(tasks);
        
        return new SmsResult
        {
            Success = individualResults.All(r => r.Success),
            BulkResults = individualResults.ToList(),
            Error = individualResults.Any(r => !r.Success) 
                ? $"{individualResults.Count(r => !r.Success)} messages failed" 
                : null
        };
    }

    public async Task<InboundSms?> ProcessInboundSmsAsync(Dictionary<string, string> twilioData)
    {
        try
        {
            var inboundSms = new InboundSms
            {
                From = twilioData.GetValueOrDefault("From", ""),
                To = twilioData.GetValueOrDefault("To", ""),
                Body = twilioData.GetValueOrDefault("Body", ""),
                MessageSid = twilioData.GetValueOrDefault("MessageSid", ""),
                ReceivedAt = DateTime.UtcNow
            };

            // Check for STOP/UNSUBSCRIBE keywords
            if (IsOptOutKeyword(inboundSms.Body))
            {
                inboundSms.IsOptOut = true;
                await HandleOptOutAsync(inboundSms.From);
            }
            // Check for START/SUBSCRIBE keywords
            else if (IsOptInKeyword(inboundSms.Body))
            {
                inboundSms.IsOptIn = true;
                await HandleOptInAsync(inboundSms.From);
            }

            _logger.LogInformation("Processed inbound SMS from {From}: {Body}", 
                inboundSms.From, inboundSms.Body);

            return inboundSms;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process inbound SMS");
            return null;
        }
    }

    public async Task<bool> UpdateDeliveryStatusAsync(string messageId, string status)
    {
        try
        {
            _logger.LogInformation("SMS {MessageId} status updated to: {Status}", messageId, status);
            // Store in database for tracking
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update delivery status for {MessageId}", messageId);
            return false;
        }
    }

    private string FormatPhoneNumber(string phoneNumber)
    {
        // Remove all non-numeric characters
        var cleaned = Regex.Replace(phoneNumber, @"\D", "");
        
        // Australian number formatting
        if (cleaned.StartsWith("61"))
        {
            return $"+{cleaned}";
        }
        else if (cleaned.StartsWith("0") && cleaned.Length == 10)
        {
            return $"+61{cleaned.Substring(1)}";
        }
        else if (cleaned.Length == 9)
        {
            return $"+61{cleaned}";
        }
        
        // US number formatting
        else if (cleaned.Length == 10)
        {
            return $"+1{cleaned}";
        }
        else if (cleaned.StartsWith("1") && cleaned.Length == 11)
        {
            return $"+{cleaned}";
        }
        
        return "";
    }

    private string ApplyTemplate(string templateId, Dictionary<string, string>? data)
    {
        var templates = new Dictionary<string, string>
        {
            ["appointment_reminder"] = "Hi {PatientName}, this is a reminder about your appointment with {ProviderName} on {Date} at {Time}. Reply CONFIRM to confirm or CANCEL to cancel.",
            ["prom_reminder"] = "Hi {PatientName}, it's time for your health assessment. Please complete it here: {Link}. Reply STOP to opt out.",
            ["appointment_confirmed"] = "Your appointment with {ProviderName} on {Date} at {Time} has been confirmed. We'll see you then!",
            ["appointment_cancelled"] = "Your appointment on {Date} has been cancelled. Please call us to reschedule."
        };

        if (!templates.ContainsKey(templateId))
            return $"Template {templateId} not found";

        var template = templates[templateId];
        if (data != null)
        {
            foreach (var kvp in data)
            {
                template = template.Replace($"{{{kvp.Key}}}", kvp.Value);
            }
        }

        return template;
    }

    private bool IsInQuietHours(string? timeZone)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(timeZone ?? "Australia/Sydney");
        var localTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        return localTime.Hour >= 21 || localTime.Hour < 9;
    }

    private DateTime GetNextSendTime(string? timeZone)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(timeZone ?? "Australia/Sydney");
        var localTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        
        if (localTime.Hour >= 21)
        {
            // Next day at 9 AM
            return TimeZoneInfo.ConvertTimeToUtc(
                localTime.Date.AddDays(1).AddHours(9), tz);
        }
        else
        {
            // Today at 9 AM
            return TimeZoneInfo.ConvertTimeToUtc(
                localTime.Date.AddHours(9), tz);
        }
    }

    private bool IsOptOutKeyword(string message)
    {
        var keywords = new[] { "STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "STOPALL" };
        return keywords.Any(k => message.Trim().Equals(k, StringComparison.OrdinalIgnoreCase));
    }

    private bool IsOptInKeyword(string message)
    {
        var keywords = new[] { "START", "SUBSCRIBE", "YES", "UNSTOP" };
        return keywords.Any(k => message.Trim().Equals(k, StringComparison.OrdinalIgnoreCase));
    }

    private async Task HandleOptOutAsync(string phoneNumber)
    {
        _logger.LogInformation("User {PhoneNumber} opted out of SMS", phoneNumber);
        // Update user preferences in database
        await Task.CompletedTask;
    }

    private async Task HandleOptInAsync(string phoneNumber)
    {
        _logger.LogInformation("User {PhoneNumber} opted in to SMS", phoneNumber);
        // Update user preferences in database
        await Task.CompletedTask;
    }
}

public class SmsMessage
{
    public string To { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? TemplateId { get; set; }
    public Dictionary<string, string>? TemplateData { get; set; }
    public bool RespectQuietHours { get; set; } = true;
    public string? RecipientTimeZone { get; set; }
    public string? StatusCallbackUrl { get; set; }
}

public class SmsResult
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string? Status { get; set; }
    public string? Error { get; set; }
    public string? Cost { get; set; }
    public string? Currency { get; set; }
    public DateTime? QueuedUntil { get; set; }
    public List<SmsResult>? BulkResults { get; set; }
}

public class InboundSms
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string MessageSid { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
    public bool IsOptOut { get; set; }
    public bool IsOptIn { get; set; }
}

public interface ISmsNotificationService
{
    Task<SmsResult> SendSmsAsync(SmsMessage message);
    Task<SmsResult> SendBulkSmsAsync(List<SmsMessage> messages);
    Task<InboundSms?> ProcessInboundSmsAsync(Dictionary<string, string> twilioData);
    Task<bool> UpdateDeliveryStatusAsync(string messageId, string status);
}
