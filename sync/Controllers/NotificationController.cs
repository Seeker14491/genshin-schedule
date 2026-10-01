using GenshinSchedule.SyncServer.Database;
using GenshinSchedule.SyncServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Prometheus;

namespace GenshinSchedule.SyncServer.Controllers;

[ApiController, Route("api/v1/notifications"), Authorize]
public class NotificationController(SyncDbContext db, ILogger<NotificationController> logger) : ControllerBase
{
    static readonly Counter _actions = Metrics.CreateCounter("notification_actions", "Number of notification actions.", new CounterConfiguration
    {
        LabelNames = ["type"]
    });

    /// <summary>
    /// Retrieves all notifications in queue.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<Notification[]>> GetAsync()
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var notifications = await db.Notifications.AsNoTracking().Where(n => n.User!.Id == userId).ToListAsync();

            _actions.WithLabels("list").Inc();

            return Ok(notifications.Select(Notification.FromDbModel).ToArray());
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not retrieve notifications for user {UserId}.", userId);

            return StatusCode(500, $"Could not retrieve notifications for user {userId}.");
        }
    }

    /// <summary>
    /// Retrieves a notification in queue given its key.
    /// </summary>
    [HttpGet("{key}")]
    public async Task<ActionResult<Notification>> GetAsync(string key)
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var notification = await db.Notifications.AsNoTracking().FirstOrDefaultAsync(n => n.User!.Id == userId && n.Key == key);

            if (notification == null)
                return NotFound($"Notification '{key}' not found.");

            _actions.WithLabels("get").Inc();

            return Ok(Notification.FromDbModel(notification));
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not retrieve notification '{Key}' for user {UserId}.", key, userId);

            return StatusCode(500, $"Could not retrieve notification '{key}' for user {userId}.");
        }
    }

    /// <summary>
    /// Creates or updates a notification in queue.
    /// </summary>
    [HttpPut("{key}")]
    public async Task<ActionResult> PutAsync(string key, Notification model)
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var notification = await db.Notifications.AsTracking().FirstOrDefaultAsync(n => n.User!.Id == userId && n.Key == key);

            if (notification == null)
                db.Notifications.Add(notification = new DbNotification());

            notification.User = db.Users.Attach(new DbUser { Id = userId }).Entity;

            notification.Key         = key;
            notification.Time        = DateTimeOffset.FromUnixTimeMilliseconds(model.Time);
            notification.Icon        = model.Icon;
            notification.Title       = model.Title;
            notification.Description = model.Description;
            notification.Url         = model.Url;
            notification.Color       = model.Color;

            await db.SaveChangesAsync();

            _actions.WithLabels("set").Inc();

            return Ok($"Notification '{key}' updated.");
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not update notification '{Key}' for user {UserId}.", key, userId);

            return StatusCode(500, $"Could not update notification '{key}' for user {userId}.");
        }
    }

    /// <summary>
    /// Removes a notification from queue if it exists.
    /// </summary>
    [HttpDelete("{key}")]
    public async Task<ActionResult> DeleteAsync(string key)
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var notification = await db.Notifications.AsTracking().FirstOrDefaultAsync(n => n.User!.Id == userId && n.Key == key);

            if (notification != null)
            {
                db.Notifications.Remove(notification);

                await db.SaveChangesAsync();

                _actions.WithLabels("delete").Inc();
            }

            return Ok($"Notification '{key}' deleted.");
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not delete notification '{Key}' for user {UserId}.", key, userId);

            return StatusCode(500, $"Could not delete notification '{key}' for user {userId}.");
        }
    }
}
