using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography;
using System.Text;
using GenshinSchedule.SyncServer.Database;
using Microsoft.AspNetCore.WebUtilities;
using Newtonsoft.Json;

namespace GenshinSchedule.SyncServer;

public class AuthPayload
{
    [JsonProperty("id")]
    public int Id { get; set; }
}

/// <summary>
/// Creates and validates auth tokens of the form <c>base64url(payload json).base64url(hmac-sha256)</c>.
/// </summary>
public class AuthHelper(IConfiguration configuration)
{
    byte[] ComputeHash(byte[] data)
        => HMACSHA256.HashData(Encoding.UTF8.GetBytes(configuration["Secret"] ?? throw new InvalidOperationException("The 'Secret' setting is not configured.")), data);

    public string CreateToken(DbUser user) => CreateToken(new AuthPayload
    {
        Id = user.Id
    });

    public string CreateToken(AuthPayload payload)
    {
        var data = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(payload));

        return $"{WebEncoders.Base64UrlEncode(data)}.{WebEncoders.Base64UrlEncode(ComputeHash(data))}";
    }

    public bool TryValidateToken(string? token, [NotNullWhen(true)] out AuthPayload? payload)
    {
        payload = null;

        var parts = (token ?? "").Split('.');

        if (parts.Length != 2)
            return false;

        byte[] data, hash;

        try
        {
            data = WebEncoders.Base64UrlDecode(parts[0]);
            hash = WebEncoders.Base64UrlDecode(parts[1]);
        }
        catch (FormatException)
        {
            return false;
        }

        if (!CryptographicOperations.FixedTimeEquals(hash, ComputeHash(data)))
            return false;

        payload = JsonConvert.DeserializeObject<AuthPayload>(Encoding.UTF8.GetString(data));
        return payload != null;
    }
}
