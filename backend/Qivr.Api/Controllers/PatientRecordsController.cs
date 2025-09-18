using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.Entities;
using Qivr.Core.DTOs;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/patient-records")]
[Authorize]
public class PatientRecordsController : ControllerBase
{
	private readonly IPatientRecordService _patientRecordService;
	private readonly ILogger<PatientRecordsController> _logger;

	public PatientRecordsController(IPatientRecordService patientRecordService, ILogger<PatientRecordsController> logger)
	{
		_patientRecordService = patientRecordService;
		_logger = logger;
	}
	// GET: api/patient-records/{patientId}
	[HttpGet("{patientId}")]
	[ProducesResponseType(typeof(PatientRecordDto), 200)]
	public async Task<IActionResult> GetPatientRecord(Guid patientId)
	{
		// Enforce authorization: Patients can only access their own record; clinicians/admins permitted
		var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (User.IsInRole("Patient"))
		{
			if (!Guid.TryParse(userIdClaim, out var userId) || userId != patientId)
			{
				return Forbid();
			}
		}
		else if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		// Get tenant ID
		var tenantId = GetTenantId();
		if (tenantId == Guid.Empty)
		{
			return BadRequest("Invalid tenant context");
		}
		
		// Get patient record from service
		var record = await _patientRecordService.GetPatientRecordAsync(tenantId, patientId);
		if (record == null)
		{
			return NotFound("Patient record not found");
		}
		
		// Convert to DTO
		var recordDto = new PatientRecordDto
		{
			Id = record.Id,
			PatientId = record.PatientId,
			MedicalRecordNumber = record.MedicalRecordNumber,
			Demographics = new DemographicsDto
			{
				FirstName = record.Demographics.FirstName,
				LastName = record.Demographics.LastName,
				DateOfBirth = record.Demographics.DateOfBirth,
				Gender = record.Demographics.Gender,
				Email = record.Demographics.Email,
				Phone = record.Demographics.Phone,
				Address = new AddressDto
				{
					Street = record.Demographics.Address?.Street ?? "",
					City = record.Demographics.Address?.City ?? "",
					State = record.Demographics.Address?.State ?? "",
					PostalCode = record.Demographics.Address?.PostalCode ?? "",
					Country = record.Demographics.Address?.Country ?? ""
				}
			},
			MedicalHistory = new MedicalHistoryDto
			{
				ChronicConditions = record.MedicalHistory.ChronicConditions.ToArray(),
				PastSurgeries = record.MedicalHistory.PastSurgeries.ToArray(),
				Allergies = record.MedicalHistory.Allergies.ToArray(),
				CurrentMedications = record.MedicalHistory.CurrentMedications.Select(m => new MedicationDto
				{
					Name = m.Name,
					Dosage = m.Dosage,
					Frequency = m.Frequency
				}).ToArray(),
				FamilyHistory = record.MedicalHistory.FamilyHistory.ToArray()
			},
			VitalSigns = record.VitalSigns.Select(v => new VitalSignDto
			{
				Id = v.Id,
				RecordedAt = v.RecordedAt,
				BloodPressure = v.BloodPressure,
				HeartRate = v.HeartRate,
				Temperature = v.Temperature,
				RespiratoryRate = v.RespiratoryRate,
				OxygenSaturation = v.OxygenSaturation,
				Weight = v.Weight,
				Height = v.Height,
				Bmi = v.Bmi
			}).ToArray(),
			RecentAppointments = record.RecentAppointments.Select(a => new AppointmentSummaryDto
			{
				Id = a.Id,
				Date = a.Date,
				Provider = a.Provider,
				Type = a.Type,
				Status = a.Status,
				Notes = a.Notes
			}).ToArray(),
			PromResults = record.PromResults.Select(p => new PromResultSummaryDto
			{
				Id = p.Id,
				Name = p.Name,
				CompletedAt = p.CompletedAt,
				Score = (decimal)p.Score,
				Severity = p.Severity
			}).ToArray(),
			Documents = record.Documents.Select(d => new DocumentDto
			{
				Id = d.Id,
				Name = d.Name,
				Type = d.Type,
				UploadedAt = d.UploadedAt,
				Size = d.Size
			}).ToArray()
		};
		
		return Ok(recordDto);
	}
	
