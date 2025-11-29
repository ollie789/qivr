using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.Entities;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/referrals")]
[Authorize]
public class ReferralsController : BaseApiController
{
    private readonly IReferralService _referralService;
    private readonly ILogger<ReferralsController> _logger;

    public ReferralsController(
        IReferralService referralService,
        ILogger<ReferralsController> logger)
    {
        _referralService = referralService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new referral
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateReferralRequest request, CancellationToken cancellationToken)
    {
        if (request.PatientId == Guid.Empty)
            return BadRequest("Patient ID is required");

        if (string.IsNullOrEmpty(request.Specialty))
            return BadRequest("Specialty is required");

        var tenantId = RequireTenantId();
        var referral = await _referralService.CreateReferralAsync(request, CurrentUserId, tenantId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = referral.Id }, MapToDto(referral));
    }

    /// <summary>
    /// Get all referrals with optional filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ReferralDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? patientId,
        [FromQuery] Guid? providerId,
        [FromQuery] ReferralStatus? status,
        [FromQuery] ReferralType? type,
        [FromQuery] ReferralPriority? priority,
        [FromQuery] string? specialty,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var filter = new ReferralFilterRequest
        {
            PatientId = patientId,
            ProviderId = providerId,
            Status = status,
            Type = type,
            Priority = priority,
            Specialty = specialty,
            FromDate = fromDate,
            ToDate = toDate
        };

        var tenantId = RequireTenantId();
        var referrals = await _referralService.GetAllReferralsAsync(tenantId, filter, cancellationToken);
        return Ok(referrals.Select(MapToDto));
    }

    /// <summary>
    /// Get referrals for a specific patient
    /// </summary>
    [HttpGet("patient/{patientId}")]
    [ProducesResponseType(typeof(List<ReferralDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByPatient(Guid patientId, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var referrals = await _referralService.GetReferralsForPatientAsync(patientId, tenantId, cancellationToken);
        return Ok(referrals.Select(MapToDto));
    }

    /// <summary>
    /// Get my referrals (for patient portal)
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(List<ReferralDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyReferrals(CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var referrals = await _referralService.GetReferralsForPatientAsync(CurrentUserId, tenantId, cancellationToken);
        return Ok(referrals.Select(MapToDto));
    }

    /// <summary>
    /// Get a single referral by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var referral = await _referralService.GetReferralAsync(id, tenantId, cancellationToken);
        if (referral == null)
            return NotFound();

        return Ok(MapToDto(referral));
    }

    /// <summary>
    /// Update a referral
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReferralRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = RequireTenantId();
            var referral = await _referralService.UpdateReferralAsync(id, request, tenantId, cancellationToken);
            return Ok(MapToDto(referral));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Update referral status
    /// </summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateReferralStatusRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = RequireTenantId();
            var referral = await _referralService.UpdateReferralStatusAsync(id, request.Status, tenantId, request.Notes, cancellationToken);
            return Ok(MapToDto(referral));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Send a referral (marks as sent and notifies patient)
    /// </summary>
    [HttpPost("{id}/send")]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Send(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = RequireTenantId();
            var referral = await _referralService.SendReferralAsync(id, tenantId, cancellationToken);
            return Ok(MapToDto(referral));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Cancel a referral
    /// </summary>
    [HttpPost("{id}/cancel")]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelReferralRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = RequireTenantId();
            var referral = await _referralService.CancelReferralAsync(id, CurrentUserId, tenantId, request.Reason, cancellationToken);
            return Ok(MapToDto(referral));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Attach a document to a referral
    /// </summary>
    [HttpPost("{id}/documents")]
    [ProducesResponseType(typeof(ReferralDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AttachDocument(Guid id, [FromBody] AttachReferralDocumentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = RequireTenantId();
            var referral = await _referralService.AttachDocumentAsync(id, request.DocumentId, request.IsResponse, tenantId, cancellationToken);
            return Ok(MapToDto(referral));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Get referral statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ReferralStats), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats([FromQuery] Guid? providerId, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var stats = await _referralService.GetReferralStatsAsync(tenantId, providerId, cancellationToken);
        return Ok(stats);
    }

    private static ReferralDto MapToDto(Referral referral)
    {
        return new ReferralDto
        {
            Id = referral.Id,
            PatientId = referral.PatientId,
            PatientName = referral.Patient != null ? $"{referral.Patient.FirstName} {referral.Patient.LastName}" : null,
            ReferringProviderId = referral.ReferringProviderId,
            ReferringProviderName = referral.ReferringProvider != null ? $"{referral.ReferringProvider.FirstName} {referral.ReferringProvider.LastName}" : null,
            Type = referral.Type,
            TypeName = referral.Type.ToString(),
            Specialty = referral.Specialty,
            SpecificService = referral.SpecificService,
            Priority = referral.Priority,
            PriorityName = referral.Priority.ToString(),
            Status = referral.Status,
            StatusName = referral.Status.ToString(),
            ExternalProviderName = referral.ExternalProviderName,
            ExternalProviderPhone = referral.ExternalProviderPhone,
            ExternalProviderEmail = referral.ExternalProviderEmail,
            ExternalProviderAddress = referral.ExternalProviderAddress,
            ExternalProviderFax = referral.ExternalProviderFax,
            ReasonForReferral = referral.ReasonForReferral,
            ClinicalHistory = referral.ClinicalHistory,
            CurrentMedications = referral.CurrentMedications,
            Allergies = referral.Allergies,
            RelevantTestResults = referral.RelevantTestResults,
            SpecificQuestions = referral.SpecificQuestions,
            ReferralDate = referral.ReferralDate,
            ExpiryDate = referral.ExpiryDate,
            SentAt = referral.SentAt,
            AcknowledgedAt = referral.AcknowledgedAt,
            ScheduledAt = referral.ScheduledAt,
            CompletedAt = referral.CompletedAt,
            CancelledAt = referral.CancelledAt,
            ResponseNotes = referral.ResponseNotes,
            AppointmentDate = referral.AppointmentDate,
            AppointmentLocation = referral.AppointmentLocation,
            ReferralDocumentId = referral.ReferralDocumentId,
            ResponseDocumentId = referral.ResponseDocumentId,
            PatientNotified = referral.PatientNotified,
            PatientNotifiedAt = referral.PatientNotifiedAt,
            RequiresFollowUp = referral.RequiresFollowUp,
            FollowUpDate = referral.FollowUpDate,
            CancellationReason = referral.CancellationReason,
            CreatedAt = referral.CreatedAt,
            UpdatedAt = referral.UpdatedAt
        };
    }
}

// Request DTOs
public record UpdateReferralStatusRequest
{
    public ReferralStatus Status { get; init; }
    public string? Notes { get; init; }
}

public record CancelReferralRequest
{
    public string Reason { get; init; } = string.Empty;
}

public record AttachReferralDocumentRequest
{
    public Guid DocumentId { get; init; }
    public bool IsResponse { get; init; }
}

// Response DTO
public record ReferralDto
{
    public Guid Id { get; init; }
    public Guid PatientId { get; init; }
    public string? PatientName { get; init; }
    public Guid ReferringProviderId { get; init; }
    public string? ReferringProviderName { get; init; }
    public ReferralType Type { get; init; }
    public string TypeName { get; init; } = string.Empty;
    public string Specialty { get; init; } = string.Empty;
    public string? SpecificService { get; init; }
    public ReferralPriority Priority { get; init; }
    public string PriorityName { get; init; } = string.Empty;
    public ReferralStatus Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
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
    public DateTime? ReferralDate { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public DateTime? SentAt { get; init; }
    public DateTime? AcknowledgedAt { get; init; }
    public DateTime? ScheduledAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime? CancelledAt { get; init; }
    public string? ResponseNotes { get; init; }
    public DateTime? AppointmentDate { get; init; }
    public string? AppointmentLocation { get; init; }
    public Guid? ReferralDocumentId { get; init; }
    public Guid? ResponseDocumentId { get; init; }
    public bool PatientNotified { get; init; }
    public DateTime? PatientNotifiedAt { get; init; }
    public bool RequiresFollowUp { get; init; }
    public DateTime? FollowUpDate { get; init; }
    public string? CancellationReason { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
