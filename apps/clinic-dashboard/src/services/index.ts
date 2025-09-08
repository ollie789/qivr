// Re-export API service instances and specific types
export { 
  analyticsApi,
  type DashboardStats as AnalyticsDashboardStats,
  type ProviderPerformance,
  type AppointmentTrend,
  type ConditionDistribution,
  type PromCompletionData,
  type ClinicAnalytics
} from './analyticsApi';
export { appointmentsApi } from './appointmentsApi';
export { documentsApi } from './documentsApi';
export { intakeApi } from './intakeApi';
export { medicalRecordsApi } from './medicalRecordsApi';
export { messagesApi } from './messagesApi';
export { notificationsApi } from './notificationsApi';
export { patientApi } from './patientApi';
export { 
  promApi,
  type PromResponse as PromApiResponse
} from './promApi';
export { 
  promInstanceApi,
  type PromResponse as PromInstanceResponse
} from './promInstanceApi';
export { promsApi } from './proms';

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
