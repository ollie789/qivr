namespace Qivr.Api.Config;

public class JwtSettings
{
    public string SecretKey { get; set; } = "your-super-secret-jwt-key-change-in-production-minimum-32-chars";
    public string Issuer { get; set; } = "qivr.health";
    public string Audience { get; set; } = "qivr-api";
    public int ExpiryMinutes { get; set; } = 60;
    public int RefreshExpiryDays { get; set; } = 7;
}
