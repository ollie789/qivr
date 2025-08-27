using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Qivr.Services;

public interface IAssignmentService
{
    Task<AssignmentDto> AssignIntakeAsync(Guid tenantId, Guid intakeId, Guid providerId, string? notes, CancellationToken ct = default);
    Task<AssignmentDto> ReassignIntakeAsync(Guid tenantId, Guid intakeId, Guid newProviderId, string? reason, CancellationToken ct = default);
    Task<IReadOnlyList<AssignmentDto>> GetProviderAssignmentsAsync(Guid tenantId, Guid providerId, AssignmentStatus? status, CancellationToken ct = default);
    Task<IReadOnlyList<ProviderWorkloadDto>> GetProviderWorkloadsAsync(Guid tenantId, CancellationToken ct = default);
    Task<bool> UnassignIntakeAsync(Guid tenantId, Guid intakeId, string? reason, CancellationToken ct = default);
    Task<AssignmentHistoryDto> GetAssignmentHistoryAsync(Guid tenantId, Guid intakeId, CancellationToken ct = default);
}

public class AssignmentService : IAssignmentService
{
    private readonly QivrDbContext _db;
    private readonly ILogger<AssignmentService> _logger;
    private readonly INotificationService _notificationService;

    public AssignmentService(
        QivrDbContext db,
        ILogger<AssignmentService> logger,
        INotificationService notificationService)
    {
        _db = db;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<AssignmentDto> AssignIntakeAsync(
        Guid tenantId,
        Guid intakeId,
        Guid providerId,
        string? notes,
        CancellationToken ct = default)
    {
        var assignmentId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        // Check if intake exists and is not already assigned
        var intakeExists = await _db.Database.SqlQuery<bool>(
            $"SELECT EXISTS(SELECT 1 FROM qivr.evaluations WHERE tenant_id = {tenantId} AND id = {intakeId} AND assigned_to IS NULL)")
            .FirstOrDefaultAsync(ct);

        if (!intakeExists)
        {
            throw new InvalidOperationException("Intake not found or already assigned");
        }

        // Check if provider exists and is active
        var provider = await _db.Database.SqlQuery<ProviderInfo>(
            $@"SELECT id, first_name || ' ' || last_name as name, email 
               FROM qivr.users 
               WHERE tenant_id = {tenantId} AND id = {providerId} AND roles @> ARRAY['Clinician']::varchar[]")
            .FirstOrDefaultAsync(ct);

        if (provider == null)
        {
            throw new InvalidOperationException("Provider not found or not authorized");
        }

        // Create assignment record
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"INSERT INTO qivr.assignments (
                id, tenant_id, intake_id, provider_id, assigned_at, status, notes, created_at, updated_at
            ) VALUES (
                {assignmentId}, {tenantId}, {intakeId}, {providerId}, {now}, 
                {'active'}, {notes}, {now}, {now}
            )", ct);

        // Update evaluation with assigned provider
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE qivr.evaluations 
               SET assigned_to = {providerId}, 
                   status = 'Reviewing',
                   updated_at = {now}
               WHERE tenant_id = {tenantId} AND id = {intakeId}", ct);

        // Send notification to provider
        await _notificationService.SendProviderAssignmentNotificationAsync(
            providerId,
            intakeId,
            $"New intake assigned to you",
            ct);

        _logger.LogInformation(
            "Intake {IntakeId} assigned to provider {ProviderId} in tenant {TenantId}",
            intakeId, providerId, tenantId);

        return new AssignmentDto
        {
            Id = assignmentId,
            IntakeId = intakeId,
            ProviderId = providerId,
            ProviderName = provider.Name,
            AssignedAt = now,
            Status = AssignmentStatus.Active,
            Notes = notes
        };
    }

    public async Task<AssignmentDto> ReassignIntakeAsync(
        Guid tenantId,
        Guid intakeId,
        Guid newProviderId,
        string? reason,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        // Get current assignment
        var currentAssignment = await _db.Database.SqlQuery<AssignmentInfo>(
            $@"SELECT a.id, a.provider_id, u.first_name || ' ' || u.last_name as provider_name
               FROM qivr.assignments a
               JOIN qivr.users u ON u.id = a.provider_id
               WHERE a.tenant_id = {tenantId} AND a.intake_id = {intakeId} AND a.status = 'active'")
            .FirstOrDefaultAsync(ct);

        if (currentAssignment == null)
        {
            throw new InvalidOperationException("No active assignment found for this intake");
        }

        // Mark current assignment as reassigned
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE qivr.assignments 
               SET status = 'reassigned', 
                   completed_at = {now},
                   completion_reason = {reason},
                   updated_at = {now}
               WHERE id = {currentAssignment.Id}", ct);

        // Create new assignment
        var newAssignment = await AssignIntakeAsync(tenantId, intakeId, newProviderId, 
            $"Reassigned from {currentAssignment.ProviderName}. Reason: {reason}", ct);

        // Notify both providers
        await Task.WhenAll(
            _notificationService.SendProviderAssignmentNotificationAsync(
                currentAssignment.ProviderId,
                intakeId,
                $"Intake reassigned to another provider",
                ct),
            _notificationService.SendProviderAssignmentNotificationAsync(
                newProviderId,
                intakeId,
                $"Intake reassigned to you from {currentAssignment.ProviderName}",
                ct)
        );

        return newAssignment;
    }

    public async Task<IReadOnlyList<AssignmentDto>> GetProviderAssignmentsAsync(
        Guid tenantId,
        Guid providerId,
        AssignmentStatus? status,
        CancellationToken ct = default)
    {
        var statusFilter = status.HasValue 
            ? $" AND a.status = '{status.Value.ToString().ToLowerInvariant()}'"
            : "";

        var assignments = await _db.Database.SqlQuery<AssignmentDto>(
            $@"SELECT 
                a.id, a.intake_id as IntakeId, a.provider_id as ProviderId,
                u.first_name || ' ' || u.last_name as ProviderName,
                a.assigned_at as AssignedAt, a.status, a.notes,
                e.patient_name as PatientName, e.chief_complaint as ChiefComplaint,
                e.urgency as Urgency
               FROM qivr.assignments a
               JOIN qivr.users u ON u.id = a.provider_id
               JOIN qivr.evaluations e ON e.id = a.intake_id
               WHERE a.tenant_id = {tenantId} AND a.provider_id = {providerId}{statusFilter}
               ORDER BY a.assigned_at DESC")
            .ToListAsync(ct);

        return assignments;
    }

    public async Task<IReadOnlyList<ProviderWorkloadDto>> GetProviderWorkloadsAsync(
        Guid tenantId,
        CancellationToken ct = default)
    {
        var workloads = await _db.Database.SqlQuery<ProviderWorkloadDto>(
            $@"SELECT 
                u.id as ProviderId,
                u.first_name || ' ' || u.last_name as ProviderName,
                COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') as ActiveAssignments,
                COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed' AND a.completed_at > NOW() - INTERVAL '7 days') as CompletedThisWeek,
                AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at))/3600) FILTER (WHERE a.status = 'completed') as AvgCompletionHours,
                MAX(a.assigned_at) as LastAssignedAt
               FROM qivr.users u
               LEFT JOIN qivr.assignments a ON a.provider_id = u.id AND a.tenant_id = {tenantId}
               WHERE u.tenant_id = {tenantId} AND u.roles @> ARRAY['Clinician']::varchar[]
               GROUP BY u.id, u.first_name, u.last_name
               ORDER BY ActiveAssignments ASC")
            .ToListAsync(ct);

        return workloads;
    }

    public async Task<bool> UnassignIntakeAsync(
        Guid tenantId,
        Guid intakeId,
        string? reason,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var result = await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE qivr.assignments 
               SET status = 'cancelled', 
                   completed_at = {now},
                   completion_reason = {reason},
                   updated_at = {now}
               WHERE tenant_id = {tenantId} AND intake_id = {intakeId} AND status = 'active'", ct);

        if (result > 0)
        {
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $@"UPDATE qivr.evaluations 
                   SET assigned_to = NULL,
                       status = 'Pending',
                       updated_at = {now}
                   WHERE tenant_id = {tenantId} AND id = {intakeId}", ct);

            return true;
        }

        return false;
    }

    public async Task<AssignmentHistoryDto> GetAssignmentHistoryAsync(
        Guid tenantId,
        Guid intakeId,
        CancellationToken ct = default)
    {
        var history = await _db.Database.SqlQuery<AssignmentHistoryItem>(
            $@"SELECT 
                a.id, a.provider_id as ProviderId,
                u.first_name || ' ' || u.last_name as ProviderName,
                a.assigned_at as AssignedAt, a.completed_at as CompletedAt,
                a.status, a.completion_reason as CompletionReason, a.notes
               FROM qivr.assignments a
               JOIN qivr.users u ON u.id = a.provider_id
               WHERE a.tenant_id = {tenantId} AND a.intake_id = {intakeId}
               ORDER BY a.assigned_at DESC")
            .ToListAsync(ct);

        return new AssignmentHistoryDto
        {
            IntakeId = intakeId,
            TotalAssignments = history.Count,
            CurrentAssignment = history.FirstOrDefault(h => h.Status == "active"),
            History = history
        };
    }

    private record ProviderInfo(Guid Id, string Name, string Email);
    private record AssignmentInfo(Guid Id, Guid ProviderId, string ProviderName);
}

// DTOs
public enum AssignmentStatus
{
    Active,
    Completed,
    Reassigned,
    Cancelled
}

public class AssignmentDto
{
    public Guid Id { get; set; }
    public Guid IntakeId { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public AssignmentStatus Status { get; set; }
    public string? Notes { get; set; }
    public string? PatientName { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Urgency { get; set; }
}

public class ProviderWorkloadDto
{
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public int ActiveAssignments { get; set; }
    public int CompletedThisWeek { get; set; }
    public double? AvgCompletionHours { get; set; }
    public DateTime? LastAssignedAt { get; set; }
}

public class AssignmentHistoryDto
{
    public Guid IntakeId { get; set; }
    public int TotalAssignments { get; set; }
    public AssignmentHistoryItem? CurrentAssignment { get; set; }
    public IReadOnlyList<AssignmentHistoryItem> History { get; set; } = Array.Empty<AssignmentHistoryItem>();
}

public class AssignmentHistoryItem
{
    public Guid Id { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CompletionReason { get; set; }
    public string? Notes { get; set; }
}
