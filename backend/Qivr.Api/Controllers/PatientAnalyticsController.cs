using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/patient-analytics")]
[Authorize]
public class PatientAnalyticsController : BaseApiController
{
    private readonly IPatientAnalyticsService _analyticsService;

    public PatientAnalyticsController(IPatientAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(PatientDashboardData), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        var data = await _analyticsService.GetPatientDashboardAsync(userId, cancellationToken);
        return Ok(data);
    }

    [HttpGet("progress")]
    [ProducesResponseType(typeof(PatientProgressData), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProgress(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;
        
        var data = await _analyticsService.GetPatientProgressAsync(userId, fromDate, toDate, cancellationToken);
        return Ok(data);
    }
}
