using System;
using System.Collections.Generic;

namespace Qivr.Core.DTOs
{
    // Clinic Management DTOs
    public class OperatingHoursDto
    {
        public string Day { get; set; } = string.Empty;
        public string Open { get; set; } = string.Empty;
        public string Close { get; set; } = string.Empty;
        public bool IsClosed { get; set; }
    }

    public class ProviderScheduleDto
    {
        public Guid ProviderId { get; set; }
        public string ProviderName { get; set; }
        public string Specialty { get; set; }
        public List<ScheduleSlotDto> Schedule { get; set; } = new();
        
        // Properties for ClinicManagementController
        public int DefaultAppointmentDuration { get; set; }
        public int BufferTime { get; set; }
        public OperatingHoursDto[] WorkingHours { get; set; } = Array.Empty<OperatingHoursDto>();
        
        // Properties for ClinicDashboardController
        public DateTime Date { get; set; }
        public List<ClinicAppointmentDto> Appointments { get; set; } = new();
    }

    public class ScheduleSlotDto
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public string? AppointmentType { get; set; }
        public Guid? PatientId { get; set; }
        public string? PatientName { get; set; }
    }

    // Clinic Dashboard DTOs
    public class ClinicAppointmentDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public DateTime AppointmentDateTime { get; set; }
        public DateTime ScheduledStart { get; set; }
        public DateTime ScheduledEnd { get; set; }
        public string AppointmentType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public Guid ProviderId { get; set; }
        public string ProviderName { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? ReasonForVisit { get; set; }
        public string Location { get; set; } = string.Empty;
        public int Duration { get; set; } // in minutes
    }

    public class ClinicStatisticsDto
    {
        // Common properties
        public int TotalPatients { get; set; }
        public int ActivePatients { get; set; }
        public int TotalProviders { get; set; }
        
        // Properties for ClinicManagementController
        public int TotalStaff { get; set; }
        public int AppointmentsThisMonth { get; set; }
        public int AppointmentsLastMonth { get; set; }
        public decimal AveragePatientSatisfaction { get; set; }
        public int CompletedPromsThisMonth { get; set; }
        public int PendingProms { get; set; }
        
        // Properties for ClinicDashboardController
        public int TodayAppointments { get; set; }
        public int TotalAppointmentsToday { get; set; }
        public int CompletedAppointments { get; set; }
        public int PendingAppointments { get; set; }
        public int AverageWaitTime { get; set; }
        public int TotalPatientsThisWeek { get; set; }
        public decimal NoShowRate { get; set; }
        public int WeekAppointments { get; set; }
        public int MonthAppointments { get; set; }
        public int PendingEvaluations { get; set; }
        public int CompletedEvaluations { get; set; }
        public decimal AverageRating { get; set; }
        public int UnreadMessages { get; set; }
        public Dictionary<string, int> AppointmentsByType { get; set; } = new();
        public Dictionary<string, int> AppointmentsByStatus { get; set; } = new();
    }

    // Patient Records DTOs
    public class VitalSignDto
    {
        public Guid? Id { get; set; }
        public Guid PatientId { get; set; }
        public DateTime RecordedAt { get; set; }
        public string? BloodPressure { get; set; }  // e.g., "120/80"
        public int? SystolicBP { get; set; }
        public int? DiastolicBP { get; set; }
        public int? HeartRate { get; set; }
        public decimal? Temperature { get; set; }
        public string? TemperatureUnit { get; set; } // F or C
        public decimal? Weight { get; set; }
        public string? WeightUnit { get; set; } // kg or lbs
        public decimal? Height { get; set; }
        public string? HeightUnit { get; set; } // cm or inches
        public decimal? Bmi { get; set; }  // Use lowercase 'mi' for consistency
        public decimal? BMI { get; set; }  // Also keep uppercase for compatibility
        public int? OxygenSaturation { get; set; }
        public int? RespiratoryRate { get; set; }
        public decimal? BloodGlucose { get; set; }
        public string? Notes { get; set; }
        public string RecordedBy { get; set; }
    }

    public class AppointmentSummaryDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }  // Also known as AppointmentDate
        public DateTime AppointmentDate { get; set; }
        public string Provider { get; set; } = string.Empty;  // Also known as ProviderName
        public string ProviderName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;  // Also known as AppointmentType
        public string AppointmentType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string ChiefComplaint { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public string TreatmentPlan { get; set; } = string.Empty;
        public List<string> Prescriptions { get; set; } = new();
        public string FollowUpInstructions { get; set; } = string.Empty;
        public DateTime? NextAppointmentDate { get; set; }
    }
}
