using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IReferralService
{
    Task<Referral> CreateReferralAsync(CreateReferralRequest request, Guid providerId, Guid tenantId, CancellationToken cancellationToken = default);
    Task<Referral?> GetReferralAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<Referral>> GetReferralsForPatientAsync(Guid patientId, Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<Referral>> GetReferralsByProviderAsync(Guid providerId, Guid tenantId, ReferralStatus? status = null, CancellationToken cancellationToken = default);
    Task<List<Referral>> GetAllReferralsAsync(Guid tenantId, ReferralFilterRequest? filter = null, CancellationToken cancellationToken = default);
    Task<Referral> UpdateReferralStatusAsync(Guid id, ReferralStatus status, Guid tenantId, string? notes = null, CancellationToken cancellationToken = default);
    Task<Referral> UpdateReferralAsync(Guid id, UpdateReferralRequest request, Guid tenantId, CancellationToken cancellationToken = default);
    Task<Referral> SendReferralAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
    Task<Referral> CancelReferralAsync(Guid id, Guid userId, Guid tenantId, string reason, CancellationToken cancellationToken = default);
    Task<Referral> AttachDocumentAsync(Guid referralId, Guid documentId, bool isResponse, Guid tenantId, CancellationToken cancellationToken = default);
    Task<ReferralStats> GetReferralStatsAsync(Guid tenantId, Guid? providerId = null, CancellationToken cancellationToken = default);
}

public class ReferralService : IReferralService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<ReferralService> _logger;
    private readonly IMessagingService _messagingService;

    public ReferralService(
        QivrDbContext context,
        ILogger<ReferralService> logger,
        IMessagingService messagingService)
    {
        _context = context;
        _logger = logger;
        _messagingService = messagingService;
    }

    public async Task<Referral> CreateReferralAsync(CreateReferralRequest request, Guid providerId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var referral = new Referral
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = request.PatientId,
            ReferringProviderId = providerId,
            Type = request.Type,
            Specialty = request.Specialty,
            SpecificService = request.SpecificService,
            Priority = request.Priority,
            Status = ReferralStatus.Draft,
            ExternalProviderName = request.ExternalProviderName,
            ExternalProviderPhone = request.ExternalProviderPhone,
            ExternalProviderEmail = request.ExternalProviderEmail,
            ExternalProviderAddress = request.ExternalProviderAddress,
            ExternalProviderFax = request.ExternalProviderFax,
            ReasonForReferral = request.ReasonForReferral,
            ClinicalHistory = request.ClinicalHistory,
            CurrentMedications = request.CurrentMedications,
            Allergies = request.Allergies,
            RelevantTestResults = request.RelevantTestResults,
            SpecificQuestions = request.SpecificQuestions,
            ReferralDate = DateTime.UtcNow,
            ExpiryDate = request.ExpiryDate ?? DateTime.UtcNow.AddMonths(3),
            InternalNotes = request.InternalNotes,
            RequiresFollowUp = request.RequiresFollowUp,
            FollowUpDate = request.FollowUpDate,
            ReferralDocumentId = request.ReferralDocumentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Referrals.Add(referral);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created referral {ReferralId} for patient {PatientId} to {Specialty}",
            referral.Id, referral.PatientId, referral.Specialty);

        return referral;
    }

    public async Task<Referral?> GetReferralAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Referrals
            .Include(r => r.Patient)
            .Include(r => r.ReferringProvider)
            .Include(r => r.ReferralDocument)
            .Include(r => r.ResponseDocument)
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.DeletedAt == null, cancellationToken);
    }

    public async Task<List<Referral>> GetReferralsForPatientAsync(Guid patientId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Referrals
            .Include(r => r.ReferringProvider)
            .Include(r => r.ReferralDocument)
            .Where(r => r.PatientId == patientId && r.TenantId == tenantId && r.DeletedAt == null)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Referral>> GetReferralsByProviderAsync(Guid providerId, Guid tenantId, ReferralStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Referrals
            .Include(r => r.Patient)
            .Include(r => r.ReferralDocument)
            .Where(r => r.ReferringProviderId == providerId && r.TenantId == tenantId && r.DeletedAt == null);

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        return await query.OrderByDescending(r => r.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task<List<Referral>> GetAllReferralsAsync(Guid tenantId, ReferralFilterRequest? filter = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Referrals
            .Include(r => r.Patient)
            .Include(r => r.ReferringProvider)
            .Include(r => r.ReferralDocument)
            .Where(r => r.TenantId == tenantId && r.DeletedAt == null);

        if (filter != null)
        {
            if (filter.PatientId.HasValue)
                query = query.Where(r => r.PatientId == filter.PatientId.Value);

            if (filter.ProviderId.HasValue)
                query = query.Where(r => r.ReferringProviderId == filter.ProviderId.Value);

            if (filter.Status.HasValue)
                query = query.Where(r => r.Status == filter.Status.Value);

            if (filter.Type.HasValue)
                query = query.Where(r => r.Type == filter.Type.Value);

            if (filter.Priority.HasValue)
                query = query.Where(r => r.Priority == filter.Priority.Value);

            if (!string.IsNullOrEmpty(filter.Specialty))
                query = query.Where(r => r.Specialty.ToLower().Contains(filter.Specialty.ToLower()));

            if (filter.FromDate.HasValue)
                query = query.Where(r => r.ReferralDate >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(r => r.ReferralDate <= filter.ToDate.Value);
        }

        return await query.OrderByDescending(r => r.CreatedAt).Take(100).ToListAsync(cancellationToken);
    }

    public async Task<Referral> UpdateReferralStatusAsync(Guid id, ReferralStatus status, Guid tenantId, string? notes = null, CancellationToken cancellationToken = default)
    {
        var referral = await _context.Referrals
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.DeletedAt == null, cancellationToken)
            ?? throw new KeyNotFoundException($"Referral {id} not found");

        var previousStatus = referral.Status;
        referral.Status = status;
        referral.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(notes))
        {
            referral.InternalNotes = string.IsNullOrEmpty(referral.InternalNotes)
                ? notes
                : $"{referral.InternalNotes}\n\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {notes}";
        }

        // Update status-specific timestamps
        switch (status)
        {
            case ReferralStatus.Sent:
                referral.SentAt = DateTime.UtcNow;
                break;
            case ReferralStatus.Acknowledged:
                referral.AcknowledgedAt = DateTime.UtcNow;
                break;
            case ReferralStatus.Scheduled:
                referral.ScheduledAt = DateTime.UtcNow;
                break;
            case ReferralStatus.Completed:
            case ReferralStatus.ResultsReceived:
            case ReferralStatus.Closed:
                referral.CompletedAt ??= DateTime.UtcNow;
                break;
            case ReferralStatus.Cancelled:
                referral.CancelledAt = DateTime.UtcNow;
                break;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated referral {ReferralId} status from {PreviousStatus} to {NewStatus}",
            id, previousStatus, status);

        return referral;
    }

    public async Task<Referral> UpdateReferralAsync(Guid id, UpdateReferralRequest request, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var referral = await _context.Referrals
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.DeletedAt == null, cancellationToken)
            ?? throw new KeyNotFoundException($"Referral {id} not found");

        if (request.Specialty != null) referral.Specialty = request.Specialty;
        if (request.SpecificService != null) referral.SpecificService = request.SpecificService;
        if (request.Priority.HasValue) referral.Priority = request.Priority.Value;
        if (request.ExternalProviderName != null) referral.ExternalProviderName = request.ExternalProviderName;
        if (request.ExternalProviderPhone != null) referral.ExternalProviderPhone = request.ExternalProviderPhone;
        if (request.ExternalProviderEmail != null) referral.ExternalProviderEmail = request.ExternalProviderEmail;
        if (request.ExternalProviderAddress != null) referral.ExternalProviderAddress = request.ExternalProviderAddress;
        if (request.ReasonForReferral != null) referral.ReasonForReferral = request.ReasonForReferral;
        if (request.ClinicalHistory != null) referral.ClinicalHistory = request.ClinicalHistory;
        if (request.SpecificQuestions != null) referral.SpecificQuestions = request.SpecificQuestions;
        if (request.ResponseNotes != null) referral.ResponseNotes = request.ResponseNotes;
        if (request.AppointmentDate.HasValue) referral.AppointmentDate = request.AppointmentDate;
        if (request.AppointmentLocation != null) referral.AppointmentLocation = request.AppointmentLocation;
        if (request.ExpiryDate.HasValue) referral.ExpiryDate = request.ExpiryDate;
        if (request.RequiresFollowUp.HasValue) referral.RequiresFollowUp = request.RequiresFollowUp.Value;
        if (request.FollowUpDate.HasValue) referral.FollowUpDate = request.FollowUpDate;

        referral.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return referral;
    }

    public async Task<Referral> SendReferralAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var referral = await _context.Referrals
            .Include(r => r.Patient)
            .Include(r => r.ReferringProvider)
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.DeletedAt == null, cancellationToken)
            ?? throw new KeyNotFoundException($"Referral {id} not found");

        referral.Status = ReferralStatus.Sent;
        referral.SentAt = DateTime.UtcNow;
        referral.UpdatedAt = DateTime.UtcNow;

        // Notify patient about the referral
        if (referral.Patient != null && referral.ReferringProvider != null)
        {
            try
            {
                var messageContent = $"A referral has been created for you to {referral.Specialty}" +
                             (string.IsNullOrEmpty(referral.ExternalProviderName) ? "" : $" at {referral.ExternalProviderName}") +
                             $". Reason: {referral.ReasonForReferral ?? "See attached referral document"}. " +
                             "Please contact the specialist to schedule your appointment.";

                await _messagingService.SendMessageAsync(
                    tenantId,
                    referral.ReferringProviderId,
                    new SendMessageDto
                    {
                        RecipientId = referral.PatientId,
                        Content = messageContent,
                        MessageType = "Medical",
                        Priority = "Normal"
                    });

                referral.PatientNotified = true;
                referral.PatientNotifiedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send referral notification to patient {PatientId}", referral.PatientId);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Sent referral {ReferralId} for patient {PatientId} to {Specialty}",
            referral.Id, referral.PatientId, referral.Specialty);

        return referral;
    }

    public async Task<Referral> CancelReferralAsync(Guid id, Guid userId, Guid tenantId, string reason, CancellationToken cancellationToken = default)
    {
        var referral = await _context.Referrals
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && r.DeletedAt == null, cancellationToken)
            ?? throw new KeyNotFoundException($"Referral {id} not found");

        referral.Status = ReferralStatus.Cancelled;
        referral.CancelledAt = DateTime.UtcNow;
        referral.CancelledBy = userId;
        referral.CancellationReason = reason;
        referral.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cancelled referral {ReferralId} by user {UserId}. Reason: {Reason}",
            id, userId, reason);

        return referral;
    }

    public async Task<Referral> AttachDocumentAsync(Guid referralId, Guid documentId, bool isResponse, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var referral = await _context.Referrals
            .FirstOrDefaultAsync(r => r.Id == referralId && r.TenantId == tenantId && r.DeletedAt == null, cancellationToken)
            ?? throw new KeyNotFoundException($"Referral {referralId} not found");

        if (isResponse)
        {
            referral.ResponseDocumentId = documentId;
            if (referral.Status == ReferralStatus.Completed || referral.Status == ReferralStatus.Scheduled)
            {
                referral.Status = ReferralStatus.ResultsReceived;
            }
        }
        else
        {
            referral.ReferralDocumentId = documentId;
        }

        referral.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return referral;
    }

    public async Task<ReferralStats> GetReferralStatsAsync(Guid tenantId, Guid? providerId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Referrals.Where(r => r.TenantId == tenantId && r.DeletedAt == null);

        if (providerId.HasValue)
        {
            query = query.Where(r => r.ReferringProviderId == providerId.Value);
        }

        var referrals = await query.ToListAsync(cancellationToken);

        return new ReferralStats
        {
            Total = referrals.Count,
            Draft = referrals.Count(r => r.Status == ReferralStatus.Draft),
            Sent = referrals.Count(r => r.Status == ReferralStatus.Sent),
            Acknowledged = referrals.Count(r => r.Status == ReferralStatus.Acknowledged),
            Scheduled = referrals.Count(r => r.Status == ReferralStatus.Scheduled),
            Completed = referrals.Count(r => r.Status == ReferralStatus.Completed || r.Status == ReferralStatus.ResultsReceived || r.Status == ReferralStatus.Closed),
            Cancelled = referrals.Count(r => r.Status == ReferralStatus.Cancelled),
            Expired = referrals.Count(r => r.Status == ReferralStatus.Expired),
            Pending = referrals.Count(r => r.Status == ReferralStatus.Sent || r.Status == ReferralStatus.Acknowledged || r.Status == ReferralStatus.PendingApproval),
            RequiringFollowUp = referrals.Count(r => r.RequiresFollowUp && r.FollowUpDate <= DateTime.UtcNow.AddDays(7)),
            ByType = referrals.GroupBy(r => r.Type).ToDictionary(g => g.Key.ToString(), g => g.Count()),
            BySpecialty = referrals.GroupBy(r => r.Specialty).ToDictionary(g => g.Key, g => g.Count())
        };
    }
}

