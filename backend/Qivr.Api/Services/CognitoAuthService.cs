using Amazon;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Microsoft.Extensions.Options;
using Qivr.Api.Config;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Qivr.Api.Services;

public interface ICognitoAuthService
{
    Task<AuthenticationResult> AuthenticateAsync(string username, string password);
    Task<AuthenticationResult> RefreshTokenAsync(string refreshToken);
    Task<SignUpResult> SignUpAsync(SignUpRequest request);
    Task<bool> ConfirmSignUpAsync(string username, string confirmationCode);
    Task<bool> InitiateForgotPasswordAsync(string username);
    Task<bool> ConfirmForgotPasswordAsync(string username, string confirmationCode, string newPassword);
    Task<bool> ChangePasswordAsync(string accessToken, string oldPassword, string newPassword);
    Task<bool> SignOutAsync(string accessToken);
    Task<AuthenticationResult> SocialSignInAsync(string provider, string authorizationCode);
    Task<bool> SetupMfaAsync(string accessToken);
    Task<AuthenticationResult> VerifyMfaAsync(string session, string mfaCode, ChallengeNameType challengeName);
    Task<UserInfo> GetUserInfoAsync(string accessToken);
    Task<bool> UpdateUserAttributesAsync(string accessToken, Dictionary<string, string> attributes);
    Task<List<string>> GetUserGroupsAsync(string username);
    ClaimsPrincipal ValidateToken(string token);
    Task<bool> InvalidateRefreshTokenAsync(string refreshToken);
}

public class CognitoAuthService : ICognitoAuthService
{
    private readonly IAmazonCognitoIdentityProvider _cognitoClient;
    private readonly CognitoSettings _settings;
    private readonly ILogger<CognitoAuthService> _logger;
    private readonly QivrDbContext _dbContext;

    public CognitoAuthService(
        IOptions<CognitoSettings> settings,
        ILogger<CognitoAuthService> logger,
        QivrDbContext dbContext)
    {
        _settings = settings.Value;
        _logger = logger;
        _dbContext = dbContext;
        _cognitoClient = new AmazonCognitoIdentityProviderClient(
            RegionEndpoint.GetBySystemName(_settings.Region));
    }

