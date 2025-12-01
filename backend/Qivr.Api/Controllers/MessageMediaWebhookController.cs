using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using Qivr.Api.Contracts;
using Qivr.Api.Options;
using Qivr.Api.Services;
using Qivr.Api.Utilities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers
{
    [ApiController]
    [AllowAnonymous] // Consider adding HMAC verification
    [Route("webhooks/messagemedia")]
    public sealed class MessageMediaWebhookController : ControllerBase
    {
        private readonly QivrDbContext _db;
        private readonly IAuditLogger _auditLogger;
        private readonly NotificationsOptions _options;
        private readonly ILogger<MessageMediaWebhookController> _logger;
        
        public MessageMediaWebhookController(
            QivrDbContext db,
            IAuditLogger auditLogger,
            IOptions<NotificationsOptions> options,
            ILogger<MessageMediaWebhookController> logger)
        {
            _db = db;
            _auditLogger = auditLogger;
            _options = options.Value;
            _logger = logger;
        }
        
        [HttpPost("inbound")]
        public async Task<IActionResult> HandleInbound(
            [FromBody] MessageMediaWebhook webhook,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Received MessageMedia webhook: MessageId={MessageId}, From={From}, Content={Content}",
                    webhook.MessageId, webhook.From, webhook.Content);
                
                // Extract tenant from header - SECURITY: require explicit tenant
                var tenantHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
                if (!Guid.TryParse(tenantHeader, out var tenantId))
                {
                    _logger.LogWarning("MessageMedia webhook rejected: missing or invalid X-Tenant-Id header");
                    return BadRequest(new { error = "X-Tenant-Id header is required" });
                }
                
                // Set tenant context for RLS
                await SetTenantContext(tenantId, cancellationToken);
                
                // Normalize phone number
                var phoneE164 = PhoneUtil.ToE164Australia(webhook.From);
                if (string.IsNullOrWhiteSpace(phoneE164))
                {
                    _logger.LogWarning("Invalid phone number in webhook: {Phone}", webhook.From);
                    return Ok(new { status = "ignored", reason = "invalid-phone" });
                }
                
                // Check for STOP/START keywords
                var (isStop, isStart) = PhoneUtil.CheckOptOutKeywords(webhook.Content);
                
                if (!isStop && !isStart)
                {
                    _logger.LogDebug("No STOP/START keyword found in message");
                    return Ok(new { status = "ignored", reason = "no-keyword" });
                }
                
                // Find user by phone number
                var user = await _db.Database
                    .SqlQuery<UserDto>($@"
                        SELECT id as Id, tenant_id as TenantId, consent_sms as ConsentSms, 
                               first_name as FirstName, last_name as LastName, email as Email
                        FROM qivr.users 
                        WHERE phone_e164 = {phoneE164} AND tenant_id = {tenantId}")
                    .FirstOrDefaultAsync(cancellationToken);
                
                if (user == null)
                {
                    _logger.LogWarning("No user found for phone {Phone} in tenant {TenantId}", 
                        phoneE164, tenantId);
                    return Ok(new { status = "ignored", reason = "user-not-found" });
                }
                
                // Process consent change
                if (isStop && user.ConsentSms)
                {
                    await UpdateConsent(user.Id, tenantId, false, "STOP received", cancellationToken);
                    await SendStopConfirmation(phoneE164, user, cancellationToken);
                    
                    return Ok(new { 
                        status = "processed", 
                        action = "opted-out",
                        userId = user.Id 
                    });
                }
                else if (isStart && !user.ConsentSms)
                {
                    await UpdateConsent(user.Id, tenantId, true, "START received", cancellationToken);
                    await SendStartConfirmation(phoneE164, user, cancellationToken);
                    
                    return Ok(new { 
                        status = "processed", 
                        action = "opted-in",
                        userId = user.Id 
                    });
                }
                
                _logger.LogInformation("No consent change needed for user {UserId}", user.Id);
                return Ok(new { 
                    status = "no-change", 
                    currentConsent = user.ConsentSms 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing MessageMedia webhook");
                // Return 200 to prevent retries
                return Ok(new { status = "error", message = "Internal error" });
            }
        }
        
        [HttpPost("delivery")]
        public async Task<IActionResult> HandleDeliveryReport(
            [FromBody] MessageMediaWebhook webhook,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Received delivery report: MessageId={MessageId}, Status={Status}",
                    webhook.MessageId, webhook.Status);
                
                // Process delivery reports if needed
                // Could update message status in database, trigger retries, etc.
                
                return Ok(new { status = "received" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing delivery report");
                return Ok(new { status = "error" });
            }
        }
        
        private async Task SetTenantContext(Guid tenantId, CancellationToken cancellationToken)
        {
            await using var conn = _db.Database.GetDbConnection() as NpgsqlConnection;
            if (conn == null)
                throw new InvalidOperationException("Expected NpgsqlConnection");
            
            if (conn.State != System.Data.ConnectionState.Open)
                await conn.OpenAsync(cancellationToken);
            
            await using var cmd = new NpgsqlCommand(
                "SELECT set_config('app.tenant_id', @tid, true);", conn);
            cmd.Parameters.AddWithValue("tid", tenantId.ToString());
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        
        private async Task UpdateConsent(
            Guid userId, 
            Guid tenantId, 
            bool newConsent, 
            string reason,
            CancellationToken cancellationToken)
        {
            // Update user consent
            await _db.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE qivr.users 
                SET consent_sms = {newConsent}, 
                    updated_at = NOW()
                WHERE id = {userId} AND tenant_id = {tenantId}",
                cancellationToken);
            
            // Log consent change
            await _auditLogger.LogConsentChangeAsync(
                tenantId,
                userId,
                "sms",
                !newConsent,
                newConsent,
                reason,
                cancellationToken);
            
            _logger.LogInformation("Updated SMS consent for user {UserId} to {Consent} (Reason: {Reason})",
                userId, newConsent, reason);
        }
        
        private async Task SendStopConfirmation(string phone, UserDto user, CancellationToken cancellationToken)
        {
            // TODO: Send confirmation SMS via MessageMedia or notification service
            _logger.LogInformation("Would send STOP confirmation to {Phone} for {Name}", 
                phone, $"{user.FirstName} {user.LastName}");
            
            // Example message:
            // "You've been unsubscribed from Qivr SMS. Reply START to resubscribe. 
            //  For help, contact your clinic."
        }
        
        private async Task SendStartConfirmation(string phone, UserDto user, CancellationToken cancellationToken)
        {
            // TODO: Send confirmation SMS via MessageMedia or notification service
            _logger.LogInformation("Would send START confirmation to {Phone} for {Name}", 
                phone, $"{user.FirstName} {user.LastName}");
            
            // Example message:
            // "Welcome back! You're now subscribed to Qivr SMS notifications. 
            //  Reply STOP to unsubscribe at any time."
        }
        
        // DTO for user query
        private class UserDto
        {
            public Guid Id { get; set; }
            public Guid TenantId { get; set; }
            public bool ConsentSms { get; set; }
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Email { get; set; }
        }
    }
}
