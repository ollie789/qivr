using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Core.DTOs
{
    // Phase 4.4: Clinic Management DTOs (now represent Tenant clinic properties)
    // These DTOs are still valid as they represent clinic data that's now stored in Tenant entity
    public class OperatingHoursDto
    {
        [Required(ErrorMessage = "Day is required")]
        [MaxLength(20, ErrorMessage = "Day cannot exceed 20 characters")]
        public string Day { get; set; } = string.Empty;

        [MaxLength(10, ErrorMessage = "Open time cannot exceed 10 characters")]
        public string Open { get; set; } = string.Empty;

        [MaxLength(10, ErrorMessage = "Close time cannot exceed 10 characters")]
        public string Close { get; set; } = string.Empty;

        public bool IsClosed { get; set; }
    }

    public class ProviderScheduleDto
    {
        public Guid ProviderId { get; set; }

        [MaxLength(200, ErrorMessage = "Provider name cannot exceed 200 characters")]
        public string ProviderName { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Specialty cannot exceed 100 characters")]
        public string Specialty { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Cannot exceed 200 schedule slots")]
        public List<ScheduleSlotDto> Schedule { get; set; } = new();

        // Properties for ClinicManagementController
        [Range(5, 480, ErrorMessage = "Appointment duration must be between 5 and 480 minutes")]
        public int DefaultAppointmentDuration { get; set; }

        [Range(0, 120, ErrorMessage = "Buffer time must be between 0 and 120 minutes")]
        public int BufferTime { get; set; }

        [MaxLength(7, ErrorMessage = "Cannot exceed 7 working hour entries")]
        public OperatingHoursDto[] WorkingHours { get; set; } = Array.Empty<OperatingHoursDto>();

        // Properties for ClinicDashboardController
        public DateTime Date { get; set; }

        [MaxLength(100, ErrorMessage = "Cannot exceed 100 appointments")]
        public List<ClinicAppointmentDto> Appointments { get; set; } = new();
    }

    public class ScheduleSlotDto
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsAvailable { get; set; }

        [MaxLength(100, ErrorMessage = "Appointment type cannot exceed 100 characters")]
        public string? AppointmentType { get; set; }

        public Guid? PatientId { get; set; }

        [MaxLength(200, ErrorMessage = "Patient name cannot exceed 200 characters")]
        public string? PatientName { get; set; }
    }

    // Clinic Dashboard DTOs
    public class ClinicAppointmentDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }

        [MaxLength(200, ErrorMessage = "Patient name cannot exceed 200 characters")]
        public string PatientName { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(254, ErrorMessage = "Email cannot exceed 254 characters")]
        public string PatientEmail { get; set; } = string.Empty;

        public DateTime AppointmentDateTime { get; set; }
        public DateTime ScheduledStart { get; set; }
        public DateTime ScheduledEnd { get; set; }

        [MaxLength(100, ErrorMessage = "Appointment type cannot exceed 100 characters")]
        public string AppointmentType { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
        public string Status { get; set; } = string.Empty;

        public Guid ProviderId { get; set; }

        [MaxLength(200, ErrorMessage = "Provider name cannot exceed 200 characters")]
        public string ProviderName { get; set; } = string.Empty;

        [MaxLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters")]
        public string? Notes { get; set; }

        [MaxLength(1000, ErrorMessage = "Reason for visit cannot exceed 1000 characters")]
        public string? ReasonForVisit { get; set; }

        [MaxLength(500, ErrorMessage = "Location cannot exceed 500 characters")]
        public string Location { get; set; } = string.Empty;

        [Range(5, 480, ErrorMessage = "Duration must be between 5 and 480 minutes")]
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
