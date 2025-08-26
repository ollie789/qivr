namespace Qivr.Api.Config;

public class CognitoSettings
{
    public string Region { get; set; } = "ap-southeast-2"; // Sydney region for AU data residency
    public string UserPoolId { get; set; } = string.Empty;
    public string UserPoolClientId { get; set; } = string.Empty;
    public string UserPoolClientSecret { get; set; } = string.Empty;
    public string UserPoolDomain { get; set; } = string.Empty;
    public string IdentityPoolId { get; set; } = string.Empty;
    
    // Federation settings
    public string SamlMetadataUrl { get; set; } = string.Empty;
    public string OidcProviderUrl { get; set; } = string.Empty;
    
    // Social login settings
    public GoogleAuthSettings Google { get; set; } = new();
    public FacebookAuthSettings Facebook { get; set; } = new();
    
    // Token settings
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 30;
    public int IdTokenExpirationMinutes { get; set; } = 60;
    
    // MFA settings
    public bool MfaEnabled { get; set; } = false;
    public string[] MfaMethods { get; set; } = { "SMS", "TOTP" };
}

public class GoogleAuthSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string[] Scopes { get; set; } = { "openid", "profile", "email" };
}

public class FacebookAuthSettings
{
    public string AppId { get; set; } = string.Empty;
    public string AppSecret { get; set; } = string.Empty;
    public string[] Scopes { get; set; } = { "public_profile", "email" };
}
