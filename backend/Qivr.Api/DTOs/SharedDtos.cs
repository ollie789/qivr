using System;

namespace Qivr.Api.DTOs;

// Shared DTOs used across multiple controllers

public class MedicationDto
{
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string PrescribedBy { get; set; } = string.Empty;
}

public class VitalSignDto
{
    public Guid? Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public string? BloodPressure { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    public decimal? Bmi { get; set; }
    public int? OxygenSaturation { get; set; }
    public int? RespiratoryRate { get; set; }
    public decimal? BloodGlucose { get; set; }
}

public class AppointmentSummaryDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string? Location { get; set; }
}

public class ClinicStatisticsDto
{
    // Properties for ClinicManagementController
    public int TotalPatients { get; set; }
    public int ActivePatients { get; set; }
    public int TotalProviders { get; set; }
    public int TotalStaff { get; set; }
    public int AppointmentsThisMonth { get; set; }
    public int AppointmentsLastMonth { get; set; }
    public decimal AveragePatientSatisfaction { get; set; }
    public int CompletedPromsThisMonth { get; set; }
    public int PendingProms { get; set; }
    
    // Properties for ClinicDashboardController
    public int TotalAppointmentsToday { get; set; }
    public int CompletedAppointments { get; set; }
    public int PendingAppointments { get; set; }
    public int AverageWaitTime { get; set; }
    public int TotalPatientsThisWeek { get; set; }
    public decimal NoShowRate { get; set; }
}

public class ProviderScheduleDto
{
    // Properties for ClinicManagementController
    public int DefaultAppointmentDuration { get; set; }
    public int BufferTime { get; set; }
    public OperatingHoursDto[] WorkingHours { get; set; } = Array.Empty<OperatingHoursDto>();
    
    // Properties for ClinicDashboardController
    public DateTime Date { get; set; }
    public List<ClinicAppointmentDto> Appointments { get; set; } = new();
}

// Add missing DTO for ClinicDashboardController
public class ClinicAppointmentDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class OperatingHoursDto
{
    public string Day { get; set; } = string.Empty;
    public string Open { get; set; } = string.Empty;
    public string Close { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
}

public class AddressDto
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

// EvaluationDto moved to Qivr.Services namespace - use that instead

