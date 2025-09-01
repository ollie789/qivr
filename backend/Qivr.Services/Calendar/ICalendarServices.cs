using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Qivr.Services.Calendar;

/// <summary>
/// Interface for Google Calendar integration service
/// </summary>
public interface IGoogleCalendarService
{
    Task<GoogleDeltaResponse> GetCalendarDelta(GoogleDeltaRequest request, string accessToken);
    Task<GoogleDeltaResponse> GetInitialSync(string calendarId, string accessToken);
    Task<GoogleCalendarEvent> GetEvent(string calendarId, string eventId, string accessToken);
    Task<GoogleCalendarEvent> CreateEvent(string calendarId, GoogleCalendarEvent calendarEvent, string accessToken);
    Task<GoogleCalendarEvent> UpdateEvent(string calendarId, string eventId, GoogleCalendarEvent calendarEvent, string accessToken);
    Task DeleteEvent(string calendarId, string eventId, string accessToken);
}

/// <summary>
/// Interface for Microsoft Graph Calendar integration service
/// </summary>
public interface IMicrosoftGraphCalendarService
{
    Task<MicrosoftDeltaResponse> GetCalendarDelta(string deltaLink, string accessToken);
    Task<MicrosoftCalendarEvent> GetEvent(string eventId, string accessToken);
    Task<MicrosoftCalendarEvent> CreateEvent(MicrosoftCalendarEvent calendarEvent, string accessToken);
    Task<MicrosoftCalendarEvent> UpdateEvent(string eventId, MicrosoftCalendarEvent calendarEvent, string accessToken);
    Task DeleteEvent(string eventId, string accessToken);
}

// Note: DTOs for Google and Microsoft calendar events are defined in CalendarDeltaSyncService.cs
// to avoid duplication. The interfaces here reference those types.
