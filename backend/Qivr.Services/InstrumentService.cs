using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.DTOs;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IInstrumentService
{
    Task<List<InstrumentDto>> GetAllAsync(bool includeInactive = false);
    Task<List<InstrumentSummaryDto>> GetSummaryListAsync(string? clinicalDomain = null);
    Task<InstrumentDto?> GetByIdAsync(Guid id);
    Task<InstrumentDto?> GetByKeyAsync(string key);
    Task<InstrumentDto> CreateAsync(CreateInstrumentDto dto);
    Task<InstrumentDto?> UpdateAsync(Guid id, UpdateInstrumentDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task SeedStandardInstrumentsAsync();
}

public class InstrumentService : IInstrumentService
{
    private readonly QivrDbContext _context;
    private readonly ILogger<InstrumentService> _logger;

    public InstrumentService(QivrDbContext context, ILogger<InstrumentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<InstrumentDto>> GetAllAsync(bool includeInactive = false)
    {
        var query = _context.Instruments.AsNoTracking();

        if (!includeInactive)
        {
            query = query.Where(i => i.IsActive);
        }

        var instruments = await query
            .OrderBy(i => i.InstrumentFamily)
            .ThenBy(i => i.Name)
            .ToListAsync();

        // Get template counts
        var templateCounts = await _context.PromTemplates
            .Where(t => t.InstrumentId != null)
            .GroupBy(t => t.InstrumentId)
            .Select(g => new { InstrumentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.InstrumentId!.Value, x => x.Count);

        return instruments.Select(i => MapToDto(i, templateCounts.GetValueOrDefault(i.Id))).ToList();
    }

    public async Task<List<InstrumentSummaryDto>> GetSummaryListAsync(string? clinicalDomain = null)
    {
        var query = _context.Instruments.AsNoTracking().Where(i => i.IsActive);

        if (!string.IsNullOrEmpty(clinicalDomain))
        {
            query = query.Where(i => i.ClinicalDomain == clinicalDomain);
        }

        return await query
            .OrderBy(i => i.Name)
            .Select(i => new InstrumentSummaryDto
            {
                Id = i.Id,
                Key = i.Key,
                Name = i.Name,
                ClinicalDomain = i.ClinicalDomain,
                LicenseType = i.LicenseType.ToString()
            })
            .ToListAsync();
    }

    public async Task<InstrumentDto?> GetByIdAsync(Guid id)
    {
        var instrument = await _context.Instruments
            .AsNoTracking()
            .Include(i => i.Templates)
            .FirstOrDefaultAsync(i => i.Id == id);

        return instrument == null ? null : MapToDto(instrument, instrument.Templates.Count);
    }

    public async Task<InstrumentDto?> GetByKeyAsync(string key)
    {
        var instrument = await _context.Instruments
            .AsNoTracking()
            .Include(i => i.Templates)
            .FirstOrDefaultAsync(i => i.Key == key.ToLower());

        return instrument == null ? null : MapToDto(instrument, instrument.Templates.Count);
    }

    public async Task<InstrumentDto> CreateAsync(CreateInstrumentDto dto)
    {
        var instrument = new Instrument
        {
            Key = dto.Key.ToLower(),
            Name = dto.Name,
            InstrumentFamily = dto.InstrumentFamily,
            ClinicalDomain = dto.ClinicalDomain,
            LicenseType = dto.LicenseType,
            LicenseNotes = dto.LicenseNotes,
            IsGlobal = dto.IsGlobal,
            Description = dto.Description,
            ReferenceUrl = dto.ReferenceUrl,
            IsActive = true
        };

        _context.Instruments.Add(instrument);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created instrument: {Key} - {Name}", instrument.Key, instrument.Name);

        return MapToDto(instrument, 0);
    }

    public async Task<InstrumentDto?> UpdateAsync(Guid id, UpdateInstrumentDto dto)
    {
        var instrument = await _context.Instruments.FindAsync(id);
        if (instrument == null) return null;

        if (dto.Name != null) instrument.Name = dto.Name;
        if (dto.InstrumentFamily != null) instrument.InstrumentFamily = dto.InstrumentFamily;
        if (dto.ClinicalDomain != null) instrument.ClinicalDomain = dto.ClinicalDomain;
        if (dto.LicenseType.HasValue) instrument.LicenseType = dto.LicenseType.Value;
        if (dto.LicenseNotes != null) instrument.LicenseNotes = dto.LicenseNotes;
        if (dto.Description != null) instrument.Description = dto.Description;
        if (dto.ReferenceUrl != null) instrument.ReferenceUrl = dto.ReferenceUrl;
        if (dto.IsActive.HasValue) instrument.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();

        var templateCount = await _context.PromTemplates.CountAsync(t => t.InstrumentId == id);
        return MapToDto(instrument, templateCount);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var instrument = await _context.Instruments.FindAsync(id);
        if (instrument == null) return false;

        // Check if any templates reference this instrument
        var hasTemplates = await _context.PromTemplates.AnyAsync(t => t.InstrumentId == id);
        if (hasTemplates)
        {
            // Soft delete by deactivating
            instrument.IsActive = false;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deactivated instrument {Key} (has templates)", instrument.Key);
        }
        else
        {
            // Hard delete if no templates
            _context.Instruments.Remove(instrument);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted instrument {Key}", instrument.Key);
        }

        return true;
    }

    public async Task SeedStandardInstrumentsAsync()
    {
        var standardInstruments = GetStandardInstruments();

        foreach (var instrument in standardInstruments)
        {
            var existing = await _context.Instruments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Key == instrument.Key);

            if (existing == null)
            {
                _context.Instruments.Add(instrument);
                _logger.LogInformation("Seeding instrument: {Key} - {Name}", instrument.Key, instrument.Name);
            }
        }

        await _context.SaveChangesAsync();
    }

    private static InstrumentDto MapToDto(Instrument instrument, int templateCount)
    {
        return new InstrumentDto
        {
            Id = instrument.Id,
            Key = instrument.Key,
            Name = instrument.Name,
            InstrumentFamily = instrument.InstrumentFamily,
            ClinicalDomain = instrument.ClinicalDomain,
            LicenseType = instrument.LicenseType.ToString(),
            LicenseNotes = instrument.LicenseNotes,
            IsGlobal = instrument.IsGlobal,
            TenantId = instrument.TenantId,
            IsActive = instrument.IsActive,
            Description = instrument.Description,
            ReferenceUrl = instrument.ReferenceUrl,
            TemplateCount = templateCount,
            CreatedAt = instrument.CreatedAt,
            UpdatedAt = instrument.UpdatedAt
        };
    }

    private static List<Instrument> GetStandardInstruments()
    {
        return new List<Instrument>
        {
            // Spine
            new()
            {
                Key = "odi",
                Name = "Oswestry Disability Index",
                InstrumentFamily = "Oswestry",
                ClinicalDomain = "spine",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "10-item questionnaire measuring disability caused by low back pain",
                ReferenceUrl = "https://www.aaos.org/globalassets/quality-and-practice-resources/patient-reported-outcome-measures/spine/oswestry-2.pdf"
            },
            new()
            {
                Key = "ndi",
                Name = "Neck Disability Index",
                InstrumentFamily = "NDI",
                ClinicalDomain = "spine",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "10-item questionnaire measuring disability caused by neck pain"
            },

            // Knee
            new()
            {
                Key = "koos",
                Name = "Knee Injury and Osteoarthritis Outcome Score",
                InstrumentFamily = "KOOS",
                ClinicalDomain = "knee",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "42-item questionnaire with 5 subscales: Pain, Symptoms, ADL, Sport/Recreation, QoL",
                ReferenceUrl = "http://www.koos.nu/"
            },
            new()
            {
                Key = "koos-jr",
                Name = "KOOS, JR (Joint Replacement)",
                InstrumentFamily = "KOOS",
                ClinicalDomain = "knee",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "7-item short form derived from KOOS for knee arthroplasty patients"
            },

            // Hip
            new()
            {
                Key = "hoos",
                Name = "Hip Disability and Osteoarthritis Outcome Score",
                InstrumentFamily = "HOOS",
                ClinicalDomain = "hip",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "40-item questionnaire with 5 subscales: Pain, Symptoms, ADL, Sport/Recreation, QoL",
                ReferenceUrl = "http://www.koos.nu/"
            },
            new()
            {
                Key = "hoos-jr",
                Name = "HOOS, JR (Joint Replacement)",
                InstrumentFamily = "HOOS",
                ClinicalDomain = "hip",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "6-item short form derived from HOOS for hip arthroplasty patients"
            },

            // Shoulder
            new()
            {
                Key = "dash",
                Name = "Disabilities of the Arm, Shoulder and Hand",
                InstrumentFamily = "DASH",
                ClinicalDomain = "upper_limb",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "30-item questionnaire measuring upper limb function",
                ReferenceUrl = "http://www.dash.iwh.on.ca/"
            },
            new()
            {
                Key = "quickdash",
                Name = "QuickDASH",
                InstrumentFamily = "DASH",
                ClinicalDomain = "upper_limb",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "11-item short form of the DASH",
                ReferenceUrl = "http://www.dash.iwh.on.ca/"
            },

            // Mental Health
            new()
            {
                Key = "phq9",
                Name = "Patient Health Questionnaire-9",
                InstrumentFamily = "PHQ",
                ClinicalDomain = "mental_health",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "9-item depression screening and severity measure",
                ReferenceUrl = "https://www.phqscreeners.com/"
            },
            new()
            {
                Key = "gad7",
                Name = "Generalized Anxiety Disorder-7",
                InstrumentFamily = "GAD",
                ClinicalDomain = "mental_health",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "7-item anxiety screening measure",
                ReferenceUrl = "https://www.phqscreeners.com/"
            },

            // General Health
            new()
            {
                Key = "sf36",
                Name = "36-Item Short Form Survey",
                InstrumentFamily = "SF",
                ClinicalDomain = "general_health",
                LicenseType = InstrumentLicenseType.NonCommercial,
                IsGlobal = true,
                Description = "36-item health survey with 8 scales measuring physical and mental health",
                LicenseNotes = "Free for academic/research use. Commercial license required for commercial applications."
            },
            new()
            {
                Key = "sf12",
                Name = "12-Item Short Form Survey",
                InstrumentFamily = "SF",
                ClinicalDomain = "general_health",
                LicenseType = InstrumentLicenseType.NonCommercial,
                IsGlobal = true,
                Description = "12-item short form of SF-36",
                LicenseNotes = "Free for academic/research use. Commercial license required for commercial applications."
            },
            new()
            {
                Key = "eq5d",
                Name = "EQ-5D",
                InstrumentFamily = "EQ-5D",
                ClinicalDomain = "general_health",
                LicenseType = InstrumentLicenseType.CommercialRequired,
                IsGlobal = true,
                Description = "5-item health utility measure",
                LicenseNotes = "Registration and license required from EuroQol Group."
            },
            new()
            {
                Key = "whodas",
                Name = "WHO Disability Assessment Schedule 2.0",
                InstrumentFamily = "WHODAS",
                ClinicalDomain = "general_health",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "36-item or 12-item disability assessment across 6 domains",
                ReferenceUrl = "https://www.who.int/classifications/icf/whodasii/en/"
            },

            // PROMIS
            new()
            {
                Key = "promis-pf",
                Name = "PROMIS Physical Function",
                InstrumentFamily = "PROMIS",
                ClinicalDomain = "physical_function",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "Physical function item bank with CAT or short form options",
                ReferenceUrl = "https://www.healthmeasures.net/explore-measurement-systems/promis"
            },
            new()
            {
                Key = "promis-pain",
                Name = "PROMIS Pain Intensity",
                InstrumentFamily = "PROMIS",
                ClinicalDomain = "pain",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "Pain intensity assessment",
                ReferenceUrl = "https://www.healthmeasures.net/explore-measurement-systems/promis"
            },

            // Pain
            new()
            {
                Key = "nprs",
                Name = "Numeric Pain Rating Scale",
                InstrumentFamily = "Pain Scales",
                ClinicalDomain = "pain",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "0-10 numeric pain rating"
            },
            new()
            {
                Key = "vas",
                Name = "Visual Analog Scale",
                InstrumentFamily = "Pain Scales",
                ClinicalDomain = "pain",
                LicenseType = InstrumentLicenseType.Open,
                IsGlobal = true,
                Description = "0-100mm visual analog pain scale"
            }
        };
    }
}
