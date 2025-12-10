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

    /// <summary>
    /// The tenant this API key belongs to. Required for external API access.
    /// </summary>
    public new Guid TenantId { get; set; }
    public virtual Tenant? Tenant { get; set; }

    /// <summary>
    /// Partner/organization name for external API keys
    /// </summary>
    [MaxLength(200)]
    public string? PartnerName { get; set; }

    /// <summary>
    /// Contact email for the partner organization
    /// </summary>
    [MaxLength(200)]
    public string? ContactEmail { get; set; }

    /// <summary>
    /// Rate limit per hour (0 = unlimited)
    /// </summary>
    public int RateLimitPerHour { get; set; } = 1000;

    /// <summary>
    /// Number of requests made in the current hour
    /// </summary>
    public int RequestsThisHour { get; set; }

    /// <summary>
    /// When the hourly counter was last reset
    /// </summary>
    public DateTime? RateLimitResetAt { get; set; }

    public Guid CreatedBy { get; set; }
    public virtual User? Creator { get; set; }
}
