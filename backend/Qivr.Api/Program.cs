using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Instrumentation.AWS;
using OpenTelemetry.ResourceDetectors.AWS;
using Qivr.Api.Extensions;
using Qivr.Api.Middleware;
using Qivr.Api.Services;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Qivr.Services.AI;
using Microsoft.AspNetCore.Mvc.Versioning;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Amazon.SQS;
using Qivr.Api.Workers;
using Qivr.Api.Services;
using Qivr.Api.Config;
using Microsoft.AspNetCore.HttpOverrides;
using Qivr.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Helper function to expand environment variable placeholders
static string ExpandEnvPlaceholders(string? value)
{
    if (string.IsNullOrWhiteSpace(value)) return string.Empty;
    return Regex.Replace(value, @"\$\{([^}]+)\}", match =>
    {
        var key = match.Groups[1].Value;
        return Environment.GetEnvironmentVariable(key) ?? string.Empty;
    });
}

// Load secrets from AWS Secrets Manager in production
// TODO: Implement AWS Secrets Manager integration
// if (Environment.GetEnvironmentVariable("ENVIRONMENT") == "production")
// {
//     await builder.Configuration.AddSecretsManagerConfiguration();
// }

// Ensure environment variables override JSON and include post-secrets values
builder.Configuration.AddEnvironmentVariables();

// Back-compat: map legacy env var names to Cognito config keys
var cognitoAliasMap = new Dictionary<string, string?>();
void MapIfSet(string key, string? value)
{
    if (!string.IsNullOrWhiteSpace(value))
    {
        cognitoAliasMap[key] = value;
    }
}

MapIfSet("Cognito:Region", Environment.GetEnvironmentVariable("COGNITO_REGION") ?? Environment.GetEnvironmentVariable("AWS_REGION"));
MapIfSet("Cognito:UserPoolId", Environment.GetEnvironmentVariable("COGNITO_USER_POOL_ID"));
MapIfSet("Cognito:UserPoolClientId", Environment.GetEnvironmentVariable("COGNITO_CLIENT_ID"));
MapIfSet("Cognito:UserPoolClientSecret", Environment.GetEnvironmentVariable("COGNITO_CLIENT_SECRET"));
MapIfSet("Cognito:UserPoolDomain", Environment.GetEnvironmentVariable("COGNITO_DOMAIN"));
MapIfSet("Cognito:IdentityPoolId", Environment.GetEnvironmentVariable("COGNITO_IDENTITY_POOL_ID"));

if (cognitoAliasMap.Count > 0)
{
    builder.Configuration.AddInMemoryCollection(cognitoAliasMap);
}

// Expand ${VAR} placeholders from JSON for Cognito section if present
var cognitoSectionRaw = builder.Configuration.GetSection("Cognito");
var expandedCognito = new Dictionary<string, string?>();
foreach (var child in cognitoSectionRaw.GetChildren())
{
    var rawVal = child.Value;
    if (!string.IsNullOrWhiteSpace(rawVal))
    {
        var expanded = ExpandEnvPlaceholders(rawVal);
        if (!string.Equals(expanded, rawVal, StringComparison.Ordinal))
        {
            expandedCognito[$"Cognito:{child.Key}"] = expanded;
        }
    }
}
if (expandedCognito.Count > 0)
{
    builder.Configuration.AddInMemoryCollection(expandedCognito);
}

// Configure ProblemDetails for consistent error responses
builder.Services.AddProblemDetails();

// Configure Serilog
var loggerConfig = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}");

Log.Logger = loggerConfig.CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
// Add API Versioning
builder.Services.AddApiVersioningConfiguration();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use camelCase for JSON property names to match frontend conventions
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Allow reading of numbers from strings for flexibility
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
        // Include fields in serialization if needed
        options.JsonSerializerOptions.IncludeFields = true;
        // Allow string enum values (e.g., "Specialist" instead of 0)
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// Resolve connection strings securely (supports DATABASE_URL/INTAKE_DATABASE_URL and ${ENV_VAR} placeholders)
var defaultConnectionRaw = builder.Configuration.GetConnectionString("DefaultConnection");
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

// Support individual DB_* environment variables from Secrets Manager
var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUsername = Environment.GetEnvironmentVariable("DB_USERNAME");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

