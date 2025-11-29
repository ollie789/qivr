using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IInboxService
{
    Task<List<InboxItemDto>> GetInboxAsync(Guid userId, Guid tenantId, InboxFilterDto? filter = null, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, Guid tenantId, CancellationToken ct = default);
    Task<InboxItemDto?> GetItemAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task MarkAsReadAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task MarkMultipleAsReadAsync(List<Guid> itemIds, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task ArchiveAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task UnarchiveAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task StarAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task UnstarAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task DeleteAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default);

    // Methods to create inbox items from other events
    Task CreateFromMessageAsync(Message message, Guid recipientId, CancellationToken ct = default);
    Task CreateFromDocumentAsync(Document document, Guid assignedToUserId, CancellationToken ct = default);
    Task CreateFromNotificationAsync(Notification notification, Guid userId, CancellationToken ct = default);
}

public class InboxService : IInboxService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<InboxService> _logger;

    public InboxService(QivrDbContext context, ILogger<InboxService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<InboxItemDto>> GetInboxAsync(Guid userId, Guid tenantId, InboxFilterDto? filter = null, CancellationToken ct = default)
    {
        var query = _context.InboxItems
            .Include(i => i.Message)
            .Include(i => i.Document)
            .Include(i => i.FromUser)
            .Include(i => i.Patient)
            .Where(i => i.UserId == userId && i.TenantId == tenantId && i.DeletedAt == null);

        // Apply filters
        if (filter != null)
        {
            if (filter.ShowArchived == false)
                query = query.Where(i => !i.IsArchived);

            if (filter.UnreadOnly == true)
                query = query.Where(i => i.Status == InboxItemStatus.Unread);

            if (filter.StarredOnly == true)
                query = query.Where(i => i.IsStarred);

            if (filter.ItemType.HasValue)
                query = query.Where(i => i.ItemType == filter.ItemType.Value);

            if (!string.IsNullOrEmpty(filter.Category))
                query = query.Where(i => i.Category == filter.Category);

            if (filter.Priority.HasValue)
                query = query.Where(i => i.Priority == filter.Priority.Value);

            if (!string.IsNullOrEmpty(filter.Search))
            {
                var search = filter.Search.ToLower();
                query = query.Where(i =>
                    (i.Title != null && i.Title.ToLower().Contains(search)) ||
                    (i.Preview != null && i.Preview.ToLower().Contains(search)) ||
                    (i.FromName != null && i.FromName.ToLower().Contains(search)));
            }
        }

        var items = await query
            .OrderByDescending(i => i.Priority)
            .ThenByDescending(i => i.ReceivedAt)
            .Take(filter?.Limit ?? 50)
            .Skip(filter?.Offset ?? 0)
            .ToListAsync(ct);

        return items.Select(MapToDto).ToList();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        return await _context.InboxItems
            .Where(i => i.UserId == userId && i.TenantId == tenantId)
            .Where(i => i.Status == InboxItemStatus.Unread && !i.IsArchived && i.DeletedAt == null)
            .CountAsync(ct);
    }

    public async Task<InboxItemDto?> GetItemAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var item = await _context.InboxItems
            .Include(i => i.Message)
            .Include(i => i.Document)
            .Include(i => i.FromUser)
            .Include(i => i.Patient)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId && i.TenantId == tenantId && i.DeletedAt == null, ct);

        return item != null ? MapToDto(item) : null;
    }

    public async Task MarkAsReadAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var item = await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId && i.TenantId == tenantId, ct);

        if (item != null && item.Status == InboxItemStatus.Unread)
        {
            item.Status = InboxItemStatus.Read;
            item.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            // Also mark the underlying message as read if applicable
            if (item.MessageId.HasValue)
            {
                var message = await _context.Messages.FindAsync(new object[] { item.MessageId.Value }, ct);
                if (message != null && !message.IsRead)
                {
                    message.IsRead = true;
                    message.ReadAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync(ct);
                }
            }
        }
    }

    public async Task MarkMultipleAsReadAsync(List<Guid> itemIds, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var items = await _context.InboxItems
            .Where(i => itemIds.Contains(i.Id) && i.UserId == userId && i.TenantId == tenantId)
            .Where(i => i.Status == InboxItemStatus.Unread)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        foreach (var item in items)
        {
            item.Status = InboxItemStatus.Read;
            item.ReadAt = now;
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task ArchiveAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var item = await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId && i.TenantId == tenantId, ct);

        if (item != null)
        {
            item.IsArchived = true;
            item.ArchivedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task UnarchiveAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var item = await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId && i.TenantId == tenantId, ct);

        if (item != null)
        {
            item.IsArchived = false;
            item.ArchivedAt = null;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task StarAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var item = await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId && i.TenantId == tenantId, ct);

        if (item != null)
        {
            item.IsStarred = true;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task UnstarAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var item = await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId && i.TenantId == tenantId, ct);

        if (item != null)
        {
            item.IsStarred = false;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task DeleteAsync(Guid itemId, Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        var item = await _context.InboxItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId && i.TenantId == tenantId, ct);

        if (item != null)
        {
            item.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task CreateFromMessageAsync(Message message, Guid recipientId, CancellationToken ct = default)
    {
        var inboxItem = new InboxItem
        {
            TenantId = message.TenantId,
            UserId = recipientId,
            ItemType = InboxItemType.Message,
            MessageId = message.Id,
            Title = message.Subject ?? "New Message",
            Preview = message.Content.Length > 200 ? message.Content[..200] + "..." : message.Content,
            Category = message.Category ?? "general",
            Priority = MapPriority(message.Priority),
            Status = InboxItemStatus.Unread,
            ReceivedAt = message.SentAt,
            FromUserId = message.SenderId,
            FromName = message.SenderName ?? message.Sender?.FullName
        };

        _context.InboxItems.Add(inboxItem);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created inbox item for message {MessageId} to user {UserId}", message.Id, recipientId);
    }

    public async Task CreateFromDocumentAsync(Document document, Guid assignedToUserId, CancellationToken ct = default)
    {
        var inboxItem = new InboxItem
        {
            TenantId = document.TenantId,
            UserId = assignedToUserId,
            ItemType = InboxItemType.Document,
            DocumentId = document.Id,
            PatientId = document.PatientId,
            Title = $"Document: {document.FileName}",
            Preview = $"{document.DocumentType} - {document.Patient?.FullName ?? "Unknown Patient"}",
            Category = "document",
            Priority = document.IsUrgent ? InboxPriority.Urgent : InboxPriority.Normal,
            Status = InboxItemStatus.Unread,
            RequiresAction = true,
            DueDate = document.DueDate,
            ReceivedAt = document.CreatedAt,
            FromUserId = document.UploadedBy,
            FromName = document.UploadedByUser?.FullName
        };

        _context.InboxItems.Add(inboxItem);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created inbox item for document {DocumentId} assigned to user {UserId}", document.Id, assignedToUserId);
    }

    public async Task CreateFromNotificationAsync(Notification notification, Guid userId, CancellationToken ct = default)
    {
        var inboxItem = new InboxItem
        {
            TenantId = notification.TenantId,
            UserId = userId,
            ItemType = InboxItemType.Notification,
            NotificationId = notification.Id,
            Title = notification.Title,
            Preview = notification.Message,
            Category = notification.Type,
            Priority = MapNotificationPriority(notification.Priority),
            Status = InboxItemStatus.Unread,
            ReceivedAt = notification.CreatedAt,
            Metadata = new Dictionary<string, object>
            {
                ["type"] = notification.Type,
                ["channel"] = notification.Channel.ToString()
            }
        };

        _context.InboxItems.Add(inboxItem);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created inbox item for notification {NotificationId} to user {UserId}", notification.Id, userId);
    }

    private static InboxPriority MapNotificationPriority(NotificationPriority priority)
    {
        return priority switch
        {
            NotificationPriority.Urgent => InboxPriority.Urgent,
            NotificationPriority.High => InboxPriority.High,
            NotificationPriority.Low => InboxPriority.Low,
            _ => InboxPriority.Normal
        };
    }

    private static InboxItemDto MapToDto(InboxItem item)
    {
        return new InboxItemDto
        {
            Id = item.Id,
            ItemType = item.ItemType.ToString(),
            MessageId = item.MessageId,
            DocumentId = item.DocumentId,
            NotificationId = item.NotificationId,
            PatientId = item.PatientId,
            PatientName = item.Patient?.FullName,
            Title = item.Title,
            Preview = item.Preview,
            Category = item.Category,
            Priority = item.Priority.ToString(),
            Status = item.Status.ToString(),
            IsRead = item.Status != InboxItemStatus.Unread,
            IsArchived = item.IsArchived,
            IsStarred = item.IsStarred,
            RequiresAction = item.RequiresAction,
            DueDate = item.DueDate,
            ReceivedAt = item.ReceivedAt,
            ReadAt = item.ReadAt,
            FromUserId = item.FromUserId,
            FromName = item.FromName,
            Labels = item.Labels,
            // Include related data
            Message = item.Message != null ? new InboxMessageDto
            {
                Id = item.Message.Id,
                Content = item.Message.Content,
                SentAt = item.Message.SentAt,
                HasAttachments = item.Message.HasAttachments
            } : null,
            Document = item.Document != null ? new InboxDocumentDto
            {
                Id = item.Document.Id,
                FileName = item.Document.FileName,
                DocumentType = item.Document.DocumentType,
                Status = item.Document.Status,
                IsUrgent = item.Document.IsUrgent
            } : null
        };
    }

    private static InboxPriority MapPriority(string? priority)
    {
        return priority?.ToLower() switch
        {
            "urgent" => InboxPriority.Urgent,
            "high" => InboxPriority.High,
            "low" => InboxPriority.Low,
            _ => InboxPriority.Normal
        };
    }
}

// DTOs
public class InboxFilterDto
{
    public bool? ShowArchived { get; set; }
    public bool? UnreadOnly { get; set; }
    public bool? StarredOnly { get; set; }
    public InboxItemType? ItemType { get; set; }
    public string? Category { get; set; }
    public InboxPriority? Priority { get; set; }
    public string? Search { get; set; }
    public int? Limit { get; set; }
    public int? Offset { get; set; }
}

public class InboxItemDto
{
    public Guid Id { get; set; }
    public string ItemType { get; set; } = "";
    public Guid? MessageId { get; set; }
    public Guid? DocumentId { get; set; }
    public Guid? NotificationId { get; set; }
    public Guid? PatientId { get; set; }
    public string? PatientName { get; set; }
    public string? Title { get; set; }
    public string? Preview { get; set; }
    public string? Category { get; set; }
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Unread";
    public bool IsRead { get; set; }
    public bool IsArchived { get; set; }
    public bool IsStarred { get; set; }
    public bool RequiresAction { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime ReceivedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public Guid? FromUserId { get; set; }
    public string? FromName { get; set; }
    public List<string> Labels { get; set; } = new();
    public InboxMessageDto? Message { get; set; }
    public InboxDocumentDto? Document { get; set; }
}

public class InboxMessageDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = "";
    public DateTime SentAt { get; set; }
    public bool HasAttachments { get; set; }
}

public class InboxDocumentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = "";
    public string DocumentType { get; set; } = "";
    public string Status { get; set; } = "";
    public bool IsUrgent { get; set; }
}
