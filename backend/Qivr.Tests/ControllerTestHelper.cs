using System;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Qivr.Tests;

/// <summary>
/// Utility methods for wiring controller contexts with the tenant/user information tests rely on.
/// </summary>
public static class ControllerTestHelper
{
    public static ControllerContext BuildControllerContext(Guid tenantId, Guid userId, string role = "Admin")
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("tenant_id", tenantId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            }, "Test"))
        };

        var tenant = tenantId.ToString();
        httpContext.Request.Headers["X-Clinic-Id"] = tenant;
        httpContext.Request.Headers["X-Tenant-Id"] = tenant;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "DefaultTenantId", tenantId.ToString() }
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        httpContext.RequestServices = services.BuildServiceProvider();

        return new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    public static ControllerContext BuildAnonymousContext(Guid tenantId)
    {
        var httpContext = new DefaultHttpContext();
        var tenant = tenantId.ToString();
        httpContext.Request.Headers["X-Clinic-Id"] = tenant;
        httpContext.Request.Headers["X-Tenant-Id"] = tenant;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "DefaultTenantId", tenantId.ToString() }
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        httpContext.RequestServices = services.BuildServiceProvider();

        return new ControllerContext
        {
            HttpContext = httpContext
        };
    }
}
