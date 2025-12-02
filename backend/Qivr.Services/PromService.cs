using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Qivr.Services;

public interface IPromService
{
	Task<PromTemplateDto> CreateOrVersionTemplateAsync(Guid tenantId, CreatePromTemplateDto request, CancellationToken ct = default);
	Task<PromTemplateDto?> GetTemplateAsync(Guid tenantId, string key, int? version, CancellationToken ct = default);
	Task<IReadOnlyList<PromTemplateSummaryDto>> ListTemplatesAsync(Guid tenantId, int page, int pageSize, CancellationToken ct = default);
	Task<PromTemplateDto?> GetTemplateByIdAsync(Guid tenantId, Guid templateId, CancellationToken ct = default);
	Task<PromTemplateDto?> UpdateTemplateAsync(Guid tenantId, Guid templateId, UpdatePromTemplateDto request, CancellationToken ct = default);
	Task<bool> DeleteTemplateAsync(Guid tenantId, Guid templateId, CancellationToken ct = default);
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
                if (string.IsNullOrWhiteSpace(request.Category))
                {
                        throw new ArgumentException("Category is required", nameof(request));
                }

                if (string.IsNullOrWhiteSpace(request.Frequency))
                {
                        throw new ArgumentException("Frequency is required", nameof(request));
                }

                var version = request.Version;
                if (!version.HasValue)
                {
                        var latestVersion = await _db.PromTemplates
                                .Where(t => t.TenantId == tenantId && t.Key == request.Key)
                                .Select(t => (int?)t.Version)
                                .OrderByDescending(v => v)
                                .FirstOrDefaultAsync(ct);

                        version = (latestVersion ?? 0) + 1;
                }

                var now = DateTime.UtcNow;

		var normalizedQuestions = NormalizeQuestions(request.Key, request.Questions);

		var template = new PromTemplate
		{
			Id = Guid.NewGuid(),
			TenantId = tenantId,
			Key = request.Key,
			Version = version.Value,
			Name = request.Name,
			Description = request.Description,
			Category = request.Category,
			Frequency = request.Frequency,
			Questions = normalizedQuestions,
			ScoringMethod = request.ScoringMethod != null ? new Dictionary<string, object>(request.ScoringMethod) : null,
			ScoringRules = request.ScoringRules != null ? new Dictionary<string, object>(request.ScoringRules) : null,
			IsActive = request.IsActive,
			CreatedAt = now,
			UpdatedAt = now
                };

                await _db.PromTemplates.AddAsync(template, ct);
                await _db.SaveChangesAsync(ct);

