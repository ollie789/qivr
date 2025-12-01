using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Services;

public interface IPatientRecordService
{
    Task<PatientRecord?> GetPatientRecordAsync(Guid tenantId, Guid patientId);
    Task UpdateDemographicsAsync(Guid tenantId, Guid patientId, PatientDemographics demographics);
    Task AddMedicalHistoryAsync(Guid tenantId, Guid patientId, MedicalHistory history);
    Task<VitalSign> RecordVitalSignsAsync(Guid tenantId, Guid patientId, VitalSign vitalSign);
    Task<List<VitalSign>> GetVitalSignsAsync(Guid tenantId, Guid patientId, DateTime? from, DateTime? to);
    Task<List<TimelineEvent>> GetPatientTimelineAsync(Guid tenantId, Guid patientId, int skip, int take);
    Task<PatientSummary> GetPatientSummaryAsync(Guid tenantId, Guid patientId);
}

public class PatientRecordService : IPatientRecordService
{
    private readonly QivrDbContext _db;
    private readonly ILogger<PatientRecordService> _logger;

    public PatientRecordService(QivrDbContext db, ILogger<PatientRecordService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PatientRecord?> GetPatientRecordAsync(Guid tenantId, Guid patientId)
    {
        // Get patient user info
        var patient = await _db.Users
            .Where(u => u.TenantId == tenantId && u.Id == patientId)
            .FirstOrDefaultAsync();

        if (patient == null) return null;

        // Get latest vital signs
        var vitalSignsSql = @"
            SELECT * FROM qivr.vital_signs 
            WHERE tenant_id = {0} AND patient_id = {1}
            ORDER BY recorded_at DESC
            LIMIT 5";
        
        var vitalSigns = await _db.Database.SqlQueryRaw<VitalSign>(vitalSignsSql, tenantId, patientId).ToListAsync();

        // Get recent appointments
        var appointments = await _db.Appointments
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId)
            .OrderByDescending(a => a.ScheduledStart)
            .Take(5)
            .Select(a => new AppointmentSummary
            {
                Id = a.Id,
                Date = a.ScheduledStart,
                Provider = a.Provider != null ? $"{a.Provider.FirstName} {a.Provider.LastName}" : "N/A",
                Type = a.AppointmentType,
                Status = a.Status.ToString(),
                Notes = a.Notes ?? ""
            })
            .ToListAsync();

        // Get PROM results
        var promResults = await _db.PromInstances
            .Where(p => p.TenantId == tenantId && p.PatientId == patientId && p.Status == PromStatus.Completed)
            .OrderByDescending(p => p.CompletedAt)
            .Take(5)
            .Select(p => new PromResultSummary
            {
                Id = p.Id,
                Name = p.Template.Name,
                CompletedAt = p.CompletedAt ?? DateTime.UtcNow,
                Score = (double)(p.Score ?? 0),
                Severity = CalculateSeverity(p.Score ?? 0)
            })
            .ToListAsync();

        // Get documents
        var documents = await _db.Documents
            .Where(d => d.TenantId == tenantId && d.PatientId == patientId)
            .OrderByDescending(d => d.CreatedAt)
            .Take(10)
            .Select(d => new DocumentSummary
            {
                Id = d.Id,
                Name = d.FileName,
                Type = d.DocumentType,
                UploadedAt = d.CreatedAt,
                Size = FormatFileSize(d.FileSize)
            })
            .ToListAsync();

        // Get or create patient record
        var recordSql = @"
            SELECT * FROM qivr.patient_records 
            WHERE tenant_id = {0} AND patient_id = {1}
            LIMIT 1";
        
        var record = await _db.Database.SqlQueryRaw<PatientRecord>(recordSql, tenantId, patientId).FirstOrDefaultAsync();
        
        if (record == null)
        {
            // Create new record
            var medicalRecordNumber = $"MRN-{DateTime.UtcNow.Year}-{patientId.ToString().Substring(0, 8).ToUpper()}";
            
            record = new PatientRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientId,
                MedicalRecordNumber = medicalRecordNumber,
                Demographics = new PatientDemographics
                {
                    FirstName = patient.FirstName,
                    LastName = patient.LastName,
                    DateOfBirth = patient.DateOfBirth ?? DateTime.UtcNow.AddYears(-30),
                    Gender = patient.Gender ?? "Not Specified",
                    Email = patient.Email,
                    Phone = patient.Phone ?? "",
                    Address = ConvertToPatientAddress(patient.Preferences)
                },
                MedicalHistory = new MedicalHistory(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Insert the new record
            var insertSql = @"
                INSERT INTO qivr.patient_records 
                (id, tenant_id, patient_id, medical_record_number, demographics, medical_history, created_at, updated_at)
                VALUES ({0}, {1}, {2}, {3}, {4}::jsonb, {5}::jsonb, {6}, {7})";
            
            await _db.Database.ExecuteSqlRawAsync(insertSql,
                record.Id, tenantId, patientId, medicalRecordNumber,
                JsonSerializer.Serialize(record.Demographics),
                JsonSerializer.Serialize(record.MedicalHistory),
                DateTime.UtcNow, DateTime.UtcNow);
        }

        // Populate collections
        record.VitalSigns = vitalSigns;
        record.RecentAppointments = appointments;
        record.PromResults = promResults;
        record.Documents = documents;

        return record;
    }

    public async Task UpdateDemographicsAsync(Guid tenantId, Guid patientId, PatientDemographics demographics)
    {
        var updateSql = @"
            UPDATE qivr.patient_records 
            SET demographics = {0}::jsonb, updated_at = {1}
            WHERE tenant_id = {2} AND patient_id = {3}";
        
        await _db.Database.ExecuteSqlRawAsync(updateSql,
            JsonSerializer.Serialize(demographics),
            DateTime.UtcNow,
            tenantId,
            patientId);

        // Also update user record
        var user = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == patientId);
        if (user != null)
        {
            user.FirstName = demographics.FirstName;
            user.LastName = demographics.LastName;
            user.Email = demographics.Email;
            user.Phone = demographics.Phone;
            user.DateOfBirth = demographics.DateOfBirth;
        user.Gender = demographics.Gender;
        // Store address in preferences
        if (demographics.Address != null)
        {
            user.Preferences["address"] = JsonSerializer.Serialize(demographics.Address);
        }
            user.UpdatedAt = DateTime.UtcNow;
            
            await _db.SaveChangesAsync();
        }
    }

