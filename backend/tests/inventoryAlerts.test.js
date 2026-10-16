import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { inventoryService } from "../src/components/epic3_inventory/services/inventoryService.js";
import { Medicine } from "../src/components/epic3_inventory/models/Medicine.js";
import { MedicineBatch } from "../src/components/epic3_inventory/models/MedicineBatch.js";

// View Inventory Alerts | Tests | Reproduce a deleted medicine alongside a valid batch without connecting to a database.
test("inventory alerts tolerate missing medicines and preserve valid stock and expiry alerts", async (t) => {
  const medicineId = new mongoose.Types.ObjectId();
  const medicine = { _id: medicineId, name: "Test medicine", reorderLevel: 10, price: 20 };
  const orphanId = new mongoose.Types.ObjectId();
  const expiryDate = new Date(Date.now() + 7 * 86400000);
  const batches = [
    { _id: new mongoose.Types.ObjectId(), medicineId: medicine, quantity: 4, purchasePrice: 5, expiryDate },
    { _id: orphanId, medicineId: null, batchNumber: "LEGACY-BATCH", quantity: 3, purchasePrice: 7, expiryDate }
  ];
  t.mock.method(Medicine, "find", () => ({ sort: async () => [medicine] }));
  t.mock.method(MedicineBatch, "find", () => ({ populate: () => ({ sort: async () => batches }) }));

  const alerts = await inventoryService.getAlerts();

  assert.equal(alerts.lowStock.length, 1);
  assert.equal(alerts.lowStock[0].currentStock, 4);
  assert.equal(alerts.lowStock[0].deficit, 6);
  assert.equal(alerts.expiring.length, 2);
  const orphanAlert = alerts.expiring.find((batch) => batch._id.equals(orphanId));
  assert.equal(orphanAlert.medicine, "Medicine");
  assert.equal(orphanAlert.quantity, 3);
  assert.equal(orphanAlert.valueAtRisk, 21);
});

// View Medicines | Tests | Missing legacy references must not prevent the medicine catalog from loading.
test("catalog stock ignores missing medicine IDs while preserving valid batch quantities and counts", async (t) => {
  const medicineId = new mongoose.Types.ObjectId();
  const medicine = { _id: medicineId, reorderLevel: 10, toObject: () => ({ _id: medicineId, name: "Test medicine" }) };
  t.mock.method(Medicine, "find", () => ({ sort: async () => [medicine] }));
  t.mock.method(MedicineBatch, "find", async () => [
    { medicineId: null, quantity: 100 },
    { medicineId, quantity: 4 },
    { medicineId, quantity: 2 }
  ]);

  const catalog = await inventoryService.getMedicinesWithStock();

  assert.equal(catalog[0].totalStock, 6);
  assert.equal(catalog[0].batchesCount, 2);
  assert.equal(catalog[0].stockStatus, "low_stock");
});
