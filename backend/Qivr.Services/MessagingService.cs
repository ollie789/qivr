using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IMessagingService
{
    Task<IEnumerable<ConversationSummary>> GetConversationsAsync(Guid tenantId, Guid userId);
    Task<ConversationThread> GetConversationThreadAsync(Guid tenantId, Guid userId, Guid otherUserId, int page = 1, int pageSize = 50);
    Task<Message> SendMessageAsync(Guid tenantId, Guid senderId, SendMessageDto messageDto);
    Task<IEnumerable<Message>> GetMessagesAsync(Guid tenantId, Guid userId, string? category = null, bool? unreadOnly = null);
    Task MarkMessagesAsReadAsync(Guid tenantId, Guid userId, IEnumerable<Guid> messageIds);
    Task<Message?> GetMessageAsync(Guid tenantId, Guid messageId);
    Task<bool> DeleteMessageAsync(Guid tenantId, Guid userId, Guid messageId);
    Task<Message?> ReplyToMessageAsync(Guid tenantId, Guid senderId, Guid parentMessageId, string content);
}

public class MessagingService : IMessagingService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<MessagingService> _logger;

    public MessagingService(QivrDbContext context, ILogger<MessagingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ConversationSummary>> GetConversationsAsync(Guid tenantId, Guid userId)
    {
        // Get all conversations for the user grouped by other participant
        var conversations = await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .Include(m => m.ProviderProfile)
            .Where(m => m.TenantId == tenantId && (m.SenderId == userId || m.DirectRecipientId == userId))
            .GroupBy(m => m.SenderId == userId ? m.DirectRecipientId : m.SenderId)
            .Select(g => new
            {
                ParticipantId = g.Key,
                Messages = g.ToList()
            })
            .ToListAsync();

        var summaries = new List<ConversationSummary>();

        foreach (var conversation in conversations)
        {
            var participant = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == conversation.ParticipantId);

            if (participant == null) continue;

            var orderedMessages = conversation.Messages
                .OrderByDescending(m => m.CreatedAt)
                .ToList();

            var lastMessage = orderedMessages.FirstOrDefault();
            var unreadCount = conversation.Messages
                .Count(m => m.DirectRecipientId == userId && !m.IsRead);

            summaries.Add(new ConversationSummary
            {
                ParticipantId = conversation.ParticipantId,
                ParticipantName = $"{participant.FirstName} {participant.LastName}".Trim(),
                ParticipantAvatar = participant.AvatarUrl,
                ParticipantRole = participant.UserType.ToString(),
                LastMessage = lastMessage?.Content ?? "",
                LastMessageTime = lastMessage?.CreatedAt ?? DateTime.MinValue,
                LastMessageSender = lastMessage?.SenderId == userId ? "You" : participant.FirstName,
                UnreadCount = unreadCount,
                TotalMessages = conversation.Messages.Count,
                HasAttachments = conversation.Messages.Any(m => m.HasAttachments),
                IsUrgent = conversation.Messages.Any(m => m.Priority == "High" || m.Priority == "Urgent")
            });
        }

        return summaries.OrderByDescending(s => s.LastMessageTime);
    }

    public async Task<ConversationThread> GetConversationThreadAsync(
        Guid tenantId, 
        Guid userId, 
        Guid otherUserId, 
        int page = 1, 
        int pageSize = 50)
    {
        var query = _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .Include(m => m.ProviderProfile)
            .Where(m => m.TenantId == tenantId &&
                       ((m.SenderId == userId && m.DirectRecipientId == otherUserId) ||
                        (m.SenderId == otherUserId && m.DirectRecipientId == userId)))
            .OrderByDescending(m => m.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var messages = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Mark unread messages as read
        var unreadMessages = messages.Where(m => m.DirectRecipientId == userId && !m.IsRead);
        foreach (var message in unreadMessages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        if (unreadMessages.Any())
        {
            await _context.SaveChangesAsync();
        }

        // Get participant info
        var participant = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == otherUserId);

        return new ConversationThread
        {
            ParticipantId = otherUserId,
            ParticipantName = participant != null ? $"{participant.FirstName} {participant.LastName}".Trim() : "Unknown",
            ParticipantAvatar = participant?.AvatarUrl,
            Messages = messages.OrderBy(m => m.CreatedAt), // Return in chronological order for display
            CurrentPage = page,
            PageSize = pageSize,
            TotalMessages = totalCount,
            TotalPages = totalPages
        };
    }

    public async Task<Message> SendMessageAsync(Guid tenantId, Guid senderId, SendMessageDto messageDto)
    {
        // Validate recipient
        var recipient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == messageDto.RecipientId && u.TenantId == tenantId);

        if (recipient == null)
        {
            throw new ArgumentException("Recipient not found or not in the same organization");
        }

        // Check if this is a reply
        Message? parentMessage = null;
        if (messageDto.ParentMessageId.HasValue)
        {
            parentMessage = await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == messageDto.ParentMessageId.Value &&
                                         m.TenantId == tenantId &&
                                         (m.SenderId == senderId || m.DirectRecipientId == senderId));

            if (parentMessage == null)
            {
                throw new ArgumentException("Parent message not found or access denied");
            }
        }

        // Check if this is regarding an appointment
        if (messageDto.RelatedAppointmentId.HasValue)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == messageDto.RelatedAppointmentId.Value &&
                                         a.TenantId == tenantId &&
                                         (a.PatientId == senderId || a.ProviderId == senderId));

            if (appointment == null)
            {
                throw new ArgumentException("Related appointment not found or access denied");
            }
        }

        var providerProfileId = parentMessage?.ProviderProfileId ??
            await ResolveProviderProfileIdAsync(tenantId, senderId, messageDto.RecipientId);

        var message = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SenderId = senderId,
            DirectRecipientId = messageDto.RecipientId,
            DirectSubject = messageDto.Subject,
            Content = messageDto.Content,
            DirectMessageType = messageDto.MessageType ?? "General",
            DirectPriority = messageDto.Priority ?? "Normal",
            ParentMessageId = messageDto.ParentMessageId,
            RelatedAppointmentId = messageDto.RelatedAppointmentId,
            ProviderProfileId = providerProfileId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Handle attachments if any
        if (messageDto.Attachments?.Any() == true)
        {
            // In production, save attachments to storage and store references
            // For now, just log
            _logger.LogInformation("Message {MessageId} has {Count} attachments", 
                message.Id, messageDto.Attachments.Count());
        }

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Load navigation properties for the response
        await _context.Entry(message)
            .Reference(m => m.Sender)
            .LoadAsync();
        await _context.Entry(message)
            .Reference(m => m.Recipient)
            .LoadAsync();
        if (message.ProviderProfileId.HasValue)
        {
            await _context.Entry(message)
                .Reference(m => m.ProviderProfile)
                .LoadAsync();
        }

        _logger.LogInformation("Message {MessageId} sent from {SenderId} to {RecipientId}", 
            message.Id, senderId, messageDto.RecipientId);

        return message;
    }

    public async Task<IEnumerable<Message>> GetMessagesAsync(
        Guid tenantId, 
        Guid userId, 
        string? category = null, 
        bool? unreadOnly = null)
    {
        var query = _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .Include(m => m.ProviderProfile)
            .Where(m => m.TenantId == tenantId && 
                       (m.SenderId == userId || m.DirectRecipientId == userId));

        // Apply category filter
        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = category.ToLower() switch
            {
                "inbox" => query.Where(m => m.DirectRecipientId == userId),
                "sent" => query.Where(m => m.SenderId == userId),
                "urgent" => query.Where(m => m.Priority == "High" || m.Priority == "Urgent"),
                "appointments" => query.Where(m => m.RelatedAppointmentId != null),
                _ => query.Where(m => m.MessageType == category)
            };
        }

        // Apply unread filter
        if (unreadOnly == true)
        {
            query = query.Where(m => m.DirectRecipientId == userId && !m.IsRead);
        }

        return await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(100) // Limit for performance
            .ToListAsync();
    }

    public async Task MarkMessagesAsReadAsync(Guid tenantId, Guid userId, IEnumerable<Guid> messageIds)
    {
        var messages = await _context.Messages
            .Where(m => m.TenantId == tenantId &&
                       m.DirectRecipientId == userId &&
                       messageIds.Contains(m.Id) &&
                       !m.IsRead)
            .ToListAsync();

        foreach (var message in messages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        if (messages.Any())
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Marked {Count} messages as read for user {UserId}", 
                messages.Count, userId);
        }
    }

    public async Task<Message?> GetMessageAsync(Guid tenantId, Guid messageId)
    {
        var message = await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .Include(m => m.ProviderProfile)
            .FirstOrDefaultAsync(m => m.Id == messageId && m.TenantId == tenantId);

        return message;
    }

    public async Task<bool> DeleteMessageAsync(Guid tenantId, Guid userId, Guid messageId)
    {
        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && 
                                     m.TenantId == tenantId &&
                                     (m.SenderId == userId || m.DirectRecipientId == userId));

        if (message == null)
        {
            return false;
        }

        // Soft delete - mark as deleted for the user
        if (message.SenderId == userId)
        {
            message.DeletedBySender = true;
        }
        if (message.DirectRecipientId == userId)
        {
            message.DeletedByRecipient = true;
        }

        // If both have deleted, remove from database
        if (message.DeletedBySender && message.DeletedByRecipient)
        {
            _context.Messages.Remove(message);
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Message {MessageId} deleted by user {UserId}", messageId, userId);
        return true;
    }

    public async Task<Message?> ReplyToMessageAsync(Guid tenantId, Guid senderId, Guid parentMessageId, string content)
    {
        var parentMessage = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == parentMessageId &&
                                     m.TenantId == tenantId &&
                                     (m.SenderId == senderId || m.DirectRecipientId == senderId));

        if (parentMessage == null)
        {
            return null;
        }

        // Determine the recipient (reply to the other party in the conversation)
        var recipientId = parentMessage.SenderId == senderId 
            ? parentMessage.DirectRecipientId 
            : parentMessage.SenderId;

        var reply = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SenderId = senderId,
            DirectRecipientId = recipientId,
            Subject = $"Re: {parentMessage.Subject ?? "No Subject"}",
            Content = content,
            MessageType = parentMessage.MessageType,
            Priority = "Normal",
            ParentMessageId = parentMessageId,
            RelatedAppointmentId = parentMessage.RelatedAppointmentId,
            IsRead = false,
            ProviderProfileId = parentMessage.ProviderProfileId ?? await ResolveProviderProfileIdAsync(tenantId, senderId, recipientId),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(reply);
        await _context.SaveChangesAsync();

        // Load navigation properties
        await _context.Entry(reply)
            .Reference(m => m.Sender)
            .LoadAsync();
        await _context.Entry(reply)
            .Reference(m => m.Recipient)
            .LoadAsync();
        if (reply.ProviderProfileId.HasValue)
        {
            await _context.Entry(reply)
                .Reference(m => m.ProviderProfile)
                .LoadAsync();
        }

        return reply;
    }

    private async Task<Guid?> ResolveProviderProfileIdAsync(Guid tenantId, Guid senderId, Guid recipientId)
    {
        var candidateUserIds = new[] { senderId, recipientId };

        return await _context.Providers
            .IgnoreQueryFilters()
            .Where(p => p.TenantId == tenantId && candidateUserIds.Contains(p.UserId))
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();
    }
}

// DTOs for the messaging service
public class ConversationSummary
{
    public Guid ParticipantId { get; set; }
    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantAvatar { get; set; }
    public string ParticipantRole { get; set; } = string.Empty;
    public string LastMessage { get; set; } = string.Empty;
    public DateTime LastMessageTime { get; set; }
    public string LastMessageSender { get; set; } = string.Empty;
    public int UnreadCount { get; set; }
    public int TotalMessages { get; set; }
    public bool HasAttachments { get; set; }
    public bool IsUrgent { get; set; }
}

public class ConversationThread
{
    public Guid ParticipantId { get; set; }
    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantAvatar { get; set; }
    public IEnumerable<Message> Messages { get; set; } = new List<Message>();
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalMessages { get; set; }
    public int TotalPages { get; set; }
}

public class SendMessageDto
{
    public Guid RecipientId { get; set; }
    public string? Subject { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? MessageType { get; set; }
    public string? Priority { get; set; }
    public Guid? ParentMessageId { get; set; }
    public Guid? RelatedAppointmentId { get; set; }
    public IEnumerable<MessageAttachment>? Attachments { get; set; }
}

public class MessageAttachment
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? Base64Data { get; set; }
}
