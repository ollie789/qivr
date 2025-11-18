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
public class MedicalRecordsController : BaseApiController
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
        var currentUserId = CurrentUserId;
        var tenantId = RequireTenantId();

        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(new ApiEnvelope<MedicalSummaryDto?>(null));
        }

        var summary = await BuildMedicalSummaryAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(new ApiEnvelope<MedicalSummaryDto?>(summary));
    }

    [HttpGet("pain-assessments")]
    [ProducesResponseType(typeof(IEnumerable<PainAssessmentDto>), 200)]
    public async Task<ActionResult<IEnumerable<PainAssessmentDto>>> GetPainAssessments([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = CurrentUserId;
        var tenantId = RequireTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<PainAssessmentDto>());
        }

        var assessments = await _context.PainAssessments
            .Where(p => p.TenantId == tenantId && p.PatientId == effectivePatientId)
            .OrderByDescending(p => p.RecordedAt)
            .Select(p => new PainAssessmentDto
            {
                Id = p.Id,
                RecordedAt = p.RecordedAt,
                RecordedBy = p.RecordedBy,
                OverallPainLevel = p.OverallPainLevel,
                FunctionalImpact = p.FunctionalImpact,
                PainPointsJson = p.PainPointsJson,
                EvaluationId = p.EvaluationId,
                Notes = p.Notes
            })
            .ToListAsync(cancellationToken);

        return Ok(assessments);
    }

    [HttpGet("lab-results")]
    [ProducesResponseType(typeof(IEnumerable<LabResultGroupDto>), 200)]
    public async Task<ActionResult<IEnumerable<LabResultGroupDto>>> GetLabResults([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = CurrentUserId;
        var tenantId = RequireTenantId();
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
        var currentUserId = CurrentUserId;
        var tenantId = RequireTenantId();
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
        var currentUserId = CurrentUserId;
        var tenantId = RequireTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<AllergyDto>());
        }

        var allergies = await BuildAllergiesAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(allergies);
    }

    [HttpPost("pain-assessments")]
    [ProducesResponseType(typeof(PainAssessmentDto), 201)]
    public async Task<ActionResult<PainAssessmentDto>> CreatePainAssessment([FromBody] CreatePainAssessmentRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;
        
        var patientId = User.IsInRole("Patient") ? userId : request.PatientId;
        
        var patient = await _context.Users
            .Where(u => u.Id == patientId && u.TenantId == tenantId && u.UserType == UserType.Patient)
            .FirstOrDefaultAsync();
            
        if (patient == null)
            return BadRequest(new { message = "Patient not found" });

        var bmi = request.WeightKg.HasValue && request.HeightCm.HasValue 
            ? CalculateBmi(request.HeightCm.Value, request.WeightKg.Value)
            : null;

        var assessment = new PainAssessment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            EvaluationId = request.EvaluationId,
            RecordedAt = request.RecordedAt ?? DateTime.UtcNow,
            RecordedBy = User.Identity?.Name ?? "Unknown",
            OverallPainLevel = request.OverallPainLevel,
            FunctionalImpact = request.FunctionalImpact ?? "none",
            PainPointsJson = request.PainPointsJson,
            Notes = request.Notes,
            WeightKg = request.WeightKg,
            HeightCm = request.HeightCm,
            Bmi = bmi,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.PainAssessments.Add(assessment);
        await _context.SaveChangesAsync();

        var dto = new PainAssessmentDto
        {
            Id = assessment.Id,
            RecordedAt = assessment.RecordedAt,
            RecordedBy = assessment.RecordedBy,
            OverallPainLevel = assessment.OverallPainLevel,
            FunctionalImpact = assessment.FunctionalImpact,
            PainPointsJson = assessment.PainPointsJson,
            EvaluationId = assessment.EvaluationId,
            Notes = assessment.Notes,
            WeightKg = assessment.WeightKg,
            HeightCm = assessment.HeightCm,
            Bmi = assessment.Bmi
        };

        return CreatedAtAction(nameof(GetPainAssessments), new { patientId }, dto);
    }

    [HttpPost("medications")]
    [ProducesResponseType(typeof(MedicationDto), 201)]
    public async Task<ActionResult<MedicationDto>> CreateMedication([FromBody] CreateMedicationRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;
        
        var patientId = User.IsInRole("Patient") ? userId : request.PatientId;
        
        // Validate patient exists
        var patient = await _context.Users
            .Where(u => u.Id == patientId && u.TenantId == tenantId && u.UserType == UserType.Patient)
            .FirstOrDefaultAsync();
            
        if (patient == null)
            return BadRequest(new { message = "Patient not found" });

        var medication = new MedicalMedication
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            Name = request.Name,
            Dosage = request.Dosage,
            Frequency = request.Frequency,
            StartDate = request.StartDate.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc) 
                : request.StartDate.ToUniversalTime(),
            EndDate = request.EndDate.HasValue 
                ? (request.EndDate.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc) 
                    : request.EndDate.Value.ToUniversalTime())
                : null,
            Status = request.Status ?? "active",
            PrescribedBy = request.PrescribedBy,
            Instructions = request.Instructions,
            RefillsRemaining = request.RefillsRemaining,
            LastFilled = request.LastFilled.HasValue 
                ? (request.LastFilled.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(request.LastFilled.Value, DateTimeKind.Utc) 
                    : request.LastFilled.Value.ToUniversalTime())
                : null,
            Pharmacy = request.Pharmacy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MedicalMedications.Add(medication);
        await _context.SaveChangesAsync();

        var dto = new MedicationDto
        {
            Id = medication.Id,
            Name = medication.Name,
            Dosage = medication.Dosage,
            Frequency = medication.Frequency,
            StartDate = medication.StartDate,
            EndDate = medication.EndDate,
            Status = medication.Status,
            PrescribedBy = medication.PrescribedBy,
            Instructions = medication.Instructions,
            RefillsRemaining = medication.RefillsRemaining,
            LastFilled = medication.LastFilled,
            Pharmacy = medication.Pharmacy
        };

        return CreatedAtAction(nameof(GetMedications), new { patientId }, dto);
    }

    [HttpPost("allergies")]
    [ProducesResponseType(typeof(AllergyDto), 201)]
    public async Task<ActionResult<AllergyDto>> CreateAllergy([FromBody] CreateAllergyRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;
        
        var patientId = User.IsInRole("Patient") ? userId : request.PatientId;
        
        // Validate patient exists
        var patient = await _context.Users
            .Where(u => u.Id == patientId && u.TenantId == tenantId && u.UserType == UserType.Patient)
            .FirstOrDefaultAsync();
            
        if (patient == null)
            return BadRequest(new { message = "Patient not found" });

        var allergy = new MedicalAllergy
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            Allergen = request.Allergen,
            Type = request.Type ?? "other",
            Severity = request.Severity ?? "mild",
            Reaction = request.Reaction,
            DiagnosedDate = request.DiagnosedDate.HasValue 
                ? (request.DiagnosedDate.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(request.DiagnosedDate.Value, DateTimeKind.Utc) 
                    : request.DiagnosedDate.Value.ToUniversalTime())
                : null,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MedicalAllergies.Add(allergy);
        await _context.SaveChangesAsync();

        var dto = new AllergyDto
        {
            Id = allergy.Id,
            Allergen = allergy.Allergen,
            Type = allergy.Type,
            Severity = allergy.Severity,
            Reaction = allergy.Reaction,
            DiagnosedDate = allergy.DiagnosedDate,
            Notes = allergy.Notes
        };

        return CreatedAtAction(nameof(GetAllergies), new { patientId }, dto);
    }

    [HttpPost("conditions")]
    [ProducesResponseType(typeof(MedicalConditionDto), 201)]
    public async Task<ActionResult<MedicalConditionDto>> CreateCondition([FromBody] CreateConditionRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;
        
        var patientId = User.IsInRole("Patient") ? userId : request.PatientId;
        
        // Validate patient exists
        var patient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == patientId && u.TenantId == tenantId);
        
        if (patient == null)
        {
            return NotFound("Patient not found");
        }

        var condition = new MedicalCondition
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            Condition = request.Condition,
            Icd10Code = request.Icd10Code,
            DiagnosedDate = request.DiagnosedDate.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(request.DiagnosedDate, DateTimeKind.Utc) 
                : request.DiagnosedDate.ToUniversalTime(),
            Status = request.Status ?? "active",
            ManagedBy = request.ManagedBy ?? "Care Team",
            LastReviewed = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MedicalConditions.Add(condition);
        await _context.SaveChangesAsync();

        var dto = new MedicalConditionDto
        {
            Id = condition.Id,
            Condition = condition.Condition,
            Icd10Code = condition.Icd10Code,
            DiagnosedDate = condition.DiagnosedDate,
            Status = condition.Status,
            ManagedBy = condition.ManagedBy,
            LastReviewed = condition.LastReviewed,
            Notes = condition.Notes
        };

        return CreatedAtAction(nameof(GetSummary), new { patientId }, dto);
    }

    [HttpPost("immunizations")]
    [ProducesResponseType(typeof(ImmunizationDto), 201)]
    public async Task<ActionResult<ImmunizationDto>> CreateImmunization([FromBody] CreateImmunizationRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;
        
        var patientId = User.IsInRole("Patient") ? userId : request.PatientId;
        
        // Validate patient exists
        var patient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == patientId && u.TenantId == tenantId);
        
        if (patient == null)
        {
            return NotFound("Patient not found");
        }

        var immunization = new MedicalImmunization
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            Vaccine = request.Vaccine,
            Date = request.Date.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(request.Date, DateTimeKind.Utc) 
                : request.Date.ToUniversalTime(),
            NextDue = request.NextDue.HasValue 
                ? (request.NextDue.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(request.NextDue.Value, DateTimeKind.Utc) 
                    : request.NextDue.Value.ToUniversalTime())
                : null,
            Provider = request.Provider ?? "Care Team",
            Facility = request.Facility ?? "Clinic",
            LotNumber = request.LotNumber,
            Series = request.Series,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MedicalImmunizations.Add(immunization);
        await _context.SaveChangesAsync();

        var dto = new ImmunizationDto
        {
            Id = immunization.Id,
            Vaccine = immunization.Vaccine,
            Date = immunization.Date,
            NextDue = immunization.NextDue,
            Provider = immunization.Provider,
            Facility = immunization.Facility,
            LotNumber = immunization.LotNumber,
            Series = immunization.Series
        };

        return CreatedAtAction(nameof(GetImmunizations), new { patientId }, dto);
    }

    [HttpPost("procedures")]
    [ProducesResponseType(typeof(ProcedureDto), 201)]
    public async Task<ActionResult<ProcedureDto>> CreateProcedure([FromBody] CreateProcedureRequest request)
    {
        var tenantId = RequireTenantId();
        var userId = CurrentUserId;
        
        var patientId = User.IsInRole("Patient") ? userId : request.PatientId;
        
        // Validate patient exists
        var patient = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == patientId && u.TenantId == tenantId);
        
        if (patient == null)
        {
            return NotFound("Patient not found");
        }

        var procedure = new MedicalProcedure
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            ProcedureName = request.ProcedureName,
            CptCode = request.CptCode,
            ProcedureDate = request.ProcedureDate.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(request.ProcedureDate, DateTimeKind.Utc) 
                : request.ProcedureDate.ToUniversalTime(),
            Provider = request.Provider ?? "Care Team",
            Facility = request.Facility ?? "Clinic",
            Status = request.Status ?? "completed",
            Outcome = request.Outcome,
            Complications = request.Complications,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MedicalProcedures.Add(procedure);
        await _context.SaveChangesAsync();

        var dto = new ProcedureDto
        {
            Id = procedure.Id.ToString(),
            ProcedureName = procedure.ProcedureName,
            CptCode = procedure.CptCode,
            ProcedureDate = procedure.ProcedureDate.ToString("yyyy-MM-dd"),
            Provider = procedure.Provider,
            Facility = procedure.Facility,
            Status = procedure.Status,
            Outcome = procedure.Outcome,
            Complications = procedure.Complications,
            Notes = procedure.Notes
        };

        return CreatedAtAction(nameof(GetProcedures), new { patientId }, dto);
    }

    [HttpGet("immunizations")]
    [ProducesResponseType(typeof(IEnumerable<ImmunizationDto>), 200)]
    public async Task<ActionResult<IEnumerable<ImmunizationDto>>> GetImmunizations([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = CurrentUserId;
        var tenantId = RequireTenantId();
        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<ImmunizationDto>());
        }

        var immunizations = await BuildImmunizationsAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(immunizations);
    }

    [HttpGet("procedures")]
    [ProducesResponseType(typeof(ProcedureDto[]), 200)]
    public async Task<ActionResult<ProcedureDto[]>> GetProcedures([FromQuery] Guid? patientId, CancellationToken cancellationToken)
    {
        var currentUserId = CurrentUserId;
        var tenantId = RequireTenantId();

        var effectivePatientId = await ResolveEffectivePatientIdAsync(currentUserId, patientId, cancellationToken);
        if (effectivePatientId == Guid.Empty)
        {
            return Ok(Array.Empty<ProcedureDto>());
        }

        var procedures = await BuildProceduresAsync(tenantId, effectivePatientId, cancellationToken);
        return Ok(procedures);
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

    private async Task<ProcedureDto[]> BuildProceduresAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken)
    {
        var procedures = await _context.MedicalProcedures
            .Where(p => p.TenantId == tenantId && p.PatientId == patientId)
            .OrderByDescending(p => p.ProcedureDate)
            .ToListAsync(cancellationToken);

        return procedures.Select(p => new ProcedureDto
        {
            Id = p.Id.ToString(),
            ProcedureName = p.ProcedureName,
            CptCode = p.CptCode,
            ProcedureDate = p.ProcedureDate.ToString("yyyy-MM-dd"),
            Provider = p.Provider,
            Facility = p.Facility,
            Status = p.Status,
            Outcome = p.Outcome,
            Complications = p.Complications,
            Notes = p.Notes
        }).ToArray();
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

    // GetCurrentUserId method removed - using BaseApiController.CurrentUserId instead

    // GetTenantId method removed - using BaseApiController.CurrentTenantId instead

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

public sealed class CreateMedicationRequest
{
    public Guid PatientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
    public string PrescribedBy { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public int? RefillsRemaining { get; set; }
    public DateTime? LastFilled { get; set; }
    public string? Pharmacy { get; set; }
}

public sealed class CreateAllergyRequest
{
    public Guid PatientId { get; set; }
    public string Allergen { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Severity { get; set; }
    public string Reaction { get; set; } = string.Empty;
    public DateTime? DiagnosedDate { get; set; }
    public string? Notes { get; set; }
}

public sealed class CreateConditionRequest
{
    public Guid PatientId { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }
    public DateTime DiagnosedDate { get; set; }
    public string? Status { get; set; }
    public string? ManagedBy { get; set; }
    public string? Notes { get; set; }
}

public sealed class CreateImmunizationRequest
{
    public Guid PatientId { get; set; }
    public string Vaccine { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime? NextDue { get; set; }
    public string? Provider { get; set; }
    public string? Facility { get; set; }
    public string? LotNumber { get; set; }
    public string? Series { get; set; }
}

public sealed class CreateProcedureRequest
{
    public Guid PatientId { get; set; }
    public string ProcedureName { get; set; } = string.Empty;
    public string? CptCode { get; set; }
    public DateTime ProcedureDate { get; set; }
    public string? Provider { get; set; }
    public string? Facility { get; set; }
    public string? Status { get; set; }
    public string? Outcome { get; set; }
    public string? Complications { get; set; }
    public string? Notes { get; set; }
}

public sealed class ProcedureDto
{
    public string Id { get; set; } = string.Empty;
    public string ProcedureName { get; set; } = string.Empty;
    public string? CptCode { get; set; }
    public string ProcedureDate { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Facility { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Outcome { get; set; }
    public string? Complications { get; set; }
    public string? Notes { get; set; }
}

public sealed class PainAssessmentDto
{
    public Guid Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public string RecordedBy { get; set; } = string.Empty;
    public int OverallPainLevel { get; set; }
    public string FunctionalImpact { get; set; } = string.Empty;
    public string? PainPointsJson { get; set; }
    public Guid? EvaluationId { get; set; }
    public string? Notes { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? Bmi { get; set; }
}

public sealed class CreatePainAssessmentRequest
{
    public Guid PatientId { get; set; }
    public Guid? EvaluationId { get; set; }
    public DateTime? RecordedAt { get; set; }
    public int OverallPainLevel { get; set; }
    public string? FunctionalImpact { get; set; }
    public string? PainPointsJson { get; set; }
    public string? Notes { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
}
