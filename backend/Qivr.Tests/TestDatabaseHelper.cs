using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Tests;

/// <summary>
/// Helper for test database configuration.
/// Uses TEST_DATABASE_URL env var or falls back to AWS RDS.
/// Set TEST_DATABASE_URL for local testing or CI/CD.
/// </summary>
public static class TestDatabaseHelper
{
    private static string? _connectionString;
    
    public static string GetConnectionString()
    {
        if (_connectionString != null)
            return _connectionString;

        // Priority 1: Environment variable (for CI/CD or local override)
        _connectionString = Environment.GetEnvironmentVariable("TEST_DATABASE_URL");
        
        if (!string.IsNullOrEmpty(_connectionString))
        {
            // Convert postgres:// URL format if needed
            if (_connectionString.StartsWith("postgres://") || _connectionString.StartsWith("postgresql://"))
            {
                _connectionString = ConvertPostgresUrl(_connectionString);
            }
            Console.WriteLine("Using TEST_DATABASE_URL from environment");
            return _connectionString;
        }

        // Priority 2: Local test database (requires local PostgreSQL)
        _connectionString = "Host=localhost;Port=5432;Database=qivr_test;Username=postgres;Password=postgres";
        Console.WriteLine("Using local test database (localhost:5432/qivr_test)");
        Console.WriteLine("Set TEST_DATABASE_URL env var to use a different database");
        
        return _connectionString;
    }

    private static string ConvertPostgresUrl(string url)
    {
        var uri = new Uri(url.Replace("postgresql://", "postgres://"));
        var userInfo = uri.UserInfo.Split(':');
        var user = userInfo[0];
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var sslMode = uri.Query.Contains("sslmode=require") ? "Require" : "Prefer";
        
        return $"Host={host};Port={port};Database={database};Username={user};Password={password};SSL Mode={sslMode}";
    }

    public static DbContextOptions<QivrDbContext> CreateOptions()
    {
        return new DbContextOptionsBuilder<QivrDbContext>()
            .UseNpgsql(GetConnectionString())
            .UseSnakeCaseNamingConvention()
            .EnableDetailedErrors()
            .EnableSensitiveDataLogging()
            .Options;
    }

    public static DbContextOptions<QivrDbContext> CreateInMemoryOptions(string databaseName)
    {
        return new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
    }
}
