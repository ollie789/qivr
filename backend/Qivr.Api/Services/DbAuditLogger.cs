using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
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
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<DbAuditLogger> _logger;

        public DbAuditLogger(QivrDbContext db, IHttpContextAccessor httpContextAccessor, ILogger<DbAuditLogger> logger)
        {
            _db = db;
            _httpContextAccessor = httpContextAccessor;
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

                // Extract context from HTTP request
                var httpContext = _httpContextAccessor.HttpContext;
                var user = httpContext?.User;
                var actorId = GetActorId(user);
                var actorEmail = GetActorEmail(user);
                var ipAddress = GetClientIp(httpContext);
                var userAgent = httpContext?.Request.Headers["User-Agent"].FirstOrDefault();
                var correlationId = httpContext?.TraceIdentifier;

                await using var cmd = new NpgsqlCommand(@"
                    INSERT INTO public.audit_logs(
                        tenant_id,
                        event_type,
                        subject_type,
                        subject_id,
                        actor_id,
                        actor_email,
                        ip_address,
                        user_agent,
                        correlation_id,
                        metadata,
                        occurred_at
                    )
                    VALUES(@tenant, @event, @subtype, @subid, @actor, @email, @ip, @ua, @corr, @meta, NOW());", conn);

                cmd.Parameters.AddWithValue("tenant", tenantId);
                cmd.Parameters.AddWithValue("event", eventType);
                cmd.Parameters.AddWithValue("subtype", subjectType);
                cmd.Parameters.AddWithValue("subid", NpgsqlDbType.Uuid, subjectId.HasValue ? (object)subjectId.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("actor", NpgsqlDbType.Uuid, actorId.HasValue ? (object)actorId.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("email", NpgsqlDbType.Varchar, (object?)actorEmail ?? DBNull.Value);
                cmd.Parameters.AddWithValue("ip", NpgsqlDbType.Varchar, (object?)ipAddress ?? DBNull.Value);
                cmd.Parameters.AddWithValue("ua", NpgsqlDbType.Varchar, (object?)userAgent ?? DBNull.Value);
                cmd.Parameters.AddWithValue("corr", NpgsqlDbType.Varchar, (object?)correlationId ?? DBNull.Value);

                var metadataJson = metadata != null
                    ? JsonSerializer.Serialize(metadata)
                    : "{}";
                cmd.Parameters.AddWithValue("meta", NpgsqlDbType.Jsonb, metadataJson);

                await cmd.ExecuteNonQueryAsync(cancellationToken);

                _logger.LogDebug("Audit log created: {EventType} for {SubjectType}:{SubjectId} by {ActorEmail}",
                    eventType, subjectType, subjectId, actorEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write audit log for {EventType}", eventType);
                // Don't throw - audit logging should not break the main flow
            }
        }

        private static Guid? GetActorId(ClaimsPrincipal? user)
        {
            var sub = user?.FindFirst("sub")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(sub, out var id) ? id : null;
        }

        private static string? GetActorEmail(ClaimsPrincipal? user)
        {
            return user?.FindFirst("email")?.Value ?? user?.FindFirst(ClaimTypes.Email)?.Value;
        }

        private static string? GetClientIp(HttpContext? context)
        {
            if (context == null) return null;
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }
            return context.Connection.RemoteIpAddress?.ToString();
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
