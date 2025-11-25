using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class ApiKey : DeletableEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string KeyHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(8)]
    public string KeyPrefix { get; set; } = string.Empty;

    public DateTime? LastUsedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public List<string> Scopes { get; set; } = new();
    
    public Guid CreatedBy { get; set; }
    public virtual User? Creator { get; set; }
}
