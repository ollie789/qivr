using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Partner;

/// <summary>
/// Research Analytics API for the Perfect Study and Research Module
/// Provides perception metrics, MCID analysis, discordance detection, and cohort analytics
/// </summary>
[ApiController]
[Route("api/partner/research")]
[Authorize(Policy = "Partner")]
public class ResearchAnalyticsController : ControllerBase
{
    private readonly QivrDbContext _db;
    private const int K_ANONYMITY_THRESHOLD = 5;

    public ResearchAnalyticsController(QivrDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get partner ID from JWT claims or X-Partner-Id header.
    /// Returns null if no valid partner ID can be determined.
    /// </summary>
    private Guid? GetPartnerId()
    {
        // Try JWT claim first (production auth)
        var partnerIdClaim = User.FindFirst("partner_id")?.Value
            ?? User.FindFirst("custom:partner_id")?.Value;
        if (Guid.TryParse(partnerIdClaim, out var partnerId))
            return partnerId;

        // Fallback to header for development/testing
        var headerPartnerId = Request.Headers["X-Partner-Id"].FirstOrDefault();
        if (Guid.TryParse(headerPartnerId, out var headerParsedId))
            return headerParsedId;

        // No valid partner ID - return null (caller must handle)
        return null;
    }

    /// <summary>
    /// Get Perfect Study perception metrics aggregated by device
    /// GPE, PASS, Satisfaction, Expectation Match, Perceived Success
    /// </summary>
    [HttpGet("perception-metrics")]
    public async Task<IActionResult> GetPerceptionMetrics([FromQuery] Guid? deviceId = null)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var deviceIds = await _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId.Value && d.IsActive)
            .Where(d => deviceId == null || d.Id == deviceId)
            .Select(d => d.Id)
            .ToListAsync();

        var results = new List<DevicePerceptionMetrics>();

        foreach (var devId in deviceIds)
        {
            var device = await _db.Set<MedicalDevice>().FindAsync(devId);
            if (device == null) continue;

            // Get all PROM instances linked to this device via treatment plans
            var promInstances = await _db.Set<PromInstance>()
                .Include(p => p.TreatmentPlan)
                .Where(p => p.TreatmentPlan != null &&
                           p.TreatmentPlan.LinkedDeviceUsageId != null &&
                           p.InstanceType == PromInstanceType.FollowUp ||
                           p.InstanceType == PromInstanceType.FinalOutcome)
                .Where(p => p.Status == PromStatus.Completed)
                .Join(_db.Set<PatientDeviceUsage>(),
                    prom => prom.TreatmentPlan!.LinkedDeviceUsageId,
                    usage => usage.Id,
                    (prom, usage) => new { Prom = prom, Usage = usage })
                .Where(x => x.Usage.DeviceId == devId)
                .Select(x => x.Prom)
                .ToListAsync();

            var patientCount = promInstances.Select(p => p.PatientId).Distinct().Count();

            if (patientCount < K_ANONYMITY_THRESHOLD)
            {
                results.Add(new DevicePerceptionMetrics
                {
                    DeviceId = devId,
                    DeviceName = device.Name,
                    DeviceCode = device.DeviceCode,
                    PatientCount = patientCount,
                    SuppressedDueToPrivacy = true
                });
                continue;
            }

            // Calculate GPE distribution
            var gpeValues = promInstances
                .Where(p => p.GlobalPerceivedEffect.HasValue)
                .Select(p => p.GlobalPerceivedEffect!.Value)
                .ToList();

            var gpeDistribution = new GpeDistribution
            {
                VeryMuchWorse = gpeValues.Count(v => v == -3),
                MuchWorse = gpeValues.Count(v => v == -2),
                SlightlyWorse = gpeValues.Count(v => v == -1),
                NoChange = gpeValues.Count(v => v == 0),
                SlightlyBetter = gpeValues.Count(v => v == 1),
                MuchBetter = gpeValues.Count(v => v == 2),
                VeryMuchBetter = gpeValues.Count(v => v == 3),
                AverageGpe = gpeValues.Any() ? (decimal?)gpeValues.Average() : null,
                TotalResponses = gpeValues.Count
            };

            // PASS rate
            var passValues = promInstances
                .Where(p => p.PatientAcceptableSymptomState.HasValue)
                .Select(p => p.PatientAcceptableSymptomState!.Value)
                .ToList();
            var passRate = passValues.Any()
                ? (decimal?)((decimal)passValues.Count(v => v) / passValues.Count * 100)
                : null;

            // Satisfaction
            var satisfactionValues = promInstances
                .Where(p => p.SatisfactionScore.HasValue)
                .Select(p => p.SatisfactionScore!.Value)
                .ToList();

            // Perceived Success
            var successValues = promInstances
                .Where(p => p.PerceivedSuccess.HasValue)
                .Select(p => p.PerceivedSuccess!.Value)
                .ToList();
            var successRate = successValues.Any()
                ? (decimal?)((decimal)successValues.Count(v => v) / successValues.Count * 100)
                : null;

            // Expectation Match
            var expectationValues = promInstances
                .Where(p => p.ExpectationMatch.HasValue)
                .Select(p => p.ExpectationMatch!.Value)
                .ToList();

            // NPS (Would Recommend)
            var npsValues = promInstances
                .Where(p => p.WouldRecommend.HasValue)
                .Select(p => p.WouldRecommend!.Value)
                .ToList();
            decimal? npsScore = null;
            if (npsValues.Any())
            {
                var promoters = npsValues.Count(v => v >= 9);
                var detractors = npsValues.Count(v => v <= 6);
                npsScore = ((decimal)promoters / npsValues.Count - (decimal)detractors / npsValues.Count) * 100;
            }

            results.Add(new DevicePerceptionMetrics
            {
                DeviceId = devId,
                DeviceName = device.Name,
                DeviceCode = device.DeviceCode,
                PatientCount = patientCount,
                SuppressedDueToPrivacy = false,
                GpeDistribution = gpeDistribution,
                PassRate = passRate,
                PassResponses = passValues.Count,
                AverageSatisfaction = satisfactionValues.Any() ? (decimal?)satisfactionValues.Average() : null,
                SatisfactionResponses = satisfactionValues.Count,
                PerceivedSuccessRate = successRate,
                SuccessResponses = successValues.Count,
                AverageExpectationMatch = expectationValues.Any() ? (decimal?)expectationValues.Average() : null,
                ExpectationResponses = expectationValues.Count,
                NetPromoterScore = npsScore,
                NpsResponses = npsValues.Count
            });
        }

