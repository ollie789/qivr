using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface ISaasTenantService
{
    Task<string> CreateTenantUserPoolAsync(string tenantName, CancellationToken cancellationToken = default);
    Task<string> CreateTenantUserPoolClientAsync(string userPoolId, string tenantName, CancellationToken cancellationToken = default);
    Task DeleteTenantUserPoolAsync(string userPoolId, CancellationToken cancellationToken = default);
    Task CreateUserInTenantPoolAsync(string userPoolId, string email, string password, string firstName, string lastName);
}

public class SaasTenantService : ISaasTenantService
{
    private readonly IAmazonCognitoIdentityProvider _cognitoClient;
    private readonly ILogger<SaasTenantService> _logger;

    public SaasTenantService(IAmazonCognitoIdentityProvider cognitoClient, ILogger<SaasTenantService> logger)
    {
        _cognitoClient = cognitoClient;
        _logger = logger;
    }

    public async Task<string> CreateTenantUserPoolAsync(string tenantName, CancellationToken cancellationToken = default)
    {
        var poolName = $"qivr-{tenantName.ToLowerInvariant().Replace(" ", "-")}";
        
        var request = new CreateUserPoolRequest
        {
            PoolName = poolName,
            Policies = new UserPoolPolicyType
            {
                PasswordPolicy = new PasswordPolicyType
                {
                    MinimumLength = 8,
                    RequireUppercase = true,
                    RequireLowercase = true,
                    RequireNumbers = true,
                    RequireSymbols = false
                }
            },
            AutoVerifiedAttributes = new List<string> { "email" },
            UsernameAttributes = new List<string> { "email" },
            Schema = new List<SchemaAttributeType>
            {
                new SchemaAttributeType
                {
                    Name = "email",
                    AttributeDataType = AttributeDataType.String,
                    Required = true,
                    Mutable = true
                },
                new SchemaAttributeType
                {
                    Name = "tenant_id",
                    AttributeDataType = AttributeDataType.String,
                    Required = false,
                    Mutable = false
                }
            }
        };

        var response = await _cognitoClient.CreateUserPoolAsync(request, cancellationToken);
        
        _logger.LogInformation("Created user pool {UserPoolId} for tenant {TenantName}", response.UserPool.Id, tenantName);
        
        return response.UserPool.Id;
    }

    public async Task<string> CreateTenantUserPoolClientAsync(string userPoolId, string tenantName, CancellationToken cancellationToken = default)
    {
        var clientName = $"qivr-{tenantName.ToLowerInvariant().Replace(" ", "-")}-client";
        
        var request = new CreateUserPoolClientRequest
        {
            UserPoolId = userPoolId,
            ClientName = clientName,
            GenerateSecret = false, // For web apps, typically no secret
            ExplicitAuthFlows = new List<string>
            {
                "ALLOW_USER_SRP_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH"
            },
            SupportedIdentityProviders = new List<string> { "COGNITO" },
            CallbackURLs = new List<string>
            {
                "https://dwmqwnt4dy1td.cloudfront.net", // Clinic dashboard
                "http://localhost:3010" // Local development
            },
            LogoutURLs = new List<string>
            {
                "https://dwmqwnt4dy1td.cloudfront.net/login",
                "http://localhost:3010/login"
            },
            AllowedOAuthFlows = new List<string> { "code" },
            AllowedOAuthScopes = new List<string> { "openid", "email", "profile" },
            AllowedOAuthFlowsUserPoolClient = true
        };

        var response = await _cognitoClient.CreateUserPoolClientAsync(request, cancellationToken);
        
        _logger.LogInformation("Created user pool client {ClientId} for tenant {TenantName}", response.UserPoolClient.ClientId, tenantName);
        
        return response.UserPoolClient.ClientId;
    }

    public async Task CreateUserInTenantPoolAsync(string userPoolId, string email, string password, string firstName, string lastName)
    {
        var createUserRequest = new AdminCreateUserRequest
        {
            UserPoolId = userPoolId,
            Username = email,
            TemporaryPassword = password,
            MessageAction = MessageActionType.SUPPRESS, // Don't send welcome email
            UserAttributes = new List<AttributeType>
            {
                new() { Name = "email", Value = email },
                new() { Name = "email_verified", Value = "true" },
                new() { Name = "given_name", Value = firstName },
                new() { Name = "family_name", Value = lastName }
            }
        };

        await _cognitoClient.AdminCreateUserAsync(createUserRequest);
        
        // Set permanent password
        var setPasswordRequest = new AdminSetUserPasswordRequest
        {
            UserPoolId = userPoolId,
            Username = email,
            Password = password,
            Permanent = true
        };

        await _cognitoClient.AdminSetUserPasswordAsync(setPasswordRequest);
    }

    public async Task DeleteTenantUserPoolAsync(string userPoolId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _cognitoClient.DeleteUserPoolAsync(new DeleteUserPoolRequest
            {
                UserPoolId = userPoolId
            }, cancellationToken);
            
            _logger.LogInformation("Deleted user pool {UserPoolId}", userPoolId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete user pool {UserPoolId}", userPoolId);
            throw;
        }
    }
}
