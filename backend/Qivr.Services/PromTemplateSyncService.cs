using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.DTOs;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

/// <summary>
/// Service for syncing PROM template data from JSON to normalized tables.
/// Automatically populates template_questions and summary_score_definitions
/// from the Questions and ScoringRules JSON when templates are created/updated.
/// </summary>
public interface IPromTemplateSyncService
{
    /// <summary>
    /// Sync questions from JSON to the template_questions table
    /// </summary>
    Task SyncQuestionsAsync(Guid templateId);

    /// <summary>
    /// Sync scoring definitions from JSON to the summary_score_definitions table
    /// </summary>
    Task SyncScoreDefinitionsAsync(Guid templateId);

    /// <summary>
    /// Full sync: questions + score definitions
    /// </summary>
    Task SyncTemplateAsync(Guid templateId);

    /// <summary>
    /// Get enhanced template with all normalized data
    /// </summary>
    Task<EnhancedPromTemplateDto?> GetEnhancedTemplateAsync(Guid templateId);
}

public class PromTemplateSyncService : IPromTemplateSyncService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<PromTemplateSyncService> _logger;

    public PromTemplateSyncService(QivrDbContext context, ILogger<PromTemplateSyncService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SyncTemplateAsync(Guid templateId)
    {
        await SyncQuestionsAsync(templateId);
        await SyncScoreDefinitionsAsync(templateId);
    }

    public async Task SyncQuestionsAsync(Guid templateId)
    {
        var template = await _context.PromTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null)
        {
            _logger.LogWarning("Template {TemplateId} not found for sync", templateId);
            return;
        }

        if (template.Questions == null || !template.Questions.Any())
        {
            _logger.LogInformation("Template {TemplateId} has no questions to sync", templateId);
            return;
        }

        // Get existing questions for this template
        var existingQuestions = await _context.TemplateQuestions
            .Where(q => q.TemplateId == templateId)
            .ToDictionaryAsync(q => q.QuestionKey);

        var processedKeys = new HashSet<string>();
        int orderIndex = 0;

        foreach (var questionJson in template.Questions)
        {
            try
            {
                var questionKey = ExtractQuestionKey(questionJson);
                if (string.IsNullOrEmpty(questionKey))
                {
                    _logger.LogWarning("Question in template {TemplateId} has no valid id/key, skipping", templateId);
                    continue;
                }

                processedKeys.Add(questionKey);

                var templateQuestion = existingQuestions.GetValueOrDefault(questionKey);
                if (templateQuestion == null)
                {
                    templateQuestion = new TemplateQuestion
                    {
                        TemplateId = templateId,
                        QuestionKey = questionKey,
                        TenantId = template.TenantId
                    };
                    _context.TemplateQuestions.Add(templateQuestion);
                }

                // Update fields from JSON
                templateQuestion.Code = ExtractString(questionJson, "code") ?? GenerateQuestionCode(template.Key, orderIndex);
                templateQuestion.Label = ExtractString(questionJson, "label") ?? ExtractString(questionJson, "title") ?? $"Question {orderIndex + 1}";
                templateQuestion.QuestionText = ExtractString(questionJson, "text") ?? ExtractString(questionJson, "question");
                templateQuestion.QuestionType = ParseQuestionType(ExtractString(questionJson, "type"));
                templateQuestion.Section = ExtractString(questionJson, "section") ?? ExtractString(questionJson, "domain") ?? ExtractString(questionJson, "category");
                templateQuestion.OrderIndex = orderIndex;
                templateQuestion.IsScored = ExtractBool(questionJson, "scored") ?? ExtractBool(questionJson, "isScored") ?? true;
                templateQuestion.ScoreWeight = ExtractDecimal(questionJson, "weight") ?? 1.0m;
                templateQuestion.IsRequired = ExtractBool(questionJson, "required") ?? ExtractBool(questionJson, "isRequired") ?? true;
                templateQuestion.MinScore = ExtractDecimal(questionJson, "minScore");
                templateQuestion.MaxScore = ExtractDecimal(questionJson, "maxScore") ?? ExtractMaxScoreFromOptions(questionJson);
                templateQuestion.ConfigJson = questionJson;

                orderIndex++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing question at index {Index} for template {TemplateId}", orderIndex, templateId);
            }
        }

        // Remove questions that no longer exist in JSON
        var keysToRemove = existingQuestions.Keys.Except(processedKeys).ToList();
        foreach (var key in keysToRemove)
        {
            _context.TemplateQuestions.Remove(existingQuestions[key]);
            _logger.LogInformation("Removed question {QuestionKey} from template {TemplateId}", key, templateId);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Synced {Count} questions for template {TemplateId}", processedKeys.Count, templateId);
    }

    public async Task SyncScoreDefinitionsAsync(Guid templateId)
    {
        var template = await _context.PromTemplates
            .Include(t => t.TemplateQuestions)
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null)
        {
            _logger.LogWarning("Template {TemplateId} not found for score sync", templateId);
            return;
        }

        // Get existing definitions
        var existingDefinitions = await _context.SummaryScoreDefinitions
            .Include(d => d.QuestionMappings)
            .Where(d => d.TemplateId == templateId)
            .ToDictionaryAsync(d => d.ScoreKey);

        var processedKeys = new HashSet<string>();

        // Try to extract score definitions from ScoringRules JSON
        var scoreDefinitions = ParseScoreDefinitions(template.ScoringRules, template.Key);

        // If no definitions in JSON, create a default "total" score
        if (!scoreDefinitions.Any())
        {
            scoreDefinitions.Add(new SummaryScoreDefinitionDto
            {
                ScoreKey = "total",
                Label = "Total Score",
                ScoringMethod = ScoringMethodType.Sum,
                RangeMin = 0,
                RangeMax = template.TemplateQuestions.Count * 5, // Assume 0-5 per question
                HigherIsBetter = false,
                IsPrimary = true,
                OrderIndex = 0
            });
        }

        int orderIndex = 0;
        foreach (var defDto in scoreDefinitions)
        {
            processedKeys.Add(defDto.ScoreKey);

            var definition = existingDefinitions.GetValueOrDefault(defDto.ScoreKey);
            if (definition == null)
            {
                definition = new SummaryScoreDefinition
                {
                    TemplateId = templateId,
                    ScoreKey = defDto.ScoreKey,
                    TenantId = template.TenantId
                };
                _context.SummaryScoreDefinitions.Add(definition);
            }

            definition.Label = defDto.Label;
            definition.Description = defDto.Description;
            definition.ScoringMethod = defDto.ScoringMethod;
            definition.RangeMin = defDto.RangeMin;
            definition.RangeMax = defDto.RangeMax;
            definition.HigherIsBetter = defDto.HigherIsBetter;
            definition.PopulationMean = defDto.PopulationMean;
            definition.PopulationStdDev = defDto.PopulationStdDev;
            definition.MCID = defDto.MCID;
            definition.IsPrimary = defDto.IsPrimary;
            definition.OrderIndex = orderIndex++;

            // Map interpretation bands
            if (defDto.InterpretationBands?.Any() == true)
            {
                definition.InterpretationBands = defDto.InterpretationBands
                    .Select(b => new InterpretationBand
                    {
                        Min = b.Min,
                        Max = b.Max,
                        Label = b.Label,
                        Severity = b.Severity,
                        Color = b.Color
                    })
                    .ToList();
            }

            // Map questions if specified
            if (defDto.QuestionIds?.Any() == true)
            {
                // Clear existing mappings
                foreach (var mapping in definition.QuestionMappings.ToList())
                {
                    _context.SummaryScoreQuestionMappings.Remove(mapping);
                }

                foreach (var questionId in defDto.QuestionIds)
                {
                    var question = template.TemplateQuestions.FirstOrDefault(q => q.Id == questionId);
                    if (question != null)
                    {
                        _context.SummaryScoreQuestionMappings.Add(new SummaryScoreQuestionMapping
                        {
                            SummaryScoreDefinitionId = definition.Id,
                            TemplateQuestionId = question.Id,
                            Weight = 1.0m
                        });
                    }
                }
            }
            else if (defDto.ScoreKey == "total" || defDto.IsPrimary)
            {
                // Map all scored questions to the total/primary score
                foreach (var question in template.TemplateQuestions.Where(q => q.IsScored))
                {
                    var existingMapping = definition.QuestionMappings
                        .FirstOrDefault(m => m.TemplateQuestionId == question.Id);

                    if (existingMapping == null)
                    {
                        _context.SummaryScoreQuestionMappings.Add(new SummaryScoreQuestionMapping
                        {
                            SummaryScoreDefinitionId = definition.Id,
                            TemplateQuestionId = question.Id,
                            Weight = question.ScoreWeight
                        });
                    }
                }
            }
        }

        // Remove definitions that no longer exist
        var keysToRemove = existingDefinitions.Keys.Except(processedKeys).ToList();
        foreach (var key in keysToRemove)
        {
            _context.SummaryScoreDefinitions.Remove(existingDefinitions[key]);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Synced {Count} score definitions for template {TemplateId}", processedKeys.Count, templateId);
    }

    public async Task<EnhancedPromTemplateDto?> GetEnhancedTemplateAsync(Guid templateId)
    {
        var template = await _context.PromTemplates
            .Include(t => t.Instrument)
            .Include(t => t.TemplateQuestions.OrderBy(q => q.OrderIndex))
            .Include(t => t.SummaryScoreDefinitions.OrderBy(d => d.OrderIndex))
                .ThenInclude(d => d.QuestionMappings)
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null) return null;

        return new EnhancedPromTemplateDto
        {
            Id = template.Id,
            Key = template.Key,
            Version = template.Version,
            Name = template.Name,
            Description = template.Description,
            Category = template.Category,
            Frequency = template.Frequency,
            Status = template.Status.ToString(),
            InstrumentId = template.InstrumentId,
            Instrument = template.Instrument != null ? new InstrumentSummaryDto
            {
                Id = template.Instrument.Id,
                Key = template.Instrument.Key,
                Name = template.Instrument.Name,
                ClinicalDomain = template.Instrument.ClinicalDomain,
                LicenseType = template.Instrument.LicenseType.ToString()
            } : null,
            SchemaVersion = template.SchemaVersion,
            Tags = template.Tags,
            FrequencyHint = template.FrequencyHint,
            Questions = template.Questions,
            NormalizedQuestions = template.TemplateQuestions.Select(q => new TemplateQuestionDto
            {
                Id = q.Id,
                TemplateId = q.TemplateId,
                QuestionKey = q.QuestionKey,
                Code = q.Code,
                Label = q.Label,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType.ToString(),
                Section = q.Section,
                OrderIndex = q.OrderIndex,
                IsScored = q.IsScored,
                ScoreWeight = q.ScoreWeight,
                IsRequired = q.IsRequired,
                MinScore = q.MinScore,
                MaxScore = q.MaxScore,
                ConfigJson = q.ConfigJson
            }).ToList(),
            ScoreDefinitions = template.SummaryScoreDefinitions.Select(d => new SummaryScoreDefinitionDto
            {
                Id = d.Id,
                ScoreKey = d.ScoreKey,
                Label = d.Label,
                Description = d.Description,
                ScoringMethod = d.ScoringMethod,
                RangeMin = d.RangeMin,
                RangeMax = d.RangeMax,
                HigherIsBetter = d.HigherIsBetter,
                PopulationMean = d.PopulationMean,
                PopulationStdDev = d.PopulationStdDev,
                MCID = d.MCID,
                OrderIndex = d.OrderIndex,
                IsPrimary = d.IsPrimary,
                InterpretationBands = d.InterpretationBands?.Select(b => new InterpretationBandDto
                {
                    Min = b.Min,
                    Max = b.Max,
                    Label = b.Label,
                    Severity = b.Severity,
                    Color = b.Color
                }).ToList(),
                QuestionIds = d.QuestionMappings.Select(m => m.TemplateQuestionId).ToList()
            }).ToList(),
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }

    #region Private Helpers

    private string? ExtractQuestionKey(Dictionary<string, object> json)
    {
        // Try various common key names for question ID
        var possibleKeys = new[] { "id", "questionId", "key", "questionKey", "uid" };

        foreach (var key in possibleKeys)
        {
            if (json.TryGetValue(key, out var value) && value != null)
            {
                var strValue = value.ToString();
                if (!string.IsNullOrEmpty(strValue))
                    return strValue;
            }
        }

        return null;
    }

    private string? ExtractString(Dictionary<string, object> json, string key)
    {
        if (json.TryGetValue(key, out var value) && value != null)
        {
            return value.ToString();
        }
        return null;
    }

    private bool? ExtractBool(Dictionary<string, object> json, string key)
    {
        if (json.TryGetValue(key, out var value))
        {
            if (value is bool b) return b;
            if (value is JsonElement je && je.ValueKind == JsonValueKind.True) return true;
            if (value is JsonElement je2 && je2.ValueKind == JsonValueKind.False) return false;
            if (bool.TryParse(value?.ToString(), out var parsed)) return parsed;
        }
        return null;
    }

    private decimal? ExtractDecimal(Dictionary<string, object> json, string key)
    {
        if (json.TryGetValue(key, out var value))
        {
            if (value is decimal d) return d;
            if (value is double dbl) return (decimal)dbl;
            if (value is int i) return i;
            if (value is JsonElement je && je.TryGetDecimal(out var jd)) return jd;
            if (decimal.TryParse(value?.ToString(), out var parsed)) return parsed;
        }
        return null;
    }

    private decimal? ExtractMaxScoreFromOptions(Dictionary<string, object> json)
    {
        if (!json.TryGetValue("options", out var optionsObj)) return null;

        try
        {
            var options = optionsObj switch
            {
                JsonElement je when je.ValueKind == JsonValueKind.Array =>
                    je.EnumerateArray().Select(ParseOptionScore).Max(),
                IEnumerable<object> list => list.Select(ParseOptionScoreFromObject).Max(),
                _ => null
            };
            return options;
        }
        catch
        {
            return null;
        }
    }

    private decimal? ParseOptionScore(JsonElement element)
    {
        if (element.TryGetProperty("score", out var score) && score.TryGetDecimal(out var d)) return d;
        if (element.TryGetProperty("value", out var value) && value.TryGetDecimal(out var v)) return v;
        return null;
    }

    private decimal? ParseOptionScoreFromObject(object obj)
    {
        if (obj is Dictionary<string, object> dict)
        {
            return ExtractDecimal(dict, "score") ?? ExtractDecimal(dict, "value");
        }
        return null;
    }

    private QuestionType ParseQuestionType(string? typeStr)
    {
        if (string.IsNullOrEmpty(typeStr)) return QuestionType.SingleSelect;

        return typeStr.ToLower() switch
        {
            "radio" or "single-select" or "singleselect" or "single" => QuestionType.SingleSelect,
            "checkbox" or "multi-select" or "multiselect" or "multiple" => QuestionType.MultiSelect,
            "number" or "numeric" or "integer" => QuestionType.Numeric,
            "scale" or "likert" => QuestionType.Scale,
            "slider" or "range" => QuestionType.Slider,
            "text" or "textarea" or "freetext" => QuestionType.Text,
            "boolean" or "yesno" or "yes-no" => QuestionType.Boolean,
            "date" => QuestionType.Date,
            "time" => QuestionType.Time,
            "rating" or "stars" => QuestionType.Rating,
            _ => QuestionType.SingleSelect
        };
    }

    private string GenerateQuestionCode(string templateKey, int index)
    {
        return $"{templateKey.ToUpper()}_Q{index + 1}";
    }

    private List<SummaryScoreDefinitionDto> ParseScoreDefinitions(Dictionary<string, object>? scoringRules, string templateKey)
    {
        var definitions = new List<SummaryScoreDefinitionDto>();
        if (scoringRules == null) return definitions;

        try
        {
            // Try to parse "scores" or "subscales" array
            if (scoringRules.TryGetValue("scores", out var scoresObj) ||
                scoringRules.TryGetValue("subscales", out scoresObj) ||
                scoringRules.TryGetValue("domains", out scoresObj))
            {
                if (scoresObj is JsonElement je && je.ValueKind == JsonValueKind.Array)
                {
                    int idx = 0;
                    foreach (var element in je.EnumerateArray())
                    {
                        var def = ParseScoreDefinitionFromJson(element, idx++);
                        if (def != null) definitions.Add(def);
                    }
                }
            }

            // Add interpretation bands for ODI if specified
            if (templateKey.ToLower() == "odi" && !definitions.Any())
            {
                definitions.Add(new SummaryScoreDefinitionDto
                {
                    ScoreKey = "total",
                    Label = "Total Disability Score",
                    ScoringMethod = ScoringMethodType.Percentage,
                    RangeMin = 0,
                    RangeMax = 100,
                    HigherIsBetter = false,
                    MCID = 10,
                    IsPrimary = true,
                    InterpretationBands = new List<InterpretationBandDto>
                    {
                        new() { Min = 0, Max = 20, Label = "Minimal disability", Severity = "minimal" },
                        new() { Min = 21, Max = 40, Label = "Moderate disability", Severity = "moderate" },
                        new() { Min = 41, Max = 60, Label = "Severe disability", Severity = "severe" },
                        new() { Min = 61, Max = 80, Label = "Crippled", Severity = "very_severe" },
                        new() { Min = 81, Max = 100, Label = "Bed-bound/exaggerating", Severity = "extreme" }
                    }
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing score definitions for template {TemplateKey}", templateKey);
        }

        return definitions;
    }

    private SummaryScoreDefinitionDto? ParseScoreDefinitionFromJson(JsonElement element, int index)
    {
        try
        {
            var key = element.TryGetProperty("key", out var k) ? k.GetString() :
                      element.TryGetProperty("id", out var id) ? id.GetString() : $"score_{index}";

            return new SummaryScoreDefinitionDto
            {
                ScoreKey = key ?? $"score_{index}",
                Label = element.TryGetProperty("label", out var label) ? label.GetString() ?? key ?? "" : key ?? "",
                ScoringMethod = ParseScoringMethod(element.TryGetProperty("method", out var method) ? method.GetString() : null),
                RangeMin = element.TryGetProperty("rangeMin", out var rMin) && rMin.TryGetDecimal(out var min) ? min : 0,
                RangeMax = element.TryGetProperty("rangeMax", out var rMax) && rMax.TryGetDecimal(out var max) ? max : 100,
                HigherIsBetter = element.TryGetProperty("higherIsBetter", out var hib) && hib.ValueKind == JsonValueKind.True,
                IsPrimary = element.TryGetProperty("isPrimary", out var ip) && ip.ValueKind == JsonValueKind.True,
                OrderIndex = index
            };
        }
        catch
        {
            return null;
        }
    }

    private ScoringMethodType ParseScoringMethod(string? method)
    {
        if (string.IsNullOrEmpty(method)) return ScoringMethodType.Sum;

        return method.ToLower() switch
        {
            "sum" => ScoringMethodType.Sum,
            "average" or "mean" => ScoringMethodType.Average,
            "percentage" or "percent" => ScoringMethodType.Percentage,
            "tscore" or "t-score" => ScoringMethodType.TScore,
            "zscore" or "z-score" => ScoringMethodType.ZScore,
            "weighted" => ScoringMethodType.Weighted,
            "rasch" or "irt" => ScoringMethodType.Rasch,
            _ => ScoringMethodType.Sum
        };
    }

    #endregion
}
