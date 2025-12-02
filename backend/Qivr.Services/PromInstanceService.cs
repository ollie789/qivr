using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IPromInstanceService
{
    Task<PromInstanceDto> SendPromToPatientAsync(Guid tenantId, SendPromRequest request, CancellationToken ct = default);
    Task<List<PromInstanceDto>> SendPromToMultiplePatientsAsync(Guid tenantId, SendBulkPromRequest request, CancellationToken ct = default);
    Task<PromInstanceDto?> GetPromInstanceAsync(Guid tenantId, Guid instanceId, CancellationToken ct = default);
    Task<List<PromInstanceDto>> GetPatientPromInstancesAsync(Guid tenantId, Guid patientId, string? status = null, CancellationToken ct = default);
    Task<List<PromInstanceDto>> GetPromInstancesAsync(Guid tenantId, Guid? templateId = null, string? status = null, Guid? patientId = null, DateTime? startDate = null, DateTime? endDate = null, CancellationToken ct = default);
    Task<PromInstanceDto> SubmitPromResponseAsync(Guid tenantId, Guid instanceId, PromSubmissionRequest response, CancellationToken ct = default);
    Task<PromInstanceDto> SaveDraftAsync(Guid tenantId, Guid instanceId, PromDraftRequest draft, CancellationToken ct = default);
    Task<bool> ReminderPromAsync(Guid tenantId, Guid instanceId, CancellationToken ct = default);
    Task<List<PromInstanceDto>> GetPendingPromsAsync(Guid tenantId, DateTime? dueBefore = null, CancellationToken ct = default);
    Task<PromInstanceStats> GetPromStatsAsync(Guid tenantId, Guid? templateId = null, DateTime? startDate = null, DateTime? endDate = null, CancellationToken ct = default);
    Task<bool> CancelPromInstanceAsync(Guid tenantId, Guid instanceId, string reason, CancellationToken ct = default);
    Task<BookingRequestDto> RequestBookingAsync(Guid tenantId, Guid instanceId, BookingRequest request, CancellationToken ct = default);
    Task<PromPreviewDto> GetPromPreviewAsync(Guid tenantId, Guid templateId, CancellationToken ct = default);

    /// <summary>
    /// Get paginated instances with DB-side stats calculation (efficient for large datasets)
    /// </summary>
    Task<PromInstancePagedResult> GetPromInstancesPagedAsync(
        Guid tenantId,
        Guid? templateId = null,
        string? status = null,
        Guid? patientId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 25,
        CancellationToken ct = default);
}

public class PromInstanceService : IPromInstanceService
{
    private const string MetadataTagsKey = "tags";
    private const string MetadataNotesKey = "notes";
    private const string MetadataNotificationKey = "notificationMethod";
    private const string MetadataAnswersKey = "answers";
    private const string MetadataReminderCountKey = "reminderCount";
    private const string MetadataCompletionSecondsKey = "completionSeconds";
    private const string MetadataSentByKey = "sentBy";
    private const string MetadataBookingRequestedKey = "bookingRequested";
    private const string MetadataBookingRequestedAtKey = "bookingRequestedAt";
    private const string MetadataDraftResponsesKey = "draftResponses";
    private const string MetadataDraftLastQuestionIndexKey = "draftLastQuestionIndex";
    private const string MetadataDraftSavedAtKey = "draftSavedAt";

    private readonly QivrDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly ILogger<PromInstanceService> _logger;

    public PromInstanceService(
        QivrDbContext db,
        INotificationService notificationService,
        ILogger<PromInstanceService> logger)
    {
        _db = db;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<PromInstanceDto> SendPromToPatientAsync(Guid tenantId, SendPromRequest request, CancellationToken ct = default)
    {
        var template = await _db.PromTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == request.TemplateId, ct)
            ?? throw new ArgumentException($"PROM template {request.TemplateId} not found");

        var patient = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == request.PatientId, ct)
            ?? throw new ArgumentException($"Patient {request.PatientId} not found");

        var scheduledAt = request.ScheduledAt ?? DateTime.UtcNow;
        var dueDate = request.DueDate ?? scheduledAt.AddDays(7);

        var metadata = new Dictionary<string, object>
        {
            [MetadataNotificationKey] = request.NotificationMethod.ToString(),
            [MetadataTagsKey] = request.Tags ?? new List<string>(),
            [MetadataNotesKey] = request.Notes,
            [MetadataSentByKey] = request.SentBy,
            [MetadataReminderCountKey] = 0
        };

