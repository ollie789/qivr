using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Qivr.Api.Services;
using Qivr.Core.DTOs;
using Qivr.Api.Constants;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Qivr.Core.Entities;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/clinic-management")]
[Authorize]
public class ClinicManagementController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ILogger<ClinicManagementController> _logger;
    private readonly IClinicManagementService _clinicService;

    public ClinicManagementController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        ILogger<ClinicManagementController> logger,
        IClinicManagementService clinicService)
    {
        _context = context;
        _authorizationService = authorizationService;
        _logger = logger;
        _clinicService = clinicService;
    }

    // GET: api/clinic-management/clinics
    [HttpGet("clinics")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    [ProducesResponseType(typeof(IEnumerable<ClinicDto>), 200)]
    public async Task<IActionResult> GetClinics([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1 || pageSize < 1)
        {
            return BadRequest(new { error = "Page and pageSize must be positive integers." });
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var summaries = (await _clinicService.GetClinicsAsync(tenantId, page, pageSize)).ToList();
        var items = summaries.Select(MapClinicSummary).ToArray();
        var totalItems = summaries.FirstOrDefault()?.TotalCount ?? 0;
        var totalPages = pageSize == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalItems,
            totalPages
        });
    }
    
    // GET: api/clinic-management/clinics/{clinicId}
    [HttpGet("clinics/{clinicId}")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    [ProducesResponseType(typeof(ClinicDetailDto), 200)]
    public async Task<IActionResult> GetClinicDetails(Guid clinicId)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var detail = await _clinicService.GetClinicDetailsAsync(tenantId, clinicId);
        if (detail is null)
        {
            return NotFound();
        }

        var appointmentsToday = await CountAppointmentsForClinicAsync(clinicId);
        var dto = MapClinicDetail(detail, appointmentsToday);

        return Ok(dto);
    }
    
    // POST: api/clinic-management/clinics
    [HttpPost("clinics")]
    [Authorize(Roles = AuthorizationRoles.Admin)] // TODO: Future - SystemAdmin only for multi-tenant creation
    [ProducesResponseType(typeof(ClinicDto), 201)]
    public async Task<IActionResult> CreateClinic([FromBody] CreateClinicDto dto)
    {
        if (dto is null)
        {
            return BadRequest(new { error = "Request body is required." });
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var request = new CreateClinicRequest
        {
            Name = dto.Name,
            Description = dto.Description,
            Street = dto.Street,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.PostalCode,
            Country = string.IsNullOrWhiteSpace(dto.Country) ? "USA" : dto.Country,
            Phone = dto.Phone,
            Email = dto.Email,
            Fax = dto.Fax,
            Website = dto.Website,
            LicenseNumber = dto.LicenseNumber,
            TaxId = dto.TaxId,
            Services = dto.Services,
            AcceptedInsurance = dto.AcceptedInsurance,
            OperatingHours = dto.OperatingHours
        };

        var clinic = await _clinicService.CreateClinicAsync(tenantId, request);
        var detail = await _clinicService.GetClinicDetailsAsync(tenantId, clinic.Id);
        var appointmentsToday = await CountAppointmentsForClinicAsync(clinic.Id);
        var response = detail != null
            ? MapClinicDetail(detail, appointmentsToday)
            : MapClinicSummary(new ClinicSummary
            {
                Id = clinic.Id,
                Name = clinic.Name,
                Address = FormatAddress(clinic.Address),
                Phone = clinic.Phone,
                Email = clinic.Email,
                IsActive = clinic.IsActive,
                PatientCount = 0,
                ProviderCount = 0,
                AppointmentsToday = appointmentsToday,
                PendingPROMs = 0,
                TotalCount = 1
            }) as ClinicDto;

        return CreatedAtAction(nameof(GetClinicDetails), new { clinicId = clinic.Id }, response);
    }
    
    // PUT: api/clinic-management/clinics/{clinicId}
    [HttpPut("clinics/{clinicId}")]
    [Authorize(Roles = "SystemAdmin,ClinicAdmin")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> UpdateClinic(Guid clinicId, [FromBody] UpdateClinicDto dto)
    {
        if (dto is null)
        {
            return BadRequest(new { error = "Request body is required." });
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var request = new UpdateClinicRequest
        {
            Name = Normalize(dto.Name),
            Description = Normalize(dto.Description),
            Street = Normalize(dto.Street),
            City = Normalize(dto.City),
            State = Normalize(dto.State),
            PostalCode = Normalize(dto.PostalCode),
            Phone = Normalize(dto.Phone),
            Email = Normalize(dto.Email),
            Fax = Normalize(dto.Fax),
            Website = Normalize(dto.Website),
            Services = dto.Services,
            AcceptedInsurance = dto.AcceptedInsurance,
            OperatingHours = dto.OperatingHours
        };

        var updated = await _clinicService.UpdateClinicAsync(tenantId, clinicId, request);
        if (!updated)
        {
            return NotFound();
        }

        if (dto.IsActive.HasValue)
        {
            // Phase 4.1: Update tenant IsActive instead of clinic
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant != null)
            {
                tenant.IsActive = dto.IsActive.Value;
                await _context.SaveChangesAsync();
            }
        }

        return NoContent();
    }
    
    // GET: api/clinic-management/providers (PHASE 2.1: Simplified endpoint)
    [HttpGet("providers")]
    [Authorize(Roles = AuthorizationRoles.AllRoles)]
    [ProducesResponseType(typeof(IEnumerable<ProviderDto>), 200)]
    public async Task<IActionResult> GetProviders([FromQuery] bool activeOnly = true)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            _logger.LogWarning("GetProviders request missing tenant context");
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Use tenantId as clinicId since they're now the same
        var clinicId = tenantId;
        
        // Phase 4.1: Check tenant existence instead of clinic
        var tenantExists = await _context.Tenants.AsNoTracking().AnyAsync(t => t.Id == tenantId);
        if (!tenantExists)
        {
            return NotFound();
        }

        var providers = await _clinicService.GetClinicProvidersAsync(tenantId, clinicId, activeOnly);
        return Ok(providers.Select(MapProviderSummary).ToArray());
    }
    
    // POST: api/clinic-management/providers (PHASE 2.1: Simplified endpoint)
    [HttpPost("providers")]
    [Authorize(Roles = AuthorizationRoles.Admin)] // TODO: Future expansion - add Staff, Clinician with specific permissions
    [ProducesResponseType(typeof(ProviderDto), 201)]
    public async Task<IActionResult> CreateProvider([FromBody] CreateProviderDto dto)
    {
        if (dto is null)
        {
            return BadRequest(new { error = "Request body is required." });
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Use tenantId as clinicId since they're now the same (PHASE 1 unification)
        var clinicId = tenantId;

        // Phase 4.1: Check tenant existence instead of clinic
        var tenantExists = await _context.Tenants.AsNoTracking().AnyAsync(t => t.Id == tenantId);
        if (!tenantExists)
        {
            return NotFound(new { error = "Tenant not found" });
        }

        var request = new CreateProviderRequest
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            Title = dto.Title,
            Specialty = dto.Specialty,
            LicenseNumber = dto.LicenseNumber,
            NpiNumber = dto.NpiNumber
        };

        var provider = await _clinicService.AddProviderToClinicAsync(tenantId, clinicId, request);
        var detail = await _clinicService.GetProviderDetailsAsync(tenantId, provider.UserId);
        var summary = await FindProviderSummary(provider.ClinicId, provider.UserId, tenantId);

        var response = detail != null
            ? MapProviderDetail(detail, summary)
            : new ProviderDetailDto
            {
                Id = provider.UserId,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                Title = dto.Title,
                Specialty = dto.Specialty,
                LicenseNumber = dto.LicenseNumber,
                IsActive = true,
                PatientCount = summary?.PatientCount ?? 0,
                AppointmentsToday = summary?.AppointmentsToday ?? 0,
                NextAvailableSlot = summary?.NextAvailableSlot,
                Statistics = new ProviderStatisticsDto()
            };

        return CreatedAtAction(nameof(GetProvider), new { providerId = provider.UserId }, response);
    }
    
    // POST: api/clinic-management/clinics/{clinicId}/providers
    [HttpPost("clinics/{clinicId}/providers")]
    [Authorize(Roles = AuthorizationRoles.Admin)]
    [ProducesResponseType(typeof(ProviderDto), 201)]
    public async Task<IActionResult> AddProvider(Guid clinicId, [FromBody] CreateProviderDto dto)
    {
        if (dto is null)
        {
            return BadRequest(new { error = "Request body is required." });
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Phase 4.1: Check tenant existence instead of clinic
        var tenantExists = await _context.Tenants.AsNoTracking().AnyAsync(t => t.Id == tenantId);
        if (!tenantExists)
        {
            return NotFound();
        }

        var request = new CreateProviderRequest
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            Title = dto.Title,
            Specialty = dto.Specialty,
            LicenseNumber = dto.LicenseNumber,
            NpiNumber = dto.NpiNumber
        };

        var provider = await _clinicService.AddProviderToClinicAsync(tenantId, clinicId, request);
        var detail = await _clinicService.GetProviderDetailsAsync(tenantId, provider.UserId);
        var summary = await FindProviderSummary(provider.ClinicId, provider.UserId, tenantId);

        var response = detail != null
            ? MapProviderDetail(detail, summary)
            : new ProviderDetailDto
            {
                Id = provider.UserId,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Title = dto.Title ?? string.Empty,
                Specialty = dto.Specialty ?? string.Empty,
                Email = dto.Email,
                Phone = dto.Phone ?? string.Empty,
                LicenseNumber = dto.LicenseNumber ?? string.Empty,
                NpiNumber = dto.NpiNumber ?? string.Empty,
                IsActive = true,
                PatientCount = summary?.PatientCount ?? 0,
                AppointmentsToday = summary?.AppointmentsToday ?? 0,
                NextAvailableSlot = summary?.NextAvailableSlot,
                Statistics = new ProviderStatisticsDto()
            };

        return CreatedAtAction(nameof(GetProvider), new { providerId = provider.UserId }, response);
    }
    
    // GET: api/clinic-management/providers/{providerId}
    [HttpGet("providers/{providerId}")]
    [Authorize]
    [ProducesResponseType(typeof(ProviderDetailDto), 200)]
    public async Task<IActionResult> GetProvider(Guid providerId)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var detail = await _clinicService.GetProviderDetailsAsync(tenantId, providerId);
        if (detail is null)
        {
            return NotFound();
        }

        var summary = await FindProviderSummary(detail.ClinicId, providerId, tenantId);
        var dto = MapProviderDetail(detail, summary);

        return Ok(dto);
    }
    
    // PUT: api/clinic-management/providers/{providerId}
    [HttpPut("providers/{providerId}")]
    [Authorize(Roles = AuthorizationRoles.Admin)] // TODO: Future - allow Clinician to update own profile
    [ProducesResponseType(typeof(ProviderDetailDto), 200)]
    public async Task<IActionResult> UpdateProvider(Guid providerId, [FromBody] UpdateProviderDto dto)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var request = new UpdateProviderRequest
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Title = dto.Title,
            Specialty = dto.Specialty,
            Email = dto.Email,
            Phone = dto.Phone,
            LicenseNumber = dto.LicenseNumber,
            IsActive = dto.IsActive
        };

        var updated = await _clinicService.UpdateProviderAsync(tenantId, providerId, request);
        if (updated == null)
        {
            return NotFound(new { error = "Provider not found." });
        }

        var detail = await _clinicService.GetProviderDetailsAsync(tenantId, providerId);
        var summary = await FindProviderSummary(detail?.ClinicId, providerId, tenantId);
        var response = detail != null ? MapProviderDetail(detail, summary) : null;

        return Ok(response);
    }
    
    // DELETE: api/clinic-management/providers/{providerId}
    [HttpDelete("providers/{providerId}")]
    [Authorize(Roles = AuthorizationRoles.Admin)] // TODO: Future - restrict to Admin only, ClinicAdmin = soft delete
    public async Task<IActionResult> DeleteProvider(Guid providerId)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        var success = await _clinicService.DeleteProviderAsync(tenantId, providerId);
        if (!success)
        {
            return NotFound(new { error = "Provider not found." });
        }

        return NoContent();
    }
    
    // GET: api/clinic-management/schedule (PHASE 2.1: Simplified endpoint)
    [HttpGet("schedule")]
    [Authorize]
    [ProducesResponseType(typeof(ClinicScheduleDto), 200)]
    public async Task<IActionResult> GetSchedule([FromQuery] DateTime? date = null)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Use tenantId as clinicId since they're now the same
        var clinicId = tenantId;
        
        var targetDate = (date ?? DateTime.UtcNow).Date;
        var nextDay = targetDate.AddDays(1);

        var providers = await _context.Providers
            .Include(p => p.User)
            .Where(p => p.ClinicId == clinicId)
            .ToListAsync();

        if (!providers.Any())
        {
            return Ok(new ClinicScheduleDto
            {
                ClinicId = clinicId,
                Date = targetDate,
                Providers = Array.Empty<ProviderScheduleSlotDto>()
            });
        }

        var appointments = await _context.Appointments
            .Where(a => a.ClinicId == clinicId && a.ScheduledStart >= targetDate && a.ScheduledStart < nextDay)
            .ToListAsync();

        var providerSchedules = providers
            .Select(provider =>
            {
                var providerAppointments = appointments
                    .Where(a => a.ProviderId == provider.UserId)
                    .Select(a => new AppointmentSlotDto
                    {
                        Id = a.Id,
                        PatientName = "Patient", // Anonymized for schedule view
                        StartTime = a.ScheduledStart,
                        EndTime = a.ScheduledEnd,
                        Status = a.Status.ToString()
                    })
                    .ToArray();

                return new ProviderScheduleSlotDto
                {
                    ProviderId = provider.UserId,
                    ProviderName = provider.User != null ? $"{provider.User.FirstName} {provider.User.LastName}".Trim() : "",
                    Appointments = providerAppointments.Select(a => new ScheduleSlotDto
                    {
                        StartTime = a.StartTime,
                        EndTime = a.EndTime,
                        IsAvailable = false,
                        AppointmentType = "Appointment",
                        PatientName = a.PatientName
                    }).ToArray()
                };
            })
            .ToArray();

        var response = new ClinicScheduleDto
        {
            ClinicId = clinicId,
            Date = targetDate,
            Providers = providerSchedules
        };

        return Ok(response);
    }
    
    // GET: api/clinic-management/clinics/{clinicId}/schedule
    [HttpGet("clinics/{clinicId}/schedule")]
    [Authorize]
    [ProducesResponseType(typeof(ClinicScheduleDto), 200)]
    public async Task<IActionResult> GetClinicSchedule(Guid clinicId, [FromQuery] DateTime? date = null)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized(new { error = "Tenant context is required." });
        }

        // Phase 4.1: Check tenant existence instead of clinic
        var tenantExists = await _context.Tenants.AsNoTracking().AnyAsync(t => t.Id == tenantId);
        if (!tenantExists)
        {
            return NotFound();
        }

        var targetDate = (date ?? DateTime.UtcNow).Date;
        var nextDay = targetDate.AddDays(1);

        var providers = await _context.Providers
            .Include(p => p.User)
            .Where(p => p.ClinicId == clinicId)
            .ToListAsync();

        var appointments = await _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.ClinicId == clinicId && a.ScheduledStart >= targetDate && a.ScheduledStart < nextDay)
            .ToListAsync();

        var providerSchedules = providers
            .Select(provider =>
            {
                var providerAppointments = appointments
                    .Where(a => a.ProviderId == provider.UserId)
                    .OrderBy(a => a.ScheduledStart)
                    .Select(a => new ScheduleSlotDto
                    {
                        StartTime = a.ScheduledStart,
                        EndTime = a.ScheduledEnd,
                        IsAvailable = false,
                        AppointmentType = a.AppointmentType,
                        PatientId = a.PatientId,
                        PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}".Trim() : string.Empty
                    })
                    .ToArray();

                return new ProviderScheduleSlotDto
                {
                    ProviderId = provider.UserId,
                    ProviderName = provider.User != null ? $"{provider.User.FirstName} {provider.User.LastName}".Trim() : "",
                    Appointments = providerAppointments,
                    AvailableSlots = Array.Empty<DateTime>()
                };
            })
            .ToArray();

        var response = new ClinicScheduleDto
        {
            ClinicId = clinicId,
            Date = targetDate,
            Providers = providerSchedules
        };

        return Ok(response);
    }
    
    // GET: api/clinic-management/analytics (PHASE 2.1: Simplified endpoint)
    [HttpGet("analytics")]
    [Authorize(Roles = AuthorizationRoles.Staff)] // TODO: Future - refine analytics permissions
    [ProducesResponseType(typeof(ClinicAnalyticsDto), 200)]
    public async Task<IActionResult> GetAnalytics([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct = default)
    {
        try
        {
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            if (tenantId == Guid.Empty)
            {
                return Unauthorized(new { error = "Tenant context is required." });
            }

            // Use tenantId as clinicId since they're now the same
            var clinicId = tenantId;

            // Validate date range
            if (from > to)
            {
                return BadRequest(new { error = "From date cannot be after to date." });
            }

            if ((to - from).TotalDays > 365)
            {
                return BadRequest(new { error = "Date range cannot exceed 365 days." });
            }

            // Get analytics data - simplified for now
            var analytics = new
            {
                period = new { from, to },
                appointmentMetrics = new { totalScheduled = 0, completed = 0 },
                patientMetrics = new { newPatients = 0, returningPatients = 0 },
                promMetrics = new { totalSent = 0, completed = 0 },
                revenueMetrics = new { totalBilled = 0m, totalCollected = 0m }
            };
            
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving analytics for tenant {TenantId}", _authorizationService.GetCurrentTenantId(HttpContext));
            return StatusCode(500, new { error = "An error occurred while retrieving analytics data." });
        }
    }
    
    // GET: api/clinic-management/clinics/{clinicId}/analytics
    [HttpGet("clinics/{clinicId}/analytics")]
    [Authorize(Roles = AuthorizationRoles.Staff)] // TODO: Future - refine analytics permissions
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
                .Include(a => a.Patient)
                .Include(a => a.Provider)
                .Where(a => a.TenantId == tenantId && a.ClinicId == clinicId && a.ScheduledStart >= periodStart && a.ScheduledStart <= periodEnd)
                .ToListAsync(ct);
            
            // Load Provider.User separately if needed
            var providerIds = appointments.Select(a => a.ProviderId).Where(id => id != Guid.Empty).Distinct().ToList();
            var providersWithUsers = await _context.Providers
                .Include(p => p.User)
                .Where(p => providerIds.Contains(p.UserId))
                .ToDictionaryAsync(p => p.UserId, ct);

            var totalAppointments = appointments.Count();
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

            var totalPatients = patientIds.Count();

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

            var totalProms = promInstances.Count();
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

            var firstAppointmentLookup = firstAppointments
                .GroupBy(fp => fp.PatientId)
                .ToDictionary(g => g.Key, g => g.Min(x => x.First).Date);

            var appointmentTrends = appointments
                .GroupBy(a => a.ScheduledStart.Date)
                .Select(g =>
                {
                    var date = g.Key.Date;
                    var total = g.Count();
                    var completedCount = g.Count(a => a.Status == AppointmentStatus.Completed);
                    var cancelledCount = g.Count(a => a.Status == AppointmentStatus.Cancelled);
                    var noShowCount = g.Count(a => a.Status == AppointmentStatus.NoShow);
                    var newPatientCount = g.Select(a => a.PatientId)
                        .Distinct()
                        .Count(pid => firstAppointmentLookup.TryGetValue(pid, out var firstDate) && firstDate == date);

                    return new AppointmentTrendDto
                    {
                        Date = date,
                        Appointments = total,
                        Completed = completedCount,
                        Cancellations = cancelledCount,
                        NoShows = noShowCount,
                        NewPatients = newPatientCount
                    };
                })
                .OrderBy(t => t.Date)
                .ToArray();

            var promCompletionBreakdown = promInstances
                .GroupBy(i => i.Template?.Name ?? "Unknown")
                .Select(g =>
                {
                    var total = g.Count();
                    var completed = g.Count(i => i.Status == PromStatus.Completed);
                    var pending = g.Count(i => i.Status == PromStatus.Pending || i.Status == PromStatus.InProgress);

                    return new PromCompletionBreakdownDto
                    {
                        TemplateName = g.Key,
                        Completed = completed,
                        Pending = pending,
                        CompletionRate = total == 0 ? 0 : Math.Round(completed * 100d / total, 1)
                    };
                })
                .OrderByDescending(x => x.Completed)
                .ToArray();

            var providerPerformance = appointments
                .Where(a => a.ProviderId != Guid.Empty)
                .GroupBy(a => new
                {
                    a.ProviderId,
                    Name = providersWithUsers.TryGetValue(a.ProviderId, out var provider) && provider.User != null
                        ? ($"{provider.User.FirstName} {provider.User.LastName}").Trim()
                        : "Unknown"
                })
                .Select(g =>
                {
                    var totalAppointments = g.Count();
                    var completedAppointments = g.Count(a => a.Status == AppointmentStatus.Completed);
                    var noShowAppointments = g.Count(a => a.Status == AppointmentStatus.NoShow);
                    var distinctPatients = g.Select(a => a.PatientId).Distinct().Count();
                    var revenue = g.Where(a => a.PaymentAmount.HasValue).Sum(a => a.PaymentAmount!.Value);

                    return new ProviderPerformanceDto
                    {
                        ProviderId = g.Key.ProviderId,
                        ProviderName = string.IsNullOrWhiteSpace(g.Key.Name) ? "Unknown" : g.Key.Name,
                        Patients = distinctPatients,
                        AppointmentsCompleted = completedAppointments,
                        NoShowRate = totalAppointments == 0 ? 0 : Math.Round(noShowAppointments * 100d / totalAppointments, 2),
                        Revenue = revenue,
                        Satisfaction = 0,
                        AverageWaitTime = 0
                    };
                })
                .OrderByDescending(p => p.AppointmentsCompleted)
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
                TopProcedures = topProcedures,
                AppointmentTrends = appointmentTrends,
                PromCompletionBreakdown = promCompletionBreakdown,
                ProviderPerformance = providerPerformance
            };

            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compute clinic analytics for clinic {ClinicId}", clinicId);
            return StatusCode(500, new { error = "Failed to compute clinic analytics" });
        }
    }

    private async Task<int> CountAppointmentsForClinicAsync(Guid clinicId)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        return await _context.Appointments
            .AsNoTracking()
            .Where(a => a.ClinicId == clinicId && a.ScheduledStart >= today && a.ScheduledStart < tomorrow && a.Status != AppointmentStatus.Cancelled)
            .CountAsync();
    }

    private static ClinicDto MapClinicSummary(ClinicSummary summary)
    {
        return new ClinicDto
        {
            Id = summary.Id,
            Name = summary.Name,
            Address = summary.Address,
            Phone = summary.Phone,
            Email = summary.Email,
            IsActive = summary.IsActive,
            PatientCount = summary.PatientCount,
            ProviderCount = summary.ProviderCount,
            AppointmentsToday = summary.AppointmentsToday,
            PendingPROMs = summary.PendingPROMs
        };
    }

    private ClinicDetailDto MapClinicDetail(ClinicDetail detail, int appointmentsToday)
    {
        var statistics = MapClinicStatistics(detail.Statistics, appointmentsToday);
        var dto = new ClinicDetailDto
        {
            Id = detail.Id,
            Name = detail.Name,
            Description = detail.Description,
            Phone = detail.Phone,
            Fax = detail.Fax,
            Email = detail.Email,
            Website = detail.Website,
            IsActive = detail.IsActive,
            EstablishedDate = detail.EstablishedDate,
            LicenseNumber = detail.LicenseNumber,
            TaxId = detail.TaxId,
            Services = detail.Services ?? Array.Empty<string>(),
            AcceptedInsurance = detail.AcceptedInsurance ?? Array.Empty<string>(),
            OperatingHours = MapOperatingHours(detail.OperatingHours),
            Statistics = statistics
        };

        dto.Address = new AddressDto
        {
            Street = detail.Address.Street,
            City = detail.Address.City,
            State = detail.Address.State,
            PostalCode = detail.Address.PostalCode,
            Country = detail.Address.Country
        };

        dto.PatientCount = statistics.TotalPatients;
        dto.ProviderCount = statistics.TotalProviders;
        dto.PendingPROMs = statistics.PendingProms;
        dto.AppointmentsToday = appointmentsToday;
        ((ClinicDto)dto).Address = FormatAddress(detail.Address);

        return dto;
    }

    private static ClinicStatisticsDto MapClinicStatistics(ClinicStatistics stats, int appointmentsToday)
    {
        return new ClinicStatisticsDto
        {
            TotalPatients = stats.TotalPatients,
            ActivePatients = stats.ActivePatients,
            TotalProviders = stats.TotalProviders,
            TotalStaff = stats.TotalStaff,
            AppointmentsThisMonth = stats.AppointmentsThisMonth,
            AppointmentsLastMonth = stats.AppointmentsLastMonth,
            AveragePatientSatisfaction = stats.AveragePatientSatisfaction,
            CompletedPromsThisMonth = stats.CompletedPromsThisMonth,
            PendingProms = stats.PendingProms,
            TodayAppointments = appointmentsToday,
            TotalAppointmentsToday = appointmentsToday,
            CompletedAppointments = 0,
            PendingAppointments = Math.Max(0, appointmentsToday - stats.CompletedPromsThisMonth),
            AverageWaitTime = 0,
            TotalPatientsThisWeek = stats.ActivePatients,
            NoShowRate = 0,
            WeekAppointments = 0,
            MonthAppointments = stats.AppointmentsThisMonth,
            PendingEvaluations = 0,
            CompletedEvaluations = 0,
            AverageRating = stats.AveragePatientSatisfaction,
            UnreadMessages = 0,
            AppointmentsByType = new Dictionary<string, int>(),
            AppointmentsByStatus = new Dictionary<string, int>()
        };
    }

    private static OperatingHoursDto[] MapOperatingHours(IEnumerable<OperatingHours> hours)
    {
        return hours?
            .Select(h => new OperatingHoursDto
            {
                Day = h.Day,
                Open = h.Open,
                Close = h.Close,
                IsClosed = string.IsNullOrWhiteSpace(h.Open) && string.IsNullOrWhiteSpace(h.Close)
            })
            .ToArray() ?? Array.Empty<OperatingHoursDto>();
    }

    private static string FormatAddress(ClinicAddress address)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(address.Street)) parts.Add(address.Street);
        if (!string.IsNullOrWhiteSpace(address.City)) parts.Add(address.City);
        if (!string.IsNullOrWhiteSpace(address.State)) parts.Add(address.State);
        if (!string.IsNullOrWhiteSpace(address.PostalCode)) parts.Add(address.PostalCode);
        if (!string.IsNullOrWhiteSpace(address.Country)) parts.Add(address.Country);
        return string.Join(", ", parts);
    }

    private static ProviderDto MapProviderSummary(ProviderSummary summary)
    {
        return new ProviderDto
        {
            Id = summary.Id,
            FirstName = summary.FirstName,
            LastName = summary.LastName,
            Title = summary.Title,
            Specialty = summary.Specialty,
            Email = summary.Email,
            Phone = summary.Phone,
            LicenseNumber = summary.LicenseNumber,
            IsActive = summary.IsActive,
            PatientCount = summary.PatientCount,
            AppointmentsToday = summary.AppointmentsToday,
            NextAvailableSlot = summary.NextAvailableSlot
        };
    }

    private ProviderDetailDto MapProviderDetail(ProviderDetail detail, ProviderSummary? summary)
    {
        var dto = new ProviderDetailDto
        {
            Id = detail.Id,
            FirstName = detail.FirstName,
            LastName = detail.LastName,
            Title = detail.Title,
            Specialty = detail.Specialty,
            Email = detail.Email,
            Phone = detail.Phone,
            LicenseNumber = detail.LicenseNumber,
            NpiNumber = detail.NpiNumber ?? string.Empty,
            IsActive = detail.IsActive,
            Biography = detail.Biography,
            Education = detail.Education?.ToArray() ?? Array.Empty<string>(),
            Languages = detail.Languages?.ToArray() ?? Array.Empty<string>(),
            Schedule = MapProviderSchedule(detail),
            Statistics = MapProviderStatistics(detail.Statistics),
            SubSpecialties = detail.Certifications?.ToArray() ?? Array.Empty<string>(),
            LicenseState = string.Empty,
            LicenseExpiry = DateTime.UtcNow.AddYears(1)
        };

        dto.PatientCount = summary?.PatientCount ?? detail.Statistics.TotalPatients;
        dto.AppointmentsToday = summary?.AppointmentsToday ?? 0;
        dto.NextAvailableSlot = summary?.NextAvailableSlot;

        return dto;
    }

    private static ProviderScheduleDto MapProviderSchedule(ProviderDetail detail)
    {
        return new ProviderScheduleDto
        {
            ProviderId = detail.Id,
            ProviderName = $"{detail.FirstName} {detail.LastName}".Trim(),
            Specialty = detail.Specialty,
            Schedule = new List<ScheduleSlotDto>(),
            WorkingHours = Array.Empty<OperatingHoursDto>(),
            DefaultAppointmentDuration = 30,
            BufferTime = 0
        };
    }

    private static ProviderStatisticsDto MapProviderStatistics(ProviderStatistics stats)
    {
        return new ProviderStatisticsDto
        {
            TotalPatients = stats.TotalPatients,
            NewPatientsThisMonth = 0,
            AppointmentsThisWeek = stats.CompletedAppointments,
            AppointmentsThisMonth = stats.TotalAppointments,
            AverageRating = stats.AverageRating,
            TotalReviews = 0,
            NoShowRate = 0,
            AverageWaitTime = 0
        };
    }

    private async Task<ProviderSummary?> FindProviderSummary(Guid? clinicId, Guid providerId, Guid tenantId)
    {
        if (!clinicId.HasValue)
        {
            return null;
        }

        var providers = await _clinicService.GetClinicProvidersAsync(tenantId, clinicId.Value, activeOnly: false);
        return providers.FirstOrDefault(p => p.Id == providerId);
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value;
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
    public string? Fax { get; set; }
    public string? Website { get; set; }
    public string? LicenseNumber { get; set; }
    public string? TaxId { get; set; }
    public string[]? Services { get; set; }
    public string[]? AcceptedInsurance { get; set; }
    public Dictionary<string, object>? OperatingHours { get; set; }
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
    public string? NpiNumber { get; set; }
}

public class UpdateProviderDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
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
    public AppointmentTrendDto[] AppointmentTrends { get; set; } = Array.Empty<AppointmentTrendDto>();
    public PromCompletionBreakdownDto[] PromCompletionBreakdown { get; set; } = Array.Empty<PromCompletionBreakdownDto>();
    public ProviderPerformanceDto[] ProviderPerformance { get; set; } = Array.Empty<ProviderPerformanceDto>();
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
public class AppointmentTrendDto
{
    public DateTime Date { get; set; }
    public int Appointments { get; set; }
    public int Completed { get; set; }
    public int Cancellations { get; set; }
    public int NoShows { get; set; }
    public int NewPatients { get; set; }
}

public class PromCompletionBreakdownDto
{
    public string TemplateName { get; set; } = string.Empty;
    public int Completed { get; set; }
    public int Pending { get; set; }
    public double CompletionRate { get; set; }
}

public class ProviderPerformanceDto
{
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public int Patients { get; set; }
    public int AppointmentsCompleted { get; set; }
    public double NoShowRate { get; set; }
    public decimal Revenue { get; set; }
    public double Satisfaction { get; set; }
    public double AverageWaitTime { get; set; }
}

public class AppointmentSlotDto
{
    public Guid Id { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
}

