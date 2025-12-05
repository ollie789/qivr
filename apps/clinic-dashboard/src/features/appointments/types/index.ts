export type AppointmentStatus =
  | "requested"
  | "scheduled"
  | "confirmed"
  | "checked-in"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export type AppointmentType =
  | "initial"
  | "followup"
  | "treatment"
  | "assessment"
  | "review";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  providerId: string;
  providerName?: string;
  providerProfileId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  appointmentType: AppointmentType | string;
  status: AppointmentStatus | string;
  notes?: string;
  location?: string;
  locationType?: "in-person" | "virtual";
  locationDetails?: {
    address?: string;
    meetingUrl?: string;
  };
  reasonForVisit?: string;
  treatmentPlanId?: string;
  evaluationId?: string;
  promInstanceId?: string;
  cancellationReason?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  paymentAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionNotes {
  content: string;
  modalities: TreatmentModality[];
  painLevel: number;
  assignProm: boolean;
  promTemplateKey?: string;
}

export interface TreatmentModality {
  id: string;
  name: string;
  selected: boolean;
}

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  providerId?: string;
  status?: AppointmentStatus;
}
