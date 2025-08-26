using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Qivr.Core.Interfaces
{
    public interface ISmsNotificationService
    {
        Task<SmsResult> SendSmsAsync(string to, string message, Dictionary<string, string> metadata = null);
        Task<BulkSmsResult> SendBulkSmsAsync(List<SmsMessage> messages);
        Task<InboundSms> ProcessInboundSmsAsync(string from, string to, string body, Dictionary<string, string> additionalData);
        Task UpdateDeliveryStatusAsync(string messageId, string status, string errorCode = null);
        Task<SmsStatus> GetMessageStatusAsync(string messageId);
    }

    public class SmsMessage
    {
        public string To { get; set; }
        public string Message { get; set; }
        public Dictionary<string, string> Metadata { get; set; }
    }

    public class SmsResult
    {
        public bool Success { get; set; }
        public string MessageId { get; set; }
        public string ErrorMessage { get; set; }
        public decimal? Cost { get; set; }
    }

    public class BulkSmsResult
    {
        public int TotalSent { get; set; }
        public int Successful { get; set; }
        public int Failed { get; set; }
        public List<SmsResult> Results { get; set; }
    }

    public class InboundSms
    {
        public string MessageId { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string Body { get; set; }
        public DateTime ReceivedAt { get; set; }
        public bool Processed { get; set; }
    }

    public class SmsStatus
    {
        public string MessageId { get; set; }
        public string Status { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public string ErrorCode { get; set; }
        public string ErrorMessage { get; set; }
    }
}
