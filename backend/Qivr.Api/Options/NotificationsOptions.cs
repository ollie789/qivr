namespace Qivr.Api.Options
{
    public sealed class NotificationsOptions
    {
        /// <summary>
        /// Business hours start time in local clinic timezone (24-hour format)
        /// Default: 9 (09:00 AM)
        /// </summary>
        public int BusinessHoursStartLocal { get; set; } = 9;
        
        /// <summary>
        /// Business hours end time in local clinic timezone (24-hour format)
        /// Default: 18 (06:00 PM)
        /// </summary>
        public int BusinessHoursEndLocal { get; set; } = 18;
        
        /// <summary>
        /// Enable quiet hours enforcement
        /// </summary>
        public bool EnforceQuietHours { get; set; } = true;
        
        /// <summary>
        /// Default timezone for clinics without specific timezone setting
        /// </summary>
        public string DefaultTimeZone { get; set; } = "Australia/Sydney";
    }
}
