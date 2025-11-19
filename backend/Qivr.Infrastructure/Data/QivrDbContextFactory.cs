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
        optionsBuilder.UseNpgsql("Host=localhost;Database=qivr_design;Username=postgres;Password=postgres");
        
        return new QivrDbContext(optionsBuilder.Options);
    }
}
