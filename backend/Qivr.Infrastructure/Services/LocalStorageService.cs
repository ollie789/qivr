using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qivr.Core.Interfaces;

namespace Qivr.Infrastructure.Services;

public class LocalStorageService : IStorageService
{
    private readonly StorageSettings _settings;
    private readonly ILogger<LocalStorageService> _logger;
    private readonly string _basePath;

    public LocalStorageService(
        IOptions<StorageSettings> settings,
        ILogger<LocalStorageService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        
        _basePath = _settings.LocalPath ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        
        // Ensure the base directory exists
        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
            _logger.LogInformation("Created local storage directory: {Path}", _basePath);
        }
    }

    public async Task<string> UploadAsync(Stream stream, string key, string contentType, Dictionary<string, string>? metadata = null)
    {
        try
        {
            var fullPath = GetFullPath(key);
            var directory = Path.GetDirectoryName(fullPath);
            
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
            {
                await stream.CopyToAsync(fileStream);
            }

            // Save metadata if provided
            if (metadata != null && metadata.Any())
            {
                var metadataPath = $"{fullPath}.metadata";
                var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata);
                await File.WriteAllTextAsync(metadataPath, metadataJson);
            }

            // Save content type
            var contentTypePath = $"{fullPath}.contenttype";
            await File.WriteAllTextAsync(contentTypePath, contentType);

            _logger.LogInformation("File uploaded to local storage: {Key}", key);

            // Return the key as the storage path
            return key;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to local storage: {Key}", key);
            throw;
        }
    }

    public async Task<Stream> DownloadAsync(string key)
    {
        try
        {
            var fullPath = GetFullPath(key);
            
            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException($"File not found: {key}", key);
            }

            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            
            _logger.LogInformation("File downloaded from local storage: {Key}", key);
            
            return await Task.FromResult(stream);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file from local storage: {Key}", key);
            throw;
        }
    }

    public async Task DeleteAsync(string key)
    {
        try
        {
            var fullPath = GetFullPath(key);
            
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                
                // Delete metadata files if they exist
                var metadataPath = $"{fullPath}.metadata";
                if (File.Exists(metadataPath))
                {
                    File.Delete(metadataPath);
                }
                
                var contentTypePath = $"{fullPath}.contenttype";
                if (File.Exists(contentTypePath))
                {
                    File.Delete(contentTypePath);
                }
                
                _logger.LogInformation("File deleted from local storage: {Key}", key);
            }
            
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from local storage: {Key}", key);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            var fullPath = GetFullPath(key);
            return await Task.FromResult(File.Exists(fullPath));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if file exists in local storage: {Key}", key);
            throw;
        }
    }

    public async Task<string> GetPresignedUrlAsync(string key, TimeSpan expiry)
    {
        // For local storage, we'll return a URL that can be handled by a controller
        // This assumes you'll have an endpoint like /api/files/{key} that serves the file
        var baseUrl = _settings.CdnUrl ?? "http://localhost:5000";
        var url = $"{baseUrl.TrimEnd('/')}/api/files/{Uri.EscapeDataString(key)}";
        
        _logger.LogDebug("Generated local storage URL for key: {Key}", key);
        
        return await Task.FromResult(url);
    }

    public async Task<IEnumerable<string>> ListAsync(string prefix)
    {
        try
        {
            var searchPath = GetFullPath(prefix);
            var searchDir = Directory.Exists(searchPath) ? searchPath : Path.GetDirectoryName(searchPath);
            
            if (string.IsNullOrEmpty(searchDir) || !Directory.Exists(searchDir))
            {
                return Enumerable.Empty<string>();
            }

            var files = Directory.GetFiles(searchDir, "*", SearchOption.AllDirectories)
                .Where(f => !f.EndsWith(".metadata") && !f.EndsWith(".contenttype"))
                .Select(f => GetRelativeKey(f))
                .Where(k => k.StartsWith(prefix))
                .ToList();

            _logger.LogInformation("Listed {Count} files with prefix: {Prefix}", files.Count, prefix);

            return await Task.FromResult(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing files in local storage with prefix: {Prefix}", prefix);
            throw;
        }
    }

    private string GetFullPath(string key)
    {
        // Sanitize the key to prevent directory traversal
        key = key.Replace("..", "").Replace("~", "");
        
        // Ensure the key doesn't start with a separator
        key = key.TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        
        return Path.Combine(_basePath, key);
    }

    private string GetRelativeKey(string fullPath)
    {
        return Path.GetRelativePath(_basePath, fullPath).Replace(Path.DirectorySeparatorChar, '/');
    }

    /// <summary>
    /// Gets the content type for a file
    /// </summary>
    public async Task<string> GetContentTypeAsync(string key)
    {
        var fullPath = GetFullPath(key);
        var contentTypePath = $"{fullPath}.contenttype";
        
        if (File.Exists(contentTypePath))
        {
            return await File.ReadAllTextAsync(contentTypePath);
        }
        
        // Default content type based on extension
        var extension = Path.GetExtension(key).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt" => "text/plain",
            ".json" => "application/json",
            ".xml" => "application/xml",
            _ => "application/octet-stream"
        };
    }

    /// <summary>
    /// Gets metadata for a file
    /// </summary>
    public async Task<Dictionary<string, string>?> GetMetadataAsync(string key)
    {
        var fullPath = GetFullPath(key);
        var metadataPath = $"{fullPath}.metadata";
        
        if (File.Exists(metadataPath))
        {
            var json = await File.ReadAllTextAsync(metadataPath);
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(json);
        }
        
        return null;
    }
}
