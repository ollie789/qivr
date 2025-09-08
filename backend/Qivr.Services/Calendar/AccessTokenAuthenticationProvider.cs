using Microsoft.Kiota.Abstractions;
using Microsoft.Kiota.Abstractions.Authentication;
using System.Net.Http.Headers;

namespace Qivr.Services.Calendar;

/// <summary>
/// Custom authentication provider for Microsoft Graph SDK v5 that uses a pre-acquired access token
/// </summary>
public class AccessTokenAuthenticationProvider : IAuthenticationProvider
{
    private readonly string _accessToken;
    
    public AccessTokenAuthenticationProvider(string accessToken)
    {
        _accessToken = accessToken ?? throw new ArgumentNullException(nameof(accessToken));
    }
    
    public Task AuthenticateRequestAsync(RequestInformation request, 
        Dictionary<string, object>? additionalAuthenticationContext = null, 
        CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }
        
        // Add the Authorization header with the Bearer token
        request.Headers.Add("Authorization", new[] { $"Bearer {_accessToken}" });
        
        return Task.CompletedTask;
    }
}
