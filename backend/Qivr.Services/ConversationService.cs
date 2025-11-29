using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IConversationService
{
    // Conversation management
    Task<ConversationDetailDto> CreateConversationAsync(Guid tenantId, Guid userId, CreateConversationDto dto, CancellationToken ct = default);
    Task<List<ConversationListDto>> GetConversationsAsync(Guid tenantId, Guid userId, ConversationFilterDto? filter = null, CancellationToken ct = default);
    Task<ConversationDetailDto?> GetConversationAsync(Guid conversationId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task<ConversationDetailDto?> CloseConversationAsync(Guid conversationId, Guid userId, Guid tenantId, CancellationToken ct = default);
    Task<ConversationDetailDto?> ReopenConversationAsync(Guid conversationId, Guid userId, Guid tenantId, CancellationToken ct = default);

    // Message management within conversations
    Task<ConversationMessageDto> SendMessageAsync(Guid conversationId, Guid userId, Guid tenantId, string content, Guid? attachmentId = null, CancellationToken ct = default);
    Task<List<ConversationMessageDto>> GetMessagesAsync(Guid conversationId, Guid userId, Guid tenantId, int limit = 50, int offset = 0, CancellationToken ct = default);
    Task MarkConversationAsReadAsync(Guid conversationId, Guid userId, Guid tenantId, CancellationToken ct = default);

    // Participant management
    Task AddParticipantAsync(Guid conversationId, Guid userId, Guid newParticipantId, Guid tenantId, CancellationToken ct = default);
    Task RemoveParticipantAsync(Guid conversationId, Guid userId, Guid participantToRemove, Guid tenantId, CancellationToken ct = default);

    // Inbox integration
    Task<int> GetUnreadConversationCountAsync(Guid userId, Guid tenantId, CancellationToken ct = default);
}

public class ConversationService : IConversationService
{
    private readonly QivrDbContext _context;
    private readonly IInboxService _inboxService;
    private readonly ILogger<ConversationService> _logger;

    public ConversationService(
        QivrDbContext context,
        IInboxService inboxService,
        ILogger<ConversationService> logger)
    {
        _context = context;
        _inboxService = inboxService;
        _logger = logger;
    }

    public async Task<ConversationDetailDto> CreateConversationAsync(
        Guid tenantId,
        Guid userId,
        CreateConversationDto dto,
        CancellationToken ct = default)
    {
        // Get creator info
        var creator = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId, ct);

        if (creator == null)
            throw new ArgumentException("User not found");

        // Validate recipients exist
        var recipientIds = dto.RecipientIds ?? new List<Guid>();
        if (dto.ProviderId.HasValue && !recipientIds.Contains(dto.ProviderId.Value))
            recipientIds.Add(dto.ProviderId.Value);

        var recipients = await _context.Users
            .Where(u => recipientIds.Contains(u.Id) && u.TenantId == tenantId)
            .ToListAsync(ct);

        if (recipients.Count != recipientIds.Count)
            throw new ArgumentException("One or more recipients not found");

        // Create the conversation
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = dto.PatientId ?? userId, // Default to creator if not specified
            ProviderId = dto.ProviderId,
            Subject = dto.Subject,
            Type = dto.Type,
            Priority = dto.Priority,
            Status = ConversationStatus.Open,
            LastMessageAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Conversations.Add(conversation);

        // Add creator as participant
        var creatorParticipant = new ConversationParticipant
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ConversationId = conversation.Id,
            UserId = userId,
            UserName = creator.FullName,
            Role = creator.UserType.ToString(),
            JoinedAt = DateTime.UtcNow,
            LastReadAt = DateTime.UtcNow,
            UnreadCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.ConversationParticipants.Add(creatorParticipant);

        // Add recipients as participants
        foreach (var recipient in recipients)
        {
            var participant = new ConversationParticipant
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ConversationId = conversation.Id,
                UserId = recipient.Id,
                UserName = recipient.FullName,
                Role = recipient.UserType.ToString(),
                JoinedAt = DateTime.UtcNow,
                UnreadCount = 1, // Will have unread initial message
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ConversationParticipants.Add(participant);
        }

        // Create initial message if provided
        if (!string.IsNullOrWhiteSpace(dto.InitialMessage))
        {
            var message = new Message
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ConversationId = conversation.Id,
                SenderId = userId,
                SenderName = creator.FullName,
                SenderRole = creator.UserType.ToString(),
                Content = dto.InitialMessage,
                SentAt = DateTime.UtcNow,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Messages.Add(message);
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Created conversation {ConversationId} by user {UserId}", conversation.Id, userId);

        return await GetConversationDetailAsync(conversation.Id, userId, tenantId, ct);
    }

    public async Task<List<ConversationListDto>> GetConversationsAsync(
        Guid tenantId,
        Guid userId,
        ConversationFilterDto? filter = null,
        CancellationToken ct = default)
    {
        // Get conversations where user is a participant
        var participantQuery = _context.ConversationParticipants
            .Where(p => p.UserId == userId && p.TenantId == tenantId && p.LeftAt == null);

        var conversationIds = await participantQuery
            .Select(p => p.ConversationId)
            .ToListAsync(ct);

        var query = _context.Conversations
            .Include(c => c.Patient)
            .Include(c => c.Provider)
            .Include(c => c.Participants)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
            .Where(c => conversationIds.Contains(c.Id) && c.TenantId == tenantId);

        // Apply filters
        if (filter != null)
        {
            if (filter.Status.HasValue)
                query = query.Where(c => c.Status == filter.Status.Value);

            if (filter.Type.HasValue)
                query = query.Where(c => c.Type == filter.Type.Value);

            if (filter.Priority.HasValue)
                query = query.Where(c => c.Priority == filter.Priority.Value);

            if (filter.UnreadOnly == true)
            {
                var unreadConversationIds = await participantQuery
                    .Where(p => p.UnreadCount > 0)
                    .Select(p => p.ConversationId)
                    .ToListAsync(ct);
                query = query.Where(c => unreadConversationIds.Contains(c.Id));
            }

            if (!string.IsNullOrEmpty(filter.Search))
            {
                var search = filter.Search.ToLower();
                query = query.Where(c =>
                    c.Subject.ToLower().Contains(search) ||
                    c.Messages.Any(m => m.Content.ToLower().Contains(search)));
            }
        }

        var conversations = await query
            .OrderByDescending(c => c.LastMessageAt)
            .Take(filter?.Limit ?? 50)
            .Skip(filter?.Offset ?? 0)
            .ToListAsync(ct);

        // Get participant unread counts
        var participantInfo = await participantQuery
            .Where(p => conversationIds.Contains(p.ConversationId))
            .ToDictionaryAsync(p => p.ConversationId, p => p.UnreadCount, ct);

        return conversations.Select(c => new ConversationListDto
        {
            Id = c.Id,
            Subject = c.Subject,
            Type = c.Type.ToString(),
            Status = c.Status.ToString(),
            Priority = c.Priority.ToString(),
            PatientName = c.Patient?.FullName,
            ProviderName = c.Provider?.FullName,
            ParticipantCount = c.Participants.Count(p => p.LeftAt == null),
            LastMessage = c.Messages.FirstOrDefault()?.Content,
            LastMessageAt = c.LastMessageAt,
            LastMessageSender = c.Messages.FirstOrDefault()?.SenderName,
            UnreadCount = participantInfo.GetValueOrDefault(c.Id, 0),
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<ConversationDetailDto?> GetConversationAsync(
        Guid conversationId,
        Guid userId,
        Guid tenantId,
        CancellationToken ct = default)
    {
        // Verify user is a participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.TenantId == tenantId && p.LeftAt == null, ct);

        if (!isParticipant)
            return null;

        return await GetConversationDetailAsync(conversationId, userId, tenantId, ct);
    }

    public async Task<ConversationDetailDto?> CloseConversationAsync(
        Guid conversationId,
        Guid userId,
        Guid tenantId,
        CancellationToken ct = default)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.TenantId == tenantId, ct);

        if (conversation == null)
            return null;

        // Verify user is a participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.LeftAt == null, ct);

        if (!isParticipant)
            return null;

        conversation.Status = ConversationStatus.Closed;
        conversation.ClosedAt = DateTime.UtcNow;
        conversation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Conversation {ConversationId} closed by user {UserId}", conversationId, userId);

        return await GetConversationDetailAsync(conversationId, userId, tenantId, ct);
    }

    public async Task<ConversationDetailDto?> ReopenConversationAsync(
        Guid conversationId,
        Guid userId,
        Guid tenantId,
        CancellationToken ct = default)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.TenantId == tenantId, ct);

        if (conversation == null)
            return null;

        // Verify user is a participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.LeftAt == null, ct);

        if (!isParticipant)
            return null;

        conversation.Status = ConversationStatus.Open;
        conversation.ClosedAt = null;
        conversation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Conversation {ConversationId} reopened by user {UserId}", conversationId, userId);

        return await GetConversationDetailAsync(conversationId, userId, tenantId, ct);
    }

    public async Task<ConversationMessageDto> SendMessageAsync(
        Guid conversationId,
        Guid userId,
        Guid tenantId,
        string content,
        Guid? attachmentId = null,
        CancellationToken ct = default)
    {
        // Verify conversation exists and user is participant
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.TenantId == tenantId, ct);

        if (conversation == null)
            throw new ArgumentException("Conversation not found");

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.LeftAt == null, ct);

        if (participant == null)
            throw new ArgumentException("User is not a participant in this conversation");

        // Get sender info
        var sender = await _context.Users.FindAsync(new object[] { userId }, ct);
        if (sender == null)
            throw new ArgumentException("User not found");

        // Create message
        var message = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ConversationId = conversationId,
            SenderId = userId,
            SenderName = sender.FullName,
            SenderRole = sender.UserType.ToString(),
            Content = content,
            AttachmentId = attachmentId,
            SentAt = DateTime.UtcNow,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);

        // Update conversation
        conversation.LastMessageAt = DateTime.UtcNow;
        conversation.UpdatedAt = DateTime.UtcNow;

        // If conversation was closed, reopen it
        if (conversation.Status == ConversationStatus.Closed)
        {
            conversation.Status = ConversationStatus.AwaitingResponse;
            conversation.ClosedAt = null;
        }

        // Update unread counts for other participants
        var otherParticipants = await _context.ConversationParticipants
            .Where(p => p.ConversationId == conversationId && p.UserId != userId && p.LeftAt == null)
            .ToListAsync(ct);

        foreach (var p in otherParticipants)
        {
            p.UnreadCount++;
        }

        // Update sender's last read
        participant.LastReadAt = DateTime.UtcNow;
        participant.UnreadCount = 0;

        await _context.SaveChangesAsync(ct);

        // Create inbox items for other participants
        foreach (var p in otherParticipants)
        {
            await _inboxService.CreateFromMessageAsync(message, p.UserId, ct);
        }

        _logger.LogInformation("Message {MessageId} sent in conversation {ConversationId} by user {UserId}",
            message.Id, conversationId, userId);

        return new ConversationMessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderName = message.SenderName ?? "",
            SenderRole = message.SenderRole ?? "",
            Content = message.Content,
            SentAt = message.SentAt,
            IsRead = false,
            HasAttachment = message.AttachmentId.HasValue,
            IsFromCurrentUser = true
        };
    }

    public async Task<List<ConversationMessageDto>> GetMessagesAsync(
        Guid conversationId,
        Guid userId,
        Guid tenantId,
        int limit = 50,
        int offset = 0,
        CancellationToken ct = default)
    {
        // Verify user is participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.TenantId == tenantId && p.LeftAt == null, ct);

        if (!isParticipant)
            return new List<ConversationMessageDto>();

        var messages = await _context.Messages
            .Include(m => m.Attachment)
            .Where(m => m.ConversationId == conversationId && m.TenantId == tenantId && !m.IsDeleted)
            .OrderByDescending(m => m.SentAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(ct);

        return messages.Select(m => new ConversationMessageDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            SenderName = m.SenderName ?? "",
            SenderRole = m.SenderRole ?? "",
            Content = m.Content,
            SentAt = m.SentAt,
            IsRead = m.IsRead,
            ReadAt = m.ReadAt,
            HasAttachment = m.AttachmentId.HasValue,
            AttachmentName = m.Attachment?.FileName,
            IsFromCurrentUser = m.SenderId == userId,
            ParentMessageId = m.ParentMessageId
        }).ToList();
    }

    public async Task MarkConversationAsReadAsync(
        Guid conversationId,
        Guid userId,
        Guid tenantId,
        CancellationToken ct = default)
    {
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.TenantId == tenantId, ct);

        if (participant == null)
            return;

        participant.LastReadAt = DateTime.UtcNow;
        participant.UnreadCount = 0;

        // Mark all messages in conversation as read for this user
        var unreadMessages = await _context.Messages
            .Where(m => m.ConversationId == conversationId &&
                       m.TenantId == tenantId &&
                       m.SenderId != userId &&
                       !m.IsRead)
            .ToListAsync(ct);

        foreach (var message in unreadMessages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Conversation {ConversationId} marked as read by user {UserId}", conversationId, userId);
    }

    public async Task AddParticipantAsync(
        Guid conversationId,
        Guid userId,
        Guid newParticipantId,
        Guid tenantId,
        CancellationToken ct = default)
    {
        // Verify conversation exists
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.TenantId == tenantId, ct);

        if (conversation == null)
            throw new ArgumentException("Conversation not found");

        // Verify requesting user is participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.LeftAt == null, ct);

        if (!isParticipant)
            throw new ArgumentException("User is not a participant in this conversation");

        // Check if new participant already exists
        var existingParticipant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == newParticipantId, ct);

        if (existingParticipant != null)
        {
            if (existingParticipant.LeftAt == null)
                throw new ArgumentException("User is already a participant");

            // Rejoin
            existingParticipant.LeftAt = null;
            existingParticipant.JoinedAt = DateTime.UtcNow;
            existingParticipant.UnreadCount = 0;
        }
        else
        {
            // Get new participant info
            var newUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == newParticipantId && u.TenantId == tenantId, ct);

            if (newUser == null)
                throw new ArgumentException("User to add not found");

            var participant = new ConversationParticipant
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ConversationId = conversationId,
                UserId = newParticipantId,
                UserName = newUser.FullName,
                Role = newUser.UserType.ToString(),
                JoinedAt = DateTime.UtcNow,
                UnreadCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ConversationParticipants.Add(participant);
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("User {NewParticipantId} added to conversation {ConversationId} by {UserId}",
            newParticipantId, conversationId, userId);
    }

    public async Task RemoveParticipantAsync(
        Guid conversationId,
        Guid userId,
        Guid participantToRemove,
        Guid tenantId,
        CancellationToken ct = default)
    {
        // Verify requesting user is participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId && p.LeftAt == null, ct);

        if (!isParticipant)
            throw new ArgumentException("User is not a participant in this conversation");

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == participantToRemove && p.LeftAt == null, ct);

        if (participant == null)
            throw new ArgumentException("Participant not found in conversation");

        participant.LeftAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("User {ParticipantToRemove} removed from conversation {ConversationId} by {UserId}",
            participantToRemove, conversationId, userId);
    }

    public async Task<int> GetUnreadConversationCountAsync(Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        return await _context.ConversationParticipants
            .Where(p => p.UserId == userId && p.TenantId == tenantId && p.LeftAt == null && p.UnreadCount > 0)
            .CountAsync(ct);
    }

    private async Task<ConversationDetailDto> GetConversationDetailAsync(
        Guid conversationId,
        Guid userId,
        Guid tenantId,
        CancellationToken ct)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Patient)
            .Include(c => c.Provider)
            .Include(c => c.Participants.Where(p => p.LeftAt == null))
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.TenantId == tenantId, ct);

        if (conversation == null)
            throw new ArgumentException("Conversation not found");

        var participant = conversation.Participants.FirstOrDefault(p => p.UserId == userId);

        var recentMessages = await _context.Messages
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
            .OrderByDescending(m => m.SentAt)
            .Take(20)
            .ToListAsync(ct);

        return new ConversationDetailDto
        {
            Id = conversation.Id,
            Subject = conversation.Subject,
            Type = conversation.Type.ToString(),
            Status = conversation.Status.ToString(),
            Priority = conversation.Priority.ToString(),
            PatientId = conversation.PatientId,
            PatientName = conversation.Patient?.FullName,
            ProviderId = conversation.ProviderId,
            ProviderName = conversation.Provider?.FullName,
            CreatedAt = conversation.CreatedAt,
            LastMessageAt = conversation.LastMessageAt,
            ClosedAt = conversation.ClosedAt,
            UnreadCount = participant?.UnreadCount ?? 0,
            Participants = conversation.Participants.Select(p => new ConversationParticipantDto
            {
                UserId = p.UserId,
                UserName = p.UserName,
                Role = p.Role,
                JoinedAt = p.JoinedAt,
                IsMuted = p.IsMuted
            }).ToList(),
            RecentMessages = recentMessages.Select(m => new ConversationMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = m.SenderName ?? "",
                SenderRole = m.SenderRole ?? "",
                Content = m.Content,
                SentAt = m.SentAt,
                IsRead = m.IsRead,
                ReadAt = m.ReadAt,
                HasAttachment = m.AttachmentId.HasValue,
                IsFromCurrentUser = m.SenderId == userId
            }).ToList()
        };
    }
}

