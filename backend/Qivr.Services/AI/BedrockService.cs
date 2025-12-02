using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Amazon;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Qivr.Services.AI;

/// <summary>
/// Service for integrating with Amazon Bedrock for AI-powered features
/// </summary>
public interface IBedrockService
{
    Task<string> InvokeClaudeAsync(string prompt, BedrockModelOptions? options = null);
    Task<BedrockResponse> InvokeClaudeWithStructuredOutputAsync(string prompt, string systemPrompt, BedrockModelOptions? options = null);
    Task<List<string>> GenerateEmbeddingsAsync(string text);
    Task<bool> CheckContentSafetyAsync(string content);
}

public class BedrockService : IBedrockService
{
    private readonly IAmazonBedrockRuntime _bedrockClient;
    private readonly ILogger<BedrockService> _logger;
    private readonly BedrockConfiguration _configuration;
    private readonly string _embeddingModelId = "amazon.titan-embed-text-v1";
    
    private string TextModelId => _configuration.ModelProvider?.ToLower() switch
    {
        "claude" => "anthropic.claude-3-sonnet-20240229-v1:0",
        "titan" => "amazon.titan-text-express-v1",
        _ => "amazon.nova-lite-v1:0"  // default to Nova
    };
    private bool UseClaude => _configuration.ModelProvider?.ToLower() == "claude";
    private bool UseNova => !UseClaude && _configuration.ModelProvider?.ToLower() != "titan";

    public BedrockService(
        IConfiguration configuration,
        ILogger<BedrockService> logger)
    {
        _logger = logger;
        _configuration = configuration.GetSection("Bedrock").Get<BedrockConfiguration>() 
            ?? throw new InvalidOperationException("Bedrock configuration is missing");

        var config = new AmazonBedrockRuntimeConfig
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(_configuration.Region)
        };

