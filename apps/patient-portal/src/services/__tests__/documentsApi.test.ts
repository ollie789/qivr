import { beforeEach, describe, expect, it, vi } from "vitest";

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

const { uploadWithProgressMock } = vi.hoisted(() => ({
  uploadWithProgressMock: vi.fn(),
}));

vi.mock("@qivr/http", () => ({
  uploadWithProgress: uploadWithProgressMock,
}));

import apiClient from "../../lib/api-client";
import {
  fetchDocuments,
  fetchFolders,
  uploadDocument,
  deleteDocument,
  toggleStar,
} from "../documentsApi";
import type { DocumentFolder } from "../../types";

const mockClient = vi.mocked(apiClient);

describe("documentsApi", () => {
  const apiDocuments = [
    {
      id: "doc-1",
      patientId: "patient-1",
      fileName: "Intake.pdf",
      mimeType: "application/pdf",
      category: "medical",
      description: "Initial intake form",
      fileSize: 1234,
      uploadedBy: "Nurse Joy",
      uploadedAt: "2024-01-01T00:00:00Z",
      requiresReview: true,
      reviewStatus: "pending",
      tags: ["intake"],
      shares: [
        {
          shareId: "share-1",
          sharedWithUserId: "clinician-1",
          sharedWithName: "Dr. Smith",
          sharedByUserId: "staff-1",
          sharedByName: "Nurse Joy",
          sharedAt: "2024-01-02T00:00:00Z",
          accessLevel: "view",
          revoked: false,
        },
      ],
    },
  ];

  const folders: DocumentFolder[] = [
    {
      id: "folder-1",
      name: "Medical",
      createdDate: "2024-01-01T00:00:00Z",
      documentCount: 5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchDocuments unwraps envelope, forwards filters, and maps metadata", async () => {
    mockClient.get.mockResolvedValueOnce({ data: apiDocuments });

    const result = await fetchDocuments({
      category: "medical",
      search: "intake",
      requiresReview: true,
    });

    expect(mockClient.get).toHaveBeenCalledWith("/api/documents", {
      category: "medical",
      search: "intake",
      requiresReview: "true",
    });

    expect(result).toHaveLength(1);
    const mapped = result[0];
    expect(mapped?.name).toBe("Intake.pdf");
    expect(mapped?.requiresReview).toBe(true);
    expect(mapped?.reviewStatus).toBe("pending");
    expect(mapped?.sharedWith).toEqual(["Dr. Smith"]);
    expect(mapped?.shares).toHaveLength(1);
  });

  it("fetchFolders returns plain data", async () => {
    mockClient.get.mockResolvedValueOnce(folders);

    const result = await fetchFolders();

    expect(mockClient.get).toHaveBeenCalledWith("/api/documents/folders");
    expect(result).toEqual(folders);
  });

  it("uploadDocument delegates to uploadWithProgress", async () => {
    uploadWithProgressMock.mockResolvedValueOnce({ id: "upload-1" });
    const file = new File(["data"], "report.pdf", { type: "application/pdf" });
    const progressSpy = vi.fn();

    const result = await uploadDocument(
      { file, category: "medical", tags: ["intake"] },
      progressSpy,
    );

    expect(uploadWithProgressMock).toHaveBeenCalledTimes(1);
    const [path, formData, options] = uploadWithProgressMock.mock.calls[0];
    expect(path).toBe("/api/documents/upload");
    expect(formData).toBeInstanceOf(FormData);
    expect(typeof options.onUploadProgress).toBe("function");
    expect(formData.get("category")).toBe("medical");
    expect(formData.get("tags")).toBe(JSON.stringify(["intake"]));

    // simulate progress callback
    options.onUploadProgress?.(42);
    expect(progressSpy).toHaveBeenCalledWith(42);

    expect(result).toEqual({ id: "upload-1" });
  });

  it("toggleStar calls patch with flipped value", async () => {
    mockClient.patch.mockResolvedValueOnce(undefined);

    await toggleStar("doc-2", true);

    expect(mockClient.patch).toHaveBeenCalledWith("/api/documents/doc-2/star", {
      starred: true,
    });
  });

  it("deleteDocument calls delete endpoint", async () => {
    mockClient.delete.mockResolvedValueOnce(undefined);

    await deleteDocument("doc-3");

    expect(mockClient.delete).toHaveBeenCalledWith("/api/documents/doc-3");
  });
});
