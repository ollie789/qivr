import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
	baseURL: API_URL,
	headers: { 'Content-Type': 'application/json' },
	timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
	const authStorage = localStorage.getItem('clinic-auth-storage');
	if (authStorage) {
		const { state } = JSON.parse(authStorage);
		if (state?.token) {
			config.headers.Authorization = `Bearer ${state.token}`;
		}
	}
	return config;
});

export default apiClient;