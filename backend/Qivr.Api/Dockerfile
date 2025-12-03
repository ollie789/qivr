FROM mcr.microsoft.com/dotnet/sdk:10.0-preview-alpine AS build
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

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview-alpine AS final
RUN apk add --no-cache icu-libs curl
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Qivr.Api.dll"]
