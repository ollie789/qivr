using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Any;

namespace Qivr.Api.Extensions;

public static class ApiVersioningExtensions
{
    public static IServiceCollection AddApiVersioningConfiguration(this IServiceCollection services)
    {
        services.AddApiVersioning(options =>
        {
            // Specify the default API Version
            options.DefaultApiVersion = new ApiVersion(1, 0);
            
            // If the client hasn't specified the API version in the request, use the default API version
            options.AssumeDefaultVersionWhenUnspecified = true;
            
            // Report API versions in response headers
            options.ReportApiVersions = true;
            
            // Support multiple versioning schemes
            options.ApiVersionReader = ApiVersionReader.Combine(
                // URL segment versioning: /api/v1/controller
                new UrlSegmentApiVersionReader(),
                // Header versioning: api-version: 1.0
                new HeaderApiVersionReader("api-version"),
                // Query string versioning: ?api-version=1.0
                new QueryStringApiVersionReader("api-version"),
                // Media type versioning: Accept: application/json;v=1.0
                new MediaTypeApiVersionReader("v")
            );
        });
        
        // Add API Explorer for versioning (needed for Swagger)
        services.AddVersionedApiExplorer(options =>
        {
            // Format: 'v'major[.minor][-status]
            options.GroupNameFormat = "'v'VVV";
            
            // Substitute the version in the URL
            options.SubstituteApiVersionInUrl = true;
        });
        
        // Configure API behavior options
        services.Configure<ApiBehaviorOptions>(options =>
        {
            // Suppress automatic model state validation
            // We'll handle it explicitly in controllers for better error messages
            options.SuppressModelStateInvalidFilter = false;
        });
        
        return services;
    }
    
    public static IServiceCollection AddVersionedSwagger(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSwaggerGen(options =>
        {
            // Add versioned API documentation
            options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Version = "v1",
                Title = "Qivr API - V1",
                Description = "Patient↔Allied Health Connector Platform API - Version 1",
                Contact = new Microsoft.OpenApi.Models.OpenApiContact
                {
                    Name = "Qivr Support",
                    Email = "support@qivr.health"
                },
                License = new Microsoft.OpenApi.Models.OpenApiLicense
                {
                    Name = "Proprietary",
                    Url = new Uri("https://qivr.health/terms")
                }
            });
            
            // Future version placeholder
            options.SwaggerDoc("v2", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Version = "v2",
                Title = "Qivr API - V2 (Preview)",
                Description = "Patient↔Allied Health Connector Platform API - Version 2 (Preview)",
                Contact = new Microsoft.OpenApi.Models.OpenApiContact
                {
                    Name = "Qivr Support",
                    Email = "support@qivr.health"
                }
            });
            
            // Configure bearer token authentication
            options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                Name = "Authorization",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            });
            
            options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                    {
                        Reference = new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
            
            // Add operation filters for better documentation
            options.OperationFilter<SwaggerDefaultValuesFilter>();
            options.OperationFilter<SwaggerResponseExamplesFilter>();
            
            // Include XML comments if available
            var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }
            
            // Custom schema filters
            options.SchemaFilter<SwaggerSchemaExamplesFilter>();
            
            // Use fully qualified names for schema IDs to avoid conflicts
            options.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
        });
        
        return services;
    }
}

// Operation filter to set default values
public class SwaggerDefaultValuesFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var apiDescription = context.ApiDescription;
        
        if (operation.Parameters == null)
            return;
            
        foreach (var parameter in operation.Parameters)
        {
            var description = apiDescription.ParameterDescriptions
                .First(p => p.Name == parameter.Name);
                
            parameter.Description ??= description.ModelMetadata?.Description;
            
            if (parameter.Schema.Default == null && description.DefaultValue != null)
            {
                parameter.Schema.Default = new Microsoft.OpenApi.Any.OpenApiString(description.DefaultValue.ToString());
            }
            
            parameter.Required |= description.IsRequired;
        }
    }
}

// Operation filter to add response examples
public class SwaggerResponseExamplesFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Add common error responses
        if (!operation.Responses.ContainsKey("400"))
        {
            operation.Responses.Add("400", new OpenApiResponse
            {
                Description = "Bad Request - Invalid input parameters",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.Schema,
                                Id = "ProblemDetails"
                            }
                        }
                    }
                }
            });
        }
        
        if (!operation.Responses.ContainsKey("401") && context.MethodInfo.GetCustomAttributes(typeof(AuthorizeAttribute), true).Any())
        {
            operation.Responses.Add("401", new OpenApiResponse
            {
                Description = "Unauthorized - Authentication required"
            });
        }
        
        if (!operation.Responses.ContainsKey("429"))
        {
            operation.Responses.Add("429", new OpenApiResponse
            {
                Description = "Too Many Requests - Rate limit exceeded"
            });
        }
        
        if (!operation.Responses.ContainsKey("500"))
        {
            operation.Responses.Add("500", new OpenApiResponse
            {
                Description = "Internal Server Error",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.Schema,
                                Id = "ProblemDetails"
                            }
                        }
                    }
                }
            });
        }
    }
}

// Schema filter to add examples
public class SwaggerSchemaExamplesFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        // Add examples for common DTOs
        if (context.Type.Name == "LoginRequest")
        {
            schema.Example = new Microsoft.OpenApi.Any.OpenApiObject
            {
                ["username"] = new Microsoft.OpenApi.Any.OpenApiString("user@example.com"),
                ["password"] = new Microsoft.OpenApi.Any.OpenApiString("SecurePassword123!")
            };
        }
        else if (context.Type.Name == "AppointmentDto")
        {
            schema.Example = new Microsoft.OpenApi.Any.OpenApiObject
            {
                ["id"] = new Microsoft.OpenApi.Any.OpenApiString("123e4567-e89b-12d3-a456-426614174000"),
                ["patientId"] = new Microsoft.OpenApi.Any.OpenApiString("456e7890-e89b-12d3-a456-426614174000"),
                ["providerId"] = new Microsoft.OpenApi.Any.OpenApiString("789e0123-e89b-12d3-a456-426614174000"),
                ["appointmentType"] = new Microsoft.OpenApi.Any.OpenApiString("Initial Consultation"),
                ["status"] = new Microsoft.OpenApi.Any.OpenApiString("Scheduled"),
                ["scheduledStart"] = new Microsoft.OpenApi.Any.OpenApiString("2024-01-15T10:00:00Z"),
                ["scheduledEnd"] = new Microsoft.OpenApi.Any.OpenApiString("2024-01-15T11:00:00Z")
            };
        }
    }
}