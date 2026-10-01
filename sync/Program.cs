using GenshinSchedule.SyncServer;
using GenshinSchedule.SyncServer.Database;
using GenshinSchedule.SyncServer.Discord;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// models predate nullable reference types; don't let `string` properties become implicitly required
builder.Services.AddControllers(options => options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true)
       .AddNewtonsoftJson();

builder.Services.AddCors();

builder.Services.AddAuthentication(AuthHandler.SchemeName)
       .AddScheme<AuthenticationSchemeOptions, AuthHandler>(AuthHandler.SchemeName, null);

builder.Services.AddDbContextPool<SyncDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString(nameof(SyncDbContext))));

builder.Services.AddSingleton<AuthHelper>()
       .AddSingleton<HashHelper>();

if (builder.Environment.IsProduction())
    builder.Services.AddHostedService<MetricsService>();

builder.Services.AddSingleton<CommandHandler>()
       .AddSingleton<NotificationService>()
       .AddHostedService<DiscordService>();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
    await scope.ServiceProvider.GetRequiredService<SyncDbContext>().Database.MigrateAsync();

app.UseCors(cors => cors.AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowAnyOrigin());

app.UseAuthentication();
app.UseAuthorization();

// all controller routes are prefixed with /api/v1
app.MapControllers();

await app.RunAsync();
