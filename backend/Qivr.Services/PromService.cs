using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;

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
                        Questions = request.Questions?.Select(q => new Dictionary<string, object>(q)).ToList() ?? new List<Dictionary<string, object>>(),
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
                                CreatedAt = t.CreatedAt
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
                        Questions = template.Questions?.Select(q => new Dictionary<string, object>(q)).ToList() ?? new List<Dictionary<string, object>>(),
                        ScoringMethod = template.ScoringMethod != null ? new Dictionary<string, object>(template.ScoringMethod) : null,
                        ScoringRules = template.ScoringRules != null ? new Dictionary<string, object>(template.ScoringRules) : null,
                        IsActive = template.IsActive,
                        CreatedAt = template.CreatedAt
                };
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
