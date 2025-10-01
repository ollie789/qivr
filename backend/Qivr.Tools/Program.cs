using System.Collections;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

var exitCode = await SeedRunner.RunAsync(args);
return exitCode;

internal static class SeedRunner
{
    private const string DefaultConnectionString = "Host=localhost;Port=5432;Database=qivr;Username=qivr_user;Password=qivr_dev_password";

    public static async Task<int> RunAsync(string[] args)
    {
        try
        {
            var options = ProvisionOptions.Parse(args);
            var config = SeedConfigLoader.Load(options.ConfigPath);

            var connectionString = options.ConnectionString
                ?? config.ConnectionString
                ?? Environment.GetEnvironmentVariable("QIVR_CONNECTION_STRING")
                ?? DefaultConnectionString;

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("A database connection string is required. Use --connection or set QIVR_CONNECTION_STRING.");
            }

            var services = new ServiceCollection();
            services.AddLogging(builder => builder.AddConsole());

            services.AddDbContext<QivrDbContext>(optionsBuilder =>
                optionsBuilder
                    .UseNpgsql(connectionString)
                    .UseSnakeCaseNamingConvention());

            await using var provider = services.BuildServiceProvider();
            var logger = provider.GetRequiredService<ILoggerFactory>().CreateLogger("dev-seed");
            await using var dbContext = provider.GetRequiredService<QivrDbContext>();

            await EnsureConnectionOpenAsync(dbContext, logger);

            var report = new ProvisionReport();

            foreach (var tenant in config.Tenants)
            {
                var resolvedTenant = await ProcessTenantAsync(dbContext, tenant, options.DryRun, logger, report);
                foreach (var user in tenant.Users)
                {
                    await ProcessUserAsync(dbContext, resolvedTenant, user, options.DryRun, logger, report);
                }

                if (tenant.Clinics.Any())
                {
                    await ProcessClinicsAsync(dbContext, resolvedTenant, options.DryRun, logger, report);
                }

                if (tenant.Providers.Any())
                {
                    await ProcessProvidersAsync(dbContext, resolvedTenant, options.DryRun, logger, report);
                }

                if (tenant.Appointments.Any())
                {
                    await ProcessAppointmentsAsync(dbContext, resolvedTenant, options.DryRun, logger, report);
                }

                if (tenant.MedicalRecords != null)
                {
                    await ProcessMedicalRecordsAsync(dbContext, resolvedTenant, tenant.MedicalRecords, options.DryRun, logger);
                }

                if (tenant.PromTemplates.Any())
                {
                    await ProcessPromTemplatesAsync(dbContext, resolvedTenant, tenant.PromTemplates, options.DryRun, logger);
                }

                if (tenant.PromInstances.Any())
                {
                    await ProcessPromInstancesAsync(dbContext, resolvedTenant, tenant.PromInstances, options.DryRun, logger);
                }
            }

            if (!options.DryRun)
            {
                // Save any batched changes that have not been flushed yet
                await dbContext.SaveChangesAsync();
            }

            logger.LogInformation(
                "Provision complete. Tenants created: {CreatedTenants}, updated: {UpdatedTenants}; Users created: {CreatedUsers}, updated: {UpdatedUsers}; Clinics created: {CreatedClinics}, updated: {UpdatedClinics}; Providers created: {CreatedProviders}, updated: {UpdatedProviders}; Appointments created: {CreatedAppointments}, updated: {UpdatedAppointments}.",
                report.CreatedTenants,
                report.UpdatedTenants,
                report.CreatedUsers,
                report.UpdatedUsers,
                report.CreatedClinics,
                report.UpdatedClinics,
                report.CreatedProviders,
                report.UpdatedProviders,
                report.CreatedAppointments,
                report.UpdatedAppointments);

            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            return 1;
        }
    }

    private static async Task<SeedTenant> ProcessTenantAsync(QivrDbContext dbContext, SeedTenant tenantSeed, bool dryRun, ILogger logger, ProvisionReport report)
    {
        await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

        var existingTenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .AsTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantSeed.Id);

        if (existingTenant == null)
        {
            existingTenant = await dbContext.Tenants
                .IgnoreQueryFilters()
                .AsTracking()
                .FirstOrDefaultAsync(t => t.Slug == tenantSeed.Slug);
            if (existingTenant != null)
            {
                logger.LogInformation("Found existing tenant {TenantSlug} with id {TenantId}; updating seed definition", tenantSeed.Slug, existingTenant.Id);
                tenantSeed.Id = existingTenant.Id;
                await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);
            }
        }

        if (existingTenant == null)
        {
            logger.LogInformation("{Prefix}Creating tenant {TenantName} ({TenantId})",
                dryRun ? "[dry-run] " : string.Empty,
                tenantSeed.Name,
                tenantSeed.Id);

            report.CreatedTenants++;

            if (dryRun)
            {
                return tenantSeed;
            }

            existingTenant = new Tenant
            {
                Id = tenantSeed.Id,
                Name = tenantSeed.Name,
                Slug = tenantSeed.Slug,
                Status = tenantSeed.Status,
                Plan = tenantSeed.Plan,
                Timezone = tenantSeed.Timezone,
                Locale = tenantSeed.Locale,
                Settings = tenantSeed.Settings ?? new Dictionary<string, object>(),
                Metadata = tenantSeed.Metadata ?? new Dictionary<string, object>()
            };

            dbContext.Tenants.Add(existingTenant);
            await dbContext.SaveChangesAsync();
            return tenantSeed;
        }

        var updated = false;

        updated |= UpdateIfChanged(existingTenant, t => t.Name, tenantSeed.Name, v => existingTenant.Name = v, !dryRun);
        updated |= UpdateIfChanged(existingTenant, t => t.Slug, tenantSeed.Slug, v => existingTenant.Slug = v, !dryRun);
        updated |= UpdateIfChanged(existingTenant, t => t.Plan, tenantSeed.Plan, v => existingTenant.Plan = v, !dryRun);
        updated |= UpdateIfChanged(existingTenant, t => t.Status, tenantSeed.Status, v => existingTenant.Status = v, !dryRun);
        updated |= UpdateIfChanged(existingTenant, t => t.Timezone, tenantSeed.Timezone, v => existingTenant.Timezone = v, !dryRun);
        updated |= UpdateIfChanged(existingTenant, t => t.Locale, tenantSeed.Locale, v => existingTenant.Locale = v, !dryRun);

        if (updated)
        {
            report.UpdatedTenants++;
            if (dryRun)
            {
                logger.LogInformation("[dry-run] Would persist tenant updates for {TenantId}", tenantSeed.Id);
                dbContext.Entry(existingTenant).State = EntityState.Unchanged;
            }
            else
            {
                await dbContext.SaveChangesAsync();
                logger.LogInformation("Updated tenant {TenantId}", tenantSeed.Id);
            }
        }
        else
        {
            logger.LogDebug("Tenant {TenantId} already up to date", tenantSeed.Id);
        }

        tenantSeed.Id = existingTenant.Id;

        return tenantSeed;
    }

    private static async Task ProcessUserAsync(QivrDbContext dbContext, SeedTenant tenantSeed, SeedUser userSeed, bool dryRun, ILogger logger, ProvisionReport report)
    {
        await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

        var existingUser = await dbContext.Users
            .IgnoreQueryFilters()
            .AsTracking()
            .FirstOrDefaultAsync(u => u.Email == userSeed.Email);

        if (existingUser == null)
        {
            logger.LogInformation("{Prefix}Creating user {Email} ({UserType}) for tenant {TenantId}",
                dryRun ? "[dry-run] " : string.Empty,
                userSeed.Email,
                userSeed.UserType,
                tenantSeed.Id);

            report.CreatedUsers++;

            if (dryRun)
            {
                return;
            }

            var user = new User
            {
                Id = userSeed.Id ?? Guid.NewGuid(),
                CognitoSub = string.IsNullOrWhiteSpace(userSeed.CognitoSub) ? Guid.NewGuid().ToString() : userSeed.CognitoSub,
                Email = userSeed.Email,
                FirstName = userSeed.FirstName,
                LastName = userSeed.LastName,
                TenantId = tenantSeed.Id,
                UserType = ParseUserType(userSeed.UserType),
                Roles = new List<string>(userSeed.Roles ?? new List<string>()),
                EmailVerified = userSeed.EmailVerified,
                Phone = userSeed.Phone,
                PhoneVerified = userSeed.PhoneVerified
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();
            return;
        }

        var updated = false;

        updated |= UpdateIfChanged(existingUser, u => u.FirstName, userSeed.FirstName, v => existingUser.FirstName = v, !dryRun);
        updated |= UpdateIfChanged(existingUser, u => u.LastName, userSeed.LastName, v => existingUser.LastName = v, !dryRun);
        updated |= UpdateIfChanged(existingUser, u => u.TenantId, tenantSeed.Id, v => existingUser.TenantId = v, !dryRun);
        updated |= UpdateIfChanged(existingUser, u => u.UserType, ParseUserType(userSeed.UserType), v => existingUser.UserType = v, !dryRun);
        updated |= UpdateIfChanged(existingUser, u => u.EmailVerified, userSeed.EmailVerified, v => existingUser.EmailVerified = v, !dryRun);
        updated |= UpdateIfChanged(existingUser, u => u.Phone, userSeed.Phone, v => existingUser.Phone = v, !dryRun);
        updated |= UpdateIfChanged(existingUser, u => u.PhoneVerified, userSeed.PhoneVerified, v => existingUser.PhoneVerified = v, !dryRun);

        if (!string.IsNullOrWhiteSpace(userSeed.CognitoSub) && existingUser.CognitoSub != userSeed.CognitoSub)
        {
            if (dryRun)
            {
                logger.LogInformation("[dry-run] Would update Cognito sub for {Email}", userSeed.Email);
            }
            else
            {
                existingUser.CognitoSub = userSeed.CognitoSub;
            }
            updated = true;
        }

        var desiredRoles = new List<string>(userSeed.Roles ?? new List<string>());
        if (!RolesEqual(existingUser.Roles, desiredRoles))
        {
            if (dryRun)
            {
                logger.LogInformation("[dry-run] Would replace roles for {Email} -> [{Roles}]", userSeed.Email, string.Join(",", desiredRoles));
            }
            else
            {
                existingUser.Roles = desiredRoles;
            }
            updated = true;
        }

        if (updated)
        {
            report.UpdatedUsers++;
            if (dryRun)
            {
                logger.LogInformation("[dry-run] Would persist user updates for {Email}", userSeed.Email);
            }
            else
            {
                await dbContext.SaveChangesAsync();
                logger.LogInformation("Updated user {Email}", userSeed.Email);
            }
        }
        else
        {
            logger.LogDebug("User {Email} already up to date", userSeed.Email);
        }
    }

    private static async Task ProcessClinicsAsync(QivrDbContext dbContext, SeedTenant tenantSeed, bool dryRun, ILogger logger, ProvisionReport report)
    {
        foreach (var clinicSeed in tenantSeed.Clinics)
        {
            await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

            var query = dbContext.Clinics
                .IgnoreQueryFilters()
                .AsTracking()
                .Where(c => c.TenantId == tenantSeed.Id);

            Clinic? clinic = null;

            if (clinicSeed.Id.HasValue)
            {
                clinic = await query.FirstOrDefaultAsync(c => c.Id == clinicSeed.Id.Value);
            }

            if (clinic == null)
            {
                clinic = await query.FirstOrDefaultAsync(c => c.Name == clinicSeed.Name);
            }

            if (clinic == null)
            {
                report.CreatedClinics++;
                logger.LogInformation("{Prefix}Creating clinic {ClinicName}", dryRun ? "[dry-run] " : string.Empty, clinicSeed.Name);

                if (dryRun)
                {
                    if (!clinicSeed.Id.HasValue)
                    {
                        clinicSeed.Id = Guid.NewGuid();
                    }
                    continue;
                }

                clinic = new Clinic
                {
                    Id = clinicSeed.Id ?? Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    Name = clinicSeed.Name,
                    Description = clinicSeed.Description,
                    Address = clinicSeed.Address,
                    City = clinicSeed.City,
                    State = clinicSeed.State,
                    ZipCode = clinicSeed.ZipCode,
                    Country = clinicSeed.Country,
                    Phone = clinicSeed.Phone,
                    Email = clinicSeed.Email,
                    IsActive = clinicSeed.IsActive,
                    Metadata = new Dictionary<string, object>()
                };

                dbContext.Clinics.Add(clinic);
                await dbContext.SaveChangesAsync();
                clinicSeed.Id = clinic.Id;
                continue;
            }

            var updated = false;

            updated |= UpdateIfChanged(clinic, c => c.Name, clinicSeed.Name, v => clinic.Name = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.Description, clinicSeed.Description, v => clinic.Description = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.Address, clinicSeed.Address, v => clinic.Address = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.City, clinicSeed.City, v => clinic.City = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.State, clinicSeed.State, v => clinic.State = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.ZipCode, clinicSeed.ZipCode, v => clinic.ZipCode = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.Country, clinicSeed.Country, v => clinic.Country = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.Phone, clinicSeed.Phone, v => clinic.Phone = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.Email, clinicSeed.Email, v => clinic.Email = v, !dryRun);
            updated |= UpdateIfChanged(clinic, c => c.IsActive, clinicSeed.IsActive, v => clinic.IsActive = v, !dryRun);

            if (updated)
            {
                report.UpdatedClinics++;
                if (dryRun)
                {
                    logger.LogInformation("[dry-run] Would persist clinic updates for {ClinicId}", clinic.Id);
                    dbContext.Entry(clinic).State = EntityState.Unchanged;
                }
                else
                {
                    await dbContext.SaveChangesAsync();
                    logger.LogInformation("Updated clinic {ClinicId}", clinic.Id);
                }
            }
            else
            {
                logger.LogDebug("Clinic {ClinicId} already up to date", clinic.Id);
            }

            clinicSeed.Id = clinic.Id;
        }
    }

    private static async Task ProcessProvidersAsync(QivrDbContext dbContext, SeedTenant tenantSeed, bool dryRun, ILogger logger, ProvisionReport report)
    {
        foreach (var providerSeed in tenantSeed.Providers)
        {
            await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

            var user = await dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == providerSeed.UserEmail && u.TenantId == tenantSeed.Id);

            if (user == null)
            {
                logger.LogWarning("Skipping provider seed for {Email}: user not found", providerSeed.UserEmail);
                continue;
            }

            var clinic = await dbContext.Clinics
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenantSeed.Id && c.Name == providerSeed.ClinicName);

            if (clinic == null)
            {
                logger.LogWarning("Skipping provider seed for {Email}: clinic {Clinic} not found", providerSeed.UserEmail, providerSeed.ClinicName);
                continue;
            }

            var query = dbContext.Providers
                .IgnoreQueryFilters()
                .AsTracking()
                .Where(p => p.TenantId == tenantSeed.Id);

            Provider? provider = null;

            if (providerSeed.Id.HasValue)
            {
                provider = await query.FirstOrDefaultAsync(p => p.Id == providerSeed.Id.Value);
            }

            if (provider == null)
            {
                provider = await query.FirstOrDefaultAsync(p => p.UserId == user.Id);
            }

            if (provider == null)
            {
                report.CreatedProviders++;
                logger.LogInformation("{Prefix}Creating provider profile for {Email}", dryRun ? "[dry-run] " : string.Empty, providerSeed.UserEmail);

                if (dryRun)
                {
                    providerSeed.Id ??= Guid.NewGuid();
                    continue;
                }

                provider = new Provider
                {
                    Id = providerSeed.Id ?? Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    UserId = user.Id,
                    ClinicId = clinic.Id,
                    Title = providerSeed.Title,
                    Specialty = providerSeed.Specialty,
                    LicenseNumber = providerSeed.LicenseNumber,
                    NpiNumber = providerSeed.NpiNumber,
                    IsActive = providerSeed.IsActive
                };

                dbContext.Providers.Add(provider);
                await dbContext.SaveChangesAsync();
                providerSeed.Id = provider.Id;
                continue;
            }

            var updated = false;

            updated |= UpdateIfChanged(provider, p => p.ClinicId, clinic.Id, v => provider.ClinicId = v, !dryRun);
            updated |= UpdateIfChanged(provider, p => p.Title, providerSeed.Title, v => provider.Title = v, !dryRun);
            updated |= UpdateIfChanged(provider, p => p.Specialty, providerSeed.Specialty, v => provider.Specialty = v, !dryRun);
            updated |= UpdateIfChanged(provider, p => p.LicenseNumber, providerSeed.LicenseNumber, v => provider.LicenseNumber = v, !dryRun);
            updated |= UpdateIfChanged(provider, p => p.NpiNumber, providerSeed.NpiNumber, v => provider.NpiNumber = v, !dryRun);
            updated |= UpdateIfChanged(provider, p => p.IsActive, providerSeed.IsActive, v => provider.IsActive = v, !dryRun);

            if (updated)
            {
                report.UpdatedProviders++;
                if (dryRun)
                {
                    logger.LogInformation("[dry-run] Would persist provider updates for {ProviderId}", provider.Id);
                    dbContext.Entry(provider).State = EntityState.Unchanged;
                }
                else
                {
                    await dbContext.SaveChangesAsync();
                    logger.LogInformation("Updated provider {ProviderId}", provider.Id);
                }
            }
            else
            {
                logger.LogDebug("Provider {ProviderId} already up to date", provider.Id);
            }

            providerSeed.Id = provider.Id;
        }
    }

    private static async Task ProcessAppointmentsAsync(QivrDbContext dbContext, SeedTenant tenantSeed, bool dryRun, ILogger logger, ProvisionReport report)
    {
        foreach (var appointmentSeed in tenantSeed.Appointments)
        {
            await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

            var patient = await dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == appointmentSeed.PatientEmail && u.TenantId == tenantSeed.Id);

            if (patient == null)
            {
                logger.LogWarning("Skipping appointment seed: patient {Email} not found", appointmentSeed.PatientEmail);
                continue;
            }

            var providerUser = await dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == appointmentSeed.ProviderEmail && u.TenantId == tenantSeed.Id);

            if (providerUser == null)
            {
                logger.LogWarning("Skipping appointment seed: provider user {Email} not found", appointmentSeed.ProviderEmail);
                continue;
            }

            var providerProfile = await dbContext.Providers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.TenantId == tenantSeed.Id && p.UserId == providerUser.Id);

            if (providerProfile == null)
            {
                logger.LogWarning("Skipping appointment seed: provider profile for {Email} not found", appointmentSeed.ProviderEmail);
                continue;
            }

            var startTime = ParseDateTimeUtc(appointmentSeed.ScheduledStart, nameof(appointmentSeed.ScheduledStart));
            var endTime = appointmentSeed.ScheduledEnd != null
                ? ParseDateTimeUtc(appointmentSeed.ScheduledEnd, nameof(appointmentSeed.ScheduledEnd))
                : startTime.AddMinutes(appointmentSeed.DurationMinutes);

            if (endTime <= startTime)
            {
                logger.LogWarning("Skipping appointment seed for {PatientEmail}: end time must be after start time", appointmentSeed.PatientEmail);
                continue;
            }

            var query = dbContext.Appointments
                .IgnoreQueryFilters()
                .AsTracking()
                .Where(a => a.TenantId == tenantSeed.Id);

            Appointment? appointment = null;

            if (appointmentSeed.Id.HasValue)
            {
                appointment = await query.FirstOrDefaultAsync(a => a.Id == appointmentSeed.Id.Value);
            }

            if (appointment == null)
            {
                appointment = await query.FirstOrDefaultAsync(a =>
                    a.PatientId == patient.Id &&
                    a.ProviderId == providerUser.Id &&
                    a.ScheduledStart == startTime);
            }

            var desiredStatus = ParseEnumOrDefault(appointmentSeed.Status, AppointmentStatus.Scheduled, nameof(appointmentSeed.Status));
            var desiredLocationType = ParseEnumOrDefault(appointmentSeed.LocationType, LocationType.InPerson, nameof(appointmentSeed.LocationType));
            var desiredLocation = appointmentSeed.LocationDetails ?? new Dictionary<string, object>();

            if (appointment == null)
            {
                report.CreatedAppointments++;
                logger.LogInformation("{Prefix}Creating appointment {Start} for patient {PatientEmail}", dryRun ? "[dry-run] " : string.Empty, startTime, appointmentSeed.PatientEmail);

                if (dryRun)
                {
                    appointmentSeed.Id ??= Guid.NewGuid();
                    continue;
                }

                appointment = new Appointment
                {
                    Id = appointmentSeed.Id ?? Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    PatientId = patient.Id,
                    ProviderId = providerUser.Id,
                    ProviderProfileId = providerProfile.Id,
                    ClinicId = providerProfile.ClinicId,
                    ScheduledStart = startTime,
                    ScheduledEnd = endTime,
                    AppointmentType = appointmentSeed.AppointmentType,
                    Status = desiredStatus,
                    LocationType = desiredLocationType,
                    LocationDetails = new Dictionary<string, object>(desiredLocation),
                    Notes = appointmentSeed.Notes,
                    ExternalCalendarId = null,
                    EvaluationId = null
                };

                dbContext.Appointments.Add(appointment);
                await dbContext.SaveChangesAsync();
                appointmentSeed.Id = appointment.Id;
                continue;
            }

            var updated = false;

            updated |= UpdateIfChanged(appointment, a => a.PatientId, patient.Id, v => appointment.PatientId = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.ProviderId, providerUser.Id, v => appointment.ProviderId = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.ProviderProfileId, providerProfile.Id, v => appointment.ProviderProfileId = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.ClinicId, providerProfile.ClinicId, v => appointment.ClinicId = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.ScheduledStart, startTime, v => appointment.ScheduledStart = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.ScheduledEnd, endTime, v => appointment.ScheduledEnd = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.AppointmentType, appointmentSeed.AppointmentType, v => appointment.AppointmentType = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.Status, desiredStatus, v => appointment.Status = v, !dryRun);
            updated |= UpdateIfChanged(appointment, a => a.LocationType, desiredLocationType, v => appointment.LocationType = v, !dryRun);

            if (!JsonDictionaryEquals(appointment.LocationDetails, desiredLocation))
            {
                if (dryRun)
                {
                    logger.LogInformation("[dry-run] Would update location details for appointment {AppointmentId}", appointment.Id);
                }
                else
                {
                    appointment.LocationDetails = new Dictionary<string, object>(desiredLocation);
                }
                updated = true;
            }

            if (appointmentSeed.Notes != null && appointment.Notes != appointmentSeed.Notes)
            {
                if (dryRun)
                {
                    logger.LogInformation("[dry-run] Would update notes for appointment {AppointmentId}", appointment.Id);
                }
                else
                {
                    appointment.Notes = appointmentSeed.Notes;
                }
                updated = true;
            }

            if (updated)
            {
                report.UpdatedAppointments++;
                if (dryRun)
                {
                    logger.LogInformation("[dry-run] Would persist appointment updates for {AppointmentId}", appointment.Id);
                    dbContext.Entry(appointment).State = EntityState.Unchanged;
                }
                else
                {
                    await dbContext.SaveChangesAsync();
                    logger.LogInformation("Updated appointment {AppointmentId}", appointment.Id);
                }
            }
            else
            {
                logger.LogDebug("Appointment {AppointmentId} already up to date", appointment.Id);
            }

            appointmentSeed.Id = appointment.Id;
        }
    }

    private static async Task ProcessMedicalRecordsAsync(
        QivrDbContext dbContext,
        SeedTenant tenantSeed,
        SeedMedicalRecords records,
        bool dryRun,
        ILogger logger)
    {
        await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

        foreach (var condition in records.Conditions)
        {
            var patient = await ResolvePatientAsync(dbContext, tenantSeed.Id, condition.PatientEmail, logger);
            if (patient == null)
            {
                continue;
            }

            var entity = await dbContext.MedicalConditions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenantSeed.Id && c.PatientId == patient.Id && c.Condition == condition.Condition);

            if (entity == null)
            {
                entity = new MedicalCondition
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    PatientId = patient.Id,
                    Condition = condition.Condition,
                    Icd10Code = condition.Icd10Code,
                    DiagnosedDate = condition.DiagnosedDate,
                    Status = condition.Status,
                    ManagedBy = condition.ManagedBy,
                    LastReviewed = condition.LastReviewed,
                    Notes = condition.Notes
                };

                if (!dryRun)
                {
                    dbContext.MedicalConditions.Add(entity);
                    await dbContext.SaveChangesAsync();
                }
            }
            else if (!dryRun)
            {
                entity.Icd10Code = condition.Icd10Code;
                entity.DiagnosedDate = condition.DiagnosedDate;
                entity.Status = condition.Status;
                entity.ManagedBy = condition.ManagedBy;
                entity.LastReviewed = condition.LastReviewed;
                entity.Notes = condition.Notes;
                await dbContext.SaveChangesAsync();
            }
        }

        foreach (var vital in records.Vitals)
        {
            var patient = await ResolvePatientAsync(dbContext, tenantSeed.Id, vital.PatientEmail, logger);
            if (patient == null)
            {
                continue;
            }

            var exists = await dbContext.MedicalVitals
                .IgnoreQueryFilters()
                .AnyAsync(v => v.TenantId == tenantSeed.Id && v.PatientId == patient.Id && v.RecordedAt == vital.RecordedAt);

            if (exists && dryRun)
            {
                continue;
            }

            if (!dryRun)
            {
                if (!exists)
                {
                    dbContext.MedicalVitals.Add(new MedicalVital
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantSeed.Id,
                        PatientId = patient.Id,
                        RecordedAt = vital.RecordedAt,
                        Systolic = vital.Systolic,
                        Diastolic = vital.Diastolic,
                        HeartRate = vital.HeartRate,
                        TemperatureCelsius = vital.TemperatureCelsius,
                        WeightKilograms = vital.WeightKilograms,
                        HeightCentimetres = vital.HeightCentimetres,
                        OxygenSaturation = vital.OxygenSaturation,
                        RespiratoryRate = vital.RespiratoryRate
                    });
                }
                else
                {
                    var entity = await dbContext.MedicalVitals
                        .IgnoreQueryFilters()
                        .FirstAsync(v => v.TenantId == tenantSeed.Id && v.PatientId == patient.Id && v.RecordedAt == vital.RecordedAt);

                    entity.Systolic = vital.Systolic;
                    entity.Diastolic = vital.Diastolic;
                    entity.HeartRate = vital.HeartRate;
                    entity.TemperatureCelsius = vital.TemperatureCelsius;
                    entity.WeightKilograms = vital.WeightKilograms;
                    entity.HeightCentimetres = vital.HeightCentimetres;
                    entity.OxygenSaturation = vital.OxygenSaturation;
                    entity.RespiratoryRate = vital.RespiratoryRate;
                }

                await dbContext.SaveChangesAsync();
            }
        }

        foreach (var lab in records.LabResults)
        {
            var patient = await ResolvePatientAsync(dbContext, tenantSeed.Id, lab.PatientEmail, logger);
            if (patient == null)
            {
                continue;
            }

            var entity = await dbContext.MedicalLabResults
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(l => l.TenantId == tenantSeed.Id && l.PatientId == patient.Id && l.ResultDate == lab.ResultDate && l.TestName == lab.TestName);

            if (entity == null)
            {
                if (dryRun) continue;

                dbContext.MedicalLabResults.Add(new MedicalLabResult
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    PatientId = patient.Id,
                    ResultDate = lab.ResultDate,
                    Category = lab.Category,
                    TestName = lab.TestName,
                    Value = lab.Value,
                    Unit = lab.Unit,
                    ReferenceRange = lab.ReferenceRange,
                    Status = lab.Status,
                    OrderedBy = lab.OrderedBy,
                    Notes = lab.Notes
                });
                await dbContext.SaveChangesAsync();
            }
            else if (!dryRun)
            {
                entity.Category = lab.Category;
                entity.Value = lab.Value;
                entity.Unit = lab.Unit;
                entity.ReferenceRange = lab.ReferenceRange;
                entity.Status = lab.Status;
                entity.OrderedBy = lab.OrderedBy;
                entity.Notes = lab.Notes;
                await dbContext.SaveChangesAsync();
            }
        }

        foreach (var med in records.Medications)
        {
            var patient = await ResolvePatientAsync(dbContext, tenantSeed.Id, med.PatientEmail, logger);
            if (patient == null)
            {
                continue;
            }

            var entity = await dbContext.MedicalMedications
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(m => m.TenantId == tenantSeed.Id && m.PatientId == patient.Id && m.Name == med.Name && m.StartDate == med.StartDate);

            if (entity == null)
            {
                if (dryRun) continue;

                dbContext.MedicalMedications.Add(new MedicalMedication
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    PatientId = patient.Id,
                    Name = med.Name,
                    Dosage = med.Dosage,
                    Frequency = med.Frequency,
                    StartDate = med.StartDate,
                    EndDate = med.EndDate,
                    Status = med.Status,
                    PrescribedBy = med.PrescribedBy,
                    Instructions = med.Instructions,
                    RefillsRemaining = med.RefillsRemaining,
                    LastFilled = med.LastFilled,
                    Pharmacy = med.Pharmacy
                });
                await dbContext.SaveChangesAsync();
            }
            else if (!dryRun)
            {
                entity.Dosage = med.Dosage;
                entity.Frequency = med.Frequency;
                entity.EndDate = med.EndDate;
                entity.Status = med.Status;
                entity.PrescribedBy = med.PrescribedBy;
                entity.Instructions = med.Instructions;
                entity.RefillsRemaining = med.RefillsRemaining;
                entity.LastFilled = med.LastFilled;
                entity.Pharmacy = med.Pharmacy;
                await dbContext.SaveChangesAsync();
            }
        }

        foreach (var allergy in records.Allergies)
        {
            var patient = await ResolvePatientAsync(dbContext, tenantSeed.Id, allergy.PatientEmail, logger);
            if (patient == null)
            {
                continue;
            }

            var entity = await dbContext.MedicalAllergies
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.TenantId == tenantSeed.Id && a.PatientId == patient.Id && a.Allergen == allergy.Allergen);

            if (entity == null)
            {
                if (dryRun) continue;

                dbContext.MedicalAllergies.Add(new MedicalAllergy
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    PatientId = patient.Id,
                    Allergen = allergy.Allergen,
                    Type = allergy.Type,
                    Severity = allergy.Severity,
                    Reaction = allergy.Reaction,
                    DiagnosedDate = allergy.DiagnosedDate,
                    Notes = allergy.Notes
                });
                await dbContext.SaveChangesAsync();
            }
            else if (!dryRun)
            {
                entity.Type = allergy.Type;
                entity.Severity = allergy.Severity;
                entity.Reaction = allergy.Reaction;
                entity.DiagnosedDate = allergy.DiagnosedDate;
                entity.Notes = allergy.Notes;
                await dbContext.SaveChangesAsync();
            }
        }

        foreach (var immunization in records.Immunizations)
        {
            var patient = await ResolvePatientAsync(dbContext, tenantSeed.Id, immunization.PatientEmail, logger);
            if (patient == null)
            {
                continue;
            }

            var entity = await dbContext.MedicalImmunizations
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.TenantId == tenantSeed.Id && i.PatientId == patient.Id && i.Vaccine == immunization.Vaccine && i.Date == immunization.Date);

            if (entity == null)
            {
                if (dryRun) continue;

                dbContext.MedicalImmunizations.Add(new MedicalImmunization
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    PatientId = patient.Id,
                    Vaccine = immunization.Vaccine,
                    Date = immunization.Date,
                    NextDue = immunization.NextDue,
                    Provider = immunization.Provider,
                    Facility = immunization.Facility,
                    LotNumber = immunization.LotNumber,
                    Series = immunization.Series
                });
                await dbContext.SaveChangesAsync();
            }
            else if (!dryRun)
            {
                entity.NextDue = immunization.NextDue;
                entity.Provider = immunization.Provider;
                entity.Facility = immunization.Facility;
                entity.LotNumber = immunization.LotNumber;
                entity.Series = immunization.Series;
                await dbContext.SaveChangesAsync();
            }
        }
    }

    private static async Task ProcessPromTemplatesAsync(
        QivrDbContext dbContext,
        SeedTenant tenantSeed,
        IEnumerable<SeedPromTemplate> templates,
        bool dryRun,
        ILogger logger)
    {
        await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

        foreach (var templateSeed in templates)
        {
            PromTemplate? existing = null;

            if (templateSeed.Id.HasValue)
            {
                existing = await dbContext.PromTemplates
                    .IgnoreQueryFilters()
                    .AsTracking()
                    .FirstOrDefaultAsync(t => t.TenantId == tenantSeed.Id && t.Id == templateSeed.Id.Value);
            }

            existing ??= await dbContext.PromTemplates
                .IgnoreQueryFilters()
                .AsTracking()
                .FirstOrDefaultAsync(t => t.TenantId == tenantSeed.Id && t.Key == templateSeed.Key && t.Version == templateSeed.Version);

            if (existing == null)
            {
                if (dryRun)
                {
                    logger.LogInformation("[dry-run] Would create PROM template {Key} v{Version} for tenant {TenantId}", templateSeed.Key, templateSeed.Version, tenantSeed.Id);
                    continue;
                }

                var template = new PromTemplate
                {
                    Id = templateSeed.Id ?? Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    Key = templateSeed.Key,
                    Version = templateSeed.Version,
                    Name = templateSeed.Name,
                    Description = templateSeed.Description,
                    Category = templateSeed.Category,
                    Frequency = templateSeed.Frequency,
                    Questions = NormalizeQuestions(templateSeed.Questions),
                    ScoringMethod = NormalizeOptionalDictionary(templateSeed.ScoringMethod),
                    ScoringRules = NormalizeOptionalDictionary(templateSeed.ScoringRules),
                    IsActive = templateSeed.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                dbContext.PromTemplates.Add(template);
                await dbContext.SaveChangesAsync();
                continue;
            }

            if (dryRun)
            {
                logger.LogInformation("[dry-run] Would update PROM template {Key} v{Version} for tenant {TenantId}", templateSeed.Key, templateSeed.Version, tenantSeed.Id);
                dbContext.Entry(existing).State = EntityState.Unchanged;
                continue;
            }

            existing.Name = templateSeed.Name;
            existing.Description = templateSeed.Description;
            existing.Category = templateSeed.Category;
            existing.Frequency = templateSeed.Frequency;
            existing.Questions = NormalizeQuestions(templateSeed.Questions);
            existing.ScoringMethod = NormalizeOptionalDictionary(templateSeed.ScoringMethod);
            existing.ScoringRules = NormalizeOptionalDictionary(templateSeed.ScoringRules);
            existing.IsActive = templateSeed.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync();
        }
    }

    private static async Task ProcessPromInstancesAsync(
        QivrDbContext dbContext,
        SeedTenant tenantSeed,
        IEnumerable<SeedPromInstance> instances,
        bool dryRun,
        ILogger logger)
    {
        await ApplyTenantContextAsync(dbContext, tenantSeed.Id, logger);

        foreach (var instanceSeed in instances)
        {
            var patient = await ResolvePatientAsync(dbContext, tenantSeed.Id, instanceSeed.PatientEmail, logger);
            if (patient == null)
            {
                continue;
            }

            var template = await dbContext.PromTemplates
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.TenantId == tenantSeed.Id
                    && t.Key == instanceSeed.TemplateKey
                    && (!instanceSeed.TemplateVersion.HasValue || t.Version == instanceSeed.TemplateVersion.Value));

            if (template == null)
            {
                logger.LogWarning("Skipping PROM seed for {Email}: template {TemplateKey} v{Version} not found", instanceSeed.PatientEmail, instanceSeed.TemplateKey, instanceSeed.TemplateVersion ?? 0);
                continue;
            }

            var scheduledFor = DateTime.SpecifyKind(instanceSeed.ScheduledFor == default ? DateTime.UtcNow : instanceSeed.ScheduledFor, DateTimeKind.Utc);
            var dueDate = instanceSeed.DueDate.HasValue
                ? DateTime.SpecifyKind(instanceSeed.DueDate.Value, DateTimeKind.Utc)
                : scheduledFor.AddDays(7);

            PromInstance? existing = null;

            if (instanceSeed.Id.HasValue)
            {
                existing = await dbContext.PromInstances
                    .IgnoreQueryFilters()
                    .Include(i => i.Responses)
                    .FirstOrDefaultAsync(i => i.TenantId == tenantSeed.Id && i.Id == instanceSeed.Id.Value);
            }

            existing ??= await dbContext.PromInstances
                .IgnoreQueryFilters()
                .Include(i => i.Responses)
                .FirstOrDefaultAsync(i => i.TenantId == tenantSeed.Id
                    && i.TemplateId == template.Id
                    && i.PatientId == patient.Id
                    && i.ScheduledFor == scheduledFor);

            var status = ParseEnumOrDefault(instanceSeed.Status, PromStatus.Pending, "PROM status");
            var metadata = BuildPromMetadata(instanceSeed, status);

            if (existing == null)
            {
                if (dryRun)
                {
                    logger.LogInformation("[dry-run] Would create PROM instance for template {TemplateKey} and patient {PatientEmail}", template.Key, instanceSeed.PatientEmail);
                    continue;
                }

                var instance = new PromInstance
                {
                    Id = instanceSeed.Id ?? Guid.NewGuid(),
                    TenantId = tenantSeed.Id,
                    TemplateId = template.Id,
                    PatientId = patient.Id,
                    Status = status,
                    ScheduledFor = scheduledFor,
                    DueDate = dueDate,
                    CompletedAt = instanceSeed.CompletedAt,
                    Score = instanceSeed.Score,
                    ResponseData = metadata,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ReminderSentAt = null
                };

                if (instance.Status == PromStatus.Completed && instance.CompletedAt == null)
                {
                    instance.CompletedAt = DateTime.UtcNow;
                }

                dbContext.PromInstances.Add(instance);
                await dbContext.SaveChangesAsync();

                await EnsurePromResponseAsync(dbContext, tenantSeed.Id, template, instance, patient.Id, instanceSeed, status, dryRun, logger);
                continue;
            }

            if (dryRun)
            {
                logger.LogInformation("[dry-run] Would update PROM instance {InstanceId}", existing.Id);
                dbContext.Entry(existing).State = EntityState.Unchanged;
                continue;
            }

            existing.Status = status;
            existing.ScheduledFor = scheduledFor;
            existing.DueDate = dueDate;
            existing.Score = instanceSeed.Score;
            existing.CompletedAt = instanceSeed.CompletedAt;
            existing.ResponseData = metadata;
            existing.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync();

            await EnsurePromResponseAsync(dbContext, tenantSeed.Id, template, existing, patient.Id, instanceSeed, status, dryRun, logger);
        }
    }

    private static Dictionary<string, object> BuildPromMetadata(SeedPromInstance instanceSeed, PromStatus status)
    {
        var metadata = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase)
        {
            ["notificationMethod"] = string.IsNullOrWhiteSpace(instanceSeed.NotificationMethod) ? "Email" : instanceSeed.NotificationMethod!,
            ["sentBy"] = string.IsNullOrWhiteSpace(instanceSeed.SentBy) ? "seed" : instanceSeed.SentBy!,
            ["tags"] = instanceSeed.Tags ?? new List<string>(),
            ["reminderCount"] = 0
        };

        if (!string.IsNullOrWhiteSpace(instanceSeed.Notes))
        {
            metadata["notes"] = instanceSeed.Notes!;
        }

        if (instanceSeed.Answers != null && instanceSeed.Answers.Count > 0)
        {
            metadata["answers"] = NormalizeDictionary(instanceSeed.Answers);
        }

        if (instanceSeed.CompletionSeconds.HasValue)
        {
            metadata["completionSeconds"] = instanceSeed.CompletionSeconds.Value;
        }

        if (status == PromStatus.Completed && instanceSeed.CompletedAt.HasValue)
        {
            metadata["completedAt"] = instanceSeed.CompletedAt.Value;
        }

        return metadata;
    }

    private static async Task EnsurePromResponseAsync(
        QivrDbContext dbContext,
        Guid tenantId,
        PromTemplate template,
        PromInstance instance,
        Guid patientId,
        SeedPromInstance instanceSeed,
        PromStatus status,
        bool dryRun,
        ILogger logger)
    {
        var existing = await dbContext.PromResponses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.PromInstanceId == instance.Id);

        if (status != PromStatus.Completed)
        {
            if (existing != null && !dryRun)
            {
                dbContext.PromResponses.Remove(existing);
                await dbContext.SaveChangesAsync();
            }

            return;
        }

        var completedAt = instanceSeed.CompletedAt ?? instance.CompletedAt ?? DateTime.UtcNow;
        var score = instanceSeed.Score ?? instance.Score ?? 0m;
        var answers = instanceSeed.Answers != null ? NormalizeDictionary(instanceSeed.Answers) : new Dictionary<string, object>();
        var severity = DeterminePromSeverity(template.Key, score);

        if (existing == null)
        {
            if (dryRun)
            {
                logger.LogInformation("[dry-run] Would create PROM response for instance {InstanceId}", instance.Id);
                return;
            }

            var response = new PromResponse
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientId,
                PromInstanceId = instance.Id,
                PromType = template.Key,
                CompletedAt = completedAt,
                Score = score,
                Severity = severity,
                Answers = answers,
                Notes = instanceSeed.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            dbContext.PromResponses.Add(response);
            await dbContext.SaveChangesAsync();
            return;
        }

        if (dryRun)
        {
            logger.LogInformation("[dry-run] Would update PROM response {ResponseId}", existing.Id);
            dbContext.Entry(existing).State = EntityState.Unchanged;
            return;
        }

        existing.CompletedAt = completedAt;
        existing.Score = score;
        existing.Severity = severity;
        existing.Answers = answers;
        existing.Notes = instanceSeed.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
    }

    private static List<Dictionary<string, object>> NormalizeQuestions(IEnumerable<Dictionary<string, object>> questions)
    {
        return questions.Select(NormalizeDictionary).ToList();
    }

    private static Dictionary<string, object>? NormalizeOptionalDictionary(Dictionary<string, object>? source)
    {
        return source == null ? null : NormalizeDictionary(source);
    }

    private static Dictionary<string, object> NormalizeDictionary(Dictionary<string, object> source)
    {
        var result = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in source)
        {
            var normalized = NormalizeValue(kvp.Value);
            result[kvp.Key] = normalized!;
        }

        return result;
    }

    private static object? NormalizeValue(object? value)
    {
        if (value is JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                    foreach (var property in element.EnumerateObject())
                    {
                        dict[property.Name] = NormalizeValue(property.Value)!;
                    }

                    return dict;
                case JsonValueKind.Array:
                    var list = new List<object?>();
                    foreach (var item in element.EnumerateArray())
                    {
                        list.Add(NormalizeValue(item));
                    }

                    return list;
                case JsonValueKind.String:
                    if (element.TryGetDateTime(out var dt))
                    {
                        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                    }

                    return element.GetString();
                case JsonValueKind.Number:
                    if (element.TryGetInt64(out var longValue))
                    {
                        return longValue;
                    }

                    if (element.TryGetDecimal(out var decimalValue))
                    {
                        return decimalValue;
                    }

                    return element.GetDouble();
                case JsonValueKind.True:
                case JsonValueKind.False:
                    return element.GetBoolean();
                case JsonValueKind.Null:
                case JsonValueKind.Undefined:
                    return null;
                default:
                    return element.GetRawText();
            }
        }

        if (value is IDictionary dictionary)
        {
            var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            foreach (DictionaryEntry entry in dictionary)
            {
                if (entry.Key is string key)
                {
                    dict[key] = NormalizeValue(entry.Value)!;
                }
            }

            return dict;
        }

        if (value is IEnumerable enumerable && value is not string)
        {
            var list = new List<object?>();
            foreach (var item in enumerable)
            {
                list.Add(NormalizeValue(item));
            }

            return list;
        }

        return value;
    }

    private static string DeterminePromSeverity(string templateKey, decimal score)
    {
        var key = templateKey.ToLowerInvariant();

        if (key.Contains("phq", StringComparison.OrdinalIgnoreCase))
        {
            if (score >= 20) return "severe";
            if (score >= 15) return "moderately-severe";
            if (score >= 10) return "moderate";
            if (score >= 5) return "mild";
            return "minimal";
        }

        if (key.Contains("gad", StringComparison.OrdinalIgnoreCase))
        {
            if (score >= 15) return "severe";
            if (score >= 10) return "moderate";
            if (score >= 5) return "mild";
            return "minimal";
        }

        if (score >= 15) return "high";
        if (score >= 10) return "medium";
        if (score > 0) return "low";
        return "none";
    }

    private static DateTime ParseDateTimeUtc(string value, string propertyName)
    {
        if (DateTime.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal,
                out var parsed))
        {
            return parsed.ToUniversalTime();
        }

        throw new InvalidOperationException($"Unable to parse {propertyName} value '{value}' as a valid date/time.");
    }

    private static T ParseEnumOrDefault<T>(string value, T defaultValue, string propertyName) where T : struct, Enum
    {
        if (Enum.TryParse<T>(value, true, out var parsed))
        {
            return parsed;
        }

        return defaultValue;
    }

    private static bool JsonDictionaryEquals(Dictionary<string, object>? current, Dictionary<string, object>? desired)
    {
        current ??= new Dictionary<string, object>();
        desired ??= new Dictionary<string, object>();

        var currentJson = JsonSerializer.Serialize(current);
        var desiredJson = JsonSerializer.Serialize(desired);

        return string.Equals(currentJson, desiredJson, StringComparison.Ordinal);
    }

    private static bool RolesEqual(ICollection<string>? current, ICollection<string>? desired)
    {
        if (current == null && desired == null)
        {
            return true;
        }

        if (current == null || desired == null)
        {
            return false;
        }

        if (current.Count != desired.Count)
        {
            return false;
        }

        return current.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .SequenceEqual(desired.OrderBy(x => x, StringComparer.OrdinalIgnoreCase), StringComparer.OrdinalIgnoreCase);
    }

    private static bool UpdateIfChanged<T, TValue>(T entity, Func<T, TValue> accessor, TValue desiredValue, Action<TValue> assign, bool applyChange)
    {
        var currentValue = accessor(entity);
        if (Equals(currentValue, desiredValue))
        {
            return false;
        }

        if (applyChange)
        {
            assign(desiredValue);
        }
        return true;
    }

    private static async Task<User?> ResolvePatientAsync(QivrDbContext dbContext, Guid tenantId, string email, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            logger.LogWarning("Skipping medical record seed: patient email missing");
            return null;
        }

        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == email);

        if (user == null)
        {
            logger.LogWarning("Skipping medical record seed: patient {Email} not found", email);
        }

        return user;
    }

    private static async Task EnsureConnectionOpenAsync(QivrDbContext dbContext, ILogger logger)
    {
        var connection = dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = "RESET ALL";
        await command.ExecuteNonQueryAsync();
        logger.LogDebug("Database connection ready for tenant context updates");
    }

    private static async Task ApplyTenantContextAsync(QivrDbContext dbContext, Guid tenantId, ILogger logger)
    {
        var connection = dbContext.Database.GetDbConnection();

        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT set_config('app.tenant_id', @tenant::text, true)";
        var parameter = command.CreateParameter();
        parameter.ParameterName = "@tenant";
        parameter.Value = tenantId.ToString();
        command.Parameters.Add(parameter);

        await command.ExecuteNonQueryAsync();
        logger.LogDebug("Applied tenant context {TenantId}", tenantId);
    }

    private static UserType ParseUserType(string value)
    {
        if (Enum.TryParse<UserType>(value, true, out var parsed))
        {
            return parsed;
        }

        throw new InvalidOperationException($"Unknown user type '{value}'.");
    }
}

