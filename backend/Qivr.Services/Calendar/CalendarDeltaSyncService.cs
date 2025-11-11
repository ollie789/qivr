using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Services.Calendar;

/// <summary>
/// Service for efficient delta synchronization with Google and Microsoft calendars
/// </summary>
public interface ICalendarDeltaSyncService
{
    Task<DeltaSyncResult> SyncGoogleCalendarDelta(Guid providerId, string syncToken);
    Task<DeltaSyncResult> SyncMicrosoftCalendarDelta(Guid providerId, string deltaLink);
    Task<string> InitializeGoogleCalendarSync(Guid providerId);
    Task<string> InitializeMicrosoftCalendarSync(Guid providerId);
    Task ProcessCalendarWebhook(string provider, string resourceId, string changeType);
    Task<SyncStatus> GetSyncStatus(Guid providerId);
}

public class CalendarDeltaSyncService : ICalendarDeltaSyncService
{
    private readonly QivrDbContext _dbContext;
    private readonly ILogger<CalendarDeltaSyncService> _logger;
    private readonly IGoogleCalendarService _googleService;
    private readonly IMicrosoftGraphCalendarService _microsoftService;

    public CalendarDeltaSyncService(
        QivrDbContext dbContext,
        ILogger<CalendarDeltaSyncService> logger,
        IGoogleCalendarService googleService,
        IMicrosoftGraphCalendarService microsoftService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _googleService = googleService;
        _microsoftService = microsoftService;
    }

    public async Task<DeltaSyncResult> SyncGoogleCalendarDelta(Guid providerId, string syncToken)
    {
        var result = new DeltaSyncResult
        {
            ProviderId = providerId,
            Provider = "Google",
            SyncStartTime = DateTime.UtcNow
        };

        try
        {
            // Get provider's calendar connection
            var connection = await GetCalendarConnection(providerId, "Google");
            if (connection == null)
            {
                result.Success = false;
                result.ErrorMessage = "No Google calendar connection found";
                return result;
            }

            // Get delta changes from Google
            var deltaRequest = new GoogleDeltaRequest
            {
                CalendarId = connection.CalendarId ?? "primary",
                SyncToken = syncToken ?? connection.LastSyncToken,
                ShowDeleted = true,
                MaxResults = 100
            };

            if (string.IsNullOrEmpty(connection.AccessToken))
            {
                result.Success = false;
                result.ErrorMessage = "No access token available";
                return result;
            }

            var deltaResponse = await _googleService.GetCalendarDelta(deltaRequest, connection.AccessToken);
            
            // Process changes
            foreach (var item in deltaResponse.Items)
            {
                await ProcessGoogleCalendarItem(providerId, item, result);
            }

            // Update sync token
            if (!string.IsNullOrEmpty(deltaResponse.NextSyncToken))
            {
                connection.LastSyncToken = deltaResponse.NextSyncToken;
                connection.LastSyncTime = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }

            // Handle pagination if needed
            if (!string.IsNullOrEmpty(deltaResponse.NextPageToken))
            {
                result.HasMorePages = true;
                result.NextPageToken = deltaResponse.NextPageToken;
            }

            result.Success = true;
            result.NewSyncToken = deltaResponse.NextSyncToken;
            result.SyncEndTime = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google calendar delta sync for provider {ProviderId}", providerId);
            result.Success = false;
            result.ErrorMessage = ex.Message;
        }

        // Save sync history
        await SaveSyncHistory(result);
        
        return result;
    }

