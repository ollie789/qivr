namespace Qivr.Api.Options;

public sealed class FeaturesOptions
{
    public bool ProcessIntakeQueue { get; set; } = false;
    public bool EnableAiAnalysis { get; set; } = false;
    public bool SendEmailNotifications { get; set; } = false;
    public bool EnableAsyncProcessing { get; set; } = true;
}