                return MapToDto(template);
        }

        public async Task<PromTemplateDto?> GetTemplateAsync(Guid tenantId, string key, int? version, CancellationToken ct = default)
        {
                var query = _db.PromTemplates
                        .AsNoTracking()
                        .Where(t => t.TenantId == tenantId && t.Key == key);

                if (version.HasValue)
                {
                        query = query.Where(t => t.Version == version.Value);
                }

                var template = await query
                        .OrderByDescending(t => t.Version)
                        .FirstOrDefaultAsync(ct);

                return template == null ? null : MapToDto(template);
        }

	public async Task<IReadOnlyList<PromTemplateSummaryDto>> ListTemplatesAsync(Guid tenantId, int page, int pageSize, CancellationToken ct = default)
	{
		var offset = Math.Max(0, (page - 1) * pageSize);

		var templates = await _db.PromTemplates
			.AsNoTracking()
			.Where(t => t.TenantId == tenantId)
			.OrderBy(t => t.Key)
			.ThenByDescending(t => t.Version)
			.Skip(offset)
			.Take(pageSize)
			.ToListAsync(ct);

		return templates
			.Select(MapToSummaryDto)
			.ToList();
	}

        public async Task<PromTemplateDto?> GetTemplateByIdAsync(Guid tenantId, Guid templateId, CancellationToken ct = default)
        {
		var template = await _db.PromTemplates
			.AsNoTracking()
			.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == templateId, ct);

		return template == null ? null : MapToDto(template);
	}

	public async Task<PromTemplateDto?> UpdateTemplateAsync(Guid tenantId, Guid templateId, UpdatePromTemplateDto request, CancellationToken ct = default)
	{
		var template = await _db.PromTemplates
			.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == templateId, ct);

		if (template == null)
		{
			return null;
		}

		// SECURITY/DATA INTEGRITY: Check if template has been used in any instances
		// If it has, we must create a new version instead of modifying in place
		var hasBeenUsed = await _db.PromInstances
			.AnyAsync(i => i.TemplateId == templateId, ct);

		// Structural changes require versioning if template has been used
		var isStructuralChange = request.Questions != null ||
			request.ScoringMethod != null ||
			request.ScoringRules != null;

		if (hasBeenUsed && isStructuralChange)
		{
			_logger.LogInformation(
				"Template {TemplateId} has been used - creating new version instead of modifying",
				templateId);

			// Create a new version instead of modifying
			var newVersionRequest = new CreatePromTemplateDto
			{
				Key = template.Key, // Same key = triggers versioning in CreateOrVersionTemplateAsync
				Name = request.Name ?? template.Name,
				Description = request.Description ?? template.Description,
				Category = request.Category ?? template.Category,
				Frequency = request.Frequency ?? template.Frequency,
				Questions = request.Questions ?? template.Questions,
				ScoringMethod = request.ScoringMethod ?? template.ScoringMethod,
				ScoringRules = request.ScoringRules ?? template.ScoringRules
			};

			// Deactivate old version
			template.IsActive = false;
			template.UpdatedAt = DateTime.UtcNow;
			await _db.SaveChangesAsync(ct);

			// Create new version
			return await CreateOrVersionTemplateAsync(tenantId, newVersionRequest, ct);
		}

		// Safe to modify in place - either no instances or only metadata changes
		if (!string.IsNullOrWhiteSpace(request.Name)) template.Name = request.Name.Trim();
		if (request.Description != null) template.Description = request.Description;
		if (!string.IsNullOrWhiteSpace(request.Category)) template.Category = request.Category.Trim();
		if (!string.IsNullOrWhiteSpace(request.Frequency)) template.Frequency = request.Frequency.Trim();
		if (request.IsActive.HasValue) template.IsActive = request.IsActive.Value;

		if (request.ScoringMethod != null)
		{
			template.ScoringMethod = new Dictionary<string, object>(request.ScoringMethod);
		}

		if (request.ScoringRules != null)
		{
			template.ScoringRules = new Dictionary<string, object>(request.ScoringRules);
		}

		if (request.Questions != null)
		{
			template.Questions = NormalizeQuestions(template.Key, request.Questions);
		}

		template.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);

		return MapToDto(template);
	}

	public async Task<bool> DeleteTemplateAsync(Guid tenantId, Guid templateId, CancellationToken ct = default)
	{
		var template = await _db.PromTemplates
			.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == templateId, ct);

		if (template == null)
		{
			return false;
		}

		var hasInstances = await _db.PromInstances
			.AnyAsync(i => i.TenantId == tenantId && i.TemplateId == templateId, ct);

		if (hasInstances)
		{
			template.IsActive = false;
			template.UpdatedAt = DateTime.UtcNow;
		}
		else
		{
			_db.PromTemplates.Remove(template);
		}

		await _db.SaveChangesAsync(ct);
		return true;
	}


	private static PromTemplateDto MapToDto(PromTemplate template)
	{
		return new PromTemplateDto
		{
			Id = template.Id,
			Key = template.Key,
			Version = template.Version,
			Name = template.Name,
			Description = template.Description,
			Category = template.Category,
			Frequency = template.Frequency,
			Questions = template.Questions?.Select(q => new Dictionary<string, object>(q)).ToList() ?? new List<Dictionary<string, object>>(),
			ScoringMethod = template.ScoringMethod != null ? new Dictionary<string, object>(template.ScoringMethod) : null,
			ScoringRules = template.ScoringRules != null ? new Dictionary<string, object>(template.ScoringRules) : null,
			IsActive = template.IsActive,
			CreatedAt = template.CreatedAt,
			UpdatedAt = template.UpdatedAt
		};
	}

	private static PromTemplateSummaryDto MapToSummaryDto(PromTemplate template)
	{
		return new PromTemplateSummaryDto
		{
			Id = template.Id,
			Key = template.Key,
			Version = template.Version,
			Name = template.Name,
			Description = template.Description,
			Category = template.Category,
			Frequency = template.Frequency,
			IsActive = template.IsActive,
			Questions = template.Questions?.Select(q => new Dictionary<string, object>(q, StringComparer.OrdinalIgnoreCase)).ToList() ?? new List<Dictionary<string, object>>(),
			CreatedAt = template.CreatedAt,
			UpdatedAt = template.UpdatedAt
		};
	}

	private static List<Dictionary<string, object>> NormalizeQuestions(string templateKey, IEnumerable<Dictionary<string, object>>? questions)
	{
		var result = new List<Dictionary<string, object>>();
		if (questions == null)
		{
			return result;
		}

		var idMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
		var used = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
		var index = 0;

		foreach (var question in questions)
		{
			var rawId = ExtractIdCandidate(question, index);
			var normalizedId = NormalizeQuestionId(templateKey, rawId, index, used);
			if (!idMap.ContainsKey(rawId))
			{
				idMap[rawId] = normalizedId;
			}

			if (!string.Equals(rawId, normalizedId, StringComparison.OrdinalIgnoreCase))
			{
				idMap[normalizedId] = normalizedId;
			}

			if (question.TryGetValue("legacyId", out var legacy) && legacy is string legacyString && !idMap.ContainsKey(legacyString))
			{
				idMap[legacyString] = normalizedId;
			}

			index++;
		}

		index = 0;
		foreach (var question in questions)
		{
			var copy = new Dictionary<string, object>(question, StringComparer.OrdinalIgnoreCase);
			var rawId = ExtractIdCandidate(question, index);
			var normalizedId = idMap.TryGetValue(rawId, out var mapped)
				? mapped
				: NormalizeQuestionId(templateKey, rawId, index, used);
			copy["id"] = normalizedId;

			if (copy.TryGetValue("conditionalLogic", out var logicObj))
			{
				copy["conditionalLogic"] = NormalizeConditionalLogic(templateKey, logicObj, idMap, used);
			}

			result.Add(copy);
			index++;
		}

		return result;
	}

	private static object NormalizeConditionalLogic(string templateKey, object logicObj, IDictionary<string, string> idMap, ISet<string> used)
	{
		switch (logicObj)
		{
			case IDictionary<string, object> dict:
				return NormalizeConditionalLogicDictionary(templateKey, dict, idMap, used);
			case JsonElement element when element.ValueKind == JsonValueKind.Object:
				var extracted = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
				foreach (var property in element.EnumerateObject())
				{
					extracted[property.Name] = ConvertJsonElement(property.Value);
				}
				return NormalizeConditionalLogicDictionary(templateKey, extracted, idMap, used);
			default:
				return logicObj;
		}
	}

	private static IDictionary<string, object> NormalizeConditionalLogicDictionary(string templateKey, IDictionary<string, object> logic, IDictionary<string, string> idMap, ISet<string> used)
	{
		var copy = new Dictionary<string, object>(logic, StringComparer.OrdinalIgnoreCase);
		if (copy.TryGetValue("showIf", out var showIfRaw) && showIfRaw is string showIfId)
		{
			var normalized = idMap.TryGetValue(showIfId, out var mapped)
				? mapped
				: NormalizeQuestionId(templateKey, showIfId, 0, used);
			copy["showIf"] = normalized;
		}

		return copy;
	}

	private static string ExtractIdCandidate(IReadOnlyDictionary<string, object> question, int index)
	{
		if (question.TryGetValue("id", out var idValue) && idValue is string rawId && !string.IsNullOrWhiteSpace(rawId))
		{
			return rawId.Trim();
		}

		if (question.TryGetValue("questionId", out var legacyId) && legacyId is string legacy && !string.IsNullOrWhiteSpace(legacy))
		{
			return legacy.Trim();
		}

		return $"__index_{index}";
	}

	private static string NormalizeQuestionId(string templateKey, string rawId, int index, ISet<string> used)
	{
		if (!string.IsNullOrWhiteSpace(rawId) && Guid.TryParse(rawId, out var parsed))
		{
			var normalized = parsed.ToString();
			if (used.Add(normalized))
			{
				return normalized;
			}
		}

		var baseInput = string.IsNullOrWhiteSpace(rawId)
			? $"{templateKey}:question:{index}"
			: $"{templateKey}:{rawId.Trim().ToLowerInvariant()}";

		var attemptIndex = 0;
		while (true)
		{
			var guid = CreateDeterministicGuid(attemptIndex == 0 ? baseInput : $"{baseInput}:{attemptIndex}");
			var candidate = guid.ToString();
			if (used.Add(candidate))
			{
				return candidate;
			}
			attemptIndex++;
		}
	}

	private static Guid CreateDeterministicGuid(string value)
	{
		using var md5 = System.Security.Cryptography.MD5.Create();
		var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(value));
		return new Guid(hash);
	}

	private static object? ConvertJsonElement(JsonElement element)
	{
		switch (element.ValueKind)
		{
			case JsonValueKind.Object:
				var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
				foreach (var property in element.EnumerateObject())
				{
					dict[property.Name] = ConvertJsonElement(property.Value) ?? string.Empty;
				}
				return dict;
			case JsonValueKind.Array:
				var list = new List<object?>();
				foreach (var item in element.EnumerateArray())
				{
					list.Add(ConvertJsonElement(item));
				}
				return list;
			case JsonValueKind.String:
				if (element.TryGetDateTime(out var dt))
				{
					return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
				}
				return element.GetString() ?? string.Empty;
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
			case JsonValueKind.Null:
			case JsonValueKind.Undefined:
				return null;
			default:
				return element.GetRawText();
		}
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
        public string Category { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public List<Dictionary<string, object>> Questions { get; set; } = new();
        public Dictionary<string, object>? ScoringMethod { get; set; }
        public Dictionary<string, object>? ScoringRules { get; set; }
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
        public string Category { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public List<Dictionary<string, object>> Questions { get; set; } = new();
	public Dictionary<string, object>? ScoringMethod { get; set; }
	public Dictionary<string, object>? ScoringRules { get; set; }
	public bool IsActive { get; set; }
	public DateTime CreatedAt { get; set; }
	public DateTime UpdatedAt { get; set; }
}

public sealed class PromTemplateSummaryDto
{
	public Guid Id { get; set; }
	public string Key { get; set; } = string.Empty;
	public int Version { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public string Category { get; set; } = string.Empty;
	public string Frequency { get; set; } = string.Empty;
	public bool IsActive { get; set; }
	public IReadOnlyList<Dictionary<string, object>> Questions { get; set; } = Array.Empty<Dictionary<string, object>>();
	public DateTime CreatedAt { get; set; }
	public DateTime UpdatedAt { get; set; }
}

public sealed class UpdatePromTemplateDto
{
	public string? Name { get; set; }
	public string? Description { get; set; }
	public string? Category { get; set; }
	public string? Frequency { get; set; }
	public List<Dictionary<string, object>>? Questions { get; set; }
	public Dictionary<string, object>? ScoringMethod { get; set; }
	public Dictionary<string, object>? ScoringRules { get; set; }
	public bool? IsActive { get; set; }
}

public sealed class SchedulePromRequest
{
	public string TemplateKey { get; set; } = string.Empty;
	public int? Version { get; set; }
	public Guid PatientId { get; set; }
	public DateTime ScheduledFor { get; set; }
	public DateTime? DueAt { get; set; }
	public NotificationMethod? NotificationMethod { get; set; }
	public IEnumerable<string>? Tags { get; set; }
	public string? Notes { get; set; }
}

// PromInstanceDto is defined in PromInstanceService.cs
public sealed class SubmitAnswersResult
{
	public decimal Score { get; set; }
	public DateTime CompletedAt { get; set; }
}
