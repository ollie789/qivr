namespace Qivr.Api.Config;

public class DevAuthSettings
{
    public bool Enabled { get; set; } = true;
    public DevAuthUserSettings DefaultUser { get; set; } = new();
    public string? DefaultRole { get; set; }
    public string? DefaultTenantId { get; set; }
}

public class DevAuthUserSettings
{
    public string Id { get; set; } = "dev-user-00000000-0000-0000-0000-000000000000";
    public string Email { get; set; } = "dev.user@qivr.local";
    public string FirstName { get; set; } = "Dev";
    public string LastName { get; set; } = "User";
    public string? TenantId { get; set; }
    public string Role { get; set; } = "Clinician";
}
