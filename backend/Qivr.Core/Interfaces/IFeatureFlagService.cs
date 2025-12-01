namespace Qivr.Core.Interfaces;

public interface IFeatureFlagService
{
    Task<bool> IsEnabledAsync(Guid tenantId, string feature, CancellationToken ct = default);
    Task<Dictionary<string, bool>> GetAllFlagsAsync(Guid tenantId, CancellationToken ct = default);
}

public static class Features
{
    public const string AiTriage = "aiTriage";
    public const string AiTreatmentPlans = "aiTreatmentPlans";
    public const string DocumentOcr = "documentOcr";
    public const string SmsReminders = "smsReminders";
    public const string ApiAccess = "apiAccess";
    public const string CustomBranding = "customBranding";
    public const string HipaaAuditLogs = "hipaaAuditLogs";
}
