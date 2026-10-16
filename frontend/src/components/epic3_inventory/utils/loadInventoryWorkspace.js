const isList = Array.isArray;
const isAlerts = (value) => Array.isArray(value?.lowStock) && Array.isArray(value?.expiring);
const isReport = (value) => value !== null && typeof value === "object" && !Array.isArray(value) && Number.isFinite(value.totalSales);

// Inventory Workspace | Data Loading | Retry temporary read failures once without retrying authorization or validation failures.
const isTemporaryFailure = (error) => [408, 429, 502, 503, 504].includes(error.response?.status)
  || (!error.response && ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT", "ECONNRESET"].includes(error.code));

// Inventory Workspace | Data Loading | Describe the failed section without exposing raw HTML gateway responses or internal server details.
const failureMessage = (error) => {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status) return `The server returned HTTP ${error.response.status}.`;
  if (error.code === "ERR_NETWORK") return "Cannot reach the server. Check your connection and retry.";
  if (["ECONNABORTED", "ETIMEDOUT"].includes(error.code)) return "The request timed out. Please retry.";
  return error.message || "The request could not be completed.";
};

// Inventory Workspace | Data Loading | Load independent sections with at most three concurrent requests and retain successful responses when another section fails.
export const loadInventoryWorkspace = async (api, period) => {
  const sections = [
    // View Medicines | Data Loading | Load and verify the catalog response.
    ["medicines", "Medicine catalog", () => api.medicines(), isList],
    // View Suppliers | Data Loading | Load and verify the supplier directory.
    ["suppliers", "Suppliers", () => api.suppliers(), isList],
    // View Medicine Batches | Data Loading | Load and verify stock batches.
    ["batches", "Medicine batches", () => api.batches(), isList],
    // View Pharmacy Sales | Data Loading | Load and verify sale history.
    ["sales", "Pharmacy sales", () => api.sales(), isList],
    // View Medicine Purchases | Data Loading | Load and verify procurement history.
    ["purchases", "Medicine purchases", () => api.purchases(), isList],
    // View Medicine Returns | Data Loading | Load and verify return records.
    ["returns", "Medicine returns", () => api.returns(), isList],
    // View Inventory Alerts | Data Loading | Load and verify stock and expiry alert lists.
    ["alerts", "Stock and expiry alerts", () => api.alerts(), isAlerts],
    // View Pharmacy Sales Report | Data Loading | Load the report for the currently selected period.
    ["report", "Sales report", () => api.salesReport(period), isReport],
    // View Pharmacy Patients | Data Loading | Report patient lookup failures rather than silently replacing them with an empty list.
    ["patients", "Patient lookup", () => api.patients(), isList],
    // View Active Prescriptions | Data Loading | Report prescription lookup failures rather than silently replacing them with an empty list.
    ["prescriptions", "Active prescriptions", () => api.prescriptions(), isList]
  ];
  const data = {};
  const failures = [];
  let next = 0;

  // Inventory Workspace | Data Loading | A failed section does not cancel the other independent requests.
  const worker = async () => {
    while (next < sections.length) {
      const [key, label, load, validate] = sections[next++];
      try {
        let value;
        try {
          value = await load();
        } catch (error) {
          if (!isTemporaryFailure(error)) throw error;
          value = await load();
        }
        if (!validate(value)) throw new Error("The server returned an invalid response. Please retry.");
        data[key] = value;
      } catch (error) {
        failures.push({ key, label, message: failureMessage(error) });
      }
    }
  };

  await Promise.all(Array.from({ length: 3 }, () => worker()));
  return { data, failures };
};
