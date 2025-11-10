using System;
using System.Collections.Generic;
using Qivr.Core.Common;

namespace Qivr.Core.Entities
{
    public class Patient : BaseEntity
    {
        public Guid UserId { get; set; }
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
        public string Country { get; set; } = "Australia";
        
        // Medical History
        public List<string> ChronicConditions { get; set; } = new();
        public List<string> PastSurgeries { get; set; } = new();
        public List<string> Allergies { get; set; } = new();
        public List<string> FamilyHistory { get; set; } = new();
        
        // Emergency Contact
        public string EmergencyContactName { get; set; } = string.Empty;
        public string EmergencyContactPhone { get; set; } = string.Empty;
        public string EmergencyContactRelationship { get; set; } = string.Empty;
        
        // Insurance
        public string InsuranceProvider { get; set; } = string.Empty;
        public string InsurancePolicyNumber { get; set; } = string.Empty;
        public string MedicareNumber { get; set; } = string.Empty;
        
        // Patient Invitation (SaaS)
        public string? InvitationToken { get; set; }
        public DateTime? InvitationExpiresAt { get; set; }
        public DateTime? ActivatedAt { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<Medication> CurrentMedications { get; set; } = new List<Medication>();
        public virtual ICollection<VitalSign> VitalSigns { get; set; } = new List<VitalSign>();
        public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public virtual ICollection<Document> Documents { get; set; } = new List<Document>();
        public virtual ICollection<PromInstance> PromInstances { get; set; } = new List<PromInstance>();
        
        // Computed properties
        public int Age => CalculateAge();
        
        private int CalculateAge()
        {
            var today = DateTime.Today;
            var age = today.Year - DateOfBirth.Year;
            if (DateOfBirth.Date > today.AddYears(-age)) age--;
            return age;
        }
        
        public string FullName => $"{FirstName} {LastName}";
    }
    
    // Moved Medication, VitalSign, and Document classes to PatientRecord.cs to avoid duplication
}
