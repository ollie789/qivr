using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Unified inbox item that can reference messages, documents, or system notifications.
/// Provides a single view of all actionable items for a user.
/// </summary>
public class InboxItem : DeletableEntity
{
    [Required]
    public Guid UserId { get; set; }
    public virtual User? User { get; set; }

    [Required]
    public InboxItemType ItemType { get; set; }

    /// <summary>
    /// Reference to the actual item (Message, Document, or Notification)
    /// </summary>
    public Guid? MessageId { get; set; }
    public virtual Message? Message { get; set; }

    public Guid? DocumentId { get; set; }
    public virtual Document? Document { get; set; }

    public Guid? NotificationId { get; set; }

    /// <summary>
    /// For items that relate to a specific patient (e.g., their documents/messages)
    /// </summary>
    public Guid? PatientId { get; set; }
    public virtual User? Patient { get; set; }

    /// <summary>
    /// Preview/summary text for quick display
    /// </summary>
    [StringLength(500)]
    public string? Preview { get; set; }

    /// <summary>
    /// Title/subject for display
    /// </summary>
    [StringLength(200)]
    public string? Title { get; set; }

    /// <summary>
    /// Category for filtering (medical, billing, appointment, document, etc.)
    /// </summary>
    [StringLength(50)]
    public string? Category { get; set; }

    /// <summary>
    /// Priority level for sorting
    /// </summary>
    public InboxPriority Priority { get; set; } = InboxPriority.Normal;

    /// <summary>
    /// Current status of the item
    /// </summary>
    public InboxItemStatus Status { get; set; } = InboxItemStatus.Unread;

    /// <summary>
    /// When the item was received/created
    /// </summary>
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the item was read (null if unread)
    /// </summary>
    public DateTime? ReadAt { get; set; }

    /// <summary>
    /// Whether the item has been archived
    /// </summary>
    public bool IsArchived { get; set; } = false;
    public DateTime? ArchivedAt { get; set; }

    /// <summary>
    /// Whether the item has been starred/flagged
    /// </summary>
    public bool IsStarred { get; set; } = false;

    /// <summary>
    /// Whether the item requires action (e.g., document needs review)
    /// </summary>
    public bool RequiresAction { get; set; } = false;

    /// <summary>
    /// Due date for action items
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// The sender/source of the item
    /// </summary>
    public Guid? FromUserId { get; set; }
    public virtual User? FromUser { get; set; }

    [StringLength(100)]
    public string? FromName { get; set; }

    /// <summary>
    /// Labels/tags for organization
    /// </summary>
    public List<string> Labels { get; set; } = new();

    /// <summary>
    /// Metadata for type-specific information
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public enum InboxItemType
{
    Message,
    Document,
    Notification,
    Task,
    Reminder,
    Alert
}

public enum InboxPriority
{
    Low,
    Normal,
    High,
    Urgent
}

public enum InboxItemStatus
{
    Unread,
    Read,
    ActionRequired,
    InProgress,
    Completed,
    Archived
}
