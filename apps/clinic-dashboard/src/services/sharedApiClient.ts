import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
	if (user?.clinicId) {
		(config.headers as any)['X-Clinic-Id'] = user.clinicId;
	}
	return config;
});

export default apiClient;