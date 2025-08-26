using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Core.Interfaces;
using System.Text.Json;

namespace Qivr.Services.Calendar;

public class GoogleCalendarService : ICalendarService
{
    private readonly ILogger<GoogleCalendarService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _applicationName = "Qivr Healthcare Platform";
    private readonly Dictionary<string, CalendarService> _calendarServices = new();

    public GoogleCalendarService(
        ILogger<GoogleCalendarService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<string> ConnectAccountAsync(string userId, string authorizationCode)
    {
        try
        {
            var credential = await GetCredentialFromAuthCode(authorizationCode);
            var calendarService = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = _applicationName
            });
            
            _calendarServices[userId] = calendarService;
            
            // Return the refresh token for storage
            return credential.Token.RefreshToken ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect Google Calendar for user {UserId}", userId);
            throw;
        }
    }

    public Task DisconnectAccountAsync(string userId)
    {
        if (_calendarServices.ContainsKey(userId))
        {
            _calendarServices.Remove(userId);
        }
        return Task.CompletedTask;
    }

    public Task<bool> IsAccountConnectedAsync(string userId)
    {
        return Task.FromResult(_calendarServices.ContainsKey(userId));
    }

    public async Task<List<TimeSlot>> GetAvailabilityAsync(
        string userId, 
        DateTime startDate, 
        DateTime endDate)
    {
        var calendarService = GetCalendarService(userId);

        var events = new List<TimeSlot>();
        
        try
        {
            var request = calendarService.Events.List("primary");
            request.TimeMin = startDate;
            request.TimeMax = endDate;
            request.ShowDeleted = false;
            request.SingleEvents = true;
            request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;

            var response = await request.ExecuteAsync();
            
            foreach (var googleEvent in response.Items)
            {
                if (googleEvent.Start?.DateTime == null || googleEvent.End?.DateTime == null)
                    continue;

                events.Add(new TimeSlot
                {
                    Start = googleEvent.Start.DateTime.Value,
                    End = googleEvent.End.DateTime.Value,
                    IsAvailable = false // These are existing events, so they are not available time slots
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get availability from Google Calendar");
        }

        return events;
    }

    public async Task<CalendarEvent> CreateEventAsync(string userId, CalendarEvent calendarEvent)
    {
        var calendarService = GetCalendarService(userId);

        try
        {
            var googleEvent = new Event
            {
                Summary = calendarEvent.Title,
                Description = calendarEvent.Description,
                Start = new EventDateTime
                {
                    DateTime = calendarEvent.StartTime,
                    TimeZone = "UTC"
                },
                End = new EventDateTime
                {
                    DateTime = calendarEvent.EndTime,
                    TimeZone = "UTC"
                },
                Location = calendarEvent.Location,
                Reminders = new Event.RemindersData
                {
                    UseDefault = false,
                    Overrides = new List<EventReminder>
                    {
                        new EventReminder { Method = "email", Minutes = 24 * 60 },
                        new EventReminder { Method = "popup", Minutes = 60 }
                    }
                }
            };

            if (calendarEvent.Attendees != null)
            {
                googleEvent.Attendees = calendarEvent.Attendees.Select(email => new EventAttendee { Email = email }).ToList();
            }

            var request = calendarService.Events.Insert(googleEvent, "primary");
            request.SendNotifications = true;
            var createdEvent = await request.ExecuteAsync();

            calendarEvent.Id = createdEvent.Id;
            return calendarEvent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create event in Google Calendar");
            throw;
        }
    }

    public async Task<CalendarEvent> UpdateEventAsync(string userId, string eventId, CalendarEvent calendarEvent)
    {
        var calendarService = GetCalendarService(userId);

        try
        {
            var googleEvent = await calendarService.Events.Get("primary", eventId).ExecuteAsync();
            
            googleEvent.Summary = calendarEvent.Title;
            googleEvent.Description = calendarEvent.Description;
            googleEvent.Start = new EventDateTime
            {
                DateTime = calendarEvent.StartTime,
                TimeZone = "UTC"
            };
            googleEvent.End = new EventDateTime
            {
                DateTime = calendarEvent.EndTime,
                TimeZone = "UTC"
            };
            googleEvent.Location = calendarEvent.Location;

            if (calendarEvent.Attendees != null)
            {
                googleEvent.Attendees = calendarEvent.Attendees.Select(email => new EventAttendee { Email = email }).ToList();
            }

            var request = calendarService.Events.Update(googleEvent, "primary", eventId);
            request.SendNotifications = true;
            await request.ExecuteAsync();

            return calendarEvent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update event {EventId} in Google Calendar", eventId);
            throw;
        }
    }

    public async Task DeleteEventAsync(string userId, string eventId)
    {
        var calendarService = GetCalendarService(userId);

        try
        {
            var request = calendarService.Events.Delete("primary", eventId);
            request.SendNotifications = true;
            await request.ExecuteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete event {EventId} from Google Calendar", eventId);
            throw;
        }
    }
    
    public async Task<CalendarEvent> GetEventAsync(string userId, string eventId)
    {
        var calendarService = GetCalendarService(userId);
        var googleEvent = await calendarService.Events.Get("primary", eventId).ExecuteAsync();
        
        return new CalendarEvent
        {
            Id = googleEvent.Id,
            Title = googleEvent.Summary,
            Description = googleEvent.Description,
            StartTime = googleEvent.Start.DateTime.GetValueOrDefault(),
            EndTime = googleEvent.End.DateTime.GetValueOrDefault(),
            Location = googleEvent.Location,
            Attendees = googleEvent.Attendees?.Select(a => a.Email).ToList() ?? new List<string>(),
            MeetingLink = googleEvent.HangoutLink
        };
    }

    public async Task<string> SetupWebhookAsync(string userId, string webhookUrl)
    {
        var calendarService = GetCalendarService(userId);

        try
        {
            var channel = new Channel
            {
                Id = Guid.NewGuid().ToString(),
                Type = "web_hook",
                Address = webhookUrl,
                Token = userId, // Use user ID as token for verification
                Expiration = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeMilliseconds()
            };

            var request = calendarService.Events.Watch(channel, "primary");
            var watchResponse = await request.ExecuteAsync();
            
            _logger.LogInformation("Set up Google Calendar webhook for user {UserId}", userId);
            return watchResponse.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to setup webhook for user {UserId}", userId);
            throw;
        }
    }

    public Task RemoveWebhookAsync(string userId, string channelId)
    {
        var calendarService = GetCalendarService(userId);
        return calendarService.Channels.Stop(new Channel { Id = channelId, ResourceId = "primary" }).ExecuteAsync();
    }

    public async Task<List<TimeSlot>> GetAvailableSlotsAsync(
        string userId,
        DateTime date,
        int durationMinutes)
    {
        var availableSlots = new List<TimeSlot>();
        var events = await GetAvailabilityAsync(userId, date.Date, date.Date.AddDays(1));
        
        // Define business hours (9 AM to 5 PM)
        var businessStart = date.Date.AddHours(9);
        var businessEnd = date.Date.AddHours(17);
        
        var currentSlot = businessStart;
        while (currentSlot.AddMinutes(durationMinutes) <= businessEnd)
        {
            var slotEnd = currentSlot.AddMinutes(durationMinutes);
            
            // Check if this slot conflicts with any existing events
            bool isAvailable = !events.Any(e => 
                (e.Start < slotEnd && e.End > currentSlot));
            
            if (isAvailable)
            {
                availableSlots.Add(new TimeSlot
                {
                    Start = currentSlot,
                    End = slotEnd,
                    IsAvailable = true
                });
            }
            
            currentSlot = currentSlot.AddMinutes(durationMinutes);
        }
        
        return availableSlots;
    }

    private CalendarService GetCalendarService(string userId)
    {
        if (!_calendarServices.TryGetValue(userId, out var service))
        {
            throw new InvalidOperationException($"Calendar service not connected for user {userId}");
        }
        return service;
    }
    
    private async Task<UserCredential> GetCredentialFromAuthCode(string authorizationCode)
    {
        var clientSecrets = new ClientSecrets
        {
            ClientId = _configuration["Google:ClientId"],
            ClientSecret = _configuration["Google:ClientSecret"]
        };
        
        var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = clientSecrets,
            Scopes = new[] { CalendarService.Scope.Calendar }
        });
        
        var token = await flow.ExchangeCodeForTokenAsync(
            "user",
            authorizationCode,
            _configuration["Google:RedirectUri"],
            CancellationToken.None
        );
        
        return new UserCredential(flow, "user", token);
    }
}