    public async Task<DeltaSyncResult> SyncMicrosoftCalendarDelta(Guid providerId, string deltaLink)
    {
        var result = new DeltaSyncResult
        {
            ProviderId = providerId,
            Provider = "Microsoft",
            SyncStartTime = DateTime.UtcNow
        };

        try
        {
            // Get provider's calendar connection
            var connection = await GetCalendarConnection(providerId, "Microsoft");
            if (connection == null)
            {
                result.Success = false;
                result.ErrorMessage = "No Microsoft calendar connection found";
                return result;
            }

            // Use delta link if provided, otherwise get initial delta
            var requestUrl = deltaLink ?? connection.DeltaLink;
            if (string.IsNullOrEmpty(requestUrl))
            {
                requestUrl = await InitializeMicrosoftDeltaQuery(connection);
            }

            if (string.IsNullOrEmpty(connection.AccessToken))
            {
                result.Success = false;
                result.ErrorMessage = "No access token available";
                return result;
            }

            var deltaResponse = await _microsoftService.GetCalendarDelta(requestUrl, connection.AccessToken);
            
            // Process changes
            foreach (var item in deltaResponse.Value)
            {
                await ProcessMicrosoftCalendarItem(providerId, item, result);
            }

            // Update delta link
            if (!string.IsNullOrEmpty(deltaResponse.DeltaLink))
            {
                connection.DeltaLink = deltaResponse.DeltaLink;
                connection.LastSyncTime = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }

            // Handle pagination
            if (!string.IsNullOrEmpty(deltaResponse.NextLink))
            {
                result.HasMorePages = true;
                result.NextPageToken = deltaResponse.NextLink;
            }

            result.Success = true;
            result.NewSyncToken = deltaResponse.DeltaLink;
            result.SyncEndTime = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Microsoft calendar delta sync for provider {ProviderId}", providerId);
            result.Success = false;
            result.ErrorMessage = ex.Message;
        }

        // Save sync history
        await SaveSyncHistory(result);
        
        return result;
    }

    public async Task<string> InitializeGoogleCalendarSync(Guid providerId)
    {
        var connection = await GetCalendarConnection(providerId, "Google");
        if (connection == null)
        {
            throw new InvalidOperationException("No Google calendar connection found");
        }

        // Perform initial full sync
        var calendarId = connection.CalendarId ?? "primary";
        if (string.IsNullOrEmpty(connection.AccessToken))
        {
            throw new InvalidOperationException("No access token available for Google calendar");
        }
        var initialSync = await _googleService.GetInitialSync(calendarId, connection.AccessToken);
        
        // Process all events
        var result = new DeltaSyncResult
        {
            ProviderId = providerId,
            Provider = "Google",
            SyncStartTime = DateTime.UtcNow
        };

        foreach (var item in initialSync.Items)
        {
            await ProcessGoogleCalendarItem(providerId, item, result);
        }

        // Save sync token
        connection.LastSyncToken = initialSync.NextSyncToken;
        connection.LastSyncTime = DateTime.UtcNow;
        connection.IsInitialized = true;
        await _dbContext.SaveChangesAsync();

        result.Success = true;
        result.NewSyncToken = initialSync.NextSyncToken;
        result.SyncEndTime = DateTime.UtcNow;
        
        await SaveSyncHistory(result);
        
        return initialSync.NextSyncToken ?? string.Empty;
    }

    public async Task<string> InitializeMicrosoftCalendarSync(Guid providerId)
    {
        var connection = await GetCalendarConnection(providerId, "Microsoft");
        if (connection == null)
        {
            throw new InvalidOperationException("No Microsoft calendar connection found");
        }

        // Build initial delta query
        var deltaLink = await InitializeMicrosoftDeltaQuery(connection);
        
        // Perform initial sync
        if (string.IsNullOrEmpty(connection.AccessToken))
        {
            throw new InvalidOperationException("No access token available for Microsoft calendar");
        }
        var initialSync = await _microsoftService.GetCalendarDelta(deltaLink, connection.AccessToken);
        
        // Process all events
        var result = new DeltaSyncResult
        {
            ProviderId = providerId,
            Provider = "Microsoft",
            SyncStartTime = DateTime.UtcNow
        };

        foreach (var item in initialSync.Value)
        {
            await ProcessMicrosoftCalendarItem(providerId, item, result);
        }

        // Save delta link
        connection.DeltaLink = initialSync.DeltaLink;
        connection.LastSyncTime = DateTime.UtcNow;
        connection.IsInitialized = true;
        await _dbContext.SaveChangesAsync();

        result.Success = true;
        result.NewSyncToken = initialSync.DeltaLink;
        result.SyncEndTime = DateTime.UtcNow;
        
        await SaveSyncHistory(result);
        
        return initialSync.DeltaLink ?? string.Empty;
    }

    public async Task ProcessCalendarWebhook(string provider, string resourceId, string changeType)
    {
        _logger.LogInformation("Processing calendar webhook: {Provider}, {ResourceId}, {ChangeType}", 
            provider, resourceId, changeType);

        // Find the connection by resource ID
        var connection = await _dbContext.Set<CalendarConnection>()
            .FirstOrDefaultAsync(c => c.ResourceId == resourceId);

        if (connection == null)
        {
            _logger.LogWarning("No calendar connection found for resource {ResourceId}", resourceId);
            return;
        }

        // Trigger delta sync based on provider
        if (provider.Equals("Google", StringComparison.OrdinalIgnoreCase))
        {
            await SyncGoogleCalendarDelta(connection.ProviderId, connection.LastSyncToken ?? string.Empty);
        }
        else if (provider.Equals("Microsoft", StringComparison.OrdinalIgnoreCase))
        {
            await SyncMicrosoftCalendarDelta(connection.ProviderId, connection.DeltaLink ?? string.Empty);
        }
    }

