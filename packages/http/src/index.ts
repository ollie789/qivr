import { v4 as uuidv4 } from 'uuid';

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;
  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

export type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;        // JSON serialised when provided
  clinicId?: string;     // adds X-Clinic-Id
  tenantId?: string;     // adds X-Tenant-Id
  signal?: AbortSignal;
  timeoutMs?: number;    // default 15000
  baseUrl?: string;      // default from global/env
  credentials?: RequestCredentials; // e.g. 'include'
  token?: string;        // adds Authorization header
};

const DEFAULT_TIMEOUT = 15000;

function base(): string {
  // Order: window flag -> Vite env -> empty (relative)
  // @ts-ignore
  const b = (typeof window !== 'undefined' && (window as any).__QIVR_API__) || import.meta?.env?.VITE_API_URL || '';
  return typeof b === 'string' ? b : '';
}

function buildUrl(path: string, baseUrl?: string): string {
  const b = baseUrl ?? base();
  return path.startsWith('http') ? path : `${b}${path}`;
}

export async function http<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT);
  const rid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : uuidv4();

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.clinicId) headers['X-Clinic-Id'] = opts.clinicId;
  if (opts.tenantId) headers['X-Tenant-Id'] = opts.tenantId;
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  headers['X-Request-ID'] = rid;
  Object.assign(headers, opts.headers);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.baseUrl), {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal ?? controller.signal,
      credentials: opts.credentials ?? 'include', // Default to 'include' for cookie support
    });
  } catch (err: any) {
    clearTimeout(timeout);
    throw new ApiError(err?.message || 'Network error', 0);
  }
  clearTimeout(timeout);

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');

  if (!res.ok) {
    if (isJson) {
      const problem = (await res.json()) as ProblemDetails;
      throw new ApiError(problem.title || problem.detail || 'Request failed', res.status, problem);
    }
    throw new ApiError(res.statusText || 'Request failed', res.status);
  }

  // Handle empty responses (204 No Content, etc)
  if (res.status === 204 || ct === '') {
    return undefined as unknown as T;
  }

  return (isJson ? await res.json() : (await res.text() as any)) as T;
}

export const getJson = <T>(path: string, opts: Omit<FetchOptions, 'method'> = {}) => 
  http<T>(path, { ...opts, method: 'GET' });

export const postJson = <T>(path: string, body: unknown, opts: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  http<T>(path, { ...opts, method: 'POST', body });

export const putJson = <T>(path: string, body: unknown, opts: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  http<T>(path, { ...opts, method: 'PUT', body });

export const patchJson = <T>(path: string, body: unknown, opts: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  http<T>(path, { ...opts, method: 'PATCH', body });

export const del = <T>(path: string, opts: Omit<FetchOptions, 'method'> = {}) => 
  http<T>(path, { ...opts, method: 'DELETE' });

export async function httpWithRetry<T>(path: string, opts: FetchOptions = {}, cfg: { retries?: number; backoffMs?: number } = {}) {
  const { retries = 2, backoffMs = 300 } = cfg;
  let last: any;
  for (let i = 0; i <= retries; i++) {
    try { 
      return await http<T>(path, opts); 
    } catch (e: any) {
      const status = e?.status ?? 0;
      const transient = status === 0 || status === 502 || status === 503 || status === 504;
      if (!transient || i === retries) throw e;
      await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
      last = e;
    }
  }
  throw last;
}

// Helper to get auth token from localStorage (common pattern in the app)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const authStorage = localStorage.getItem('clinic-auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      return state?.token || null;
    }
  } catch (e) {
    console.warn('Failed to get auth token from localStorage:', e);
  }
  return null;
}

// Helper to get clinic ID from localStorage
export function getClinicId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const authStorage = localStorage.getItem('clinic-auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      return state?.user?.clinicId || null;
    }
  } catch (e) {
    console.warn('Failed to get clinic ID from localStorage:', e);
  }
  return null;
}

