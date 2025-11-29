using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;

namespace Qivr.Infrastructure.Data;

public class DataSeeder
{
    private readonly QivrDbContext _context;

    public DataSeeder(QivrDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        // Always seed exercise library (idempotent)
        await SeedExerciseLibraryAsync();

        // Skip if data already exists
        if (await _context.Tenants.AnyAsync())
        {
            // Update existing tenant with sample data if needed
            await SeedSampleDataForExistingTenant();
            return;
        }

        // Create test clinics (SaaS User Pools will be created later via API)
        var clinic1 = await CreateTestClinic("Demo Physio Clinic", "demo@qivr.pro");
        var clinic2 = await CreateTestClinic("Test Health Center", "test@qivr.pro");

        // Create system roles
        await CreateSystemRoles();

        // Create test users for each clinic
        await CreateTestUsers(clinic1.Id, "demo@qivr.pro");
        await CreateTestUsers(clinic2.Id, "test@qivr.pro");

        // Add sample data for analytics
        await SeedSampleAnalyticsData(clinic1.Id);

        await _context.SaveChangesAsync();
    }

    private async Task SeedSampleDataForExistingTenant()
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id.ToString() == "tenant_qivr_demo");
        if (tenant != null)
        {
            await SeedSampleAnalyticsData(tenant.Id);
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedSampleAnalyticsData(Guid tenantId)
    {
        // Skip if sample data already exists
        if (await _context.Users.AnyAsync(u => u.Email == "dr.sarah.johnson@clinic.com"))
            return;

        // Create sample appointments and provider data using the same structure as the working endpoints
        // This matches the CreateProviderDto structure used by /api/clinic-management/providers

        // Note: We'll create the data directly since the DataSeeder runs before the API is available
        // But we'll use the same entity relationships that the working provider creation uses

        // Create sample patient users for appointments
        var patientUsers = new[]
        {
            new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "patient1@example.com", FirstName = "John", LastName = "Doe", CreatedAt = DateTime.UtcNow },
            new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "patient2@example.com", FirstName = "Jane", LastName = "Smith", CreatedAt = DateTime.UtcNow },
            new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "patient3@example.com", FirstName = "Bob", LastName = "Wilson", CreatedAt = DateTime.UtcNow },
            new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "patient4@example.com", FirstName = "Alice", LastName = "Brown", CreatedAt = DateTime.UtcNow },
            new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "patient5@example.com", FirstName = "Charlie", LastName = "Davis", CreatedAt = DateTime.UtcNow }
        };
        _context.Users.AddRange(patientUsers);

        // Create sample provider user
        var providerUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "dr.sarah.johnson@clinic.com",
            FirstName = "Dr. Sarah",
            LastName = "Johnson",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(providerUser);
        await _context.SaveChangesAsync(); // Save to get the user IDs

        // Create provider profile using the same structure as the working endpoint
        var provider = new Provider
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = providerUser.Id,
            Title = "MD",
            Specialty = "General Practice",
            LicenseNumber = "MD123456",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Providers.Add(provider);
        await _context.SaveChangesAsync(); // Save to get the provider ID

        // Create sample appointments using the correct entity structure
        var appointments = new[]
        {
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientUsers[0].Id,
                ProviderId = providerUser.Id,  // User ID of the provider
                ProviderProfileId = provider.Id,  // Provider entity ID
                ScheduledStart = DateTime.UtcNow.AddDays(-2).AddHours(9),
                ScheduledEnd = DateTime.UtcNow.AddDays(-2).AddHours(9.5),
                Status = AppointmentStatus.Completed,
                AppointmentType = "Consultation",
                Notes = "Regular checkup completed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientUsers[1].Id,
                ProviderId = providerUser.Id,  // User ID of the provider
                ProviderProfileId = provider.Id,  // Provider entity ID
                ScheduledStart = DateTime.UtcNow.AddDays(-2).AddHours(14.5),
                ScheduledEnd = DateTime.UtcNow.AddDays(-2).AddHours(14.75),
                Status = AppointmentStatus.Completed,
                AppointmentType = "Follow-up",
                Notes = "Follow-up visit completed",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientUsers[2].Id,
                ProviderId = providerUser.Id,  // User ID of the provider
                ProviderProfileId = provider.Id,  // Provider entity ID
                ScheduledStart = DateTime.UtcNow.AddDays(-1).AddHours(10.25),
                ScheduledEnd = DateTime.UtcNow.AddDays(-1).AddHours(10.75),
                Status = AppointmentStatus.NoShow,
                AppointmentType = "Consultation",
                Notes = "Patient did not show up",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientUsers[3].Id,
                ProviderId = providerUser.Id,  // User ID of the provider
                ProviderProfileId = provider.Id,  // Provider entity ID
                ScheduledStart = DateTime.UtcNow.AddHours(11),
                ScheduledEnd = DateTime.UtcNow.AddHours(11.5),
                Status = AppointmentStatus.Scheduled,
                AppointmentType = "Consultation",
                Notes = "Upcoming appointment",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Appointment
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientUsers[4].Id,
                ProviderId = providerUser.Id,  // User ID of the provider
                ProviderProfileId = provider.Id,  // Provider entity ID
                ScheduledStart = DateTime.UtcNow.AddHours(15.5),
                ScheduledEnd = DateTime.UtcNow.AddHours(15.75),
                Status = AppointmentStatus.Scheduled,
                AppointmentType = "Follow-up",
                Notes = "Upcoming follow-up",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Appointments.AddRange(appointments);
    }

    private async Task<Tenant> CreateTestClinic(string name, string email)
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = name.ToLower().Replace(" ", "-"),
            Status = TenantStatus.Active,
            CreatedAt = DateTime.UtcNow,
            Address = "123 Healthcare Ave, Medical District, City 12345",
            Phone = "+1-555-CLINIC",
            Email = email,
            Settings = new Dictionary<string, object>
            {
                ["theme"] = "default",
                ["features"] = new[] { "appointments", "patients", "analytics" },
                ["operations"] = new Dictionary<string, object>
                {
                    ["workingHours"] = new Dictionary<string, object>
                    {
                        ["monday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["tuesday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["wednesday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["thursday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["friday"] = new { start = "09:00", end = "17:00", enabled = true },
                        ["saturday"] = new { start = "09:00", end = "13:00", enabled = false },
                        ["sunday"] = new { start = "09:00", end = "13:00", enabled = false }
                    },
                    ["appointmentDuration"] = 30,
                    ["bufferTime"] = 15,
                    ["maxAdvanceBooking"] = 90,
                    ["allowOnlineBooking"] = true,
                    ["requireConfirmation"] = true,
                    ["sendReminders"] = true,
                    ["reminderHours"] = 24
                }
            }
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        return tenant;
    }

    private async Task CreateSystemRoles()
    {
        var roles = new[]
        {
            new Role { Id = Guid.NewGuid(), Name = "Admin", Description = "System Administrator", IsSystem = true },
            new Role { Id = Guid.NewGuid(), Name = "Clinician", Description = "Healthcare Provider", IsSystem = true },
            new Role { Id = Guid.NewGuid(), Name = "Receptionist", Description = "Front Desk Staff", IsSystem = true }
        };

        _context.Roles.AddRange(roles);
    }

    private async Task CreateTestUsers(Guid tenantId, string email)
    {
        var adminRole = await _context.Roles.FirstAsync(r => r.Name == "Admin" && r.IsSystem);
        
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = email,
            FirstName = "Test",
            LastName = "User",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        
        // Assign admin role
        _context.UserRoles.Add(new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RoleId = adminRole.Id,
            TenantId = tenantId,
            AssignedAt = DateTime.UtcNow
        });
    }

    private async Task SeedExerciseLibraryAsync()
    {
        // Skip if exercises already seeded
        if (await _context.ExerciseTemplates.IgnoreQueryFilters().AnyAsync(e => e.IsSystemExercise))
            return;

        var exercises = GetSystemExercises();
        _context.ExerciseTemplates.AddRange(exercises);
        await _context.SaveChangesAsync();
    }

    private List<ExerciseTemplate> GetSystemExercises()
    {
        var now = DateTime.UtcNow;
        var sortOrder = 0;

        return new List<ExerciseTemplate>
        {
            // === LOWER BACK EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Cat-Cow Stretch",
                Description = "A gentle flowing movement between two poses that warms up the spine and relieves tension in the lower back.",
                Instructions = "1. Start on hands and knees with wrists under shoulders and knees under hips\n2. Inhale, drop belly towards floor, lift chest and tailbone (Cow)\n3. Exhale, round spine towards ceiling, tuck chin to chest (Cat)\n4. Flow smoothly between positions\n5. Move with your breath",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "Daily",
                Category = "Mobility",
                BodyRegion = "Lower Back",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Lower back pain", "Spinal stiffness", "Postural issues" },
                Contraindications = new List<string> { "Acute disc herniation", "Severe spinal stenosis" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "spine", "flexibility", "warm-up", "mobility" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Bird Dog",
                Description = "Core stabilization exercise that improves balance and strengthens the lower back, glutes, and core muscles.",
                Instructions = "1. Start on hands and knees in tabletop position\n2. Keep spine neutral and core engaged\n3. Extend right arm forward and left leg back simultaneously\n4. Hold for 2-3 seconds, maintaining balance\n5. Return to start and switch sides\n6. Keep hips level throughout",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Lower Back",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Lower back pain", "Core weakness", "Balance issues" },
                Contraindications = new List<string> { "Acute back injury", "Severe wrist pain" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "core", "stability", "balance", "back" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Pelvic Tilts",
                Description = "Gentle exercise to mobilize the lower back and strengthen the deep abdominal muscles.",
                Instructions = "1. Lie on back with knees bent, feet flat on floor\n2. Place hands on hip bones\n3. Flatten lower back against floor by tilting pelvis up\n4. Hold for 3-5 seconds\n5. Release and allow natural curve to return\n6. Repeat in a controlled, rhythmic motion",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "Daily",
                Category = "Mobility",
                BodyRegion = "Lower Back",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Lower back pain", "Pelvic dysfunction", "Core weakness" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "pelvis", "core", "gentle", "beginner-friendly" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Knee-to-Chest Stretch",
                Description = "Stretches the lower back and glutes, helping to relieve tension and improve flexibility.",
                Instructions = "1. Lie on back with knees bent\n2. Bring one knee toward chest\n3. Hold behind thigh or shin with both hands\n4. Keep opposite leg bent with foot on floor\n5. Hold stretch for 20-30 seconds\n6. Switch legs and repeat",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "Daily",
                Category = "Stretching",
                BodyRegion = "Lower Back",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Lower back pain", "Hip tightness", "Sciatica" },
                Contraindications = new List<string> { "Recent hip replacement", "Acute disc herniation" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "stretch", "hip flexor", "glutes", "relaxation" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Bridge",
                Description = "Strengthens the glutes, hamstrings, and lower back while improving hip mobility.",
                Instructions = "1. Lie on back with knees bent, feet flat on floor hip-width apart\n2. Arms at sides, palms down\n3. Push through heels to lift hips toward ceiling\n4. Squeeze glutes at top\n5. Hold for 2-3 seconds\n6. Lower slowly with control",
                DefaultSets = 3,
                DefaultReps = 12,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Lower Back",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Lower back pain", "Weak glutes", "Hip dysfunction" },
                Contraindications = new List<string> { "Acute back spasm" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "glutes", "hips", "strength", "core" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Prone Press-Up (McKenzie Extension)",
                Description = "Extension exercise that can help centralize pain and restore lumbar lordosis.",
                Instructions = "1. Lie face down with hands beside shoulders\n2. Keep hips on floor throughout\n3. Push up through hands, lifting chest\n4. Extend arms as far as comfortable\n5. Hold briefly at top\n6. Lower slowly and repeat",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "Every 2 hours",
                Category = "Mobility",
                BodyRegion = "Lower Back",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Disc herniation", "Flexion-related back pain", "Loss of lumbar lordosis" },
                Contraindications = new List<string> { "Spinal stenosis", "Facet joint dysfunction", "Extension-aggravated pain" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "McKenzie", "extension", "disc", "centralization" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === NECK EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Chin Tucks",
                Description = "Strengthens deep neck flexors and improves posture by correcting forward head position.",
                Instructions = "1. Sit or stand with good posture\n2. Look straight ahead\n3. Draw chin back, creating a 'double chin'\n4. Keep eyes level - don't tilt head up or down\n5. Hold for 5-10 seconds\n6. Relax and repeat",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultHoldSeconds = 5,
                DefaultFrequency = "3x daily",
                Category = "Strengthening",
                BodyRegion = "Neck",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Neck pain", "Forward head posture", "Tech neck", "Cervical strain" },
                Contraindications = new List<string> { "Acute cervical radiculopathy" },
                Equipment = new List<string> { },
                Tags = new List<string> { "posture", "deep neck flexors", "cervical", "desk work" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Neck Side Bend Stretch",
                Description = "Stretches the upper trapezius and lateral neck muscles to relieve tension.",
                Instructions = "1. Sit or stand with good posture\n2. Tilt head toward right shoulder\n3. Place right hand gently on head for light overpressure\n4. Keep opposite shoulder down\n5. Hold for 20-30 seconds\n6. Switch sides",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "2x daily",
                Category = "Stretching",
                BodyRegion = "Neck",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Neck tension", "Upper trap tightness", "Headaches" },
                Contraindications = new List<string> { "Cervical instability", "Recent whiplash" },
                Equipment = new List<string> { },
                Tags = new List<string> { "stretch", "trapezius", "lateral flexion", "tension relief" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Levator Scapulae Stretch",
                Description = "Targets the levator scapulae muscle, a common source of neck and upper back tension.",
                Instructions = "1. Sit with good posture\n2. Turn head 45 degrees to the right\n3. Drop chin toward right armpit\n4. Place right hand on back of head for gentle overpressure\n5. Hold for 20-30 seconds\n6. Switch sides",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "2x daily",
                Category = "Stretching",
                BodyRegion = "Neck",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Neck pain", "Upper back tension", "Shoulder blade pain" },
                Contraindications = new List<string> { "Cervical radiculopathy", "Severe osteoporosis" },
                Equipment = new List<string> { },
                Tags = new List<string> { "stretch", "levator scapulae", "upper back", "scapula" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === SHOULDER EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Pendulum Exercise",
                Description = "Gentle mobilization exercise for the shoulder that uses gravity to create movement.",
                Instructions = "1. Lean forward, supporting yourself with non-affected arm on table\n2. Let affected arm hang freely\n3. Gently swing arm in small circles\n4. Gradually increase circle size\n5. Reverse direction\n6. Can also swing front-to-back and side-to-side",
                DefaultSets = 3,
                DefaultReps = 20,
                DefaultFrequency = "3x daily",
                Category = "Mobility",
                BodyRegion = "Shoulder",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Frozen shoulder", "Post-surgical shoulder", "Rotator cuff injury", "Shoulder stiffness" },
                Contraindications = new List<string> { "Shoulder dislocation (acute)", "Severe rotator cuff tear" },
                Equipment = new List<string> { "Table or chair" },
                Tags = new List<string> { "gentle", "mobilization", "post-op", "range of motion" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "External Rotation with Band",
                Description = "Strengthens the external rotators of the shoulder, crucial for rotator cuff health.",
                Instructions = "1. Stand with elbow bent 90 degrees at side\n2. Hold resistance band with both hands\n3. Keep elbow pinned to side\n4. Rotate forearm outward against resistance\n5. Control the return to starting position\n6. Keep wrist neutral throughout",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Shoulder",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Rotator cuff weakness", "Shoulder impingement", "Shoulder instability" },
                Contraindications = new List<string> { "Acute rotator cuff tear", "Severe shoulder pain" },
                Equipment = new List<string> { "Resistance band" },
                Tags = new List<string> { "rotator cuff", "external rotation", "band", "stability" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Wall Angels",
                Description = "Improves shoulder mobility and scapular control while promoting better posture.",
                Instructions = "1. Stand with back flat against wall\n2. Arms in 'goal post' position (elbows bent 90°)\n3. Press entire arm against wall\n4. Slowly slide arms up overhead\n5. Return to starting position\n6. Keep lower back flat against wall throughout",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "Daily",
                Category = "Mobility",
                BodyRegion = "Shoulder",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "Shoulder stiffness", "Poor posture", "Thoracic kyphosis", "Scapular dyskinesis" },
                Contraindications = new List<string> { "Severe frozen shoulder", "Acute shoulder injury" },
                Equipment = new List<string> { "Wall" },
                Tags = new List<string> { "posture", "scapula", "mobility", "thoracic" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Sleeper Stretch",
                Description = "Stretches the posterior shoulder capsule, helpful for those with internal rotation deficit.",
                Instructions = "1. Lie on affected side with arm out in front\n2. Bend elbow to 90 degrees\n3. Use opposite hand to gently push forearm toward floor\n4. Keep shoulder blade flat against surface\n5. Hold for 30 seconds\n6. Should feel stretch in back of shoulder",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "Daily",
                Category = "Stretching",
                BodyRegion = "Shoulder",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "GIRD", "Posterior capsule tightness", "Throwing athlete", "Shoulder impingement" },
                Contraindications = new List<string> { "Shoulder instability", "Labral tear", "Acute shoulder injury" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "posterior capsule", "internal rotation", "sports", "overhead athlete" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === KNEE EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Quad Sets",
                Description = "Isometric exercise to activate and strengthen the quadriceps without moving the knee.",
                Instructions = "1. Sit or lie with leg straight\n2. Tighten thigh muscle by pressing knee down\n3. Push back of knee toward floor\n4. Hold for 5-10 seconds\n5. Relax completely\n6. Should see quad muscle contract",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultHoldSeconds = 10,
                DefaultFrequency = "3x daily",
                Category = "Strengthening",
                BodyRegion = "Knee",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Post-surgical knee", "Knee arthritis", "Patellofemoral pain", "ACL injury" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { "Exercise mat", "Rolled towel (optional)" },
                Tags = new List<string> { "isometric", "quadriceps", "post-op", "VMO" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Straight Leg Raise",
                Description = "Strengthens the quadriceps and hip flexors while keeping the knee protected.",
                Instructions = "1. Lie on back with one knee bent, other leg straight\n2. Tighten quad of straight leg (quad set first)\n3. Keeping knee locked, lift leg to height of bent knee\n4. Hold briefly at top\n5. Lower slowly with control\n6. Maintain quad contraction throughout",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Knee",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Post-surgical knee", "Knee arthritis", "Quad weakness", "ACL rehab" },
                Contraindications = new List<string> { "Hip flexor strain", "Acute hip pathology" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "quadriceps", "hip flexor", "SLR", "post-op" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Heel Slides",
                Description = "Improves knee flexion range of motion in a controlled, non-weight-bearing position.",
                Instructions = "1. Lie on back with legs straight\n2. Slowly slide heel toward buttock\n3. Bend knee as far as comfortable\n4. Hold briefly at end range\n5. Slide heel back to starting position\n6. Can use strap to assist if needed",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "3x daily",
                Category = "Mobility",
                BodyRegion = "Knee",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Post-surgical knee", "Knee stiffness", "TKR rehab", "ACL rehab" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { "Exercise mat", "Strap (optional)" },
                Tags = new List<string> { "range of motion", "flexion", "post-op", "knee replacement" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Terminal Knee Extension",
                Description = "Strengthens the quadriceps through the last degrees of knee extension.",
                Instructions = "1. Sit on edge of chair or table\n2. Place rolled towel under knee\n3. Straighten knee fully against towel resistance\n4. Hold at full extension for 3 seconds\n5. Lower slowly\n6. Focus on VMO (inner quad) activation",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Knee",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Patellofemoral pain", "ACL rehab", "VMO weakness", "Extension lag" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { "Chair", "Rolled towel" },
                Tags = new List<string> { "quadriceps", "VMO", "extension", "patellar tracking" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === HIP EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Clamshells",
                Description = "Strengthens the hip abductors, particularly the gluteus medius, important for hip stability.",
                Instructions = "1. Lie on side with knees bent 45 degrees\n2. Keep feet together\n3. Lift top knee while keeping feet touching\n4. Open like a clamshell\n5. Hold briefly at top\n6. Lower with control\n7. Don't let pelvis roll backward",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Hip",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Hip pain", "IT band syndrome", "Patellofemoral pain", "Hip bursitis" },
                Contraindications = new List<string> { "Recent hip replacement (follow precautions)" },
                Equipment = new List<string> { "Exercise mat", "Resistance band (optional)" },
                Tags = new List<string> { "glute med", "hip abductor", "stability", "runner" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Hip Flexor Stretch (Kneeling)",
                Description = "Stretches the hip flexors and psoas, often tight from prolonged sitting.",
                Instructions = "1. Kneel on one knee with other foot forward\n2. Keep torso upright\n3. Tuck tailbone under (posterior pelvic tilt)\n4. Shift weight forward until stretch is felt in front of back hip\n5. Hold for 30 seconds\n6. Can raise same-side arm overhead to increase stretch",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "2x daily",
                Category = "Stretching",
                BodyRegion = "Hip",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Hip flexor tightness", "Lower back pain", "Anterior pelvic tilt", "Prolonged sitting" },
                Contraindications = new List<string> { "Knee pain in kneeling position" },
                Equipment = new List<string> { "Exercise mat", "Cushion (optional)" },
                Tags = new List<string> { "stretch", "psoas", "hip flexor", "posture" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Piriformis Stretch",
                Description = "Stretches the piriformis muscle, which can contribute to sciatic-type symptoms when tight.",
                Instructions = "1. Lie on back with both knees bent\n2. Cross affected ankle over opposite knee\n3. Reach through and grasp behind thigh of bottom leg\n4. Pull thigh toward chest\n5. Hold for 30 seconds\n6. Should feel stretch deep in buttock",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "2x daily",
                Category = "Stretching",
                BodyRegion = "Hip",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Piriformis syndrome", "Sciatica", "Hip pain", "Gluteal tightness" },
                Contraindications = new List<string> { "Recent hip replacement" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "stretch", "piriformis", "sciatica", "glute" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Side-Lying Hip Abduction",
                Description = "Strengthens the hip abductors in a gravity-resisted position.",
                Instructions = "1. Lie on side with bottom knee bent for stability\n2. Keep top leg straight and in line with body\n3. Lift top leg toward ceiling\n4. Lead with heel, not toe\n5. Hold briefly at top\n6. Lower with control\n7. Don't let hip roll forward or back",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Hip",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Hip weakness", "IT band syndrome", "Hip bursitis", "Gait abnormality" },
                Contraindications = new List<string> { "Recent hip replacement (follow precautions)" },
                Equipment = new List<string> { "Exercise mat", "Ankle weights (optional)" },
                Tags = new List<string> { "glute med", "hip abductor", "TFL", "stability" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === ANKLE EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Ankle Alphabet",
                Description = "Improves ankle mobility in all planes by tracing letters with the foot.",
                Instructions = "1. Sit with leg elevated or hanging off edge\n2. Using ankle only, trace letters of the alphabet\n3. Move through full range of motion\n4. Keep leg still - only ankle moves\n5. Complete A-Z\n6. Can repeat 2-3 times",
                DefaultSets = 2,
                DefaultReps = 1,
                DefaultFrequency = "3x daily",
                Category = "Mobility",
                BodyRegion = "Ankle",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Ankle sprain", "Ankle stiffness", "Post-surgical ankle", "Ankle arthritis" },
                Contraindications = new List<string> { "Unstable fracture" },
                Equipment = new List<string> { },
                Tags = new List<string> { "range of motion", "mobility", "post-injury", "circulation" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Calf Raises",
                Description = "Strengthens the calf muscles (gastrocnemius and soleus) and Achilles tendon.",
                Instructions = "1. Stand with feet hip-width apart\n2. Hold onto support for balance if needed\n3. Rise up onto toes\n4. Hold briefly at top\n5. Lower slowly with control\n6. Progress to single leg when ready",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Ankle",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Achilles tendinopathy", "Calf weakness", "Plantar fasciitis", "Ankle instability" },
                Contraindications = new List<string> { "Acute Achilles rupture", "Acute calf strain" },
                Equipment = new List<string> { "Wall or chair for support" },
                Tags = new List<string> { "calf", "gastrocnemius", "Achilles", "plantarflexion" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Single Leg Balance",
                Description = "Improves proprioception and balance, essential for ankle stability.",
                Instructions = "1. Stand on one foot\n2. Keep knee slightly bent\n3. Focus on a fixed point ahead\n4. Hold for 30 seconds\n5. Progress by closing eyes\n6. Progress by standing on unstable surface",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "Daily",
                Category = "Balance",
                BodyRegion = "Ankle",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Ankle sprain", "Balance deficit", "Fall prevention", "Sports rehab" },
                Contraindications = new List<string> { "Severe balance impairment (use support)" },
                Equipment = new List<string> { "Balance pad (optional)" },
                Tags = new List<string> { "proprioception", "balance", "stability", "injury prevention" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === CORE EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Dead Bug",
                Description = "Core stabilization exercise that trains the deep core muscles while moving the limbs.",
                Instructions = "1. Lie on back with arms pointing to ceiling\n2. Lift legs with knees bent 90 degrees\n3. Press lower back into floor\n4. Slowly lower opposite arm and leg toward floor\n5. Return to start and switch sides\n6. Keep lower back pressed down throughout",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Core",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "Core weakness", "Lower back pain", "Poor stability", "Sports performance" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "core", "stability", "transverse abdominis", "anti-extension" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Plank",
                Description = "Isometric exercise that strengthens the entire core and teaches neutral spine stability.",
                Instructions = "1. Start in push-up position or on forearms\n2. Keep body in straight line from head to heels\n3. Engage core - don't let hips sag or pike up\n4. Keep neck neutral\n5. Hold for 20-60 seconds\n6. Breathe normally throughout",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Core",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "Core weakness", "Lower back pain", "Postural dysfunction", "Sports performance" },
                Contraindications = new List<string> { "Shoulder injury", "Wrist pain" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "core", "isometric", "stability", "full body" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Side Plank",
                Description = "Strengthens the lateral core muscles, particularly the obliques and quadratus lumborum.",
                Instructions = "1. Lie on side with elbow under shoulder\n2. Stack feet or stagger for stability\n3. Lift hips to create straight line from head to feet\n4. Keep hips stacked - don't rotate\n5. Hold for 20-45 seconds\n6. Can modify with bottom knee bent",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Core",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "Core weakness", "Lower back pain", "Scoliosis", "Hip drop gait" },
                Contraindications = new List<string> { "Shoulder injury" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "obliques", "QL", "lateral core", "stability" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === WRIST/HAND EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Wrist Flexor Stretch",
                Description = "Stretches the wrist flexor muscles, helpful for conditions like carpal tunnel and tennis elbow.",
                Instructions = "1. Extend arm in front with elbow straight\n2. Point fingers toward floor\n3. Use other hand to gently pull fingers back\n4. Hold for 30 seconds\n5. Should feel stretch on inner forearm\n6. Switch arms",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "2x daily",
                Category = "Stretching",
                BodyRegion = "Wrist",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Carpal tunnel", "Forearm tightness", "Medial epicondylitis", "Repetitive strain" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { },
                Tags = new List<string> { "stretch", "forearm", "flexor", "RSI" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Wrist Extensor Stretch",
                Description = "Stretches the wrist extensor muscles, important for tennis elbow and wrist pain.",
                Instructions = "1. Extend arm in front with elbow straight\n2. Point fingers toward ceiling\n3. Use other hand to gently push palm back\n4. Hold for 30 seconds\n5. Should feel stretch on outer forearm\n6. Switch arms",
                DefaultSets = 3,
                DefaultReps = 1,
                DefaultHoldSeconds = 30,
                DefaultFrequency = "2x daily",
                Category = "Stretching",
                BodyRegion = "Wrist",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Tennis elbow", "Lateral epicondylitis", "Wrist pain", "Repetitive strain" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { },
                Tags = new List<string> { "stretch", "forearm", "extensor", "tennis elbow" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Grip Strengthening",
                Description = "Strengthens the grip muscles using a stress ball or therapy putty.",
                Instructions = "1. Hold stress ball or therapy putty in palm\n2. Squeeze firmly for 3-5 seconds\n3. Release completely\n4. Repeat\n5. Can also pinch between fingers\n6. Progress resistance as able",
                DefaultSets = 3,
                DefaultReps = 15,
                DefaultHoldSeconds = 5,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Wrist",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Grip weakness", "Arthritis", "Post-surgical hand", "Carpal tunnel" },
                Contraindications = new List<string> { "Acute inflammation", "Recent hand surgery (check with surgeon)" },
                Equipment = new List<string> { "Stress ball", "Therapy putty" },
                Tags = new List<string> { "grip", "hand", "forearm", "functional" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Nerve Gliding (Median)",
                Description = "Gentle nerve mobilization exercise for the median nerve, helpful for carpal tunnel symptoms.",
                Instructions = "1. Start with arm at side, elbow bent, wrist neutral\n2. Slowly straighten elbow while extending wrist back\n3. Turn head away from the arm\n4. Hold briefly at end range\n5. Return to start position\n6. Movement should be smooth and controlled",
                DefaultSets = 2,
                DefaultReps = 10,
                DefaultFrequency = "2x daily",
                Category = "Mobility",
                BodyRegion = "Wrist",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "Carpal tunnel", "Median nerve entrapment", "Numbness in hand", "Tingling in fingers" },
                Contraindications = new List<string> { "Acute nerve injury", "Severe symptoms (consult physician)" },
                Equipment = new List<string> { },
                Tags = new List<string> { "nerve", "median", "carpal tunnel", "neural tension" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === THORACIC SPINE EXERCISES ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Thoracic Extension over Foam Roller",
                Description = "Improves thoracic spine extension and mobility, counteracting the effects of prolonged sitting.",
                Instructions = "1. Place foam roller perpendicular to spine at mid-back\n2. Support head with hands\n3. Keep buttocks on floor\n4. Extend back over roller\n5. Hold for 3 seconds\n6. Move roller to different segments and repeat",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "Daily",
                Category = "Mobility",
                BodyRegion = "Thoracic Spine",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "Thoracic kyphosis", "Upper back stiffness", "Posture issues", "Shoulder mobility deficit" },
                Contraindications = new List<string> { "Osteoporosis", "Spinal fracture" },
                Equipment = new List<string> { "Foam roller" },
                Tags = new List<string> { "thoracic", "extension", "posture", "mobility" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Thread the Needle",
                Description = "Rotational stretch for the thoracic spine that improves mobility and reduces stiffness.",
                Instructions = "1. Start on hands and knees\n2. Reach one arm under body toward opposite side\n3. Let shoulder and head follow, rotating thoracic spine\n4. Reach as far as comfortable\n5. Hold briefly at end range\n6. Return to start and switch sides",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "Daily",
                Category = "Mobility",
                BodyRegion = "Thoracic Spine",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Thoracic stiffness", "Rotational deficit", "Upper back pain", "Golf/sports performance" },
                Contraindications = new List<string> { "Shoulder impingement (modify as needed)" },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "rotation", "thoracic", "mobility", "warm-up" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },

            // === GENERAL/FUNCTIONAL ===
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Squat to Chair",
                Description = "Functional exercise that strengthens legs and improves sit-to-stand ability.",
                Instructions = "1. Stand in front of a sturdy chair\n2. Feet shoulder-width apart\n3. Slowly lower buttocks toward chair\n4. Keep weight in heels, knees behind toes\n5. Lightly touch chair (don't sit)\n6. Stand back up\n7. Progress by using lower chair or removing chair",
                DefaultSets = 3,
                DefaultReps = 12,
                DefaultFrequency = "Daily",
                Category = "Strengthening",
                BodyRegion = "Full Body",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Lower extremity weakness", "Fall prevention", "Functional decline", "Knee arthritis" },
                Contraindications = new List<string> { "Severe knee pain", "Balance impairment (use support)" },
                Equipment = new List<string> { "Sturdy chair" },
                Tags = new List<string> { "functional", "legs", "sit-to-stand", "ADL" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Step-Ups",
                Description = "Functional exercise for leg strength and balance, mimicking stair climbing.",
                Instructions = "1. Stand facing a step or sturdy platform\n2. Place one foot fully on step\n3. Push through heel to stand up on step\n4. Bring other foot up\n5. Step down with control\n6. Alternate leading leg",
                DefaultSets = 3,
                DefaultReps = 10,
                DefaultFrequency = "3x weekly",
                Category = "Strengthening",
                BodyRegion = "Full Body",
                Difficulty = DifficultyLevel.Intermediate,
                TargetConditions = new List<string> { "Lower extremity weakness", "Stair difficulty", "Sports rehab", "Functional training" },
                Contraindications = new List<string> { "Severe knee arthritis", "Balance impairment (use rail)" },
                Equipment = new List<string> { "Step or sturdy platform" },
                Tags = new List<string> { "functional", "stairs", "legs", "balance" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            },
            new ExerciseTemplate
            {
                Id = Guid.NewGuid(),
                Name = "Diaphragmatic Breathing",
                Description = "Teaches proper breathing mechanics using the diaphragm, reducing neck and shoulder tension.",
                Instructions = "1. Lie on back with knees bent\n2. Place one hand on chest, other on belly\n3. Breathe in through nose - belly should rise\n4. Chest should stay relatively still\n5. Exhale slowly through mouth\n6. Practice 5-10 minutes",
                DefaultSets = 1,
                DefaultReps = 10,
                DefaultFrequency = "2x daily",
                Category = "Mobility",
                BodyRegion = "Core",
                Difficulty = DifficultyLevel.Beginner,
                TargetConditions = new List<string> { "Neck tension", "Stress", "Poor breathing pattern", "Core dysfunction" },
                Contraindications = new List<string> { },
                Equipment = new List<string> { "Exercise mat" },
                Tags = new List<string> { "breathing", "relaxation", "diaphragm", "stress management" },
                IsSystemExercise = true,
                IsActive = true,
                SortOrder = sortOrder++,
                CreatedAt = now,
                UpdatedAt = now
            }
        };
    }
}
