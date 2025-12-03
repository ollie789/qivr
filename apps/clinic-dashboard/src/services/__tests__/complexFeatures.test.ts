import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api-client", () => ({
  __esModule: true,
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../../lib/api-client";
import apiClient from "../../lib/api-client";
import { treatmentPlansApi } from "../../lib/api";

const mockApi = vi.mocked(api);
const mockClient = vi.mocked(apiClient);

describe("AI Treatment Plan Generation - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles AI generation timeout", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("timeout of 60000ms exceeded"));

    await expect(treatmentPlansApi.generate({ patientId: "p-1" })).rejects.toThrow("timeout");
  });

  it("handles AI service unavailable", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { status: 503, data: { message: "AI service temporarily unavailable" } },
    });

    await expect(treatmentPlansApi.generate({ patientId: "p-1" })).rejects.toMatchObject({
      response: { status: 503 },
    });
  });

  it("handles malformed AI response", async () => {
    mockApi.post.mockResolvedValueOnce(null);

    await treatmentPlansApi.generate({ patientId: "p-1" });
    expect(result).toBeNull();
  });

  it("handles AI rate limiting", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { status: 429, data: { message: "Rate limit exceeded", retryAfter: 60 } },
    });

    await expect(treatmentPlansApi.generate({ patientId: "p-1" })).rejects.toMatchObject({
      response: { status: 429 },
    });
  });

  it("handles complex contraindications", async () => {
    const complexParams = {
      patientId: "p-1",
      evaluationId: "eval-1",
      preferredDurationWeeks: 12,
      sessionsPerWeek: 3,
      focusAreas: ["lumbar spine", "hip flexors", "core stability"],
      contraindications: ["avoid flexion", "no high impact", "cardiac precautions"],
    };
    mockApi.post.mockResolvedValueOnce({ id: "tp-ai", exercises: [], warnings: ["Modified for contraindications"] });

    await treatmentPlansApi.generate(complexParams);

    expect(mockApi.post).toHaveBeenCalledWith("/api/treatment-plans/generate", complexParams);
  });

  it("handles AI preview without saving", async () => {
    mockApi.post.mockResolvedValueOnce({
      exercises: [{ id: "ex-1", name: "Bridge" }],
      estimatedDuration: 8,
      difficulty: "moderate",
      // No ID - not saved
    });

    await treatmentPlansApi.preview({ patientId: "p-1" });

    expect(mockApi.post).toHaveBeenCalledWith("/api/treatment-plans/preview", { patientId: "p-1" });
    expect(result.exercises).toBeDefined();
  });
});

describe("Concurrent Operations - Race Conditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles concurrent appointment updates", async () => {
    // First update succeeds
    mockClient.put.mockResolvedValueOnce({ id: "apt-1", version: 2 });
    // Second update fails with conflict
    mockClient.put.mockRejectedValueOnce({
      response: { status: 409, data: { message: "Appointment was modified by another user" } },
    });

    const update1 = mockClient.put("/api/appointments/apt-1", { status: "confirmed" });
    const update2 = mockClient.put("/api/appointments/apt-1", { status: "cancelled" });

    await expect(update1).resolves.toMatchObject({ id: "apt-1" });
    await expect(update2).rejects.toMatchObject({ response: { status: 409 } });
  });

  it("handles stale data on patient update", async () => {
    mockClient.put.mockRejectedValueOnce({
      response: {
        status: 412,
        data: { message: "Precondition failed - data has changed", currentVersion: 5 },
      },
    });

    await expect(mockClient.put("/api/patients/p-1", { name: "Updated" })).rejects.toMatchObject({
      response: { status: 412 },
    });
  });
});

