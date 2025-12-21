import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';

const api = axios.create({
    baseURL: 
        import.meta.env.VITE_API_URL, // Set base URL based on environment
        withCredentials: true, // Enable sending cookies with requests to server
})

//add a request interceptor to include auth token if available
api.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState() //get accessToken from store and doesn't subscribe to changes;
    if (accessToken) {
        config.headers.Authorization=`Bearer ${accessToken}`;
    }
    return config;
})

export default api;