using Discord;
using Discord.Commands;
using Discord.WebSocket;
using GenshinSchedule.SyncServer.Discord.Modules;

namespace GenshinSchedule.SyncServer.Discord;

/// <summary>
/// Executes text commands sent to the bot via DM.
/// </summary>
public class CommandHandler
{
    readonly IServiceProvider _services;
    readonly CommandService _commands;

    public CommandHandler(IServiceProvider services, ILogger<CommandHandler> logger)
    {
        _services = services;

        _commands = new CommandService(new CommandServiceConfig
        {
            LogLevel        = LogSeverity.Debug,
            IgnoreExtraArgs = true
        });

        _commands.Log += log =>
        {
            logger.Log(DiscordService.ConvertLogLevel(log.Severity), log.Exception, "{Message}", log.Message);
            return Task.CompletedTask;
        };
    }

    public async Task InitializeAsync()
    {
        using var scope = _services.CreateScope();

        await _commands.AddModuleAsync<ToggleModule>(scope.ServiceProvider);
    }

    public async Task HandleAsync(DiscordShardedClient client, IUserMessage message)
    {
        if (message.Channel is not IDMChannel)
            return;

        if (message.Author.IsBot || message.Author.IsWebhook)
            return;

        using var scope = _services.CreateScope();

        await _commands.ExecuteAsync(new CommandContext(client, message), 0, scope.ServiceProvider);
    }
}
