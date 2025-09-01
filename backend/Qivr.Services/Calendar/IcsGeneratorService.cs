using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;

namespace Qivr.Services.Calendar;

/// <summary>
/// Service for generating ICS/iCal calendar files for appointments
/// </summary>
public interface IIcsGeneratorService
{
    Task<string> GenerateAppointmentIcs(AppointmentDto appointment);
    Task<byte[]> GenerateAppointmentIcsFile(AppointmentDto appointment);
    Task<string> GenerateBulkAppointmentsIcs(List<AppointmentDto> appointments);
    Task<byte[]> GenerateProviderScheduleIcs(Guid providerId, DateTime startDate, DateTime endDate);
}

public class IcsGeneratorService : IIcsGeneratorService
{
    private readonly ILogger<IcsGeneratorService> _logger;
    private const string DateFormat = "yyyyMMddTHHmmssZ";
    private const string LocalDateFormat = "yyyyMMddTHHmmss";
    
    public IcsGeneratorService(ILogger<IcsGeneratorService> logger)
    {
        _logger = logger;
    }

    public async Task<string> GenerateAppointmentIcs(AppointmentDto appointment)
    {
        await Task.CompletedTask;
        
        var icsBuilder = new StringBuilder();
        
        // Begin calendar
        icsBuilder.AppendLine("BEGIN:VCALENDAR");
        icsBuilder.AppendLine("VERSION:2.0");
        icsBuilder.AppendLine("PRODID:-//Qivr Health//Appointment System//EN");
        icsBuilder.AppendLine("CALSCALE:GREGORIAN");
        icsBuilder.AppendLine("METHOD:REQUEST");
        
        // Add timezone component if needed
        if (appointment.TimeZone != null)
        {
            AddTimeZoneComponent(icsBuilder, appointment.TimeZone);
        }
        
        // Begin event
        icsBuilder.AppendLine("BEGIN:VEVENT");
        
        // Unique identifier
        var uid = $"{appointment.Id}@qivr.health";
        icsBuilder.AppendLine($"UID:{uid}");
        
        // Sequence number (for updates)
        icsBuilder.AppendLine($"SEQUENCE:{appointment.Version ?? 0}");
        
        // Timestamps
        var dtStamp = DateTime.UtcNow.ToString(DateFormat);
        icsBuilder.AppendLine($"DTSTAMP:{dtStamp}");
        
        // Start and end times
        if (appointment.TimeZone != null)
        {
            var tzid = GetIanaTimeZone(appointment.TimeZone);
            icsBuilder.AppendLine($"DTSTART;TZID={tzid}:{appointment.StartTime.ToString(LocalDateFormat)}");
            icsBuilder.AppendLine($"DTEND;TZID={tzid}:{appointment.EndTime.ToString(LocalDateFormat)}");
        }
        else
        {
            icsBuilder.AppendLine($"DTSTART:{appointment.StartTime.ToUniversalTime().ToString(DateFormat)}");
            icsBuilder.AppendLine($"DTEND:{appointment.EndTime.ToUniversalTime().ToString(DateFormat)}");
        }
        
        // Summary/Title
        var summary = $"Appointment with {appointment.Provider?.Name ?? "Healthcare Provider"}";
        if (!string.IsNullOrEmpty(appointment.AppointmentType))
        {
            summary = $"{appointment.AppointmentType} - {summary}";
        }
        icsBuilder.AppendLine($"SUMMARY:{EscapeIcsText(summary)}");
        
        // Description
        var description = GenerateAppointmentDescription(appointment);
        icsBuilder.AppendLine($"DESCRIPTION:{EscapeIcsText(description)}");
        
        // Location
        if (appointment.Clinic != null)
        {
            var location = FormatLocation(appointment.Clinic);
            icsBuilder.AppendLine($"LOCATION:{EscapeIcsText(location)}");
            
            // Geo coordinates if available
            if (appointment.Clinic.Latitude.HasValue && appointment.Clinic.Longitude.HasValue)
            {
                icsBuilder.AppendLine($"GEO:{appointment.Clinic.Latitude:F6};{appointment.Clinic.Longitude:F6}");
            }
        }
        
        // Categories
        var categories = new List<string> { "APPOINTMENT", "HEALTHCARE" };
        if (!string.IsNullOrEmpty(appointment.AppointmentType))
        {
            categories.Add(appointment.AppointmentType.ToUpper());
        }
        icsBuilder.AppendLine($"CATEGORIES:{string.Join(",", categories)}");
        
        // Status
        var status = appointment.Status switch
        {
            "confirmed" => "CONFIRMED",
            "tentative" => "TENTATIVE",
            "cancelled" => "CANCELLED",
            _ => "TENTATIVE"
        };
        icsBuilder.AppendLine($"STATUS:{status}");
        
        // Transparency (busy/free)
        icsBuilder.AppendLine("TRANSP:OPAQUE"); // Shows as busy
        
        // Priority
        icsBuilder.AppendLine("PRIORITY:5"); // Normal priority
        
        // Organizer (clinic/provider)
        if (appointment.Provider != null)
        {
            var organizerEmail = appointment.Provider.Email ?? "noreply@qivr.health";
            var organizerName = appointment.Provider.Name;
            icsBuilder.AppendLine($"ORGANIZER;CN={EscapeIcsText(organizerName)}:mailto:{organizerEmail}");
        }
        
        // Attendee (patient)
        if (appointment.Patient != null)
        {
            var attendeeEmail = appointment.Patient.Email ?? "patient@qivr.health";
            var attendeeName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}";
            icsBuilder.AppendLine($"ATTENDEE;CN={EscapeIcsText(attendeeName)};PARTSTAT=ACCEPTED:mailto:{attendeeEmail}");
        }
        
