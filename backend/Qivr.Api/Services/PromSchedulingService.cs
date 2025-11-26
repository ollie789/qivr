using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services;

public interface IPromSchedulingService
{
    Task SchedulePromsForTreatmentPlan(Guid treatmentPlanId);
    Task CheckAndCreateDueProms();
}

public class PromSchedulingService : IPromSchedulingService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<PromSchedulingService> _logger;

    public PromSchedulingService(QivrDbContext context, ILogger<PromSchedulingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SchedulePromsForTreatmentPlan(Guid treatmentPlanId)
    {
        var plan = await _context.TreatmentPlans
            .FirstOrDefaultAsync(t => t.Id == treatmentPlanId);

        if (plan == null) return;

        // Parse PROM schedule from notes (e.g., "Every 2 weeks")
        var intervalWeeks = ParsePromSchedule(plan.Notes);
        var totalWeeks = plan.DurationWeeks;
        var startDate = plan.StartDate;

        // Get default PROM template
        var template = await _context.PromTemplates
            .Where(t => t.TenantId == plan.TenantId && t.Category == "Functional")
            .FirstOrDefaultAsync();

        if (template == null) return;

        // Create PROM instances for each interval
        for (int week = intervalWeeks; week <= totalWeeks; week += intervalWeeks)
        {
            var dueDate = startDate.AddDays(week * 7);
            
            var existingProm = await _context.PromInstances
                .AnyAsync(p => p.PatientId == plan.PatientId 
                    && p.TemplateId == template.Id 
                    && p.DueDate.Date == dueDate.Date);

            if (!existingProm)
            {
                var promInstance = new PromInstance
                {
                    TenantId = plan.TenantId,
                    PatientId = plan.PatientId,
                    TemplateId = template.Id,
                    DueDate = dueDate,
                    Status = PromStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                _context.PromInstances.Add(promInstance);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Scheduled PROMs for treatment plan {TreatmentPlanId}", treatmentPlanId);
    }

    public async Task CheckAndCreateDueProms()
    {
        var today = DateTime.UtcNow.Date;
        var nextWeek = today.AddDays(7);

        // Find treatment plans that need PROM assignments
        var activePlans = await _context.TreatmentPlans
            .Where(t => t.Status == TreatmentPlanStatus.Active)
            .ToListAsync();

        foreach (var plan in activePlans)
        {
            await SchedulePromsForTreatmentPlan(plan.Id);
        }
    }

    private int ParsePromSchedule(string? notes)
    {
        if (string.IsNullOrEmpty(notes)) return 2; // Default: every 2 weeks

        if (notes.Contains("Weekly", StringComparison.OrdinalIgnoreCase))
            return 1;
        if (notes.Contains("Every 2 weeks", StringComparison.OrdinalIgnoreCase))
            return 2;
        if (notes.Contains("Monthly", StringComparison.OrdinalIgnoreCase))
            return 4;

        return 2;
    }
}
