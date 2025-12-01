using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Audit log for all admin portal write operations.
/// This provides a tamper-evident record of administrative changes.
/// </summary>
public class AdminAuditLog : BaseEntity
{
    /// <summary>
    /// The admin user ID (Cognito sub or email) who performed the action
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string AdminUserId { get; set; } = string.Empty;

    /// <summary>
    /// Admin user email for easy identification
    /// </summary>
    [MaxLength(255)]
    public string? AdminEmail { get; set; }

    /// <summary>
    /// The action performed (e.g., TenantSuspend, TenantActivate, PlanUpdate, FeatureFlagUpdate)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// The type of resource affected (e.g., Tenant, Billing, ApiKey)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ResourceType { get; set; } = string.Empty;

    /// <summary>
    /// The ID of the resource affected (e.g., tenant ID)
    /// </summary>
    [Required]
    public Guid ResourceId { get; set; }

    /// <summary>
    /// Human-readable name of the resource (e.g., tenant name)
    /// </summary>
    [MaxLength(255)]
    public string? ResourceName { get; set; }

    /// <summary>
    /// JSON representation of the previous state (for rollback)
    /// </summary>
    public string? PreviousState { get; set; }

    /// <summary>
    /// JSON representation of the new state
    /// </summary>
    public string? NewState { get; set; }

    /// <summary>
    /// IP address of the admin user
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent string from the request
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Session or request ID for correlation
    /// </summary>
    [MaxLength(100)]
    public string? CorrelationId { get; set; }

    /// <summary>
    /// Whether the action was successful
    /// </summary>
    public bool Success { get; set; } = true;

    /// <summary>
    /// Error message if the action failed
    /// </summary>
    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Standard admin action types for consistency
/// </summary>
public static class AdminActions
{
    // Tenant actions
    public const string TenantView = "tenant.view";
    public const string TenantSuspend = "tenant.suspend";
    public const string TenantActivate = "tenant.activate";
    public const string TenantDelete = "tenant.delete";
    public const string TenantPlanUpdate = "tenant.plan.update";
    public const string TenantFeatureUpdate = "tenant.features.update";

    // Billing actions
    public const string BillingOverviewView = "billing.overview.view";
    public const string BillingInvoicesView = "billing.invoices.view";
    public const string BillingStripeCustomerCreate = "billing.stripe.customer.create";
    public const string BillingPortalSessionCreate = "billing.portal.session.create";

    // API Key actions
    public const string ApiKeyCreate = "apikey.create";
    public const string ApiKeyRevoke = "apikey.revoke";

    // Research Partner actions
    public const string ResearchPartnerCreate = "research_partner.create";
    public const string ResearchPartnerUpdate = "research_partner.update";
    public const string ResearchPartnerActivate = "research_partner.activate";
    public const string ResearchPartnerDeactivate = "research_partner.deactivate";
    public const string ResearchPartnerDelete = "research_partner.delete";
    public const string ResearchPartnerAffiliationCreate = "research_partner.affiliation.create";
    public const string ResearchPartnerAffiliationUpdate = "research_partner.affiliation.update";
    public const string ResearchPartnerAffiliationDelete = "research_partner.affiliation.delete";
}
