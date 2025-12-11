using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Filters;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("webhooks")]
[EnableRateLimiting("webhook")]
[ValidateWebhookSignature] // SECURITY: Validates HMAC signature
public class WebhooksController : ControllerBase
{
    private readonly QivrDbContext _db;
    private readonly ILogger<WebhooksController> _logger;
    private readonly IConfiguration _configuration;

    public WebhooksController(QivrDbContext db, ILogger<WebhooksController> logger, IConfiguration configuration)
    {
        _db = db;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("sms/messagemedia")]
    [AllowAnonymous]
    public async Task<IActionResult> MessageMediaInbound([FromBody] MessageMediaInboundPayload payload)
    {
        // SECURITY: Require explicit tenant - no hardcoded fallback
        var tenantHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!Guid.TryParse(tenantHeader, out var tenantId))
        {
            var configuredDefault = _configuration["Security:DefaultTenantId"];
            if (string.IsNullOrWhiteSpace(configuredDefault))
            {
                _logger.LogWarning("SMS webhook rejected: missing X-Tenant-Id and no default configured");
                return Ok(); // Return OK to prevent webhook retries, but don't process
            }
            tenantId = Guid.Parse(configuredDefault);
        }

        // Ensure RLS tenant context
        await _db.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.tenant_id', {tenantId.ToString()}, true)");

        if (payload?.Messages == null || payload.Messages.Count == 0)
        {
            return Ok();
        }

        foreach (var msg in payload.Messages)
        {
            var body = (msg.Content ?? string.Empty).Trim();
            var from = (msg.SourceNumber ?? string.Empty).Trim();
            var to = (msg.DestinationNumber ?? string.Empty).Trim();

            if (IsOptOut(body))
            {
                await UpdateSmsConsentAsync(tenantId, from, false, "sms_opt_out", msg.MessageId);
            }
            else if (IsOptIn(body))
            {
                await UpdateSmsConsentAsync(tenantId, from, true, "sms_opt_in", msg.MessageId);
            }
        }

        return Ok();
    }

    private static bool IsOptOut(string value)
    {
        var keywords = new[] { "STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "STOPALL" };
        return keywords.Any(k => string.Equals(k, value, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsOptIn(string value)
    {
        var keywords = new[] { "START", "SUBSCRIBE", "YES", "UNSTOP" };
        return keywords.Any(k => string.Equals(k, value, StringComparison.OrdinalIgnoreCase));
    }

    private async Task UpdateSmsConsentAsync(Guid tenantId, string phone, bool granted, string action, string? eventId)
    {
        try
        {
            // Normalize phone (digits only, keep leading +)
            var normalized = NormalizePhone(phone);

            // Update users.consent JSON -> sms: true/false
            await _db.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE public.users
                SET consent = jsonb_set(coalesce(consent, '{{}}'::jsonb), '{{sms}}', {(granted ? "true" : "false")}::jsonb, true),
                    updated_at = NOW()
                WHERE tenant_id = {tenantId} AND REGEXP_REPLACE(coalesce(phone,''), '[^0-9]+', '', 'g') = REGEXP_REPLACE({normalized}, '[^0-9]+', '', 'g')
            ");

            // Write audit log
            await _db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO public.audit_logs (tenant_id, user_id, action, resource_type, resource_id, created_at, metadata)
                VALUES ({tenantId}, NULL, {action}, 'user_consent', NULL, NOW(), jsonb_build_object('phone', {normalized}, 'granted', {granted}, 'event_id', {eventId}))
            ");

            _logger.LogInformation("SMS consent updated via webhook: {Granted} for {Phone}", granted, normalized);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update SMS consent for {Phone}", phone);
        }
    }

    private static string NormalizePhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        return "+" + digits.TrimStart('+');
    }
}

public class MessageMediaInboundPayload
{
    public List<MessageMediaInboundMessage> Messages { get; set; } = new();
}

public class MessageMediaInboundMessage
{
    public string MessageId { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? SourceNumber { get; set; }
    public string? DestinationNumber { get; set; }
    public DateTime? ReceivedTimestamp { get; set; }
}

