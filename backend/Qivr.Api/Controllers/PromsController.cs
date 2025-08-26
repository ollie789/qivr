using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/v1/proms")]
public class PromsController : ControllerBase
{
	private readonly IPromService _promService;
	private readonly ILogger<PromsController> _logger;

	public PromsController(IPromService promService, ILogger<PromsController> logger)
	{
		_promService = promService;
		_logger = logger;
	}

	// POST /api/v1/proms/templates
	[HttpPost("templates")]
	[Authorize(Roles = "Admin,Clinician")]
	public async Task<ActionResult<PromTemplateDto>> CreateOrVersionTemplate([FromBody] CreatePromTemplateDto request, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var result = await _promService.CreateOrVersionTemplateAsync(tenantId, request, ct);
		return CreatedAtAction(nameof(GetTemplate), new { key = result.Key, version = result.Version }, result);
	}

	// GET /api/v1/proms/templates/{key}/{version?}
	[HttpGet("templates/{key}/{version?}")]
	[Authorize]
	public async Task<ActionResult<PromTemplateDto>> GetTemplate([FromRoute] string key, [FromRoute] int? version, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var result = await _promService.GetTemplateAsync(tenantId, key, version, ct);
		if (result == null) return NotFound();
		return Ok(result);
	}

	// GET /api/v1/proms/templates/by-id/{templateId}
	[HttpGet("templates/by-id/{templateId}")]
	[Authorize]
	public async Task<ActionResult<PromTemplateDto>> GetTemplateById([FromRoute] Guid templateId, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var result = await _promService.GetTemplateByIdAsync(tenantId, templateId, ct);
		if (result == null) return NotFound();
		return Ok(result);
	}

	// GET /api/v1/proms/templates?page=&pageSize=
	[HttpGet("templates")]
	[Authorize]
	public async Task<ActionResult<IReadOnlyList<PromTemplateSummaryDto>>> ListTemplates([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
	{
		var tenantId = GetTenantId();
		var list = await _promService.ListTemplatesAsync(tenantId, page, Math.Clamp(pageSize, 1, 100), ct);
		return Ok(list);
	}

	// POST /api/v1/proms/schedule
	[HttpPost("schedule")]
	[Authorize(Roles = "Admin,Clinician")] // allow clinic staff to schedule
	public async Task<ActionResult<PromInstanceDto>> Schedule([FromBody] SchedulePromRequest request, CancellationToken ct)
	{
		var tenantId = GetTenantIdOrDefault();
		var instance = await _promService.ScheduleInstanceAsync(tenantId, request, ct);
		return CreatedAtAction(nameof(GetInstance), new { id = instance.Id }, instance);
	}

	// GET /api/v1/proms/instances/{id}
	[HttpGet("instances/{id}")]
	[Authorize]
	public async Task<ActionResult<PromInstanceDto>> GetInstance([FromRoute] Guid id, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var result = await _promService.GetInstanceAsync(tenantId, id, ct);
		if (result == null) return NotFound();
		return Ok(result);
	}

	// GET /api/v1/proms/instances (current patient)
	[HttpGet("instances")]
	[Authorize]
	public async Task<ActionResult<IReadOnlyList<PromInstanceDto>>> ListMyInstances([FromQuery] string? status, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var userId = GetUserId();
		var list = await _promService.ListInstancesForPatientAsync(tenantId, userId, status, ct);
		return Ok(list);
	}

	// POST /api/v1/proms/instances/{id}/answers
	[HttpPost("instances/{id}/answers")]
	[AllowAnonymous] // public submission supported via access token + RLS default tenant insert if configured
	public async Task<ActionResult<SubmitAnswersResult>> SubmitAnswers([FromRoute] Guid id, [FromBody] Dictionary<string, object> answers, CancellationToken ct)
	{
		var tenantId = GetTenantIdOrDefault();
		var result = await _promService.SubmitAnswersAsync(tenantId, id, answers, ct);
		return Ok(result);
	}

	private Guid GetTenantId()
	{
		var claim = User.FindFirst("tenant_id")?.Value;
		if (Guid.TryParse(claim, out var tid)) return tid;
		throw new UnauthorizedAccessException("Tenant ID not found");
	}

	// When anonymous/public: allow default tenant fallback from header or config pattern
	private Guid GetTenantIdOrDefault()
	{
		if (User?.Identity?.IsAuthenticated == true) return GetTenantId();
		var header = HttpContext.Request.Headers["X-Clinic-Id"].FirstOrDefault();
		if (Guid.TryParse(header, out var tidFromHeader)) return tidFromHeader;
		// fallback default public tenant
		return Guid.Parse(HttpContext.RequestServices.GetRequiredService<IConfiguration>()
			["DefaultTenantId"] ?? "00000000-0000-0000-0000-000000000001");
	}

	private Guid GetUserId()
	{
		var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
			?? User.FindFirst("sub")?.Value;
		if (Guid.TryParse(userIdClaim, out var uid)) return uid;
		throw new UnauthorizedAccessException("User ID not found");
	}
}
