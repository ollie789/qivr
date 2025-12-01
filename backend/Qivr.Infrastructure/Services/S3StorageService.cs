using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qivr.Core.Interfaces;
using System.Net;

namespace Qivr.Infrastructure.Services;

public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly StorageSettings _settings;
    private readonly ILogger<S3StorageService> _logger;

    public S3StorageService(
        IAmazonS3 s3Client,
        IOptions<StorageSettings> settings,
        ILogger<S3StorageService> logger)
    {
        _s3Client = s3Client;
        _settings = settings.Value;
        _logger = logger;
        
        _logger.LogInformation("S3StorageService initialized with Bucket: {Bucket}, Region: {Region}", 
            _settings.BucketName ?? "(not set)", _settings.Region ?? "(not set)");
    }
    
    private void EnsureBucketConfigured()
    {
        if (string.IsNullOrEmpty(_settings.BucketName))
        {
            throw new InvalidOperationException("S3 bucket name is not configured");
        }
    }

    public async Task<string> UploadAsync(Stream stream, string key, string contentType, Dictionary<string, string>? metadata = null)
    {
        EnsureBucketConfigured();
        try
        {
            var request = new PutObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = key,
                InputStream = stream,
                ContentType = contentType,
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
            };

            // Add metadata if provided
            if (metadata != null)
            {
                foreach (var item in metadata)
                {
                    request.Metadata.Add(item.Key, item.Value);
                }
            }

            // Set cache control for images
            if (contentType.StartsWith("image/"))
            {
                request.Headers.CacheControl = "max-age=31536000"; // 1 year
            }

            var response = await _s3Client.PutObjectAsync(request);

            if (response.HttpStatusCode != HttpStatusCode.OK)
            {
                throw new Exception($"Failed to upload file to S3. Status: {response.HttpStatusCode}");
            }

            _logger.LogInformation("File uploaded to S3: {Key}", key);

            // Return CDN URL if configured, otherwise return the S3 URL or key
            if (!string.IsNullOrEmpty(_settings.CdnUrl))
            {
                return $"{_settings.CdnUrl.TrimEnd('/')}/{key}";
            }

            // If using presigned URLs, just return the key
            // The actual URL will be generated when needed
            if (_settings.UsePresignedUrls)
            {
                return key;
            }

            // Otherwise return the public S3 URL (bucket must be public)
            return $"https://{_settings.BucketName}.s3.{_settings.Region}.amazonaws.com/{key}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to S3: {Key}", key);
            throw;
        }
    }

    public async Task<Stream> DownloadAsync(string key)
    {
        EnsureBucketConfigured();
        try
        {
            var request = new GetObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = key
            };

            var response = await _s3Client.GetObjectAsync(request);

            if (response.HttpStatusCode != HttpStatusCode.OK)
            {
                throw new Exception($"Failed to download file from S3. Status: {response.HttpStatusCode}");
            }

            _logger.LogInformation("File downloaded from S3: {Key}", key);

            // Return the response stream
            // Note: The caller is responsible for disposing this stream
            return response.ResponseStream;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("File not found in S3: {Key}", key);
            throw new FileNotFoundException($"File not found: {key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file from S3: {Key}", key);
            throw;
        }
    }

    public async Task DeleteAsync(string key)
    {
        EnsureBucketConfigured();
        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = key
            };

            var response = await _s3Client.DeleteObjectAsync(request);

            if (response.HttpStatusCode != HttpStatusCode.NoContent)
            {
                throw new Exception($"Failed to delete file from S3. Status: {response.HttpStatusCode}");
            }

            _logger.LogInformation("File deleted from S3: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from S3: {Key}", key);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        EnsureBucketConfigured();
        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _settings.BucketName,
                Key = key
            };

            var response = await _s3Client.GetObjectMetadataAsync(request);
            return response.HttpStatusCode == HttpStatusCode.OK;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if file exists in S3: {Key}", key);
            throw;
        }
    }

    public async Task<string> GetPresignedUrlAsync(string key, TimeSpan expiry)
    {
        EnsureBucketConfigured();
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _settings.BucketName,
                Key = key,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.Add(expiry),
                Protocol = Protocol.HTTPS
            };

            var url = await _s3Client.GetPreSignedURLAsync(request);
            
            _logger.LogDebug("Generated presigned URL for key: {Key}", key);
            
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating presigned URL for key: {Key}", key);
            throw;
        }
    }

    public async Task<IEnumerable<string>> ListAsync(string prefix)
    {
        EnsureBucketConfigured();
        try
        {
            var request = new ListObjectsV2Request
            {
                BucketName = _settings.BucketName,
                Prefix = prefix,
                MaxKeys = 1000
            };

            var keys = new List<string>();
            ListObjectsV2Response response;

            do
            {
                response = await _s3Client.ListObjectsV2Async(request);
                
                foreach (var obj in response.S3Objects)
                {
                    keys.Add(obj.Key);
                }

                request.ContinuationToken = response.NextContinuationToken;
            }
            while (response.IsTruncated);

            _logger.LogInformation("Listed {Count} files with prefix: {Prefix}", keys.Count, prefix);

            return keys;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing files in S3 with prefix: {Prefix}", prefix);
            throw;
        }
    }

    /// <summary>
    /// Generates a presigned URL for uploading a file directly from the client
    /// </summary>
    public async Task<string> GetUploadPresignedUrlAsync(string key, string contentType, TimeSpan expiry, Dictionary<string, string>? metadata = null)
    {
        EnsureBucketConfigured();
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _settings.BucketName,
                Key = key,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.Add(expiry),
                ContentType = contentType,
                Protocol = Protocol.HTTPS,
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
            };

            // Add metadata if provided
            if (metadata != null)
            {
                foreach (var item in metadata)
                {
                    request.Metadata.Add(item.Key, item.Value);
                }
            }

            var url = await _s3Client.GetPreSignedURLAsync(request);
            
            _logger.LogDebug("Generated upload presigned URL for key: {Key}", key);
            
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating upload presigned URL for key: {Key}", key);
            throw;
        }
    }
}
