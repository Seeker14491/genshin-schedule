# genshin-sync

This project is an [ASP.NET Core](https://learn.microsoft.com/aspnet/core/) C# project that handles user authentication, data synchronization and Discord notifications for [web](../web).

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [PostgreSQL 13+](https://www.postgresql.org/)

## Local development

To start a local development instance at: http://localhost:5000

[appsettings.Development.json](appsettings.Development.json) is already configured for the database started below:

```jsonc
{
  "Secret": "genshin", // replace with some long and secure random string in production
  "ConnectionStrings": {
    "SyncDbContext": "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=genshin;"
  }
}
```

Run the following commands:

```shell
# Start a PostgreSQL instance with Docker
docker run -it --rm -p 5432:5432 -e POSTGRES_PASSWORD=genshin postgres:alpine

# Start server
ASPNETCORE_ENVIRONMENT=Development dotnet run
```

Database migrations are applied automatically on startup.

## Configuration

Settings are read from `appsettings.json`, `appsettings.{Environment}.json` and environment variables (use `__` as the section separator, e.g. `ConnectionStrings__SyncDbContext`).

| Setting                           | Description                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `Secret`                          | **Required.** Key used to sign auth tokens. Changing it signs out every user. |
| `ConnectionStrings:SyncDbContext` | **Required.** PostgreSQL connection string.                                   |
| `Discord:Token`                   | Discord bot token. The bot and notifications are disabled when not set.       |
| `Discord:DisableNotifications`    | Set to `true` to run the bot without sending queued notifications.            |

## Production build

To start a production instance at: http://0.0.0.0:80

```shell
# Compile project
dotnet publish -c Release -o build

# Start server
cd build
ASPNETCORE_HTTP_PORTS=80 dotnet GenshinSchedule.SyncServer.dll
```

The configuration file `appsettings.Production.json` is read from the working directory if it exists. It can be created beforehand, or mounted at `/genshin/appsettings.Production.json` when using Docker. Alternatively, use environment variables.

In production, Prometheus metrics are published on port 9802.

Refer to the [Dockerfile](Dockerfile), which is the production build script. Its build context is the repository root.

## Database migrations

The [EF Core CLI](https://learn.microsoft.com/ef/core/cli/dotnet) is installed as a local tool. After changing the database models:

```shell
dotnet tool restore
dotnet ef migrations add <MigrationName>
```

## Using different databases

Only PostgreSQL connection strings are accepted at the moment.

It is possible to use other [database providers](https://learn.microsoft.com/ef/core/providers) supported by EF Core. You will need to edit the `UseNpgsql` call in [Program.cs](Program.cs) and regenerate the migrations.

## User administration capabilities

This project provides only the minimum amount of API required by `web`, which does not include any advanced user administration capabilities.

All users are either an admin or not, which is determined by a simple boolean column in the user table. By default, the first registered user (ID 1) receives the admin flag and nobody else.

An authentication bypass API that generates auth tokens of any user without password check is provided for when administrators need to reset a specific user's password. Needless to say, this endpoint is available only to users with the admin flag.
