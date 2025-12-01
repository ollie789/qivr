using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;

namespace Qivr.Infrastructure.Data;

/// <summary>
/// Read-only database context for admin portal read operations.
/// This should be configured to use a read replica connection string.
/// All entities are tracked as no-tracking by default.
/// </summary>
public class AdminReadOnlyDbContext : DbContext
{
    public AdminReadOnlyDbContext(DbContextOptions<AdminReadOnlyDbContext> options)
        : base(options)
    {
        // Disable change tracking for read-only context
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
        ChangeTracker.AutoDetectChangesEnabled = false;
    }

    // Read-only DbSets (no write operations allowed)
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<PromResponse> PromResponses => Set<PromResponse>();
    public DbSet<PromInstance> PromInstances => Set<PromInstance>();
    public DbSet<TreatmentPlan> TreatmentPlans => Set<TreatmentPlan>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();

    // Research Partner entities
    public DbSet<ResearchPartner> ResearchPartners => Set<ResearchPartner>();
    public DbSet<PartnerClinicAffiliation> PartnerClinicAffiliations => Set<PartnerClinicAffiliation>();
    public DbSet<ResearchStudy> ResearchStudies => Set<ResearchStudy>();
    public DbSet<StudyEnrollment> StudyEnrollments => Set<StudyEnrollment>();
    public DbSet<MedicalDevice> MedicalDevices => Set<MedicalDevice>();
    public DbSet<PatientDeviceUsage> PatientDeviceUsages => Set<PatientDeviceUsage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply snake_case naming convention
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            }
        }

        // Minimal configuration - just table mappings
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(e => e.Id);
            // Ignore properties not in database
            entity.Ignore(e => e.Metadata);
            entity.Ignore(e => e.DeletedAt);
            entity.Ignore(e => e.Status);
            entity.Ignore(e => e.CognitoUserPoolId);
            entity.Ignore(e => e.CognitoUserPoolClientId);
            entity.Ignore(e => e.CognitoUserPoolDomain);
            entity.Ignore(e => e.Plan);
            entity.Ignore(e => e.Timezone);
            entity.Ignore(e => e.Locale);
            entity.Ignore(e => e.Description);
            entity.Ignore(e => e.Address);
            entity.Ignore(e => e.City);
            entity.Ignore(e => e.State);
            entity.Ignore(e => e.ZipCode);
            entity.Ignore(e => e.Country);
            entity.Ignore(e => e.Phone);
            entity.Ignore(e => e.Email);
            entity.Ignore(e => e.IsActive);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CognitoSub).HasColumnName("cognito_id");
            entity.Property(e => e.UserType).HasConversion<string>().HasColumnName("role");
            entity.Ignore(e => e.Roles);
            entity.Ignore(e => e.Consent);
            entity.Ignore(e => e.AvatarUrl);
            entity.Ignore(e => e.DateOfBirth);
            entity.Ignore(e => e.Gender);
            entity.Ignore(e => e.EmailVerified);
            entity.Ignore(e => e.PhoneVerified);
            entity.Ignore(e => e.LastLoginAt);
            entity.Ignore(e => e.CreatedBy);
            entity.Ignore(e => e.UpdatedBy);
            entity.Ignore(e => e.DeletedAt);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("appointments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.LocationType).HasConversion<string>();
        });

        modelBuilder.Entity<PromResponse>(entity =>
        {
            entity.ToTable("prom_responses");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<PromInstance>(entity =>
        {
            entity.ToTable("prom_instances");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
        });

        modelBuilder.Entity<TreatmentPlan>(entity =>
        {
            entity.ToTable("treatment_plans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
        });

        modelBuilder.Entity<Document>(entity =>
        {
            entity.ToTable("documents");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<AdminAuditLog>(entity =>
        {
            entity.ToTable("admin_audit_logs");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AdminUserId);
            entity.HasIndex(e => new { e.ResourceType, e.ResourceId });
            entity.HasIndex(e => e.CreatedAt);
            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.ResourceType).HasMaxLength(50);
        });

        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.ToTable("api_keys");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId);
            entity.Property(e => e.Scopes).HasConversion(
                v => string.Join(",", v),
                v => v.Split(",", StringSplitOptions.RemoveEmptyEntries).ToList()
            );
        });

        // Research Partner entities
        modelBuilder.Entity<ResearchPartner>(entity =>
        {
            entity.ToTable("research_partners");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<PartnerClinicAffiliation>(entity =>
        {
            entity.ToTable("partner_clinic_affiliations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.DataSharingLevel).HasConversion<string>();
            entity.HasOne(e => e.Partner).WithMany(p => p.ClinicAffiliations).HasForeignKey(e => e.PartnerId);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId);
        });

        modelBuilder.Entity<ResearchStudy>(entity =>
        {
            entity.ToTable("research_studies");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Partner).WithMany(p => p.Studies).HasForeignKey(e => e.PartnerId);
        });

        modelBuilder.Entity<StudyEnrollment>(entity =>
        {
            entity.ToTable("study_enrollments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Study).WithMany(s => s.Enrollments).HasForeignKey(e => e.StudyId);
        });

        modelBuilder.Entity<MedicalDevice>(entity =>
        {
            entity.ToTable("medical_devices");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Partner).WithMany(p => p.Devices).HasForeignKey(e => e.PartnerId);
        });

        modelBuilder.Entity<PatientDeviceUsage>(entity =>
        {
            entity.ToTable("patient_device_usages");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Device).WithMany(d => d.UsageRecords).HasForeignKey(e => e.DeviceId);
        });
    }

    // Prevent write operations
    public override int SaveChanges() =>
        throw new InvalidOperationException("This is a read-only context. Write operations are not allowed.");

    public override int SaveChanges(bool acceptAllChangesOnSuccess) =>
        throw new InvalidOperationException("This is a read-only context. Write operations are not allowed.");

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("This is a read-only context. Write operations are not allowed.");

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("This is a read-only context. Write operations are not allowed.");

    private static string ToSnakeCase(string? input)
    {
        if (string.IsNullOrEmpty(input)) return input ?? string.Empty;

        var result = new System.Text.StringBuilder();
        for (int i = 0; i < input.Length; i++)
        {
            var ch = input[i];
            if (char.IsUpper(ch))
            {
                if (i > 0 && (char.IsLower(input[i - 1]) || (i < input.Length - 1 && char.IsLower(input[i + 1]))))
                {
                    result.Append('_');
                }
                result.Append(char.ToLower(ch));
            }
            else
            {
                result.Append(ch);
            }
        }
        return result.ToString();
    }
}
