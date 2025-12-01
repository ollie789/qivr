using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Qivr.Api.Authentication;
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
        
        // Admin pool ID for the admin portal
        var adminPoolId = configuration["Cognito:AdminPoolId"] ?? "ap-southeast-2_BEFWL83lO";
        var mainIssuer = $"https://cognito-idp.{cognitoSettings.Region}.amazonaws.com/{cognitoSettings.UserPoolId}";
        var adminIssuer = $"https://cognito-idp.{cognitoSettings.Region}.amazonaws.com/{adminPoolId}";
        
        // Configure JWT authentication with multiple valid issuers
        // Also add API Key authentication for external API access
        // Partner JWT key
        var partnerJwtKey = configuration["Jwt:Key"] ?? "qivr-partner-default-key-change-in-production-32chars";
        
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthenticationHandler>(
            ApiKeyAuthenticationHandler.SchemeName, _ => { })
        .AddJwtBearer("Partner", partnerOptions =>
        {
            partnerOptions.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(partnerJwtKey.PadRight(32))),
                ValidateIssuer = true,
                ValidIssuer = "qivr-partner",
                ValidateAudience = true,
                ValidAudience = "qivr-partner-portal",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        })
        .AddJwtBearer(options =>
        {
            // Don't set Authority - we'll validate multiple issuers manually
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                ValidateIssuer = true,
                ValidateAudience = false, // Cognito access tokens don't have an 'aud' claim
                ValidateLifetime = true,
                ValidIssuers = new[] { mainIssuer, adminIssuer }, // Accept both pools
                ClockSkew = TimeSpan.Zero,
                IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
                {
                    // Dynamically fetch signing keys from the correct Cognito pool
                    var issuer = securityToken?.Issuer ?? mainIssuer;
                    var jwksUrl = $"{issuer}/.well-known/jwks.json";
                    
                    using var httpClient = new System.Net.Http.HttpClient();
                    var jwks = httpClient.GetStringAsync(jwksUrl).GetAwaiter().GetResult();
                    var keys = new Microsoft.IdentityModel.Tokens.JsonWebKeySet(jwks);
                    return keys.GetSigningKeys();
                }
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
                        
                        // Check if this is from the admin pool
                        var issuer = context.Principal?.Claims
                            .FirstOrDefault(c => c.Type == "iss")?.Value ?? "";
                        var isAdminPoolUser = issuer.Contains(adminPoolId);
                        
                        if (isAdminPoolUser)
                        {
                            // Admin pool users get SuperAdmin role automatically
                            // They don't need to exist in the database
                            logger.LogInformation("Admin pool user authenticated from issuer: {Issuer}", issuer);
                            
                            if (!claimsIdentity.HasClaim(System.Security.Claims.ClaimTypes.Role, "SuperAdmin"))
                            {
                                claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                    System.Security.Claims.ClaimTypes.Role, 
                                    "SuperAdmin"));
                            }
                            return; // Skip database lookup for admin users
                        }
                        
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
                                        
                                        // Add role claim from UserType (normalize to Title Case)
                                        var userRole = user.UserType?.Trim();
                                        if (!string.IsNullOrEmpty(userRole))
                                        {
                                            // Convert to Title Case (patient → Patient, clinician → Clinician)
                                            userRole = char.ToUpper(userRole[0]) + userRole.Substring(1).ToLower();
                                            
                                            if (!claimsIdentity.HasClaim(System.Security.Claims.ClaimTypes.Role, userRole))
                                            {
                                                claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                                    System.Security.Claims.ClaimTypes.Role, 
                                                    userRole));
                                            }
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
                        
                        if (roleClaim != null)
                        {
                            var cognitoRole = roleClaim.Value?.Trim();
                            if (!string.IsNullOrEmpty(cognitoRole))
                            {
                                // Convert to Title Case (patient → Patient, clinician → Clinician)
                                cognitoRole = char.ToUpper(cognitoRole[0]) + cognitoRole.Substring(1).ToLower();
                                
                                if (!claimsIdentity.HasClaim(System.Security.Claims.ClaimTypes.Role, cognitoRole))
                                {
                                    claimsIdentity.AddClaim(new System.Security.Claims.Claim(
                                        System.Security.Claims.ClaimTypes.Role, 
                                        cognitoRole));
                                    logger.LogInformation("Added normalized role from Cognito custom claim: {Role}", cognitoRole);
                                }
                            }
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
                
            options.AddPolicy("StaffOnly", policy =>
                policy.RequireRole("Clinician", "Admin", "Owner", "SuperAdmin"));
                
            options.AddPolicy("ClinicianOnly", policy =>
                policy.RequireRole("Clinician", "Admin", "Owner", "SuperAdmin"));
                
            options.AddPolicy("AdminOnly", policy =>
                policy.RequireRole("Admin", "Owner", "SuperAdmin"));
                
            options.AddPolicy("OwnerOnly", policy =>
                policy.RequireRole("Owner", "SuperAdmin"));
            
            options.AddPolicy("SuperAdminOnly", policy =>
                policy.RequireRole("SuperAdmin"));

            options.AddPolicy("RequireTenant", policy =>
                policy.RequireClaim("tenant_id"));

            // Partner authentication policy
            options.AddPolicy("Partner", policy =>
            {
                policy.AuthenticationSchemes.Add("Partner");
                policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
                policy.RequireClaim("partner_id");
            });

            // API Key authentication policy for external API access
            options.AddPolicy("ApiKeyAuthenticated", policy =>
            {
                policy.AuthenticationSchemes.Add(ApiKeyAuthenticationHandler.SchemeName);
                policy.RequireClaim("auth_type", "api_key");
            });

            // External API with read scope
            options.AddPolicy("ExternalApiRead", policy =>
            {
                policy.AuthenticationSchemes.Add(ApiKeyAuthenticationHandler.SchemeName);
                policy.RequireClaim("auth_type", "api_key");
                policy.RequireClaim("scope", "read");
            });

            // External API with write scope
            options.AddPolicy("ExternalApiWrite", policy =>
            {
                policy.AuthenticationSchemes.Add(ApiKeyAuthenticationHandler.SchemeName);
                policy.RequireClaim("auth_type", "api_key");
                policy.RequireClaim("scope", "write");
            });
        });
        
        return services;
    }
}
