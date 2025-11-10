// Enhanced tenant assignment based on email domain
public async Task<UserDto> GetOrCreateUserFromCognitoAsync(string cognitoSub, string email, string? givenName, string? familyName, string? phone)
{
    var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub);
    
    if (user == null)
    {
        // Determine tenant based on email domain
        var tenantId = DetermineTenantFromEmail(email);
        
        user = new User
        {
            CognitoSub = cognitoSub,
            Email = email,
            FirstName = givenName ?? "",
            LastName = familyName ?? "",
            TenantId = tenantId,
            UserType = UserType.Patient,
            CreatedAt = DateTime.UtcNow
        };
        
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }
    
    return user.ToDto();
}

private Guid DetermineTenantFromEmail(string email)
{
    var domain = email.Split('@').LastOrDefault()?.ToLower();
    
    return domain switch
    {
        "clinic1.com" => Guid.Parse("tenant-1-guid"),
        "clinic2.com" => Guid.Parse("tenant-2-guid"),
        _ => Guid.Parse("b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11") // Default
    };
}
