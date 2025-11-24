using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public class EvaluationService : IEvaluationService
{
    private readonly QivrDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<EvaluationService> _logger;

    public EvaluationService(QivrDbContext context, IMapper mapper, ILogger<EvaluationService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Guid> CreateEvaluationAsync(CreateEvaluationDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating evaluation for patient {PatientId}", dto.PatientId);

        // Get patient to retrieve tenant ID
        var patient = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.PatientId, cancellationToken);
        if (patient == null)
        {
            throw new InvalidOperationException($"Patient {dto.PatientId} not found");
        }

        var evaluation = new Evaluation
        {
            PatientId = dto.PatientId,
            TenantId = patient.TenantId,
            EvaluationNumber = GenerateEvaluationNumber(),
            ChiefComplaint = dto.ChiefComplaint,
            Symptoms = dto.Symptoms,
            QuestionnaireResponses = dto.QuestionnaireResponses,
            Status = EvaluationStatus.Pending
        };

        await _context.Evaluations.AddAsync(evaluation, cancellationToken);

        // Add pain maps
        foreach (var painMapDto in dto.PainMaps)
        {
            var painMap = new PainMap
            {
                TenantId = evaluation.TenantId,
                EvaluationId = evaluation.Id,
                BodyRegion = painMapDto.BodyRegion,
                Coordinates = new PainCoordinates
                {
                    X = painMapDto.X,
                    Y = painMapDto.Y,
                    Z = painMapDto.Z
                },
                PainIntensity = painMapDto.Intensity,
                PainType = painMapDto.Type,
                PainQuality = painMapDto.Qualities
            };

            await _context.PainMaps.AddAsync(painMap, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Evaluation {EvaluationId} created successfully", evaluation.Id);
        return evaluation.Id;
    }

    public async Task<EvaluationDto?> GetEvaluationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var evaluation = await _context.Evaluations
            .Include(e => e.Patient)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (evaluation == null) return null;

        return new EvaluationDto(
            evaluation.Id,
            evaluation.EvaluationNumber,
            evaluation.PatientId,
            evaluation.Patient?.FullName ?? "Unknown",
            evaluation.Patient?.Email,
            evaluation.Patient?.Phone,
            evaluation.ChiefComplaint ?? "",
            evaluation.Symptoms,
            evaluation.Status.ToString(),
            evaluation.Urgency?.ToString(),
            evaluation.CreatedAt
        );
    }

    public async Task<EvaluationDetailDto?> GetEvaluationDetailAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var evaluation = await _context.Evaluations
            .Include(e => e.Patient)
            .Include(e => e.PainMaps)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (evaluation == null) return null;

        var painMaps = evaluation.PainMaps.Select(pm => new PainMapDto(
            pm.BodyRegion,
            pm.Coordinates.X,
            pm.Coordinates.Y,
            pm.Coordinates.Z,
            pm.PainIntensity,
            pm.PainType,
            pm.PainQuality
        )).ToList();

        return new EvaluationDetailDto(
            evaluation.Id,
            evaluation.EvaluationNumber,
            evaluation.PatientId,
            evaluation.Patient?.FullName ?? "Unknown",
            evaluation.Patient?.Email,
            evaluation.Patient?.Phone,
            evaluation.Patient?.DateOfBirth?.ToString("yyyy-MM-dd"),
            evaluation.ChiefComplaint ?? "",
            evaluation.Symptoms,
            evaluation.MedicalHistory,
            evaluation.QuestionnaireResponses,
            evaluation.AiSummary,
            evaluation.AiRiskFlags,
            evaluation.AiProcessedAt,
            evaluation.ClinicianNotes,
            evaluation.Status.ToString(),
            evaluation.Urgency?.ToString(),
            evaluation.CreatedAt,
            painMaps
        );
    }

    public async Task<List<EvaluationDto>> GetEvaluationsAsync(Guid tenantId, Guid? patientId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Evaluations
            .Include(e => e.Patient)
            .Where(e => e.TenantId == tenantId)
            .AsQueryable();

        if (patientId.HasValue)
        {
            query = query.Where(e => e.PatientId == patientId.Value);
        }

        var evaluations = await query
            .OrderByDescending(e => e.CreatedAt)
            .Take(50) // Limit results
            .ToListAsync(cancellationToken);

        return evaluations.Select(e => new EvaluationDto(
            e.Id,
            e.EvaluationNumber,
            e.PatientId,
            e.Patient?.FullName ?? "Unknown",
            e.Patient?.Email,
            e.Patient?.Phone,
            e.ChiefComplaint ?? "",
            e.Symptoms,
            e.Status.ToString(),
            e.Urgency?.ToString(),
            e.CreatedAt
        )).ToList();
    }

    public async Task UpdateEvaluationStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        var evaluation = await _context.Evaluations.FindAsync(new object[] { id }, cancellationToken);
        if (evaluation == null)
        {
            throw new KeyNotFoundException($"Evaluation {id} not found");
        }

        if (!Enum.TryParse<EvaluationStatus>(status, out var evaluationStatus))
        {
            throw new ArgumentException($"Invalid status: {status}");
        }

        evaluation.Status = evaluationStatus;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Evaluation {EvaluationId} status updated to {Status}", id, status);
    }

    private string GenerateEvaluationNumber()
    {
        return $"EVAL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
    }
}

