using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Api.Services;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/prom-instances")]
public class PromInstanceController : ControllerBase
{
    private readonly IPromInstanceService _promInstanceService;
    private readonly IResourceAuthorizationService _authorizationService;
    private readonly ILogger<PromInstanceController> _logger;

    public PromInstanceController(
        IPromInstanceService promInstanceService,
        IResourceAuthorizationService authorizationService,
        ILogger<PromInstanceController> logger)
    {
        _promInstanceService = promInstanceService;
        _authorizationService = authorizationService;
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
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { error = "Tenant context is required" });
            }

            var senderId = _authorizationService.GetCurrentUserId(User);
            request.SentBy = senderId == Guid.Empty ? "System" : senderId.ToString();

            var result = await _promInstanceService.SendPromToPatientAsync(tenantId, request, ct);
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
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { error = "Tenant context is required" });
            }

            var senderId = _authorizationService.GetCurrentUserId(User);
            request.SentBy = senderId == Guid.Empty ? "System" : senderId.ToString();

            var results = await _promInstanceService.SendPromToMultiplePatientsAsync(tenantId, request, ct);
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
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        var instance = await _promInstanceService.GetPromInstanceAsync(tenantId, instanceId, ct);

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
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant context is required" });
        }

        var instances = await _promInstanceService.GetPatientPromInstancesAsync(tenantId, patientId, null, ct);
        return Ok(instances);
    }

    /// <summary>
    /// Get PROM instances filtered by template, status, patient, or date range
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PromInstanceDto>>> GetPromInstances(
        [FromQuery] Guid? templateId = null,
        [FromQuery] string? status = null,
        [FromQuery] Guid? patientId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        CancellationToken ct = default)
    {
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant context is required" });
        }

        var instances = await _promInstanceService.GetPromInstancesAsync(tenantId, templateId, status, patientId, startDate, endDate, ct);
        return Ok(instances);
    }

    /// <summary>
    /// Submit responses for a PROM instance (patient portal endpoint)
    /// </summary>
    [AllowAnonymous] // Allow patients to submit without login
    [HttpPost("{instanceId}/submit")]
    public async Task<ActionResult<PromInstanceDto>> SubmitPromResponse(
        Guid instanceId,
        [FromBody] PromSubmissionRequest response,
        CancellationToken ct = default)
    {
        try
        {
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            response.SubmittedAt = DateTime.UtcNow;
            var result = await _promInstanceService.SubmitPromResponseAsync(tenantId, instanceId, response, ct);

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
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        var success = await _promInstanceService.ReminderPromAsync(tenantId, instanceId, ct);
        
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
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant context is required" });
        }

        var instances = await _promInstanceService.GetPendingPromsAsync(tenantId, dueBefore, ct);
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
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant context is required" });
        }

        var stats = await _promInstanceService.GetPromStatsAsync(tenantId, templateId, startDate, endDate, ct);
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
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant context is required" });
        }

        var success = await _promInstanceService.CancelPromInstanceAsync(
            tenantId,
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
            var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { error = "Tenant context is required" });
            }

            var result = await _promInstanceService.RequestBookingAsync(tenantId, instanceId, request, ct);
            
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
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant context is required" });
        }

        try
        {
            var preview = await _promInstanceService.GetPromPreviewAsync(tenantId, templateId, ct);
            return Ok(preview);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
