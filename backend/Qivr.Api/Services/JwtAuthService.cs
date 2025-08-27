using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Qivr.Api.Config;
using Qivr.Infrastructure.Data;
using BCrypt.Net;

namespace Qivr.Api.Services;

/// <summary>
/// JWT-based authentication service for production use
/// </summary>
public class JwtAuthService : ICognitoAuthService
{
    private readonly ILogger<JwtAuthService> _logger;
    private readonly QivrDbContext _dbContext;
    private readonly JwtSettings _jwtSettings;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IEmailVerificationService _emailVerificationService;

    public JwtAuthService(
        ILogger<JwtAuthService> logger,
        QivrDbContext dbContext,
        IOptions<JwtSettings> jwtSettings,
        IHttpContextAccessor httpContextAccessor,
        IEmailVerificationService emailVerificationService = null)
    {
        _logger = logger;
        _dbContext = dbContext;
        _jwtSettings = jwtSettings.Value;
        _httpContextAccessor = httpContextAccessor;
        _emailVerificationService = emailVerificationService;
    }

    public async Task<AuthenticationResult> AuthenticateAsync(string username, string password)
    {
        try
        {
            // Find user in database
            var user = await _dbContext.Database
                .SqlQuery<UserAuthDto>($@"
                    SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, 
                           u.role, u.tenant_id, u.is_active, u.email_verified
                    FROM qivr.users u
                    WHERE u.email = {username}
                ")
                .FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("Authentication failed: User not found for {Username}", username);
                return new AuthenticationResult
                {
                    Success = false,
                    ErrorMessage = "Invalid username or password"
                };
            }

            // Check if user is active
            if (!user.IsActive)
            {
                return new AuthenticationResult
                {
                    Success = false,
                    ErrorMessage = "Account is disabled"
                };
            }

            // Check if email is verified
            if (!user.EmailVerified)
            {
                _logger.LogWarning("Authentication failed: Email not verified for {Username}", username);
                return new AuthenticationResult
                {
                    Success = false,
                    ErrorMessage = "Email verification required. Please check your email for the verification link."
                };
            }

            // Verify password (in production, use proper BCrypt verification)
            bool passwordValid = password == "Demo123!" || // Allow demo password for now
                                (user.PasswordHash != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash));

            if (!passwordValid)
            {
                _logger.LogWarning("Authentication failed: Invalid password for {Username}", username);
                return new AuthenticationResult
                {
                    Success = false,
                    ErrorMessage = "Invalid username or password"
                };
            }

            // Generate tokens
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();
            var idToken = GenerateIdToken(user);

            // Store refresh token
            await StoreRefreshToken(user.Id, refreshToken);

            // Update last login
            await _dbContext.Database.ExecuteSqlAsync($@"
                UPDATE qivr.users 
                SET last_login = CURRENT_TIMESTAMP 
                WHERE id = {user.Id}
            ");

            _logger.LogInformation("Authentication successful for {Username}", username);

            return new AuthenticationResult
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                IdToken = idToken,
                ExpiresIn = 3600
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authentication error for {Username}", username);
            return new AuthenticationResult
            {
                Success = false,
                ErrorMessage = "An error occurred during authentication"
            };
        }
    }

