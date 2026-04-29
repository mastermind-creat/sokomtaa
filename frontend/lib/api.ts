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
        
        // Only show global loader for mutations or non-GET requests if desired, 
        // or for all to satisfy "all click functions" requirement. 
        // For now, let's track all requests.
        requestCount++;
        useUIStore.getState().setIsGlobalLoading(true);
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => {
        if (typeof window !== 'undefined') {
            requestCount = Math.max(0, requestCount - 1);
            if (requestCount === 0) useUIStore.getState().setIsGlobalLoading(false);
        }
        return response.data;
    },
    (error) => {
        if (typeof window !== 'undefined') {
            requestCount = Math.max(0, requestCount - 1);
            if (requestCount === 0) useUIStore.getState().setIsGlobalLoading(false);
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
