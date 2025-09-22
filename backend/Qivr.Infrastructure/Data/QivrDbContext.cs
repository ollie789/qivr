using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Qivr.Core.Common;
using Qivr.Core.Entities;
using System.Text.Json;

namespace Qivr.Infrastructure.Data;

public class QivrDbContext : DbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private Guid? _tenantId;
    private string? _userId;

    public QivrDbContext(DbContextOptions<QivrDbContext> options, IHttpContextAccessor? httpContextAccessor = null) 
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
        ExtractTenantAndUser();
    }

    // DbSets
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Clinic> Clinics => Set<Clinic>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<Evaluation> Evaluations => Set<Evaluation>();
    public DbSet<PainMap> PainMaps => Set<PainMap>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<BrandTheme> BrandThemes => Set<BrandTheme>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<PromResponse> PromResponses => Set<PromResponse>();
    public DbSet<PromInstance> PromInstances => Set<PromInstance>();
    public DbSet<PromTemplate> PromTemplates => Set<PromTemplate>();
    public DbSet<NotificationPreferences> NotificationPreferences => Set<NotificationPreferences>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Set default schema
        modelBuilder.HasDefaultSchema("qivr");
        
        // Configure value converters for complex types
        var jsonConverter = new ValueConverter<Dictionary<string, object>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>()
        );
        
        var stringListConverter = new ValueConverter<List<string>, string[]>(
            v => v.ToArray(),
            v => v.ToList()
        );

        // Tenant configuration
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Settings).HasConversion(jsonConverter);
            entity.Property(e => e.Metadata).HasConversion(jsonConverter);
            entity.HasQueryFilter(e => e.DeletedAt == null);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();
            entity.HasIndex(e => e.CognitoSub).IsUnique();
            entity.Property(e => e.Roles).HasConversion(stringListConverter);
            entity.Property(e => e.Preferences).HasConversion(jsonConverter);
            entity.Property(e => e.Consent).HasConversion(jsonConverter);
            entity.Property(e => e.UserType).HasConversion<string>();
            
            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.DeletedAt == null && e.TenantId == _tenantId);
        });

        // Evaluation configuration
        modelBuilder.Entity<Evaluation>(entity =>
        {
            entity.ToTable("evaluations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.EvaluationNumber }).IsUnique();
            entity.Property(e => e.Symptoms).HasConversion(stringListConverter);
            entity.Property(e => e.AiRiskFlags).HasConversion(stringListConverter);
            entity.Property(e => e.MedicalHistory).HasConversion(jsonConverter);
            entity.Property(e => e.QuestionnaireResponses).HasConversion(jsonConverter);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
        });

        // Appointment configuration
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("appointments");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProviderId, e.ScheduledStart, e.ScheduledEnd })
                .IsUnique()
                .HasDatabaseName("no_double_booking");
            entity.Property(e => e.LocationDetails).HasConversion(jsonConverter);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.LocationType).HasConversion<string>();
            
            entity.HasOne(e => e.Patient)
                .WithMany(u => u.PatientAppointments)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Provider)
                .WithMany(u => u.ProviderAppointments)
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(e => e.Evaluation)
                .WithMany(ev => ev.Appointments)
                .HasForeignKey(e => e.EvaluationId)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasOne(e => e.CancelledByUser)
                .WithMany()
                .HasForeignKey(e => e.CancelledBy)
                .OnDelete(DeleteBehavior.SetNull);
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
        });

        // BrandTheme configuration
        modelBuilder.Entity<BrandTheme>(entity =>
        {
            entity.ToTable("brand_themes");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();
            entity.Property(e => e.Typography).HasConversion(jsonConverter);
            entity.Property(e => e.WidgetConfig).HasConversion(jsonConverter);
            
            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.BrandThemes)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
        });

        // Document configuration
        modelBuilder.Entity<Document>(entity =>
        {
            entity.ToTable("documents");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PatientId });
            
            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
        });

        // Message configuration
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ConversationId, e.SentAt });
            entity.HasIndex(e => new { e.SenderId, e.DirectRecipientId });
            
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
        });

        // PromTemplate configuration
        modelBuilder.Entity<PromTemplate>(entity =>
        {
            entity.ToTable("prom_templates");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();
            
            // Configure the Questions property with a custom converter
            var questionsConverter = new ValueConverter<List<Dictionary<string, object>>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Dictionary<string, object>>>(v, (JsonSerializerOptions?)null) ?? new List<Dictionary<string, object>>()
            );
            
            entity.Property(e => e.Questions).HasConversion(questionsConverter);
            entity.Property(e => e.ScoringMethod).HasConversion(jsonConverter);
            
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
        });
        
        // Clinic configuration
        modelBuilder.Entity<Clinic>(entity =>
        {
            entity.ToTable("clinics");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Name });
            entity.Property(e => e.Metadata).HasConversion(jsonConverter);
            
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
        });
        
        // Provider configuration
        modelBuilder.Entity<Provider>(entity =>
        {
            entity.ToTable("providers");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.ClinicId });
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Clinic)
                .WithMany(c => c.Providers)
                .HasForeignKey(e => e.ClinicId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
                
            entity.HasQueryFilter(e => e.TenantId == _tenantId);
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
}
