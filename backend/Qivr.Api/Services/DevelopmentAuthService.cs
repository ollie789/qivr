using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Qivr.Api.Config;

namespace Qivr.Api.Services;

public class DevelopmentAuthService : ICognitoAuthService
{
    private readonly DevAuthSettings _settings;
    private readonly DevTokenGenerator _tokenGenerator;
    private readonly ILogger<DevelopmentAuthService> _logger;
    private readonly ConcurrentDictionary<string, DevAuthSession> _refreshSessions = new();
    private readonly ConcurrentDictionary<string, DevAuthSession> _accessSessions = new();
    private readonly TokenValidationParameters _validationParameters;

    public DevelopmentAuthService(
        IOptions<DevAuthSettings> settings,
        DevTokenGenerator tokenGenerator,
        ILogger<DevelopmentAuthService> logger,
        IConfiguration configuration)
    {
        _settings = settings.Value;
        _tokenGenerator = tokenGenerator;
        _logger = logger;

        var secretKey = configuration["Jwt:SecretKey"] ?? "dev-secret-key-for-testing-only-32-characters-minimum";
        _validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    }

    public Task<AuthenticationResult> AuthenticateAsync(string username, string password)
    {
        var session = CreateSession(username);
        return Task.FromResult(session);
    }

    public Task<AuthenticationResult> RefreshTokenAsync(string refreshToken)
    {
        if (!_refreshSessions.TryGetValue(refreshToken, out var existingSession))
        {
            return Task.FromResult(new AuthenticationResult
            {
                Success = false,
                ErrorMessage = "Invalid refresh token"
            });
        }

        var newSession = CreateSession(existingSession.UserInfo?.Email ?? existingSession.UserId, existingSession);
        // Invalidate old refresh token
        _refreshSessions.TryRemove(refreshToken, out _);

        return Task.FromResult(newSession);
    }

    public Task<SignUpResult> SignUpAsync(SignUpRequest request)
    {
        // Development auth does not persist users
        return Task.FromResult(new SignUpResult
        {
            Success = true,
            UserSub = request.Username,
            UserConfirmed = true
        });
    }

    public Task<bool> ConfirmSignUpAsync(string username, string confirmationCode) => Task.FromResult(true);

    public Task<bool> InitiateForgotPasswordAsync(string username) => Task.FromResult(true);

    public Task<bool> ConfirmForgotPasswordAsync(string username, string confirmationCode, string newPassword) => Task.FromResult(true);

    public Task<bool> ChangePasswordAsync(string accessToken, string oldPassword, string newPassword) => Task.FromResult(true);