        var instance = new PromInstance
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TemplateId = template.Id,
            PatientId = request.PatientId,
            Status = PromStatus.Pending,
            ScheduledFor = scheduledAt,
            DueDate = dueDate,
            ResponseData = metadata
        };

        _db.PromInstances.Add(instance);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("PROM instance {InstanceId} created for template {TemplateId} and patient {PatientId}", instance.Id, template.Id, request.PatientId);

        return await MapInstanceToDtoAsync(tenantId, instance.Id, ct);
    }

    public async Task<List<PromInstanceDto>> SendPromToMultiplePatientsAsync(Guid tenantId, SendBulkPromRequest request, CancellationToken ct = default)
    {
        var results = new List<PromInstanceDto>();

        foreach (var patientId in request.PatientIds)
        {
            try
            {
                var dto = await SendPromToPatientAsync(tenantId, new SendPromRequest
                {
                    TemplateId = request.TemplateId,
                    PatientId = patientId,
                    ScheduledAt = request.ScheduledAt,
                    DueDate = request.DueDate,
                    NotificationMethod = request.NotificationMethod,
                    SentBy = request.SentBy,
                    Tags = request.Tags,
                    Notes = request.Notes
                }, ct);

                results.Add(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send PROM template {TemplateId} to patient {PatientId}", request.TemplateId, patientId);
            }
        }

        return results;
    }

    public async Task<PromInstanceDto?> GetPromInstanceAsync(Guid tenantId, Guid instanceId, CancellationToken ct = default)
    {
        return await MapInstanceToDtoAsync(tenantId, instanceId, ct, allowMissing: true);
    }

    public async Task<List<PromInstanceDto>> GetPatientPromInstancesAsync(Guid tenantId, Guid patientId, string? status = null, CancellationToken ct = default)
    {
        var query = _db.PromInstances
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.PatientId == patientId);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PromStatus>(status, true, out var parsed))
        {
            query = query.Where(i => i.Status == parsed);
        }

        var instances = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

        var result = new List<PromInstanceDto>(instances.Count);
        foreach (var instance in instances)
        {
            result.Add(await MapInstanceToDtoAsync(tenantId, instance.Id, ct));
        }

        return result;
    }

    public async Task<List<PromInstanceDto>> GetPromInstancesAsync(Guid tenantId, Guid? templateId = null, string? status = null, Guid? patientId = null, DateTime? startDate = null, DateTime? endDate = null, CancellationToken ct = default)
    {
        var query = _db.PromInstances
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId);

        if (templateId.HasValue)
        {
            query = query.Where(i => i.TemplateId == templateId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PromStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(i => i.Status == parsedStatus);
        }

        if (patientId.HasValue)
        {
            query = query.Where(i => i.PatientId == patientId.Value);
        }

        if (startDate.HasValue)
        {
            var start = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
            query = query.Where(i => i.CreatedAt >= start);
        }

        if (endDate.HasValue)
        {
            var end = DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc);
            query = query.Where(i => i.CreatedAt <= end);
        }

        var instances = await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(200)
            .ToListAsync(ct);

        var result = new List<PromInstanceDto>(instances.Count);
        foreach (var instance in instances)
        {
            result.Add(await MapInstanceToDtoAsync(tenantId, instance.Id, ct));
        }

        return result;
    }

    public async Task<PromInstanceDto> SaveDraftAsync(Guid tenantId, Guid instanceId, PromDraftRequest draft, CancellationToken ct = default)
    {
        var instance = await _db.PromInstances
            .Include(i => i.Template)
            .Include(i => i.Patient)
            .FirstOrDefaultAsync(i => i.Id == instanceId && i.TenantId == tenantId, ct)
            ?? await _db.PromInstances
                .Include(i => i.Template)
                .Include(i => i.Patient)
                .FirstOrDefaultAsync(i => i.Id == instanceId, ct)
            ?? throw new ArgumentException($"PROM instance {instanceId} not found");

        if (instance.Status is PromStatus.Completed or PromStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot save a draft for a completed or cancelled PROM");
        }

        var metadata = EnsureMetadata(instance);

        if (draft.Responses != null)
        {
            metadata[MetadataDraftResponsesKey] = draft.Responses;
        }

        if (draft.LastQuestionIndex.HasValue)
        {
            metadata[MetadataDraftLastQuestionIndexKey] = draft.LastQuestionIndex.Value;
        }

        if (draft.CompletionSeconds.HasValue)
        {
            metadata[MetadataCompletionSecondsKey] = draft.CompletionSeconds.Value;
        }

        metadata[MetadataDraftSavedAtKey] = DateTime.UtcNow;

        instance.ResponseData = metadata;

        if (instance.Status == PromStatus.Pending)
        {
            instance.Status = PromStatus.InProgress;
        }

        instance.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return await MapInstanceToDtoAsync(instance.TenantId, instance.Id, ct);
    }

    public async Task<PromInstanceDto> SubmitPromResponseAsync(Guid tenantId, Guid instanceId, PromSubmissionRequest response, CancellationToken ct = default)
    {
        var instance = await _db.PromInstances
            .Include(i => i.Template)
            .Include(i => i.Patient)
            .FirstOrDefaultAsync(i => i.Id == instanceId && i.TenantId == tenantId, ct)
            ?? await _db.PromInstances
                .Include(i => i.Template)
                .Include(i => i.Patient)
                .FirstOrDefaultAsync(i => i.Id == instanceId, ct)
            ?? throw new ArgumentException($"PROM instance {instanceId} not found");

        if (instance.Status == PromStatus.Completed)
        {
            throw new InvalidOperationException("PROM instance already completed");
        }

        var answersDictionary = response.Answers
            .Where(a => a.QuestionId != Guid.Empty)
            .ToDictionary(a => a.QuestionId.ToString(), a => a.Value ?? string.Empty);

        var metadata = EnsureMetadata(instance);
        metadata[MetadataAnswersKey] = answersDictionary;
        metadata[MetadataCompletionSecondsKey] = response.CompletionSeconds ?? 0;

        var submittedAt = response.SubmittedAt == default ? DateTime.UtcNow : response.SubmittedAt;
        var score = CalculateScore(instance.Template, answersDictionary);
        var severity = DetermineSeverity(instance.Template, score);

        instance.Status = PromStatus.Completed;
        instance.CompletedAt = submittedAt;
        instance.Score = score;
        instance.ResponseData = metadata;

        var promResponse = new PromResponse
        {
            Id = Guid.NewGuid(),
            TenantId = instance.TenantId,
            PatientId = instance.PatientId,
            PromInstanceId = instance.Id,
            PromType = instance.Template?.Key ?? instance.Template?.Name ?? string.Empty,
            CompletedAt = submittedAt,
            Score = score,
            Severity = severity,
            Answers = answersDictionary,
            Notes = response.Notes
        };

        _db.PromResponses.Add(promResponse);
        await _db.SaveChangesAsync(ct);

        if (response.RequestBooking && response.BookingRequest != null)
        {
            try
            {
                await RequestBookingAsync(instance.TenantId, instance.Id, response.BookingRequest, ct);
            }
            catch (Exception bookingEx)
            {
                _logger.LogError(bookingEx, "Failed to create booking request from PROM instance {InstanceId}", instance.Id);
            }
        }

        return await MapInstanceToDtoAsync(instance.TenantId, instance.Id, ct);
    }

    public async Task<bool> ReminderPromAsync(Guid tenantId, Guid instanceId, CancellationToken ct = default)
    {
        var instance = await _db.PromInstances
            .FirstOrDefaultAsync(i => i.Id == instanceId && i.TenantId == tenantId, ct);

        if (instance == null)
        {
            return false;
        }

        if (instance.Status is PromStatus.Completed or PromStatus.Cancelled)
        {
            return false;
        }

        var metadata = EnsureMetadata(instance);
        var reminderCount = ExtractInt(metadata, MetadataReminderCountKey);
        metadata[MetadataReminderCountKey] = reminderCount + 1;
        instance.ResponseData = metadata;
        instance.ReminderSentAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        try
        {
            await _notificationService.SendPromReminderAsync(
                instance.PatientId,
                instance.Id,
                instance.Template?.Name ?? "PROM",
                instance.DueDate,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to dispatch reminder for PROM instance {InstanceId}", instance.Id);
        }

        return true;
    }

    public async Task<List<PromInstanceDto>> GetPendingPromsAsync(Guid tenantId, DateTime? dueBefore = null, CancellationToken ct = default)
    {
        var query = _db.PromInstances
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.Status == PromStatus.Pending);

        if (dueBefore.HasValue)
        {
            query = query.Where(i => i.DueDate <= dueBefore.Value);
        }

        var instances = await query
            .OrderBy(i => i.DueDate)
            .ToListAsync(ct);

        var result = new List<PromInstanceDto>(instances.Count);
        foreach (var instance in instances)
        {
            result.Add(await MapInstanceToDtoAsync(tenantId, instance.Id, ct));
        }

        return result;
    }

    public async Task<PromInstanceStats> GetPromStatsAsync(Guid tenantId, Guid? templateId = null, DateTime? startDate = null, DateTime? endDate = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var query = _db.PromInstances.AsNoTracking().Where(i => i.TenantId == tenantId);

        if (templateId.HasValue)
        {
            query = query.Where(i => i.TemplateId == templateId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(i => i.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(i => i.CreatedAt <= endDate.Value);
        }

        // Push aggregation to database instead of loading all records
        var stats = await query
            .GroupBy(_ => 1) // Group all into single result
            .Select(g => new
            {
                Total = g.Count(),
                Completed = g.Count(i => i.Status == PromStatus.Completed),
                Pending = g.Count(i => i.Status == PromStatus.Pending && i.DueDate >= now),
                Scheduled = g.Count(i => i.Status == PromStatus.Pending && i.ScheduledFor > now),
                Expired = g.Count(i => i.Status != PromStatus.Completed && i.Status != PromStatus.Cancelled && i.DueDate < now),
                Cancelled = g.Count(i => i.Status == PromStatus.Cancelled),
                AverageScore = g.Where(i => i.Score != null).Average(i => (double?)i.Score) ?? 0d
            })
            .FirstOrDefaultAsync(ct);

        if (stats == null)
        {
            return new PromInstanceStats();
        }

        var completionRate = stats.Total == 0 ? 0d : (double)stats.Completed / stats.Total * 100d;

        // For completion time, we still need to query completed instances with JSONB data
        // But limit to recent completions to avoid loading too much
        var averageCompletionMinutes = 0d;
        var completedWithTime = await query
            .Where(i => i.Status == PromStatus.Completed && i.Score != null)
            .OrderByDescending(i => i.CompletedAt)
            .Take(100) // Sample last 100 for average completion time
            .Select(i => i.ResponseData)
            .ToListAsync(ct);

        if (completedWithTime.Count > 0)
        {
            var completionTimes = completedWithTime
                .Select(rd => ExtractCompletionSeconds(rd))
                .Where(v => v.HasValue && v.Value > 0)
                .Select(v => v!.Value / 60d)
                .ToList();

            if (completionTimes.Count > 0)
            {
                averageCompletionMinutes = completionTimes.Average();
            }
        }

        return new PromInstanceStats
        {
            TotalSent = stats.Total,
            Completed = stats.Completed,
            Pending = stats.Pending,
            Scheduled = stats.Scheduled,
            Expired = stats.Expired,
            Cancelled = stats.Cancelled,
            CompletionRate = Math.Round(completionRate, 2),
            AverageCompletionTimeMinutes = Math.Round(averageCompletionMinutes, 2),
            AverageScore = Math.Round(stats.AverageScore, 2)
        };
    }

    private static double? ExtractCompletionSeconds(Dictionary<string, object>? responseData)
    {
        if (responseData == null || !responseData.TryGetValue(MetadataCompletionSecondsKey, out var raw) || raw == null)
        {
            return null;
        }

        if (raw is JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.Number when element.TryGetDouble(out var val) => val,
                JsonValueKind.String when double.TryParse(element.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) => parsed,
                _ => null
            };
        }

        return double.TryParse(raw.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var result) ? result : null;
    }

    public async Task<bool> CancelPromInstanceAsync(Guid tenantId, Guid instanceId, string reason, CancellationToken ct = default)
    {
        var instance = await _db.PromInstances
            .FirstOrDefaultAsync(i => i.Id == instanceId && i.TenantId == tenantId, ct);

        if (instance == null)
        {
            return false;
        }

        if (instance.Status == PromStatus.Completed || instance.Status == PromStatus.Cancelled)
        {
            return false;
        }

        var metadata = EnsureMetadata(instance);
        metadata["cancelReason"] = reason;
        instance.ResponseData = metadata;
        instance.Status = PromStatus.Cancelled;
        instance.CompletedAt = null;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<BookingRequestDto> RequestBookingAsync(Guid tenantId, Guid instanceId, BookingRequest request, CancellationToken ct = default)
    {
        var instance = await _db.PromInstances
            .Include(i => i.Patient)
            .Include(i => i.Template)
            .FirstOrDefaultAsync(i => i.Id == instanceId && i.TenantId == tenantId, ct)
            ?? throw new ArgumentException($"PROM instance {instanceId} not found");

        var booking = new PromBookingRequest
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PromInstanceId = instanceId,
            PatientId = instance.PatientId,
            PreferredDate = request.PreferredDate,
            AlternativeDate = request.AlternativeDate,
            TimePreference = request.TimePreference,
            ReasonForVisit = request.ReasonForVisit ?? $"Follow-up for {instance.Template?.Name ?? "PROM"}",
            Notes = request.Notes,
            Status = "Pending",
            RequestedAt = DateTime.UtcNow
        };

        _db.PromBookingRequests.Add(booking);

        var metadata = EnsureMetadata(instance);
        metadata[MetadataBookingRequestedKey] = true;
        metadata[MetadataBookingRequestedAtKey] = booking.RequestedAt;
        instance.ResponseData = metadata;

        await _db.SaveChangesAsync(ct);

        return new BookingRequestDto
        {
            Id = booking.Id,
            PromInstanceId = booking.PromInstanceId,
            PatientId = booking.PatientId,
            PatientName = instance.Patient != null ? $"{instance.Patient.FirstName} {instance.Patient.LastName}" : string.Empty,
            RequestedDate = booking.PreferredDate,
            AlternativeDate = booking.AlternativeDate,
            TimePreference = booking.TimePreference,
            ReasonForVisit = booking.ReasonForVisit,
            Urgency = DetermineBookingUrgency(instance.Score),
            Notes = booking.Notes,
            CreatedAt = booking.RequestedAt,
            Status = booking.Status,
            PromTemplateName = instance.Template?.Name ?? string.Empty,
            PromCompletedAt = instance.CompletedAt,
            PromScore = instance.Score
        };
    }

    public async Task<PromPreviewDto> GetPromPreviewAsync(Guid tenantId, Guid templateId, CancellationToken ct = default)
    {
        var template = await _db.PromTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == templateId && t.TenantId == tenantId, ct)
            ?? throw new ArgumentException($"PROM template {templateId} not found");

        var questions = BuildQuestionDtos(template);
        var estimatedMinutes = Math.Max(5, questions.Count * 2);

        return new PromPreviewDto
        {
            TemplateId = template.Id,
            TemplateName = template.Name,
            Description = template.Description ?? string.Empty,
            EstimatedTimeMinutes = estimatedMinutes,
            QuestionCount = questions.Count,
            Questions = questions
        };
    }

    public async Task<PromInstancePagedResult> GetPromInstancesPagedAsync(
        Guid tenantId,
        Guid? templateId = null,
        string? status = null,
        Guid? patientId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 25,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var query = _db.PromInstances.AsNoTracking().Where(i => i.TenantId == tenantId);

        if (templateId.HasValue)
        {
            query = query.Where(i => i.TemplateId == templateId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PromStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(i => i.Status == parsedStatus);
        }

        if (patientId.HasValue)
        {
            query = query.Where(i => i.PatientId == patientId.Value);
        }

        if (startDate.HasValue)
        {
            var start = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
            query = query.Where(i => i.CreatedAt >= start);
        }

        if (endDate.HasValue)
        {
            var end = DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc);
            query = query.Where(i => i.CreatedAt <= end);
        }

        // Get stats with DB-side aggregation (single query)
        var stats = await query
            .GroupBy(_ => 1)
            .Select(g => new PromResponseStatistics
            {
                Total = g.Count(),
                CompletedCount = g.Count(i => i.Status == PromStatus.Completed),
                PendingCount = g.Count(i => i.Status == PromStatus.Pending),
                InProgressCount = g.Count(i => i.Status == PromStatus.InProgress),
                ExpiredCount = g.Count(i => i.Status != PromStatus.Completed && i.Status != PromStatus.Cancelled && i.DueDate < now),
                CancelledCount = g.Count(i => i.Status == PromStatus.Cancelled),
                AverageScore = g.Where(i => i.Score != null).Average(i => (double?)i.Score) ?? 0d,
                LastCompleted = g.Where(i => i.Status == PromStatus.Completed).Max(i => (DateTime?)i.CompletedAt),
                NextDue = g.Where(i => i.Status == PromStatus.Pending || i.Status == PromStatus.InProgress)
                           .Min(i => (DateTime?)i.DueDate)
            })
            .FirstOrDefaultAsync(ct) ?? new PromResponseStatistics();

        stats.CompletionRate = stats.Total > 0 ? Math.Round((double)stats.CompletedCount / stats.Total * 100d, 2) : 0d;

        // Get paginated data
        var safePageSize = Math.Clamp(pageSize, 1, 100);
        var safePage = Math.Max(page, 1);
        var skip = (safePage - 1) * safePageSize;

        var instances = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip(skip)
            .Take(safePageSize)
            .Include(i => i.Template)
            .Include(i => i.Patient)
            .Include(i => i.BookingRequests)
            .ToListAsync(ct);

        var data = instances.Select(MapToDto).ToList();

        return new PromInstancePagedResult
        {
            Data = data,
            Total = stats.Total,
            Page = safePage,
            PageSize = safePageSize,
            Stats = stats
        };
    }

    private async Task<PromInstanceDto> MapInstanceToDtoAsync(Guid tenantId, Guid instanceId, CancellationToken ct, bool allowMissing = false)
    {
        var instance = await _db.PromInstances
            .AsNoTracking()
            .Include(i => i.Template)
            .Include(i => i.Patient)
            .Include(i => i.BookingRequests)
            .FirstOrDefaultAsync(i => i.Id == instanceId && (tenantId == Guid.Empty || i.TenantId == tenantId), ct);

        if (instance == null)
        {
            if (allowMissing)
            {
                return null!;
            }

            throw new ArgumentException($"PROM instance {instanceId} not found");
        }

        return MapToDto(instance);
    }

    private PromInstanceDto MapToDto(PromInstance instance)
    {
        var metadata = EnsureMetadata(instance);
        var notification = metadata.TryGetValue(MetadataNotificationKey, out var notificationRaw)
            ? notificationRaw?.ToString() ?? NotificationMethod.Email.ToString()
            : NotificationMethod.Email.ToString();

        var tags = ExtractStringList(metadata, MetadataTagsKey);
        var reminderCount = ExtractInt(metadata, MetadataReminderCountKey);
        var answers = metadata.TryGetValue(MetadataAnswersKey, out var answersRaw)
            ? ExtractAnswersDictionary(answersRaw)
            : null;

        if (answers == null && metadata.TryGetValue(MetadataDraftResponsesKey, out var draftRaw))
        {
            answers = ExtractAnswersDictionary(draftRaw);
        }

        var answered = answers?.Count ?? 0;
        var completionMinutes = ExtractDouble(metadata, MetadataCompletionSecondsKey);
        var bookingRequested = ExtractBool(metadata, MetadataBookingRequestedKey);
        var bookingRequestedAt = ExtractDate(metadata, MetadataBookingRequestedAtKey);
        var draftLastQuestionIndex = ExtractNullableInt(metadata, MetadataDraftLastQuestionIndexKey);
        var draftSavedAt = ExtractDate(metadata, MetadataDraftSavedAtKey);

        var patientName = instance.Patient != null
            ? $"{instance.Patient.FirstName} {instance.Patient.LastName}".Trim()
            : string.Empty;

        return new PromInstanceDto
        {
            Id = instance.Id,
            TemplateId = instance.TemplateId,
            TemplateName = instance.Template?.Name ?? string.Empty,
            PatientId = instance.PatientId,
            PatientName = patientName,
            Status = instance.Status.ToString(),
            CreatedAt = instance.CreatedAt,
            ScheduledAt = instance.ScheduledFor,
            DueDate = instance.DueDate,
            CompletedAt = instance.CompletedAt,
            CompletionTimeMinutes = completionMinutes.HasValue ? Math.Round(completionMinutes.Value / 60d, 2) : (double?)null,
            TotalScore = instance.Score,
            QuestionCount = instance.Template?.Questions?.Count ?? 0,
            AnsweredCount = answered,
            NotificationMethod = notification,
            ReminderCount = reminderCount,
            LastReminderSentAt = instance.ReminderSentAt,
            Tags = tags,
            Notes = metadata.TryGetValue(MetadataNotesKey, out var notesRaw) ? notesRaw?.ToString() : null,
            BookingRequested = bookingRequested || instance.BookingRequests.Any(),
            BookingRequestedAt = bookingRequestedAt ?? instance.BookingRequests.OrderByDescending(b => b.RequestedAt).FirstOrDefault()?.RequestedAt,
            Answers = answers,
            DraftLastQuestionIndex = draftLastQuestionIndex,
            DraftSavedAt = draftSavedAt
        };
    }

    private static Dictionary<string, object> EnsureMetadata(PromInstance instance)
    {
        if (instance.ResponseData is Dictionary<string, object> dict)
        {
            return new Dictionary<string, object>(dict);
        }

        if (instance.ResponseData is not null)
        {
            var json = JsonSerializer.Serialize(instance.ResponseData);
            return JsonSerializer.Deserialize<Dictionary<string, object>>(json) ?? new Dictionary<string, object>();
        }

        return new Dictionary<string, object>();
    }

    private static IReadOnlyList<string> ExtractStringList(Dictionary<string, object> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out var raw) || raw == null)
        {
            return Array.Empty<string>();
        }

        if (raw is JsonElement element && element.ValueKind == JsonValueKind.Array)
        {
            return element
                .EnumerateArray()
                .Select(e => e.ValueKind == JsonValueKind.String ? e.GetString() : e.ToString())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Cast<string>()
                .ToArray();
        }

        if (raw is IEnumerable<string> strEnumerable)
        {
            return strEnumerable.Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
        }

        if (raw is IEnumerable<object> objEnumerable)
        {
            return objEnumerable.Select(o => o?.ToString() ?? string.Empty).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
        }

        return new[] { raw.ToString() ?? string.Empty };
    }

    private static int ExtractInt(Dictionary<string, object> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out var raw) || raw == null)
        {
            return 0;
        }

        if (raw is JsonElement element && element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var jsonValue))
        {
            return jsonValue;
        }

        if (int.TryParse(raw.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
        {
            return value;
        }

        return 0;
    }

    private static int? ExtractNullableInt(Dictionary<string, object> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out var raw) || raw == null)
        {
            return null;
        }

        if (raw is JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var numeric))
            {
                return numeric;
            }

            if (element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedString))
            {
                return parsedString;
            }

            return null;
        }

        if (int.TryParse(raw.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
        {
            return value;
        }

        return null;
    }

    private static double? ExtractDouble(Dictionary<string, object> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out var raw) || raw == null)
        {
            return null;
        }

        if (raw is JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.Number when element.TryGetDouble(out var val) => val,
                JsonValueKind.String when double.TryParse(element.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) => parsed,
                _ => (double?)null
            };
        }

        return double.TryParse(raw.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var result)
            ? result
            : null;
    }

    private static bool ExtractBool(Dictionary<string, object> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out var raw) || raw == null)
        {
            return false;
        }

        if (raw is JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.String when bool.TryParse(element.GetString(), out var parsed) => parsed,
                _ => false
            };
        }

        return bool.TryParse(raw.ToString(), out var value) && value;
    }

    private static DateTime? ExtractDate(Dictionary<string, object> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out var raw) || raw == null)
        {
            return null;
        }

        if (raw is JsonElement element && element.ValueKind == JsonValueKind.String && DateTime.TryParse(element.GetString(), null, DateTimeStyles.AdjustToUniversal, out var parsedJson))
        {
            return DateTime.SpecifyKind(parsedJson, DateTimeKind.Utc);
        }

        return DateTime.TryParse(raw.ToString(), null, DateTimeStyles.AdjustToUniversal, out var parsed)
            ? DateTime.SpecifyKind(parsed, DateTimeKind.Utc)
            : null;
    }

    private static Dictionary<string, object>? ExtractAnswersDictionary(object? raw)
    {
        if (raw == null)
        {
            return null;
        }

        if (raw is JsonElement element && element.ValueKind == JsonValueKind.Object)
        {
            var dict = new Dictionary<string, object>();
            foreach (var property in element.EnumerateObject())
            {
                dict[property.Name] = property.Value.ValueKind switch
                {
                    JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                    JsonValueKind.Number when property.Value.TryGetDecimal(out var dec) => dec,
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Array => property.Value.ToString(),
                    JsonValueKind.Object => property.Value.ToString(),
                    _ => property.Value.ToString() ?? string.Empty
                };
            }

            return dict;
        }

        if (raw is IDictionary<string, object> dictObj)
        {
            return dictObj.ToDictionary(k => k.Key, v => v.Value ?? string.Empty);
        }

        return null;
    }

    private static decimal CalculateScore(PromTemplate? template, Dictionary<string, object> answers)
    {
        if (template == null)
        {
            return answers.Values
                .Select(v => TryParseDecimal(v))
                .Where(v => v.HasValue)
                .Select(v => v!.Value)
                .DefaultIfEmpty(0m)
                .Sum();
        }

        decimal score = 0m;
        var scoringMethod = template.ScoringMethod != null && template.ScoringMethod.TryGetValue("type", out var typeObj) 
            ? typeObj?.ToString() ?? "sum" 
            : "sum";
        var scoringRules = template.ScoringRules;

        // Extract question-level scoring rules
        var questionScoring = new Dictionary<string, Dictionary<string, object>>();
        if (scoringRules != null && scoringRules.TryGetValue("questions", out var questionsObj))
        {
            if (questionsObj is JsonElement questionsElement && questionsElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var qElement in questionsElement.EnumerateArray())
                {
                    if (qElement.TryGetProperty("id", out var idProp))
                    {
                        var id = idProp.GetString();
                        if (!string.IsNullOrEmpty(id))
                        {
                            var rules = new Dictionary<string, object>();
                            if (qElement.TryGetProperty("weight", out var weightProp) && weightProp.ValueKind == JsonValueKind.Number)
                            {
                                rules["weight"] = weightProp.GetDecimal();
                            }
                            if (qElement.TryGetProperty("values", out var valuesProp) && valuesProp.ValueKind == JsonValueKind.Object)
                            {
                                var values = new Dictionary<string, decimal>();
                                foreach (var prop in valuesProp.EnumerateObject())
                                {
                                    if (prop.Value.ValueKind == JsonValueKind.Number)
                                    {
                                        values[prop.Name] = prop.Value.GetDecimal();
                                    }
                                }
                                rules["values"] = values;
                            }
                            questionScoring[id] = rules;
                        }
                    }
                }
            }
        }

        // Calculate score based on method
        foreach (var answer in answers)
        {
            var questionId = answer.Key;
            var answerValue = answer.Value;
            decimal questionScore = 0m;
            decimal weight = 1m;

            // Get weight if available
            if (questionScoring.TryGetValue(questionId, out var rules))
            {
                if (rules.TryGetValue("weight", out var weightObj) && weightObj is decimal w)
                {
                    weight = w;
                }

                // Check for value-based scoring (for radio/checkbox)
                if (rules.TryGetValue("values", out var valuesObj) && valuesObj is Dictionary<string, decimal> valueMap)
                {
                    if (answerValue is JsonElement element)
                    {
                        if (element.ValueKind == JsonValueKind.String)
                        {
                            var strValue = element.GetString();
                            if (strValue != null && valueMap.TryGetValue(strValue, out var mappedScore))
                            {
                                questionScore = mappedScore;
                            }
                        }
                        else if (element.ValueKind == JsonValueKind.Array)
                        {
                            // Checkbox - sum all selected values
                            foreach (var item in element.EnumerateArray())
                            {
                                if (item.ValueKind == JsonValueKind.String)
                                {
                                    var strValue = item.GetString();
                                    if (strValue != null && valueMap.TryGetValue(strValue, out var mappedScore))
                                    {
                                        questionScore += mappedScore;
                                    }
                                }
                            }
                        }
                    }
                    else if (answerValue is string strAnswer && valueMap.TryGetValue(strAnswer, out var mappedScore))
                    {
                        questionScore = mappedScore;
                    }
                }
                else
                {
                    // Numeric scoring
                    var numericValue = TryParseDecimal(answerValue);
                    if (numericValue.HasValue)
                    {
                        questionScore = numericValue.Value;
                    }
                }
            }
            else
            {
                // No specific scoring rules - use numeric value
                var numericValue = TryParseDecimal(answerValue);
                if (numericValue.HasValue)
                {
                    questionScore = numericValue.Value;
                }
            }

            score += questionScore * weight;
        }

        // Apply scoring method
        if (scoringMethod == "average" && answers.Count > 0)
        {
            score = score / answers.Count;
        }

        return Math.Round(score, 2);
    }

    private static decimal? TryParseDecimal(object? value)
    {
        if (value == null)
        {
            return null;
        }

        if (value is JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Number:
                    return element.TryGetDecimal(out var numeric) ? numeric : null;
                case JsonValueKind.String:
                    return decimal.TryParse(element.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
                        ? parsed
                        : null;
                default:
                    return null;
            }
        }

        return decimal.TryParse(value.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var result) ? result : null;
    }

    private static string DetermineSeverity(PromTemplate? template, decimal score)
    {
        if (template == null)
        {
            return score switch
            {
                <= 5 => "low",
                <= 10 => "medium",
                _ => "high"
            };
        }

        var key = template.Key.ToLowerInvariant();
        if (key.Contains("phq"))
        {
            if (score >= 20) return "severe";
            if (score >= 15) return "moderately-severe";
            if (score >= 10) return "moderate";
            if (score >= 5) return "mild";
            return "minimal";
        }

        if (key.Contains("gad"))
        {
            if (score >= 15) return "severe";
            if (score >= 10) return "moderate";
            if (score >= 5) return "mild";
            return "minimal";
        }

        return score switch
        {
            <= 5 => "low",
            <= 10 => "medium",
            _ => "high"
        };
    }

    private static string DetermineBookingUrgency(decimal? score)
    {
        if (!score.HasValue)
        {
            return "medium";
        }

        return score.Value switch
        {
            >= 20 => "critical",
            >= 15 => "high",
            >= 10 => "medium",
            _ => "low"
        };
    }

    private static List<PromQuestionDto> BuildQuestionDtos(PromTemplate template)
    {
        var result = new List<PromQuestionDto>();

        foreach (var question in template.Questions)
        {
            var id = question.TryGetValue("id", out var idValue) && Guid.TryParse(idValue?.ToString(), out var parsedId)
                ? parsedId
                : Guid.NewGuid();

            var text = question.TryGetValue("text", out var textValue)
                ? textValue?.ToString() ?? string.Empty
                : string.Empty;

            var type = question.TryGetValue("type", out var typeValue)
                ? typeValue?.ToString() ?? "text"
                : "text";

            var required = question.TryGetValue("required", out var requiredValue) && ExtractBool(requiredValue);
            var options = question.TryGetValue("options", out var optionsValue)
                ? ExtractStringArray(optionsValue)
                : Array.Empty<string>();

            result.Add(new PromQuestionDto
            {
                Id = id,
                Text = text,
                Type = type,
                Required = required,
                Options = options
            });
        }

        return result;
    }

    private static bool ExtractBool(object? value)
    {
        if (value == null)
        {
            return false;
        }

        if (value is JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Number when element.TryGetInt32(out var numeric) => numeric != 0,
                JsonValueKind.String when bool.TryParse(element.GetString(), out var parsed) => parsed,
                _ => false
            };
        }

        return bool.TryParse(value.ToString(), out var result) && result;
    }

    private static string[] ExtractStringArray(object? value)
    {
        if (value == null)
        {
            return Array.Empty<string>();
        }

        if (value is JsonElement element && element.ValueKind == JsonValueKind.Array)
        {
            return element
                .EnumerateArray()
                .Select(e => e.ValueKind == JsonValueKind.String ? e.GetString() ?? string.Empty : e.ToString())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToArray();
        }

        if (value is IEnumerable<string> stringEnumerable)
        {
            return stringEnumerable.Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
        }

        if (value is IEnumerable<object> objectEnumerable)
        {
            return objectEnumerable.Select(o => o?.ToString() ?? string.Empty).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
        }

        return new[] { value.ToString() ?? string.Empty };
    }
}

