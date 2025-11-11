using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Api.Services;
using Qivr.Api.Models;
using Microsoft.AspNetCore.RateLimiting;
using Qivr.Api.Middleware;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/patients")] // Maintain backward compatibility
[EnableRateLimiting("api")]
public class PatientsController : TenantAwareController
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ICacheService _cacheService;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService,
        ICacheService cacheService,
        ILogger<PatientsController> logger)
    {
        _context = context;
        _authorizationService = authorizationService;
        _cacheService = cacheService;
        _logger = logger;
    }

    /// <summary>
    /// Search for patients by name, email, or phone
    /// </summary>
    /// <param name="query">Search query (minimum 3 characters)</param>
    /// <param name="limit">Maximum number of results to return</param>
    /// <returns>List of matching patients</returns>
    /// <response code="200">Returns matching patients</response>
    /// <response code="400">Search query too short</response>
    [HttpGet("search")]
    [EnableRateLimiting("search")]
    [ProducesResponseType(typeof(IEnumerable<PatientSearchResultDto>), 200)]
    [ProducesResponseType(400)]
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
            
            // Try to get from cache first
            var cacheKey = CacheService.CacheKeys.PatientSearch(tenantId, searchLower);
            var cachedResults = await _cacheService.GetAsync<List<PatientSearchResultDto>>(cacheKey);
            if (cachedResults != null)
            {
                _logger.LogDebug("Returning cached patient search results for query: {Query}", query);
                return Ok(cachedResults);
            }
            
            var patients = await _context.Users
                .Where(u => u.TenantId == tenantId && u.UserType == UserType.Patient)
                .Where(u => 
                    (u.FirstName != null && u.FirstName.ToLower().Contains(searchLower)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(searchLower)) ||
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
                    IsActive = true
                })
                .ToListAsync();

            _logger.LogInformation("Search completed for query '{Query}', found {Count} patients", query, patients.Count);
            
            // Cache the search results for 30 seconds (searches are frequent and results can change)
            await _cacheService.SetAsync(cacheKey, patients, CacheService.CacheDuration.VeryShort);

            return Ok(patients);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching patients with query: {Query}", query);
            return StatusCode(500, "An error occurred while searching patients");
        }
    }

    /// <summary>
    /// Get all patients with cursor-based pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(CursorPaginationResponse<PatientListItemDto>), 200)]
    public async Task<IActionResult> GetPatients(
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 20,
        [FromQuery] string? sortBy = "name",
        [FromQuery] bool activeOnly = true,
        [FromQuery] bool sortDescending = false)
    {
        // Check tenant requirement using new base controller
        var tenantCheck = RequireTenant();
        if (tenantCheck is not OkResult)
        {
            return tenantCheck;
        }

        var tenantId = GetCurrentTenantId()!.Value;

        try
        {
            var query = _context.Users
                .Where(u => u.TenantId == tenantId && u.UserType == UserType.Patient);

            // activeOnly filter removed - EmailVerified not in DB

            // Use cursor pagination
            var paginationRequest = new CursorPaginationRequest
            {
                Cursor = cursor,
                Limit = limit,
                SortBy = sortBy?.ToLower() switch
                {
                    "email" => "Email",
                    "recent" => "CreatedAt",
                    _ => "LastName"
                },
                SortDescending = sortBy?.ToLower() == "recent" || sortDescending
            };

            CursorPaginationResponse<User> paginatedResult;
            
            if (sortBy?.ToLower() == "email")
            {
                paginatedResult = await query.ToCursorPageAsync(
                    u => u.Email,
                    u => u.Id,
                    paginationRequest);
            }
            else if (sortBy?.ToLower() == "recent")
            {
                paginatedResult = await query.ToCursorPageAsync(
                    u => u.CreatedAt,
                    u => u.Id,
                    paginationRequest);
            }
            else
            {
                // Default: sort by name
                paginatedResult = await query.ToCursorPageAsync(
                    u => u.LastName,
                    u => u.Id,
                    paginationRequest);
            }

            // Convert to DTOs
            var response = new CursorPaginationResponse<PatientListItemDto>
            {
                Items = paginatedResult.Items.Select(u => new PatientListItemDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.Phone ?? "",
                    DateOfBirth = u.DateOfBirth,
                    MedicalRecordNumber = null, // MRN field doesn't exist in User entity
                    IsActive = true,
                    CreatedAt = u.CreatedAt,
                    LastUpdated = u.UpdatedAt
                }).ToList(),
                NextCursor = paginatedResult.NextCursor,
                PreviousCursor = paginatedResult.PreviousCursor,
                HasNext = paginatedResult.HasNext,
                HasPrevious = paginatedResult.HasPrevious,
                Count = paginatedResult.Count
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patients list");
            return StatusCode(500, "An error occurred while retrieving patients");
        }
    }

    /// <summary>
    /// Get all patients with traditional pagination (legacy endpoint)
    /// </summary>
    [HttpGet("page")]
    [ProducesResponseType(typeof(PaginatedResultDto<PatientListItemDto>), 200)]
    public async Task<IActionResult> GetPatientsPaged(
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
                .Where(u => u.TenantId == tenantId && u.UserType == UserType.Patient);

            // activeOnly filter removed - EmailVerified not in DB

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
                    IsActive = true,
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
            // Try to get from cache first
            var cacheKey = CacheService.CacheKeys.PatientDetails(patientId);
            var cachedPatient = await _cacheService.GetAsync<PatientDetailsDto>(cacheKey);
            if (cachedPatient != null)
            {
                _logger.LogDebug("Returning cached patient details for patient {PatientId}", patientId);
                return Ok(cachedPatient);
            }
            var patient = await _context.Users
                .Where(u => u.Id == patientId && u.TenantId == tenantId && u.UserType == UserType.Patient)
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
                    IsActive = true, // Using email verified as a proxy for active
                    CreatedAt = u.CreatedAt,
                    LastUpdated = u.UpdatedAt,
                    Notes = null
                })
                .FirstOrDefaultAsync();

            if (patient == null)
            {
                return NotFound($"Patient with ID {patientId} not found");
            }
            
            // Cache the patient details for 5 minutes
            await _cacheService.SetAsync(cacheKey, patient, CacheService.CacheDuration.Medium);

            return Ok(patient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patient details for ID: {PatientId}", patientId);
            return StatusCode(500, "An error occurred while retrieving patient details");
        }
    }

    /// <summary>
    /// Create a new patient
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PatientDetailsDto), 201)]
    public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto createDto)
    {
        try
        {
            // Use the same tenant ID approach as GET methods
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            if (tenantId == Guid.Empty)
            {
                return Unauthorized("Tenant not identified");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CognitoSub = Guid.NewGuid().ToString(), // Generate unique cognito_id for API-created patients
                FirstName = createDto.FirstName,
                LastName = createDto.LastName,
                Email = createDto.Email,
                Phone = createDto.Phone,
                DateOfBirth = createDto.DateOfBirth,
                Gender = createDto.Gender,
                UserType = UserType.Patient,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = new PatientDetailsDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                DateOfBirth = user.DateOfBirth,
                Gender = user.Gender,
                CreatedAt = user.CreatedAt,
                LastUpdated = user.UpdatedAt,
                IsActive = !user.IsDeleted
            };

            return CreatedAtAction(nameof(GetPatientDetails), new { patientId = user.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating patient");
            return StatusCode(500, "An error occurred while creating the patient");
        }
    }

    /// <summary>
    /// Update an existing patient
    /// </summary>
    [HttpPut("{patientId}")]
    [ProducesResponseType(typeof(PatientDetailsDto), 200)]
    public async Task<IActionResult> UpdatePatient(Guid patientId, [FromBody] UpdatePatientDto updateDto)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == patientId && u.UserType == UserType.Patient && !u.IsDeleted);

            if (user == null)
                return NotFound();

            if (!string.IsNullOrEmpty(updateDto.FirstName))
                user.FirstName = updateDto.FirstName;
            if (!string.IsNullOrEmpty(updateDto.LastName))
                user.LastName = updateDto.LastName;
            if (!string.IsNullOrEmpty(updateDto.Email))
                user.Email = updateDto.Email;
            if (!string.IsNullOrEmpty(updateDto.Phone))
                user.Phone = updateDto.Phone;
            if (updateDto.DateOfBirth.HasValue)
                user.DateOfBirth = updateDto.DateOfBirth.Value;
            if (!string.IsNullOrEmpty(updateDto.Gender))
                user.Gender = updateDto.Gender;

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var result = new PatientDetailsDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                DateOfBirth = user.DateOfBirth,
                Gender = user.Gender,
                CreatedAt = user.CreatedAt,
                LastUpdated = user.UpdatedAt,
                IsActive = !user.IsDeleted
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating patient {PatientId}", patientId);
            return StatusCode(500, "An error occurred while updating the patient");
        }
    }

    /// <summary>
    /// Delete a patient (soft delete)
    /// </summary>
    [HttpDelete("{patientId}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeletePatient(Guid patientId)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == patientId && u.UserType == UserType.Patient && !u.IsDeleted);

            if (user == null)
                return NotFound();

            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting patient {PatientId}", patientId);
            return StatusCode(500, "An error occurred while deleting the patient");
        }
    }
}

public class CreatePatientDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
}

public class UpdatePatientDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
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