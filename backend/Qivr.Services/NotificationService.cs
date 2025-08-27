using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Qivr.Services;

public interface INotificationService
{
    Task SendEmailAsync(string to, string subject, string htmlContent, string? plainTextContent = null, CancellationToken ct = default);
    Task SendSmsAsync(string to, string message, CancellationToken ct = default);
    Task SendPromReminderAsync(Guid patientId, Guid promInstanceId, string templateName, DateTime dueDate, CancellationToken ct = default);
    Task SendAppointmentReminderAsync(Guid patientId, Guid appointmentId, DateTime appointmentTime, string providerName, CancellationToken ct = default);
    Task SendProviderAssignmentNotificationAsync(Guid providerId, Guid intakeId, string message, CancellationToken ct = default);
    Task SendBulkEmailAsync(IEnumerable<string> recipients, string subject, string htmlContent, CancellationToken ct = default);
    Task<NotificationStatus> GetNotificationStatusAsync(Guid notificationId, CancellationToken ct = default);
}

public class NotificationService : INotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationService> _logger;
    private readonly ISendGridClient _sendGridClient;
    private readonly HttpClient _httpClient;
    private readonly string _twilioAccountSid;
    private readonly string _twilioAuthToken;
    private readonly string _twilioFromNumber;
    private readonly string _sendGridFromEmail;
    private readonly string _sendGridFromName;

    public NotificationService(
        IConfiguration configuration,
        ILogger<NotificationService> logger,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;

        // Initialize SendGrid
        var sendGridApiKey = _configuration["SendGrid:ApiKey"];
        _sendGridClient = new SendGridClient(sendGridApiKey);
        _sendGridFromEmail = _configuration["SendGrid:FromEmail"] ?? "noreply@qivr.com";
        _sendGridFromName = _configuration["SendGrid:FromName"] ?? "Qivr Health";

        // Initialize Twilio
        _twilioAccountSid = _configuration["Twilio:AccountSid"] ?? "";
        _twilioAuthToken = _configuration["Twilio:AuthToken"] ?? "";
        _twilioFromNumber = _configuration["Twilio:FromNumber"] ?? "";
        
        if (!string.IsNullOrEmpty(_twilioAccountSid) && !string.IsNullOrEmpty(_twilioAuthToken))
        {
            TwilioClient.Init(_twilioAccountSid, _twilioAuthToken);
        }
    }

    public async Task SendEmailAsync(
        string to,
        string subject,
        string htmlContent,
        string? plainTextContent = null,
        CancellationToken ct = default)
    {
        try
        {
            var from = new EmailAddress(_sendGridFromEmail, _sendGridFromName);
            var toEmail = new EmailAddress(to);
            var msg = MailHelper.CreateSingleEmail(from, toEmail, subject, plainTextContent ?? "", htmlContent);
            
            // Add tracking settings
            msg.SetClickTracking(true, true);
            msg.SetOpenTracking(true);
            
            // Add custom headers for tracking
            msg.AddHeader("X-Notification-Type", "general");
            msg.AddHeader("X-Sent-At", DateTime.UtcNow.ToString("O"));
            
            var response = await _sendGridClient.SendEmailAsync(msg, ct);
            
            if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
            {
                var body = await response.Body.ReadAsStringAsync(ct);
                _logger.LogError("Failed to send email to {Email}. Status: {Status}, Body: {Body}", 
                    to, response.StatusCode, body);
                throw new Exception($"Failed to send email: {response.StatusCode}");
            }
            
            _logger.LogInformation("Email sent successfully to {Email} with subject: {Subject}", to, subject);
            
            // Log notification in database
            await LogNotificationAsync(
                NotificationType.Email,
                to,
                subject,
                htmlContent,
                NotificationStatus.Sent,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", to);
            await LogNotificationAsync(
                NotificationType.Email,
                to,
                subject,
                htmlContent,
                NotificationStatus.Failed,
                ct);
            throw;
        }
    }

    public async Task SendSmsAsync(string to, string message, CancellationToken ct = default)
    {
        try
        {
            // Quiet hours: 9 PM - 9 AM Australia/Sydney (simple default)
            if (IsInQuietHours("Australia/Sydney"))
            {
                _logger.LogInformation("Quiet hours in effect; SMS queued/skipped for {Phone}", to);
                await LogNotificationAsync(
                    NotificationType.Sms,
                    to,
                    "SMS",
                    message,
                    NotificationStatus.Pending,
                    ct);
                return;
            }

            if (string.IsNullOrEmpty(_twilioAccountSid))
            {
                _logger.LogWarning("Twilio not configured, skipping SMS to {Phone}", to);
                return;
            }

            var messageResource = await MessageResource.CreateAsync(
                body: message,
                from: new Twilio.Types.PhoneNumber(_twilioFromNumber),
                to: new Twilio.Types.PhoneNumber(to)
            );
            
            _logger.LogInformation("SMS sent successfully to {Phone}. SID: {Sid}", to, messageResource.Sid);
            
            await LogNotificationAsync(
                NotificationType.Sms,
                to,
                "SMS",
                message,
                NotificationStatus.Sent,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending SMS to {Phone}", to);
            await LogNotificationAsync(
                NotificationType.Sms,
                to,
                "SMS",
                message,
                NotificationStatus.Failed,
                ct);
            throw;
        }
    }

    private bool IsInQuietHours(string timeZone)
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            return local.Hour >= 21 || local.Hour < 9;
        }
        catch
        {
            // Fallback to UTC check (unlikely to be used)
            var h = DateTime.UtcNow.Hour;
            return h >= 21 || h < 9;
        }
    }

    public async Task SendPromReminderAsync(
        Guid patientId,
        Guid promInstanceId,
        string templateName,
        DateTime dueDate,
        CancellationToken ct = default)
    {
        // Get patient contact info
        var patient = await GetPatientContactInfoAsync(patientId, ct);
        if (patient == null)
        {
            _logger.LogWarning("Patient {PatientId} not found for PROM reminder", patientId);
            return;
        }

        var subject = $"Reminder: Please complete your {templateName} assessment";
        var dueIn = (dueDate - DateTime.UtcNow).Days;
        
        var htmlContent = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Health Assessment Reminder</h2>
                <p>Dear {patient.Name},</p>
                <p>This is a friendly reminder to complete your <strong>{templateName}</strong> assessment.</p>
                <p>Your assessment is due <strong>{(dueIn > 0 ? $"in {dueIn} days" : "today")}</strong>.</p>
                <div style='margin: 30px 0;'>
                    <a href='https://portal.qivr.com/prom/{promInstanceId}' 
                       style='background-color: #4CAF50; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;'>
                        Complete Assessment
                    </a>
                </div>
                <p>Completing this assessment helps us provide you with the best possible care.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <hr style='margin-top: 30px; border: none; border-top: 1px solid #ddd;'>
                <p style='font-size: 12px; color: #666;'>
                    This is an automated reminder from Qivr Health. 
                    If you've already completed this assessment, please disregard this message.
                </p>
            </body>
            </html>";

        // Send email
        if (!string.IsNullOrEmpty(patient.Email))
        {
            await SendEmailAsync(patient.Email, subject, htmlContent, ct: ct);
        }

        // Send SMS if configured
        if (!string.IsNullOrEmpty(patient.Phone) && !string.IsNullOrEmpty(_twilioAccountSid))
        {
            var smsMessage = $"Reminder: Please complete your {templateName} assessment. " +
                           $"Due {(dueIn > 0 ? $"in {dueIn} days" : "today")}. " +
                           $"Visit: https://portal.qivr.com/p/{promInstanceId}";
            await SendSmsAsync(patient.Phone, smsMessage, ct);
        }
    }

    public async Task SendAppointmentReminderAsync(
        Guid patientId,
        Guid appointmentId,
        DateTime appointmentTime,
        string providerName,
        CancellationToken ct = default)
    {
        var patient = await GetPatientContactInfoAsync(patientId, ct);
        if (patient == null) return;

        var subject = $"Appointment Reminder - {appointmentTime:MMM d, yyyy}";
        var htmlContent = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Appointment Reminder</h2>
                <p>Dear {patient.Name},</p>
                <p>This is a reminder about your upcoming appointment:</p>
                <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <p><strong>Date:</strong> {appointmentTime:dddd, MMMM d, yyyy}</p>
                    <p><strong>Time:</strong> {appointmentTime:h:mm tt}</p>
                    <p><strong>Provider:</strong> {providerName}</p>
                </div>
                <p>Please arrive 10 minutes early to complete any necessary paperwork.</p>
                <div style='margin: 30px 0;'>
                    <a href='https://portal.qivr.com/appointments/{appointmentId}' 
                       style='background-color: #2196F3; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;'>
                        View Appointment Details
                    </a>
                </div>
                <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
            </body>
            </html>";

        await SendEmailAsync(patient.Email, subject, htmlContent, ct: ct);
    }

    public async Task SendProviderAssignmentNotificationAsync(
        Guid providerId,
        Guid intakeId,
        string message,
        CancellationToken ct = default)
    {
        var provider = await GetProviderContactInfoAsync(providerId, ct);
        if (provider == null) return;

        var subject = "New Patient Intake Assignment";
        var htmlContent = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Intake Assignment Notification</h2>
                <p>Hello {provider.Name},</p>
                <p>{message}</p>
                <div style='margin: 30px 0;'>
                    <a href='https://dashboard.qivr.com/intake/{intakeId}' 
                       style='background-color: #FF9800; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;'>
                        View Intake Details
                    </a>
                </div>
                <p>Please review the intake at your earliest convenience.</p>
            </body>
            </html>";

        await SendEmailAsync(provider.Email, subject, htmlContent, ct: ct);
    }

    public async Task SendBulkEmailAsync(
        IEnumerable<string> recipients,
        string subject,
        string htmlContent,
        CancellationToken ct = default)
    {
        var from = new EmailAddress(_sendGridFromEmail, _sendGridFromName);
        var tos = recipients.Select(r => new EmailAddress(r)).ToList();
        
        // SendGrid allows up to 1000 recipients per request
        const int batchSize = 1000;
        var batches = tos.Select((to, i) => new { to, i })
            .GroupBy(x => x.i / batchSize)
            .Select(g => g.Select(x => x.to).ToList());

        foreach (var batch in batches)
        {
            var msg = MailHelper.CreateSingleEmailToMultipleRecipients(
                from, batch, subject, "", htmlContent, showAllRecipients: false);
            
            msg.SetClickTracking(true, true);
            msg.SetOpenTracking(true);
            
            var response = await _sendGridClient.SendEmailAsync(msg, ct);
            
            if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
            {
                _logger.LogError("Failed to send bulk email. Status: {Status}", response.StatusCode);
            }
        }
        
        _logger.LogInformation("Bulk email sent to {Count} recipients", recipients.Count());
    }

    public async Task<NotificationStatus> GetNotificationStatusAsync(
        Guid notificationId,
        CancellationToken ct = default)
    {
        // Query notification status from database
        // This would be implemented with actual database queries
        await Task.Delay(1, ct);
        return NotificationStatus.Sent;
    }

    private async Task<PatientContactInfo?> GetPatientContactInfoAsync(Guid patientId, CancellationToken ct)
    {
        // This would query the database for patient contact info
        // Mock implementation for now
        await Task.Delay(1, ct);
        return new PatientContactInfo
        {
            Name = "Patient Name",
            Email = "patient@example.com",
            Phone = "+1234567890"
        };
    }

    private async Task<ProviderContactInfo?> GetProviderContactInfoAsync(Guid providerId, CancellationToken ct)
    {
        // This would query the database for provider contact info
        // Mock implementation for now
        await Task.Delay(1, ct);
        return new ProviderContactInfo
        {
            Name = "Dr. Provider",
            Email = "provider@clinic.com",
            Phone = "+1234567890"
        };
    }

    private async Task LogNotificationAsync(
        NotificationType type,
        string recipient,
        string subject,
        string content,
        NotificationStatus status,
        CancellationToken ct)
    {
        // Log notification to database for tracking
        _logger.LogDebug("Notification logged: Type={Type}, Recipient={Recipient}, Status={Status}",
            type, recipient, status);
        await Task.Delay(1, ct);
    }

    private class PatientContactInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }

    private class ProviderContactInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }
}

public enum NotificationType
{
    Email,
    Sms,
    Push
}

public enum NotificationStatus
{
    Pending,
    Sent,
    Delivered,
    Failed,
    Bounced,
    Opened,
    Clicked
}
