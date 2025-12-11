using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Middleware;

public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IdempotencyMiddleware> _logger;

    public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, QivrDbContext db)
    {
        // Only apply to mutating methods
        if (!HttpMethods.IsPost(context.Request.Method) &&
            !HttpMethods.IsPut(context.Request.Method) &&
            !HttpMethods.IsPatch(context.Request.Method))
        {
            await _next(context);
            return;
        }

        var key = context.Request.Headers["Idempotency-Key"].FirstOrDefault()
                  ?? context.Request.Headers["X-Idempotency-Key"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(key))
        {
            await _next(context);
            return;
        }

        var tenantId = context.User.FindFirst("tenant_id")?.Value
                        ?? context.Items["TenantId"] as string;

        // SECURITY: Require valid tenant ID - don't fall back to a default
        if (string.IsNullOrWhiteSpace(tenantId) || !Guid.TryParse(tenantId, out _))
        {
            await _next(context);
            return;
        }

        // Lookup existing idempotency record
        var existing = await db.Database.SqlQueryRaw<IdemRow>(
            "SELECT id, status_code, response_body FROM public.idempotency_keys WHERE tenant_id = {0} AND idempotency_key = {1} AND method = {2} AND path = {3} LIMIT 1",
            Guid.Parse(tenantId), key, context.Request.Method, context.Request.Path.ToString()
        ).FirstOrDefaultAsync();

        if (existing != null)
        {
            context.Response.StatusCode = existing.StatusCode ?? StatusCodes.Status200OK;
            if (!string.IsNullOrEmpty(existing.ResponseBody))
            {
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(existing.ResponseBody);
            }
            return;
        }

        // Buffer the response
        var originalBodyStream = context.Response.Body;
        await using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        await _next(context);

        // Read buffered response
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var text = await new StreamReader(context.Response.Body).ReadToEndAsync();
        context.Response.Body.Seek(0, SeekOrigin.Begin);

        // Store idempotency record (best effort)
        try
        {
            var userIdStr = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                            ?? context.User.FindFirst("sub")?.Value;
            Guid? userId = null;
            if (Guid.TryParse(userIdStr, out var parsed)) userId = parsed;

            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO public.idempotency_keys (
                    tenant_id, user_id, idempotency_key, method, path, request_hash, status_code, response_body, created_at
                ) VALUES (
                    {Guid.Parse(tenantId)}, {userId}, {key}, {context.Request.Method}, {context.Request.Path.ToString()}, NULL, {context.Response.StatusCode}, {text}, NOW()
                )
            ");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist idempotency key record for {Path}", context.Request.Path);
        }

        await responseBody.CopyToAsync(originalBodyStream);
    }

    private sealed class IdemRow
    {
        public Guid Id { get; set; }
        public int? StatusCode { get; set; }
        public string? ResponseBody { get; set; }
    }
}

