// Centralized API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://clinic.qivr.pro',
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
