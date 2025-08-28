using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services
{
    public interface INotificationGate
    {
        Task<(bool allow, string? reason)> CanSendSmsAsync(
            Guid tenantId, 
            Guid userId, 
            string clinicTimeZoneId, 
            CancellationToken cancellationToken = default);
        
        Task<(bool allow, string? reason)> CanSendEmailAsync(
            Guid tenantId, 
            Guid userId, 
            CancellationToken cancellationToken = default);
    }
    
    public sealed class NotificationGate : INotificationGate
    {
        private readonly IQuietHoursService _quietHours;
        private readonly QivrDbContext _db;
        private readonly ILogger<NotificationGate> _logger;
        
        public NotificationGate(
            IQuietHoursService quietHours,
            QivrDbContext db,
            ILogger<NotificationGate> logger)
        {
            _quietHours = quietHours;
            _db = db;
            _logger = logger;
        }
        
        public async Task<(bool allow, string? reason)> CanSendSmsAsync(
            Guid tenantId, 
            Guid userId, 
            string clinicTimeZoneId, 
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Check user consent
                var user = await _db.Database
                    .SqlQuery<UserConsentDto>($@"
                        SELECT consent_sms as ConsentSms, phone_e164 as PhoneE164
                        FROM qivr.users 
                        WHERE id = {userId} AND tenant_id = {tenantId}")
                    .FirstOrDefaultAsync(cancellationToken);
                
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found for tenant {TenantId}", userId, tenantId);
                    return (false, "user-not-found");
                }
                
                // Check consent
                if (!user.ConsentSms)
                {
                    _logger.LogInformation("SMS blocked for user {UserId}: no consent", userId);
                    return (false, "no-consent");
                }
                
                // Check if phone number exists
                if (string.IsNullOrWhiteSpace(user.PhoneE164))
                {
                    _logger.LogInformation("SMS blocked for user {UserId}: no phone number", userId);
                    return (false, "no-phone");
                }
                
                // Check quiet hours
                if (_quietHours.IsQuietNow(clinicTimeZoneId, DateTimeOffset.Now))
                {
                    _logger.LogInformation("SMS blocked for user {UserId}: quiet hours", userId);
                    return (false, "quiet-hours");
                }
                
                return (true, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking SMS permission for user {UserId}", userId);
                return (false, "error");
            }
        }
        
        public async Task<(bool allow, string? reason)> CanSendEmailAsync(
            Guid tenantId, 
            Guid userId, 
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Check user exists and has email
                var user = await _db.Database
                    .SqlQuery<UserEmailDto>($@"
                        SELECT email as Email, email_verified as EmailVerified
                        FROM qivr.users 
                        WHERE id = {userId} AND tenant_id = {tenantId}")
                    .FirstOrDefaultAsync(cancellationToken);
                
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found for tenant {TenantId}", userId, tenantId);
                    return (false, "user-not-found");
                }
                
                // Check if email exists
                if (string.IsNullOrWhiteSpace(user.Email))
                {
                    _logger.LogInformation("Email blocked for user {UserId}: no email", userId);
                    return (false, "no-email");
                }
                
                // Optionally check if email is verified
                if (user.EmailVerified == false)
                {
                    _logger.LogInformation("Email blocked for user {UserId}: email not verified", userId);
                    return (false, "email-not-verified");
                }
                
                // Emails typically don't have quiet hours restrictions
                return (true, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking email permission for user {UserId}", userId);
                return (false, "error");
            }
        }
        
        // DTOs for SQL queries
        private class UserConsentDto
        {
            public bool ConsentSms { get; set; }
            public string? PhoneE164 { get; set; }
        }
        
        private class UserEmailDto
        {
            public string? Email { get; set; }
            public bool? EmailVerified { get; set; }
        }
    }
}
