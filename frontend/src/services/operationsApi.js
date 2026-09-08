import { apiClient } from "./apiClient.js";

export const operationsApi = {
  request: async (method, path, payload) => {
    const config = { method, url: path };
    if (payload && method !== "get") config.data = payload;
    const { data } = await apiClient(config);
    return data;
  }
};
