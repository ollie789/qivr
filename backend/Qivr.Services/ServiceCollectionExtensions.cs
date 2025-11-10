using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using FluentValidation.AspNetCore;
using MediatR;
using System.Reflection;

namespace Qivr.Services;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddQivrServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Add MediatR
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        });
        
        // Add FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        
        // Add AutoMapper
        services.AddAutoMapper(Assembly.GetExecutingAssembly());
        
        // Add application services
        services.AddScoped<IEvaluationService, EvaluationService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IEnhancedTenantService, EnhancedTenantService>();
        services.AddScoped<ISaasTenantService, SaasTenantService>();
        services.AddScoped<IPatientInvitationService, PatientInvitationService>();
        services.AddScoped<IProviderAvailabilityService, ProviderAvailabilityService>();
        services.AddScoped<IClinicManagementService, ClinicManagementService>();
        
        // Add infrastructure services
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ISmsService, SmsService>();
        services.AddScoped<IStorageService, S3StorageService>();
        
        // Register PROM service
        services.AddScoped<IPromService, PromService>();
        services.AddScoped<IPromInstanceService, PromInstanceService>();
        services.AddHttpClient<INotificationService, NotificationService>();

        // Add HttpClient for external APIs
        services.AddHttpClient("MessageMedia", client =>
        {
            client.BaseAddress = new Uri("https://api.messagemedia.com/v1/");
            var apiKey = configuration["MessageMedia:ApiKey"];
            var apiSecret = configuration["MessageMedia:ApiSecret"];
            if (!string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(apiSecret))
            {
                var credentials = Convert.ToBase64String(
                    System.Text.Encoding.ASCII.GetBytes($"{apiKey}:{apiSecret}"));
                client.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);
            }
        });
        
        return services;
    }
}

// Service interfaces
public interface IEvaluationService
{
    Task<Guid> CreateEvaluationAsync(CreateEvaluationDto dto, CancellationToken cancellationToken = default);
    Task<EvaluationDto?> GetEvaluationAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<EvaluationDto>> GetEvaluationsAsync(Guid? patientId = null, CancellationToken cancellationToken = default);
    Task UpdateEvaluationStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}

public interface IAppointmentService
{
    Task<Guid> CreateAppointmentAsync(CreateAppointmentDto dto, CancellationToken cancellationToken = default);
    Task<AppointmentDto?> GetAppointmentAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<AppointmentDto>> GetAppointmentsAsync(DateTime? from = null, DateTime? to = null, CancellationToken cancellationToken = default);
    Task<bool> CheckAvailabilityAsync(Guid providerId, DateTime start, DateTime end, CancellationToken cancellationToken = default);
}

public interface IUserService
{
    Task<UserDto?> GetUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto?> GetUserByCognitoSubAsync(string cognitoSub, CancellationToken cancellationToken = default);
    Task<Guid> CreateUserAsync(CreateUserDto dto, CancellationToken cancellationToken = default);
    Task<UserDto> GetOrCreateUserFromCognitoAsync(string cognitoSub, string email, string? givenName, string? familyName, string? phone, CancellationToken cancellationToken = default);
}

public interface ITenantService
{
    Task<TenantDto?> GetTenantAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TenantDto?> GetTenantBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TenantAccessDto>> GetTenantsForUserAsync(Guid userId, string? cognitoSub, CancellationToken cancellationToken = default);
    Task<TenantDto> CreateTenantAsync(string name, string address, string phone, string email, Guid userId, CancellationToken cancellationToken = default);
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
    Task SendTemplateEmailAsync(string to, string templateId, Dictionary<string, string> variables, CancellationToken cancellationToken = default);
}

public interface ISmsService
{
    Task SendSmsAsync(string to, string message, CancellationToken cancellationToken = default);
}

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> GetFileAsync(string fileKey, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string fileKey, CancellationToken cancellationToken = default);
}

// DTOs
public record CreateEvaluationDto(
    Guid PatientId,
    string ChiefComplaint,
    List<string> Symptoms,
    Dictionary<string, object> QuestionnaireResponses,
    List<PainMapDto> PainMaps
);

public record EvaluationDto(
    Guid Id,
    string EvaluationNumber,
    Guid PatientId,
    string PatientName,
    string ChiefComplaint,
    List<string> Symptoms,
    string Status,
    string? Urgency,
    DateTime CreatedAt
);

public record PainMapDto(
    string BodyRegion,
    float X,
    float Y,
    float Z,
    int Intensity,
    string? Type,
    List<string> Qualities
);

public record CreateAppointmentDto(
    Guid PatientId,
    Guid ProviderId,
    Guid? EvaluationId,
    DateTime ScheduledStart,
    DateTime ScheduledEnd,
    string AppointmentType,
    string LocationType,
    Dictionary<string, object>? LocationDetails
);

public record AppointmentDto(
    Guid Id,
    Guid PatientId,
    string PatientName,
    Guid ProviderId,
    Guid ProviderProfileId,
    string ProviderName,
    DateTime ScheduledStart,
    DateTime ScheduledEnd,
    string Status,
    string AppointmentType,
    string LocationType
);

public record CreateUserDto(
    string Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string UserType,
    string? CognitoSub
);

public record UserDto(
    Guid Id,
    Guid TenantId,
    string Email,
    string? FirstName,
    string? LastName,
    string FullName,
    string UserType,
    List<string> Roles
);

public record TenantDto(
    Guid Id,
    string Slug,
    string Name,
    string Status,
    string Plan,
    string Timezone,
    string Locale
);

public record TenantAccessDto(Guid Id, string Name, string? Slug, bool IsDefault);