string? defaultConnection;
if (!string.IsNullOrWhiteSpace(dbHost) && !string.IsNullOrWhiteSpace(dbPassword))
{
    defaultConnection = $"Host={dbHost};Port={dbPort ?? "5432"};Database={dbName ?? "qivr"};Username={dbUsername ?? "qivr_user"};Password={dbPassword};SslMode=Require";
}
else if (!string.IsNullOrWhiteSpace(databaseUrl))
{
    defaultConnection = BuildPgConnectionStringFromUrl(databaseUrl, builder.Environment.IsDevelopment());
}
else
{
    defaultConnection = ExpandEnvPlaceholders(defaultConnectionRaw);
}

var intakeConnectionRaw = builder.Configuration["Intake:ConnectionString"];
var intakeDatabaseUrl = Environment.GetEnvironmentVariable("INTAKE_DATABASE_URL");
var resolvedIntakeConnection = !string.IsNullOrWhiteSpace(intakeDatabaseUrl)
    ? BuildPgConnectionStringFromUrl(intakeDatabaseUrl, builder.Environment.IsDevelopment())
    : ExpandEnvPlaceholders(intakeConnectionRaw);
if (string.IsNullOrWhiteSpace(resolvedIntakeConnection))
{
    resolvedIntakeConnection = defaultConnection;
}

// Configure CORS - Use specific allowed origins from configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .WithExposedHeaders("X-Request-ID", "X-Tenant-Id", "X-Total-Count");
    });
});

// Configure Database
builder.Services.AddDbContext<QivrDbContext>(options =>
{
    options.UseNpgsql(defaultConnection,
        npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly("Qivr.Infrastructure");
            npgsqlOptions.EnableRetryOnFailure(3);
        });
    options.UseSnakeCaseNamingConvention();
});

// Configure Email Services
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<EmailConfiguration>(builder.Configuration.GetSection("Email"));

// Legacy email service (deprecated)
builder.Services.AddScoped<Qivr.Api.Services.IEmailService, Qivr.Api.Services.EmailService>();

// Modern SES email service
builder.Services.AddAWSService<Amazon.SimpleEmail.IAmazonSimpleEmailService>();
builder.Services.AddAWSService<Amazon.SecretsManager.IAmazonSecretsManager>();
builder.Services.AddScoped<IModernEmailService, ModernEmailService>();

builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IProfileService, ProfileService>();

// Configure Audit and Notification Services
builder.Services.AddScoped<IAuditLogger, DbAuditLogger>();
builder.Services.AddScoped<IEnhancedAuditService, EnhancedAuditService>();
builder.Services.AddScoped<IClinicAnalyticsService, ClinicAnalyticsService>();
builder.Services.AddScoped<IPatientAnalyticsService, PatientAnalyticsService>();
builder.Services.AddScoped<IPainMapAnalyticsService, PainMapAnalyticsService>();
builder.Services.AddScoped<IPainMapExportService, PainMapExportService>();
builder.Services.AddScoped<IPainPatternRecognitionService, PainPatternRecognitionService>();
builder.Services.AddScoped<IFhirPainMapService, FhirPainMapService>();
builder.Services.AddScoped<IQuietHoursService, QuietHoursService>();
builder.Services.AddScoped<INotificationGate, NotificationGate>();
builder.Services.AddScoped<IRealTimeNotificationService, RealTimeNotificationService>();
builder.Services.AddScoped<IAppointmentWaitlistService, AppointmentWaitlistService>();
builder.Services.AddScoped<IMessagingService, MessagingService>();
builder.Services.AddScoped<IPromSchedulingService, PromSchedulingService>();
builder.Services.AddScoped<ISmartNotificationService, SmartNotificationService>();
builder.Services.AddHostedService<PromSchedulingBackgroundService>();

// AI Services
builder.Services.AddAWSService<Amazon.BedrockRuntime.IAmazonBedrockRuntime>();
builder.Services.AddScoped<IBedrockService, BedrockService>();
builder.Services.AddScoped<IDeIdentificationService, DeIdentificationService>();
builder.Services.AddScoped<IAiTriageService, AiTriageService>();

// Document Management Services
builder.Services.AddAWSService<Amazon.S3.IAmazonS3>();
builder.Services.AddAWSService<Amazon.Textract.IAmazonTextract>();
builder.Services.AddAWSService<Amazon.Athena.IAmazonAthena>(); // For Admin Analytics
builder.Services.AddScoped<IS3Service, S3Service>();
builder.Services.AddScoped<ITextractService, TextractService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IOcrQueueService, OcrQueueService>();
builder.Services.AddScoped<IReferralService, ReferralService>();

