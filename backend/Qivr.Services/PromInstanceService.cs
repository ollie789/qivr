using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Qivr.Services;

public interface IPromInstanceService
{
    Task<PromInstanceDto> SendPromToPatientAsync(SendPromRequest request, CancellationToken ct = default);
    Task<List<PromInstanceDto>> SendPromToMultiplePatientsAsync(SendBulkPromRequest request, CancellationToken ct = default);
    Task<PromInstanceDto?> GetPromInstanceAsync(Guid instanceId, CancellationToken ct = default);
    Task<List<PromInstanceDto>> GetPatientPromInstancesAsync(Guid patientId, CancellationToken ct = default);
    Task<PromInstanceDto> SubmitPromResponseAsync(Guid instanceId, PromResponse response, CancellationToken ct = default);
    Task<bool> ReminderPromAsync(Guid instanceId, CancellationToken ct = default);
    Task<List<PromInstanceDto>> GetPendingPromsAsync(DateTime? dueBefore = null, CancellationToken ct = default);
    Task<PromInstanceStats> GetPromStatsAsync(Guid? templateId = null, DateTime? startDate = null, DateTime? endDate = null, CancellationToken ct = default);
    Task<bool> CancelPromInstanceAsync(Guid instanceId, string reason, CancellationToken ct = default);
    Task<BookingRequestDto> RequestBookingAsync(Guid instanceId, BookingRequest request, CancellationToken ct = default);
}

public class PromInstanceService : IPromInstanceService
{
    private readonly ILogger<PromInstanceService> _logger;
    private readonly INotificationService _notificationService;
    private readonly List<PromInstanceInternal> _promInstances = new();
    private readonly List<PromTemplateInternal> _promTemplates = new();

    public PromInstanceService(
        ILogger<PromInstanceService> logger,
        INotificationService notificationService)
    {
        _logger = logger;
        _notificationService = notificationService;
        
        // Initialize with some mock templates
        InitializeMockData();
    }

    public async Task<PromInstanceDto> SendPromToPatientAsync(SendPromRequest request, CancellationToken ct = default)
    {
        var template = _promTemplates.FirstOrDefault(t => t.Id == request.TemplateId);
        if (template == null)
        {
            throw new ArgumentException($"Template {request.TemplateId} not found");
        }

        var instance = new PromInstanceInternal
        {
            Id = Guid.NewGuid(),
            TemplateId = request.TemplateId,
            TemplateName = template.Name,
            PatientId = request.PatientId,
            PatientName = await GetPatientNameAsync(request.PatientId, ct),
            CreatedAt = DateTime.UtcNow,
            ScheduledAt = request.ScheduledAt ?? DateTime.UtcNow,
            DueDate = request.DueDate ?? DateTime.UtcNow.AddDays(template.DefaultDueDays),
            Status = request.ScheduledAt > DateTime.UtcNow ? PromInstanceStatus.Scheduled : PromInstanceStatus.Sent,
            NotificationMethod = request.NotificationMethod,
            Questions = template.Questions.Select(q => new PromQuestionInstance
            {
                Id = Guid.NewGuid(),
                QuestionId = q.Id,
                QuestionText = q.Text,
                QuestionType = q.Type,
                Options = q.Options,
                Required = q.Required,
                Order = q.Order
            }).ToList(),
            Metadata = new PromInstanceMetadata
            {
                Source = "Manual",
                SentBy = request.SentBy,
                Tags = request.Tags,
                Notes = request.Notes
            }
        };

        _promInstances.Add(instance);

        // Send notification if not scheduled for future
        if (instance.Status == PromInstanceStatus.Sent)
        {
            await SendPromNotificationAsync(instance, ct);
        }

        _logger.LogInformation("PROM instance {InstanceId} created for patient {PatientId}", 
            instance.Id, instance.PatientId);

        return MapToDto(instance);
    }

