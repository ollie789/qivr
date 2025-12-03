using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Qivr.Infrastructure.Data;

public class QivrDbContextFactory : IDesignTimeDbContextFactory<QivrDbContext>
{
    public QivrDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<QivrDbContext>();
        
        // Use a dummy connection string for migrations
        // The actual connection string is configured at runtime
        var connectionString = Environment.GetEnvironmentVariable("DEFAULT_CONNECTION") 
            ?? "Host=localhost;Port=5432;Database=qivr;Username=qivr_user;Password=dev_password;SslMode=Disable";
        optionsBuilder.UseNpgsql(connectionString);
        
        return new QivrDbContext(optionsBuilder.Options);
    }
}
