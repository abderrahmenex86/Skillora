import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const apiClient = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthRequest = [
            '/auth/login',
            '/auth/register',
            '/auth/forgot-password',
            '/auth/reset-password',
            '/auth/logout',
            '/auth/refresh',
        ].some((path) => originalRequest.url?.includes(path));

        if (
            error.response?.status === 403 &&
            error.response?.data?.code === 'COMPANY_UNAVAILABLE'
        ) {
            useAuthStore.getState().logout();

            if (!window.location.pathname.startsWith('/auth')) {
                window.location.assign(
                    '/auth?mode=login&reason=company-unavailable'
                );
            }

            return Promise.reject(error);
        }

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthRequest
        ) {
            originalRequest._retry = true;
            try {
                const { data } = await axios.post(
                    '/api/v1/auth/refresh',
                    {},
                    { withCredentials: true }
                );
                useAuthStore.getState().setTokens(data.accessToken, data.user);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshErr) {
                useAuthStore.getState().logout();
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);