        return Ok(new { devices = results });
    }

    /// <summary>
    /// Get MCID analysis with patient-centered thresholds per device/subgroup
    /// </summary>
    [HttpGet("mcid-analysis")]
    public async Task<IActionResult> GetMcidAnalysis([FromQuery] Guid? deviceId = null, [FromQuery] string? promType = null)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var deviceIds = await _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId.Value && d.IsActive)
            .Where(d => deviceId == null || d.Id == deviceId)
            .Select(d => d.Id)
            .ToListAsync();

        var results = new List<DeviceMcidAnalysis>();

        foreach (var devId in deviceIds)
        {
            var device = await _db.Set<MedicalDevice>().FindAsync(devId);
            if (device == null) continue;

            // Get baseline and follow-up pairs for this device
            var usages = await _db.Set<PatientDeviceUsage>()
                .Where(u => u.DeviceId == devId && u.BaselineScore.HasValue)
                .ToListAsync();

            var patientCount = usages.Select(u => u.PatientId).Distinct().Count();

            if (patientCount < K_ANONYMITY_THRESHOLD)
            {
                results.Add(new DeviceMcidAnalysis
                {
                    DeviceId = devId,
                    DeviceName = device.Name,
                    DeviceCode = device.DeviceCode,
                    PatientCount = patientCount,
                    SuppressedDueToPrivacy = true
                });
                continue;
            }

            // Group by PROM type and calculate MCID metrics
            var promTypeGroups = usages
                .Where(u => !string.IsNullOrEmpty(u.BaselinePromType))
                .Where(u => promType == null || u.BaselinePromType == promType)
                .GroupBy(u => u.BaselinePromType!)
                .ToList();

            var mcidByPromType = new List<PromTypeMcid>();

            foreach (var group in promTypeGroups)
            {
                // Get follow-up PROM scores for these patients
                var patientIds = group.Select(u => u.PatientId).Distinct().ToList();

                var followUpScores = await _db.Set<PromInstance>()
                    .Where(p => patientIds.Contains(p.PatientId))
                    .Where(p => p.InstanceType == PromInstanceType.FollowUp ||
                               p.InstanceType == PromInstanceType.FinalOutcome)
                    .Where(p => p.Status == PromStatus.Completed && p.Score.HasValue)
                    .Include(p => p.Template)
                    .Where(p => p.Template != null && p.Template.Key == group.Key)
                    .ToListAsync();

                if (followUpScores.Count < K_ANONYMITY_THRESHOLD) continue;

                // Calculate change scores and correlate with perceived success
                var changeScores = new List<ChangeScoreData>();

                foreach (var usage in group)
                {
                    var followUp = followUpScores
                        .Where(f => f.PatientId == usage.PatientId)
                        .OrderByDescending(f => f.CompletedAt)
                        .FirstOrDefault();

                    if (followUp?.Score == null || usage.BaselineScore == null) continue;

                    changeScores.Add(new ChangeScoreData
                    {
                        PatientId = usage.PatientId,
                        BaselineScore = usage.BaselineScore.Value,
                        FollowUpScore = followUp.Score.Value,
                        Change = followUp.Score.Value - usage.BaselineScore.Value,
                        PercentChange = usage.BaselineScore.Value != 0
                            ? (followUp.Score.Value - usage.BaselineScore.Value) / usage.BaselineScore.Value * 100
                            : 0,
                        PerceivedSuccess = followUp.PerceivedSuccess,
                        PassAchieved = followUp.PatientAcceptableSymptomState
                    });
                }

                if (changeScores.Count < K_ANONYMITY_THRESHOLD) continue;

                // Calculate traditional MCID (average change for those who report success)
                var successfulChanges = changeScores
                    .Where(c => c.PerceivedSuccess == true)
                    .Select(c => c.Change)
                    .ToList();

                var unsuccessfulChanges = changeScores
                    .Where(c => c.PerceivedSuccess == false)
                    .Select(c => c.Change)
                    .ToList();

                decimal? traditionalMcid = null;
                decimal? patientCenteredMcid = null;

                if (successfulChanges.Any())
                {
                    traditionalMcid = successfulChanges.Average();
                }

                // Patient-centered MCID: threshold that best separates success from non-success
                // Using ROC-derived approach (simplified)
                if (successfulChanges.Any() && unsuccessfulChanges.Any())
                {
                    // Find the change score that maximizes sensitivity + specificity
                    var allChanges = changeScores.Select(c => c.Change).OrderBy(c => c).Distinct().ToList();
                    decimal bestThreshold = 0;
                    decimal bestYouden = 0;

                    foreach (var threshold in allChanges)
                    {
                        var truePositives = successfulChanges.Count(c => c >= threshold);
                        var falsePositives = unsuccessfulChanges.Count(c => c >= threshold);
                        var sensitivity = (decimal)truePositives / successfulChanges.Count;
                        var specificity = 1 - (decimal)falsePositives / unsuccessfulChanges.Count;
                        var youden = sensitivity + specificity - 1;

                        if (youden > bestYouden)
                        {
                            bestYouden = youden;
                            bestThreshold = threshold;
                        }
                    }

                    patientCenteredMcid = bestThreshold;
                }

                // Calculate responder rates
                var achievedMcid = changeScores.Count(c =>
                    patientCenteredMcid.HasValue && c.Change >= patientCenteredMcid.Value);
                var responderRate = (decimal)achievedMcid / changeScores.Count * 100;

                mcidByPromType.Add(new PromTypeMcid
                {
                    PromType = group.Key,
                    PatientCount = changeScores.Count,
                    AverageBaselineScore = changeScores.Average(c => c.BaselineScore),
                    AverageFollowUpScore = changeScores.Average(c => c.FollowUpScore),
                    AverageChange = changeScores.Average(c => c.Change),
                    AveragePercentChange = changeScores.Average(c => c.PercentChange),
                    TraditionalMcid = traditionalMcid,
                    PatientCenteredMcid = patientCenteredMcid,
                    ResponderRate = responderRate,
                    RespondersCount = achievedMcid
                });
            }

            results.Add(new DeviceMcidAnalysis
            {
                DeviceId = devId,
                DeviceName = device.Name,
                DeviceCode = device.DeviceCode,
                PatientCount = patientCount,
                SuppressedDueToPrivacy = false,
                McidByPromType = mcidByPromType
            });
        }

        return Ok(new { devices = results });
    }

    /// <summary>
    /// Get discordance analysis - patients where objective PROM improvement
    /// doesn't match subjective perception of success
    /// </summary>
    [HttpGet("discordance")]
    public async Task<IActionResult> GetDiscordanceAnalysis([FromQuery] Guid? deviceId = null)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var deviceIds = await _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId.Value && d.IsActive)
            .Where(d => deviceId == null || d.Id == deviceId)
            .Select(d => d.Id)
            .ToListAsync();

        var results = new List<DeviceDiscordanceAnalysis>();

        foreach (var devId in deviceIds)
        {
            var device = await _db.Set<MedicalDevice>().FindAsync(devId);
            if (device == null) continue;

            // Get patients with both objective scores and subjective perception
            var usages = await _db.Set<PatientDeviceUsage>()
                .Where(u => u.DeviceId == devId && u.BaselineScore.HasValue)
                .ToListAsync();

            var patientIds = usages.Select(u => u.PatientId).Distinct().ToList();

            var followUps = await _db.Set<PromInstance>()
                .Where(p => patientIds.Contains(p.PatientId))
                .Where(p => p.InstanceType == PromInstanceType.FollowUp ||
                           p.InstanceType == PromInstanceType.FinalOutcome)
                .Where(p => p.Status == PromStatus.Completed)
                .Where(p => p.Score.HasValue && p.PerceivedSuccess.HasValue)
                .ToListAsync();

            var analysisData = new List<DiscordanceData>();

            foreach (var usage in usages)
            {
                var followUp = followUps
                    .Where(f => f.PatientId == usage.PatientId)
                    .OrderByDescending(f => f.CompletedAt)
                    .FirstOrDefault();

                if (followUp?.Score == null || usage.BaselineScore == null || !followUp.PerceivedSuccess.HasValue)
                    continue;

                var change = followUp.Score.Value - usage.BaselineScore.Value;
                // Assume MCID of 10 points for this analysis (would be calculated per PROM type in practice)
                var mcidThreshold = 10m;
                var objectiveSuccess = change >= mcidThreshold;
                var subjectiveSuccess = followUp.PerceivedSuccess.Value;

                string category;
                if (objectiveSuccess && subjectiveSuccess)
                    category = "Concordant Success";
                else if (!objectiveSuccess && !subjectiveSuccess)
                    category = "Concordant Non-Success";
                else if (objectiveSuccess && !subjectiveSuccess)
                    category = "Discordant: Objective Success, Subjective Failure";
                else
                    category = "Discordant: Objective Failure, Subjective Success";

                analysisData.Add(new DiscordanceData
                {
                    PatientId = usage.PatientId,
                    BaselineScore = usage.BaselineScore.Value,
                    FollowUpScore = followUp.Score.Value,
                    Change = change,
                    ObjectiveSuccess = objectiveSuccess,
                    SubjectiveSuccess = subjectiveSuccess,
                    Category = category
                });
            }

            if (analysisData.Count < K_ANONYMITY_THRESHOLD)
            {
                results.Add(new DeviceDiscordanceAnalysis
                {
                    DeviceId = devId,
                    DeviceName = device.Name,
                    DeviceCode = device.DeviceCode,
                    PatientCount = analysisData.Count,
                    SuppressedDueToPrivacy = true
                });
                continue;
            }

            var total = analysisData.Count;
            results.Add(new DeviceDiscordanceAnalysis
            {
                DeviceId = devId,
                DeviceName = device.Name,
                DeviceCode = device.DeviceCode,
                PatientCount = total,
                SuppressedDueToPrivacy = false,
                ConcordantSuccessCount = analysisData.Count(d => d.Category == "Concordant Success"),
                ConcordantSuccessRate = (decimal)analysisData.Count(d => d.Category == "Concordant Success") / total * 100,
                ConcordantNonSuccessCount = analysisData.Count(d => d.Category == "Concordant Non-Success"),
                ConcordantNonSuccessRate = (decimal)analysisData.Count(d => d.Category == "Concordant Non-Success") / total * 100,
                DiscordantObjectiveSuccessCount = analysisData.Count(d => d.Category.Contains("Objective Success, Subjective Failure")),
                DiscordantObjectiveSuccessRate = (decimal)analysisData.Count(d => d.Category.Contains("Objective Success, Subjective Failure")) / total * 100,
                DiscordantSubjectiveSuccessCount = analysisData.Count(d => d.Category.Contains("Objective Failure, Subjective Success")),
                DiscordantSubjectiveSuccessRate = (decimal)analysisData.Count(d => d.Category.Contains("Objective Failure, Subjective Success")) / total * 100,
                TotalDiscordanceRate = (decimal)analysisData.Count(d => d.Category.Contains("Discordant")) / total * 100
            });
        }

        return Ok(new { devices = results });
    }

    /// <summary>
    /// Get cohort analytics - enrollment stats, compliance rates, follow-up completion
    /// </summary>
    [HttpGet("cohort-analytics")]
    public async Task<IActionResult> GetCohortAnalytics()
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var deviceIds = await _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId.Value && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync();

        // Get all device usages for partner's devices
        var usages = await _db.Set<PatientDeviceUsage>()
            .Where(u => deviceIds.Contains(u.DeviceId))
            .ToListAsync();

        var totalPatients = usages.Select(u => u.PatientId).Distinct().Count();
        var patientsWithBaseline = usages.Count(u => u.BaselineScore.HasValue);
        var baselineRate = totalPatients > 0 ? (decimal)patientsWithBaseline / totalPatients * 100 : 0;

        // Get follow-up completion by time interval
        var patientIds = usages.Select(u => u.PatientId).Distinct().ToList();

        var followUps = await _db.Set<PromInstance>()
            .Where(p => patientIds.Contains(p.PatientId))
            .Where(p => p.InstanceType == PromInstanceType.FollowUp ||
                       p.InstanceType == PromInstanceType.FinalOutcome)
            .ToListAsync();

        var followUpByWeek = followUps
            .Where(f => f.WeeksPostProcedure.HasValue)
            .GroupBy(f => f.WeeksPostProcedure!.Value)
            .Select(g => new FollowUpInterval
            {
                WeeksPostProcedure = g.Key,
                TotalScheduled = g.Count(),
                Completed = g.Count(f => f.Status == PromStatus.Completed),
                CompletionRate = g.Any() ? (decimal)g.Count(f => f.Status == PromStatus.Completed) / g.Count() * 100 : 0,
                WithPerceptionData = g.Count(f => f.Status == PromStatus.Completed &&
                    (f.GlobalPerceivedEffect.HasValue || f.PerceivedSuccess.HasValue))
            })
            .OrderBy(f => f.WeeksPostProcedure)
            .ToList();

        // Monthly enrollment trend
        var monthlyEnrollment = usages
            .GroupBy(u => new { u.ProcedureDate.Year, u.ProcedureDate.Month })
            .Select(g => new MonthlyEnrollment
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                NewPatients = g.Select(u => u.PatientId).Distinct().Count(),
                Procedures = g.Count()
            })
            .OrderBy(m => m.Year)
            .ThenBy(m => m.Month)
            .ToList();

        // Device breakdown
        var deviceBreakdown = await _db.Set<MedicalDevice>()
            .Where(d => deviceIds.Contains(d.Id))
            .Select(d => new DeviceEnrollment
            {
                DeviceId = d.Id,
                DeviceName = d.Name,
                DeviceCode = d.DeviceCode,
                PatientCount = d.UsageRecords.Select(u => u.PatientId).Distinct().Count(),
                ProcedureCount = d.UsageRecords.Count(),
                WithBaseline = d.UsageRecords.Count(u => u.BaselineScore.HasValue)
            })
            .ToListAsync();

        return Ok(new CohortAnalyticsResponse
        {
            TotalPatients = totalPatients,
            TotalProcedures = usages.Count,
            PatientsWithBaseline = patientsWithBaseline,
            BaselineCompletionRate = baselineRate,
            FollowUpIntervals = followUpByWeek,
            MonthlyEnrollment = monthlyEnrollment,
            DeviceBreakdown = deviceBreakdown
        });
    }

    /// <summary>
    /// Get recovery timeline benchmarks showing expected score trajectories
    /// </summary>
    [HttpGet("recovery-timeline/{deviceId}")]
    public async Task<IActionResult> GetRecoveryTimeline(Guid deviceId, [FromQuery] string promType = "ODI")
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var device = await _db.Set<MedicalDevice>()
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.PartnerId == partnerId.Value);

        if (device == null)
            return NotFound(new { error = "Device not found" });

        // Get all follow-up data points grouped by weeks post-procedure
        var usages = await _db.Set<PatientDeviceUsage>()
            .Where(u => u.DeviceId == deviceId && u.BaselinePromType == promType && u.BaselineScore.HasValue)
            .ToListAsync();

        var patientIds = usages.Select(u => u.PatientId).Distinct().ToList();

        if (patientIds.Count < K_ANONYMITY_THRESHOLD)
        {
            return Ok(new RecoveryTimelineResponse
            {
                DeviceId = deviceId,
                DeviceName = device.Name,
                PromType = promType,
                SuppressedDueToPrivacy = true,
                PatientCount = patientIds.Count
            });
        }

        var followUps = await _db.Set<PromInstance>()
            .Include(p => p.Template)
            .Where(p => patientIds.Contains(p.PatientId))
            .Where(p => p.Template != null && p.Template.Key == promType)
            .Where(p => p.Status == PromStatus.Completed && p.Score.HasValue)
            .Where(p => p.WeeksPostProcedure.HasValue)
            .ToListAsync();

        // Calculate baseline stats
        var baselineScores = usages.Where(u => u.BaselineScore.HasValue).Select(u => u.BaselineScore!.Value).ToList();
        var avgBaseline = baselineScores.Average();

        // Group by week intervals and calculate percentiles
        var weeklyData = followUps
            .GroupBy(f => f.WeeksPostProcedure!.Value)
            .Where(g => g.Count() >= K_ANONYMITY_THRESHOLD)
            .Select(g => {
                var scores = g.Select(f => f.Score!.Value).OrderBy(s => s).ToList();
                return new RecoveryDataPoint
                {
                    WeeksPostProcedure = g.Key,
                    PatientCount = g.Count(),
                    AverageScore = scores.Average(),
                    MedianScore = scores[scores.Count / 2],
                    Percentile25 = scores[(int)(scores.Count * 0.25)],
                    Percentile75 = scores[(int)(scores.Count * 0.75)],
                    MinScore = scores.Min(),
                    MaxScore = scores.Max(),
                    AverageChangeFromBaseline = scores.Average() - avgBaseline
                };
            })
            .OrderBy(d => d.WeeksPostProcedure)
            .ToList();

        // Add baseline as week 0
        var baselinePoint = new RecoveryDataPoint
        {
            WeeksPostProcedure = 0,
            PatientCount = baselineScores.Count,
            AverageScore = avgBaseline,
            MedianScore = baselineScores.OrderBy(s => s).ToList()[baselineScores.Count / 2],
            Percentile25 = baselineScores.OrderBy(s => s).ToList()[(int)(baselineScores.Count * 0.25)],
            Percentile75 = baselineScores.OrderBy(s => s).ToList()[(int)(baselineScores.Count * 0.75)],
            MinScore = baselineScores.Min(),
            MaxScore = baselineScores.Max(),
            AverageChangeFromBaseline = 0
        };

        weeklyData.Insert(0, baselinePoint);

        return Ok(new RecoveryTimelineResponse
        {
            DeviceId = deviceId,
            DeviceName = device.Name,
            PromType = promType,
            SuppressedDueToPrivacy = false,
            PatientCount = patientIds.Count,
            DataPoints = weeklyData
        });
    }

    /// <summary>
    /// Get demographic stratification of outcomes by age, gender, and region
    /// Enables subgroup analysis for research publications
    /// </summary>
    [HttpGet("demographics")]
    public async Task<IActionResult> GetDemographicStratification([FromQuery] Guid? deviceId = null)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null)
            return Unauthorized(new { message = "Partner authentication required" });

        var deviceIds = await _db.Set<MedicalDevice>()
            .Where(d => d.PartnerId == partnerId.Value && d.IsActive)
            .Where(d => deviceId == null || d.Id == deviceId)
            .Select(d => d.Id)
            .ToListAsync();

        // Get device usages with baseline scores
        var usages = await _db.Set<PatientDeviceUsage>()
            .Include(u => u.Device)
            .Where(u => deviceIds.Contains(u.DeviceId))
            .Where(u => u.BaselineScore.HasValue)
            .ToListAsync();

        // Get patient IDs from usages
        var patientUserIds = usages.Select(u => u.PatientId).Distinct().ToList();

        // Get patients by their UserId (which links to PatientDeviceUsage.PatientId)
        var patients = await _db.Set<Patient>()
            .Where(p => patientUserIds.Contains(p.UserId))
            .ToListAsync();

        var patientDict = patients.ToDictionary(p => p.UserId);

        // Get follow-up scores for each patient
        var followUpPromData = await _db.Set<PromInstance>()
            .Where(p => patientUserIds.Contains(p.PatientId))
            .Where(p => p.Status == PromStatus.Completed && p.Score.HasValue)
            .Where(p => p.InstanceType == PromInstanceType.FollowUp || p.InstanceType == PromInstanceType.FinalOutcome)
            .GroupBy(p => p.PatientId)
            .Select(g => new { PatientId = g.Key, LatestScore = g.OrderByDescending(p => p.CompletedAt).First().Score })
            .ToListAsync();

        var followUpDict = followUpPromData.ToDictionary(p => p.PatientId, p => p.LatestScore);

        // Build combined usage data with demographics
        var usageData = usages
            .Where(u => patientDict.ContainsKey(u.PatientId))
            .Select(u => {
                var patient = patientDict[u.PatientId];
                return new {
                    u.PatientId,
                    u.DeviceId,
                    DeviceName = u.Device?.Name ?? "Unknown",
                    DeviceCode = u.Device?.DeviceCode ?? "",
                    u.BaselineScore,
                    LatestFollowUpScore = followUpDict.GetValueOrDefault(u.PatientId),
                    PatientDob = patient.DateOfBirth,
                    PatientGender = patient.Gender,
                    PatientState = patient.State
                };
            })
            .ToList();

        var totalPatients = usageData.Select(u => u.PatientId).Distinct().Count();

        // Age group stratification
        var ageGroups = new List<DemographicSubgroup>();
        var ageRanges = new[] { (0, 30, "Under 30"), (30, 45, "30-44"), (45, 60, "45-59"), (60, 75, "60-74"), (75, 200, "75+") };

        foreach (var (minAge, maxAge, label) in ageRanges)
        {
            var groupData = usageData
                .Where(u => {
                    var age = DateTime.Today.Year - u.PatientDob.Year;
                    if (u.PatientDob.Date > DateTime.Today.AddYears(-age)) age--;
                    return age >= minAge && age < maxAge;
                })
                .ToList();

            var patientCount = groupData.Select(u => u.PatientId).Distinct().Count();
            if (patientCount < K_ANONYMITY_THRESHOLD)
            {
                ageGroups.Add(new DemographicSubgroup
                {
                    Label = label,
                    PatientCount = patientCount,
                    SuppressedDueToPrivacy = true
                });
                continue;
            }

            var baselines = groupData.Where(u => u.BaselineScore.HasValue).Select(u => u.BaselineScore!.Value).ToList();
            var followUps = groupData.Where(u => u.LatestFollowUpScore.HasValue).Select(u => u.LatestFollowUpScore!.Value).ToList();
            var changes = groupData
                .Where(u => u.BaselineScore.HasValue && u.LatestFollowUpScore.HasValue)
                .Select(u => u.LatestFollowUpScore!.Value - u.BaselineScore!.Value)
                .ToList();

            ageGroups.Add(new DemographicSubgroup
            {
                Label = label,
                PatientCount = patientCount,
                SuppressedDueToPrivacy = false,
                AverageBaselineScore = baselines.Any() ? baselines.Average() : null,
                AverageFollowUpScore = followUps.Any() ? followUps.Average() : null,
                AverageChange = changes.Any() ? changes.Average() : null,
                ResponderRate = changes.Any() ? (decimal)changes.Count(c => c < -10) / changes.Count * 100 : null
            });
        }

        // Gender stratification
        var genderGroups = new List<DemographicSubgroup>();
        var genders = new[] { "Male", "Female", "Other" };

        foreach (var gender in genders)
        {
            var groupData = usageData
                .Where(u => u.PatientGender.Equals(gender, StringComparison.OrdinalIgnoreCase) ||
                           (gender == "Other" && !genders.Take(2).Any(g => u.PatientGender.Equals(g, StringComparison.OrdinalIgnoreCase))))
                .ToList();

            var patientCount = groupData.Select(u => u.PatientId).Distinct().Count();
            if (patientCount < K_ANONYMITY_THRESHOLD)
            {
                if (patientCount > 0)
                {
                    genderGroups.Add(new DemographicSubgroup
                    {
                        Label = gender,
                        PatientCount = patientCount,
                        SuppressedDueToPrivacy = true
                    });
                }
                continue;
            }

            var baselines = groupData.Where(u => u.BaselineScore.HasValue).Select(u => u.BaselineScore!.Value).ToList();
            var followUps = groupData.Where(u => u.LatestFollowUpScore.HasValue).Select(u => u.LatestFollowUpScore!.Value).ToList();
            var changes = groupData
                .Where(u => u.BaselineScore.HasValue && u.LatestFollowUpScore.HasValue)
                .Select(u => u.LatestFollowUpScore!.Value - u.BaselineScore!.Value)
                .ToList();

            genderGroups.Add(new DemographicSubgroup
            {
                Label = gender,
                PatientCount = patientCount,
                SuppressedDueToPrivacy = false,
                AverageBaselineScore = baselines.Any() ? baselines.Average() : null,
                AverageFollowUpScore = followUps.Any() ? followUps.Average() : null,
                AverageChange = changes.Any() ? changes.Average() : null,
                ResponderRate = changes.Any() ? (decimal)changes.Count(c => c < -10) / changes.Count * 100 : null
            });
        }

        // Geographic stratification (by state)
        var stateGroups = new List<DemographicSubgroup>();
        var states = usageData.Select(u => u.PatientState).Where(s => !string.IsNullOrEmpty(s)).Distinct().ToList();

        foreach (var state in states)
        {
            var groupData = usageData.Where(u => u.PatientState == state).ToList();
            var patientCount = groupData.Select(u => u.PatientId).Distinct().Count();

            if (patientCount < K_ANONYMITY_THRESHOLD)
            {
                stateGroups.Add(new DemographicSubgroup
                {
                    Label = state,
                    PatientCount = patientCount,
                    SuppressedDueToPrivacy = true
                });
                continue;
            }

            var baselines = groupData.Where(u => u.BaselineScore.HasValue).Select(u => u.BaselineScore!.Value).ToList();
            var followUps = groupData.Where(u => u.LatestFollowUpScore.HasValue).Select(u => u.LatestFollowUpScore!.Value).ToList();
            var changes = groupData
                .Where(u => u.BaselineScore.HasValue && u.LatestFollowUpScore.HasValue)
                .Select(u => u.LatestFollowUpScore!.Value - u.BaselineScore!.Value)
                .ToList();

            stateGroups.Add(new DemographicSubgroup
            {
                Label = state,
                PatientCount = patientCount,
                SuppressedDueToPrivacy = false,
                AverageBaselineScore = baselines.Any() ? baselines.Average() : null,
                AverageFollowUpScore = followUps.Any() ? followUps.Average() : null,
                AverageChange = changes.Any() ? changes.Average() : null,
                ResponderRate = changes.Any() ? (decimal)changes.Count(c => c < -10) / changes.Count * 100 : null
            });
        }

        // Device breakdown with demographics
        var deviceBreakdown = new List<DeviceDemographicBreakdown>();
        foreach (var devId in deviceIds)
        {
            var deviceData = usageData.Where(u => u.DeviceId == devId).ToList();
            var device = deviceData.FirstOrDefault();
            if (device == null) continue;

            var patientCount = deviceData.Select(u => u.PatientId).Distinct().Count();
            if (patientCount < K_ANONYMITY_THRESHOLD)
            {
                deviceBreakdown.Add(new DeviceDemographicBreakdown
                {
                    DeviceId = devId,
                    DeviceName = device.DeviceName,
                    DeviceCode = device.DeviceCode,
                    PatientCount = patientCount,
                    SuppressedDueToPrivacy = true
                });
                continue;
            }

            var ages = deviceData.Select(u => {
                var age = DateTime.Today.Year - u.PatientDob.Year;
                if (u.PatientDob.Date > DateTime.Today.AddYears(-age)) age--;
                return age;
            }).ToList();

            deviceBreakdown.Add(new DeviceDemographicBreakdown
            {
                DeviceId = devId,
                DeviceName = device.DeviceName,
                DeviceCode = device.DeviceCode,
                PatientCount = patientCount,
                SuppressedDueToPrivacy = false,
                AverageAge = ages.Average(),
                MalePercent = (decimal)deviceData.Count(u => u.PatientGender.Equals("Male", StringComparison.OrdinalIgnoreCase)) / patientCount * 100,
                FemalePercent = (decimal)deviceData.Count(u => u.PatientGender.Equals("Female", StringComparison.OrdinalIgnoreCase)) / patientCount * 100
            });
        }

        return Ok(new DemographicStratificationResponse
        {
            TotalPatients = totalPatients,
            AgeGroups = ageGroups,
            GenderGroups = genderGroups,
            GeographicGroups = stateGroups.OrderByDescending(s => s.PatientCount).ToList(),
            DeviceBreakdown = deviceBreakdown
        });
    }
}