internal sealed record ProvisionOptions(string? ConfigPath, string? ConnectionString, bool DryRun)
{
    public static ProvisionOptions Parse(string[] args)
    {
        string? config = null;
        string? connection = null;
        var dryRun = false;

        foreach (var arg in args)
        {
            if (arg.StartsWith("--config=", StringComparison.OrdinalIgnoreCase))
            {
                config = arg.Split('=', 2)[1];
            }
            else if (arg.Equals("--dry-run", StringComparison.OrdinalIgnoreCase))
            {
                dryRun = true;
            }
            else if (arg.StartsWith("--connection=", StringComparison.OrdinalIgnoreCase))
            {
                connection = arg.Split('=', 2)[1];
            }
        }

        config ??= Path.Combine(AppContext.BaseDirectory, "dev-users.json");
        return new ProvisionOptions(config, connection, dryRun);
    }
}

internal static class SeedConfigLoader
{
    public static SeedConfig Load(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException("A configuration file path is required. Pass --config=<path>.");
        }

        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Seed configuration file not found: {path}");
        }

        var json = File.ReadAllText(path);
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var config = JsonSerializer.Deserialize<SeedConfig>(json, options);
        if (config == null)
        {
            throw new InvalidOperationException("Unable to parse seed configuration file.");
        }

        return config;
    }
}

