using BCrypt.Net;

namespace Qivr.Api.Utils;

public static class PasswordHasher
{
    /// <summary>
    /// Generate BCrypt hash for a password
    /// </summary>
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, 12); // Work factor of 12
    }
    
    /// <summary>
    /// Verify a password against a hash
    /// </summary>
    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
    
    /// <summary>
    /// Generate hashes for demo passwords
    /// Run this to get hashes for seed data
    /// </summary>
    public static void GenerateDemoHashes()
    {
        var passwords = new Dictionary<string, string>
        {
            ["Demo123!"] = "Demo user password",
            ["Clinic123!"] = "Clinic admin password",
            ["Admin123!"] = "Admin user password",
            ["Patient123!"] = "Patient user password"
        };
        
        Console.WriteLine("BCrypt Password Hashes for Seed Data:");
        Console.WriteLine("=====================================");
        foreach (var kvp in passwords)
        {
            var hash = HashPassword(kvp.Key);
            Console.WriteLine($"Password: {kvp.Key}");
            Console.WriteLine($"Description: {kvp.Value}");
            Console.WriteLine($"Hash: {hash}");
            Console.WriteLine();
        }
    }
}
