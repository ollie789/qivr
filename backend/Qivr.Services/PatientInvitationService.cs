using Qivr.Core.Entities;
using Qivr.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IPatientInvitationService
{
    Task<string> CreatePatientInvitationAsync(Guid tenantId, string email, string firstName, string lastName);
    Task<Patient> RegisterPatientFromInvitationAsync(string invitationToken, string password);
}

public class PatientInvitationService : IPatientInvitationService
{
    private readonly QivrDbContext _context;
    private readonly ISaasTenantService _saasTenantService;

    public PatientInvitationService(QivrDbContext context, ISaasTenantService saasTenantService)
    {
        _context = context;
        _saasTenantService = saasTenantService;
    }

    public async Task<string> CreatePatientInvitationAsync(Guid tenantId, string email, string firstName, string lastName)
    {
        // Generate secure invitation token
        var invitationToken = Guid.NewGuid().ToString("N");
        
        // Create patient record in pending state
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            IsActive = false, // Pending until registration complete
            CreatedAt = DateTime.UtcNow,
            InvitationToken = invitationToken,
            InvitationExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return invitationToken;
    }

    public async Task<Patient> RegisterPatientFromInvitationAsync(string invitationToken, string password)
    {
        // Find patient by invitation token
        var patient = await _context.Patients
            .Include(p => p.Tenant)
            .FirstOrDefaultAsync(p => p.InvitationToken == invitationToken && 
                                    p.InvitationExpiresAt > DateTime.UtcNow);

        if (patient == null)
            throw new InvalidOperationException("Invalid or expired invitation token");

        // Get tenant's Cognito User Pool details
        var tenant = patient.Tenant;
        if (string.IsNullOrEmpty(tenant.CognitoUserPoolId))
            throw new InvalidOperationException("Tenant Cognito User Pool not configured");

        // Create user in tenant-specific Cognito User Pool
        await _saasTenantService.CreateUserInTenantPoolAsync(
            tenant.CognitoUserPoolId, 
            patient.Email, 
            password,
            patient.FirstName,
            patient.LastName
        );

        // Activate patient and clear invitation token
        patient.IsActive = true;
        patient.InvitationToken = null;
        patient.InvitationExpiresAt = null;
        patient.ActivatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return patient;
    }
}
