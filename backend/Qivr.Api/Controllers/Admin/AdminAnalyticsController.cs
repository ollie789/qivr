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
        // Always use DB for tenant list - needs to be real-time
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
                PatientCount = t.Users.Count(u => u.UserType == Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null),
                StaffCount = t.Users.Count(u => u.UserType != Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null)
            })
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return Ok(tenants);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        // Try Athena for dashboard stats (uses latest partition)
        if (AthenaEnabled && _athena != null)
        {
            try
            {
                var query = @"
                    SELECT 
                        COUNT(*) as total_tenants,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tenants,
                        SUM(patient_count) as total_patients,
                        SUM(staff_count) as total_staff,
                        SUM(mrr) as mrr
                    FROM qivr_analytics.tenants
                    WHERE dt = (SELECT MAX(dt) FROM qivr_analytics.tenants)
                ";
                var results = await ExecuteAthenaQuery(query, ct);
                var row = results.FirstOrDefault();
                if (row != null)
                {
                    var mrr = int.TryParse(row.GetValueOrDefault("mrr", "0"), out var m) ? m : 0;
                    return Ok(new
                    {
                        totalTenants = row.GetValueOrDefault("total_tenants", "0"),
                        activeTenants = row.GetValueOrDefault("active_tenants", "0"),
                        totalPatients = row.GetValueOrDefault("total_patients", "0"),
                        totalStaff = row.GetValueOrDefault("total_staff", "0"),
                        mrr = mrr.ToString(),
                        mrrFormatted = $"${mrr:N0}"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Athena dashboard query failed, using DB fallback");
            }
        }

        // Fallback to DB
        var tenants = await _db.Tenants.Where(t => t.DeletedAt == null).ToListAsync(ct);
        var activeTenants = tenants.Count(t => t.Status == Qivr.Core.Entities.TenantStatus.Active);
        var totalPatients = await _db.Users.CountAsync(u => u.UserType == Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);
        var totalStaff = await _db.Users.CountAsync(u => u.UserType != Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);

        var mrrDb = tenants.Sum(t => t.Plan.ToLower() switch
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
            mrr = mrrDb.ToString(),
            mrrFormatted = $"${mrrDb:N0}"
        });
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsageStats([FromQuery] int days = 30, CancellationToken ct = default)
    {
        // Try Athena for historical usage
        if (AthenaEnabled && _athena != null)
        {
            try
            {
                var query = $@"
                    SELECT 
                        tenant_id,
                        SUM(appointments) as appointments,
                        SUM(completed_appointments) as completed,
                        SUM(messages) as messages,
                        SUM(documents) as documents
                    FROM qivr_analytics.usage
                    WHERE dt >= date_format(date_add('day', -{days}, current_date), '%Y-%m-%d')
                    GROUP BY tenant_id
                ";
                var results = await ExecuteAthenaQuery(query, ct);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Athena usage query failed, using DB fallback");
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
                Appointments = t.Appointments.Count(a => a.CreatedAt >= since),
                Patients = t.Users.Count(u => u.UserType == Qivr.Core.Entities.UserType.Patient && u.CreatedAt >= since)
            })
            .ToListAsync(ct);

        return Ok(usage);
    }

    [HttpGet("prom-outcomes")]
    public async Task<IActionResult> GetPromOutcomes([FromQuery] string? region, [FromQuery] string? promType, CancellationToken ct = default)
    {
        // PROM outcomes require Athena - anonymized aggregates with k-anonymity
        if (AthenaEnabled && _athena != null)
        {
            try
            {
                var where = "WHERE patient_count >= 5"; // K-anonymity enforced in ETL
                if (!string.IsNullOrEmpty(region)) where += $" AND region = '{region}'";
                if (!string.IsNullOrEmpty(promType)) where += $" AND prom_type = '{promType}'";

                var query = $@"
                    SELECT 
                        region,
                        prom_type,
                        age_bracket,
                        gender,
                        avg_baseline,
                        avg_final,
                        patient_count,
                        ROUND((avg_final - avg_baseline) / NULLIF(avg_baseline, 0) * 100, 1) as improvement_pct
                    FROM qivr_analytics.prom_outcomes
                    {where}
                    AND dt = (SELECT MAX(dt) FROM qivr_analytics.prom_outcomes)
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

        // Return empty - PROM aggregates need data lake for proper anonymization
        return Ok(new { message = "PROM outcomes require analytics data lake", data = new List<object>() });
    }

    [HttpGet("revenue-trend")]
    public async Task<IActionResult> GetRevenueTrend([FromQuery] int months = 6, CancellationToken ct = default)
    {
        // Try Athena for revenue trend
        if (AthenaEnabled && _athena != null)
        {
            try
            {
                var query = $@"
                    SELECT 
                        date_format(created_at, '%Y-%m') as month,
                        COUNT(*) as new_tenants,
                        SUM(mrr) as mrr_added
                    FROM qivr_analytics.tenants
                    WHERE dt = (SELECT MAX(dt) FROM qivr_analytics.tenants)
                      AND created_at >= date_add('month', -{months}, current_date)
                    GROUP BY date_format(created_at, '%Y-%m')
                    ORDER BY month
                ";
                var results = await ExecuteAthenaQuery(query, ct);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Athena revenue query failed, using DB fallback");
            }
        }

        // Fallback to DB
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
            {
                var reason = statusResponse.QueryExecution.Status.StateChangeReason;
                _logger.LogError("Athena query failed: {Reason}", reason);
                throw new Exception($"Query failed: {reason}");
            }

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