	// PUT: api/patient-records/{patientId}/demographics
	[HttpPut("{patientId}/demographics")]
	[ProducesResponseType(204)]
	public async Task<IActionResult> UpdateDemographics(Guid patientId, [FromBody] DemographicsDto demographics)
	{
		// Authorization check
		var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (User.IsInRole("Patient"))
		{
			if (!Guid.TryParse(userIdClaim, out var userId) || userId != patientId)
			{
				return Forbid();
			}
		}
		else if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		// Validation
		if (demographics == null)
		{
			return BadRequest("Demographics data is required");
		}

		if (string.IsNullOrWhiteSpace(demographics.FirstName) || string.IsNullOrWhiteSpace(demographics.LastName))
		{
			return BadRequest("First name and last name are required");
		}

		// Get tenant ID
		var tenantId = GetTenantId();
		
		// Convert DTO to service model
		var demographicsModel = new PatientDemographics
		{
			FirstName = demographics.FirstName,
			LastName = demographics.LastName,
			DateOfBirth = demographics.DateOfBirth,
			Gender = demographics.Gender,
			Email = demographics.Email,
			Phone = demographics.Phone,
			Address = new Qivr.Services.PatientAddress
			{
				Street = demographics.Address?.Street ?? "",
				City = demographics.Address?.City ?? "",
				State = demographics.Address?.State ?? "",
				PostalCode = demographics.Address?.PostalCode ?? "",
				Country = demographics.Address?.Country ?? ""
			}
		};
		
		// Update demographics
		await _patientRecordService.UpdateDemographicsAsync(tenantId, patientId, demographicsModel);
		
		return NoContent();
	}
	
	// POST: api/patient-records/{patientId}/medical-history
	[HttpPost("{patientId}/medical-history")]
	[ProducesResponseType(typeof(MedicalHistoryDto), 201)]
	public async Task<IActionResult> AddMedicalHistory(Guid patientId, [FromBody] MedicalHistoryUpdateDto update)
	{
		// Authorization check
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid("Only clinicians and admins can update medical history");
		}

		// Validation
		if (update == null)
		{
			return BadRequest("Medical history data is required");
		}
		
		// Get tenant ID
		var tenantId = GetTenantId();
		
		// Convert DTO to service model
		var historyModel = new MedicalHistory
		{
			ChronicConditions = (update.ChronicConditions ?? Array.Empty<string>()).ToList(),
			PastSurgeries = (update.PastSurgeries ?? Array.Empty<string>()).ToList(),
			Allergies = (update.Allergies ?? Array.Empty<string>()).ToList(),
			CurrentMedications = (update.CurrentMedications ?? Array.Empty<MedicationDto>()).Select(m => new Qivr.Services.Medication
			{
				Name = m.Name,
				Dosage = m.Dosage,
				Frequency = m.Frequency
			}).ToList(),
			FamilyHistory = (update.FamilyHistory ?? Array.Empty<string>()).ToList()
		};
		
		// Add medical history
		await _patientRecordService.AddMedicalHistoryAsync(tenantId, patientId, historyModel);
		
		// Return the created history as DTO
		var history = new MedicalHistoryDto
		{
			ChronicConditions = historyModel.ChronicConditions.ToArray(),
			PastSurgeries = historyModel.PastSurgeries.ToArray(),
			Allergies = historyModel.Allergies.ToArray(),
			CurrentMedications = historyModel.CurrentMedications.Select(m => new MedicationDto
			{
				Name = m.Name,
				Dosage = m.Dosage,
				Frequency = m.Frequency
			}).ToArray(),
			FamilyHistory = historyModel.FamilyHistory.ToArray()
		};
		
