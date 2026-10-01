using System.Text.RegularExpressions;
using Discord;
using Discord.Commands;
using GenshinSchedule.SyncServer.Database;
using Microsoft.EntityFrameworkCore;

namespace GenshinSchedule.SyncServer.Discord.Modules;

public partial class ToggleModule(AuthHelper auth, SyncDbContext db) : ModuleBase
{
    // the web app tells users to send "enable ||token||" so that the token is hidden as a spoiler
    [GeneratedRegex(@"^\|\|(?<token>.*)\|\|$", RegexOptions.Singleline)]
    private static partial Regex TokenRegex();

    [Command("enable")]
    public async Task EnableAsync([Remainder] string arg)
    {
        if (auth.TryValidateToken(TokenRegex().Match(arg).Groups["token"].Value, out var payload))
        {
            var user = await db.Users.AsTracking().FirstOrDefaultAsync(u => u.Id == payload.Id);

            if (user != null)
            {
                user.DiscordUserId = Context.User.Id;

                await db.SaveChangesAsync();

                await Context.Message.AddReactionAsync(new Emoji("✅"));
                await ReplyAsync("Success. Future notifications will be sent to you via DM!");

                return;
            }
        }

        await ReplyAsync("Token is invalid. Please refer to <https://genshin.seekr.pw/home/notifications> for help!");
    }

    [Command("disable")]
    public async Task DisableAsync()
    {
        var user = await db.Users.AsTracking().FirstOrDefaultAsync(u => u.DiscordUserId == Context.User.Id);

        if (user == null)
        {
            await ReplyAsync("Notifications are not enabled for you.");
        }
        else
        {
            user.DiscordUserId = null;

            await db.SaveChangesAsync();

            await Context.Message.AddReactionAsync(new Emoji("✅"));
            await ReplyAsync("Success. Paimon won't send you notifications anymore :(");
        }
    }
}
