import apiClient from "../lib/api-client";

export interface IntakeSubmission {
  id: string;
  patientName: string;
  email: string;
  phone?: string;
  submittedAt: string;
  conditionType: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "reviewing" | "approved" | "rejected" | "scheduled";
  painLevel: number;
  symptoms?: string[];
  aiSummary?: string;
  aiRiskFlags?: string[];
  aiProcessedAt?: string;
  assignedTo?: string;
  notes?: string;
  patientId?: string; // Link to existing patient
  bodyMap?: {
    painPoints?: Array<{
      x: number;
      y: number;
      z: number;
      intensity: number;
      bodyPart: string;
    }>;
  };
}

export interface IntakeDetails {
  id: string;
  patient: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address?: string;
  };
  evaluation: {
    submittedAt: string;
    conditionType: string;
    severity: string;
    painLevel: number;
    symptoms: string[];
    description: string;
    duration: string;
    triggers?: string[];
    previousTreatments?: string[];
    painStart?: string;
    onset?: string;
    pattern?: string;
    frequency?: string;
    timeOfDay?: string[];
    relievingFactors?: string[];
    currentMedications?: string;
    allergies?: string;
    medicalConditions?: string;
    surgeries?: string;
    treatmentGoals?: string;
  };
  painMap?: {
    bodyParts: Array<{
      region: string;
      intensity: number;
      type: string;
    }>;
  };
  aiSummary?: {
    content: string;
    riskFactors: string[];
    recommendations: string[];
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
  status: string;
  assignedTo?: string;
  notes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  questionnaireResponses?: Record<string, any>;
  medicalHistory?: Record<string, any>;
}

export interface IntakeFilters {
  status?: string;
  severity?: string;
  assignedTo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

function mapEvaluationToIntake(e: any): IntakeSubmission {
  console.log("Mapping evaluation:", e);
  const severityMap: Record<string, IntakeSubmission["severity"]> = {
    urgent: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  };
  const statusMap: Record<string, IntakeSubmission["status"]> = {
    pending: "pending",
    reviewed: "reviewing",
    triaged: "approved",
    archived: "rejected",
    Pending: "pending",
    Reviewed: "reviewing",
    Triaged: "approved",
    Archived: "rejected",
  };
  return {
    id: e.id,
    patientName: e.patientName || "Unknown Patient",
    email: e.patientEmail || "n/a@unknown",
    phone: e.patientPhone || "",
    submittedAt: e.date || e.createdAt,
    conditionType: e.chiefComplaint || "Not specified",
    severity: severityMap[(e.urgency || "").toLowerCase()] || "medium",
    status: statusMap[e.status?.toLowerCase()] || "pending",
    painLevel: (e.painMaps && e.painMaps[0]?.painIntensity) || 5,
    symptoms: e.symptoms || [],
    aiSummary: e.aiSummary || undefined,
    bodyMap: e.painMaps
      ? {
          painPoints: e.painMaps.map((pm: any) => ({
            x: 0,
            y: 0,
            z: 0,
            intensity: pm.intensity || 5,
            bodyPart: pm.bodyRegion || "Unknown",
          })),
        }
      : undefined,
  };
}

export const intakeApi = {
  async getIntakes(
    filters?: IntakeFilters,
  ): Promise<{ data: IntakeSubmission[]; total: number }> {
    try {
      const response = await apiClient.get("/api/evaluations", {
        params: filters,
      });
      console.log("Raw evaluations response:", response);
      // Response is already the array, not wrapped in .data
      const list = Array.isArray(response) ? response : [];
      console.log("Evaluations list:", list);
      const data = list.map(mapEvaluationToIntake);
      console.log("Mapped intakes:", data);
      return { data, total: data.length };
    } catch (error) {
      console.error("Error fetching intakes:", error);
      return {
        data: [],
        total: 0,
      };
    }
  },

  async getIntakeDetails(id: string): Promise<IntakeDetails> {
    try {
      const response = await apiClient.get(`/api/evaluations/${id}`);
      const e = response;

      // Extract comprehensive questionnaire data
      const q = e.questionnaireResponses || {};
      const medicalHistory = e.medicalHistory || {};

      // Build comprehensive description
      const description = q.description || e.chiefComplaint;
      const duration = q.duration || medicalHistory.duration || "Not specified";

      return {
        id: e.id,
        patient: {
          name: e.patientName,
          email: e.patientEmail || "",
          phone: e.patientPhone || "",
          dateOfBirth: e.patientDateOfBirth || "",
        },
        evaluation: {
          submittedAt: e.createdAt,
          conditionType: e.chiefComplaint,
          severity: e.urgency || "medium",
          painLevel:
            q.painIntensity || (e.painMaps && e.painMaps[0]?.intensity) || 0,
          symptoms: e.symptoms || q.painQualities || [],
          description,
          duration,
          triggers: q.aggravatingFactors || medicalHistory.triggers || [],
          previousTreatments:
            q.previousTreatments || medicalHistory.previousTreatments || "",
          painStart: q.painStart || "",
          onset: q.onset || "",
          pattern: q.pattern || "",
          frequency: q.frequency || "",
          timeOfDay: q.timeOfDay || [],
          relievingFactors: q.relievingFactors || [],
          currentMedications: q.currentMedications || "",
          allergies: q.allergies || "",
          medicalConditions: q.medicalConditions || "",
          surgeries: q.surgeries || "",
          treatmentGoals: q.treatmentGoals || "",
        },
        painMap: e.painMaps
          ? {
              bodyParts: e.painMaps.map((pm: any) => ({
                region: pm.bodyRegion,
                intensity: pm.intensity,
                type: pm.type || "aching",
              })),
            }
          : undefined,
        aiSummary: e.aiSummary
          ? {
              content: e.aiSummary,
              riskFactors: e.aiRiskFlags || [],
              recommendations: e.aiRecommendations || [],
              approved: !!e.aiProcessedAt,
              approvedAt: e.aiProcessedAt,
            }
          : undefined,
        status: e.status,
        notes: e.clinicianNotes || "",
        questionnaireResponses: q,
        medicalHistory: medicalHistory,
      };
    } catch (error) {
      console.error("Error fetching intake details:", error);
      throw error;
    }
  },

  async updateIntakeStatus(
    id: string,
    status: string,
    notes?: string,
  ): Promise<void> {
    try {
      await apiClient.patch(`/api/evaluations/${id}/status`, { status, notes });
    } catch (error) {
      console.error("Error updating intake status:", error);
      throw error;
    }
  },

  async deleteIntake(id: string): Promise<void> {
    await apiClient.delete(`/api/evaluations/${id}`);
  },

  async linkToMedicalRecord(
    intakeId: string,
    patientId: string,
  ): Promise<void> {
    await apiClient.post(`/api/evaluations/${intakeId}/link-medical-record`, {
      patientId: patientId,
    });
  },
};

export default intakeApi;
