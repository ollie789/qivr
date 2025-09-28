using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
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

public class DocumentsControllerTests : DatabaseTestBase
{
    private DocumentsController CreateController(
        Mock<IResourceAuthorizationService>? authorizationService = null,
        Mock<IStorageService>? storageService = null,
        Mock<IEnhancedAuditService>? auditService = null)
    {
        var auth = authorizationService ?? new Mock<IResourceAuthorizationService>();
        var storage = storageService ?? new Mock<IStorageService>();
        var audit = auditService ?? new Mock<IEnhancedAuditService>();

        var controller = new DocumentsController(
            Context,
            storage.Object,
            NullLogger<DocumentsController>.Instance,
            auth.Object,
            audit.Object);

        controller.ControllerContext = CreateControllerContext(role: "Clinician");
        return controller;
    }

    [Fact]
    public async Task ShareDocument_AddsShareMetadata()
    {
        var patient = await CreateUserAsync(UserType.Patient, email: "patient@test.local", firstName: "Pat", lastName: "Ient");
        var clinician = await CreateUserAsync(UserType.Staff, email: "clinician@test.local", firstName: "Clin", lastName: "Ician");
        var document = await SeedDocumentAsync(patient.Id);

        var auth = new Mock<IResourceAuthorizationService>();
        auth.Setup(a => a.GetCurrentTenantId(It.IsAny<HttpContext>())).Returns(TenantId);
        auth.Setup(a => a.GetCurrentUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(TestUserId);
        auth.Setup(a => a.UserCanAccessPatientDataAsync(TestUserId, patient.Id))
            .ReturnsAsync(true);

        var controller = CreateController(auth);

        var request = new DocumentShareRequest
        {
            UserId = clinician.Id,
            Message = "Please review",
            AccessLevel = "view"
        };

        var result = await controller.ShareDocument(document.Id, request, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var dto = Assert.IsType<DocumentShareDto>(created.Value);
        Assert.Equal(clinician.Id, dto.SharedWithUserId);
        Assert.False(dto.Revoked);

        using var verificationContext = CreateScopedContext();
        var stored = await verificationContext.Documents.FirstAsync(d => d.Id == document.Id);
        var metadata = stored.Metadata;
        Assert.Contains("shares", metadata, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CompleteDocumentReview_UpdatesDocument()
    {
        var patient = await CreateUserAsync(UserType.Patient);
        var document = await SeedDocumentAsync(patient.Id);

        var auth = new Mock<IResourceAuthorizationService>();
        auth.Setup(a => a.GetCurrentTenantId(It.IsAny<HttpContext>())).Returns(TenantId);
        auth.Setup(a => a.GetCurrentUserId(It.IsAny<System.Security.Claims.ClaimsPrincipal>()))
            .Returns(TestUserId);
        auth.Setup(a => a.UserCanAccessPatientDataAsync(TestUserId, patient.Id))
            .ReturnsAsync(true);

        var controller = CreateController(auth);

        await controller.RequestDocumentReview(document.Id, new DocumentReviewRequest
        {
            Notes = "Needs clinician review"
        }, CancellationToken.None);

        var completeResult = await controller.CompleteDocumentReview(document.Id, new DocumentReviewCompleteRequest
        {
            Notes = "Reviewed",
            AgreesWithAssessment = true,
            Status = "completed"
        }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(completeResult.Result);
        var dto = Assert.IsType<DocumentResponseDto>(ok.Value);

        Assert.False(dto.RequiresReview);
        Assert.Equal("completed", dto.ReviewStatus);
        Assert.Equal("Reviewed", dto.ReviewNotes);
    }

    private async Task<Document> SeedDocumentAsync(Guid patientId)
    {
        var document = new Document
        {
            Id = Guid.NewGuid(),
            TenantId = TenantId,
            PatientId = patientId,
            FileName = "report.pdf",
            DocumentType = "lab",
            ContentType = "application/pdf",
            FileSizeBytes = 1024,
            StoragePath = "documents/patients/report.pdf",
            Description = "Lab report",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Tags = "[]",
            Metadata = "{}"
        };

        Context.Documents.Add(document);
        await Context.SaveChangesAsync();
        return document;
    }
}
