using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace Qivr.Services;

public interface IPromService
{
	Task<PromTemplateDto> CreateOrVersionTemplateAsync(Guid tenantId, CreatePromTemplateDto request, CancellationToken ct = default);
	Task<PromTemplateDto?> GetTemplateAsync(Guid tenantId, string key, int? version, CancellationToken ct = default);
	Task<IReadOnlyList<PromTemplateSummaryDto>> ListTemplatesAsync(Guid tenantId, int page, int pageSize, CancellationToken ct = default);
	Task<PromTemplateDto?> GetTemplateByIdAsync(Guid tenantId, Guid templateId, CancellationToken ct = default);
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

	public async Task<PromTemplateDto?> GetTemplateByIdAsync(Guid tenantId, Guid templateId, CancellationToken ct = default)
	{
		var result = await _db.Database.SqlQuery<PromTemplateDto>($@"SELECT id, key, version, name, description, created_at
			FROM qivr.prom_templates WHERE tenant_id = {tenantId} AND id = {templateId} LIMIT 1").FirstOrDefaultAsync(ct);
		return result;
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

// PromInstanceDto is defined in PromInstanceService.cs
public sealed class SubmitAnswersResult
{
	public decimal Score { get; set; }
	public DateTime CompletedAt { get; set; }
}
