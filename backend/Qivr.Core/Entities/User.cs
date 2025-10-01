using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class User : DeletableEntity, IAuditable
{
    public string CognitoSub { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public string? Phone { get; set; }
    public bool PhoneVerified { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public UserType UserType { get; set; }
    public List<string> Roles { get; set; } = new();
    public string? AvatarUrl { get; set; }
    public Dictionary<string, object> Preferences { get; set; } = new();
    public Dictionary<string, object> Consent { get; set; } = new();
    public DateTime? LastLoginAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual Tenant? Tenant { get; set; }
    public virtual ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();
    public virtual ICollection<Appointment> PatientAppointments { get; set; } = new List<Appointment>();
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    public bool IsPatient => UserType == UserType.Patient;
    public bool IsStaff => UserType == UserType.Staff || UserType == UserType.Admin;
    public bool IsAdmin => UserType == UserType.Admin;
}

public enum UserType
{
    Patient,
    Staff,
    Admin
}