    public async Task<SyncStatus> GetSyncStatus(Guid providerId)
    {
        var status = new SyncStatus
        {
            ProviderId = providerId
        };

        // Get all connections for provider
        var connections = await _dbContext.Set<CalendarConnection>()
            .Where(c => c.ProviderId == providerId)
            .ToListAsync();

        foreach (var connection in connections)
        {
            var connectionStatus = new CalendarSyncStatus
            {
                Provider = connection.Provider,
                CalendarId = connection.CalendarId,
                IsInitialized = connection.IsInitialized,
                LastSyncTime = connection.LastSyncTime,
                IsActive = connection.IsActive
            };

            // Get recent sync history
            var recentSyncs = await _dbContext.Set<SyncHistory>()
                .Where(s => s.ProviderId == providerId && s.Provider == connection.Provider)
                .OrderByDescending(s => s.SyncStartTime)
                .Take(5)
                .ToListAsync();

            connectionStatus.RecentSyncs = recentSyncs.Select(s => new SyncHistoryItem
            {
                SyncTime = s.SyncStartTime,
                Success = s.Success,
                ItemsCreated = s.ItemsCreated,
                ItemsUpdated = s.ItemsUpdated,
                ItemsDeleted = s.ItemsDeleted,
                ErrorMessage = s.ErrorMessage
            }).ToList();

            status.Calendars.Add(connectionStatus);
        }

        return status;
    }

    private async Task ProcessGoogleCalendarItem(Guid providerId, GoogleCalendarEvent item, DeltaSyncResult result)
    {
        var providerProfile = await _dbContext.Set<Qivr.Core.Entities.Provider>()
            .IgnoreQueryFilters()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.User != null && p.User.Id == providerId);

        if (providerProfile == null)
        {
            _logger.LogWarning("Skipping Google calendar sync for provider {ProviderId}: provider profile missing", providerId);
            return;
        }

        // Check if this is a deletion
        if (item.Status == "cancelled")
        {
            await DeleteAppointmentByExternalId(providerId, item.Id, "Google");
            result.ItemsDeleted++;
            return;
        }

        // Check if appointment exists
        var existingAppointment = await _dbContext.Set<Appointment>()
            .FirstOrDefaultAsync(a => a.ExternalCalendarId == item.Id && a.ProviderId == providerId);

        if (existingAppointment != null)
        {
            // Update existing appointment
            // Google can send either DateTime or Date string
            DateTime scheduledStart, scheduledEnd;
            if (item.Start?.DateTime.HasValue == true)
            {
                scheduledStart = item.Start.DateTime.Value;
            }
            else if (!string.IsNullOrEmpty(item.Start?.Date))
            {
                scheduledStart = DateTime.Parse(item.Start.Date);
            }
            else
            {
                scheduledStart = DateTime.UtcNow;
            }
            
            if (item.End?.DateTime.HasValue == true)
            {
                scheduledEnd = item.End.DateTime.Value;
            }
            else if (!string.IsNullOrEmpty(item.End?.Date))
            {
                scheduledEnd = DateTime.Parse(item.End.Date);
            }
            else
            {
                scheduledEnd = scheduledStart.AddHours(1);
            }
            
            existingAppointment.ScheduledStart = scheduledStart;
            existingAppointment.ScheduledEnd = scheduledEnd;
            existingAppointment.AppointmentType = item.Summary ?? string.Empty;
            existingAppointment.Notes = item.Description;
            existingAppointment.Status = MapGoogleStatusToEnum(item.Status);
            existingAppointment.UpdatedAt = DateTime.UtcNow;
            existingAppointment.ProviderProfileId = providerProfile.Id;
            if (existingAppointment.TenantId == Guid.Empty)
            {
                existingAppointment.TenantId = providerProfile.TenantId;
            }
            if (!existingAppointment.TenantId.HasValue)
            {
                existingAppointment.TenantId = providerProfile.TenantId;
            }
            // Store external update time in LocationDetails
            if (item.Updated.HasValue)
            {
                existingAppointment.LocationDetails["ExternalLastModified"] = item.Updated.Value;
            }
            
            result.ItemsUpdated++;
        }
        else
        {
            // Create new appointment
            // Google can send either DateTime or Date string
            DateTime scheduledStart, scheduledEnd;
            if (item.Start?.DateTime.HasValue == true)
            {
                scheduledStart = item.Start.DateTime.Value;
            }
            else if (!string.IsNullOrEmpty(item.Start?.Date))
            {
                scheduledStart = DateTime.Parse(item.Start.Date);
            }
            else
            {
                scheduledStart = DateTime.UtcNow;
            }
            
            if (item.End?.DateTime.HasValue == true)
            {
                scheduledEnd = item.End.DateTime.Value;
            }
            else if (!string.IsNullOrEmpty(item.End?.Date))
            {
                scheduledEnd = DateTime.Parse(item.End.Date);
            }
            else
            {
                scheduledEnd = scheduledStart.AddHours(1);
            }
            
            var newAppointment = new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = providerProfile.TenantId,
                ProviderId = providerId,
                ProviderProfileId = providerProfile.Id,
                TenantId = providerProfile.TenantId,
                ExternalCalendarId = item.Id,
                ScheduledStart = scheduledStart,
                ScheduledEnd = scheduledEnd,
                AppointmentType = item.Summary ?? string.Empty,
                Notes = item.Description,
                Status = MapGoogleStatusToEnum(item.Status),
                CreatedAt = DateTime.UtcNow
            };

