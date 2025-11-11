using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Xunit;

namespace Qivr.Tests;

/// <summary>
/// Base class for tests that need database access with proper isolation
/// </summary>
public abstract class DatabaseTestBase : IAsyncLifetime
{
    protected QivrDbContext Context { get; private set; } = null!;
    protected Guid TenantId { get; private set; }
    protected Guid TestUserId { get; private set; }
    private readonly string _testName;

    protected DatabaseTestBase()
    {
        // Use the test class and method name for unique identification
        _testName = GetType().Name;
    }

    public virtual async Task InitializeAsync()
    {
        // Create context with proper naming convention
        var options = TestDatabaseHelper.CreateOptions(_testName);
        Context = new QivrDbContext(options);
        
        // Initialize the test database (creates schema, applies migrations if needed)
        await TestDatabaseHelper.InitializeTestDatabase(Context, _testName);
        
        // For now, don't use transactions - we'll clean up manually
        // _transaction = await Context.Database.BeginTransactionAsync();
        
        // Seed the tenant that all test data will belong to
        TenantId = await SeedTenantAsync();
        
        // IMPORTANT: Set the tenant ID on the context so query filters work properly
        Context.SetTenantId(TenantId);
        
        // Optionally seed a default user if needed
        TestUserId = await SeedUserAsync();
    }

    public virtual async Task DisposeAsync()
    {
        // Clean up test data manually since we're not using schema isolation
        if (Context != null && TenantId != Guid.Empty)
        {
            try
            {
                // Delete test data in reverse order of dependencies
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM appointments WHERE tenant_id = {0}", TenantId);
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM prom_instances WHERE tenant_id = {0}", TenantId);
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM prom_templates WHERE tenant_id = {0}", TenantId);
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM providers WHERE tenant_id = {0}", TenantId);
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM users WHERE tenant_id = {0}", TenantId);
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM clinics WHERE tenant_id = {0}", TenantId);
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM tenants WHERE id = {0}", TenantId);
                await Context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM tenants WHERE id = {0}", TenantId);
            }
            catch (Exception ex)
            {
                // Log but don't throw - cleanup is best effort
                Console.WriteLine($"Error cleaning up test data: {ex.Message}");
            }
        }
        
        if (Context != null)
        {
            await Context.DisposeAsync();
        }
    }

    /// <summary>
    /// Seeds a tenant for the test. Override to customize tenant properties.
    /// </summary>
    protected virtual async Task<Guid> SeedTenantAsync()
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = $"Test Tenant {_testName}",
            Slug = $"test-tenant-{Guid.NewGuid():N}",
            Settings = new Dictionary<string, object>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Tenants.Add(tenant);
        await Context.SaveChangesAsync();
        
        return tenant.Id;
    }

    /// <summary>
    /// Seeds a default user for the test. Override to customize user properties.
    /// </summary>
    protected virtual async Task<Guid> SeedUserAsync()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            Email = $"test-{Guid.NewGuid():N}@test.local",
            CognitoSub = $"test-sub-{Guid.NewGuid():N}",
            FirstName = "Test",
            LastName = "User",
            UserType = UserType.Patient,
            Roles = new List<string> { "Patient" },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Users.Add(user);
        await Context.SaveChangesAsync();
        
        return user.Id;
    }

    /// <summary>
    /// Helper to create additional users within the test tenant
    /// </summary>
    protected async Task<User> CreateUserAsync(
        UserType userType = UserType.Patient, 
        string? email = null,
        string? firstName = null,
        string? lastName = null)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            Email = email ?? $"test-{Guid.NewGuid():N}@test.local",
            CognitoSub = $"test-sub-{Guid.NewGuid():N}",
            FirstName = firstName ?? "Test",
            LastName = lastName ?? "User",
            UserType = userType,
            Roles = userType == UserType.Staff 
                ? new List<string> { "Staff", "Admin" }
                : new List<string> { "Patient" },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Users.Add(user);
        await Context.SaveChangesAsync();
        
        return user;
    }

    /// <summary>
    /// Helper to create a clinic within the test tenant (Phase 4.3: Now uses Tenant properties)
    /// </summary>
    protected async Task<Tenant> CreateClinicAsync(string? name = null)
    {
        // Phase 4.3: Use existing tenant and update its clinic properties
        var tenant = await Context.Tenants.FirstAsync(t => t.Id == TenantId);
        
        tenant.Name = name ?? $"Test Clinic {Guid.NewGuid().ToString("N").Substring(0, 8)}";
        tenant.Address = "123 Test Street";
        tenant.Phone = "555-0100";
        tenant.Email = $"clinic-{Guid.NewGuid():N}@test.local";
        tenant.IsActive = true;
        tenant.UpdatedAt = DateTime.UtcNow;

        await Context.SaveChangesAsync();
        
        return tenant;
    }

    /// <summary>
    /// Helper to create a provider within the test tenant
    /// </summary>
    protected async Task<Provider> CreateProviderAsync(User? user = null, Tenant? tenant = null)
    {
        if (user == null)
        {
            user = await CreateUserAsync(UserType.Staff);
        }
        
        if (tenant == null)
        {
            tenant = await CreateClinicAsync();
        }

        var provider = new Provider
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            UserId = user.Id,
            ClinicId = tenant.Id, // Phase 4.3: ClinicId = TenantId now
            Title = "Dr.",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.Providers.Add(provider);
        await Context.SaveChangesAsync();
        
        return provider;
    }

    /// <summary>
    /// Creates a new context for parallel operations
    /// </summary>
    protected QivrDbContext CreateScopedContext()
    {
        var options = TestDatabaseHelper.CreateOptions(_testName);
        var scopedContext = new QivrDbContext(options);
        // Set the tenant ID on the scoped context
        scopedContext.SetTenantId(TenantId);
        // Don't use transaction for now
        // if (_transaction != null)
        //     scopedContext.Database.UseTransaction(_transaction.GetDbTransaction());
        return scopedContext;
    }

    /// <summary>
    /// Creates a controller context populated with the seeded tenant/user identity, matching production expectations.
    /// </summary>
    protected ControllerContext CreateControllerContext(Guid? userId = null, string role = "Admin")
    {
        var userIdentifier = userId ?? TestUserId;
        return ControllerTestHelper.BuildControllerContext(TenantId, userIdentifier, role);
    }
}
