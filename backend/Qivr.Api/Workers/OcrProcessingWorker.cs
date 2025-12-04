using Qivr.Services;

namespace Qivr.Api.Workers;

/// <summary>
/// Background worker that processes OCR jobs from the database queue
/// </summary>
public class OcrProcessingWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OcrProcessingWorker> _logger;
    private readonly IConfiguration _configuration;

    // Worker settings
    private readonly TimeSpan _pollingInterval;
    private readonly TimeSpan _idleInterval;
    private readonly int _batchSize;

    public OcrProcessingWorker(
        IServiceProvider serviceProvider,
        ILogger<OcrProcessingWorker> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;

        // Read configuration with defaults
        _pollingInterval = TimeSpan.FromSeconds(
            configuration.GetValue("OCR:PollingIntervalSeconds", 5));
        _idleInterval = TimeSpan.FromSeconds(
            configuration.GetValue("OCR:IdleIntervalSeconds", 30));
        _batchSize = configuration.GetValue("OCR:BatchSize", 5);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OCR Processing Worker starting. Polling: {Polling}s, Idle: {Idle}s, Batch: {Batch}",
            _pollingInterval.TotalSeconds, _idleInterval.TotalSeconds, _batchSize);

        // Initial delay to let the application start up
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var processedCount = await ProcessBatchAsync(stoppingToken);

                // If we processed jobs, check again quickly; otherwise wait longer
                var delay = processedCount > 0 ? _pollingInterval : _idleInterval;
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Graceful shutdown
                break;
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("ConnectionString"))
            {
                _logger.LogWarning("OCR Processing Worker skipped - database not configured");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OCR Processing Worker");
                await Task.Delay(_idleInterval, stoppingToken);
            }
        }

        _logger.LogInformation("OCR Processing Worker stopping");
    }

    private async Task<int> ProcessBatchAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var ocrService = scope.ServiceProvider.GetRequiredService<IResilientOcrService>();

        var processedCount = 0;

        for (int i = 0; i < _batchSize && !ct.IsCancellationRequested; i++)
        {
            var processed = await ocrService.ProcessNextJobAsync(ct);
            if (!processed)
            {
                break; // No more jobs
            }
            processedCount++;
        }

        if (processedCount > 0)
        {
            _logger.LogDebug("Processed {Count} OCR jobs in this batch", processedCount);
        }

        return processedCount;
    }

    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var ocrService = scope.ServiceProvider.GetRequiredService<IResilientOcrService>();
            var pendingCount = await ocrService.GetPendingJobCountAsync(cancellationToken);
            _logger.LogInformation("OCR Processing Worker found {Count} pending jobs on startup", pendingCount);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("ConnectionString"))
        {
            _logger.LogWarning("OCR Processing Worker skipping startup check - database not configured");
        }

        await base.StartAsync(cancellationToken);
    }
}
