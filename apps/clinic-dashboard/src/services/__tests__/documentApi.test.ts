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

// Mock fetch for upload
const mockFetch = vi.fn();
global.fetch = mockFetch;

import apiClient from "../../lib/api-client";
import { documentApi } from "../documentApi";

const mockClient = vi.mocked(apiClient);

describe("documentApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("fetches documents for patient", async () => {
      const mockDocs = [
        { id: "doc-1", fileName: "MRI Report.pdf", documentType: "imaging" },
        { id: "doc-2", fileName: "Lab Results.pdf", documentType: "lab" },
      ];
      mockClient.get.mockResolvedValueOnce(mockDocs);

      await documentApi.list({ patientId: "patient-1" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/documents?patientId=patient-1");
      expect(result).toHaveLength(2);
    });

    it("fetches all documents without filter", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await documentApi.list();

      expect(mockClient.get).toHaveBeenCalledWith("/api/documents?");
    });

    it("filters by document type", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await documentApi.list({ documentType: "imaging" });

      expect(mockClient.get).toHaveBeenCalledWith("/api/documents?documentType=imaging");
    });

    it("filters by status and urgency", async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await documentApi.list({ status: "pending", isUrgent: true });

      expect(mockClient.get).toHaveBeenCalledWith("/api/documents?status=pending&isUrgent=true");
    });
  });

  describe("upload", () => {
    it("uploads document with metadata", async () => {
      const mockFile = new File(["test content"], "test.pdf", { type: "application/pdf" });
      const mockResponse = { id: "doc-new", fileName: "test.pdf" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await documentApi.upload({
        file: mockFile,
        patientId: "patient-1",
        documentType: "clinical",
        notes: "Test document",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/documents/upload", expect.objectContaining({
        method: "POST",
        credentials: "include",
      }));
      expect(result.id).toBe("doc-new");
    });

    it("throws on upload failure", async () => {
      const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" });

      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(documentApi.upload({ file: mockFile, patientId: "p-1" })).rejects.toThrow("Upload failed");
    });

    it("includes tags in upload", async () => {
      const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "doc-1" }),
      });

      await documentApi.upload({
        file: mockFile,
        patientId: "p-1",
        tags: ["urgent", "review"],
      });

      expect(mockFetch).toHaveBeenCalled();
      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toBeInstanceOf(FormData);
    });
  });

  describe("getById", () => {
    it("fetches document details", async () => {
      const mockDoc = {
        id: "doc-1",
        fileName: "Report.pdf",
        documentType: "clinical",
        fileSize: 1024000,
        extractedText: "Extracted text content...",
      };
      mockClient.get.mockResolvedValueOnce(mockDoc);

      await documentApi.getById("doc-1");

      expect(mockClient.get).toHaveBeenCalledWith("/api/documents/doc-1");
      expect(result.extractedText).toBeDefined();
    });
  });

  describe("getDownloadUrl", () => {
    it("gets presigned download URL", async () => {
      mockClient.get.mockResolvedValueOnce({ url: "https://s3.../presigned-url", expiresIn: 3600 });

      await documentApi.getDownloadUrl("doc-1");

      expect(mockClient.get).toHaveBeenCalledWith("/api/documents/doc-1/download");
      expect(result.url).toContain("https://");
      expect(result.expiresIn).toBe(3600);
    });
  });
});

describe("documentApi CRUD operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("classify", () => {
    it("classifies document type", async () => {
      mockClient.patch.mockResolvedValueOnce({ id: "doc-1", documentType: "imaging" });

      await documentApi.classify("doc-1", "imaging");

      expect(mockClient.patch).toHaveBeenCalledWith("/api/documents/doc-1/classify", { documentType: "imaging" });
    });
  });

  describe("assign", () => {
    it("assigns document to user", async () => {
      mockClient.patch.mockResolvedValueOnce({ id: "doc-1", assignedTo: "user-1" });

      await documentApi.assign("doc-1", "user-1");

      expect(mockClient.patch).toHaveBeenCalledWith("/api/documents/doc-1/assign", { assignedTo: "user-1" });
    });
  });

  describe("delete", () => {
    it("deletes document", async () => {
      mockClient.delete.mockResolvedValueOnce({});

      await documentApi.delete("doc-1");

      expect(mockClient.delete).toHaveBeenCalledWith("/api/documents/doc-1");
    });
  });
});

describe("documentApi error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propagates API errors", async () => {
    mockClient.get.mockRejectedValueOnce(new Error("Network error"));

    await expect(documentApi.list()).rejects.toThrow("Network error");
  });

  it("handles 404 for non-existent document", async () => {
    mockClient.get.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(documentApi.getById("invalid")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