            // Try to match with patient if possible
            await TryMatchPatient(newAppointment, item);
            
            _dbContext.Set<Appointment>().Add(newAppointment);
            result.ItemsCreated++;
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task ProcessMicrosoftCalendarItem(Guid providerId, MicrosoftCalendarEvent item, DeltaSyncResult result)
    {
        var providerProfile = await _dbContext.Set<Qivr.Core.Entities.Provider>()
            .IgnoreQueryFilters()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.User != null && p.User.Id == providerId);

        if (providerProfile == null)
        {
            _logger.LogWarning("Skipping Microsoft calendar sync for provider {ProviderId}: provider profile missing", providerId);
            return;
        }

        // Check if this is a deletion
        if (item.Deleted)
        {
            await DeleteAppointmentByExternalId(providerId, item.Id, "Microsoft");
            result.ItemsDeleted++;
            return;
        }

        // Check if appointment exists
        var existingAppointment = await _dbContext.Set<Appointment>()
            .FirstOrDefaultAsync(a => a.ExternalCalendarId == item.Id && a.ProviderId == providerId);

        if (existingAppointment != null)
        {
            // Update existing appointment
            existingAppointment.ScheduledStart = item.Start.DateTime;
            existingAppointment.ScheduledEnd = item.End.DateTime;
            existingAppointment.AppointmentType = item.Subject ?? string.Empty;
            existingAppointment.Notes = item.BodyPreview;
            existingAppointment.Status = MapMicrosoftStatusToEnum(item);
            existingAppointment.UpdatedAt = DateTime.UtcNow;
            existingAppointment.ProviderProfileId = providerProfile.Id;
            if (existingAppointment.TenantId == Guid.Empty)
            {
                existingAppointment.TenantId = providerProfile.TenantId;
            }
            if (!existingAppointment.TenantId.HasValue)
            {
                existingAppointment.TenantId = providerProfile.TenantId;
            }
            // Store external update time in LocationDetails
            if (item.LastModifiedDateTime.HasValue)
            {
                existingAppointment.LocationDetails["ExternalLastModified"] = item.LastModifiedDateTime.Value;
            }
            
            result.ItemsUpdated++;
        }
        else
        {
            // Create new appointment
            var newAppointment = new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = providerProfile.TenantId,
                ProviderId = providerId,
                ProviderProfileId = providerProfile.Id,
                TenantId = providerProfile.TenantId,
                ExternalCalendarId = item.Id,
                ScheduledStart = item.Start.DateTime,
                ScheduledEnd = item.End.DateTime,
                AppointmentType = item.Subject ?? string.Empty,
                Notes = item.BodyPreview,
                Status = MapMicrosoftStatusToEnum(item),
                CreatedAt = DateTime.UtcNow
            };

            // Try to match with patient if possible
            await TryMatchPatientMicrosoft(newAppointment, item);
            
