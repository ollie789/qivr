import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("../../lib/api-client", () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from "../../lib/api-client";
import {
  fetchPromInstances,
  fetchPromStats,
  fetchPromTemplate,
  fetchPromInstance,
  savePromDraft,
  submitPromResponse,
} from "../promsApi";
import type { PromTemplate } from "../../types";

const mockClient = vi.mocked(apiClient);

describe("promsApi", () => {
  const apiInstances = [
    {
      id: "1",
      templateId: "tmpl-1",
      templateName: "PROM A",
      status: "Pending",
      createdAt: "2025-01-01T00:00:00Z",
      scheduledAt: "2025-01-01T00:00:00Z",
      dueDate: "2025-01-05T00:00:00Z",
      questionCount: 5,
      answeredCount: 0,
    },
  ];

  const completedApiInstances = [
    {
      id: "2",
      templateId: "tmpl-2",
      templateName: "PROM B",
      status: "Completed",
      createdAt: "2025-01-01T00:00:00Z",
      scheduledAt: "2025-01-02T00:00:00Z",
      dueDate: "2025-01-03T00:00:00Z",
      completedAt: "2025-01-03T12:00:00Z",
      totalScore: 12,
      questionCount: 6,
      answeredCount: 6,
    },
  ];

  const template: PromTemplate = {
    id: "tmpl-1",
    name: "PROM Template",
    category: "general",
    questions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchPromInstances unwraps envelope responses", async () => {
    mockClient.get.mockResolvedValueOnce({ data: apiInstances });

    const result = await fetchPromInstances("pending");

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/proms/instances", {
      status: "pending",
    });
    expect(result[0]).toMatchObject({
      id: "1",
      templateId: "tmpl-1",
      templateName: "PROM A",
      status: "pending",
      dueDate: "2025-01-05T00:00:00Z",
    });
  });

  it("fetchPromInstances returns plain values when no envelope present", async () => {
    mockClient.get.mockResolvedValueOnce(apiInstances);

    const result = await fetchPromInstances();

    expect(mockClient.get).toHaveBeenCalledWith(
      "/api/v1/proms/instances",
      undefined,
    );
    expect(result[0]?.status).toBe("pending");
  });

  it("normalizes canceled statuses to cancelled", async () => {
    mockClient.get.mockResolvedValueOnce([
      {
        ...apiInstances[0],
        status: "Canceled",
      },
    ]);

    const result = await fetchPromInstances();

    expect(result[0]?.status).toBe("cancelled");
  });

  it("submitPromResponse posts answers payload", async () => {
    mockClient.post.mockResolvedValueOnce(apiInstances[0]);

    const responses = { q1: "yes", q2: 3 };
    await submitPromResponse("instance-1", responses, 120);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/api/v1/proms/instances/instance-1/answers",
      {
        answers: [
          { questionId: "q1", value: "yes" },
          { questionId: "q2", value: 3 },
        ],
        completionSeconds: 120,
      },
    );
  });

  it("savePromDraft forwards draft payload", async () => {
    mockClient.put.mockResolvedValueOnce(undefined);

    await savePromDraft("instance-2", {
      responses: { q1: "draft" },
      lastQuestionIndex: 2,
    });

    expect(mockClient.put).toHaveBeenCalledWith(
      "/api/v1/proms/instances/instance-2/draft",
      {
        responses: { q1: "draft" },
        lastQuestionIndex: 2,
      },
    );
  });

  it("fetchPromStats unwraps responses", async () => {
    mockClient.get.mockResolvedValueOnce({
      data: [...apiInstances, ...completedApiInstances],
    });

    const result = await fetchPromStats();

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/proms/instances");
    expect(result.totalAssigned).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.averageScore).toBeGreaterThanOrEqual(0);
  });

  it("fetchPromInstance and fetchPromTemplate use legacy routes", async () => {
    mockClient.get
      .mockResolvedValueOnce(apiInstances[0])
      .mockResolvedValueOnce(template);

    const instance = await fetchPromInstance("instance-3");
    expect(mockClient.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/proms/instances/instance-3",
    );
    expect(instance.templateName).toEqual("PROM A");

    const tpl = await fetchPromTemplate("tmpl-1");
    expect(mockClient.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/proms/templates/by-id/tmpl-1",
    );
    expect(tpl).toEqual(template);
  });
});