internal sealed class ProvisionReport
{
    public int CreatedTenants { get; set; }
    public int UpdatedTenants { get; set; }
    public int CreatedUsers { get; set; }
    public int UpdatedUsers { get; set; }
    public int CreatedClinics { get; set; }
    public int UpdatedClinics { get; set; }
    public int CreatedProviders { get; set; }
    public int UpdatedProviders { get; set; }
    public int CreatedAppointments { get; set; }
    public int UpdatedAppointments { get; set; }
}

internal sealed class SeedConfig
{
    public string? ConnectionString { get; set; }
    public List<SeedTenant> Tenants { get; set; } = new();
}

internal sealed class SeedTenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public TenantStatus Status { get; set; } = TenantStatus.Active;
    public string Plan { get; set; } = "starter";
    public string Timezone { get; set; } = "Australia/Sydney";
    public string Locale { get; set; } = "en-AU";
    public Dictionary<string, object>? Settings { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public List<SeedUser> Users { get; set; } = new();
    public List<SeedClinic> Clinics { get; set; } = new();
    public List<SeedProvider> Providers { get; set; } = new();
    public List<SeedAppointment> Appointments { get; set; } = new();
    public SeedMedicalRecords? MedicalRecords { get; set; }
    public List<SeedPromTemplate> PromTemplates { get; set; } = new();
    public List<SeedPromInstance> PromInstances { get; set; } = new();
}

