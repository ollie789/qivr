using System;
using System.Collections.Generic;

namespace Qivr.Core.DTOs
{
    public class DemographicsDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public AddressDto? Address { get; set; }
    }

    public class AddressDto
    {
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string? Country { get; set; }
    }

    public class MedicalHistoryDto
    {
        public string[] ChronicConditions { get; set; } = Array.Empty<string>();
        public string[] PastSurgeries { get; set; } = Array.Empty<string>();
        public string[] Allergies { get; set; } = Array.Empty<string>();
        public string[] FamilyHistory { get; set; } = Array.Empty<string>();
        public MedicationDto[] CurrentMedications { get; set; } = Array.Empty<MedicationDto>();
    }

    public class MedicalHistoryUpdateDto
    {
        public string[]? ChronicConditions { get; set; }
        public string[]? PastSurgeries { get; set; }
        public string[]? Allergies { get; set; }
        public string[]? FamilyHistory { get; set; }
        public MedicationDto[]? CurrentMedications { get; set; }
    }

    public class MedicationDto
    {
        public string Name { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public string? Route { get; set; }
        public string? PrescribedBy { get; set; }
        public string? Notes { get; set; }
    }

    public class VitalSignsDto
    {
        public string? BloodPressureSystolic { get; set; }
        public string? BloodPressureDiastolic { get; set; }
        public string? HeartRate { get; set; }
        public string? RespiratoryRate { get; set; }
        public string? Temperature { get; set; }
        public string? OxygenSaturation { get; set; }
        public decimal? Weight { get; set; }
        public decimal? Height { get; set; }
        public decimal? Bmi { get; set; }
        public string? Notes { get; set; }
    }

    public class TimelineEventDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime OccurredAt { get; set; }
        public string Icon { get; set; } = string.Empty;
        public Dictionary<string, object>? Metadata { get; set; }
    }

    public class TimelineQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
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
