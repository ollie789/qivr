using Qivr.Services;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Middleware;

public class ImprovedAutoCreateUserMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ImprovedAutoCreateUserMiddleware> _logger;

    public ImprovedAutoCreateUserMiddleware(RequestDelegate next, ILogger<ImprovedAutoCreateUserMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IUserService userService, QivrDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sub = context.User.FindFirst("sub")?.Value;
            var email = context.User.FindFirst("email")?.Value 
                       ?? context.User.FindFirst("username")?.Value
                       ?? context.User.FindFirst("preferred_username")?.Value;

            if (!string.IsNullOrEmpty(sub))
            {
                try
                {
                    var existingUser = await userService.GetUserByCognitoSubAsync(sub);
                    
                    if (existingUser == null)
                    {
                        _logger.LogInformation("New user detected: {Sub}, redirecting to onboarding", sub);
                        
                        // Add claims for new user (no tenant yet)
                        var identity = context.User.Identity as System.Security.Claims.ClaimsIdentity;
                        if (identity != null)
                        {
                            identity.AddClaim(new System.Security.Claims.Claim("user_status", "needs_onboarding"));
                            identity.AddClaim(new System.Security.Claims.Claim("cognito_sub", sub));
                            if (!string.IsNullOrEmpty(email))
                            {
                                identity.AddClaim(new System.Security.Claims.Claim("user_email", email));
                            }
                        }
                    }
                    else if (existingUser.TenantId == null)
                    {
                        _logger.LogInformation("User exists but no tenant: {Email}", existingUser.Email);
                        
                        var identity = context.User.Identity as System.Security.Claims.ClaimsIdentity;
                        if (identity != null)
                        {
                            identity.AddClaim(new System.Security.Claims.Claim("user_status", "needs_tenant"));
                            identity.AddClaim(new System.Security.Claims.Claim("user_id", existingUser.Id.ToString()));
                        }
                    }
                    else
                    {
                        // User has tenant - add tenant claims
                        var identity = context.User.Identity as System.Security.Claims.ClaimsIdentity;
                        if (identity != null && !context.User.HasClaim(c => c.Type == "tenant_id"))
                        {
                            identity.AddClaim(new System.Security.Claims.Claim("tenant_id", existingUser.TenantId.ToString()!));
                            identity.AddClaim(new System.Security.Claims.Claim("user_id", existingUser.Id.ToString()));
                            identity.AddClaim(new System.Security.Claims.Claim("user_status", "active"));
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process user authentication for {Sub}", sub);
                }
            }
        }

        await _next(context);
    }
}
