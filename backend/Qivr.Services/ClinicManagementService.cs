using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Services;

public interface IClinicManagementService
{
    Task<IEnumerable<ClinicSummary>> GetClinicsAsync(Guid tenantId, int page = 1, int pageSize = 20);
    Task<ClinicDetail?> GetClinicDetailsAsync(Guid tenantId, Guid clinicId);
    Task<Clinic> CreateClinicAsync(Guid tenantId, CreateClinicRequest request);
    Task<bool> UpdateClinicAsync(Guid tenantId, Guid clinicId, UpdateClinicRequest request);
    Task<IEnumerable<ProviderSummary>> GetClinicProvidersAsync(Guid tenantId, Guid clinicId, bool activeOnly = true);
    Task<Qivr.Core.Entities.Provider> AddProviderToClinicAsync(Guid tenantId, Guid clinicId, CreateProviderRequest request);
    Task<ProviderDetail?> GetProviderDetailsAsync(Guid tenantId, Guid providerId);
    Task<bool> UpdateProviderAsync(Guid tenantId, Guid providerId, UpdateProviderRequest request);
    Task<bool> DeleteProviderAsync(Guid tenantId, Guid providerId);
    Task<IEnumerable<Department>> GetDepartmentsAsync(Guid tenantId, Guid clinicId);
    Task<Department> CreateDepartmentAsync(Guid tenantId, Guid clinicId, CreateDepartmentRequest request);
    Task<ClinicStatistics> GetClinicStatisticsAsync(Guid tenantId, Guid clinicId);
}

