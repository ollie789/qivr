using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Core.Interfaces;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IProviderAvailabilityService
{
    Task<List<Qivr.Core.Interfaces.TimeSlot>> GetAvailableSlots(Guid providerId, DateTime date, int durationMinutes = 30);
    Task<bool> IsSlotAvailable(Guid providerId, DateTime startTime, DateTime endTime);
    Task<List<ProviderDailySchedule>> GetProviderSchedule(Guid providerId, DateTime startDate, DateTime endDate);
    Task<bool> BookAppointment(Guid patientId, Guid providerId, DateTime startTime, int durationMinutes, string appointmentType);
    Task<List<ProviderAvailability>> GetAvailableProviders(DateTime date, string? specialization = null);
    Task<WorkingHours> GetProviderWorkingHours(Guid providerId, DayOfWeek dayOfWeek);
    Task<WorkingHours> GetProviderWorkingHoursForDate(Guid providerId, DateTime date);
    Task<bool> IsProviderAvailableOnDate(Guid providerId, DateTime date);

    // Schedule management
    Task<List<ProviderSchedule>> GetProviderWeeklySchedule(Guid providerId);
    Task SetProviderWeeklySchedule(Guid providerId, List<ProviderSchedule> schedules);
    Task<List<ProviderTimeOff>> GetProviderTimeOffs(Guid providerId, DateTime? startDate = null, DateTime? endDate = null);
    Task<ProviderTimeOff> AddProviderTimeOff(ProviderTimeOff timeOff);
    Task<bool> DeleteProviderTimeOff(Guid timeOffId);
    Task<ProviderScheduleOverride?> GetScheduleOverride(Guid providerId, DateTime date);
    Task SetScheduleOverride(ProviderScheduleOverride scheduleOverride);
    Task InitializeProviderDefaultSchedule(Guid providerId);
}

