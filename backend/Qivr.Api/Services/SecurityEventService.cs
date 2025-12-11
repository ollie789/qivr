using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services;

/// <summary>
/// Service for tracking and monitoring security events
/// </summary>
public interface ISecurityEventService
{
    Task LogFailedLoginAsync(string username, string ipAddress, string userAgent);
    Task LogSuccessfulLoginAsync(Guid userId, string username, string ipAddress);
    Task LogSuspiciousActivityAsync(string eventType, string details, string ipAddress);
    Task LogSecurityAlertAsync(string alertType, string message, Dictionary<string, object>? metadata = null);
    Task<bool> IsAccountLockedAsync(string username);
    Task<int> GetFailedLoginCountAsync(string username, TimeSpan window);
    Task ResetFailedLoginAttemptsAsync(string username);
}

public class SecurityEventService : ISecurityEventService
{
    private readonly QivrDbContext _dbContext;
    private readonly ILogger<SecurityEventService> _logger;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    
    // In-memory tracking for rate limiting and quick lookups
    private static readonly ConcurrentDictionary<string, List<DateTime>> _failedLogins = new();
    private static readonly ConcurrentDictionary<string, DateTime> _accountLockouts = new();
    
    // Configuration
    private readonly int _maxFailedAttempts;
    private readonly TimeSpan _lockoutDuration;
    private readonly TimeSpan _failedAttemptWindow;
    private readonly bool _alertingEnabled;
    private readonly string _alertEmail;

    public SecurityEventService(
        QivrDbContext dbContext,
        ILogger<SecurityEventService> logger,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _logger = logger;
        _emailService = emailService;
        _configuration = configuration;
        
        // Load configuration
        _maxFailedAttempts = configuration.GetValue("Security:MaxFailedLoginAttempts", 5);
        _lockoutDuration = TimeSpan.FromMinutes(configuration.GetValue("Security:LockoutDurationMinutes", 30));
        _failedAttemptWindow = TimeSpan.FromMinutes(configuration.GetValue("Security:FailedAttemptWindowMinutes", 15));
        _alertingEnabled = configuration.GetValue("Security:AlertingEnabled", true);
        _alertEmail = configuration.GetValue<string>("Security:AlertEmail") ?? "security@qivr.health";
    }

