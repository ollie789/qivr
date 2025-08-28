using System.Text.Json.Serialization;

namespace Qivr.Api.Contracts
{
    /// <summary>
    /// MessageMedia inbound webhook payload
    /// </summary>
    public sealed class MessageMediaWebhook
    {
        [JsonPropertyName("message_id")]
        public string? MessageId { get; set; }
        
        [JsonPropertyName("content")]
        public string? Content { get; set; }
        
        [JsonPropertyName("source_number")]
        public string? From { get; set; }  // E.164 format expected
        
        [JsonPropertyName("destination_number")]
        public string? To { get; set; }
        
        [JsonPropertyName("timestamp")]
        public DateTime? Timestamp { get; set; }
        
        [JsonPropertyName("status")]
        public string? Status { get; set; }
        
        [JsonPropertyName("metadata")]
        public Dictionary<string, object>? Metadata { get; set; }
    }
}
