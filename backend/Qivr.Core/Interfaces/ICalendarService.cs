using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Qivr.Core.Interfaces
{
    public interface ICalendarService
    {
        Task<string> ConnectAccountAsync(string userId, string authorizationCode);
        Task DisconnectAccountAsync(string userId);
        Task<bool> IsAccountConnectedAsync(string userId);
        Task<List<TimeSlot>> GetAvailabilityAsync(string userId, DateTime startDate, DateTime endDate);
        Task<CalendarEvent> CreateEventAsync(string userId, CalendarEvent calendarEvent);
        Task<CalendarEvent> UpdateEventAsync(string userId, string eventId, CalendarEvent calendarEvent);
        Task DeleteEventAsync(string userId, string eventId);
        Task<CalendarEvent> GetEventAsync(string userId, string eventId);
        Task<string> SetupWebhookAsync(string userId, string webhookUrl);
        Task RemoveWebhookAsync(string userId, string channelId);
        Task<List<TimeSlot>> GetAvailableSlotsAsync(string userId, DateTime date, int durationMinutes);
    }

    public class TimeSlot
    {
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class CalendarEvent
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Location { get; set; }
        public List<string> Attendees { get; set; }
        public string MeetingLink { get; set; }
        public Dictionary<string, string> Metadata { get; set; }
    }
}
