using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Text.Json;

namespace Qivr.Api.Extensions;

public static class SecretsManagerExtensions
{
    public static async Task AddSecretsManagerConfiguration(this ConfigurationManager configuration)
    {
        await AddSecretsManagerConfigurationInternal(configuration);
    }

    public static async Task AddSecretsManagerConfiguration(this IConfigurationBuilder configuration)
    {
        await AddSecretsManagerConfigurationInternal(configuration);
    }

    private static async Task AddSecretsManagerConfigurationInternal(IConfigurationBuilder configuration)
    {
        var region = Environment.GetEnvironmentVariable("AWS_REGION") ?? "ap-southeast-2";
        var secretName = Environment.GetEnvironmentVariable("AWS_SECRET_NAME") ?? "qivr/api/production";
        
        try
        {
            var client = new AmazonSecretsManagerClient(RegionEndpoint.GetBySystemName(region));
            
            var request = new GetSecretValueRequest
            {
                SecretId = secretName,
                VersionStage = "AWSCURRENT"
            };

            var response = await client.GetSecretValueAsync(request);
            
            if (response.SecretString != null)
            {
                var secrets = JsonSerializer.Deserialize<Dictionary<string, string?>>(response.SecretString);
                if (secrets != null)
                {
                    configuration.AddInMemoryCollection(secrets);
                }
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail startup if secrets manager is not available
            Console.WriteLine($"Warning: Could not load secrets from AWS Secrets Manager: {ex.Message}");
        }
    }

    public static IServiceCollection AddSecretsManager(this IServiceCollection services)
    {
        var region = Environment.GetEnvironmentVariable("AWS_REGION") ?? "ap-southeast-2";
        
        services.AddSingleton<IAmazonSecretsManager>(sp =>
        {
            return new AmazonSecretsManagerClient(RegionEndpoint.GetBySystemName(region));
        });
        
        return services;
    }
}