using System.ComponentModel.DataAnnotations;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Tracks OCR processing jobs with retry support
/// </summary>
public class OcrJob : TenantEntity
{
    [Required]
    public Guid DocumentId { get; set; }
    public virtual Document? Document { get; set; }

    [Required]
    [StringLength(500)]
    public string S3Bucket { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string S3Key { get; set; } = string.Empty;

    public OcrJobStatus Status { get; set; } = OcrJobStatus.Pending;

    /// <summary>
    /// Number of times this job has been attempted
    /// </summary>
    public int AttemptCount { get; set; } = 0;

    /// <summary>
    /// Maximum retry attempts before giving up
    /// </summary>
    public int MaxAttempts { get; set; } = 3;

    /// <summary>
    /// When the job was first queued
    /// </summary>
    public DateTime QueuedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When processing started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When processing completed (success or permanent failure)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// When this job should next be processed (for retry backoff)
    /// </summary>
    public DateTime? NextAttemptAt { get; set; }

    /// <summary>
    /// Last error message if failed
    /// </summary>
    [StringLength(2000)]
    public string? LastError { get; set; }

    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public long? ProcessingTimeMs { get; set; }

    /// <summary>
    /// OCR confidence score if successful
    /// </summary>
    public decimal? ConfidenceScore { get; set; }

    /// <summary>
    /// Priority for processing (higher = sooner)
    /// </summary>
    public int Priority { get; set; } = 0;
}

public enum OcrJobStatus
{
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled
}
