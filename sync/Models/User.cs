using GenshinSchedule.SyncServer.Database;

namespace GenshinSchedule.SyncServer.Models;

public class User
{
    public string? Username { get; set; }

    // serialized as a string because Discord snowflakes don't fit in a JavaScript number
    public string? DiscordUserId { get; set; }

    public static User FromDbModel(DbUser user) => new()
    {
        Username      = user.Username,
        DiscordUserId = user.DiscordUserId?.ToString()
    };
}
