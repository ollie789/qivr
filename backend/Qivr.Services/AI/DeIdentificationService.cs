using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace Qivr.Services.AI;

/// <summary>
/// Service for de-identifying patient data by removing or masking PHI/PII
/// </summary>
public interface IDeIdentificationService
{
    Task<DeIdentifiedData> DeIdentifyAsync(string text, DeIdentificationOptions? options = null);
    Task<DeIdentifiedData> DeIdentifyJsonAsync(Dictionary<string, object> data, DeIdentificationOptions? options = null);
    Task<string> ReIdentifyAsync(string deidentifiedText, Guid mappingId);
    string GenerateConsistentPseudonym(string identifier, string salt);
}

public class DeIdentificationService : IDeIdentificationService
{
    private readonly ILogger<DeIdentificationService> _logger;
    private readonly IBedrockService _bedrockService;
    private readonly Dictionary<Guid, Dictionary<string, string>> _reidentificationMappings;

    // Regular expressions for common PHI patterns
    private readonly Regex _ssnRegex = new(@"\b\d{3}-?\d{2}-?\d{4}\b", RegexOptions.Compiled);
    private readonly Regex _phoneRegex = new(@"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", RegexOptions.Compiled);
    private readonly Regex _auPhoneRegex = new(@"\b(?:\+?61[-.\s]?)?0?[45]\d{2}[-.\s]?\d{3}[-.\s]?\d{3}\b", RegexOptions.Compiled);
    private readonly Regex _emailRegex = new(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", RegexOptions.Compiled);
    private readonly Regex _mrnRegex = new(@"\b(?:MRN|Medical Record Number|Patient ID)[:\s]?\d{6,12}\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private readonly Regex _medicareRegex = new(@"\b\d{4}[-\s]?\d{5}[-\s]?\d\b", RegexOptions.Compiled);
    private readonly Regex _dateRegex = new(@"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b", RegexOptions.Compiled);
    private readonly Regex _creditCardRegex = new(@"\b(?:\d{4}[-\s]?){3}\d{4}\b", RegexOptions.Compiled);
    private readonly Regex _ipAddressRegex = new(@"\b(?:\d{1,3}\.){3}\d{1,3}\b", RegexOptions.Compiled);

    // Common PHI terms to look for
    private readonly HashSet<string> _phiKeywords = new()
    {
        "name", "address", "street", "city", "state", "zip", "zipcode", "postal",
        "dob", "birth", "birthday", "ssn", "social security", "phone", "mobile",
        "email", "mrn", "medical record", "patient id", "insurance", "policy",
        "employer", "occupation", "emergency contact", "next of kin",
        "medicare", "tfn", "tax file", "drivers licence", "passport"
    };

    public DeIdentificationService(
        ILogger<DeIdentificationService> logger,
        IBedrockService bedrockService)
    {
        _logger = logger;
        _bedrockService = bedrockService;
        _reidentificationMappings = new Dictionary<Guid, Dictionary<string, string>>();
    }

    public async Task<DeIdentifiedData> DeIdentifyAsync(string text, DeIdentificationOptions? options = null)
    {
        options ??= new DeIdentificationOptions();
        
        var result = new DeIdentifiedData
        {
            MappingId = Guid.NewGuid(),
            OriginalLength = text.Length
        };

        var deidentifiedText = text;
        var replacements = new Dictionary<string, string>();

        try
        {
            // Step 1: Pattern-based de-identification
            deidentifiedText = await ApplyPatternBasedDeIdentification(deidentifiedText, replacements, options);

            // Step 2: AI-based de-identification for complex cases
            if (options.UseAiDetection)
            {
                deidentifiedText = await ApplyAiBasedDeIdentification(deidentifiedText, replacements, options);
            }

            // Step 3: Apply date shifting if requested
            if (options.ShiftDates)
            {
                deidentifiedText = ApplyDateShifting(deidentifiedText, options.DateShiftDays);
            }

            // Store mapping for potential re-identification
            if (options.EnableReIdentification)
            {
                _reidentificationMappings[result.MappingId] = replacements;
            }

            result.DeIdentifiedText = deidentifiedText;
            result.DeIdentifiedLength = deidentifiedText.Length;
            result.ItemsRemoved = replacements.Count;
            result.Success = true;
            result.ReplacementMap = options.IncludeReplacementMap ? replacements : null;

            // Generate audit log
            result.AuditLog = GenerateAuditLog(text, deidentifiedText, replacements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during de-identification");
            result.Success = false;
            result.ErrorMessage = "De-identification failed";
        }

        return result;
    }

    public async Task<DeIdentifiedData> DeIdentifyJsonAsync(Dictionary<string, object> data, DeIdentificationOptions? options = null)
    {
        options ??= new DeIdentificationOptions();
        
        var result = new DeIdentifiedData
        {
            MappingId = Guid.NewGuid()
        };

        var deidentifiedData = new Dictionary<string, object>();
        var replacements = new Dictionary<string, string>();

        try
        {
            foreach (var kvp in data)
            {
                // Check if key contains PHI keywords
                if (ContainsPHIKeyword(kvp.Key))
                {
                    // Replace with placeholder
                    var placeholder = $"[REDACTED_{kvp.Key.ToUpper()}]";
                    deidentifiedData[kvp.Key] = placeholder;
                    replacements[kvp.Value?.ToString() ?? ""] = placeholder;
                }
                else if (kvp.Value is string stringValue)
                {
                    // De-identify string values
                    var deidentified = await DeIdentifyAsync(stringValue, options);
                    deidentifiedData[kvp.Key] = deidentified.DeIdentifiedText ?? string.Empty;
                    
                    if (deidentified.ReplacementMap != null)
                    {
                        foreach (var replacement in deidentified.ReplacementMap)
                        {
                            replacements[replacement.Key] = replacement.Value;
                        }
                    }
                }
                else if (kvp.Value is Dictionary<string, object> nestedDict)
                {
                    // Recursively de-identify nested objects
                    var nestedResult = await DeIdentifyJsonAsync(nestedDict, options);
                    deidentifiedData[kvp.Key] = nestedResult.DeIdentifiedContent ?? new Dictionary<string, object>();
                }
                else
                {
                    // Keep non-string values as is
                    deidentifiedData[kvp.Key] = kvp.Value ?? string.Empty;
                }
            }

            // Store mapping for potential re-identification
            if (options.EnableReIdentification)
            {
                _reidentificationMappings[result.MappingId] = replacements;
            }

            result.DeIdentifiedContent = deidentifiedData;
            result.ItemsRemoved = replacements.Count;
            result.Success = true;
            result.ReplacementMap = options.IncludeReplacementMap ? replacements : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during JSON de-identification");
            result.Success = false;
            result.ErrorMessage = "JSON de-identification failed";
        }

        return result;
    }

    public async Task<string> ReIdentifyAsync(string deidentifiedText, Guid mappingId)
    {
        if (!_reidentificationMappings.ContainsKey(mappingId))
        {
            throw new InvalidOperationException("Mapping not found for re-identification");
        }

        var mapping = _reidentificationMappings[mappingId];
        var reidentifiedText = deidentifiedText;

        // Apply replacements in reverse
        foreach (var kvp in mapping)
        {
            reidentifiedText = reidentifiedText.Replace(kvp.Value, kvp.Key);
        }

        return await Task.FromResult(reidentifiedText);
    }

    public string GenerateConsistentPseudonym(string identifier, string salt)
    {
        using var sha256 = SHA256.Create();
        var inputBytes = Encoding.UTF8.GetBytes($"{identifier}{salt}");
        var hashBytes = sha256.ComputeHash(inputBytes);
        var hash = Convert.ToBase64String(hashBytes);
        
        // Generate a pronounceable pseudonym
        var consonants = "BCDFGHJKLMNPQRSTVWXYZ";
        var vowels = "AEIOU";
        var pseudonym = new StringBuilder();
        
        for (int i = 0; i < 8; i++)
        {
            if (i % 2 == 0)
                pseudonym.Append(consonants[hashBytes[i] % consonants.Length]);
            else
                pseudonym.Append(vowels[hashBytes[i] % vowels.Length]);
        }
        
        return pseudonym.ToString();
    }

    private async Task<string> ApplyPatternBasedDeIdentification(
        string text, 
        Dictionary<string, string> replacements,
        DeIdentificationOptions options)
    {
        // Replace SSNs
        text = _ssnRegex.Replace(text, match =>
        {
            var replacement = options.ReplacementStrategy == ReplacementStrategy.Mask 
                ? "XXX-XX-XXXX" 
                : "[SSN]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        // Replace phone numbers (US)
        text = _phoneRegex.Replace(text, match =>
        {
            var replacement = options.ReplacementStrategy == ReplacementStrategy.Mask 
                ? "XXX-XXX-XXXX" 
                : "[PHONE]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        // Replace phone numbers (Australian)
        text = _auPhoneRegex.Replace(text, match =>
        {
            var replacement = options.ReplacementStrategy == ReplacementStrategy.Mask 
                ? "XXXX XXX XXX" 
                : "[PHONE_AU]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        // Replace email addresses
        text = _emailRegex.Replace(text, match =>
        {
            var replacement = options.ReplacementStrategy == ReplacementStrategy.Mask 
                ? "xxx@xxx.xxx" 
                : "[EMAIL]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        // Replace MRNs
        text = _mrnRegex.Replace(text, match =>
        {
            var replacement = "[MRN]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        // Replace Medicare numbers (Australian)
        text = _medicareRegex.Replace(text, match =>
        {
            var replacement = options.ReplacementStrategy == ReplacementStrategy.Mask 
                ? "XXXX XXXXX X" 
                : "[MEDICARE]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        // Replace credit card numbers
        text = _creditCardRegex.Replace(text, match =>
        {
            var replacement = options.ReplacementStrategy == ReplacementStrategy.Mask 
                ? "XXXX-XXXX-XXXX-XXXX" 
                : "[CREDIT_CARD]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        // Replace IP addresses
        text = _ipAddressRegex.Replace(text, match =>
        {
            var replacement = "[IP_ADDRESS]";
            replacements[match.Value] = replacement;
            return replacement;
        });

        return await Task.FromResult(text);
    }

    private async Task<string> ApplyAiBasedDeIdentification(
        string text, 
        Dictionary<string, string> replacements,
        DeIdentificationOptions options)
    {
        try
        {
            var prompt = $@"
                Identify and replace all PHI/PII in the following text with placeholders.
                Return JSON with format:
                {{
                    ""deidentified_text"": ""text with PHI replaced"",
                    ""entities_found"": [
                        {{""original"": ""John Doe"", ""type"": ""NAME"", ""replacement"": ""[NAME1]""}}
                    ]
                }}
                
                Text: {text}
            ";

            var systemPrompt = @"You are a PHI/PII detection expert. Identify and replace:
                - Names (patients, doctors, family members)
                - Addresses and locations more specific than state
                - Dates (except year alone)
                - Phone, fax, email
                - SSN, MRN, account numbers
                - License numbers, device identifiers
                - URLs, IP addresses
                - Any other potentially identifying information";

            var response = await _bedrockService.InvokeClaudeWithStructuredOutputAsync(
                prompt,
                systemPrompt,
                new BedrockModelOptions { Temperature = 0.1f }
            );

            if (response.ParsedContent.TryGetValue("deidentified_text", out var deidentifiedText))
            {
                text = deidentifiedText.ToString() ?? text;
            }

            if (response.ParsedContent.TryGetValue("entities_found", out var entities) && entities is List<object> entityList)
            {
                foreach (var entity in entityList)
                {
                    if (entity is Dictionary<string, object> entityDict)
                    {
                        var original = entityDict.GetValueOrDefault("original")?.ToString() ?? "";
                        var replacement = entityDict.GetValueOrDefault("replacement")?.ToString() ?? "";
                        if (!string.IsNullOrEmpty(original) && !string.IsNullOrEmpty(replacement))
                        {
                            replacements[original] = replacement;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI-based de-identification failed, falling back to pattern-based only");
        }

        return text;
    }

    private string ApplyDateShifting(string text, int shiftDays)
    {
        return _dateRegex.Replace(text, match =>
        {
            if (DateTime.TryParse(match.Value, out var date))
            {
                var shiftedDate = date.AddDays(shiftDays);
                return shiftedDate.ToString("MM/dd/yyyy");
            }
            return match.Value;
        });
    }

    private bool ContainsPHIKeyword(string text)
    {
        var lowerText = text.ToLower();
        return _phiKeywords.Any(keyword => lowerText.Contains(keyword));
    }

    private DeIdentificationAuditLog GenerateAuditLog(
        string original, 
        string deidentified, 
        Dictionary<string, string> replacements)
    {
        return new DeIdentificationAuditLog
        {
            Timestamp = DateTime.UtcNow,
            OriginalLength = original.Length,
            DeIdentifiedLength = deidentified.Length,
            ItemsRemoved = replacements.Count,
            EntityTypes = replacements.Values
                .Select(v => ExtractEntityType(v))
                .Distinct()
                .ToList()
        };
    }

    private string ExtractEntityType(string placeholder)
    {
        // Extract type from placeholders like [NAME], [SSN], etc.
        var match = Regex.Match(placeholder, @"\[([A-Z_]+)\]");
        return match.Success ? match.Groups[1].Value : "UNKNOWN";
    }
}

// Models
public class DeIdentificationOptions
{
    public ReplacementStrategy ReplacementStrategy { get; set; } = ReplacementStrategy.Placeholder;
    public bool UseAiDetection { get; set; } = true;
    public bool EnableReIdentification { get; set; } = false;
    public bool IncludeReplacementMap { get; set; } = false;
    public bool ShiftDates { get; set; } = false;
    public int DateShiftDays { get; set; } = 365;
    public string? CustomSalt { get; set; }
}

public enum ReplacementStrategy
{
    Placeholder,  // Replace with [TYPE]
    Mask,        // Replace with XXX
    Pseudonym,   // Replace with consistent fake data
    Remove       // Remove entirely
}

public class DeIdentifiedData
{
    public Guid MappingId { get; set; }
    public string? DeIdentifiedText { get; set; }
    public Dictionary<string, object>? DeIdentifiedContent { get; set; }
    public int OriginalLength { get; set; }
    public int DeIdentifiedLength { get; set; }
    public int ItemsRemoved { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, string>? ReplacementMap { get; set; }
    public DeIdentificationAuditLog? AuditLog { get; set; }
}

public class DeIdentificationAuditLog
{
    public DateTime Timestamp { get; set; }
    public int OriginalLength { get; set; }
    public int DeIdentifiedLength { get; set; }
    public int ItemsRemoved { get; set; }
    public List<string> EntityTypes { get; set; } = new();
}
