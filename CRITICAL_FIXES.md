# 🚨 QIVR Critical Security Fixes - Implementation Guide

This document provides immediate, copy-paste ready fixes for the **7 CRITICAL** security vulnerabilities identified in the security audit.

---

## Fix 1: Remove Hardcoded Secrets

### Step 1: Update appsettings.json
```json
{
  "Jwt": {
    "SecretKey": "${JWT_SECRET_KEY}",
    "Issuer": "${JWT_ISSUER}",
    "Audience": "${JWT_AUDIENCE}",
    "ExpiryMinutes": 60
  },
  "ConnectionStrings": {
    "DefaultConnection": "${DATABASE_URL}"
  },
  "MessageMedia": {
    "ApiKey": "${MESSAGEMEDIA_API_KEY}",
    "ApiSecret": "${MESSAGEMEDIA_API_SECRET}"
  },
  "S3": {
    "AccessKey": "${S3_ACCESS_KEY}",
    "SecretKey": "${S3_SECRET_KEY}"
  }
}
```

### Step 2: Create .env file (add to .gitignore!)
```bash
# .env.development
JWT_SECRET_KEY=your-256-bit-secret-key-here-minimum-32-characters-long
JWT_ISSUER=qivr.health
JWT_AUDIENCE=qivr-api
DATABASE_URL=postgresql://qivr_user:password@localhost:5432/qivr
MESSAGEMEDIA_API_KEY=your-api-key
MESSAGEMEDIA_API_SECRET=your-api-secret
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

### Step 3: Update Program.cs to load environment variables
```csharp
// Add at the top of Program.cs
DotNetEnv.Env.Load(); // Install DotNetEnv NuGet package

// Or use built-in configuration
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables();
```

---

## Fix 2: SQL Injection Prevention

### Replace ALL raw SQL queries with LINQ or parameterized queries

**BEFORE (Vulnerable):**
```csharp
// AssignmentService.cs lines 48-50
var intakeExists = await _db.Database.SqlQuery<bool>(
    $"SELECT EXISTS(SELECT 1 FROM qivr.evaluations WHERE tenant_id = {tenantId} AND id = {intakeId})")
    .FirstOrDefaultAsync(ct);
```

**AFTER (Safe):**
```csharp
var intakeExists = await _db.Evaluations
    .AnyAsync(e => e.TenantId == tenantId && e.Id == intakeId && e.AssignedTo == null, ct);
```

### Fix all instances in AssignmentService.cs:
```csharp
public class AssignmentService : IAssignmentService
{
    public async Task<AssignmentDto> AssignIntakeAsync(
        Guid tenantId, Guid intakeId, Guid providerId, string? notes, CancellationToken ct = default)
    {
        // Check if intake exists using LINQ
        var intake = await _db.Evaluations
            .FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == intakeId && e.AssignedTo == null, ct);
        
        if (intake == null)
            throw new InvalidOperationException("Intake not found or already assigned");

