using Amazon.Athena;
using Amazon.Athena.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Admin analytics - uses Athena data lake when available, falls back to read replica.
/// </summary>
[ApiController]
[Route("api/admin/analytics")]
[Authorize]
public class AdminAnalyticsController : ControllerBase
{
    private readonly IAmazonAthena? _athena;
    private readonly AdminReadOnlyDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminAnalyticsController> _logger;

    private string Database => _config["Athena:Database"] ?? "qivr_analytics";
    private string OutputLocation => _config["Athena:OutputLocation"] ?? "s3://qivr-analytics-lake/athena-results/";
    private bool AthenaEnabled => _config.GetValue<bool>("Athena:Enabled", false);

    public AdminAnalyticsController(
        AdminReadOnlyDbContext db,
        IConfiguration config,
        ILogger<AdminAnalyticsController> logger,
        IAmazonAthena? athena = null)
    {
        _db = db;
        _config = config;
        _logger = logger;
        _athena = athena;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken ct)
    {
        // Use DB - tenant list is always fresh from source
        var tenants = await _db.Tenants
            .Where(t => t.DeletedAt == null)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                Status = t.Status.ToString().ToLower(),
                Plan = t.Plan,
                t.CreatedAt,
                PatientCount = _db.Users.Count(u => u.TenantId == t.Id && u.UserType == Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null),
                StaffCount = _db.Users.Count(u => u.TenantId == t.Id && u.UserType != Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null)
            })
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return Ok(tenants);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var tenants = await _db.Tenants.Where(t => t.DeletedAt == null).ToListAsync(ct);
        var activeTenants = tenants.Count(t => t.Status == Qivr.Core.Entities.TenantStatus.Active);
        var totalPatients = await _db.Users.CountAsync(u => u.UserType == Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);
        var totalStaff = await _db.Users.CountAsync(u => u.UserType != Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);

        var mrr = tenants.Sum(t => t.Plan.ToLower() switch
        {
            "starter" => 99,
            "professional" => 299,
            "enterprise" => 599,
            _ => 0
        });

        return Ok(new
        {
            totalTenants = tenants.Count.ToString(),
            activeTenants = activeTenants.ToString(),
            totalPatients = totalPatients.ToString(),
            totalStaff = totalStaff.ToString(),
            mrr = mrr.ToString(),
            mrrFormatted = $"${mrr:N0}"
        });
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsageStats([FromQuery] int days = 30, CancellationToken ct = default)
    {
        // Try Athena for historical aggregates
        if (AthenaEnabled && _athena != null)
        {
            try
            {
                var query = $@"
                    SELECT tenant_id, 
                           SUM(appointments) as appointments,
                           SUM(documents) as documents,
                           SUM(messages) as messages
                    FROM usage
                    WHERE date >= date_add('day', -{days}, current_date)
                    GROUP BY tenant_id
                ";
                var results = await ExecuteAthenaQuery(query, ct);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Athena query failed, falling back to DB");
            }
        }

        // Fallback to DB
        var since = DateTime.UtcNow.AddDays(-days);
        var usage = await _db.Tenants
            .Where(t => t.DeletedAt == null)
            .Select(t => new
            {
                TenantId = t.Id,
                TenantName = t.Name,
                Appointments = _db.Appointments.Count(a => a.TenantId == t.Id && a.CreatedAt >= since),
                Patients = _db.Users.Count(u => u.TenantId == t.Id && u.UserType == Qivr.Core.Entities.UserType.Patient && u.CreatedAt >= since)
            })
            .ToListAsync(ct);

        return Ok(usage);
    }

    [HttpGet("prom-outcomes")]
    public async Task<IActionResult> GetPromOutcomes([FromQuery] string? region, [FromQuery] string? promType, CancellationToken ct = default)
    {
        // PROM outcomes require Athena data lake for proper aggregation
        if (AthenaEnabled && _athena != null)
        {
            try
            {
                var where = "WHERE patient_count >= 10"; // K-anonymity
                if (!string.IsNullOrEmpty(region)) where += $" AND region = '{region}'";
                if (!string.IsNullOrEmpty(promType)) where += $" AND prom_type = '{promType}'";

                var query = $@"
                    SELECT region, prom_type, age_bracket, gender,
                           avg_baseline, avg_final, patient_count,
                           (avg_final - avg_baseline) / NULLIF(avg_baseline, 0) * 100 as improvement_pct
                    FROM prom_outcomes
                    {where}
                    ORDER BY patient_count DESC
                ";
                var results = await ExecuteAthenaQuery(query, ct);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Athena PROM query failed");
            }
        }

        // Return empty - PROM aggregates need data lake
        return Ok(new List<object>());
    }

    [HttpGet("revenue-trend")]
    public async Task<IActionResult> GetRevenueTrend([FromQuery] int months = 6, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddMonths(-months);

        var tenantsByMonth = await _db.Tenants
            .Where(t => t.CreatedAt >= since && t.DeletedAt == null)
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                NewTenants = g.Count(),
                MrrAdded = g.Sum(t => t.Plan.ToLower() == "starter" ? 99 :
                                      t.Plan.ToLower() == "professional" ? 299 :
                                      t.Plan.ToLower() == "enterprise" ? 599 : 0)
            })
            .OrderBy(x => x.Month)
            .ToListAsync(ct);

        return Ok(tenantsByMonth);
    }

    private async Task<List<Dictionary<string, string>>> ExecuteAthenaQuery(string query, CancellationToken ct)
    {
        if (_athena == null) throw new InvalidOperationException("Athena not configured");

        var request = new StartQueryExecutionRequest
        {
            QueryString = query,
            QueryExecutionContext = new QueryExecutionContext { Database = Database },
            ResultConfiguration = new ResultConfiguration { OutputLocation = OutputLocation }
        };

        var startResponse = await _athena.StartQueryExecutionAsync(request, ct);
        var queryId = startResponse.QueryExecutionId;

        // Wait for query (max 30 seconds)
        QueryExecutionState state;
        var attempts = 0;
        do
        {
            await Task.Delay(500, ct);
            var statusResponse = await _athena.GetQueryExecutionAsync(
                new GetQueryExecutionRequest { QueryExecutionId = queryId }, ct);
            state = statusResponse.QueryExecution.Status.State;

            if (state == QueryExecutionState.FAILED)
                throw new Exception($"Query failed: {statusResponse.QueryExecution.Status.StateChangeReason}");
            
            if (++attempts > 60) throw new TimeoutException("Athena query timeout");
        } while (state == QueryExecutionState.QUEUED || state == QueryExecutionState.RUNNING);

        var resultsResponse = await _athena.GetQueryResultsAsync(
            new GetQueryResultsRequest { QueryExecutionId = queryId }, ct);

        var results = new List<Dictionary<string, string>>();
        var columns = resultsResponse.ResultSet.ResultSetMetadata.ColumnInfo.Select(c => c.Name).ToList();

        foreach (var row in resultsResponse.ResultSet.Rows.Skip(1))
        {
            var dict = new Dictionary<string, string>();
            for (int i = 0; i < columns.Count; i++)
                dict[columns[i]] = row.Data[i].VarCharValue ?? "";
            results.Add(dict);
        }

        return results;
    }
}
