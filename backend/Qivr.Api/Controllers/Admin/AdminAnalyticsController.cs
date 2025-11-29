using Amazon.Athena;
using Amazon.Athena.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Admin analytics from Data Lake (Athena) - no direct production DB access.
/// </summary>
[ApiController]
[Route("api/admin/analytics")]
[Authorize]
public class AdminAnalyticsController : ControllerBase
{
    private readonly IAmazonAthena _athena;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminAnalyticsController> _logger;

    private string Database => _config["Athena:Database"] ?? "qivr_analytics";
    private string OutputLocation => _config["Athena:OutputLocation"] ?? "s3://qivr-analytics-lake/athena-results/";

    public AdminAnalyticsController(IAmazonAthena athena, IConfiguration config, ILogger<AdminAnalyticsController> logger)
    {
        _athena = athena;
        _config = config;
        _logger = logger;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken ct)
    {
        var query = @"
            SELECT id, name, slug, status, plan, region, 
                   patient_count, staff_count, created_at
            FROM tenants
            ORDER BY created_at DESC
        ";
        
        var results = await ExecuteQuery(query, ct);
        return Ok(results);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var query = @"
            SELECT 
                COUNT(*) as total_tenants,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_tenants,
                SUM(patient_count) as total_patients,
                SUM(staff_count) as total_staff,
                SUM(CASE WHEN plan = 'starter' THEN 99 
                         WHEN plan = 'professional' THEN 299 
                         WHEN plan = 'enterprise' THEN 599 ELSE 0 END) as mrr
            FROM tenants
            WHERE status != 'Cancelled'
        ";
        
        var results = await ExecuteQuery(query, ct);
        var row = results.FirstOrDefault();
        
        return Ok(new
        {
            totalTenants = row?.GetValueOrDefault("total_tenants", "0"),
            activeTenants = row?.GetValueOrDefault("active_tenants", "0"),
            totalPatients = row?.GetValueOrDefault("total_patients", "0"),
            totalStaff = row?.GetValueOrDefault("total_staff", "0"),
            mrr = row?.GetValueOrDefault("mrr", "0"),
            mrrFormatted = $"${row?.GetValueOrDefault("mrr", "0")}"
        });
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsageStats([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var query = $@"
            SELECT tenant_id, 
                   SUM(appointments) as appointments,
                   SUM(documents) as documents,
                   SUM(messages) as messages,
                   SUM(completed) as completed_appointments
            FROM usage
            WHERE date >= date_add('day', -{days}, current_date)
            GROUP BY tenant_id
        ";
        
        var results = await ExecuteQuery(query, ct);
        return Ok(results);
    }

    [HttpGet("prom-outcomes")]
    public async Task<IActionResult> GetPromOutcomes([FromQuery] string? region, [FromQuery] string? promType, CancellationToken ct = default)
    {
        var where = "WHERE patient_count >= 10"; // K-anonymity enforced
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
        
        var results = await ExecuteQuery(query, ct);
        return Ok(results);
    }

    [HttpGet("revenue-trend")]
    public async Task<IActionResult> GetRevenueTrend([FromQuery] int months = 6, CancellationToken ct = default)
    {
        // Calculate MRR trend from tenant data
        var query = $@"
            SELECT 
                date_format(created_at, '%Y-%m') as month,
                COUNT(*) as new_tenants,
                SUM(CASE WHEN plan = 'starter' THEN 99 
                         WHEN plan = 'professional' THEN 299 
                         WHEN plan = 'enterprise' THEN 599 ELSE 0 END) as mrr_added
            FROM tenants
            WHERE created_at >= date_add('month', -{months}, current_date)
              AND status != 'Cancelled'
            GROUP BY date_format(created_at, '%Y-%m')
            ORDER BY month
        ";
        
        var results = await ExecuteQuery(query, ct);
        return Ok(results);
    }

    private async Task<List<Dictionary<string, string>>> ExecuteQuery(string query, CancellationToken ct)
    {
        var request = new StartQueryExecutionRequest
        {
            QueryString = query,
            QueryExecutionContext = new QueryExecutionContext { Database = Database },
            ResultConfiguration = new ResultConfiguration { OutputLocation = OutputLocation }
        };

        var startResponse = await _athena.StartQueryExecutionAsync(request, ct);
        var queryId = startResponse.QueryExecutionId;

        // Wait for query to complete
        QueryExecutionState state;
        do
        {
            await Task.Delay(500, ct);
            var statusResponse = await _athena.GetQueryExecutionAsync(
                new GetQueryExecutionRequest { QueryExecutionId = queryId }, ct);
            state = statusResponse.QueryExecution.Status.State;
            
            if (state == QueryExecutionState.FAILED)
            {
                _logger.LogError("Athena query failed: {Reason}", 
                    statusResponse.QueryExecution.Status.StateChangeReason);
                throw new Exception($"Query failed: {statusResponse.QueryExecution.Status.StateChangeReason}");
            }
        } while (state == QueryExecutionState.QUEUED || state == QueryExecutionState.RUNNING);

        // Get results
        var resultsResponse = await _athena.GetQueryResultsAsync(
            new GetQueryResultsRequest { QueryExecutionId = queryId }, ct);

        var results = new List<Dictionary<string, string>>();
        var columns = resultsResponse.ResultSet.ResultSetMetadata.ColumnInfo
            .Select(c => c.Name).ToList();

        foreach (var row in resultsResponse.ResultSet.Rows.Skip(1)) // Skip header
        {
            var dict = new Dictionary<string, string>();
            for (int i = 0; i < columns.Count; i++)
            {
                dict[columns[i]] = row.Data[i].VarCharValue ?? "";
            }
            results.Add(dict);
        }

        return results;
    }
}