    public async Task AddMedicalHistoryAsync(Guid tenantId, Guid patientId, MedicalHistory history)
    {
        var updateSql = @"
            UPDATE qivr.patient_records 
            SET medical_history = {0}::jsonb, updated_at = {1}
            WHERE tenant_id = {2} AND patient_id = {3}";
        
        await _db.Database.ExecuteSqlRawAsync(updateSql,
            JsonSerializer.Serialize(history),
            DateTime.UtcNow,
            tenantId,
            patientId);
    }

    public async Task<VitalSign> RecordVitalSignsAsync(Guid tenantId, Guid patientId, VitalSign vitalSign)
    {
        vitalSign.Id = Guid.NewGuid();
        vitalSign.TenantId = tenantId;
        vitalSign.PatientId = patientId;
        vitalSign.RecordedAt = DateTime.UtcNow;

        // Calculate BMI if height and weight are provided
        if (vitalSign.Weight > 0 && vitalSign.Height > 0)
        {
            var heightInMeters = (double)vitalSign.Height * 0.0254; // Convert inches to meters
            var weightInKg = (double)vitalSign.Weight * 0.453592; // Convert lbs to kg
            vitalSign.Bmi = (decimal)Math.Round(weightInKg / (heightInMeters * heightInMeters), 1);
        }

        var insertSql = @"
            INSERT INTO qivr.vital_signs 
            (id, tenant_id, patient_id, recorded_at, blood_pressure, heart_rate, temperature, 
             respiratory_rate, oxygen_saturation, weight, height, bmi, notes, recorded_by)
            VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13})";
        
        await _db.Database.ExecuteSqlRawAsync(insertSql,
            vitalSign.Id, tenantId, patientId, vitalSign.RecordedAt,
            vitalSign.BloodPressure, vitalSign.HeartRate, vitalSign.Temperature,
            vitalSign.RespiratoryRate, vitalSign.OxygenSaturation,
            vitalSign.Weight, vitalSign.Height, vitalSign.Bmi,
            vitalSign.Notes ?? "", vitalSign.RecordedBy ?? Guid.Empty);

        return vitalSign;
    }

    public async Task<List<VitalSign>> GetVitalSignsAsync(Guid tenantId, Guid patientId, DateTime? from, DateTime? to)
    {
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-3);
        var toDate = to ?? DateTime.UtcNow;

        var sql = @"
            SELECT * FROM qivr.vital_signs 
            WHERE tenant_id = {0} AND patient_id = {1} 
                AND recorded_at >= {2} AND recorded_at <= {3}
            ORDER BY recorded_at DESC";
        
        return await _db.Database.SqlQueryRaw<VitalSign>(sql, tenantId, patientId, fromDate, toDate).ToListAsync();
    }

    public async Task<List<TimelineEvent>> GetPatientTimelineAsync(Guid tenantId, Guid patientId, int skip, int take)
    {
        var events = new List<TimelineEvent>();

        // Get appointments
        var appointments = await _db.Appointments
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId)
            .OrderByDescending(a => a.ScheduledStart)
            .Skip(skip)
            .Take(take / 3) // Divide among different event types
            .Select(a => new TimelineEvent
            {
                Id = a.Id,
                Type = "appointment",
                Title = $"Appointment with {a.Provider.FirstName} {a.Provider.LastName}",
                Description = a.Notes ?? a.AppointmentType,
                OccurredAt = a.ScheduledStart,
                Icon = "calendar"
            })
            .ToListAsync();
        events.AddRange(appointments);

        // Get PROM completions
        var promCompletions = await _db.PromInstances
            .Where(p => p.TenantId == tenantId && p.PatientId == patientId && p.Status == PromStatus.Completed)
            .OrderByDescending(p => p.CompletedAt)
            .Skip(skip)
            .Take(take / 3)
            .Select(p => new TimelineEvent
            {
                Id = p.Id,
                Type = "prom",
                Title = $"{(p.Template != null ? p.Template.Name : "PROM")} Completed",
                Description = $"Score: {p.Score}",
                OccurredAt = p.CompletedAt ?? DateTime.UtcNow,
                Icon = "clipboard"
            })
            .ToListAsync();
        events.AddRange(promCompletions);

        // Get vital signs recordings
        var vitalSignsSql = @"
            SELECT id, recorded_at, blood_pressure, heart_rate 
            FROM qivr.vital_signs 
            WHERE tenant_id = {0} AND patient_id = {1}
            ORDER BY recorded_at DESC
            LIMIT {2} OFFSET {3}";
        
        var vitalSigns = await _db.Database.SqlQueryRaw<VitalSignEvent>(
            vitalSignsSql, tenantId, patientId, take / 3, skip).ToListAsync();
        
        events.AddRange(vitalSigns.Select(v => new TimelineEvent
        {
            Id = v.Id,
            Type = "vital_signs",
            Title = "Vital Signs Recorded",
            Description = $"BP: {v.BloodPressure}, HR: {v.HeartRate}",
            OccurredAt = v.RecordedAt,
            Icon = "heart"
        }));

        return events.OrderByDescending(e => e.OccurredAt).ToList();
    }

    public async Task<PatientSummary> GetPatientSummaryAsync(Guid tenantId, Guid patientId)
    {
        var patient = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Id == patientId);
        if (patient == null) throw new InvalidOperationException("Patient not found");

        var lastVisit = await _db.Appointments
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId && a.Status == AppointmentStatus.Completed)
            .OrderByDescending(a => a.ScheduledStart)
            .Select(a => a.ScheduledStart)
            .FirstOrDefaultAsync();

        var nextAppointment = await _db.Appointments
            .Where(a => a.TenantId == tenantId && a.PatientId == patientId && 
                   a.Status == AppointmentStatus.Scheduled && a.ScheduledStart > DateTime.UtcNow)
            .OrderBy(a => a.ScheduledStart)
            .Select(a => a.ScheduledStart)
            .FirstOrDefaultAsync();

        // Get medical history for condition/medication counts
        var recordSql = @"
            SELECT medical_history FROM qivr.patient_records 
            WHERE tenant_id = {0} AND patient_id = {1}
            LIMIT 1";
        
        var historyJson = await _db.Database.SqlQueryRaw<string>(recordSql, tenantId, patientId).FirstOrDefaultAsync();
        var medicalHistory = historyJson != null ? JsonSerializer.Deserialize<MedicalHistory>(historyJson) : new MedicalHistory();

        var recentPromScore = await _db.PromInstances
            .Where(p => p.TenantId == tenantId && p.PatientId == patientId && p.Status == PromStatus.Completed)
            .OrderByDescending(p => p.CompletedAt)
            .Select(p => (double?)p.Score)
            .FirstOrDefaultAsync();

        // Calculate age
        var age = patient.DateOfBirth.HasValue 
            ? (int)((DateTime.UtcNow - patient.DateOfBirth.Value).TotalDays / 365.25)
            : 0;

        return new PatientSummary
        {
            PatientId = patientId,
            Name = $"{patient.FirstName} {patient.LastName}",
            Age = age,
            MedicalRecordNumber = $"MRN-{DateTime.UtcNow.Year}-{patientId.ToString().Substring(0, 8).ToUpper()}",
            LastVisit = lastVisit,
            NextAppointment = nextAppointment,
            ActiveConditions = medicalHistory?.ChronicConditions?.Count ?? 0,
            ActiveMedications = medicalHistory?.CurrentMedications?.Count ?? 0,
            RecentPromScore = recentPromScore,
            RiskLevel = CalculateRiskLevel(recentPromScore ?? 0),
            ComplianceRate = await CalculateComplianceRate(tenantId, patientId)
        };
    }

    private static string CalculateSeverity(decimal score)
    {
        return score switch
        {
            <= 4 => "Minimal",
            <= 9 => "Mild",
            <= 14 => "Moderate",
            <= 19 => "Moderately Severe",
            _ => "Severe"
        };
    }

    private static string CalculateRiskLevel(double score)
    {
        return score switch
        {
            <= 5 => "Low",
            <= 10 => "Medium",
            <= 15 => "High",
            _ => "Critical"
        };
    }

    private async Task<decimal> CalculateComplianceRate(Guid tenantId, Guid patientId)
    {
        var totalAppointments = await _db.Appointments
            .CountAsync(a => a.TenantId == tenantId && a.PatientId == patientId && 
                        a.ScheduledStart < DateTime.UtcNow);
        
        var attendedAppointments = await _db.Appointments
            .CountAsync(a => a.TenantId == tenantId && a.PatientId == patientId && 
                        a.Status == AppointmentStatus.Completed);

        if (totalAppointments == 0) return 100m;
        
        return Math.Round((decimal)attendedAppointments / totalAppointments * 100, 1);
    }

    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        int order = 0;
        double size = bytes;
        
        while (size >= 1024 && order < sizes.Length - 1)
        {
            order++;
            size = size / 1024;
        }
        
        return $"{size:0.##} {sizes[order]}";
    }
    
    private static PatientAddress ConvertToPatientAddress(Dictionary<string, object>? preferences)
    {
        if (preferences?.ContainsKey("address") == true)
        {
            try
            {
                return JsonSerializer.Deserialize<PatientAddress>(preferences["address"].ToString() ?? "{}") ?? new PatientAddress();
            }
            catch
            {
                return new PatientAddress();
            }
        }
        return new PatientAddress();
    }
}