        // Check provider exists
        var provider = await _db.Users
            .Where(u => u.TenantId == tenantId && u.Id == providerId && u.Roles.Contains("Clinician"))
            .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName, u.Email })
            .FirstOrDefaultAsync(ct);

        if (provider == null)
            throw new InvalidOperationException("Provider not found or not authorized");

        // Create assignment using EF Core
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            IntakeId = intakeId,
            ProviderId = providerId,
            AssignedAt = DateTime.UtcNow,
            Status = "active",
            Notes = notes
        };
        
        _db.Assignments.Add(assignment);
        
        // Update evaluation
        intake.AssignedTo = providerId;
        intake.Status = "reviewed";
        intake.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync(ct);
        
        return new AssignmentDto { /* ... */ };
    }
}
```

---

## Fix 3: Proper Tenant Isolation

### Enhanced TenantMiddleware.cs
```csharp
public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string? tenantId = null;
        string? userTenantId = null;
        
        // Get user's tenant from JWT
        if (context.User.Identity?.IsAuthenticated == true)
        {
            userTenantId = context.User.FindFirst("tenant_id")?.Value;
            tenantId = userTenantId;
        }
        
        // Check header tenant matches user's tenant
        var headerTenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(headerTenantId))
        {
            if (!string.IsNullOrEmpty(userTenantId) && headerTenantId != userTenantId)
            {
                _logger.LogWarning("Tenant mismatch: User {UserTenant} tried to access {RequestedTenant}", 
                    userTenantId, headerTenantId);
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("{\"error\":\"Forbidden: Tenant access denied\"}");
                return;
            }
            tenantId = headerTenantId;
        }
        
        // Set tenant context
        if (!string.IsNullOrEmpty(tenantId))
        {
            context.Items["TenantId"] = tenantId;
            context.Items["ValidatedTenant"] = true;
            _logger.LogDebug("Tenant context set: {TenantId}", tenantId);
        }
        else if (RequiresTenant(context.Request.Path))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("{\"error\":\"Tenant context required\"}");
            return;
        }
        
        await _next(context);
    }
    
    private bool RequiresTenant(PathString path)
    {
        var publicPaths = new[]
        {
            "/health",
            "/swagger",
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/forgot-password"
        };
        
        return !publicPaths.Any(p => path.StartsWithSegments(p));
    }
}
```

### Add Global Query Filter to DbContext
```csharp
// In QivrDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Add global query filter for all tenant entities
    modelBuilder.Entity<Evaluation>().HasQueryFilter(e => e.TenantId == _tenantId);
    modelBuilder.Entity<User>().HasQueryFilter(u => u.TenantId == _tenantId);
    modelBuilder.Entity<Appointment>().HasQueryFilter(a => a.TenantId == _tenantId);
    // ... add for all tenant-scoped entities
}

// Inject tenant context
public class QivrDbContext : DbContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _tenantId;
    
    public QivrDbContext(DbContextOptions<QivrDbContext> options, IHttpContextAccessor httpContextAccessor)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
        
        var tenantIdString = _httpContextAccessor.HttpContext?.Items["TenantId"]?.ToString();
        if (Guid.TryParse(tenantIdString, out var tenantId))
        {
            _tenantId = tenantId;
        }
    }
}
```

---

## Fix 4: Add IDOR Protection

### Create Authorization Service
```csharp
public interface IAuthorizationService
{
    Task<bool> UserOwnsResourceAsync(Guid userId, Guid resourceId, string resourceType);
    Task<bool> UserCanAccessTenantAsync(Guid userId, Guid tenantId);
}

public class AuthorizationService : IAuthorizationService
{
    private readonly QivrDbContext _db;
    
    public AuthorizationService(QivrDbContext db)
    {
        _db = db;
    }
    
    public async Task<bool> UserOwnsResourceAsync(Guid userId, Guid resourceId, string resourceType)
    {
        return resourceType switch
        {
            "appointment" => await _db.Appointments.AnyAsync(a => a.Id == resourceId && a.PatientId == userId),
            "evaluation" => await _db.Evaluations.AnyAsync(e => e.Id == resourceId && e.UserId == userId),
            "profile" => resourceId == userId,
            _ => false
        };
    }
    
