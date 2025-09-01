using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;

namespace Qivr.Services.Fhir;

public interface IFhirExportService
{
    string ExportPromTemplateToFhir(FhirPromTemplate template);
    string ExportPromResponseToFhir(FhirPromInstance instance, List<FhirPromResponse> responses);
    FhirQuestionnaire ImportFhirQuestionnaire(string fhirJson);
}

public class FhirExportService : IFhirExportService
{
    private readonly ILogger<FhirExportService> _logger;

    public FhirExportService(ILogger<FhirExportService> logger)
    {
        _logger = logger;
    }

    public string ExportPromTemplateToFhir(FhirPromTemplate template)
    {
        var questionnaire = new FhirQuestionnaire
        {
            ResourceType = "Questionnaire",
            Id = template.Id.ToString(),
            Url = $"https://qivr.health/questionnaires/{template.Key}",
            Version = template.Version.ToString(),
            Name = template.Key,
            Title = template.Name,
            Status = "active",
            Date = template.CreatedAt.ToString("yyyy-MM-dd"),
            Description = template.Description,
            Item = ConvertSchemaToFhirItems(template.Schema)
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        return JsonSerializer.Serialize(questionnaire, options);
    }

    public string ExportPromResponseToFhir(FhirPromInstance instance, List<FhirPromResponse> responses)
    {
        var questionnaireResponse = new FhirQuestionnaireResponse
        {
            ResourceType = "QuestionnaireResponse",
            Id = instance.Id.ToString(),
            Questionnaire = $"https://qivr.health/questionnaires/{instance.PromTemplateId}",
            Status = instance.Status switch
            {
                "completed" => "completed",
                "in_progress" => "in-progress",
                _ => "stopped"
            },
            Authored = instance.CompletedAt?.ToString("yyyy-MM-dd'T'HH:mm:ssK") ?? 
                      instance.CreatedAt.ToString("yyyy-MM-dd'T'HH:mm:ssK"),
            Subject = new FhirReference
            {
                Reference = $"Patient/{instance.PatientId}",
                Display = "Patient"
            },
            Item = ConvertResponsesToFhirItems(responses)
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        return JsonSerializer.Serialize(questionnaireResponse, options);
    }

    public FhirQuestionnaire ImportFhirQuestionnaire(string fhirJson)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<FhirQuestionnaire>(fhirJson, options) 
            ?? throw new InvalidOperationException("Failed to parse FHIR Questionnaire");
    }

    private List<FhirQuestionnaireItem> ConvertSchemaToFhirItems(JsonDocument schema)
    {
        var items = new List<FhirQuestionnaireItem>();
        
        if (schema.RootElement.TryGetProperty("questions", out var questions))
        {
            foreach (var question in questions.EnumerateArray())
            {
                var item = new FhirQuestionnaireItem
                {
                    LinkId = question.GetProperty("id").GetString(),
                    Text = question.GetProperty("text").GetString(),
                    Type = MapQuestionTypeToFhir(question.GetProperty("type").GetString()),
                    Required = question.TryGetProperty("required", out var req) && req.GetBoolean()
                };

                // Add answer options if present
                if (question.TryGetProperty("options", out var options))
                {
                    item.AnswerOption = new List<FhirAnswerOption>();
                    foreach (var option in options.EnumerateArray())
                    {
                        item.AnswerOption.Add(new FhirAnswerOption
                        {
                            ValueCoding = new FhirCoding
                            {
                                Code = option.GetProperty("value").GetString(),
                                Display = option.GetProperty("label").GetString()
                            }
                        });
                    }
                }

                // Handle nested items (for groups)
                if (question.TryGetProperty("items", out var nestedItems))
                {
                    item.Item = ConvertNestedItems(nestedItems);
                }

                items.Add(item);
            }
        }

        return items;
    }

    private List<FhirQuestionnaireItem> ConvertNestedItems(JsonElement nestedItems)
    {
        var items = new List<FhirQuestionnaireItem>();
        
        foreach (var nested in nestedItems.EnumerateArray())
        {
            var item = new FhirQuestionnaireItem
            {
                LinkId = nested.GetProperty("id").GetString(),
                Text = nested.GetProperty("text").GetString(),
                Type = MapQuestionTypeToFhir(nested.GetProperty("type").GetString()),
                Required = nested.TryGetProperty("required", out var req) && req.GetBoolean()
            };
            
            items.Add(item);
        }
        
        return items;
    }

    private List<FhirQuestionnaireResponseItem> ConvertResponsesToFhirItems(List<FhirPromResponse> responses)
    {
        return responses.Select(r => new FhirQuestionnaireResponseItem
        {
            LinkId = r.QuestionId,
            Text = r.QuestionText,
            Answer = new List<FhirAnswer>
            {
                new FhirAnswer
                {
                    ValueString = r.ResponseValue?.ToString(),
                    ValueInteger = TryParseInt(r.ResponseValue),
                    ValueBoolean = TryParseBool(r.ResponseValue),
                    ValueDate = TryParseDate(r.ResponseValue)
                }
            }
        }).ToList();
    }

    private string MapQuestionTypeToFhir(string? type)
    {
        return type?.ToLower() switch
        {
            "text" => "string",
            "number" => "integer",
            "select" => "choice",
            "multiselect" => "open-choice",
            "boolean" => "boolean",
            "date" => "date",
            "datetime" => "dateTime",
            "scale" => "integer",
            "group" => "group",
            _ => "string"
        };
    }

    private int? TryParseInt(object? value)
    {
        if (value == null) return null;
        return int.TryParse(value.ToString(), out var result) ? result : null;
    }

    private bool? TryParseBool(object? value)
    {
        if (value == null) return null;
        return bool.TryParse(value.ToString(), out var result) ? result : null;
    }

    private string? TryParseDate(object? value)
    {
        if (value == null) return null;
        return DateTime.TryParse(value.ToString(), out var result) 
            ? result.ToString("yyyy-MM-dd") 
            : null;
    }
}

// FHIR R4 Models
public class FhirQuestionnaire
{
    public string ResourceType { get; set; } = "Questionnaire";
    public string? Id { get; set; }
    public string? Url { get; set; }
    public string? Version { get; set; }
    public string? Name { get; set; }
    public string? Title { get; set; }
    public string Status { get; set; } = "active";
    public string? Date { get; set; }
    public string? Description { get; set; }
    public List<FhirQuestionnaireItem> Item { get; set; } = new();
}

public class FhirQuestionnaireItem
{
    public string? LinkId { get; set; }
    public string? Text { get; set; }
    public string? Type { get; set; }
    public bool Required { get; set; }
    public List<FhirAnswerOption>? AnswerOption { get; set; }
    public List<FhirQuestionnaireItem>? Item { get; set; }
    public FhirEnableWhen? EnableWhen { get; set; }
}

public class FhirAnswerOption
{
    public FhirCoding? ValueCoding { get; set; }
    public string? ValueString { get; set; }
    public int? ValueInteger { get; set; }
}

public class FhirCoding
{
    public string? System { get; set; }
    public string? Code { get; set; }
    public string? Display { get; set; }
}

public class FhirEnableWhen
{
    public string? Question { get; set; }
    public string? Operator { get; set; }
    public FhirCoding? AnswerCoding { get; set; }
    public string? AnswerString { get; set; }
}

public class FhirQuestionnaireResponse
{
    public string ResourceType { get; set; } = "QuestionnaireResponse";
    public string? Id { get; set; }
    public string? Questionnaire { get; set; }
    public string Status { get; set; } = "completed";
    public string? Authored { get; set; }
    public FhirReference? Subject { get; set; }
    public List<FhirQuestionnaireResponseItem> Item { get; set; } = new();
}

public class FhirQuestionnaireResponseItem
{
    public string? LinkId { get; set; }
    public string? Text { get; set; }
    public List<FhirAnswer>? Answer { get; set; }
}

public class FhirAnswer
{
    public bool? ValueBoolean { get; set; }
    public decimal? ValueDecimal { get; set; }
    public int? ValueInteger { get; set; }
    public string? ValueDate { get; set; }
    public string? ValueDateTime { get; set; }
    public string? ValueString { get; set; }
    public FhirCoding? ValueCoding { get; set; }
}

public class FhirReference
{
    public string? Reference { get; set; }
    public string? Display { get; set; }
}

// FHIR-specific DTOs for PROM export
public class FhirPromTemplate
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public JsonDocument Schema { get; set; } = JsonDocument.Parse("{}");
}

public class FhirPromInstance
{
    public Guid Id { get; set; }
    public Guid PromTemplateId { get; set; }
    public Guid PatientId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class FhirPromResponse
{
    public string QuestionId { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public object? ResponseValue { get; set; }
}
