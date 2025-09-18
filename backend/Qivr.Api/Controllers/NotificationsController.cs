using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Security.Claims;
using Qivr.Api.Models;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        QivrDbContext context,
        ILogger<NotificationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get notifications with traditional pagination (for backward compatibility)
    /// </summary>
    [HttpGet("page")]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotificationsPaged(
        [FromQuery] bool? unreadOnly = false,
        [FromQuery] NotificationChannel? channel = null,
        [FromQuery] int pageSize = 20,
        [FromQuery] int page = 1)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var query = _context.Set<Notification>()
            .Where(n => n.TenantId == tenantId && n.RecipientId == userId);

        if (unreadOnly == true)
            query = query.Where(n => n.ReadAt == null);

        if (channel.HasValue)
            query = query.Where(n => n.Channel == channel.Value);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                Channel = n.Channel,
                Priority = n.Priority,
                Data = n.Data,
                ReadAt = n.ReadAt,
                SentAt = n.SentAt,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }
    
    /// <summary>
    /// Get notifications with cursor-based pagination (new, more efficient)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<CursorPaginationResponse<NotificationDto>>> GetNotifications(
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 20,
        [FromQuery] bool? unreadOnly = false,
        [FromQuery] NotificationChannel? channel = null,
        [FromQuery] bool sortDescending = true)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var query = _context.Set<Notification>()
            .Where(n => n.TenantId == tenantId && n.RecipientId == userId);

        if (unreadOnly == true)
            query = query.Where(n => n.ReadAt == null);

        if (channel.HasValue)
            query = query.Where(n => n.Channel == channel.Value);

        // Use cursor pagination
        var paginationRequest = new CursorPaginationRequest
        {
            Cursor = cursor,
            Limit = limit,
            SortBy = "CreatedAt",
            SortDescending = sortDescending
        };

        var paginatedResult = await query.ToCursorPageAsync(
            n => n.CreatedAt,
            n => n.Id,
            paginationRequest);

        // Transform to DTOs
        var response = new CursorPaginationResponse<NotificationDto>
        {
            Items = paginatedResult.Items.Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                Channel = n.Channel,
                Priority = n.Priority,
                Data = n.Data,
                ReadAt = n.ReadAt,
                SentAt = n.SentAt,
                CreatedAt = n.CreatedAt
            }).ToList(),
            NextCursor = paginatedResult.NextCursor,
            PreviousCursor = paginatedResult.PreviousCursor,
            HasNext = paginatedResult.HasNext,
            HasPrevious = paginatedResult.HasPrevious,
            Count = paginatedResult.Count
        };

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDto>> GetNotification(Guid id)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var notification = await _context.Set<Notification>()
            .Where(n => n.TenantId == tenantId && n.Id == id && n.RecipientId == userId)
            .FirstOrDefaultAsync();

        if (notification == null)
            return NotFound();

        return Ok(new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            Channel = notification.Channel,
            Priority = notification.Priority,
            Data = notification.Data,
            ReadAt = notification.ReadAt,
            SentAt = notification.SentAt,
            CreatedAt = notification.CreatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Clinician")]
    public async Task<ActionResult<NotificationDto>> CreateNotification(CreateNotificationRequest request)
    {
        var tenantId = GetTenantId();
        var senderId = GetUserId();

        // Validate recipient exists
        var recipient = await _context.Users
            .Where(u => u.Id == request.RecipientId && u.TenantId == tenantId)
            .FirstOrDefaultAsync();

        if (recipient == null)
            return BadRequest(new { message = "Recipient not found" });

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            RecipientId = request.RecipientId,
            SenderId = senderId,
            Type = request.Type,
            Title = request.Title,
            Message = request.Message,
            Channel = request.Channel,
            Priority = request.Priority,
            Data = request.Data,
            ScheduledFor = request.ScheduledFor,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<Notification>().Add(notification);
        await _context.SaveChangesAsync();

        // If scheduled for immediate delivery, send now
        if (request.ScheduledFor == null || request.ScheduledFor <= DateTime.UtcNow)
        {
            await SendNotification(notification);
        }

        _logger.LogInformation("Notification created: {NotificationId}", notification.Id);

        return CreatedAtAction(nameof(GetNotification), new { id = notification.Id }, new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            Channel = notification.Channel,
            Priority = notification.Priority,
            Data = notification.Data,
            CreatedAt = notification.CreatedAt
        });
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BulkNotificationResult>> SendBulkNotification(BulkNotificationRequest request)
    {
        var tenantId = GetTenantId();
        var senderId = GetUserId();

        var recipients = await _context.Users
            .Where(u => request.RecipientIds.Contains(u.Id) && u.TenantId == tenantId)
            .Select(u => u.Id)
            .ToListAsync();

        var notifications = new List<Notification>();
        foreach (var recipientId in recipients)
        {
            notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RecipientId = recipientId,
                SenderId = senderId,
                Type = request.Type,
                Title = request.Title,
                Message = request.Message,
                Channel = request.Channel,
                Priority = request.Priority,
                Data = request.Data,
                ScheduledFor = request.ScheduledFor,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.Set<Notification>().AddRange(notifications);
        await _context.SaveChangesAsync();

        // Send notifications if not scheduled for future
        var sentCount = 0;
        if (request.ScheduledFor == null || request.ScheduledFor <= DateTime.UtcNow)
        {
            foreach (var notification in notifications)
            {
                if (await SendNotification(notification))
                    sentCount++;
            }
        }

        _logger.LogInformation("Bulk notifications created: {Count} notifications", notifications.Count);

        return Ok(new BulkNotificationResult
        {
            TotalRecipients = request.RecipientIds.Count,
            SuccessfulRecipients = recipients.Count,
            NotificationsSent = sentCount
        });
    }

    [HttpPut("{id}/mark-read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var notification = await _context.Set<Notification>()
            .Where(n => n.TenantId == tenantId && n.Id == id && n.RecipientId == userId)
            .FirstOrDefaultAsync();

        if (notification == null)
            return NotFound();

        if (notification.ReadAt == null)
        {
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var unreadNotifications = await _context.Set<Notification>()
            .Where(n => n.TenantId == tenantId && n.RecipientId == userId && n.ReadAt == null)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Marked {unreadNotifications.Count} notifications as read" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var notification = await _context.Set<Notification>()
            .Where(n => n.TenantId == tenantId && n.Id == id && n.RecipientId == userId)
            .FirstOrDefaultAsync();

        if (notification == null)
            return NotFound();

        _context.Set<Notification>().Remove(notification);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("preferences")]
    public async Task<ActionResult<NotificationPreferencesDto>> GetPreferences()
    {
        var userId = GetUserId();

        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new NotificationPreferencesDto
            {
                EmailEnabled = u.Preferences.ContainsKey("email") 
                    ? (bool)u.Preferences["email"] : true,
                SmsEnabled = u.Preferences.ContainsKey("sms") 
                    ? (bool)u.Preferences["sms"] : true,
                PushEnabled = u.Preferences.ContainsKey("push") 
                    ? (bool)u.Preferences["push"] : true,
                QuietHoursStart = u.Preferences.ContainsKey("quietHoursStart") 
                    ? u.Preferences["quietHoursStart"].ToString() : null,
                QuietHoursEnd = u.Preferences.ContainsKey("quietHoursEnd") 
                    ? u.Preferences["quietHoursEnd"].ToString() : null,
                PreferredChannel = u.Preferences.ContainsKey("preferredChannel") 
                    ? Enum.Parse<NotificationChannel>(u.Preferences["preferredChannel"].ToString()!) 
                    : NotificationChannel.Email
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreferences(UpdateNotificationPreferencesRequest request)
    {
        var userId = GetUserId();

        var user = await _context.Users
            .Where(u => u.Id == userId)
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound();

        user.Preferences = new Dictionary<string, object>
        {
            ["email"] = request.EmailEnabled,
            ["sms"] = request.SmsEnabled,
            ["push"] = request.PushEnabled,
            ["preferredChannel"] = request.PreferredChannel.ToString()
        };

        if (!string.IsNullOrEmpty(request.QuietHoursStart))
            user.Preferences["quietHoursStart"] = request.QuietHoursStart;
        
        if (!string.IsNullOrEmpty(request.QuietHoursEnd))
            user.Preferences["quietHoursEnd"] = request.QuietHoursEnd;

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Notification preferences updated for user: {UserId}", userId);

        return NoContent();
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount()
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var count = await _context.Set<Notification>()
            .Where(n => n.TenantId == tenantId && n.RecipientId == userId && n.ReadAt == null)
            .CountAsync();

        return Ok(new UnreadCountDto { Count = count });
    }

    private async Task<bool> SendNotification(Notification notification)
    {
        try
        {
            // TODO: Integrate with actual notification services (SendGrid, MessageMedia, etc.)
            // For now, just mark as sent
            notification.SentAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification sent: {NotificationId} via {Channel}", 
                notification.Id, notification.Channel);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification: {NotificationId}", notification.Id);
            return false;
        }
    }

    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var tenantId))
            return tenantId;
        throw new UnauthorizedAccessException("Tenant ID not found");
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
            return userId;
        throw new UnauthorizedAccessException("User ID not found");
    }
}

// DTOs
public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public NotificationPriority Priority { get; set; }
    public Dictionary<string, object>? Data { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNotificationRequest
{
    public Guid RecipientId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public Dictionary<string, object>? Data { get; set; }
    public DateTime? ScheduledFor { get; set; }
}

public class BulkNotificationRequest
{
    public List<Guid> RecipientIds { get; set; } = new();
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public Dictionary<string, object>? Data { get; set; }
    public DateTime? ScheduledFor { get; set; }
}

public class BulkNotificationResult
{
    public int TotalRecipients { get; set; }
    public int SuccessfulRecipients { get; set; }
    public int NotificationsSent { get; set; }
}

public class NotificationPreferencesDto
{
    public bool EmailEnabled { get; set; }
    public bool SmsEnabled { get; set; }
    public bool PushEnabled { get; set; }
    public string? QuietHoursStart { get; set; }
    public string? QuietHoursEnd { get; set; }
    public NotificationChannel PreferredChannel { get; set; }
}

public class UpdateNotificationPreferencesRequest
{
    public bool EmailEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public string? QuietHoursStart { get; set; }
    public string? QuietHoursEnd { get; set; }
    public NotificationChannel PreferredChannel { get; set; } = NotificationChannel.Email;
}

public class UnreadCountDto
{
    public int Count { get; set; }
}
