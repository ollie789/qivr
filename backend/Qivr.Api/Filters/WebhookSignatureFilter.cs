using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using Qivr.Api.Options;

namespace Qivr.Api.Filters;

/// <summary>
/// Action filter that validates HMAC signatures on webhook requests.
/// Prevents forged webhook payloads from being processed.
/// </summary>
public class WebhookSignatureFilter : IAsyncActionFilter
{
    private readonly MessageMediaOptions _options;
    private readonly ILogger<WebhookSignatureFilter> _logger;

    public WebhookSignatureFilter(
        IOptions<MessageMediaOptions> options,
        ILogger<WebhookSignatureFilter> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Skip verification if disabled (development only)
        if (!_options.EnforceWebhookSignature)
        {
            _logger.LogWarning("Webhook signature verification is disabled - this should not happen in production");
            await next();
            return;
        }

        // Check if secret is configured
        if (string.IsNullOrWhiteSpace(_options.ApiSecret))
        {
            _logger.LogError("MessageMedia API secret not configured - rejecting webhook");
            context.Result = new UnauthorizedObjectResult(new { error = "Webhook signature verification failed" });
            return;
        }

        var request = context.HttpContext.Request;

        // MessageMedia sends signature in X-MessageMedia-Signature header
        // Format varies by provider - adjust header name as needed
        var signatureHeader = request.Headers["X-MessageMedia-Signature"].FirstOrDefault()
            ?? request.Headers["X-Webhook-Signature"].FirstOrDefault()
            ?? request.Headers["X-Signature"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            _logger.LogWarning("Webhook request missing signature header from {IP}",
                request.HttpContext.Connection.RemoteIpAddress);
            context.Result = new UnauthorizedObjectResult(new { error = "Missing webhook signature" });
            return;
        }

        // Read request body
        request.EnableBuffering();
        request.Body.Position = 0;
        using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;

        // Compute expected signature
        var expectedSignature = ComputeHmacSignature(body, _options.ApiSecret);

        // Compare signatures (constant-time comparison to prevent timing attacks)
        if (!CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signatureHeader),
            Encoding.UTF8.GetBytes(expectedSignature)))
        {
            _logger.LogWarning("Invalid webhook signature from {IP}. Expected: {Expected}, Got: {Got}",
                request.HttpContext.Connection.RemoteIpAddress,
                expectedSignature[..Math.Min(10, expectedSignature.Length)] + "...",
                signatureHeader[..Math.Min(10, signatureHeader.Length)] + "...");
            context.Result = new UnauthorizedObjectResult(new { error = "Invalid webhook signature" });
            return;
        }

        _logger.LogDebug("Webhook signature verified successfully");
        await next();
    }

    private static string ComputeHmacSignature(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }
}

/// <summary>
/// Attribute to apply HMAC signature verification to webhook endpoints
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ValidateWebhookSignatureAttribute : TypeFilterAttribute
{
    public ValidateWebhookSignatureAttribute() : base(typeof(WebhookSignatureFilter))
    {
    }
}