// DTOs
public class DevicePerceptionMetrics
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public bool SuppressedDueToPrivacy { get; set; }
    public GpeDistribution? GpeDistribution { get; set; }
    public decimal? PassRate { get; set; }
    public int PassResponses { get; set; }
    public decimal? AverageSatisfaction { get; set; }
    public int SatisfactionResponses { get; set; }
    public decimal? PerceivedSuccessRate { get; set; }
    public int SuccessResponses { get; set; }
    public decimal? AverageExpectationMatch { get; set; }
    public int ExpectationResponses { get; set; }
    public decimal? NetPromoterScore { get; set; }
    public int NpsResponses { get; set; }
}

public class GpeDistribution
{
    public int VeryMuchWorse { get; set; }
    public int MuchWorse { get; set; }
    public int SlightlyWorse { get; set; }
    public int NoChange { get; set; }
    public int SlightlyBetter { get; set; }
    public int MuchBetter { get; set; }
    public int VeryMuchBetter { get; set; }
    public decimal? AverageGpe { get; set; }
    public int TotalResponses { get; set; }
}

public class DeviceMcidAnalysis
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public bool SuppressedDueToPrivacy { get; set; }
    public List<PromTypeMcid> McidByPromType { get; set; } = new();
}

public class PromTypeMcid
{
    public string PromType { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public decimal AverageBaselineScore { get; set; }
    public decimal AverageFollowUpScore { get; set; }
    public decimal AverageChange { get; set; }
    public decimal AveragePercentChange { get; set; }
    public decimal? TraditionalMcid { get; set; }
    public decimal? PatientCenteredMcid { get; set; }
    public decimal ResponderRate { get; set; }
    public int RespondersCount { get; set; }
}

public class ChangeScoreData
{
    public Guid PatientId { get; set; }
    public decimal BaselineScore { get; set; }
    public decimal FollowUpScore { get; set; }
    public decimal Change { get; set; }
    public decimal PercentChange { get; set; }
    public bool? PerceivedSuccess { get; set; }
    public bool? PassAchieved { get; set; }
}

public class DeviceDiscordanceAnalysis
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public bool SuppressedDueToPrivacy { get; set; }
    public int ConcordantSuccessCount { get; set; }
    public decimal ConcordantSuccessRate { get; set; }
    public int ConcordantNonSuccessCount { get; set; }
    public decimal ConcordantNonSuccessRate { get; set; }
    public int DiscordantObjectiveSuccessCount { get; set; }
    public decimal DiscordantObjectiveSuccessRate { get; set; }
    public int DiscordantSubjectiveSuccessCount { get; set; }
    public decimal DiscordantSubjectiveSuccessRate { get; set; }
    public decimal TotalDiscordanceRate { get; set; }
}

