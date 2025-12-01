using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Infrastructure.Services;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Tenant insights: health scores, onboarding progress, feature adoption, storage usage.
/// </summary>
[ApiController]
[Route("api/admin/insights")]
[Authorize]
public class AdminTenantInsightsController : ControllerBase
{
    private readonly AdminReadOnlyDbContext _readOnlyContext;
    private readonly IAmazonS3 _s3;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminTenantInsightsController> _logger;

    public AdminTenantInsightsController(
        AdminReadOnlyDbContext readOnlyContext,
        IAmazonS3 s3,
        IConfiguration config,
        ILogger<AdminTenantInsightsController> logger)
    {
        _readOnlyContext = readOnlyContext;
        _s3 = s3;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Get tenant health scores with churn risk indicators
    /// </summary>
    [HttpGet("health-scores")]
    public async Task<IActionResult> GetTenantHealthScores(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var last30Days = now.AddDays(-30);
        var last7Days = now.AddDays(-7);

        // Get all tenants with activity metrics
        var tenants = await _readOnlyContext.Tenants
            .Select(t => new { t.Id, t.Name, t.Slug, t.CreatedAt })
            .ToListAsync(ct);

        var healthScores = new List<object>();

        foreach (var tenant in tenants)
        {
            // Get activity counts
            var appointmentsLast30 = await _readOnlyContext.Appointments
                .CountAsync(a => a.TenantId == tenant.Id && a.CreatedAt >= last30Days, ct);

            var appointmentsLast7 = await _readOnlyContext.Appointments
                .CountAsync(a => a.TenantId == tenant.Id && a.CreatedAt >= last7Days, ct);

            var documentsLast30 = await _readOnlyContext.Documents
                .CountAsync(d => d.TenantId == tenant.Id && d.CreatedAt >= last30Days, ct);

            var promResponsesLast30 = await _readOnlyContext.PromResponses
                .CountAsync(p => p.TenantId == tenant.Id && p.CreatedAt >= last30Days, ct);

            var staffCount = await _readOnlyContext.Users
                .CountAsync(u => u.TenantId == tenant.Id && u.UserType != UserType.Patient, ct);

            var patientCount = await _readOnlyContext.Users
                .CountAsync(u => u.TenantId == tenant.Id && u.UserType == UserType.Patient, ct);

            // Calculate health score (0-100)
            var activityScore = Math.Min(100, (appointmentsLast30 * 2) + (documentsLast30 * 3) + (promResponsesLast30 * 5));
            var engagementScore = appointmentsLast7 > 0 ? 100 : appointmentsLast30 > 0 ? 50 : 0;
            var setupScore = (staffCount > 0 ? 25 : 0) + (patientCount > 0 ? 25 : 0) +
                            (appointmentsLast30 > 0 ? 25 : 0) + (promResponsesLast30 > 0 ? 25 : 0);

            var healthScore = (int)((activityScore * 0.4) + (engagementScore * 0.4) + (setupScore * 0.2));

            // Determine churn risk
            var daysSinceCreation = (now - tenant.CreatedAt).TotalDays;
            var churnRisk = healthScore < 30 ? "high"
                : healthScore < 60 ? "medium"
                : "low";

            // Flag inactive tenants
            if (appointmentsLast30 == 0 && daysSinceCreation > 14)
                churnRisk = "high";

            healthScores.Add(new
            {
                tenantId = tenant.Id,
                name = tenant.Name,
                slug = tenant.Slug,
                healthScore,
                churnRisk,
                metrics = new
                {
                    appointmentsLast30,
                    appointmentsLast7,
                    documentsLast30,
                    promResponsesLast30,
                    staffCount,
                    patientCount
                },
                scores = new
                {
                    activity = activityScore,
                    engagement = engagementScore,
                    setup = setupScore
                },
                daysSinceCreation = (int)daysSinceCreation
            });
        }

        // Sort by health score ascending (worst first)
        var sorted = healthScores.OrderBy(h => ((dynamic)h).healthScore).ToList();

        return Ok(new
        {
            timestamp = now,
            summary = new
            {
                totalTenants = healthScores.Count,
                healthyTenants = healthScores.Count(h => ((dynamic)h).churnRisk == "low"),
                atRiskTenants = healthScores.Count(h => ((dynamic)h).churnRisk == "medium"),
                highRiskTenants = healthScores.Count(h => ((dynamic)h).churnRisk == "high"),
                averageHealthScore = healthScores.Any() ? (int)healthScores.Average(h => (int)((dynamic)h).healthScore) : 0
            },
            tenants = sorted
        });
    }

    /// <summary>
    /// Get onboarding progress for recent tenants
    /// </summary>
    [HttpGet("onboarding")]
    public async Task<IActionResult> GetOnboardingProgress([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddDays(-days);

        var newTenants = await _readOnlyContext.Tenants
            .Where(t => t.CreatedAt >= since)
            .Select(t => new { t.Id, t.Name, t.Slug, t.CreatedAt })
            .ToListAsync(ct);

        var onboardingProgress = new List<object>();

        foreach (var tenant in newTenants)
        {
            // Check onboarding milestones
            var hasStaff = await _readOnlyContext.Users
                .AnyAsync(u => u.TenantId == tenant.Id && u.UserType != UserType.Patient, ct);

            var hasPatient = await _readOnlyContext.Users
                .AnyAsync(u => u.TenantId == tenant.Id && u.UserType == UserType.Patient, ct);

            var hasAppointment = await _readOnlyContext.Appointments
                .AnyAsync(a => a.TenantId == tenant.Id, ct);

            var hasDocument = await _readOnlyContext.Documents
                .AnyAsync(d => d.TenantId == tenant.Id, ct);

            var hasProm = await _readOnlyContext.PromInstances
                .AnyAsync(p => p.TenantId == tenant.Id, ct);

            var hasTreatmentPlan = await _readOnlyContext.TreatmentPlans
                .AnyAsync(tp => tp.TenantId == tenant.Id, ct);

            var milestones = new[]
            {
                new { step = "Account Created", completed = true, order = 1 },
                new { step = "Staff Member Added", completed = hasStaff, order = 2 },
                new { step = "First Patient Added", completed = hasPatient, order = 3 },
                new { step = "First Appointment Created", completed = hasAppointment, order = 4 },
                new { step = "First Document Uploaded", completed = hasDocument, order = 5 },
                new { step = "First PROM Sent", completed = hasProm, order = 6 },
                new { step = "First Treatment Plan Created", completed = hasTreatmentPlan, order = 7 }
            };

            var completedSteps = milestones.Count(m => m.completed);
            var progress = (completedSteps * 100) / milestones.Length;

            onboardingProgress.Add(new
            {
                tenantId = tenant.Id,
                name = tenant.Name,
                slug = tenant.Slug,
                createdAt = tenant.CreatedAt,
                daysOld = (int)(DateTime.UtcNow - tenant.CreatedAt).TotalDays,
                progress,
                completedSteps,
                totalSteps = milestones.Length,
                milestones,
                status = progress == 100 ? "completed"
                    : progress >= 50 ? "in_progress"
                    : "stalled"
            });
        }

        return Ok(new
        {
            period = $"Last {days} days",
            summary = new
            {
                newTenants = newTenants.Count,
                completed = onboardingProgress.Count(o => ((dynamic)o).status == "completed"),
                inProgress = onboardingProgress.Count(o => ((dynamic)o).status == "in_progress"),
                stalled = onboardingProgress.Count(o => ((dynamic)o).status == "stalled"),
                averageProgress = onboardingProgress.Any()
                    ? (int)onboardingProgress.Average(o => (int)((dynamic)o).progress)
                    : 0
            },
            tenants = onboardingProgress.OrderBy(o => ((dynamic)o).progress)
        });
    }

    /// <summary>
    /// Get feature adoption metrics across all tenants
    /// </summary>
    [HttpGet("feature-adoption")]
    public async Task<IActionResult> GetFeatureAdoption(CancellationToken ct)
    {
        var totalTenants = await _readOnlyContext.Tenants.CountAsync(ct);
        if (totalTenants == 0) totalTenants = 1; // Avoid division by zero

        var features = new List<object>();

        // Appointments feature
        var tenantsWithAppointments = await _readOnlyContext.Appointments
            .Select(a => a.TenantId)
            .Distinct()
            .CountAsync(ct);
        features.Add(new
        {
            feature = "Appointments",
            category = "Core",
            tenantsUsing = tenantsWithAppointments,
            adoptionRate = Math.Round((tenantsWithAppointments * 100.0) / totalTenants, 1),
            totalUsage = await _readOnlyContext.Appointments.CountAsync(ct)
        });

        // Documents feature
        var tenantsWithDocuments = await _readOnlyContext.Documents
            .Select(d => d.TenantId)
            .Distinct()
            .CountAsync(ct);
        features.Add(new
        {
            feature = "Document Management",
            category = "Core",
            tenantsUsing = tenantsWithDocuments,
            adoptionRate = Math.Round((tenantsWithDocuments * 100.0) / totalTenants, 1),
            totalUsage = await _readOnlyContext.Documents.CountAsync(ct)
        });

        // PROM feature
        var tenantsWithProm = await _readOnlyContext.PromInstances
            .Select(p => p.TenantId)
            .Distinct()
            .CountAsync(ct);
        features.Add(new
        {
            feature = "PROM Assessments",
            category = "Clinical",
            tenantsUsing = tenantsWithProm,
            adoptionRate = Math.Round((tenantsWithProm * 100.0) / totalTenants, 1),
            totalUsage = await _readOnlyContext.PromInstances.CountAsync(ct)
        });

        // Treatment Plans feature
        var tenantsWithTreatmentPlans = await _readOnlyContext.TreatmentPlans
            .Select(tp => tp.TenantId)
            .Distinct()
            .CountAsync(ct);
        features.Add(new
        {
            feature = "Treatment Plans",
            category = "Clinical",
            tenantsUsing = tenantsWithTreatmentPlans,
            adoptionRate = Math.Round((tenantsWithTreatmentPlans * 100.0) / totalTenants, 1),
            totalUsage = await _readOnlyContext.TreatmentPlans.CountAsync(ct)
        });

        return Ok(new
        {
            totalTenants,
            features = features.OrderByDescending(f => ((dynamic)f).adoptionRate),
            topFeatures = features.OrderByDescending(f => ((dynamic)f).totalUsage).Take(5)
        });
    }

    /// <summary>
    /// Get storage usage per tenant
    /// </summary>
    [HttpGet("storage")]
    public async Task<IActionResult> GetStorageUsage(CancellationToken ct)
    {
        var bucketName = _config["AWS:S3:DocumentsBucket"] ?? "qivr-documents-prod";

        // Get document counts and estimated sizes per tenant
        var tenants = await _readOnlyContext.Tenants
            .Select(t => new { t.Id, t.Name, t.Slug })
            .ToListAsync(ct);

        var storageByTenant = new List<object>();

        foreach (var tenant in tenants)
        {
            var documentCount = await _readOnlyContext.Documents
                .CountAsync(d => d.TenantId == tenant.Id, ct);

            // Estimate size (in production, query S3 or store actual sizes)
            var estimatedSizeBytes = documentCount * 500_000L; // ~500KB average per document
            var estimatedSizeGb = estimatedSizeBytes / (1024.0 * 1024.0 * 1024.0);

            storageByTenant.Add(new
            {
                tenantId = tenant.Id,
                name = tenant.Name,
                slug = tenant.Slug,
                documentCount,
                estimatedSizeGb = Math.Round(estimatedSizeGb, 2),
                estimatedSizeMb = Math.Round(estimatedSizeBytes / (1024.0 * 1024.0), 1)
            });
        }

        var totalDocuments = storageByTenant.Sum(s => (int)((dynamic)s).documentCount);
        var totalSizeGb = storageByTenant.Sum(s => (double)((dynamic)s).estimatedSizeGb);

        return Ok(new
        {
            summary = new
            {
                totalDocuments,
                totalStorageGb = Math.Round(totalSizeGb, 2),
                bucketName,
                averagePerTenant = tenants.Count > 0 ? Math.Round(totalSizeGb / tenants.Count, 2) : 0
            },
            tenants = storageByTenant.OrderByDescending(s => ((dynamic)s).estimatedSizeGb)
        });
    }

    /// <summary>
    /// Get tenant activity trends
    /// </summary>
    [HttpGet("trends")]
    public async Task<IActionResult> GetActivityTrends([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddDays(-days);

        // Get daily appointment counts
        var appointmentTrend = await _readOnlyContext.Appointments
            .Where(a => a.CreatedAt >= since)
            .GroupBy(a => a.CreatedAt.Date)
            .Select(g => new { date = g.Key, count = g.Count() })
            .OrderBy(g => g.date)
            .ToListAsync(ct);

        // Get daily new patient signups
        var patientTrend = await _readOnlyContext.Users
            .Where(u => u.CreatedAt >= since && u.UserType == UserType.Patient)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new { date = g.Key, count = g.Count() })
            .OrderBy(g => g.date)
            .ToListAsync(ct);

        // Get daily PROM completions
        var promTrend = await _readOnlyContext.PromResponses
            .Where(p => p.CreatedAt >= since)
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new { date = g.Key, count = g.Count() })
            .OrderBy(g => g.date)
            .ToListAsync(ct);

        return Ok(new
        {
            period = $"Last {days} days",
            appointments = appointmentTrend,
            newPatients = patientTrend,
            promResponses = promTrend,
            summary = new
            {
                totalAppointments = appointmentTrend.Sum(a => a.count),
                totalNewPatients = patientTrend.Sum(p => p.count),
                totalPromResponses = promTrend.Sum(p => p.count)
            }
        });
    }
}
