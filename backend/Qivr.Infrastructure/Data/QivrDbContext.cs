using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Qivr.Core.Common;
using Qivr.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Qivr.Infrastructure.Data;

public class QivrDbContext : DbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private Guid? _tenantId;
    private string? _userId;
    private bool _tenantExtracted = false;

    public QivrDbContext(DbContextOptions<QivrDbContext> options, IHttpContextAccessor? httpContextAccessor = null) 
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    /// <summary>
    /// Allows tests to explicitly set the tenant ID for query filtering
    /// </summary>
    public void SetTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
        _tenantExtracted = true;
    }
    
    private Guid? GetTenantId()
    {
        if (!_tenantExtracted)
        {
            ExtractTenantAndUser();
            _tenantExtracted = true;
        }
        return _tenantId;
    }

    // DbSets
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    // Phase 4.1: Removed Clinic DbSet - using Tenant properties instead
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<Evaluation> Evaluations => Set<Evaluation>();
    public DbSet<PainMap> PainMaps => Set<PainMap>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<BrandTheme> BrandThemes => Set<BrandTheme>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentAuditLog> DocumentAuditLogs => Set<DocumentAuditLog>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<PromResponse> PromResponses => Set<PromResponse>();
    public DbSet<PromInstance> PromInstances => Set<PromInstance>();
    public DbSet<PromTemplate> PromTemplates => Set<PromTemplate>();
    public DbSet<PromBookingRequest> PromBookingRequests => Set<PromBookingRequest>();
    public DbSet<NotificationPreferences> NotificationPreferences => Set<NotificationPreferences>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MedicalCondition> MedicalConditions => Set<MedicalCondition>();
    public DbSet<MedicalVital> MedicalVitals => Set<MedicalVital>(); // Keep for migration compatibility
    public DbSet<PainAssessment> PainAssessments => Set<PainAssessment>();
    public DbSet<PhysioHistory> PhysioHistories => Set<PhysioHistory>();
    public DbSet<MedicalLabResult> MedicalLabResults => Set<MedicalLabResult>();
    public DbSet<MedicalMedication> MedicalMedications => Set<MedicalMedication>();
    public DbSet<MedicalAllergy> MedicalAllergies => Set<MedicalAllergy>();
    public DbSet<MedicalImmunization> MedicalImmunizations => Set<MedicalImmunization>();
    public DbSet<MedicalProcedure> MedicalProcedures => Set<MedicalProcedure>();
    public DbSet<AppointmentWaitlistEntry> AppointmentWaitlistEntries => Set<AppointmentWaitlistEntry>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<TreatmentPlan> TreatmentPlans => Set<TreatmentPlan>();
    public DbSet<Referral> Referrals => Set<Referral>();

    private static Dictionary<string, object> DeserializeJsonSafely(string v)
    {
        if (string.IsNullOrEmpty(v) || v == "NULL" || v == "null") 
            return new Dictionary<string, object>();
        try 
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>();
        }
        catch 
        {
            return new Dictionary<string, object>();
        }
    }

    private static Dictionary<string, object>? DeserializeJsonSafelyNullable(string v)
    {
        if (string.IsNullOrEmpty(v) || v == "NULL" || v == "null") 
            return null;
        try 
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null);
        }
        catch 
        {
            return null;
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Use default public schema for PostgreSQL
        // modelBuilder.HasDefaultSchema("qivr");
        
        // Configure snake_case naming convention for PostgreSQL
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Convert table names to snake_case
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }
            
            // Convert column names to snake_case
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            }
            
            // Convert key names to snake_case
            foreach (var key in entity.GetKeys())
            {
                key.SetName(ToSnakeCase(key.GetName()));
            }
            
            // Convert index names to snake_case
            foreach (var index in entity.GetIndexes())
            {
                index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName()));
            }
            
            // Convert foreign key names to snake_case
            foreach (var foreignKey in entity.GetForeignKeys())
            {
                foreignKey.SetConstraintName(ToSnakeCase(foreignKey.GetConstraintName()));
            }
        }
        // modelBuilder.HasDefaultSchema("qivr");
        
        // Configure value converters and comparers for complex types
        var jsonComparer = new ValueComparer<Dictionary<string, object>>(
            (c1, c2) => JsonSerializer.Serialize(c1, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(c2, (JsonSerializerOptions?)null),
            c => c == null ? 0 : JsonSerializer.Serialize(c, (JsonSerializerOptions?)null).GetHashCode(),
            c => JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(c, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null) ?? new Dictionary<string, object>()
        );
        
        var jsonConverter = new ValueConverter<Dictionary<string, object>, string>(
            v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), (JsonSerializerOptions?)null),
            v => DeserializeJsonSafely(v)
        );
        
        var nullableJsonConverter = new ValueConverter<Dictionary<string, object>?, string>(
            v => v == null ? "{}" : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => DeserializeJsonSafelyNullable(v)
        );
        
        var stringListComparer = new ValueComparer<List<string>>(
            (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
            c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c == null ? new List<string>() : c.ToList()
        );
        
        var stringListConverter = new ValueConverter<List<string>, string[]>(
            v => v == null ? Array.Empty<string>() : v.ToArray(),
            v => v == null ? new List<string>() : v.ToList()
        );

        var dateTimeListComparer = new ValueComparer<List<DateTime>>(
            (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
            c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c == null ? new List<DateTime>() : c.ToList()
        );

        var dateTimeListConverter = new ValueConverter<List<DateTime>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<DateTime>>(v, (JsonSerializerOptions?)null) ?? new List<DateTime>()
        );

        // Tenant configuration
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Settings)
                .HasConversion(jsonConverter)
                .HasColumnType("jsonb");
            entity.Ignore(e => e.Metadata); // Database doesn't have metadata column
            entity.Ignore(e => e.DeletedAt); // Database uses is_active instead
            entity.Ignore(e => e.Status); // Database doesn't have status column
            entity.Ignore(e => e.CognitoUserPoolId); // Not stored in database
            entity.Ignore(e => e.CognitoUserPoolClientId); // Not stored in database
            entity.Ignore(e => e.CognitoUserPoolDomain); // Not stored in database
            entity.Ignore(e => e.Plan); // Database doesn't have plan column
            entity.Ignore(e => e.Timezone); // Database doesn't have timezone column
            entity.Ignore(e => e.Locale); // Database doesn't have locale column
            // Ignore clinic properties that don't exist in database yet
            entity.Ignore(e => e.Description);
            entity.Ignore(e => e.Address);
            entity.Ignore(e => e.City);
            entity.Ignore(e => e.State);
            entity.Ignore(e => e.ZipCode);
            entity.Ignore(e => e.Country);
            entity.Ignore(e => e.Phone);
            entity.Ignore(e => e.Email);
            entity.Ignore(e => e.IsActive);
            // Ignore clinic properties that don't exist in database
            entity.Ignore(e => e.Description);
            entity.Ignore(e => e.Address);
            entity.Ignore(e => e.City);
            entity.Ignore(e => e.State);
            entity.Ignore(e => e.ZipCode);
            entity.Ignore(e => e.Country);
            entity.Ignore(e => e.Phone);
            entity.Ignore(e => e.Email);
            entity.Ignore(e => e.IsActive);
            // No query filter since DeletedAt doesn't exist in database
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();
            entity.HasIndex(e => e.CognitoSub).IsUnique();
            entity.Property(e => e.CognitoSub).HasColumnName("cognito_id");
            entity.Property(e => e.UserType).HasConversion<string>().HasColumnName("role");
            entity.Ignore(e => e.Roles); // Roles are stored in a separate table or derived from UserType
            entity.Property(e => e.Preferences).HasConversion(jsonConverter).HasColumnName("metadata");
            entity.Ignore(e => e.Consent); // Database doesn't have consent column
            entity.Ignore(e => e.AvatarUrl); // Database doesn't have avatar_url column
            entity.Ignore(e => e.DateOfBirth); // Database doesn't have date_of_birth column
            entity.Ignore(e => e.Gender); // Database doesn't have gender column
            entity.Ignore(e => e.EmailVerified); // Database doesn't have email_verified column
            entity.Ignore(e => e.PhoneVerified); // Database doesn't have phone_verified column
            entity.Ignore(e => e.LastLoginAt); // Database doesn't have last_login_at column
            entity.Ignore(e => e.CreatedBy); // Database doesn't have created_by column
            entity.Ignore(e => e.UpdatedBy); // Database doesn't have updated_by column
            entity.Ignore(e => e.DeletedAt); // Database uses is_active instead
            
            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Modified query filter - no DeletedAt check, optionally filter by tenant
            if (_tenantId.HasValue)
            {
                entity.HasQueryFilter(e => e.TenantId == GetTenantId());
            }
        });

        // Evaluation configuration
        modelBuilder.Entity<Evaluation>(entity =>
        {
            entity.ToTable("evaluations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.EvaluationNumber }).IsUnique();
            entity.Property(e => e.Symptoms)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);
            entity.Property(e => e.AiRiskFlags)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);
            entity.Property(e => e.MedicalHistory)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);
            entity.Property(e => e.QuestionnaireResponses)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Urgency).HasConversion<string>();
            
            entity.HasOne(e => e.Patient)
                .WithMany(u => u.Evaluations)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Reviewer)
                .WithMany()
                .HasForeignKey(e => e.ReviewedBy)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // PainMap configuration
        modelBuilder.Entity<PainMap>(entity =>
        {
            entity.ToTable("pain_maps");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PainQuality).HasConversion(stringListConverter);
            entity.OwnsOne(e => e.Coordinates, coord =>
            {
                coord.Property(c => c.X).HasColumnName("coordinate_x");
                coord.Property(c => c.Y).HasColumnName("coordinate_y");
                coord.Property(c => c.Z).HasColumnName("coordinate_z");
            });
            
            entity.HasOne(e => e.Evaluation)
                .WithMany(ev => ev.PainMaps)
                .HasForeignKey(e => e.EvaluationId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // Appointment configuration
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("appointments");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProviderId, e.ScheduledStart, e.ScheduledEnd })
                .IsUnique()
                .HasDatabaseName("no_double_booking");
            entity.Property(e => e.LocationDetails)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.LocationType).HasConversion<string>();
            
            entity.HasOne(e => e.Patient)
                .WithMany(u => u.PatientAppointments)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Provider)
                .WithMany()  // No ProviderAppointments collection on User anymore
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ProviderProfile)
                .WithMany()
                .HasForeignKey(e => e.ProviderProfileId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Phase 4.1: Removed Clinic relationship - using TenantId only
                
            entity.HasOne(e => e.Evaluation)
                .WithMany(ev => ev.Appointments)
                .HasForeignKey(e => e.EvaluationId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.CancelledByUser)
                .WithMany()
                .HasForeignKey(e => e.CancelledBy)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // BrandTheme configuration
        modelBuilder.Entity<BrandTheme>(entity =>
        {
            entity.ToTable("brand_themes");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();
            entity.Property(e => e.Typography)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);
            entity.Property(e => e.WidgetConfig)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);
            
            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.BrandThemes)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // Document configuration
        modelBuilder.Entity<Document>(entity =>
        {
            entity.ToTable("documents");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            
            entity.Property(e => e.ExtractedIdentifiers)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, object>())
                .Metadata.SetValueComparer(jsonComparer);
            
            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.UploadedByUser)
                .WithMany()
                .HasForeignKey(e => e.UploadedBy)
                .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasOne(e => e.AssignedToUser)
                .WithMany()
                .HasForeignKey(e => e.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // DocumentAuditLog configuration
        modelBuilder.Entity<DocumentAuditLog>(entity =>
        {
            entity.ToTable("document_audit_log");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, object>())
                .Metadata.SetValueComparer(jsonComparer);
            
            entity.HasOne(e => e.Document)
                .WithMany(d => d.AuditLogs)
                .HasForeignKey(e => e.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Conversation configuration
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.ToTable("conversations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Priority).HasConversion<string>();
            
            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Provider)
                .WithMany()
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // Message configuration
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ConversationId, e.SentAt });
            entity.HasIndex(e => new { e.SenderId, e.DirectRecipientId });
            entity.HasIndex(e => e.ProviderProfileId);
            
            // Support both conversation-based and direct messaging
            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(e => e.ConversationId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Sender)
                .WithMany()
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(e => e.Recipient)
                .WithMany()
                .HasForeignKey(e => e.DirectRecipientId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ProviderProfile)
                .WithMany()
                .HasForeignKey(e => e.ProviderProfileId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.Attachment)
                .WithMany()
                .HasForeignKey(e => e.AttachmentId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.ParentMessage)
                .WithMany(m => m.Replies)
                .HasForeignKey(e => e.ParentMessageId)
                .OnDelete(DeleteBehavior.SetNull);
                
            // Ignore computed properties
            entity.Ignore(e => e.RecipientId);
            entity.Ignore(e => e.Subject);
            entity.Ignore(e => e.MessageType);
            entity.Ignore(e => e.Priority);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // ConversationParticipant configuration
        modelBuilder.Entity<ConversationParticipant>(entity =>
        {
            entity.ToTable("conversation_participants");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ConversationId, e.UserId }).IsUnique();
            
            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.Participants)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // PromTemplate configuration
        modelBuilder.Entity<PromTemplate>(entity =>
        {
            entity.ToTable("prom_templates");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Key).HasColumnName("key");
            entity.Property(e => e.Version).HasColumnName("version");
            entity.HasIndex(e => new { e.TenantId, e.Key, e.Version }).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();
            
            // Configure the Questions property with a custom converter
            var questionsConverter = new ValueConverter<List<Dictionary<string, object>>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Dictionary<string, object>>>(v, (JsonSerializerOptions?)null) ?? new List<Dictionary<string, object>>()
            );
            
            entity.Property(e => e.Questions).HasConversion(questionsConverter);
            entity.Property(e => e.ScoringMethod).HasConversion(jsonConverter);
            entity.Property(e => e.ScoringRules).HasConversion(jsonConverter).HasColumnName("scoring_rules");
            
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // PromInstance configuration
        modelBuilder.Entity<PromInstance>(entity =>
        {
            entity.ToTable("prom_instances");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            entity.Property(e => e.ResponseData).HasConversion(jsonConverter);
            entity.Property(e => e.Status).HasConversion<string>();
            
            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Template)
                .WithMany(i => i.Instances)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // PromResponse configuration
        modelBuilder.Entity<PromResponse>(entity =>
        {
            entity.ToTable("prom_responses");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.CompletedAt });
            entity.Property(e => e.Answers).HasConversion(jsonConverter);
            
            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.PromInstance)
                .WithMany(i => i.Responses)
                .HasForeignKey(e => e.PromInstanceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Appointment)
                .WithMany()
                .HasForeignKey(e => e.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // PromBookingRequest configuration
        modelBuilder.Entity<PromBookingRequest>(entity =>
        {
            entity.ToTable("prom_booking_requests");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PromInstanceId });
            entity.Property(e => e.TimePreference).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);

            entity.HasOne(e => e.PromInstance)
                .WithMany(i => i.BookingRequests)
                .HasForeignKey(e => e.PromInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });
        
        // Phase 4.1: Removed Clinic entity configuration - using Tenant properties instead
        
        // Provider configuration
        modelBuilder.Entity<Provider>(entity =>
        {
            entity.ToTable("providers");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId }); // Phase 4.1: Removed ClinicId from index
            entity.Ignore(e => e.ClinicId); // Phase 4.1: ClinicId exists in entity but not mapped to DB
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Phase 4.1: Removed Clinic relationship - using TenantId only
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // Role configuration
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();

            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasQueryFilter(e => e.TenantId == _tenantId || e.IsSystem);
        });

        // Permission configuration
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("permissions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();

            entity.Property(e => e.Key).HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        // RolePermission configuration
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("role_permissions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RoleId, e.PermissionId }).IsUnique();

            entity.HasOne(e => e.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Match Role entity filter to allow system role permissions
            entity.HasQueryFilter(e => e.Role != null && (e.Role.TenantId == _tenantId || e.Role.IsSystem));
        });

        // UserRole configuration
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.RoleId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });
        
        // NotificationPreferences configuration
        modelBuilder.Entity<NotificationPreferences>(entity =>
        {
            entity.ToTable("notification_preferences");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId }).IsUnique();
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });
        
        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.RecipientId, e.CreatedAt });
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.Channel).HasConversion<string>();
            entity.Property(e => e.Priority).HasConversion<string>();
            entity.Property(e => e.Data).HasConversion(jsonConverter);
            
            entity.HasOne(e => e.Recipient)
                .WithMany()
                .HasForeignKey(e => e.RecipientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Sender)
                .WithMany()
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        modelBuilder.Entity<AppointmentWaitlistEntry>(entity =>
        {
            entity.ToTable("appointment_waitlist_entries");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.AppointmentType)
                .HasMaxLength(100);

            entity.Property(e => e.Status)
                .HasConversion<string>();

            entity.Property(e => e.Notes)
                .HasColumnType("text");

            entity.Property(e => e.PreferredDates)
                .HasConversion(dateTimeListConverter)
                .Metadata.SetValueComparer(dateTimeListComparer);

            entity.Property(e => e.Metadata)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);

            entity.HasIndex(e => new { e.TenantId, e.Status })
                .HasDatabaseName("ix_appointment_waitlist_entries_tenant_status");

            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.Status })
                .HasDatabaseName("ix_appointment_waitlist_entries_patient_status");

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Provider)
                .WithMany()
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.MatchedAppointment)
                .WithMany()
                .HasForeignKey(e => e.MatchedAppointmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        ConfigureMedicalRecords(modelBuilder);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        SetTenantId();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        SetTenantId();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void ExtractTenantAndUser()
    {
        if (_httpContextAccessor?.HttpContext != null)
        {
            var tenantClaim = _httpContextAccessor.HttpContext.User.FindFirst("tenant_id");
            if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var tenantId))
            {
                _tenantId = tenantId;
            }
            
            _userId = _httpContextAccessor.HttpContext.User.FindFirst("sub")?.Value;
        }
    }

    private void SetTenantId()
    {
        if (_tenantId.HasValue)
        {
            foreach (var entry in ChangeTracker.Entries<TenantEntity>()
                .Where(e => e.State == EntityState.Added))
            {
                entry.Entity.TenantId = _tenantId.Value;
            }
        }
    }

    private void UpdateTimestamps()
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
        
        // Set audit fields
        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = _userId;
                    entry.Entity.UpdatedBy = _userId;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedBy = _userId;
                    break;
            }
        }
    }
    
    private void ConfigureMedicalRecords(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MedicalCondition>(entity =>
        {
            entity.ToTable("medical_conditions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.Condition });
            entity.Property(e => e.Condition).HasMaxLength(200);
            entity.Property(e => e.Icd10Code).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.ManagedBy).HasMaxLength(200);
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // Keep for migration compatibility - DO NOT USE
        modelBuilder.Entity<MedicalVital>(entity =>
        {
            entity.ToTable("medical_vitals");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.RecordedAt });
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        modelBuilder.Entity<PainAssessment>(entity =>
        {
            entity.ToTable("PainAssessments");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.RecordedAt });
            entity.Property(e => e.RecordedBy).HasMaxLength(200);
            entity.Property(e => e.FunctionalImpact).HasMaxLength(50);
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        modelBuilder.Entity<MedicalLabResult>(entity =>
        {
            entity.ToTable("medical_lab_results");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.Category, e.ResultDate });
            entity.Property(e => e.Category).HasMaxLength(200);
            entity.Property(e => e.TestName).HasMaxLength(200);
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.ReferenceRange).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.OrderedBy).HasMaxLength(200);
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        modelBuilder.Entity<MedicalMedication>(entity =>
        {
            entity.ToTable("medical_medications");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.Status });
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Dosage).HasMaxLength(100);
            entity.Property(e => e.Frequency).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.PrescribedBy).HasMaxLength(200);
            entity.Property(e => e.Pharmacy).HasMaxLength(200);
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        modelBuilder.Entity<MedicalAllergy>(entity =>
        {
            entity.ToTable("medical_allergies");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.Allergen });
            entity.Property(e => e.Allergen).HasMaxLength(200);
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.Severity).HasMaxLength(50);
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        modelBuilder.Entity<MedicalImmunization>(entity =>
        {
            entity.ToTable("medical_immunizations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.Date });
            entity.Property(e => e.Vaccine).HasMaxLength(200);
            entity.Property(e => e.Provider).HasMaxLength(200);
            entity.Property(e => e.Facility).HasMaxLength(200);
            entity.Property(e => e.Series).HasMaxLength(100);
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        modelBuilder.Entity<MedicalProcedure>(entity =>
        {
            entity.ToTable("medical_procedures");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.ProcedureDate });
            entity.Property(e => e.ProcedureName).HasMaxLength(200);
            entity.Property(e => e.CptCode).HasMaxLength(20);
            entity.Property(e => e.Provider).HasMaxLength(200);
            entity.Property(e => e.Facility).HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Outcome).HasMaxLength(500);
            entity.Property(e => e.Complications).HasMaxLength(500);
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // TreatmentPlan configuration
        modelBuilder.Entity<TreatmentPlan>(entity =>
        {
            entity.ToTable("treatment_plans");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Sessions).HasColumnType("jsonb");
            entity.Property(e => e.Exercises).HasColumnType("jsonb");
            entity.HasQueryFilter(e => e.DeletedAt == null && e.TenantId == GetTenantId());
        });
    }

    private static string ToSnakeCase(string? input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input ?? string.Empty;
        }
        
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