public class AppointmentService : IAppointmentService
{
    private readonly QivrDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<AppointmentService> _logger;

    public AppointmentService(QivrDbContext context, IMapper mapper, ILogger<AppointmentService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Guid> CreateAppointmentAsync(CreateAppointmentDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating appointment for patient {PatientId} with provider {ProviderId}", 
            dto.PatientId, dto.ProviderId);

        // Check for double booking
        var hasConflict = await CheckAvailabilityAsync(dto.ProviderId, dto.ScheduledStart, dto.ScheduledEnd, cancellationToken);
        if (!hasConflict)
        {
            throw new InvalidOperationException("The provider is not available at the requested time.");
        }

        var appointment = new Appointment
        {
            PatientId = dto.PatientId,
            ProviderId = dto.ProviderId,
            EvaluationId = dto.EvaluationId,
            ScheduledStart = dto.ScheduledStart,
            ScheduledEnd = dto.ScheduledEnd,
            AppointmentType = dto.AppointmentType,
            LocationType = Enum.Parse<LocationType>(dto.LocationType),
            LocationDetails = dto.LocationDetails ?? new Dictionary<string, object>(),
            Status = AppointmentStatus.Requested
        };

        // Get tenant from context
        var demoTenant = await _context.Tenants.FirstAsync(t => t.Slug == "demo-clinic", cancellationToken);
        appointment.TenantId = demoTenant.Id;

        var providerProfileId = await _context.Providers
            .IgnoreQueryFilters()
            .Where(p => p.TenantId == demoTenant.Id && p.UserId == dto.ProviderId)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!providerProfileId.HasValue)
        {
            throw new InvalidOperationException("Provider profile not found for the specified provider.");
        }

        appointment.ProviderProfileId = providerProfileId.Value;

        await _context.Appointments.AddAsync(appointment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Appointment {AppointmentId} created successfully", appointment.Id);
        return appointment.Id;
    }

    public async Task<AppointmentDto?> GetAppointmentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (appointment == null) return null;

        return new AppointmentDto(
            appointment.Id,
            appointment.PatientId,
            appointment.Patient?.FullName ?? "Unknown",
            appointment.ProviderId,
            appointment.ProviderProfileId,
            appointment.Provider?.FullName ?? "Unknown",
            appointment.ScheduledStart,
            appointment.ScheduledEnd,
            appointment.Status.ToString(),
            appointment.AppointmentType,
            appointment.LocationType.ToString()
        );
    }

    public async Task<List<AppointmentDto>> GetAppointmentsAsync(DateTime? from = null, DateTime? to = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Provider)
            .AsQueryable();

        if (from.HasValue)
        {
            query = query.Where(a => a.ScheduledStart >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.ScheduledEnd <= to.Value);
        }

        var appointments = await query
            .OrderBy(a => a.ScheduledStart)
            .Take(100) // Limit results
            .ToListAsync(cancellationToken);

        return appointments.Select(a => new AppointmentDto(
            a.Id,
            a.PatientId,
            a.Patient?.FullName ?? "Unknown",
            a.ProviderId,
            a.ProviderProfileId,
            a.Provider?.FullName ?? "Unknown",
            a.ScheduledStart,
            a.ScheduledEnd,
            a.Status.ToString(),
            a.AppointmentType,
            a.LocationType.ToString()
        )).ToList();
    }

    public async Task<bool> CheckAvailabilityAsync(Guid providerId, DateTime start, DateTime end, CancellationToken cancellationToken = default)
    {
        var hasConflict = await _context.Appointments
            .AnyAsync(a => a.ProviderId == providerId &&
                          a.Status != AppointmentStatus.Cancelled &&
                          ((a.ScheduledStart >= start && a.ScheduledStart < end) ||
                           (a.ScheduledEnd > start && a.ScheduledEnd <= end) ||
                           (a.ScheduledStart <= start && a.ScheduledEnd >= end)),
                     cancellationToken);

        return !hasConflict;
    }
}
