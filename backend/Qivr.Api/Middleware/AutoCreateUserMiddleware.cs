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
            var email = context.User.FindFirst("email")?.Value;

            if (!string.IsNullOrEmpty(sub) && !string.IsNullOrEmpty(email))
            {
                try
                {
                    var givenName = context.User.FindFirst("given_name")?.Value;
                    var familyName = context.User.FindFirst("family_name")?.Value;
                    var phone = context.User.FindFirst("phone_number")?.Value;

                    var user = await userService.GetOrCreateUserFromCognitoAsync(sub, email, givenName, familyName, phone);
                    
                    if (!context.User.HasClaim(c => c.Type == "tenant_id"))
                    {
                        var identity = context.User.Identity as System.Security.Claims.ClaimsIdentity;
                        identity?.AddClaim(new System.Security.Claims.Claim("tenant_id", user.TenantId.ToString()));
                        identity?.AddClaim(new System.Security.Claims.Claim("user_id", user.Id.ToString()));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to auto-create user for {Email}", email);
                }
            }
        }

        await _next(context);
    }
}
