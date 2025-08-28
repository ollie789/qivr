using Microsoft.Extensions.Options;
using Qivr.Api.Options;

namespace Qivr.Api.Services
{
    public interface IQuietHoursService
    {
        bool IsQuietNow(string clinicTimeZoneId, DateTimeOffset now);
        bool IsWithinBusinessHours(string clinicTimeZoneId, DateTimeOffset now);
        (TimeSpan start, TimeSpan end) GetBusinessHours();
    }
    
    public sealed class QuietHoursService : IQuietHoursService
    {
        private readonly NotificationsOptions _options;
        private readonly ILogger<QuietHoursService> _logger;
        
        public QuietHoursService(
            IOptions<NotificationsOptions> options, 
            ILogger<QuietHoursService> logger)
        {
            _options = options.Value;
            _logger = logger;
        }
        
        public bool IsQuietNow(string clinicTimeZoneId, DateTimeOffset now)
        {
            if (!_options.EnforceQuietHours)
                return false;
            
            return !IsWithinBusinessHours(clinicTimeZoneId, now);
        }
        
        public bool IsWithinBusinessHours(string clinicTimeZoneId, DateTimeOffset now)
        {
            try
            {
                // Get the clinic's timezone
                var timeZone = GetTimeZone(clinicTimeZoneId);
                
                // Convert to clinic local time
                var localTime = TimeZoneInfo.ConvertTime(now, timeZone);
                
                // Get business hours
                var (start, end) = GetBusinessHours();
                
                // Check if current time is within business hours
                var currentTime = localTime.TimeOfDay;
                
                // Handle same-day hours (e.g., 9:00-18:00)
                if (start < end)
                {
                    return currentTime >= start && currentTime < end;
                }
                
                // Handle overnight hours (e.g., 20:00-06:00)
                return currentTime >= start || currentTime < end;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking business hours for timezone {TimeZone}", clinicTimeZoneId);
                // Default to allowing notifications if error occurs
                return true;
            }
        }
        
        public (TimeSpan start, TimeSpan end) GetBusinessHours()
        {
            var start = new TimeSpan(_options.BusinessHoursStartLocal, 0, 0);
            var end = new TimeSpan(_options.BusinessHoursEndLocal, 0, 0);
            return (start, end);
        }
        
        private TimeZoneInfo GetTimeZone(string timeZoneId)
        {
            if (string.IsNullOrWhiteSpace(timeZoneId))
                timeZoneId = _options.DefaultTimeZone;
            
            try
            {
                // Try to get the timezone
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
                // Try with common conversions for Australia
                var mappings = new Dictionary<string, string>
                {
                    { "Australia/Sydney", "AUS Eastern Standard Time" },
                    { "Australia/Melbourne", "AUS Eastern Standard Time" },
                    { "Australia/Brisbane", "E. Australia Standard Time" },
                    { "Australia/Adelaide", "Cen. Australia Standard Time" },
                    { "Australia/Perth", "W. Australia Standard Time" },
                    { "Australia/Hobart", "Tasmania Standard Time" },
                    { "Australia/Darwin", "AUS Central Standard Time" }
                };
                
                if (mappings.TryGetValue(timeZoneId, out var windowsId))
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(windowsId);
                }
                
                // Default fallback
                _logger.LogWarning("Unknown timezone {TimeZone}, using default {Default}", 
                    timeZoneId, _options.DefaultTimeZone);
                
                return TimeZoneInfo.FindSystemTimeZoneById(
                    mappings.GetValueOrDefault(_options.DefaultTimeZone, "AUS Eastern Standard Time")!);
            }
        }
    }
}
