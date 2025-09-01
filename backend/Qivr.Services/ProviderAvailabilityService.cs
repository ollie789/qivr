using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Core.Interfaces;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IProviderAvailabilityService
{
    Task<List<TimeSlot>> GetAvailableSlots(Guid providerId, DateTime date, int durationMinutes = 30);
    Task<bool> IsSlotAvailable(Guid providerId, DateTime startTime, DateTime endTime);
    Task<List<ProviderSchedule>> GetProviderSchedule(Guid providerId, DateTime startDate, DateTime endDate);
    Task<bool> BookAppointment(Guid patientId, Guid providerId, DateTime startTime, int durationMinutes, string appointmentType);
    Task<List<Provider>> GetAvailableProviders(DateTime date, string? specialization = null);
    Task<WorkingHours> GetProviderWorkingHours(Guid providerId, DayOfWeek dayOfWeek);
}

public class ProviderAvailabilityService : IProviderAvailabilityService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<ProviderAvailabilityService> _logger;

    // Default working hours (can be overridden per provider)
    private readonly Dictionary<DayOfWeek, WorkingHours> _defaultWorkingHours = new()
    {
        { DayOfWeek.Monday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0) } },
        { DayOfWeek.Tuesday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0) } },
        { DayOfWeek.Wednesday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0) } },
        { DayOfWeek.Thursday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0) } },
        { DayOfWeek.Friday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0) } },
        { DayOfWeek.Saturday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(13, 0, 0) } },
        { DayOfWeek.Sunday, new WorkingHours { Start = TimeSpan.Zero, End = TimeSpan.Zero } } // Closed
    };

    public ProviderAvailabilityService(QivrDbContext context, ILogger<ProviderAvailabilityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<TimeSlot>> GetAvailableSlots(Guid providerId, DateTime date, int durationMinutes = 30)
    {
        var availableSlots = new List<TimeSlot>();
        
        // Get provider's working hours for the day
        var workingHours = await GetProviderWorkingHours(providerId, date.DayOfWeek);
        if (workingHours.Start == TimeSpan.Zero && workingHours.End == TimeSpan.Zero)
        {
            return availableSlots; // Provider doesn't work on this day
        }

        // Get existing appointments for the provider on this date
        var existingAppointments = await _context.Appointments
            .Where(a => a.ProviderId == providerId
                && a.ScheduledStart.Date == date.Date
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.ScheduledStart)
            .ToListAsync();

        // Generate time slots
        var currentSlotStart = date.Date.Add(workingHours.Start);
        var endOfDay = date.Date.Add(workingHours.End);

        while (currentSlotStart.AddMinutes(durationMinutes) <= endOfDay)
        {
            var currentSlotEnd = currentSlotStart.AddMinutes(durationMinutes);
            
            // Check if slot conflicts with existing appointments
            bool isAvailable = !existingAppointments.Any(a => 
                (currentSlotStart >= a.ScheduledStart && currentSlotStart < a.ScheduledEnd) ||
                (currentSlotEnd > a.ScheduledStart && currentSlotEnd <= a.ScheduledEnd) ||
                (currentSlotStart <= a.ScheduledStart && currentSlotEnd >= a.ScheduledEnd));

            // Only add future slots
            if (isAvailable && currentSlotStart > DateTime.UtcNow)
            {
                availableSlots.Add(new TimeSlot
                {
                    Start = currentSlotStart,
                    End = currentSlotEnd,
                    IsAvailable = true
                });
            }

            currentSlotStart = currentSlotStart.AddMinutes(durationMinutes);
        }

        return availableSlots;
    }

    public async Task<bool> IsSlotAvailable(Guid providerId, DateTime startTime, DateTime endTime)
    {
        // Check if provider works during this time
        var workingHours = await GetProviderWorkingHours(providerId, startTime.DayOfWeek);
        if (workingHours.Start == TimeSpan.Zero && workingHours.End == TimeSpan.Zero)
        {
            return false;
        }

        var startTimeOfDay = startTime.TimeOfDay;
        var endTimeOfDay = endTime.TimeOfDay;

        if (startTimeOfDay < workingHours.Start || endTimeOfDay > workingHours.End)
        {
            return false;
        }

        // Check for conflicts with existing appointments
        var hasConflict = await _context.Appointments
            .AnyAsync(a => a.ProviderId == providerId
                && a.Status != AppointmentStatus.Cancelled
                && ((startTime >= a.ScheduledStart && startTime < a.ScheduledEnd) ||
                    (endTime > a.ScheduledStart && endTime <= a.ScheduledEnd) ||
                    (startTime <= a.ScheduledStart && endTime >= a.ScheduledEnd)));

        return !hasConflict;
    }

    public async Task<List<ProviderSchedule>> GetProviderSchedule(Guid providerId, DateTime startDate, DateTime endDate)
    {
        var schedules = new List<ProviderSchedule>();
        var currentDate = startDate.Date;

        while (currentDate <= endDate.Date)
        {
            var workingHours = await GetProviderWorkingHours(providerId, currentDate.DayOfWeek);
            
            var appointments = await _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.ProviderId == providerId
                    && a.ScheduledStart.Date == currentDate.Date
                    && a.Status != AppointmentStatus.Cancelled)
                .OrderBy(a => a.ScheduledStart)
                .ToListAsync();

            var availableSlots = await GetAvailableSlots(providerId, currentDate, 30);

            schedules.Add(new ProviderSchedule
            {
                ProviderId = providerId,
                Date = currentDate,
                WorkingHours = workingHours,
                Appointments = appointments,
                AvailableSlots = availableSlots
            });

            currentDate = currentDate.AddDays(1);
        }

        return schedules;
    }

    public async Task<bool> BookAppointment(Guid patientId, Guid providerId, DateTime startTime, int durationMinutes, string appointmentType)
    {
        var endTime = startTime.AddMinutes(durationMinutes);

        // Verify slot is available
        if (!await IsSlotAvailable(providerId, startTime, endTime))
        {
            _logger.LogWarning("Attempted to book unavailable slot for provider {ProviderId} at {StartTime}", 
                providerId, startTime);
            return false;
        }

        // Check for patient conflicts (patient can't have overlapping appointments)
        var patientHasConflict = await _context.Appointments
            .AnyAsync(a => a.PatientId == patientId
                && a.Status != AppointmentStatus.Cancelled
                && ((startTime >= a.ScheduledStart && startTime < a.ScheduledEnd) ||
                    (endTime > a.ScheduledStart && endTime <= a.ScheduledEnd)));

        if (patientHasConflict)
        {
            _logger.LogWarning("Patient {PatientId} has conflicting appointment at {StartTime}", 
                patientId, startTime);
            return false;
        }

        try
        {
            // Get tenant ID from provider
            var provider = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == providerId);
                
            if (provider == null)
            {
                _logger.LogError("Provider {ProviderId} not found", providerId);
                return false;
            }

            // Create the appointment
            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = provider.TenantId,
                PatientId = patientId,
                ProviderId = providerId,
                ScheduledStart = startTime,
                ScheduledEnd = endTime,
                AppointmentType = appointmentType,
                Status = AppointmentStatus.Scheduled,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully booked appointment {AppointmentId} for patient {PatientId} with provider {ProviderId}", 
                appointment.Id, patientId, providerId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error booking appointment for patient {PatientId} with provider {ProviderId}", 
                patientId, providerId);
            return false;
        }
    }

    public async Task<List<Provider>> GetAvailableProviders(DateTime date, string? specialization = null)
    {
        var availableProviders = new List<Provider>();
        
        // Get all providers (staff users can be providers)
        var query = _context.Users
            .Where(u => u.UserType == UserType.Staff || u.UserType == UserType.Admin);

        if (!string.IsNullOrEmpty(specialization))
        {
            // For now, we'll use role-based filtering as a proxy for specialization
            // In a real implementation, you'd have a separate Provider entity or metadata
            query = query.Where(u => u.Roles.Contains(specialization));
        }

        var providers = await query.ToListAsync();

        // Check each provider's availability
        foreach (var provider in providers)
        {
            var slots = await GetAvailableSlots(provider.Id, date);
            if (slots.Any())
            {
                availableProviders.Add(new Provider
                {
                    Id = provider.Id,
                    Name = $"{provider.FirstName} {provider.LastName}",
                    Specialization = provider.Roles.FirstOrDefault() ?? "General",
                    AvailableSlotCount = slots.Count()
                });
            }
        }

        return availableProviders;
    }

    public async Task<WorkingHours> GetProviderWorkingHours(Guid providerId, DayOfWeek dayOfWeek)
    {
        // In a real implementation, this would fetch from a provider schedule table
        // For now, return default working hours
        return await Task.FromResult(_defaultWorkingHours[dayOfWeek]);
    }
}

// Supporting classes
// Using TimeSlot from Qivr.Core.Interfaces instead of defining our own

public class WorkingHours
{
    public TimeSpan Start { get; set; }
    public TimeSpan End { get; set; }
}

public class ProviderSchedule
{
    public Guid ProviderId { get; set; }
    public DateTime Date { get; set; }
    public WorkingHours WorkingHours { get; set; } = new();
    public List<Appointment> Appointments { get; set; } = new();
    public List<TimeSlot> AvailableSlots { get; set; } = new();
}

public class Provider
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public int AvailableSlotCount { get; set; }
}