            _dbContext.Set<Appointment>().Add(newAppointment);
            result.ItemsCreated++;
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task<CalendarConnection?> GetCalendarConnection(Guid providerId, string provider)
    {
        return await _dbContext.Set<CalendarConnection>()
            .FirstOrDefaultAsync(c => c.ProviderId == providerId && 
                                     c.Provider == provider && 
                                     c.IsActive);
    }

    private Task<string> InitializeMicrosoftDeltaQuery(CalendarConnection connection)
    {
        // Build delta query URL
        var baseUrl = "https://graph.microsoft.com/v1.0";
        var calendarId = connection.CalendarId ?? "primary";
        var startDateTime = DateTime.UtcNow.AddMonths(-1).ToString("yyyy-MM-ddTHH:mm:ssZ");
        var endDateTime = DateTime.UtcNow.AddMonths(3).ToString("yyyy-MM-ddTHH:mm:ssZ");
        
        return Task.FromResult($"{baseUrl}/me/calendars/{calendarId}/calendarView/delta" +
               $"?startDateTime={startDateTime}&endDateTime={endDateTime}");
    }

    private async Task DeleteAppointmentByExternalId(Guid providerId, string externalId, string provider)
    {
        var appointment = await _dbContext.Set<Appointment>()
            .FirstOrDefaultAsync(a => a.ExternalCalendarId == externalId && 
                                     a.ProviderId == providerId);

        if (appointment != null)
        {
            appointment.Status = AppointmentStatus.Cancelled;
            appointment.CancelledAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }
    }

    private async Task TryMatchPatient(Appointment appointment, GoogleCalendarEvent calendarEvent)
    {
        // Try to extract patient email from attendees
        if (calendarEvent.Attendees != null)
        {
            foreach (var attendee in calendarEvent.Attendees)
            {
                var patient = await _dbContext.Set<User>()
                    .FirstOrDefaultAsync(p => p.Email == attendee.Email && p.UserType == UserType.Patient);
                
                if (patient != null)
                {
                    appointment.PatientId = patient.Id;
                    break;
                }
            }
        }
    }

    private async Task TryMatchPatientMicrosoft(Appointment appointment, MicrosoftCalendarEvent calendarEvent)
    {
        // Try to extract patient email from attendees
        if (calendarEvent.Attendees != null)
        {
            foreach (var attendee in calendarEvent.Attendees)
            {
                if (attendee.EmailAddress != null)
                {
                    var patient = await _dbContext.Set<User>()
                        .FirstOrDefaultAsync(p => p.Email == attendee.EmailAddress.Address && p.UserType == UserType.Patient);
                    
                    if (patient != null)
                    {
                        appointment.PatientId = patient.Id;
                        break;
                    }
                }
            }
        }
    }

    private AppointmentStatus MapGoogleStatusToEnum(string? googleStatus)
    {
        return googleStatus?.ToLower() switch
        {
            "confirmed" => AppointmentStatus.Confirmed,
            "tentative" => AppointmentStatus.Scheduled,
            "cancelled" => AppointmentStatus.Cancelled,
            _ => AppointmentStatus.Scheduled
        };
    }

    private AppointmentStatus MapMicrosoftStatusToEnum(MicrosoftCalendarEvent item)
    {
        if (item.IsCancelled)
            return AppointmentStatus.Cancelled;
        
        return item.ResponseStatus?.Response?.ToLower() switch
        {
            "accepted" => AppointmentStatus.Confirmed,
            "tentativelyaccepted" => AppointmentStatus.Scheduled,
            "declined" => AppointmentStatus.Cancelled,
            _ => AppointmentStatus.Scheduled
        };
    }

    private async Task SaveSyncHistory(DeltaSyncResult result)
    {
        var history = new SyncHistory
        {
            Id = Guid.NewGuid(),
            ProviderId = result.ProviderId,
            Provider = result.Provider,
            SyncStartTime = result.SyncStartTime,
            SyncEndTime = result.SyncEndTime ?? DateTime.UtcNow,
            Success = result.Success,
            ItemsCreated = result.ItemsCreated,
            ItemsUpdated = result.ItemsUpdated,
            ItemsDeleted = result.ItemsDeleted,
            ErrorMessage = result.ErrorMessage,
            SyncToken = result.NewSyncToken
        };

        _dbContext.Set<SyncHistory>().Add(history);
        await _dbContext.SaveChangesAsync();
    }
}

