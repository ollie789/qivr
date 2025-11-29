using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IResilientOcrService
{
    /// <summary>
    /// Queue a document for OCR processing with retry support
    /// </summary>
    Task<Guid> QueueForOcrAsync(Guid documentId, Guid tenantId, string s3Bucket, string s3Key, int priority = 0, CancellationToken ct = default);

    /// <summary>
    /// Process the next available OCR job
    /// </summary>
    Task<bool> ProcessNextJobAsync(CancellationToken ct = default);

    /// <summary>
    /// Get pending job count
    /// </summary>
    Task<int> GetPendingJobCountAsync(CancellationToken ct = default);

    /// <summary>
    /// Get job status
    /// </summary>
    Task<OcrJobStatusDto?> GetJobStatusAsync(Guid jobId, CancellationToken ct = default);

    /// <summary>
    /// Retry a failed job
    /// </summary>
    Task<bool> RetryJobAsync(Guid jobId, CancellationToken ct = default);

    /// <summary>
    /// Cancel a pending job
    /// </summary>
    Task<bool> CancelJobAsync(Guid jobId, CancellationToken ct = default);

    /// <summary>
    /// Get failed jobs for a tenant
    /// </summary>
    Task<List<OcrJobStatusDto>> GetFailedJobsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default);

    /// <summary>
    /// Clean up old completed jobs
    /// </summary>
    Task<int> CleanupOldJobsAsync(int daysToKeep = 30, CancellationToken ct = default);
}

public class ResilientOcrService : IResilientOcrService
{
    private readonly QivrDbContext _context;
    private readonly ITextractService _textractService;
    private readonly ILogger<ResilientOcrService> _logger;

    // Retry backoff settings (in seconds)
    private static readonly int[] RetryDelays = { 30, 120, 600 }; // 30s, 2min, 10min

    public ResilientOcrService(
        QivrDbContext context,
        ITextractService textractService,
        ILogger<ResilientOcrService> logger)
    {
        _context = context;
        _textractService = textractService;
        _logger = logger;
    }

    public async Task<Guid> QueueForOcrAsync(
        Guid documentId,
        Guid tenantId,
        string s3Bucket,
        string s3Key,
        int priority = 0,
        CancellationToken ct = default)
    {
        // Check if there's already a pending/processing job for this document
        var existingJob = await _context.Set<OcrJob>()
            .FirstOrDefaultAsync(j => j.DocumentId == documentId &&
                                     (j.Status == OcrJobStatus.Pending || j.Status == OcrJobStatus.Processing), ct);

        if (existingJob != null)
        {
            _logger.LogInformation("OCR job already exists for document {DocumentId}: {JobId}",
                documentId, existingJob.Id);
            return existingJob.Id;
        }

        var job = new OcrJob
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            DocumentId = documentId,
            S3Bucket = s3Bucket,
            S3Key = s3Key,
            Status = OcrJobStatus.Pending,
            Priority = priority,
            QueuedAt = DateTime.UtcNow,
            NextAttemptAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<OcrJob>().Add(job);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Queued OCR job {JobId} for document {DocumentId}", job.Id, documentId);

        return job.Id;
    }

    public async Task<bool> ProcessNextJobAsync(CancellationToken ct = default)
    {
        // Get the next available job (pending, not scheduled for later, highest priority first)
        var job = await _context.Set<OcrJob>()
            .Include(j => j.Document)
            .Where(j => j.Status == OcrJobStatus.Pending &&
                       (j.NextAttemptAt == null || j.NextAttemptAt <= DateTime.UtcNow))
            .OrderByDescending(j => j.Priority)
            .ThenBy(j => j.QueuedAt)
            .FirstOrDefaultAsync(ct);

        if (job == null)
        {
            return false; // No jobs to process
        }

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            // Mark as processing
            job.Status = OcrJobStatus.Processing;
            job.StartedAt = DateTime.UtcNow;
            job.AttemptCount++;
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("Processing OCR job {JobId}, attempt {Attempt}/{MaxAttempts}",
                job.Id, job.AttemptCount, job.MaxAttempts);

            // Perform OCR
            var result = await _textractService.ExtractTextFromDocumentAsync(job.S3Bucket, job.S3Key, ct);

            stopwatch.Stop();

            // Update document with results
            if (job.Document != null)
            {
                job.Document.ExtractedText = result.ExtractedText;
                job.Document.ExtractedPatientName = result.PatientName;
                job.Document.ExtractedDob = result.DateOfBirth;
                job.Document.ExtractedIdentifiers = result.Identifiers.ToDictionary(k => k.Key, v => (object)v.Value);
                job.Document.ConfidenceScore = result.ConfidenceScore;
                job.Document.OcrCompletedAt = DateTime.UtcNow;
                job.Document.Status = "ready";
            }

            // Mark job as completed
            job.Status = OcrJobStatus.Completed;
            job.CompletedAt = DateTime.UtcNow;
            job.ProcessingTimeMs = stopwatch.ElapsedMilliseconds;
            job.ConfidenceScore = result.ConfidenceScore;
            job.LastError = null;
            job.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("OCR job {JobId} completed successfully in {ElapsedMs}ms. Confidence: {Confidence}%",
                job.Id, stopwatch.ElapsedMilliseconds, result.ConfidenceScore);

            return true;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex, "OCR job {JobId} failed on attempt {Attempt}/{MaxAttempts}",
                job.Id, job.AttemptCount, job.MaxAttempts);

