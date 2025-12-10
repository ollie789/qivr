using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Infrastructure.Services;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Support tools: impersonation, audit logs, tenant communication.
/// </summary>
[ApiController]
[Route("api/admin/support")]
[Authorize]
public class AdminSupportController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly AdminReadOnlyDbContext _readOnlyContext;
    private readonly IAdminAuditService _auditService;
    private readonly IAmazonSimpleEmailService _ses;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminSupportController> _logger;

    public AdminSupportController(
        QivrDbContext context,
        AdminReadOnlyDbContext readOnlyContext,
        IAdminAuditService auditService,
        IAmazonSimpleEmailService ses,
        IConfiguration config,
        ILogger<AdminSupportController> logger)
    {
        _context = context;
        _readOnlyContext = readOnlyContext;
        _auditService = auditService;
        _ses = ses;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Generate impersonation token to login as a user
    /// This creates a short-lived JWT that allows an admin to access as the target user
    /// </summary>
    [HttpPost("impersonate")]
    public async Task<IActionResult> ImpersonateUser([FromBody] ImpersonateRequest request, CancellationToken ct)
    {
        // Validate tenant and user exist
        var tenant = await _readOnlyContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == request.TenantId, ct);

        if (tenant == null)
            return NotFound(new { error = "Tenant not found" });

        var targetUser = await _readOnlyContext.Users
            .FirstOrDefaultAsync(u => u.TenantId == request.TenantId &&
                (u.Id == request.UserId || u.Email == request.Email), ct);

        if (targetUser == null)
            return NotFound(new { error = "User not found" });

        // Get admin info for audit
        var adminEmail = User.FindFirst("email")?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value;
        var adminSub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Generate impersonation token (short-lived - 1 hour)
        var token = GenerateImpersonationToken(targetUser, tenant, adminSub!);

        // Audit log this critical action
        await _auditService.LogAsync(
            "support.impersonate",
            "User",
            targetUser.Id,
            $"{targetUser.FirstName} {targetUser.LastName}",
            newState: new
            {
                targetUserId = targetUser.Id,
                targetEmail = targetUser.Email,
                tenantId = tenant.Id,
                tenantName = tenant.Name,
                reason = request.Reason
            },
            metadata: new Dictionary<string, object>
            {
                ["impersonatedBy"] = adminEmail ?? "unknown",
                ["reason"] = request.Reason ?? "Support request"
            },
            ct: ct);

        _logger.LogWarning(
            "Admin {AdminEmail} impersonating user {UserId} ({UserEmail}) in tenant {TenantName}. Reason: {Reason}",
            adminEmail, targetUser.Id, targetUser.Email, tenant.Name, request.Reason);

        return Ok(new
        {
            token,
            expiresIn = 3600, // 1 hour
            targetUser = new
            {
                id = targetUser.Id,
                email = targetUser.Email,
                name = $"{targetUser.FirstName} {targetUser.LastName}",
                role = targetUser.UserType.ToString()
            },
            tenant = new
            {
                id = tenant.Id,
                name = tenant.Name,
                slug = tenant.Slug
            },
            warning = "This session is being recorded for audit purposes."
        });
    }

    /// <summary>
    /// Get audit logs with filtering
    /// </summary>
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? action = null,
        [FromQuery] string? resourceType = null,
        [FromQuery] Guid? resourceId = null,
        [FromQuery] string? adminEmail = null,
        [FromQuery] DateTime? since = null,
        [FromQuery] DateTime? until = null,
        CancellationToken ct = default)
    {
        var query = _readOnlyContext.AdminAuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action.Contains(action));

        if (!string.IsNullOrEmpty(resourceType))
            query = query.Where(l => l.ResourceType == resourceType);

        if (resourceId.HasValue)
            query = query.Where(l => l.ResourceId == resourceId.Value);

        if (!string.IsNullOrEmpty(adminEmail))
            query = query.Where(l => l.AdminEmail != null && l.AdminEmail.Contains(adminEmail));

        if (since.HasValue)
            query = query.Where(l => l.CreatedAt >= since.Value);

        if (until.HasValue)
            query = query.Where(l => l.CreatedAt <= until.Value);

        var total = await query.CountAsync(ct);

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.CreatedAt,
                l.AdminUserId,
                l.AdminEmail,
                l.Action,
                l.ResourceType,
                l.ResourceId,
                l.ResourceName,
                l.Success,
                l.ErrorMessage,
                l.IpAddress,
                l.CorrelationId
            })
            .ToListAsync(ct);

        return Ok(new
        {
            page,
            pageSize,
            total,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
            logs
        });
    }

    /// <summary>
    /// Get audit log detail including state snapshots
    /// </summary>
    [HttpGet("audit-logs/{id:guid}")]
    public async Task<IActionResult> GetAuditLogDetail(Guid id, CancellationToken ct)
    {
        var log = await _readOnlyContext.AdminAuditLogs
            .FirstOrDefaultAsync(l => l.Id == id, ct);

        if (log == null) return NotFound();

        return Ok(new
        {
            log.Id,
            log.CreatedAt,
            log.AdminUserId,
            log.AdminEmail,
            log.Action,
            log.ResourceType,
            log.ResourceId,
            log.ResourceName,
            log.PreviousState,
            log.NewState,
            log.Success,
            log.ErrorMessage,
            log.IpAddress,
            log.UserAgent,
            log.CorrelationId,
            log.Metadata
        });
    }

    /// <summary>
    /// Send announcement to all users in a tenant or all tenants
    /// </summary>
    [HttpPost("announcements")]
    public async Task<IActionResult> SendAnnouncement([FromBody] AnnouncementRequest request, CancellationToken ct)
    {
        var adminEmail = User.FindFirst("email")?.Value ?? "admin@qivr.com";

        List<string> recipientEmails;

        if (request.TenantId.HasValue)
        {
            // Send to specific tenant
            var tenant = await _readOnlyContext.Tenants
                .FirstOrDefaultAsync(t => t.Id == request.TenantId.Value, ct);

            if (tenant == null)
                return NotFound(new { error = "Tenant not found" });

            recipientEmails = await _readOnlyContext.Users
                .Where(u => u.TenantId == request.TenantId.Value && u.Email != null)
                .Select(u => u.Email!)
                .Distinct()
                .ToListAsync(ct);
        }
        else if (request.SendToAllTenants)
        {
            // Send to all users (admin broadcast)
            recipientEmails = await _readOnlyContext.Users
                .Where(u => u.Email != null && u.UserType != UserType.Patient)
                .Select(u => u.Email!)
                .Distinct()
                .ToListAsync(ct);
        }
        else
        {
            return BadRequest(new { error = "Must specify tenantId or sendToAllTenants" });
        }

        if (!recipientEmails.Any())
            return BadRequest(new { error = "No recipients found" });

        // Send emails in batches
        var fromEmail = _config["Email:FromEmail"] ?? "noreply@qivr.health";
        var batchSize = 50;
        var sent = 0;
        var failed = 0;

        for (int i = 0; i < recipientEmails.Count; i += batchSize)
        {
            var batch = recipientEmails.Skip(i).Take(batchSize).ToList();

            try
            {
                var sendRequest = new SendEmailRequest
                {
                    Source = fromEmail,
                    Destination = new Destination
                    {
                        BccAddresses = batch // Use BCC for privacy
                    },
                    Message = new Amazon.SimpleEmail.Model.Message
                    {
                        Subject = new Content(request.Subject),
                        Body = new Body
                        {
                            Html = new Content(request.HtmlBody ?? request.Body),
                            Text = new Content(request.Body)
                        }
                    }
                };

                await _ses.SendEmailAsync(sendRequest, ct);
                sent += batch.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send announcement batch");
                failed += batch.Count;
            }
        }

        // Audit log the announcement
        await _auditService.LogAsync(
            "support.announcement.send",
            request.TenantId.HasValue ? "Tenant" : "Platform",
            request.TenantId ?? Guid.Empty,
            request.Subject,
            newState: new
            {
                subject = request.Subject,
                recipientCount = recipientEmails.Count,
                sent,
                failed,
                tenantId = request.TenantId
            },
            ct: ct);

        return Ok(new
        {
            success = true,
            recipientCount = recipientEmails.Count,
            sent,
            failed,
            message = $"Announcement sent to {sent} recipients"
        });
    }

    /// <summary>
    /// Get support ticket summary (placeholder for integration)
    /// </summary>
    [HttpGet("tickets")]
    public IActionResult GetTicketSummary()
    {
        // In production, integrate with Zendesk, Freshdesk, Intercom, etc.
        return Ok(new
        {
            message = "Ticket integration not configured",
            placeholder = new
            {
                open = 12,
                pending = 5,
                resolved = 89,
                avgResponseTime = "2.4 hours",
                avgResolutionTime = "18 hours",
                recentTickets = new[]
                {
                    new { id = "T-1234", subject = "Cannot upload documents", status = "open", priority = "high", tenant = "Demo Clinic", created = DateTime.UtcNow.AddHours(-2) },
                    new { id = "T-1233", subject = "Billing question", status = "pending", priority = "medium", tenant = "Test Clinic", created = DateTime.UtcNow.AddHours(-5) },
                    new { id = "T-1232", subject = "Feature request: SMS reminders", status = "open", priority = "low", tenant = "ABC Physio", created = DateTime.UtcNow.AddDays(-1) }
                }
            }
        });
    }

    /// <summary>
    /// Search across tenants and users
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> GlobalSearch([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return BadRequest(new { error = "Search query must be at least 2 characters" });

        var searchTerm = q.ToLower();

        // Search tenants
        var tenants = await _readOnlyContext.Tenants
            .Where(t => t.Name.ToLower().Contains(searchTerm) ||
                       t.Slug.ToLower().Contains(searchTerm))
            .Take(10)
            .Select(t => new
            {
                type = "tenant",
                id = t.Id,
                name = t.Name,
                slug = t.Slug,
                description = $"Tenant: {t.Name}"
            })
            .ToListAsync(ct);

        // Search users
        var users = await _readOnlyContext.Users
            .Where(u => (u.Email != null && u.Email.ToLower().Contains(searchTerm)) ||
                       (u.FirstName != null && u.FirstName.ToLower().Contains(searchTerm)) ||
                       (u.LastName != null && u.LastName.ToLower().Contains(searchTerm)))
            .Take(10)
            .Select(u => new
            {
                type = "user",
                id = u.Id,
                name = $"{u.FirstName} {u.LastName}",
                email = u.Email,
                tenantId = u.TenantId,
                role = u.UserType.ToString(),
                description = $"User: {u.Email} ({u.UserType})"
            })
            .ToListAsync(ct);

        var results = new List<object>();
        results.AddRange(tenants);
        results.AddRange(users);

        return Ok(new
        {
            query = q,
            resultCount = results.Count,
            results
        });
    }

    private string GenerateImpersonationToken(User user, Tenant tenant, string adminSub)
    {
        var key = _config["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey must be configured for impersonation tokens.");
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("sub", user.CognitoSub ?? user.Id.ToString()),
            new Claim("email", user.Email ?? ""),
            new Claim("tenant_id", tenant.Id.ToString()),
            new Claim("tenant_slug", tenant.Slug),
            new Claim("role", user.UserType.ToString()),
            new Claim("impersonated_by", adminSub),
            new Claim("is_impersonation", "true"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "qivr-admin",
            audience: _config["Jwt:Audience"] ?? "qivr-api",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1), // Short-lived for security
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class ImpersonateRequest
{
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public string? Reason { get; set; }
}

public class AnnouncementRequest
{
    public Guid? TenantId { get; set; }
    public bool SendToAllTenants { get; set; }
    public string Subject { get; set; } = "";
    public string Body { get; set; } = "";
    public string? HtmlBody { get; set; }
}