        _bedrockClient = new AmazonBedrockRuntimeClient(config);
        _logger.LogInformation("BedrockService initialized with provider: {Provider}", _configuration.ModelProvider ?? "titan");
    }

    public async Task<string> InvokeClaudeAsync(string prompt, BedrockModelOptions? options = null)
    {
        options ??= new BedrockModelOptions();
        
        if (UseClaude)
            return await InvokeClaudeInternalAsync(prompt, options);
        if (UseNova)
            return await InvokeNovaInternalAsync(prompt, null, options);
        
        return await InvokeTitanInternalAsync(prompt, options);
    }

    public async Task<BedrockResponse> InvokeClaudeWithStructuredOutputAsync(
        string prompt, 
        string systemPrompt, 
        BedrockModelOptions? options = null)
    {
        options ??= new BedrockModelOptions();
        
        if (UseClaude)
            return await InvokeClaudeStructuredInternalAsync(prompt, systemPrompt, options);
        if (UseNova)
            return await InvokeNovaStructuredInternalAsync(prompt, systemPrompt, options);
        
        return await InvokeTitanStructuredInternalAsync(prompt, systemPrompt, options);
    }

    private async Task<string> InvokeClaudeInternalAsync(string prompt, BedrockModelOptions options)
    {
        try
        {
            var requestBody = new
            {
                anthropic_version = "bedrock-2023-05-31",
                max_tokens = options.MaxTokens,
                temperature = options.Temperature,
                top_p = options.TopP,
                messages = new[] { new { role = "user", content = prompt } }
            };

            var response = await InvokeModelAsync(requestBody);
            var responseData = JsonSerializer.Deserialize<ClaudeResponse>(response);
            return responseData?.Content?.FirstOrDefault()?.Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invoking Claude model");
            throw new BedrockException("Failed to invoke Claude model", ex);
        }
    }

    private async Task<string> InvokeTitanInternalAsync(string prompt, BedrockModelOptions options)
    {
        try
        {
            var requestBody = new
            {
                inputText = prompt,
                textGenerationConfig = new
                {
                    maxTokenCount = options.MaxTokens,
                    temperature = options.Temperature,
                    topP = options.TopP
                }
            };

            var response = await InvokeModelAsync(requestBody);
            var responseData = JsonSerializer.Deserialize<TitanTextResponse>(response);
            return responseData?.Results?.FirstOrDefault()?.OutputText ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invoking Titan model");
            throw new BedrockException("Failed to invoke Titan model", ex);
        }
    }

    private async Task<string> InvokeNovaInternalAsync(string prompt, string? systemPrompt, BedrockModelOptions options)
    {
        try
        {
            var messages = new[] { new { role = "user", content = new[] { new { text = prompt } } } };
            object requestBody = systemPrompt != null
                ? new { messages, system = new[] { new { text = systemPrompt } }, inferenceConfig = new { max_new_tokens = options.MaxTokens, temperature = options.Temperature, top_p = options.TopP } }
                : new { messages, inferenceConfig = new { max_new_tokens = options.MaxTokens, temperature = options.Temperature, top_p = options.TopP } };

            var response = await InvokeModelAsync(requestBody);
            var responseData = JsonSerializer.Deserialize<NovaResponse>(response);
            return responseData?.Output?.Message?.Content?.FirstOrDefault()?.Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invoking Nova model");
            throw new BedrockException("Failed to invoke Nova model", ex);
        }
    }

    private async Task<BedrockResponse> InvokeClaudeStructuredInternalAsync(
        string prompt, string systemPrompt, BedrockModelOptions options)
    {
        try
        {
            var requestBody = new
            {
                anthropic_version = "bedrock-2023-05-31",
                max_tokens = options.MaxTokens,
                temperature = options.Temperature,
                top_p = options.TopP,
                system = systemPrompt,
                messages = new[] { new { role = "user", content = prompt } }
            };

            var response = await InvokeModelAsync(requestBody);
            var responseData = JsonSerializer.Deserialize<ClaudeResponse>(response);
            var content = responseData?.Content?.FirstOrDefault()?.Text ?? "{}";

            return new BedrockResponse
            {
                RawContent = content,
                ParsedContent = ParseStructuredOutput(content),
                ModelId = TextModelId,
                Usage = new ModelUsage
                {
                    InputTokens = responseData?.Usage?.InputTokens ?? 0,
                    OutputTokens = responseData?.Usage?.OutputTokens ?? 0
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invoking Claude model with structured output");
            throw new BedrockException("Failed to invoke Claude model", ex);
        }
    }

    private async Task<BedrockResponse> InvokeTitanStructuredInternalAsync(
        string prompt, string systemPrompt, BedrockModelOptions options)
    {
        try
        {
            var fullPrompt = $"{systemPrompt}\n\n{prompt}";
            var requestBody = new
            {
                inputText = fullPrompt,
                textGenerationConfig = new
                {
                    maxTokenCount = options.MaxTokens,
                    temperature = options.Temperature,
                    topP = options.TopP
                }
            };

            var response = await InvokeModelAsync(requestBody);
            var responseData = JsonSerializer.Deserialize<TitanTextResponse>(response);
            var content = responseData?.Results?.FirstOrDefault()?.OutputText ?? "{}";

            return new BedrockResponse
            {
                RawContent = content,
                ParsedContent = ParseStructuredOutput(content),
                ModelId = TextModelId,
                Usage = new ModelUsage
                {
                    InputTokens = responseData?.InputTextTokenCount ?? 0,
                    OutputTokens = responseData?.Results?.FirstOrDefault()?.TokenCount ?? 0
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invoking Titan model with structured output");
            throw new BedrockException("Failed to invoke Titan model", ex);
        }
    }

    private async Task<BedrockResponse> InvokeNovaStructuredInternalAsync(
        string prompt, string systemPrompt, BedrockModelOptions options)
    {
        try
        {
            var content = await InvokeNovaInternalAsync(prompt, systemPrompt, options);

            return new BedrockResponse
            {
                RawContent = content,
                ParsedContent = ParseStructuredOutput(content),
                ModelId = TextModelId,
                Usage = new ModelUsage()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invoking Nova model with structured output");
            throw new BedrockException("Failed to invoke Nova model", ex);
        }
    }

    private async Task<string> InvokeModelAsync(object requestBody)
    {
        var request = new InvokeModelRequest
        {
            ModelId = TextModelId,
            ContentType = "application/json",
            Accept = "application/json",
            Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(requestBody)))
        };

        var response = await _bedrockClient.InvokeModelAsync(request);
        using var reader = new StreamReader(response.Body);
        return await reader.ReadToEndAsync();
    }

    public async Task<List<string>> GenerateEmbeddingsAsync(string text)
    {
        try
        {
            var requestBody = new { inputText = text };
            var request = new InvokeModelRequest
            {
                ModelId = _embeddingModelId,
                ContentType = "application/json",
                Accept = "application/json",
                Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(requestBody)))
            };

            var response = await _bedrockClient.InvokeModelAsync(request);
            using var reader = new StreamReader(response.Body);
            var responseJson = await reader.ReadToEndAsync();
            var responseData = JsonSerializer.Deserialize<TitanEmbeddingResponse>(responseJson);
            
            return responseData?.Embedding ?? new List<string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating embeddings");
            throw new BedrockException("Failed to generate embeddings", ex);
        }
    }

    public async Task<bool> CheckContentSafetyAsync(string content)
    {
        try
        {
            var prompt = $@"Analyze the following content for safety concerns. 
Return JSON with format: {{""is_safe"": boolean, ""concerns"": []}}

Content: {content}";

            var result = await InvokeClaudeWithStructuredOutputAsync(
                prompt,
                "You are a content safety analyzer. Check for harmful, inappropriate, or dangerous content.",
                new BedrockModelOptions { Temperature = 0.1f }
            );

            var safety = JsonSerializer.Deserialize<ContentSafetyResult>(result.RawContent);
            return safety?.IsSafe ?? true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking content safety");
            return true;
        }
    }

    /// <summary>
    /// Robustly parse JSON from LLM output, handling common issues like:
    /// - Preamble text before JSON ("Here is the JSON: {...}")
    /// - Trailing text after JSON
    /// - Markdown code blocks (```json {...} ```)
    /// - Multiple JSON objects (takes first complete one)
    /// </summary>
    private Dictionary<string, object> ParseStructuredOutput(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            _logger.LogWarning("Empty content received for JSON parsing");
            return new Dictionary<string, object>();
        }

        try
        {
            // Step 1: Try to extract JSON from markdown code blocks first
            var codeBlockMatch = Regex.Match(content, @"```(?:json)?\s*(\{[\s\S]*?\})\s*```", RegexOptions.Singleline);
            if (codeBlockMatch.Success)
            {
                var jsonFromBlock = codeBlockMatch.Groups[1].Value;
                var parsed = TryParseJson(jsonFromBlock);
                if (parsed != null)
                    return parsed;
            }

            // Step 2: Find the first complete JSON object using bracket matching
            var jsonContent = ExtractFirstJsonObject(content);
            if (!string.IsNullOrEmpty(jsonContent))
            {
                var parsed = TryParseJson(jsonContent);
                if (parsed != null)
                    return parsed;
            }

            // Step 3: Try parsing the raw content as-is (maybe it's already clean JSON)
            var directParsed = TryParseJson(content);
            if (directParsed != null)
                return directParsed;

            _logger.LogWarning("Failed to parse JSON from LLM output. Content preview: {Preview}",
                content.Length > 200 ? content.Substring(0, 200) + "..." : content);
            return new Dictionary<string, object>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Exception during JSON parsing from LLM output");
            return new Dictionary<string, object>();
        }
    }

    /// <summary>
    /// Extract the first complete JSON object from text using bracket matching
    /// </summary>
    private string? ExtractFirstJsonObject(string content)
    {
        var jsonStart = content.IndexOf('{');
        if (jsonStart < 0)
            return null;

        int braceCount = 0;
        bool inString = false;
        bool escape = false;

        for (int i = jsonStart; i < content.Length; i++)
        {
            char c = content[i];

            if (escape)
            {
                escape = false;
                continue;
            }

            if (c == '\\' && inString)
            {
                escape = true;
                continue;
            }

            if (c == '"' && !escape)
            {
                inString = !inString;
                continue;
            }

            if (!inString)
            {
                if (c == '{')
                    braceCount++;
                else if (c == '}')
                {
                    braceCount--;
                    if (braceCount == 0)
                    {
                        // Found complete JSON object
                        return content.Substring(jsonStart, i - jsonStart + 1);
                    }
                }
            }
        }

        // Fallback: try simple substring if bracket matching failed
        var jsonEnd = content.LastIndexOf('}');
        if (jsonEnd > jsonStart)
        {
            return content.Substring(jsonStart, jsonEnd - jsonStart + 1);
        }

        return null;
    }

    /// <summary>
    /// Attempt to parse JSON string, returning null on failure
    /// </summary>
    private Dictionary<string, object>? TryParseJson(string json)
    {
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true,
                ReadCommentHandling = JsonCommentHandling.Skip
            };

            return JsonSerializer.Deserialize<Dictionary<string, object>>(json, options);
        }
        catch
        {
            return null;
        }
    }
}