    public async Task<bool> UserCanAccessTenantAsync(Guid userId, Guid tenantId)
    {
        return await _db.Users.AnyAsync(u => u.Id == userId && u.TenantId == tenantId);
    }
}
```

### Update Controllers
```csharp
[HttpGet("{id}")]
[Authorize]
public async Task<IActionResult> GetAppointment(Guid id)
{
    var userId = Guid.Parse(User.FindFirst("sub").Value);
    
    // Check ownership
    if (!await _authService.UserOwnsResourceAsync(userId, id, "appointment"))
    {
        return Forbid();
    }
    
    var appointment = await _db.Appointments.FindAsync(id);
    return Ok(appointment);
}
```

---

## Fix 5: Add Rate Limiting

### Configure Rate Limiting in Program.cs
```csharp
builder.Services.AddRateLimiter(options =>
{
    // General API rate limit
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
    
    // Strict limit for auth endpoints
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,  // Only 5 attempts per minute
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

app.UseRateLimiter();
```

### Apply to Auth Controller
```csharp
[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Add delay to slow down brute force
        await Task.Delay(500);
        // ... rest of login logic
    }
}
```

---

## Fix 6: Update Vulnerable Dependencies

### Update Qivr.Api.csproj
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <ItemGroup>
    <!-- Update OpenTelemetry packages -->
    <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.9.0" />
    <PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.9.0" />
    
    <!-- Remove duplicate references -->
    <ProjectReference Include="..\Qivr.Core\Qivr.Core.csproj" />
    <ProjectReference Include="..\Qivr.Infrastructure\Qivr.Infrastructure.csproj" />
    <ProjectReference Include="..\Qivr.Services\Qivr.Services.csproj" />
  </ItemGroup>
</Project>
```

### Run update commands
```bash
dotnet add package OpenTelemetry.Instrumentation.AspNetCore --version 1.9.0
dotnet add package OpenTelemetry.Instrumentation.Http --version 1.9.0
dotnet restore
```

---

## Fix 7: Secure Token Storage (Frontend)

### Update authService.ts
```typescript
// DON'T store tokens in localStorage
class AuthService {
    private accessToken?: string;  // Keep in memory only
    
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await api.post('/api/auth/login', credentials, {
            withCredentials: true  // Include cookies
        });
        
        // Store access token in memory only
        this.accessToken = response.data.accessToken;
        
        // Refresh token should be httpOnly cookie from server
        // DON'T: localStorage.setItem('refreshToken', response.data.refreshToken);
        
        return response.data;
    }
    
    getAuthHeaders(): HeadersInit {
        return this.accessToken ? {
            'Authorization': `Bearer ${this.accessToken}`
        } : {};
    }
    
    logout(): void {
        this.accessToken = undefined;
        // Server should clear httpOnly cookie
    }
}
```

### Update backend to use httpOnly cookies
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    var result = await _authService.AuthenticateAsync(request.Username, request.Password);
    
    if (result.Success)
    {
        // Set refresh token as httpOnly cookie
        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,  // Always use HTTPS in production
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(30)
        });
        
        // Only return access token in response body
        return Ok(new { 
            accessToken = result.AccessToken,
            expiresIn = result.ExpiresIn
        });
    }
    
    return Unauthorized();
}
```

---

## Testing the Fixes

### 1. Test SQL Injection Fix
```bash
# Should return 400 Bad Request, not execute SQL
curl -X GET "http://localhost:5001/api/assignments?tenantId=';DROP TABLE users;--"
```

### 2. Test Tenant Isolation
```bash
# Get token for tenant A
TOKEN_A=$(curl -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"userA","password":"pass"}' | jq -r .accessToken)

# Try to access tenant B's data (should return 403)
curl -X GET http://localhost:5001/api/evaluations \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "X-Tenant-Id: tenant-b-id"
```

### 3. Test Rate Limiting
```bash
# Should block after 5 attempts
for i in {1..10}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:5001/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"test","password":"wrong"}'
  sleep 1
done
```

---

## Deployment Checklist

- [ ] All secrets moved to environment variables
- [ ] SQL injection vulnerabilities patched
- [ ] Tenant isolation enforced
- [ ] IDOR protection added
- [ ] Rate limiting configured
- [ ] Dependencies updated
- [ ] Tokens moved to httpOnly cookies
- [ ] Tested all critical endpoints
- [ ] Security headers configured
- [ ] Logging sanitized (no passwords/secrets)
- [ ] Database backups configured
- [ ] Monitoring alerts set up

---

**⚠️ WARNING**: Do not deploy to production until ALL critical issues are resolved!
