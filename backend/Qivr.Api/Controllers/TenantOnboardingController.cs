using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using Qivr.Core.Entities;
using System.ComponentModel.DataAnnotations;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/tenant-onboarding")]
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
    [EnableRateLimiting("auth")]
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

            // Generate and validate slug uniqueness
            var slug = GenerateSlug(request.ClinicName);
            var slugExists = await _context.Tenants.AnyAsync(t => t.Slug == slug);
            if (slugExists)
            {
                // Append a unique suffix to make it unique
                slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
            }

            // Create tenant
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = request.ClinicName,
                Slug = slug,
                Settings = new Dictionary<string, object>
                {
                    ["features"] = new[] { "appointments", "analytics", "messaging" },
                    ["subscription"] = "trial",
                    ["maxUsers"] = 10
                },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Phase 4.1: Set clinic properties directly on tenant
            tenant.Description = request.ClinicName;
            tenant.Email = request.Email;
            tenant.Phone = request.Phone;
            tenant.Address = request.Address;
            tenant.City = request.City;
            tenant.State = request.State;
            tenant.ZipCode = request.ZipCode;
            tenant.Country = request.Country ?? "Australia";
            tenant.IsActive = true;

            await _context.Tenants.AddAsync(tenant);

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
                clinicId = tenant.Id.ToString(), // Phase 4.1: clinicId = tenantId
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
        if (string.IsNullOrWhiteSpace(name))
            return $"clinic-{Guid.NewGuid().ToString("N")[..8]}";

        var slug = name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("'", "")
            .Replace("\"", "");

        // Keep only alphanumeric and hyphens
        slug = new string(slug.Where(c => char.IsLetterOrDigit(c) || c == '-').ToArray());

        // Remove consecutive hyphens and trim hyphens from ends
        while (slug.Contains("--"))
            slug = slug.Replace("--", "-");
        slug = slug.Trim('-');

        // Ensure minimum length and valid format
        if (string.IsNullOrEmpty(slug) || slug.Length < 3)
            slug = $"clinic-{Guid.NewGuid().ToString("N")[..8]}";

        // Max length 50 for URLs
        if (slug.Length > 50)
            slug = slug[..50].TrimEnd('-');

        return slug;
    }

    public class ClinicRegistrationRequest
    {
        public string CognitoSub { get; set; } = string.Empty;

        [Required(ErrorMessage = "Clinic name is required")]
        [MaxLength(200, ErrorMessage = "Clinic name cannot exceed 200 characters")]
        public string ClinicName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(254, ErrorMessage = "Email cannot exceed 254 characters")]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [MaxLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [MaxLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
        public string Address { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters")]
        public string City { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "State cannot exceed 100 characters")]
        public string State { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Zip code cannot exceed 20 characters")]
        public string ZipCode { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Country cannot exceed 100 characters")]
        public string? Country { get; set; }
    }
}
