using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Represents a reusable exercise template in the exercise library.
/// Can be tenant-specific or system-wide (TenantId = null for global templates).
/// </summary>
public class ExerciseTemplate : BaseEntity
{
    /// <summary>
    /// Tenant ID for tenant-specific exercises. Null for global/system exercises.
    /// </summary>
    public Guid? TenantId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Step-by-step instructions for performing the exercise
    /// </summary>
    public string? Instructions { get; set; }

    // Default parameters (can be customized when added to a treatment plan)
    public int DefaultSets { get; set; } = 3;
    public int DefaultReps { get; set; } = 10;
    public int? DefaultHoldSeconds { get; set; }
    public string? DefaultFrequency { get; set; } = "Daily";

    // Video support (for future)
    [MaxLength(500)]
    public string? VideoUrl { get; set; }
    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    // Categorization
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;  // "Stretching", "Strengthening", "Balance", "Mobility", "Aerobic"

    [MaxLength(50)]
    public string BodyRegion { get; set; } = string.Empty;  // "Lower Back", "Shoulder", "Knee", "Neck", "Hip", "Ankle", "Wrist", "Core", "Full Body"

    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Beginner;

    // Common conditions this exercise addresses
    public List<string> TargetConditions { get; set; } = new();

    // Contraindications - conditions where this exercise should NOT be used
    public List<string> Contraindications { get; set; } = new();

    // Equipment needed
    public List<string> Equipment { get; set; } = new();

    // Search tags for better discoverability
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Whether this is a system/global exercise (available to all tenants)
    /// </summary>
    public bool IsSystemExercise { get; set; }

    /// <summary>
    /// Whether this exercise is active and available for use
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Sort order within category for display purposes
    /// </summary>
    public int SortOrder { get; set; }
}
