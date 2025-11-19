using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/pain-map-export")]
public class PainMapExportController : ControllerBase
{
    private readonly IPainMapExportService _exportService;

    public PainMapExportController(IPainMapExportService exportService)
    {
        _exportService = exportService;
    }

    /// <summary>
    /// Export pain maps to CSV
    /// </summary>
    [HttpPost("csv")]
    public async Task<IActionResult> ExportCsv(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenantId")?.Value ?? throw new UnauthorizedAccessException());
        var csv = await _exportService.ExportToCsvAsync(tenantId, filter, cancellationToken);
        
        return File(csv, "text/csv", $"pain-maps-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>
    /// Export pain maps to JSON
    /// </summary>
    [HttpPost("json")]
    public async Task<IActionResult> ExportJson(
        [FromBody] PainMapFilter filter,
        CancellationToken cancellationToken)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenantId")?.Value ?? throw new UnauthorizedAccessException());
        var json = await _exportService.ExportToJsonAsync(tenantId, filter, cancellationToken);
        
        return File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", $"pain-maps-{DateTime.UtcNow:yyyyMMdd}.json");
    }
}
