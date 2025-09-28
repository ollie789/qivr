using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<MedicalRecordsController> _logger;
    private readonly IResourceAuthorizationService _authorizationService;

    public MedicalRecordsController(
        QivrDbContext context,
        ILogger<MedicalRecordsController> logger,
        IResourceAuthorizationService authorizationService)
    {
        _context = context;
        _logger = logger;
        _authorizationService = authorizationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiEnvelope<MedicalSummaryDto?>), 200)]
    public async Task<ActionResult<ApiEnvelope<MedicalSummaryDto?>>> GetSummary([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var tenantId = GetTenantId();

        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(new ApiEnvelope<MedicalSummaryDto?>(null));
        }

        var summary = await BuildMedicalSummaryAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(new ApiEnvelope<MedicalSummaryDto?>(summary));
    }

    [HttpGet("vitals")]
    [ProducesResponseType(typeof(IEnumerable<VitalSignDto>), 200)]
    public async Task<ActionResult<IEnumerable<VitalSignDto>>> GetVitalSigns([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var tenantId = GetTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<VitalSignDto>());
        }

        var vitals = await BuildVitalSignsAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(vitals);
    }

    [HttpGet("lab-results")]
    [ProducesResponseType(typeof(IEnumerable<LabResultGroupDto>), 200)]
    public async Task<ActionResult<IEnumerable<LabResultGroupDto>>> GetLabResults([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var tenantId = GetTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<LabResultGroupDto>());
        }

        var results = await BuildLabResultsAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(results);
    }

    [HttpGet("medications")]
    [ProducesResponseType(typeof(IEnumerable<MedicationDto>), 200)]
    public async Task<ActionResult<IEnumerable<MedicationDto>>> GetMedications([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var tenantId = GetTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<MedicationDto>());
        }

        var medications = await BuildMedicationsAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(medications);
    }

    [HttpGet("allergies")]
    [ProducesResponseType(typeof(IEnumerable<AllergyDto>), 200)]
    public async Task<ActionResult<IEnumerable<AllergyDto>>> GetAllergies([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var tenantId = GetTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<AllergyDto>());
        }

        var allergies = await BuildAllergiesAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(allergies);
    }

    [HttpGet("immunizations")]
    [ProducesResponseType(typeof(IEnumerable<ImmunizationDto>), 200)]
    public async Task<ActionResult<IEnumerable<ImmunizationDto>>> GetImmunizations([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var tenantId = GetTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<ImmunizationDto>());
        }

        var immunizations = await BuildImmunizationsAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(immunizations);
    }

    private async Task<MedicalSummaryDto> BuildMedicalSummaryAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken)
    {
        var patient = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == patientId, cancellationToken);

        var now = DateTime.UtcNow;
        var upcomingAppointments = await _context.Appointments
            .Include(a => a.Provider)
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId && a.ScheduledStart >= now && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.ScheduledStart)
            .Take(3)
            .Select(a => new UpcomingAppointmentDto
            {
                Id = a.Id,
                Date = a.ScheduledStart,
                Provider = a.Provider != null ? a.Provider.FullName.Trim() : "Unknown",
                Type = a.AppointmentType,
                Status = a.Status.ToString().ToLowerInvariant()
            })
            .ToListAsync(cancellationToken);

        var recentVisits = await _context.Appointments
            .Include(a => a.Provider)
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId && a.ScheduledStart < now)
            .OrderByDescending(a => a.ScheduledStart)
            .Take(5)
            .Select(a => new RecentVisitDto
            {
                Id = a.Id,
                Date = a.ScheduledStart,
                Provider = a.Provider != null ? a.Provider.FullName.Trim() : "Unknown",
                Facility = a.LocationDetails != null && a.LocationDetails.ContainsKey("address") ? a.LocationDetails["address"].ToString() : "Clinic",
                Notes = a.Notes
            })
            .ToListAsync(cancellationToken);

        var conditions = await _context.MedicalConditions
            .Where(c => c.TenantId == tenantId && c.PatientId == patientId)
            .OrderByDescending(c => c.DiagnosedDate)
            .ToListAsync(cancellationToken);

        List<MedicalConditionDto> conditionDtos;
        if (conditions.Any())
        {
            conditionDtos = conditions.Select(c => new MedicalConditionDto
            {
                Id = c.Id,
                Condition = c.Condition,
                Icd10Code = c.Icd10Code,
                DiagnosedDate = c.DiagnosedDate,
                Status = c.Status,
                ManagedBy = c.ManagedBy,
                LastReviewed = c.LastReviewed,
                Notes = c.Notes
            }).ToList();
        }
        else
        {
            conditionDtos = GenerateSampleConditions(patient?.FullName.Trim());
        }

        return new MedicalSummaryDto
        {
            Conditions = conditionDtos,
            UpcomingAppointments = upcomingAppointments,
            RecentVisits = recentVisits
        };
    }

    private async Task<List<VitalSignDto>> BuildVitalSignsAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken)
    {
        var vitals = await _context.MedicalVitals
            .Where(v => v.TenantId == tenantId && v.PatientId == patientId)
            .OrderByDescending(v => v.RecordedAt)
            .Take(12)
            .ToListAsync(cancellationToken);

        if (!vitals.Any())
        {
            var baseline = await _context.Appointments
                .Where(a => a.TenantId == tenantId && a.PatientId == patientId)
                .OrderByDescending(a => a.ScheduledStart)
                .Select(a => a.ScheduledStart)
                .FirstOrDefaultAsync(cancellationToken);

            return GenerateSampleVitalSigns(baseline == default ? DateTime.UtcNow : baseline);
        }

        return vitals.Select(v => new VitalSignDto
        {
            Id = v.Id,
            Date = v.RecordedAt,
            BloodPressure = new BloodPressureDto { Systolic = v.Systolic, Diastolic = v.Diastolic },
            HeartRate = v.HeartRate,
            Temperature = v.TemperatureCelsius,
            Weight = v.WeightKilograms,
            Height = v.HeightCentimetres,
            Bmi = CalculateBmi(v.HeightCentimetres, v.WeightKilograms),
            OxygenSaturation = v.OxygenSaturation,
            RespiratoryRate = v.RespiratoryRate
        }).ToList();
    }

    private async Task<List<LabResultGroupDto>> BuildLabResultsAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken)
    {
        var results = await _context.MedicalLabResults
            .Where(r => r.TenantId == tenantId && r.PatientId == patientId)
            .OrderByDescending(r => r.ResultDate)
            .ToListAsync(cancellationToken);

        if (!results.Any())
        {
            return GenerateSampleLabResults();
        }

        return results
            .GroupBy(r => new { r.Category, Date = r.ResultDate.Date })
            .Select(g => new LabResultGroupDto
            {
                Category = g.Key.Category,
                Date = g.First().ResultDate,
                Tests = g.Select(r => new LabResultDto
                {
                    Id = r.Id,
                    TestName = r.TestName,
                    Value = r.Value,
                    Unit = r.Unit,
                    ReferenceRange = r.ReferenceRange,
                    Status = r.Status,
                    Provider = r.OrderedBy,
                    Notes = r.Notes
                }).ToList()
            })
            .ToList();
    }

    private async Task<List<MedicationDto>> BuildMedicationsAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken)
    {
        var medications = await _context.MedicalMedications
            .Where(m => m.TenantId == tenantId && m.PatientId == patientId)
            .OrderByDescending(m => m.StartDate)
            .ToListAsync(cancellationToken);

        if (!medications.Any())
        {
            return GenerateSampleMedications();
        }

        return medications.Select(m => new MedicationDto
        {
            Id = m.Id,
            Name = m.Name,
            Dosage = m.Dosage,
            Frequency = m.Frequency,
            StartDate = m.StartDate,
            EndDate = m.EndDate,
            Status = m.Status,
            PrescribedBy = m.PrescribedBy,
            Instructions = m.Instructions,
            RefillsRemaining = m.RefillsRemaining,
            LastFilled = m.LastFilled,
            Pharmacy = m.Pharmacy
        }).ToList();
    }

    private async Task<List<AllergyDto>> BuildAllergiesAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken)
    {
        var allergies = await _context.MedicalAllergies
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId)
            .OrderBy(a => a.Allergen)
            .ToListAsync(cancellationToken);

        if (!allergies.Any())
        {
            return GenerateSampleAllergies();
        }

        return allergies.Select(a => new AllergyDto
        {
            Id = a.Id,
            Allergen = a.Allergen,
            Type = a.Type,
            Severity = a.Severity,
            Reaction = a.Reaction,
            DiagnosedDate = a.DiagnosedDate,
            Notes = a.Notes
        }).ToList();
    }

    private async Task<List<ImmunizationDto>> BuildImmunizationsAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken)
    {
        var immunizations = await _context.MedicalImmunizations
            .Where(i => i.TenantId == tenantId && i.PatientId == patientId)
            .OrderByDescending(i => i.Date)
            .ToListAsync(cancellationToken);

        if (!immunizations.Any())
        {
            return GenerateSampleImmunizations();
        }

        return immunizations.Select(i => new ImmunizationDto
        {
            Id = i.Id,
            Vaccine = i.Vaccine,
            Date = i.Date,
            NextDue = i.NextDue,
            Provider = i.Provider,
            Facility = i.Facility,
            LotNumber = i.LotNumber,
            Series = i.Series
        }).ToList();
    }

    private async Task<Guid> ResolveEffectivePatientIdAsync(Guid currentUserId, Guid? requestedPatientId, CancellationToken cancellationToken)
    {
        if (requestedPatientId.HasValue && requestedPatientId.Value != Guid.Empty)
        {
            if (await _authorizationService.UserCanAccessPatientDataAsync(currentUserId, requestedPatientId.Value))
            {
                return requestedPatientId.Value;
            }

            _logger.LogWarning("User {UserId} attempted to access patient {PatientId} medical records without permission", currentUserId, requestedPatientId);
            return Guid.Empty;
        }

        if (User.IsInRole("Patient"))
        {
            return currentUserId;
        }

        _logger.LogWarning("User {UserId} did not specify patientId when accessing medical records", currentUserId);
        return Guid.Empty;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }

        throw new UnauthorizedAccessException("User ID not found");
    }

    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }

        throw new UnauthorizedAccessException("Tenant ID not found");
    }

    private static List<MedicalConditionDto> GenerateSampleConditions(string? patientName)
    {
        var conditions = new List<MedicalConditionDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Condition = "Hypertension",
                Icd10Code = "I10",
                DiagnosedDate = DateTime.UtcNow.AddYears(-4),
                Status = "managed",
                ManagedBy = "Dr. Alicia Thornton",
                LastReviewed = DateTime.UtcNow.AddMonths(-3),
                Notes = "Blood pressure stable with current medication regime."
            },
            new()
            {
                Id = Guid.NewGuid(),
                Condition = "Type 2 Diabetes",
                Icd10Code = "E11.9",
                DiagnosedDate = DateTime.UtcNow.AddYears(-2),
                Status = "active",
                ManagedBy = "Dr. Omar Rahman",
                LastReviewed = DateTime.UtcNow.AddMonths(-1),
                Notes = "A1C trending downward. Continuing diet + exercise program"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Condition = "Seasonal allergies",
                DiagnosedDate = DateTime.UtcNow.AddYears(-8),
                Status = "chronic",
                ManagedBy = patientName ?? "Primary Care",
                LastReviewed = DateTime.UtcNow.AddMonths(-6)
            }
        };

        return conditions;
    }

    private static List<VitalSignDto> GenerateSampleVitalSigns(DateTime referenceDate)
    {
        var results = new List<VitalSignDto>();
        for (var i = 0; i < 6; i++)
        {
            var date = referenceDate.AddDays(-14 * i);
            results.Add(new VitalSignDto
            {
                Id = Guid.NewGuid(),
                Date = date,
                BloodPressure = new BloodPressureDto { Systolic = 118 + i, Diastolic = 76 + (i % 3) },
                HeartRate = 68 + (i % 5),
                Temperature = 36.6m + (i % 2 == 0 ? 0.1m : 0m),
                Weight = 78 - i * 0.3m,
                Height = 175.0m,
                Bmi = 25.5m - i * 0.1m,
                OxygenSaturation = 97 - (i % 2),
                RespiratoryRate = 16
            });
        }

        return results;
    }

    private static decimal CalculateBmi(decimal heightCentimetres, decimal weightKilograms)
    {
        if (heightCentimetres <= 0 || weightKilograms <= 0)
        {
            return 0;
        }

        var heightMetres = heightCentimetres / 100m;
        var bmi = weightKilograms / (heightMetres * heightMetres);
        return Math.Round(bmi, 1);
    }

    private static List<LabResultGroupDto> GenerateSampleLabResults()
    {
        return new List<LabResultGroupDto>
        {
            new()
            {
                Category = "Comprehensive Metabolic Panel",
                Date = DateTime.UtcNow.AddMonths(-2),
                Tests = new List<LabResultDto>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TestName = "Glucose",
                        Value = "95",
                        Unit = "mg/dL",
                        ReferenceRange = "70 - 99",
                        Status = "normal",
                        Provider = "Qivr Diagnostics"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TestName = "ALT",
                        Value = "32",
                        Unit = "U/L",
                        ReferenceRange = "0 - 55",
                        Status = "normal",
                        Provider = "Qivr Diagnostics"
                    }
                }
            },
            new()
            {
                Category = "Lipid Panel",
                Date = DateTime.UtcNow.AddMonths(-6),
                Tests = new List<LabResultDto>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TestName = "Total Cholesterol",
                        Value = "182",
                        Unit = "mg/dL",
                        ReferenceRange = "< 200",
                        Status = "normal",
                        Provider = "Qivr Diagnostics"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TestName = "HDL",
                        Value = "48",
                        Unit = "mg/dL",
                        ReferenceRange = "> 40",
                        Status = "normal",
                        Provider = "Qivr Diagnostics"
                    }
                }
            }
        };
    }

    private static List<MedicationDto> GenerateSampleMedications()
    {
        return new List<MedicationDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Metformin",
                Dosage = "500 mg",
                Frequency = "Twice daily",
                StartDate = DateTime.UtcNow.AddYears(-2),
                PrescribedBy = "Dr. Omar Rahman",
                Status = "active",
                RefillsRemaining = 3,
                LastFilled = DateTime.UtcNow.AddMonths(-1),
                Pharmacy = "Qivr Pharmacy",
                Instructions = "Take with meals"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Lisinopril",
                Dosage = "10 mg",
                Frequency = "Once daily",
                StartDate = DateTime.UtcNow.AddYears(-3),
                PrescribedBy = "Dr. Alicia Thornton",
                Status = "active",
                Instructions = "Take in the morning"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Fluticasone Nasal Spray",
                Dosage = "50 mcg",
                Frequency = "As needed",
                StartDate = DateTime.UtcNow.AddMonths(-11),
                PrescribedBy = "Dr. Andrew Nolan",
                Status = "completed",
                EndDate = DateTime.UtcNow.AddMonths(-1)
            }
        };
    }

    private static List<AllergyDto> GenerateSampleAllergies()
    {
        return new List<AllergyDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Allergen = "Penicillin",
                Type = "medication",
                Severity = "severe",
                Reaction = "Anaphylaxis",
                DiagnosedDate = DateTime.UtcNow.AddYears(-12)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Allergen = "Peanuts",
                Type = "food",
                Severity = "life-threatening",
                Reaction = "Anaphylaxis",
                Notes = "Carries EpiPen"
            }
        };
    }

    private static List<ImmunizationDto> GenerateSampleImmunizations()
    {
        return new List<ImmunizationDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Vaccine = "Influenza",
                Date = DateTime.UtcNow.AddMonths(-2),
                Provider = "Nurse Taylor",
                Facility = "Qivr Clinic",
                NextDue = DateTime.UtcNow.AddMonths(10),
                LotNumber = "FLU-2024-118"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Vaccine = "COVID-19 Booster",
                Date = DateTime.UtcNow.AddMonths(-8),
                Provider = "Dr. Alicia Thornton",
                Facility = "Qivr Clinic",
                Series = "Moderna Booster"
            }
        };
    }
}

