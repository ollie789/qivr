using System;
using System.Collections.Generic;

namespace Qivr.Core.DTOs
{
    // EvaluationDto - kept as the only DTO in this file to avoid duplication
    public class EvaluationDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? FollowUpDate { get; set; }
        public int Progress { get; set; }
        public decimal? Score { get; set; }
        public string? Trend { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
