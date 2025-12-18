import axios from 'axios';

const api = axios.create({
    baseURL: 
        import.meta.env.MODE === 'development' ? 'http://localhost:5001/api': '/api', // Set base URL based on environment
        withCredentials: true, // Enable sending cookies with requests
})

export default api;