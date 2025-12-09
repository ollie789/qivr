using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.DTOs;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

/// <summary>
/// Service for processing PROM responses and calculating scores using the new normalized infrastructure.
/// Replaces/enhances the existing scoring logic with database-driven definitions.
/// </summary>
public interface IPromResponseScoringService
{
    /// <summary>
    /// Process submitted answers: create item responses and calculate all scores
    /// </summary>
    Task<PromInstanceScoreSummaryDto> ProcessSubmissionAsync(Guid instanceId, Dictionary<string, object> answers);

    /// <summary>
    /// Get all scores for a PROM instance
    /// </summary>
    Task<PromInstanceScoreSummaryDto?> GetInstanceScoresAsync(Guid instanceId);

    /// <summary>
    /// Get item-level responses for a PROM instance
    /// </summary>
    Task<List<PromItemResponseDto>> GetItemResponsesAsync(Guid instanceId);

    /// <summary>
    /// Recalculate scores for an instance (useful after template score definition changes)
    /// </summary>
    Task RecalculateScoresAsync(Guid instanceId);
}

public class PromResponseScoringService : IPromResponseScoringService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<PromResponseScoringService> _logger;

    public PromResponseScoringService(QivrDbContext context, ILogger<PromResponseScoringService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PromInstanceScoreSummaryDto> ProcessSubmissionAsync(Guid instanceId, Dictionary<string, object> answers)
    {
        var instance = await _context.PromInstances
            .Include(i => i.Template)
                .ThenInclude(t => t!.TemplateQuestions)
            .Include(i => i.Template)
                .ThenInclude(t => t!.SummaryScoreDefinitions)
                    .ThenInclude(d => d.QuestionMappings)
            .FirstOrDefaultAsync(i => i.Id == instanceId);

        if (instance == null)
            throw new ArgumentException($"PROM instance {instanceId} not found");

        if (instance.Template == null)
            throw new InvalidOperationException($"PROM instance {instanceId} has no template");

        // 1. Create item responses
        await CreateItemResponsesAsync(instance, answers);

        // 2. Calculate and store summary scores
        await CalculateAndStoreSummaryScoresAsync(instance);

        // 3. Return summary
        return await GetInstanceScoresAsync(instanceId)
            ?? throw new InvalidOperationException("Failed to retrieve scores after processing");
    }

    private async Task CreateItemResponsesAsync(PromInstance instance, Dictionary<string, object> answers)
    {
        var template = instance.Template!;
        var questionsByKey = template.TemplateQuestions.ToDictionary(q => q.QuestionKey);

        // Clear existing item responses
        var existingResponses = await _context.PromItemResponses
            .Where(r => r.InstanceId == instance.Id)
            .ToListAsync();
        _context.PromItemResponses.RemoveRange(existingResponses);

        foreach (var (questionKey, answer) in answers)
        {
            if (!questionsByKey.TryGetValue(questionKey, out var question))
            {
                _logger.LogWarning("Answer for unknown question {QuestionKey} in instance {InstanceId}", questionKey, instance.Id);
                continue;
            }

            var itemResponse = new PromItemResponse
            {
                InstanceId = instance.Id,
                TemplateQuestionId = question.Id,
                QuestionCode = question.Code,
                TenantId = instance.TenantId
            };

            // Parse the answer based on question type
            ParseAndSetResponseValue(itemResponse, answer, question);

            _context.PromItemResponses.Add(itemResponse);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Created {Count} item responses for instance {InstanceId}", answers.Count, instance.Id);
    }

    private void ParseAndSetResponseValue(PromItemResponse response, object answer, TemplateQuestion question)
    {
        if (answer == null)
        {
            response.IsSkipped = true;
            return;
        }

        var answerStr = answer.ToString();
        response.ValueRaw = answerStr;

        // Try to extract numeric value
        if (answer is JsonElement je)
        {
            if (je.ValueKind == JsonValueKind.Number && je.TryGetDecimal(out var numValue))
            {
                response.ValueNumeric = numValue;
                response.ValueDisplay = numValue.ToString();
            }
            else if (je.ValueKind == JsonValueKind.String)
            {
                response.ValueRaw = je.GetString();
                TryExtractNumericFromOption(response, question);
            }
            else if (je.ValueKind == JsonValueKind.Array)
            {
                // Multi-select
                response.MultiSelectValues = je.EnumerateArray()
                    .Select(e => e.ToString())
                    .ToList();
                response.ValueRaw = string.Join(",", response.MultiSelectValues);
                response.ValueNumeric = CalculateMultiSelectScore(response.MultiSelectValues, question);
            }
        }
        else if (answer is decimal dec)
        {
            response.ValueNumeric = dec;
            response.ValueDisplay = dec.ToString();
        }
        else if (answer is int intVal)
        {
            response.ValueNumeric = intVal;
            response.ValueDisplay = intVal.ToString();
        }
        else if (answer is IEnumerable<object> list)
        {
            response.MultiSelectValues = list.Select(o => o?.ToString() ?? "").ToList();
            response.ValueRaw = string.Join(",", response.MultiSelectValues);
            response.ValueNumeric = CalculateMultiSelectScore(response.MultiSelectValues, question);
        }
        else
        {
            // String value - try to find matching option score
            TryExtractNumericFromOption(response, question);
        }
    }

    private void TryExtractNumericFromOption(PromItemResponse response, TemplateQuestion question)
    {
        if (question.ConfigJson == null || response.ValueRaw == null) return;

        try
        {
            if (question.ConfigJson.TryGetValue("options", out var optionsObj))
            {
                var options = optionsObj switch
                {
                    JsonElement je when je.ValueKind == JsonValueKind.Array => je.EnumerateArray().ToList(),
                    _ => null
                };

                if (options != null)
                {
                    foreach (var option in options)
                    {
                        var optionValue = option.TryGetProperty("value", out var v) ? v.GetString() : null;
                        var optionLabel = option.TryGetProperty("label", out var l) ? l.GetString() : null;

                        if (optionValue == response.ValueRaw || optionLabel == response.ValueRaw)
                        {
                            response.ValueDisplay = optionLabel ?? optionValue;

                            if (option.TryGetProperty("score", out var score) && score.TryGetDecimal(out var scoreValue))
                            {
                                response.ValueNumeric = scoreValue;
                            }
                            else if (int.TryParse(optionValue, out var intScore))
                            {
                                response.ValueNumeric = intScore;
                            }
                            break;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extracting numeric value from option for question {QuestionId}", question.Id);
        }
    }

    private decimal? CalculateMultiSelectScore(List<string>? values, TemplateQuestion question)
    {
        if (values == null || !values.Any()) return null;
        if (question.ConfigJson == null) return values.Count; // Default to count

        try
        {
            decimal total = 0;

            if (question.ConfigJson.TryGetValue("options", out var optionsObj) &&
                optionsObj is JsonElement je && je.ValueKind == JsonValueKind.Array)
            {
                foreach (var option in je.EnumerateArray())
                {
                    var optionValue = option.TryGetProperty("value", out var v) ? v.GetString() : null;
                    if (optionValue != null && values.Contains(optionValue))
                    {
                        if (option.TryGetProperty("score", out var score) && score.TryGetDecimal(out var scoreValue))
                        {
                            total += scoreValue;
                        }
                        else
                        {
                            total += 1; // Default weight
                        }
                    }
                }
            }

            return total;
        }
        catch
        {
            return values.Count;
        }
    }

    private async Task CalculateAndStoreSummaryScoresAsync(PromInstance instance)
    {
        var template = instance.Template!;

        // Clear existing summary scores
        var existingScores = await _context.PromSummaryScores
            .Where(s => s.InstanceId == instance.Id)
            .ToListAsync();
        _context.PromSummaryScores.RemoveRange(existingScores);

        // Get item responses
        var itemResponses = await _context.PromItemResponses
            .Where(r => r.InstanceId == instance.Id)
            .ToListAsync();

        var responsesByQuestionId = itemResponses.ToDictionary(r => r.TemplateQuestionId);

        // Calculate score for each definition
        foreach (var definition in template.SummaryScoreDefinitions.OrderBy(d => d.OrderIndex))
        {
            var summaryScore = await CalculateSummaryScoreAsync(instance, definition, responsesByQuestionId);
            _context.PromSummaryScores.Add(summaryScore);
        }

        // If no definitions exist, create a basic total score
        if (!template.SummaryScoreDefinitions.Any())
        {
            var basicScore = CalculateBasicTotalScore(instance, itemResponses);
            _context.PromSummaryScores.Add(basicScore);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Calculated {Count} summary scores for instance {InstanceId}",
            template.SummaryScoreDefinitions.Count, instance.Id);
    }

    private async Task<PromSummaryScore> CalculateSummaryScoreAsync(
        PromInstance instance,
        SummaryScoreDefinition definition,
        Dictionary<Guid, PromItemResponse> responsesByQuestionId)
    {
        var summaryScore = new PromSummaryScore
        {
            InstanceId = instance.Id,
            DefinitionId = definition.Id,
            ScoreKey = definition.ScoreKey,
            Label = definition.Label,
            RangeMin = definition.RangeMin,
            RangeMax = definition.RangeMax,
            HigherIsBetter = definition.HigherIsBetter,
            TenantId = instance.TenantId
        };

        // Get relevant responses based on question mappings
        var relevantResponses = definition.QuestionMappings
            .Where(m => responsesByQuestionId.ContainsKey(m.TemplateQuestionId))
            .Select(m => new
            {
                Response = responsesByQuestionId[m.TemplateQuestionId],
                Mapping = m
            })
            .ToList();

        summaryScore.ItemCount = relevantResponses.Count;
        summaryScore.MissingItemCount = definition.QuestionMappings.Count - relevantResponses.Count;

        if (!relevantResponses.Any())
        {
            summaryScore.Value = 0;
            summaryScore.InterpretationBand = "No data";
            return summaryScore;
        }

        // Calculate raw score based on method
        decimal rawScore = 0;
        decimal totalWeight = 0;

        foreach (var item in relevantResponses)
        {
            if (item.Response.ValueNumeric.HasValue && !item.Response.IsSkipped)
            {
                var value = item.Response.ValueNumeric.Value;

                // Apply reverse scoring if needed
                if (item.Mapping.IsReverseScored)
                {
                    var question = await _context.TemplateQuestions.FindAsync(item.Mapping.TemplateQuestionId);
                    if (question?.MaxScore != null && question?.MinScore != null)
                    {
                        value = question.MaxScore.Value - value + question.MinScore.Value;
                    }
                }

                rawScore += value * item.Mapping.Weight;
                totalWeight += item.Mapping.Weight;
            }
        }

        summaryScore.RawValue = rawScore;

        // Calculate final score based on method
        summaryScore.Value = definition.ScoringMethod switch
        {
            ScoringMethodType.Sum => rawScore,
            ScoringMethodType.Average => totalWeight > 0 ? rawScore / totalWeight : 0,
            ScoringMethodType.Percentage => CalculatePercentageScore(rawScore, definition, relevantResponses.Count),
            ScoringMethodType.TScore => CalculateTScore(rawScore, definition),
            ScoringMethodType.ZScore => CalculateZScore(rawScore, definition),
            ScoringMethodType.Weighted => totalWeight > 0 ? rawScore / totalWeight : 0,
            _ => rawScore
        };

        // Round to 2 decimal places
        summaryScore.Value = Math.Round(summaryScore.Value, 2);

        // Check floor/ceiling effects
        summaryScore.HasFloorEffect = summaryScore.Value <= definition.RangeMin + (definition.RangeMax - definition.RangeMin) * 0.1m;
        summaryScore.HasCeilingEffect = summaryScore.Value >= definition.RangeMax - (definition.RangeMax - definition.RangeMin) * 0.1m;

        // Determine interpretation band
        if (definition.InterpretationBands?.Any() == true)
        {
            var band = definition.InterpretationBands
                .FirstOrDefault(b => summaryScore.Value >= b.Min && summaryScore.Value <= b.Max);

            if (band != null)
            {
                summaryScore.InterpretationBand = band.Label;
                summaryScore.Severity = band.Severity;
            }
        }

        return summaryScore;
    }

    private decimal CalculatePercentageScore(decimal rawScore, SummaryScoreDefinition definition, int itemCount)
    {
        // Assume each item has max score of 5 if not specified
        var maxPossible = definition.RangeMax > 0 ? definition.RangeMax : itemCount * 5;
        var minPossible = definition.RangeMin;

        if (maxPossible == minPossible) return 0;

        return ((rawScore - minPossible) / (maxPossible - minPossible)) * 100;
    }

    private decimal CalculateTScore(decimal rawScore, SummaryScoreDefinition definition)
    {
        if (!definition.PopulationMean.HasValue || !definition.PopulationStdDev.HasValue || definition.PopulationStdDev == 0)
            return rawScore;

        var zScore = (rawScore - definition.PopulationMean.Value) / definition.PopulationStdDev.Value;
        return 50 + (zScore * 10);
    }

    private decimal CalculateZScore(decimal rawScore, SummaryScoreDefinition definition)
    {
        if (!definition.PopulationMean.HasValue || !definition.PopulationStdDev.HasValue || definition.PopulationStdDev == 0)
            return 0;

        return (rawScore - definition.PopulationMean.Value) / definition.PopulationStdDev.Value;
    }

    private PromSummaryScore CalculateBasicTotalScore(PromInstance instance, List<PromItemResponse> itemResponses)
    {
        var scoredResponses = itemResponses.Where(r => r.ValueNumeric.HasValue && !r.IsSkipped).ToList();
        var totalScore = scoredResponses.Sum(r => r.ValueNumeric ?? 0);

        return new PromSummaryScore
        {
            InstanceId = instance.Id,
            ScoreKey = "total",
            Label = "Total Score",
            Value = totalScore,
            RawValue = totalScore,
            ItemCount = scoredResponses.Count,
            MissingItemCount = itemResponses.Count - scoredResponses.Count,
            TenantId = instance.TenantId
        };
    }

    public async Task<PromInstanceScoreSummaryDto?> GetInstanceScoresAsync(Guid instanceId)
    {
        var instance = await _context.PromInstances
            .Include(i => i.Template)
            .Include(i => i.SummaryScores.OrderBy(s => s.ScoreKey == "total" ? 0 : 1))
            .FirstOrDefaultAsync(i => i.Id == instanceId);

        if (instance == null) return null;

        var primaryScore = instance.SummaryScores.FirstOrDefault(s => s.ScoreKey == "total")
            ?? instance.SummaryScores.FirstOrDefault();

        return new PromInstanceScoreSummaryDto
        {
            InstanceId = instance.Id,
            TemplateId = instance.TemplateId,
            TemplateKey = instance.Template?.Key ?? "",
            TemplateName = instance.Template?.Name ?? "",
            CompletedAt = instance.CompletedAt,
            PrimaryScore = primaryScore != null ? MapToDto(primaryScore) : null,
            AllScores = instance.SummaryScores.Select(MapToDto).ToList()
        };
    }

    public async Task<List<PromItemResponseDto>> GetItemResponsesAsync(Guid instanceId)
    {
        var responses = await _context.PromItemResponses
            .Include(r => r.TemplateQuestion)
            .Where(r => r.InstanceId == instanceId)
            .OrderBy(r => r.TemplateQuestion!.OrderIndex)
            .ToListAsync();

        return responses.Select(r => new PromItemResponseDto
        {
            Id = r.Id,
            InstanceId = r.InstanceId,
            TemplateQuestionId = r.TemplateQuestionId,
            QuestionCode = r.QuestionCode,
            QuestionLabel = r.TemplateQuestion?.Label,
            ValueRaw = r.ValueRaw,
            ValueNumeric = r.ValueNumeric,
            ValueDisplay = r.ValueDisplay,
            MultiSelectValues = r.MultiSelectValues,
            IsSkipped = r.IsSkipped,
            ResponseTimeSeconds = r.ResponseTimeSeconds,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task RecalculateScoresAsync(Guid instanceId)
    {
        var instance = await _context.PromInstances
            .Include(i => i.Template)
                .ThenInclude(t => t!.SummaryScoreDefinitions)
                    .ThenInclude(d => d.QuestionMappings)
            .FirstOrDefaultAsync(i => i.Id == instanceId);

        if (instance?.Template == null)
        {
            _logger.LogWarning("Cannot recalculate scores for instance {InstanceId} - not found", instanceId);
            return;
        }

        await CalculateAndStoreSummaryScoresAsync(instance);
        _logger.LogInformation("Recalculated scores for instance {InstanceId}", instanceId);
    }

    private static PromSummaryScoreDto MapToDto(PromSummaryScore score)
    {
        return new PromSummaryScoreDto
        {
            Id = score.Id,
            InstanceId = score.InstanceId,
            DefinitionId = score.DefinitionId,
            ScoreKey = score.ScoreKey,
            Label = score.Label,
            Value = score.Value,
            RawValue = score.RawValue,
            RangeMin = score.RangeMin,
            RangeMax = score.RangeMax,
            HigherIsBetter = score.HigherIsBetter,
            InterpretationBand = score.InterpretationBand,
            Severity = score.Severity,
            ItemCount = score.ItemCount,
            MissingItemCount = score.MissingItemCount,
            ConfidenceIntervalLower = score.ConfidenceIntervalLower,
            ConfidenceIntervalUpper = score.ConfidenceIntervalUpper,
            HasFloorEffect = score.HasFloorEffect,
            HasCeilingEffect = score.HasCeilingEffect,
            CreatedAt = score.CreatedAt
        };
    }
}