public class DiscordanceData
{
    public Guid PatientId { get; set; }
    public decimal BaselineScore { get; set; }
    public decimal FollowUpScore { get; set; }
    public decimal Change { get; set; }
    public bool ObjectiveSuccess { get; set; }
    public bool SubjectiveSuccess { get; set; }
    public string Category { get; set; } = string.Empty;
}

public class CohortAnalyticsResponse
{
    public int TotalPatients { get; set; }
    public int TotalProcedures { get; set; }
    public int PatientsWithBaseline { get; set; }
    public decimal BaselineCompletionRate { get; set; }
    public List<FollowUpInterval> FollowUpIntervals { get; set; } = new();
    public List<MonthlyEnrollment> MonthlyEnrollment { get; set; } = new();
    public List<DeviceEnrollment> DeviceBreakdown { get; set; } = new();
}

public class FollowUpInterval
{
    public int WeeksPostProcedure { get; set; }
    public int TotalScheduled { get; set; }
    public int Completed { get; set; }
    public decimal CompletionRate { get; set; }
    public int WithPerceptionData { get; set; }
}

public class MonthlyEnrollment
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int NewPatients { get; set; }
    public int Procedures { get; set; }
}

public class DeviceEnrollment
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public int ProcedureCount { get; set; }
    public int WithBaseline { get; set; }
}

