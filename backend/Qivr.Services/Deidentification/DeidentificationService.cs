using System.Security.Cryptography;
using System.Text;

namespace Qivr.Services.Deidentification;

public interface IDeidentificationService
{
    string MaskName(string? fullName);
    string MaskEmail(string? email);
    string MaskPhone(string? phone);
    string AgeBand(DateTime? dateOfBirth);
    string HashInternalId(Guid id, string salt);
}

public class DeidentificationService : IDeidentificationService
{
    public string MaskName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return string.Empty;
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return string.Empty;
        var first = parts[0];
        var lastInitial = parts.Length > 1 ? parts[^1].FirstOrDefault() : '\0';
        return lastInitial == '\0' ? $"{first[0]}***" : $"{first} {char.ToUpperInvariant(lastInitial)}.";
    }

    public string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) return string.Empty;
        var at = email.IndexOf('@');
        var local = email[..at];
        var domain = email[(at + 1)..];
        var localMasked = local.Length <= 2 ? new string('*', local.Length) : $"{local[0]}***{local[^1]}";
        var domainParts = domain.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (domainParts.Length == 0) return $"{localMasked}@***";
        var tld = domainParts[^1];
        var domMasked = domainParts.Length == 1 ? $"***.{tld}" : $"***.{tld}";
        return $"{localMasked}@{domMasked}";
    }

    public string MaskPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length <= 4) return new string('*', digits.Length);
        var last4 = digits[^4..];
        return $"***-***-{last4}";
    }

    public string AgeBand(DateTime? dateOfBirth)
    {
        if (dateOfBirth == null) return "unknown";
        var age = (int)((DateTime.UtcNow - dateOfBirth.Value).TotalDays / 365.25);
        return age switch
        {
            < 5 => "0-4",
            < 13 => "5-12",
            < 18 => "13-17",
            < 25 => "18-24",
            < 35 => "25-34",
            < 45 => "35-44",
            < 55 => "45-54",
            < 65 => "55-64",
            < 75 => "65-74",
            < 85 => "75-84",
            _ => "85+"
        };
    }

    public string HashInternalId(Guid id, string salt)
    {
        using var sha256 = SHA256.Create();
        var input = Encoding.UTF8.GetBytes(id.ToString("N") + ":" + salt);
        var hash = sha256.ComputeHash(input);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}

