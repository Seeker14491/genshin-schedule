using Discord;
using Discord.WebSocket;

namespace GenshinSchedule.SyncServer.Discord;

/// <summary>
/// Runs the Discord bot if <c>Discord:Token</c> is configured.
/// </summary>
public class DiscordService(IConfiguration configuration, CommandHandler commands, NotificationService notification, ILogger<DiscordService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var token = configuration["Discord:Token"];

        if (string.IsNullOrEmpty(token))
            return;

        await commands.InitializeAsync();

        var client = new DiscordShardedClient(new DiscordSocketConfig
        {
            GatewayIntents   = GatewayIntents.AllUnprivileged,
            LogLevel         = LogSeverity.Debug,
            LargeThreshold   = 0,
            MessageCacheSize = 0
        });

        client.Log += log =>
        {
            logger.Log(ConvertLogLevel(log.Severity), log.Exception, "{Message}", log.Message);
            return Task.CompletedTask;
        };

        client.MessageReceived += message =>
        {
            if (message is IUserMessage userMessage)
                _ = Task.Run(() => commands.HandleAsync(client, userMessage), stoppingToken);

            return Task.CompletedTask;
        };

        await client.LoginAsync(TokenType.Bot, token);
        await client.StartAsync();

        await client.SetGameAsync("with travelers");

        try
        {
            if (bool.TryParse(configuration["Discord:DisableNotifications"], out var disableNotifications) && disableNotifications)
                await Task.Delay(Timeout.Infinite, stoppingToken);
            else
                await notification.RunAsync(client, stoppingToken);
        }
        catch (OperationCanceledException) { }
        finally
        {
            await client.StopAsync();
        }
    }

    public static LogLevel ConvertLogLevel(LogSeverity level) => level switch
    {
        LogSeverity.Verbose  => LogLevel.Debug,
        LogSeverity.Info     => LogLevel.Information,
        LogSeverity.Warning  => LogLevel.Warning,
        LogSeverity.Error    => LogLevel.Error,
        LogSeverity.Critical => LogLevel.Critical,
        _                    => LogLevel.Trace
    };
}