// Add SignalR for real-time notifications
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    options.MaximumReceiveMessageSize = 64 * 1024; // 64KB
});

// Configure Redis caching
var redisConnection = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING") 
    ?? builder.Configuration.GetConnectionString("Redis")
    ?? "localhost:6379";

if (builder.Configuration.GetValue<bool>("Features:EnableRedisCache", true))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "qivr-";
    });
    
    builder.Services.AddSingleton<ICacheService, CacheService>();
    
    Console.WriteLine($"Redis caching enabled with connection: {(redisConnection.Contains("@") ? "[REDACTED]" : redisConnection)}");
}
else
{
    // Use in-memory cache as fallback
    builder.Services.AddDistributedMemoryCache();
    builder.Services.AddSingleton<ICacheService, CacheService>();
    
    Console.WriteLine("Redis caching disabled. Using in-memory cache (not suitable for production)");
}

// Configure Authorization Service for IDOR protection
builder.Services.AddScoped<Qivr.Api.Services.IResourceAuthorizationService, Qivr.Api.Services.ResourceAuthorizationService>();

// Configure Security Event Monitoring
builder.Services.AddScoped<Qivr.Api.Services.ISecurityEventService, Qivr.Api.Services.SecurityEventService>();

// Configure Storage Services (S3 or Local based on configuration)
builder.Services.AddStorageServices(builder.Configuration);

// Configure CSRF Protection
builder.Services.AddCsrfProtection();

// Add Secrets Manager service
// TODO: Implement Secrets Manager service
// builder.Services.AddSecretsManager();

// Configure Authentication - Always use Cognito for production
var useDevelopmentAuth = builder.Environment.IsDevelopment() &&
    (builder.Configuration.GetValue<bool?>("DevAuth:Enabled")
        ?? builder.Configuration.GetValue<bool?>("UseMockAuth")
        ?? false);

if (useDevelopmentAuth)
{
    builder.Services.AddDevelopmentAuthentication(builder.Configuration);
}
else
{
    builder.Services.AddCognitoAuthentication(builder.Configuration);
}

// Configure Swagger/OpenAPI with versioning support
builder.Services.AddVersionedSwagger(builder.Configuration);

// OLD Swagger configuration - Replaced by AddVersionedSwagger above
/*builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Qivr API",
        Version = "v1",
        Description = "Patient↔Allied Health Connector Platform API",
        Contact = new OpenApiContact
        {
            Name = "Qivr Support",
            Email = "support@qivr.health"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});*/

// Configure OpenTelemetry with AWS X-Ray
var enableTelemetry = builder.Configuration.GetValue<bool>("OpenTelemetry:Enabled", false);
if (enableTelemetry)
{
    var serviceName = builder.Configuration["OpenTelemetry:ServiceName"] ?? "qivr-api";
    var serviceVersion = builder.Configuration["OpenTelemetry:ServiceVersion"] ?? "1.0.0";
    var otlpEndpoint = builder.Configuration["OpenTelemetry:Endpoint"];
    
    builder.Services.AddOpenTelemetry()
        .ConfigureResource(resource => resource
            .AddService(serviceName: serviceName, serviceVersion: serviceVersion)
            .AddAttributes(new Dictionary<string, object>
            {
                ["deployment.environment"] = builder.Environment.EnvironmentName,
                ["cloud.provider"] = "aws",
                ["cloud.platform"] = "aws_ecs",
                ["cloud.region"] = Environment.GetEnvironmentVariable("AWS_REGION") ?? "ap-southeast-2"
            }))
        .WithTracing(tracing =>
        {
            tracing
                .AddAspNetCoreInstrumentation(options =>
                {
                    options.Filter = (httpContext) =>
                    {
                        // Don't trace health checks
                        return !httpContext.Request.Path.StartsWithSegments("/health");
                    };
                })
                .AddHttpClientInstrumentation()
                .AddAWSInstrumentation() // AWS SDK instrumentation
                .AddXRayTraceId() // Use X-Ray trace ID format
                .AddOtlpExporter(options =>
                {
                    // AWS X-Ray OTLP endpoint (via ADOT Collector)
                    options.Endpoint = new Uri(otlpEndpoint ?? "http://localhost:4317");
                });
        })
        .WithMetrics(metrics =>
        {
            metrics
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(otlpEndpoint ?? "http://localhost:4317");
                });
        });
    
    Log.Information("OpenTelemetry enabled with AWS X-Ray - Service: {ServiceName}, Version: {ServiceVersion}, Environment: {Environment}", 
        serviceName, serviceVersion, builder.Environment.EnvironmentName);
}
else
{
    Log.Information("OpenTelemetry disabled");
}

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(defaultConnection!)
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

