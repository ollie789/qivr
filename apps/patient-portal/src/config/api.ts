// Centralized API configuration
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

export const API_CONFIG = {
  BASE_URL: API_URL,
  API_PREFIX: '/api',
  
  // Helper to build full API URLs
  url: (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Ensure path starts with 'api/'
    const fullPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;
    return `/${fullPath}`;
  }
};
