import { getToken, removeToken } from './auth';
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api-testing.mothmerah.sa/',
    // baseURL: 'http://127.0.0.1:8000/',
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            removeToken();
            if (typeof window !== 'undefined') {
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;