// DTOs and models
public class SendPromRequest
{
    public Guid TemplateId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? DueDate { get; set; }
    public NotificationMethod NotificationMethod { get; set; } = NotificationMethod.Email;
    public string SentBy { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
}

public class SendBulkPromRequest
{
    public Guid TemplateId { get; set; }
    public List<Guid> PatientIds { get; set; } = new();
    public DateTime? ScheduledAt { get; set; }
    public DateTime? DueDate { get; set; }
    public NotificationMethod NotificationMethod { get; set; } = NotificationMethod.Email;
    public string SentBy { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
}

public class PromSubmissionRequest
{
    public List<PromAnswer> Answers { get; set; } = new();
    public DateTime SubmittedAt { get; set; }
    public bool RequestBooking { get; set; }
    public BookingRequest? BookingRequest { get; set; }
    public int? CompletionSeconds { get; set; }
    public string? Notes { get; set; }
}

public class PromDraftRequest
{
    public Dictionary<string, object?>? Responses { get; set; }
    public int? LastQuestionIndex { get; set; }
    public int? CompletionSeconds { get; set; }
}

public class PromAnswer
{
    public Guid QuestionId { get; set; }
    public object? Value { get; set; }
}

public class PromInstanceDto
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public double? CompletionTimeMinutes { get; set; }
    public decimal? TotalScore { get; set; }
    public int QuestionCount { get; set; }
    public int AnsweredCount { get; set; }
    public string NotificationMethod { get; set; } = string.Empty;
    public int ReminderCount { get; set; }
    public DateTime? LastReminderSentAt { get; set; }
    public IReadOnlyList<string> Tags { get; set; } = Array.Empty<string>();
    public string? Notes { get; set; }
    public bool BookingRequested { get; set; }
    public DateTime? BookingRequestedAt { get; set; }
    public Dictionary<string, object>? Answers { get; set; }
    public int? DraftLastQuestionIndex { get; set; }
    public DateTime? DraftSavedAt { get; set; }
}

public class BookingRequest
{
    public DateTime PreferredDate { get; set; }
    public DateTime? AlternativeDate { get; set; }
    public string TimePreference { get; set; } = string.Empty;
    public string? ReasonForVisit { get; set; }
    public string? Notes { get; set; }
}

public class BookingRequestDto
{
    public Guid Id { get; set; }
    public Guid PromInstanceId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime RequestedDate { get; set; }
    public DateTime? AlternativeDate { get; set; }
    public string TimePreference { get; set; } = string.Empty;
    public string ReasonForVisit { get; set; } = string.Empty;
    public string Urgency { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PromTemplateName { get; set; } = string.Empty;
    public DateTime? PromCompletedAt { get; set; }
    public decimal? PromScore { get; set; }
}

public class PromInstanceStats
{
    public int TotalSent { get; set; }
    public int Completed { get; set; }
    public int Pending { get; set; }
    public int Scheduled { get; set; }
    public int Expired { get; set; }
    public int Cancelled { get; set; }
    public double CompletionRate { get; set; }
    public double AverageCompletionTimeMinutes { get; set; }
    public double AverageScore { get; set; }
}

public class CancelPromRequest
{
    public string? Reason { get; set; }
}

public class PromPreviewDto
{
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedTimeMinutes { get; set; }
    public int QuestionCount { get; set; }
    public List<PromQuestionDto> Questions { get; set; } = new();
}

public class PromQuestionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool Required { get; set; }
    public string[]? Options { get; set; }
}

/// <summary>
/// Paginated result with DB-side calculated statistics
/// </summary>
public class PromInstancePagedResult
{
    public IReadOnlyList<PromInstanceDto> Data { get; set; } = Array.Empty<PromInstanceDto>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public PromResponseStatistics Stats { get; set; } = new();
}

/// <summary>
/// Statistics calculated at database level for efficiency
/// </summary>
public class PromResponseStatistics
{
    public int Total { get; set; }
    public int CompletedCount { get; set; }
    public int PendingCount { get; set; }
    public int InProgressCount { get; set; }
    public int ExpiredCount { get; set; }
    public int CancelledCount { get; set; }
    public double CompletionRate { get; set; }
    public double AverageScore { get; set; }
    public DateTime? NextDue { get; set; }
    public DateTime? LastCompleted { get; set; }
    public int Streak { get; set; } // Calculated client-side if needed
}

[Flags]
public enum NotificationMethod
{
    None = 0,
    Email = 1,
    Sms = 2,
    InApp = 4
}