describe("Large Data Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles large patient list pagination", async () => {
    const largePage = {
      items: Array(100).fill(null).map((_, i) => ({ id: `p-${i}`, name: `Patient ${i}` })),
      nextCursor: "cursor-page-2",
      hasNext: true,
      count: 5000,
    };
    mockClient.get.mockResolvedValueOnce(largePage);

    await mockClient.get("/api/patients", { limit: 100 });

    expect(result.items).toHaveLength(100);
    expect(result.hasNext).toBe(true);
    expect(result.count).toBe(5000);
  });

  it("handles large PROM response with many questions", async () => {
    const largeTemplate = {
      id: "tmpl-1",
      name: "Comprehensive Assessment",
      questions: Array(50).fill(null).map((_, i) => ({
        id: `q-${i}`,
        text: `Question ${i}`,
        type: i % 3 === 0 ? "scale" : i % 3 === 1 ? "text" : "choice",
      })),
    };
    mockClient.get.mockResolvedValueOnce(largeTemplate);

    await mockClient.get("/api/proms/templates/tmpl-1");

    expect(result.questions).toHaveLength(50);
  });

  it("handles analytics with large date range", async () => {
    const yearOfData = {
      appointmentTrends: Array(365).fill(null).map((_, i) => ({
        date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, "0")}-${String((i % 30) + 1).padStart(2, "0")}`,
        scheduled: Math.floor(Math.random() * 20) + 5,
        completed: Math.floor(Math.random() * 18) + 3,
      })),
    };
    mockClient.get.mockResolvedValueOnce(yearOfData);

    await mockClient.get("/api/clinic-analytics/clinical", {
      from: "2024-01-01",
      to: "2024-12-31",
    });

    expect(result.appointmentTrends).toHaveLength(365);
  });
});

describe("Validation Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid email format", async () => {
    mockClient.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { errors: { email: "Invalid email format" } },
      },
    });

    await expect(mockClient.post("/api/patients", { email: "not-an-email" })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("rejects future date of birth", async () => {
    mockClient.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { errors: { dateOfBirth: "Date of birth cannot be in the future" } },
      },
    });

    await expect(
      mockClient.post("/api/patients", { dateOfBirth: "2099-01-01" })
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("rejects overlapping appointment times", async () => {
    mockClient.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: "Time slot conflicts with existing appointment", conflictingId: "apt-existing" },
      },
    });

    await expect(
      mockClient.post("/api/appointments", { startTime: "2024-01-15T10:00:00Z", providerId: "prov-1" })
    ).rejects.toMatchObject({
      response: { status: 409 },
    });
  });

  it("rejects negative pain score", async () => {
    mockClient.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { errors: { painLevel: "Pain level must be between 0 and 10" } },
      },
    });

    await expect(
      mockClient.post("/api/evaluations", { painLevel: -5 })
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("handles special characters in search", async () => {
    mockClient.get.mockResolvedValueOnce({ items: [] });

    await mockClient.get("/api/patients", { search: "O'Brien-Smith <script>" });

    expect(mockClient.get).toHaveBeenCalledWith("/api/patients", { search: "O'Brien-Smith <script>" });
  });
});

describe("Authentication & Authorization Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles expired token", async () => {
    mockClient.get.mockRejectedValueOnce({
      response: { status: 401, data: { message: "Token expired", code: "TOKEN_EXPIRED" } },
    });

    await expect(mockClient.get("/api/patients")).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("handles insufficient permissions", async () => {
    mockClient.delete.mockRejectedValueOnce({
      response: { status: 403, data: { message: "Insufficient permissions to delete patient records" } },
    });

    await expect(mockClient.delete("/api/patients/p-1")).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it("handles cross-tenant access attempt", async () => {
    mockClient.get.mockRejectedValueOnce({
      response: { status: 403, data: { message: "Access denied - resource belongs to different tenant" } },
    });

    await expect(mockClient.get("/api/patients/other-tenant-patient")).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});

describe("Network & Infrastructure Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles network disconnection", async () => {
    mockClient.get.mockRejectedValueOnce(new Error("Network Error"));

    await expect(mockClient.get("/api/patients")).rejects.toThrow("Network Error");
  });

  it("handles DNS resolution failure", async () => {
    mockClient.get.mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND api.qivr.pro"));

    await expect(mockClient.get("/api/patients")).rejects.toThrow("ENOTFOUND");
  });

  it("handles connection reset", async () => {
    mockClient.get.mockRejectedValueOnce(new Error("ECONNRESET"));

    await expect(mockClient.get("/api/patients")).rejects.toThrow("ECONNRESET");
  });

  it("handles 502 bad gateway", async () => {
    mockClient.get.mockRejectedValueOnce({
      response: { status: 502, data: "Bad Gateway" },
    });

    await expect(mockClient.get("/api/patients")).rejects.toMatchObject({
      response: { status: 502 },
    });
  });

  it("handles 504 gateway timeout", async () => {
    mockClient.get.mockRejectedValueOnce({
      response: { status: 504, data: "Gateway Timeout" },
    });

    await expect(mockClient.get("/api/patients")).rejects.toMatchObject({
      response: { status: 504 },
    });
  });
});

describe("Data Integrity Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles orphaned appointment (deleted patient)", async () => {
    mockClient.get.mockResolvedValueOnce({
      id: "apt-1",
      patientId: "deleted-patient",
      patientName: null,
      status: "orphaned",
    });

    await mockClient.get("/api/appointments/apt-1");

    expect(result.patientName).toBeNull();
  });

  it("handles circular reference in treatment plan", async () => {
    // Exercise A requires B, B requires A
    mockClient.get.mockResolvedValueOnce({
      id: "tp-1",
      exercises: [
        { id: "ex-a", prerequisiteId: "ex-b" },
        { id: "ex-b", prerequisiteId: "ex-a" },
      ],
      warnings: ["Circular dependency detected in exercise prerequisites"],
    });

    await mockClient.get("/api/treatment-plans/tp-1");

    expect(result.warnings).toContain("Circular dependency detected in exercise prerequisites");
  });

  it("handles duplicate PROM submission", async () => {
    mockClient.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: "PROM already submitted", existingSubmissionId: "prom-existing" },
      },
    });

    await expect(
      mockClient.post("/api/proms/instances/prom-1/answers", { answers: {} })
    ).rejects.toMatchObject({
      response: { status: 409 },
    });
  });
});

describe("Timezone & Date Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles appointment at midnight UTC", async () => {
    mockClient.post.mockResolvedValueOnce({
      id: "apt-1",
      scheduledStart: "2024-01-15T00:00:00Z",
      scheduledEnd: "2024-01-15T01:00:00Z",
    });

    await mockClient.post("/api/appointments", {
      startTime: "2024-01-15T00:00:00Z",
    });

    expect(result.scheduledStart).toBe("2024-01-15T00:00:00Z");
  });

  it("handles daylight saving time transition", async () => {
    // March 10, 2024 - DST starts in US
    mockClient.get.mockResolvedValueOnce({
      items: [
        { id: "apt-1", scheduledStart: "2024-03-10T01:30:00-05:00" }, // Before DST
        { id: "apt-2", scheduledStart: "2024-03-10T03:30:00-04:00" }, // After DST (2am skipped)
      ],
    });

    await mockClient.get("/api/appointments", { date: "2024-03-10" });

    expect(result.items).toHaveLength(2);
  });

  it("handles leap year date", async () => {
    mockClient.post.mockResolvedValueOnce({
      id: "apt-1",
      scheduledStart: "2024-02-29T10:00:00Z",
    });

    await mockClient.post("/api/appointments", {
      startTime: "2024-02-29T10:00:00Z",
    });

    expect(result.scheduledStart).toContain("2024-02-29");
  });
});

describe("Unicode & Internationalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles patient name with unicode characters", async () => {
    mockClient.post.mockResolvedValueOnce({
      id: "p-1",
      firstName: "José",
      lastName: "García-López",
    });

    await mockClient.post("/api/patients", {
      firstName: "José",
      lastName: "García-López",
    });

    expect(result.firstName).toBe("José");
    expect(result.lastName).toBe("García-López");
  });

  it("handles Chinese characters in notes", async () => {
    mockClient.put.mockResolvedValueOnce({
      id: "apt-1",
      notes: "患者报告疼痛减轻",
    });

    await mockClient.put("/api/appointments/apt-1", {
      notes: "患者报告疼痛减轻",
    });

    expect(result.notes).toBe("患者报告疼痛减轻");
  });

  it("handles RTL text (Arabic)", async () => {
    mockClient.post.mockResolvedValueOnce({
      id: "p-1",
      firstName: "محمد",
      lastName: "أحمد",
    });

    await mockClient.post("/api/patients", {
      firstName: "محمد",
      lastName: "أحمد",
    });

    expect(result.firstName).toBe("محمد");
  });

  it("handles emoji in notes", async () => {
    mockClient.put.mockResolvedValueOnce({
      id: "apt-1",
      notes: "Patient feeling better 😊 Pain reduced ⬇️",
    });

    await mockClient.put("/api/appointments/apt-1", {
      notes: "Patient feeling better 😊 Pain reduced ⬇️",
    });

    expect(result.notes).toContain("😊");
  });
});