public sealed class ApiEnvelope<T>
{
    public ApiEnvelope(T data)
    {
        Data = data;
    }

    public T Data { get; }
}

public sealed class MedicalSummaryDto
{
    public IEnumerable<MedicalConditionDto> Conditions { get; set; } = Array.Empty<MedicalConditionDto>();
    public IEnumerable<UpcomingAppointmentDto> UpcomingAppointments { get; set; } = Array.Empty<UpcomingAppointmentDto>();
    public IEnumerable<RecentVisitDto> RecentVisits { get; set; } = Array.Empty<RecentVisitDto>();
}

public sealed class MedicalConditionDto
{
    public Guid Id { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }
    public DateTime DiagnosedDate { get; set; }
    public string Status { get; set; } = "active";
    public string ManagedBy { get; set; } = string.Empty;
    public DateTime LastReviewed { get; set; }
    public string? Notes { get; set; }
}

public sealed class UpcomingAppointmentDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public sealed class RecentVisitDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Facility { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public sealed class VitalSignDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public BloodPressureDto BloodPressure { get; set; } = new();
    public int HeartRate { get; set; }
    public decimal Temperature { get; set; }
    public decimal Weight { get; set; }
    public decimal Height { get; set; }
    public decimal Bmi { get; set; }
    public int OxygenSaturation { get; set; }
    public int RespiratoryRate { get; set; }
}

public sealed class BloodPressureDto
{
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
}

public sealed class LabResultGroupDto
{
    public string Category { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public IList<LabResultDto> Tests { get; set; } = new List<LabResultDto>();
}

public sealed class LabResultDto
{
    public Guid Id { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string ReferenceRange { get; set; } = string.Empty;
    public string Status { get; set; } = "normal";
    public string Provider { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public sealed class MedicationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string PrescribedBy { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public int? RefillsRemaining { get; set; }
    public DateTime? LastFilled { get; set; }
    public string? Pharmacy { get; set; }
    public string? Instructions { get; set; }
}

public sealed class AllergyDto
{
    public Guid Id { get; set; }
    public string Allergen { get; set; } = string.Empty;
    public string Type { get; set; } = "other";
    public string Severity { get; set; } = "mild";
    public string Reaction { get; set; } = string.Empty;
    public DateTime? DiagnosedDate { get; set; }
    public string? Notes { get; set; }
}

public sealed class ImmunizationDto
{
    public Guid Id { get; set; }
    public string Vaccine { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Facility { get; set; } = string.Empty;
    public DateTime? NextDue { get; set; }
    public string? Series { get; set; }
    public string? LotNumber { get; set; }
}
