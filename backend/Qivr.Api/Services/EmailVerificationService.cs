using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services;

public interface IEmailVerificationService
{
    Task<string> GenerateVerificationTokenAsync(Guid userId);
    Task<bool> VerifyEmailAsync(string token);
    Task SendVerificationEmailAsync(string email, string token);
    Task<bool> ResendVerificationEmailAsync(string email);
}

public class EmailVerificationService : IEmailVerificationService
{
    private readonly QivrDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailVerificationService> _logger;
    private readonly IConfiguration _configuration;

    public EmailVerificationService(
        QivrDbContext dbContext,
        IEmailService emailService,
        ILogger<EmailVerificationService> logger,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<string> GenerateVerificationTokenAsync(Guid userId)
    {
        // Generate a secure random token
        var tokenBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        var token = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");

        // Hash the token for storage
        var tokenHash = HashToken(token);
        var expiresAt = DateTime.UtcNow.AddHours(24); // Token valid for 24 hours

        // Store the verification token
        await _dbContext.Database.ExecuteSqlAsync($@"
            INSERT INTO public.auth_tokens (user_id, token_hash, token_type, expires_at, created_at)
            VALUES ({userId}, {tokenHash}, 'email_verification', {expiresAt}, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, token_type) 
            DO UPDATE SET 
                token_hash = {tokenHash},
                expires_at = {expiresAt},
                created_at = CURRENT_TIMESTAMP
        ");

        _logger.LogInformation("Email verification token generated for user {UserId}", userId);
        return token;
    }

    public async Task<bool> VerifyEmailAsync(string token)
    {
        try
        {
            var tokenHash = HashToken(token);
            
            // Find the token and associated user
            var result = await _dbContext.Database
                .SqlQuery<VerificationResult>($@"
                    SELECT t.user_id, t.expires_at, u.email
                    FROM public.auth_tokens t
                    JOIN public.users u ON t.user_id = u.id
                    WHERE t.token_hash = {tokenHash}
                      AND t.token_type = 'email_verification'
                      AND t.revoked_at IS NULL
                ")
                .FirstOrDefaultAsync();

            if (result == null)
            {
                _logger.LogWarning("Invalid email verification token");
                return false;
            }

            if (result.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogWarning("Expired email verification token for user {UserId}", result.UserId);
                return false;
            }

            // Mark email as verified
            await _dbContext.Database.ExecuteSqlAsync($@"
                UPDATE public.users 
                SET email_verified = true, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {result.UserId}
            ");

            // Revoke the token
            await _dbContext.Database.ExecuteSqlAsync($@"
                UPDATE public.auth_tokens 
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE token_hash = {tokenHash}
            ");

            // Create audit log
            await _dbContext.Database.ExecuteSqlAsync($@"
                INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, created_at)
                VALUES ({result.UserId}, 'email_verified', 'user', {result.UserId}, CURRENT_TIMESTAMP)
            ");

            _logger.LogInformation("Email verified successfully for user {UserId}", result.UserId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying email with token");
            return false;
        }
    }

    public async Task SendVerificationEmailAsync(string email, string token)
    {
        var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:3002";
        var verificationUrl = $"{baseUrl}/verify-email?token={token}";

        var emailContent = new EmailContent
        {
            To = email,
            Subject = "Verify Your Email - Qivr Health",
            HtmlBody = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #1976d2; color: white; padding: 20px; text-align: center; }}
                        .content {{ background-color: #f9f9f9; padding: 30px; margin-top: 20px; }}
                        .button {{ display: inline-block; padding: 12px 30px; background-color: #1976d2; 
                                  color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                        .footer {{ margin-top: 30px; text-align: center; font-size: 12px; color: #666; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>Welcome to Qivr Health</h1>
                        </div>
                        <div class='content'>
                            <h2>Verify Your Email Address</h2>
                            <p>Thank you for registering with Qivr Health. Please verify your email address to complete your registration.</p>
                            <p>Click the button below to verify your email:</p>
                            <a href='{verificationUrl}' class='button'>Verify Email</a>
                            <p style='margin-top: 20px;'>Or copy and paste this link into your browser:</p>
                            <p style='word-break: break-all;'>{verificationUrl}</p>
                            <p style='margin-top: 30px;'>This link will expire in 24 hours.</p>
                            <p>If you didn't create an account with Qivr Health, please ignore this email.</p>
                        </div>
                        <div class='footer'>
                            <p>&copy; 2024 Qivr Health. All rights reserved.</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            ",
            PlainBody = $@"
                Welcome to Qivr Health!
                
                Please verify your email address by clicking the link below:
                {verificationUrl}
                
                This link will expire in 24 hours.
                
                If you didn't create an account with Qivr Health, please ignore this email.
                
                © 2024 Qivr Health. All rights reserved.
            "
        };

        await _emailService.SendEmailAsync(emailContent);
        _logger.LogInformation("Verification email sent to {Email}", email);
    }

    public async Task<bool> ResendVerificationEmailAsync(string email)
    {
        try
        {
            // Find the user
            var user = await _dbContext.Database
                .SqlQuery<UserInfo>($@"
                    SELECT id, email, email_verified
                    FROM public.users
                    WHERE email = {email}
                ")
                .FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("User not found for email {Email}", email);
                return false;
            }

            if (user.EmailVerified)
            {
                _logger.LogInformation("Email already verified for {Email}", email);
                return true;
            }

            // Check rate limiting (max 3 resends per hour)
            var recentTokens = await _dbContext.Database
                .SqlQuery<int>($@"
                    SELECT COUNT(*)
                    FROM public.auth_tokens
                    WHERE user_id = {user.Id}
                      AND token_type = 'email_verification'
                      AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
                ")
                .FirstOrDefaultAsync();

            if (recentTokens >= 3)
            {
                _logger.LogWarning("Rate limit exceeded for verification email resend for {Email}", email);
                return false;
            }

            // Generate new token and send email
            var token = await GenerateVerificationTokenAsync(user.Id);
            await SendVerificationEmailAsync(email, token);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending verification email for {Email}", email);
            return false;
        }
    }

    private string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashedBytes);
    }

    private class VerificationResult
    {
        public Guid UserId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Email { get; set; } = string.Empty;
    }

    private class UserInfo
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public bool EmailVerified { get; set; }
    }
}
