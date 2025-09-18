using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using System.Text.Json;
using Qivr.Api.Models;

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
    /// Get medical records with cursor-based pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(CursorPaginationResponse<MedicalRecordDto>), 200)]
    public async Task<IActionResult> GetMedicalRecords(
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 50,
        [FromQuery] string? category = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] bool sortDescending = true)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Get tenant ID
        var tenantId = GetTenantId();
        
        // Query actual medical records from database
        var query = _context.Documents
            .Where(d => d.TenantId == tenantId && d.PatientId == userId);

        // Apply filters
        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = query.Where(d => d.DocumentType == GetDocumentTypeFromCategory(category));
        }

        if (from.HasValue)
        {
            query = query.Where(d => d.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(d => d.CreatedAt <= to.Value);
        }

        // Use cursor pagination
        var paginationRequest = new CursorPaginationRequest
        {
            Cursor = cursor,
            Limit = limit,
            SortBy = "CreatedAt",
            SortDescending = sortDescending
        };

        var paginatedResult = await query.ToCursorPageAsync(
            d => d.CreatedAt,
            d => d.Id,
            paginationRequest);

        // Convert to DTOs
        var response = new CursorPaginationResponse<MedicalRecordDto>
        {
            Items = paginatedResult.Items.Select(d => 
            {
                var metadata = string.IsNullOrEmpty(d.Metadata) 
                    ? new Dictionary<string, object>()
                    : JsonSerializer.Deserialize<Dictionary<string, object>>(d.Metadata) ?? new Dictionary<string, object>();
                
                var tags = string.IsNullOrEmpty(d.Tags)
                    ? Array.Empty<string>()
                    : JsonSerializer.Deserialize<string[]>(d.Tags) ?? Array.Empty<string>();
                    
                return new MedicalRecordDto
                {
                    Id = d.Id.ToString(),
                    Title = d.FileName,
                    Category = GetCategoryFromDocumentType(d.DocumentType),
                    Date = d.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                    Provider = metadata.ContainsKey("provider") ? metadata["provider"].ToString() : "N/A",
                    Facility = metadata.ContainsKey("facility") ? metadata["facility"].ToString() : "Patient Portal",
                    FileType = GetFileTypeFromContentType(d.ContentType),
                    FileSize = FormatFileSize(d.FileSizeBytes),
                    Status = "available",
                    Tags = tags,
                    Description = d.Description
                };
            }).ToList(),
            NextCursor = paginatedResult.NextCursor,
            PreviousCursor = paginatedResult.PreviousCursor,
            HasNext = paginatedResult.HasNext,
            HasPrevious = paginatedResult.HasPrevious,
            Count = paginatedResult.Count
        };

        return Ok(response);
    }

    /// <summary>
    /// Get medical records with traditional pagination (legacy endpoint)
    /// </summary>
    [HttpGet("page")]
    [ProducesResponseType(typeof(List<MedicalRecordDto>), 200)]
    public async Task<IActionResult> GetMedicalRecordsPaged(
        [FromQuery] string? category = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Get tenant ID
        var tenantId = GetTenantId();
        
        // Query actual medical records from database
        var query = _context.Documents
            .Where(d => d.TenantId == tenantId && d.PatientId == userId);

        // Apply filters
        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = query.Where(d => d.DocumentType == GetDocumentTypeFromCategory(category));
        }

        if (from.HasValue)
        {
            query = query.Where(d => d.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(d => d.CreatedAt <= to.Value);
        }

        var documents = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Convert to DTOs
        var records = documents.Select(d => 
        {
            var metadata = string.IsNullOrEmpty(d.Metadata) 
                ? new Dictionary<string, object>()
                : JsonSerializer.Deserialize<Dictionary<string, object>>(d.Metadata) ?? new Dictionary<string, object>();
            
            var tags = string.IsNullOrEmpty(d.Tags)
                ? Array.Empty<string>()
                : JsonSerializer.Deserialize<string[]>(d.Tags) ?? Array.Empty<string>();
                
            return new MedicalRecordDto
            {
                Id = d.Id.ToString(),
                Title = d.FileName,
                Category = GetCategoryFromDocumentType(d.DocumentType),
                Date = d.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                Provider = metadata.ContainsKey("provider") ? metadata["provider"].ToString() : "N/A",
                Facility = metadata.ContainsKey("facility") ? metadata["facility"].ToString() : "Patient Portal",
                FileType = GetFileTypeFromContentType(d.ContentType),
                FileSize = FormatFileSize(d.FileSizeBytes),
                Status = "available",
                Tags = tags,
                Description = d.Description
            };
        }).ToList();

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

        // Get tenant ID
        var tenantId = GetTenantId();
        
        if (!Guid.TryParse(id, out var documentId))
        {
            return BadRequest("Invalid document ID");
        }

        // Get document from database
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.TenantId == tenantId && 
                                     d.PatientId == userId && 
                                     d.Id == documentId);

        if (document == null)
        {
            return NotFound();
        }

        // Convert to DTO
        var metadata = string.IsNullOrEmpty(document.Metadata) 
            ? new Dictionary<string, object>()
            : JsonSerializer.Deserialize<Dictionary<string, object>>(document.Metadata) ?? new Dictionary<string, object>();
        
        var tags = string.IsNullOrEmpty(document.Tags)
            ? Array.Empty<string>()
            : JsonSerializer.Deserialize<string[]>(document.Tags) ?? Array.Empty<string>();
            
        var record = new MedicalRecordDto
        {
            Id = document.Id.ToString(),
            Title = document.FileName,
            Category = GetCategoryFromDocumentType(document.DocumentType),
            Date = document.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
            Provider = metadata.ContainsKey("provider") ? metadata["provider"].ToString() : "N/A",
            Facility = metadata.ContainsKey("facility") ? metadata["facility"].ToString() : "Patient Portal",
            FileType = GetFileTypeFromContentType(document.ContentType),
            FileSize = FormatFileSize(document.FileSizeBytes),
            Status = "available",
            Tags = tags,
            Description = document.Description
        };

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

        // Get tenant ID
        var tenantId = GetTenantId();
        
        // Read file data
        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var fileData = memoryStream.ToArray();
        
        // Create document entity
        var tagsArray = new[] { "Patient Upload", category };
        var metadataDict = new Dictionary<string, object>
        {
            ["provider"] = "Self-uploaded",
            ["facility"] = "Patient Portal",
            ["originalFileName"] = file.FileName
        };
        
        var document = new Document
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = userId,
            FileName = title,
            DocumentType = GetDocumentTypeFromCategory(category),
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            StoragePath = $"medical-records/{tenantId}/{userId}/{Guid.NewGuid()}{extension}",
            Tags = JsonSerializer.Serialize(tagsArray),
            Description = description,
            Metadata = JsonSerializer.Serialize(metadataDict),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        // TODO: In production, save file data to storage (S3, Azure Blob, etc.)
        // For now, we're just saving the metadata to the database
        _logger.LogInformation("Would save file to storage path: {Path}", document.StoragePath);
        
        // Save metadata to database
        _context.Documents.Add(document);
        await _context.SaveChangesAsync();
        
        // Convert to DTO
        var record = new MedicalRecordDto
        {
            Id = document.Id.ToString(),
            Title = title,
            Category = category,
            Date = document.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
            Provider = "Self-uploaded",
            Facility = "Patient Portal",
            FileType = GetFileTypeFromContentType(file.ContentType),
            FileSize = FormatFileSize(file.Length),
            Status = "available",
            Tags = tagsArray,
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

        // Get tenant ID
        var tenantId = GetTenantId();
        
        if (!Guid.TryParse(id, out var documentId))
        {
            return BadRequest("Invalid document ID");
        }
        
        // Check if record exists and belongs to user
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.TenantId == tenantId && 
                                     d.PatientId == userId && 
                                     d.Id == documentId);
        
        if (document == null)
        {
            return NotFound();
        }
        
        // Only allow deletion of patient-uploaded records
        var metadata = string.IsNullOrEmpty(document.Metadata) 
            ? new Dictionary<string, object>()
            : JsonSerializer.Deserialize<Dictionary<string, object>>(document.Metadata) ?? new Dictionary<string, object>();
            
        if (metadata.ContainsKey("provider") && metadata["provider"].ToString() != "Self-uploaded")
        {
            return Forbid("Only patient-uploaded records can be deleted");
        }
        
        // TODO: In production, delete file from storage (S3, Azure Blob, etc.)
        _logger.LogInformation("Would delete file from storage path: {Path}", document.StoragePath);
        
        // Delete from database
        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Medical record {RecordId} deleted by patient {UserId}", id, userId);
        
        return NoContent();
    }

    // Helper method to get tenant ID from claims
    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }
        // For dev/testing, return a default tenant ID
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
    
    // Convert category to document type
    private static string GetDocumentTypeFromCategory(string category)
    {
        return category switch
        {
            "lab-results" => "Laboratory Results",
            "imaging" => "Medical Imaging",
            "prescriptions" => "Prescription",
            "vaccinations" => "Vaccination Record",
            "consultations" => "Consultation Notes",
            "discharge-summaries" => "Discharge Summary",
            _ => "Medical Document"
        };
    }
    
    // Convert document type to category
    private static string GetCategoryFromDocumentType(string documentType)
    {
        return documentType switch
        {
            "Laboratory Results" => "lab-results",
            "Medical Imaging" => "imaging",
            "Prescription" => "prescriptions",
            "Vaccination Record" => "vaccinations",
            "Consultation Notes" => "consultations",
            "Discharge Summary" => "discharge-summaries",
            _ => "other"
        };
    }
    
    // Get file type from content type
    private static string GetFileTypeFromContentType(string contentType)
    {
        return contentType?.ToLower() switch
        {
            "application/pdf" => "pdf",
            var ct when ct?.StartsWith("image/") == true => "image",
            var ct when ct?.Contains("word") == true => "document",
            _ => "document"
        };
    }
    
    // Format file size for display
    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        int order = 0;
        double size = bytes;
        
        while (size >= 1024 && order < sizes.Length - 1)
        {
            order++;
            size = size / 1024;
        }
        
        return $"{size:0.##} {sizes[order]}";
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
