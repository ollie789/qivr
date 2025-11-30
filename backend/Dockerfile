# Multi-stage build for .NET 10 API
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview-alpine AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["Qivr.Api/Qivr.Api.csproj", "Qivr.Api/"]
COPY ["Qivr.Core/Qivr.Core.csproj", "Qivr.Core/"]
COPY ["Qivr.Infrastructure/Qivr.Infrastructure.csproj", "Qivr.Infrastructure/"]
COPY ["Qivr.Services/Qivr.Services.csproj", "Qivr.Services/"]
RUN dotnet restore "Qivr.Api/Qivr.Api.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/Qivr.Api"
RUN dotnet build "Qivr.Api.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "Qivr.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview-alpine AS final
WORKDIR /app

# Install required packages (update package index first)
RUN apk update && apk add --no-cache curl icu-libs icu-data-full tzdata

# Create non-root user
RUN addgroup -g 1000 -S qivr && \
    adduser -u 1000 -S qivr -G qivr

# Copy published app
COPY --from=publish --chown=qivr:qivr /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER qivr

# Expose port
EXPOSE 8080

ENTRYPOINT ["dotnet", "Qivr.Api.dll"]
