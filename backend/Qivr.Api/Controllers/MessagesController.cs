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
//[Authorize]
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
    /// Get all messages for the current user (Patient Portal format)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MessagePortalDto>), 200)]
    public async Task<IActionResult> GetMessages(
        [FromQuery] string? category = null,
        [FromQuery] bool? unreadOnly = null)
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }

        // For now, return mock data formatted for the patient portal
        var messages = GetMockMessagesForPortal(userId);
        
        // Apply filters
        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            messages = messages.Where(m => m.Category == category).ToList();
        }
        
        if (unreadOnly == true)
        {
            messages = messages.Where(m => !m.Read).ToList();
        }
        
        return Ok(messages);
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
            .ToListAsync();

        // Convert strings to enums after materialization to avoid expression tree limitations
        var messageDtos = messages.Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = $"{m.Sender?.FirstName} {m.Sender?.LastName}",
                RecipientId = m.RecipientId,
                RecipientName = $"{m.Recipient?.FirstName} {m.Recipient?.LastName}",
                Subject = m.Subject ?? string.Empty,
                Content = m.Content,
                IsRead = m.IsRead,
                ReadAt = m.ReadAt,
                Priority = Enum.TryParse<MessagePriority>(m.Priority, out var p1) ? p1 : MessagePriority.Normal,
                MessageType = Enum.TryParse<MessageType>(m.MessageType, out var t1) ? t1 : MessageType.General,
                RelatedAppointmentId = m.RelatedAppointmentId,
                ParentMessageId = m.ParentMessageId,
                CreatedAt = m.CreatedAt,
                IsFromCurrentUser = m.SenderId == userId
            })
            .ToList();

        // Mark messages as read
        await MarkMessagesAsRead(messageDtos.Where(m => m.RecipientId == userId && !m.IsRead).Select(m => m.Id));

        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        Response.Headers.Add("X-Page", page.ToString());
        Response.Headers.Add("X-Page-Size", pageSize.ToString());

        return Ok(messageDtos.OrderBy(m => m.CreatedAt)); // Return in chronological order for display
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
            MessageType = request.MessageType?.ToString() ?? "General",
            Priority = request.Priority?.ToString() ?? "Normal",
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
            Priority = Enum.TryParse<MessagePriority>(message.Priority, out var p2) ? p2 : MessagePriority.Normal,
            MessageType = Enum.TryParse<MessageType>(message.MessageType, out var t2) ? t2 : MessageType.General,
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
            Priority = Enum.TryParse<MessagePriority>(message.Priority, out var p3) ? p3 : MessagePriority.Normal,
            MessageType = Enum.TryParse<MessageType>(message.MessageType, out var t3) ? t3 : MessageType.General,
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
    [ProducesResponseType(typeof(MessageUnreadCountDto), 200)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        
        var count = await _context.Messages
            .CountAsync(m => m.RecipientId == userId && !m.IsRead && !m.DeletedByRecipient);

        return Ok(new MessageUnreadCountDto { Count = count });
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
    
    private List<MessagePortalDto> GetMockMessagesForPortal(Guid userId)
    {
        return new List<MessagePortalDto>
        {
            new MessagePortalDto
            {
                Id = "1",
                Subject = "Appointment Confirmation - January 25",
                Sender = new SenderDto
                {
                    Name = "Dr. Sarah Johnson",
                    Role = "Primary Care Physician",
                    Avatar = "SJ"
                },
                Recipient = "You",
                Content = @"Dear Patient,

This is to confirm your appointment scheduled for January 25, 2024 at 10:00 AM.

Please remember to:
- Bring your insurance card
- Arrive 15 minutes early
- Complete the pre-visit questionnaire online

If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
Dr. Sarah Johnson",
                Preview = "This is to confirm your appointment scheduled for January 25...",
                Date = "2024-01-22T14:30:00",
                Read = false,
                Starred = true,
                Important = true,
                Category = "inbox",
                Labels = new[] { "Appointments", "Important" }
            },
            new MessagePortalDto
            {
                Id = "2",
                Subject = "Lab Results Available",
                Sender = new SenderDto
                {
                    Name = "Central Medical Lab",
                    Role = "Laboratory Services",
                    Avatar = "CL"
                },
                Recipient = "You",
                Content = "Your recent lab results are now available. Please log in to view them.",
                Preview = "Your recent lab results are now available...",
                Date = "2024-01-20T09:15:00",
                Read = true,
                Starred = false,
                Important = false,
                Category = "inbox",
                Labels = new[] { "Lab Results" },
                Attachments = new[]
                {
                    new AttachmentDto { Name = "CBC_Results.pdf", Size = "245 KB" },
                    new AttachmentDto { Name = "Lipid_Panel.pdf", Size = "198 KB" }
                }
            },
            new MessagePortalDto
            {
                Id = "3",
                Subject = "Prescription Refill Ready",
                Sender = new SenderDto
                {
                    Name = "PharmaCare Pharmacy",
                    Role = "Pharmacy",
                    Avatar = "PC"
                },
                Recipient = "You",
                Content = "Your prescription refill is ready for pickup at PharmaCare Pharmacy.",
                Preview = "Your prescription refill is ready for pickup...",
                Date = "2024-01-19T16:45:00",
                Read = true,
                Starred = false,
                Important = false,
                Category = "inbox",
                Labels = new[] { "Prescriptions" }
            },
            new MessagePortalDto
            {
                Id = "4",
                Subject = "Question about medication side effects",
                Sender = new SenderDto
                {
                    Name = "You",
                    Role = "Patient",
                    Avatar = "ME"
                },
                Recipient = "Dr. Michael Chen",
                Content = "Dr. Chen, I have been experiencing some mild side effects from the new medication...",
                Preview = "I have been experiencing some mild side effects...",
                Date = "2024-01-18T11:00:00",
                Read = true,
                Starred = false,
                Important = false,
                Category = "sent",
                Labels = new[] { "Questions" }
            },
            new MessagePortalDto
            {
                Id = "5",
                Subject = "Health Tips: Managing Stress",
                Sender = new SenderDto
                {
                    Name = "Health Portal Team",
                    Role = "System",
                    Avatar = "HP"
                },
                Recipient = "You",
                Content = "Learn effective strategies for managing stress and improving your mental health...",
                Preview = "Learn effective strategies for managing stress...",
                Date = "2024-01-17T08:00:00",
                Read = false,
                Starred = false,
                Important = false,
                Category = "inbox",
                Labels = new[] { "Newsletter", "Health Tips" }
            }
        };
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

public class MessageUnreadCountDto
{
    public int Count { get; set; }
}

public class MessagePortalDto
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public SenderDto Sender { get; set; } = new();
    public string Recipient { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Preview { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public bool Read { get; set; }
    public bool Starred { get; set; }
    public bool Important { get; set; }
    public string Category { get; set; } = string.Empty;
    public string[] Labels { get; set; } = Array.Empty<string>();
    public AttachmentDto[]? Attachments { get; set; }
}

public class SenderDto
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Avatar { get; set; }
}

public class AttachmentDto  
{
    public string Name { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
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