// Register application services
builder.Services.AddQivrServices(builder.Configuration);

// Add AWS Cognito Identity Provider client for SaaS multi-tenant auth
builder.Services.AddAWSService<Amazon.CognitoIdentityProvider.IAmazonCognitoIdentityProvider>();

builder.Services.Configure<Qivr.Api.Options.IntakeDbOptions>(builder.Configuration.GetSection("Intake"));
builder.Services.Configure<Qivr.Api.Options.SqsOptions>(builder.Configuration.GetSection("Sqs"));
builder.Services.Configure<Qivr.Api.Options.FeaturesOptions>(builder.Configuration.GetSection("Features"));
builder.Services.Configure<Qivr.Api.Options.BrandingOptions>(builder.Configuration.GetSection("Branding"));
builder.Services.Configure<Qivr.Api.Options.NotificationsOptions>(builder.Configuration.GetSection("Notifications"));

// Ensure Intake connection string is always resolved securely
builder.Services.PostConfigure<Qivr.Api.Options.IntakeDbOptions>(options =>
{
    options.ConnectionString = resolvedIntakeConnection;
});

// Ensure SQS Queue URL is always resolved securely from environment variables
builder.Services.PostConfigure<Qivr.Api.Options.SqsOptions>(options =>
{
    if (!string.IsNullOrWhiteSpace(options.QueueUrl))
    {
        options.QueueUrl = ExpandEnvPlaceholders(options.QueueUrl);
    }
    if (!string.IsNullOrWhiteSpace(options.Region))
    {
        options.Region = ExpandEnvPlaceholders(options.Region);
    }
});

// Respect proxy headers for correct scheme/origin when behind reverse proxies
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Replace with enhanced user-based rate limiting
builder.Services.AddUserBasedRateLimiting();
builder.Services.AddScoped<IRateLimitMetricsService, RateLimitMetricsService>();

// OLD Rate limiting configuration - Replaced by AddUserBasedRateLimiting above
/*builder.Services.AddRateLimiter(options =>
{
    // Strict rate limiting for authentication endpoints
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 5; // Only 5 attempts per minute
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
        opt.AutoReplenishment = true;
    });
    
    // Very strict for password reset
    options.AddFixedWindowLimiter("password-reset", opt =>
    {
        opt.PermitLimit = 3; // Only 3 attempts per 5 minutes
        opt.Window = TimeSpan.FromMinutes(5);
        opt.QueueLimit = 0;
        opt.AutoReplenishment = true;
    });
    
    // Moderate limiting for intake submissions
    options.AddFixedWindowLimiter("intake", opt =>
    {
        opt.PermitLimit = 30;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
        opt.AutoReplenishment = true;
    });
    
    // General API rate limit
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 10;
        opt.AutoReplenishment = true;
    });
    
    // Global limiter as fallback
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 50
            }));
});*/

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Qivr.Api.Validators.IntakeSubmissionRequestValidator>();

// AWS SQS
var sqsConfig = builder.Configuration.GetSection("Sqs");
var expandedQueueUrl = ExpandEnvPlaceholders(sqsConfig["QueueUrl"]);
if (!string.IsNullOrEmpty(expandedQueueUrl))
{
    builder.Services.AddSingleton<IAmazonSQS>(sp =>
    {
        var region = ExpandEnvPlaceholders(sqsConfig["Region"]) ?? "ap-southeast-2";
        var config = new AmazonSQSConfig
        {
            RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(region)
        };
        return new AmazonSQSClient(config);
    });
    
    // Register the background worker
    builder.Services.AddHostedService<IntakeProcessingWorker>();
}

var app = builder.Build();

// Configure consistent error handling
app.UseExceptionHandler();
app.UseStatusCodePages();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Qivr API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

