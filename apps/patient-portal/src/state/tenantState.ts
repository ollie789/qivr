const STORAGE_KEY = 'patient-active-tenant';

let currentTenantId: string | null = null;

export const getActiveTenantId = (): string | null => {
  if (typeof window === 'undefined') {
    return currentTenantId;
  }

  if (currentTenantId) {
    return currentTenantId;
  }

  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    currentTenantId = stored && stored.length > 0 ? stored : null;
  } catch {
    currentTenantId = null;
  }

  return currentTenantId;
};

export const setActiveTenantId = (tenantId: string | null) => {
  currentTenantId = tenantId ?? null;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (tenantId) {
      window.localStorage?.setItem(STORAGE_KEY, tenantId);
    } else {
      window.localStorage?.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export const clearActiveTenantId = () => {
  currentTenantId = null;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
};
