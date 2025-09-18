// Re-export all API services for easy importing
// Note: Skipping analytics and dashboardApi due to duplicate DashboardStats export
// export * from './analyticsApi';
export * from './appointmentsApi';
// export * from './dashboardApi';
export * from './documentsApi';
export * from './intakeApi';
export * from './medicalRecordsApi';
export * from './messagesApi';
export * from './notificationsApi';
export * from './patientApi';
// Note: Skipping promApi and promInstanceApi due to duplicate PromResponse export
// export * from './promApi';
// export * from './promInstanceApi';
export * from './proms';

// Export default instances
export { default as apiClient } from './sharedApiClient';
export { default as dashboardApi } from './dashboardApi';

// Centralized API object for convenience
import { analyticsApi } from './analyticsApi';
import { appointmentsApi } from './appointmentsApi';
import dashboardApi from './dashboardApi';
import { documentsApi } from './documentsApi';
import { intakeApi } from './intakeApi';
import { medicalRecordsApi } from './medicalRecordsApi';
import { messagesApi } from './messagesApi';
import { notificationsApi } from './notificationsApi';
import { patientApi } from './patientApi';
import { promApi } from './promApi';
import { promInstanceApi } from './promInstanceApi';
import { promsApi } from './proms';

const api = {
  analytics: analyticsApi,
  appointments: appointmentsApi,
  dashboard: dashboardApi,
  documents: documentsApi,
  intake: intakeApi,
  medicalRecords: medicalRecordsApi,
  messages: messagesApi,
  notifications: notificationsApi,
  patients: patientApi,
  prom: promApi,
  promInstance: promInstanceApi,
  proms: promsApi,
};

export default api;