    public async Task<AuthenticationResult> AuthenticateAsync(string username, string password)
    {
        try
        {
            var authParams = new Dictionary<string, string>
            {
                {"USERNAME", username},
                {"PASSWORD", password}
            };
            
            // Only add SECRET_HASH if client secret is configured
            if (!string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            {
                authParams["SECRET_HASH"] = CalculateSecretHash(username);
            }
            
            var request = new InitiateAuthRequest
            {
                AuthFlow = AuthFlowType.USER_PASSWORD_AUTH,
                ClientId = _settings.UserPoolClientId,
                AuthParameters = authParams
            };

            var response = await _cognitoClient.InitiateAuthAsync(request);
            
            if (response.ChallengeName == ChallengeNameType.MFA_SETUP)
            {
                return new AuthenticationResult
                {
                    Success = false,
                    RequiresMfa = true,
                    Session = response.Session,
                    ChallengeName = response.ChallengeName
                };
            }
            
            if (response.ChallengeName == ChallengeNameType.SMS_MFA ||
                response.ChallengeName == ChallengeNameType.SOFTWARE_TOKEN_MFA)
            {
                return new AuthenticationResult
                {
                    Success = false,
                    RequiresMfa = true,
                    Session = response.Session,
                    ChallengeName = response.ChallengeName
                };
            }

            UserInfo? userInfo = null;
            try
            {
                if (!string.IsNullOrEmpty(response.AuthenticationResult.AccessToken))
                {
                    userInfo = await GetUserInfoAsync(response.AuthenticationResult.AccessToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load user info after authentication for {Username}", username);
            }

            return new AuthenticationResult
            {
                Success = true,
                AccessToken = response.AuthenticationResult.AccessToken,
                RefreshToken = response.AuthenticationResult.RefreshToken,
                IdToken = response.AuthenticationResult.IdToken,
                ExpiresIn = response.AuthenticationResult.ExpiresIn,
                UserInfo = userInfo
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authentication failed for user {Username}", username);
            return new AuthenticationResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<AuthenticationResult> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var authParams = new Dictionary<string, string>
            {
                {"REFRESH_TOKEN", refreshToken}
            };
            
            // Only add SECRET_HASH if client secret is configured
            if (!string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            {
                authParams["SECRET_HASH"] = CalculateSecretHash(_settings.UserPoolClientId);
            }
            
            var request = new InitiateAuthRequest
            {
                AuthFlow = AuthFlowType.REFRESH_TOKEN_AUTH,
                ClientId = _settings.UserPoolClientId,
                AuthParameters = authParams
            };

            var response = await _cognitoClient.InitiateAuthAsync(request);
            
            return new AuthenticationResult
            {
                Success = true,
                AccessToken = response.AuthenticationResult.AccessToken,
                IdToken = response.AuthenticationResult.IdToken,
                ExpiresIn = response.AuthenticationResult.ExpiresIn
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed");
            return new AuthenticationResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<SignUpResult> SignUpAsync(SignUpRequest request)
    {
        try
        {
            var signUpRequest = new Amazon.CognitoIdentityProvider.Model.SignUpRequest
            {
                ClientId = _settings.UserPoolClientId,
                Username = request.Username,
                Password = request.Password,
                UserAttributes = new List<AttributeType>
                {
                    new() { Name = "email", Value = request.Email },
                    new() { Name = "given_name", Value = request.FirstName },
                    new() { Name = "family_name", Value = request.LastName },
                    new() { Name = "phone_number", Value = request.PhoneNumber }
                }
            };
            
            // Only add SECRET_HASH if client secret is configured
            if (!string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            {
                signUpRequest.SecretHash = CalculateSecretHash(request.Username);
            }

            var response = await _cognitoClient.SignUpAsync(signUpRequest);
            
            // Create tenant and user in database
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = $"{request.FirstName} {request.LastName} Clinic",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.Tenants.AddAsync(tenant);
            
            var user = new User
            {
                Id = Guid.NewGuid(),
                CognitoSub = response.UserSub,
                TenantId = tenant.Id,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                UserType = Qivr.Core.Entities.UserType.Admin,
                Roles = new List<string> { "Admin" },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.Users.AddAsync(user);
            
            await _dbContext.SaveChangesAsync();
            
            return new SignUpResult
            {
                Success = true,
                UserSub = response.UserSub,
                UserConfirmed = response.UserConfirmed,
                CodeDeliveryDetails = response.CodeDeliveryDetails?.DeliveryMedium,
                TenantId = tenant.Id,
                UserId = user.Id
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sign up failed for user {Username}", request.Username);
            return new SignUpResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<bool> ConfirmSignUpAsync(string username, string confirmationCode)
    {
        try
        {
            var request = new ConfirmSignUpRequest
            {
                ClientId = _settings.UserPoolClientId,
                Username = username,
                ConfirmationCode = confirmationCode
            };
            
            // Only add SECRET_HASH if client secret is configured
            if (!string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            {
                request.SecretHash = CalculateSecretHash(username);
            }

            await _cognitoClient.ConfirmSignUpAsync(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sign up confirmation failed for user {Username}", username);
            return false;
        }
    }

    public async Task<bool> InitiateForgotPasswordAsync(string username)
    {
        try
        {
            var request = new ForgotPasswordRequest
            {
                ClientId = _settings.UserPoolClientId,
                Username = username
            };
            
            // Only add SECRET_HASH if client secret is configured
            if (!string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            {
                request.SecretHash = CalculateSecretHash(username);
            }

            await _cognitoClient.ForgotPasswordAsync(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Forgot password initiation failed for user {Username}", username);
            return false;
        }
    }

    public async Task<bool> ConfirmForgotPasswordAsync(string username, string confirmationCode, string newPassword)
    {
        try
        {
            var request = new ConfirmForgotPasswordRequest
            {
                ClientId = _settings.UserPoolClientId,
                Username = username,
                ConfirmationCode = confirmationCode,
                Password = newPassword
            };
            
            // Only add SECRET_HASH if client secret is configured
            if (!string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            {
                request.SecretHash = CalculateSecretHash(username);
            }

            await _cognitoClient.ConfirmForgotPasswordAsync(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Forgot password confirmation failed for user {Username}", username);
            return false;
        }
    }

    public async Task<bool> ChangePasswordAsync(string accessToken, string oldPassword, string newPassword)
    {
        try
        {
            var request = new ChangePasswordRequest
            {
                AccessToken = accessToken,
                PreviousPassword = oldPassword,
                ProposedPassword = newPassword
            };

            await _cognitoClient.ChangePasswordAsync(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Password change failed");
            return false;
        }
    }

    public async Task<bool> SignOutAsync(string accessToken)
    {
        try
        {
            var request = new GlobalSignOutRequest
            {
                AccessToken = accessToken
            };

            await _cognitoClient.GlobalSignOutAsync(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sign out failed");
            return false;
        }
    }

    public Task<AuthenticationResult> SocialSignInAsync(string provider, string authorizationCode)
    {
        // This would integrate with Cognito's hosted UI or custom flow
        // Implementation depends on specific social provider setup
        throw new NotImplementedException("Social sign-in requires hosted UI configuration");
    }

    public async Task<bool> SetupMfaAsync(string accessToken)
    {
        try
        {
            var request = new AssociateSoftwareTokenRequest
            {
                AccessToken = accessToken
            };

            var response = await _cognitoClient.AssociateSoftwareTokenAsync(request);
            return !string.IsNullOrEmpty(response.SecretCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MFA setup failed");
            return false;
        }
    }

    public async Task<AuthenticationResult> VerifyMfaAsync(string session, string mfaCode, ChallengeNameType challengeName)
    {
        try
        {
            var challengeResponses = new Dictionary<string, string>
            {
                {
                    challengeName == ChallengeNameType.SOFTWARE_TOKEN_MFA
                        ? "SOFTWARE_TOKEN_MFA_CODE"
                        : "SMS_MFA_CODE",
                    mfaCode
                }
            };
            
            // Only add SECRET_HASH if client secret is configured
            if (!string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            {
                challengeResponses["SECRET_HASH"] = CalculateSecretHash(_settings.UserPoolClientId);
            }
            
            var request = new RespondToAuthChallengeRequest
            {
                ClientId = _settings.UserPoolClientId,
                ChallengeName = challengeName,
                Session = session,
                ChallengeResponses = challengeResponses
            };

            var response = await _cognitoClient.RespondToAuthChallengeAsync(request);
            if (response.AuthenticationResult == null)
            {
                return new AuthenticationResult
                {
                    Success = false,
                    ErrorMessage = "MFA challenge did not return tokens"
                };
            }

            UserInfo? userInfo = null;
            try
            {
                if (!string.IsNullOrEmpty(response.AuthenticationResult.AccessToken))
                {
                    userInfo = await GetUserInfoAsync(response.AuthenticationResult.AccessToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load user info after MFA verification");
            }

            return new AuthenticationResult
            {
                Success = true,
                AccessToken = response.AuthenticationResult.AccessToken,
                RefreshToken = response.AuthenticationResult.RefreshToken,
                IdToken = response.AuthenticationResult.IdToken,
                ExpiresIn = response.AuthenticationResult.ExpiresIn,
                UserInfo = userInfo
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MFA verification failed");
            return new AuthenticationResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<UserInfo> GetUserInfoAsync(string accessToken)
    {
        try
        {
            var request = new GetUserRequest
            {
                AccessToken = accessToken
            };

            var response = await _cognitoClient.GetUserAsync(request);
            
            var attributes = response.UserAttributes.ToDictionary(a => a.Name, a => a.Value);
            
            return new UserInfo
            {
                Username = response.Username,
                Email = attributes.GetValueOrDefault("email"),
                FirstName = attributes.GetValueOrDefault("given_name"),
                LastName = attributes.GetValueOrDefault("family_name"),
                PhoneNumber = attributes.GetValueOrDefault("phone_number"),
                TenantId = Guid.TryParse(attributes.GetValueOrDefault("custom:tenant_id"), out var tid) ? tid : null,
                Role = attributes.GetValueOrDefault("custom:role"),
                EmailVerified = bool.Parse(attributes.GetValueOrDefault("email_verified", "false")),
                PhoneVerified = bool.Parse(attributes.GetValueOrDefault("phone_number_verified", "false"))
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user info");
            throw;
        }
    }

    public async Task<bool> UpdateUserAttributesAsync(string accessToken, Dictionary<string, string> attributes)
    {
        try
        {
            var request = new UpdateUserAttributesRequest
            {
                AccessToken = accessToken,
                UserAttributes = attributes.Select(a => new AttributeType 
                { 
                    Name = a.Key, 
                    Value = a.Value 
                }).ToList()
            };

            await _cognitoClient.UpdateUserAttributesAsync(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update user attributes");
            return false;
        }
    }

    public async Task<List<string>> GetUserGroupsAsync(string username)
    {
        try
        {
            var request = new AdminListGroupsForUserRequest
            {
                Username = username,
                UserPoolId = _settings.UserPoolId
            };

            var response = await _cognitoClient.AdminListGroupsForUserAsync(request);
            return response.Groups.Select(g => g.GroupName).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user groups for {Username}", username);
            return new List<string>();
        }
    }

    public ClaimsPrincipal ValidateToken(string token)
    {
        // Token validation would typically be done via JWT middleware
        // This is a simplified version for demonstration
        var claims = new List<Claim>();
        
        // Parse JWT and extract claims
        // Add implementation for JWT parsing and validation
        
        var identity = new ClaimsIdentity(claims, "Cognito");
        return new ClaimsPrincipal(identity);
    }

    public async Task<bool> InvalidateRefreshTokenAsync(string refreshToken)
    {
        try
        {
            // In Cognito, we can't directly invalidate a specific refresh token
            // But we can revoke all tokens for a user if we have their access token
            // For now, we'll log the invalidation attempt
            // In production, you might want to maintain a blacklist in a cache/database
            
            _logger.LogInformation("Refresh token invalidation requested for token ending with: {TokenSuffix}", 
                refreshToken.Length > 10 ? refreshToken.Substring(refreshToken.Length - 10) : "[short token]");
            
            // In a production system, you would:
            // 1. Store invalidated tokens in Redis/cache with expiry matching token lifetime
            // 2. Check this blacklist during token refresh
            // 3. Or use AWS Cognito's RevokeToken API if available
            
            return await Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to invalidate refresh token");
            return false;
        }
    }

    private string CalculateSecretHash(string username)
    {
        if (string.IsNullOrEmpty(_settings.UserPoolClientSecret))
            return string.Empty;

        var message = Encoding.UTF8.GetBytes(username + _settings.UserPoolClientId);
        var key = Encoding.UTF8.GetBytes(_settings.UserPoolClientSecret);
        
        using var hmac = new HMACSHA256(key);
        var hash = hmac.ComputeHash(message);
        return Convert.ToBase64String(hash);
    }
}

// DTOs
public class AuthenticationResult
{
    public bool Success { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public string? IdToken { get; set; }
    public int? ExpiresIn { get; set; }
    public bool RequiresMfa { get; set; }
    public string? Session { get; set; }
    public string? ErrorMessage { get; set; }
    public UserInfo? UserInfo { get; set; }  // Added UserInfo property
    public ChallengeNameType? ChallengeName { get; set; }
}

public class SignUpRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string Role { get; set; } = "Patient";
}

public class SignUpResult
{
    public bool Success { get; set; }
    public string? UserSub { get; set; }
    public bool UserConfirmed { get; set; }
    public string? CodeDeliveryDetails { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? UserId { get; set; }
}

public class UserInfo
{
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? TenantId { get; set; }
    public string? Role { get; set; }
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
}
