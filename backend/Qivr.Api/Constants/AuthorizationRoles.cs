namespace Qivr.Api.Constants;

/// <summary>
/// Authorization role constants for consistent role-based access control.
/// Simplified: Just Admin (no ClinicAdmin anymore)
/// Future: Add Staff, Clinician, etc. as needed
/// </summary>
public static class AuthorizationRoles
{
    public const string Admin = "Admin";
    public const string Staff = "Admin,Staff";
    public const string Clinician = "Admin,Clinician";
    public const string AllRoles = "Admin,Staff,Clinician,Patient";
}
