using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class ServiceType : TenantEntity
{
    public string Name { get; set; } = string.Empty; // e.g., "Initial Consultation", "Follow-up"
    public string? Description { get; set; }
    public string? Specialty { get; set; } // e.g., "Physiotherapy", "Chiropractic", null for all
    public int DurationMinutes { get; set; } = 30;
    public decimal Price { get; set; }
    public string? BillingCode { get; set; } // e.g., "INIT-PHYSIO", "FU-CHIRO"
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual Tenant Tenant { get; set; } = null!;
}
