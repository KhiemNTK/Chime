import axios from 'axios';

const api = axios.create({
    baseURL: 
        import.meta.env.VITE_API_URL, // Set base URL based on environment
        withCredentials: true, // Enable sending cookies with requests to server
})

export default api;