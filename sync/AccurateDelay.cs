using System.Diagnostics;

namespace GenshinSchedule.SyncServer;

/// <summary>
/// Delays until a fixed interval has elapsed since the previous delay, accounting for time spent doing work in between.
/// </summary>
public sealed class AccurateDelay(TimeSpan interval)
{
    readonly Stopwatch _watch = Stopwatch.StartNew();

    public async Task DelayAsync(CancellationToken cancellationToken = default)
    {
        var delay = interval - _watch.Elapsed;

        if (delay > TimeSpan.Zero)
            await Task.Delay(delay, cancellationToken);

        _watch.Restart();
    }
}
