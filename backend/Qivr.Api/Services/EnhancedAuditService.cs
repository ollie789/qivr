using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Qivr.Core.Common;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services;

public interface IEnhancedAuditService
{
    Task LogEntityChangeAsync<T>(
        Guid tenantId,
        Guid? userId,
        string operation,
        T entity,
        T? oldEntity = default,
        Dictionary<string, object>? additionalMetadata = null) where T : class;
        
    Task LogBulkOperationAsync(
        Guid tenantId,
        Guid? userId,
        string operation,
        string entityType,
        int affectedCount,
        Dictionary<string, object>? metadata = null);
        
    Task LogApiCallAsync(
        Guid tenantId,
        Guid? userId,
        string controller,
        string action,
        string httpMethod,
        int statusCode,
        long durationMs,
        Dictionary<string, object>? metadata = null);
        
    void TrackEntityChanges(QivrDbContext context);
    Task SaveTrackedChangesAsync(QivrDbContext context, Guid tenantId, Guid? userId);
}

public class EnhancedAuditService : IEnhancedAuditService
{
    private readonly IAuditLogger _auditLogger;
    private readonly ILogger<EnhancedAuditService> _logger;
    private readonly List<EntityChangeInfo> _pendingChanges = new();
    
    public EnhancedAuditService(
        IAuditLogger auditLogger,
        ILogger<EnhancedAuditService> logger)
    {
        _auditLogger = auditLogger;
        _logger = logger;
    }
    
    public async Task LogEntityChangeAsync<T>(
        Guid tenantId,
        Guid? userId,
        string operation,
        T entity,
        T? oldEntity = default,
        Dictionary<string, object>? additionalMetadata = null) where T : class
    {
        var entityType = typeof(T).Name;
        var entityId = GetEntityId(entity);
        
        var metadata = new Dictionary<string, object>
        {
            ["operation"] = operation,
            ["entityType"] = entityType,
            ["userId"] = userId?.ToString() ?? "system",
            ["timestamp"] = DateTime.UtcNow
        };
        
        // Add changed properties for updates
        if (operation == "UPDATE" && oldEntity != null)
        {
            var changes = GetPropertyChanges(oldEntity, entity);
            if (changes.Any())
            {
                metadata["changes"] = changes;
            }
        }
        
        // Add new values for creates
        if (operation == "CREATE")
        {
            metadata["newValues"] = SerializeEntity(entity);
        }
        
        // Add old values for deletes
        if (operation == "DELETE" && oldEntity != null)
        {
            metadata["oldValues"] = SerializeEntity(oldEntity);
        }
        
        // Merge additional metadata
        if (additionalMetadata != null)
        {
            foreach (var kvp in additionalMetadata)
            {
                metadata[kvp.Key] = kvp.Value;
            }
        }
        
        await _auditLogger.LogAsync(
            tenantId,
            $"entity.{operation.ToLower()}",
            entityType,
            entityId,
            metadata);
    }
    
    public async Task LogBulkOperationAsync(
        Guid tenantId,
        Guid? userId,
        string operation,
        string entityType,
        int affectedCount,
        Dictionary<string, object>? metadata = null)
    {
        var auditMetadata = new Dictionary<string, object>
        {
            ["operation"] = operation,
            ["entityType"] = entityType,
            ["affectedCount"] = affectedCount,
            ["userId"] = userId?.ToString() ?? "system",
            ["timestamp"] = DateTime.UtcNow
        };
        
        if (metadata != null)
        {
            foreach (var kvp in metadata)
            {
                auditMetadata[kvp.Key] = kvp.Value;
            }
        }
        
        await _auditLogger.LogAsync(
            tenantId,
            $"bulk.{operation.ToLower()}",
            entityType,
            null,
            auditMetadata);
    }
    
    public async Task LogApiCallAsync(
        Guid tenantId,
        Guid? userId,
        string controller,
        string action,
        string httpMethod,
        int statusCode,
        long durationMs,
        Dictionary<string, object>? metadata = null)
    {
        var auditMetadata = new Dictionary<string, object>
        {
            ["controller"] = controller,
            ["action"] = action,
            ["httpMethod"] = httpMethod,
            ["statusCode"] = statusCode,
            ["durationMs"] = durationMs,
            ["userId"] = userId?.ToString() ?? "anonymous",
            ["timestamp"] = DateTime.UtcNow
        };
        
        if (metadata != null)
        {
            foreach (var kvp in metadata)
            {
                auditMetadata[kvp.Key] = kvp.Value;
            }
        }
        
        await _auditLogger.LogAsync(
            tenantId,
            "api.call",
            "endpoint",
            null,
            auditMetadata);
    }
    
    public void TrackEntityChanges(QivrDbContext context)
    {
        _pendingChanges.Clear();
        
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State != EntityState.Unchanged && 
                       e.State != EntityState.Detached &&
                       e.Entity is BaseEntity)
            .ToList();
            