// DTOs
public class CreateConversationDto
{
    public string Subject { get; set; } = "";
    public string? InitialMessage { get; set; }
    public Guid? PatientId { get; set; }
    public Guid? ProviderId { get; set; }
    public List<Guid>? RecipientIds { get; set; }
    public ConversationType Type { get; set; } = ConversationType.General;
    public ConversationPriority Priority { get; set; } = ConversationPriority.Normal;
}

public class ConversationFilterDto
{
    public ConversationStatus? Status { get; set; }
    public ConversationType? Type { get; set; }
    public ConversationPriority? Priority { get; set; }
    public bool? UnreadOnly { get; set; }
    public string? Search { get; set; }
    public int? Limit { get; set; }
    public int? Offset { get; set; }
}

public class ConversationListDto
{
    public Guid Id { get; set; }
    public string Subject { get; set; } = "";
    public string Type { get; set; } = "";
    public string Status { get; set; } = "";
    public string Priority { get; set; } = "";
    public string? PatientName { get; set; }
    public string? ProviderName { get; set; }
    public int ParticipantCount { get; set; }
    public string? LastMessage { get; set; }
    public DateTime LastMessageAt { get; set; }
    public string? LastMessageSender { get; set; }
    public int UnreadCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ConversationDetailDto
{
    public Guid Id { get; set; }
    public string Subject { get; set; } = "";
    public string Type { get; set; } = "";
    public string Status { get; set; } = "";
    public string Priority { get; set; } = "";
    public Guid PatientId { get; set; }
    public string? PatientName { get; set; }
    public Guid? ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int UnreadCount { get; set; }
    public List<ConversationParticipantDto> Participants { get; set; } = new();
    public List<ConversationMessageDto> RecentMessages { get; set; } = new();
}

public class ConversationParticipantDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = "";
    public string Role { get; set; } = "";
    public DateTime JoinedAt { get; set; }
    public bool IsMuted { get; set; }
}

public class ConversationMessageDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = "";
    public string SenderRole { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool HasAttachment { get; set; }
    public string? AttachmentName { get; set; }
    public bool IsFromCurrentUser { get; set; }
    public Guid? ParentMessageId { get; set; }
}
