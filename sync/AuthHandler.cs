using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace GenshinSchedule.SyncServer;

public class AuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, AuthHelper auth)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public static readonly object PayloadKey = new();
    public const string SchemeName = "Bearer";

    static readonly AuthenticationTicket _successTicket = new(new ClaimsPrincipal(new ClaimsIdentity(null, SchemeName)), SchemeName);

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        try
        {
            if (!AuthenticationHeaderValue.TryParse(Request.Headers.Authorization, out var authorization) || authorization.Scheme != Scheme.Name)
                return Task.FromResult(AuthenticateResult.NoResult());

            if (!auth.TryValidateToken(authorization.Parameter, out var payload))
                return Task.FromResult(AuthenticateResult.Fail("Authorization failed."));

            Context.Items[PayloadKey] = payload;

            return Task.FromResult(AuthenticateResult.Success(_successTicket));
        }
        catch (Exception e)
        {
            Logger.LogWarning(e, "Authorization failed.");

            return Task.FromResult(AuthenticateResult.Fail("Authentication failed."));
        }
    }
}

public static class AuthHandlerExtensions
{
    public static int GetUserId(this HttpContext context)
        => context.Items.TryGetValue(AuthHandler.PayloadKey, out var item) && item is AuthPayload payload ? payload.Id : 0;
}
