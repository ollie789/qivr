using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Qivr.Api.Config;
using Qivr.Api.Services;
using System.Security.Cryptography;
using System.Text;

namespace Qivr.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddCognitoAuthentication(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        // Add Cognito settings
        services.Configure<CognitoSettings>(configuration.GetSection("Cognito"));
        
        // Add auth service - use mock for development
        if (configuration["Environment"] == "Development")
        {
            services.AddScoped<ICognitoAuthService, MockAuthService>();
        }
        else
        {
            services.AddScoped<ICognitoAuthService, CognitoAuthService>();
        }
        
        // Get Cognito settings for JWT configuration
        var cognitoSettings = configuration.GetSection("Cognito").Get<CognitoSettings>() 
            ?? throw new InvalidOperationException("Cognito settings not configured");
        
        // Configure JWT authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.Authority = $"https://cognito-idp.{cognitoSettings.Region}.amazonaws.com/{cognitoSettings.UserPoolId}";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidIssuer = $"https://cognito-idp.{cognitoSettings.Region}.amazonaws.com/{cognitoSettings.UserPoolId}",
                ValidAudience = cognitoSettings.UserPoolClientId,
                ClockSkew = TimeSpan.Zero
            };
            
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = context =>
                {
                    // Extract custom claims and add to the principal
                    var claimsIdentity = context.Principal?.Identity as System.Security.Claims.ClaimsIdentity;
                    
                    if (claimsIdentity != null)
                    {
                        // Extract tenant_id from custom claims
                        var tenantIdClaim = context.Principal?.Claims
                            .FirstOrDefault(c => c.Type == "custom:tenant_id");
                        
                        if (tenantIdClaim != null)
                        {
                            claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                "tenant_id", 
                                tenantIdClaim.Value));
                        }
                        
                        // Extract role from custom claims
                        var roleClaim = context.Principal?.Claims
                            .FirstOrDefault(c => c.Type == "custom:role");
                        
                        if (roleClaim != null)
                        {
                            claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                System.Security.Claims.ClaimTypes.Role, 
                                roleClaim.Value));
                        }
                    }
                    
                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    // Log authentication failures
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    
                    logger.LogError(context.Exception, 
                        "Authentication failed: {Message}", 
                        context.Exception.Message);
                    
                    return Task.CompletedTask;
                }
            };
        });
        
        // Add authorization policies
        services.AddAuthorization(options =>
        {
            options.AddPolicy("PatientOnly", policy =>
                policy.RequireRole("Patient"));
                
            options.AddPolicy("ClinicianOnly", policy =>
                policy.RequireRole("Clinician", "Admin", "Owner"));
                
            options.AddPolicy("AdminOnly", policy =>
                policy.RequireRole("Admin", "Owner"));
                
            options.AddPolicy("OwnerOnly", policy =>
                policy.RequireRole("Owner"));
                
            options.AddPolicy("RequireTenant", policy =>
                policy.RequireClaim("tenant_id"));
        });
        
        return services;
    }
    
    public static IApplicationBuilder UseCognitoAuthentication(this IApplicationBuilder app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
        
        return app;
    }
}
