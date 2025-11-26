using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services.AI;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/ai-triage")]
[Authorize]
public class AiTriageController : BaseApiController
{
    private readonly IAiTriageService _triageService;

    public AiTriageController(IAiTriageService triageService)
    {
        _triageService = triageService;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] TriageRequest request)
    {
        var patientId = CurrentUserId;
        var summary = await _triageService.GenerateTriageSummaryAsync(patientId, request);
        return Ok(summary);
    }
}
