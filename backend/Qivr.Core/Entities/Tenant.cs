using Qivr.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Core.Entities;

public class Tenant : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public TenantStatus Status { get; set; } = TenantStatus.Active;
    public string Plan { get; set; } = "starter";
    public string Timezone { get; set; } = "Australia/Sydney";
    public string Locale { get; set; } = "en-AU";
    public Dictionary<string, object> Settings { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
    public DateTime? DeletedAt { get; set; }
    
    // SaaS Multi-Tenant Auth
    public string? CognitoUserPoolId { get; set; }
    public string? CognitoUserPoolClientId { get; set; }
    public string? CognitoUserPoolDomain { get; set; }
    
    // Clinic Properties (Phase 3.1: Replace Clinic entity)
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [StringLength(500)]
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(50)]
    public string? State { get; set; }
    
    [StringLength(20)]
    public string? ZipCode { get; set; }
    
    [StringLength(100)]
    public string? Country { get; set; }
    
    [StringLength(20)]
    public string? Phone { get; set; }
    
    [StringLength(255)]
    public string? Email { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual ICollection<BrandTheme> BrandThemes { get; set; } = new List<BrandTheme>();
}

public enum TenantStatus
{
    Active,
    Suspended,
    Cancelled
}
