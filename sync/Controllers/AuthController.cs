using GenshinSchedule.SyncServer.Database;
using GenshinSchedule.SyncServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Prometheus;

namespace GenshinSchedule.SyncServer.Controllers;

[ApiController, Route("api/v1/auth")]
public class AuthController(SyncDbContext db, HashHelper hash, AuthHelper auth, ILogger<AuthController> logger) : ControllerBase
{
    /// <summary>
    /// Retrieves the currently authenticated user information.
    /// </summary>
    [HttpGet, Authorize]
    public async Task<ActionResult<User>> GetAsync()
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return Unauthorized();

            return Models.User.FromDbModel(user);
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not retrieve user {UserId}.", userId);

            return StatusCode(500, $"Could not retrieve user {userId}.");
        }
    }

    static readonly Counter _registrations = Metrics.CreateCounter("auth_registrations", "Number of new registrations.");
    static readonly Counter _authorizations = Metrics.CreateCounter("auth_authorizations", "Number of account authorizations.");

    /// <summary>
    /// Authenticates as an existing user, or creates a new user if one does not exist.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AuthResponse>> PostAsync(AuthRequest request)
    {
        try
        {
            var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null)
            {
                user = new DbUser
                {
                    Username    = request.Username,
                    Password    = hash.Hash(request.Password),
                    CreatedTime = DateTimeOffset.UtcNow,

                    WebData = new DbWebData
                    {
                        Token = Guid.NewGuid(),
                        Data  = "{}"
                    }
                };

                db.Add(user);

                await db.SaveChangesAsync();

                logger.LogInformation("Created user '{Username}'.", request.Username);

                _registrations.Inc();
            }
            else
            {
                if (!hash.Test(user.Password, request.Password))
                    return Unauthorized("Invalid username or password.");

                _authorizations.Inc();
            }

            return Ok(new AuthResponse
            {
                Token = auth.CreateToken(user),
                User  = Models.User.FromDbModel(user)
            });
        }
        catch (Exception e)
        {
            logger.LogWarning(e, "Could not authenticate user '{Username}'.", request.Username);

            return BadRequest($"Could not authenticate user '{request.Username}'.");
        }
    }

    /// <summary>
    /// Updates the currently authenticated user's credentials.
    /// </summary>
    [HttpPut, Authorize]
    public async Task<ActionResult<AuthResponse>> PutAsync(AuthRequest request)
    {
        var userId = HttpContext.GetUserId();

        try
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return Unauthorized();

            user.Username = request.Username;
            user.Password = hash.Hash(request.Password);

            await db.SaveChangesAsync();

            return Ok(new AuthResponse
            {
                Token = auth.CreateToken(user),
                User  = Models.User.FromDbModel(user)
            });
        }
        catch (Exception e)
        {
            var message = e is DbUpdateException ? $"Username '{request.Username}' is already taken." : $"Could not update credentials for user {userId}.";

            logger.LogWarning(e, "Could not update credentials for user {UserId}.", userId);

            return StatusCode(500, message);
        }
    }
}
