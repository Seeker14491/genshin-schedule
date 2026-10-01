using System.Globalization;
using Discord;
using Discord.WebSocket;
using GenshinSchedule.SyncServer.Database;
using Microsoft.EntityFrameworkCore;

namespace GenshinSchedule.SyncServer.Discord;

/// <summary>
/// Polls the notification queue and delivers due notifications to users via DM.
/// </summary>
public class NotificationService(IServiceProvider services, ILogger<NotificationService> logger)
{
    public async Task RunAsync(DiscordShardedClient client, CancellationToken cancellationToken = default)
    {
        var delay = new AccurateDelay(TimeSpan.FromSeconds(5));

        while (!cancellationToken.IsCancellationRequested)
        {
            await using (var scope = services.CreateAsyncScope())
            {
                try
                {
                    await NotifyAsync(client, scope.ServiceProvider.GetRequiredService<SyncDbContext>(), cancellationToken);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    logger.LogWarning(e, "Could not send notifications.");
                }
            }

            await delay.DelayAsync(cancellationToken);
        }
    }

    async Task NotifyAsync(DiscordShardedClient client, SyncDbContext db, CancellationToken cancellationToken)
    {
        var time = DateTimeOffset.UtcNow;

        while (true)
        {
            var notifications = await db.Notifications.Include(n => n.User).Where(n => n.Time <= time).OrderBy(n => n.Time).Take(50).ToListAsync(cancellationToken);

            if (notifications.Count == 0)
                break;

            await Task.WhenAll(notifications.Select(async notification =>
            {
                try
                {
                    await SendAsync(client, notification);
                }
                catch (Exception e)
                {
                    logger.LogWarning(e, "Could not send notification '{Key}' to user {DiscordUserId}.", notification.Key, notification.User?.DiscordUserId);
                }
            }));

            db.RemoveRange(notifications);

            await db.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Removed {Count} notifications from queue.", notifications.Count);
        }
    }

    async Task SendAsync(DiscordShardedClient client, DbNotification notification)
    {
        var recipientId = notification.User?.DiscordUserId;

        if (recipientId == null)
            return;

        // use rest to retrieve user because users are not cached in sharded clients
        var recipient = await client.Rest.GetUserAsync(recipientId.Value);

        if (recipient == null)
        {
            logger.LogWarning("Recipient user {DiscordUserId} not found.", recipientId);
            return;
        }

        await recipient.SendMessageAsync("", embed: new EmbedBuilder
        {
            Author = new EmbedAuthorBuilder
            {
                Name    = notification.Title,
                Url     = notification.Url,
                IconUrl = notification.Icon
            },
            Description = notification.Description,

            Color = uint.TryParse(notification.Color?.TrimStart('#'), NumberStyles.HexNumber, null, out var c) ? new Color(c) : null
        }.Build());

        logger.LogInformation("Successfully sent notification '{Key}' to user {DiscordUserId}.", notification.Key, recipient.Id);
    }
}