            job.LastError = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
            job.ProcessingTimeMs = stopwatch.ElapsedMilliseconds;
            job.UpdatedAt = DateTime.UtcNow;

            if (job.AttemptCount >= job.MaxAttempts)
            {
                // Permanent failure
                job.Status = OcrJobStatus.Failed;
                job.CompletedAt = DateTime.UtcNow;

                // Update document status
                if (job.Document != null)
                {
                    job.Document.Status = "failed";
                }

                _logger.LogWarning("OCR job {JobId} permanently failed after {Attempts} attempts",
                    job.Id, job.AttemptCount);
            }
            else
            {
                // Schedule retry with exponential backoff
                var retryDelayIndex = Math.Min(job.AttemptCount - 1, RetryDelays.Length - 1);
                var retryDelay = TimeSpan.FromSeconds(RetryDelays[retryDelayIndex]);

                job.Status = OcrJobStatus.Pending;
                job.NextAttemptAt = DateTime.UtcNow.Add(retryDelay);

                _logger.LogInformation("OCR job {JobId} scheduled for retry at {NextAttempt}",
                    job.Id, job.NextAttemptAt);
            }

            await _context.SaveChangesAsync(ct);

            return true; // Job was processed (even though it failed)
        }
    }

    public async Task<int> GetPendingJobCountAsync(CancellationToken ct = default)
    {
        return await _context.Set<OcrJob>()
            .CountAsync(j => j.Status == OcrJobStatus.Pending, ct);
    }

    public async Task<OcrJobStatusDto?> GetJobStatusAsync(Guid jobId, CancellationToken ct = default)
    {
        var job = await _context.Set<OcrJob>()
            .Include(j => j.Document)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);

        if (job == null)
            return null;

        return MapToDto(job);
    }

    public async Task<bool> RetryJobAsync(Guid jobId, CancellationToken ct = default)
    {
        var job = await _context.Set<OcrJob>()
            .FirstOrDefaultAsync(j => j.Id == jobId && j.Status == OcrJobStatus.Failed, ct);

        if (job == null)
            return false;

        job.Status = OcrJobStatus.Pending;
        job.AttemptCount = 0;
        job.NextAttemptAt = DateTime.UtcNow;
        job.LastError = null;
        job.CompletedAt = null;
        job.StartedAt = null;
        job.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("OCR job {JobId} queued for retry", jobId);

        return true;
    }

    public async Task<bool> CancelJobAsync(Guid jobId, CancellationToken ct = default)
    {
        var job = await _context.Set<OcrJob>()
            .FirstOrDefaultAsync(j => j.Id == jobId && j.Status == OcrJobStatus.Pending, ct);

        if (job == null)
            return false;

        job.Status = OcrJobStatus.Cancelled;
        job.CompletedAt = DateTime.UtcNow;
        job.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("OCR job {JobId} cancelled", jobId);

        return true;
    }

    public async Task<List<OcrJobStatusDto>> GetFailedJobsAsync(Guid tenantId, int limit = 50, CancellationToken ct = default)
    {
        var jobs = await _context.Set<OcrJob>()
            .Include(j => j.Document)
            .Where(j => j.TenantId == tenantId && j.Status == OcrJobStatus.Failed)
            .OrderByDescending(j => j.CompletedAt)
            .Take(limit)
            .ToListAsync(ct);

        return jobs.Select(MapToDto).ToList();
    }

    public async Task<int> CleanupOldJobsAsync(int daysToKeep = 30, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-daysToKeep);

        var oldJobs = await _context.Set<OcrJob>()
            .Where(j => j.Status == OcrJobStatus.Completed &&
                       j.CompletedAt < cutoff)
            .ToListAsync(ct);

        if (oldJobs.Any())
        {
            _context.Set<OcrJob>().RemoveRange(oldJobs);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("Cleaned up {Count} old OCR jobs", oldJobs.Count);
        }

        return oldJobs.Count;
    }

    private static OcrJobStatusDto MapToDto(OcrJob job)
    {
        return new OcrJobStatusDto
        {
            Id = job.Id,
            DocumentId = job.DocumentId,
            DocumentName = job.Document?.FileName,
            Status = job.Status.ToString(),
            AttemptCount = job.AttemptCount,
            MaxAttempts = job.MaxAttempts,
            QueuedAt = job.QueuedAt,
            StartedAt = job.StartedAt,
            CompletedAt = job.CompletedAt,
            NextAttemptAt = job.NextAttemptAt,
            LastError = job.LastError,
            ProcessingTimeMs = job.ProcessingTimeMs,
            ConfidenceScore = job.ConfidenceScore
        };
    }
}

public class OcrJobStatusDto
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public string? DocumentName { get; set; }
    public string Status { get; set; } = "";
    public int AttemptCount { get; set; }
    public int MaxAttempts { get; set; }
    public DateTime QueuedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public string? LastError { get; set; }
    public long? ProcessingTimeMs { get; set; }
    public decimal? ConfidenceScore { get; set; }
}
