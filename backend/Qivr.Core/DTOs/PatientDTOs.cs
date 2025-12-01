using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Core.DTOs
{
    public class DemographicsDto
    {
        [Required(ErrorMessage = "First name is required")]
        [MaxLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [MaxLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Date of birth is required")]
        public DateTime DateOfBirth { get; set; }

        [MaxLength(20, ErrorMessage = "Gender cannot exceed 20 characters")]
        public string Gender { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(254, ErrorMessage = "Email cannot exceed 254 characters")]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
        [RegularExpression(@"^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$", ErrorMessage = "Invalid phone format")]
        public string Phone { get; set; } = string.Empty;

        public AddressDto? Address { get; set; }
    }

    public class AddressDto
    {
        [MaxLength(500, ErrorMessage = "Street cannot exceed 500 characters")]
        public string Street { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters")]
        public string City { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "State cannot exceed 100 characters")]
        public string State { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Postal code cannot exceed 20 characters")]
        public string PostalCode { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Country cannot exceed 100 characters")]
        public string? Country { get; set; }
    }

    public class MedicalHistoryDto
    {
        [MaxLength(50, ErrorMessage = "Cannot exceed 50 chronic conditions")]
        public string[] ChronicConditions { get; set; } = Array.Empty<string>();

        [MaxLength(50, ErrorMessage = "Cannot exceed 50 past surgeries")]
        public string[] PastSurgeries { get; set; } = Array.Empty<string>();

        [MaxLength(100, ErrorMessage = "Cannot exceed 100 allergies")]
        public string[] Allergies { get; set; } = Array.Empty<string>();

        [MaxLength(50, ErrorMessage = "Cannot exceed 50 family history entries")]
        public string[] FamilyHistory { get; set; } = Array.Empty<string>();

        [MaxLength(100, ErrorMessage = "Cannot exceed 100 medications")]
        public MedicationDto[] CurrentMedications { get; set; } = Array.Empty<MedicationDto>();
    }

    public class MedicalHistoryUpdateDto
    {
        [MaxLength(50, ErrorMessage = "Cannot exceed 50 chronic conditions")]
        public string[]? ChronicConditions { get; set; }

        [MaxLength(50, ErrorMessage = "Cannot exceed 50 past surgeries")]
        public string[]? PastSurgeries { get; set; }

        [MaxLength(100, ErrorMessage = "Cannot exceed 100 allergies")]
        public string[]? Allergies { get; set; }

        [MaxLength(50, ErrorMessage = "Cannot exceed 50 family history entries")]
        public string[]? FamilyHistory { get; set; }

        [MaxLength(100, ErrorMessage = "Cannot exceed 100 medications")]
        public MedicationDto[]? CurrentMedications { get; set; }
    }

    public class MedicationDto
    {
        [Required(ErrorMessage = "Medication name is required")]
        [MaxLength(200, ErrorMessage = "Medication name cannot exceed 200 characters")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Dosage cannot exceed 100 characters")]
        public string Dosage { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Frequency cannot exceed 100 characters")]
        public string Frequency { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Route cannot exceed 50 characters")]
        public string? Route { get; set; }

        [MaxLength(200, ErrorMessage = "Prescriber name cannot exceed 200 characters")]
        public string? PrescribedBy { get; set; }

        [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
        public string? Notes { get; set; }
    }

    public class VitalSignsDto
    {
        [MaxLength(10, ErrorMessage = "Blood pressure systolic cannot exceed 10 characters")]
        public string? BloodPressureSystolic { get; set; }

        [MaxLength(10, ErrorMessage = "Blood pressure diastolic cannot exceed 10 characters")]
        public string? BloodPressureDiastolic { get; set; }

        [MaxLength(10, ErrorMessage = "Heart rate cannot exceed 10 characters")]
        public string? HeartRate { get; set; }

        [MaxLength(10, ErrorMessage = "Respiratory rate cannot exceed 10 characters")]
        public string? RespiratoryRate { get; set; }

        [MaxLength(10, ErrorMessage = "Temperature cannot exceed 10 characters")]
        public string? Temperature { get; set; }

        [MaxLength(10, ErrorMessage = "Oxygen saturation cannot exceed 10 characters")]
        public string? OxygenSaturation { get; set; }

        [Range(0, 1000, ErrorMessage = "Weight must be between 0 and 1000")]
        public decimal? Weight { get; set; }

        [Range(0, 300, ErrorMessage = "Height must be between 0 and 300")]
        public decimal? Height { get; set; }

        [Range(0, 100, ErrorMessage = "BMI must be between 0 and 100")]
        public decimal? Bmi { get; set; }

        [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
        public string? Notes { get; set; }
    }

    public class TimelineEventDto
    {
        public Guid Id { get; set; }

        [MaxLength(50, ErrorMessage = "Type cannot exceed 50 characters")]
        public string Type { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string Description { get; set; } = string.Empty;

        public DateTime OccurredAt { get; set; }

        [MaxLength(50, ErrorMessage = "Icon cannot exceed 50 characters")]
        public string Icon { get; set; } = string.Empty;

        public Dictionary<string, object>? Metadata { get; set; }
    }

    public class TimelineQueryDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1")]
        public int Page { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 20;

        public DateTime? From { get; set; }
        public DateTime? To { get; set; }

        [MaxLength(20, ErrorMessage = "Cannot exceed 20 event types")]
        public string[]? EventTypes { get; set; }
    }

    public class PatientSummaryDto
    {
        public Guid PatientId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string MedicalRecordNumber { get; set; } = string.Empty;
        public DateTime? LastVisit { get; set; }
        public DateTime? NextAppointment { get; set; }
        public int ActiveConditions { get; set; }
        public int ActiveMedications { get; set; }
        public decimal? RecentPromScore { get; set; }
        public string RiskLevel { get; set; } = "Low";
        public decimal ComplianceRate { get; set; }
    }

    public class PatientDetailDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string MedicalRecordNumber { get; set; } = string.Empty;
        public AddressDto Address { get; set; } = new();
        public MedicalHistoryDto MedicalHistory { get; set; } = new();
        public VitalSignsDto? LatestVitals { get; set; }
        public string? PreferredLanguage { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? InsuranceProvider { get; set; }
        public string? InsurancePolicyNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
