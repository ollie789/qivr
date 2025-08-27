import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_ROOT_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_URL = API_ROOT_URL.replace(/\/+$/, '');

const apiClient = axios.create({
	baseURL: API_URL,
	headers: { 'Content-Type': 'application/json' },
	timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
	const { token, user } = useAuthStore.getState();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	// Add tenant ID header - use default if not available
	const tenantId = user?.clinicId || '11111111-1111-1111-1111-111111111111';
	(config.headers as any)['X-Tenant-Id'] = tenantId;
	(config.headers as any)['X-Clinic-Id'] = tenantId; // Keep for backward compatibility
	return config;
});

export default apiClient;