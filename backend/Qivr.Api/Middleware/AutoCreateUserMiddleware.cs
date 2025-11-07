using Qivr.Services;

namespace Qivr.Api.Middleware;

public class AutoCreateUserMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AutoCreateUserMiddleware> _logger;

    public AutoCreateUserMiddleware(RequestDelegate next, ILogger<AutoCreateUserMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IUserService userService)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sub = context.User.FindFirst("sub")?.Value;
            
            // Try multiple claim types for email (Cognito can use different claim names)
            var email = context.User.FindFirst("email")?.Value 
                       ?? context.User.FindFirst("username")?.Value
                       ?? context.User.FindFirst("preferred_username")?.Value;

            if (!string.IsNullOrEmpty(sub))
            {
                try
                {
                    // Check if user already exists
                    var existingUser = await userService.GetUserByCognitoSubAsync(sub);
                    
                    if (existingUser == null)
                    {
                        _logger.LogInformation("User not found for Cognito sub {Sub}, attempting auto-creation", sub);
                        
                        // If no email in claims, generate one from sub
                        if (string.IsNullOrEmpty(email))
                        {
                            email = $"user-{sub}@cognito.local";
                            _logger.LogWarning("No email claim found for sub {Sub}, using generated email {Email}", sub, email);
                        }

                        var givenName = context.User.FindFirst("given_name")?.Value;
                        var familyName = context.User.FindFirst("family_name")?.Value;
                        var phone = context.User.FindFirst("phone_number")?.Value;

                        var user = await userService.GetOrCreateUserFromCognitoAsync(sub, email, givenName, familyName, phone);
                        
                        _logger.LogInformation("Auto-created user {Email} with tenant {TenantId}", user.Email, user.TenantId);
                        
                        // Add claims to current request
                        var identity = context.User.Identity as System.Security.Claims.ClaimsIdentity;
                        if (identity != null && !context.User.HasClaim(c => c.Type == "tenant_id"))
                        {
                            identity.AddClaim(new System.Security.Claims.Claim("tenant_id", user.TenantId.ToString()));
                            identity.AddClaim(new System.Security.Claims.Claim("user_id", user.Id.ToString()));
                            _logger.LogInformation("Added tenant_id claim {TenantId} to request", user.TenantId);
                        }
                    }
                    else
                    {
                        // User exists, ensure claims are added
                        var identity = context.User.Identity as System.Security.Claims.ClaimsIdentity;
                        if (identity != null && !context.User.HasClaim(c => c.Type == "tenant_id"))
                        {
                            identity.AddClaim(new System.Security.Claims.Claim("tenant_id", existingUser.TenantId.ToString()));
                            identity.AddClaim(new System.Security.Claims.Claim("user_id", existingUser.Id.ToString()));
                            _logger.LogInformation("Added existing user tenant_id claim {TenantId} to request", existingUser.TenantId);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to auto-create or retrieve user for Cognito sub {Sub}", sub);
                }
            }
        }

        await _next(context);
    }
}
