import apiClient from "../lib/api-client";

interface CursorPaginationResponse<T> {
  items: T[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

interface AppointmentDto {
  id: string;
  patientId: string;
  patientName?: string | null;
  patientEmail?: string | null;
  patientPhone?: string | null;
  providerId: string;
  providerName?: string | null;
  appointmentType: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  notes?: string | null;
  location?: string | null;
  reasonForVisit?: string | null;
  insuranceVerified?: boolean;
  copayAmount?: number;
  followUpRequired?: boolean;
  createdAt: string;
  updatedAt: string;
  // Service type & pricing
  serviceTypeId?: string;
  serviceTypeName?: string;
  serviceTypePrice?: number;
  // Payment tracking
  isPaid?: boolean;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentNotes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  providerId: string;
  providerName: string;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType: string;
  status:
    | "requested"
    | "scheduled"
    | "confirmed"
    | "checked-in"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "no-show";
  notes?: string;
  location?: string;
  reasonForVisit?: string;
  insuranceVerified?: boolean;
  copayAmount?: number;
  followUpRequired?: boolean;
  // Service type & pricing
  serviceTypeId?: string;
  serviceTypeName?: string;
  serviceTypePrice?: number;
  // Payment tracking
  isPaid?: boolean;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType: string;
  serviceTypeId?: string;
  reasonForVisit?: string;
  notes?: string;
  location?: string;
  sendReminder?: boolean;
}

export interface UpdateAppointmentRequest {
  scheduledStart?: string;
  scheduledEnd?: string;
  status?: Appointment["status"];
  actualStart?: string;
  actualEnd?: string;
  notes?: string;
}

export interface AppointmentSlot {
  start: string;
  end: string;
  available: boolean;
  providerId: string;
}

// Map backend PascalCase status to frontend kebab-case
const mapStatus = (status: string): Appointment["status"] => {
  const statusMap: Record<string, Appointment["status"]> = {
    requested: "requested",
    scheduled: "scheduled",
    confirmed: "confirmed",
    checkedin: "checked-in",
    inprogress: "in-progress",
    completed: "completed",
    cancelled: "cancelled",
    noshow: "no-show",
  };
  return statusMap[(status || "").toLowerCase()] || "scheduled";
};

// Map frontend kebab-case status to backend PascalCase
const mapStatusToBackend = (status: string): string => {
  const statusMap: Record<string, string> = {
    requested: "Requested",
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    "checked-in": "CheckedIn",
    "in-progress": "InProgress",
    completed: "Completed",
    cancelled: "Cancelled",
    "no-show": "NoShow",
  };
  return statusMap[status] || status;
};

const mapAppointment = (dto: AppointmentDto): Appointment => ({
  id: dto.id,
  patientId: dto.patientId,
  patientName: dto.patientName ?? "Unknown patient",
  patientEmail: dto.patientEmail ?? "",
  patientPhone: dto.patientPhone ?? "",
  providerId: dto.providerId,
  providerName: dto.providerName ?? "Assigned provider",
  scheduledStart: dto.scheduledStart,
  scheduledEnd: dto.scheduledEnd,
  appointmentType: dto.appointmentType,
  status: mapStatus(dto.status),
  notes: dto.notes ?? undefined,
  location: dto.location ?? undefined,
  reasonForVisit: dto.reasonForVisit ?? undefined,
  insuranceVerified: dto.insuranceVerified,
  copayAmount: dto.copayAmount,
  followUpRequired: dto.followUpRequired,
  // Service type & pricing
  serviceTypeId: dto.serviceTypeId,
  serviceTypeName: dto.serviceTypeName,
  serviceTypePrice: dto.serviceTypePrice,
  // Payment tracking
  isPaid: dto.isPaid,
  paidAt: dto.paidAt,
  paymentMethod: dto.paymentMethod,
  paymentReference: dto.paymentReference,
  paymentAmount: dto.paymentAmount,
  paymentNotes: dto.paymentNotes,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

export interface RecordPaymentRequest {
  paymentMethod: string;
  paymentAmount: number;
  paymentReference?: string;
  paymentNotes?: string;
}

class AppointmentsApi {
  async getAppointments(params?: {
    startDate?: string;
    endDate?: string;
    patientId?: string;
    providerId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
    sortDescending?: boolean;
  }): Promise<{
    items: Appointment[];
    nextCursor?: string | null;
    hasNext: boolean;
  }> {
    const payload = await apiClient.get<
      CursorPaginationResponse<AppointmentDto> | AppointmentDto[]
    >("/api/appointments", params as Record<string, string | number | boolean | undefined>);

    // Handle both PascalCase and camelCase responses
    interface PascalCaseCursorResponse {
      Items?: AppointmentDto[];
      NextCursor?: string | null;
      HasNext?: boolean;
    }

    const items = Array.isArray(payload)
      ? payload
      : (payload?.items ?? (payload as PascalCaseCursorResponse)?.Items ?? []);

    return {
      items: (items as AppointmentDto[]).map(mapAppointment),
      nextCursor: Array.isArray(payload)
        ? undefined
        : (payload?.nextCursor ?? (payload as PascalCaseCursorResponse)?.NextCursor),
      hasNext: Array.isArray(payload)
        ? false
        : Boolean(payload?.hasNext ?? (payload as PascalCaseCursorResponse)?.HasNext),
    };
  }

  async getAppointment(id: string): Promise<Appointment> {
    const response = await apiClient.get<AppointmentDto>(
      `/api/appointments/${id}`,
    );
    return mapAppointment(response);
  }

  async createAppointment(
    data: CreateAppointmentRequest,
  ): Promise<Appointment> {
    const response = await apiClient.post<AppointmentDto>(
      "/api/appointments",
      data,
    );
    return mapAppointment(response);
  }

  async updateAppointment(
    id: string,
    data: UpdateAppointmentRequest,
  ): Promise<Appointment> {
    // Map status to backend format if provided
    const payload = data.status
      ? { ...data, status: mapStatusToBackend(data.status) }
      : data;
    const response = await apiClient.put<AppointmentDto>(
      `/api/appointments/${id}`,
      payload,
    );
    return mapAppointment(response);
  }

  async cancelAppointment(id: string, reason?: string) {
    return apiClient.post(`/api/appointments/${id}/cancel`, { reason });
  }

  async confirmAppointment(id: string) {
    return apiClient.post(`/api/appointments/${id}/confirm`);
  }

  async startAppointment(id: string): Promise<Appointment> {
    return this.updateAppointment(id, { status: "in-progress" });
  }

  async rescheduleAppointment(
    id: string,
    data: {
      scheduledStart: string;
      scheduledEnd: string;
      reason?: string;
    },
  ) {
    // Map to backend expected field names (PascalCase)
    return apiClient.post(`/api/appointments/${id}/reschedule`, {
      NewStartTime: data.scheduledStart,
      NewEndTime: data.scheduledEnd,
      Reason: data.reason,
    });
  }

  async markAsNoShow(id: string) {
    return apiClient.post(`/api/appointments/${id}/no-show`);
  }

  async completeAppointment(
    id: string,
    data?: {
      notes?: string;
      followUpRequired?: boolean;
      followUpDate?: string;
    },
  ) {
    return apiClient.post(`/api/appointments/${id}/complete`, data ?? {});
  }

  async getAvailableSlots(params: {
    providerId: string;
    date: string;
    duration: number;
  }): Promise<AppointmentSlot[]> {
    return apiClient.get("/api/appointments/availability", params);
  }

  async sendReminder(id: string) {
    return apiClient.post(`/api/appointments/${id}/send-reminder`);
  }

  async getUpcoming(days: number = 7) {
    return apiClient.get("/api/appointments/upcoming", { days });
  }

  async getWaitlist() {
    return apiClient.get("/api/appointments/waitlist");
  }

  async addToWaitlist(data: {
    patientId: string;
    providerId?: string;
    preferredDates?: string[];
    appointmentType: string;
    notes?: string;
  }) {
    return apiClient.post("/api/appointments/waitlist", data);
  }

  async deleteAppointment(id: string): Promise<void> {
    return apiClient.delete(`/api/appointments/${id}`);
  }

  async recordPayment(
    id: string,
    data: RecordPaymentRequest,
  ): Promise<Appointment> {
    const response = await apiClient.post<AppointmentDto>(
      `/api/appointments/${id}/payment`,
      data,
    );
    return mapAppointment(response);
  }

  async getPaymentSummary(params?: {
    startDate?: string;
    endDate?: string;
    providerId?: string;
  }): Promise<{
    totalRevenue: number;
    totalAppointments: number;
    paidAppointments: number;
    unpaidAppointments: number;
    totalOutstanding: number;
    byPaymentMethod: Record<string, number>;
    byServiceType: Array<{
      serviceType: string;
      revenue: number;
      count: number;
    }>;
    startDate: string;
    endDate: string;
  }> {
    return apiClient.get("/api/appointments/payment-summary", params);
  }
}

export const appointmentsApi = new AppointmentsApi();
