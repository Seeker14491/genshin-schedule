using GenshinSchedule.SyncServer.Database;
using GenshinSchedule.SyncServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GenshinSchedule.SyncServer.Controllers;

[ApiController, Route("api/v1/users"), Authorize]
public class UserController(SyncDbContext db, AuthHelper auth, ILogger<UserController> logger) : ControllerBase
{
    /// <summary>
    /// Authenticates as another user bypassing the usual password check.
    /// This endpoint is restricted to administrators.
    /// </summary>
    [HttpGet("{username}/auth")]
    public async Task<ActionResult<AuthResponse>> AuthAsync(string username)
    {
        var adminId = HttpContext.GetUserId();

        try
        {
            var admin = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == adminId);

            if (admin is not { IsAdmin: true })
                return Forbid();

            var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return NotFound($"User '{username}' not found.");

            return Ok(new AuthResponse
            {
                Token = auth.CreateToken(user),
                User  = Models.User.FromDbModel(user)
            });
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not authenticate as user '{Username}'.", username);

            return StatusCode(500, $"Could not authenticate as user '{username}'.");
        }
    }
}
