using Microsoft.AspNetCore.SignalR;
using Qivr.Api.Hubs;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Qivr.Api.Services;

public interface IRealTimeNotificationService
{
    Task SendNotificationToUserAsync(Guid userId, NotificationDto notification);
    Task SendNotificationToUsersAsync(IEnumerable<Guid> userIds, NotificationDto notification);
    Task SendNotificationToRoleAsync(string role, NotificationDto notification);
    Task SendNotificationToTenantAsync(Guid tenantId, NotificationDto notification);
    Task SendBroadcastNotificationAsync(NotificationDto notification);
    Task SendAppointmentReminderAsync(Guid userId, AppointmentReminderDto reminder);
    Task SendMessageNotificationAsync(Guid userId, MessageNotificationDto message);
    Task SendSystemAlertAsync(SystemAlertDto alert);
}

public class RealTimeNotificationService : IRealTimeNotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly QivrDbContext _context;
    private readonly ILogger<RealTimeNotificationService> _logger;

    public RealTimeNotificationService(
        IHubContext<NotificationHub> hubContext,
        QivrDbContext context,
        ILogger<RealTimeNotificationService> logger)
    {
        _hubContext = hubContext;
        _context = context;
        _logger = logger;
    }

    public async Task SendNotificationToUserAsync(Guid userId, NotificationDto notification)
    {
        try
        {
            // Save notification to database
            var entity = new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = userId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                Priority = Enum.Parse<NotificationPriority>(notification.Priority, ignoreCase: true),
                Data = notification.Data,
                Channel = NotificationChannel.InApp,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(entity);
            await _context.SaveChangesAsync();

            notification.Id = entity.Id;
            notification.CreatedAt = entity.CreatedAt;

            // Send real-time notification
            await _hubContext.Clients.Group($"user-{userId}")
                .SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("Notification sent to user {UserId}: {Title}", userId, notification.Title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to user {UserId}", userId);
            throw;
        }
    }

    public async Task SendNotificationToUsersAsync(IEnumerable<Guid> userIds, NotificationDto notification)
    {
        try
        {
            var notifications = new List<Notification>();
            var notificationId = Guid.NewGuid();
            var createdAt = DateTime.UtcNow;

            foreach (var userId in userIds)
            {
                notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientId = userId,
                    Title = notification.Title,
                    Message = notification.Message,
                    Type = notification.Type,
                    Priority = Enum.Parse<NotificationPriority>(notification.Priority, ignoreCase: true),
                    Data = notification.Data,
                    Channel = NotificationChannel.InApp,
                    CreatedAt = createdAt
                });
            }

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            // Send to all users
            var tasks = userIds.Select(userId => 
                _hubContext.Clients.Group($"user-{userId}")
                    .SendAsync("ReceiveNotification", notification));
            
            await Task.WhenAll(tasks);

            _logger.LogInformation("Notification sent to {Count} users: {Title}", 
                userIds.Count(), notification.Title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to multiple users");
            throw;
        }
    }

    public async Task SendNotificationToRoleAsync(string role, NotificationDto notification)
    {
        try
        {
            // Get all users with this role
            var users = await _context.Users
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == role))
                .Select(u => u.Id)
                .ToListAsync();

            if (users.Any())
            {
                await SendNotificationToUsersAsync(users, notification);
            }

            // Also send to role group for immediate delivery to connected users
            await _hubContext.Clients.Group($"role-{role.ToLower()}")
                .SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("Notification sent to role {Role}: {Title}", role, notification.Title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to role {Role}", role);
            throw;
        }
    }

    public async Task SendNotificationToTenantAsync(Guid tenantId, NotificationDto notification)
    {
        try
        {
            // Get all users in this tenant
            var users = await _context.Users
                .Where(u => u.TenantId == tenantId)
                .Select(u => u.Id)
                .ToListAsync();

            if (users.Any())
            {
                await SendNotificationToUsersAsync(users, notification);
            }

            // Also send to tenant group
            await _hubContext.Clients.Group($"tenant-{tenantId}")
                .SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("Notification sent to tenant {TenantId}: {Title}", 
                tenantId, notification.Title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task SendBroadcastNotificationAsync(NotificationDto notification)
    {
        try
        {
            // Get all users
            var users = await _context.Users
                .Select(u => u.Id)
                .ToListAsync();

            if (users.Any())
            {
                await SendNotificationToUsersAsync(users, notification);
            }

            // Broadcast to all connected clients
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("Broadcast notification sent: {Title}", notification.Title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send broadcast notification");
            throw;
        }
    }

    public async Task SendAppointmentReminderAsync(Guid userId, AppointmentReminderDto reminder)
    {
        var notification = new NotificationDto
        {
            Title = "Appointment Reminder",
            Message = $"You have an appointment with {reminder.ProviderName} on {reminder.AppointmentTime:MMM dd, yyyy} at {reminder.AppointmentTime:hh:mm tt}",
            Type = "appointment",
            Priority = "High",
            Data = new Dictionary<string, object>
            {
                ["appointmentId"] = reminder.AppointmentId,
                ["providerId"] = reminder.ProviderId,
                ["providerName"] = reminder.ProviderName,
                ["appointmentTime"] = reminder.AppointmentTime,
                ["location"] = reminder.Location ?? string.Empty
            }
        };

        await SendNotificationToUserAsync(userId, notification);

        // Send specific appointment reminder event
        await _hubContext.Clients.Group($"user-{userId}")
            .SendAsync("AppointmentReminder", reminder);
    }

    public async Task SendMessageNotificationAsync(Guid userId, MessageNotificationDto message)
    {
        var notification = new NotificationDto
        {
            Title = "New Message",
            Message = $"You have a new message from {message.SenderName}",
            Type = "message",
            Priority = message.IsUrgent ? "High" : "Normal",
            Data = new Dictionary<string, object>
            {
                ["messageId"] = message.MessageId,
                ["senderId"] = message.SenderId,
                ["senderName"] = message.SenderName,
                ["preview"] = message.Preview ?? string.Empty
            }
        };

        await SendNotificationToUserAsync(userId, notification);

        // Send specific message notification event
        await _hubContext.Clients.Group($"user-{userId}")
            .SendAsync("NewMessage", message);

        // Update unread message count
        var unreadCount = await _context.Messages
            .CountAsync(m => m.RecipientId == userId && !m.IsRead && !m.IsDeleted);
        
        await _hubContext.Clients.Group($"user-{userId}")
            .SendAsync("UnreadMessageCount", unreadCount);
    }

    public async Task SendSystemAlertAsync(SystemAlertDto alert)
    {
        var notification = new NotificationDto
        {
            Title = alert.Title,
            Message = alert.Message,
            Type = "system",
            Priority = alert.Severity switch
            {
                "critical" => "Urgent",
                "warning" => "High",
                "info" => "Normal",
                _ => "Low"
            },
            Data = new Dictionary<string, object>
            {
                ["severity"] = alert.Severity,
                ["actionRequired"] = alert.ActionRequired
            }
        };

        if (alert.AffectedUsers?.Any() == true)
        {
            await SendNotificationToUsersAsync(alert.AffectedUsers, notification);
        }
        else
        {
            await SendBroadcastNotificationAsync(notification);
        }

        // Send system alert to all admins
        await _hubContext.Clients.Group("role-admin")
            .SendAsync("SystemAlert", alert);
    }
}

// DTOs for notifications
public class NotificationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = "Normal";
    public Dictionary<string, object>? Data { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AppointmentReminderDto
{
    public Guid AppointmentId { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public DateTime AppointmentTime { get; set; }
    public string? Location { get; set; }
}

public class MessageNotificationDto
{
    public Guid MessageId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? Preview { get; set; }
    public bool IsUrgent { get; set; }
}

public class SystemAlertDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "info"; // critical, warning, info
    public bool ActionRequired { get; set; }
    public IEnumerable<Guid>? AffectedUsers { get; set; }
}