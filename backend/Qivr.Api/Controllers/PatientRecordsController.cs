using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.Entities;
using Qivr.Core.DTOs;
using System.Linq;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class PatientRecordsController : ControllerBase
{
	// Mock patient data storage (in production, this would come from database)
	private static readonly List<PatientDto> _mockPatients = new()
	{
		new PatientDto
		{
			Id = "1",
			FirstName = "Sarah",
			LastName = "Johnson",
			Email = "sarah.johnson@email.com",
			Phone = "+61 432 123 456",
			DateOfBirth = "1985-03-15",
			Gender = "Female",
			Address = new AddressDto
			{
				Street = "123 Collins St",
				City = "Melbourne",
				State = "VIC",
				PostalCode = "3000"
			},
			MedicalRecordNumber = "MRN001234",
			Status = "active",
			RegisteredDate = "2023-06-15",
			InsuranceProvider = "Medibank Private",
			CreatedAt = "2023-06-15T10:00:00Z"
		},
		new PatientDto
		{
			Id = "2",
			FirstName = "Michael",
			LastName = "Thompson",
			Email = "michael.t@email.com",
			Phone = "+61 412 987 654",
			DateOfBirth = "1972-11-22",
			Gender = "Male",
			Address = new AddressDto
			{
				Street = "456 George St",
				City = "Sydney",
				State = "NSW",
				PostalCode = "2000"
			},
			MedicalRecordNumber = "MRN001235",
			Status = "active",
			RegisteredDate = "2023-09-20",
			InsuranceProvider = "BUPA",
			CreatedAt = "2023-09-20T10:00:00Z"
		},
		new PatientDto
		{
			Id = "3",
			FirstName = "Lisa",
			LastName = "Chen",
			Email = "lisa.chen@email.com",
			Phone = "+61 423 456 789",
			DateOfBirth = "1990-07-08",
			Gender = "Female",
			Address = new AddressDto
			{
				Street = "789 Queen St",
				City = "Brisbane",
				State = "QLD",
				PostalCode = "4000"
			},
			MedicalRecordNumber = "MRN001236",
			Status = "active",
			RegisteredDate = "2023-11-10",
			InsuranceProvider = "HCF",
			CreatedAt = "2023-11-10T10:00:00Z"
		}
	};
	
	// GET: api/v1/patients - List all patients with filters
	[HttpGet("v1/patients")]
	[ProducesResponseType(typeof(PatientListResponseDto), 200)]
	public IActionResult GetPatients(
		[FromQuery] string? search,
		[FromQuery] string? status,
		[FromQuery] string? provider,
		[FromQuery] string? condition,
		[FromQuery] int page = 1,
		[FromQuery] int pageSize = 10)
	{
		// Only allow clinicians and admins to list all patients
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		var query = _mockPatients.AsQueryable();

		// Apply search filter
		if (!string.IsNullOrEmpty(search))
		{
			var searchLower = search.ToLower();
			query = query.Where(p => 
				p.FirstName.ToLower().Contains(searchLower) ||
				p.LastName.ToLower().Contains(searchLower) ||
				p.Email.ToLower().Contains(searchLower));
		}

		// Apply status filter
		if (!string.IsNullOrEmpty(status))
		{
			query = query.Where(p => p.Status == status);
		}

		var total = query.Count();
		var patients = query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.ToList();

		return Ok(new PatientListResponseDto
		{
			Data = patients,
			Total = total,
			Page = page,
			PageSize = pageSize
		});
	}

	// GET: api/v1/patients/{id} - Get specific patient
	[HttpGet("v1/patients/{id}")]
	[ProducesResponseType(typeof(PatientDto), 200)]
	public IActionResult GetPatientById(string id)
	{
		var patient = _mockPatients.FirstOrDefault(p => p.Id == id);
		if (patient == null)
		{
			return NotFound(new { error = "Patient not found" });
		}

		// Check authorization
		var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (User.IsInRole("Patient"))
		{
			// Patients can only access their own record
			if (id != userIdClaim)
			{
				return Forbid();
			}
		}
		else if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		return Ok(patient);
	}

	// POST: api/v1/patients - Create new patient
	[HttpPost("v1/patients")]
	[ProducesResponseType(typeof(PatientDto), 201)]
	public IActionResult CreatePatient([FromBody] CreatePatientDto dto)
	{
		// Only allow clinicians and admins to create patients
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		// Check if email already exists
		if (_mockPatients.Any(p => p.Email == dto.Email))
		{
			return BadRequest(new { error = "A patient with this email already exists" });
		}

		var patient = new PatientDto
		{
			Id = Guid.NewGuid().ToString(),
			FirstName = dto.FirstName,
			LastName = dto.LastName,
			Email = dto.Email,
			Phone = dto.Phone,
			DateOfBirth = dto.DateOfBirth,
			Gender = dto.Gender,
			Address = dto.Address,
			MedicalRecordNumber = $"MRN{DateTime.Now.Ticks}",
			Status = "active",
			RegisteredDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
			InsuranceProvider = dto.InsuranceProvider,
			MedicareNumber = dto.MedicareNumber,
			CreatedAt = DateTime.UtcNow.ToString("o")
		};

		_mockPatients.Add(patient);

		return CreatedAtAction(nameof(GetPatientById), new { id = patient.Id }, patient);
	}

	// PUT: api/v1/patients/{id} - Update patient
	[HttpPut("v1/patients/{id}")]
	[HttpPatch("v1/patients/{id}")]
	[ProducesResponseType(typeof(PatientDto), 200)]
	public IActionResult UpdatePatient(string id, [FromBody] UpdatePatientDto dto)
	{
		// Only allow clinicians and admins to update patients
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		var patient = _mockPatients.FirstOrDefault(p => p.Id == id);
		if (patient == null)
		{
			return NotFound(new { error = "Patient not found" });
		}

		// Update fields if provided
		if (!string.IsNullOrEmpty(dto.FirstName))
			patient.FirstName = dto.FirstName;
		if (!string.IsNullOrEmpty(dto.LastName))
			patient.LastName = dto.LastName;
		if (!string.IsNullOrEmpty(dto.Phone))
			patient.Phone = dto.Phone;
		if (!string.IsNullOrEmpty(dto.DateOfBirth))
			patient.DateOfBirth = dto.DateOfBirth;
		if (!string.IsNullOrEmpty(dto.Gender))
			patient.Gender = dto.Gender;
		if (dto.Address != null)
			patient.Address = dto.Address;
		if (!string.IsNullOrEmpty(dto.Status))
			patient.Status = dto.Status;
		if (!string.IsNullOrEmpty(dto.InsuranceProvider))
			patient.InsuranceProvider = dto.InsuranceProvider;

		patient.UpdatedAt = DateTime.UtcNow.ToString("o");

		return Ok(patient);
	}

	// DELETE: api/v1/patients/{id} - Delete patient (soft delete)
	[HttpDelete("v1/patients/{id}")]
	[ProducesResponseType(204)]
	public IActionResult DeletePatient(string id)
	{
		// Only allow admins to delete patients
		if (!User.IsInRole("Admin"))
		{
			return Forbid();
		}

		var patient = _mockPatients.FirstOrDefault(p => p.Id == id);
		if (patient == null)
		{
			return NotFound(new { error = "Patient not found" });
		}

		// Soft delete - mark as inactive
		patient.Status = "inactive";
		patient.UpdatedAt = DateTime.UtcNow.ToString("o");

		return Ok(new { success = true, message = "Patient deleted successfully" });
	}

	// GET: api/v1/patients/export - Export patients data
	[HttpGet("v1/patients/export")]
	public IActionResult ExportPatients(
		[FromQuery] string format = "csv",
		[FromQuery] string? search = null,
		[FromQuery] string? status = null)
	{
		// Only allow clinicians and admins
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}

		var query = _mockPatients.AsQueryable();

		if (!string.IsNullOrEmpty(search))
		{
			var searchLower = search.ToLower();
			query = query.Where(p => 
				p.FirstName.ToLower().Contains(searchLower) ||
				p.LastName.ToLower().Contains(searchLower) ||
				p.Email.ToLower().Contains(searchLower));
		}

		if (!string.IsNullOrEmpty(status))
		{
			query = query.Where(p => p.Status == status);
		}

		var patients = query.ToList();

		if (format.ToLower() == "csv")
		{
			var csv = "ID,First Name,Last Name,Email,Phone,Date of Birth,Gender,Status,Registered Date\n";
			foreach (var patient in patients)
			{
				csv += $"{patient.Id},\"{patient.FirstName}\",\"{patient.LastName}\",\"{patient.Email}\",\"{patient.Phone}\",";
				csv += $"\"{patient.DateOfBirth}\",\"{patient.Gender}\",{patient.Status},{patient.RegisteredDate}\n";
			}

			return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"patients_{DateTime.Now:yyyyMMdd}.csv");
		}

		return BadRequest(new { error = "Unsupported export format" });
	}
	// GET: api/patient-records/{patientId}
	[HttpGet("patient-records/{patientId}")]
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
		
		var record = new PatientRecordDto
		{
			Id = Guid.NewGuid(),
			PatientId = patientId,
			MedicalRecordNumber = "MRN-2024-0001",
			Demographics = new DemographicsDto
			{
				FirstName = "John",
				LastName = "Doe",
				DateOfBirth = new DateTime(1985, 3, 15),
				Gender = "Male",
				Email = "john.doe@example.com",
				Phone = "+1-555-0123",
				Address = new AddressDto
				{
					Street = "123 Main St",
					City = "Springfield",
					State = "IL",
					PostalCode = "62701",
					Country = "USA"
				}
			},
			MedicalHistory = new MedicalHistoryDto
			{
				ChronicConditions = new[] { "Diabetes Type 2", "Hypertension" },
				PastSurgeries = new[] { "Appendectomy (2010)" },
				Allergies = new[] { "Penicillin", "Peanuts" },
				CurrentMedications = new[]
				{
					new MedicationDto { Name = "Metformin", Dosage = "500mg", Frequency = "Twice daily" },
					new MedicationDto { Name = "Lisinopril", Dosage = "10mg", Frequency = "Once daily" }
				},
				FamilyHistory = new[] { "Father: Heart Disease", "Mother: Diabetes" }
			},
			VitalSigns = new[]
			{
				new VitalSignDto
				{
					RecordedAt = DateTime.UtcNow.AddDays(-7),
					BloodPressure = "120/80",
					HeartRate = 72,
					Temperature = 98.6m,
					Weight = 180,
					Height = 70,
					Bmi = 25.8m,
					OxygenSaturation = 98
				}
			},
			RecentAppointments = new[]
			{
				new AppointmentSummaryDto
				{
					Id = Guid.NewGuid(),
					Date = DateTime.UtcNow.AddDays(-30),
					Provider = "Dr. Smith",
					Type = "Follow-up",
					Status = "Completed",
					Notes = "Routine diabetes check-up"
				}
			},
			PromResults = new[]
			{
				new PromResultSummaryDto
				{
					Id = Guid.NewGuid(),
					Name = "PHQ-9",
					CompletedAt = DateTime.UtcNow.AddDays(-14),
					Score = 8,
					Severity = "Mild"
				}
			},
			Documents = new[]
			{
				new DocumentDto
				{
					Id = Guid.NewGuid(),
					Name = "Lab Results - 2024-01",
					Type = "Laboratory",
					UploadedAt = DateTime.UtcNow.AddDays(-10),
					Size = "245 KB"
				}
			}
		};
		
		return Ok(record);
	}
	
	// PUT: api/patient-records/{patientId}/demographics
	[HttpPut("patient-records/{patientId}/demographics")]
	[ProducesResponseType(204)]
	public async Task<IActionResult> UpdateDemographics(Guid patientId, [FromBody] DemographicsDto demographics)
	{
		// TODO: Implement demographics update logic
		// TODO: Add validation and authorization
		
		return NoContent();
	}
	
	// POST: api/patient-records/{patientId}/medical-history
	[HttpPost("patient-records/{patientId}/medical-history")]
	[ProducesResponseType(typeof(MedicalHistoryDto), 201)]
	public async Task<IActionResult> AddMedicalHistory(Guid patientId, [FromBody] MedicalHistoryUpdateDto update)
	{
		// TODO: Implement medical history addition logic
		
		var history = new MedicalHistoryDto
		{
			ChronicConditions = update.ChronicConditions ?? Array.Empty<string>(),
			PastSurgeries = update.PastSurgeries ?? Array.Empty<string>(),
			Allergies = update.Allergies ?? Array.Empty<string>(),
			CurrentMedications = update.CurrentMedications ?? Array.Empty<MedicationDto>(),
			FamilyHistory = update.FamilyHistory ?? Array.Empty<string>()
		};
		
		return CreatedAtAction(nameof(GetPatientRecord), new { patientId }, history);
	}
	
	// POST: api/patient-records/{patientId}/vital-signs
	[HttpPost("patient-records/{patientId}/vital-signs")]
	[ProducesResponseType(typeof(VitalSignDto), 201)]
	public async Task<IActionResult> RecordVitalSigns(Guid patientId, [FromBody] VitalSignDto vitalSign)
	{
		// TODO: Implement vital signs recording logic
		
		vitalSign.Id = Guid.NewGuid();
		vitalSign.RecordedAt = DateTime.UtcNow;
		
		return CreatedAtAction(nameof(GetVitalSigns), new { patientId }, vitalSign);
	}
	
	// GET: api/patient-records/{patientId}/vital-signs
	[HttpGet("patient-records/{patientId}/vital-signs")]
	[ProducesResponseType(typeof(IEnumerable<VitalSignDto>), 200)]
	public async Task<IActionResult> GetVitalSigns(Guid patientId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
	{
		// TODO: Implement vital signs retrieval with date filtering
		
		var vitalSigns = new[]
		{
			new VitalSignDto
			{
				Id = Guid.NewGuid(),
				RecordedAt = DateTime.UtcNow.AddDays(-7),
				BloodPressure = "120/80",
				HeartRate = 72,
				Temperature = 98.6m,
				Weight = 180,
				Height = 70,
				Bmi = 25.8m,
				OxygenSaturation = 98
			}
		};
		
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
	[HttpPost("patient-records/{patientId}/documents")]
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
	[HttpGet("patient-records/{patientId}/documents/{documentId}")]
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
	[HttpGet("patient-records/{patientId}/timeline")]
	[ProducesResponseType(typeof(IEnumerable<TimelineEventDto>), 200)]
	public async Task<IActionResult> GetPatientTimeline(Guid patientId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
	{
		// TODO: Implement timeline retrieval with pagination
		
		var events = new[]
		{
			new TimelineEventDto
			{
				Id = Guid.NewGuid(),
				Type = "appointment",
				Title = "Follow-up with Dr. Smith",
				Description = "Routine diabetes check-up",
				OccurredAt = DateTime.UtcNow.AddDays(-30),
				Icon = "calendar"
			},
			new TimelineEventDto
			{
				Id = Guid.NewGuid(),
				Type = "prom",
				Title = "PHQ-9 Completed",
				Description = "Score: 8 (Mild)",
				OccurredAt = DateTime.UtcNow.AddDays(-14),
				Icon = "clipboard"
			},
			new TimelineEventDto
			{
				Id = Guid.NewGuid(),
				Type = "vital_signs",
				Title = "Vital Signs Recorded",
				Description = "BP: 120/80, HR: 72",
				OccurredAt = DateTime.UtcNow.AddDays(-7),
				Icon = "heart"
			}
		};
		
		return Ok(new
		{
			items = events,
			page,
			pageSize,
			totalItems = events.Length,
			totalPages = 1
		});
	}
	
	// GET: api/patient-records/{patientId}/summary
	[HttpGet("patient-records/{patientId}/summary")]
	[ProducesResponseType(typeof(PatientSummaryDto), 200)]
	public async Task<IActionResult> GetPatientSummary(Guid patientId)
	{
		// TODO: Implement patient summary generation
		
		var summary = new PatientSummaryDto
		{
			PatientId = patientId,
			Name = "John Doe",
			Age = 39,
			MedicalRecordNumber = "MRN-2024-0001",
			LastVisit = DateTime.UtcNow.AddDays(-30),
			NextAppointment = DateTime.UtcNow.AddDays(14),
			ActiveConditions = 2,
			ActiveMedications = 2,
			RecentPromScore = 8,
			RiskLevel = "Low",
			ComplianceRate = 92.5m
		};
		
		return Ok(summary);
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
