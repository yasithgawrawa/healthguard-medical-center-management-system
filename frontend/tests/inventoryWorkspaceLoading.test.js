import { test } from "node:test";
import assert from "node:assert/strict";
import { loadInventoryWorkspace } from "../src/components/epic3_inventory/utils/loadInventoryWorkspace.js";

const workingApi = () => ({
  medicines: async () => [{ _id: "medicine-id" }],
  suppliers: async () => [], batches: async () => [], sales: async () => [],
  purchases: async () => [], returns: async () => [],
  alerts: async () => ({ lowStock: [], expiring: [] }),
  salesReport: async () => ({ totalSales: 0, totalRevenue: 0, topMedicines: [] }),
  patients: async () => [], prescriptions: async () => []
});

// Inventory Workspace | Tests | Verify that one failed read no longer discards all successful workspace responses.
test("retains successful sections and identifies a failed report", async () => {
  const api = workingApi();
  api.salesReport = async () => { throw { response: { status: 500, data: { message: "Report unavailable" } } }; };

  const { data, failures } = await loadInventoryWorkspace(api, "month");

  assert.deepEqual(data.medicines, [{ _id: "medicine-id" }]);
  assert.deepEqual(data.suppliers, []);
  assert.deepEqual(data.alerts, { lowStock: [], expiring: [] });
  assert.equal(Object.keys(data).length, 9);
  assert.equal(Object.hasOwn(data, "report"), false);
  assert.deepEqual(failures, [{ key: "report", label: "Sales report", message: "Report unavailable" }]);
});

// Inventory Workspace | Tests | Temporary network and gateway failures may recover after one read-only retry.
test("retries a temporary network failure once and returns the selected report period", async () => {
  const api = workingApi();
  let attempts = 0;
  api.medicines = async () => {
    if (++attempts === 1) throw { code: "ERR_NETWORK" };
    return [{ _id: "recovered" }];
  };
  api.salesReport = async (period) => ({ totalSales: 2, period });

  const { data, failures } = await loadInventoryWorkspace(api, "week");

  assert.equal(attempts, 2);
  assert.equal(data.medicines[0]._id, "recovered");
  assert.equal(data.report.period, "week");
  assert.deepEqual(failures, []);
});

test("limits repeated gateway errors to two attempts without exposing an HTML response", async () => {
  const api = workingApi();
  let attempts = 0;
  api.returns = async () => {
    attempts += 1;
    throw { response: { status: 503, data: "<html>Gateway failure</html>" } };
  };

  const { data, failures } = await loadInventoryWorkspace(api, "all");

  assert.equal(attempts, 2);
  assert.equal(Object.keys(data).length, 9);
  assert.deepEqual(failures, [{ key: "returns", label: "Medicine returns", message: "The server returned HTTP 503." }]);
});

test("does not retry permission failures or hide failed patient lookups as empty data", async () => {
  const api = workingApi();
  let attempts = 0;
  api.patients = async () => {
    attempts += 1;
    throw { response: { status: 403, data: { message: "Not authorized for this action" } } };
  };

  const { data, failures } = await loadInventoryWorkspace(api, "all");

  assert.equal(attempts, 1);
  assert.equal(Object.hasOwn(data, "patients"), false);
  assert.equal(failures[0].label, "Patient lookup");
  assert.equal(failures[0].message, "Not authorized for this action");
});

test("rejects malformed successful responses rather than treating them as empty lists", async () => {
  const api = workingApi();
  api.suppliers = async () => undefined;
  api.alerts = async () => "<html>Not an API response</html>";
  api.salesReport = async () => null;

  const { data, failures } = await loadInventoryWorkspace(api, "all");

  assert.equal(Object.keys(data).length, 7);
  assert.deepEqual(failures.map((item) => item.key).sort(), ["alerts", "report", "suppliers"]);
  assert.ok(failures.every((item) => item.message.includes("invalid response")));
});

// Inventory Workspace | Tests | Bound concurrent requests so this workspace does not issue ten reads at once on dashboard mount.
test("runs at most three reads concurrently while completing every section", async () => {
  const api = workingApi();
  let active = 0;
  let peak = 0;
  let completed = 0;
  for (const [name, load] of Object.entries(api)) {
    api[name] = async (...args) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setImmediate(resolve));
      try {
        return await load(...args);
      } finally {
        active -= 1;
        completed += 1;
      }
    };
  }

  const { failures } = await loadInventoryWorkspace(api, "all");

  assert.equal(peak, 3);
  assert.equal(completed, 10);
  assert.deepEqual(failures, []);
});
