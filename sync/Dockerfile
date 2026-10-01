# Build context is the repository root (see captain-definition-sync).
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /genshin

COPY ./sync/GenshinSchedule.SyncServer.csproj ./
RUN dotnet restore

COPY ./sync/ ./
RUN dotnet publish -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
# appsettings.Production.json may be mounted into this directory
WORKDIR /genshin

COPY --from=build /out ./

ENV ASPNETCORE_ENVIRONMENT=Production
# .NET 8+ images listen on 8080 by default; keep port 80 so existing deployments don't need reconfiguring
ENV ASPNETCORE_HTTP_PORTS=80
EXPOSE 80

ENTRYPOINT ["dotnet", "GenshinSchedule.SyncServer.dll"]
