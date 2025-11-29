using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/billing")]
[Authorize]
public class AdminBillingController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminBillingController> _logger;

    public AdminBillingController(QivrDbContext context, IConfiguration config, ILogger<AdminBillingController> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetBillingOverview(CancellationToken ct)
    {
        var planPrices = new Dictionary<string, decimal>
        {
            { "starter", 99m },
            { "professional", 299m },
            { "enterprise", 599m }
        };

        var tenants = await _context.Tenants
            .Where(t => t.DeletedAt == null)
            .Select(t => new { t.Plan, t.Status, t.Metadata })
            .ToListAsync(ct);

        var activeTenants = tenants.Where(t => t.Status == TenantStatus.Active).ToList();
        var mrr = activeTenants.Sum(t => planPrices.GetValueOrDefault(t.Plan?.ToLower() ?? "starter", 99m));

        // Count by plan
        var byPlan = activeTenants
            .GroupBy(t => t.Plan?.ToLower() ?? "starter")
            .ToDictionary(g => g.Key, g => g.Count());

        return Ok(new
        {
            mrr,
            mrrFormatted = $"${mrr:N0}",
            arr = mrr * 12,
            activeSubscriptions = activeTenants.Count,
            trialTenants = tenants.Count(t => t.Status == TenantStatus.Active && t.Plan == "trial"),
            suspendedTenants = tenants.Count(t => t.Status == TenantStatus.Suspended),
            byPlan
        });
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetRecentInvoices(CancellationToken ct)
    {
        // In production, this would query Stripe API
        // For now, generate mock data based on active tenants
        var planPrices = new Dictionary<string, decimal>
        {
            { "starter", 99m },
            { "professional", 299m },
            { "enterprise", 599m }
        };

        var tenants = await _context.Tenants
            .Where(t => t.Status == TenantStatus.Active && t.DeletedAt == null)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new { t.Id, t.Name, t.Plan, t.CreatedAt })
            .ToListAsync(ct);

        var invoices = tenants.Select(t => new
        {
            id = $"inv_{t.Id.ToString()[..8]}",
            tenantId = t.Id,
            tenantName = t.Name,
            amount = planPrices.GetValueOrDefault(t.Plan?.ToLower() ?? "starter", 99m),
            status = "paid",
            date = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30)).ToString("yyyy-MM-dd")
        });

        return Ok(invoices);
    }

    [HttpPost("sync/{tenantId:guid}")]
    public async Task<IActionResult> SyncStripeCustomer(Guid tenantId, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant == null) return NotFound();

        // TODO: Implement actual Stripe sync
        // var stripeCustomerId = tenant.Metadata.GetValueOrDefault("stripe_customer_id")?.ToString();
        // if (string.IsNullOrEmpty(stripeCustomerId))
        // {
        //     var customer = await _stripeClient.Customers.CreateAsync(new CustomerCreateOptions
        //     {
        //         Email = tenant.Email,
        //         Name = tenant.Name,
        //         Metadata = new Dictionary<string, string> { { "tenant_id", tenant.Id.ToString() } }
        //     });
        //     tenant.Metadata["stripe_customer_id"] = customer.Id;
        //     await _context.SaveChangesAsync(ct);
        // }

        _logger.LogInformation("Stripe sync requested for tenant {TenantId}", tenantId);
        return Ok(new { success = true, message = "Stripe sync not yet implemented" });
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleStripeWebhook()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

        // TODO: Verify webhook signature and process events
        // var stripeEvent = EventUtility.ConstructEvent(json, signature, _config["Stripe:WebhookSecret"]);
        // switch (stripeEvent.Type)
        // {
        //     case "invoice.paid":
        //         // Update tenant status
        //         break;
        //     case "invoice.payment_failed":
        //         // Suspend tenant or send notification
        //         break;
        //     case "customer.subscription.updated":
        //         // Update plan tier
        //         break;
        // }

        _logger.LogInformation("Stripe webhook received");
        return Ok();
    }
}
