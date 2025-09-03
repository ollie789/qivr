/**
 * API service for patient portal
 * Re-exports the auth-aware API client for backward compatibility
 */

export { default as api } from '../lib/api-client';
export * from '../lib/api-client';
