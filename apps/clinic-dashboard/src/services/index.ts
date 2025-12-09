// Re-export all API services for easy importing
// Note: Skipping analytics and dashboardApi due to duplicate DashboardStats export
// export * from './analyticsApi';
export * from "./appointmentsApi";
// export * from './dashboardApi';
export * from "./documentsApi";
export * from "./intakeApi";
export * from "./medicalRecordsApi";
export { messagesApi } from "./messagesApi";
export * from "./authApi";
export * from "./notificationsApi";
export * from "./patientApi";
export * from "./providerApi";
export * from "./messageTemplatesApi";
// Note: Skipping promApi due to duplicate PromResponse export
// export * from './promApi';
export * from "./proms";
export * from "./invitationApi";

// Export default instances
export {
  default as apiClient,
  handleApiError,
  isApiError,
} from "../lib/api-client";
export { default as dashboardApi } from "./dashboardApi";

// Centralized API object for convenience
import { analyticsApi } from "./analyticsApi";
import { appointmentsApi } from "./appointmentsApi";
import dashboardApi from "./dashboardApi";
import { documentsApi } from "./documentsApi";
import { intakeApi } from "./intakeApi";
import { medicalRecordsApi } from "./medicalRecordsApi";
import { messagesApi } from "./messagesApi";
import { notificationsApi } from "./notificationsApi";
import { patientApi } from "./patientApi";
import { providerApi } from "./providerApi";
import { messageTemplatesApi } from "./messageTemplatesApi";
import { promApi } from "./promApi";
import { promsApi } from "./proms";
import { authApi } from "./authApi";
import { invitationApi } from "./invitationApi";

const api = {
  analytics: analyticsApi,
  appointments: appointmentsApi,
  dashboard: dashboardApi,
  documents: documentsApi,
  intake: intakeApi,
  medicalRecords: medicalRecordsApi,
  messages: messagesApi,
  auth: authApi,
  notifications: notificationsApi,
  patients: patientApi,
  providers: providerApi,
  messageTemplates: messageTemplatesApi,
  prom: promApi,
  proms: promsApi,
  invitations: invitationApi,
};

export default api;
