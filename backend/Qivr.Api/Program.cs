using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Qivr.Api.Extensions;
using Qivr.Api.Middleware;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.OpenTelemetry(options =>
    {
        options.Endpoint = builder.Configuration["OpenTelemetry:Endpoint"] ?? "http://localhost:4317";
    })
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowedOrigins", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"])
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Configure Database
builder.Services.AddDbContext<QivrDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly("Qivr.Infrastructure");
            npgsqlOptions.EnableRetryOnFailure(3);
        });
    options.UseSnakeCaseNamingConvention();
});

// Configure Cognito Authentication
builder.Services.AddCognitoAuthentication(builder.Configuration);

// Configure Swagger/OpenAPI
builder.Services.AddSwaggerGen(c =>
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
});

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName: "qivr-api", serviceVersion: "1.0.0"))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri(builder.Configuration["OpenTelemetry:Endpoint"] ?? "http://localhost:4317");
            });
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri(builder.Configuration["OpenTelemetry:Endpoint"] ?? "http://localhost:4317");
            });
    });

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

// Register application services
builder.Services.AddQivrServices(builder.Configuration);

builder.Services.Configure<Qivr.Api.Options.IntakeDbOptions>(builder.Configuration.GetSection("Intake"));

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("intake", opt =>
    {
        opt.PermitLimit = 30;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
        opt.AutoReplenishment = true;
    });
});

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Qivr.Api.Controllers.IntakeController>();

var app = builder.Build();

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

// Security headers MUST be added early in the pipeline
app.UseSecurityHeaders();

app.UseHttpsRedirection();
app.UseCors("AllowedOrigins");
app.UseSerilogRequestLogging();

// Custom middleware
app.UseMiddleware<TenantMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();

// Use Cognito authentication
app.UseCognitoAuthentication();

app.Use(async (ctx, next) =>
{
    var rid = ctx.Request.Headers["X-Request-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
    ctx.Response.Headers["X-Request-ID"] = rid;
    using (app.Logger.BeginScope(new Dictionary<string, object?> { ["requestId"] = rid }))
        await next();
});

app.UseRateLimiter();

app.MapWhen(ctx => ctx.Request.Path.StartsWithSegments("/api/v1/intake"), b => b.UseRateLimiter());

app.MapControllers();
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = HealthChecks.UI.Client.UIResponseWriter.WriteHealthCheckUIResponse
});

// Apply migrations when flagged via configuration
if (builder.Configuration.GetValue<bool>("ApplyMigrations"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();
    await dbContext.Database.MigrateAsync();
}

Log.Information("Qivr API starting on {Environment} environment", app.Environment.EnvironmentName);

app.Run();
