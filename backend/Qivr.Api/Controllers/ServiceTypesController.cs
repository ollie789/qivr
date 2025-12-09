using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceTypesController : BaseApiController
{
    private readonly QivrDbContext _context;

    public ServiceTypesController(QivrDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ServiceTypeDto>>> GetAll([FromQuery] string? specialty = null)
    {
        var tenantId = RequireTenantId();
        var query = _context.ServiceTypes.Where(s => s.TenantId == tenantId);
        
        if (!string.IsNullOrEmpty(specialty))
            query = query.Where(s => s.Specialty == specialty || s.Specialty == null);
        
        var items = await query
            .OrderBy(s => s.Specialty)
            .ThenBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .Select(s => new ServiceTypeDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Specialty = s.Specialty,
                DurationMinutes = s.DurationMinutes,
                Price = s.Price,
                BillingCode = s.BillingCode,
                IsActive = s.IsActive,
                SortOrder = s.SortOrder
            })
            .ToListAsync();
        
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceTypeDto>> GetById(Guid id)
    {
        var tenantId = RequireTenantId();
        var item = await _context.ServiceTypes.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
        if (item == null) return NotFound();
        
        return Ok(new ServiceTypeDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Specialty = item.Specialty,
            DurationMinutes = item.DurationMinutes,
            Price = item.Price,
            BillingCode = item.BillingCode,
            IsActive = item.IsActive,
            SortOrder = item.SortOrder
        });
    }

    [HttpPost]
    public async Task<ActionResult<ServiceTypeDto>> Create([FromBody] CreateServiceTypeRequest request)
    {
        var tenantId = RequireTenantId();
        
        var item = new ServiceType
        {
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            Specialty = request.Specialty,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            BillingCode = request.BillingCode,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder
        };
        
        _context.ServiceTypes.Add(item);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, new ServiceTypeDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Specialty = item.Specialty,
            DurationMinutes = item.DurationMinutes,
            Price = item.Price,
            BillingCode = item.BillingCode,
            IsActive = item.IsActive,
            SortOrder = item.SortOrder
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ServiceTypeDto>> Update(Guid id, [FromBody] UpdateServiceTypeRequest request)
    {
        var tenantId = RequireTenantId();
        var item = await _context.ServiceTypes.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
        if (item == null) return NotFound();
        
        item.Name = request.Name;
        item.Description = request.Description;
        item.Specialty = request.Specialty;
        item.DurationMinutes = request.DurationMinutes;
        item.Price = request.Price;
        item.BillingCode = request.BillingCode;
        item.IsActive = request.IsActive;
        item.SortOrder = request.SortOrder;
        
        await _context.SaveChangesAsync();
        
        return Ok(new ServiceTypeDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Specialty = item.Specialty,
            DurationMinutes = item.DurationMinutes,
            Price = item.Price,
            BillingCode = item.BillingCode,
            IsActive = item.IsActive,
            SortOrder = item.SortOrder
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = RequireTenantId();
        var item = await _context.ServiceTypes.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
        if (item == null) return NotFound();
        
        _context.ServiceTypes.Remove(item);
        await _context.SaveChangesAsync();
        
        return NoContent();
    }

    [HttpGet("specialties")]
    public async Task<ActionResult<List<string>>> GetSpecialties()
    {
        var specialties = await _context.ServiceTypes
            .Where(s => s.Specialty != null)
            .Select(s => s.Specialty!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();
        
        return Ok(specialties);
    }
}

public record ServiceTypeDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Specialty { get; init; }
    public int DurationMinutes { get; init; }
    public decimal Price { get; init; }
    public string? BillingCode { get; init; }
    public bool IsActive { get; init; }
    public int SortOrder { get; init; }
}

public record CreateServiceTypeRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Specialty { get; init; }
    public int DurationMinutes { get; init; } = 30;
    public decimal Price { get; init; }
    public string? BillingCode { get; init; }
    public bool IsActive { get; init; } = true;
    public int SortOrder { get; init; } = 0;
}

public record UpdateServiceTypeRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Specialty { get; init; }
    public int DurationMinutes { get; init; }
    public decimal Price { get; init; }
    public string? BillingCode { get; init; }
    public bool IsActive { get; init; }
    public int SortOrder { get; init; }
}
