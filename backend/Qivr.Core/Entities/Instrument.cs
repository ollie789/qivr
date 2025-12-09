using System.Text.Json.Serialization;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Represents a PROM instrument family (e.g., ODI, KOOS, PHQ-9).
/// This is the catalogue of available questionnaire types.
/// </summary>
public class Instrument : BaseEntity
{
    /// <summary>
    /// Unique short code for the instrument (e.g., "odi", "koos", "phq9")
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly name (e.g., "Oswestry Disability Index")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Instrument family grouping (e.g., "Oswestry", "KOOS", "PROMIS")
    /// </summary>
    public string? InstrumentFamily { get; set; }

    /// <summary>
    /// Clinical domain (e.g., "spine", "knee", "hip", "mental_health", "general_health")
    /// </summary>
    public string? ClinicalDomain { get; set; }

    /// <summary>
    /// License type for usage restrictions
    /// </summary>
    public InstrumentLicenseType LicenseType { get; set; } = InstrumentLicenseType.Open;

    /// <summary>
    /// Additional licensing notes and restrictions
    /// </summary>
    public string? LicenseNotes { get; set; }

    /// <summary>
    /// Whether this is a global instrument available to all tenants
    /// </summary>
    public bool IsGlobal { get; set; } = true;

    /// <summary>
    /// Tenant ID for tenant-specific custom instruments (null for global)
    /// </summary>
    public Guid? TenantId { get; set; }

    /// <summary>
    /// Whether this instrument is active and available for use
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Description of the instrument and its intended use
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Reference URL for more information about the instrument
    /// </summary>
    public string? ReferenceUrl { get; set; }

    // Navigation properties
    public virtual Tenant? Tenant { get; set; }
    public virtual ICollection<PromTemplate> Templates { get; set; } = new List<PromTemplate>();
}

/// <summary>
/// License types for PROM instruments
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InstrumentLicenseType
{
    /// <summary>Open source, free to use</summary>
    Open,
    /// <summary>Free for non-commercial/research use</summary>
    NonCommercial,
    /// <summary>Requires commercial license for clinical use</summary>
    CommercialRequired,
    /// <summary>Proprietary with specific licensing terms</summary>
    Proprietary
}
