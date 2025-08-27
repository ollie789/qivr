using BCrypt.Net;

var passwords = new[] { "Demo123!", "Clinic123!", "Admin123!", "Patient123!" };
foreach (var pwd in passwords) 
{
    var hash = BCrypt.Net.BCrypt.HashPassword(pwd, 10);
    Console.WriteLine($"-- Password: {pwd}");
    Console.WriteLine($"-- Hash: {hash}");
}
