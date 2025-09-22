using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Api.Services;
using Qivr.Core.DTOs;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/clinic-management")]
[Authorize]
public class ClinicManagementController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ILogger<ClinicManagementController> _logger;

    public ClinicManagementController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        ILogger<ClinicManagementController> logger)
    {
        _context = context;
        _authorizationService = authorizationService;
        _logger = logger;
    }

    // GET: api/clinic-management/clinics
    [HttpGet("clinics")]
    [Authorize(Roles = "SystemAdmin,ClinicAdmin")]
    [ProducesResponseType(typeof(IEnumerable<ClinicDto>), 200)]
    public async Task<IActionResult> GetClinics([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        // TODO: Implement clinic retrieval with pagination
        
        var clinics = new[]
        {
            new ClinicDto
            {
                Id = Guid.NewGuid(),
                Name = "Springfield Medical Center",
                Address = "123 Main St, Springfield, IL 62701",
                Phone = "+1-555-0100",
                Email = "info@springfieldmed.com",
                IsActive = true,
                PatientCount = 1250,
                ProviderCount = 15,
                AppointmentsToday = 42,
                PendingPROMs = 18
            }
        };
        
        return Ok(new
        {
            items = clinics,
            page,
            pageSize,
            totalItems = clinics.Length,
            totalPages = 1
        });
    }
    
    // GET: api/clinic-management/clinics/{clinicId}
    [HttpGet("clinics/{clinicId}")]
    [Authorize(Roles = "SystemAdmin,ClinicAdmin,Provider")]
    [ProducesResponseType(typeof(ClinicDetailDto), 200)]
    public async Task<IActionResult> GetClinicDetails(Guid clinicId)
    {
        // TODO: Implement clinic details retrieval
        
        var clinic = new ClinicDetailDto
        {
            Id = clinicId,
            Name = "Springfield Medical Center",
            Description = "Full-service medical center offering comprehensive healthcare services",
            Address = new AddressDto
            {
                Street = "123 Main St",
                City = "Springfield",
                State = "IL",
                PostalCode = "62701",
                Country = "USA"
            },
            Phone = "+1-555-0100",
            Fax = "+1-555-0101",
            Email = "info@springfieldmed.com",
            Website = "https://springfieldmed.com",
            IsActive = true,
            EstablishedDate = new DateTime(2010, 1, 1),
            LicenseNumber = "IL-MED-2010-001",
            TaxId = "12-3456789",
            
            OperatingHours = new[]
            {
                new OperatingHoursDto { Day = "Monday", Open = "08:00", Close = "18:00" },
                new OperatingHoursDto { Day = "Tuesday", Open = "08:00", Close = "18:00" },
                new OperatingHoursDto { Day = "Wednesday", Open = "08:00", Close = "18:00" },
                new OperatingHoursDto { Day = "Thursday", Open = "08:00", Close = "18:00" },
                new OperatingHoursDto { Day = "Friday", Open = "08:00", Close = "17:00" },
                new OperatingHoursDto { Day = "Saturday", Open = "09:00", Close = "13:00" }
            },
            
            Services = new[] { "Primary Care", "Cardiology", "Orthopedics", "Physical Therapy" },
            AcceptedInsurance = new[] { "Blue Cross", "Aetna", "United Healthcare", "Medicare" },
            
            Statistics = new ClinicStatisticsDto
            {
                TotalPatients = 1250,
                ActivePatients = 980,
                TotalProviders = 15,
                TotalStaff = 35,
                AppointmentsThisMonth = 850,
                AppointmentsLastMonth = 820,
                AveragePatientSatisfaction = 4.6m,
                CompletedPromsThisMonth = 145,
                PendingProms = 18
            }
        };
        
        return Ok(clinic);
    }
    
    // POST: api/clinic-management/clinics
    [HttpPost("clinics")]
    [Authorize(Roles = "SystemAdmin")]
    [ProducesResponseType(typeof(ClinicDto), 201)]
    public async Task<IActionResult> CreateClinic([FromBody] CreateClinicDto dto)
    {
        // TODO: Implement clinic creation logic
        
        var clinic = new ClinicDto
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Address = $"{dto.Street}, {dto.City}, {dto.State} {dto.PostalCode}",
            Phone = dto.Phone,
            Email = dto.Email,
            IsActive = true,
            PatientCount = 0,
            ProviderCount = 0,
            AppointmentsToday = 0,
            PendingPROMs = 0
        };
        
        return CreatedAtAction(nameof(GetClinicDetails), new { clinicId = clinic.Id }, clinic);
    }
    
    // PUT: api/clinic-management/clinics/{clinicId}
    [HttpPut("clinics/{clinicId}")]
    [Authorize(Roles = "SystemAdmin,ClinicAdmin")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> UpdateClinic(Guid clinicId, [FromBody] UpdateClinicDto dto)
    {
        // TODO: Implement clinic update logic
        
        return NoContent();
    }
    
    // GET: api/clinic-management/clinics/{clinicId}/providers
    [HttpGet("clinics/{clinicId}/providers")]
    [Authorize(Roles = "SystemAdmin,ClinicAdmin,Provider")]
    [ProducesResponseType(typeof(IEnumerable<ProviderDto>), 200)]
    public async Task<IActionResult> GetClinicProviders(Guid clinicId, [FromQuery] bool activeOnly = true)
    {
        // TODO: Implement provider retrieval for clinic
        
        var providers = new[]
        {
            new ProviderDto
            {
                Id = Guid.NewGuid(),
                FirstName = "Jane",
                LastName = "Smith",
                Title = "MD",
                Specialty = "Internal Medicine",
                Email = "jane.smith@springfieldmed.com",
                Phone = "+1-555-0102",
                LicenseNumber = "IL-MD-12345",
                IsActive = true,
                PatientCount = 150,
                AppointmentsToday = 8,
                NextAvailableSlot = DateTime.UtcNow.AddDays(2)
            }
        };
        
        return Ok(providers);
    }
    
    // POST: api/clinic-management/clinics/{clinicId}/providers
    [HttpPost("clinics/{clinicId}/providers")]
    [Authorize(Roles = "SystemAdmin,ClinicAdmin")]
    [ProducesResponseType(typeof(ProviderDto), 201)]
    public async Task<IActionResult> AddProvider(Guid clinicId, [FromBody] CreateProviderDto dto)
    {
        // TODO: Implement provider addition logic
        
        var provider = new ProviderDto
        {
            Id = Guid.NewGuid(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Title = dto.Title,
            Specialty = dto.Specialty,
            Email = dto.Email,
            Phone = dto.Phone,
            LicenseNumber = dto.LicenseNumber,
            IsActive = true,
            PatientCount = 0,
            AppointmentsToday = 0
        };
        
        return CreatedAtAction(nameof(GetProvider), new { providerId = provider.Id }, provider);
    }
    
    // GET: api/clinic-management/providers/{providerId}
    [HttpGet("providers/{providerId}")]
    [Authorize]
    [ProducesResponseType(typeof(ProviderDetailDto), 200)]
    public async Task<IActionResult> GetProvider(Guid providerId)
    {
        // TODO: Implement provider details retrieval
        
        var provider = new ProviderDetailDto
        {
            Id = providerId,
            FirstName = "Jane",
            LastName = "Smith",
            Title = "MD",
            Specialty = "Internal Medicine",
            SubSpecialties = new[] { "Diabetes Management", "Preventive Care" },
            Email = "jane.smith@springfieldmed.com",
            Phone = "+1-555-0102",
            LicenseNumber = "IL-MD-12345",
            LicenseState = "Illinois",
            LicenseExpiry = new DateTime(2025, 12, 31),
            NpiNumber = "1234567890",
            IsActive = true,
            Biography = "Dr. Smith has over 15 years of experience in internal medicine...",
            Education = new[]
            {
                "MD - University of Illinois College of Medicine",
                "Residency - Northwestern Memorial Hospital"
            },
            Languages = new[] { "English", "Spanish" },
            
            Schedule = new ProviderScheduleDto
            {
                DefaultAppointmentDuration = 30,
                BufferTime = 10,
                WorkingHours = new[]
                {
                    new OperatingHoursDto { Day = "Monday", Open = "09:00", Close = "17:00" },
                    new OperatingHoursDto { Day = "Tuesday", Open = "09:00", Close = "17:00" },
                    new OperatingHoursDto { Day = "Wednesday", Open = "09:00", Close = "17:00" },
                    new OperatingHoursDto { Day = "Thursday", Open = "09:00", Close = "17:00" },
                    new OperatingHoursDto { Day = "Friday", Open = "09:00", Close = "15:00" }
                }
            },
            
            Statistics = new ProviderStatisticsDto
            {
                TotalPatients = 150,
                NewPatientsThisMonth = 12,
                AppointmentsThisWeek = 35,
                AppointmentsThisMonth = 140,
                AverageRating = 4.8m,
                TotalReviews = 67,
                NoShowRate = 3.5m,
                AverageWaitTime = 12
            }
        };
        
        return Ok(provider);
    }
    
    // GET: api/clinic-management/clinics/{clinicId}/schedule
    [HttpGet("clinics/{clinicId}/schedule")]
    [Authorize]
    [ProducesResponseType(typeof(ClinicScheduleDto), 200)]
    public async Task<IActionResult> GetClinicSchedule(Guid clinicId, [FromQuery] DateTime date)
    {
        // TODO: Implement clinic schedule retrieval
        
        var schedule = new ClinicScheduleDto
        {
            ClinicId = clinicId,
            Date = date.Date,
            Providers = new[]
            {
                new ProviderScheduleSlotDto
                {
                    ProviderId = Guid.NewGuid(),
                    ProviderName = "Dr. Jane Smith",
                    Appointments = new[]
                    {
                        new Qivr.Core.DTOs.ScheduleSlotDto
                        {
                            StartTime = date.Date.AddHours(9),
                            EndTime = date.Date.AddHours(9).AddMinutes(30),
                            PatientName = "John Doe",
                            AppointmentType = "Follow-up",
                            IsAvailable = false
                        },
                        new Qivr.Core.DTOs.ScheduleSlotDto
                        {
                            StartTime = date.Date.AddHours(10),
                            EndTime = date.Date.AddHours(10).AddMinutes(30),
                            PatientName = "Jane Smith",
                            AppointmentType = "New Patient",
                            IsAvailable = false
                        }
                    },
                    AvailableSlots = new[]
                    {
                        date.Date.AddHours(11),
                        date.Date.AddHours(14),
                        date.Date.AddHours(15)
                    }
                }
            }
        };
        
        return Ok(schedule);
    }
    
    // GET: api/clinic-management/clinics/{clinicId}/analytics
    [HttpGet("clinics/{clinicId}/analytics")]
    [Authorize(Roles = "SystemAdmin,ClinicAdmin")]
    [ProducesResponseType(typeof(ClinicAnalyticsDto), 200)]
    public async Task<IActionResult> GetClinicAnalytics(Guid clinicId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct = default)
    {
        try
        {
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { error = "Tenant context is required" });
            }

            var periodStart = from == default ? DateTime.UtcNow.AddDays(-30) : DateTime.SpecifyKind(from, DateTimeKind.Utc);
            var periodEnd = to == default ? DateTime.UtcNow : DateTime.SpecifyKind(to, DateTimeKind.Utc);

            if (periodEnd < periodStart)
            {
                (periodStart, periodEnd) = (periodEnd, periodStart);
            }

            var appointments = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.ClinicId == clinicId && a.ScheduledStart >= periodStart && a.ScheduledStart <= periodEnd)
                .ToListAsync(ct);

            var totalAppointments = appointments.Count;
            var completedAppointments = appointments.Count(a => a.Status == AppointmentStatus.Completed);
            var cancelledAppointments = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);
            var noShowAppointments = appointments.Count(a => a.Status == AppointmentStatus.NoShow);

            var averageDuration = appointments
                .Where(a => a.ScheduledEnd > a.ScheduledStart)
                .Select(a => (a.ScheduledEnd - a.ScheduledStart).TotalMinutes)
                .DefaultIfEmpty(0d)
                .Average();

            var utilization = totalAppointments == 0
                ? 0m
                : Math.Round((decimal)completedAppointments / totalAppointments * 100m, 2);

            var patientIds = appointments
                .Select(a => a.PatientId)
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            var totalPatients = patientIds.Count;

            var firstAppointments = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.ClinicId == clinicId && patientIds.Contains(a.PatientId))
                .GroupBy(a => a.PatientId)
                .Select(g => new { PatientId = g.Key, First = g.Min(a => a.ScheduledStart) })
                .ToListAsync(ct);

            var newPatients = firstAppointments.Count(fp => fp.First >= periodStart && fp.First <= periodEnd);
            var returningPatients = Math.Max(0, totalPatients - newPatients);

            var averageVisits = totalPatients == 0
                ? 0m
                : Math.Round((decimal)totalAppointments / totalPatients, 2);

            var retentionRate = totalPatients == 0
                ? 0m
                : Math.Round((decimal)returningPatients / totalPatients * 100m, 2);

            var promInstances = await _context.PromInstances
                .AsNoTracking()
                .Where(i => i.TenantId == tenantId && patientIds.Contains(i.PatientId) && i.CreatedAt >= periodStart && i.CreatedAt <= periodEnd)
                .ToListAsync(ct);

            var totalProms = promInstances.Count;
            var completedProms = promInstances.Count(i => i.Status == PromStatus.Completed);
            var averagePromScore = promInstances
                .Where(i => i.Score.HasValue)
                .Select(i => (double)i.Score!)
                .DefaultIfEmpty(0d)
                .Average();

            var highRiskProms = promInstances
                .Count(i => i.Score.HasValue && i.Score.Value >= 15m);

            var totalBilled = appointments.Sum(a => a.PaymentAmount ?? 0m);
            var totalCollected = appointments.Where(a => a.IsPaid && a.PaymentAmount.HasValue).Sum(a => a.PaymentAmount!.Value);
            var outstandingBalance = totalBilled - totalCollected;
            var collectionRate = totalBilled == 0m ? 0m : Math.Round(totalCollected / totalBilled * 100m, 2);
            var averageRevenuePerPatient = totalPatients == 0 ? 0m : Math.Round(totalCollected / totalPatients, 2);

            var topProcedures = appointments
                .Where(a => !string.IsNullOrWhiteSpace(a.AppointmentType))
                .GroupBy(a => a.AppointmentType ?? "Unknown")
                .Select(g => new ProcedureCountDto
                {
                    Code = g.Key,
                    Description = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(p => p.Count)
                .Take(5)
                .ToArray();

            var analytics = new ClinicAnalyticsDto
            {
                Period = new PeriodDto { From = periodStart, To = periodEnd },
                AppointmentMetrics = new AppointmentMetricsDto
                {
                    TotalScheduled = totalAppointments,
                    Completed = completedAppointments,
                    NoShows = noShowAppointments,
                    Cancelled = cancelledAppointments,
                    AverageWaitTime = 0, // not tracked yet
                    AverageDuration = (int)Math.Round(averageDuration),
                    UtilizationRate = utilization
                },
                PatientMetrics = new PatientMetricsDto
                {
                    NewPatients = newPatients,
                    ReturningPatients = returningPatients,
                    AverageVisitsPerPatient = averageVisits,
                    PatientRetentionRate = retentionRate,
                    PatientSatisfactionScore = 0 // placeholder until surveys implemented
                },
                PromMetrics = new PromMetricsDto
                {
                    TotalSent = totalProms,
                    Completed = completedProms,
                    CompletionRate = totalProms == 0 ? 0m : Math.Round((decimal)completedProms / totalProms * 100m, 2),
                    AverageScore = Math.Round((decimal)averagePromScore, 2),
                    HighRiskPatients = highRiskProms
                },
                RevenueMetrics = new RevenueMetricsDto
                {
                    TotalBilled = totalBilled,
                    TotalCollected = totalCollected,
                    OutstandingBalance = outstandingBalance,
                    CollectionRate = collectionRate,
                    AverageRevenuePerPatient = averageRevenuePerPatient
                },
                TopDiagnoses = Array.Empty<DiagnosisCountDto>(),
                TopProcedures = topProcedures
            };

            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compute clinic analytics for clinic {ClinicId}", clinicId);
            return StatusCode(500, new { error = "Failed to compute clinic analytics" });
        }
    }
}

