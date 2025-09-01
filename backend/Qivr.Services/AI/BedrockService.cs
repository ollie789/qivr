using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
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
    private readonly string _claudeModelId = "anthropic.claude-3-sonnet-20240229-v1:0";
    private readonly string _embeddingModelId = "amazon.titan-embed-text-v1";

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
    }

    public async Task<string> InvokeClaudeAsync(string prompt, BedrockModelOptions? options = null)
    {
        try
        {
            options ??= new BedrockModelOptions();
            
            var requestBody = new
            {
                anthropic_version = "bedrock-2023-05-31",
                max_tokens = options.MaxTokens,
                temperature = options.Temperature,
                top_p = options.TopP,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                }
            };

            var request = new InvokeModelRequest
            {
                ModelId = _claudeModelId,
                ContentType = "application/json",
                Accept = "application/json",
                Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(requestBody)))
            };

            var response = await _bedrockClient.InvokeModelAsync(request);
            
            using var reader = new StreamReader(response.Body);
            var responseJson = await reader.ReadToEndAsync();
            var responseData = JsonSerializer.Deserialize<ClaudeResponse>(responseJson);
            
            return responseData?.Content?.FirstOrDefault()?.Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invoking Claude model");
            throw new BedrockException("Failed to invoke Claude model", ex);
        }
    }

    public async Task<BedrockResponse> InvokeClaudeWithStructuredOutputAsync(
        string prompt, 
        string systemPrompt, 
        BedrockModelOptions? options = null)
    {
        try
        {
            options ??= new BedrockModelOptions();
            
            var requestBody = new
            {
                anthropic_version = "bedrock-2023-05-31",
                max_tokens = options.MaxTokens,
                temperature = options.Temperature,
                top_p = options.TopP,
                system = systemPrompt,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                }
            };

            var request = new InvokeModelRequest
            {
                ModelId = _claudeModelId,
                ContentType = "application/json",
                Accept = "application/json",
                Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(requestBody)))
            };

            var response = await _bedrockClient.InvokeModelAsync(request);
            
            using var reader = new StreamReader(response.Body);
            var responseJson = await reader.ReadToEndAsync();
            var responseData = JsonSerializer.Deserialize<ClaudeResponse>(responseJson);
            
            // Parse the structured JSON from the response
            var content = responseData?.Content?.FirstOrDefault()?.Text ?? "{}";
            
            return new BedrockResponse
            {
                RawContent = content,
                ParsedContent = ParseStructuredOutput(content),
                ModelId = _claudeModelId,
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

    public async Task<List<string>> GenerateEmbeddingsAsync(string text)
    {
        try
        {
            var requestBody = new
            {
                inputText = text
            };

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
            var prompt = $@"
                Analyze the following content for safety concerns. 
                Return JSON with format: 
                {{
                    ""is_safe"": boolean,
                    ""concerns"": []
                }}
                
                Content: {content}
            ";

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
            // Default to safe if check fails
            return true;
        }
    }

    private Dictionary<string, object> ParseStructuredOutput(string content)
    {
        try
        {
            // Extract JSON from the response if it's wrapped in markdown
            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonContent = content.Substring(jsonStart, jsonEnd - jsonStart + 1);
                return JsonSerializer.Deserialize<Dictionary<string, object>>(jsonContent) 
                    ?? new Dictionary<string, object>();
            }

            return JsonSerializer.Deserialize<Dictionary<string, object>>(content) 
                ?? new Dictionary<string, object>();
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }
}

// Configuration and Models
public class BedrockConfiguration
{
    public string Region { get; set; } = "us-east-1";
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
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

// Claude Response Models
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

// Titan Embedding Response
internal class TitanEmbeddingResponse
{
    public List<string>? Embedding { get; set; }
    public int? InputTextTokenCount { get; set; }
}

// Content Safety Models
internal class ContentSafetyResult
{
    public bool IsSafe { get; set; }
    public List<string> Concerns { get; set; } = new();
}

// Exceptions
public class BedrockException : Exception
{
    public BedrockException(string message) : base(message) { }
    public BedrockException(string message, Exception innerException) : base(message, innerException) { }
}