    public async Task LogFailedLoginAsync(string username, string ipAddress, string userAgent)
    {
        try
        {
            // Log to database
            await _dbContext.Database.ExecuteSqlAsync($@"
                INSERT INTO public.security_events 
                (id, event_type, username, ip_address, user_agent, details, created_at)
                VALUES ({Guid.NewGuid()}, 'failed_login', {username}, {ipAddress}, 
                        {userAgent}, 'Failed login attempt', CURRENT_TIMESTAMP)
            ");
            
            // Track in memory for quick rate limiting
            var attempts = _failedLogins.AddOrUpdate(username, 
                new List<DateTime> { DateTime.UtcNow },
                (key, list) => 
                {
                    list.Add(DateTime.UtcNow);
                    // Clean old attempts
                    list.RemoveAll(d => d < DateTime.UtcNow.Subtract(_failedAttemptWindow));
                    return list;
                });
            
            // Check if account should be locked
            if (attempts.Count >= _maxFailedAttempts)
            {
                await LockAccountAsync(username);
                
                // Send security alert
                if (_alertingEnabled)
                {
                    await SendSecurityAlertAsync(
                        "Account Locked",
                        $"Account {username} has been locked due to {attempts.Count} failed login attempts from IP {ipAddress}",
                        new Dictionary<string, object>
                        {
                            ["username"] = username,
                            ["ip_address"] = ipAddress,
                            ["failed_attempts"] = attempts.Count,
                            ["user_agent"] = userAgent
                        });
                }
            }
            
            _logger.LogWarning("Failed login attempt for {Username} from {IpAddress}", username, ipAddress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging failed login for {Username}", username);
        }
    }

    public async Task LogSuccessfulLoginAsync(Guid userId, string username, string ipAddress)
    {
        try
        {
            // Log to database
            await _dbContext.Database.ExecuteSqlAsync($@"
                INSERT INTO public.security_events 
                (id, event_type, user_id, username, ip_address, details, created_at)
                VALUES ({Guid.NewGuid()}, 'successful_login', {userId}, {username}, 
                        {ipAddress}, 'Successful login', CURRENT_TIMESTAMP)
            ");
            
            // Clear failed attempts on successful login
            _failedLogins.TryRemove(username, out _);
            
            // Check for suspicious patterns (e.g., login from new location)
            await CheckForSuspiciousLoginPatterns(userId, ipAddress);
            
            _logger.LogInformation("Successful login for {Username} from {IpAddress}", username, ipAddress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging successful login for {Username}", username);
        }
    }

    public async Task LogSuspiciousActivityAsync(string eventType, string details, string ipAddress)
    {
        try
        {
            await _dbContext.Database.ExecuteSqlAsync($@"
                INSERT INTO public.security_events 
                (id, event_type, ip_address, details, severity, created_at)
                VALUES ({Guid.NewGuid()}, {eventType}, {ipAddress}, {details}, 
                        'high', CURRENT_TIMESTAMP)
            ");
            
            _logger.LogWarning("Suspicious activity detected: {EventType} - {Details} from {IpAddress}", 
                eventType, details, ipAddress);
            
            // Send immediate alert for high-severity events
            if (_alertingEnabled)
            {
                await SendSecurityAlertAsync(
                    $"Suspicious Activity: {eventType}",
                    details,
                    new Dictionary<string, object>
                    {
                        ["event_type"] = eventType,
                        ["ip_address"] = ipAddress,
                        ["timestamp"] = DateTime.UtcNow
                    });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging suspicious activity: {EventType}", eventType);
        }
    }

    public async Task LogSecurityAlertAsync(string alertType, string message, Dictionary<string, object>? metadata = null)
    {
        try
        {
            var metadataJson = metadata != null ? 
                System.Text.Json.JsonSerializer.Serialize(metadata) : "{}";
            
            await _dbContext.Database.ExecuteSqlAsync($@"
                INSERT INTO public.security_alerts 
                (id, alert_type, message, metadata, created_at)
                VALUES ({Guid.NewGuid()}, {alertType}, {message}, 
                        {metadataJson}::jsonb, CURRENT_TIMESTAMP)
            ");
            
            _logger.LogCritical("Security Alert: {AlertType} - {Message}", alertType, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging security alert: {AlertType}", alertType);
        }
    }

    public Task<bool> IsAccountLockedAsync(string username)
    {
        if (_accountLockouts.TryGetValue(username, out var lockoutUntil))
        {
            if (lockoutUntil > DateTime.UtcNow)
            {
                return Task.FromResult(true);
            }
            
            // Lockout expired, remove it
            _accountLockouts.TryRemove(username, out _);
        }
        
        return Task.FromResult(false);
    }

    public Task<int> GetFailedLoginCountAsync(string username, TimeSpan window)
    {
        if (_failedLogins.TryGetValue(username, out var attempts))
        {
            var cutoff = DateTime.UtcNow.Subtract(window);
            return Task.FromResult(attempts.Count(a => a >= cutoff));
        }
        
        return Task.FromResult(0);
    }

    public Task ResetFailedLoginAttemptsAsync(string username)
    {
        _failedLogins.TryRemove(username, out _);
        _accountLockouts.TryRemove(username, out _);
        _logger.LogInformation("Failed login attempts reset for {Username}", username);
        return Task.CompletedTask;
    }

    private async Task LockAccountAsync(string username)
    {
        var lockoutUntil = DateTime.UtcNow.Add(_lockoutDuration);
        _accountLockouts[username] = lockoutUntil;
        
        await _dbContext.Database.ExecuteSqlAsync($@"
            UPDATE public.users 
            SET locked_until = {lockoutUntil},
                updated_at = CURRENT_TIMESTAMP
            WHERE email = {username}
        ");
        
        _logger.LogWarning("Account locked for {Username} until {LockoutUntil}", username, lockoutUntil);
    }

    private async Task CheckForSuspiciousLoginPatterns(Guid userId, string ipAddress)
    {
        try
        {
            // Get recent login history
            var recentLogins = await _dbContext.Database
                .SqlQuery<LoginHistoryDto>($@"
                    SELECT ip_address, created_at
                    FROM public.security_events
                    WHERE user_id = {userId}
                      AND event_type = 'successful_login'
                      AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
                    ORDER BY created_at DESC
                    LIMIT 10
                ")
                .ToListAsync();
            
            // Check for rapid location changes (simplified - in production, use GeoIP)
            if (recentLogins.Any() && recentLogins.First().IpAddress != ipAddress)
            {
                var timeSinceLastLogin = DateTime.UtcNow - recentLogins.First().CreatedAt;
                if (timeSinceLastLogin < TimeSpan.FromHours(1))
                {
                    await LogSuspiciousActivityAsync(
                        "rapid_location_change",
                        $"User logged in from different IP within {timeSinceLastLogin.TotalMinutes:F0} minutes",
                        ipAddress);
                }
            }
            
            // Check for unusual login time (e.g., first login from this IP)
            if (!recentLogins.Any(l => l.IpAddress == ipAddress))
            {
                _logger.LogInformation("First login from new IP {IpAddress} for user {UserId}", ipAddress, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking suspicious login patterns for user {UserId}", userId);
        }
    }

    private async Task SendSecurityAlertAsync(string subject, string message, Dictionary<string, object> metadata)
    {
        try
        {
            if (!_alertingEnabled || string.IsNullOrEmpty(_alertEmail))
            {
                return;
            }
            
            var htmlBody = $@"
                <h2>Security Alert: {subject}</h2>
                <p>{message}</p>
                <h3>Details:</h3>
                <ul>
                    {string.Join("", metadata.Select(kv => $"<li><strong>{kv.Key}:</strong> {kv.Value}</li>"))}
                </ul>
                <p><em>Generated at {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</em></p>
            ";
            
            await _emailService.SendEmailAsync(new EmailContent
            {
                To = _alertEmail,
                Subject = $"[SECURITY ALERT] {subject}",
                HtmlBody = htmlBody,
                PlainBody = $"{subject}\n\n{message}\n\nDetails:\n" + 
                           string.Join("\n", metadata.Select(kv => $"{kv.Key}: {kv.Value}"))
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send security alert email");
        }
    }
    
    private class LoginHistoryDto
    {
        public string IpAddress { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
