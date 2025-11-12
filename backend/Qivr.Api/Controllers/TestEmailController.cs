using Microsoft.AspNetCore.Mvc;
using Qivr.Api.Services;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestEmailController : ControllerBase
{
    private readonly IModernEmailService _emailService;
    private readonly ILogger<TestEmailController> _logger;

    public TestEmailController(
        IModernEmailService emailService,
        ILogger<TestEmailController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("send-test")]
    public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
    {
        try
        {
            var emailContent = new EmailContent
            {
                To = request.To,
                Subject = "QIVR SES Test Email",
                HtmlBody = $"<h1>SES Integration Test</h1><p>Hello {request.To}!</p><p>This email was sent via Amazon SES from QIVR.</p><p>Timestamp: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>",
                PlainBody = $"SES Integration Test\n\nHello {request.To}!\n\nThis email was sent via Amazon SES from QIVR.\n\nTimestamp: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC"
            };

            await _emailService.SendEmailAsync(emailContent, request.TenantId);

            _logger.LogInformation("Test email sent successfully to {To}", request.To);

            return Ok(new { 
                success = true, 
                message = "Test email sent successfully",
                recipient = request.To,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email to {To}", request.To);
            return BadRequest(new { 
                success = false, 
                message = "Failed to send test email", 
                error = ex.Message 
            });
        }
    }
}

public class TestEmailRequest
{
    public required string To { get; set; }
    public Guid? TenantId { get; set; }
}
