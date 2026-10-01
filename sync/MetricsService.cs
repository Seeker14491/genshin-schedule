using Prometheus;
using Prometheus.DotNetRuntime;

namespace GenshinSchedule.SyncServer;

/// <summary>
/// Publishes Prometheus metrics on a separate port. Only registered in production.
/// </summary>
public class MetricsService(ILogger<MetricsService> logger) : BackgroundService
{
    public const int Port = 9802;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var runtimeStats = DotNetRuntimeStatsBuilder.Default().StartCollecting();
        using var server = new KestrelMetricServer(Port);

        logger.LogInformation("Publishing Prometheus metrics on port {Port}.", Port);

        server.Start();

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException) { }
        finally
        {
            await server.StopAsync();
        }
    }
}
