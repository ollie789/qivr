using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.Entities;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/inbox")]
[Authorize]
public class InboxController : BaseApiController
{
    private readonly IInboxService _inboxService;
    private readonly ILogger<InboxController> _logger;

    public InboxController(IInboxService inboxService, ILogger<InboxController> logger)
    {
        _inboxService = inboxService;
        _logger = logger;
    }

    /// <summary>
    /// Get unified inbox items (messages, documents, notifications)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(InboxResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInbox(
        [FromQuery] bool? showArchived,
        [FromQuery] bool? unreadOnly,
        [FromQuery] bool? starredOnly,
        [FromQuery] string? itemType,
        [FromQuery] string? category,
        [FromQuery] string? priority,
        [FromQuery] string? search,
        [FromQuery] int? limit,
        [FromQuery] int? offset,
        CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var filter = new InboxFilterDto
        {
            ShowArchived = showArchived,
            UnreadOnly = unreadOnly,
            StarredOnly = starredOnly,
            ItemType = Enum.TryParse<InboxItemType>(itemType, true, out var type) ? type : null,
            Category = category,
            Priority = Enum.TryParse<InboxPriority>(priority, true, out var p) ? p : null,
            Search = search,
            Limit = limit ?? 50,
            Offset = offset ?? 0
        };

        var items = await _inboxService.GetInboxAsync(userId, tenantId, filter, ct);
        var unreadCount = await _inboxService.GetUnreadCountAsync(userId, tenantId, ct);

        return Ok(new InboxResponse
        {
            Items = items,
            UnreadCount = unreadCount,
            TotalCount = items.Count
        });
    }

    /// <summary>
    /// Get inbox item by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(InboxItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetItem(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var item = await _inboxService.GetItemAsync(id, userId, tenantId, ct);
        if (item == null)
            return NotFound();

        return Ok(item);
    }

    /// <summary>
    /// Get unread count
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadCountResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        var count = await _inboxService.GetUnreadCountAsync(userId, tenantId, ct);
        return Ok(new UnreadCountResponse { Count = count });
    }

    /// <summary>
    /// Mark item as read
    /// </summary>
    [HttpPost("{id}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _inboxService.MarkAsReadAsync(id, userId, tenantId, ct);
        return NoContent();
    }

    /// <summary>
    /// Mark multiple items as read
    /// </summary>
    [HttpPost("mark-read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkMultipleAsRead([FromBody] MarkReadRequest request, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _inboxService.MarkMultipleAsReadAsync(request.ItemIds, userId, tenantId, ct);
        return NoContent();
    }

    /// <summary>
    /// Archive an item
    /// </summary>
    [HttpPost("{id}/archive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _inboxService.ArchiveAsync(id, userId, tenantId, ct);
        return NoContent();
    }

    /// <summary>
    /// Unarchive an item
    /// </summary>
    [HttpPost("{id}/unarchive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unarchive(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _inboxService.UnarchiveAsync(id, userId, tenantId, ct);
        return NoContent();
    }

    /// <summary>
    /// Star an item
    /// </summary>
    [HttpPost("{id}/star")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Star(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _inboxService.StarAsync(id, userId, tenantId, ct);
        return NoContent();
    }

    /// <summary>
    /// Unstar an item
    /// </summary>
    [HttpPost("{id}/unstar")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unstar(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _inboxService.UnstarAsync(id, userId, tenantId, ct);
        return NoContent();
    }

    /// <summary>
    /// Delete an item (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;

        await _inboxService.DeleteAsync(id, userId, tenantId, ct);
        return NoContent();
    }
}

// Request/Response models
public class InboxResponse
{
    public List<InboxItemDto> Items { get; set; } = new();
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
}

public class UnreadCountResponse
{
    public int Count { get; set; }
}

public class MarkReadRequest
{
    public List<Guid> ItemIds { get; set; } = new();
}