        // Alarms/Reminders
        AddReminders(icsBuilder, appointment);
        
        // Custom properties
        icsBuilder.AppendLine($"X-QIVR-APPOINTMENT-ID:{appointment.Id}");
        icsBuilder.AppendLine($"X-QIVR-CLINIC-ID:{appointment.ClinicId}");
        icsBuilder.AppendLine($"X-QIVR-PROVIDER-ID:{appointment.ProviderId}");
        icsBuilder.AppendLine($"X-QIVR-PATIENT-ID:{appointment.PatientId}");
        
        // URL for appointment management
        var appointmentUrl = $"https://portal.qivr.health/appointments/{appointment.Id}";
        icsBuilder.AppendLine($"URL:{appointmentUrl}");
        
        // End event
        icsBuilder.AppendLine("END:VEVENT");
        
        // End calendar
        icsBuilder.AppendLine("END:VCALENDAR");
        
        return icsBuilder.ToString();
    }

    public async Task<byte[]> GenerateAppointmentIcsFile(AppointmentDto appointment)
    {
        var icsContent = await GenerateAppointmentIcs(appointment);
        return Encoding.UTF8.GetBytes(icsContent);
    }

    public async Task<string> GenerateBulkAppointmentsIcs(List<AppointmentDto> appointments)
    {
        var icsBuilder = new StringBuilder();
        
        // Begin calendar
        icsBuilder.AppendLine("BEGIN:VCALENDAR");
        icsBuilder.AppendLine("VERSION:2.0");
        icsBuilder.AppendLine("PRODID:-//Qivr Health//Appointment System//EN");
        icsBuilder.AppendLine("CALSCALE:GREGORIAN");
        icsBuilder.AppendLine("METHOD:PUBLISH");
        icsBuilder.AppendLine($"X-WR-CALNAME:Qivr Health Appointments");
        icsBuilder.AppendLine($"X-WR-CALDESC:Your healthcare appointments");
        
        // Add all unique timezones
        var timeZones = appointments
            .Where(a => !string.IsNullOrEmpty(a.TimeZone))
            .Select(a => a.TimeZone)
            .Distinct();
        
        foreach (var tz in timeZones)
        {
            AddTimeZoneComponent(icsBuilder, tz!);
        }
        
        // Add each appointment as an event
        foreach (var appointment in appointments.OrderBy(a => a.StartTime))
        {
            await AddEventToCalendar(icsBuilder, appointment);
        }
        
        // End calendar
        icsBuilder.AppendLine("END:VCALENDAR");
        
        return icsBuilder.ToString();
    }

    public async Task<byte[]> GenerateProviderScheduleIcs(Guid providerId, DateTime startDate, DateTime endDate)
    {
        // This would typically fetch appointments from database
        // For now, returning empty calendar
        var icsBuilder = new StringBuilder();
        
        icsBuilder.AppendLine("BEGIN:VCALENDAR");
        icsBuilder.AppendLine("VERSION:2.0");
        icsBuilder.AppendLine("PRODID:-//Qivr Health//Provider Schedule//EN");
        icsBuilder.AppendLine("CALSCALE:GREGORIAN");
        icsBuilder.AppendLine("METHOD:PUBLISH");
        icsBuilder.AppendLine($"X-WR-CALNAME:Provider Schedule");
        icsBuilder.AppendLine($"X-WR-CALDESC:Schedule for {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");
        icsBuilder.AppendLine("END:VCALENDAR");
        
        await Task.CompletedTask;
        return Encoding.UTF8.GetBytes(icsBuilder.ToString());
    }

    private string GenerateAppointmentDescription(AppointmentDto appointment)
    {
        var description = new StringBuilder();
        
        description.AppendLine($"Appointment Details:");
        description.AppendLine($"Date: {appointment.StartTime:dddd, MMMM d, yyyy}");
        description.AppendLine($"Time: {appointment.StartTime:h:mm tt} - {appointment.EndTime:h:mm tt}");
        
        if (appointment.Provider != null)
        {
            description.AppendLine($"Provider: {appointment.Provider.Name}");
            if (!string.IsNullOrEmpty(appointment.Provider.Specialty))
            {
                description.AppendLine($"Specialty: {appointment.Provider.Specialty}");
            }
        }
        
        if (appointment.Clinic != null)
        {
            description.AppendLine($"Clinic: {appointment.Clinic.Name}");
            if (!string.IsNullOrEmpty(appointment.Clinic.Phone))
            {
                description.AppendLine($"Phone: {appointment.Clinic.Phone}");
            }
        }
        
        if (!string.IsNullOrEmpty(appointment.Notes))
        {
            description.AppendLine($"\\nNotes: {appointment.Notes}");
        }
        
        description.AppendLine($"\\nTo manage this appointment, visit:");
        description.AppendLine($"https://portal.qivr.health/appointments/{appointment.Id}");
        
        if (appointment.Clinic?.Phone != null)
        {
            description.AppendLine($"\\nFor questions, call {appointment.Clinic.Phone}");
        }
        
        return description.ToString();
    }

    private string FormatLocation(ClinicInfo clinic)
    {
        var parts = new List<string>();
        
        if (!string.IsNullOrEmpty(clinic.Name))
            parts.Add(clinic.Name);
            
        if (!string.IsNullOrEmpty(clinic.Address))
            parts.Add(clinic.Address);
            
        if (!string.IsNullOrEmpty(clinic.City))
            parts.Add(clinic.City);
            
        if (!string.IsNullOrEmpty(clinic.State))
            parts.Add(clinic.State);
            
        if (!string.IsNullOrEmpty(clinic.PostalCode))
            parts.Add(clinic.PostalCode);
            
        if (!string.IsNullOrEmpty(clinic.Country))
            parts.Add(clinic.Country);
        
        return string.Join(", ", parts);
    }

    private void AddReminders(StringBuilder icsBuilder, AppointmentDto appointment)
    {
        // Add 24-hour reminder
        icsBuilder.AppendLine("BEGIN:VALARM");
        icsBuilder.AppendLine("TRIGGER:-P1D"); // 1 day before
        icsBuilder.AppendLine("ACTION:DISPLAY");
        icsBuilder.AppendLine($"DESCRIPTION:Reminder: Appointment tomorrow with {appointment.Provider?.Name ?? "Healthcare Provider"}");
        icsBuilder.AppendLine("END:VALARM");
        
        // Add 2-hour reminder
        icsBuilder.AppendLine("BEGIN:VALARM");
        icsBuilder.AppendLine("TRIGGER:-PT2H"); // 2 hours before
        icsBuilder.AppendLine("ACTION:DISPLAY");
        icsBuilder.AppendLine($"DESCRIPTION:Reminder: Appointment in 2 hours with {appointment.Provider?.Name ?? "Healthcare Provider"}");
        icsBuilder.AppendLine("END:VALARM");
        
        // Add email reminder if patient has email
        if (!string.IsNullOrEmpty(appointment.Patient?.Email))
        {
            icsBuilder.AppendLine("BEGIN:VALARM");
            icsBuilder.AppendLine("TRIGGER:-P1D"); // 1 day before
            icsBuilder.AppendLine("ACTION:EMAIL");
            icsBuilder.AppendLine($"ATTENDEE:mailto:{appointment.Patient.Email}");
            icsBuilder.AppendLine($"SUMMARY:Appointment Reminder");
            icsBuilder.AppendLine($"DESCRIPTION:You have an appointment tomorrow at {appointment.StartTime:h:mm tt}");
            icsBuilder.AppendLine("END:VALARM");
        }
    }

    private async Task AddEventToCalendar(StringBuilder icsBuilder, AppointmentDto appointment)
    {
        await Task.CompletedTask;
        
        icsBuilder.AppendLine("BEGIN:VEVENT");
        
        // Basic properties
        icsBuilder.AppendLine($"UID:{appointment.Id}@qivr.health");
        icsBuilder.AppendLine($"DTSTAMP:{DateTime.UtcNow.ToString(DateFormat)}");
        
        // Times
        if (appointment.TimeZone != null)
        {
            var tzid = GetIanaTimeZone(appointment.TimeZone);
            icsBuilder.AppendLine($"DTSTART;TZID={tzid}:{appointment.StartTime.ToString(LocalDateFormat)}");
            icsBuilder.AppendLine($"DTEND;TZID={tzid}:{appointment.EndTime.ToString(LocalDateFormat)}");
        }
        else
        {
            icsBuilder.AppendLine($"DTSTART:{appointment.StartTime.ToUniversalTime().ToString(DateFormat)}");
            icsBuilder.AppendLine($"DTEND:{appointment.EndTime.ToUniversalTime().ToString(DateFormat)}");
        }
        
        // Summary
        var summary = $"{appointment.AppointmentType ?? "Appointment"} - {appointment.Provider?.Name ?? "Provider"}";
        icsBuilder.AppendLine($"SUMMARY:{EscapeIcsText(summary)}");
        
        // Location
        if (appointment.Clinic != null)
        {
            icsBuilder.AppendLine($"LOCATION:{EscapeIcsText(appointment.Clinic.Name)}");
        }
        
        // Status
        var status = appointment.Status == "confirmed" ? "CONFIRMED" : "TENTATIVE";
        icsBuilder.AppendLine($"STATUS:{status}");
        
        icsBuilder.AppendLine("END:VEVENT");
    }

    private void AddTimeZoneComponent(StringBuilder icsBuilder, string timeZone)
    {
        var tzid = GetIanaTimeZone(timeZone);
        
        icsBuilder.AppendLine("BEGIN:VTIMEZONE");
        icsBuilder.AppendLine($"TZID:{tzid}");
        
        // Add standard time component
        icsBuilder.AppendLine("BEGIN:STANDARD");
        icsBuilder.AppendLine("DTSTART:20230402T030000");
        icsBuilder.AppendLine("TZOFFSETFROM:+1100");
        icsBuilder.AppendLine("TZOFFSETTO:+1000");
        icsBuilder.AppendLine("RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU");
        icsBuilder.AppendLine("END:STANDARD");
        
        // Add daylight time component
        icsBuilder.AppendLine("BEGIN:DAYLIGHT");
        icsBuilder.AppendLine("DTSTART:20231001T020000");
        icsBuilder.AppendLine("TZOFFSETFROM:+1000");
        icsBuilder.AppendLine("TZOFFSETTO:+1100");
        icsBuilder.AppendLine("RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=1SU");
        icsBuilder.AppendLine("END:DAYLIGHT");
        
        icsBuilder.AppendLine("END:VTIMEZONE");
    }

    private string GetIanaTimeZone(string timeZone)
    {
        // Map common time zones to IANA format
        return timeZone switch
        {
            "AUS Eastern Standard Time" => "Australia/Sydney",
            "AUS Central Standard Time" => "Australia/Adelaide",
            "E. Australia Standard Time" => "Australia/Brisbane",
            "W. Australia Standard Time" => "Australia/Perth",
            "Tasmania Standard Time" => "Australia/Hobart",
            _ => "Australia/Sydney" // Default to Sydney
        };
    }

    private string EscapeIcsText(string text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;
        
        // Escape special characters
        text = text.Replace("\\", "\\\\");
        text = text.Replace(",", "\\,");
        text = text.Replace(";", "\\;");
        text = text.Replace("\n", "\\n");
        text = text.Replace("\r", "");
        
        // Fold long lines (75 characters max per line)
        if (text.Length > 75)
        {
            var folded = new StringBuilder();
            var lines = new List<string>();
            
            while (text.Length > 0)
            {
                var length = Math.Min(75, text.Length);
                lines.Add(text.Substring(0, length));
                text = text.Substring(length);
            }
            
            return string.Join("\r\n ", lines);
        }
        
        return text;
    }
}

// DTOs for ICS Generation
public class AppointmentDto
{
    public Guid Id { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? AppointmentType { get; set; }
    public string? Status { get; set; }
    public string? TimeZone { get; set; }
    public int? Version { get; set; }
    public string? Notes { get; set; }
    public Guid PatientId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid? ClinicId { get; set; }
    public PatientInfo? Patient { get; set; }
    public ProviderInfo? Provider { get; set; }
    public ClinicInfo? Clinic { get; set; }
}

public class PatientInfo
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

public class ProviderInfo
{
    public string Name { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string? Email { get; set; }
}

public class ClinicInfo
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

// Extension for easy file download in controllers
public static class IcsGeneratorExtensions
{
    public static string GetIcsFileName(this AppointmentDto appointment)
    {
        var sanitizedProvider = appointment.Provider?.Name?.Replace(" ", "_") ?? "appointment";
        var date = appointment.StartTime.ToString("yyyyMMdd");
        return $"appointment_{sanitizedProvider}_{date}.ics";
    }
    
    public static string GetIcsMimeType()
    {
        return "text/calendar";
    }
}
