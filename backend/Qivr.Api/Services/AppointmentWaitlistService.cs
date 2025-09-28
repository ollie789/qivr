using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Models;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services;

public interface IAppointmentWaitlistService
{
    Task<IReadOnlyList<AppointmentWaitlistEntry>> GetEntriesAsync(Guid tenantId, Guid? patientFilter = null, CancellationToken cancellationToken = default);
    Task<AppointmentWaitlistEntry> AddEntryAsync(Guid tenantId, Guid requestedBy, WaitlistRequest request, CancellationToken cancellationToken = default);
}

public sealed class AppointmentWaitlistService : IAppointmentWaitlistService
{
    private readonly QivrDbContext _dbContext;
    private readonly ILogger<AppointmentWaitlistService> _logger;

    public AppointmentWaitlistService(QivrDbContext dbContext, ILogger<AppointmentWaitlistService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<IReadOnlyList<AppointmentWaitlistEntry>> GetEntriesAsync(Guid tenantId, Guid? patientFilter = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.AppointmentWaitlistEntries
            .IgnoreQueryFilters()
            .Where(entry => entry.TenantId == tenantId);

        if (patientFilter.HasValue)
        {
            query = query.Where(entry => entry.PatientId == patientFilter.Value);
        }

        return await query
            .OrderBy(entry => entry.CreatedAt)
            .Take(100)
            .Include(entry => entry.Patient)
            .Include(entry => entry.Provider)
            .ToListAsync(cancellationToken);
    }

    public async Task<AppointmentWaitlistEntry> AddEntryAsync(Guid tenantId, Guid requestedBy, WaitlistRequest request, CancellationToken cancellationToken = default)
    {
        var patientId = request.PatientId == Guid.Empty ? requestedBy : request.PatientId;

        var patient = await _dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == patientId && u.TenantId == tenantId, cancellationToken);

        if (patient == null)
        {
            throw new InvalidOperationException($"Patient {patientId} not found in tenant {tenantId}.");
        }

        User? providerUser = null;
        if (request.ProviderId.HasValue)
        {
            providerUser = await _dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == request.ProviderId && u.TenantId == tenantId, cancellationToken);

            if (providerUser == null)
            {
                _logger.LogWarning("Requested provider {ProviderId} not found for tenant {TenantId}; continuing without provider", request.ProviderId, tenantId);
            }
        }

        var normalizedDates = (request.PreferredDates ?? new List<DateTime>())
            .Select(date => date.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(date, DateTimeKind.Utc) 
                : date.ToUniversalTime())
            .Distinct()
            .OrderBy(d => d)
            .ToList();

        var entry = new AppointmentWaitlistEntry
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patient.Id,
            ProviderId = providerUser?.Id,
            AppointmentType = request.AppointmentType,
            Notes = request.Notes,
            PreferredDates = normalizedDates,
            Status = WaitlistStatus.Requested,
            CreatedBy = requestedBy.ToString(),
            UpdatedBy = requestedBy.ToString(),
            Metadata = new Dictionary<string, object>
            {
                ["requestedBy"] = requestedBy,
                ["source"] = "api"
            }
        };

        _dbContext.AppointmentWaitlistEntries.Add(entry);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return entry;
    }
}
