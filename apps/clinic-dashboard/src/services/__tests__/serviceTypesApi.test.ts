import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../lib/api-client";
import { serviceTypesApi } from "../serviceTypesApi";

const mockApi = vi.mocked(api);

describe("serviceTypesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("fetches all service types", async () => {
      const mockData = [
        { id: "1", name: "Initial Eval", durationMinutes: 60, price: 150, isActive: true },
      ];
      mockApi.get.mockResolvedValueOnce({ data: mockData });

      const result = await serviceTypesApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith("/api/servicetypes");
      expect(result).toEqual(mockData);
    });

    it("filters by specialty", async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await serviceTypesApi.getAll("Physical Therapy");

      expect(mockApi.get).toHaveBeenCalledWith("/api/servicetypes?specialty=Physical%20Therapy");
    });
  });

  describe("getById", () => {
    it("fetches single service type", async () => {
      const mockData = { id: "1", name: "Follow-up", durationMinutes: 30, price: 75 };
      mockApi.get.mockResolvedValueOnce({ data: mockData });

      const result = await serviceTypesApi.getById("1");

      expect(mockApi.get).toHaveBeenCalledWith("/api/servicetypes/1");
      expect(result).toEqual(mockData);
    });
  });

  describe("create", () => {
    it("creates new service type", async () => {
      const newService = { name: "New Service", durationMinutes: 45, price: 100 };
      const mockResponse = { id: "new-id", ...newService, isActive: true };
      mockApi.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await serviceTypesApi.create(newService);

      expect(mockApi.post).toHaveBeenCalledWith("/api/servicetypes", newService);
      expect(result.id).toBe("new-id");
    });
  });

  describe("update", () => {
    it("updates existing service type", async () => {
      const updates = { name: "Updated Name", price: 200 };
      mockApi.put.mockResolvedValueOnce({ data: { id: "1", ...updates } });

      const result = await serviceTypesApi.update("1", updates);

      expect(mockApi.put).toHaveBeenCalledWith("/api/servicetypes/1", updates);
      expect(result.name).toBe("Updated Name");
    });
  });

  describe("delete", () => {
    it("deletes service type", async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await serviceTypesApi.delete("1");

      expect(mockApi.delete).toHaveBeenCalledWith("/api/servicetypes/1");
    });
  });

  describe("getSpecialties", () => {
    it("fetches available specialties", async () => {
      const specialties = ["Physical Therapy", "Occupational Therapy"];
      mockApi.get.mockResolvedValueOnce({ data: specialties });

      const result = await serviceTypesApi.getSpecialties();

      expect(mockApi.get).toHaveBeenCalledWith("/api/servicetypes/specialties");
      expect(result).toEqual(specialties);
    });
  });
});
