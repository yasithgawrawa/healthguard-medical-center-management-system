import { apiClient } from "./apiClient.js";

export const authApi = {
  registerPatient: async (payload) => {
    const { data } = await apiClient.post("/auth/register/patient", payload);
    return data.data;
  },
  login: async (payload) => {
    const { data } = await apiClient.post("/auth/login", payload);
    return data.data;
  },
  me: async () => {
    const { data } = await apiClient.get("/auth/me");
    return data.data.user;
  }
};
