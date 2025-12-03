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
import { referralApi } from "../referralApi";

const mockClient = vi.mocked(apiClient);

describe("referralApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("fetches referrals list", async () => {
      const mockData = [
        { id: "ref-1", patientId: "p-1", status: "Pending", type: "Specialist" },
        { id: "ref-2", patientId: "p-2", status: "Sent", type: "Imaging" },
      ];
      mockClient.get.mockResolvedValueOnce(mockData);

      await referralApi.getAll();

      expect(mockClient.get).toHaveBeenCalledWith("/api/referrals?");
      expect(result).toHaveLength(2);
    });

    it("filters by status", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await referralApi.getAll({ status: "Pending" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/referrals?status=Pending");
    });

    it("filters by date range", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await referralApi.getAll({
        fromDate: "2024-01-01",
        toDate: "2024-01-31",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/api/referrals?fromDate=2024-01-01&toDate=2024-01-31");
    });

    it("filters by patient", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await referralApi.getAll({ patientId: "patient-123" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/referrals?patientId=patient-123");
    });
  });

  describe("getById", () => {
    it("fetches single referral", async () => {
      const mockReferral = {
        id: "ref-1",
        patientId: "p-1",
        type: "Specialist",
        specialty: "Orthopedics",
        status: "Pending",
      };
      mockClient.get.mockResolvedValueOnce(mockReferral);

      await referralApi.getById("ref-1");

      expect(mockClient.get).toHaveBeenCalledWith("/api/referrals/ref-1");
      expect(result.specialty).toBe("Orthopedics");
    });
  });

  describe("getByPatient", () => {
    it("fetches referrals for patient", async () => {
      mockClient.get.mockResolvedValueOnce([{ id: "ref-1" }, { id: "ref-2" }]);

      await referralApi.getByPatient("patient-123");

      expect(mockClient.get).toHaveBeenCalledWith("/api/referrals/patient/patient-123");
      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("creates new referral", async () => {
      const newReferral = {
        patientId: "p-1",
        type: "Specialist" as const,
        specialty: "Cardiology",
        priority: "Routine" as const,
        reasonForReferral: "Evaluation needed",
      };
      mockClient.post.mockResolvedValueOnce({ id: "ref-new", ...newReferral, status: "Draft" });

      await referralApi.create(newReferral);

      expect(mockClient.post).toHaveBeenCalledWith("/api/referrals", newReferral);
      expect(result.status).toBe("Draft");
    });
  });

  describe("update", () => {
    it("updates referral", async () => {
      const updates = { specialty: "Neurology" };
      mockClient.put.mockResolvedValueOnce({ id: "ref-1", specialty: "Neurology" });

      await referralApi.update("ref-1", updates);

      expect(mockClient.put).toHaveBeenCalledWith("/api/referrals/ref-1", updates);
      expect(result.specialty).toBe("Neurology");
    });
  });

  describe("updateStatus", () => {
    it("updates referral status", async () => {
      mockClient.patch.mockResolvedValueOnce({ id: "ref-1", status: "Sent" });

      await referralApi.updateStatus("ref-1", "Sent");

      expect(mockClient.patch).toHaveBeenCalledWith("/api/referrals/ref-1/status", {
        status: "Sent",
        notes: undefined,
      });
    });

    it("updates status with notes", async () => {
      mockClient.patch.mockResolvedValueOnce({ id: "ref-1", status: "Cancelled" });

      await referralApi.updateStatus("ref-1", "Cancelled", "Patient declined");

      expect(mockClient.patch).toHaveBeenCalledWith("/api/referrals/ref-1/status", {
        status: "Cancelled",
        notes: "Patient declined",
      });
    });
  });

  describe("send", () => {
    it("sends referral", async () => {
      mockClient.post.mockResolvedValueOnce({ id: "ref-1", status: "Sent", sentAt: "2024-01-01" });

      await referralApi.send("ref-1");

      expect(mockClient.post).toHaveBeenCalledWith("/api/referrals/ref-1/send", {});
      expect(result.status).toBe("Sent");
    });
  });

  describe("cancel", () => {
    it("cancels referral with reason", async () => {
      mockClient.post.mockResolvedValueOnce({ id: "ref-1", status: "Cancelled" });

      await referralApi.cancel("ref-1", "No longer needed");

      expect(mockClient.post).toHaveBeenCalledWith("/api/referrals/ref-1/cancel", {
        reason: "No longer needed",
      });
    });
  });

  describe("attachDocument", () => {
    it("attaches document to referral", async () => {
      mockClient.post.mockResolvedValueOnce({ id: "ref-1", referralDocumentId: "doc-1" });

      await referralApi.attachDocument("ref-1", "doc-1");

      expect(mockClient.post).toHaveBeenCalledWith("/api/referrals/ref-1/documents", {
        documentId: "doc-1",
        isResponse: false,
      });
    });

    it("attaches response document", async () => {
      mockClient.post.mockResolvedValueOnce({ id: "ref-1", responseDocumentId: "doc-2" });

      await referralApi.attachDocument("ref-1", "doc-2", true);

      expect(mockClient.post).toHaveBeenCalledWith("/api/referrals/ref-1/documents", {
        documentId: "doc-2",
        isResponse: true,
      });
    });
  });
});

describe("referralApi error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propagates API errors", async () => {
    mockClient.get.mockRejectedValueOnce(new Error("Network error"));

    await expect(referralApi.getAll()).rejects.toThrow("Network error");
  });

  it("handles 404 for non-existent referral", async () => {
    mockClient.get.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(referralApi.getById("invalid")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
