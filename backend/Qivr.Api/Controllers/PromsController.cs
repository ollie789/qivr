using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.Entities;
using Qivr.Services;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/v1/proms")]
public class PromsController : ControllerBase
{
	private readonly IPromService _promService;
	private readonly IPromInstanceService _promInstanceService;
	private readonly ILogger<PromsController> _logger;

	public PromsController(IPromService promService, IPromInstanceService promInstanceService, ILogger<PromsController> logger)
	{
		_promService = promService;
		_promInstanceService = promInstanceService;
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

	// PUT /api/v1/proms/templates/by-id/{templateId}
	[HttpPut("templates/by-id/{templateId}")]
	[Authorize(Roles = "Admin,Clinician")]
	public async Task<ActionResult<PromTemplateDto>> UpdateTemplate([FromRoute] Guid templateId, [FromBody] UpdatePromTemplateDto request, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var result = await _promService.UpdateTemplateAsync(tenantId, templateId, request, ct);
		if (result == null) return NotFound();
		return Ok(result);
	}

	// DELETE /api/v1/proms/templates/by-id/{templateId}
	[HttpDelete("templates/by-id/{templateId}")]
	[Authorize(Roles = "Admin,Clinician")]
	public async Task<IActionResult> DeleteTemplate([FromRoute] Guid templateId, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var removed = await _promService.DeleteTemplateAsync(tenantId, templateId, ct);
		if (!removed) return NotFound();
		return NoContent();
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
		var template = await _promService.GetTemplateAsync(tenantId, request.TemplateKey, request.Version, ct);
		if (template == null)
		{
			return NotFound(new { error = "PROM template not found" });
		}

		var sendRequest = new SendPromRequest
		{
			TemplateId = template.Id,
			PatientId = request.PatientId,
			ScheduledAt = request.ScheduledFor == default ? DateTime.UtcNow : request.ScheduledFor,
			DueDate = request.DueAt,
			NotificationMethod = request.NotificationMethod ?? NotificationMethod.Email,
			SentBy = GetUserId().ToString(),
			Tags = request.Tags?.ToList(),
			Notes = request.Notes
		};

		var instance = await _promInstanceService.SendPromToPatientAsync(tenantId, sendRequest, ct);
		return CreatedAtAction(nameof(GetInstance), new { id = instance.Id }, instance);
	}

	// GET /api/v1/proms/instances/{id}
	[HttpGet("instances/{id}")]
	[Authorize]
	public async Task<ActionResult<PromInstanceDto>> GetInstance([FromRoute] Guid id, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var result = await _promInstanceService.GetPromInstanceAsync(tenantId, id, ct);
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
		var list = await _promInstanceService.GetPatientPromInstancesAsync(tenantId, userId, status, ct);
		return Ok(list);
	}

	// GET /api/v1/proms/admin/instances?status=&templateId=&patientId=&startDate=&endDate=
	[HttpGet("admin/instances")]
	[Authorize(Roles = "Admin,Clinician")]
	public async Task<ActionResult<PromResponseListDto>> ListTenantInstances(
		[FromQuery] Guid? templateId,
		[FromQuery] Guid? patientId,
		[FromQuery] string? status,
		[FromQuery] DateTime? startDate,
		[FromQuery] DateTime? endDate,
		[FromQuery] int page = 1,
		[FromQuery] int limit = 25,
		CancellationToken ct = default)
	{
		var tenantId = GetTenantId();
		var instances = await _promInstanceService.GetPromInstancesAsync(tenantId, templateId, status, patientId, startDate, endDate, ct);
		var stats = CalculateAggregateStats(instances);
		var safeLimit = Math.Clamp(limit, 1, 100);
		var safePage = Math.Max(page, 1);
		var skip = (safePage - 1) * safeLimit;
		var data = instances.Skip(skip).Take(safeLimit).ToList();

		var response = new PromResponseListDto
		{
			Data = data,
			Total = instances.Count,
			Stats = stats
		};

		return Ok(response);
	}

	// GET /api/v1/proms/stats
	[HttpGet("stats")]
	[Authorize(Roles = "Admin,Clinician")]
	public async Task<ActionResult<PromInstanceStats>> GetStats([FromQuery] Guid? templateId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken ct)
	{
		var tenantId = GetTenantId();
		var stats = await _promInstanceService.GetPromStatsAsync(tenantId, templateId, startDate, endDate, ct);
		return Ok(stats);
	}

	// POST /api/v1/proms/instances/{id}/answers
	[HttpPost("instances/{id}/answers")]
	[AllowAnonymous] // public submission supported via access token + RLS default tenant insert if configured
	public async Task<ActionResult<SubmitAnswersResult>> SubmitAnswers([FromRoute] Guid id, [FromBody] JsonElement payload, CancellationToken ct)
	{
		var tenantId = GetTenantIdOrDefault();
		var submission = ParseSubmissionPayload(payload);
		if (submission.Answers.Count == 0)
		{
			return BadRequest(new { error = "PROM answers payload is empty" });
		}

		var response = new PromSubmissionRequest
		{
			SubmittedAt = DateTime.UtcNow,
			Answers = submission.Answers,
			RequestBooking = submission.RequestBooking,
			BookingRequest = submission.BookingRequest,
			CompletionSeconds = submission.CompletionSeconds,
			Notes = submission.Notes
		};

		var instance = await _promInstanceService.SubmitPromResponseAsync(tenantId, id, response, ct);
		return Ok(new SubmitAnswersResult { Score = instance.TotalScore ?? 0m, CompletedAt = instance.CompletedAt ?? DateTime.UtcNow });
	}

	// PUT /api/v1/proms/instances/{id}/draft
	[HttpPut("instances/{id}/draft")]
	[Authorize]
	public async Task<ActionResult<PromInstanceDto>> SaveDraft([FromRoute] Guid id, [FromBody] SavePromDraftRequest request, CancellationToken ct)
	{
		try
		{
			var tenantId = GetTenantIdOrDefault();

			Dictionary<string, object?>? responses = null;
			if (request.Responses != null && request.Responses.Count > 0)
			{
				responses = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
				foreach (var kvp in request.Responses)
				{
					responses[kvp.Key] = ConvertJsonElementToObject(kvp.Value);
				}
			}

			var draft = new PromDraftRequest
			{
				Responses = responses,
				LastQuestionIndex = request.LastQuestionIndex,
				CompletionSeconds = request.CompletionSeconds,
			};

			var instance = await _promInstanceService.SaveDraftAsync(tenantId, id, draft, ct);
			return Ok(instance);
		}
		catch (ArgumentException ex)
		{
			return NotFound(new { error = ex.Message });
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error saving PROM draft for instance {InstanceId}", id);
			return StatusCode(500, new { error = "Failed to save draft" });
		}
	}

	private static PromResponseStatisticsDto CalculateAggregateStats(IReadOnlyList<PromInstanceDto> instances)
	{
		var stats = new PromResponseStatisticsDto
		{
			Total = instances.Count
		};

		if (instances.Count == 0)
		{
			return stats;
		}

		var completed = instances.Where(i => StatusEquals(i, PromStatus.Completed)).ToList();
		var pending = instances.Where(i => StatusEquals(i, PromStatus.Pending)).ToList();
		var inProgress = instances.Where(i => StatusEquals(i, PromStatus.InProgress)).ToList();
		var expired = instances.Where(i => StatusEquals(i, PromStatus.Expired)).ToList();
		var cancelled = instances.Where(i => StatusEquals(i, PromStatus.Cancelled)).ToList();

		stats.CompletedCount = completed.Count;
		stats.PendingCount = pending.Count;
		stats.InProgressCount = inProgress.Count;
		stats.ExpiredCount = expired.Count;
		stats.CancelledCount = cancelled.Count;
		stats.CompletionRate = Math.Round((double)stats.CompletedCount / stats.Total * 100d, 2);

		const decimal MaxScorePerQuestion = 3m;
		var scoreSamples = completed
			.Select(instance =>
			{
				var rawScore = instance.TotalScore ?? 0m;
				var maxScore = instance.QuestionCount > 0 ? instance.QuestionCount * MaxScorePerQuestion : 0m;
				if (maxScore > 0m && rawScore >= 0m)
				{
					return Math.Round((double)((rawScore / maxScore) * 100m), 2);
				}
				if (rawScore > 0m)
				{
					return Math.Round((double)rawScore, 2);
				}
				return 0d;
			})
			.Where(value => value > 0d)
			.ToList();

		stats.AverageScore = scoreSamples.Count > 0
			? Math.Round(scoreSamples.Average(), 2)
			: 0d;

		stats.LastCompleted = completed
			.Select(i => i.CompletedAt)
			.Where(d => d.HasValue)
			.OrderByDescending(d => d!.Value)
			.FirstOrDefault();

		stats.NextDue = instances
			.Where(i => StatusEquals(i, PromStatus.Pending) || StatusEquals(i, PromStatus.InProgress))
			.Select(i => (DateTime?)i.DueDate)
			.OrderBy(d => d)
			.FirstOrDefault();

		var completedDates = completed
			.Select(i => i.CompletedAt)
			.Where(d => d.HasValue)
			.Select(d => d!.Value);

		stats.Streak = CalculateStreak(completedDates);

		return stats;
	}

	private static bool StatusEquals(PromInstanceDto instance, PromStatus status)
	{
		return string.Equals(instance.Status, status.ToString(), StringComparison.OrdinalIgnoreCase);
	}

	private static int CalculateStreak(IEnumerable<DateTime> dates)
	{
		var ordered = dates
			.Select(d => d.Date)
			.Distinct()
			.OrderByDescending(d => d)
			.ToList();

		if (ordered.Count == 0)
		{
			return 0;
		}

		var streak = 1;
		var previous = ordered[0];

		for (var index = 1; index < ordered.Count; index += 1)
		{
			var current = ordered[index];
			var difference = (previous - current).TotalDays;
			if (difference == 1)
			{
				streak += 1;
				previous = current;
			}
			else if (difference == 0)
			{
				continue;
			}
			else
			{
				break;
			}
		}

		return streak;
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

	private static readonly JsonSerializerOptions SubmissionSerializerOptions = new()
	{
		PropertyNameCaseInsensitive = true
	};

	private static SubmissionPayload ParseSubmissionPayload(JsonElement payload)
	{
		var answers = new Dictionary<Guid, PromAnswer>();
		var requestBooking = false;
		BookingRequest? bookingRequest = null;
		int? completionSeconds = null;
		string? notes = null;

		if (payload.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
		{
			return new SubmissionPayload(new List<PromAnswer>(), requestBooking, bookingRequest, completionSeconds, notes);
		}

		if (payload.ValueKind != JsonValueKind.Object)
		{
			return new SubmissionPayload(new List<PromAnswer>(), requestBooking, bookingRequest, completionSeconds, notes);
		}

		if (payload.TryGetProperty("requestBooking", out var requestBookingElement))
		{
			requestBooking = requestBookingElement.ValueKind switch
			{
				JsonValueKind.True => true,
				JsonValueKind.False => false,
				JsonValueKind.Number when requestBookingElement.TryGetInt32(out var numeric) => numeric == 1,
				JsonValueKind.String => bool.TryParse(requestBookingElement.GetString(), out var parsed) && parsed,
				_ => requestBooking
			};
		}

		if (payload.TryGetProperty("completionSeconds", out var completionElement) && completionElement.ValueKind != JsonValueKind.Null)
		{
			if (completionElement.ValueKind == JsonValueKind.Number && completionElement.TryGetInt32(out var seconds))
			{
				completionSeconds = seconds;
			}
			else if (completionElement.ValueKind == JsonValueKind.String && int.TryParse(completionElement.GetString(), out var parsedSeconds))
			{
				completionSeconds = parsedSeconds;
			}
		}

		if (payload.TryGetProperty("notes", out var notesElement) && notesElement.ValueKind == JsonValueKind.String)
		{
			notes = notesElement.GetString();
		}

		if (payload.TryGetProperty("bookingRequest", out var bookingElement) && bookingElement.ValueKind == JsonValueKind.Object)
		{
			try
			{
				bookingRequest = JsonSerializer.Deserialize<BookingRequest>(bookingElement.GetRawText(), SubmissionSerializerOptions);
			}
			catch
			{
				bookingRequest = null;
			}
		}

		if (payload.TryGetProperty("answers", out var answersElement))
		{
			CollectAnswers(answersElement, answers);
		}
		else if (payload.TryGetProperty("responses", out var responsesElement))
		{
			CollectAnswers(responsesElement, answers);
		}
		else
		{
			CollectAnswers(payload, answers);
		}

		return new SubmissionPayload(answers.Values.ToList(), requestBooking, bookingRequest, completionSeconds, notes);
	}

	private static void CollectAnswers(JsonElement element, IDictionary<Guid, PromAnswer> answers)
	{
		switch (element.ValueKind)
		{
			case JsonValueKind.Object:
				foreach (var property in element.EnumerateObject())
				{
					if (IsReservedKey(property.Name))
					{
						continue;
					}

					var questionId = ParseQuestionId(property.Name);
					if (questionId == Guid.Empty)
					{
						continue;
					}

					answers[questionId] = new PromAnswer
					{
						QuestionId = questionId,
						Value = ConvertJsonElementToObject(property.Value)
					};
				}
				break;
			case JsonValueKind.Array:
				foreach (var item in element.EnumerateArray())
				{
					var questionToken = item.TryGetProperty("questionId", out var questionElement)
						? questionElement.GetString()
						: item.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;
					var questionId = ParseQuestionId(questionToken);
					if (questionId == Guid.Empty)
					{
						continue;
					}

					var valueElement = item.TryGetProperty("value", out var v)
						? v
						: item.TryGetProperty("answer", out var alt) ? alt : default;

					answers[questionId] = new PromAnswer
					{
						QuestionId = questionId,
						Value = valueElement.ValueKind == JsonValueKind.Undefined
							? null
							: ConvertJsonElementToObject(valueElement)
					};
				}
				break;
		}
	}

	private static bool IsReservedKey(string key)
	{
		return key.Equals("answers", StringComparison.OrdinalIgnoreCase)
			|| key.Equals("responses", StringComparison.OrdinalIgnoreCase)
			|| key.Equals("requestBooking", StringComparison.OrdinalIgnoreCase)
			|| key.Equals("bookingRequest", StringComparison.OrdinalIgnoreCase)
			|| key.Equals("completionSeconds", StringComparison.OrdinalIgnoreCase)
			|| key.Equals("notes", StringComparison.OrdinalIgnoreCase);
	}

	private static object? ConvertJsonElementToObject(JsonElement element)
	{
		switch (element.ValueKind)
		{
			case JsonValueKind.String:
				if (element.TryGetDateTime(out var dt))
				{
					return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
				}
				return element.GetString();
			case JsonValueKind.Number:
				if (element.TryGetInt64(out var longValue))
				{
					return longValue;
				}
				if (element.TryGetDecimal(out var decimalValue))
				{
					return decimalValue;
				}
				return element.GetDouble();
			case JsonValueKind.True:
			case JsonValueKind.False:
				return element.GetBoolean();
			case JsonValueKind.Array:
				return element.EnumerateArray().Select(ConvertJsonElementToObject).ToList();
			case JsonValueKind.Object:
				var dict = new Dictionary<string, object?>();
				foreach (var property in element.EnumerateObject())
				{
					dict[property.Name] = ConvertJsonElementToObject(property.Value);
				}
				return dict;
			case JsonValueKind.Null:
			case JsonValueKind.Undefined:
				return null;
			default:
				return element.GetRawText();
		}
	}

	private static Guid ParseQuestionId(string? raw)
	{
		if (string.IsNullOrWhiteSpace(raw))
		{
			return Guid.Empty;
		}

		if (Guid.TryParse(raw, out var parsed))
		{
			return parsed;
		}

		using var md5 = MD5.Create();
		var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(raw));
		return new Guid(hash);
	}

private sealed record SubmissionPayload(List<PromAnswer> Answers, bool RequestBooking, BookingRequest? BookingRequest, int? CompletionSeconds, string? Notes);
}

public class PromResponseListDto
{
	public IReadOnlyList<PromInstanceDto> Data { get; set; } = Array.Empty<PromInstanceDto>();
	public int Total { get; set; }
	public PromResponseStatisticsDto Stats { get; set; } = new();
}

public class PromResponseStatisticsDto
{
	public int Total { get; set; }
	public int CompletedCount { get; set; }
	public int PendingCount { get; set; }
	public int InProgressCount { get; set; }
	public int ExpiredCount { get; set; }
	public int CancelledCount { get; set; }
	public double CompletionRate { get; set; }
	public double AverageScore { get; set; }
	public DateTime? NextDue { get; set; }
    public DateTime? LastCompleted { get; set; }
    public int Streak { get; set; }
}

public class SavePromDraftRequest
{
	public Dictionary<string, JsonElement>? Responses { get; set; }
	public int? LastQuestionIndex { get; set; }
	public int? CompletionSeconds { get; set; }
}
