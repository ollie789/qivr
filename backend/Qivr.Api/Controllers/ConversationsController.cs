using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.Entities;
using Qivr.Services;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationsController : BaseApiController
{
    private readonly IConversationService _conversationService;
    private readonly ILogger<ConversationsController> _logger;

    public ConversationsController(
        IConversationService conversationService,
        ILogger<ConversationsController> logger)
    {
        _conversationService = conversationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all conversations for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ConversationsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversations(
        [FromQuery] string? status,
        [FromQuery] string? type,
        [FromQuery] string? priority,
        [FromQuery] bool? unreadOnly,
        [FromQuery] string? search,
        [FromQuery] int? limit,
        [FromQuery] int? offset,
        CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var filter = new ConversationFilterDto
        {
            Status = Enum.TryParse<ConversationStatus>(status, true, out var s) ? s : null,
            Type = Enum.TryParse<ConversationType>(type, true, out var t) ? t : null,
            Priority = Enum.TryParse<ConversationPriority>(priority, true, out var p) ? p : null,
            UnreadOnly = unreadOnly,
            Search = search,
            Limit = limit ?? 50,
            Offset = offset ?? 0
        };

        var conversations = await _conversationService.GetConversationsAsync(tenantId, userId, filter, ct);
        var unreadCount = await _conversationService.GetUnreadConversationCountAsync(userId, tenantId, ct);

        return Ok(new ConversationsResponse
        {
            Conversations = conversations,
            UnreadCount = unreadCount,
            TotalCount = conversations.Count
        });
    }

    /// <summary>
    /// Create a new conversation
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateConversation(
        [FromBody] CreateConversationRequest request,
        CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        if (string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest("Subject is required");

        var dto = new CreateConversationDto
        {
            Subject = request.Subject,
            InitialMessage = request.InitialMessage,
            PatientId = request.PatientId,
            ProviderId = request.ProviderId,
            RecipientIds = request.RecipientIds,
            Type = request.Type,
            Priority = request.Priority
        };

        var conversation = await _conversationService.CreateConversationAsync(tenantId, userId, dto, ct);

        return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
    }

    /// <summary>
    /// Get a specific conversation with recent messages
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConversation(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var conversation = await _conversationService.GetConversationAsync(id, userId, tenantId, ct);
        if (conversation == null)
            return NotFound();

        return Ok(conversation);
    }

    /// <summary>
    /// Get messages in a conversation with pagination
    /// </summary>
    [HttpGet("{id}/messages")]
    [ProducesResponseType(typeof(List<ConversationMessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(
        Guid id,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
        CancellationToken ct = default)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var messages = await _conversationService.GetMessagesAsync(id, userId, tenantId, limit, offset, ct);

        return Ok(messages);
    }

    /// <summary>
    /// Send a message in a conversation
    /// </summary>
    [HttpPost("{id}/messages")]
    [ProducesResponseType(typeof(ConversationMessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendMessage(
        Guid id,
        [FromBody] SendConversationMessageRequest request,
        CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Content is required");

        try
        {
            var message = await _conversationService.SendMessageAsync(
                id, userId, tenantId, request.Content, request.AttachmentId, ct);

            return Created($"/api/conversations/{id}/messages/{message.Id}", message);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Mark all messages in conversation as read
    /// </summary>
    [HttpPost("{id}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _conversationService.MarkConversationAsReadAsync(id, userId, tenantId, ct);
        return NoContent();
    }

    /// <summary>
    /// Close a conversation
    /// </summary>
    [HttpPost("{id}/close")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseConversation(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var conversation = await _conversationService.CloseConversationAsync(id, userId, tenantId, ct);
        if (conversation == null)
            return NotFound();

        return Ok(conversation);
    }

    /// <summary>
    /// Reopen a closed conversation
    /// </summary>
    [HttpPost("{id}/reopen")]
    [ProducesResponseType(typeof(ConversationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReopenConversation(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var conversation = await _conversationService.ReopenConversationAsync(id, userId, tenantId, ct);
        if (conversation == null)
            return NotFound();

        return Ok(conversation);
    }

    /// <summary>
    /// Add a participant to the conversation
    /// </summary>
    [HttpPost("{id}/participants")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddParticipant(
        Guid id,
        [FromBody] AddParticipantRequest request,
        CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        try
        {
            await _conversationService.AddParticipantAsync(id, userId, request.UserId, tenantId, ct);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Remove a participant from the conversation
    /// </summary>
    [HttpDelete("{id}/participants/{participantId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveParticipant(
        Guid id,
        Guid participantId,
        CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        try
        {
            await _conversationService.RemoveParticipantAsync(id, userId, participantId, tenantId, ct);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Get unread conversation count
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadConversationCountResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var count = await _conversationService.GetUnreadConversationCountAsync(userId, tenantId, ct);
        return Ok(new UnreadConversationCountResponse { Count = count });
    }
}

// Request/Response models
public class ConversationsResponse
{
    public List<ConversationListDto> Conversations { get; set; } = new();
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
}

public class CreateConversationRequest
{
    [Required]
    [StringLength(200)]
    public string Subject { get; set; } = "";

    public string? InitialMessage { get; set; }
    public Guid? PatientId { get; set; }
    public Guid? ProviderId { get; set; }
    public List<Guid>? RecipientIds { get; set; }
    public ConversationType Type { get; set; } = ConversationType.General;
    public ConversationPriority Priority { get; set; } = ConversationPriority.Normal;
}

public class SendConversationMessageRequest
{
    [Required]
    public string Content { get; set; } = "";
    public Guid? AttachmentId { get; set; }
}

public class AddParticipantRequest
{
    [Required]
    public Guid UserId { get; set; }
}

public class UnreadConversationCountResponse
{
    public int Count { get; set; }
}
