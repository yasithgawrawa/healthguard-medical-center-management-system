// Provide auth API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

export const authApi = {
  // Send POST /auth/register/patient and return the response payload.
  registerPatient: async (payload) => {
    const { data } = await apiClient.post("/auth/register/patient", payload);
    return data.data;
  },
  // Send POST /auth/login and return the response payload.
  login: async (payload) => {
    const { data } = await apiClient.post("/auth/login", payload);
    return data.data;
  },
  // Send GET /auth/me and return the response payload.
  me: async () => {
    const { data } = await apiClient.get("/auth/me");
    return data.data.user;
  }
};
