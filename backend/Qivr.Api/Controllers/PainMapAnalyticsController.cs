using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/pain-map-analytics")]
public class PainMapAnalyticsController : ControllerBase
{
    private readonly IPainMapAnalyticsService _analyticsService;

    public PainMapAnalyticsController(IPainMapAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    /// <summary>
    /// Generate heat map from aggregated pain data
    /// </summary>
    [HttpPost("heatmap")]
    [ProducesResponseType(typeof(PainMapHeatMapData), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateHeatMap(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenantId")?.Value ?? throw new UnauthorizedAccessException());
        var heatMap = await _analyticsService.GenerateHeatMapAsync(tenantId, filter, cancellationToken);
        return Ok(heatMap);
    }

    /// <summary>
    /// Get pain map metrics and statistics
    /// </summary>
    [HttpPost("metrics")]
    [ProducesResponseType(typeof(PainMapMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMetrics(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenantId")?.Value ?? throw new UnauthorizedAccessException());
        var metrics = await _analyticsService.GetMetricsAsync(tenantId, filter, cancellationToken);
        return Ok(metrics);
    }

    /// <summary>
    /// Get pain map progression for a patient
    /// </summary>
    [HttpGet("progression/{patientId}")]
    [ProducesResponseType(typeof(List<PainMapProgression>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProgression(
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var progression = await _analyticsService.GetProgressionAsync(patientId, cancellationToken);
        return Ok(progression);
    }

    /// <summary>
    /// Analyze bilateral symmetry of pain distribution
    /// </summary>
    [HttpPost("symmetry")]
    [ProducesResponseType(typeof(BilateralSymmetryAnalysis), StatusCodes.Status200OK)]
    public async Task<IActionResult> AnalyzeSymmetry(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenantId")?.Value ?? throw new UnauthorizedAccessException());
        var analysis = await _analyticsService.AnalyzeBilateralSymmetryAsync(tenantId, filter, cancellationToken);
        return Ok(analysis);
    }
}
