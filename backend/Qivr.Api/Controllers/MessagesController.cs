using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        ILogger<MessagesController> logger)
    {
        _context = context;
        _authorizationService = authorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all conversations for the current user
    /// </summary>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(IEnumerable<ConversationDto>), 200)]
    public async Task<IActionResult> GetConversations()
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }

        // Get all unique conversations (grouped by other participant)
        var conversations = await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .Where(m => m.SenderId == userId || m.RecipientId == userId)
            .GroupBy(m => m.SenderId == userId ? m.RecipientId : m.SenderId)
            .Select(g => new ConversationDto
            {
                ParticipantId = g.Key,
                ParticipantName = g.First().SenderId == userId 
                    ? $"{g.First().Recipient.FirstName} {g.First().Recipient.LastName}"
                    : $"{g.First().Sender.FirstName} {g.First().Sender.LastName}",
                LastMessage = g.OrderByDescending(m => m.CreatedAt).First().Content,
                LastMessageTime = g.Max(m => m.CreatedAt),
                UnreadCount = g.Count(m => m.RecipientId == userId && !m.IsRead),
                TotalMessages = g.Count()
            })
            .OrderByDescending(c => c.LastMessageTime)
            .ToListAsync();

        return Ok(conversations);
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
        var userId = _authorizationService.GetCurrentUserId(User);
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }

        var query = _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .Where(m => (m.SenderId == userId && m.RecipientId == otherUserId) ||
                       (m.SenderId == otherUserId && m.RecipientId == userId))
            .OrderByDescending(m => m.CreatedAt);

        var totalCount = await query.CountAsync();

        var messages = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = $"{m.Sender.FirstName} {m.Sender.LastName}",
                RecipientId = m.RecipientId,
                RecipientName = $"{m.Recipient.FirstName} {m.Recipient.LastName}",
                Subject = m.Subject,
                Content = m.Content,
                IsRead = m.IsRead,
                ReadAt = m.ReadAt,
                Priority = m.Priority,
                MessageType = m.MessageType,
                RelatedAppointmentId = m.RelatedAppointmentId,
                ParentMessageId = m.ParentMessageId,
                CreatedAt = m.CreatedAt,
                IsFromCurrentUser = m.SenderId == userId
            })
            .ToListAsync();

        // Mark messages as read
        await MarkMessagesAsRead(messages.Where(m => m.RecipientId == userId && !m.IsRead).Select(m => m.Id));

        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        Response.Headers.Add("X-Page", page.ToString());
        Response.Headers.Add("X-Page-Size", pageSize.ToString());

        return Ok(messages.OrderBy(m => m.CreatedAt)); // Return in chronological order for display
    }

    /// <summary>
    /// Send a new message
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(MessageDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        var senderId = _authorizationService.GetCurrentUserId(User);
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);

        if (senderId == Guid.Empty || tenantId == Guid.Empty)
        {
            return Unauthorized();
        }

        // Validate recipient exists and is in the same tenant
        var recipient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.RecipientId && u.TenantId == tenantId);

        if (recipient == null)
        {
            return BadRequest("Recipient not found or not in the same organization");
        }

        // Check if this is regarding an appointment
        if (request.RelatedAppointmentId.HasValue)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == request.RelatedAppointmentId.Value
                    && (a.PatientId == senderId || a.ProviderId == senderId));

            if (appointment == null)
            {
                return BadRequest("Related appointment not found or you don't have access to it");
            }
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SenderId = senderId,
            RecipientId = request.RecipientId,
            Subject = request.Subject ?? "No Subject",
            Content = request.Content,
            MessageType = request.MessageType ?? MessageType.General,
            Priority = request.Priority ?? MessagePriority.Normal,
            RelatedAppointmentId = request.RelatedAppointmentId,
            ParentMessageId = request.ParentMessageId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Load sender for response
        await _context.Entry(message)
            .Reference(m => m.Sender)
            .LoadAsync();
        await _context.Entry(message)
            .Reference(m => m.Recipient)
            .LoadAsync();

        _logger.LogInformation("Message {MessageId} sent from {SenderId} to {RecipientId}", 
            message.Id, senderId, request.RecipientId);

        return CreatedAtAction(nameof(GetMessage), new { id = message.Id }, new MessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}",
            RecipientId = message.RecipientId,
            RecipientName = $"{message.Recipient.FirstName} {message.Recipient.LastName}",
            Subject = message.Subject,
            Content = message.Content,
            IsRead = message.IsRead,
            Priority = message.Priority,
            MessageType = message.MessageType,
            RelatedAppointmentId = message.RelatedAppointmentId,
            ParentMessageId = message.ParentMessageId,
            CreatedAt = message.CreatedAt,
            IsFromCurrentUser = true
        });
    }

    /// <summary>
    /// Get a specific message
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MessageDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMessage(Guid id)
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        
        var message = await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Recipient)
            .FirstOrDefaultAsync(m => m.Id == id 
                && (m.SenderId == userId || m.RecipientId == userId));

        if (message == null)
        {
            return NotFound();
        }

        // Mark as read if recipient
        if (message.RecipientId == userId && !message.IsRead)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new MessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}",
            RecipientId = message.RecipientId,
            RecipientName = $"{message.Recipient.FirstName} {message.Recipient.LastName}",
            Subject = message.Subject,
            Content = message.Content,
            IsRead = message.IsRead,
            ReadAt = message.ReadAt,
            Priority = message.Priority,
            MessageType = message.MessageType,
            RelatedAppointmentId = message.RelatedAppointmentId,
            ParentMessageId = message.ParentMessageId,
            CreatedAt = message.CreatedAt,
            IsFromCurrentUser = message.SenderId == userId
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
        var userId = _authorizationService.GetCurrentUserId(User);
        
        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == id && m.RecipientId == userId);

        if (message == null)
        {
            return NotFound();
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
        var userId = _authorizationService.GetCurrentUserId(User);
        
        var messages = await _context.Messages
            .Where(m => messageIds.Contains(m.Id) && m.RecipientId == userId && !m.IsRead)
            .ToListAsync();

        foreach (var message in messages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("{Count} messages marked as read by {UserId}", messages.Count, userId);

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
        var userId = _authorizationService.GetCurrentUserId(User);
        
        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == id 
                && (m.SenderId == userId || m.RecipientId == userId));

        if (message == null)
        {
            return NotFound();
        }

        // Soft delete - mark as deleted for the current user
        if (message.SenderId == userId)
        {
            message.DeletedBySender = true;
        }
        if (message.RecipientId == userId)
        {
            message.DeletedByRecipient = true;
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Message {MessageId} deleted by {UserId}", id, userId);

        return NoContent();
    }

    /// <summary>
    /// Get unread message count
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadCountDto), 200)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        
        var count = await _context.Messages
            .CountAsync(m => m.RecipientId == userId && !m.IsRead && !m.DeletedByRecipient);

        return Ok(new UnreadCountDto { Count = count });
    }

    private async Task MarkMessagesAsRead(IEnumerable<Guid> messageIds)
    {
        if (!messageIds.Any()) return;

        var messages = await _context.Messages
            .Where(m => messageIds.Contains(m.Id) && !m.IsRead)
            .ToListAsync();

        foreach (var message in messages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}

// DTOs
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
}

public class ConversationDto
{
    public Guid ParticipantId { get; set; }
    public string ParticipantName { get; set; } = string.Empty;
    public string LastMessage { get; set; } = string.Empty;
    public DateTime LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
    public int TotalMessages { get; set; }
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
}

public class UnreadCountDto
{
    public int Count { get; set; }
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
