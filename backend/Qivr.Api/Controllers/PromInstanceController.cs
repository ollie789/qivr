using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PromInstanceController : ControllerBase
{
    private readonly IPromInstanceService _promInstanceService;
    private readonly ILogger<PromInstanceController> _logger;

    public PromInstanceController(
        IPromInstanceService promInstanceService,
        ILogger<PromInstanceController> logger)
    {
        _promInstanceService = promInstanceService;
        _logger = logger;
    }

    /// <summary>
    /// Send a PROM to a single patient
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<PromInstanceDto>> SendPromToPatient(
        [FromBody] SendPromRequest request,
        CancellationToken ct = default)
    {
        try
        {
            // Add current user as sender
            request.SentBy = User.Identity?.Name ?? "System";
            
            var result = await _promInstanceService.SendPromToPatientAsync(request, ct);
            _logger.LogInformation("PROM sent to patient {PatientId}", request.PatientId);
            
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending PROM to patient");
            return StatusCode(500, new { error = "Failed to send PROM" });
        }
    }

    /// <summary>
    /// Send a PROM to multiple patients
    /// </summary>
    [HttpPost("send/bulk")]
    public async Task<ActionResult<List<PromInstanceDto>>> SendPromToMultiplePatients(
        [FromBody] SendBulkPromRequest request,
        CancellationToken ct = default)
    {
        try
        {
            request.SentBy = User.Identity?.Name ?? "System";
            
            var results = await _promInstanceService.SendPromToMultiplePatientsAsync(request, ct);
            _logger.LogInformation("Bulk PROM sent to {Count} patients", results.Count);
            
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending bulk PROMs");
            return StatusCode(500, new { error = "Failed to send PROMs" });
        }
    }

    /// <summary>
    /// Get a specific PROM instance by ID
    /// </summary>
    [HttpGet("{instanceId}")]
    public async Task<ActionResult<PromInstanceDto>> GetPromInstance(
        Guid instanceId,
        CancellationToken ct = default)
    {
        var instance = await _promInstanceService.GetPromInstanceAsync(instanceId, ct);
        
        if (instance == null)
        {
            return NotFound(new { error = "PROM instance not found" });
        }
        
        return Ok(instance);
    }

    /// <summary>
    /// Get all PROM instances for a patient
    /// </summary>
    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<List<PromInstanceDto>>> GetPatientPromInstances(
        Guid patientId,
        CancellationToken ct = default)
    {
        var instances = await _promInstanceService.GetPatientPromInstancesAsync(patientId, ct);
        return Ok(instances);
    }

    /// <summary>
    /// Submit responses for a PROM instance (patient portal endpoint)
    /// </summary>
    [AllowAnonymous] // Allow patients to submit without login
    [HttpPost("{instanceId}/submit")]
    public async Task<ActionResult<PromInstanceDto>> SubmitPromResponse(
        Guid instanceId,
        [FromBody] PromResponse response,
        CancellationToken ct = default)
    {
        try
        {
            response.SubmittedAt = DateTime.UtcNow;
            var result = await _promInstanceService.SubmitPromResponseAsync(instanceId, response, ct);
            
            // If booking was requested, handle it
            if (response.RequestBooking && response.BookingRequest != null)
            {
                try
                {
                    var bookingResult = await _promInstanceService.RequestBookingAsync(instanceId, response.BookingRequest, ct);
                    _logger.LogInformation("Booking request created from PROM {InstanceId}", instanceId);
                }
                catch (Exception bookingEx)
                {
                    _logger.LogError(bookingEx, "Failed to create booking request from PROM {InstanceId}", instanceId);
                    // Don't fail the PROM submission if booking fails
                }
            }
            
            _logger.LogInformation("PROM instance {InstanceId} completed", instanceId);
            
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting PROM response");
            return StatusCode(500, new { error = "Failed to submit response" });
        }
    }

    /// <summary>
    /// Send a reminder for a pending PROM
    /// </summary>
    [HttpPost("{instanceId}/reminder")]
    public async Task<ActionResult> SendReminder(
        Guid instanceId,
        CancellationToken ct = default)
    {
        var success = await _promInstanceService.ReminderPromAsync(instanceId, ct);
        
        if (!success)
        {
            return BadRequest(new { error = "Cannot send reminder for this PROM" });
        }
        
        return Ok(new { message = "Reminder sent successfully" });
    }

    /// <summary>
    /// Get pending PROMs, optionally filtered by due date
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<List<PromInstanceDto>>> GetPendingProms(
        [FromQuery] DateTime? dueBefore = null,
        CancellationToken ct = default)
    {
        var instances = await _promInstanceService.GetPendingPromsAsync(dueBefore, ct);
        return Ok(instances);
    }

    /// <summary>
    /// Get PROM statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<PromInstanceStats>> GetPromStats(
        [FromQuery] Guid? templateId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        CancellationToken ct = default)
    {
        var stats = await _promInstanceService.GetPromStatsAsync(templateId, startDate, endDate, ct);
        return Ok(stats);
    }

    /// <summary>
    /// Cancel a PROM instance
    /// </summary>
    [HttpPost("{instanceId}/cancel")]
    public async Task<ActionResult> CancelPromInstance(
        Guid instanceId,
        [FromBody] CancelPromRequest request,
        CancellationToken ct = default)
    {
        var success = await _promInstanceService.CancelPromInstanceAsync(
            instanceId, 
            request.Reason ?? "Cancelled by user", 
            ct);
        
        if (!success)
        {
            return NotFound(new { error = "PROM instance not found" });
        }
        
        return Ok(new { message = "PROM instance cancelled" });
    }

    /// <summary>
    /// Request a booking appointment from a PROM instance
    /// </summary>
    [AllowAnonymous] // Allow patients to request bookings
    [HttpPost("{instanceId}/booking")]
    public async Task<ActionResult<BookingRequestDto>> RequestBooking(
        Guid instanceId,
        [FromBody] BookingRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _promInstanceService.RequestBookingAsync(instanceId, request, ct);
            
            _logger.LogInformation(
                "Booking request created from PROM {InstanceId} for patient {PatientId}",
                instanceId, result.PatientId);
            
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking request from PROM");
            return StatusCode(500, new { error = "Failed to request booking" });
        }
    }

    /// <summary>
    /// Preview a PROM template (returns the questions without creating an instance)
    /// </summary>
    [HttpGet("preview/{templateId}")]
    public async Task<ActionResult<PromPreviewDto>> PreviewPromTemplate(
        Guid templateId,
        CancellationToken ct = default)
    {
        // This would normally fetch from database
        // For now, return mock data based on template ID
        var preview = new PromPreviewDto
        {
            TemplateId = templateId,
            TemplateName = "PHQ-9 Depression Scale",
            Description = "Patient Health Questionnaire for Depression",
            EstimatedTimeMinutes = 5,
            QuestionCount = 9,
            Questions = new List<PromQuestionDto>
            {
                new() { 
                    Id = Guid.NewGuid(),
                    Text = "Little interest or pleasure in doing things",
                    Type = "scale",
                    Required = true,
                    Options = new[] { "Not at all", "Several days", "More than half the days", "Nearly every day" }
                },
                new() { 
                    Id = Guid.NewGuid(),
                    Text = "Feeling down, depressed, or hopeless",
                    Type = "scale",
                    Required = true,
                    Options = new[] { "Not at all", "Several days", "More than half the days", "Nearly every day" }
                },
                // Additional questions would be loaded here
            }
        };
        
        await Task.Delay(1, ct); // Simulate async
        
        return Ok(preview);
    }
}

// Additional DTOs
public class CancelPromRequest
{
    public string? Reason { get; set; }
}

public class PromPreviewDto
{
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedTimeMinutes { get; set; }
    public int QuestionCount { get; set; }
    public List<PromQuestionDto> Questions { get; set; } = new();
}

public class PromQuestionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool Required { get; set; }
    public string[]? Options { get; set; }
}