// Configuration
public class BedrockConfiguration
{
    public string Region { get; set; } = "us-east-1";
    public string? ModelProvider { get; set; } = "titan"; // "titan" or "claude"
    public int MaxRetries { get; set; } = 3;
    public int TimeoutSeconds { get; set; } = 30;
}

public class BedrockModelOptions
{
    public int MaxTokens { get; set; } = 2048;
    public float Temperature { get; set; } = 0.7f;
    public float TopP { get; set; } = 0.9f;
    public float TopK { get; set; } = 40;
    public List<string>? StopSequences { get; set; }
}

public class BedrockResponse
{
    public string RawContent { get; set; } = string.Empty;
    public Dictionary<string, object> ParsedContent { get; set; } = new();
    public string ModelId { get; set; } = string.Empty;
    public ModelUsage? Usage { get; set; }
}

public class ModelUsage
{
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int TotalTokens => InputTokens + OutputTokens;
}

// Response Models
internal class ClaudeResponse
{
    public List<ClaudeContent>? Content { get; set; }
    public string? StopReason { get; set; }
    public ClaudeUsage? Usage { get; set; }
}

internal class ClaudeContent
{
    public string? Type { get; set; }
    public string? Text { get; set; }
}

internal class ClaudeUsage
{
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
}

internal class TitanTextResponse
{
    public int? InputTextTokenCount { get; set; }
    public List<TitanTextResult>? Results { get; set; }
}

internal class TitanTextResult
{
    public string? OutputText { get; set; }
    public int? TokenCount { get; set; }
    public string? CompletionReason { get; set; }
}

internal class NovaResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("output")]
    public NovaOutput? Output { get; set; }
}

internal class NovaOutput
{
    [System.Text.Json.Serialization.JsonPropertyName("message")]
    public NovaMessage? Message { get; set; }
}

internal class NovaMessage
{
    [System.Text.Json.Serialization.JsonPropertyName("content")]
    public List<NovaContent>? Content { get; set; }
}

internal class NovaContent
{
    [System.Text.Json.Serialization.JsonPropertyName("text")]
    public string? Text { get; set; }
}

internal class TitanEmbeddingResponse
{
    public List<string>? Embedding { get; set; }
    public int? InputTextTokenCount { get; set; }
}

internal class ContentSafetyResult
{
    public bool IsSafe { get; set; }
    public List<string> Concerns { get; set; } = new();
}

public class BedrockException : Exception
{
    public BedrockException(string message) : base(message) { }
    public BedrockException(string message, Exception innerException) : base(message, innerException) { }
}
