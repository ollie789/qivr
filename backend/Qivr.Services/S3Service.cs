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
}
