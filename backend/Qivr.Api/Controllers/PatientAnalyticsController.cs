using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Qivr.Services;

namespace Qivr.Api.Controllers;

/// <summary>
/// Patient Analytics API - powers the "My Health" dashboard for patients.
/// SECURITY: All endpoints strictly enforce CurrentUserId - patients can ONLY see their own data.
/// </summary>
[ApiController]
[Route("api/patient-analytics")]
[Authorize]
public class PatientAnalyticsController : BaseApiController
{
    private readonly IPatientAnalyticsService _analyticsService;
    private readonly QivrDbContext _db;
    private readonly ILogger<PatientAnalyticsController> _logger;

    public PatientAnalyticsController(
        IPatientAnalyticsService analyticsService,
        QivrDbContext db,
        ILogger<PatientAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Get patient's personal health dashboard.
    /// Returns pre-calculated metrics for performance (avoids on-the-fly aggregation).
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(PatientDashboardData), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        // SECURITY: Only return data for the authenticated user
        var userId = CurrentUserId;
        if (userId == Guid.Empty)
        {
            _logger.LogWarning("Attempt to access patient analytics with no authenticated user");
            return Unauthorized(new { message = "Authentication required" });
        }

        var data = await _analyticsService.GetPatientDashboardAsync(userId, cancellationToken);
        return Ok(data);
    }

    /// <summary>
    /// Get patient's progress over time.
    /// Returns PROM score and pain intensity timelines for charts.
    /// </summary>
    [HttpGet("progress")]
    [ProducesResponseType(typeof(PatientProgressData), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProgress(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        // SECURITY: Only return data for the authenticated user
        var userId = CurrentUserId;
        if (userId == Guid.Empty)
        {
            _logger.LogWarning("Attempt to access patient progress with no authenticated user");
            return Unauthorized(new { message = "Authentication required" });
        }

        // Limit date range to prevent expensive queries (max 1 year)
        var toDate = to ?? DateTime.UtcNow;
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);

        // Cap at 1 year to prevent DoS via expensive date range
        var maxRange = TimeSpan.FromDays(365);
        if (toDate - fromDate > maxRange)
        {
            fromDate = toDate - maxRange;
            _logger.LogInformation("Date range capped to 1 year for patient {UserId}", userId);
        }

        var data = await _analyticsService.GetPatientProgressAsync(userId, fromDate, toDate, cancellationToken);
        return Ok(data);
    }

    /// <summary>
    /// Get patient analytics by patient ID - STAFF ONLY.
    /// This allows clinicians to view a specific patient's analytics.
    /// </summary>
    [HttpGet("patient/{patientId}")]
    [Authorize(Policy = "StaffOnly")]
    [ProducesResponseType(typeof(PatientDashboardData), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPatientDashboard(
        Guid patientId,
        CancellationToken cancellationToken)
    {
        // SECURITY: Staff can view patient data, but only within their tenant
        var tenantId = RequireTenantId();

        // Verify patient belongs to this tenant via direct DB query
        var patientBelongsToTenant = await _db.Users
            .AnyAsync(u => u.Id == patientId && u.TenantId == tenantId, cancellationToken);

        if (!patientBelongsToTenant)
        {
            _logger.LogWarning(
                "Staff user {UserId} attempted to access patient {PatientId} outside their tenant {TenantId}",
                CurrentUserId, patientId, tenantId);
            return NotFound(new { message = "Patient not found" });
        }

        var data = await _analyticsService.GetPatientDashboardAsync(patientId, cancellationToken);
        return Ok(data);
    }
}
