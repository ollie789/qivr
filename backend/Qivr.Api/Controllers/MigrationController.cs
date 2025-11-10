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

    [HttpPost("fix-user-tenant")]
    public async Task<IActionResult> FixUserTenant([FromBody] FixUserTenantRequest request)
    {
        try
        {
            var targetTenantId = Guid.Parse("b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11");
            
            // Ensure target tenant exists
            var tenant = await _context.Tenants.FindAsync(targetTenantId);
            if (tenant == null)
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "INSERT INTO tenants (id, name, slug, settings, created_at, updated_at) VALUES ({0}, {1}, {2}, {3}, NOW(), NOW())",
                    targetTenantId, "QIVR Demo Clinic", "demo-clinic", "{\"features\": [\"appointments\", \"analytics\", \"messaging\"]}"
                );
            }

            // Ensure clinic exists
            var clinic = await _context.Clinics.FirstOrDefaultAsync(c => c.TenantId == targetTenantId);
            if (clinic == null)
            {
                await _context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO clinics (id, tenant_id, name, email, phone, address, city, state, zip_code, country, is_active, metadata, created_at, updated_at)
                    VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, NOW(), NOW())",
                    targetTenantId, targetTenantId, "QIVR Demo Clinic", "clinic@qivr.health", "+61 2 9876 5432",
                    "123 Health Street", "Sydney", "NSW", "2000", "Australia", true, "{}"
                );
            }

            // Update user's tenant
            var updated = await _context.Database.ExecuteSqlRawAsync(
                "UPDATE users SET tenant_id = {0}, updated_at = NOW() WHERE cognito_sub = {1}",
                targetTenantId, request.CognitoSub
            );

            // Update provider's tenant if exists
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE providers SET tenant_id = {0}, clinic_id = {1}, updated_at = NOW() WHERE user_id IN (SELECT id FROM users WHERE cognito_sub = {2})",
                targetTenantId, targetTenantId, request.CognitoSub
            );

            _logger.LogInformation("Fixed user tenant: {CognitoSub} -> {TenantId}", request.CognitoSub, targetTenantId);
            
            return Ok(new { 
                message = "User tenant fixed successfully", 
                cognitoSub = request.CognitoSub,
                tenantId = targetTenantId.ToString(),
                rowsUpdated = updated
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fix user tenant");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    public class FixUserTenantRequest
    {
        public string CognitoSub { get; set; } = string.Empty;
    }
}
