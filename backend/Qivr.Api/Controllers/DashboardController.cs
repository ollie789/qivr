using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IResourceAuthorizationService _authorizationService;

    public DashboardController(
        QivrDbContext context,
        IResourceAuthorizationService authorizationService)
    {
        _context = context;
        _authorizationService = authorizationService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = _authorizationService.GetCurrentUserId(User);
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        
        if (userId == Guid.Empty || tenantId == Guid.Empty)
        {
            return Unauthorized();
        }

        var today = DateTime.UtcNow.Date;
        var thisWeek = today.AddDays(-7);
        var thisMonth = today.AddDays(-30);

        var stats = new
        {
            totalPatients = await _context.Users
                .CountAsync(u => u.TenantId == tenantId && u.UserType == UserType.Patient),
            appointmentsToday = await _context.Appointments
                .CountAsync(a => a.ScheduledStart.Date == today && a.ProviderId == userId),
            appointmentsThisWeek = await _context.Appointments
                .CountAsync(a => a.ScheduledStart >= thisWeek && a.ProviderId == userId),
            completedProms = await _context.PromInstances
                .CountAsync(p => p.Status == PromStatus.Completed && p.CreatedAt >= thisMonth),
            unreadNotifications = await _context.Notifications
                .CountAsync(n => n.RecipientId == userId && n.ReadAt == null)
        };

        return Ok(stats);
    }
}
