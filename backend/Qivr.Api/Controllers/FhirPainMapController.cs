using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qivr.Services;

namespace Qivr.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/fhir/pain-map")]
public class FhirPainMapController : ControllerBase
{
    private readonly IFhirPainMapService _fhirService;

    public FhirPainMapController(IFhirPainMapService fhirService)
    {
        _fhirService = fhirService;
    }

    /// <summary>
    /// Convert pain map to FHIR Observation resource
    /// </summary>
    [HttpGet("{painMapId}")]
    [Produces("application/fhir+json")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFhirObservation(
        Guid painMapId,
        CancellationToken cancellationToken)
    {
        var fhir = await _fhirService.ConvertToFhirObservationAsync(painMapId, cancellationToken);
        return Content(fhir, "application/fhir+json");
    }

    /// <summary>
    /// Convert all pain maps for a patient to FHIR Bundle
    /// </summary>
    [HttpGet("patient/{patientId}")]
    [Produces("application/fhir+json")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPatientPainMaps(
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var resources = await _fhirService.ConvertMultipleToFhirAsync(patientId, cancellationToken);
        
        var bundle = new
        {
            resourceType = "Bundle",
            type = "collection",
            total = resources.Count,
            entry = resources.Select(r => new
            {
                resource = System.Text.Json.JsonSerializer.Deserialize<object>(r)
            }).ToArray()
        };

        var json = System.Text.Json.JsonSerializer.Serialize(bundle, new System.Text.Json.JsonSerializerOptions
        {
            WriteIndented = true
        });

        return Content(json, "application/fhir+json");
    }
}
