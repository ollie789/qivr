using Qivr.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Core.Entities;

public class Provider : TenantEntity
{
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public Guid ClinicId { get; set; }
    
    [StringLength(50)]
    public string? Title { get; set; }  // MD, DO, NP, PA, etc.
    
    [StringLength(100)]
    public string? Specialty { get; set; }
    
    [StringLength(50)]
    public string? LicenseNumber { get; set; }
    
    [StringLength(50)]
    public string? NpiNumber { get; set; }  // National Provider Identifier
    
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Clinic? Clinic { get; set; }
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();
}