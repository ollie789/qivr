using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Api.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize(Roles = "Clinician,Admin,ClinicAdmin,Provider")]
public class PatientsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        ILogger<PatientsController> logger)
    {
        _context = context;
        _authorizationService = authorizationService;
        _logger = logger;
    }

    /// <summary>
    /// Search for patients by name, email, or phone
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<PatientSearchResultDto>), 200)]
    public async Task<IActionResult> SearchPatients([FromQuery] string query, [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
        {
            return BadRequest("Search query must be at least 3 characters long");
        }

        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized("Tenant not identified");
        }

        try
        {
            var searchLower = query.ToLower();
            
            var patients = await _context.Users
                .Where(u => u.TenantId == tenantId && u.Roles.Contains("Patient"))
                .Where(u => 
                    u.FirstName.ToLower().Contains(searchLower) ||
                    u.LastName.ToLower().Contains(searchLower) ||
                    u.Email.ToLower().Contains(searchLower) ||
                    (u.Phone != null && u.Phone.Contains(searchLower))
                )
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .Take(limit)
                .Select(u => new PatientSearchResultDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.Phone ?? "",
                    DateOfBirth = u.DateOfBirth,
                    LastVisit = _context.Appointments
                        .Where(a => a.PatientId == u.Id && a.Status == AppointmentStatus.Completed)
                        .OrderByDescending(a => a.ScheduledStart)
                        .Select(a => a.ScheduledStart)
                        .FirstOrDefault(),
                    MedicalRecordNumber = null, // MRN field doesn't exist in User entity
                    IsActive = u.EmailVerified
                })
                .ToListAsync();

            _logger.LogInformation("Search completed for query '{Query}', found {Count} patients", query, patients.Count);

            return Ok(patients);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching patients with query: {Query}", query);
            return StatusCode(500, "An error occurred while searching patients");
        }
    }

    /// <summary>
    /// Get all patients for the current clinic
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResultDto<PatientListItemDto>), 200)]
    public async Task<IActionResult> GetPatients(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = "name",
        [FromQuery] bool activeOnly = true)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized("Tenant not identified");
        }

        try
        {
            var query = _context.Users
                .Where(u => u.TenantId == tenantId && u.Roles.Contains("Patient"));

            if (activeOnly)
            {
                query = query.Where(u => u.EmailVerified);
            }

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "email" => query.OrderBy(u => u.Email),
                "recent" => query.OrderByDescending(u => u.CreatedAt),
                _ => query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
            };

            var totalCount = await query.CountAsync();

            var patients = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new PatientListItemDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.Phone ?? "",
                    DateOfBirth = u.DateOfBirth,
                    MedicalRecordNumber = null, // MRN field doesn't exist in User entity
                    IsActive = u.EmailVerified,
                    CreatedAt = u.CreatedAt,
                    LastUpdated = u.UpdatedAt
                })
                .ToListAsync();

            var result = new PaginatedResultDto<PatientListItemDto>
            {
                Items = patients,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patients list");
            return StatusCode(500, "An error occurred while retrieving patients");
        }
    }

    /// <summary>
    /// Get patient details by ID
    /// </summary>
    [HttpGet("{patientId}")]
    [ProducesResponseType(typeof(PatientDetailsDto), 200)]
    public async Task<IActionResult> GetPatientDetails(Guid patientId)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return Unauthorized("Tenant not identified");
        }

        try
        {
            var patient = await _context.Users
                .Where(u => u.Id == patientId && u.TenantId == tenantId && u.Roles.Contains("Patient"))
                .Select(u => new PatientDetailsDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.Phone ?? "",
                    DateOfBirth = u.DateOfBirth,
                    Gender = u.Gender,
                    Address = null, // Address fields not in User entity
                    City = null,
                    State = null,
                    PostalCode = null,
                    Country = null,
                    MedicalRecordNumber = null, // MRN field doesn't exist in User entity
                    EmergencyContact = null, // These fields may need to be added to User entity or stored elsewhere
                    EmergencyPhone = null,
                    InsuranceProvider = null,
                    InsuranceNumber = null,
                    IsActive = u.EmailVerified, // Using email verified as a proxy for active
                    CreatedAt = u.CreatedAt,
                    LastUpdated = u.UpdatedAt,
                    Notes = null
                })
                .FirstOrDefaultAsync();

            if (patient == null)
            {
                return NotFound("Patient not found");
            }

            // Get recent appointments
            patient.RecentAppointments = await _context.Appointments
                .Where(a => a.PatientId == patientId)
                .OrderByDescending(a => a.ScheduledStart)
                .Take(5)
                .Select(a => new AppointmentSummaryDto
                {
                    Id = a.Id,
                    Date = a.ScheduledStart,
                    Provider = a.Provider != null ? $"{a.Provider.FirstName} {a.Provider.LastName}" : "Unknown",
                    Type = a.AppointmentType,
                    Status = a.Status.ToString(),
                    Notes = a.Notes ?? ""
                })
                .ToListAsync();

            // Get recent PROMs
            patient.RecentProms = await _context.PromInstances
                .Include(i => i.Template)
                .Where(i => i.PatientId == patientId)
                .OrderByDescending(i => i.CreatedAt)
                .Take(5)
                .Select(i => new PromSummaryDto
                {
                    Id = i.Id,
                    TemplateName = i.Template.Name,
                    Status = i.Status.ToString(),
                    CreatedAt = i.CreatedAt,
                    CompletedAt = i.CompletedAt,
                    Score = _context.PromResponses
                        .Where(r => r.PromInstanceId == i.Id)
                        .Select(r => r.Score)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(patient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patient details for ID: {PatientId}", patientId);
            return StatusCode(500, "An error occurred while retrieving patient details");
        }
    }
}

// DTOs
public class PatientSearchResultDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public DateTime? LastVisit { get; set; }
    public string? MedicalRecordNumber { get; set; }
    public bool IsActive { get; set; }
}

public class PatientListItemDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? MedicalRecordNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUpdated { get; set; }
}

public class PatientDetailsDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? MedicalRecordNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? EmergencyPhone { get; set; }
    public string? InsuranceProvider { get; set; }
    public string? InsuranceNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUpdated { get; set; }
    public string? Notes { get; set; }
    public List<AppointmentSummaryDto>? RecentAppointments { get; set; }
    public List<PromSummaryDto>? RecentProms { get; set; }
}

public class AppointmentSummaryDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class PromSummaryDto
{
    public Guid Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? Score { get; set; }
}

public class PaginatedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}