namespace Qivr.Api.Options;

/// <summary>
/// Configuration options for MessageMedia SMS integration
/// </summary>
public sealed class MessageMediaOptions
{
    public const string SectionName = "MessageMedia";

    /// <summary>
    /// MessageMedia API Key for authentication
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// MessageMedia API Secret for authentication and HMAC signature verification
    /// </summary>
    public string ApiSecret { get; set; } = string.Empty;

    /// <summary>
    /// Default sender phone number
    /// </summary>
    public string FromNumber { get; set; } = string.Empty;

    /// <summary>
    /// Whether to enforce HMAC signature verification on webhooks
    /// Set to false only for development/testing
    /// </summary>
    public bool EnforceWebhookSignature { get; set; } = true;
}
