using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Qivr.Core.Entities;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantOnboardingController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<TenantOnboardingController> _logger;

    public TenantOnboardingController(QivrDbContext context, ILogger<TenantOnboardingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("register-clinic")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterClinic([FromBody] ClinicRegistrationRequest request)
    {
        try
        {
            // Validate Cognito user exists
            var cognitoSub = User.FindFirst("sub")?.Value ?? request.CognitoSub;
            if (string.IsNullOrEmpty(cognitoSub))
            {
                return BadRequest(new { error = "Valid authentication required" });
            }

            // Check if user already has a tenant
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub);
            if (existingUser?.TenantId != null)
            {
                return BadRequest(new { error = "User already belongs to a clinic" });
            }

            // Create tenant
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = request.ClinicName,
                Slug = GenerateSlug(request.ClinicName),
                Settings = new Dictionary<string, object>
                {
                    ["features"] = new[] { "appointments", "analytics", "messaging" },
                    ["subscription"] = "trial",
                    ["maxUsers"] = 10
                },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Tenants.AddAsync(tenant);

            // Create clinic
            var clinic = new Clinic
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Name = request.ClinicName,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                City = request.City,
                State = request.State,
                ZipCode = request.ZipCode,
                Country = request.Country ?? "Australia",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Clinics.AddAsync(clinic);

            // Create or update user
            if (existingUser == null)
            {
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    CognitoSub = cognitoSub,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    UserType = UserType.Admin,
                    TenantId = tenant.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.Users.AddAsync(user);
            }
            else
            {
                existingUser.TenantId = tenant.Id;
                existingUser.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Clinic registered: {ClinicName} with tenant {TenantId}", request.ClinicName, tenant.Id);

            return Ok(new
            {
                message = "Clinic registered successfully",
                tenantId = tenant.Id.ToString(),
                clinicId = clinic.Id.ToString(),
                redirectUrl = $"/dashboard?tenant={tenant.Id}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register clinic");
            return StatusCode(500, new { error = "Registration failed" });
        }
    }

    [HttpGet("user-tenants")]
    [Authorize]
    public async Task<IActionResult> GetUserTenants()
    {
        try
        {
            var cognitoSub = User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(cognitoSub))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.Tenant)
                .FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub);

            if (user?.Tenant == null)
            {
                return Ok(new { tenants = new object[0], needsOnboarding = true });
            }

            return Ok(new
            {
                tenants = new[]
                {
                    new
                    {
                        id = user.Tenant.Id,
                        name = user.Tenant.Name,
                        slug = user.Tenant.Slug,
                        role = user.UserType.ToString()
                    }
                },
                needsOnboarding = false,
                activeTenant = user.Tenant.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user tenants");
            return StatusCode(500, new { error = "Failed to retrieve tenants" });
        }
    }

    private string GenerateSlug(string name)
    {
        return name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Where(c => char.IsLetterOrDigit(c) || c == '-')
            .Aggregate("", (current, c) => current + c);
    }

    public class ClinicRegistrationRequest
    {
        public string CognitoSub { get; set; } = string.Empty;
        public string ClinicName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string? Country { get; set; }
    }
}
