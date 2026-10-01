using GenshinSchedule.SyncServer.Database;

namespace GenshinSchedule.SyncServer.Models;

public class Notification
{
    public string? Key { get; set; }
    public long Time { get; set; }
    public string? Icon { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? Color { get; set; }

    public static Notification FromDbModel(DbNotification notification) => new()
    {
        Key         = notification.Key,
        Time        = notification.Time.ToUnixTimeMilliseconds(),
        Icon        = notification.Icon,
        Title       = notification.Title,
        Description = notification.Description,
        Url         = notification.Url,
        Color       = notification.Color
    };
}
