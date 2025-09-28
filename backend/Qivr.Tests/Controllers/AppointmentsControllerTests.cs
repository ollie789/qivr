using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Qivr.Api.Controllers;
using Qivr.Api.Services;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;
using Xunit;

namespace Qivr.Tests.Controllers;

public class AppointmentsControllerTests : DatabaseTestBase
{
    private AppointmentsController CreateController(
        Mock<IResourceAuthorizationService>? authorizationService = null,
        Mock<IProviderAvailabilityService>? availabilityService = null)
    {
        var auth = authorizationService ?? new Mock<IResourceAuthorizationService>();
        var availability = availabilityService ?? new Mock<IProviderAvailabilityService>();

        var controller = new AppointmentsController(
            Context,
            NullLogger<AppointmentsController>.Instance,
            auth.Object,
            availability.Object,
            Mock.Of<ICacheService>(),
            Mock.Of<IEnhancedAuditService>(),
            Mock.Of<IAppointmentWaitlistService>(),
            Mock.Of<INotificationGate>(),
            Mock.Of<IRealTimeNotificationService>());

        controller.ControllerContext = CreateControllerContext(role: "Patient");
        return controller;
    }

    [Fact]
    public async Task BookAppointment_CreatesAppointment_ForPatient()
    {
        // Arrange
        var patientId = TestUserId;
        var providerUser = await CreateUserAsync(UserType.Staff, email: "dr.smith@test.local", firstName: "Ada", lastName: "Lovelace");
        await CreateProviderAsync(providerUser);

        var startTime = DateTime.UtcNow.AddDays(1).Date.AddHours(10);

        var authorizationService = new Mock<IResourceAuthorizationService>();
        authorizationService
            .Setup(s => s.GetCurrentUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(patientId);

        var availabilityService = new Mock<IProviderAvailabilityService>();
        availabilityService
            .Setup(s => s.BookAppointment(patientId, providerUser.Id, startTime, 30, "consultation"))
            .ReturnsAsync(true)
            .Callback<Guid, Guid, DateTime, int, string>((_, _, _, duration, type) =>
            {
                var appointment = new Appointment
                {
                    Id = Guid.NewGuid(),
                    TenantId = TenantId,
                    PatientId = patientId,
                    ProviderId = providerUser.Id,
                    ScheduledStart = startTime,
                    ScheduledEnd = startTime.AddMinutes(duration),
                    AppointmentType = type,
                    Status = AppointmentStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                Context.Appointments.Add(appointment);
                Context.SaveChanges();
            });

        var controller = CreateController(authorizationService, availabilityService);

        var request = new BookAppointmentRequest
        {
            ProviderId = providerUser.Id,
            StartTime = startTime,
            DurationMinutes = 30,
            AppointmentType = "consultation"
        };

        // Act
        var result = await controller.BookAppointment(request);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<Qivr.Api.Controllers.AppointmentDto>(ok.Value);

        Assert.Equal(patientId, dto.PatientId);
        Assert.Equal(providerUser.Id, dto.ProviderId);
        Assert.Equal("consultation", dto.AppointmentType);
        Assert.Equal(AppointmentStatus.Scheduled, dto.Status);

        using var verificationContext = CreateScopedContext();
        var stored = await verificationContext.Appointments.FirstOrDefaultAsync(a => a.PatientId == patientId && a.ProviderId == providerUser.Id && a.ScheduledStart == startTime);
        Assert.NotNull(stored);
    }

    [Fact]
    public async Task BookAppointment_ReturnsBadRequest_WhenSlotUnavailable()
    {
        // Arrange
        var patientId = TestUserId;
        var providerUser = await CreateUserAsync(UserType.Staff);
        await CreateProviderAsync(providerUser);

        var startTime = DateTime.UtcNow.AddDays(2).Date.AddHours(14);

        var authorizationService = new Mock<IResourceAuthorizationService>();
        authorizationService
            .Setup(s => s.GetCurrentUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(patientId);

        var availabilityService = new Mock<IProviderAvailabilityService>();
        availabilityService
            .Setup(s => s.BookAppointment(patientId, providerUser.Id, startTime, 45, "follow-up"))
            .ReturnsAsync(false);

        var controller = CreateController(authorizationService, availabilityService);

        var request = new BookAppointmentRequest
        {
            ProviderId = providerUser.Id,
            StartTime = startTime,
            DurationMinutes = 45,
            AppointmentType = "follow-up"
        };

        // Act
        var response = await controller.BookAppointment(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(response.Result);
    }
}