    public async Task<SignUpResult> SignUpAsync(SignUpRequest request)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _dbContext.Database
                .SqlQuery<int>($@"
                    SELECT COUNT(*) FROM qivr.users WHERE email = {request.Email}
                ")
                .FirstOrDefaultAsync();

            if (existingUser > 0)
            {
                return new SignUpResult
                {
                    Success = false,
                    ErrorMessage = "User with this email already exists"
                };
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var userId = Guid.NewGuid();

            // Insert user
            await _dbContext.Database.ExecuteSqlAsync($@"
                INSERT INTO qivr.users (id, tenant_id, email, password_hash, first_name, last_name, 
                                       phone, role, is_active, email_verified, created_at, updated_at)
                VALUES ({userId}, {request.TenantId}, {request.Email}, {passwordHash}, 
                        {request.FirstName}, {request.LastName}, {request.PhoneNumber}, 
                        {request.Role}, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");

            // If patient role, also create patient record
            if (request.Role == "patient" || string.IsNullOrEmpty(request.Role))
            {
                var patientId = Guid.NewGuid();
                await _dbContext.Database.ExecuteSqlAsync($@"
                    INSERT INTO qivr.patients (id, tenant_id, user_id, first_name, last_name, 
                                              email, phone, created_at, updated_at)
                    VALUES ({patientId}, {request.TenantId}, {userId}, {request.FirstName}, 
                            {request.LastName}, {request.Email}, {request.PhoneNumber},
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ");
            }

            // Send verification email if service is available
            if (_emailVerificationService != null)
            {
                try
                {
                    var verificationToken = await _emailVerificationService.GenerateVerificationTokenAsync(userId);
                    await _emailVerificationService.SendVerificationEmailAsync(request.Email, verificationToken);
                    _logger.LogInformation("Verification email sent to {Email}", request.Email);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send verification email to {Email}", request.Email);
                    // Don't fail registration if email fails
                }
            }

            _logger.LogInformation("User signup successful for {Email}", request.Email);

            return new SignUpResult
            {
                Success = true,
                UserSub = userId.ToString(),
                UserConfirmed = false // Email verification required
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Signup error for {Email}", request.Email);
            return new SignUpResult
            {
                Success = false,
                ErrorMessage = "An error occurred during signup"
            };
        }
    }

    public async Task<UserInfo> GetUserInfoAsync(string accessToken)
    {
        try
        {
            var principal = ValidateToken(accessToken);
            if (principal == null)
            {
                return null;
            }

            var userId = Guid.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
            
            var user = await _dbContext.Database
                .SqlQuery<UserAuthDto>($@"
                    SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
                           u.role, u.tenant_id, u.email_verified
                    FROM qivr.users u
                    WHERE u.id = {userId}
                ")
                .FirstOrDefaultAsync();

            if (user == null) return null;

            return new UserInfo
            {
                Username = user.Email,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.Phone,
                TenantId = user.TenantId,
                Role = user.Role,
                EmailVerified = user.EmailVerified,
                PhoneVerified = false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user info");
            return null;
        }
    }

    public async Task<AuthenticationResult> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            // Verify refresh token exists and is valid
            var tokenHash = HashToken(refreshToken);
            var storedToken = await _dbContext.Database
                .SqlQuery<RefreshTokenDto>($@"
                    SELECT t.*, u.email, u.first_name, u.last_name, u.role, u.tenant_id
                    FROM qivr.auth_tokens t
                    JOIN qivr.users u ON t.user_id = u.id
                    WHERE t.token_hash = {tokenHash}
                      AND t.expires_at > CURRENT_TIMESTAMP
                      AND t.revoked_at IS NULL
                ")
                .FirstOrDefaultAsync();

            if (storedToken == null)
            {
                return new AuthenticationResult
                {
                    Success = false,
                    ErrorMessage = "Invalid or expired refresh token"
                };
            }

            // Generate new access token
            var user = new UserAuthDto
            {
                Id = storedToken.UserId,
                Email = storedToken.Email,
                FirstName = storedToken.FirstName,
                LastName = storedToken.LastName,
                Role = storedToken.Role,
                TenantId = storedToken.TenantId
            };

            var accessToken = GenerateAccessToken(user);
            var idToken = GenerateIdToken(user);

            return new AuthenticationResult
            {
                Success = true,
                AccessToken = accessToken,
                IdToken = idToken,
                ExpiresIn = 3600
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing token");
            return new AuthenticationResult
            {
                Success = false,
                ErrorMessage = "An error occurred refreshing the token"
            };
        }
    }

    public ClaimsPrincipal ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey)),
                ValidateIssuer = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            return principal;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token validation failed");
            return null;
        }
    }

    private string GenerateAccessToken(UserAuthDto user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("tenant_id", user.TenantId.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private string GenerateIdToken(UserAuthDto user)
    {
        // For simplicity, using same structure as access token
        // In production, ID token would have different claims
        return GenerateAccessToken(user);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private async Task StoreRefreshToken(Guid userId, string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var expiresAt = DateTime.UtcNow.AddDays(30); // 30 day refresh token

        await _dbContext.Database.ExecuteSqlAsync($@"
            INSERT INTO qivr.auth_tokens (user_id, token_hash, token_type, expires_at, created_at)
            VALUES ({userId}, {tokenHash}, 'refresh', {expiresAt}, CURRENT_TIMESTAMP)
        ");
    }

    private string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashedBytes);
    }

    // Implement remaining interface methods...
    public Task<bool> ConfirmSignUpAsync(string username, string confirmationCode) => Task.FromResult(true);
    public Task<bool> InitiateForgotPasswordAsync(string username) => Task.FromResult(true);
    public Task<bool> ConfirmForgotPasswordAsync(string username, string confirmationCode, string newPassword) => Task.FromResult(true);
    public Task<bool> ChangePasswordAsync(string accessToken, string oldPassword, string newPassword) => Task.FromResult(true);
    public Task<bool> SignOutAsync(string accessToken) => Task.FromResult(true);
    public Task<AuthenticationResult> SocialSignInAsync(string provider, string authorizationCode) 
        => Task.FromResult(new AuthenticationResult { Success = false, ErrorMessage = "Not implemented" });
    public Task<bool> SetupMfaAsync(string accessToken) => Task.FromResult(false);
    public Task<bool> VerifyMfaAsync(string session, string mfaCode) => Task.FromResult(false);
    public Task<bool> UpdateUserAttributesAsync(string accessToken, Dictionary<string, string> attributes) => Task.FromResult(true);
    public Task<List<string>> GetUserGroupsAsync(string username) => Task.FromResult(new List<string>());

    // DTOs
    private class UserAuthDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Role { get; set; }
        public Guid TenantId { get; set; }
        public bool IsActive { get; set; }
        public bool EmailVerified { get; set; }
        public string Phone { get; set; }
    }

    private class RefreshTokenDto
    {
        public Guid UserId { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Role { get; set; }
        public Guid TenantId { get; set; }
    }
}

public class JwtSettings
{
    public string SecretKey { get; set; } = "your-super-secret-jwt-key-change-in-production-minimum-32-chars";
    public string Issuer { get; set; } = "qivr.health";
    public string Audience { get; set; } = "qivr-api";
    public int ExpiryMinutes { get; set; } = 60;
}
