using Amazon.Athena;
using Amazon.Athena.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
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
    public async Task<IActionResult> GetTenants(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? status = null,
        [FromQuery] string? plan = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        // Validate pagination
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 10, 100);

        // Build query with filters
        var query = _db.Tenants
            .Where(t => t.DeletedAt == null);

        // Apply filters
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Qivr.Core.Entities.TenantStatus>(status, true, out var statusEnum))
        {
            query = query.Where(t => t.Status == statusEnum);
        }

        if (!string.IsNullOrEmpty(plan))
        {
            // Case-insensitive comparison using EF.Functions.ILike for PostgreSQL
            query = query.Where(t => EF.Functions.ILike(t.Plan, plan));
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(t => EF.Functions.ILike(t.Name, $"%{search}%") ||
                                     EF.Functions.ILike(t.Slug, $"%{search}%"));
        }

        // Get total count for pagination metadata
        var totalCount = await query.CountAsync(ct);

        // Get paginated tenant IDs first (lightweight query)
        var tenantIds = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => t.Id)
            .ToListAsync(ct);

        // Get tenant details only for the page
        var tenants = await _db.Tenants
            .Where(t => tenantIds.Contains(t.Id))
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                Status = t.Status.ToString().ToLowerInvariant(),
                Plan = t.Plan ?? "starter",
                t.CreatedAt,
            })
            .ToListAsync(ct);

        // Get user counts only for tenants in this page
        var userCounts = await _db.Users
            .Where(u => u.DeletedAt == null && tenantIds.Contains(u.TenantId))
            .GroupBy(u => u.TenantId)
            .Select(g => new
            {
                TenantId = g.Key,
                PatientCount = g.Count(u => u.UserType == Qivr.Core.Entities.UserType.Patient),
                StaffCount = g.Count(u => u.UserType != Qivr.Core.Entities.UserType.Patient)
            })
            .ToListAsync(ct);

        var countsDict = userCounts.ToDictionary(x => x.TenantId);

        // Maintain order from original query
        var orderedTenants = tenantIds
            .Select(id => tenants.First(t => t.Id == id))
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                t.Status,
                t.Plan,
                t.CreatedAt,
                PatientCount = countsDict.TryGetValue(t.Id, out var c) ? c.PatientCount : 0,
                StaffCount = countsDict.TryGetValue(t.Id, out var s) ? s.StaffCount : 0
            });

        return Ok(new
        {
            data = orderedTenants,
            pagination = new
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                hasNextPage = page * pageSize < totalCount,
                hasPreviousPage = page > 1
            }
        });
    }

    [HttpGet("dashboard")]
    [OutputCache(PolicyName = "DashboardStats")]
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

        // Fallback to DB - use aggregate queries instead of loading all data
        var totalTenants = await _db.Tenants.CountAsync(t => t.DeletedAt == null, ct);
        var activeTenants = await _db.Tenants.CountAsync(t => t.DeletedAt == null && t.Status == Qivr.Core.Entities.TenantStatus.Active, ct);
        var totalPatients = await _db.Users.CountAsync(u => u.UserType == Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);
        var totalStaff = await _db.Users.CountAsync(u => u.UserType != Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);

        // Calculate MRR using database-side case-insensitive comparison
        // Use ILike for PostgreSQL case-insensitive matching
        var starterCount = await _db.Tenants.CountAsync(t => t.DeletedAt == null && EF.Functions.ILike(t.Plan, "starter"), ct);
        var professionalCount = await _db.Tenants.CountAsync(t => t.DeletedAt == null && EF.Functions.ILike(t.Plan, "professional"), ct);
        var enterpriseCount = await _db.Tenants.CountAsync(t => t.DeletedAt == null && EF.Functions.ILike(t.Plan, "enterprise"), ct);

        var mrrDb = (starterCount * 99) + (professionalCount * 299) + (enterpriseCount * 599);

        return Ok(new
        {
            totalTenants = totalTenants.ToString(),
            activeTenants = activeTenants.ToString(),
            totalPatients = totalPatients.ToString(),
            totalStaff = totalStaff.ToString(),
            mrr = mrrDb.ToString(),
            mrrFormatted = $"${mrrDb:N0}"
        });
    }

    [HttpGet("usage")]
    [OutputCache(PolicyName = "AdminAnalytics", VaryByQueryKeys = ["days"])]
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
    [OutputCache(PolicyName = "AdminAnalytics", VaryByQueryKeys = ["region", "promType"])]
    public async Task<IActionResult> GetPromOutcomes([FromQuery] string? region, [FromQuery] string? promType, CancellationToken ct = default)
    {
        // PROM outcomes require Athena - anonymized aggregates with k-anonymity
        if (AthenaEnabled && _athena != null)
        {
            try
            {
                // SECURITY FIX: Validate inputs to prevent SQL Injection in Athena query
                if (!string.IsNullOrEmpty(region) && !System.Text.RegularExpressions.Regex.IsMatch(region, "^[a-zA-Z0-9\\s-]+$"))
                {
                    return BadRequest("Invalid region format");
                }

                if (!string.IsNullOrEmpty(promType) && !System.Text.RegularExpressions.Regex.IsMatch(promType, "^[a-zA-Z0-9\\-]+$"))
                {
                    return BadRequest("Invalid PROM type format");
                }

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
    [OutputCache(PolicyName = "AdminAnalytics", VaryByQueryKeys = ["months"])]
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

        // Fallback to DB - compute MRR using a CASE expression that PostgreSQL can translate
        var since = DateTime.UtcNow.AddMonths(-months);

        // First get the raw data grouped by month
        var rawData = await _db.Tenants
            .Where(t => t.CreatedAt >= since && t.DeletedAt == null)
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                NewTenants = g.Count(),
                // Count by plan type using case-insensitive matching
                StarterCount = g.Count(t => EF.Functions.ILike(t.Plan, "starter")),
                ProfessionalCount = g.Count(t => EF.Functions.ILike(t.Plan, "professional")),
                EnterpriseCount = g.Count(t => EF.Functions.ILike(t.Plan, "enterprise"))
            })
            .ToListAsync(ct);

        // Calculate MRR in memory (simple arithmetic, not a scaling concern)
        var tenantsByMonth = rawData
            .Select(g => new
            {
                Month = $"{g.Year}-{g.Month:D2}",
                g.NewTenants,
                MrrAdded = (g.StarterCount * 99) + (g.ProfessionalCount * 299) + (g.EnterpriseCount * 599)
            })
            .OrderBy(x => x.Month)
            .ToList();

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
