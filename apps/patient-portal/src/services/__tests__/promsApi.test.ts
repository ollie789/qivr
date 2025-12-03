import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import apiClient from "../../lib/api-client";
import {
  fetchPromInstances,
  fetchPromHistory,
  fetchPromStats,
  submitPromResponse,
  savePromDraft,
  fetchPromInstance,
  submitPromAnswers,
} from "../promsApi";

const mockClient = vi.mocked(apiClient);

describe("promsApi - Patient Portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPromInstances", () => {
    it("fetches pending questionnaires for patient", async () => {
      const mockData = [
        {
          id: "prom-1",
          templateId: "tmpl-1",
          templateName: "Pain Assessment",
          status: "Pending",
          createdAt: "2024-01-01",
          scheduledAt: "2024-01-02",
          dueDate: "2024-01-10",
        },
      ];
      mockClient.get.mockResolvedValueOnce(mockData);

      const result = await fetchPromInstances();

      expect(mockClient.get).toHaveBeenCalledWith("/api/proms/instances", undefined);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("pending");
    });

    it("filters by status", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await fetchPromInstances("pending");

      expect(mockClient.get).toHaveBeenCalledWith("/api/proms/instances", { status: "pending" });
    });

    it("normalizes status values", async () => {
      mockClient.get.mockResolvedValueOnce([
        { id: "1", templateName: "Test", status: "InProgress", createdAt: "2024-01-01", scheduledAt: "2024-01-01", dueDate: "2024-01-10" },
        { id: "2", templateName: "Test2", status: "Completed", createdAt: "2024-01-01", scheduledAt: "2024-01-01", dueDate: "2024-01-10" },
      ]);

      const result = await fetchPromInstances();

      expect(result[0].status).toBe("in-progress");
      expect(result[1].status).toBe("completed");
    });
  });

  describe("fetchPromInstance", () => {
    it("fetches single questionnaire", async () => {
      const mockProm = {
        id: "prom-1",
        templateId: "tmpl-1",
        templateName: "Pain Scale",
        status: "Pending",
        createdAt: "2024-01-01",
        scheduledAt: "2024-01-02",
        dueDate: "2024-01-10",
      };
      mockClient.get.mockResolvedValueOnce(mockProm);

      const result = await fetchPromInstance("prom-1");

      expect(mockClient.get).toHaveBeenCalledWith("/api/proms/instances/prom-1");
      expect(result.id).toBe("prom-1");
    });
  });

  describe("submitPromResponse", () => {
    it("submits questionnaire responses", async () => {
      const answers = { q1: 7, q2: "moderate" };
      mockClient.post.mockResolvedValueOnce({});

      await submitPromResponse("prom-1", answers, 120);

      expect(mockClient.post).toHaveBeenCalledWith("/api/proms/instances/prom-1/answers", {
        answers: [
          { questionId: "q1", value: 7 },
          { questionId: "q2", value: "moderate" },
        ],
        completionSeconds: 120,
      });
    });
  });

  describe("submitPromAnswers", () => {
    it("submits answers and returns score", async () => {
      const answers = { q1: 7 };
      mockClient.post.mockResolvedValueOnce({ score: 7, completedAt: "2024-01-05T14:30:00Z" });

      const result = await submitPromAnswers("prom-1", answers);

      expect(result.score).toBe(7);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe("savePromDraft", () => {
    it("saves partial responses as draft", async () => {
      const draft = { answers: { q1: 5 }, currentQuestionIndex: 1 };
      mockClient.put.mockResolvedValueOnce({});

      await savePromDraft("prom-1", draft);

      expect(mockClient.put).toHaveBeenCalledWith("/api/proms/instances/prom-1/draft", draft);
    });
  });

  describe("fetchPromHistory", () => {
    it("fetches completed questionnaire history", async () => {
      mockClient.get.mockResolvedValueOnce([
        { id: "prom-1", templateName: "Pain Scale", status: "Completed", completedAt: "2024-01-05", totalScore: 6, createdAt: "2024-01-01", scheduledAt: "2024-01-01", dueDate: "2024-01-10" },
        { id: "prom-2", templateName: "Function", status: "Completed", completedAt: "2024-01-10", totalScore: 8, createdAt: "2024-01-01", scheduledAt: "2024-01-01", dueDate: "2024-01-10" },
      ]);

      const result = await fetchPromHistory();

      expect(mockClient.get).toHaveBeenCalledWith("/api/proms/instances", { status: "completed" });
      expect(result).toHaveLength(2);
    });
  });

  describe("fetchPromStats", () => {
    it("calculates completion statistics", async () => {
      mockClient.get.mockResolvedValueOnce([
        { id: "1", templateName: "T1", status: "Completed", totalScore: 5, questionCount: 10, createdAt: "2024-01-01", scheduledAt: "2024-01-01", dueDate: "2024-01-10", completedAt: "2024-01-05" },
        { id: "2", templateName: "T2", status: "Completed", totalScore: 8, questionCount: 10, createdAt: "2024-01-01", scheduledAt: "2024-01-01", dueDate: "2024-01-10", completedAt: "2024-01-06" },
        { id: "3", templateName: "T3", status: "Pending", createdAt: "2024-01-01", scheduledAt: "2024-01-01", dueDate: "2024-01-10" },
      ]);

      const result = await fetchPromStats();

      expect(result.totalAssigned).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.pending).toBe(1);
    });
  });
});

describe("promsApi data flow from clinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("receives PROM assigned by clinic", async () => {
    const clinicAssignedProm = {
      id: "prom-clinic-1",
      templateId: "tmpl-pain",
      templateName: "Pain Assessment (Clinic Assigned)",
      status: "Pending",
      createdAt: "2024-01-01T10:00:00Z",
      scheduledAt: "2024-01-02T09:00:00Z",
      dueDate: "2024-01-10T23:59:59Z",
    };
    mockClient.get.mockResolvedValueOnce([clinicAssignedProm]);

    const result = await fetchPromInstances();

    expect(result[0].templateName).toBe("Pain Assessment (Clinic Assigned)");
    expect(result[0].status).toBe("pending");
  });

  it("submitted responses are available to clinic", async () => {
    const answers = { pain_level: 7 };
    mockClient.post.mockResolvedValueOnce({ score: 7, completedAt: "2024-01-05T14:30:00Z" });

    const result = await submitPromAnswers("prom-1", answers);

    expect(result.score).toBe(7);
    expect(result.completedAt).toBeDefined();
  });
});
