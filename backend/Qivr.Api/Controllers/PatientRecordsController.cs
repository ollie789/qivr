using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.Entities;
using Qivr.Core.DTOs;
using Qivr.Api.DTOs;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class PatientRecordsController : ControllerBase
{
    private readonly ILogger<PatientRecordsController> _logger;
    private readonly QivrDbContext _dbContext;
    
    public PatientRecordsController(
        ILogger<PatientRecordsController> logger,
        QivrDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }
	
	// GET: api/v1/patients - List all patients with filters
	[HttpGet("v1/patients")]
	[ProducesResponseType(typeof(PatientListResponseDto), 200)]
	public async Task<IActionResult> GetPatients(
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
		
		try
		{
			// Get tenant ID from claims
			var tenantId = User.FindFirst("custom:tenant_id")?.Value ?? 
			              User.FindFirst("tenant_id")?.Value;
			
			// Build base query
			var query = _dbContext.Users
				.Where(u => u.UserType == "Patient");
			
			// Add tenant filter if available
			if (!string.IsNullOrEmpty(tenantId) && Guid.TryParse(tenantId, out var tenantGuid))
			{
				query = query.Where(u => u.TenantId == tenantGuid);
			}

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

			var total = await query.CountAsync();
			var users = await query
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();
			
			// Convert to PatientDto
			var patients = users.Select(u => new PatientDto
			{
				Id = u.Id.ToString(),
				FirstName = u.FirstName,
				LastName = u.LastName,
				Email = u.Email,
				Phone = u.Phone,
				DateOfBirth = u.DateOfBirth?.ToString("yyyy-MM-dd"),
				Gender = u.Gender,
				Address = new AddressDto
				{
					Street = u.Address,
					City = u.City,
					State = u.State,
					PostalCode = u.Postcode
				},
				MedicalRecordNumber = u.MedicalRecordNumber,
				Status = u.Status ?? "active",
				RegisteredDate = u.CreatedAt.ToString("yyyy-MM-dd"),
				InsuranceProvider = u.InsuranceProvider,
				MedicareNumber = u.MedicareNumber,
				CreatedAt = u.CreatedAt.ToString("o")
			}).ToList();

			return Ok(new PatientListResponseDto
			{
				Data = patients,
				Total = total,
				Page = page,
				PageSize = pageSize
			});
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error fetching patients");
			return StatusCode(500, new { error = "An error occurred while fetching patients" });
		}
	}

	// GET: api/v1/patients/{id} - Get specific patient
	[HttpGet("v1/patients/{id}")]
	[ProducesResponseType(typeof(PatientDto), 200)]
	public async Task<IActionResult> GetPatientById(string id)
	{
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
		
		try
		{
			if (!Guid.TryParse(id, out var patientGuid))
			{
				return BadRequest(new { error = "Invalid patient ID format" });
			}
			
			// Get tenant ID from claims
			var tenantId = User.FindFirst("custom:tenant_id")?.Value ?? 
			              User.FindFirst("tenant_id")?.Value;
			
			var query = _dbContext.Users.Where(u => u.Id == patientGuid && u.UserType == "Patient");
			
			// Add tenant filter if available
			if (!string.IsNullOrEmpty(tenantId) && Guid.TryParse(tenantId, out var tenantGuid))
			{
				query = query.Where(u => u.TenantId == tenantGuid);
			}
			
			var user = await query.FirstOrDefaultAsync();
			
			if (user == null)
			{
				return NotFound(new { error = "Patient not found" });
			}
			
			// Convert to PatientDto
			var patient = new PatientDto
			{
				Id = user.Id.ToString(),
				FirstName = user.FirstName,
				LastName = user.LastName,
				Email = user.Email,
				Phone = user.Phone,
				DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
				Gender = user.Gender,
				Address = new AddressDto
				{
					Street = user.Address,
					City = user.City,
					State = user.State,
					PostalCode = user.Postcode
				},
				MedicalRecordNumber = user.MedicalRecordNumber,
				Status = user.Status ?? "active",
				RegisteredDate = user.CreatedAt.ToString("yyyy-MM-dd"),
				InsuranceProvider = user.InsuranceProvider,
				MedicareNumber = user.MedicareNumber,
				CreatedAt = user.CreatedAt.ToString("o")
			};

			return Ok(patient);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error fetching patient {PatientId}", id);
			return StatusCode(500, new { error = "An error occurred while fetching the patient" });
		}
	}

	// POST: api/v1/patients - Create new patient
	[HttpPost("v1/patients")]
	[ProducesResponseType(typeof(PatientDto), 201)]
	public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto dto)
	{
		// Only allow clinicians and admins to create patients
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		try
		{
			// Check if email already exists
			var existingUser = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.Email == dto.Email);
			
			if (existingUser != null)
			{
				return BadRequest(new { error = "A patient with this email already exists" });
			}
			
			// Get tenant ID from claims
			var tenantId = User.FindFirst("custom:tenant_id")?.Value ?? 
			              User.FindFirst("tenant_id")?.Value;
			
			var user = new User
			{
				Id = Guid.NewGuid(),
				TenantId = !string.IsNullOrEmpty(tenantId) ? Guid.Parse(tenantId) : (Guid?)null,
				FirstName = dto.FirstName,
				LastName = dto.LastName,
				Email = dto.Email,
				Phone = dto.Phone,
				DateOfBirth = !string.IsNullOrEmpty(dto.DateOfBirth) ? DateTime.Parse(dto.DateOfBirth) : (DateTime?)null,
				Gender = dto.Gender,
				Address = dto.Address?.Street,
				City = dto.Address?.City,
				State = dto.Address?.State,
				Postcode = dto.Address?.PostalCode,
				MedicalRecordNumber = $"MRN{DateTime.Now.Ticks}",
				Status = "active",
				UserType = "Patient",
				InsuranceProvider = dto.InsuranceProvider,
				MedicareNumber = dto.MedicareNumber,
				CreatedAt = DateTime.UtcNow,
				UpdatedAt = DateTime.UtcNow
			};
			
			_dbContext.Users.Add(user);
			await _dbContext.SaveChangesAsync();
			
			// Convert to PatientDto
			var patient = new PatientDto
			{
				Id = user.Id.ToString(),
				FirstName = user.FirstName,
				LastName = user.LastName,
				Email = user.Email,
				Phone = user.Phone,
				DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
				Gender = user.Gender,
				Address = dto.Address,
				MedicalRecordNumber = user.MedicalRecordNumber,
				Status = user.Status,
				RegisteredDate = user.CreatedAt.ToString("yyyy-MM-dd"),
				InsuranceProvider = user.InsuranceProvider,
				MedicareNumber = user.MedicareNumber,
				CreatedAt = user.CreatedAt.ToString("o")
			};

			return CreatedAtAction(nameof(GetPatientById), new { id = patient.Id }, patient);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error creating patient");
			return StatusCode(500, new { error = "An error occurred while creating the patient" });
		}
	}

	// PUT: api/v1/patients/{id} - Update patient
	[HttpPut("v1/patients/{id}")]
	[HttpPatch("v1/patients/{id}")]
	[ProducesResponseType(typeof(PatientDto), 200)]
	public async Task<IActionResult> UpdatePatient(string id, [FromBody] UpdatePatientDto dto)
	{
		// Only allow clinicians and admins to update patients
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		try
		{
			if (!Guid.TryParse(id, out var patientGuid))
			{
				return BadRequest(new { error = "Invalid patient ID format" });
			}
			
			// Get tenant ID from claims
			var tenantId = User.FindFirst("custom:tenant_id")?.Value ?? 
			              User.FindFirst("tenant_id")?.Value;
			
			var query = _dbContext.Users.Where(u => u.Id == patientGuid && u.UserType == "Patient");
			
			// Add tenant filter if available
			if (!string.IsNullOrEmpty(tenantId) && Guid.TryParse(tenantId, out var tenantGuid))
			{
				query = query.Where(u => u.TenantId == tenantGuid);
			}
			
			var user = await query.FirstOrDefaultAsync();
			
			if (user == null)
			{
				return NotFound(new { error = "Patient not found" });
			}

			// Update fields if provided
			if (!string.IsNullOrEmpty(dto.FirstName))
				user.FirstName = dto.FirstName;
			if (!string.IsNullOrEmpty(dto.LastName))
				user.LastName = dto.LastName;
			if (!string.IsNullOrEmpty(dto.Phone))
				user.Phone = dto.Phone;
			if (!string.IsNullOrEmpty(dto.DateOfBirth))
				user.DateOfBirth = DateTime.Parse(dto.DateOfBirth);
			if (!string.IsNullOrEmpty(dto.Gender))
				user.Gender = dto.Gender;
			if (dto.Address != null)
			{
				user.Address = dto.Address.Street;
				user.City = dto.Address.City;
				user.State = dto.Address.State;
				user.Postcode = dto.Address.PostalCode;
			}
			if (!string.IsNullOrEmpty(dto.Status))
				user.Status = dto.Status;
			if (!string.IsNullOrEmpty(dto.InsuranceProvider))
				user.InsuranceProvider = dto.InsuranceProvider;

			user.UpdatedAt = DateTime.UtcNow;
			
			await _dbContext.SaveChangesAsync();
			
			// Convert to PatientDto
			var patient = new PatientDto
			{
				Id = user.Id.ToString(),
				FirstName = user.FirstName,
				LastName = user.LastName,
				Email = user.Email,
				Phone = user.Phone,
				DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
				Gender = user.Gender,
				Address = new AddressDto
				{
					Street = user.Address,
					City = user.City,
					State = user.State,
					PostalCode = user.Postcode
				},
				MedicalRecordNumber = user.MedicalRecordNumber,
				Status = user.Status ?? "active",
				RegisteredDate = user.CreatedAt.ToString("yyyy-MM-dd"),
				InsuranceProvider = user.InsuranceProvider,
				MedicareNumber = user.MedicareNumber,
				CreatedAt = user.CreatedAt.ToString("o"),
				UpdatedAt = user.UpdatedAt.ToString("o")
			};

			return Ok(patient);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating patient {PatientId}", id);
			return StatusCode(500, new { error = "An error occurred while updating the patient" });
		}
	}

	// DELETE: api/v1/patients/{id} - Delete patient (soft delete)
	[HttpDelete("v1/patients/{id}")]
	[ProducesResponseType(204)]
	public async Task<IActionResult> DeletePatient(string id)
	{
		// Only allow admins to delete patients
		if (!User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		try
		{
			if (!Guid.TryParse(id, out var patientGuid))
			{
				return BadRequest(new { error = "Invalid patient ID format" });
			}
			
			// Get tenant ID from claims
			var tenantId = User.FindFirst("custom:tenant_id")?.Value ?? 
			              User.FindFirst("tenant_id")?.Value;
			
			var query = _dbContext.Users.Where(u => u.Id == patientGuid && u.UserType == "Patient");
			
			// Add tenant filter if available
			if (!string.IsNullOrEmpty(tenantId) && Guid.TryParse(tenantId, out var tenantGuid))
			{
				query = query.Where(u => u.TenantId == tenantGuid);
			}
			
			var user = await query.FirstOrDefaultAsync();
			
			if (user == null)
			{
				return NotFound(new { error = "Patient not found" });
			}

			// Soft delete - mark as inactive
			user.Status = "inactive";
			user.UpdatedAt = DateTime.UtcNow;
			
			await _dbContext.SaveChangesAsync();

			return Ok(new { success = true, message = "Patient deleted successfully" });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting patient {PatientId}", id);
			return StatusCode(500, new { error = "An error occurred while deleting the patient" });
		}
	}

	// GET: api/v1/patients/export - Export patients data
	[HttpGet("v1/patients/export")]
	public async Task<IActionResult> ExportPatients(
		[FromQuery] string format = "csv",
		[FromQuery] string? search = null,
		[FromQuery] string? status = null)
	{
		// Only allow clinicians and admins
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		try
		{
			// Get tenant ID from claims
			var tenantId = User.FindFirst("custom:tenant_id")?.Value ?? 
			              User.FindFirst("tenant_id")?.Value;
			
			// Build base query
			var query = _dbContext.Users
				.Where(u => u.UserType == "Patient");
			
			// Add tenant filter if available
			if (!string.IsNullOrEmpty(tenantId) && Guid.TryParse(tenantId, out var tenantGuid))
			{
				query = query.Where(u => u.TenantId == tenantGuid);
			}

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

			var users = await query.ToListAsync();

			if (format.ToLower() == "csv")
			{
				var csv = "ID,First Name,Last Name,Email,Phone,Date of Birth,Gender,Status,Registered Date\n";
				foreach (var user in users)
				{
					csv += $"{user.Id},\"{user.FirstName}\",\"{user.LastName}\",\"{user.Email}\",\"{user.Phone ?? ""}\",";
					csv += $"\"{user.DateOfBirth?.ToString("yyyy-MM-dd") ?? ""}\",\"{user.Gender ?? ""}\",{user.Status ?? "active"},{user.CreatedAt:yyyy-MM-dd}\n";
				}

				return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"patients_{DateTime.Now:yyyyMMdd}.csv");
			}

			return BadRequest(new { error = "Unsupported export format" });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error exporting patients");
			return StatusCode(500, new { error = "An error occurred while exporting patients" });
		}
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
		
		try
		{
			// Get patient demographics from Users table
			var patient = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.Id == patientId && u.UserType == "Patient");
			
			if (patient == null)
			{
				return NotFound(new { error = "Patient not found" });
			}
			
			// Get medical history from database (assuming JSON stored in profile_data)
			var medicalHistory = new MedicalHistoryDto();
			if (!string.IsNullOrEmpty(patient.ProfileData))
			{
				try
				{
					var profileData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(patient.ProfileData);
					if (profileData != null)
					{
						if (profileData.ContainsKey("medicalHistory"))
						{
							medicalHistory = JsonSerializer.Deserialize<MedicalHistoryDto>(profileData["medicalHistory"].GetRawText()) ?? new MedicalHistoryDto();
						}
					}
				}
				catch { /* If JSON parsing fails, use empty medical history */ }
			}
			
			// Get vital signs from VitalSigns table
			var vitalSigns = await _dbContext.VitalSigns
				.Where(v => v.PatientId == patientId)
				.OrderByDescending(v => v.RecordedAt)
				.Take(10)
				.Select(v => new VitalSignDto
				{
					Id = v.Id,
					RecordedAt = v.RecordedAt,
					BloodPressure = v.BloodPressure,
					HeartRate = v.HeartRate,
					Temperature = v.Temperature,
					Weight = v.Weight,
					Height = v.Height,
					Bmi = v.Bmi,
					OxygenSaturation = v.OxygenSaturation
				})
				.ToArrayAsync();
			
			// Get recent appointments
			var appointments = await _dbContext.Appointments
				.Where(a => a.PatientId == patientId)
				.OrderByDescending(a => a.ScheduledStart)
				.Take(5)
				.Select(a => new AppointmentSummaryDto
				{
					Id = a.Id,
					Date = a.ScheduledStart,
					Provider = a.Provider != null ? $"Dr. {a.Provider.LastName}" : "Unknown",
					Type = a.AppointmentType,
					Status = a.Status.ToString(),
					Notes = a.Notes
				})
				.ToArrayAsync();
			
			// Get PROM results
			var promResults = await _dbContext.PromInstances
				.Where(p => p.PatientId == patientId && p.CompletedAt != null)
				.OrderByDescending(p => p.CompletedAt)
				.Take(5)
				.Join(
					_dbContext.PromTemplates,
					instance => instance.TemplateId,
					template => template.Id,
					(instance, template) => new PromResultSummaryDto
					{
						Id = instance.Id,
						Name = template.Name,
						CompletedAt = instance.CompletedAt ?? DateTime.MinValue,
						Score = instance.Score ?? 0,
						Severity = instance.Severity ?? "Unknown"
					}
				)
				.ToArrayAsync();
			
			// Get documents
			var documents = await _dbContext.Documents
				.Where(d => d.PatientId == patientId)
				.OrderByDescending(d => d.UploadedAt)
				.Take(10)
				.Select(d => new DocumentDto
				{
					Id = d.Id,
					Name = d.FileName,
					Type = d.DocumentType,
					UploadedAt = d.UploadedAt,
					Size = FormatFileSize(d.FileSize)
				})
				.ToArrayAsync();
			
			var record = new PatientRecordDto
			{
				Id = Guid.NewGuid(),
				PatientId = patientId,
				MedicalRecordNumber = patient.MedicalRecordNumber ?? $"MRN-{patientId.ToString().Substring(0, 8)}",
				Demographics = new DemographicsDto
				{
					FirstName = patient.FirstName,
					LastName = patient.LastName,
					DateOfBirth = patient.DateOfBirth ?? DateTime.MinValue,
					Gender = patient.Gender ?? "Not specified",
					Email = patient.Email,
					Phone = patient.Phone ?? string.Empty,
					Address = new AddressDto
					{
						Street = patient.Address ?? string.Empty,
						City = patient.City ?? string.Empty,
						State = patient.State ?? string.Empty,
						PostalCode = patient.Postcode ?? string.Empty,
						Country = "Australia"
					}
				},
				MedicalHistory = medicalHistory,
				VitalSigns = vitalSigns,
				RecentAppointments = appointments,
				PromResults = promResults,
				Documents = documents
			};
			
			return Ok(record);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error fetching patient record for {PatientId}", patientId);
			return StatusCode(500, new { error = "An error occurred while fetching the patient record" });
		}
	}
	
	private string FormatFileSize(long bytes)
	{
		string[] sizes = { "B", "KB", "MB", "GB" };
		int order = 0;
		double size = bytes;
		while (size >= 1024 && order < sizes.Length - 1)
		{
			order++;
			size /= 1024;
		}
		return $"{size:0.##} {sizes[order]}";
	}
	
	// PUT: api/patient-records/{patientId}/demographics
	[HttpPut("patient-records/{patientId}/demographics")]
	[ProducesResponseType(204)]
	public async Task<IActionResult> UpdateDemographics(Guid patientId, [FromBody] DemographicsDto demographics)
	{
		// Check authorization
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
		
		try
		{
			var patient = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.Id == patientId && u.UserType == "Patient");
			
			if (patient == null)
			{
				return NotFound(new { error = "Patient not found" });
			}
			
			// Update demographics
			patient.FirstName = demographics.FirstName;
			patient.LastName = demographics.LastName;
			patient.DateOfBirth = demographics.DateOfBirth;
			patient.Gender = demographics.Gender;
			patient.Email = demographics.Email;
			patient.Phone = demographics.Phone;
			patient.Address = demographics.Address?.Street;
			patient.City = demographics.Address?.City;
			patient.State = demographics.Address?.State;
			patient.Postcode = demographics.Address?.PostalCode;
			patient.UpdatedAt = DateTime.UtcNow;
			
			await _dbContext.SaveChangesAsync();
			
			_logger.LogInformation("Updated demographics for patient {PatientId}", patientId);
			
			return NoContent();
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating demographics for patient {PatientId}", patientId);
			return StatusCode(500, new { error = "An error occurred while updating demographics" });
		}
	}
	
	// POST: api/patient-records/{patientId}/medical-history
	[HttpPost("patient-records/{patientId}/medical-history")]
	[ProducesResponseType(typeof(MedicalHistoryDto), 201)]
	public async Task<IActionResult> AddMedicalHistory(Guid patientId, [FromBody] MedicalHistoryUpdateDto update)
	{
		// Check authorization - only clinicians and admins can update medical history
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		try
		{
			var patient = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.Id == patientId && u.UserType == "Patient");
			
			if (patient == null)
			{
				return NotFound(new { error = "Patient not found" });
			}
			
			var history = new MedicalHistoryDto
			{
				ChronicConditions = update.ChronicConditions ?? Array.Empty<string>(),
				PastSurgeries = update.PastSurgeries ?? Array.Empty<string>(),
				Allergies = update.Allergies ?? Array.Empty<string>(),
				CurrentMedications = update.CurrentMedications ?? Array.Empty<MedicationDto>(),
				FamilyHistory = update.FamilyHistory ?? Array.Empty<string>()
			};
			
			// Update patient's profile data with medical history
			var profileData = new Dictionary<string, object>();
			if (!string.IsNullOrEmpty(patient.ProfileData))
			{
				try
				{
					profileData = JsonSerializer.Deserialize<Dictionary<string, object>>(patient.ProfileData) ?? new Dictionary<string, object>();
				}
				catch { /* If deserialization fails, start with empty dictionary */ }
			}
			
			profileData["medicalHistory"] = history;
			patient.ProfileData = JsonSerializer.Serialize(profileData);
			patient.UpdatedAt = DateTime.UtcNow;
			
			await _dbContext.SaveChangesAsync();
			
			_logger.LogInformation("Added medical history for patient {PatientId}", patientId);
			
			return CreatedAtAction(nameof(GetPatientRecord), new { patientId }, history);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error adding medical history for patient {PatientId}", patientId);
			return StatusCode(500, new { error = "An error occurred while adding medical history" });
		}
	}
	
	// POST: api/patient-records/{patientId}/vital-signs
	[HttpPost("patient-records/{patientId}/vital-signs")]
	[ProducesResponseType(typeof(VitalSignDto), 201)]
	public async Task<IActionResult> RecordVitalSigns(Guid patientId, [FromBody] VitalSignDto vitalSign)
	{
		// Check authorization - clinicians and admins can record vital signs
		if (!User.IsInRole("Clinician") && !User.IsInRole("Admin"))
		{
			return Forbid();
		}
		
		try
		{
			// Verify patient exists
			var patientExists = await _dbContext.Users
				.AnyAsync(u => u.Id == patientId && u.UserType == "Patient");
			
			if (!patientExists)
			{
				return NotFound(new { error = "Patient not found" });
			}
			
			// Get provider ID from claims
			var providerIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
			Guid? providerId = null;
			if (Guid.TryParse(providerIdClaim, out var providerGuid))
			{
				providerId = providerGuid;
			}
			
			// Create new vital sign record
			var newVitalSign = new VitalSign
			{
				Id = Guid.NewGuid(),
				PatientId = patientId,
				ProviderId = providerId,
				RecordedAt = DateTime.UtcNow,
				BloodPressure = vitalSign.BloodPressure,
				HeartRate = vitalSign.HeartRate,
				Temperature = vitalSign.Temperature,
				Weight = vitalSign.Weight,
				Height = vitalSign.Height,
				Bmi = vitalSign.Bmi,
				OxygenSaturation = vitalSign.OxygenSaturation,
				CreatedAt = DateTime.UtcNow
			};
			
			_dbContext.VitalSigns.Add(newVitalSign);
			await _dbContext.SaveChangesAsync();
			
			// Return the created vital sign
			vitalSign.Id = newVitalSign.Id;
			vitalSign.RecordedAt = newVitalSign.RecordedAt;
			
			_logger.LogInformation("Recorded vital signs for patient {PatientId}", patientId);
			
			return CreatedAtAction(nameof(GetVitalSigns), new { patientId }, vitalSign);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error recording vital signs for patient {PatientId}", patientId);
			return StatusCode(500, new { error = "An error occurred while recording vital signs" });
		}
	}
	
	// GET: api/patient-records/{patientId}/vital-signs
	[HttpGet("patient-records/{patientId}/vital-signs")]
	[ProducesResponseType(typeof(IEnumerable<VitalSignDto>), 200)]
	public async Task<IActionResult> GetVitalSigns(Guid patientId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
	{
		// Check authorization
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
		
		try
		{
			var query = _dbContext.VitalSigns
				.Where(v => v.PatientId == patientId);
			
			// Apply date filters if provided
			if (from.HasValue)
			{
				query = query.Where(v => v.RecordedAt >= from.Value);
			}
			
			if (to.HasValue)
			{
				query = query.Where(v => v.RecordedAt <= to.Value);
			}
			
			var vitalSigns = await query
				.OrderByDescending(v => v.RecordedAt)
				.Select(v => new VitalSignDto
				{
					Id = v.Id,
					RecordedAt = v.RecordedAt,
					BloodPressure = v.BloodPressure,
					HeartRate = v.HeartRate,
					Temperature = v.Temperature,
					Weight = v.Weight,
					Height = v.Height,
					Bmi = v.Bmi,
					OxygenSaturation = v.OxygenSaturation
				})
				.ToListAsync();
			
			return Ok(vitalSigns);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error fetching vital signs for patient {PatientId}", patientId);
			return StatusCode(500, new { error = "An error occurred while fetching vital signs" });
		}
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

// Additional DTOs specific to this controller
public class PatientRecordDto
{
	public Guid Id { get; set; }
	public Guid PatientId { get; set; }
	public string MedicalRecordNumber { get; set; } = string.Empty;
	public Core.DTOs.DemographicsDto Demographics { get; set; } = new();
	public Core.DTOs.MedicalHistoryDto MedicalHistory { get; set; } = new();
	public VitalSignDto[] VitalSigns { get; set; } = Array.Empty<VitalSignDto>();
	public AppointmentSummaryDto[] RecentAppointments { get; set; } = Array.Empty<AppointmentSummaryDto>();
	public PromResultSummaryDto[] PromResults { get; set; } = Array.Empty<PromResultSummaryDto>();
	public DocumentDto[] Documents { get; set; } = Array.Empty<DocumentDto>();
}

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
