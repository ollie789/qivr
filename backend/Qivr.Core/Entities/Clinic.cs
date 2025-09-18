using Qivr.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Core.Entities;

public class Clinic : TenantEntity
{
    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;
    
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
    
    // Store additional data in metadata JSON
    public Dictionary<string, object> Metadata { get; set; } = new();
    
    // Navigation properties
    public virtual ICollection<Provider> Providers { get; set; } = new List<Provider>();
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}