export function getTenantId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const authStorage = localStorage.getItem('clinic-auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      return state?.activeTenantId || state?.user?.tenantId || null;
    }
    const patientTenant = localStorage.getItem('patient-active-tenant');
    if (patientTenant && patientTenant.length > 0) {
      return patientTenant;
    }
  } catch (e) {
    console.warn('Failed to get tenant ID from localStorage:', e);
  }
  return null;
}

// Convenience wrapper with auth
export async function httpWithAuth<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const token = getAuthToken();
  const clinicId = getClinicId();
  const tenantId = getTenantId();
  
  return http<T>(path, {
    ...opts,
    token: token || opts.token,
    clinicId: clinicId || opts.clinicId,
    tenantId: tenantId || opts.tenantId
  });
}

export const getWithAuth = <T>(path: string, opts: Omit<FetchOptions, 'method'> = {}) => 
  httpWithAuth<T>(path, { ...opts, method: 'GET' });

export const postWithAuth = <T>(path: string, body: unknown, opts: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  httpWithAuth<T>(path, { ...opts, method: 'POST', body });

export const putWithAuth = <T>(path: string, body: unknown, opts: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  httpWithAuth<T>(path, { ...opts, method: 'PUT', body });

export const patchWithAuth = <T>(path: string, body: unknown, opts: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  httpWithAuth<T>(path, { ...opts, method: 'PATCH', body });

export const delWithAuth = <T>(path: string, opts: Omit<FetchOptions, 'method'> = {}) => 
  httpWithAuth<T>(path, { ...opts, method: 'DELETE' });

// Upload with progress support (using XMLHttpRequest for progress events)
export interface UploadOptions {
  headers?: Record<string, string>;
  onUploadProgress?: (percent: number, loaded: number, total: number) => void;
  token?: string;
  clinicId?: string;
  tenantId?: string;
}

// HttpError export for compatibility
export class HttpError extends ApiError {
  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message, status, problem);
    this.name = 'HttpError';
  }
}

// HttpClient interface for structured API usage
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpRequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
}

export interface HttpClient {
  request<T = any>(options: HttpRequestOptions): Promise<T>;
}

export function createHttpClient(config: HttpClientConfig = {}): HttpClient {
  return {
    async request<T = any>(options: HttpRequestOptions): Promise<T> {
      const url = new URL(buildUrl(options.url, config.baseURL));
      
      // Add query params if provided
      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      // Merge headers
      const headers = {
        ...config.headers,
        ...options.headers
      };
      
      // Use the existing http function
      return http<T>(url.toString(), {
        method: options.method,
        body: options.data,
        headers,
        timeoutMs: config.timeout,
        baseUrl: '', // URL is already complete
        credentials: 'include' // Always include credentials for cookie support
      });
    }
  };
}

export function uploadWithProgress(
  path: string,
  formData: FormData,
  options: UploadOptions = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = buildUrl(path);
    
    xhr.open('POST', url, true);
    
    // Set headers
    const token = options.token || getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    const clinicId = options.clinicId || getClinicId();
    if (clinicId) {
      xhr.setRequestHeader('X-Clinic-Id', clinicId);
    }

    const tenantId = options.tenantId || getTenantId();
    if (tenantId) {
      xhr.setRequestHeader('X-Tenant-Id', tenantId);
    }
    
    const rid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : uuidv4();
    xhr.setRequestHeader('X-Request-ID', rid);
    
    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') { // Let browser set content-type for FormData
          xhr.setRequestHeader(key, value);
        }
      });
    }
    
    // Upload progress
    if (options.onUploadProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          options.onUploadProgress!(percent, e.loaded, e.total);
        }
      };
    }
    
    // Handle response
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        let error: ApiError;
        try {
          const problem = JSON.parse(xhr.responseText);
          error = new ApiError(
            problem.title || problem.detail || 'Upload failed',
            xhr.status,
            problem
          );
        } catch {
          error = new ApiError(`Upload failed: ${xhr.status} ${xhr.statusText}`, xhr.status);
        }
        reject(error);
      }
    };
    
    xhr.onerror = () => {
      reject(new ApiError('Network error during upload', 0));
    };
    
    xhr.send(formData);
  });
}
