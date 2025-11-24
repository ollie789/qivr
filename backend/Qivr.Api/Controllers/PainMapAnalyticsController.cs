using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/pain-map-analytics")]
public class PainMapAnalyticsController : BaseApiController
{
    private readonly IPainMapAnalyticsService _analyticsService;

    public PainMapAnalyticsController(IPainMapAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpPost("heatmap")]
    [ProducesResponseType(typeof(PainMapHeatMapData), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateHeatMap(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var heatMap = await _analyticsService.GenerateHeatMapAsync(tenantId, filter, cancellationToken);
        return Ok(heatMap);
    }

    [HttpPost("metrics")]
    [ProducesResponseType(typeof(PainMapMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMetrics(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var metrics = await _analyticsService.GetMetricsAsync(tenantId, filter, cancellationToken);
        return Ok(metrics);
    }

    [HttpGet("progression/{patientId}")]
    [ProducesResponseType(typeof(List<PainMapProgression>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProgression(
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var progression = await _analyticsService.GetProgressionAsync(patientId, cancellationToken);
        return Ok(progression);
    }

    [HttpPost("symmetry")]
    [ProducesResponseType(typeof(BilateralSymmetryAnalysis), StatusCodes.Status200OK)]
    public async Task<IActionResult> AnalyzeSymmetry(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var analysis = await _analyticsService.AnalyzeBilateralSymmetryAsync(tenantId, filter, cancellationToken);
        return Ok(analysis);
    }
}