// Delta Sync Models
public class DeltaSyncResult
{
    public Guid ProviderId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public DateTime SyncStartTime { get; set; }
    public DateTime? SyncEndTime { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int ItemsCreated { get; set; }
    public int ItemsUpdated { get; set; }
    public int ItemsDeleted { get; set; }
    public string? NewSyncToken { get; set; }
    public bool HasMorePages { get; set; }
    public string? NextPageToken { get; set; }
}

public class SyncStatus
{
    public Guid ProviderId { get; set; }
    public List<CalendarSyncStatus> Calendars { get; set; } = new();
}

public class CalendarSyncStatus
{
    public string Provider { get; set; } = string.Empty;
    public string? CalendarId { get; set; }
    public bool IsInitialized { get; set; }
    public DateTime? LastSyncTime { get; set; }
    public bool IsActive { get; set; }
    public List<SyncHistoryItem> RecentSyncs { get; set; } = new();
}

public class SyncHistoryItem
{
    public DateTime SyncTime { get; set; }
    public bool Success { get; set; }
    public int ItemsCreated { get; set; }
    public int ItemsUpdated { get; set; }
    public int ItemsDeleted { get; set; }
    public string? ErrorMessage { get; set; }
}

// External calendar models
public class GoogleDeltaRequest
{
    public string CalendarId { get; set; } = "primary";
    public string? SyncToken { get; set; }
    public string? PageToken { get; set; }
    public bool ShowDeleted { get; set; }
    public int MaxResults { get; set; } = 100;
}

public class GoogleDeltaResponse
{
    public List<GoogleCalendarEvent> Items { get; set; } = new();
    public string? NextSyncToken { get; set; }
    public string? NextPageToken { get; set; }
}

public class GoogleCalendarEvent
{
    public string Id { get; set; } = string.Empty;
    public string? Status { get; set; }
    public string? Summary { get; set; }
    public string? Description { get; set; }
    public GoogleDateTime Start { get; set; } = new();
    public GoogleDateTime End { get; set; } = new();
    public DateTime? Updated { get; set; }
    public List<GoogleAttendee>? Attendees { get; set; }
}

public class GoogleDateTime
{
    public DateTime? DateTime { get; set; }
    public string? Date { get; set; }
    public string? TimeZone { get; set; }
}

public class GoogleAttendee
{
    public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public string? ResponseStatus { get; set; }
}

public class MicrosoftDeltaResponse
{
    public List<MicrosoftCalendarEvent> Value { get; set; } = new();
    public string? DeltaLink { get; set; }
    public string? NextLink { get; set; }
}

public class MicrosoftCalendarEvent
{
    public string Id { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? BodyPreview { get; set; }
    public MicrosoftDateTime Start { get; set; } = new();
    public MicrosoftDateTime End { get; set; } = new();
    public DateTime? LastModifiedDateTime { get; set; }
    public bool IsCancelled { get; set; }
    public bool Deleted { get; set; }
    public MicrosoftResponseStatus? ResponseStatus { get; set; }
    public List<MicrosoftAttendee>? Attendees { get; set; }
}

public class MicrosoftDateTime
{
    public DateTime DateTime { get; set; }
    public string? TimeZone { get; set; }
}

public class MicrosoftResponseStatus
{
    public string? Response { get; set; }
    public DateTime? Time { get; set; }
}

public class MicrosoftAttendee
{
    public MicrosoftEmailAddress? EmailAddress { get; set; }
    public string? Status { get; set; }
}

public class MicrosoftEmailAddress
{
    public string? Name { get; set; }
    public string? Address { get; set; }
}

// Database entities
public class CalendarConnection
{
    public Guid Id { get; set; }
    public Guid ProviderId { get; set; }
    public string Provider { get; set; } = string.Empty; // "Google" or "Microsoft"
    public string? CalendarId { get; set; }
    public string? ResourceId { get; set; } // For webhook identification
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public string? LastSyncToken { get; set; } // Google sync token
    public string? DeltaLink { get; set; } // Microsoft delta link
    public DateTime? LastSyncTime { get; set; }
    public bool IsInitialized { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SyncHistory
{
    public Guid Id { get; set; }
    public Guid ProviderId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public DateTime SyncStartTime { get; set; }
    public DateTime SyncEndTime { get; set; }
    public bool Success { get; set; }
    public int ItemsCreated { get; set; }
    public int ItemsUpdated { get; set; }
    public int ItemsDeleted { get; set; }
    public string? ErrorMessage { get; set; }
    public string? SyncToken { get; set; }
}
