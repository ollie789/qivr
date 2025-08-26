using Microsoft.Extensions.Options;
using Qivr.Api.Config;
using System.Security.Claims;

namespace Qivr.Api.Services;

/// <summary>
/// Mock authentication service for local development
/// WARNING: This should NEVER be used in production!
/// </summary>
public class MockAuthService : ICognitoAuthService
{
    private readonly ILogger<MockAuthService> _logger;
    private readonly Dictionary<string, MockUser> _users = new();

    public MockAuthService(ILogger<MockAuthService> logger)
    {
        _logger = logger;
        
        // Pre-populate with test users
        _users["demo@qivr.health"] = new MockUser
        {
            Username = "demo@qivr.health",
            Password = "Demo123!",
            Email = "demo@qivr.health",
            FirstName = "Demo",
            LastName = "User",
            Role = "Patient",
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111")
        };
        
        _users["clinic@qivr.health"] = new MockUser
        {
            Username = "clinic@qivr.health",
            Password = "Clinic123!",
            Email = "clinic@qivr.health",
            FirstName = "Clinic",
            LastName = "Admin",
            Role = "Clinician",
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111")
        };
    }

    public async Task<AuthenticationResult> AuthenticateAsync(string username, string password)
    {
        await Task.Delay(100); // Simulate network delay
        
        if (_users.TryGetValue(username.ToLower(), out var user) && user.Password == password)
        {
            _logger.LogInformation("Mock authentication successful for {Username}", username);
            
            return new AuthenticationResult
            {
                Success = true,
                AccessToken = GenerateMockToken(user),
                RefreshToken = Guid.NewGuid().ToString(),
                IdToken = GenerateMockToken(user),
                ExpiresIn = 3600
            };
        }

        _logger.LogWarning("Mock authentication failed for {Username}", username);
        return new AuthenticationResult
        {
            Success = false,
            ErrorMessage = "Invalid username or password"
        };
    }

    public async Task<SignUpResult> SignUpAsync(SignUpRequest request)
    {
        await Task.Delay(100);
        
        var username = request.Email.ToLower();
        if (_users.ContainsKey(username))
        {
            return new SignUpResult
            {
                Success = false,
                ErrorMessage = "User already exists"
            };
        }

        _users[username] = new MockUser
        {
            Username = username,
            Password = request.Password,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            Role = request.Role,
            TenantId = request.TenantId != Guid.Empty ? request.TenantId : Guid.Parse("11111111-1111-1111-1111-111111111111")
        };

        _logger.LogInformation("Mock user created: {Username}", username);

        return new SignUpResult
        {
            Success = true,
            UserSub = Guid.NewGuid().ToString(),
            UserConfirmed = true
        };
    }

    public async Task<UserInfo> GetUserInfoAsync(string accessToken)
    {
        await Task.Delay(50);
        
        // For mock, just return the first user or demo user
        var user = _users.Values.FirstOrDefault() ?? _users["demo@qivr.health"];
        
        return new UserInfo
        {
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            TenantId = user.TenantId,
            Role = user.Role,
            EmailVerified = true,
            PhoneVerified = false
        };
    }

    public async Task<AuthenticationResult> RefreshTokenAsync(string refreshToken)
    {
        await Task.Delay(100);
        
        // For mock, just generate a new token
        var user = _users.Values.FirstOrDefault() ?? _users["demo@qivr.health"];
        
        return new AuthenticationResult
        {
            Success = true,
            AccessToken = GenerateMockToken(user),
            IdToken = GenerateMockToken(user),
            ExpiresIn = 3600
        };
    }

    public Task<bool> ConfirmSignUpAsync(string username, string confirmationCode)
    {
        _logger.LogInformation("Mock confirmation for {Username} with code {Code}", username, confirmationCode);
        return Task.FromResult(true);
    }

    public Task<bool> InitiateForgotPasswordAsync(string username)
    {
        _logger.LogInformation("Mock forgot password for {Username}", username);
        return Task.FromResult(true);
    }

    public Task<bool> ConfirmForgotPasswordAsync(string username, string confirmationCode, string newPassword)
    {
        if (_users.TryGetValue(username.ToLower(), out var user))
        {
            user.Password = newPassword;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<bool> ChangePasswordAsync(string accessToken, string oldPassword, string newPassword)
    {
        // For mock, just return success
        return Task.FromResult(true);
    }

    public Task<bool> SignOutAsync(string accessToken)
    {
        _logger.LogInformation("Mock sign out");
        return Task.FromResult(true);
    }

    public Task<AuthenticationResult> SocialSignInAsync(string provider, string authorizationCode)
    {
        _logger.LogInformation("Mock social sign-in for provider {Provider}", provider);
        
        // Create a mock social user
        var mockUser = new MockUser
        {
            Username = $"{provider.ToLower()}user@example.com",
            Email = $"{provider.ToLower()}user@example.com",
            FirstName = provider,
            LastName = "User",
            Role = "Patient",
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111")
        };
        
        return Task.FromResult(new AuthenticationResult
        {
            Success = true,
            AccessToken = GenerateMockToken(mockUser),
            RefreshToken = Guid.NewGuid().ToString(),
            IdToken = GenerateMockToken(mockUser),
            ExpiresIn = 3600
        });
    }

    public Task<bool> SetupMfaAsync(string accessToken)
    {
        return Task.FromResult(true);
    }

    public Task<bool> VerifyMfaAsync(string session, string mfaCode)
    {
        return Task.FromResult(true);
    }

    public Task<bool> UpdateUserAttributesAsync(string accessToken, Dictionary<string, string> attributes)
    {
        return Task.FromResult(true);
    }

    public Task<List<string>> GetUserGroupsAsync(string username)
    {
        if (_users.TryGetValue(username.ToLower(), out var user))
        {
            return Task.FromResult(new List<string> { user.Role });
        }
        return Task.FromResult(new List<string>());
    }

    public ClaimsPrincipal ValidateToken(string token)
    {
        // For mock, create a simple claims principal
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Email, "demo@qivr.health"),
            new Claim("tenant_id", "11111111-1111-1111-1111-111111111111"),
            new Claim(ClaimTypes.Role, "Patient")
        };
        
        var identity = new ClaimsIdentity(claims, "Mock");
        return new ClaimsPrincipal(identity);
    }

    private string GenerateMockToken(MockUser user)
    {
        // Generate a simple mock JWT-like token (not a real JWT!)
        var payload = $"{user.Username}|{user.Role}|{user.TenantId}|{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(payload));
    }

    private class MockUser
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid TenantId { get; set; }
    }
}
