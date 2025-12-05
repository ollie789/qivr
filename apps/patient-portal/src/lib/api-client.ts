// Aligned with clinic dashboard auth system
// Uses httpOnly cookies + X-Tenant-Id header pattern

import { API_CONFIG } from "../config/api";

const API_BASE_URL = API_CONFIG.BASE_URL;

class ApiClient {
  private tenantId: string | null = null;

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    // Normalize endpoint to always include /api prefix
    const normalizedEndpoint = API_CONFIG.url(endpoint);
    const url = `${API_BASE_URL}${normalizedEndpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add tenant ID header if available (for patient operations)
    if (this.tenantId) {
      headers["X-Tenant-Id"] = this.tenantId;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include", // Include httpOnly cookies
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text() as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (endpoint.includes("?") ? "&" : "?") + queryString;
      }
    }
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Error handling utilities
export const handleApiError = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

const apiClient = new ApiClient();

// ============================================
// Treatment Plans API
// ============================================

export interface ExerciseCompletion {
  setsCompleted: number;
  repsCompleted: number;
  painLevelBefore?: number;
  painLevelAfter?: number;
  notes?: string;
}

export interface DailyCheckInData {
  painLevel: number;
  mood: number;
  notes?: string;
  exercisesCompleted: number;
}

export interface TreatmentPhase {
  phaseNumber: number;
  name: string;
  description?: string;
  durationWeeks: number;
  goals: string[];
  status: "NotStarted" | "InProgress" | "Completed";
  startDate?: string;
  endDate?: string;
  exercises: Exercise[];
  sessionsPerWeek: number;
  phaseProgressPercentage?: number;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  frequency?: string;
  category?: string;
  bodyRegion?: string;
  difficulty?: string;
  videoUrl?: string;
  imageUrl?: string;
  completions?: ExerciseCompletionRecord[];
}

export interface ExerciseCompletionRecord {
  completedAt: string;
  setsCompleted: number;
  repsCompleted: number;
}

export interface TodayTask {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  instructions?: string;
  description?: string;
  category?: string;
  bodyRegion?: string;
  difficulty?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  type: string;
  title: string;
  description?: string;
  targetDate?: string;
  achievedDate?: string;
  isAchieved: boolean;
  pointsAwarded: number;
  icon?: string;
}

export interface CheckInStatus {
  hasCheckedInToday: boolean;
  lastCheckIn?: {
    painLevel: number;
    mood: number;
    notes?: string;
    date: string;
  };
}

export interface MyTreatmentPlan {
  id: string;
  patientName: string;
  title: string;
  diagnosis: string;
  status: string;
  startDate: string;
  estimatedEndDate?: string;
  currentPhase: number;
  totalPhases: number;
  overallProgress: number;
  currentWeek: number;
  totalWeeks: number;
  currentStreak: number;
  totalPoints: number;
  phases: TreatmentPhase[];
  todaysTasks: TodayTask[];
  milestones: Milestone[];
  checkInStatus: CheckInStatus;
}

export interface TreatmentProgressResponse {
  hasPlan: boolean;
  message?: string;
  progress?: {
    treatmentPlanId: string;
    planTitle: string;
    diagnosis: string;
    status: string;
    startDate: string;
    estimatedEndDate?: string;
    overallProgress: number;
    currentWeek: number;
    totalWeeks: number;
    currentPhase: number;
    totalPhases: number;
    completedSessions: number;
    totalSessions: number;
    totalExercises: number;
    completedExercises: number;
    todaysExercises: number;
    todaysCompletedExercises: number;
    currentStreak: number;
    totalPoints: number;
    unlockedMilestones: Milestone[];
    upcomingMilestones: Milestone[];
  };
}

export const treatmentPlansApi = {
  /**
   * Get the patient's active treatment plan with today's tasks
   * Returns null if no plan exists (404)
   */
  getMyPlan: async (): Promise<MyTreatmentPlan | null> => {
    try {
      return await apiClient.get<MyTreatmentPlan>(
        "/api/treatment-plans/my-plan",
      );
    } catch (error: unknown) {
      // Return null for 404 (no plan) instead of throwing
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get treatment progress data for the Health Progress page
   */
  getProgress: () =>
    apiClient.get<TreatmentProgressResponse>("/api/treatment-plans/progress"),

  /**
   * Complete an exercise
   */
  completeExercise: (
    planId: string,
    exerciseId: string,
    data: ExerciseCompletion,
  ) =>
    apiClient.post<{
      message: string;
      pointsEarned: number;
      totalPoints: number;
      exerciseStreak: number;
    }>(`/api/treatment-plans/${planId}/exercises/${exerciseId}/complete`, data),

  /**
   * Submit a daily check-in
   */
  submitCheckIn: (planId: string, data: DailyCheckInData) =>
    apiClient.post<{ message: string; streak: number; points: number }>(
      `/api/treatment-plans/${planId}/check-in`,
      data,
    ),

  /**
   * Get milestones for a treatment plan
   */
  getMilestones: (planId: string) =>
    apiClient.get<Milestone[]>(`/api/treatment-plans/${planId}/milestones`),
};

export default apiClient;
