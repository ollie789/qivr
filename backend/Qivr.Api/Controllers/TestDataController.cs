using Microsoft.AspNetCore.Mvc;

namespace Qivr.Api.Controllers;

/// <summary>
/// Test controller for development environment only - provides test data without authentication
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TestDataController : ControllerBase
{
    private readonly ILogger<TestDataController> _logger;
    private readonly IWebHostEnvironment _environment;

    public TestDataController(
        ILogger<TestDataController> logger,
        IWebHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Get test evaluations data for development
    /// </summary>
    [HttpGet("evaluations")]
    public IActionResult GetTestEvaluations()
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var testData = new
        {
            data = new object[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    patientName = "John Doe (TEST)",
                    email = "john.doe@test.com",
                    phone = "+61 400 000 001",
                    submittedAt = DateTime.UtcNow.AddHours(-2).ToString("O"),
                    conditionType = "Lower Back Pain",
                    severity = "high",
                    status = "pending",
                    painLevel = 7,
                    symptoms = new[] { "chronic pain", "stiffness", "limited mobility" },
                    aiSummary = "Patient presents with chronic lower back pain, possibly related to poor posture and sedentary lifestyle."
                },
                new
                {
                    id = Guid.NewGuid().ToString(),
                    patientName = "Jane Smith (TEST)",
                    email = "jane.smith@test.com",
                    phone = "+61 400 000 002",
                    submittedAt = DateTime.UtcNow.AddHours(-4).ToString("O"),
                    conditionType = "Neck Pain",
                    severity = "medium",
                    status = "reviewing",
                    painLevel = 5,
                    symptoms = new[] { "headaches", "tension", "radiating pain" },
                    assignedTo = "Dr. Brown",
                    aiSummary = "Tension-type neck pain with associated headaches. Recommend ergonomic assessment."
                },
                new
                {
                    id = Guid.NewGuid().ToString(),
                    patientName = "Bob Johnson (TEST)",
                    email = "bob.johnson@test.com",
                    phone = "+61 400 000 003",
                    submittedAt = DateTime.UtcNow.AddDays(-1).ToString("O"),
                    conditionType = "Shoulder Injury",
                    severity = "medium",
                    status = "approved",
                    painLevel = 6,
                    symptoms = new[] { "limited range", "weakness", "pain with movement" },
                    assignedTo = "Dr. Smith",
                    aiSummary = "Rotator cuff impingement suspected. Physical therapy recommended."
                },
                new
                {
                    id = Guid.NewGuid().ToString(),
                    patientName = "Alice Brown (TEST)",
                    email = "alice.brown@test.com",
                    phone = "+61 400 000 004",
                    submittedAt = DateTime.UtcNow.AddMinutes(-30).ToString("O"),
                    conditionType = "Knee Pain",
                    severity = "critical",
                    status = "pending",
                    painLevel = 9,
                    symptoms = new[] { "severe pain", "swelling", "inability to bear weight" },
                    aiSummary = "Acute knee injury with significant swelling. Urgent evaluation recommended."
                },
                new
                {
                    id = Guid.NewGuid().ToString(),
                    patientName = "Charlie Wilson (TEST)",
                    email = "charlie.wilson@test.com",
                    phone = "+61 400 000 005",
                    submittedAt = DateTime.UtcNow.AddHours(-6).ToString("O"),
                    conditionType = "Hip Pain",
                    severity = "low",
                    status = "reviewing",
                    painLevel = 3,
                    symptoms = new[] { "mild discomfort", "stiffness in morning" },
                    assignedTo = "Dr. Chen",
                    aiSummary = "Early osteoarthritis symptoms. Conservative management appropriate."
                }
            },
            total = 5
        };

        return Ok(testData);
    }

    /// <summary>
    /// Get test dashboard stats for development
    /// </summary>
    [HttpGet("dashboard/stats")]
    public IActionResult GetTestDashboardStats()
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var stats = new
        {
            todayAppointments = 12,
            pendingIntakes = 5,
            activePatients = 247,
            completedToday = 8,
            averageWaitTime = 15,
            patientSatisfaction = 4.8
        };

        return Ok(stats);
    }

    /// <summary>
    /// Get test appointments for development
    /// </summary>
    [HttpGet("appointments/today")]
    public IActionResult GetTestTodayAppointments()
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var appointments = new[]
        {
            new
            {
                id = Guid.NewGuid().ToString(),
                patientName = "Alice Brown (TEST)",
                time = "09:00 AM",
                type = "Initial Consultation",
                provider = "Dr. Smith",
                status = "completed"
            },
            new
            {
                id = Guid.NewGuid().ToString(),
                patientName = "Charlie Wilson (TEST)",
                time = "10:30 AM",
                type = "Follow-up",
                provider = "Dr. Smith",
                status = "in-progress"
            },
            new
            {
                id = Guid.NewGuid().ToString(),
                patientName = "Diana Prince (TEST)",
                time = "02:00 PM",
                type = "Assessment",
                provider = "Dr. Smith",
                status = "scheduled"
            }
        };

        return Ok(appointments);
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(new 
        { 
            status = "healthy", 
            environment = _environment.EnvironmentName,
            timestamp = DateTime.UtcNow 
        });
    }

    /// <summary>
    /// Accept evaluation submission from widget (for testing)
    /// </summary>
    [HttpPost("evaluations")]
    public IActionResult CreateTestEvaluation([FromBody] dynamic evaluationData)
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        try
        {
            // Log the evaluation for debugging
            _logger.LogInformation("Test evaluation received: {Data}", evaluationData?.ToString() ?? "null");

            // Generate a mock response
            var evaluationId = Guid.NewGuid();
            
            return Ok(new 
            {
                id = evaluationId,
                message = "Evaluation received successfully (test mode)",
                status = "pending",
                createdAt = DateTime.UtcNow,
                estimatedProcessingTime = "24-48 hours",
                nextSteps = new[]
                {
                    "You will receive an email confirmation shortly",
                    "Our team will review your evaluation",
                    "We will contact you to schedule an appointment"
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing test evaluation");
            return BadRequest(new { error = "Failed to process evaluation", message = ex.Message });
        }
    }
}