		return CreatedAtAction(nameof(GetPatientRecord), new { patientId }, history);
	}
	
	// POST: api/patient-records/{patientId}/vital-signs
	[HttpPost("{patientId}/vital-signs")]
	[ProducesResponseType(typeof(VitalSignDto), 201)]
	public async Task<IActionResult> RecordVitalSigns(Guid patientId, [FromBody] VitalSignDto vitalSign)
	{
		// Authorization check - only clinicians and admins can record vital signs
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid("Only clinicians and admins can record vital signs");
		}

		// Validation
		if (vitalSign == null)
		{
			return BadRequest("Vital signs data is required");
		}
		
		// Get tenant ID and current user ID
		var tenantId = GetTenantId();
		var userId = GetUserId();
		
	// Convert DTO to service model
	var vitalSignModel = new Qivr.Services.VitalSign
	{
		BloodPressure = vitalSign.BloodPressure ?? "",
		HeartRate = vitalSign.HeartRate ?? 0,
		Temperature = vitalSign.Temperature ?? 0m,
		RespiratoryRate = vitalSign.RespiratoryRate ?? 0,
		OxygenSaturation = vitalSign.OxygenSaturation ?? 0,
		Weight = vitalSign.Weight ?? 0m,
		Height = vitalSign.Height ?? 0m,
		Notes = vitalSign.Notes,
		RecordedBy = userId
	};
		
		// Record vital signs
		var recorded = await _patientRecordService.RecordVitalSignsAsync(tenantId, patientId, vitalSignModel);
		
		// Convert back to DTO
		vitalSign.Id = recorded.Id;
		vitalSign.RecordedAt = recorded.RecordedAt;
		vitalSign.Bmi = recorded.Bmi;
		
		return CreatedAtAction(nameof(GetVitalSigns), new { patientId }, vitalSign);
	}
	
	// GET: api/patient-records/{patientId}/vital-signs
	[HttpGet("{patientId}/vital-signs")]
	[ProducesResponseType(typeof(IEnumerable<VitalSignDto>), 200)]
	public async Task<IActionResult> GetVitalSigns(Guid patientId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
	{
		// Authorization check
		var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (User.IsInRole("Patient"))
		{
			if (!Guid.TryParse(userIdClaim, out var userId) || userId != patientId)
			{
				return Forbid();
			}
		}
		else if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		// Get tenant ID
		var tenantId = GetTenantId();
		
		// Get vital signs from service
		var vitalSignsList = await _patientRecordService.GetVitalSignsAsync(tenantId, patientId, from, to);
		
		// Convert to DTOs
		var vitalSigns = vitalSignsList.Select(v => new VitalSignDto
		{
			Id = v.Id,
			RecordedAt = v.RecordedAt,
			BloodPressure = v.BloodPressure,
			HeartRate = v.HeartRate,
			Temperature = v.Temperature,
			RespiratoryRate = v.RespiratoryRate,
			OxygenSaturation = v.OxygenSaturation,
			Weight = v.Weight,
			Height = v.Height,
			Bmi = v.Bmi,
			Notes = v.Notes
		}).ToArray();
		
		return Ok(vitalSigns);
	}
	
	// NOTE: Document upload/download functionality has been moved to DocumentsController
	// which provides full integration with S3/Local storage and proper security.
	// Use the following endpoints instead:
	// - POST /api/documents/patient/{patientId} - Upload document for patient
	// - GET /api/documents/{documentId} - Get document details
	// - GET /api/documents/{documentId}/download - Download document
	// - GET /api/documents/patient/{patientId} - List patient documents
	
	// This endpoint is kept for backward compatibility but redirects to the new controller
	[HttpPost("{patientId}/documents")]
	[ProducesResponseType(typeof(DocumentDto), 201)]
	[Obsolete("Use POST /api/documents/patient/{patientId} instead")]
	public IActionResult UploadDocument(Guid patientId, [FromForm] IFormFile file, [FromForm] string type)
	{
		// Redirect to new endpoint
		return StatusCode(308, new { 
			message = "This endpoint has been moved. Please use POST /api/documents/patient/{patientId} instead.",
			newEndpoint = $"/api/documents/patient/{patientId}"
		});
	}
	
	// This endpoint is kept for backward compatibility but redirects to the new controller
	[HttpGet("{patientId}/documents/{documentId}")]
	[ProducesResponseType(typeof(FileContentResult), 200)]
	[Obsolete("Use GET /api/documents/{documentId}/download instead")]
	public IActionResult GetDocument(Guid patientId, Guid documentId)
	{
		// Redirect to new endpoint
		return StatusCode(308, new { 
			message = "This endpoint has been moved. Please use GET /api/documents/{documentId}/download instead.",
			newEndpoint = $"/api/documents/{documentId}/download"
		});
	}
	
	// GET: api/patient-records/{patientId}/timeline
	[HttpGet("{patientId}/timeline")]
	[ProducesResponseType(typeof(IEnumerable<TimelineEventDto>), 200)]
	public async Task<IActionResult> GetPatientTimeline(Guid patientId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
	{
		// Authorization check
		var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (User.IsInRole("Patient"))
		{
			if (!Guid.TryParse(userIdClaim, out var userId) || userId != patientId)
			{
				return Forbid();
			}
		}
		else if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		// Validate pagination
		if (page < 1) page = 1;
		if (pageSize < 1) pageSize = 20;
		if (pageSize > 100) pageSize = 100;
		
		// Get tenant ID
		var tenantId = GetTenantId();
		
		// Calculate skip and take
		var skip = (page - 1) * pageSize;
		
		// Get timeline events from service
		var events = await _patientRecordService.GetPatientTimelineAsync(tenantId, patientId, skip, pageSize);
		
		// Convert to DTOs
		var eventDtos = events.Select(e => new TimelineEventDto
		{
			Id = e.Id,
			Type = e.Type,
			Title = e.Title,
			Description = e.Description,
			OccurredAt = e.OccurredAt,
			Icon = e.Icon
		}).ToArray();
		
		return Ok(new
		{
			items = eventDtos,
			page,
			pageSize,
			totalItems = eventDtos.Length,
			totalPages = (int)Math.Ceiling((double)eventDtos.Length / pageSize)
		});
	}
	
	// GET: api/patient-records/{patientId}/summary
	[HttpGet("{patientId}/summary")]
	[ProducesResponseType(typeof(PatientSummaryDto), 200)]
	public async Task<IActionResult> GetPatientSummary(Guid patientId)
	{
		// Authorization check
		var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (User.IsInRole("Patient"))
		{
			if (!Guid.TryParse(userIdClaim, out var userId) || userId != patientId)
			{
				return Forbid();
			}
		}
		else if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		// Get tenant ID
		var tenantId = GetTenantId();
		
		// Get summary from service
		var summaryData = await _patientRecordService.GetPatientSummaryAsync(tenantId, patientId);
		
		// Convert to DTO
		var summary = new PatientSummaryDto
		{
			PatientId = summaryData.PatientId,
			Name = summaryData.Name,
			Age = summaryData.Age,
			MedicalRecordNumber = summaryData.MedicalRecordNumber,
			LastVisit = summaryData.LastVisit,
			NextAppointment = summaryData.NextAppointment,
			ActiveConditions = summaryData.ActiveConditions,
			ActiveMedications = summaryData.ActiveMedications,
			RecentPromScore = summaryData.RecentPromScore.HasValue ? (decimal)summaryData.RecentPromScore.Value : null,
			RiskLevel = summaryData.RiskLevel,
			ComplianceRate = summaryData.ComplianceRate
		};
		
		return Ok(summary);
	}
	
	// Helper method to get tenant ID from claims
	private Guid GetTenantId()
	{
		var tenantClaim = User.FindFirst("tenant_id")?.Value;
		if (Guid.TryParse(tenantClaim, out var tenantId))
		{
			return tenantId;
		}
		return Guid.Empty;
	}
	
	// Helper method to get user ID from claims
	private Guid GetUserId()
	{
		var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (Guid.TryParse(userIdClaim, out var userId))
		{
			return userId;
		}
		return Guid.Empty;
	}
}

// DTOs
public class PatientRecordDto
{
	public Guid Id { get; set; }
	public Guid PatientId { get; set; }
	public string MedicalRecordNumber { get; set; } = string.Empty;
	public DemographicsDto Demographics { get; set; } = new();
	public MedicalHistoryDto MedicalHistory { get; set; } = new();
	public VitalSignDto[] VitalSigns { get; set; } = Array.Empty<VitalSignDto>();
	public AppointmentSummaryDto[] RecentAppointments { get; set; } = Array.Empty<AppointmentSummaryDto>();
	public PromResultSummaryDto[] PromResults { get; set; } = Array.Empty<PromResultSummaryDto>();
	public DocumentDto[] Documents { get; set; } = Array.Empty<DocumentDto>();
}

public class DemographicsDto
{
	public string FirstName { get; set; } = string.Empty;
	public string LastName { get; set; } = string.Empty;
	public DateTime DateOfBirth { get; set; }
	public string Gender { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string Phone { get; set; } = string.Empty;
	public AddressDto Address { get; set; } = new();
}

// AddressDto is now in SharedDtos

public class MedicalHistoryDto
{
	public string[] ChronicConditions { get; set; } = Array.Empty<string>();
	public string[] PastSurgeries { get; set; } = Array.Empty<string>();
	public string[] Allergies { get; set; } = Array.Empty<string>();
	public MedicationDto[] CurrentMedications { get; set; } = Array.Empty<MedicationDto>();
	public string[] FamilyHistory { get; set; } = Array.Empty<string>();
}

public class MedicalHistoryUpdateDto
{
	public string[]? ChronicConditions { get; set; }
	public string[]? PastSurgeries { get; set; }
	public string[]? Allergies { get; set; }
	public MedicationDto[]? CurrentMedications { get; set; }
	public string[]? FamilyHistory { get; set; }
}

// MedicationDto is now in SharedDtos

// VitalSignDto is now in SharedDtos

// AppointmentSummaryDto is now in SharedDtos

public class PromResultSummaryDto
{
	public Guid Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public DateTime CompletedAt { get; set; }
	public decimal Score { get; set; }
	public string Severity { get; set; } = string.Empty;
}

public class DocumentDto
{
	public Guid Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string Type { get; set; } = string.Empty;
	public DateTime UploadedAt { get; set; }
	public string Size { get; set; } = string.Empty;
}

public class TimelineEventDto
{
	public Guid Id { get; set; }
	public string Type { get; set; } = string.Empty;
	public string Title { get; set; } = string.Empty;
	public string Description { get; set; } = string.Empty;
	public DateTime OccurredAt { get; set; }
	public string Icon { get; set; } = string.Empty;
}

public class PatientSummaryDto
{
	public Guid PatientId { get; set; }
	public string Name { get; set; } = string.Empty;
	public int Age { get; set; }
	public string MedicalRecordNumber { get; set; } = string.Empty;
	public DateTime? LastVisit { get; set; }
	public DateTime? NextAppointment { get; set; }
	public int ActiveConditions { get; set; }
	public int ActiveMedications { get; set; }
	public decimal? RecentPromScore { get; set; }
	public string RiskLevel { get; set; } = string.Empty;
	public decimal ComplianceRate { get; set; }
}
