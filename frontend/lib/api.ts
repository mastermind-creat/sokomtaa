import axios from 'axios';
import { useUIStore } from '@/store/uiStore';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

let requestCount = 0;

// Request interceptor
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('sokomtaa_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Only show global loader for mutations (non-GET requests)
        if (config.method && config.method.toUpperCase() !== 'GET') {
            requestCount++;
            useUIStore.getState().setIsGlobalLoading(true);
        }
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => {
        if (typeof window !== 'undefined') {
            if (response.config.method && response.config.method.toUpperCase() !== 'GET') {
                requestCount = Math.max(0, requestCount - 1);
                if (requestCount === 0) useUIStore.getState().setIsGlobalLoading(false);
            }
        }
        return response.data;
    },
    (error) => {
        if (typeof window !== 'undefined') {
            if (error.config?.method && error.config.method.toUpperCase() !== 'GET') {
                requestCount = Math.max(0, requestCount - 1);
                if (requestCount === 0) useUIStore.getState().setIsGlobalLoading(false);
            }
        }
        
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('sokomtaa_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

export default api;
