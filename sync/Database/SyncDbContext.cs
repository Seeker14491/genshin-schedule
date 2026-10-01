using Microsoft.EntityFrameworkCore;

namespace GenshinSchedule.SyncServer.Database;

public class SyncDbContext(DbContextOptions<SyncDbContext> options) : DbContext(options)
{
    public DbSet<DbUser> Users => Set<DbUser>();
    public DbSet<DbWebData> WebData => Set<DbWebData>();
    public DbSet<DbNotification> Notifications => Set<DbNotification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DbUser>(user =>
        {
            user.HasIndex(u => u.Username).IsUnique();
            user.HasIndex(u => u.DiscordUserId);
        });

        modelBuilder.Entity<DbWebData>(data => data.HasIndex(d => d.Token).IsUnique());

        modelBuilder.Entity<DbNotification>(notification =>
        {
            notification.HasIndex(n => n.Key);
            notification.HasIndex(n => n.Time);
        });
    }
}
