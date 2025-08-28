using System.Linq;
using System.Text.RegularExpressions;

namespace Qivr.Api.Utilities
{
    public static class PhoneUtil
    {
        /// <summary>
        /// Normalize phone number to E.164 format (loose validation)
        /// Keeps '+' and digits only
        /// </summary>
        public static string? ToE164Loose(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) 
                return null;
            
            // Keep only '+' and digits
            var normalized = new string(input.Trim()
                .Where(c => c == '+' || char.IsDigit(c))
                .ToArray());
            
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }
        
        /// <summary>
        /// Format Australian mobile number to E.164
        /// </summary>
        public static string? ToE164Australia(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return null;
            
            var digits = new string(input.Where(char.IsDigit).ToArray());
            
            // Handle Australian mobile numbers
            if (digits.StartsWith("04") && digits.Length == 10)
            {
                // 04XX XXX XXX -> +614XX XXX XXX
                return "+61" + digits.Substring(1);
            }
            
            if (digits.StartsWith("614") && digits.Length == 11)
            {
                // Already in 614XXXXXXXX format
                return "+" + digits;
            }
            
            if (digits.StartsWith("4") && digits.Length == 9)
            {
                // 4XX XXX XXX -> +614XX XXX XXX
                return "+61" + digits;
            }
            
            // Return as-is if already looks like E.164
            if (input.StartsWith("+"))
                return ToE164Loose(input);
            
            return null;
        }
        
        /// <summary>
        /// Check if content matches STOP/START/UNSTOP keywords
        /// </summary>
        public static (bool isStop, bool isStart) CheckOptOutKeywords(string? content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return (false, false);
            
            var normalized = content.Trim().ToUpperInvariant();
            
            var stopKeywords = new[] { "STOP", "STOP ALL", "UNSUBSCRIBE", "CANCEL", "QUIT", "END" };
            var startKeywords = new[] { "START", "UNSTOP", "SUBSCRIBE", "RESUME", "YES" };
            
            var isStop = stopKeywords.Any(k => normalized.Equals(k) || normalized.StartsWith(k + " "));
            var isStart = startKeywords.Any(k => normalized.Equals(k) || normalized.StartsWith(k + " "));
            
            return (isStop, isStart);
        }
    }
}
