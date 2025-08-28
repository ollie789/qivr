using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Services
{
    public interface IAuditLogger
    {
        Task LogAsync(
            Guid tenantId, 
            string eventType, 
            string subjectType, 
            Guid? subjectId, 
            object? metadata, 
            CancellationToken cancellationToken = default);
        
        Task LogConsentChangeAsync(
            Guid tenantId,
            Guid userId,
            string consentType,
            bool oldValue,
            bool newValue,
            string? reason,
            CancellationToken cancellationToken = default);
    }
    
    public sealed class DbAuditLogger : IAuditLogger
    {
        private readonly QivrDbContext _db;
        private readonly ILogger<DbAuditLogger> _logger;
        
        public DbAuditLogger(QivrDbContext db, ILogger<DbAuditLogger> logger)
        {
            _db = db;
            _logger = logger;
        }
        
        public async Task LogAsync(
            Guid tenantId, 
            string eventType, 
            string subjectType, 
            Guid? subjectId, 
            object? metadata, 
            CancellationToken cancellationToken = default)
        {
            try
            {
                await using var conn = _db.Database.GetDbConnection() as NpgsqlConnection;
                if (conn == null)
                {
                    _logger.LogError("Failed to get NpgsqlConnection for audit logging");
                    return;
                }
                
                await conn.OpenAsync(cancellationToken);
                
                // Set tenant context for RLS
                await using (var tenantCmd = new NpgsqlCommand(
                    "SELECT set_config('app.tenant_id', @tid, true);", conn))
                {
                    tenantCmd.Parameters.AddWithValue("tid", tenantId.ToString());
                    await tenantCmd.ExecuteNonQueryAsync(cancellationToken);
                }
                
                await using var cmd = new NpgsqlCommand(@"
                    INSERT INTO qivr.audit_logs(
                        tenant_id, 
                        event_type, 
                        subject_type, 
                        subject_id, 
                        metadata, 
                        occurred_at
                    )
                    VALUES(@tenant, @event, @subtype, @subid, @meta, NOW());", conn);
                
                cmd.Parameters.AddWithValue("tenant", tenantId);
                cmd.Parameters.AddWithValue("event", eventType);
                cmd.Parameters.AddWithValue("subtype", subjectType);
                cmd.Parameters.AddWithValue("subid", NpgsqlDbType.Uuid, subjectId.HasValue ? (object)subjectId.Value : DBNull.Value);
                
                var metadataJson = metadata != null 
                    ? JsonSerializer.Serialize(metadata)
                    : "{}";
                cmd.Parameters.AddWithValue("meta", NpgsqlDbType.Jsonb, metadataJson);
                
                await cmd.ExecuteNonQueryAsync(cancellationToken);
                
                _logger.LogDebug("Audit log created: {EventType} for {SubjectType}:{SubjectId}", 
                    eventType, subjectType, subjectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write audit log for {EventType}", eventType);
                // Don't throw - audit logging should not break the main flow
            }
        }
        
        public async Task LogConsentChangeAsync(
            Guid tenantId,
            Guid userId,
            string consentType,
            bool oldValue,
            bool newValue,
            string? reason,
            CancellationToken cancellationToken = default)
        {
            await LogAsync(
                tenantId,
                "consent.changed",
                "user",
                userId,
                new
                {
                    consentType,
                    oldValue,
                    newValue,
                    reason,
                    changedAt = DateTime.UtcNow
                },
                cancellationToken);
        }
    }
}
