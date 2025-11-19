using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/pain-pattern")]
public class PainPatternController : ControllerBase
{
    private readonly IPainPatternRecognitionService _patternService;

    public PainPatternController(IPainPatternRecognitionService patternService)
    {
        _patternService = patternService;
    }

    /// <summary>
    /// Analyze pain pattern and suggest conditions
    /// </summary>
    [HttpGet("{painMapId}/analyze")]
    [ProducesResponseType(typeof(PainPatternAnalysis), StatusCodes.Status200OK)]
    public async Task<IActionResult> AnalyzePattern(
        Guid painMapId,
        CancellationToken cancellationToken)
    {
        var analysis = await _patternService.AnalyzePatternAsync(painMapId, cancellationToken);
        return Ok(analysis);
    }

    /// <summary>
    /// Predict conditions based on pain pattern
    /// </summary>
    [HttpGet("{painMapId}/predict")]
    [ProducesResponseType(typeof(List<ConditionPrediction>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PredictConditions(
        Guid painMapId,
        CancellationToken cancellationToken)
    {
        var predictions = await _patternService.PredictConditionsAsync(painMapId, cancellationToken);
        return Ok(predictions);
    }
}
