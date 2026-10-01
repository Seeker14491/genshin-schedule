using System.ComponentModel.DataAnnotations;

namespace GenshinSchedule.SyncServer.Models;

public class AuthRequest
{
    [Required, MinLength(3), MaxLength(64), RegularExpression("^(?=.{3,64}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$")]
    public string Username { get; set; } = "";

    [Required, MaxLength(256)]
    public string Password { get; set; } = "";
}

public class AuthResponse
{
    public required string Token { get; set; }
    public required User User { get; set; }
}
