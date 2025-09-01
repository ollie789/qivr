using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services;

public interface IResourceAuthorizationService
{
    Task<bool> UserOwnsResourceAsync(Guid userId, Guid resourceId, string resourceType);
    Task<bool> UserBelongsToTenantAsync(Guid userId, Guid tenantId);
    Task<bool> UserCanAccessPatientDataAsync(Guid userId, Guid patientId);
    Task<bool> UserCanAccessAppointmentAsync(Guid userId, Guid appointmentId);
    Guid GetCurrentUserId(ClaimsPrincipal user);
    Guid GetCurrentTenantId(HttpContext context);
}

public class ResourceAuthorizationService : IResourceAuthorizationService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<ResourceAuthorizationService> _logger;

    public ResourceAuthorizationService(QivrDbContext context, ILogger<ResourceAuthorizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Guid GetCurrentUserId(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? 
                         user.FindFirst("sub") ?? 
                         user.FindFirst("id");
        
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            _logger.LogWarning("Unable to extract user ID from claims");
            return Guid.Empty;
        }
        
        return userId;
    }

    public Guid GetCurrentTenantId(HttpContext context)
    {
        // Try to get tenant from header first
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader))
        {
            if (Guid.TryParse(tenantHeader.ToString(), out var tenantId))
            {
                return tenantId;
            }
        }
        
        // Try to get from claims
        var tenantClaim = context.User.FindFirst("tenant_id") ?? 
                          context.User.FindFirst("tenantId");
        
        if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var claimTenantId))
        {
            return claimTenantId;
        }
        
        _logger.LogWarning("Unable to extract tenant ID from request");
        return Guid.Empty;
    }

    public async Task<bool> UserOwnsResourceAsync(Guid userId, Guid resourceId, string resourceType)
    {
        if (userId == Guid.Empty || resourceId == Guid.Empty)
        {
            _logger.LogWarning("Invalid user or resource ID for authorization check");
            return false;
        }

        try
        {
            switch (resourceType.ToLower())
            {
                case "appointment":
                    return await _context.Appointments
                        .AnyAsync(a => a.Id == resourceId && a.PatientId == userId);
                
                case "patient":
                    // For patient resource, check if the user IS the patient (user ID matches patient ID)
                    return await _context.Users
                        .AnyAsync(u => u.Id == resourceId && u.Id == userId);
                
                case "user":
                    // User can only access their own user resource
                    return resourceId == userId;
                
                default:
                    _logger.LogWarning("Unknown resource type: {ResourceType}", resourceType);
                    return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking resource ownership for user {UserId} and resource {ResourceId}", 
                userId, resourceId);
            return false;
        }
    }

    public async Task<bool> UserBelongsToTenantAsync(Guid userId, Guid tenantId)
    {
        if (userId == Guid.Empty || tenantId == Guid.Empty)
        {
            return false;
        }

        try
        {
            return await _context.Users
                .AnyAsync(u => u.Id == userId && u.TenantId == tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking tenant membership for user {UserId} and tenant {TenantId}", 
                userId, tenantId);
            return false;
        }
    }

    public async Task<bool> UserCanAccessPatientDataAsync(Guid userId, Guid patientId)
    {
        if (userId == Guid.Empty || patientId == Guid.Empty)
        {
            return false;
        }

        try
        {
            // Check if user is the patient (user ID matches patient ID)
            if (userId == patientId)
            {
                return true;
            }

            // Check if user is a practitioner with access to this patient
            var isPractitioner = await _context.Appointments
                .AnyAsync(a => a.PatientId == patientId && a.ProviderId == userId);
            
            return isPractitioner;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking patient data access for user {UserId} and patient {PatientId}", 
                userId, patientId);
            return false;
        }
    }

    public async Task<bool> UserCanAccessAppointmentAsync(Guid userId, Guid appointmentId)
    {
        if (userId == Guid.Empty || appointmentId == Guid.Empty)
        {
            return false;
        }

        try
        {
            // Check if user is the patient or provider for this appointment
            return await _context.Appointments
                .AnyAsync(a => a.Id == appointmentId && 
                             (a.PatientId == userId || a.ProviderId == userId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking appointment access for user {UserId} and appointment {AppointmentId}", 
                userId, appointmentId);
            return false;
        }
    }
}
