import apiClient from '../lib/api-client';

type ISODateString = string;

export interface PeriodDto {
  from: ISODateString;
  to: ISODateString;
}

export interface AppointmentMetrics {
  totalScheduled: number;
  completed: number;
  noShows: number;
  cancelled: number;
  averageWaitTime: number;
  averageDuration: number;
  utilizationRate: number;
}

export interface PatientMetrics {
  newPatients: number;
  returningPatients: number;
  averageVisitsPerPatient: number;
  patientRetentionRate: number;
  patientSatisfactionScore: number;
}

export interface PromMetrics {
  totalSent: number;
  completed: number;
  completionRate: number;
  averageScore: number;
  highRiskPatients: number;
}

export interface RevenueMetrics {
  totalBilled: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionRate: number;
  averageRevenuePerPatient: number;
}

export interface DiagnosisCount {
  code: string;
  description: string;
  count: number;
}

export interface ProcedureCount {
  code: string;
  description: string;
  count: number;
}

export interface AppointmentTrend {
  date: ISODateString;
  appointments: number;
  completed: number;
  cancellations: number;
  noShows: number;
  newPatients: number;
}

export interface PromCompletionBreakdown {
  templateName: string;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface ProviderPerformance {
  providerId: string;
  providerName: string;
  patients: number;
  appointmentsCompleted: number;
  noShowRate: number;
  revenue: number;
  satisfaction: number;
  averageWaitTime: number;
}

export interface ClinicAnalytics {
  period: PeriodDto;
  appointmentMetrics: AppointmentMetrics;
  patientMetrics: PatientMetrics;
  promMetrics: PromMetrics;
  revenueMetrics: RevenueMetrics;
  topDiagnoses: DiagnosisCount[];
  topProcedures: ProcedureCount[];
  appointmentTrends: AppointmentTrend[];
  promCompletionBreakdown: PromCompletionBreakdown[];
  providerPerformance: ProviderPerformance[];
}

export interface DashboardStats {
  todayAppointments: number;
  pendingIntakes: number;
  activePatients: number;
  completedToday: number;
  averageWaitTime: number;
  patientSatisfaction: number;
}

type Maybe<T> = T | null | undefined;

type PeriodDto = {
  from?: Maybe<string>;
  to?: Maybe<string>;
  From?: Maybe<string>;
  To?: Maybe<string>;
};

type AppointmentMetricsDto = {
  totalScheduled?: Maybe<number>;
  completed?: Maybe<number>;
  noShows?: Maybe<number>;
  cancelled?: Maybe<number>;
  averageWaitTime?: Maybe<number>;
  averageDuration?: Maybe<number>;
  utilizationRate?: Maybe<number>;
  TotalScheduled?: Maybe<number>;
  Completed?: Maybe<number>;
  NoShows?: Maybe<number>;
  Cancelled?: Maybe<number>;
  AverageWaitTime?: Maybe<number>;
  AverageDuration?: Maybe<number>;
  UtilizationRate?: Maybe<number>;
};

type PatientMetricsDto = {
  newPatients?: Maybe<number>;
  returningPatients?: Maybe<number>;
  averageVisitsPerPatient?: Maybe<number>;
  patientRetentionRate?: Maybe<number>;
  patientSatisfactionScore?: Maybe<number>;
  NewPatients?: Maybe<number>;
  ReturningPatients?: Maybe<number>;
  AverageVisitsPerPatient?: Maybe<number>;
  PatientRetentionRate?: Maybe<number>;
  PatientSatisfactionScore?: Maybe<number>;
};

type PromMetricsDto = {
  totalSent?: Maybe<number>;
  completed?: Maybe<number>;
  completionRate?: Maybe<number>;
  averageScore?: Maybe<number>;
  highRiskPatients?: Maybe<number>;
  TotalSent?: Maybe<number>;
  Completed?: Maybe<number>;
  CompletionRate?: Maybe<number>;
  AverageScore?: Maybe<number>;
  HighRiskPatients?: Maybe<number>;
};

type RevenueMetricsDto = {
  totalBilled?: Maybe<number>;
  totalCollected?: Maybe<number>;
  outstandingBalance?: Maybe<number>;
  collectionRate?: Maybe<number>;
  averageRevenuePerPatient?: Maybe<number>;
  TotalBilled?: Maybe<number>;
  TotalCollected?: Maybe<number>;
  OutstandingBalance?: Maybe<number>;
  CollectionRate?: Maybe<number>;
  AverageRevenuePerPatient?: Maybe<number>;
};

type DiagnosisCountDto = {
  code?: Maybe<string>;
  description?: Maybe<string>;
  count?: Maybe<number>;
  Code?: Maybe<string>;
  Description?: Maybe<string>;
  Count?: Maybe<number>;
};

type ProcedureCountDto = DiagnosisCountDto;

type AppointmentTrendDto = {
  date?: Maybe<string>;
  Date?: Maybe<string>;
  appointments?: Maybe<number>;
  Appointments?: Maybe<number>;
  completed?: Maybe<number>;
  Completed?: Maybe<number>;
  cancellations?: Maybe<number>;
  Cancellations?: Maybe<number>;
  noShows?: Maybe<number>;
  NoShows?: Maybe<number>;
  newPatients?: Maybe<number>;
  NewPatients?: Maybe<number>;
};

type PromCompletionBreakdownDto = {
  templateName?: Maybe<string>;
  TemplateName?: Maybe<string>;
  completed?: Maybe<number>;
  Completed?: Maybe<number>;
  pending?: Maybe<number>;
  Pending?: Maybe<number>;
  completionRate?: Maybe<number>;
  CompletionRate?: Maybe<number>;
};

type ProviderPerformanceDto = {
  providerId?: Maybe<string>;
  ProviderId?: Maybe<string>;
  providerName?: Maybe<string>;
  ProviderName?: Maybe<string>;
  patients?: Maybe<number>;
  Patients?: Maybe<number>;
  appointmentsCompleted?: Maybe<number>;
  AppointmentsCompleted?: Maybe<number>;
  noShowRate?: Maybe<number>;
  NoShowRate?: Maybe<number>;
  revenue?: Maybe<number>;
  Revenue?: Maybe<number>;
  satisfaction?: Maybe<number>;
  Satisfaction?: Maybe<number>;
  averageWaitTime?: Maybe<number>;
  AverageWaitTime?: Maybe<number>;
};

type ClinicAnalyticsResponse = {
  period: PeriodDto;
  appointmentMetrics: AppointmentMetricsDto;
  patientMetrics: PatientMetricsDto;
  promMetrics: PromMetricsDto;
  revenueMetrics: RevenueMetricsDto;
  topDiagnoses: DiagnosisCountDto[];
  topProcedures: ProcedureCountDto[];
  appointmentTrends: AppointmentTrendDto[];
  promCompletionBreakdown: PromCompletionBreakdownDto[];
  providerPerformance: ProviderPerformanceDto[];
} | {
  Period: PeriodDto;
  AppointmentMetrics: AppointmentMetricsDto;
  PatientMetrics: PatientMetricsDto;
  PromMetrics: PromMetricsDto;
  RevenueMetrics: RevenueMetricsDto;
  TopDiagnoses: DiagnosisCountDto[];
  TopProcedures: ProcedureCountDto[];
  AppointmentTrends: AppointmentTrendDto[];
  PromCompletionBreakdown: PromCompletionBreakdownDto[];
  ProviderPerformance: ProviderPerformanceDto[];
};

const toNumber = (value: Maybe<number>): number => (value ?? 0);

const toDecimal = (value: Maybe<number>): number =>
  typeof value === 'number' ? Number(value) : Number(value ?? 0);

const toString = (value: Maybe<string>, fallback = ''): string =>
  value != null ? String(value) : fallback;

const normalizePeriod = (dto: PeriodDto): { from: ISODateString; to: ISODateString } => ({
  from: new Date(dto.from ?? dto.From ?? new Date().toISOString()).toISOString(),
  to: new Date(dto.to ?? dto.To ?? new Date().toISOString()).toISOString(),
});

const mapAppointmentMetrics = (dto: AppointmentMetricsDto): AppointmentMetrics => ({
  totalScheduled: toNumber(dto.totalScheduled ?? dto.TotalScheduled),
  completed: toNumber(dto.completed ?? dto.Completed),
  noShows: toNumber(dto.noShows ?? dto.NoShows),
  cancelled: toNumber(dto.cancelled ?? dto.Cancelled),
  averageWaitTime: toNumber(dto.averageWaitTime ?? dto.AverageWaitTime),
  averageDuration: toNumber(dto.averageDuration ?? dto.AverageDuration),
  utilizationRate: toDecimal(dto.utilizationRate ?? dto.UtilizationRate),
});

const mapPatientMetrics = (dto: PatientMetricsDto): PatientMetrics => ({
  newPatients: toNumber(dto.newPatients ?? dto.NewPatients),
  returningPatients: toNumber(dto.returningPatients ?? dto.ReturningPatients),
  averageVisitsPerPatient: toDecimal(dto.averageVisitsPerPatient ?? dto.AverageVisitsPerPatient),
  patientRetentionRate: toDecimal(dto.patientRetentionRate ?? dto.PatientRetentionRate),
  patientSatisfactionScore: toDecimal(dto.patientSatisfactionScore ?? dto.PatientSatisfactionScore),
});

const mapPromMetrics = (dto: PromMetricsDto): PromMetrics => ({
  totalSent: toNumber(dto.totalSent ?? dto.TotalSent),
  completed: toNumber(dto.completed ?? dto.Completed),
  completionRate: toDecimal(dto.completionRate ?? dto.CompletionRate),
  averageScore: toDecimal(dto.averageScore ?? dto.AverageScore),
  highRiskPatients: toNumber(dto.highRiskPatients ?? dto.HighRiskPatients),
});

const mapRevenueMetrics = (dto: RevenueMetricsDto): RevenueMetrics => ({
  totalBilled: toDecimal(dto.totalBilled ?? dto.TotalBilled),
  totalCollected: toDecimal(dto.totalCollected ?? dto.TotalCollected),
  outstandingBalance: toDecimal(dto.outstandingBalance ?? dto.OutstandingBalance),
  collectionRate: toDecimal(dto.collectionRate ?? dto.CollectionRate),
  averageRevenuePerPatient: toDecimal(dto.averageRevenuePerPatient ?? dto.AverageRevenuePerPatient),
});

const mapDiagnosis = (dto: DiagnosisCountDto): DiagnosisCount => ({
  code: toString(dto.code ?? dto.Code),
  description: toString(dto.description ?? dto.Description),
  count: toNumber(dto.count ?? dto.Count),
});

const mapProcedure = (dto: ProcedureCountDto): ProcedureCount => ({
  code: toString(dto.code ?? dto.Code),
  description: toString(dto.description ?? dto.Description),
  count: toNumber(dto.count ?? dto.Count),
});

const mapTrend = (dto: AppointmentTrendDto): AppointmentTrend => ({
  date: new Date(dto.date ?? dto.Date ?? new Date().toISOString()).toISOString(),
  appointments: toNumber(dto.appointments ?? dto.Appointments),
  completed: toNumber(dto.completed ?? dto.Completed),
  cancellations: toNumber(dto.cancellations ?? dto.Cancellations),
  noShows: toNumber(dto.noShows ?? dto.NoShows),
  newPatients: toNumber(dto.newPatients ?? dto.NewPatients),
});

const mapPromBreakdown = (dto: PromCompletionBreakdownDto): PromCompletionBreakdown => ({
  templateName: toString(dto.templateName ?? dto.TemplateName),
  completed: toNumber(dto.completed ?? dto.Completed),
  pending: toNumber(dto.pending ?? dto.Pending),
  completionRate: toDecimal(dto.completionRate ?? dto.CompletionRate),
});

const mapProviderPerformance = (dto: ProviderPerformanceDto): ProviderPerformance => ({
  providerId: toString(dto.providerId ?? dto.ProviderId),
  providerName: toString(dto.providerName ?? dto.ProviderName),
  patients: toNumber(dto.patients ?? dto.Patients),
  appointmentsCompleted: toNumber(dto.appointmentsCompleted ?? dto.AppointmentsCompleted),
  noShowRate: toDecimal(dto.noShowRate ?? dto.NoShowRate),
  revenue: toDecimal(dto.revenue ?? dto.Revenue),
  satisfaction: toDecimal(dto.satisfaction ?? dto.Satisfaction),
  averageWaitTime: toDecimal(dto.averageWaitTime ?? dto.AverageWaitTime),
});

const mapClinicAnalytics = (raw: ClinicAnalyticsResponse): ClinicAnalytics => {
  const periodDto = ('Period' in raw ? raw.Period : raw.period) ?? {};
  const appointmentMetricsDto = ('AppointmentMetrics' in raw ? raw.AppointmentMetrics : raw.appointmentMetrics) ?? {};
  const patientMetricsDto = ('PatientMetrics' in raw ? raw.PatientMetrics : raw.patientMetrics) ?? {};
  const promMetricsDto = ('PromMetrics' in raw ? raw.PromMetrics : raw.promMetrics) ?? {};
  const revenueMetricsDto = ('RevenueMetrics' in raw ? raw.RevenueMetrics : raw.revenueMetrics) ?? {};
  const topDiagnosesDto = ('TopDiagnoses' in raw ? raw.TopDiagnoses : raw.topDiagnoses) ?? [];
  const topProceduresDto = ('TopProcedures' in raw ? raw.TopProcedures : raw.topProcedures) ?? [];
  const appointmentTrendsDto = ('AppointmentTrends' in raw ? raw.AppointmentTrends : raw.appointmentTrends) ?? [];
  const promBreakdownDto = ('PromCompletionBreakdown' in raw ? raw.PromCompletionBreakdown : raw.promCompletionBreakdown) ?? [];
  const providerPerformanceDto = ('ProviderPerformance' in raw ? raw.ProviderPerformance : raw.providerPerformance) ?? [];

  return {
    period: normalizePeriod(periodDto),
    appointmentMetrics: mapAppointmentMetrics(appointmentMetricsDto),
    patientMetrics: mapPatientMetrics(patientMetricsDto),
    promMetrics: mapPromMetrics(promMetricsDto),
    revenueMetrics: mapRevenueMetrics(revenueMetricsDto),
    topDiagnoses: topDiagnosesDto.map(mapDiagnosis),
    topProcedures: topProceduresDto.map(mapProcedure),
    appointmentTrends: appointmentTrendsDto.map(mapTrend),
    promCompletionBreakdown: promBreakdownDto.map(mapPromBreakdown),
    providerPerformance: providerPerformanceDto.map(mapProviderPerformance),
  };
};

const buildSearchParams = (params?: { from?: Date; to?: Date }) => {
  const search = new URLSearchParams();
  if (params?.from) {
    search.set('from', params.from.toISOString());
  }
  if (params?.to) {
    search.set('to', params.to.toISOString());
  }
  return search;
};

const getClinicAnalytics = async (
  clinicId: string,
  params?: { from?: Date; to?: Date }
): Promise<ClinicAnalytics> => {
  const search = buildSearchParams(params);
  const query = search.toString();
  const url = `/api/clinic-management/clinics/${clinicId}/analytics${query ? `?${query}` : ''}`;
  const response = await apiClient.get<ClinicAnalyticsResponse | { data: ClinicAnalyticsResponse }>(url);
  const payload = unwrap(response);
  return mapClinicAnalytics(payload);
};

const analyticsApi = {
  getClinicAnalytics,
};

export { analyticsApi };
export default analyticsApi;
