import { getSession } from 'next-auth/react';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Adding authorization header to axios instance if session exists
axiosInstance.interceptors.request.use(async (config) => {
  const session = await getSession();
  console.log(session, 'axios');
  const authToken = session?.authToken;
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use((response) =>
  response.data.data ? response.data.data : response.data,
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject({
      status: error.response?.status,
      data: error.response?.data || error.message,
    });
  },
);

export default axiosInstance;
