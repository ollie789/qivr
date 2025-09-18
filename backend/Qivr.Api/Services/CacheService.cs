using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Qivr.Api.Services;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task<string?> GetStringAsync(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task SetStringAsync(string key, string value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task InvalidateUserCacheAsync(Guid userId, CancellationToken cancellationToken = default);
    Task InvalidateTenantCacheAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    // Default cache durations
    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ShortExpiration = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan LongExpiration = TimeSpan.FromHours(1);
    private static readonly TimeSpan DailyExpiration = TimeSpan.FromHours(24);

    public CacheService(
        IDistributedCache cache,
        ILogger<CacheService> logger)
    {
        _cache = cache;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var cached = await _cache.GetStringAsync(key, cancellationToken);
            if (string.IsNullOrEmpty(cached))
            {
                _logger.LogDebug("Cache miss for key: {Key}", key);
                return default;
            }

            _logger.LogDebug("Cache hit for key: {Key}", key);
            return JsonSerializer.Deserialize<T>(cached, _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error retrieving cached item for key: {Key}", key);
            return default;
        }
    }

    public async Task<string?> GetStringAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var value = await _cache.GetStringAsync(key, cancellationToken);
            _logger.LogDebug(value != null ? "Cache hit for key: {Key}" : "Cache miss for key: {Key}", key);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error retrieving cached string for key: {Key}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var serialized = JsonSerializer.Serialize(value, _jsonOptions);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? DefaultExpiration
            };

            await _cache.SetStringAsync(key, serialized, options, cancellationToken);
            _logger.LogDebug("Cached item with key: {Key}, Expiration: {Expiration}", 
                key, options.AbsoluteExpirationRelativeToNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error caching item with key: {Key}", key);
        }
    }

    public async Task SetStringAsync(string key, string value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? DefaultExpiration
            };

            await _cache.SetStringAsync(key, value, options, cancellationToken);
            _logger.LogDebug("Cached string with key: {Key}, Expiration: {Expiration}", 
                key, options.AbsoluteExpirationRelativeToNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error caching string with key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache.RemoveAsync(key, cancellationToken);
            _logger.LogDebug("Removed cache entry with key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error removing cached item with key: {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        // Note: This is a simplified implementation. 
        // In production, you might want to use Redis SCAN command for better performance
        _logger.LogWarning("RemoveByPrefixAsync is not fully implemented for distributed cache. " +
                          "Consider using Redis-specific features for pattern-based deletion.");
        await Task.CompletedTask;
    }

    public async Task<T> GetOrSetAsync<T>(
        string key, 
        Func<Task<T>> factory, 
        TimeSpan? expiration = null, 
        CancellationToken cancellationToken = default)
    {
        var cached = await GetAsync<T>(key, cancellationToken);
        if (cached != null)
        {
            return cached;
        }

        var value = await factory();
        await SetAsync(key, value, expiration, cancellationToken);
        return value;
    }

    public async Task InvalidateUserCacheAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var keysToInvalidate = new[]
        {
            CacheKeys.UserProfile(userId),
            CacheKeys.UserSettings(userId),
            CacheKeys.UserMessages(userId),
            CacheKeys.UserNotifications(userId),
            CacheKeys.UserAppointments(userId),
            CacheKeys.PatientRecord(userId)
        };

        foreach (var key in keysToInvalidate)
        {
            await RemoveAsync(key, cancellationToken);
        }

        _logger.LogInformation("Invalidated cache for user: {UserId}", userId);
    }

    public async Task InvalidateTenantCacheAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var keysToInvalidate = new[]
        {
            CacheKeys.TenantSettings(tenantId),
            CacheKeys.TenantProviders(tenantId),
            CacheKeys.TenantClinics(tenantId),
            CacheKeys.TenantStatistics(tenantId)
        };

        foreach (var key in keysToInvalidate)
        {
            await RemoveAsync(key, cancellationToken);
        }

        _logger.LogInformation("Invalidated cache for tenant: {TenantId}", tenantId);
    }

    // Static class for consistent cache key generation
    public static class CacheKeys
    {
        private const string Prefix = "qivr";

        public static string UserProfile(Guid userId) => $"{Prefix}:user:{userId}:profile";
        public static string UserSettings(Guid userId) => $"{Prefix}:user:{userId}:settings";
        public static string UserMessages(Guid userId) => $"{Prefix}:user:{userId}:messages";
        public static string UserNotifications(Guid userId) => $"{Prefix}:user:{userId}:notifications";
        public static string UserAppointments(Guid userId) => $"{Prefix}:user:{userId}:appointments";
        public static string PatientRecord(Guid patientId) => $"{Prefix}:patient:{patientId}:record";
        public static string PatientSummary(Guid patientId) => $"{Prefix}:patient:{patientId}:summary";
        
        public static string TenantSettings(Guid tenantId) => $"{Prefix}:tenant:{tenantId}:settings";
        public static string TenantProviders(Guid tenantId) => $"{Prefix}:tenant:{tenantId}:providers";
        public static string TenantClinics(Guid tenantId) => $"{Prefix}:tenant:{tenantId}:clinics";
        public static string TenantStatistics(Guid tenantId) => $"{Prefix}:tenant:{tenantId}:stats";
        
        public static string ProviderSchedule(Guid providerId, DateTime date) => 
            $"{Prefix}:provider:{providerId}:schedule:{date:yyyy-MM-dd}";
        public static string ProviderAvailability(Guid providerId, DateTime date) => 
            $"{Prefix}:provider:{providerId}:availability:{date:yyyy-MM-dd}";
        
        public static string Analytics(string type, Guid entityId, DateTime? date = null) => 
            date.HasValue 
                ? $"{Prefix}:analytics:{type}:{entityId}:{date.Value:yyyy-MM-dd}"
                : $"{Prefix}:analytics:{type}:{entityId}";
        
        public static string PromTemplate(Guid templateId) => $"{Prefix}:prom:template:{templateId}";
        public static string PromTemplatesList(Guid tenantId) => $"{Prefix}:prom:templates:{tenantId}";
        
        public static string DocumentMetadata(Guid documentId) => $"{Prefix}:document:{documentId}:metadata";
        public static string DocumentList(Guid patientId, string? category = null) => 
            category != null 
                ? $"{Prefix}:documents:{patientId}:{category}"
                : $"{Prefix}:documents:{patientId}";
        
        // Message and conversation cache keys
        public static string UserConversations(Guid userId) => $"{Prefix}:user:{userId}:conversations";
        public static string ConversationThread(Guid userId, Guid otherUserId) => 
            $"{Prefix}:conversation:{(userId < otherUserId ? $"{userId}:{otherUserId}" : $"{otherUserId}:{userId}")}";
        public static string MessageList(Guid userId, string? category = null, bool? unreadOnly = null) => 
            $"{Prefix}:messages:{userId}" + 
            (category != null ? $":{category}" : "") + 
            (unreadOnly == true ? ":unread" : "");
        
        // Appointment cache keys
        public static string AppointmentDetails(Guid appointmentId) => $"{Prefix}:appointment:{appointmentId}";
        public static string AppointmentList(Guid tenantId, Guid userId, string userRole, DateTime? startDate = null, DateTime? endDate = null) => 
            $"{Prefix}:appointments:{tenantId}:{userRole}:{userId}" +
            (startDate?.ToString(":yyyy-MM-dd") ?? "") +
            (endDate?.ToString(":yyyy-MM-dd") ?? "");
        
        // Patient cache keys
        public static string PatientDetails(Guid patientId) => $"{Prefix}:patient:{patientId}:details";
        public static string PatientSearch(Guid tenantId, string searchQuery) => 
            $"{Prefix}:patients:{tenantId}:search:{searchQuery.ToLower().Replace(" ", "_")}";
        public static string PatientList(Guid tenantId, string sortBy, bool activeOnly) => 
            $"{Prefix}:patients:{tenantId}:list:{sortBy}:{(activeOnly ? "active" : "all")}";
        
        // Medical records cache keys  
        public static string MedicalRecordList(Guid patientId, string? category = null, DateTime? from = null, DateTime? to = null) =>
            $"{Prefix}:medical-records:{patientId}" +
            (category != null ? $":{category}" : "") +
            (from?.ToString(":yyyy-MM-dd") ?? "") +
            (to?.ToString(":yyyy-MM-dd") ?? "");
        public static string MedicalRecordDetails(Guid recordId) => $"{Prefix}:medical-record:{recordId}";
        
        // Cursor pagination cache keys
        public static string PaginationCursor(string entityType, string cursor) => 
            $"{Prefix}:pagination:{entityType}:{cursor}";
        public static string PaginationState(string entityType, Guid tenantId, Guid userId) => 
            $"{Prefix}:pagination:{entityType}:{tenantId}:{userId}:state";
    }

    // Cache duration presets
    public static class CacheDuration
    {
        public static readonly TimeSpan VeryShort = TimeSpan.FromSeconds(30);
        public static readonly TimeSpan Short = TimeSpan.FromMinutes(1);
        public static readonly TimeSpan Medium = TimeSpan.FromMinutes(5);
        public static readonly TimeSpan Long = TimeSpan.FromMinutes(30);
        public static readonly TimeSpan VeryLong = TimeSpan.FromHours(1);
        public static readonly TimeSpan Daily = TimeSpan.FromHours(24);
        public static readonly TimeSpan Weekly = TimeSpan.FromDays(7);
    }
}