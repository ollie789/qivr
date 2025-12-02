using System.Text.Json.Serialization;
using Qivr.Api.Controllers; // For LoginRequest/Response

namespace Qivr.Api.Config;

// Register types that need JSON serialization here
[JsonSerializable(typeof(LoginRequest))]
[JsonSerializable(typeof(LoginResponse))]
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DictionaryKeyPolicy = JsonKnownNamingPolicy.CamelCase,
    UseStringEnumConverter = true)]
public partial class QivrJsonContext : JsonSerializerContext
{
}
