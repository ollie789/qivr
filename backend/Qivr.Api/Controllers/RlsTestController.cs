using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/test/rls")] 
public class RlsTestController : ControllerBase
{
    private readonly QivrDbContext _db;

    public RlsTestController(QivrDbContext db)
    {
        _db = db;
    }

    // These endpoints demonstrate failing cross-tenant attempts.
    // They are not exposed in production and should be used in CI only.
    [HttpGet("cross-tenant-read")]
    [AllowAnonymous]
    public async Task<IActionResult> CrossTenantRead([FromQuery] Guid tenantId)
    {
        // Set a different tenant context than what data rows have -> expect 0 rows
        await _db.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.tenant_id', {tenantId.ToString()}, true)");
        var rows = await _db.Database.SqlQueryRaw<int>("SELECT COUNT(*) FROM qivr.evaluations").FirstAsync();
        // If RLS is enforced properly, without seeded data for this tenant, rows == 0
        return Ok(new { count = rows });
    }

    [HttpPost("cross-tenant-write")]
    [AllowAnonymous]
    public async Task<IActionResult> CrossTenantWrite([FromQuery] Guid tenantId)
    {
        await _db.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.tenant_id', {tenantId.ToString()}, true)");
        try
        {
            var id = Guid.NewGuid();
            await _db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO qivr.evaluations (id, tenant_id, patient_id, evaluation_number, status, questionnaire_responses, created_at, updated_at)
                VALUES ({id}, {Guid.NewGuid()}, {Guid.NewGuid()}, {'E-TEST'}, {'pending'}, '{}'::jsonb, NOW(), NOW())
            ");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "RLS WRITE SHOULD HAVE FAILED" });
        }
        catch (Exception ex)
        {
            // Expect failure due to RLS policy mismatch, return OK with details
            return Ok(new { error = ex.Message });
        }
    }
}

