using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class PatientRecord : TenantEntity
{
    public Guid PatientId { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    
    // Demographics
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    
    // Address
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    
    // Medical History
    public List<string> ChronicConditions { get; set; } = new();
    public List<string> PastSurgeries { get; set; } = new();
    public List<string> Allergies { get; set; } = new();
    public List<string> FamilyHistory { get; set; } = new();
    
    // Emergency Contact
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public string EmergencyContactRelation { get; set; } = string.Empty;
    
    // Medicare Information
    public string MedicareNumber { get; set; } = string.Empty;
    public string MedicareRef { get; set; } = string.Empty;
    public string MedicareExpiry { get; set; } = string.Empty;

    // Private Health Insurance
    public string InsuranceProvider { get; set; } = string.Empty;
    public string InsurancePolicyNumber { get; set; } = string.Empty;
    public string InsuranceGroupNumber { get; set; } = string.Empty;
    public string PrimaryCarePhysician { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual ICollection<VitalSign> VitalSigns { get; set; } = new List<VitalSign>();
    public virtual ICollection<Medication> Medications { get; set; } = new List<Medication>();
    public virtual ICollection<PatientDocument> Documents { get; set; } = new List<PatientDocument>();
}

public class VitalSign : TenantEntity
{
    public Guid PatientRecordId { get; set; }
    public DateTime RecordedAt { get; set; }
    public Guid? RecordedById { get; set; }
    
    // Vital measurements
    public string? BloodPressureSystolic { get; set; }
    public string? BloodPressureDiastolic { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Temperature { get; set; }
    public string? TemperatureUnit { get; set; } = "F"; // F or C
    public decimal? Weight { get; set; }
    public string? WeightUnit { get; set; } = "lbs"; // lbs or kg
    public decimal? Height { get; set; }
    public string? HeightUnit { get; set; } = "in"; // in or cm
    public decimal? Bmi { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? OxygenSaturation { get; set; }
    public decimal? BloodGlucose { get; set; }
    public string? PainLevel { get; set; } // 0-10 scale
    
    // Navigation properties
    public virtual PatientRecord? PatientRecord { get; set; }
    public virtual User? RecordedBy { get; set; }
}

public class Medication : TenantEntity
{
    public Guid PatientRecordId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty; // Oral, IV, etc.
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PrescribedBy { get; set; }
    public string? Instructions { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Reason { get; set; }
    
    // Navigation properties
    public virtual PatientRecord? PatientRecord { get; set; }
}

public class PatientDocument : TenantEntity
{
    public Guid PatientRecordId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty; // Lab Results, Imaging, Referral, etc.
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public Guid UploadedById { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    
    // Navigation properties
    public virtual PatientRecord? PatientRecord { get; set; }
    public virtual User? UploadedBy { get; set; }
}
