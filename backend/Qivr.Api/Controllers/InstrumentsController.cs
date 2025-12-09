using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Core.DTOs;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InstrumentsController : ControllerBase
{
    private readonly IInstrumentService _instrumentService;
    private readonly ILogger<InstrumentsController> _logger;

    public InstrumentsController(
        IInstrumentService instrumentService,
        ILogger<InstrumentsController> logger)
    {
        _instrumentService = instrumentService;
        _logger = logger;
    }

    /// <summary>
    /// Get all instruments in the catalogue
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<InstrumentDto>>> GetAll([FromQuery] bool includeInactive = false)
    {
        var instruments = await _instrumentService.GetAllAsync(includeInactive);
        return Ok(instruments);
    }

    /// <summary>
    /// Get instrument summaries for dropdowns (lightweight)
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<List<InstrumentSummaryDto>>> GetSummaryList([FromQuery] string? clinicalDomain = null)
    {
        var instruments = await _instrumentService.GetSummaryListAsync(clinicalDomain);
        return Ok(instruments);
    }

    /// <summary>
    /// Get instrument by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InstrumentDto>> GetById(Guid id)
    {
        var instrument = await _instrumentService.GetByIdAsync(id);
        if (instrument == null)
            return NotFound(new { message = $"Instrument with ID {id} not found" });

        return Ok(instrument);
    }

    /// <summary>
    /// Get instrument by key (e.g., "odi", "koos")
    /// </summary>
    [HttpGet("key/{key}")]
    public async Task<ActionResult<InstrumentDto>> GetByKey(string key)
    {
        var instrument = await _instrumentService.GetByKeyAsync(key);
        if (instrument == null)
            return NotFound(new { message = $"Instrument with key '{key}' not found" });

        return Ok(instrument);
    }

    /// <summary>
    /// Create a new instrument (admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<ActionResult<InstrumentDto>> Create([FromBody] CreateInstrumentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var instrument = await _instrumentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = instrument.Id }, instrument);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create instrument {Key}", dto.Key);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing instrument (admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<ActionResult<InstrumentDto>> Update(Guid id, [FromBody] UpdateInstrumentDto dto)
    {
        var instrument = await _instrumentService.UpdateAsync(id, dto);
        if (instrument == null)
            return NotFound(new { message = $"Instrument with ID {id} not found" });

        return Ok(instrument);
    }

    /// <summary>
    /// Delete an instrument (admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var deleted = await _instrumentService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Instrument with ID {id} not found" });

        return NoContent();
    }

    /// <summary>
    /// Seed standard instruments (admin only)
    /// </summary>
    [HttpPost("seed")]
    [Authorize(Roles = "superadmin")]
    public async Task<ActionResult> SeedStandardInstruments()
    {
        await _instrumentService.SeedStandardInstrumentsAsync();
        return Ok(new { message = "Standard instruments seeded successfully" });
    }

    /// <summary>
    /// Get available clinical domains
    /// </summary>
    [HttpGet("domains")]
    public ActionResult<List<string>> GetClinicalDomains()
    {
        var domains = new List<string>
        {
            "spine",
            "knee",
            "hip",
            "shoulder",
            "upper_limb",
            "lower_limb",
            "pain",
            "mental_health",
            "general_health",
            "physical_function"
        };
        return Ok(domains);
    }
}
