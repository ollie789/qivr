import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from "../../lib/api-client";
import { intakeApi } from "../intakeApi";

const mockClient = vi.mocked(apiClient);

describe("intakeApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getIntakes", () => {
    it("fetches all intakes from evaluations endpoint", async () => {
      const mockData = [
        { id: "int-1", patientName: "John Doe", status: "Pending", chiefComplaint: "Back pain" },
        { id: "int-2", patientName: "Jane Smith", status: "Reviewed", chiefComplaint: "Knee pain" },
      ];
      mockClient.get.mockResolvedValueOnce(mockData);

      await intakeApi.getIntakes();

      expect(mockClient.get).toHaveBeenCalledWith("/api/evaluations", { params: undefined });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].patientName).toBe("John Doe");
    });

    it("handles empty response", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await intakeApi.getIntakes();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("filters by status", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await intakeApi.getIntakes({ status: "pending" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/evaluations", { params: { status: "pending" } });
    });

    it("handles API error gracefully and returns empty", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Network error"));

      await intakeApi.getIntakes();

      // intakeApi catches errors and returns empty
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getIntakeDetails", () => {
    it("fetches single intake by ID", async () => {
      const mockIntake = {
        id: "int-1",
        patientName: "John Doe",
        patientEmail: "john@example.com",
        status: "Pending",
        chiefComplaint: "Back pain",
        questionnaireResponses: { description: "Lower back pain" },
      };
      mockClient.get.mockResolvedValueOnce(mockIntake);

      await intakeApi.getIntakeDetails("int-1");

      expect(mockClient.get).toHaveBeenCalledWith("/api/evaluations/int-1");
      expect(result.id).toBe("int-1");
    });
  });

  describe("updateIntakeStatus", () => {
    it("updates intake status", async () => {
      mockClient.patch.mockResolvedValueOnce({ id: "int-1", status: "Triaged" });

      await intakeApi.updateIntakeStatus("int-1", "approved");

      expect(mockClient.patch).toHaveBeenCalledWith("/api/evaluations/int-1/status", {
        status: "approved",
        notes: undefined,
      });
    });

    it("updates intake status with notes", async () => {
      mockClient.patch.mockResolvedValueOnce({ id: "int-1", status: "Archived" });

      await intakeApi.updateIntakeStatus("int-1", "rejected", "Incomplete information");

      expect(mockClient.patch).toHaveBeenCalledWith("/api/evaluations/int-1/status", {
        status: "rejected",
        notes: "Incomplete information",
      });
    });
  });
});

describe("intakeApi mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps evaluation urgency to severity", async () => {
    mockClient.get.mockResolvedValueOnce([
      { id: "1", patientName: "Test", urgency: "urgent", status: "Pending" },
      { id: "2", patientName: "Test2", urgency: "low", status: "Pending" },
    ]);

    await intakeApi.getIntakes();

    expect(result.data[0].severity).toBe("critical");
    expect(result.data[1].severity).toBe("low");
  });

  it("maps evaluation status correctly", async () => {
    mockClient.get.mockResolvedValueOnce([
      { id: "1", patientName: "Test", status: "Pending" },
      { id: "2", patientName: "Test2", status: "Reviewed" },
      { id: "3", patientName: "Test3", status: "Triaged" },
    ]);

    await intakeApi.getIntakes();

    expect(result.data[0].status).toBe("pending");
    expect(result.data[1].status).toBe("reviewing");
    expect(result.data[2].status).toBe("approved");
  });

  it("handles missing patient name", async () => {
    mockClient.get.mockResolvedValueOnce([{ id: "1", status: "Pending" }]);

    await intakeApi.getIntakes();

    expect(result.data[0].patientName).toBe("Unknown Patient");
  });
});
