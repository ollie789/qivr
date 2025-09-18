using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using System.ComponentModel.DataAnnotations;
using Qivr.Api.Exceptions;

namespace Qivr.Api.Controllers;

public class MessagesController : BaseApiController
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly IMessagingService _messagingService;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        IMessagingService messagingService,
        ILogger<MessagesController> logger)
    {
        _context = context;
        _authorizationService = authorizationService;
        _messagingService = messagingService;
        _logger = logger;
    }

    /// <summary>
    /// Get all messages for the current user (Patient Portal format)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MessagePortalDto>), 200)]
    public async Task<IActionResult> GetMessages(
        [FromQuery] string? category = null,
        [FromQuery] bool? unreadOnly = null)
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();
            
            // Get messages from service
            var messages = await _messagingService.GetMessagesAsync(tenantId, userId, category, unreadOnly);
            
            // Convert to portal DTOs
            var portalMessages = messages.Select(m => new MessagePortalDto
            {
                Id = m.Id.ToString(),
                Subject = m.Subject ?? "No Subject",
                Content = m.Content,
                From = m.SenderId == userId 
                    ? "You" 
                    : $"{m.Sender?.FirstName} {m.Sender?.LastName}".Trim(),
                To = m.RecipientId == userId 
                    ? "You" 
                    : $"{m.Recipient?.FirstName} {m.Recipient?.LastName}".Trim(),
                Date = m.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                Category = m.MessageType,
                Read = m.RecipientId == userId ? m.IsRead : true,
                Urgent = m.Priority == "High" || m.Priority == "Urgent",
                HasAttachments = m.HasAttachments,
                ParentMessageId = m.ParentMessageId?.ToString()
            }).ToList();
            
        return Success(portalMessages);
    }
    
    /// <summary>
    /// Get all conversations for the current user
    /// </summary>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(IEnumerable<ConversationDto>), 200)]
    public async Task<IActionResult> GetConversations()
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();
            
            // Get conversations from service
            var conversations = await _messagingService.GetConversationsAsync(tenantId, userId);
            
            // Convert to DTOs
            var conversationDtos = conversations.Select(c => new ConversationDto
            {
                ParticipantId = c.ParticipantId,
                ParticipantName = c.ParticipantName,
                ParticipantAvatar = c.ParticipantAvatar,
                ParticipantRole = c.ParticipantRole,
                LastMessage = c.LastMessage,
                LastMessageTime = c.LastMessageTime,
                LastMessageSender = c.LastMessageSender,
                UnreadCount = c.UnreadCount,
                TotalMessages = c.TotalMessages,
                HasAttachments = c.HasAttachments,
                IsUrgent = c.IsUrgent
            }).ToList();

        return Success(conversationDtos);
    }

    /// <summary>
    /// Get messages in a conversation with a specific user
    /// </summary>
    [HttpGet("conversation/{otherUserId}")]
    [ProducesResponseType(typeof(IEnumerable<MessageDto>), 200)]
    public async Task<IActionResult> GetConversation(
        Guid otherUserId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();
            
            // Get conversation thread from service
            var thread = await _messagingService.GetConversationThreadAsync(
                tenantId, userId, otherUserId, page, pageSize);

            // Convert to DTOs
            var messageDtos = thread.Messages.Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = $"{m.Sender?.FirstName} {m.Sender?.LastName}".Trim(),
                RecipientId = m.RecipientId,
                RecipientName = $"{m.Recipient?.FirstName} {m.Recipient?.LastName}".Trim(),
                Subject = m.Subject ?? string.Empty,
                Content = m.Content,
                IsRead = m.IsRead,
                ReadAt = m.ReadAt,
                Priority = Enum.TryParse<MessagePriority>(m.Priority, out var p1) ? p1 : MessagePriority.Normal,
                MessageType = Enum.TryParse<MessageType>(m.MessageType, out var t1) ? t1 : MessageType.General,
                RelatedAppointmentId = m.RelatedAppointmentId,
                ParentMessageId = m.ParentMessageId,
                CreatedAt = m.CreatedAt,
                IsFromCurrentUser = m.SenderId == userId,
                HasAttachments = m.HasAttachments
            }).ToList();

            Response.Headers.Append("X-Total-Count", thread.TotalMessages.ToString());
            Response.Headers.Append("X-Page", thread.CurrentPage.ToString());
            Response.Headers.Append("X-Page-Size", thread.PageSize.ToString());
            Response.Headers.Append("X-Total-Pages", thread.TotalPages.ToString());

        return Success(messageDtos);
    }

    /// <summary>
    /// Send a new message
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(MessageDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        var senderId = CurrentUserId;
        var tenantId = RequireTenantId();

        // Validate request
        if (request == null || request.RecipientId == Guid.Empty)
        {
            throw new ValidationException("Invalid message request");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Message content is required");
        }

            // Create message DTO for service
            var messageDto = new SendMessageDto
            {
                RecipientId = request.RecipientId,
                Subject = request.Subject,
                Content = request.Content,
                MessageType = request.MessageType?.ToString() ?? "General",
                Priority = request.Priority?.ToString() ?? "Normal",
                ParentMessageId = request.ParentMessageId,
                RelatedAppointmentId = request.RelatedAppointmentId,
                Attachments = request.Attachments?.Select(a => new MessageAttachment
                {
                    FileName = a.FileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Base64Data = a.Base64Data
                })
            };

            // Send message via service
            var message = await _messagingService.SendMessageAsync(tenantId, senderId, messageDto);

            // Convert to DTO for response
            var responseDto = new MessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                SenderName = $"{message.Sender?.FirstName} {message.Sender?.LastName}".Trim(),
                RecipientId = message.RecipientId,
                RecipientName = $"{message.Recipient?.FirstName} {message.Recipient?.LastName}".Trim(),
                Subject = message.Subject,
                Content = message.Content,
                IsRead = message.IsRead,
                Priority = Enum.TryParse<MessagePriority>(message.Priority, out var p) ? p : MessagePriority.Normal,
                MessageType = Enum.TryParse<MessageType>(message.MessageType, out var t) ? t : MessageType.General,
                RelatedAppointmentId = message.RelatedAppointmentId,
                ParentMessageId = message.ParentMessageId,
                CreatedAt = message.CreatedAt,
                IsFromCurrentUser = true,
                HasAttachments = message.HasAttachments
            };

        return CreatedAtAction(nameof(GetMessage), new { id = message.Id }, responseDto);
    }

    /// <summary>
    /// Get a specific message
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MessageDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMessage(Guid id)
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();
            
        var message = await _messagingService.GetMessageAsync(tenantId, id);
        
        if (message == null || (message.SenderId != userId && message.RecipientId != userId))
        {
            throw new NotFoundException("Message", id);
        }

        // Mark as read if recipient
        if (message.RecipientId == userId && !message.IsRead)
        {
            await _messagingService.MarkMessagesAsReadAsync(tenantId, userId, new[] { id });
        }

        return Success(new MessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                SenderName = $"{message.Sender?.FirstName} {message.Sender?.LastName}".Trim(),
                RecipientId = message.RecipientId,
                RecipientName = $"{message.Recipient?.FirstName} {message.Recipient?.LastName}".Trim(),
                Subject = message.Subject,
                Content = message.Content,
                IsRead = message.IsRead,
                ReadAt = message.ReadAt,
                Priority = Enum.TryParse<MessagePriority>(message.Priority, out var p) ? p : MessagePriority.Normal,
                MessageType = Enum.TryParse<MessageType>(message.MessageType, out var t) ? t : MessageType.General,
                RelatedAppointmentId = message.RelatedAppointmentId,
                ParentMessageId = message.ParentMessageId,
                CreatedAt = message.CreatedAt,
                IsFromCurrentUser = message.SenderId == userId,
                HasAttachments = message.HasAttachments
        });
    }

    /// <summary>
    /// Mark a message as read
    /// </summary>
    [HttpPost("{id}/read")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = CurrentUserId;
        
        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == id && m.RecipientId == userId);

        if (message == null)
        {
            throw new NotFoundException("Message", id);
        }

        if (!message.IsRead)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Message {MessageId} marked as read by {UserId}", id, userId);
        }

        return NoContent();
    }

    /// <summary>
    /// Mark multiple messages as read
    /// </summary>
    [HttpPost("mark-read")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> MarkMultipleAsRead([FromBody] List<Guid> messageIds)
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();
        
        await _messagingService.MarkMessagesAsReadAsync(tenantId, userId, messageIds);
        
        return NoContent();
    }

    /// <summary>
    /// Delete a message (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteMessage(Guid id)
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();
        
        var deleted = await _messagingService.DeleteMessageAsync(tenantId, userId, id);
        
        if (!deleted)
        {
            throw new NotFoundException("Message", id);
        }

        return NoContent();
    }

    /// <summary>
    /// Get unread message count
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(MessageUnreadCountDto), 200)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = CurrentUserId;
        var tenantId = RequireTenantId();
        
        var messages = await _messagingService.GetMessagesAsync(tenantId, userId, null, true);
        var count = messages.Count();

        return Success(new MessageUnreadCountDto { Count = count });
    }

    // Reply to a message
    [HttpPost("{id}/reply")]
    [ProducesResponseType(typeof(MessageDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ReplyToMessage(Guid id, [FromBody] ReplyMessageRequest request)
    {
        var senderId = CurrentUserId;
        var tenantId = RequireTenantId();
        
        if (string.IsNullOrWhiteSpace(request?.Content))
        {
            throw new ValidationException("Reply content is required");
        }
        
        var reply = await _messagingService.ReplyToMessageAsync(tenantId, senderId, id, request.Content);
        
        if (reply == null)
        {
            throw new NotFoundException("Original message not found or access denied");
        }
            
            var responseDto = new MessageDto
            {
                Id = reply.Id,
                SenderId = reply.SenderId,
                SenderName = $"{reply.Sender?.FirstName} {reply.Sender?.LastName}".Trim(),
                RecipientId = reply.RecipientId,
                RecipientName = $"{reply.Recipient?.FirstName} {reply.Recipient?.LastName}".Trim(),
                Subject = reply.Subject,
                Content = reply.Content,
                IsRead = reply.IsRead,
                Priority = Enum.TryParse<MessagePriority>(reply.Priority, out var p) ? p : MessagePriority.Normal,
                MessageType = Enum.TryParse<MessageType>(reply.MessageType, out var t) ? t : MessageType.General,
                ParentMessageId = reply.ParentMessageId,
                CreatedAt = reply.CreatedAt,
                IsFromCurrentUser = true,
                HasAttachments = reply.HasAttachments
            };
            
        return Success(responseDto);
    }

}

// DTOs
public class MessagePortalDto
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool Read { get; set; }
    public bool Urgent { get; set; }
    public bool HasAttachments { get; set; }
    public string? ParentMessageId { get; set; }
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public Guid RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public MessagePriority Priority { get; set; }
    public MessageType MessageType { get; set; }
    public Guid? RelatedAppointmentId { get; set; }
    public Guid? ParentMessageId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsFromCurrentUser { get; set; }
    public bool HasAttachments { get; set; }
}

public class ConversationDto
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

public class SendMessageRequest
{
    [Required]
    public Guid RecipientId { get; set; }
    
    public string? Subject { get; set; }
    
    [Required]
    [MinLength(1)]
    public string Content { get; set; } = string.Empty;
    
    public MessagePriority? Priority { get; set; }
    public MessageType? MessageType { get; set; }
    public Guid? RelatedAppointmentId { get; set; }
    public Guid? ParentMessageId { get; set; }
    public List<MessageAttachmentDto>? Attachments { get; set; }
}

public class MessageAttachmentDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Base64Data { get; set; } = string.Empty;
}

public class MessageUnreadCountDto
{
    public int Count { get; set; }
}

public class ReplyMessageRequest
{
    [Required]
    [MinLength(1)]
    public string Content { get; set; } = string.Empty;
}

// Enums (if not already defined elsewhere)
public enum MessagePriority
{
    Low,
    Normal,
    High,
    Urgent
}

public enum MessageType
{
    General,
    Appointment,
    Prescription,
    LabResult,
    FollowUp,
    Emergency
}
