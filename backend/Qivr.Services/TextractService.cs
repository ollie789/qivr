using Amazon.Textract;
using Amazon.Textract.Model;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.RegularExpressions;

namespace Qivr.Services;

public interface ITextractService
{
    Task<TextractResult> ExtractTextFromDocumentAsync(string s3Bucket, string s3Key, CancellationToken cancellationToken = default);
}

public class TextractResult
{
    public string ExtractedText { get; set; } = string.Empty;
    public string? PatientName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public Dictionary<string, string> Identifiers { get; set; } = new();
    public decimal ConfidenceScore { get; set; }
}

public class TextractService : ITextractService
{
    private readonly IAmazonTextract _textractClient;
    private readonly ILogger<TextractService> _logger;

    public TextractService(IAmazonTextract textractClient, ILogger<TextractService> logger)
    {
        _textractClient = textractClient;
        _logger = logger;
    }

    public async Task<TextractResult> ExtractTextFromDocumentAsync(string s3Bucket, string s3Key, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new DetectDocumentTextRequest
            {
                Document = new Document
                {
                    S3Object = new S3Object
                    {
                        Bucket = s3Bucket,
                        Name = s3Key
                    }
                }
            };

            var response = await _textractClient.DetectDocumentTextAsync(request, cancellationToken);
            
            var result = new TextractResult();
            var textBuilder = new StringBuilder();
            var confidenceScores = new List<decimal>();

            foreach (var block in response.Blocks)
            {
                if (block.BlockType == BlockType.LINE)
                {
                    textBuilder.AppendLine(block.Text);
                    confidenceScores.Add((decimal)block.Confidence);
                }
            }

            result.ExtractedText = textBuilder.ToString();
            result.ConfidenceScore = confidenceScores.Any() ? confidenceScores.Average() : 0;

            // Extract patient identifiers
            ExtractPatientInfo(result.ExtractedText, result);

            _logger.LogInformation("Textract extraction completed. Confidence: {Confidence}%", result.ConfidenceScore);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract text from document: {S3Key}", s3Key);
            throw;
        }
    }

    private void ExtractPatientInfo(string text, TextractResult result)
    {
        // Extract patient name (common patterns)
        var namePatterns = new[]
        {
            @"Patient\s*Name\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)",
            @"Name\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)",
            @"Patient\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)"
        };

        foreach (var pattern in namePatterns)
        {
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
            if (match.Success)
            {
                result.PatientName = match.Groups[1].Value.Trim();
                break;
            }
        }

        // Extract date of birth
        var dobPatterns = new[]
        {
            @"(?:DOB|Date\s*of\s*Birth)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            @"(?:DOB|Date\s*of\s*Birth)\s*:?\s*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})"
        };

        foreach (var pattern in dobPatterns)
        {
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
            if (match.Success && DateTime.TryParse(match.Groups[1].Value, out var dob))
            {
                result.DateOfBirth = dob;
                break;
            }
        }

        // Extract Medicare number (Australian)
        var medicareMatch = Regex.Match(text, @"Medicare\s*(?:Number|No\.?)?\s*:?\s*(\d{10})", RegexOptions.IgnoreCase);
        if (medicareMatch.Success)
        {
            result.Identifiers["Medicare"] = medicareMatch.Groups[1].Value;
        }

        // Extract NDIS number
        var ndisMatch = Regex.Match(text, @"NDIS\s*(?:Number|No\.?)?\s*:?\s*(\d{9})", RegexOptions.IgnoreCase);
        if (ndisMatch.Success)
        {
            result.Identifiers["NDIS"] = ndisMatch.Groups[1].Value;
        }

        // Extract phone number
        var phoneMatch = Regex.Match(text, @"(?:Phone|Mobile|Tel)\s*:?\s*(\+?\d[\d\s\-\(\)]{8,})", RegexOptions.IgnoreCase);
        if (phoneMatch.Success)
        {
            result.Identifiers["Phone"] = phoneMatch.Groups[1].Value.Trim();
        }
    }
}
