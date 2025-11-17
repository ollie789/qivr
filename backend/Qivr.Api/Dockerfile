FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Qivr.Api/Qivr.Api.csproj", "Qivr.Api/"]
COPY ["Qivr.Core/Qivr.Core.csproj", "Qivr.Core/"]
COPY ["Qivr.Infrastructure/Qivr.Infrastructure.csproj", "Qivr.Infrastructure/"]
COPY ["Qivr.Services/Qivr.Services.csproj", "Qivr.Services/"]
RUN dotnet restore "Qivr.Api/Qivr.Api.csproj"
COPY . .
WORKDIR "/src/Qivr.Api"
RUN dotnet build "Qivr.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Qivr.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
RUN apt-get update && apt-get install -y libicu-dev curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Qivr.Api.dll"]