public class RecoveryTimelineResponse
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string PromType { get; set; } = string.Empty;
    public bool SuppressedDueToPrivacy { get; set; }
    public int PatientCount { get; set; }
    public List<RecoveryDataPoint> DataPoints { get; set; } = new();
}

public class RecoveryDataPoint
{
    public int WeeksPostProcedure { get; set; }
    public int PatientCount { get; set; }
    public decimal AverageScore { get; set; }
    public decimal MedianScore { get; set; }
    public decimal Percentile25 { get; set; }
    public decimal Percentile75 { get; set; }
    public decimal MinScore { get; set; }
    public decimal MaxScore { get; set; }
    public decimal AverageChangeFromBaseline { get; set; }
}

// Demographic stratification DTOs
public class DemographicStratificationResponse
{
    public int TotalPatients { get; set; }
    public List<DemographicSubgroup> AgeGroups { get; set; } = new();
    public List<DemographicSubgroup> GenderGroups { get; set; } = new();
    public List<DemographicSubgroup> GeographicGroups { get; set; } = new();
    public List<DeviceDemographicBreakdown> DeviceBreakdown { get; set; } = new();
}

public class DemographicSubgroup
{
    public string Label { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public bool SuppressedDueToPrivacy { get; set; }
    public decimal? AverageBaselineScore { get; set; }
    public decimal? AverageFollowUpScore { get; set; }
    public decimal? AverageChange { get; set; }
    public decimal? ResponderRate { get; set; }
}

public class DeviceDemographicBreakdown
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public bool SuppressedDueToPrivacy { get; set; }
    public double? AverageAge { get; set; }
    public decimal? MalePercent { get; set; }
    public decimal? FemalePercent { get; set; }
}
