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
    public DbSet<IntakeSubmission> IntakeSubmissions => Set<IntakeSubmission>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<BrandTheme> BrandThemes => Set<BrandTheme>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentAuditLog> DocumentAuditLogs => Set<DocumentAuditLog>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<InboxItem> InboxItems => Set<InboxItem>();
    public DbSet<OcrJob> OcrJobs => Set<OcrJob>();
    public DbSet<PromResponse> PromResponses => Set<PromResponse>();
    public DbSet<PromInstance> PromInstances => Set<PromInstance>();
    public DbSet<PromTemplate> PromTemplates => Set<PromTemplate>();
    public DbSet<PromBookingRequest> PromBookingRequests => Set<PromBookingRequest>();
    public DbSet<TreatmentProgressFeedback> TreatmentProgressFeedbacks => Set<TreatmentProgressFeedback>();

    // New PROM Infrastructure entities
    public DbSet<Instrument> Instruments => Set<Instrument>();
    public DbSet<TemplateQuestion> TemplateQuestions => Set<TemplateQuestion>();
    public DbSet<SummaryScoreDefinition> SummaryScoreDefinitions => Set<SummaryScoreDefinition>();
    public DbSet<SummaryScoreQuestionMapping> SummaryScoreQuestionMappings => Set<SummaryScoreQuestionMapping>();
    public DbSet<PromItemResponse> PromItemResponses => Set<PromItemResponse>();
    public DbSet<PromSummaryScore> PromSummaryScores => Set<PromSummaryScore>();
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
    public DbSet<ExerciseTemplate> ExerciseTemplates => Set<ExerciseTemplate>();
    public DbSet<Referral> Referrals => Set<Referral>();
    public DbSet<ProviderSchedule> ProviderSchedules => Set<ProviderSchedule>();
    public DbSet<ProviderTimeOff> ProviderTimeOffs => Set<ProviderTimeOff>();
    public DbSet<ProviderScheduleOverride> ProviderScheduleOverrides => Set<ProviderScheduleOverride>();
    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();

    // Research Partner entities
    public DbSet<ResearchPartner> ResearchPartners => Set<ResearchPartner>();
    public DbSet<PartnerClinicAffiliation> PartnerClinicAffiliations => Set<PartnerClinicAffiliation>();
    public DbSet<ResearchStudy> ResearchStudies => Set<ResearchStudy>();
    public DbSet<StudyEnrollment> StudyEnrollments => Set<StudyEnrollment>();
    public DbSet<MedicalDevice> MedicalDevices => Set<MedicalDevice>();
    public DbSet<PatientDeviceUsage> PatientDeviceUsages => Set<PatientDeviceUsage>();
    public DbSet<ServiceType> ServiceTypes => Set<ServiceType>();
    public DbSet<PatientInvitation> PatientInvitations => Set<PatientInvitation>();

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
        // NOTE: Database schema has these columns: id, slug, name, status (int), plan, timezone, locale,
        //       settings (text/json), metadata (text/json), deleted_at, created_at, updated_at
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();

            // Status is stored as integer in DB
            entity.Property(e => e.Status).HasConversion<int>();

            // Settings is stored as text (JSON string) in DB, not jsonb
            entity.Property(e => e.Settings)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);

            // Metadata is stored as text (JSON string) in DB
            entity.Property(e => e.Metadata)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);

            // These Cognito properties are not in the database
            entity.Ignore(e => e.CognitoUserPoolId);
            entity.Ignore(e => e.CognitoUserPoolClientId);
            entity.Ignore(e => e.CognitoUserPoolDomain);

            // Clinic properties don't exist in database yet
            entity.Ignore(e => e.Description);
            entity.Ignore(e => e.Address);
            entity.Ignore(e => e.City);
            entity.Ignore(e => e.State);
            entity.Ignore(e => e.ZipCode);
            entity.Ignore(e => e.Country);
            entity.Ignore(e => e.Phone);
            entity.Ignore(e => e.Email);
            entity.Ignore(e => e.IsActive);

            // Query filter for soft deletes
            entity.HasQueryFilter(e => e.DeletedAt == null);
        });

        // User configuration
        // Run sql/migrations/001_add_user_columns.sql to add missing columns
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();
            entity.HasIndex(e => e.CognitoSub).IsUnique();

            // Map to actual DB column names
            entity.Property(e => e.CognitoSub).HasColumnName("cognito_id");
            entity.Property(e => e.UserType).HasConversion<string>().HasColumnName("role");
            
            // JSON columns
            entity.Property(e => e.Preferences)
                .HasConversion(jsonConverter).HasColumnName("metadata");
            entity.Property(e => e.Consent)
                .HasConversion(jsonConverter);
            entity.Property(e => e.Roles)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            // Query filter for soft deletes and tenant isolation
            entity.HasQueryFilter(e => e.DeletedAt == null && e.TenantId == GetTenantId());
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

        // IntakeSubmission configuration
        modelBuilder.Entity<IntakeSubmission>(entity =>
        {
            entity.ToTable("intake_submissions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.FormData)
                .HasConversion(jsonConverter)
                .Metadata.SetValueComparer(jsonComparer);

            entity.HasOne(e => e.Evaluation)
                .WithMany()
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

            entity.HasOne(e => e.ServiceType)
                .WithMany()
                .HasForeignKey(e => e.ServiceTypeId)
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
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>())
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
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>())
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

        // InboxItem configuration
        modelBuilder.Entity<InboxItem>(entity =>
        {
            entity.ToTable("inbox_items");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.Status });
            entity.HasIndex(e => new { e.UserId, e.ReceivedAt });

            entity.Property(e => e.ItemType).HasConversion<string>();
            entity.Property(e => e.Priority).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();

            entity.Property(e => e.Labels)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, object>(), (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>())
                .Metadata.SetValueComparer(jsonComparer);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Message)
                .WithMany()
                .HasForeignKey(e => e.MessageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Document)
                .WithMany()
                .HasForeignKey(e => e.DocumentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.FromUser)
                .WithMany()
                .HasForeignKey(e => e.FromUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // OcrJob configuration
        modelBuilder.Entity<OcrJob>(entity =>
        {
            entity.ToTable("ocr_jobs");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Status, e.NextAttemptAt });
            entity.HasIndex(e => new { e.TenantId, e.Status });
            entity.HasIndex(e => e.DocumentId);

            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(e => e.Document)
                .WithMany()
                .HasForeignKey(e => e.DocumentId)
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
            entity.Property(e => e.Status).HasConversion<string>().HasColumnName("status");
            entity.HasIndex(e => new { e.TenantId, e.Key, e.Version }).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();
            entity.HasIndex(e => e.InstrumentId);
            entity.HasIndex(e => e.Status);
            
            // Ignore the obsolete IsActive property - use Status instead
            entity.Ignore(e => e.IsActive);

            // Configure the Questions property with a custom converter
            var questionsConverter = new ValueConverter<List<Dictionary<string, object>>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Dictionary<string, object>>>(v, (JsonSerializerOptions?)null) ?? new List<Dictionary<string, object>>()
            );

            entity.Property(e => e.Questions).HasConversion(questionsConverter);
            entity.Property(e => e.ScoringMethod).HasConversion(jsonConverter);
            entity.Property(e => e.ScoringRules).HasConversion(jsonConverter).HasColumnName("scoring_rules");

            // New fields for PROM infrastructure
            entity.Property(e => e.Tags)
                .HasConversion(stringListConverter)
                .Metadata.SetValueComparer(stringListComparer);
            entity.Property(e => e.FrequencyHint).HasMaxLength(200);

            entity.HasOne(e => e.Instrument)
                .WithMany(i => i.Templates)
                .HasForeignKey(e => e.InstrumentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // PromInstance configuration
        modelBuilder.Entity<PromInstance>(entity =>
        {
            entity.ToTable("prom_instances");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            entity.HasIndex(e => e.TreatmentPlanId);
            entity.Property(e => e.ResponseData).HasConversion(jsonConverter);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.InstanceType).HasConversion<string>();

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Template)
                .WithMany(i => i.Instances)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);

            // Treatment plan link for device outcome tracking
            entity.HasOne(e => e.TreatmentPlan)
                .WithMany()
                .HasForeignKey(e => e.TreatmentPlanId)
                .OnDelete(DeleteBehavior.SetNull);

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

        // ==========================================
        // NEW PROM INFRASTRUCTURE ENTITIES
        // ==========================================

        // Instrument (PROM catalogue) configuration
        modelBuilder.Entity<Instrument>(entity =>
        {
            entity.ToTable("instruments");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.IsGlobal });
            entity.HasIndex(e => e.ClinicalDomain);

            entity.Property(e => e.Key).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.InstrumentFamily).HasMaxLength(100);
            entity.Property(e => e.ClinicalDomain).HasMaxLength(100);
            entity.Property(e => e.LicenseType).HasConversion<string>();
            entity.Property(e => e.ReferenceUrl).HasMaxLength(500);

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            // Global instruments visible to all, tenant instruments only to that tenant
            entity.HasQueryFilter(e => e.IsActive && (e.IsGlobal || e.TenantId == GetTenantId()));
        });

        // TemplateQuestion configuration
        modelBuilder.Entity<TemplateQuestion>(entity =>
        {
            entity.ToTable("template_questions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TemplateId, e.QuestionKey }).IsUnique();
            entity.HasIndex(e => new { e.TemplateId, e.OrderIndex });
            entity.HasIndex(e => e.Code);
            entity.HasIndex(e => e.Section);

            entity.Property(e => e.QuestionKey).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Code).HasMaxLength(100);
            entity.Property(e => e.Label).HasMaxLength(500);
            entity.Property(e => e.Section).HasMaxLength(100);
            entity.Property(e => e.QuestionType).HasConversion<string>();
            entity.Property(e => e.ConfigJson).HasConversion(jsonConverter);

            entity.HasOne(e => e.Template)
                .WithMany(t => t.TemplateQuestions)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // SummaryScoreDefinition configuration
        var interpretationBandsConverter = new ValueConverter<List<InterpretationBand>?, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v) ? null : JsonSerializer.Deserialize<List<InterpretationBand>>(v, (JsonSerializerOptions?)null)
        );

        modelBuilder.Entity<SummaryScoreDefinition>(entity =>
        {
            entity.ToTable("summary_score_definitions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TemplateId, e.ScoreKey }).IsUnique();
            entity.HasIndex(e => new { e.TemplateId, e.OrderIndex });

            entity.Property(e => e.ScoreKey).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Label).HasMaxLength(200);
            entity.Property(e => e.ScoringMethod).HasConversion<string>();
            entity.Property(e => e.InterpretationBands).HasConversion(interpretationBandsConverter);
            entity.Property(e => e.ExternalSource).HasMaxLength(100);
            entity.Property(e => e.LookupTableName).HasMaxLength(100);

            entity.HasOne(e => e.Template)
                .WithMany(t => t.SummaryScoreDefinitions)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // SummaryScoreQuestionMapping configuration
        modelBuilder.Entity<SummaryScoreQuestionMapping>(entity =>
        {
            entity.ToTable("summary_score_question_mappings");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SummaryScoreDefinitionId, e.TemplateQuestionId }).IsUnique();

            entity.HasOne(e => e.SummaryScoreDefinition)
                .WithMany(s => s.QuestionMappings)
                .HasForeignKey(e => e.SummaryScoreDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.TemplateQuestion)
                .WithMany(q => q.ScoreMappings)
                .HasForeignKey(e => e.TemplateQuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PromItemResponse configuration
        var multiSelectValuesConverter = new ValueConverter<List<string>?, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v) ? null : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null)
        );

        modelBuilder.Entity<PromItemResponse>(entity =>
        {
            entity.ToTable("prom_item_responses");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.InstanceId, e.TemplateQuestionId }).IsUnique();
            entity.HasIndex(e => e.QuestionCode);
            entity.HasIndex(e => new { e.TenantId, e.QuestionCode, e.CreatedAt });

            entity.Property(e => e.QuestionCode).HasMaxLength(100);
            entity.Property(e => e.ValueRaw).HasMaxLength(2000);
            entity.Property(e => e.ValueDisplay).HasMaxLength(500);
            entity.Property(e => e.MultiSelectValues).HasConversion(multiSelectValuesConverter);

            entity.HasOne(e => e.Instance)
                .WithMany(i => i.ItemResponses)
                .HasForeignKey(e => e.InstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.TemplateQuestion)
                .WithMany(q => q.ItemResponses)
                .HasForeignKey(e => e.TemplateQuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // PromSummaryScore configuration
        modelBuilder.Entity<PromSummaryScore>(entity =>
        {
            entity.ToTable("prom_summary_scores");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.InstanceId, e.ScoreKey }).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.ScoreKey, e.CreatedAt });
            entity.HasIndex(e => e.DefinitionId);

            entity.Property(e => e.ScoreKey).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Label).HasMaxLength(200);
            entity.Property(e => e.InterpretationBand).HasMaxLength(100);
            entity.Property(e => e.Severity).HasMaxLength(50);

            entity.HasOne(e => e.Instance)
                .WithMany(i => i.SummaryScores)
                .HasForeignKey(e => e.InstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Definition)
                .WithMany(d => d.CalculatedScores)
                .HasForeignKey(e => e.DefinitionId)
                .OnDelete(DeleteBehavior.SetNull);

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

        // PatientInvitation configuration
        modelBuilder.Entity<PatientInvitation>(entity =>
        {
            entity.ToTable("patient_invitations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.UserId });
            entity.HasIndex(e => new { e.TenantId, e.Email });
            entity.HasIndex(e => new { e.TenantId, e.Status });

            entity.Property(e => e.Token).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(254).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.PersonalMessage).HasMaxLength(1000);
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Evaluation)
                .WithMany()
                .HasForeignKey(e => e.EvaluationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        ConfigureMedicalRecords(modelBuilder);
        ConfigureProviderScheduling(modelBuilder);
        ConfigureAdminAuditLog(modelBuilder, jsonComparer, jsonConverter);
        ConfigureResearchPartner(modelBuilder, jsonComparer, jsonConverter);
    }

    private void ConfigureAdminAuditLog(ModelBuilder modelBuilder, ValueComparer<Dictionary<string, object>> jsonComparer, ValueConverter<Dictionary<string, object>, string> jsonConverter)
    {
        modelBuilder.Entity<AdminAuditLog>(entity =>
        {
            entity.ToTable("admin_audit_logs");
            entity.HasKey(e => e.Id);

            // Indexes for efficient querying
            entity.HasIndex(e => e.AdminUserId);
            entity.HasIndex(e => new { e.ResourceType, e.ResourceId });
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Action);

            entity.Property(e => e.Action).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ResourceType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.AdminUserId).HasMaxLength(255).IsRequired();
            entity.Property(e => e.AdminEmail).HasMaxLength(255);
            entity.Property(e => e.ResourceName).HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.CorrelationId).HasMaxLength(100);
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);

            // JSON columns for state snapshots
            entity.Property(e => e.PreviousState).HasColumnType("jsonb");
            entity.Property(e => e.NewState).HasColumnType("jsonb");
            entity.Property(e => e.Metadata).HasColumnType("jsonb");
        });
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
            // 1. Try from HttpContext.Items (set by TenantMiddleware from X-Tenant-Id header)
            if (_httpContextAccessor.HttpContext.Items.TryGetValue("TenantId", out var itemTenantId) && itemTenantId is Guid tenantGuid)
            {
                _tenantId = tenantGuid;
            }
            // 2. Fallback to JWT claim
            else
            {
                var tenantClaim = _httpContextAccessor.HttpContext.User.FindFirst("tenant_id");
                if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var tenantId))
                {
                    _tenantId = tenantId;
                }
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
            entity.HasIndex(e => e.SourceEvaluationId);
            entity.Property(e => e.Status).HasConversion<string>();

            // Legacy JSONB columns with explicit converters
            entity.Property(e => e.Sessions)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<TreatmentSession>>(v, (JsonSerializerOptions?)null) ?? new List<TreatmentSession>());
            
            entity.Property(e => e.Exercises)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<Exercise>>(v, (JsonSerializerOptions?)null) ?? new List<Exercise>());

            // New JSONB columns for phase-based treatment
            entity.Property(e => e.Phases)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<TreatmentPhase>>(v, (JsonSerializerOptions?)null) ?? new List<TreatmentPhase>());
            
            entity.Property(e => e.Milestones)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<TreatmentMilestone>>(v, (JsonSerializerOptions?)null) ?? new List<TreatmentMilestone>());
            
            entity.Property(e => e.PromConfig)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<TreatmentPlanPromConfig>(v, (JsonSerializerOptions?)null));
            
            entity.Property(e => e.CheckIns)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<DailyCheckIn>>(v, (JsonSerializerOptions?)null) ?? new List<DailyCheckIn>());

            // Research partner device tracking - separate from PatientDeviceUsage.TreatmentPlanId
            entity.HasOne(e => e.LinkedDeviceUsage)
                .WithMany()
                .HasForeignKey(e => e.LinkedDeviceUsageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(e => e.DeletedAt == null && e.TenantId == GetTenantId());
        });

        // ExerciseTemplate configuration
        modelBuilder.Entity<ExerciseTemplate>(entity =>
        {
            entity.ToTable("exercise_templates");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Category, e.BodyRegion });
            entity.HasIndex(e => new { e.TenantId, e.Name });
            entity.HasIndex(e => e.IsSystemExercise);

            entity.Property(e => e.Difficulty).HasConversion<string>();
            entity.Property(e => e.TargetConditions).HasColumnType("jsonb");
            entity.Property(e => e.Contraindications).HasColumnType("jsonb");
            entity.Property(e => e.Equipment).HasColumnType("jsonb");
            entity.Property(e => e.Tags).HasColumnType("jsonb");

            // Filter to show system exercises OR tenant-specific exercises
            entity.HasQueryFilter(e => e.IsActive && (e.IsSystemExercise || e.TenantId == GetTenantId()));
        });
    }

    private void ConfigureProviderScheduling(ModelBuilder modelBuilder)
    {
        // ProviderSchedule - weekly recurring schedule
        modelBuilder.Entity<ProviderSchedule>(entity =>
        {
            entity.ToTable("provider_schedules");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ProviderId, e.DayOfWeek }).IsUnique();

            entity.Property(e => e.DayOfWeek).HasConversion<int>();
            entity.Property(e => e.StartTime).HasMaxLength(5);
            entity.Property(e => e.EndTime).HasMaxLength(5);
            entity.Property(e => e.BreakStartTime).HasMaxLength(5);
            entity.Property(e => e.BreakEndTime).HasMaxLength(5);

            entity.HasOne(e => e.Provider)
                .WithMany()
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // ProviderTimeOff - vacation, sick leave, blocked time
        modelBuilder.Entity<ProviderTimeOff>(entity =>
        {
            entity.ToTable("provider_time_offs");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ProviderId, e.StartDateTime, e.EndDateTime });

            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.RecurrencePattern).HasConversion<string>();

            entity.HasOne(e => e.Provider)
                .WithMany()
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // ProviderScheduleOverride - specific date overrides
        modelBuilder.Entity<ProviderScheduleOverride>(entity =>
        {
            entity.ToTable("provider_schedule_overrides");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.ProviderId, e.Date }).IsUnique();

            entity.Property(e => e.StartTime).HasMaxLength(5);
            entity.Property(e => e.EndTime).HasMaxLength(5);
            entity.Property(e => e.Reason).HasMaxLength(500);

            entity.HasOne(e => e.Provider)
                .WithMany()
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });
    }

    private void ConfigureResearchPartner(ModelBuilder modelBuilder, ValueComparer<Dictionary<string, object>> jsonComparer, ValueConverter<Dictionary<string, object>, string> jsonConverter)
    {
        var nullableJsonConverter = new ValueConverter<Dictionary<string, object>?, string>(
            v => v == null ? "{}" : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v) || v == "{}" ? null : JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null)
        );

        // ResearchPartner configuration
        modelBuilder.Entity<ResearchPartner>(entity =>
        {
            entity.ToTable("research_partners");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.Name);

            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ContactEmail).HasMaxLength(255);
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Website).HasMaxLength(200);
            entity.Property(e => e.CognitoUserPoolId).HasMaxLength(100);
        });

        // PartnerClinicAffiliation configuration
        modelBuilder.Entity<PartnerClinicAffiliation>(entity =>
        {
            entity.ToTable("partner_clinic_affiliations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.PartnerId, e.TenantId }).IsUnique();
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.DataSharingLevel).HasConversion<string>();
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.ClinicAffiliations)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ApprovedByUser)
                .WithMany()
                .HasForeignKey(e => e.ApprovedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ResearchStudy configuration
        modelBuilder.Entity<ResearchStudy>(entity =>
        {
            entity.ToTable("research_studies");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ProtocolId);

            entity.Property(e => e.Title).HasMaxLength(300).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.ProtocolId).HasMaxLength(100);
            entity.Property(e => e.Status).HasConversion<string>();

            entity.Property(e => e.InclusionCriteria)
                .HasColumnType("jsonb")
                .HasConversion(nullableJsonConverter);

            entity.Property(e => e.ExclusionCriteria)
                .HasColumnType("jsonb")
                .HasConversion(nullableJsonConverter);

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.Studies)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // StudyEnrollment configuration
        modelBuilder.Entity<StudyEnrollment>(entity =>
        {
            entity.ToTable("study_enrollments");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.StudyId, e.PatientId }).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.ConsentVersion).HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(e => e.Study)
                .WithMany(s => s.Enrollments)
                .HasForeignKey(e => e.StudyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // MedicalDevice configuration
        modelBuilder.Entity<MedicalDevice>(entity =>
        {
            entity.ToTable("medical_devices");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => new { e.PartnerId, e.DeviceCode }).IsUnique();
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.BodyRegion);

            entity.Property(e => e.Name).HasMaxLength(300).IsRequired();
            entity.Property(e => e.DeviceCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.BodyRegion).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.UdiCode).HasMaxLength(100);

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.Devices)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PatientDeviceUsage configuration
        modelBuilder.Entity<PatientDeviceUsage>(entity =>
        {
            entity.ToTable("patient_device_usages");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            entity.HasIndex(e => e.DeviceId);
            entity.HasIndex(e => e.ProcedureDate);
            entity.HasIndex(e => new { e.TenantId, e.DeviceId, e.ProcedureDate });

            entity.Property(e => e.ProcedureType).HasMaxLength(300);
            entity.Property(e => e.ImplantLocation).HasMaxLength(100);
            entity.Property(e => e.Notes).HasMaxLength(1000);

            entity.HasOne(e => e.Device)
                .WithMany(d => d.UsageRecords)
                .HasForeignKey(e => e.DeviceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Appointment)
                .WithMany()
                .HasForeignKey(e => e.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.TreatmentPlan)
                .WithMany()
                .HasForeignKey(e => e.TreatmentPlanId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.RecordedByUser)
                .WithMany()
                .HasForeignKey(e => e.RecordedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Baseline PROM link for outcome tracking
            entity.HasOne(e => e.BaselinePromInstance)
                .WithMany()
                .HasForeignKey(e => e.BaselinePromInstanceId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.BaselinePromType).HasMaxLength(50);

            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
        });

        // ServiceType configuration
        modelBuilder.Entity<ServiceType>(entity =>
        {
            entity.ToTable("service_types");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Specialty).HasMaxLength(100);
            entity.Property(e => e.Price).HasPrecision(10, 2);
            entity.Property(e => e.BillingCode).HasMaxLength(50);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.Specialty, e.Name });
            entity.HasQueryFilter(e => e.TenantId == GetTenantId());
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
