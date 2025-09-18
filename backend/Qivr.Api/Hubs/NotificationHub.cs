using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Qivr.Api.Hubs;

/// <summary>
/// SignalR hub for real-time notifications
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private static readonly Dictionary<string, HashSet<string>> _userConnections = new();
    private static readonly object _lock = new();

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        if (!string.IsNullOrEmpty(userId))
        {
            lock (_lock)
            {
                if (!_userConnections.ContainsKey(userId))
                {
                    _userConnections[userId] = new HashSet<string>();
                }
                _userConnections[userId].Add(connectionId);
            }

            // Add user to their personal group
            await Groups.AddToGroupAsync(connectionId, $"user-{userId}");

            // Add user to their role group
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? Context.User?.FindFirst("custom:role")?.Value;
            if (!string.IsNullOrEmpty(role))
            {
                await Groups.AddToGroupAsync(connectionId, $"role-{role.ToLower()}");
            }

            // Add user to their tenant group
            var tenantId = Context.User?.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantId))
            {
                await Groups.AddToGroupAsync(connectionId, $"tenant-{tenantId}");
            }

            _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        if (!string.IsNullOrEmpty(userId))
        {
            lock (_lock)
            {
                if (_userConnections.ContainsKey(userId))
                {
                    _userConnections[userId].Remove(connectionId);
                    if (_userConnections[userId].Count == 0)
                    {
                        _userConnections.Remove(userId);
                    }
                }
            }

            // Remove from all groups
            await Groups.RemoveFromGroupAsync(connectionId, $"user-{userId}");

            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? Context.User?.FindFirst("custom:role")?.Value;
            if (!string.IsNullOrEmpty(role))
            {
                await Groups.RemoveFromGroupAsync(connectionId, $"role-{role.ToLower()}");
            }

            var tenantId = Context.User?.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantId))
            {
                await Groups.RemoveFromGroupAsync(connectionId, $"tenant-{tenantId}");
            }

            _logger.LogInformation("User {UserId} disconnected from connection {ConnectionId}", userId, connectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe to specific notification types
    /// </summary>
    public async Task SubscribeToNotifications(string[] notificationTypes)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return;

        foreach (var type in notificationTypes)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"notification-{type.ToLower()}");
            _logger.LogDebug("User {UserId} subscribed to {NotificationType} notifications", userId, type);
        }
    }

    /// <summary>
    /// Unsubscribe from specific notification types
    /// </summary>
    public async Task UnsubscribeFromNotifications(string[] notificationTypes)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return;

        foreach (var type in notificationTypes)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"notification-{type.ToLower()}");
            _logger.LogDebug("User {UserId} unsubscribed from {NotificationType} notifications", userId, type);
        }
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    public async Task MarkNotificationAsRead(Guid notificationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return;

        // Here you would update the notification in the database
        _logger.LogInformation("User {UserId} marked notification {NotificationId} as read", userId, notificationId);
        
        // Notify other connections of the same user
        await Clients.OthersInGroup($"user-{userId}").SendAsync("NotificationRead", notificationId);
    }

    /// <summary>
    /// Get online status for a list of users
    /// </summary>
    public Task<Dictionary<string, bool>> GetOnlineStatus(string[] userIds)
    {
        var result = new Dictionary<string, bool>();
        lock (_lock)
        {
            foreach (var userId in userIds)
            {
                result[userId] = _userConnections.ContainsKey(userId) && _userConnections[userId].Count > 0;
            }
        }
        return Task.FromResult(result);
    }

    /// <summary>
    /// Send typing indicator for messaging
    /// </summary>
    public async Task SendTypingIndicator(string recipientUserId, bool isTyping)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return;

        await Clients.Group($"user-{recipientUserId}").SendAsync("UserTyping", new 
        { 
            UserId = userId, 
            IsTyping = isTyping,
            Timestamp = DateTime.UtcNow
        });
    }

    private string? GetUserId()
    {
        return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? Context.User?.FindFirst("sub")?.Value;
    }

    /// <summary>
    /// Get all active connections for a user (static method for service use)
    /// </summary>
    public static IEnumerable<string> GetUserConnections(string userId)
    {
        lock (_lock)
        {
            return _userConnections.ContainsKey(userId) 
                ? _userConnections[userId].ToList() 
                : Enumerable.Empty<string>();
        }
    }

    /// <summary>
    /// Check if a user is online (static method for service use)
    /// </summary>
    public static bool IsUserOnline(string userId)
    {
        lock (_lock)
        {
            return _userConnections.ContainsKey(userId) && _userConnections[userId].Count > 0;
        }
    }
}