    public async Task<List<PromInstanceDto>> SendPromToMultiplePatientsAsync(
        SendBulkPromRequest request,
        CancellationToken ct = default)
    {
        var results = new List<PromInstanceDto>();
        
        foreach (var patientId in request.PatientIds)
        {
            try
            {
                var sendRequest = new SendPromRequest
                {
                    TemplateId = request.TemplateId,
                    PatientId = patientId,
                    ScheduledAt = request.ScheduledAt,
                    DueDate = request.DueDate,
                    NotificationMethod = request.NotificationMethod,
                    SentBy = request.SentBy,
                    Tags = request.Tags,
                    Notes = request.Notes
                };
                
                var instance = await SendPromToPatientAsync(sendRequest, ct);
                results.Add(instance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send PROM to patient {PatientId}", patientId);
            }
        }

        _logger.LogInformation("Sent PROM to {SuccessCount}/{TotalCount} patients", 
            results.Count, request.PatientIds.Count);

        return results;
    }

    public Task<PromInstanceDto?> GetPromInstanceAsync(Guid instanceId, CancellationToken ct = default)
    {
        var instance = _promInstances.FirstOrDefault(i => i.Id == instanceId);
        return Task.FromResult(instance != null ? MapToDto(instance) : null);
    }

    public Task<List<PromInstanceDto>> GetPatientPromInstancesAsync(Guid patientId, CancellationToken ct = default)
    {
        var instances = _promInstances
            .Where(i => i.PatientId == patientId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(MapToDto)
            .ToList();

        return Task.FromResult(instances);
    }

    public async Task<PromInstanceDto> SubmitPromResponseAsync(
        Guid instanceId,
        PromResponse response,
        CancellationToken ct = default)
    {
        var instance = _promInstances.FirstOrDefault(i => i.Id == instanceId);
        if (instance == null)
        {
            throw new ArgumentException($"PROM instance {instanceId} not found");
        }

        if (instance.Status == PromInstanceStatus.Completed)
        {
            throw new InvalidOperationException("PROM has already been completed");
        }

        // Store responses
        foreach (var answer in response.Answers)
        {
            var question = instance.Questions.FirstOrDefault(q => q.QuestionId == answer.QuestionId);
            if (question != null)
            {
                question.Answer = answer.Value;
                question.AnsweredAt = DateTime.UtcNow;
            }
        }

        instance.Status = PromInstanceStatus.Completed;
        instance.CompletedAt = DateTime.UtcNow;
        instance.CompletionTimeMinutes = (int)(DateTime.UtcNow - instance.CreatedAt).TotalMinutes;

        // Calculate scores if applicable
        instance.TotalScore = CalculateTotalScore(instance);

        _logger.LogInformation("PROM instance {InstanceId} completed by patient {PatientId}", 
            instanceId, instance.PatientId);

        await Task.Delay(1, ct); // Simulate async operation

        return MapToDto(instance);
    }

    public async Task<bool> ReminderPromAsync(Guid instanceId, CancellationToken ct = default)
    {
        var instance = _promInstances.FirstOrDefault(i => i.Id == instanceId);
        if (instance == null || instance.Status != PromInstanceStatus.Sent)
        {
            return false;
        }

        await _notificationService.SendPromReminderAsync(
            instance.PatientId,
            instance.Id,
            instance.TemplateName,
            instance.DueDate,
            ct);

        instance.LastReminderSentAt = DateTime.UtcNow;
        instance.ReminderCount++;

        _logger.LogInformation("Reminder sent for PROM instance {InstanceId}", instanceId);

        return true;
    }

    public Task<List<PromInstanceDto>> GetPendingPromsAsync(
        DateTime? dueBefore = null,
        CancellationToken ct = default)
    {
        var query = _promInstances.Where(i => 
            i.Status == PromInstanceStatus.Sent || 
            i.Status == PromInstanceStatus.Scheduled);

        if (dueBefore.HasValue)
        {
            query = query.Where(i => i.DueDate <= dueBefore.Value);
        }

        var results = query
            .OrderBy(i => i.DueDate)
            .Select(MapToDto)
            .ToList();

        return Task.FromResult(results);
    }

    public Task<PromInstanceStats> GetPromStatsAsync(
        Guid? templateId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken ct = default)
    {
        var query = _promInstances.AsEnumerable();

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

        var instances = query.ToList();

        var stats = new PromInstanceStats
        {
            TotalSent = instances.Count,
            Completed = instances.Count(i => i.Status == PromInstanceStatus.Completed),
            Pending = instances.Count(i => i.Status == PromInstanceStatus.Sent),
            Scheduled = instances.Count(i => i.Status == PromInstanceStatus.Scheduled),
            Expired = instances.Count(i => i.Status == PromInstanceStatus.Expired),
            CompletionRate = instances.Any() ? 
                (double)instances.Count(i => i.Status == PromInstanceStatus.Completed) / instances.Count * 100 : 0,
            AverageCompletionTimeMinutes = instances
                .Where(i => i.CompletionTimeMinutes.HasValue)
                .Select(i => i.CompletionTimeMinutes!.Value)
                .DefaultIfEmpty(0)
                .Average(),
            AverageScore = instances
                .Where(i => i.TotalScore.HasValue)
                .Select(i => i.TotalScore!.Value)
                .DefaultIfEmpty(0)
                .Average()
        };

        return Task.FromResult(stats);
    }

    public Task<bool> CancelPromInstanceAsync(Guid instanceId, string reason, CancellationToken ct = default)
    {
        var instance = _promInstances.FirstOrDefault(i => i.Id == instanceId);
        if (instance == null)
        {
            return Task.FromResult(false);
        }

        if (instance.Status == PromInstanceStatus.Completed)
        {
            throw new InvalidOperationException("Cannot cancel a completed PROM");
        }

        instance.Status = PromInstanceStatus.Cancelled;
        instance.CancelledAt = DateTime.UtcNow;
        instance.CancellationReason = reason;

        _logger.LogInformation("PROM instance {InstanceId} cancelled. Reason: {Reason}", 
            instanceId, reason);

        return Task.FromResult(true);
    }

    public async Task<BookingRequestDto> RequestBookingAsync(
        Guid instanceId, 
        BookingRequest request, 
        CancellationToken ct = default)
    {
        var instance = _promInstances.FirstOrDefault(i => i.Id == instanceId);
        if (instance == null)
        {
            throw new ArgumentException($"PROM instance {instanceId} not found");
        }

        // Create booking request
        var bookingRequest = new BookingRequestDto
        {
            Id = Guid.NewGuid(),
            PromInstanceId = instanceId,
            PatientId = instance.PatientId,
            PatientName = instance.PatientName,
            RequestedDate = request.PreferredDate,
            AlternativeDate = request.AlternativeDate,
            TimePreference = request.TimePreference,
            ReasonForVisit = request.ReasonForVisit ?? $"Follow-up for {instance.TemplateName}",
            Urgency = DetermineUrgency(instance),
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            Status = "Pending",
            PromTemplateName = instance.TemplateName,
            PromCompletedAt = instance.CompletedAt,
            PromScore = instance.TotalScore
        };

        // Add to intake queue
        await AddBookingToIntakeQueueAsync(bookingRequest, ct);

        // Mark that booking was requested from this PROM
        instance.BookingRequested = true;
        instance.BookingRequestedAt = DateTime.UtcNow;

        _logger.LogInformation(
            "Booking requested from PROM {InstanceId} for patient {PatientId}",
            instanceId, instance.PatientId);

        return bookingRequest;
    }

    private string DetermineUrgency(PromInstanceInternal instance)
    {
        // Determine urgency based on PROM score
        if (!instance.TotalScore.HasValue) return "medium";
        
        // For PHQ-9 (depression scale)
        if (instance.TemplateName.Contains("PHQ-9"))
        {
            if (instance.TotalScore >= 20) return "critical"; // Severe depression
            if (instance.TotalScore >= 15) return "high";     // Moderately severe
            if (instance.TotalScore >= 10) return "medium";   // Moderate
            return "low";
        }
        
        // For GAD-7 (anxiety scale)
        if (instance.TemplateName.Contains("GAD-7"))
        {
            if (instance.TotalScore >= 15) return "high";   // Severe anxiety
            if (instance.TotalScore >= 10) return "medium"; // Moderate anxiety
            return "low";
        }
        
        // For pain assessment
        if (instance.TemplateName.Contains("Pain"))
        {
            if (instance.TotalScore >= 7) return "high";
            if (instance.TotalScore >= 4) return "medium";
            return "low";
        }
        
        return "medium";
    }

    private async Task AddBookingToIntakeQueueAsync(BookingRequestDto booking, CancellationToken ct)
    {
        // This would integrate with the intake service
        // For now, we'll simulate it
        await Task.Delay(100, ct);
        
        _logger.LogInformation(
            "Booking request {BookingId} added to intake queue with urgency: {Urgency}",
            booking.Id, booking.Urgency);
    }

    private async Task SendPromNotificationAsync(PromInstanceInternal instance, CancellationToken ct)
    {
        var portalUrl = $"https://portal.qivr.com/prom/{instance.Id}";
        var subject = $"New Health Assessment: {instance.TemplateName}";
        var htmlContent = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>New Health Assessment Available</h2>
                <p>Dear {instance.PatientName},</p>
                <p>You have a new health assessment to complete: <strong>{instance.TemplateName}</strong></p>
                <p>This assessment will help us better understand your health status and provide you with the best care.</p>
                <div style='margin: 30px 0;'>
                    <a href='{portalUrl}' 
                       style='background-color: #4CAF50; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;'>
                        Start Assessment
                    </a>
                </div>
                <p>The assessment should take approximately {instance.Questions.Count * 30 / 60} minutes to complete.</p>
                <p>Please complete by: <strong>{instance.DueDate:MMMM d, yyyy}</strong></p>
                <p>If you have any questions, please contact your healthcare provider.</p>
            </body>
            </html>";

        if (instance.NotificationMethod.HasFlag(NotificationMethod.Email))
        {
            // In real implementation, get patient email from database
            await _notificationService.SendEmailAsync(
                "patient@example.com",
                subject,
                htmlContent,
                ct: ct);
        }

        if (instance.NotificationMethod.HasFlag(NotificationMethod.Sms))
        {
            var smsMessage = $"New health assessment: {instance.TemplateName}. " +
                           $"Complete by {instance.DueDate:MMM d}. " +
                           $"Start here: https://qivr.link/p/{instance.Id}";
            
            // In real implementation, get patient phone from database
            await _notificationService.SendSmsAsync("+1234567890", smsMessage, ct);
        }
    }

    private async Task<string> GetPatientNameAsync(Guid patientId, CancellationToken ct)
    {
        // In real implementation, query database for patient name
        await Task.Delay(1, ct);
        return $"Patient {patientId.ToString().Substring(0, 8)}";
    }

    private double? CalculateTotalScore(PromInstanceInternal instance)
    {
        var numericAnswers = instance.Questions
            .Where(q => q.Answer != null && double.TryParse(q.Answer.ToString(), out _))
            .Select(q => double.Parse(q.Answer!.ToString()!))
            .ToList();

        return numericAnswers.Any() ? numericAnswers.Sum() : null;
    }

    private PromInstanceDto MapToDto(PromInstanceInternal instance)
    {
        return new PromInstanceDto
        {
            Id = instance.Id,
            TemplateId = instance.TemplateId,
            TemplateName = instance.TemplateName,
            PatientId = instance.PatientId,
            PatientName = instance.PatientName,
            Status = instance.Status.ToString(),
            CreatedAt = instance.CreatedAt,
            ScheduledAt = instance.ScheduledAt,
            DueDate = instance.DueDate,
            CompletedAt = instance.CompletedAt,
            CompletionTimeMinutes = instance.CompletionTimeMinutes,
            TotalScore = instance.TotalScore,
            QuestionCount = instance.Questions.Count,
            AnsweredCount = instance.Questions.Count(q => q.Answer != null),
            NotificationMethod = instance.NotificationMethod.ToString(),
            ReminderCount = instance.ReminderCount,
            LastReminderSentAt = instance.LastReminderSentAt,
            Tags = instance.Metadata?.Tags,
            Notes = instance.Metadata?.Notes,
            BookingRequested = instance.BookingRequested,
            BookingRequestedAt = instance.BookingRequestedAt
        };
    }

    private void InitializeMockData()
    {
        // Add some mock templates
        _promTemplates.AddRange(new[]
        {
            new PromTemplateInternal
            {
                Id = Guid.NewGuid(),
                Name = "PHQ-9 Depression Scale",
                Description = "Patient Health Questionnaire for Depression",
                DefaultDueDays = 7,
                Questions = GeneratePHQ9Questions()
            },
            new PromTemplateInternal
            {
                Id = Guid.NewGuid(),
                Name = "GAD-7 Anxiety Scale",
                Description = "Generalized Anxiety Disorder 7-item scale",
                DefaultDueDays = 7,
                Questions = GenerateGAD7Questions()
            },
            new PromTemplateInternal
            {
                Id = Guid.NewGuid(),
                Name = "Pain Assessment",
                Description = "Comprehensive pain assessment questionnaire",
                DefaultDueDays = 3,
                Questions = GeneratePainAssessmentQuestions()
            }
        });
    }

    private List<PromQuestion> GeneratePHQ9Questions()
    {
        var questions = new List<PromQuestion>();
        var prompts = new[]
        {
            "Little interest or pleasure in doing things",
            "Feeling down, depressed, or hopeless",
            "Trouble falling or staying asleep, or sleeping too much",
            "Feeling tired or having little energy",
            "Poor appetite or overeating",
            "Feeling bad about yourself",
            "Trouble concentrating on things",
            "Moving or speaking slowly or being fidgety",
            "Thoughts of self-harm"
        };

        for (int i = 0; i < prompts.Length; i++)
        {
            questions.Add(new PromQuestion
            {
                Id = Guid.NewGuid(),
                Text = prompts[i],
                Type = "scale",
                Required = true,
                Order = i + 1,
                Options = new[] { "0 - Not at all", "1 - Several days", "2 - More than half the days", "3 - Nearly every day" }
            });
        }

        return questions;
    }

    private List<PromQuestion> GenerateGAD7Questions()
    {
        var questions = new List<PromQuestion>();
        var prompts = new[]
        {
            "Feeling nervous, anxious, or on edge",
            "Not being able to stop or control worrying",
            "Worrying too much about different things",
            "Trouble relaxing",
            "Being so restless that it's hard to sit still",
            "Becoming easily annoyed or irritable",
            "Feeling afraid as if something awful might happen"
        };

        for (int i = 0; i < prompts.Length; i++)
        {
            questions.Add(new PromQuestion
            {
                Id = Guid.NewGuid(),
                Text = prompts[i],
                Type = "scale",
                Required = true,
                Order = i + 1,
                Options = new[] { "0 - Not at all", "1 - Several days", "2 - More than half the days", "3 - Nearly every day" }
            });
        }

        return questions;
    }

    private List<PromQuestion> GeneratePainAssessmentQuestions()
    {
        return new List<PromQuestion>
        {
            new PromQuestion
            {
                Id = Guid.NewGuid(),
                Text = "Rate your current pain level",
                Type = "scale",
                Required = true,
                Order = 1,
                Options = Enumerable.Range(0, 11).Select(i => i.ToString()).ToArray()
            },
            new PromQuestion
            {
                Id = Guid.NewGuid(),
                Text = "Where is your pain located?",
                Type = "text",
                Required = true,
                Order = 2
            },
            new PromQuestion
            {
                Id = Guid.NewGuid(),
                Text = "How would you describe your pain?",
                Type = "multiple-choice",
                Required = true,
                Order = 3,
                Options = new[] { "Sharp", "Dull", "Burning", "Throbbing", "Aching", "Other" }
            },
            new PromQuestion
            {
                Id = Guid.NewGuid(),
                Text = "How long have you been experiencing this pain?",
                Type = "single-choice",
                Required = true,
                Order = 4,
                Options = new[] { "Less than 1 week", "1-4 weeks", "1-3 months", "More than 3 months" }
            }
        };
    }
}

// DTOs and Models
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

public class PromResponse
{
    public List<PromAnswer> Answers { get; set; } = new();
    public DateTime SubmittedAt { get; set; }
    public bool RequestBooking { get; set; }
    public BookingRequest? BookingRequest { get; set; }
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
    public int? CompletionTimeMinutes { get; set; }
    public double? TotalScore { get; set; }
    public int QuestionCount { get; set; }
    public int AnsweredCount { get; set; }
    public string NotificationMethod { get; set; } = string.Empty;
    public int ReminderCount { get; set; }
    public DateTime? LastReminderSentAt { get; set; }
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
    public bool BookingRequested { get; set; }
    public DateTime? BookingRequestedAt { get; set; }
}

public class BookingRequest
{
    public DateTime PreferredDate { get; set; }
    public DateTime? AlternativeDate { get; set; }
    public string TimePreference { get; set; } = string.Empty; // morning, afternoon, evening
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
    public double? PromScore { get; set; }
}

public class PromInstanceStats
{
    public int TotalSent { get; set; }
    public int Completed { get; set; }
    public int Pending { get; set; }
    public int Scheduled { get; set; }
    public int Expired { get; set; }
    public double CompletionRate { get; set; }
    public double AverageCompletionTimeMinutes { get; set; }
    public double AverageScore { get; set; }
}

// Internal models
internal class PromInstanceInternal
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public PromInstanceStatus Status { get; set; }
    public NotificationMethod NotificationMethod { get; set; }
    public List<PromQuestionInstance> Questions { get; set; } = new();
    public int? CompletionTimeMinutes { get; set; }
    public double? TotalScore { get; set; }
    public int ReminderCount { get; set; }
    public DateTime? LastReminderSentAt { get; set; }
    public PromInstanceMetadata? Metadata { get; set; }
    public bool BookingRequested { get; set; }
    public DateTime? BookingRequestedAt { get; set; }
}

internal class PromQuestionInstance
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string[]? Options { get; set; }
    public bool Required { get; set; }
    public int Order { get; set; }
    public object? Answer { get; set; }
    public DateTime? AnsweredAt { get; set; }
}

internal class PromInstanceMetadata
{
    public string Source { get; set; } = string.Empty;
    public string SentBy { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    public string? Notes { get; set; }
}

internal class PromTemplateInternal
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DefaultDueDays { get; set; }
    public List<PromQuestion> Questions { get; set; } = new();
}

internal class PromQuestion
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool Required { get; set; }
    public int Order { get; set; }
    public string[]? Options { get; set; }
}

internal enum PromInstanceStatus
{
    Scheduled,
    Sent,
    Completed,
    Expired,
    Cancelled
}

[Flags]
public enum NotificationMethod
{
    None = 0,
    Email = 1,
    Sms = 2,
    InApp = 4
}