    public Task<bool> SignOutAsync(string accessToken)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            _accessSessions.TryRemove(accessToken, out _);
        }
        return Task.FromResult(true);
    }

    public Task<AuthenticationResult> SocialSignInAsync(string provider, string authorizationCode)
        => Task.FromResult(CreateSession(provider + "@social.dev"));

    public Task<bool> SetupMfaAsync(string accessToken) => Task.FromResult(true);

    public Task<AuthenticationResult> VerifyMfaAsync(string session, string mfaCode, ChallengeNameType challengeName)
        => Task.FromResult(CreateSession("mfa-user@dev.local"));

    public Task<UserInfo> GetUserInfoAsync(string accessToken)
    {
        if (!string.IsNullOrEmpty(accessToken) && _accessSessions.TryGetValue(accessToken, out var session))
        {
            return Task.FromResult(session.UserInfo ?? CreateUserInfoFromSession(session));
        }

        // Attempt to parse from token claims
        try
        {
            var principal = ValidateToken(accessToken);
            var info = BuildUserInfoFromPrincipal(principal);
            return Task.FromResult(info);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse dev access token");
            return Task.FromResult(CreateDefaultUserInfo());
        }
    }

    public Task<bool> UpdateUserAttributesAsync(string accessToken, Dictionary<string, string> attributes)
    {
        if (!string.IsNullOrEmpty(accessToken) && _accessSessions.TryGetValue(accessToken, out var session))
        {
            var info = session.UserInfo ?? CreateUserInfoFromSession(session);
            if (attributes.TryGetValue("firstName", out var firstName))
            {
                info.FirstName = firstName;
            }
            if (attributes.TryGetValue("lastName", out var lastName))
            {
                info.LastName = lastName;
            }
            session.UserInfo = info;
            _accessSessions[accessToken] = session;
        }
        return Task.FromResult(true);
    }

    public Task<List<string>> GetUserGroupsAsync(string username)
        => Task.FromResult(new List<string> { _settings.DefaultUser.Role });

    public ClaimsPrincipal ValidateToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        return handler.ValidateToken(token, _validationParameters, out _);
    }

    public Task<bool> InvalidateRefreshTokenAsync(string refreshToken)
    {
        _refreshSessions.TryRemove(refreshToken, out _);
        return Task.FromResult(true);
    }

    private AuthenticationResult CreateSession(string username, DevAuthSession? existing = null)
    {
        if (existing is not null)
        {
            if (!string.IsNullOrEmpty(existing.AccessToken))
            {
                _accessSessions.TryRemove(existing.AccessToken, out _);
            }

            if (!string.IsNullOrEmpty(existing.RefreshToken))
            {
                _refreshSessions.TryRemove(existing.RefreshToken, out _);
            }
        }

        var defaultUser = _settings.DefaultUser;
        var tenantId = GetTenantId(existing);
        var userId = existing?.UserId ?? (!string.IsNullOrWhiteSpace(defaultUser.Id) ? defaultUser.Id : Guid.NewGuid().ToString());
        var email = username.Contains('@', StringComparison.Ordinal)
            ? username
            : (!string.IsNullOrWhiteSpace(defaultUser.Email) ? defaultUser.Email : $"{username}@dev.qivr.local");
        var role = existing?.Role ?? defaultUser.Role ?? _settings.DefaultRole ?? "Clinician";

        var accessToken = _tokenGenerator.GenerateDevToken(
            email,
            userId,
            tenantId,
            role);
        var refreshToken = GenerateRefreshToken();

        var userInfo = existing?.UserInfo ?? new UserInfo
        {
            Username = userId,
            Email = email,
            FirstName = defaultUser.FirstName,
            LastName = defaultUser.LastName,
            TenantId = Guid.TryParse(tenantId, out var parsedTenant) ? parsedTenant : null,
            Role = role,
            EmailVerified = true,
            PhoneVerified = true
        };

        var session = new DevAuthSession
        {
            UserId = userId,
            TenantId = tenantId,
            Role = role,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserInfo = userInfo
        };

        _refreshSessions[refreshToken] = session;
        _accessSessions[accessToken] = session;

        return new AuthenticationResult
        {
            Success = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            IdToken = accessToken,
            ExpiresIn = 3600,
            UserInfo = userInfo
        };
    }

    private string GetTenantId(DevAuthSession? session)
    {
        if (!string.IsNullOrWhiteSpace(session?.TenantId))
        {
            return session!.TenantId!;
        }

        if (!string.IsNullOrWhiteSpace(_settings.DefaultUser.TenantId))
        {
            return _settings.DefaultUser.TenantId!;
        }

        if (!string.IsNullOrWhiteSpace(_settings.DefaultTenantId))
        {
            return _settings.DefaultTenantId!;
        }

        // SECURITY: Require explicit configuration in dev auth settings
        throw new InvalidOperationException("Development auth requires DefaultTenantId to be configured in DevAuth settings");
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private UserInfo CreateDefaultUserInfo()
    {
        return new UserInfo
        {
            Username = _settings.DefaultUser.Id,
            Email = _settings.DefaultUser.Email,
            FirstName = _settings.DefaultUser.FirstName,
            LastName = _settings.DefaultUser.LastName,
            TenantId = Guid.TryParse(_settings.DefaultUser.TenantId, out var tenant) ? tenant : null,
            Role = _settings.DefaultUser.Role,
            EmailVerified = true,
            PhoneVerified = true
        };
    }

    private static UserInfo CreateUserInfoFromSession(DevAuthSession session)
    {
        return session.UserInfo ?? new UserInfo
        {
            Username = session.UserId,
            Email = session.UserInfo?.Email,
            FirstName = session.UserInfo?.FirstName,
            LastName = session.UserInfo?.LastName,
            TenantId = Guid.TryParse(session.TenantId, out var tenant) ? tenant : null,
            Role = session.Role,
            EmailVerified = true,
            PhoneVerified = true
        };
    }

    private static UserInfo BuildUserInfoFromPrincipal(ClaimsPrincipal principal)
    {
        var tenantClaim = principal.FindFirst("tenant_id")?.Value
            ?? principal.FindFirst("custom:tenant_id")?.Value;
        return new UserInfo
        {
            Username = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "dev-user",
            Email = principal.FindFirst(ClaimTypes.Email)?.Value,
            FirstName = principal.FindFirst(ClaimTypes.GivenName)?.Value ?? "Dev",
            LastName = principal.FindFirst(ClaimTypes.Surname)?.Value ?? "User",
            TenantId = Guid.TryParse(tenantClaim, out var tenant) ? tenant : null,
            Role = principal.FindFirst(ClaimTypes.Role)?.Value ?? "Clinician",
            EmailVerified = true,
            PhoneVerified = true
        };
    }

    private record DevAuthSession
    {
        public string UserId { get; init; } = string.Empty;
        public string TenantId { get; init; } = string.Empty;
        public string Role { get; init; } = "Clinician";
        public string AccessToken { get; init; } = string.Empty;
        public string RefreshToken { get; init; } = string.Empty;
        public UserInfo? UserInfo { get; set; }
    }
}
