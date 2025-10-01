using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
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
        
        // Add auth service - always use Cognito now
        services.AddScoped<ICognitoAuthService, CognitoAuthService>();
        
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
                ValidateAudience = false, // Cognito access tokens don't have an 'aud' claim
                ValidateLifetime = true,
                ValidIssuer = $"https://cognito-idp.{cognitoSettings.Region}.amazonaws.com/{cognitoSettings.UserPoolId}",
                ClockSkew = TimeSpan.Zero
            };
            
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    // Allow JWT to be supplied via Authorization header or secure cookies
                    var token = context.Request.Headers["Authorization"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(token) && token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Token = token[7..].Trim();
                        return Task.CompletedTask;
                    }

                    if (context.Request.Cookies.TryGetValue("accessToken", out var cookieToken) && !string.IsNullOrWhiteSpace(cookieToken))
                    {
                        context.Token = cookieToken;
                    }

                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    // Extract custom claims and add to the principal
                    var claimsIdentity = context.Principal?.Identity as System.Security.Claims.ClaimsIdentity;
                    
                    if (claimsIdentity != null)
                    {
                        var logger = context.HttpContext.RequestServices
                            .GetRequiredService<ILogger<Program>>();
                        
                        // Get the Cognito sub claim (user ID in Cognito)
                        var subClaim = context.Principal?.Claims
                            .FirstOrDefault(c => c.Type == "sub" || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
                        
                        if (subClaim != null)
                        {
                            // Get user service to fetch user from database
                            var userService = context.HttpContext.RequestServices.GetService<Qivr.Services.IUserService>();
                            
                            if (userService != null)
                            {
                                try 
                                {
                                    // Fetch user from database using Cognito sub
                                    var user = await userService.GetUserByCognitoSubAsync(subClaim.Value);
                                    
                                    if (user != null)
                                    {
                                        // Add the role based on UserType
                                        var role = user.UserType; // UserType is already a string from the DTO
                                        
                                        logger.LogInformation("Found user {Email} with UserType/Role: {Role}", user.Email, role);
                                        
                                        // Add user ID claim
                                        if (!claimsIdentity.HasClaim("user_id", user.Id.ToString()))
                                        {
                                            claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                                "user_id", 
                                                user.Id.ToString()));
                                        }
                                        
                                        // Add role claim from UserType
                                        if (!string.IsNullOrEmpty(role) &&
                                            !claimsIdentity.HasClaim(System.Security.Claims.ClaimTypes.Role, role))
                                        {
                                            claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                                System.Security.Claims.ClaimTypes.Role, 
                                                role));
                                        }
                                        
                                        // For now, we'll fetch the tenant from the user's email domain
                                        // This is a temporary solution until we implement proper tenant management
                                        // We need to get the tenant ID from somewhere - let's use the database
                                        var dbContext = context.HttpContext.RequestServices.GetService<Qivr.Infrastructure.Data.QivrDbContext>();
                                        if (dbContext != null)
                                        {
                                            var userEntity = await dbContext.Users
                                                .AsNoTracking()
                                                .FirstOrDefaultAsync(u => u.CognitoSub == subClaim.Value);
                                            
                                            if (userEntity != null && userEntity.TenantId != Guid.Empty)
                                            {
                                                if (!claimsIdentity.HasClaim("tenant_id", userEntity.TenantId.ToString()))
                                                {
                                                    claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                                        "tenant_id", 
                                                        userEntity.TenantId.ToString()));
                                                }
                                                    
                                                logger.LogInformation("Added tenant_id claim: {TenantId}", userEntity.TenantId);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        logger.LogWarning("User not found in database for Cognito sub: {Sub}", subClaim.Value);
                                    }
                                }
                                catch (Exception ex)
                                {
                                    logger.LogError(ex, "Error fetching user from database for Cognito sub: {Sub}", subClaim.Value);
                                }
                            }
                            else
                            {
                                logger.LogWarning("UserService not available in DI container");
                            }
                        }
                        
                        // Also check for custom claims from Cognito (in case they're configured in the future)
                        // Note: Cognito custom attributes come through with 'custom:custom:' prefix
                        var tenantIdClaim = context.Principal?.Claims
                            .FirstOrDefault(c => c.Type == "custom:tenant_id" || c.Type == "custom:custom:tenant_id");
                        
                        if (tenantIdClaim != null && !claimsIdentity.HasClaim("tenant_id", tenantIdClaim.Value))
                        {
                            claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                "tenant_id", 
                                tenantIdClaim.Value));
                            logger.LogInformation("Added tenant_id from Cognito custom claim: {TenantId}", tenantIdClaim.Value);
                        }
                        
                        var roleClaim = context.Principal?.Claims
                            .FirstOrDefault(c => c.Type == "custom:role" || c.Type == "custom:custom:role");
                        
                        if (roleClaim != null && !claimsIdentity.HasClaim(System.Security.Claims.ClaimTypes.Role, roleClaim.Value))
                        {
                            claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                System.Security.Claims.ClaimTypes.Role, 
                                roleClaim.Value));
                            logger.LogInformation("Added role from Cognito custom claim: {Role}", roleClaim.Value);
                        }
                    }
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
}
