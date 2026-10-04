namespace GenshinSchedule.SyncServer.Models;

/// <summary>
/// A notification to queue for delivery via Discord. Its key is part of the URL.
/// </summary>
public class Notification
{
    public long Time { get; set; }
    public string? Icon { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? Color { get; set; }
}
