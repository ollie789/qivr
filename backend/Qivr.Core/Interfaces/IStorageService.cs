using System.IO;

namespace Qivr.Core.Interfaces;

public interface IStorageService
{
    /// <summary>
    /// Uploads a file to storage
    /// </summary>
    /// <param name="stream">File stream</param>
    /// <param name="key">Storage key/path</param>
    /// <param name="contentType">MIME content type</param>
    /// <param name="metadata">Optional metadata</param>
    /// <returns>URL or path to the uploaded file</returns>
    Task<string> UploadAsync(Stream stream, string key, string contentType, Dictionary<string, string>? metadata = null);
    
    /// <summary>
    /// Downloads a file from storage
    /// </summary>
    /// <param name="key">Storage key/path</param>
    /// <returns>File stream</returns>
    Task<Stream> DownloadAsync(string key);
    
    /// <summary>
    /// Deletes a file from storage
    /// </summary>
    /// <param name="key">Storage key/path</param>
    Task DeleteAsync(string key);
    
    /// <summary>
    /// Checks if a file exists
    /// </summary>
    /// <param name="key">Storage key/path</param>
    /// <returns>True if file exists</returns>
    Task<bool> ExistsAsync(string key);
    
    /// <summary>
    /// Gets a pre-signed URL for temporary access
    /// </summary>
    /// <param name="key">Storage key/path</param>
    /// <param name="expiry">Expiry time for the URL</param>
    /// <returns>Pre-signed URL</returns>
    Task<string> GetPresignedUrlAsync(string key, TimeSpan expiry);
    
    /// <summary>
    /// Lists files in a directory/prefix
    /// </summary>
    /// <param name="prefix">Directory prefix</param>
    /// <returns>List of file keys</returns>
    Task<IEnumerable<string>> ListAsync(string prefix);
}

public class StorageSettings
{
    public string Provider { get; set; } = "S3"; // S3 or Local
    public string? BucketName { get; set; }
    public string? Region { get; set; }
    public string? LocalPath { get; set; }
    public string? CdnUrl { get; set; }
    public bool UsePresignedUrls { get; set; } = true;
    public int PresignedUrlExpiryMinutes { get; set; } = 60;
}
