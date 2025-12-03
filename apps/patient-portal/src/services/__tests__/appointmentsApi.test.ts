import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  handleApiError: vi.fn((err) => { throw err; }),
}));

import { api } from "../api";
import {
  fetchAppointments,
  cancelAppointment,
  rescheduleAppointment,
  fetchAvailableProviders,
  fetchAvailableSlots,
} from "../appointmentsApi";

const mockApi = vi.mocked(api);

describe("appointmentsApi - Patient Portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAppointments", () => {
    it("fetches upcoming appointments for patient", async () => {
      const mockData = {
        items: [
          {
            id: "apt-1",
            scheduledStart: "2024-01-15T10:00:00Z",
            scheduledEnd: "2024-01-15T11:00:00Z",
            providerName: "Dr. Smith",
            appointmentType: "Follow-up",
            status: "Scheduled",
          },
        ],
      };
      mockApi.get.mockResolvedValueOnce(mockData);

      const result = await fetchAppointments({ upcoming: true });

      expect(mockApi.get).toHaveBeenCalledWith("/api/appointments", expect.any(Object));
      expect(result).toHaveLength(1);
      expect(result[0].providerName).toBe("Dr. Smith");
    });

    it("fetches past appointments", async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [
          { id: "apt-1", status: "Completed", scheduledStart: "2024-01-01T10:00:00Z", scheduledEnd: "2024-01-01T11:00:00Z" },
          { id: "apt-2", status: "Completed", scheduledStart: "2023-12-15T14:00:00Z", scheduledEnd: "2023-12-15T15:00:00Z" },
        ],
      });

      const result = await fetchAppointments({ past: true });

      expect(result).toHaveLength(2);
    });

    it("handles empty appointments", async () => {
      mockApi.get.mockResolvedValueOnce({ items: [] });

      const result = await fetchAppointments({});

      expect(result).toHaveLength(0);
    });

    it("normalizes numeric status values", async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [
          { id: "1", status: 0, scheduledStart: "2024-01-15T10:00:00Z" }, // scheduled
          { id: "2", status: 3, scheduledStart: "2024-01-15T10:00:00Z" }, // completed
          { id: "3", status: 4, scheduledStart: "2024-01-15T10:00:00Z" }, // cancelled
        ],
      });

      const result = await fetchAppointments({});

      expect(result[0].status).toBe("scheduled");
      expect(result[1].status).toBe("completed");
      expect(result[2].status).toBe("cancelled");
    });
  });

  describe("cancelAppointment", () => {
    it("cancels appointment with reason", async () => {
      mockApi.post.mockResolvedValueOnce({});

      await cancelAppointment("apt-1", "Schedule conflict");

      expect(mockApi.post).toHaveBeenCalledWith("/api/appointments/apt-1/cancel", {
        reason: "Schedule conflict",
      });
    });
  });

  describe("rescheduleAppointment", () => {
    it("requests appointment reschedule", async () => {
      mockApi.post.mockResolvedValueOnce({});

      const result = await rescheduleAppointment("apt-1");

      expect(mockApi.post).toHaveBeenCalledWith("/api/appointments/apt-1/reschedule", {});
      expect(result.id).toBe("apt-1");
    });
  });

  describe("fetchAvailableProviders", () => {
    it("fetches available providers for date", async () => {
      mockApi.get.mockResolvedValueOnce([
        { id: "prov-1", fullName: "Dr. Smith", specialty: "Physical Therapy" },
        { id: "prov-2", fullName: "Dr. Jones", specialty: "Orthopedics" },
      ]);

      const result = await fetchAvailableProviders("2024-01-20");

      expect(mockApi.get).toHaveBeenCalledWith("/api/appointments/providers/available", { date: "2024-01-20" });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Dr. Smith");
    });

    it("filters by specialization", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      await fetchAvailableProviders("2024-01-20", "Physical Therapy");

      expect(mockApi.get).toHaveBeenCalledWith("/api/appointments/providers/available", {
        date: "2024-01-20",
        specialization: "Physical Therapy",
      });
    });
  });

  describe("fetchAvailableSlots", () => {
    it("fetches available time slots", async () => {
      mockApi.get.mockResolvedValueOnce([
        { startTime: "2024-01-20T09:00:00Z", endTime: "2024-01-20T09:30:00Z", available: true },
        { startTime: "2024-01-20T10:00:00Z", endTime: "2024-01-20T10:30:00Z", available: true },
      ]);

      const result = await fetchAvailableSlots("prov-1", "2024-01-20");

      expect(mockApi.get).toHaveBeenCalledWith("/api/appointments/availability", expect.any(Object));
      expect(result).toHaveLength(2);
    });
  });
});

describe("appointmentsApi data flow from clinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("receives appointment scheduled by clinic", async () => {
    const clinicScheduledAppointment = {
      items: [{
        id: "apt-clinic-1",
        scheduledStart: "2024-01-20T09:00:00Z",
        scheduledEnd: "2024-01-20T10:00:00Z",
        providerName: "Dr. Johnson",
        providerSpecialty: "Orthopedics",
        appointmentType: "Initial Evaluation",
        status: "Scheduled",
        notes: "Referred for knee pain evaluation",
      }],
    };
    mockApi.get.mockResolvedValueOnce(clinicScheduledAppointment);

    const result = await fetchAppointments({ upcoming: true });

    expect(result[0].providerName).toBe("Dr. Johnson");
    expect(result[0].appointmentType).toBe("Initial Evaluation");
  });

  it("patient cancellation notifies clinic", async () => {
    mockApi.post.mockResolvedValueOnce({});

    await cancelAppointment("apt-1", "Unable to attend");

    expect(mockApi.post).toHaveBeenCalledWith("/api/appointments/apt-1/cancel", {
      reason: "Unable to attend",
    });
  });
});
