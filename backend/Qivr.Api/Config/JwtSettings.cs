namespace Qivr.Api.Config;

public class JwtSettings
{
    /// <summary>
    /// JWT signing secret key. MUST be configured via environment variable or secrets manager.
    /// Minimum 32 characters required for HS256.
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    public string Issuer { get; set; } = "qivr.health";
    public string Audience { get; set; } = "qivr-api";
    public int ExpiryMinutes { get; set; } = 60;
    public int RefreshExpiryDays { get; set; } = 7;

    /// <summary>
    /// Validates that the JWT settings are properly configured.
    /// </summary>
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(SecretKey))
        {
            throw new InvalidOperationException(
                "JWT SecretKey is not configured. Set the JWT_SECRET_KEY environment variable or configure Jwt:SecretKey in appsettings.");
        }

        if (SecretKey.Length < 32)
        {
            throw new InvalidOperationException(
                "JWT SecretKey must be at least 32 characters for HS256 algorithm security.");
        }
    }
}