// Respect X-Forwarded-* headers before security/redirects when running behind a proxy
app.UseForwardedHeaders();

// Security headers MUST be added early in the pipeline
app.UseSecurityHeaders();

// Conditionally redirect HTTP->HTTPS based on configuration to avoid breaking container health checks
if (builder.Configuration.GetValue<bool>("Security:RequireHttps"))
{
    app.UseHttpsRedirection();
}

app.UseSerilogRequestLogging();

// Routing must occur before authN/authZ when using endpoint routing
app.UseRouting();

// Apply CORS - use default policy which is already configured appropriately
app.UseCors();

// Add request ID tracking
app.Use(async (ctx, next) =>
{
    var rid = ctx.Request.Headers["X-Request-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
    ctx.Response.Headers["X-Request-ID"] = rid;
    using (app.Logger.BeginScope(new Dictionary<string, object?> { ["requestId"] = rid }))
        await next();
});


// Serve static files (swagger assets, health probes, etc.)
app.UseStaticFiles();

// Custom middleware
app.UseMiddleware<GlobalErrorHandlingMiddleware>();

// Authentication must run before tenant resolution so JWT claims are available
app.UseAuthentication();

// Auto-create users from Cognito claims
app.UseMiddleware<AutoCreateUserMiddleware>();

app.UseMiddleware<TenantMiddleware>();
// Idempotency for mutating requests
app.UseMiddleware<IdempotencyMiddleware>();

app.UseAuthorization();

// CSRF Protection (must come after authentication)
// Temporarily disabled - JWT Bearer tokens provide sufficient protection
// if (!app.Environment.IsDevelopment())
// {
//     app.UseCsrfProtection();
// }

// Rate limiting
app.UseRateLimiter();

// Map endpoints
app.MapControllers();
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = HealthChecks.UI.Client.UIResponseWriter.WriteHealthCheckUIResponse
});

// Map SignalR hub
app.MapHub<NotificationHub>("/hubs/notifications");

// Apply migrations when flagged via configuration
var applyMigrations = Environment.GetEnvironmentVariable("APPLY_MIGRATIONS")?.ToLower() != "false";
if (applyMigrations)
{
    Log.Information("Applying database migrations...");
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();
    
    try
    {
        await dbContext.Database.MigrateAsync();
        Log.Information("✅ Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Failed to apply database migrations");
        throw;
    }
}

Log.Information("Qivr API starting on {Environment} environment", app.Environment.EnvironmentName);

app.Run();

static string BuildPgConnectionStringFromUrl(string url, bool isDevelopment)
{
    // Supports postgres://user:pass@host:port/dbname?sslmode=require
    var uri = new Uri(url);
    var userInfo = uri.UserInfo.Split(':', 2, StringSplitOptions.None);
    var username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? string.Empty);
    var password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty);
    var database = uri.AbsolutePath.TrimStart('/');

    // Extract sslmode if provided without relying on System.Web
    // uri.Query may start with '?', so trim it first
    var rawQuery = uri.Query.StartsWith("?") ? uri.Query.Substring(1) : uri.Query;
    string? sslMode = null;
    if (!string.IsNullOrEmpty(rawQuery))
    {
        foreach (var pair in rawQuery.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = pair.Split('=', 2, StringSplitOptions.None);
            if (kv.Length == 2 && string.Equals(kv[0], "sslmode", StringComparison.OrdinalIgnoreCase))
            {
                sslMode = Uri.UnescapeDataString(kv[1]);
                break;
            }
        }
    }

    // Default SSL behavior: require in non-development if not specified
    if (string.IsNullOrWhiteSpace(sslMode))
    {
        sslMode = isDevelopment ? "Disable" : "Require";
    }

    var host = uri.Host;
    var port = uri.Port > 0 ? uri.Port.ToString() : "5432";

    // Build Npgsql connection string
    var sb = new StringBuilder();
    sb.Append($"Host={host};Port={port};Database={database};Username={username};Password={password};SslMode={sslMode}");

    // In development, allow trusting server certs if SSL is enabled
    if (sslMode is not null && !sslMode.Equals("Disable", StringComparison.OrdinalIgnoreCase) && isDevelopment)
    {
        sb.Append(";Trust Server Certificate=true");
    }

    return sb.ToString();
}

// Make the Program class public so it can be referenced in tests
public partial class Program { }
