using GenshinSchedule.SyncServer.Database;
using GenshinSchedule.SyncServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Prometheus;

namespace GenshinSchedule.SyncServer.Controllers;

[ApiController, Route("api/v1/sync"), Authorize]
public class SyncController(SyncDbContext db, ILogger<SyncController> logger) : ControllerBase
{
    static readonly Counter _actions = Metrics.CreateCounter("sync_actions", "Number of sync data actions.", new CounterConfiguration
    {
        LabelNames = ["type"]
    });

    /// <summary>
    /// Retrieves the latest synchronization data.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<WebData>> GetAsync()
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var user = await db.Users.AsNoTracking().Include(u => u.WebData).FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.WebData == null)
                return Unauthorized();

            _actions.WithLabels("get").Inc();

            return Ok(WebData.FromDbModel(user.WebData));
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not retrieve sync data for user {UserId}.", userId);

            return StatusCode(500, $"Could not retrieve sync data for user {userId}.");
        }
    }

    /// <summary>
    /// Applies the given patches to synchronization data.
    /// Responds with 400 and the latest data if the client's token is outdated or the patch could not be applied.
    /// </summary>
    [HttpPatch]
    public async Task<ActionResult> PatchAsync(SyncRequest request)
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var user = await db.Users.Include(u => u.WebData).FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.WebData == null)
                return Unauthorized();

            var data = user.WebData;

            if (data.Token != request.Token || request.Patch == null)
                return BadRequest(WebData.FromDbModel(data));

            try
            {
                var current = JObject.Parse(data.Data ?? "{}");

                request.Patch.ApplyTo(current);

                data.Data = current.ToString(Formatting.None);
            }
            catch
            {
                return BadRequest(WebData.FromDbModel(data));
            }

            data.Token = Guid.NewGuid();

            await db.SaveChangesAsync();

            _actions.WithLabels("patch").Inc();

            return Ok(new SyncResponse
            {
                Token = data.Token
            });
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not patch sync data for user {UserId}.", userId);

            return StatusCode(500, $"Could not patch sync data for user {userId}.");
        }
    }
}
