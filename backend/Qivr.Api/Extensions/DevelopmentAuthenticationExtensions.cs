using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Qivr.Api.Authentication;
using Qivr.Api.Config;
using Qivr.Api.Services;

namespace Qivr.Api.Extensions;

public static class DevelopmentAuthenticationExtensions
{
    public static IServiceCollection AddDevelopmentAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<DevAuthSettings>(configuration.GetSection("DevAuth"));
        services.TryAddSingleton<DevTokenGenerator>();
        services.AddScoped<ICognitoAuthService, DevelopmentAuthService>();

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = DevelopmentAuthenticationDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = DevelopmentAuthenticationDefaults.AuthenticationScheme;
        })
        .AddScheme<AuthenticationSchemeOptions, DevelopmentAuthenticationHandler>(
            DevelopmentAuthenticationDefaults.AuthenticationScheme,
            _ => { });

        services.AddAuthorization(options =>
        {
            options.DefaultPolicy = new AuthorizationPolicyBuilder(DevelopmentAuthenticationDefaults.AuthenticationScheme)
                .RequireAuthenticatedUser()
                .Build();
        });

        return services;
    }
}
