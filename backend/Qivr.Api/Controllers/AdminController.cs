using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/admin")]
[AllowAnonymous]
public class AdminController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(QivrDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> SeedDatabase()
    {
        try
        {
            var result = await _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO appointments (id, tenant_id, patient_id, provider_id, provider_profile_id, clinic_id, scheduled_start, scheduled_end, status, appointment_type, location_type, location_details, is_paid, notes, created_at, updated_at)
                SELECT gen_random_uuid(), u.tenant_id, p.id, u.id, pp.id, c.id, NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'Scheduled', 'Initial Consultation', 'InPerson', '{}'::jsonb, false, 'New patient consultation', NOW(), NOW()
                FROM users u, users p, provider_profiles pp, clinics c
                WHERE u.email = 'test.doctor@clinic.com' AND p.role = 'Patient' AND pp.user_id = u.id AND c.tenant_id = u.tenant_id
                LIMIT 3;

                INSERT INTO medical_conditions (id, tenant_id, patient_id, condition, icd10code, status, diagnosed_date, managed_by, last_reviewed, notes, created_at, updated_at)
                SELECT gen_random_uuid(), u.tenant_id, p.id, 'Lower Back Pain', 'M54.5', 'Active', NOW() - INTERVAL '30 days', u.id, NOW(), 'Sample condition', NOW(), NOW()
                FROM users u, users p
                WHERE u.email = 'test.doctor@clinic.com' AND p.role = 'Patient'
                LIMIT 2;
            ");

            return Ok(new { message = "Database seeded successfully", rowsAffected = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed database");
            return StatusCode(500, new { error = ex.Message, details = ex.ToString() });
        }
    }
}
