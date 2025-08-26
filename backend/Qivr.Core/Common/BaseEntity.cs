namespace Qivr.Core.Common;

/// <summary>
/// Base entity for all domain models
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Base entity for tenant-specific models
/// </summary>
public abstract class TenantEntity : BaseEntity
{
    public Guid TenantId { get; set; }
}

/// <summary>
/// Base entity for soft-deletable models
/// </summary>
public abstract class DeletableEntity : TenantEntity
{
    public DateTime? DeletedAt { get; set; }
    public bool IsDeleted => DeletedAt.HasValue;
}

/// <summary>
/// Interface for auditable entities
/// </summary>
public interface IAuditable
{
    string? CreatedBy { get; set; }
    string? UpdatedBy { get; set; }
}

/// <summary>
/// Result wrapper for operations
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public Dictionary<string, string[]> ValidationErrors { get; }

    protected Result(bool isSuccess, T? value, string? error, Dictionary<string, string[]>? validationErrors = null)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
        ValidationErrors = validationErrors ?? new Dictionary<string, string[]>();
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
    public static Result<T> ValidationFailure(Dictionary<string, string[]> errors) => new(false, default, "Validation failed", errors);
}
