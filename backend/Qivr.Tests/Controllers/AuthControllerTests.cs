using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Qivr.Api.Controllers;
using Qivr.Api.Services;
using Xunit;

namespace Qivr.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<ICognitoAuthService> _authService = new();
    private readonly IConfiguration _configuration;

    public AuthControllerTests()
    {
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Auth:CookieDomain", "localhost" }
            })
            .Build();
    }

    private AuthController CreateController()
    {
        var controller = new AuthController(_authService.Object, NullLogger<AuthController>.Instance, _configuration)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        controller.ControllerContext.HttpContext.Request.Host = new HostString("localhost", 5050);
        return controller;
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokenMetadata()
    {
        var controller = CreateController();

        var resultModel = new AuthenticationResult
        {
            Success = true,
            AccessToken = "access-token",
            RefreshToken = "refresh-token",
            ExpiresIn = 3600,
            UserInfo = new UserInfo { Username = "test-user" }
        };

        _authService
            .Setup(s => s.AuthenticateAsync("user@test.local", "Test123!"))
            .ReturnsAsync(resultModel);

        var response = await controller.Login(new LoginRequest
        {
            Username = "user@test.local",
            Password = "Test123!"
        });

        var ok = Assert.IsType<OkObjectResult>(response);
        var json = JsonSerializer.Serialize(ok.Value);
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        Assert.Equal(3600, root.GetProperty("expiresIn").GetInt32());

        var setCookieHeaders = controller.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("accessToken", setCookieHeaders);
        Assert.Contains("refreshToken", setCookieHeaders);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        var controller = CreateController();

        _authService
            .Setup(s => s.AuthenticateAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new AuthenticationResult { Success = false, ErrorMessage = "Invalid credentials" });

        var response = await controller.Login(new LoginRequest
        {
            Username = "user@test.local",
            Password = "WrongPassword"
        });

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(response);
        Assert.Equal((int)HttpStatusCode.Unauthorized, unauthorized.StatusCode);
    }

    [Fact]
    public async Task SignUp_WithValidData_ReturnsSuccess()
    {
        var controller = CreateController();

        _authService
            .Setup(s => s.SignUpAsync(It.IsAny<SignUpRequest>()))
            .ReturnsAsync(new SignUpResult
            {
                Success = true,
                UserSub = Guid.NewGuid().ToString(),
                UserConfirmed = true
            });

        var response = await controller.SignUp(new SignUpRequest
        {
            Username = "newuser",
            Password = "SecurePassword123!",
            Email = "newuser@example.com",
            FirstName = "Test",
            LastName = "User",
            PhoneNumber = "+1234567890",
            TenantId = Guid.NewGuid()
        });

        var ok = Assert.IsType<OkObjectResult>(response);
        var payload = ok.Value ?? throw new InvalidOperationException("Expected payload");
        var json = System.Text.Json.JsonSerializer.Serialize(payload);
        Assert.Contains("userConfirmed", json);
    }

    [Fact]
    public async Task RefreshToken_WithValidCookie_ReturnsNewExpiry()
    {
        var controller = CreateController();
        var context = controller.HttpContext;
        context.Request.Headers["Cookie"] = "refreshToken=valid-refresh-token";

        _authService
            .Setup(s => s.RefreshTokenAsync("valid-refresh-token"))
            .ReturnsAsync(new AuthenticationResult
            {
                Success = true,
                AccessToken = "new-access-token",
                RefreshToken = "rotated-refresh-token",
                ExpiresIn = 1800
            });

        _authService
            .Setup(s => s.InvalidateRefreshTokenAsync("valid-refresh-token"))
            .ReturnsAsync(true);

        var response = await controller.RefreshToken();

        var ok = Assert.IsType<OkObjectResult>(response);
        var json = JsonSerializer.Serialize(ok.Value);
        using var document = JsonDocument.Parse(json);
        var expires = document.RootElement.GetProperty("expiresIn").GetInt32();
        Assert.Equal(1800, expires);

        var cookies = controller.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("accessToken", cookies);
        Assert.Contains("refreshToken", cookies);
    }
}
