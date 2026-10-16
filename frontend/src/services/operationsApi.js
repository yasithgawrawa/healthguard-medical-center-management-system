// Provide operations API calls through the shared HTTP client.
import { apiClient } from "./apiClient.js";

export const operationsApi = {
  // Send the configured HTTP request through the shared authenticated API client.
  request: async (method, path, payload) => {
    const config = { method, url: path };
    if (payload && method !== "get") config.data = payload;
    const { data } = await apiClient(config);
    return data;
  }
};
