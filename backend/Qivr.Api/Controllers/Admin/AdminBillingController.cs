using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Infrastructure.Services;
using Stripe;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Admin billing operations using Stripe API.
/// Provides invoice history, payment methods, and billing management.
/// All write operations are audit logged.
/// </summary>
[ApiController]
[Route("api/admin/billing")]
[Authorize]
public class AdminBillingController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly AdminReadOnlyDbContext _readOnlyContext;
    private readonly IAdminAuditService _auditService;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminBillingController> _logger;

    public AdminBillingController(
        QivrDbContext context,
        AdminReadOnlyDbContext readOnlyContext,
        IAdminAuditService auditService,
        IConfiguration config,
        ILogger<AdminBillingController> logger)
    {
        _context = context;
        _readOnlyContext = readOnlyContext;
        _auditService = auditService;
        _config = config;
        _logger = logger;

        // Configure Stripe API key
        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
    }

    /// <summary>
    /// Get billing overview across all tenants
    /// Uses read replica for performance
    /// </summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetBillingOverview(CancellationToken ct)
    {
        // Calculate MRR from tenant plans using read replica
        var tenants = await _readOnlyContext.Tenants
            .Where(t => t.DeletedAt == null && t.IsActive)
            .Select(t => new { t.Plan, t.Status })
            .ToListAsync(ct);

        var planPrices = new Dictionary<string, decimal>
        {
            ["starter"] = 99m,
            ["professional"] = 299m,
            ["enterprise"] = 599m
        };

        var mrr = tenants
            .Where(t => t.Status == Core.Entities.TenantStatus.Active)
            .Sum(t => planPrices.GetValueOrDefault(t.Plan.ToLower(), 0m));

        var planBreakdown = tenants
            .GroupBy(t => t.Plan.ToLower())
            .Select(g => new { Plan = g.Key, Count = g.Count(), Revenue = g.Count() * planPrices.GetValueOrDefault(g.Key, 0m) })
            .ToList();

        return Ok(new
        {
            mrr,
            mrrFormatted = $"${mrr:N0}",
            arr = mrr * 12,
            arrFormatted = $"${mrr * 12:N0}",
            totalTenants = tenants.Count,
            activeTenants = tenants.Count(t => t.Status == Core.Entities.TenantStatus.Active),
            planBreakdown
        });
    }

    /// <summary>
    /// Get invoices for a specific tenant (by Stripe customer ID)
    /// </summary>
    [HttpGet("tenants/{tenantId:guid}/invoices")]
    public async Task<IActionResult> GetTenantInvoices(Guid tenantId, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant == null) return NotFound();

        // Get Stripe customer ID from tenant metadata
        var stripeCustomerId = tenant.Metadata.TryGetValue("stripeCustomerId", out var cid)
            ? cid?.ToString()
            : null;

        if (string.IsNullOrEmpty(stripeCustomerId))
        {
            return Ok(new
            {
                invoices = Array.Empty<object>(),
                hasStripeAccount = false,
                message = "No Stripe customer linked to this tenant"
            });
        }

        try
        {
            var invoiceService = new InvoiceService();
            var invoices = await invoiceService.ListAsync(new InvoiceListOptions
            {
                Customer = stripeCustomerId,
                Limit = limit
            }, cancellationToken: ct);

            var result = invoices.Data.Select(inv => new
            {
                id = inv.Id,
                number = inv.Number,
                status = inv.Status,
                amountDue = inv.AmountDue / 100m, // Convert from cents
                amountPaid = inv.AmountPaid / 100m,
                currency = inv.Currency.ToUpper(),
                created = inv.Created,
                dueDate = inv.DueDate,
                paid = inv.Status == "paid",
                hostedInvoiceUrl = inv.HostedInvoiceUrl,
                pdfUrl = inv.InvoicePdf
            });

            return Ok(new
            {
                invoices = result,
                hasStripeAccount = true
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe API error for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Failed to fetch invoices from Stripe" });
        }
    }

    /// <summary>
    /// Get payment methods for a tenant
    /// </summary>
    [HttpGet("tenants/{tenantId:guid}/payment-methods")]
    public async Task<IActionResult> GetPaymentMethods(Guid tenantId, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant == null) return NotFound();

        var stripeCustomerId = tenant.Metadata.TryGetValue("stripeCustomerId", out var cid)
            ? cid?.ToString()
            : null;

        if (string.IsNullOrEmpty(stripeCustomerId))
        {
            return Ok(new
            {
                paymentMethods = Array.Empty<object>(),
                hasStripeAccount = false
            });
        }

        try
        {
            var pmService = new PaymentMethodService();
            var paymentMethods = await pmService.ListAsync(new PaymentMethodListOptions
            {
                Customer = stripeCustomerId,
                Type = "card"
            }, cancellationToken: ct);

            var result = paymentMethods.Data.Select(pm => new
            {
                id = pm.Id,
                type = pm.Type,
                brand = pm.Card?.Brand,
                last4 = pm.Card?.Last4,
                expMonth = pm.Card?.ExpMonth,
                expYear = pm.Card?.ExpYear,
                isDefault = pm.Id == paymentMethods.Data.FirstOrDefault()?.Id
            });

            return Ok(new
            {
                paymentMethods = result,
                hasStripeAccount = true
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe API error for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Failed to fetch payment methods from Stripe" });
        }
    }

    /// <summary>
    /// Get subscription details for a tenant
    /// </summary>
    [HttpGet("tenants/{tenantId:guid}/subscription")]
    public async Task<IActionResult> GetSubscription(Guid tenantId, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant == null) return NotFound();

        var stripeCustomerId = tenant.Metadata.TryGetValue("stripeCustomerId", out var cid)
            ? cid?.ToString()
            : null;

        if (string.IsNullOrEmpty(stripeCustomerId))
        {
            // Return calculated subscription based on plan
            var planPrices = new Dictionary<string, decimal>
            {
                ["starter"] = 99m,
                ["professional"] = 299m,
                ["enterprise"] = 599m
            };

            return Ok(new
            {
                hasStripeSubscription = false,
                plan = tenant.Plan,
                price = planPrices.GetValueOrDefault(tenant.Plan.ToLower(), 0m),
                status = tenant.Status.ToString().ToLower(),
                message = "Subscription managed manually (no Stripe link)"
            });
        }

        try
        {
            var subService = new SubscriptionService();
            var subscriptions = await subService.ListAsync(new SubscriptionListOptions
            {
                Customer = stripeCustomerId,
                Limit = 1
            }, cancellationToken: ct);

            var subscription = subscriptions.Data.FirstOrDefault();
            if (subscription == null)
            {
                return Ok(new
                {
                    hasStripeSubscription = false,
                    plan = tenant.Plan,
                    status = tenant.Status.ToString().ToLower()
                });
            }

            // Get period info from the subscription item
            var subItem = subscription.Items.Data.FirstOrDefault();

            return Ok(new
            {
                hasStripeSubscription = true,
                subscriptionId = subscription.Id,
                status = subscription.Status,
                currentPeriodStart = subItem?.CurrentPeriodStart,
                currentPeriodEnd = subItem?.CurrentPeriodEnd,
                cancelAtPeriodEnd = subscription.CancelAtPeriodEnd,
                plan = subItem?.Price?.Nickname ?? tenant.Plan,
                priceId = subItem?.Price?.Id,
                amount = (subItem?.Price?.UnitAmount ?? 0) / 100m
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe API error for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Failed to fetch subscription from Stripe" });
        }
    }

    /// <summary>
    /// Create a Stripe customer for a tenant
    /// </summary>
    [HttpPost("tenants/{tenantId:guid}/stripe-customer")]
    public async Task<IActionResult> CreateStripeCustomer(Guid tenantId, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant == null) return NotFound();

        // Check if already has Stripe customer
        if (tenant.Metadata.TryGetValue("stripeCustomerId", out var existing) && existing != null)
        {
            return BadRequest(new { error = "Tenant already has a Stripe customer", customerId = existing });
        }

        try
        {
            var customerService = new CustomerService();
            var customer = await customerService.CreateAsync(new CustomerCreateOptions
            {
                Name = tenant.Name,
                Email = tenant.Email,
                Metadata = new Dictionary<string, string>
                {
                    ["tenantId"] = tenant.Id.ToString(),
                    ["tenantSlug"] = tenant.Slug
                }
            }, cancellationToken: ct);

            // Save Stripe customer ID to tenant metadata
            tenant.Metadata["stripeCustomerId"] = customer.Id;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            // Audit log the Stripe customer creation
            await _auditService.LogAsync(
                AdminActions.BillingStripeCustomerCreate,
                "Tenant",
                tenantId,
                tenant.Name,
                previousState: new { stripeCustomerId = (string?)null },
                newState: new { stripeCustomerId = customer.Id },
                ct: ct);

            _logger.LogInformation("Created Stripe customer {CustomerId} for tenant {TenantId}", customer.Id, tenantId);

            return Ok(new
            {
                customerId = customer.Id,
                message = "Stripe customer created successfully"
            });
        }
        catch (StripeException ex)
        {
            // Audit log the failure
            await _auditService.LogAsync(
                AdminActions.BillingStripeCustomerCreate,
                "Tenant",
                tenantId,
                tenant.Name,
                success: false,
                errorMessage: ex.Message,
                ct: ct);

            _logger.LogError(ex, "Failed to create Stripe customer for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Failed to create Stripe customer" });
        }
    }

    /// <summary>
    /// Create a billing portal session for a tenant
    /// </summary>
    [HttpPost("tenants/{tenantId:guid}/portal-session")]
    public async Task<IActionResult> CreatePortalSession(Guid tenantId, [FromBody] PortalSessionRequest request, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { tenantId }, ct);
        if (tenant == null) return NotFound();

        var stripeCustomerId = tenant.Metadata.TryGetValue("stripeCustomerId", out var cid)
            ? cid?.ToString()
            : null;

        if (string.IsNullOrEmpty(stripeCustomerId))
        {
            return BadRequest(new { error = "Tenant has no Stripe customer" });
        }

        try
        {
            var portalService = new Stripe.BillingPortal.SessionService();
            var session = await portalService.CreateAsync(new Stripe.BillingPortal.SessionCreateOptions
            {
                Customer = stripeCustomerId,
                ReturnUrl = request.ReturnUrl ?? "https://admin.qivr.com/tenants"
            }, cancellationToken: ct);

            return Ok(new { url = session.Url });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to create portal session for tenant {TenantId}", tenantId);
            return StatusCode(500, new { error = "Failed to create billing portal session" });
        }
    }

    /// <summary>
    /// Get recent transactions across all tenants
    /// </summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetRecentTransactions([FromQuery] int limit = 20, CancellationToken ct = default)
    {
        try
        {
            var chargeService = new ChargeService();
            var charges = await chargeService.ListAsync(new ChargeListOptions
            {
                Limit = limit
            }, cancellationToken: ct);

            var result = charges.Data.Select(charge => new
            {
                id = charge.Id,
                amount = charge.Amount / 100m,
                currency = charge.Currency.ToUpper(),
                status = charge.Status,
                created = charge.Created,
                customerId = charge.CustomerId,
                customerEmail = charge.BillingDetails?.Email,
                description = charge.Description,
                paid = charge.Paid,
                refunded = charge.Refunded
            });

            return Ok(new { transactions = result });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to fetch recent transactions");
            return StatusCode(500, new { error = "Failed to fetch transactions from Stripe" });
        }
    }

    /// <summary>
    /// Get churn analysis - cancelled tenants and reasons
    /// </summary>
    [HttpGet("churn")]
    public async Task<IActionResult> GetChurnAnalysis([FromQuery] int months = 6, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddMonths(-months);

        // Get cancelled/suspended tenants
        var churned = await _readOnlyContext.Tenants
            .Where(t => !t.IsActive || t.DeletedAt != null)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                t.CreatedAt,
                t.UpdatedAt,
                plan = t.Settings.ContainsKey("plan") ? t.Settings["plan"].ToString() : "starter",
                status = t.IsActive ? "active" : "churned"
            })
            .ToListAsync(ct);

        // Group by month
        var churnByMonth = churned
            .GroupBy(t => new { Year = t.UpdatedAt.Year, Month = t.UpdatedAt.Month })
            .Select(g => new
            {
                month = $"{g.Key.Year}-{g.Key.Month:D2}",
                count = g.Count()
            })
            .OrderBy(g => g.month)
            .ToList();

        // Churn by plan
        var churnByPlan = churned
            .GroupBy(t => t.plan)
            .Select(g => new { plan = g.Key, count = g.Count() })
            .ToList();

        // Calculate lifetime metrics
        var avgLifetimeDays = churned.Any()
            ? churned.Average(t => (t.UpdatedAt - t.CreatedAt).TotalDays)
            : 0;

        return Ok(new
        {
            period = $"Last {months} months",
            summary = new
            {
                totalChurned = churned.Count,
                avgLifetimeDays = Math.Round(avgLifetimeDays, 1),
                churnRate = 0.0 // Would calculate from total active tenants
            },
            churnByMonth,
            churnByPlan,
            recentChurns = churned
                .OrderByDescending(t => t.UpdatedAt)
                .Take(10)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.Slug,
                    t.plan,
                    lifetimeDays = (int)(t.UpdatedAt - t.CreatedAt).TotalDays,
                    churnedAt = t.UpdatedAt
                })
        });
    }

    /// <summary>
    /// Get revenue breakdown by region and plan
    /// </summary>
    [HttpGet("revenue-breakdown")]
    public async Task<IActionResult> GetRevenueBreakdown(CancellationToken ct)
    {
        var planPrices = new Dictionary<string, decimal>
        {
            ["starter"] = 99m,
            ["professional"] = 299m,
            ["enterprise"] = 599m
        };

        var tenants = await _readOnlyContext.Tenants
            .Where(t => t.IsActive && t.DeletedAt == null)
            .Select(t => new
            {
                plan = t.Settings.ContainsKey("plan") ? t.Settings["plan"].ToString() : "starter",
                region = t.State ?? "Unknown"
            })
            .ToListAsync(ct);

        // Revenue by plan
        var byPlan = tenants
            .GroupBy(t => t.plan)
            .Select(g => new
            {
                plan = g.Key,
                count = g.Count(),
                mrr = g.Count() * planPrices.GetValueOrDefault(g.Key ?? "starter", 99m)
            })
            .OrderByDescending(p => p.mrr)
            .ToList();

        // Revenue by region
        var byRegion = tenants
            .GroupBy(t => t.region)
            .Select(g => new
            {
                region = g.Key,
                count = g.Count(),
                mrr = g.Sum(t => planPrices.GetValueOrDefault(t.plan ?? "starter", 99m))
            })
            .OrderByDescending(r => r.mrr)
            .ToList();

        var totalMrr = byPlan.Sum(p => p.mrr);

        return Ok(new
        {
            totalMrr,
            totalArr = totalMrr * 12,
            byPlan,
            byRegion
        });
    }

    /// <summary>
    /// Get upcoming subscription renewals
    /// </summary>
    [HttpGet("renewals")]
    public async Task<IActionResult> GetUpcomingRenewals([FromQuery] int days = 30, CancellationToken ct = default)
    {
        try
        {
            var subscriptionService = new SubscriptionService();
            var subscriptions = await subscriptionService.ListAsync(new SubscriptionListOptions
            {
                Limit = 100,
                Status = "active"
            }, cancellationToken: ct);

            var cutoff = DateTime.UtcNow.AddDays(days);
            var upcoming = subscriptions.Data
                .Where(s => s.CurrentPeriodEnd <= cutoff)
                .Select(s => new
                {
                    subscriptionId = s.Id,
                    customerId = s.CustomerId,
                    status = s.Status,
                    currentPeriodEnd = s.CurrentPeriodEnd,
                    daysUntilRenewal = (s.CurrentPeriodEnd - DateTime.UtcNow).Days,
                    cancelAtPeriodEnd = s.CancelAtPeriodEnd,
                    amount = s.Items.Data.FirstOrDefault()?.Price?.UnitAmount / 100m ?? 0
                })
                .OrderBy(s => s.daysUntilRenewal)
                .ToList();

            return Ok(new
            {
                period = $"Next {days} days",
                totalRenewals = upcoming.Count,
                totalRevenue = upcoming.Sum(r => r.amount),
                atRiskOfChurn = upcoming.Count(r => r.cancelAtPeriodEnd),
                renewals = upcoming
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to fetch upcoming renewals");
            return StatusCode(500, new { error = "Failed to fetch renewals from Stripe" });
        }
    }

    /// <summary>
    /// Get failed payments
    /// </summary>
    [HttpGet("failed-payments")]
    public async Task<IActionResult> GetFailedPayments([FromQuery] int days = 30, CancellationToken ct = default)
    {
        try
        {
            var since = DateTime.UtcNow.AddDays(-days);
            var chargeService = new ChargeService();
            var charges = await chargeService.ListAsync(new ChargeListOptions
            {
                Limit = 100,
                Created = new DateRangeOptions { GreaterThanOrEqual = since }
            }, cancellationToken: ct);

            var failed = charges.Data
                .Where(c => c.Status == "failed")
                .Select(c => new
                {
                    id = c.Id,
                    amount = c.Amount / 100m,
                    currency = c.Currency.ToUpper(),
                    customerId = c.CustomerId,
                    customerEmail = c.BillingDetails?.Email,
                    failureCode = c.FailureCode,
                    failureMessage = c.FailureMessage,
                    created = c.Created
                })
                .OrderByDescending(c => c.created)
                .ToList();

            return Ok(new
            {
                period = $"Last {days} days",
                totalFailed = failed.Count,
                totalAmount = failed.Sum(f => f.amount),
                byFailureCode = failed
                    .GroupBy(f => f.failureCode ?? "unknown")
                    .Select(g => new { code = g.Key, count = g.Count() })
                    .OrderByDescending(g => g.count),
                failures = failed
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to fetch failed payments");
            return StatusCode(500, new { error = "Failed to fetch failed payments from Stripe" });
        }
    }

    /// <summary>
    /// Resend an invoice
    /// </summary>
    [HttpPost("invoices/{invoiceId}/resend")]
    public async Task<IActionResult> ResendInvoice(string invoiceId, CancellationToken ct)
    {
        try
        {
            var invoiceService = new InvoiceService();
            var invoice = await invoiceService.SendInvoiceAsync(invoiceId, cancellationToken: ct);

            await _auditService.LogAsync(
                "billing.invoice.resend",
                "Invoice",
                Guid.Empty,
                invoiceId,
                newState: new { invoiceId, status = invoice.Status },
                ct: ct);

            return Ok(new { success = true, invoiceId = invoice.Id, status = invoice.Status });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to resend invoice {InvoiceId}", invoiceId);
            return StatusCode(500, new { error = "Failed to resend invoice" });
        }
    }

    /// <summary>
    /// Void an invoice
    /// </summary>
    [HttpPost("invoices/{invoiceId}/void")]
    public async Task<IActionResult> VoidInvoice(string invoiceId, CancellationToken ct)
    {
        try
        {
            var invoiceService = new InvoiceService();
            var invoice = await invoiceService.VoidInvoiceAsync(invoiceId, cancellationToken: ct);

            await _auditService.LogAsync(
                "billing.invoice.void",
                "Invoice",
                Guid.Empty,
                invoiceId,
                newState: new { invoiceId, status = invoice.Status },
                ct: ct);

            return Ok(new { success = true, invoiceId = invoice.Id, status = invoice.Status });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to void invoice {InvoiceId}", invoiceId);
            return StatusCode(500, new { error = "Failed to void invoice" });
        }
    }

    /// <summary>
    /// Create a refund
    /// </summary>
    [HttpPost("charges/{chargeId}/refund")]
    public async Task<IActionResult> RefundCharge(string chargeId, [FromBody] RefundRequest request, CancellationToken ct)
    {
        try
        {
            var refundService = new RefundService();
            var options = new RefundCreateOptions
            {
                Charge = chargeId,
                Reason = request.Reason ?? RefundReasons.RequestedByCustomer
            };

            if (request.Amount.HasValue)
            {
                options.Amount = (long)(request.Amount.Value * 100);
            }

            var refund = await refundService.CreateAsync(options, cancellationToken: ct);

            await _auditService.LogAsync(
                "billing.refund.create",
                "Charge",
                Guid.Empty,
                chargeId,
                newState: new { chargeId, refundId = refund.Id, amount = refund.Amount / 100m, reason = request.Reason },
                ct: ct);

            return Ok(new
            {
                success = true,
                refundId = refund.Id,
                amount = refund.Amount / 100m,
                status = refund.Status
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to refund charge {ChargeId}", chargeId);
            return StatusCode(500, new { error = "Failed to create refund" });
        }
    }
}

public class PortalSessionRequest
{
    public string? ReturnUrl { get; set; }
}

public class RefundRequest
{
    public decimal? Amount { get; set; }
    public string? Reason { get; set; }
}
