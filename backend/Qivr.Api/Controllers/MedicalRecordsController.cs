using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    public MedicalRecordsController(
        QivrDbContext context,
        ILogger<MedicalRecordsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all medical records for the current patient
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<MedicalRecordDto>), 200)]
    public async Task<IActionResult> GetMedicalRecords(
        [FromQuery] string? category = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // For now, return mock data. In production, this would query actual medical records
        var records = GetMockMedicalRecords(userId);

        // Apply filters
        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            records = records.Where(r => r.Category == category).ToList();
        }

        if (from.HasValue)
        {
            records = records.Where(r => DateTime.Parse(r.Date) >= from.Value).ToList();
        }

        if (to.HasValue)
        {
            records = records.Where(r => DateTime.Parse(r.Date) <= to.Value).ToList();
        }

        return Ok(records);
    }

    /// <summary>
    /// Get a specific medical record
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MedicalRecordDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMedicalRecord(string id)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Mock implementation
        var records = GetMockMedicalRecords(userId);
        var record = records.FirstOrDefault(r => r.Id == id);

        if (record == null)
        {
            return NotFound();
        }

        return Ok(record);
    }

    /// <summary>
    /// Upload a new medical record
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(MedicalRecordDto), 201)]
    public async Task<IActionResult> UploadMedicalRecord(
        [FromForm] IFormFile file,
        [FromForm] string title,
        [FromForm] string category,
        [FromForm] string? description)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file provided");
        }

        // Check file type
        var allowedTypes = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedTypes.Contains(extension))
        {
            return BadRequest("Invalid file type");
        }

        // Check file size (10MB limit)
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest("File size exceeds 10MB limit");
        }

        // In production, save file to storage (S3, Azure Blob, etc.)
        // For now, create a mock record
        var record = new MedicalRecordDto
        {
            Id = Guid.NewGuid().ToString(),
            Title = title,
            Category = category,
            Date = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss"),
            Provider = "Self-uploaded",
            Facility = "Patient Portal",
            FileType = extension switch
            {
                ".pdf" => "pdf",
                ".jpg" or ".jpeg" or ".png" => "image",
                _ => "document"
            },
            FileSize = $"{file.Length / 1024} KB",
            Status = "available",
            Tags = new[] { "Patient Upload", category },
            Description = description
        };

        _logger.LogInformation("Medical record uploaded by patient {UserId}: {Title}", userId, title);

        return CreatedAtAction(nameof(GetMedicalRecord), new { id = record.Id }, record);
    }

    /// <summary>
    /// Delete a medical record (patient-uploaded only)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteMedicalRecord(string id)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // In production, check if record exists and belongs to user
        // Only allow deletion of patient-uploaded records
        
        _logger.LogInformation("Medical record {RecordId} deleted by patient {UserId}", id, userId);
        
        return NoContent();
    }

    private List<MedicalRecordDto> GetMockMedicalRecords(Guid userId)
    {
        return new List<MedicalRecordDto>
        {
            new MedicalRecordDto
            {
                Id = "1",
                Title = "Complete Blood Count (CBC)",
                Category = "lab-results",
                Date = "2024-01-20T10:00:00",
                Provider = "Dr. Sarah Johnson",
                Facility = "Central Medical Lab",
                FileType = "pdf",
                FileSize = "245 KB",
                Status = "available",
                Tags = new[] { "Blood Test", "Routine" },
                Description = "Annual health checkup blood work"
            },
            new MedicalRecordDto
            {
                Id = "2",
                Title = "Knee MRI Scan",
                Category = "imaging",
                Date = "2024-01-18T14:00:00",
                Provider = "Dr. Michael Chen",
                Facility = "Imaging Center",
                FileType = "image",
                FileSize = "12.5 MB",
                Status = "available",
                Tags = new[] { "MRI", "Knee", "Orthopedic" },
                Attachments = 8
            },
            new MedicalRecordDto
            {
                Id = "3",
                Title = "Prescription - Pain Management",
                Category = "prescriptions",
                Date = "2024-01-15T09:00:00",
                Provider = "Dr. Emily Rodriguez",
                Facility = "Primary Care Clinic",
                FileType = "document",
                FileSize = "156 KB",
                Status = "available",
                Tags = new[] { "Medication", "Active" }
            },
            new MedicalRecordDto
            {
                Id = "4",
                Title = "COVID-19 Vaccination Record",
                Category = "vaccinations",
                Date = "2023-12-10T11:00:00",
                Provider = "Nurse Williams",
                Facility = "Community Health Center",
                FileType = "pdf",
                FileSize = "89 KB",
                Status = "available",
                Tags = new[] { "Vaccine", "COVID-19", "Booster" }
            },
            new MedicalRecordDto
            {
                Id = "5",
                Title = "Cardiology Consultation",
                Category = "consultations",
                Date = "2024-01-05T15:30:00",
                Provider = "Dr. Robert Kim",
                Facility = "Heart Health Specialists",
                FileType = "pdf",
                FileSize = "512 KB",
                Status = "available",
                Tags = new[] { "Cardiology", "Consultation", "Follow-up" },
                Description = "Follow-up consultation for heart health assessment"
            },
            new MedicalRecordDto
            {
                Id = "6",
                Title = "Lipid Panel Results",
                Category = "lab-results",
                Date = "2024-01-22T08:00:00",
                Provider = "Dr. Sarah Johnson",
                Facility = "Central Medical Lab",
                FileType = "pdf",
                FileSize = "198 KB",
                Status = "pending",
                Tags = new[] { "Cholesterol", "Lab Test" }
            }
        };
    }
}

public class MedicalRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Facility { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string FileSize { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string? Description { get; set; }
    public int? Attachments { get; set; }
}