// Request/Response DTOs
public record CreateReferralRequest
{
    public Guid PatientId { get; init; }
    public ReferralType Type { get; init; } = ReferralType.Specialist;
    public string Specialty { get; init; } = string.Empty;
    public string? SpecificService { get; init; }
    public ReferralPriority Priority { get; init; } = ReferralPriority.Routine;
    public string? ExternalProviderName { get; init; }
    public string? ExternalProviderPhone { get; init; }
    public string? ExternalProviderEmail { get; init; }
    public string? ExternalProviderAddress { get; init; }
    public string? ExternalProviderFax { get; init; }
    public string? ReasonForReferral { get; init; }
    public string? ClinicalHistory { get; init; }
    public string? CurrentMedications { get; init; }
    public string? Allergies { get; init; }
    public string? RelevantTestResults { get; init; }
    public string? SpecificQuestions { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public string? InternalNotes { get; init; }
    public bool RequiresFollowUp { get; init; }
    public DateTime? FollowUpDate { get; init; }
    public Guid? ReferralDocumentId { get; init; }
}

public record UpdateReferralRequest
{
    public string? Specialty { get; init; }
    public string? SpecificService { get; init; }
    public ReferralPriority? Priority { get; init; }
    public string? ExternalProviderName { get; init; }
    public string? ExternalProviderPhone { get; init; }
    public string? ExternalProviderEmail { get; init; }
    public string? ExternalProviderAddress { get; init; }
    public string? ReasonForReferral { get; init; }
    public string? ClinicalHistory { get; init; }
    public string? SpecificQuestions { get; init; }
    public string? ResponseNotes { get; init; }
    public DateTime? AppointmentDate { get; init; }
    public string? AppointmentLocation { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public bool? RequiresFollowUp { get; init; }
    public DateTime? FollowUpDate { get; init; }
}

public record ReferralFilterRequest
{
    public Guid? PatientId { get; init; }
    public Guid? ProviderId { get; init; }
    public ReferralStatus? Status { get; init; }
    public ReferralType? Type { get; init; }
    public ReferralPriority? Priority { get; init; }
    public string? Specialty { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
}

public record ReferralStats
{
    public int Total { get; init; }
    public int Draft { get; init; }
    public int Sent { get; init; }
    public int Acknowledged { get; init; }
    public int Scheduled { get; init; }
    public int Completed { get; init; }
    public int Cancelled { get; init; }
    public int Expired { get; init; }
    public int Pending { get; init; }
    public int RequiringFollowUp { get; init; }
    public Dictionary<string, int> ByType { get; init; } = new();
    public Dictionary<string, int> BySpecialty { get; init; } = new();
}