// Entity models for database operations
public class PatientRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public PatientDemographics Demographics { get; set; } = new();
    public MedicalHistory MedicalHistory { get; set; } = new();
    public List<VitalSign> VitalSigns { get; set; } = new();
    public List<AppointmentSummary> RecentAppointments { get; set; } = new();
    public List<PromResultSummary> PromResults { get; set; } = new();
    public List<DocumentSummary> Documents { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PatientDemographics
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public PatientAddress Address { get; set; } = new();
}

public class PatientAddress
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

public class MedicalHistory
{
    public List<string> ChronicConditions { get; set; } = new();
    public List<string> PastSurgeries { get; set; } = new();
    public List<string> Allergies { get; set; } = new();
    public List<Medication> CurrentMedications { get; set; } = new();
    public List<string> FamilyHistory { get; set; } = new();
}

public class Medication
{
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
}

public class VitalSign
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime RecordedAt { get; set; }
    public string BloodPressure { get; set; } = string.Empty;
    public int HeartRate { get; set; }
    public decimal Temperature { get; set; }
    public int RespiratoryRate { get; set; }
    public int OxygenSaturation { get; set; }
    public decimal Weight { get; set; }
    public decimal Height { get; set; }
    public decimal Bmi { get; set; }
    public string? Notes { get; set; }
    public Guid? RecordedBy { get; set; }
}

public class AppointmentSummary
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class PromResultSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
    public double Score { get; set; }
    public string Severity { get; set; } = string.Empty;
}

public class DocumentSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string Size { get; set; } = string.Empty;
}

public class TimelineEvent
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public string Icon { get; set; } = string.Empty;
}

public class PatientSummary
{
    public Guid PatientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public DateTime? LastVisit { get; set; }
    public DateTime? NextAppointment { get; set; }
    public int ActiveConditions { get; set; }
    public int ActiveMedications { get; set; }
    public double? RecentPromScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public decimal ComplianceRate { get; set; }
}

internal class VitalSignEvent
{
    public Guid Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public string BloodPressure { get; set; } = string.Empty;
    public int HeartRate { get; set; }
}