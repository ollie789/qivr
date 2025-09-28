using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Qivr.Infrastructure.Data;
using Npgsql.EntityFrameworkCore.PostgreSQL;

namespace Qivr.Tests;

public static class TestDatabaseHelper
{
    private static string? _connectionString;
    
    public static string GetConnectionString()
    {
        if (_connectionString != null)
        {
            return _connectionString;
        }

        // First try to get from environment variable (for CI/CD)
        _connectionString = Environment.GetEnvironmentVariable("TEST_CONNECTION_STRING");
        
        if (string.IsNullOrEmpty(_connectionString))
        {
            // Try to load from .env.aws-dev file in backend directory
            var currentDir = Directory.GetCurrentDirectory();
            string[] possiblePaths = 
            {
                Path.Combine(currentDir, ".env.aws-dev"),
                Path.Combine(currentDir, "..", ".env.aws-dev"),
                "/Users/oliver/Projects/qivr/backend/.env.aws-dev"
            };
            
            foreach (var envPath in possiblePaths)
            {
                if (File.Exists(envPath))
                {
                    var lines = File.ReadAllLines(envPath);
                    
                    // Try CONNECTION_STRING first
                    var connStringLine = lines.FirstOrDefault(l => l.StartsWith("CONNECTION_STRING="));
                    if (!string.IsNullOrEmpty(connStringLine))
                    {
                        _connectionString = connStringLine.Substring("CONNECTION_STRING=".Length).Trim('\"');
                        break;
                    }
                    
                    // Try DATABASE_URL and convert to connection string format
                    var dbUrlLine = lines.FirstOrDefault(l => l.StartsWith("DATABASE_URL="));
                    if (!string.IsNullOrEmpty(dbUrlLine))
                    {
                        var dbUrl = dbUrlLine.Substring("DATABASE_URL=".Length).Trim('\"');
                        // Convert postgresql:// URL to connection string
                        // Format: postgresql://user:password@host:port/database?sslmode=require
                        if (dbUrl.StartsWith("postgresql://"))
                        {
                            var uri = new Uri(dbUrl.Replace("postgresql://", "postgres://"));
                            var userInfo = uri.UserInfo.Split(':');
                            var user = userInfo[0];
                            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                            var host = uri.Host;
                            var port = uri.Port > 0 ? uri.Port : 5432;
                            var database = uri.AbsolutePath.TrimStart('/');
                            var sslMode = uri.Query.Contains("sslmode=require") ? "Require" : "Prefer";
                            
                            _connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password};SSL Mode={sslMode}";
                            break;
                        }
                    }
                }
            }
        }

        if (string.IsNullOrEmpty(_connectionString))
        {
            // Try to get from appsettings.Development.json
            var appsettingsPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Qivr.Api", "appsettings.Development.json");
            if (File.Exists(appsettingsPath))
            {
                var config = new ConfigurationBuilder()
                    .AddJsonFile(appsettingsPath)
                    .Build();
                _connectionString = config.GetConnectionString("DefaultConnection");
            }
        }

        if (string.IsNullOrEmpty(_connectionString))
        {
            // Fallback to local PostgreSQL
            _connectionString = "Host=localhost;Port=5432;Database=qivr_test;Username=qivr_user;Password=QivrDevPassword2024!";
        }

        Console.WriteLine($"Using connection string: {_connectionString?.Substring(0, Math.Min(50, _connectionString?.Length ?? 0))}...");
        return _connectionString;
    }

    public static DbContextOptions<QivrDbContext> CreateOptions(string? testName = null)
    {
        var connectionString = GetConnectionString();
        
        // Disable schema isolation for now - use main database directly
        // This is needed when testing against AWS RDS with existing migrations
        // if (!string.IsNullOrEmpty(testName))
        // {
        //     // Add search_path parameter to isolate tests
        //     var builder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
        //     var schemaName = $"test_{testName.ToLower().Replace(" ", "_")}_{Guid.NewGuid():N}";
        //     builder.SearchPath = schemaName + ",public";
        //     connectionString = builder.ToString();
        // }

        var optionsBuilder = new DbContextOptionsBuilder<QivrDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention(); // Apply snake_case naming convention

        // Enable detailed errors and sensitive data logging for tests
        optionsBuilder.EnableDetailedErrors()
            .EnableSensitiveDataLogging();

        return optionsBuilder.Options;
    }

    public static async Task InitializeTestDatabase(QivrDbContext context, string? testName = null)
    {
        // Schema isolation disabled for now - using main database
        // if (!string.IsNullOrEmpty(testName))
        // {
        //     var schemaName = $"test_{testName.ToLower().Replace(" ", "_")}_{Guid.NewGuid():N}";
        //     await context.Database.ExecuteSqlRawAsync($"CREATE SCHEMA IF NOT EXISTS {schemaName}");
        //     await context.Database.ExecuteSqlRawAsync($"SET search_path TO {schemaName}, public");
        // }

        // For AWS RDS, the database and migrations should already be applied
        // Just test the connection
        try 
        {
            await context.Database.CanConnectAsync();
            Console.WriteLine("Database connection successful");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database connection failed: {ex.Message}");
            throw;
        }
    }

    public static async Task CleanupTestDatabase(QivrDbContext context, string? testName = null)
    {
        // Schema isolation disabled - cleanup handled by test base class
        // which deletes test data based on tenant ID
    }

    /// <summary>
    /// Creates options for InMemory database as a fallback when PostgreSQL is not available
    /// </summary>
    public static DbContextOptions<QivrDbContext> CreateInMemoryOptions(string databaseName)
    {
        return new DbContextOptionsBuilder<QivrDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
    }
}