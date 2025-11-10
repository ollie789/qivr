using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientInvitationsController : ControllerBase
{
    private readonly IPatientInvitationService _invitationService;

    public PatientInvitationsController(IPatientInvitationService invitationService)
    {
        _invitationService = invitationService;
    }

    [HttpPost("invite")]
    public async Task<IActionResult> InvitePatient([FromBody] InvitePatientRequest request)
    {
        var tenantId = GetTenantId(); // From your existing tenant middleware
        
        var invitationToken = await _invitationService.CreatePatientInvitationAsync(
            tenantId, 
            request.Email, 
            request.FirstName, 
            request.LastName
        );

        var invitationUrl = $"https://app.qivr.pro/register?token={invitationToken}";
        
        return Ok(new { InvitationUrl = invitationUrl, Token = invitationToken });
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientRequest request)
    {
        try
        {
            var patient = await _invitationService.RegisterPatientFromInvitationAsync(
                request.InvitationToken, 
                request.Password
            );

            return Ok(new { 
                Message = "Patient registered successfully",
                PatientId = patient.Id,
                TenantId = patient.TenantId
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    private Guid GetTenantId()
    {
        // This should use your existing tenant resolution logic
        var tenantIdClaim = HttpContext.Items["TenantId"]?.ToString();
        return Guid.Parse(tenantIdClaim ?? throw new InvalidOperationException("Tenant context required"));
    }
}

public record InvitePatientRequest(string Email, string FirstName, string LastName);
public record RegisterPatientRequest(string InvitationToken, string Password);
