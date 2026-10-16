// Provide api client API calls through the shared HTTP client.
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

// Share the API base URL and default request settings across all epic clients.
export const apiClient = axios.create({
  baseURL: API_BASE_URL
});

// Set or remove the Bearer token used by subsequent API requests.
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

setAuthToken(localStorage.getItem("healthguard_token"));

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("healthguard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