        foreach (var entry in entries)
        {
            var changeInfo = new EntityChangeInfo
            {
                Entity = entry.Entity,
                EntityType = entry.Entity.GetType().Name,
                State = entry.State,
                OriginalValues = entry.State == EntityState.Modified || entry.State == EntityState.Deleted
                    ? entry.OriginalValues.ToObject()
                    : null,
                CurrentValues = entry.State == EntityState.Added || entry.State == EntityState.Modified
                    ? entry.CurrentValues.ToObject()
                    : null,
                ModifiedProperties = entry.State == EntityState.Modified
                    ? entry.Properties.Where(p => p.IsModified).Select(p => p.Metadata.Name).ToList()
                    : new List<string>()
            };
            
            _pendingChanges.Add(changeInfo);
        }
    }
    
    public async Task SaveTrackedChangesAsync(QivrDbContext context, Guid tenantId, Guid? userId)
    {
        foreach (var change in _pendingChanges)
        {
            try
            {
                var operation = change.State switch
                {
                    EntityState.Added => "CREATE",
                    EntityState.Modified => "UPDATE",
                    EntityState.Deleted => "DELETE",
                    _ => "UNKNOWN"
                };
                
                var metadata = new Dictionary<string, object>
                {
                    ["operation"] = operation,
                    ["entityType"] = change.EntityType,
                    ["userId"] = userId?.ToString() ?? "system",
                    ["timestamp"] = DateTime.UtcNow
                };
                
                if (change.ModifiedProperties.Any())
                {
                    metadata["modifiedProperties"] = change.ModifiedProperties;
                    
                    // Log sensitive field changes with extra care
                    var sensitiveFields = new[] { "Password", "SSN", "DateOfBirth", "MedicalRecordNumber" };
                    var modifiedSensitive = change.ModifiedProperties.Intersect(sensitiveFields, StringComparer.OrdinalIgnoreCase).ToList();
                    if (modifiedSensitive.Any())
                    {
                        metadata["sensitiveFieldsModified"] = modifiedSensitive;
                        metadata["alert"] = "SENSITIVE_DATA_MODIFIED";
                    }
                }
                
                // Get entity ID
                var entityId = GetEntityId(change.Entity);
                
                await _auditLogger.LogAsync(
                    tenantId,
                    $"entity.{operation.ToLower()}",
                    change.EntityType,
                    entityId,
                    metadata);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log audit for {EntityType} change", change.EntityType);
            }
        }
        
        _pendingChanges.Clear();
    }
    
    private Guid? GetEntityId(object entity)
    {
        if (entity is BaseEntity baseEntity)
        {
            return baseEntity.Id;
        }
        
        var idProperty = entity.GetType().GetProperty("Id");
        if (idProperty != null && idProperty.PropertyType == typeof(Guid))
        {
            return (Guid?)idProperty.GetValue(entity);
        }
        
        return null;
    }
    
    private Dictionary<string, object?> GetPropertyChanges<T>(T oldEntity, T newEntity) where T : class
    {
        var changes = new Dictionary<string, object?>();
        var properties = typeof(T).GetProperties()
            .Where(p => p.CanRead && p.CanWrite);
            
        foreach (var prop in properties)
        {
            var oldValue = prop.GetValue(oldEntity);
            var newValue = prop.GetValue(newEntity);
            
            if (!Equals(oldValue, newValue))
            {
                // Don't log sensitive values
                var sensitiveProps = new[] { "Password", "PasswordHash", "SSN" };
                if (sensitiveProps.Contains(prop.Name, StringComparer.OrdinalIgnoreCase))
                {
                    changes[prop.Name] = new { old = "[REDACTED]", new_ = "[REDACTED]" };
                }
                else
                {
                    changes[prop.Name] = new { old = oldValue, new_ = newValue };
                }
            }
        }
        
        return changes;
    }
    
    private Dictionary<string, object?> SerializeEntity<T>(T entity) where T : class
    {
        var result = new Dictionary<string, object?>();
        var properties = typeof(T).GetProperties()
            .Where(p => p.CanRead);
            
        foreach (var prop in properties)
        {
            // Skip navigation properties and sensitive data
            if (prop.PropertyType.IsClass && prop.PropertyType != typeof(string))
                continue;
                
            var sensitiveProps = new[] { "Password", "PasswordHash", "SSN" };
            if (sensitiveProps.Contains(prop.Name, StringComparer.OrdinalIgnoreCase))
            {
                result[prop.Name] = "[REDACTED]";
            }
            else
            {
                result[prop.Name] = prop.GetValue(entity);
            }
        }
        
        return result;
    }
    
    private class EntityChangeInfo
    {
        public object Entity { get; set; } = null!;
        public string EntityType { get; set; } = string.Empty;
        public EntityState State { get; set; }
        public object? OriginalValues { get; set; }
        public object? CurrentValues { get; set; }
        public List<string> ModifiedProperties { get; set; } = new();
    }
}