internal sealed class SeedUser
{
    public Guid? Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? CognitoSub { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserType { get; set; } = "Staff";
    public List<string>? Roles { get; set; }
    public bool EmailVerified { get; set; } = true;
    public string? Phone { get; set; }
    public bool PhoneVerified { get; set; }
}

internal sealed class SeedClinic
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
}

internal sealed class SeedProvider
{
    public Guid? Id { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string ClinicName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Specialty { get; set; }
    public string? LicenseNumber { get; set; }
    public string? NpiNumber { get; set; }
    public bool IsActive { get; set; } = true;
}

internal sealed class SeedAppointment
{
    public Guid? Id { get; set; }
    public string PatientEmail { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string ScheduledStart { get; set; } = string.Empty;
    public string? ScheduledEnd { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public string AppointmentType { get; set; } = "consultation";
    public string Status { get; set; } = "Scheduled";
    public string LocationType { get; set; } = "InPerson";
    public Dictionary<string, object>? LocationDetails { get; set; }
    public string? Notes { get; set; }
}

internal sealed class SeedMedicalRecords
{
    public List<SeedMedicalCondition> Conditions { get; set; } = new();
    public List<SeedMedicalVital> Vitals { get; set; } = new();
    public List<SeedMedicalLabResult> LabResults { get; set; } = new();
    public List<SeedMedicalMedication> Medications { get; set; } = new();
    public List<SeedMedicalAllergy> Allergies { get; set; } = new();
    public List<SeedMedicalImmunization> Immunizations { get; set; } = new();
}

internal sealed class SeedPromTemplate
{
    public Guid? Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public List<Dictionary<string, object>> Questions { get; set; } = new();
    public Dictionary<string, object>? ScoringMethod { get; set; }
    public Dictionary<string, object>? ScoringRules { get; set; }
    public bool IsActive { get; set; } = true;
}

internal sealed class SeedPromInstance
{
    public Guid? Id { get; set; }
    public string TemplateKey { get; set; } = string.Empty;
    public int? TemplateVersion { get; set; }
    public string PatientEmail { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime ScheduledFor { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? Score { get; set; }
    public Dictionary<string, object>? Answers { get; set; }
    public int? CompletionSeconds { get; set; }
    public string? Notes { get; set; }
    public string NotificationMethod { get; set; } = "Email";
    public string SentBy { get; set; } = "seed-script";
    public List<string>? Tags { get; set; }
}

internal sealed class SeedMedicalCondition
{
    public string PatientEmail { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string? Icd10Code { get; set; }
    public DateTime DiagnosedDate { get; set; }
    public string Status { get; set; } = "active";
    public string ManagedBy { get; set; } = string.Empty;
    public DateTime LastReviewed { get; set; }
    public string? Notes { get; set; }
}

internal sealed class SeedMedicalVital
{
    public string PatientEmail { get; set; } = string.Empty;
    public DateTime RecordedAt { get; set; }
    public int Systolic { get; set; }
    public int Diastolic { get; set; }
    public int HeartRate { get; set; }
    public decimal TemperatureCelsius { get; set; }
    public decimal WeightKilograms { get; set; }
    public decimal HeightCentimetres { get; set; }
    public int OxygenSaturation { get; set; }
    public int RespiratoryRate { get; set; }
}

internal sealed class SeedMedicalLabResult
{
    public string PatientEmail { get; set; } = string.Empty;
    public DateTime ResultDate { get; set; }
    public string Category { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string ReferenceRange { get; set; } = string.Empty;
    public string Status { get; set; } = "normal";
    public string OrderedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

internal sealed class SeedMedicalMedication
{
    public string PatientEmail { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "active";
    public string PrescribedBy { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public int? RefillsRemaining { get; set; }
    public DateTime? LastFilled { get; set; }
    public string? Pharmacy { get; set; }
}

internal sealed class SeedMedicalAllergy
{
    public string PatientEmail { get; set; } = string.Empty;
    public string Allergen { get; set; } = string.Empty;
    public string Type { get; set; } = "other";
    public string Severity { get; set; } = "mild";
    public string Reaction { get; set; } = string.Empty;
    public DateTime? DiagnosedDate { get; set; }
    public string? Notes { get; set; }
}

internal sealed class SeedMedicalImmunization
{
    public string PatientEmail { get; set; } = string.Empty;
    public string Vaccine { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime? NextDue { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Facility { get; set; } = string.Empty;
    public string? LotNumber { get; set; }
    public string? Series { get; set; }
}
