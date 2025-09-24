export * from './prom';
export * from './documents';
export * from './medicalRecords';
export * from './analytics';
export * from './dashboard';
export * from './profile';

export interface ApiEnvelope<T> {
  data: T;
  success?: boolean;
  message?: string;
}
