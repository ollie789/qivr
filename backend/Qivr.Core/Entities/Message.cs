using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class Conversation : TenantEntity
{
    
    [Required]
    public Guid PatientId { get; set; }
    public virtual User Patient { get; set; }
    
    public Guid? ProviderId { get; set; }
    public virtual User Provider { get; set; }
    
    [Required]
    [StringLength(200)]
    public string Subject { get; set; }
    
    public ConversationType Type { get; set; } = ConversationType.General;
    
    public ConversationStatus Status { get; set; } = ConversationStatus.Open;
    
    public ConversationPriority Priority { get; set; } = ConversationPriority.Normal;
    
    // CreatedAt is inherited from BaseEntity
    
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ClosedAt { get; set; }
    
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    
    public virtual ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
}

public class Message : TenantEntity
{
    
    [Required]
    public Guid ConversationId { get; set; }
    public virtual Conversation Conversation { get; set; }
    
    [Required]
    public Guid SenderId { get; set; } // User ID
    
    [Required]
    public string SenderName { get; set; }
    
    public string SenderRole { get; set; } // Patient, Provider, Admin
    
    [Required]
    public string Content { get; set; }
    
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ReadAt { get; set; }
    
    public bool IsRead { get; set; } = false;
    
    public DateTime? EditedAt { get; set; }
    
    public bool IsDeleted { get; set; } = false;
    
    // For attachments
    public Guid? AttachmentId { get; set; }
    public virtual Document Attachment { get; set; }
    
    // For system messages
    public bool IsSystemMessage { get; set; } = false;
    
    // Parent message for threading
    public Guid? ParentMessageId { get; set; }
    public virtual Message ParentMessage { get; set; }
    
    public virtual ICollection<Message> Replies { get; set; } = new List<Message>();
}

public class ConversationParticipant : TenantEntity
{
    
    [Required]
    public Guid ConversationId { get; set; }
    public virtual Conversation Conversation { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    public string UserName { get; set; }
    
    public string Role { get; set; }
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LeftAt { get; set; }
    
    public DateTime? LastReadAt { get; set; }
    
    public int UnreadCount { get; set; } = 0;
    
    public bool IsMuted { get; set; } = false;
}

public enum ConversationType
{
    General,
    Medical,
    Appointment,
    Prescription,
    TestResults,
    Billing,
    Emergency
}

public enum ConversationStatus
{
    Open,
    Closed,
    Archived,
    Urgent,
    AwaitingResponse
}

public enum ConversationPriority
{
    Low,
    Normal,
    High,
    Urgent
}

// DTOs for API requests/responses
public class CreateConversationRequest
{
    [Required]
    public string Subject { get; set; }
    
    [Required]
    public string InitialMessage { get; set; }
    
    public Guid? ProviderId { get; set; }
    
    public ConversationType Type { get; set; } = ConversationType.General;
    
    public ConversationPriority Priority { get; set; } = ConversationPriority.Normal;
}

public class SendMessageRequest
{
    [Required]
    public string Content { get; set; }
    
    public Guid? ParentMessageId { get; set; }
    
    public Guid? AttachmentId { get; set; }
}

public class ConversationDto
{
    public Guid Id { get; set; }
    public string Subject { get; set; }
    public ConversationType Type { get; set; }
    public ConversationStatus Status { get; set; }
    public ConversationPriority Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
    public string LastMessage { get; set; }
    public string PatientName { get; set; }
    public string ProviderName { get; set; }
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; }
    public string SenderRole { get; set; }
    public string Content { get; set; }
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsSystemMessage { get; set; }
    public Guid? ParentMessageId { get; set; }
    public DocumentDto Attachment { get; set; }
}

public class DocumentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; }
    public string DocumentType { get; set; }
    public long FileSizeBytes { get; set; }
}
