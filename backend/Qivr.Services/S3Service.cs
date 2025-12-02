using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Qivr.Services;

public interface IS3Service
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> DownloadFileAsync(string s3Key, CancellationToken cancellationToken = default);
    Task<string> GetPresignedDownloadUrlAsync(string s3Key, int expirationMinutes = 60);
    Task DeleteFileAsync(string s3Key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate a presigned URL for direct client upload to S3 (bypasses API server memory)
    /// </summary>
    PresignedUploadResult GetPresignedUploadUrl(Guid tenantId, string fileName, string contentType, long maxFileSizeBytes = 52428800);

    /// <summary>
    /// Verify that an upload was completed successfully
    /// </summary>
    Task<S3ObjectMetadata?> VerifyUploadAsync(string s3Key, CancellationToken cancellationToken = default);
}

public class PresignedUploadResult
{
    public string UploadUrl { get; set; } = string.Empty;
    public string S3Key { get; set; } = string.Empty;
    public string S3Bucket { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public Dictionary<string, string> RequiredHeaders { get; set; } = new();
}

public class S3ObjectMetadata
{
    public string S3Key { get; set; } = string.Empty;
    public long ContentLength { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
}

public class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly ILogger<S3Service> _logger;
    private readonly string _bucketName;

    public S3Service(IAmazonS3 s3Client, IConfiguration configuration, ILogger<S3Service> logger)
    {
        _s3Client = s3Client;
        _logger = logger;
        _bucketName = configuration["AWS:S3:DocumentsBucket"] ?? "qivr-documents-prod";
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var s3Key = $"documents/{Guid.NewGuid()}/{fileName}";
        
        try
        {
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = fileStream,
                Key = s3Key,
                BucketName = _bucketName,
                ContentType = contentType,
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256,
                CannedACL = S3CannedACL.Private
            };

            var transferUtility = new TransferUtility(_s3Client);
            await transferUtility.UploadAsync(uploadRequest, cancellationToken);

            _logger.LogInformation("File uploaded to S3: {S3Key}", s3Key);
            return s3Key;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to S3: {FileName}", fileName);
            throw;
        }
    }

    public async Task<Stream> DownloadFileAsync(string s3Key, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = s3Key
            };

            var response = await _s3Client.GetObjectAsync(request, cancellationToken);
            return response.ResponseStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download file from S3: {S3Key}", s3Key);
            throw;
        }
    }

    public async Task<string> GetPresignedDownloadUrlAsync(string s3Key, int expirationMinutes = 60)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = s3Key,
                Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
                Verb = HttpVerb.GET
            };

            return await Task.FromResult(_s3Client.GetPreSignedURL(request));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned URL for S3 key: {S3Key}", s3Key);
            throw;
        }
    }

    public async Task DeleteFileAsync(string s3Key, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = s3Key
            };

            await _s3Client.DeleteObjectAsync(request, cancellationToken);
            _logger.LogInformation("File deleted from S3: {S3Key}", s3Key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file from S3: {S3Key}", s3Key);
            throw;
        }
    }

    public PresignedUploadResult GetPresignedUploadUrl(Guid tenantId, string fileName, string contentType, long maxFileSizeBytes = 52428800)
    {
        // Generate a unique S3 key with tenant isolation
        var s3Key = $"documents/{tenantId}/{Guid.NewGuid()}/{SanitizeFileName(fileName)}";
        var expiresAt = DateTime.UtcNow.AddMinutes(15); // 15 minute window for upload

        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = s3Key,
                Expires = expiresAt,
                Verb = HttpVerb.PUT,
                ContentType = contentType,
                Headers =
                {
                    ["x-amz-server-side-encryption"] = "AES256"
                }
            };

            var uploadUrl = _s3Client.GetPreSignedURL(request);

            _logger.LogInformation("Generated presigned upload URL for tenant {TenantId}: {S3Key}", tenantId, s3Key);

            return new PresignedUploadResult
            {
                UploadUrl = uploadUrl,
                S3Key = s3Key,
                S3Bucket = _bucketName,
                ExpiresAt = expiresAt,
                RequiredHeaders = new Dictionary<string, string>
                {
                    ["Content-Type"] = contentType,
                    ["x-amz-server-side-encryption"] = "AES256"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned upload URL for: {FileName}", fileName);
            throw;
        }
    }

    public async Task<S3ObjectMetadata?> VerifyUploadAsync(string s3Key, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _bucketName,
                Key = s3Key
            };

            var response = await _s3Client.GetObjectMetadataAsync(request, cancellationToken);

            return new S3ObjectMetadata
            {
                S3Key = s3Key,
                ContentLength = response.ContentLength,
                ContentType = response.Headers.ContentType,
                LastModified = response.LastModified
            };
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("S3 object not found during verification: {S3Key}", s3Key);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify S3 upload: {S3Key}", s3Key);
            throw;
        }
    }

    private static string SanitizeFileName(string fileName)
    {
        // Remove path separators and dangerous characters
        var sanitized = Path.GetFileName(fileName);
        foreach (var c in Path.GetInvalidFileNameChars())
        {
            sanitized = sanitized.Replace(c, '_');
        }
        return sanitized;
    }
}
