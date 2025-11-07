using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class MigrationController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<MigrationController> _logger;

    public MigrationController(QivrDbContext context, ILogger<MigrationController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("seed-clinic")]
    public async Task<IActionResult> SeedClinic()
    {
        try
        {
            var tenantId = Guid.Parse("b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11");
            var clinicId = Guid.Parse("b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11");
            
            // Check if clinic already exists
            var existingClinic = await _context.Clinics.FindAsync(clinicId);
            if (existingClinic != null)
            {
                return Ok(new { message = "Clinic already exists", clinicId = clinicId.ToString() });
            }

            // Create tenant if not exists
            var existingTenant = await _context.Tenants.FindAsync(tenantId);
            if (existingTenant == null)
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "INSERT INTO tenants (id, name, slug, settings, created_at, updated_at) VALUES ({0}, {1}, {2}, {3}, NOW(), NOW())",
                    tenantId, "QIVR Demo Clinic", "demo-clinic", "{\"features\": [\"appointments\", \"analytics\", \"messaging\"]}"
                );
            }

            // Create clinic
            await _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO clinics (id, tenant_id, name, email, phone, address, city, state, zip_code, country, is_active, metadata, created_at, updated_at)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, NOW(), NOW())",
                clinicId, tenantId, "QIVR Demo Clinic", "clinic@qivr.health", "+61 2 9876 5432",
                "123 Health Street", "Sydney", "NSW", "2000", "Australia", true, "{}"
            );
            
            _logger.LogInformation("Clinic seeded successfully: {ClinicId}", clinicId);
            
            return Ok(new { message = "Clinic created successfully", clinicId = clinicId.ToString() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed clinic");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
