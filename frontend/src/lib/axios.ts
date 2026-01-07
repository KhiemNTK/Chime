import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
import { use } from "react";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Set base URL based on environment
  withCredentials: true, // Enable sending cookies with requests to server
});

//add a request interceptor to include auth token if available
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState(); //get accessToken from store and doesn't subscribe to changes;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
//auto get refresh api when access token expired
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    //api does not need to check
    if (
      originalRequest.url.includes("/auth/refresh") ||
      originalRequest.url.includes("/auth/signin") ||
      originalRequest.url.includes("/auth/signup")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retryCount = originalRequest._retryCount || 0;
    if (error.response?.status === 403 && originalRequest._retryCount < 4) {
      originalRequest._retryCount += 1; //limit retries to 4 times

      try {
        const res = await api.post("/auth/refresh", { withCredentials: true });
        const newAccessToken = res.data.accessToken;

        useAuthStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest); //retry original request with new token
      } catch (refreshError) {
        useAuthStore.getState().clearState();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
