using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;
using System.Text.Json;

namespace Qivr.Services;

public interface IFhirPainMapService
{
    Task<string> ConvertToFhirObservationAsync(Guid painMapId, CancellationToken cancellationToken = default);
    Task<List<string>> ConvertMultipleToFhirAsync(Guid patientId, CancellationToken cancellationToken = default);
}

public class FhirPainMapService : IFhirPainMapService
{
    private readonly QivrDbContext _context;

    public FhirPainMapService(QivrDbContext context)
    {
        _context = context;
    }

    public async Task<string> ConvertToFhirObservationAsync(Guid painMapId, CancellationToken cancellationToken = default)
    {
        var painMap = await _context.PainMaps
            .Include(pm => pm.Evaluation)
            .ThenInclude(e => e!.Patient)
            .FirstOrDefaultAsync(pm => pm.Id == painMapId, cancellationToken);

        if (painMap == null) throw new ArgumentException("Pain map not found");

        var observation = new
        {
            resourceType = "Observation",
            id = painMap.Id.ToString(),
            status = "final",
            category = new[]
            {
                new
                {
                    coding = new[]
                    {
                        new
                        {
                            system = "http://terminology.hl7.org/CodeSystem/observation-category",
                            code = "survey",
                            display = "Survey"
                        }
                    }
                }
            },
            code = new
            {
                coding = new[]
                {
                    new
                    {
                        system = "http://snomed.info/sct",
                        code = "22253000",
                        display = "Pain"
                    }
                },
                text = "Pain Assessment"
            },
            subject = new
            {
                reference = $"Patient/{painMap.Evaluation?.PatientId}",
                display = painMap.Evaluation?.Patient?.FullName
            },
            effectiveDateTime = painMap.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            issued = painMap.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            valueInteger = painMap.PainIntensity,
            bodySite = new
            {
                coding = new[]
                {
                    new
                    {
                        system = "http://snomed.info/sct",
                        code = GetSnomedBodySiteCode(painMap.BodyRegion),
                        display = painMap.BodyRegion
                    }
                }
            },
            component = BuildComponents(painMap)
        };

        return JsonSerializer.Serialize(observation, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }

    public async Task<List<string>> ConvertMultipleToFhirAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        var painMaps = await _context.PainMaps
            .Include(pm => pm.Evaluation)
            .Where(pm => pm.Evaluation!.PatientId == patientId)
            .ToListAsync(cancellationToken);

        var fhirResources = new List<string>();
        foreach (var painMap in painMaps)
        {
            var fhir = await ConvertToFhirObservationAsync(painMap.Id, cancellationToken);
            fhirResources.Add(fhir);
        }

        return fhirResources;
    }

    private List<object> BuildComponents(Core.Entities.PainMap painMap)
    {
        var components = new List<object>();

        // Pain qualities
        if (painMap.PainQuality.Any())
        {
            components.Add(new
            {
                code = new
                {
                    coding = new[]
                    {
                        new
                        {
                            system = "http://snomed.info/sct",
                            code = "106148009",
                            display = "Pain quality"
                        }
                    }
                },
                valueCodeableConcept = new
                {
                    coding = painMap.PainQuality.Select(q => new
                    {
                        system = "http://snomed.info/sct",
                        code = GetSnomedPainQualityCode(q),
                        display = q
                    }).ToArray()
                }
            });
        }

        // Depth indicator
        if (!string.IsNullOrEmpty(painMap.DepthIndicator))
        {
            components.Add(new
            {
                code = new
                {
                    text = "Pain depth"
                },
                valueString = painMap.DepthIndicator
            });
        }

        // Avatar type and view
        if (!string.IsNullOrEmpty(painMap.AvatarType))
        {
            components.Add(new
            {
                code = new
                {
                    text = "Body diagram type"
                },
                valueString = $"{painMap.AvatarType} - {painMap.ViewOrientation}"
            });
        }

        // Drawing data reference
        if (!string.IsNullOrEmpty(painMap.DrawingDataJson))
        {
            components.Add(new
            {
                code = new
                {
                    text = "Pain drawing data"
                },
                valueString = "Available",
                extension = new[]
                {
                    new
                    {
                        url = "http://qivr.pro/fhir/StructureDefinition/pain-drawing",
                        valueString = painMap.DrawingDataJson
                    }
                }
            });
        }

        return components;
    }

    private string GetSnomedBodySiteCode(string bodyRegion)
    {
        // Simplified SNOMED CT body site mapping
        return bodyRegion.ToLower() switch
        {
            var r when r.Contains("head") => "69536005",
            var r when r.Contains("neck") => "45048000",
            var r when r.Contains("shoulder") => "16982005",
            var r when r.Contains("arm") => "40983000",
            var r when r.Contains("hand") => "85562004",
            var r when r.Contains("chest") => "51185008",
            var r when r.Contains("back") => "123961009",
            var r when r.Contains("abdomen") => "818983003",
            var r when r.Contains("leg") => "30021000",
            var r when r.Contains("knee") => "72696002",
            var r when r.Contains("foot") => "56459004",
            _ => "123037004" // Body structure (generic)
        };
    }

    private string GetSnomedPainQualityCode(string quality)
    {
        // SNOMED CT pain quality codes
        return quality.ToLower() switch
        {
            var q when q.Contains("burning") => "90673000",
            var q when q.Contains("sharp") => "8708008",
            var q when q.Contains("dull") => "410711009",
            var q when q.Contains("aching") => "410711009",
            var q when q.Contains("throbbing") => "8708008",
            var q when q.Contains("numbness") => "44077006",
            var q when q.Contains("tingling") => "62507009",
            _ => "22253000" // Pain (generic)
        };
    }
}
