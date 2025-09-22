using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Collections;
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
                if (string.IsNullOrWhiteSpace(request.Key))
                {
                        throw new ArgumentException("Key is required", nameof(request));
                }

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                        throw new ArgumentException("Name is required", nameof(request));
                }

                if (string.IsNullOrWhiteSpace(request.Category))
                {
                        throw new ArgumentException("Category is required", nameof(request));
                }

                if (string.IsNullOrWhiteSpace(request.Frequency))
                {
                        throw new ArgumentException("Frequency is required", nameof(request));
                }

                if (request.Questions == null || request.Questions.Count == 0)
                {
                        throw new ArgumentException("At least one question is required", nameof(request));
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
                var questions = SanitizeQuestionsForStorage(request.Questions);
                var scoringMethod = request.ScoringMethod != null && request.ScoringMethod.Count > 0
                        ? NormalizeDictionary(request.ScoringMethod)
                        : null;

                if (scoringMethod != null && scoringMethod.TryGetValue("type", out var methodValue))
                {
                        var method = methodValue?.ToString();
                        if (!string.IsNullOrWhiteSpace(method))
                        {
                                scoringMethod["type"] = method!.Trim().ToLowerInvariant();
                        }
                }

                var scoringRules = request.ScoringRules != null && request.ScoringRules.Count > 0
                        ? NormalizeDictionary(request.ScoringRules)
                        : null;

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
                        Questions = questions,
                        ScoringMethod = scoringMethod != null && scoringMethod.Count > 0 ? scoringMethod : null,
                        ScoringRules = scoringRules != null && scoringRules.Count > 0 ? scoringRules : null,
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

                var list = await _db.PromTemplates
                        .AsNoTracking()
                        .Where(t => t.TenantId == tenantId)
                        .OrderBy(t => t.Key)
                        .ThenByDescending(t => t.Version)
                        .Skip(offset)
                        .Take(pageSize)
                        .Select(t => new PromTemplateSummaryDto
                        {
                                Id = t.Id,
                                Key = t.Key,
                                Version = t.Version,
                                Name = t.Name,
                                Description = t.Description,
                                Category = t.Category,
                                Frequency = t.Frequency,
                                IsActive = t.IsActive,
                                CreatedAt = t.CreatedAt,
                                UpdatedAt = t.UpdatedAt
                        })
                        .ToListAsync(ct);

                return list;
        }

        public async Task<PromTemplateDto?> GetTemplateByIdAsync(Guid tenantId, Guid templateId, CancellationToken ct = default)
        {
                var template = await _db.PromTemplates
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == templateId, ct);

                return template == null ? null : MapToDto(template);
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
                        Questions = CloneQuestions(template.Questions),
                        ScoringMethod = CloneDictionary(template.ScoringMethod),
                        ScoringRules = CloneDictionary(template.ScoringRules),
                        IsActive = template.IsActive,
                        CreatedAt = template.CreatedAt,
                        UpdatedAt = template.UpdatedAt
                };
        }

        private static List<Dictionary<string, object>> SanitizeQuestionsForStorage(IEnumerable<Dictionary<string, object>> questions)
        {
                var sanitized = new List<Dictionary<string, object>>();
                var index = 0;

                foreach (var question in questions)
                {
                        if (question == null)
                        {
                                continue;
                        }

                        var normalized = NormalizeDictionary(question);

                        normalized["id"] = ExtractQuestionId(normalized);
                        normalized["order"] = index;
                        normalized["type"] = NormalizeQuestionType(normalized);
                        var text = NormalizeQuestionText(normalized);
                        normalized["text"] = text;
                        normalized["question"] = text;
                        normalized["required"] = normalized.TryGetValue("required", out var requiredValue)
                                ? NormalizeBoolean(requiredValue)
                                : false;

                        if (normalized.TryGetValue("options", out var optionsValue))
                        {
                                normalized["options"] = NormalizeValue(optionsValue) ?? new List<object?>();
                        }

                        sanitized.Add(normalized);
                        index++;
                }

                return sanitized;
        }

        private static List<Dictionary<string, object>> CloneQuestions(IReadOnlyCollection<Dictionary<string, object>>? source)
        {
                if (source == null || source.Count == 0)
                {
                        return new List<Dictionary<string, object>>();
                }

                var cloned = new List<Dictionary<string, object>>(source.Count);
                foreach (var question in source)
                {
                        cloned.Add(NormalizeDictionary(question));
                }

                return cloned;
        }

        private static Dictionary<string, object>? CloneDictionary(Dictionary<string, object>? source)
        {
                if (source == null || source.Count == 0)
                {
                        return null;
                }

                return NormalizeDictionary(source);
        }

        private static Dictionary<string, object> NormalizeDictionary(Dictionary<string, object> source)
        {
                return NormalizeDictionary((IDictionary)source);
        }

        private static Dictionary<string, object> NormalizeDictionary(IDictionary source)
        {
                var normalized = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

                foreach (DictionaryEntry entry in source)
                {
                        if (entry.Key is not string key || string.IsNullOrWhiteSpace(key))
                        {
                                continue;
                        }

                        var value = NormalizeValue(entry.Value);
                        normalized[key] = value ?? null!;
                }

                return normalized;
        }

        private static object? NormalizeValue(object? value)
        {
                if (value == null)
                {
                        return null;
                }

                if (value is JsonElement element)
                {
                        return NormalizeJsonElement(element);
                }

                if (value is IDictionary dictionary)
                {
                        return NormalizeDictionary(dictionary);
                }

                if (value is IEnumerable enumerable && value is not string)
                {
                        var list = new List<object?>();
                        foreach (var item in enumerable)
                        {
                                list.Add(NormalizeValue(item));
                        }

                        return list;
                }

                return value;
        }

        private static object? NormalizeJsonElement(JsonElement element)
        {
                switch (element.ValueKind)
                {
                        case JsonValueKind.String:
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
                                return true;
                        case JsonValueKind.False:
                                return false;
                        case JsonValueKind.Null:
                        case JsonValueKind.Undefined:
                                return null;
                        case JsonValueKind.Object:
                                var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                                foreach (var property in element.EnumerateObject())
                                {
                                        dict[property.Name] = NormalizeJsonElement(property.Value) ?? null!;
                                }

                                return dict;
                        case JsonValueKind.Array:
                                var list = new List<object?>();
                                foreach (var item in element.EnumerateArray())
                                {
                                        list.Add(NormalizeJsonElement(item));
                                }

                                return list;
                        default:
                                return element.GetRawText();
                }
        }

        private static string ExtractQuestionId(Dictionary<string, object> question)
        {
                if (question.TryGetValue("id", out var idValue) && Guid.TryParse(idValue?.ToString(), out var parsed))
                {
                        return parsed.ToString();
                }

                return Guid.NewGuid().ToString();
        }

        private static string NormalizeQuestionType(Dictionary<string, object> question)
        {
                if (question.TryGetValue("type", out var typeValue))
                {
                        var typeString = typeValue?.ToString();
                        if (!string.IsNullOrWhiteSpace(typeString))
                        {
                                return typeString.Trim().ToLowerInvariant();
                        }
                }

                return "text";
        }

        private static string NormalizeQuestionText(Dictionary<string, object> question)
        {
                if (question.TryGetValue("text", out var textValue))
                {
                        var text = textValue?.ToString()?.Trim();
                        if (!string.IsNullOrWhiteSpace(text))
                        {
                                return text!;
                        }
                }

                if (question.TryGetValue("question", out var questionValue))
                {
                        var text = questionValue?.ToString()?.Trim();
                        if (!string.IsNullOrWhiteSpace(text))
                        {
                                return text!;
                        }
                }

                return string.Empty;
        }

        private static bool NormalizeBoolean(object? value)
        {
                if (value == null)
                {
                        return false;
                }

                if (value is bool boolean)
                {
                        return boolean;
                }

                if (value is JsonElement element)
                {
                        return element.ValueKind switch
                        {
                                JsonValueKind.True => true,
                                JsonValueKind.False => false,
                                JsonValueKind.Number when element.TryGetInt32(out var numeric) => numeric != 0,
                                JsonValueKind.String when bool.TryParse(element.GetString(), out var parsed) => parsed,
                                _ => false
                        };
                }

                if (value is string text && bool.TryParse(text, out var parsedBool))
                {
                        return parsedBool;
                }

                if (value is sbyte or byte or short or ushort or int or uint or long or ulong)
                {
                        return Convert.ToInt64(value) != 0;
                }

                if (value is decimal decimalValue)
                {
                        return decimalValue != 0m;
                }

                if (value is double doubleValue)
                {
                        return Math.Abs(doubleValue) > double.Epsilon;
                }

                return false;
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
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
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
