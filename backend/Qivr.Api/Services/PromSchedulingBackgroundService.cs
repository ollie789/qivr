namespace Qivr.Api.Services;

public class PromSchedulingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PromSchedulingBackgroundService> _logger;

    public PromSchedulingBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<PromSchedulingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PROM Scheduling Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var schedulingService = scope.ServiceProvider.GetRequiredService<IPromSchedulingService>();
                
                await schedulingService.CheckAndCreateDueProms();
                
                _logger.LogInformation("PROM scheduling check completed at {Time}", DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in PROM scheduling background service");
            }

            // Run once per day at 2 AM
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