// DTOs
public class ClinicDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int PatientCount { get; set; }
    public int ProviderCount { get; set; }
    public int AppointmentsToday { get; set; }
    public int PendingPROMs { get; set; }
}

public class ClinicDetailDto : ClinicDto
{
    public string Description { get; set; } = string.Empty;
    public new AddressDto Address { get; set; } = new();
    public string Fax { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public DateTime EstablishedDate { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public OperatingHoursDto[] OperatingHours { get; set; } = Array.Empty<OperatingHoursDto>();
    public string[] Services { get; set; } = Array.Empty<string>();
    public string[] AcceptedInsurance { get; set; } = Array.Empty<string>();
    public ClinicStatisticsDto Statistics { get; set; } = new();
}

// OperatingHoursDto is now in SharedDtos

// ClinicStatisticsDto is now in SharedDtos

public class CreateClinicDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class UpdateClinicDto : CreateClinicDto
{
    public bool? IsActive { get; set; }
}

public class ProviderDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int PatientCount { get; set; }
    public int AppointmentsToday { get; set; }
    public DateTime? NextAvailableSlot { get; set; }
}

public class ProviderDetailDto : ProviderDto
{
    public string[] SubSpecialties { get; set; } = Array.Empty<string>();
    public string LicenseState { get; set; } = string.Empty;
    public DateTime LicenseExpiry { get; set; }
    public string NpiNumber { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public string[] Education { get; set; } = Array.Empty<string>();
    public string[] Languages { get; set; } = Array.Empty<string>();
    public ProviderScheduleDto Schedule { get; set; } = new();
    public ProviderStatisticsDto Statistics { get; set; } = new();
}

public class CreateProviderDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
}

// ProviderScheduleDto is now in SharedDtos

public class ProviderStatisticsDto
{
    public int TotalPatients { get; set; }
    public int NewPatientsThisMonth { get; set; }
    public int AppointmentsThisWeek { get; set; }
    public int AppointmentsThisMonth { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public decimal NoShowRate { get; set; }
    public int AverageWaitTime { get; set; }
}

public class ClinicScheduleDto
{
    public Guid ClinicId { get; set; }
    public DateTime Date { get; set; }
    public ProviderScheduleSlotDto[] Providers { get; set; } = Array.Empty<ProviderScheduleSlotDto>();
}

public class ProviderScheduleSlotDto
{
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public Qivr.Core.DTOs.ScheduleSlotDto[] Appointments { get; set; } = Array.Empty<Qivr.Core.DTOs.ScheduleSlotDto>();
    public DateTime[] AvailableSlots { get; set; } = Array.Empty<DateTime>();
}

// ScheduleSlotDto moved to Qivr.Core.DTOs to avoid conflicts

public class ClinicAnalyticsDto
{
    public PeriodDto Period { get; set; } = new();
    public AppointmentMetricsDto AppointmentMetrics { get; set; } = new();
    public PatientMetricsDto PatientMetrics { get; set; } = new();
    public PromMetricsDto PromMetrics { get; set; } = new();
    public RevenueMetricsDto RevenueMetrics { get; set; } = new();
    public DiagnosisCountDto[] TopDiagnoses { get; set; } = Array.Empty<DiagnosisCountDto>();
    public ProcedureCountDto[] TopProcedures { get; set; } = Array.Empty<ProcedureCountDto>();
}

public class PeriodDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
}

public class AppointmentMetricsDto
{
    public int TotalScheduled { get; set; }
    public int Completed { get; set; }
    public int NoShows { get; set; }
    public int Cancelled { get; set; }
    public int AverageWaitTime { get; set; }
    public int AverageDuration { get; set; }
    public decimal UtilizationRate { get; set; }
}

public class PatientMetricsDto
{
    public int NewPatients { get; set; }
    public int ReturningPatients { get; set; }
    public decimal AverageVisitsPerPatient { get; set; }
    public decimal PatientRetentionRate { get; set; }
    public decimal PatientSatisfactionScore { get; set; }
}

public class PromMetricsDto
{
    public int TotalSent { get; set; }
    public int Completed { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal AverageScore { get; set; }
    public int HighRiskPatients { get; set; }
}

public class RevenueMetricsDto
{
    public decimal TotalBilled { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal OutstandingBalance { get; set; }
    public decimal CollectionRate { get; set; }
    public decimal AverageRevenuePerPatient { get; set; }
}

public class DiagnosisCountDto
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ProcedureCountDto
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Count { get; set; }
}
