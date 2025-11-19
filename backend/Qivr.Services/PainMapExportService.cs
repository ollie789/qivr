using System.Text;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IPainMapExportService
{
    Task<byte[]> ExportToCsvAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default);
    Task<string> ExportToJsonAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default);
}

public class PainMapExportService : IPainMapExportService
{
    private readonly QivrDbContext _context;

    public PainMapExportService(QivrDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportToCsvAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.PainMaps
            .Include(pm => pm.Evaluation)
            .ThenInclude(e => e!.Patient)
            .Where(pm => pm.TenantId == tenantId);

        if (filter.StartDate.HasValue)
            query = query.Where(pm => pm.CreatedAt >= filter.StartDate.Value);
        
        if (filter.EndDate.HasValue)
            query = query.Where(pm => pm.CreatedAt <= filter.EndDate.Value);

        var painMaps = await query.ToListAsync(cancellationToken);

        var csv = new StringBuilder();
        csv.AppendLine("Date,Patient,BodyRegion,Intensity,PainType,PainQualities,AvatarType,ViewOrientation,DepthIndicator,SubmissionSource");

        foreach (var pm in painMaps)
        {
            csv.AppendLine($"{pm.CreatedAt:yyyy-MM-dd HH:mm:ss}," +
                          $"\"{pm.Evaluation?.Patient?.FullName ?? "Unknown"}\"," +
                          $"\"{pm.BodyRegion}\"," +
                          $"{pm.PainIntensity}," +
                          $"\"{pm.PainType ?? ""}\"," +
                          $"\"{string.Join(";", pm.PainQuality)}\"," +
                          $"\"{pm.AvatarType ?? ""}\"," +
                          $"\"{pm.ViewOrientation ?? ""}\"," +
                          $"\"{pm.DepthIndicator ?? ""}\"," +
                          $"\"{pm.SubmissionSource ?? ""}\"");
        }

        return Encoding.UTF8.GetBytes(csv.ToString());
    }

    public async Task<string> ExportToJsonAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.PainMaps
            .Include(pm => pm.Evaluation)
            .ThenInclude(e => e!.Patient)
            .Where(pm => pm.TenantId == tenantId);

        if (filter.StartDate.HasValue)
            query = query.Where(pm => pm.CreatedAt >= filter.StartDate.Value);
        
        if (filter.EndDate.HasValue)
            query = query.Where(pm => pm.CreatedAt <= filter.EndDate.Value);

        var painMaps = await query
            .Select(pm => new
            {
                pm.Id,
                Date = pm.CreatedAt,
                Patient = pm.Evaluation!.Patient!.FullName,
                pm.BodyRegion,
                pm.PainIntensity,
                pm.PainType,
                pm.PainQuality,
                pm.AvatarType,
                pm.ViewOrientation,
                pm.DepthIndicator,
                pm.SubmissionSource,
                DrawingData = pm.DrawingDataJson
            })
            .ToListAsync(cancellationToken);

        return System.Text.Json.JsonSerializer.Serialize(painMaps, new System.Text.Json.JsonSerializerOptions
        {
            WriteIndented = true
        });
    }
}
