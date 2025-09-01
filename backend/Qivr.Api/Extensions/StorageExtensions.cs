using Amazon;
using Amazon.S3;
using Qivr.Core.Interfaces;
using Qivr.Infrastructure.Services;

namespace Qivr.Api.Extensions;

public static class StorageExtensions
{
    public static IServiceCollection AddStorageServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure storage settings
        services.Configure<StorageSettings>(configuration.GetSection("Storage"));
        
        var storageSettings = configuration.GetSection("Storage").Get<StorageSettings>() 
            ?? new StorageSettings();

        // Register the appropriate storage service based on configuration
        if (storageSettings.Provider?.ToUpperInvariant() == "S3")
        {
            // Configure AWS S3 client
            services.AddSingleton<IAmazonS3>(sp =>
            {
                var config = new AmazonS3Config();
                
                if (!string.IsNullOrEmpty(storageSettings.Region))
                {
                    config.RegionEndpoint = RegionEndpoint.GetBySystemName(storageSettings.Region);
                }
                else
                {
                    config.RegionEndpoint = RegionEndpoint.USEast1; // Default region
                }

                // For local development with LocalStack or MinIO
                if (!string.IsNullOrEmpty(configuration["Storage:ServiceUrl"]))
                {
                    config.ServiceURL = configuration["Storage:ServiceUrl"];
                    config.ForcePathStyle = true;
                    config.UseHttp = configuration["Storage:UseHttp"] == "true";
                }

                // Create S3 client with credentials from various sources
                // 1. Try explicit credentials from configuration
                var accessKey = configuration["Storage:AccessKey"] ?? configuration["AWS:AccessKey"];
                var secretKey = configuration["Storage:SecretKey"] ?? configuration["AWS:SecretKey"];
                
                if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
                {
                    return new AmazonS3Client(accessKey, secretKey, config);
                }
                
                // 2. Use IAM role or default credentials chain
                return new AmazonS3Client(config);
            });

            // Register S3 storage service
            services.AddScoped<IStorageService, S3StorageService>();
            
            Console.WriteLine($"Storage configured: S3 (Bucket: {storageSettings.BucketName}, Region: {storageSettings.Region})");
        }
        else
        {
            // Register local storage service for development or as fallback
            services.AddScoped<IStorageService, LocalStorageService>();
            
            Console.WriteLine($"Storage configured: Local (Path: {storageSettings.LocalPath ?? "uploads"})");
        }

        return services;
    }
}
