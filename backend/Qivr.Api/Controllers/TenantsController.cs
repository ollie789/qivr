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
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(ITenantService tenantService, ILogger<TenantsController> logger)
    {
        _tenantService = tenantService;
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
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                IsDefault = t.IsDefault
            })
            .OrderByDescending(t => t.IsDefault)
            .ThenBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
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
            Id = tenant.Id,
            Name = tenant.Name,
            Slug = tenant.Slug,
            IsDefault = false
        });
    }
}

public class TenantSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public bool IsDefault { get; set; }
}