public class ClinicManagementService : IClinicManagementService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<ClinicManagementService> _logger;

    public ClinicManagementService(QivrDbContext context, ILogger<ClinicManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ClinicSummary>> GetClinicsAsync(Guid tenantId, int page = 1, int pageSize = 20)
    {
        var query = _context.Clinics
            .Where(c => c.TenantId == tenantId);

        var totalCount = await query.CountAsync();

        var clinics = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var summaries = new List<ClinicSummary>();

        foreach (var clinic in clinics)
        {
            // Get counts for each clinic
            var patientCount = await _context.Users
                .CountAsync(u => u.TenantId == tenantId && u.UserType == UserType.Patient);

            var providerCount = await _context.Providers
                .CountAsync(p => p.TenantId == tenantId && p.ClinicId == clinic.Id && p.IsActive);

            var todayStart = DateTime.UtcNow.Date;
            var todayEnd = todayStart.AddDays(1);

            var appointmentsToday = await _context.Appointments
                .CountAsync(a => a.TenantId == tenantId && 
                               a.ClinicId == clinic.Id &&
                               a.ScheduledStart >= todayStart && 
                               a.ScheduledStart < todayEnd &&
                               a.Status != AppointmentStatus.Cancelled);

            var pendingPROMs = await _context.PromInstances
                .CountAsync(p => p.TenantId == tenantId &&
                               p.Status == PromStatus.Pending);

            summaries.Add(new ClinicSummary
            {
                Id = clinic.Id,
                Name = clinic.Name,
                Address = FormatAddress(clinic),
                Phone = clinic.Phone ?? "",
                Email = clinic.Email ?? "",
                IsActive = clinic.IsActive,
                PatientCount = patientCount,
                ProviderCount = providerCount,
                AppointmentsToday = appointmentsToday,
                PendingPROMs = pendingPROMs,
                TotalCount = totalCount
            });
        }

        return summaries;
    }

    public async Task<ClinicDetail?> GetClinicDetailsAsync(Guid tenantId, Guid clinicId)
    {
        var clinic = await _context.Clinics
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == clinicId);

        if (clinic == null)
            return null;

        // Get statistics
        var stats = await GetClinicStatisticsAsync(tenantId, clinicId);

        // Parse operating hours from metadata
        var operatingHours = GetOperatingHours(clinic.Metadata);

        // Parse services and insurance from metadata
        var services = GetServices(clinic.Metadata);
        var acceptedInsurance = GetAcceptedInsurance(clinic.Metadata);

        return new ClinicDetail
        {
            Id = clinic.Id,
            Name = clinic.Name,
            Description = clinic.Description ?? "",
            Address = new ClinicAddress
            {
                Street = clinic.Address ?? "",
                City = clinic.City ?? "",
                State = clinic.State ?? "",
                PostalCode = clinic.ZipCode ?? "",
                Country = clinic.Country ?? "USA"
            },
            Phone = clinic.Phone ?? "",
            Fax = GetFromMetadata(clinic.Metadata, "fax") ?? "",
            Email = clinic.Email ?? "",
            Website = GetFromMetadata(clinic.Metadata, "website") ?? "",
            IsActive = clinic.IsActive,
            EstablishedDate = clinic.CreatedAt,
            LicenseNumber = GetFromMetadata(clinic.Metadata, "licenseNumber") ?? "",
            TaxId = GetFromMetadata(clinic.Metadata, "taxId") ?? "",
            OperatingHours = operatingHours,
            Services = services,
            AcceptedInsurance = acceptedInsurance,
            Statistics = stats
        };
    }

    public async Task<Clinic> CreateClinicAsync(Guid tenantId, CreateClinicRequest request)
    {
        var clinic = new Clinic
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            Address = request.Street,
            City = request.City,
            State = request.State,
            ZipCode = request.PostalCode,
            Country = request.Country ?? "USA",
            Phone = request.Phone,
            Email = request.Email,
            IsActive = true,
            Metadata = new Dictionary<string, object>
            {
                ["fax"] = request.Fax ?? "",
                ["website"] = request.Website ?? "",
                ["licenseNumber"] = request.LicenseNumber ?? "",
                ["taxId"] = request.TaxId ?? "",
                ["services"] = request.Services ?? Array.Empty<string>(),
                ["acceptedInsurance"] = request.AcceptedInsurance ?? Array.Empty<string>(),
                ["operatingHours"] = request.OperatingHours ?? new Dictionary<string, object>()
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clinics.Add(clinic);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created clinic {ClinicId} in tenant {TenantId}", clinic.Id, tenantId);

        return clinic;
    }

    public async Task<bool> UpdateClinicAsync(Guid tenantId, Guid clinicId, UpdateClinicRequest request)
    {
        var clinic = await _context.Clinics
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == clinicId);

        if (clinic == null)
            return false;

        // Update basic fields
        if (!string.IsNullOrEmpty(request.Name))
            clinic.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Description))
            clinic.Description = request.Description;

        if (!string.IsNullOrEmpty(request.Phone))
            clinic.Phone = request.Phone;

        if (!string.IsNullOrEmpty(request.Email))
            clinic.Email = request.Email;

        if (!string.IsNullOrEmpty(request.Street))
            clinic.Address = request.Street;

        if (!string.IsNullOrEmpty(request.City))
            clinic.City = request.City;

        if (!string.IsNullOrEmpty(request.State))
            clinic.State = request.State;

        if (!string.IsNullOrEmpty(request.PostalCode))
            clinic.ZipCode = request.PostalCode;

        // Update metadata
        if (request.Fax != null)
            clinic.Metadata["fax"] = request.Fax;

        if (request.Website != null)
            clinic.Metadata["website"] = request.Website;

        if (request.Services != null)
            clinic.Metadata["services"] = request.Services;

        if (request.AcceptedInsurance != null)
            clinic.Metadata["acceptedInsurance"] = request.AcceptedInsurance;

        if (request.OperatingHours != null)
            clinic.Metadata["operatingHours"] = request.OperatingHours;

        clinic.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated clinic {ClinicId} in tenant {TenantId}", clinicId, tenantId);

        return true;
    }

    public async Task<IEnumerable<ProviderSummary>> GetClinicProvidersAsync(Guid tenantId, Guid clinicId, bool activeOnly = true)
    {
        var query = _context.Providers
            .Include(p => p.User)
            .Where(p => p.TenantId == tenantId && p.ClinicId == clinicId);

        if (activeOnly)
            query = query.Where(p => p.IsActive);

        var providers = await query.ToListAsync();

        var summaries = new List<ProviderSummary>();

        foreach (var provider in providers)
        {
            // Get patient count for provider
            var patientCount = await _context.Appointments
                .Where(a => a.ProviderId == provider.UserId)
                .Select(a => a.PatientId)
                .Distinct()
                .CountAsync();

            // Get today's appointments
            var todayStart = DateTime.UtcNow.Date;
            var todayEnd = todayStart.AddDays(1);

            var appointmentsToday = await _context.Appointments
                .CountAsync(a => a.ProviderId == provider.UserId &&
                               a.ScheduledStart >= todayStart && 
                               a.ScheduledStart < todayEnd &&
                               a.Status != AppointmentStatus.Cancelled);

            // Get next available slot (simplified - just find next free hour)
            var nextSlot = await GetNextAvailableSlot(provider.UserId);

            summaries.Add(new ProviderSummary
            {
                Id = provider.UserId,
                FirstName = provider.User?.FirstName ?? "",
                LastName = provider.User?.LastName ?? "",
                Title = provider.Title ?? "",
                Specialty = provider.Specialty ?? "",
                Email = provider.User?.Email ?? "",
                Phone = provider.User?.Phone ?? "",
                LicenseNumber = provider.LicenseNumber ?? "",
                NpiNumber = provider.NpiNumber ?? "",
                IsActive = provider.IsActive,
                PatientCount = patientCount,
                AppointmentsToday = appointmentsToday,
                NextAvailableSlot = nextSlot
            });
        }

        return summaries.OrderBy(p => p.LastName).ThenBy(p => p.FirstName);
    }

    public async Task<Qivr.Core.Entities.Provider> AddProviderToClinicAsync(Guid tenantId, Guid clinicId, CreateProviderRequest request)
    {
        // First, create or find the user
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.TenantId == tenantId);

        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CognitoSub = $"provider-{Guid.NewGuid()}", // Generate unique CognitoSub for providers
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Phone = request.Phone,
                UserType = UserType.Staff,
                Roles = new List<string> { "Provider" },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
        }

        // Check if provider already exists
        var existingProvider = await _context.Providers
            .FirstOrDefaultAsync(p => p.UserId == user.Id && p.TenantId == tenantId);

        if (existingProvider != null)
        {
            // Update clinic association
            existingProvider.ClinicId = clinicId;
            existingProvider.IsActive = true;
            existingProvider.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return existingProvider;
        }

        // Create new provider
        var provider = new Qivr.Core.Entities.Provider
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = user.Id,
            ClinicId = clinicId,
            Title = request.Title,
            Specialty = request.Specialty,
            LicenseNumber = request.LicenseNumber,
            NpiNumber = request.NpiNumber,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Providers.Add(provider);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Added provider {ProviderId} to clinic {ClinicId}", provider.Id, clinicId);

        return provider;
    }

    public async Task<ProviderDetail?> GetProviderDetailsAsync(Guid tenantId, Guid providerId)
    {
        var provider = await _context.Providers
            .Include(p => p.User)
            .Include(p => p.Clinic)
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.UserId == providerId);

        if (provider == null || provider.User == null)
            return null;

        // Get statistics
        var patientCount = await _context.Appointments
            .Where(a => a.ProviderId == providerId)
            .Select(a => a.PatientId)
            .Distinct()
            .CountAsync();

        var totalAppointments = await _context.Appointments
            .CountAsync(a => a.ProviderId == providerId);

        var completedAppointments = await _context.Appointments
            .CountAsync(a => a.ProviderId == providerId && a.Status == AppointmentStatus.Completed);

        // Get average rating - TODO: Implement rating system when evaluation ratings are available
        var averageRating = 0m;

        // Get schedule from metadata
        var schedule = GetSchedule(provider.User.Preferences);

        return new ProviderDetail
        {
            Id = provider.UserId,
            FirstName = provider.User.FirstName ?? "",
            LastName = provider.User.LastName ?? "",
            Title = provider.Title ?? "",
            Specialty = provider.Specialty ?? "",
            Email = provider.User.Email,
            Phone = provider.User.Phone ?? "",
            LicenseNumber = provider.LicenseNumber ?? "",
            NpiNumber = provider.NpiNumber ?? "",
            IsActive = provider.IsActive,
            ClinicId = provider.ClinicId,
            ClinicName = provider.Clinic?.Name ?? "",
            Biography = GetFromUserPreferences(provider.User.Preferences, "biography") ?? "",
            Education = GetEducation(provider.User.Preferences),
            Certifications = GetCertifications(provider.User.Preferences),
            Languages = GetLanguages(provider.User.Preferences),
            Schedule = schedule,
            Statistics = new ProviderStatistics
            {
                TotalPatients = patientCount,
                TotalAppointments = totalAppointments,
                CompletedAppointments = completedAppointments,
                AverageRating = averageRating,
                YearsOfExperience = GetYearsOfExperience(provider.User.Preferences)
            }
        };
    }

    public async Task<bool> UpdateProviderAsync(Guid tenantId, Guid providerId, UpdateProviderRequest request)
    {
        var provider = await _context.Providers
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.UserId == providerId);

        if (provider == null || provider.User == null)
            return false;

        // Update provider fields
        if (!string.IsNullOrEmpty(request.Title))
            provider.Title = request.Title;

        if (!string.IsNullOrEmpty(request.Specialty))
            provider.Specialty = request.Specialty;

        if (!string.IsNullOrEmpty(request.LicenseNumber))
            provider.LicenseNumber = request.LicenseNumber;

        if (!string.IsNullOrEmpty(request.NpiNumber))
            provider.NpiNumber = request.NpiNumber;

        if (request.IsActive.HasValue)
            provider.IsActive = request.IsActive.Value;

        // Update user fields
        if (!string.IsNullOrEmpty(request.FirstName))
            provider.User.FirstName = request.FirstName;

        if (!string.IsNullOrEmpty(request.LastName))
            provider.User.LastName = request.LastName;

        if (!string.IsNullOrEmpty(request.Email))
            provider.User.Email = request.Email;

        if (!string.IsNullOrEmpty(request.Phone))
            provider.User.Phone = request.Phone;

        // Update preferences
        if (!string.IsNullOrEmpty(request.Biography))
            provider.User.Preferences["biography"] = request.Biography;

        if (request.Education != null)
            provider.User.Preferences["education"] = JsonSerializer.Serialize(request.Education);

        if (request.Certifications != null)
            provider.User.Preferences["certifications"] = JsonSerializer.Serialize(request.Certifications);

        if (request.Languages != null)
            provider.User.Preferences["languages"] = JsonSerializer.Serialize(request.Languages);

        provider.UpdatedAt = DateTime.UtcNow;
        provider.User.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated provider {ProviderId} in tenant {TenantId}", providerId, tenantId);

        return true;
    }

    public async Task<bool> DeleteProviderAsync(Guid tenantId, Guid providerId)
    {
        var provider = await _context.Providers
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == providerId && p.TenantId == tenantId);

        if (provider == null)
        {
            return false;
        }

        // Soft delete - mark as inactive instead of hard delete to preserve data integrity
        provider.IsActive = false;
        provider.UpdatedAt = DateTime.UtcNow;
        
        if (provider.User != null)
        {
            provider.User.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted (deactivated) provider {ProviderId} in tenant {TenantId}", providerId, tenantId);

        return true;
    }

    public async Task<IEnumerable<Department>> GetDepartmentsAsync(Guid tenantId, Guid clinicId)
    {
        // Since we don't have a dedicated Department table, we'll extract from clinic metadata
        var clinic = await _context.Clinics
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == clinicId);

        if (clinic == null)
            return new List<Department>();

        var departmentsJson = GetFromMetadata(clinic.Metadata, "departments");
        if (string.IsNullOrEmpty(departmentsJson))
            return GetDefaultDepartments(clinicId);

        try
        {
            var departments = JsonSerializer.Deserialize<List<Department>>(departmentsJson);
            return departments ?? GetDefaultDepartments(clinicId);
        }
        catch
        {
            return GetDefaultDepartments(clinicId);
        }
    }

    public async Task<Department> CreateDepartmentAsync(Guid tenantId, Guid clinicId, CreateDepartmentRequest request)
    {
        var clinic = await _context.Clinics
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Id == clinicId);

        if (clinic == null)
            throw new InvalidOperationException($"Clinic {clinicId} not found");

        var departments = (await GetDepartmentsAsync(tenantId, clinicId)).ToList();

        var newDepartment = new Department
        {
            Id = Guid.NewGuid(),
            ClinicId = clinicId,
            Name = request.Name,
            Description = request.Description ?? "",
            HeadProviderId = request.HeadProviderId,
            IsActive = true
        };

        departments.Add(newDepartment);

        clinic.Metadata["departments"] = JsonSerializer.Serialize(departments);
        clinic.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Created department {DepartmentId} in clinic {ClinicId}", newDepartment.Id, clinicId);

        return newDepartment;
    }

    public async Task<ClinicStatistics> GetClinicStatisticsAsync(Guid tenantId, Guid clinicId)
    {
        var totalPatients = await _context.Users
            .CountAsync(u => u.TenantId == tenantId && u.UserType == UserType.Patient);

        var activePatients = await _context.Appointments
            .Where(a => a.TenantId == tenantId && a.ClinicId == clinicId)
            .Where(a => a.ScheduledStart >= DateTime.UtcNow.AddMonths(-6))
            .Select(a => a.PatientId)
            .Distinct()
            .CountAsync();

        var totalProviders = await _context.Providers
            .CountAsync(p => p.TenantId == tenantId && p.ClinicId == clinicId);

        var totalStaff = await _context.Users
            .CountAsync(u => u.TenantId == tenantId && u.UserType == UserType.Staff);

        var thisMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart;

        var appointmentsThisMonth = await _context.Appointments
            .CountAsync(a => a.TenantId == tenantId && 
                           a.ClinicId == clinicId &&
                           a.ScheduledStart >= thisMonthStart);

        var appointmentsLastMonth = await _context.Appointments
            .CountAsync(a => a.TenantId == tenantId && 
                           a.ClinicId == clinicId &&
                           a.ScheduledStart >= lastMonthStart && 
                           a.ScheduledStart < lastMonthEnd);

        // Average satisfaction - TODO: Implement rating system
        var avgSatisfaction = 0m;

        var completedPromsThisMonth = await _context.PromInstances
            .CountAsync(p => p.TenantId == tenantId &&
                           p.Status == PromStatus.Completed &&
                           p.CompletedAt >= thisMonthStart);

        var pendingProms = await _context.PromInstances
            .CountAsync(p => p.TenantId == tenantId &&
                           p.Status == PromStatus.Pending);

        return new ClinicStatistics
        {
            TotalPatients = totalPatients,
            ActivePatients = activePatients,
            TotalProviders = totalProviders,
            TotalStaff = totalStaff,
            AppointmentsThisMonth = appointmentsThisMonth,
            AppointmentsLastMonth = appointmentsLastMonth,
            AveragePatientSatisfaction = avgSatisfaction,
            CompletedPromsThisMonth = completedPromsThisMonth,
            PendingProms = pendingProms
        };
    }

    // Helper methods
    private string FormatAddress(Clinic clinic)
    {
        var parts = new List<string>();
        
        if (!string.IsNullOrEmpty(clinic.Address))
            parts.Add(clinic.Address);
        
        if (!string.IsNullOrEmpty(clinic.City))
            parts.Add(clinic.City);
        
        if (!string.IsNullOrEmpty(clinic.State))
            parts.Add(clinic.State);
        
        if (!string.IsNullOrEmpty(clinic.ZipCode))
            parts.Add(clinic.ZipCode);

        return string.Join(", ", parts);
    }

    private string? GetFromMetadata(Dictionary<string, object>? metadata, string key)
    {
        if (metadata == null || !metadata.ContainsKey(key))
            return null;

        return metadata[key]?.ToString();
    }

    private string? GetFromUserPreferences(Dictionary<string, object>? preferences, string key)
    {
        if (preferences == null || !preferences.ContainsKey(key))
            return null;

        return preferences[key]?.ToString();
    }

    private List<OperatingHours> GetOperatingHours(Dictionary<string, object>? metadata)
    {
        var hoursJson = GetFromMetadata(metadata, "operatingHours");
        if (string.IsNullOrEmpty(hoursJson))
            return GetDefaultOperatingHours();

        try
        {
            var hours = JsonSerializer.Deserialize<List<OperatingHours>>(hoursJson);
            return hours ?? GetDefaultOperatingHours();
        }
        catch
        {
            return GetDefaultOperatingHours();
        }
    }

    private List<OperatingHours> GetDefaultOperatingHours()
    {
        return new List<OperatingHours>
        {
            new() { Day = "Monday", Open = "08:00", Close = "18:00" },
            new() { Day = "Tuesday", Open = "08:00", Close = "18:00" },
            new() { Day = "Wednesday", Open = "08:00", Close = "18:00" },
            new() { Day = "Thursday", Open = "08:00", Close = "18:00" },
            new() { Day = "Friday", Open = "08:00", Close = "17:00" },
            new() { Day = "Saturday", Open = "09:00", Close = "13:00" }
        };
    }

    private string[] GetServices(Dictionary<string, object>? metadata)
    {
        var servicesJson = GetFromMetadata(metadata, "services");
        if (string.IsNullOrEmpty(servicesJson))
            return new[] { "Primary Care", "General Practice" };

        try
        {
            var services = JsonSerializer.Deserialize<string[]>(servicesJson);
            return services ?? new[] { "Primary Care", "General Practice" };
        }
        catch
        {
            return new[] { "Primary Care", "General Practice" };
        }
    }

    private string[] GetAcceptedInsurance(Dictionary<string, object>? metadata)
    {
        var insuranceJson = GetFromMetadata(metadata, "acceptedInsurance");
        if (string.IsNullOrEmpty(insuranceJson))
            return new[] { "Most major insurance accepted" };

        try
        {
            var insurance = JsonSerializer.Deserialize<string[]>(insuranceJson);
            return insurance ?? new[] { "Most major insurance accepted" };
        }
        catch
        {
            return new[] { "Most major insurance accepted" };
        }
    }

    private async Task<DateTime?> GetNextAvailableSlot(Guid providerId)
    {
        // Simplified logic - find next hour without an appointment
        var now = DateTime.UtcNow;
        var searchEnd = now.AddDays(30);
        
        var appointments = await _context.Appointments
            .Where(a => a.ProviderId == providerId &&
                       a.ScheduledStart >= now &&
                       a.ScheduledStart <= searchEnd &&
                       a.Status != AppointmentStatus.Cancelled)
            .Select(a => a.ScheduledStart)
            .ToListAsync();

        // Start from next business hour
        var candidate = now.AddHours(1);
        candidate = new DateTime(candidate.Year, candidate.Month, candidate.Day, candidate.Hour, 0, 0);

        while (candidate < searchEnd)
        {
            // Skip weekends
            if (candidate.DayOfWeek == DayOfWeek.Sunday || candidate.DayOfWeek == DayOfWeek.Saturday)
            {
                candidate = candidate.AddDays(1);
                candidate = new DateTime(candidate.Year, candidate.Month, candidate.Day, 8, 0, 0);
                continue;
            }

            // Skip non-business hours
            if (candidate.Hour < 8 || candidate.Hour >= 17)
            {
                if (candidate.Hour >= 17)
                {
                    candidate = candidate.AddDays(1);
                    candidate = new DateTime(candidate.Year, candidate.Month, candidate.Day, 8, 0, 0);
                }
                else
                {
                    candidate = new DateTime(candidate.Year, candidate.Month, candidate.Day, 8, 0, 0);
                }
                continue;
            }

            // Check if slot is available
            if (!appointments.Any(a => Math.Abs((a - candidate).TotalMinutes) < 60))
            {
                return candidate;
            }

            candidate = candidate.AddHours(1);
        }

        return null;
    }

    private List<string> GetEducation(Dictionary<string, object>? preferences)
    {
        var eduJson = GetFromUserPreferences(preferences, "education");
        if (string.IsNullOrEmpty(eduJson))
            return new List<string>();

        try
        {
            var education = JsonSerializer.Deserialize<List<string>>(eduJson);
            return education ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private List<string> GetCertifications(Dictionary<string, object>? preferences)
    {
        var certJson = GetFromUserPreferences(preferences, "certifications");
        if (string.IsNullOrEmpty(certJson))
            return new List<string>();

        try
        {
            var certs = JsonSerializer.Deserialize<List<string>>(certJson);
            return certs ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private List<string> GetLanguages(Dictionary<string, object>? preferences)
    {
        var langJson = GetFromUserPreferences(preferences, "languages");
        if (string.IsNullOrEmpty(langJson))
            return new List<string> { "English" };

        try
        {
            var languages = JsonSerializer.Deserialize<List<string>>(langJson);
            return languages ?? new List<string> { "English" };
        }
        catch
        {
            return new List<string> { "English" };
        }
    }

    private Dictionary<string, List<TimeSlot>> GetSchedule(Dictionary<string, object>? preferences)
    {
        var scheduleJson = GetFromUserPreferences(preferences, "schedule");
        if (string.IsNullOrEmpty(scheduleJson))
            return GetDefaultSchedule();

        try
        {
            var schedule = JsonSerializer.Deserialize<Dictionary<string, List<TimeSlot>>>(scheduleJson);
            return schedule ?? GetDefaultSchedule();
        }
        catch
        {
            return GetDefaultSchedule();
        }
    }

    private Dictionary<string, List<TimeSlot>> GetDefaultSchedule()
    {
        return new Dictionary<string, List<TimeSlot>>
        {
            ["Monday"] = new List<TimeSlot> { new() { Start = "08:00", End = "17:00" } },
            ["Tuesday"] = new List<TimeSlot> { new() { Start = "08:00", End = "17:00" } },
            ["Wednesday"] = new List<TimeSlot> { new() { Start = "08:00", End = "17:00" } },
            ["Thursday"] = new List<TimeSlot> { new() { Start = "08:00", End = "17:00" } },
            ["Friday"] = new List<TimeSlot> { new() { Start = "08:00", End = "16:00" } }
        };
    }

    private int GetYearsOfExperience(Dictionary<string, object>? preferences)
    {
        var yearsStr = GetFromUserPreferences(preferences, "yearsOfExperience");
        if (string.IsNullOrEmpty(yearsStr))
            return 0;

        if (int.TryParse(yearsStr, out var years))
            return years;

        return 0;
    }

    private List<Department> GetDefaultDepartments(Guid clinicId)
    {
        return new List<Department>
        {
            new() { Id = Guid.NewGuid(), ClinicId = clinicId, Name = "General Practice", Description = "Primary care services", IsActive = true },
            new() { Id = Guid.NewGuid(), ClinicId = clinicId, Name = "Nursing", Description = "Nursing services", IsActive = true }
        };
    }
}

// Data models for the service
public class ClinicSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int PatientCount { get; set; }
    public int ProviderCount { get; set; }
    public int AppointmentsToday { get; set; }
    public int PendingPROMs { get; set; }
    public int TotalCount { get; set; }
}

public class ClinicDetail
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ClinicAddress Address { get; set; } = new();
    public string Phone { get; set; } = string.Empty;
    public string Fax { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime EstablishedDate { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public List<OperatingHours> OperatingHours { get; set; } = new();
    public string[] Services { get; set; } = Array.Empty<string>();
    public string[] AcceptedInsurance { get; set; } = Array.Empty<string>();
    public ClinicStatistics Statistics { get; set; } = new();
}

public class ClinicAddress
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

public class OperatingHours
{
    public string Day { get; set; } = string.Empty;
    public string Open { get; set; } = string.Empty;
    public string Close { get; set; } = string.Empty;
}

public class ClinicStatistics
{
    public int TotalPatients { get; set; }
    public int ActivePatients { get; set; }
    public int TotalProviders { get; set; }
    public int TotalStaff { get; set; }
    public int AppointmentsThisMonth { get; set; }
    public int AppointmentsLastMonth { get; set; }
    public decimal AveragePatientSatisfaction { get; set; }
    public int CompletedPromsThisMonth { get; set; }
    public int PendingProms { get; set; }
}

public class ProviderSummary
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string NpiNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int PatientCount { get; set; }
    public int AppointmentsToday { get; set; }
    public DateTime? NextAvailableSlot { get; set; }
}

public class ProviderDetail
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string NpiNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid ClinicId { get; set; }
    public string ClinicName { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public List<string> Education { get; set; } = new();
    public List<string> Certifications { get; set; } = new();
    public List<string> Languages { get; set; } = new();
    public Dictionary<string, List<TimeSlot>> Schedule { get; set; } = new();
    public ProviderStatistics Statistics { get; set; } = new();
}

public class ProviderStatistics
{
    public int TotalPatients { get; set; }
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public decimal AverageRating { get; set; }
    public int YearsOfExperience { get; set; }
}

public class TimeSlot
{
    public string Start { get; set; } = string.Empty;
    public string End { get; set; } = string.Empty;
}

public class Department
{
    public Guid Id { get; set; }
    public Guid ClinicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid? HeadProviderId { get; set; }
    public bool IsActive { get; set; }
}

// Request DTOs
public class CreateClinicRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Fax { get; set; }
    public string? Website { get; set; }
    public string? LicenseNumber { get; set; }
    public string? TaxId { get; set; }
    public string[]? Services { get; set; }
    public string[]? AcceptedInsurance { get; set; }
    public Dictionary<string, object>? OperatingHours { get; set; }
}

public class UpdateClinicRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Fax { get; set; }
    public string? Website { get; set; }
    public string[]? Services { get; set; }
    public string[]? AcceptedInsurance { get; set; }
    public Dictionary<string, object>? OperatingHours { get; set; }
}

public class CreateProviderRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Title { get; set; }
    public string? Specialty { get; set; }
    public string? LicenseNumber { get; set; }
    public string? NpiNumber { get; set; }
}

public class UpdateProviderRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Title { get; set; }
    public string? Specialty { get; set; }
    public string? LicenseNumber { get; set; }
    public string? NpiNumber { get; set; }
    public bool? IsActive { get; set; }
    public string? Biography { get; set; }
    public List<string>? Education { get; set; }
    public List<string>? Certifications { get; set; }
    public List<string>? Languages { get; set; }
}

public class CreateDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? HeadProviderId { get; set; }
}