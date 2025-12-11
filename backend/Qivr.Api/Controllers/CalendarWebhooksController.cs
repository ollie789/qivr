using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("webhooks/calendar")] 
public class CalendarWebhooksController : ControllerBase
{
    private readonly QivrDbContext _db;
    private readonly ILogger<CalendarWebhooksController> _logger;

    public CalendarWebhooksController(QivrDbContext db, ILogger<CalendarWebhooksController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // Google push notifications
    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> Google([FromBody] object payload)
    {
        var channelId = Request.Headers["X-Goog-Channel-ID"].FirstOrDefault() ?? string.Empty;
        var resourceId = Request.Headers["X-Goog-Resource-ID"].FirstOrDefault() ?? string.Empty;

        var eventId = string.IsNullOrEmpty(resourceId) ? Guid.NewGuid().ToString("N") : resourceId;
        var saved = await SaveWebhookEventAsync("google", eventId, payload);
        if (!saved)
        {
            // Already processed
            return Ok();
        }

        _logger.LogInformation("Google Calendar webhook received. Channel: {Channel}, Resource: {Resource}", channelId, resourceId);
        return Ok();
    }

    // Microsoft Graph validation handshake
    [HttpGet("microsoft")] // validationToken handshake
    [AllowAnonymous]
    public IActionResult MicrosoftValidation([FromQuery] string? validationToken)
    {
        if (!string.IsNullOrEmpty(validationToken))
        {
            return Content(validationToken, "text/plain");
        }
        return Ok();
    }

    // Microsoft Graph notifications
    [HttpPost("microsoft")]
    [AllowAnonymous]
    public async Task<IActionResult> Microsoft([FromBody] object payload)
    {
        // Extract an idempotency event id if present
        var eventId = Guid.NewGuid().ToString("N");
        var saved = await SaveWebhookEventAsync("microsoft", eventId, payload);
        if (!saved)
        {
            return Ok();
        }
        _logger.LogInformation("Microsoft Graph calendar webhook received.");
        return Ok();
    }

    private async Task<bool> SaveWebhookEventAsync(string provider, string eventId, object payload)
    {
        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            var inserted = await _db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO public.webhook_events (provider, event_id, idempotency_key, raw_payload, received_at)
                VALUES ({provider}, {eventId}, {eventId}, {json}::jsonb, NOW())
                ON CONFLICT (provider, event_id) DO NOTHING
            ");
            return inserted > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save webhook event");
            return false;
        }
    }
}

