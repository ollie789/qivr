using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/clinic-analytics")]
[Authorize(Policy = "StaffOnly")]
public class ClinicAnalyticsController : BaseApiController
{
    private readonly IClinicAnalyticsService _analyticsService;
    private readonly ILogger<ClinicAnalyticsController> _logger;

    public ClinicAnalyticsController(
        IClinicAnalyticsService analyticsService,
        ILogger<ClinicAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard metrics for today
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(DashboardMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardMetrics(
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var targetDate = date.HasValue 
            ? DateTime.SpecifyKind(date.Value, DateTimeKind.Utc) 
            : DateTime.UtcNow;
        
        var metrics = await _analyticsService.GetDashboardMetricsAsync(tenantId, targetDate, cancellationToken);
        return Ok(metrics);
    }

    /// <summary>
    /// Get clinical analytics for date range
    /// </summary>
    [HttpGet("clinical")]
    [ProducesResponseType(typeof(ClinicalAnalytics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClinicalAnalytics(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var fromDate = from.HasValue 
            ? DateTime.SpecifyKind(from.Value, DateTimeKind.Utc) 
            : DateTime.UtcNow.AddDays(-30);
        var toDate = to.HasValue 
            ? DateTime.SpecifyKind(to.Value, DateTimeKind.Utc) 
            : DateTime.UtcNow;
        
        var analytics = await _analyticsService.GetClinicalAnalyticsAsync(tenantId, fromDate, toDate, cancellationToken);
        return Ok(analytics);
    }

    /// <summary>
    /// Get 3D pain map analytics
    /// </summary>
    [HttpGet("pain-maps")]
    [ProducesResponseType(typeof(PainMapAnalytics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPainMapAnalytics(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;
        
        var analytics = await _analyticsService.GetPainMapAnalyticsAsync(tenantId, fromDate, toDate, cancellationToken);
        return Ok(analytics);
    }
}
