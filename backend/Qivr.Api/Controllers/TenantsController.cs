using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : BaseApiController
{
    private readonly ITenantService _tenantService;
    private readonly IEnhancedTenantService _enhancedTenantService;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(ITenantService tenantService, IEnhancedTenantService enhancedTenantService, ILogger<TenantsController> logger)
    {
        _tenantService = tenantService;
        _enhancedTenantService = enhancedTenantService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TenantSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAccessibleTenants(CancellationToken cancellationToken)
    {
        var cognitoSub = User.FindFirst("sub")?.Value;
        var tenants = await _tenantService.GetTenantsForUserAsync(CurrentUserId, cognitoSub, cancellationToken);

        if (tenants.Count == 0)
        {
            // Don't require tenant ID for this endpoint - it's used to select a tenant
            var currentTenantId = CurrentTenantId;
            if (currentTenantId.HasValue)
            {
                var tenant = await _tenantService.GetTenantAsync(currentTenantId.Value, cancellationToken);
                if (tenant != null)
                {
                    tenants = new List<TenantAccessDto>
                    {
                        new TenantAccessDto(tenant.Id, tenant.Name, tenant.Slug, true)
                    };
                }
            }
        }

        var response = tenants
            .Select(t => new TenantSummaryDto
            {
                Id = t.Id.ToString(),
                Name = t.Name,
                Slug = t.Slug
            })
            .OrderBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (response.Count == 0)
        {
            _logger.LogWarning("No tenants resolved for user {UserId}", CurrentUserId);
        }

        return Ok(response);
    }

    [HttpGet("{tenantId:guid}")]
    [ProducesResponseType(typeof(TenantSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTenant(Guid tenantId, CancellationToken cancellationToken)
    {
        var tenant = await _tenantService.GetTenantAsync(tenantId, cancellationToken);
        if (tenant == null)
        {
            return NotFound();
        }

        return Ok(new TenantSummaryDto
        {
            Id = tenant.Id.ToString(),
            Name = tenant.Name,
            Slug = tenant.Slug
        });
    }

    [HttpPost]
    [ProducesResponseType(typeof(TenantSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Clinic name is required");
        }

        try
        {
            // Use enhanced SaaS tenant service to create tenant with dedicated Cognito User Pool
            var tenant = await _enhancedTenantService.CreateSaasTenantAsync(request.Name, request.Address, request.Phone, request.Email, CurrentUserId, cancellationToken);
            
            return CreatedAtAction(
                nameof(GetTenant),
                new { tenantId = tenant.Id },
                new TenantSummaryDto
                {
                    Id = tenant.Id.ToString(),
                    Name = tenant.Name,
                    Slug = tenant.Slug
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create SaaS tenant for user {UserId}", CurrentUserId);
            return BadRequest("Failed to create clinic");
        }
    }
}

public class CreateTenantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class TenantSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
}
