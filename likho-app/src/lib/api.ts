import axios from "axios";
import { useAuthStore } from "@/store/authStore";

// Use relative path when not set (Docker: nginx proxies /api/ to backend)
const BASE_URL = import.meta.env.VITE_API_BASE ?? "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear both localStorage and Zustand store so the user is fully signed out
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      useAuthStore.getState().reset();
    }
    return Promise.reject(error);
  }
);
