namespace Qivr.Api.Constants;

/// <summary>
/// DEPRECATED: Use AuthorizationRoles instead
/// Simplified role constants after tenant-clinic merge
/// </summary>
public static class Roles
{
    // Simplified roles (no more SystemAdmin)
    public const string Admin = "Admin";              
    public const string Provider = "Clinician";        
    public const string Staff = "Staff";             
    public const string Patient = "Patient";
    
    // Role combinations for common authorization patterns
    public static class Combinations
    {
        public const string AdminRoles = Admin;
        public const string StaffRoles = Admin + "," + Staff;
        public const string ClinicianRoles = Admin + "," + Provider;
        public const string AllRoles = Admin + "," + Provider + "," + Staff + "," + Patient;
    }
}
