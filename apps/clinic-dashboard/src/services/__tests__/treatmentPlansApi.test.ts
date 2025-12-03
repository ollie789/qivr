import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api-client", () => ({
  __esModule: true,
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../../lib/api-client";
import { treatmentPlansApi } from "../../lib/api";

const mockApi = vi.mocked(api);

describe("treatmentPlansApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("fetches all treatment plans", async () => {
      const mockPlans = [
        { id: "tp-1", name: "Shoulder Rehab", patientId: "p-1" },
        { id: "tp-2", name: "Knee Recovery", patientId: "p-2" },
      ];
      mockApi.get.mockResolvedValueOnce(mockPlans);

      await treatmentPlansApi.list();

      expect(mockApi.get).toHaveBeenCalledWith("/api/treatment-plans", undefined);
      expect(result).toEqual(mockPlans);
    });

    it("filters by patientId", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      await treatmentPlansApi.list("patient-123");

      expect(mockApi.get).toHaveBeenCalledWith("/api/treatment-plans", { patientId: "patient-123" });
    });
  });

  describe("get", () => {
    it("fetches single treatment plan", async () => {
      const mockPlan = { id: "tp-1", name: "Back Pain Protocol", exercises: [] };
      mockApi.get.mockResolvedValueOnce(mockPlan);

      await treatmentPlansApi.get("tp-1");

      expect(mockApi.get).toHaveBeenCalledWith("/api/treatment-plans/tp-1");
      expect(result).toEqual(mockPlan);
    });
  });

  describe("create", () => {
    it("creates new treatment plan", async () => {
      const newPlan = { name: "New Plan", patientId: "p-1", exercises: [] };
      const mockResponse = { id: "tp-new", ...newPlan };
      mockApi.post.mockResolvedValueOnce(mockResponse);

      await treatmentPlansApi.create(newPlan);

      expect(mockApi.post).toHaveBeenCalledWith("/api/treatment-plans", newPlan);
      expect(result.id).toBe("tp-new");
    });
  });

  describe("update", () => {
    it("updates existing treatment plan", async () => {
      const updates = { name: "Updated Plan" };
      mockApi.put.mockResolvedValueOnce({ id: "tp-1", ...updates });

      await treatmentPlansApi.update("tp-1", updates);

      expect(mockApi.put).toHaveBeenCalledWith("/api/treatment-plans/tp-1", updates);
      expect(result.name).toBe("Updated Plan");
    });
  });

  describe("delete", () => {
    it("deletes treatment plan", async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await treatmentPlansApi.delete("tp-1");

      expect(mockApi.delete).toHaveBeenCalledWith("/api/treatment-plans/tp-1");
    });
  });
});

describe("treatmentPlansApi AI features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generate", () => {
    it("generates AI treatment plan", async () => {
      const params = { patientId: "p-1", focusAreas: ["shoulder", "neck"] };
      mockApi.post.mockResolvedValueOnce({ id: "tp-ai", status: "draft" });

      await treatmentPlansApi.generate(params);

      expect(mockApi.post).toHaveBeenCalledWith("/api/treatment-plans/generate", params);
    });
  });

  describe("preview", () => {
    it("previews AI suggestions without saving", async () => {
      const params = { patientId: "p-1" };
      mockApi.post.mockResolvedValueOnce({ exercises: [], recommendations: [] });

      await treatmentPlansApi.preview(params);

      expect(mockApi.post).toHaveBeenCalledWith("/api/treatment-plans/preview", params);
    });
  });

  describe("approve", () => {
    it("approves treatment plan", async () => {
      mockApi.post.mockResolvedValueOnce({ id: "tp-1", status: "approved" });

      await treatmentPlansApi.approve("tp-1");

      expect(mockApi.post).toHaveBeenCalledWith("/api/treatment-plans/tp-1/approve");
    });
  });
});
