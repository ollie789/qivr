using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace Qivr.Services;

public interface IPromService
{
	Task<PromTemplateDto> CreateOrVersionTemplateAsync(Guid tenantId, CreatePromTemplateDto request, CancellationToken ct = default);
	Task<PromTemplateDto?> GetTemplateAsync(Guid tenantId, string key, int? version, CancellationToken ct = default);
	Task<IReadOnlyList<PromTemplateSummaryDto>> ListTemplatesAsync(Guid tenantId, int page, int pageSize, CancellationToken ct = default);
	Task<PromInstanceDto> ScheduleInstanceAsync(Guid tenantId, SchedulePromRequest request, CancellationToken ct = default);
	Task<PromInstanceDto?> GetInstanceAsync(Guid tenantId, Guid id, CancellationToken ct = default);
	Task<SubmitAnswersResult> SubmitAnswersAsync(Guid tenantId, Guid instanceId, Dictionary<string, object> answers, CancellationToken ct = default);
}

public class PromService : IPromService
{
	private readonly QivrDbContext _db;
	private readonly ILogger<PromService> _logger;

	public PromService(QivrDbContext db, ILogger<PromService> logger)
	{
		_db = db;
		_logger = logger;
	}

	public async Task<PromTemplateDto> CreateOrVersionTemplateAsync(Guid tenantId, CreatePromTemplateDto request, CancellationToken ct = default)
	{
		// Determine next version if existing
		var version = request.Version;
		if (version == null)
		{
			version = await _db.Database.SqlQuery<int>($@"
				SELECT COALESCE(MAX(version), 0) + 1 FROM qivr.prom_templates WHERE tenant_id = {tenantId} AND key = {request.Key}")
				.FirstAsync(ct);
		}

		var id = Guid.NewGuid();
		var now = DateTime.UtcNow;

		await _db.Database.ExecuteSqlInterpolatedAsync($@"
			INSERT INTO qivr.prom_templates (
				id, tenant_id, key, version, name, description, questions, scoring_method, scoring_rules, is_active, created_at, updated_at
			) VALUES (
				{id}, {tenantId}, {request.Key}, {version}, {request.Name}, {request.Description}, {request.SchemaJson}::jsonb, {request.ScoringMethod}, {request.ScoringRules}::jsonb, {request.IsActive}, {now}, {now}
			)", ct);

		return new PromTemplateDto
		{
			Id = id,
			Key = request.Key,
			Version = version!.Value,
			Name = request.Name,
			Description = request.Description,
			CreatedAt = now
		};
	}

	public async Task<PromTemplateDto?> GetTemplateAsync(Guid tenantId, string key, int? version, CancellationToken ct = default)
	{
		if (version.HasValue)
		{
			var result = await _db.Database.SqlQuery<PromTemplateDto>($@"
				SELECT id, key, version, name, description, created_at
				FROM qivr.prom_templates
				WHERE tenant_id = {tenantId} AND key = {key} AND version = {version.Value}
				ORDER BY version DESC
				LIMIT 1").FirstOrDefaultAsync(ct);
			return result;
		}
		else
		{
			var result = await _db.Database.SqlQuery<PromTemplateDto>($@"
				SELECT id, key, version, name, description, created_at
				FROM qivr.prom_templates
				WHERE tenant_id = {tenantId} AND key = {key}
				ORDER BY version DESC
				LIMIT 1").FirstOrDefaultAsync(ct);
			return result;
		}
	}

	public async Task<IReadOnlyList<PromTemplateSummaryDto>> ListTemplatesAsync(Guid tenantId, int page, int pageSize, CancellationToken ct = default)
	{
		var offset = Math.Max(0, (page - 1) * pageSize);
		var list = await _db.Database.SqlQuery<PromTemplateSummaryDto>($@"
			SELECT id, key, version, name, description, created_at
			FROM qivr.prom_templates
			WHERE tenant_id = {tenantId}
			ORDER BY key, version DESC
			LIMIT {pageSize} OFFSET {offset}").ToListAsync(ct);
		return list;
	}

	public async Task<PromInstanceDto> ScheduleInstanceAsync(Guid tenantId, SchedulePromRequest request, CancellationToken ct = default)
	{
		// Resolve template id by key/version
		var template = await _db.Database.SqlQuery<TemplateIdVersion>(
			$"SELECT id, version FROM qivr.prom_templates WHERE tenant_id = {tenantId} AND key = {request.TemplateKey} ORDER BY version DESC LIMIT 1")
			.FirstOrDefaultAsync(ct);

		if (template == null)
			throw new InvalidOperationException("Template not found");

		if (request.Version.HasValue && request.Version.Value != template.Version)
		{
			template = await _db.Database.SqlQuery<TemplateIdVersion>(
				$"SELECT id, version FROM qivr.prom_templates WHERE tenant_id = {tenantId} AND key = {request.TemplateKey} AND version = {request.Version.Value} LIMIT 1")
				.FirstOrDefaultAsync(ct) ?? throw new InvalidOperationException("Template version not found");
		}

		var id = Guid.NewGuid();
		var now = DateTime.UtcNow;
		var due = request.DueAt ?? request.ScheduledFor.AddDays(7);
		var status = "scheduled";

		await _db.Database.ExecuteSqlInterpolatedAsync($@"
			INSERT INTO qivr.prom_instances (
				id, tenant_id, template_id, patient_id, status, scheduled_for, due_date, created_at, updated_at
			) VALUES (
				{id}, {tenantId}, {template.Id}, {request.PatientId}, {status}, {request.ScheduledFor}, {due}, {now}, {now}
			)", ct);

		return new PromInstanceDto
		{
			Id = id,
			TemplateId = template.Id,
			PatientId = request.PatientId,
			Status = status,
			ScheduledFor = request.ScheduledFor,
			DueAt = due,
			CreatedAt = now
		};
	}

	public async Task<PromInstanceDto?> GetInstanceAsync(Guid tenantId, Guid id, CancellationToken ct = default)
	{
		var result = await _db.Database.SqlQuery<PromInstanceDto>($@"SELECT 
			id, template_id as TemplateId, patient_id as PatientId, status, scheduled_for as ScheduledFor,
			completed_at as CompletedAt, due_date as DueAt, responses as AnswersJson, score, created_at as CreatedAt
			FROM qivr.prom_instances WHERE tenant_id = {tenantId} AND id = {id}").FirstOrDefaultAsync(ct);
		return result;
	}

	public async Task<SubmitAnswersResult> SubmitAnswersAsync(Guid tenantId, Guid instanceId, Dictionary<string, object> answers, CancellationToken ct = default)
	{
		// Load template scoring method
		var tpl = await _db.Database.SqlQuery<TemplateScoreInfo>($@"
			SELECT t.scoring_method as ScoringMethod, t.scoring_rules as ScoringRules
			FROM qivr.prom_instances i
			JOIN qivr.prom_templates t ON t.id = i.template_id
			WHERE i.tenant_id = {tenantId} AND i.id = {instanceId}")
			.FirstOrDefaultAsync(ct);

		if (tpl == null) throw new InvalidOperationException("Instance not found");

		var score = CalculateScore(tpl.ScoringMethod, tpl.ScoringRules, answers);
		var now = DateTime.UtcNow;

		await _db.Database.ExecuteSqlInterpolatedAsync($@"
			UPDATE qivr.prom_instances
			SET responses = {System.Text.Json.JsonSerializer.Serialize(answers)}::jsonb,
				score = {score}, status = {"completed"}, completed_at = {now}, updated_at = {now}
			WHERE tenant_id = {tenantId} AND id = {instanceId}", ct);

		return new SubmitAnswersResult { Score = score, CompletedAt = now };
	}

	private static decimal CalculateScore(string? method, string? rulesJson, Dictionary<string, object> answers)
	{
		if (string.IsNullOrWhiteSpace(method)) return 0m;
		switch (method.ToLowerInvariant())
		{
			case "sum":
				return answers.Values
					.Where(v => decimal.TryParse(v?.ToString(), System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out _))
					.Sum(v => decimal.Parse(v!.ToString()!, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture));
			case "average":
				var numeric = answers.Values
					.Where(v => decimal.TryParse(v?.ToString(), System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out _))
					.Select(v => decimal.Parse(v!.ToString()!, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture))
					.ToList();
				return numeric.Count == 0 ? 0m : numeric.Average();
			default:
				return 0m;
		}
	}

	private sealed record TemplateIdVersion(Guid Id, int Version);
	private sealed record TemplateScoreInfo(string? ScoringMethod, string? ScoringRules);
}

// DTOs for service layer
public sealed class CreatePromTemplateDto
{
	public string Key { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public string SchemaJson { get; set; } = "{}"; // JSON string
	public string? ScoringMethod { get; set; }
	public string? ScoringRules { get; set; } // JSON string
	public bool IsActive { get; set; } = true;
	public int? Version { get; set; }
}

public sealed class PromTemplateDto
{
	public Guid Id { get; set; }
	public string Key { get; set; } = string.Empty;
	public int Version { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public DateTime CreatedAt { get; set; }
}

public sealed class PromTemplateSummaryDto
{
	public Guid Id { get; set; }
	public string Key { get; set; } = string.Empty;
	public int Version { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public DateTime CreatedAt { get; set; }
}

public sealed class SchedulePromRequest
{
	public string TemplateKey { get; set; } = string.Empty;
	public int? Version { get; set; }
	public Guid PatientId { get; set; }
	public DateTime ScheduledFor { get; set; }
	public DateTime? DueAt { get; set; }
}

public sealed class PromInstanceDto
{
	public Guid Id { get; set; }
	public Guid TemplateId { get; set; }
	public Guid PatientId { get; set; }
	public string Status { get; set; } = string.Empty;
	public DateTime ScheduledFor { get; set; }
	public DateTime? CompletedAt { get; set; }
	public DateTime? DueAt { get; set; }
	public string? AnswersJson { get; set; }
	public decimal? Score { get; set; }
	public DateTime CreatedAt { get; set; }
}

public sealed class SubmitAnswersResult
{
	public decimal Score { get; set; }
	public DateTime CompletedAt { get; set; }
}