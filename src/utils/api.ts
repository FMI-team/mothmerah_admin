import { getToken } from './auth';
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api-testing.mothmerah.sa/',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;