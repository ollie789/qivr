namespace Qivr.Api.Constants;

/// <summary>
/// Standardized role constants to eliminate naming inconsistencies
/// </summary>
public static class Roles
{
    // System-level roles
    public const string SystemAdmin = "SystemAdmin";
    
    // Clinic-level roles  
    public const string Admin = "Admin";              // Clinic owner/administrator
    public const string Provider = "Provider";        // Healthcare providers (doctors, nurses, etc.)
    public const string Staff = "Staff";             // Clinic staff (receptionists, etc.)
    
    // Patient role
    public const string Patient = "Patient";
    
    // Role combinations for common authorization patterns
    public static class Combinations
    {
        public const string SystemAndAdmin = SystemAdmin + "," + Admin;
        public const string AdminAndProvider = Admin + "," + Provider;
        public const string AdminProviderStaff = Admin + "," + Provider + "," + Staff;
        public const string AllClinicRoles = Admin + "," + Provider + "," + Staff;
        public const string AllRoles = SystemAdmin + "," + Admin + "," + Provider + "," + Staff + "," + Patient;
        
        // Specific access patterns
        public const string ClinicManagement = SystemAdmin + "," + Admin;
        public const string PatientAccess = Admin + "," + Provider + "," + Staff;
        public const string ProviderAccess = Admin + "," + Provider;
        public const string ClinicalAccess = Provider + "," + Admin;
    }
}
