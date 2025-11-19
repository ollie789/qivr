using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IPainMapAnalyticsService
{
    Task<PainMapHeatMapData> GenerateHeatMapAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default);
    Task<PainMapMetrics> GetMetricsAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default);
    Task<List<PainMapProgression>> GetProgressionAsync(Guid patientId, CancellationToken cancellationToken = default);
}

public class PainMapAnalyticsService : IPainMapAnalyticsService
{
    private readonly QivrDbContext _context;

    public PainMapAnalyticsService(QivrDbContext context)
    {
        _context = context;
    }

    public async Task<PainMapHeatMapData> GenerateHeatMapAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.PainMaps
            .Include(pm => pm.Evaluation)
            .Where(pm => pm.TenantId == tenantId);

        // Apply filters
        if (filter.StartDate.HasValue)
            query = query.Where(pm => pm.CreatedAt >= filter.StartDate.Value);
        
        if (filter.EndDate.HasValue)
            query = query.Where(pm => pm.CreatedAt <= filter.EndDate.Value);

        if (!string.IsNullOrEmpty(filter.AvatarType))
            query = query.Where(pm => pm.AvatarType == filter.AvatarType);

        if (!string.IsNullOrEmpty(filter.ViewOrientation))
            query = query.Where(pm => pm.ViewOrientation == filter.ViewOrientation);

        var painMaps = await query.ToListAsync(cancellationToken);

        // Aggregate pain data into grid
        var gridSize = 100; // 100x100 grid
        var heatGrid = new int[gridSize, gridSize];
        var intensityGrid = new float[gridSize, gridSize];
        var countGrid = new int[gridSize, gridSize];

        foreach (var painMap in painMaps)
        {
            if (string.IsNullOrEmpty(painMap.DrawingDataJson)) continue;

            try
            {
                var drawingData = System.Text.Json.JsonSerializer.Deserialize<DrawingDataDto>(painMap.DrawingDataJson);
                if (drawingData?.Paths == null) continue;

                foreach (var path in drawingData.Paths)
                {
                    // Parse SVG path and extract points
                    var points = ParseSvgPath(path.PathData);
                    foreach (var point in points)
                    {
                        var gridX = (int)(point.X / 6); // Assuming 600px width
                        var gridY = (int)(point.Y / 8); // Assuming 800px height
                        
                        if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize)
                        {
                            heatGrid[gridX, gridY]++;
                            intensityGrid[gridX, gridY] += painMap.PainIntensity;
                            countGrid[gridX, gridY]++;
                        }
                    }
                }
            }
            catch { /* Skip invalid data */ }
        }

        // Calculate average intensity per cell
        var avgIntensityGrid = new float[gridSize, gridSize];
        for (int x = 0; x < gridSize; x++)
        {
            for (int y = 0; y < gridSize; y++)
            {
                if (countGrid[x, y] > 0)
                    avgIntensityGrid[x, y] = intensityGrid[x, y] / countGrid[x, y];
            }
        }

        return new PainMapHeatMapData
        {
            GridSize = gridSize,
            FrequencyGrid = heatGrid,
            IntensityGrid = avgIntensityGrid,
            TotalMaps = painMaps.Count,
            AvatarType = filter.AvatarType ?? "male",
            ViewOrientation = filter.ViewOrientation ?? "front"
        };
    }

    public async Task<PainMapMetrics> GetMetricsAsync(Guid tenantId, PainMapFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.PainMaps
            .Where(pm => pm.TenantId == tenantId);

        if (filter.StartDate.HasValue)
            query = query.Where(pm => pm.CreatedAt >= filter.StartDate.Value);
        
        if (filter.EndDate.HasValue)
            query = query.Where(pm => pm.CreatedAt <= filter.EndDate.Value);

        var painMaps = await query.ToListAsync(cancellationToken);

        var metrics = new PainMapMetrics
        {
            TotalMaps = painMaps.Count,
            AverageIntensity = painMaps.Any() ? painMaps.Average(pm => pm.PainIntensity) : 0,
            MostCommonRegions = painMaps
                .GroupBy(pm => pm.BodyRegion)
                .OrderByDescending(g => g.Count())
                .Take(10)
                .Select(g => new RegionFrequency { Region = g.Key, Count = g.Count() })
                .ToList(),
            IntensityDistribution = painMaps
                .GroupBy(pm => pm.PainIntensity)
                .OrderBy(g => g.Key)
                .Select(g => new IntensityCount { Intensity = g.Key, Count = g.Count() })
                .ToList(),
            QualityDistribution = painMaps
                .SelectMany(pm => pm.PainQuality)
                .GroupBy(q => q)
                .OrderByDescending(g => g.Count())
                .Select(g => new QualityCount { Quality = g.Key, Count = g.Count() })
                .ToList()
        };

        return metrics;
    }

    public async Task<List<PainMapProgression>> GetProgressionAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        var painMaps = await _context.PainMaps
            .Include(pm => pm.Evaluation)
            .Where(pm => pm.Evaluation!.PatientId == patientId)
            .OrderBy(pm => pm.CreatedAt)
            .ToListAsync(cancellationToken);

        return painMaps.Select(pm => new PainMapProgression
        {
            Date = pm.CreatedAt,
            Intensity = pm.PainIntensity,
            BodyRegion = pm.BodyRegion,
            DrawingDataJson = pm.DrawingDataJson,
            AvatarType = pm.AvatarType,
            ViewOrientation = pm.ViewOrientation
        }).ToList();
    }

    private List<(float X, float Y)> ParseSvgPath(string pathData)
    {
        var points = new List<(float X, float Y)>();
        var commands = pathData.Split(' ');
        
        for (int i = 0; i < commands.Length; i++)
        {
            if (commands[i] == "M" || commands[i] == "L")
            {
                if (i + 2 < commands.Length && 
                    float.TryParse(commands[i + 1], out float x) && 
                    float.TryParse(commands[i + 2], out float y))
                {
                    points.Add((x, y));
                }
            }
        }
        
        return points;
    }
}

// DTOs
public class PainMapFilter
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? AvatarType { get; set; }
    public string? ViewOrientation { get; set; }
    public string? Diagnosis { get; set; }
}

public class PainMapHeatMapData
{
    public int GridSize { get; set; }
    public int[,] FrequencyGrid { get; set; } = new int[0, 0];
    public float[,] IntensityGrid { get; set; } = new float[0, 0];
    public int TotalMaps { get; set; }
    public string AvatarType { get; set; } = string.Empty;
    public string ViewOrientation { get; set; } = string.Empty;
}

public class PainMapMetrics
{
    public int TotalMaps { get; set; }
    public double AverageIntensity { get; set; }
    public List<RegionFrequency> MostCommonRegions { get; set; } = new();
    public List<IntensityCount> IntensityDistribution { get; set; } = new();
    public List<QualityCount> QualityDistribution { get; set; } = new();
}

public class RegionFrequency
{
    public string Region { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class IntensityCount
{
    public int Intensity { get; set; }
    public int Count { get; set; }
}

public class QualityCount
{
    public string Quality { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class PainMapProgression
{
    public DateTime Date { get; set; }
    public int Intensity { get; set; }
    public string BodyRegion { get; set; } = string.Empty;
    public string? DrawingDataJson { get; set; }
    public string? AvatarType { get; set; }
    public string? ViewOrientation { get; set; }
}

public class DrawingDataDto
{
    public List<PathDto> Paths { get; set; } = new();
}

public class PathDto
{
    public string PathData { get; set; } = string.Empty;
}
