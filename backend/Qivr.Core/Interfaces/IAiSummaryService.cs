using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Qivr.Core.Interfaces
{
    public interface IAiSummaryService
    {
        Task<AiSummaryResult> GenerateSummaryAsync(EvaluationData evaluation);
    }

    public class EvaluationData
    {
        public string Id { get; set; }
        public int PatientAge { get; set; }
        public string Gender { get; set; }
        public List<string> Symptoms { get; set; }
        public List<PainMapEntry> PainMap { get; set; }
        public List<string> MedicalHistory { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

    public class PainMapEntry
    {
        public string BodyPart { get; set; }
        public int Intensity { get; set; }
        public string Duration { get; set; }
    }

    public class AiSummaryResult
    {
        public bool Success { get; set; }
        public string Summary { get; set; }
        public List<string> Concerns { get; set; }
        public string ProviderType { get; set; }
        public string Urgency { get; set; }
        public List<string> SelfCare { get; set; }
        public List<string> RiskFlags { get; set; }
        public string Disclaimer { get; set; }
        public string Error { get; set; }
    }

    public class DeidentifiedData
    {
        public string SessionId { get; set; }
        public string AgeBand { get; set; }
        public string Gender { get; set; }
        public List<string> Symptoms { get; set; }
        public object PainLocations { get; set; }
        public List<string> MedicalHistoryCategories { get; set; }
        public string TimeFrame { get; set; }
        public string Region { get; set; }
    }
}
