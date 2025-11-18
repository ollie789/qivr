using System;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class MedicalCondition : TenantEntity
{
    public Guid PatientId { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }
    public DateTime DiagnosedDate { get; set; }
    public string Status { get; set; } = "active";
    public string ManagedBy { get; set; } = string.Empty;
    public DateTime LastReviewed { get; set; }
    public string? Notes { get; set; }
    // Allied health specific fields
    public string? AffectedArea { get; set; }
    public string? OnsetType { get; set; } // acute, gradual, chronic
    public string? PreviousTreatments { get; set; }
    public string? AggravatingFactors { get; set; }
    public string? RelievingFactors { get; set; }
}

public class PhysioHistory : TenantEntity
{
    public Guid PatientId { get; set; }
    public string Category { get; set; } = string.Empty; // injury, symptom, treatment, activity, occupation, goal
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public string Status { get; set; } = "active"; // active, resolved, ongoing
    public string? Severity { get; set; } // mild, moderate, severe, critical
    public string? Notes { get; set; }
}

public class PainAssessment : TenantEntity
{
    public Guid PatientId { get; set; }
    public Guid? EvaluationId { get; set; }
    public DateTime RecordedAt { get; set; }
    public string RecordedBy { get; set; } = string.Empty;
    public int OverallPainLevel { get; set; } // 0-10
    public string FunctionalImpact { get; set; } = "none"; // none, mild, moderate, severe
    public string? PainPointsJson { get; set; } // JSON array of pain points
    public string? Notes { get; set; }
    // Body metrics for allied health
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? Bmi { get; set; }
}

// Keep for EF Core migration compatibility - DO NOT USE
[Obsolete("Replaced by PainAssessment - kept for migration compatibility only")]
public class MedicalVital : TenantEntity
{
    public Guid PatientId { get; set; }
    public DateTime RecordedAt { get; set; }
    public int? Systolic { get; set; }
    public int? Diastolic { get; set; }
    public int? HeartRate { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WeightKilograms { get; set; }
    public decimal? HeightCentimetres { get; set; }
    public int? OxygenSaturation { get; set; }
    public int? RespiratoryRate { get; set; }
}

public class MedicalLabResult : TenantEntity
{
    public Guid PatientId { get; set; }
    public DateTime ResultDate { get; set; }
    public string Category { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string ReferenceRange { get; set; } = string.Empty;
    public string Status { get; set; } = "normal";
    public string OrderedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class MedicalMedication : TenantEntity
{
    public Guid PatientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "active";
    public string PrescribedBy { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public int? RefillsRemaining { get; set; }
    public DateTime? LastFilled { get; set; }
    public string? Pharmacy { get; set; }
}

public class MedicalAllergy : TenantEntity
{
    public Guid PatientId { get; set; }
    public string Allergen { get; set; } = string.Empty;
    public string Type { get; set; } = "other";
    public string Severity { get; set; } = "mild";
    public string Reaction { get; set; } = string.Empty;
    public DateTime? DiagnosedDate { get; set; }
    public string? Notes { get; set; }
}

public class MedicalImmunization : TenantEntity
{
    public Guid PatientId { get; set; }
    public string Vaccine { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime? NextDue { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Facility { get; set; } = string.Empty;
    public string? LotNumber { get; set; }
    public string? Series { get; set; }
}

public class MedicalProcedure : TenantEntity
{
    public Guid PatientId { get; set; }
    public string ProcedureName { get; set; } = string.Empty;
    public string? CptCode { get; set; }
    public DateTime ProcedureDate { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Facility { get; set; } = string.Empty;
    public string Status { get; set; } = "completed";
    public string? Outcome { get; set; }
    public string? Complications { get; set; }
    public string? Notes { get; set; }
}
