using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using Qivr.Api.Controllers;
using Qivr.Api.Services;
using Qivr.Api.DTOs;

namespace Qivr.Tests.Controllers;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly Mock<ICognitoAuthService> _mockCognitoService;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _mockCognitoService = new Mock<ICognitoAuthService>();
        
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove the existing ICognitoAuthService
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(ICognitoAuthService));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add mock service
                services.AddSingleton(_mockCognitoService.Object);
            });
        });
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new LoginRequest
        {
            Email = "test@example.com",
            Password = "Test123!@#"
        };

        var expectedResponse = new LoginResponse
        {
            AccessToken = "test-access-token",
            RefreshToken = "test-refresh-token",
            ExpiresIn = 3600,
            TokenType = "Bearer"
        };

        _mockCognitoService
            .Setup(x => x.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(content);
        Assert.Equal(expectedResponse.AccessToken, content.AccessToken);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new LoginRequest
        {
            Email = "test@example.com",
            Password = "WrongPassword"
        };

        _mockCognitoService
            .Setup(x => x.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new UnauthorizedAccessException("Invalid credentials"));

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SignUp_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var client = _factory.CreateClient();
        var signUpRequest = new SignUpRequest
        {
            Email = "newuser@example.com",
            Password = "SecurePassword123!",
            FirstName = "Test",
            LastName = "User",
            PhoneNumber = "+1234567890"
        };

        var expectedResponse = new SignUpResponse
        {
            UserId = Guid.NewGuid().ToString(),
            Email = signUpRequest.Email,
            RequiresConfirmation = true
        };

        _mockCognitoService
            .Setup(x => x.SignUpAsync(It.IsAny<SignUpRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/signup", signUpRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<SignUpResponse>();
        Assert.NotNull(content);
        Assert.Equal(expectedResponse.Email, content.Email);
        Assert.True(content.RequiresConfirmation);
    }

    [Fact]
    public async Task RefreshToken_WithValidToken_ReturnsNewToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var refreshRequest = new RefreshTokenRequest
        {
            RefreshToken = "valid-refresh-token"
        };

        var expectedResponse = new LoginResponse
        {
            AccessToken = "new-access-token",
            RefreshToken = "new-refresh-token",
            ExpiresIn = 3600,
            TokenType = "Bearer"
        };

        _mockCognitoService
            .Setup(x => x.RefreshTokenAsync(It.IsAny<string>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(content);
        Assert.Equal(expectedResponse.AccessToken, content.AccessToken);
    }

    [Fact]
    public async Task ForgotPassword_WithValidEmail_ReturnsSuccess()
    {
        // Arrange
        var client = _factory.CreateClient();
        var forgotPasswordRequest = new ForgotPasswordRequest
        {
            Email = "test@example.com"
        };

        _mockCognitoService
            .Setup(x => x.InitiateForgotPasswordAsync(It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", forgotPasswordRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ConfirmForgotPassword_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var client = _factory.CreateClient();
        var confirmRequest = new ConfirmForgotPasswordRequest
        {
            Email = "test@example.com",
            ConfirmationCode = "123456",
            NewPassword = "NewSecurePassword123!"
        };

        _mockCognitoService
            .Setup(x => x.ConfirmForgotPasswordAsync(
                It.IsAny<string>(), 
                It.IsAny<string>(), 
                It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/confirm-forgot-password", confirmRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public async Task Login_WithEmptyEmail_ReturnsBadRequest(string email)
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = "Test123!@#"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public async Task Login_WithEmptyPassword_ReturnsBadRequest(string password)
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new LoginRequest
        {
            Email = "test@example.com",
            Password = password
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
