using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services;

public interface ISmartNotificationService
{
    Task SendPromDueNotifications();
    Task SendAppointmentReminders();
}

public class SmartNotificationService : ISmartNotificationService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<SmartNotificationService> _logger;

    public SmartNotificationService(QivrDbContext context, ILogger<SmartNotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SendPromDueNotifications()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var dueProms = await _context.PromInstances
            .Include(p => p.Patient)
            .Include(p => p.Template)
            .Where(p => p.Status == Core.Entities.PromStatus.Pending 
                && p.DueDate.Date >= today 
                && p.DueDate.Date <= tomorrow)
            .ToListAsync();

        foreach (var prom in dueProms)
        {
            // Create in-app notification
            var notification = new Core.Entities.Notification
            {
                TenantId = prom.TenantId,
                RecipientId = prom.PatientId,
                Type = "prom_due",
                Title = "Assessment Due",
                Message = $"Your {prom.Template.Name} assessment is due. Please complete it to help track your progress.",
                Channel = Core.Entities.NotificationChannel.InApp,
                Priority = Core.Entities.NotificationPriority.Normal,
                Data = new Dictionary<string, object> { { "promId", prom.Id }, { "actionUrl", $"/proms/{prom.Id}" } },
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            
            _logger.LogInformation("Created PROM due notification for patient {PatientId}", prom.PatientId);
        }

        await _context.SaveChangesAsync();
    }

    public async Task SendAppointmentReminders()
    {
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);
        var dayAfter = tomorrow.AddDays(1);

        var upcomingAppointments = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .Where(a => a.Status == Core.Entities.AppointmentStatus.Scheduled
                && a.ScheduledStart.Date >= tomorrow
                && a.ScheduledStart.Date < dayAfter)
            .ToListAsync();

        foreach (var apt in upcomingAppointments)
        {
            var notification = new Core.Entities.Notification
            {
                TenantId = apt.TenantId,
                RecipientId = apt.PatientId,
                Type = "appointment_reminder",
                Title = "Appointment Reminder",
                Message = $"You have an appointment tomorrow at {apt.ScheduledStart:h:mm tt} with {apt.Provider.FirstName} {apt.Provider.LastName}.",
                Channel = Core.Entities.NotificationChannel.InApp,
                Priority = Core.Entities.NotificationPriority.High,
                Data = new Dictionary<string, object> { { "appointmentId", apt.Id }, { "actionUrl", "/appointments" } },
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            
            _logger.LogInformation("Created appointment reminder for patient {PatientId}", apt.PatientId);
        }

        await _context.SaveChangesAsync();
    }
}