public class ProviderAvailabilityService : IProviderAvailabilityService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<ProviderAvailabilityService> _logger;

    // Default working hours - used when provider has no schedule configured
    private readonly Dictionary<DayOfWeek, WorkingHours> _defaultWorkingHours = new()
    {
        { DayOfWeek.Monday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0), IsWorkingDay = true } },
        { DayOfWeek.Tuesday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0), IsWorkingDay = true } },
        { DayOfWeek.Wednesday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0), IsWorkingDay = true } },
        { DayOfWeek.Thursday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0), IsWorkingDay = true } },
        { DayOfWeek.Friday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0), IsWorkingDay = true } },
        { DayOfWeek.Saturday, new WorkingHours { Start = new TimeSpan(9, 0, 0), End = new TimeSpan(13, 0, 0), IsWorkingDay = true } },
        { DayOfWeek.Sunday, new WorkingHours { Start = TimeSpan.Zero, End = TimeSpan.Zero, IsWorkingDay = false } }
    };

    public ProviderAvailabilityService(QivrDbContext context, ILogger<ProviderAvailabilityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Qivr.Core.Interfaces.TimeSlot>> GetAvailableSlots(Guid providerId, DateTime date, int durationMinutes = 30)
    {
        var availableSlots = new List<Qivr.Core.Interfaces.TimeSlot>();

        // Get provider - try by Provider.Id first, then by UserId
        // Use IgnoreQueryFilters since tenant context may not be set in service layer
        var provider = await _context.Providers.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == providerId || p.UserId == providerId);
        if (provider == null)
        {
            _logger.LogWarning("GetAvailableSlots: Provider not found for ID {ProviderId}", providerId);
            return availableSlots;
        }

        // Use the actual Provider.Id for all subsequent lookups
        var actualProviderId = provider.Id;

        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == provider.TenantId);
        var timezone = tenant?.Timezone ?? "Australia/Sydney";

        TimeZoneInfo tz;
        try
        {
            tz = TimeZoneInfo.FindSystemTimeZoneById(timezone);
        }
        catch
        {
            // Fallback to UTC if timezone not found
            _logger.LogWarning("Timezone {Timezone} not found, using UTC", timezone);
            tz = TimeZoneInfo.Utc;
        }

        // The input date from the frontend is typically in the format "yyyy-MM-dd"
        // which gets parsed as a local date without time. We treat this as the
        // desired date in the tenant's timezone.
        var localDate = date.Date;

        _logger.LogDebug("GetAvailableSlots: Provider {ProviderId}, Date {Date}, Timezone {TZ}, LocalDate {LocalDate}",
            actualProviderId, date, timezone, localDate);

        // Check if provider is available on this date
        if (!await IsProviderAvailableOnDate(actualProviderId, localDate))
        {
            return availableSlots;
        }

        // Get provider's working hours for the day (considering overrides)
        var workingHours = await GetProviderWorkingHoursForDate(actualProviderId, localDate);
        if (!workingHours.IsWorkingDay || (workingHours.Start == TimeSpan.Zero && workingHours.End == TimeSpan.Zero))
        {
            return availableSlots;
        }

        // Get the schedule to determine buffer time
        var schedule = await _context.ProviderSchedules.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.ProviderId == actualProviderId && s.DayOfWeek == localDate.DayOfWeek);
        var bufferMinutes = schedule?.BufferMinutes ?? 0;
        var slotDuration = schedule?.DefaultSlotDurationMinutes ?? durationMinutes;

        // Get existing appointments for the provider on this date
        // Convert local date range to UTC for database query
        var localDayStart = localDate;
        var localDayEnd = localDate.AddDays(1);
        var utcDayStart = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localDayStart, DateTimeKind.Unspecified), tz);
        var utcDayEnd = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localDayEnd, DateTimeKind.Unspecified), tz);

        // Check by both ProviderProfileId and ProviderId (user ID) for backwards compatibility
        // Use IgnoreQueryFilters to bypass tenant RLS since we've already validated the provider
        var existingAppointments = await _context.Appointments.IgnoreQueryFilters()
            .Where(a => (a.ProviderProfileId == actualProviderId || a.ProviderId == provider.UserId)
                && a.ScheduledStart >= utcDayStart
                && a.ScheduledStart < utcDayEnd
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.ScheduledStart)
            .ToListAsync();

        // Generate time slots in local time, then convert to UTC for response
        var currentSlotStart = localDate.Add(workingHours.Start);
        var endOfDay = localDate.Add(workingHours.End);

        while (currentSlotStart.AddMinutes(slotDuration) <= endOfDay)
        {
            var currentSlotEnd = currentSlotStart.AddMinutes(slotDuration);

            // Skip break time if configured
            if (workingHours.BreakStart.HasValue && workingHours.BreakEnd.HasValue)
            {
                var breakStart = localDate.Add(workingHours.BreakStart.Value);
                var breakEnd = localDate.Add(workingHours.BreakEnd.Value);

                if (currentSlotStart < breakEnd && currentSlotEnd > breakStart)
                {
                    // Slot overlaps with break, skip to after break
                    currentSlotStart = breakEnd;
                    continue;
                }
            }

            // Convert local slot times to UTC for comparison with appointments
            var slotStartUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(currentSlotStart, DateTimeKind.Unspecified), tz);
            var slotEndUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(currentSlotEnd, DateTimeKind.Unspecified), tz);

            // Check if slot conflicts with existing appointments (including buffer)
            // Using the correct overlap formula: StartA < EndB AND EndA > StartB
            bool hasConflict = existingAppointments.Any(a =>
            {
                var apptStartWithBuffer = a.ScheduledStart.AddMinutes(-bufferMinutes);
                var apptEndWithBuffer = a.ScheduledEnd.AddMinutes(bufferMinutes);

                // Two intervals [A,B) and [C,D) overlap if A < D AND B > C
                return slotStartUtc < apptEndWithBuffer && slotEndUtc > apptStartWithBuffer;
            });

            // Only add future slots (compare in UTC)
            if (!hasConflict && slotStartUtc > DateTime.UtcNow)
            {
                availableSlots.Add(new Qivr.Core.Interfaces.TimeSlot
                {
                    Start = slotStartUtc,
                    End = slotEndUtc,
                    IsAvailable = true
                });
            }

            currentSlotStart = currentSlotStart.AddMinutes(slotDuration + bufferMinutes);
        }

        return availableSlots;
    }

    public async Task<bool> IsSlotAvailable(Guid providerId, DateTime startTime, DateTime endTime)
    {
        _logger.LogInformation("IsSlotAvailable: Checking slot for provider {ProviderId}, StartTime {StartTime} (Kind: {StartKind}), EndTime {EndTime} (Kind: {EndKind})",
            providerId, startTime, startTime.Kind, endTime, endTime.Kind);

        // Get provider - try by Provider.Id first, then by UserId
        // Use IgnoreQueryFilters since tenant context may not be set in service layer
        var provider = await _context.Providers.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == providerId || p.UserId == providerId);
        if (provider == null)
        {
            _logger.LogWarning("IsSlotAvailable: Provider not found for ID {ProviderId}", providerId);
            return false;
        }

        // Use the actual Provider.Id for all subsequent lookups
        var actualProviderId = provider.Id;

        _logger.LogDebug("IsSlotAvailable: Resolved provider ID {InputId} to profile {ProfileId}", providerId, actualProviderId);

        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == provider.TenantId);
        var timezone = tenant?.Timezone ?? "Australia/Sydney";

        TimeZoneInfo tz;
        try
        {
            tz = TimeZoneInfo.FindSystemTimeZoneById(timezone);
        }
        catch
        {
            // Fallback to UTC if timezone not found
            _logger.LogWarning("Timezone {Timezone} not found, using UTC", timezone);
            tz = TimeZoneInfo.Utc;
        }

        // Convert to local time for working hours comparison
        // If the time is Unspecified, treat it as UTC (this is the typical case from API calls)
        var utcStartTime = startTime.Kind == DateTimeKind.Utc ? startTime : DateTime.SpecifyKind(startTime, DateTimeKind.Utc);
        var utcEndTime = endTime.Kind == DateTimeKind.Utc ? endTime : DateTime.SpecifyKind(endTime, DateTimeKind.Utc);

        var localStart = TimeZoneInfo.ConvertTimeFromUtc(utcStartTime, tz);
        var localEnd = TimeZoneInfo.ConvertTimeFromUtc(utcEndTime, tz);

        _logger.LogInformation("IsSlotAvailable: Timezone {TZ}, UTC Start {UtcStart}, Local Start {LocalStart}, UTC End {UtcEnd}, Local End {LocalEnd}",
            timezone, utcStartTime, localStart, utcEndTime, localEnd);

        // Validate: Start must be before End
        if (localStart >= localEnd)
        {
            _logger.LogWarning("IsSlotAvailable: Invalid slot - start {Start} >= end {End}", localStart, localEnd);
            return false;
        }

        // Check if provider is available on this date (using local date)
        var isAvailableOnDate = await IsProviderAvailableOnDate(actualProviderId, localStart.Date);
        if (!isAvailableOnDate)
        {
            _logger.LogInformation("IsSlotAvailable: Provider {ProviderId} is NOT available on date {Date} (time off or non-working day)",
                actualProviderId, localStart.Date);
            return false;
        }

        // Check if provider works during this time
        var workingHours = await GetProviderWorkingHoursForDate(actualProviderId, localStart.Date);
        _logger.LogInformation("IsSlotAvailable: Working hours for {Date}: IsWorkingDay={IsWorking}, Start={Start}, End={End}",
            localStart.Date, workingHours.IsWorkingDay, workingHours.Start, workingHours.End);

        if (!workingHours.IsWorkingDay)
        {
            _logger.LogInformation("IsSlotAvailable: Provider {ProviderId} does not work on {DayOfWeek}", actualProviderId, localStart.DayOfWeek);
            return false;
        }

        var startTimeOfDay = localStart.TimeOfDay;
        var endTimeOfDay = localEnd.TimeOfDay;

        if (startTimeOfDay < workingHours.Start || endTimeOfDay > workingHours.End)
        {
            _logger.LogInformation("IsSlotAvailable: Requested time {ReqStart}-{ReqEnd} is outside working hours {WorkStart}-{WorkEnd}",
                startTimeOfDay, endTimeOfDay, workingHours.Start, workingHours.End);
            return false;
        }

        // Check break time overlap
        if (workingHours.BreakStart.HasValue && workingHours.BreakEnd.HasValue)
        {
            // Break overlaps if: startTimeOfDay < breakEnd AND endTimeOfDay > breakStart
            if (startTimeOfDay < workingHours.BreakEnd.Value && endTimeOfDay > workingHours.BreakStart.Value)
            {
                _logger.LogInformation("IsSlotAvailable: Requested time overlaps with break {BreakStart}-{BreakEnd}",
                    workingHours.BreakStart.Value, workingHours.BreakEnd.Value);
                return false; // Overlaps with break
            }
        }

        // Check for conflicts with existing appointments using correct overlap formula:
        // Two intervals [A,B) and [C,D) overlap if A < D AND B > C
        // Check both ProviderProfileId and ProviderId for backwards compatibility
        // Use original times (UTC) for database comparison since appointments are stored in UTC
        // Use IgnoreQueryFilters to bypass tenant RLS since we've already validated the provider

        // Get conflicting appointments for detailed logging
        var conflictingAppointments = await _context.Appointments.IgnoreQueryFilters()
            .Where(a => (a.ProviderProfileId == actualProviderId || a.ProviderId == provider.UserId)
                && a.Status != AppointmentStatus.Cancelled
                && utcStartTime < a.ScheduledEnd
                && utcEndTime > a.ScheduledStart)
            .Select(a => new { a.Id, a.ScheduledStart, a.ScheduledEnd, a.Status })
            .ToListAsync();

        var hasConflict = conflictingAppointments.Any();

        if (hasConflict)
        {
            _logger.LogInformation("IsSlotAvailable: Found {Count} conflicting appointments for provider {ProviderId} in slot {Start}-{End}:",
                conflictingAppointments.Count, actualProviderId, utcStartTime, utcEndTime);
            foreach (var appt in conflictingAppointments)
            {
                _logger.LogInformation("  - Appointment {Id}: {Start} to {End} (Status: {Status})",
                    appt.Id, appt.ScheduledStart, appt.ScheduledEnd, appt.Status);
            }
        }
        else
        {
            _logger.LogInformation("IsSlotAvailable: No conflicts found. Slot {Start}-{End} is AVAILABLE for provider {ProviderId}",
                utcStartTime, utcEndTime, actualProviderId);
        }

        return !hasConflict;
    }

    public async Task<bool> IsProviderAvailableOnDate(Guid providerId, DateTime date)
    {
        // Npgsql 8+ requires UTC DateTimes - normalize the date for comparison
        var dateStart = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var dateEnd = DateTime.SpecifyKind(date.Date.AddDays(1), DateTimeKind.Utc);

        // Check for time off (including all-day blocks)
        var hasTimeOff = await _context.ProviderTimeOffs.IgnoreQueryFilters()
            .AnyAsync(t => t.ProviderId == providerId
                && t.IsApproved
                && t.StartDateTime < dateEnd
                && t.EndDateTime >= dateStart);

        if (hasTimeOff)
        {
            return false;
        }

        // Check for schedule override that marks the day as non-working
        var scheduleOverride = await GetScheduleOverride(providerId, date);
        if (scheduleOverride != null && !scheduleOverride.IsWorkingDay)
        {
            return false;
        }

        return true;
    }

    public async Task<WorkingHours> GetProviderWorkingHoursForDate(Guid providerId, DateTime date)
    {
        // First check for a schedule override
        var scheduleOverride = await GetScheduleOverride(providerId, date);
        if (scheduleOverride != null)
        {
            return new WorkingHours
            {
                Start = scheduleOverride.GetStartTimeSpan() ?? TimeSpan.Zero,
                End = scheduleOverride.GetEndTimeSpan() ?? TimeSpan.Zero,
                IsWorkingDay = scheduleOverride.IsWorkingDay
            };
        }

        // Otherwise get the regular schedule
        return await GetProviderWorkingHours(providerId, date.DayOfWeek);
    }

    public async Task<List<ProviderDailySchedule>> GetProviderSchedule(Guid providerId, DateTime startDate, DateTime endDate)
    {
        var schedules = new List<ProviderDailySchedule>();
        var currentDate = startDate.Date;

        // Resolve the provider - the providerId might be either Provider.Id or User.Id
        var provider = await _context.Providers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == providerId || p.UserId == providerId);

        if (provider == null)
        {
            _logger.LogWarning("GetProviderSchedule: Provider not found for ID {ProviderId}", providerId);
            return schedules;
        }

        var actualProviderId = provider.Id;
        var providerUserId = provider.UserId;

        while (currentDate <= endDate.Date)
        {
            var workingHours = await GetProviderWorkingHoursForDate(actualProviderId, currentDate);
            var isAvailable = await IsProviderAvailableOnDate(actualProviderId, currentDate);

            // Npgsql 8+ requires UTC DateTimes
            var dayStart = DateTime.SpecifyKind(currentDate.Date, DateTimeKind.Utc);
            var dayEnd = DateTime.SpecifyKind(currentDate.Date.AddDays(1), DateTimeKind.Utc);

            // Check by both ProviderProfileId and ProviderId (user ID) for backwards compatibility
            var appointments = await _context.Appointments.IgnoreQueryFilters()
                .Include(a => a.Patient)
                .Where(a => (a.ProviderProfileId == actualProviderId || a.ProviderId == providerUserId)
                    && a.ScheduledStart >= dayStart && a.ScheduledStart < dayEnd
                    && a.Status != AppointmentStatus.Cancelled)
                .OrderBy(a => a.ScheduledStart)
                .ToListAsync();

            var availableSlots = isAvailable ? await GetAvailableSlots(actualProviderId, currentDate, 30) : new List<Qivr.Core.Interfaces.TimeSlot>();

            // Get time off info for this day
            var timeOff = await _context.ProviderTimeOffs.IgnoreQueryFilters()
                .Where(t => t.ProviderId == actualProviderId
                    && t.StartDateTime.Date <= currentDate.Date
                    && t.EndDateTime.Date >= currentDate.Date)
                .FirstOrDefaultAsync();

            schedules.Add(new ProviderDailySchedule
            {
                ProviderId = actualProviderId,  // Return the resolved provider profile ID
                Date = currentDate,
                WorkingHours = workingHours,
                Appointments = appointments,
                AvailableSlots = availableSlots,
                IsAvailable = isAvailable,
                TimeOffReason = timeOff?.Reason,
                TimeOffType = timeOff?.Type
            });

            currentDate = currentDate.AddDays(1);
        }

        return schedules;
    }

    public async Task<bool> BookAppointment(Guid patientId, Guid providerId, DateTime startTime, int durationMinutes, string appointmentType)
    {
        var endTime = startTime.AddMinutes(durationMinutes);

        // First, resolve the provider - the providerId might be either Provider.Id or User.Id
        // Try to find by Provider.Id first, then by UserId
        var providerProfile = await _context.Providers
            .IgnoreQueryFilters()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == providerId || p.UserId == providerId);

        if (providerProfile == null)
        {
            _logger.LogError("Provider profile not found for ID {ProviderId} (checked both Provider.Id and UserId)", providerId);
            return false;
        }

        var actualProviderId = providerProfile.Id;
        var providerUserId = providerProfile.UserId;

        _logger.LogInformation("BookAppointment: Resolved providerId {InputId} to profile {ProfileId}, user {UserId}",
            providerId, actualProviderId, providerUserId);

        // Verify slot is available using the resolved provider profile ID
        if (!await IsSlotAvailable(actualProviderId, startTime, endTime))
        {
            _logger.LogWarning("Attempted to book unavailable slot for provider {ProviderId} at {StartTime}",
                actualProviderId, startTime);
            return false;
        }

        // Check for patient conflicts (patient can't have overlapping appointments)
        var patientHasConflict = await _context.Appointments.IgnoreQueryFilters()
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
            // Get the User entity for tenant context
            var providerUser = providerProfile.User;
            if (providerUser == null)
            {
                providerUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == providerUserId);
            }

            if (providerUser == null)
            {
                _logger.LogError("Provider user {UserId} not found", providerUserId);
                return false;
            }

            // Check max appointments per day
            var schedule = await _context.ProviderSchedules.IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.ProviderId == actualProviderId && s.DayOfWeek == startTime.DayOfWeek);

            if (schedule?.MaxAppointmentsPerDay > 0)
            {
                // Npgsql 8+ requires UTC DateTimes
                var dayStart = DateTime.SpecifyKind(startTime.Date, DateTimeKind.Utc);
                var dayEnd = DateTime.SpecifyKind(startTime.Date.AddDays(1), DateTimeKind.Utc);

                // Check appointments by both ProviderProfileId and ProviderId (user ID) for backwards compatibility
                var existingAppointmentCount = await _context.Appointments.IgnoreQueryFilters()
                    .CountAsync(a => (a.ProviderProfileId == actualProviderId || a.ProviderId == providerUserId)
                        && a.ScheduledStart >= dayStart && a.ScheduledStart < dayEnd
                        && a.Status != AppointmentStatus.Cancelled);

                if (existingAppointmentCount >= schedule.MaxAppointmentsPerDay)
                {
                    _logger.LogWarning("Provider {ProviderId} has reached max appointments ({Max}) for {Date}",
                        actualProviderId, schedule.MaxAppointmentsPerDay, startTime.Date);
                    return false;
                }
            }

            // Create the appointment
            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = providerUser.TenantId,
                PatientId = patientId,
                ProviderId = providerUserId,           // Store the User.Id for backward compatibility
                ClinicId = providerProfile.ClinicId,
                ProviderProfileId = actualProviderId,  // Store the Provider profile ID
                ScheduledStart = startTime,
                ScheduledEnd = endTime,
                AppointmentType = appointmentType,
                Status = AppointmentStatus.Scheduled,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully booked appointment {AppointmentId} for patient {PatientId} with provider profile {ProfileId} (user {UserId})",
                appointment.Id, patientId, actualProviderId, providerUserId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error booking appointment for patient {PatientId} with provider {ProviderId}",
                patientId, actualProviderId);
            return false;
        }
    }

    public async Task<List<ProviderAvailability>> GetAvailableProviders(DateTime date, string? specialization = null)
    {
        var availableProviders = new List<ProviderAvailability>();

        // Get all providers (staff users can be providers) - RLS will filter by tenant
        var query = _context.Users
            .Where(u => u.UserType == UserType.Staff || u.UserType == UserType.Admin);

        if (!string.IsNullOrEmpty(specialization))
        {
            query = query.Where(u => u.Roles.Contains(specialization));
        }

        var users = await query.ToListAsync();

        _logger.LogInformation("Found {Count} provider users for date {Date}", users.Count, date);

        foreach (var user in users)
        {
            // Get provider profile to get the actual provider ID
            var providerProfile = await _context.Providers.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (providerProfile == null) continue;

            var isAvailable = await IsProviderAvailableOnDate(providerProfile.Id, date);
            // FIX: Use providerProfile.Id, not user.Id - GetAvailableSlots expects provider profile ID
            var slots = isAvailable ? await GetAvailableSlots(providerProfile.Id, date) : new List<Qivr.Core.Interfaces.TimeSlot>();

            _logger.LogInformation("Provider {ProviderId} ({Name}) has {SlotCount} available slots",
                providerProfile.Id, $"{user.FirstName} {user.LastName}", slots.Count);

            availableProviders.Add(new ProviderAvailability
            {
                Id = providerProfile.Id,
                UserId = user.Id,
                Name = $"{user.FirstName} {user.LastName}",
                Specialization = providerProfile.Specialty ?? user.Roles.FirstOrDefault() ?? "General",
                AvailableSlotCount = slots.Count,
                IsAvailable = isAvailable
            });
        }

        _logger.LogInformation("Returning {Count} available providers", availableProviders.Count);
        return availableProviders;
    }

    public async Task<WorkingHours> GetProviderWorkingHours(Guid providerId, DayOfWeek dayOfWeek)
    {
        // Try to get schedule from database
        var schedule = await _context.ProviderSchedules.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.ProviderId == providerId && s.DayOfWeek == dayOfWeek);

        if (schedule != null)
        {
            return new WorkingHours
            {
                Start = schedule.GetStartTimeSpan() ?? TimeSpan.Zero,
                End = schedule.GetEndTimeSpan() ?? TimeSpan.Zero,
                BreakStart = schedule.GetBreakStartTimeSpan(),
                BreakEnd = schedule.GetBreakEndTimeSpan(),
                IsWorkingDay = schedule.IsWorkingDay
            };
        }

        // Return default working hours if no schedule configured
        return _defaultWorkingHours[dayOfWeek];
    }

    // Schedule management methods

    public async Task<List<ProviderSchedule>> GetProviderWeeklySchedule(Guid providerId)
    {
        var schedules = await _context.ProviderSchedules.IgnoreQueryFilters()
            .Where(s => s.ProviderId == providerId)
            .OrderBy(s => s.DayOfWeek)
            .ToListAsync();

        return schedules;
    }

    public async Task SetProviderWeeklySchedule(Guid providerId, List<ProviderSchedule> schedules)
    {
        // Delete existing schedules
        var existingSchedules = await _context.ProviderSchedules.IgnoreQueryFilters()
            .Where(s => s.ProviderId == providerId)
            .ToListAsync();

        _context.ProviderSchedules.RemoveRange(existingSchedules);

        // Add new schedules
        foreach (var schedule in schedules)
        {
            schedule.ProviderId = providerId;
            _context.ProviderSchedules.Add(schedule);
        }

        await _context.SaveChangesAsync();
    }

    public async Task InitializeProviderDefaultSchedule(Guid providerId)
    {
        // Check if provider already has a schedule
        var existingSchedule = await _context.ProviderSchedules.IgnoreQueryFilters()
            .AnyAsync(s => s.ProviderId == providerId);

        if (existingSchedule)
        {
            return; // Already has schedule
        }

        // Get provider to get tenant ID
        var provider = await _context.Providers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == providerId);

        if (provider == null)
        {
            _logger.LogWarning("Cannot initialize schedule: Provider {ProviderId} not found", providerId);
            return;
        }

        // Create default schedule for each day
        foreach (var (dayOfWeek, hours) in _defaultWorkingHours)
        {
            var schedule = new ProviderSchedule
            {
                Id = Guid.NewGuid(),
                TenantId = provider.TenantId,
                ProviderId = providerId,
                DayOfWeek = dayOfWeek,
                IsWorkingDay = hours.IsWorkingDay,
                StartTime = hours.IsWorkingDay ? $"{hours.Start.Hours:D2}:{hours.Start.Minutes:D2}" : null,
                EndTime = hours.IsWorkingDay ? $"{hours.End.Hours:D2}:{hours.End.Minutes:D2}" : null,
                DefaultSlotDurationMinutes = 30,
                BufferMinutes = 0,
                AllowsTelehealth = true,
                AllowsInPerson = true,
                MaxAppointmentsPerDay = 0 // Unlimited
            };

            _context.ProviderSchedules.Add(schedule);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Initialized default schedule for provider {ProviderId}", providerId);
    }

    public async Task<List<ProviderTimeOff>> GetProviderTimeOffs(Guid providerId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.ProviderTimeOffs.IgnoreQueryFilters()
            .Where(t => t.ProviderId == providerId);

        if (startDate.HasValue)
        {
            query = query.Where(t => t.EndDateTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(t => t.StartDateTime <= endDate.Value);
        }

        return await query.OrderBy(t => t.StartDateTime).ToListAsync();
    }

    public async Task<ProviderTimeOff> AddProviderTimeOff(ProviderTimeOff timeOff)
    {
        _context.ProviderTimeOffs.Add(timeOff);
        await _context.SaveChangesAsync();
        return timeOff;
    }

    public async Task<bool> DeleteProviderTimeOff(Guid timeOffId)
    {
        var timeOff = await _context.ProviderTimeOffs.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == timeOffId);

        if (timeOff == null)
        {
            return false;
        }

        _context.ProviderTimeOffs.Remove(timeOff);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ProviderScheduleOverride?> GetScheduleOverride(Guid providerId, DateTime date)
    {
        // Npgsql 8+ requires UTC DateTimes
        var dateStart = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var dateEnd = DateTime.SpecifyKind(date.Date.AddDays(1), DateTimeKind.Utc);

        return await _context.ProviderScheduleOverrides.IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.ProviderId == providerId && o.Date >= dateStart && o.Date < dateEnd);
    }

    public async Task SetScheduleOverride(ProviderScheduleOverride scheduleOverride)
    {
        // Npgsql 8+ requires UTC DateTimes
        var dateStart = DateTime.SpecifyKind(scheduleOverride.Date.Date, DateTimeKind.Utc);
        var dateEnd = DateTime.SpecifyKind(scheduleOverride.Date.Date.AddDays(1), DateTimeKind.Utc);

        // Remove existing override for this date if any
        var existingOverride = await _context.ProviderScheduleOverrides.IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.ProviderId == scheduleOverride.ProviderId && o.Date >= dateStart && o.Date < dateEnd);

        if (existingOverride != null)
        {
            _context.ProviderScheduleOverrides.Remove(existingOverride);
        }

        _context.ProviderScheduleOverrides.Add(scheduleOverride);
        await _context.SaveChangesAsync();
    }
}

// Supporting DTOs

public class WorkingHours
{
    public TimeSpan Start { get; set; }
    public TimeSpan End { get; set; }
    public TimeSpan? BreakStart { get; set; }
    public TimeSpan? BreakEnd { get; set; }
    public bool IsWorkingDay { get; set; } = true;
}

public class ProviderDailySchedule
{
    public Guid ProviderId { get; set; }
    public DateTime Date { get; set; }
    public WorkingHours WorkingHours { get; set; } = new();
    public List<Appointment> Appointments { get; set; } = new();
    public List<Qivr.Core.Interfaces.TimeSlot> AvailableSlots { get; set; } = new();
    public bool IsAvailable { get; set; } = true;
    public string? TimeOffReason { get; set; }
    public TimeOffType? TimeOffType { get; set; }
}

public class ProviderAvailability
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public int AvailableSlotCount { get; set; }
    public bool IsAvailable { get; set; } = true;
}
