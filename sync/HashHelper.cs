using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace GenshinSchedule.SyncServer;

public class HashHelper
{
    const int _saltSize = 128 / 8;
    const int _hashSize = 256 / 8;

    /// <summary>
    /// Hashes a password, returning the salt followed by the hash.
    /// </summary>
    public byte[] Hash(string str, byte[]? salt = null)
    {
        salt ??= RandomNumberGenerator.GetBytes(_saltSize);

        // best practice from microsoft: https://learn.microsoft.com/aspnet/core/security/data-protection/consumer-apis/password-hashing
        // the parameters can't change without breaking existing password hashes
        var hash = KeyDerivation.Pbkdf2(str, salt, KeyDerivationPrf.HMACSHA1, 10000, _hashSize);

        return [..salt, ..hash];
    }

    public bool Test(byte[]? buffer, string str)
    {
        if (buffer is not { Length: _saltSize + _hashSize })
            return false;

        return CryptographicOperations.FixedTimeEquals(buffer, Hash(str, buffer[.._saltSize]));
    }
}
