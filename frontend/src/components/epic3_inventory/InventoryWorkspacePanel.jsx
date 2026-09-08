import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Boxes, Pill, Plus, ShoppingCart, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { inventoryApi } from "../../services/inventoryApi.js";
import { batchNumberPattern, requiredMoney, requiredPhone, requiredQuantity, requiredTextNoNumbers, stripDigits, stripNonBatch, stripNonPhone } from "../../utils/validationSchemas.js";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { MEDICINE_CATEGORIES } from "./medicineCategories.js";

const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");
const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const medicineName = (item) => item?.medicineId?.name || item?.medicine || item?.name || "Medicine";
const batchMedicineId = (batch) => batch?.medicineId?._id || batch?.medicineId;
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const schemas = {
  medicine: z.object({
    name: z.string().trim().min(2, "Medicine name is required").max(120, "Medicine name is too long"),
    category: z.string().min(1, "Select medicine category").refine((value) => MEDICINE_CATEGORIES.includes(value), "Select a valid medicine category"),
    unit: z.string().trim().min(1, "Unit is required").max(30, "Unit is too long"),
    price: requiredMoney("Price"),
    reorderLevel: z.coerce.number().int("Reorder level must be a whole number").min(0, "Reorder level cannot be negative").max(100000, "Reorder level is too high")
  }),
  supplier: z.object({
    name: requiredTextNoNumbers("Supplier name", 120),
    email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
    phone: requiredPhone,
    address: z.string().trim().min(5, "Address is required").max(250, "Address is too long")
  }),
  batch: z.object({
    medicineId: z.string().min(1, "Select medicine"),
    batchNumber: z.string().trim().min(2, "Batch number is required").max(40, "Batch number is too long").regex(batchNumberPattern, "Batch number can only contain letters, numbers and hyphens"),
    quantity: requiredQuantity(),
    purchasePrice: requiredMoney("Purchase price"),
    manufactureDate: z.string().min(1, "Manufacture date is required"),
    expiryDate: z.string().min(1, "Expiry date is required")
  }).refine((data) => new Date(data.expiryDate) > new Date(data.manufactureDate), {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  }),
  batchUpdate: z.object({
    medicineId: z.string().min(1, "Select medicine"),
    batchNumber: z.string().trim().min(2, "Batch number is required").max(40, "Batch number is too long").regex(batchNumberPattern, "Batch number can only contain letters, numbers and hyphens"),
    quantity: z.coerce.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative").max(100000, "Quantity is too high"),
    purchasePrice: requiredMoney("Purchase price"),
    manufactureDate: z.string().min(1, "Manufacture date is required"),
    expiryDate: z.string().min(1, "Expiry date is required")
  }).refine((data) => new Date(data.expiryDate) > new Date(data.manufactureDate), {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  }),
  sale: z.object({
    medicineId: z.string().min(1, "Select medicine"),
    batchId: z.string().min(1, "Select batch"),
    quantity: requiredQuantity(),
    patientId: z.string().trim().optional()
  }),
  purchase: z.object({
    supplierId: z.string().min(1, "Select supplier"),
    medicineId: z.string().min(1, "Select medicine"),
    batchId: z.string().min(1, "Select batch"),
    quantity: requiredQuantity(),
    purchasePrice: requiredMoney("Purchase price")
  })
};

export const InventoryWorkspacePanel = () => {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
  const [report, setReport] = useState({ totalSales: 0, totalRevenue: 0, topMedicines: [] });
  const [activeTab, setActiveTab] = useState("catalog");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ type: null, record: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const schema = modal.type === "batch" && modal.record ? schemas.batchUpdate : schemas[modal.type] || schemas.medicine;
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema), mode: "onChange" });
  const selectedMedicineId = watch("medicineId");

  const load = async () => {
    try {
      const [medicineData, supplierData, batchData, saleData, purchaseData, alertData, reportData] = await Promise.all([
        inventoryApi.medicines(),
        inventoryApi.suppliers(),
        inventoryApi.batches(),
        inventoryApi.sales(),
        inventoryApi.purchases(),
        inventoryApi.alerts(),
        inventoryApi.salesReport()
      ]);
      setMedicines(medicineData || []);
      setSuppliers(supplierData || []);
      setBatches(batchData || []);
      setSales(saleData || []);
      setPurchases(purchaseData || []);
      setAlerts(alertData || { lowStock: [], expiring: [] });
      setReport(reportData || { totalSales: 0, totalRevenue: 0, topMedicines: [] });
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load pharmacy workspace" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return medicines.filter((item) => [item.name, item.category, item.unit, item.status].join(" ").toLowerCase().includes(query));
  }, [medicines, search]);

  const open = (type, record = null) => {
    const defaults = record
      ? {
          ...record,
          medicineId: record.medicineId?._id || record.medicineId || "",
          manufactureDate: dateOnly(record.manufactureDate),
          expiryDate: dateOnly(record.expiryDate)
        }
      : {};
    reset(defaults);
    setModal({ type, record });
  };

  const submit = async (values) => {
    setBusy(true);
    try {
      if (modal.type === "medicine") {
        modal.record ? await inventoryApi.updateMedicine(modal.record._id, values) : await inventoryApi.createMedicine(values);
      }
      if (modal.type === "supplier") await inventoryApi.createSupplier(values);
      if (modal.type === "batch") {
        modal.record ? await inventoryApi.updateBatch(modal.record._id, values) : await inventoryApi.createBatch(values);
      }
      if (modal.type === "purchase") await inventoryApi.createPurchase(values);
      if (modal.type === "sale") {
        await inventoryApi.createSale({
          patientId: values.patientId || undefined,
          items: [{ medicineId: values.medicineId, batchId: values.batchId, quantity: values.quantity }]
        });
      }
      setToast({ type: "success", message: "Pharmacy workflow saved" });
      setModal({ type: null, record: null });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to save pharmacy workflow" });
    } finally {
      setBusy(false);
    }
  };

  const downloadSaleBill = async (sale) => {
    setBusy(true);
    try {
      const bill = await inventoryApi.downloadSaleBill(sale._id);
      saveBlob(bill, `${sale.saleNumber || `pharmacy-bill-${sale._id}`}.txt`);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to download pharmacy bill" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="e1-panel" id="pharmacy-inventory">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div>
          <h2>Pharmacy Inventory</h2>
          <p>Manage catalog, batches, suppliers, stock alerts, purchases, sales and reports.</p>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={() => open("medicine")}><Pill size={16} /> Add Medicine</button>
          <button type="button" onClick={() => open("batch")}><Boxes size={16} /> Receive Batch</button>
          <button type="button" onClick={() => open("purchase")}><Truck size={16} /> Record Purchase</button>
          <button type="button" onClick={() => open("sale")}><ShoppingCart size={16} /> Record Sale</button>
        </div>
      </div>

      <div className="e1-tabbar">
        {["catalog", "batches", "alerts", "sales", "reports"].map((tab) => (
          <button className={activeTab === tab ? "active" : ""} type="button" onClick={() => setActiveTab(tab)} key={tab}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "catalog" ? (
        <>
          <div className="table-toolbar compact-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search medicines, category or status" />
          </div>
          <DataTable
            rows={rows}
            columns={[
              { key: "name", header: "Medicine" },
              { key: "category", header: "Category" },
              { key: "unit", header: "Unit" },
              { key: "price", header: "Price", render: (item) => money(item.price) },
              { key: "reorderLevel", header: "Reorder Level" },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              { key: "actions", header: "Actions", render: (item) => <button className="table-link-button" type="button" onClick={() => open("medicine", item)}>Edit</button> }
            ]}
          />
        </>
      ) : null}

      {activeTab === "batches" ? (
        <DataTable
          rows={batches}
          columns={[
            { key: "medicine", header: "Medicine", render: medicineName },
            { key: "batchNumber", header: "Batch" },
            { key: "quantity", header: "Quantity" },
            { key: "purchasePrice", header: "Purchase Price", render: (item) => money(item.purchasePrice) },
            { key: "expiryDate", header: "Expiry", render: (item) => dateOnly(item.expiryDate) },
            { key: "actions", header: "Actions", render: (item) => <button className="table-link-button" type="button" onClick={() => open("batch", item)}>Edit Stock</button> }
          ]}
        />
      ) : null}

      {activeTab === "alerts" ? (
        <div className="manager-summary-grid">
          <div><AlertTriangle size={22} /><strong>{alerts.lowStock?.length || 0}</strong><span>low-stock medicines</span></div>
          <div><AlertTriangle size={22} /><strong>{alerts.expiring?.length || 0}</strong><span>expiring batches in 30 days</span></div>
          <div><Boxes size={22} /><strong>{purchases.length}</strong><span>recorded purchases</span></div>
        </div>
      ) : null}

      {activeTab === "sales" ? (
        <DataTable
          rows={sales}
          columns={[
            { key: "createdAt", header: "Date", render: (item) => dateOnly(item.createdAt) },
            { key: "saleNumber", header: "Bill No", render: (item) => item.saleNumber || `PH-LEGACY-${item._id?.slice(-8)?.toUpperCase()}` },
            { key: "patient", header: "Patient", render: (item) => [item.patientId?.firstName, item.patientId?.lastName].filter(Boolean).join(" ") || "-" },
            { key: "items", header: "Items", render: (item) => `${item.items?.length || 0} item(s)` },
            { key: "total", header: "Bill Total", render: (item) => money(item.total) },
            { key: "actions", header: "Actions", render: (item) => <button className="table-link-button" type="button" onClick={() => downloadSaleBill(item)} disabled={busy}>Download Bill</button> }
          ]}
        />
      ) : null}

      {activeTab === "reports" ? (
        <div className="manager-summary-grid">
          <div><strong>{report.totalSales}</strong><span>pharmacy sales</span></div>
          <div><strong>{money(report.totalRevenue)}</strong><span>sales revenue</span></div>
          <div><strong>{report.topMedicines?.[0]?.medicine || "No sales"}</strong><span>top medicine</span></div>
        </div>
      ) : null}

      <Modal open={Boolean(modal.type)} title={modal.type ? `${modal.record ? "Update" : "Create"} ${modal.type}` : ""} onClose={() => setModal({ type: null, record: null })}>
        <form onSubmit={handleSubmit(submit)}>
          {modal.type === "medicine" ? <div className="form-grid"><FormInput label="Name" placeholder="Paracetamol 500mg" error={errors.name?.message} {...register("name")} /><FormSelect label="Category" error={errors.category?.message} {...register("category")}><option value="">Select medicine category</option>{MEDICINE_CATEGORIES.map((category) => <option value={category} key={category}>{category}</option>)}</FormSelect><FormInput label="Unit" placeholder="tablet, capsule, syrup" error={errors.unit?.message} {...register("unit")} /><FormInput label="Price" placeholder="12.00" type="number" min="0" step="0.01" error={errors.price?.message} {...register("price")} /><FormInput label="Reorder Level" placeholder="100" type="number" min="0" step="1" error={errors.reorderLevel?.message} {...register("reorderLevel")} /></div> : null}
          {modal.type === "supplier" ? <div className="form-grid"><FormInput label="Name" placeholder="State Pharmaceuticals Corporation" sanitize={stripDigits} error={errors.name?.message} {...register("name")} /><FormInput label="Email" placeholder="supplies@example.lk" type="email" error={errors.email?.message} {...register("email")} /><FormInput label="Phone" placeholder="+94 11 232 8262" inputMode="tel" sanitize={stripNonPhone} error={errors.phone?.message} {...register("phone")} /><FormInput label="Address" placeholder="Colombo 07, Sri Lanka" error={errors.address?.message} {...register("address")} /></div> : null}
          {modal.type === "batch" ? <div className="form-grid"><FormSelect label="Medicine" error={errors.medicineId?.message} {...register("medicineId")}><option value="">Select medicine</option>{medicines.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</FormSelect><FormInput label="Batch Number" placeholder="PARA-LK-001" sanitize={stripNonBatch} error={errors.batchNumber?.message} {...register("batchNumber")} /><FormInput label="Quantity" placeholder="180" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} /><FormInput label="Purchase Price" placeholder="8.50" type="number" min="0" step="0.01" error={errors.purchasePrice?.message} {...register("purchasePrice")} /><FormInput label="Manufacture Date" type="date" error={errors.manufactureDate?.message} {...register("manufactureDate")} /><FormInput label="Expiry Date" type="date" error={errors.expiryDate?.message} {...register("expiryDate")} /></div> : null}
          {modal.type === "purchase" ? <div className="form-grid"><FormSelect label="Supplier" error={errors.supplierId?.message} {...register("supplierId")}><option value="">Select supplier</option>{suppliers.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</FormSelect><FormSelect label="Medicine" error={errors.medicineId?.message} {...register("medicineId")}><option value="">Select medicine</option>{medicines.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</FormSelect><FormSelect label="Batch" error={errors.batchId?.message} {...register("batchId")}><option value="">Select batch</option>{batches.filter((batch) => !selectedMedicineId || batchMedicineId(batch) === selectedMedicineId).map((item) => <option value={item._id} key={item._id}>{item.batchNumber}</option>)}</FormSelect><FormInput label="Quantity" placeholder="100" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} /><FormInput label="Purchase Price" placeholder="7200.00" type="number" min="0" step="0.01" error={errors.purchasePrice?.message} {...register("purchasePrice")} /></div> : null}
          {modal.type === "sale" ? <div className="form-grid"><FormSelect label="Medicine" error={errors.medicineId?.message} {...register("medicineId")}><option value="">Select medicine</option>{medicines.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</FormSelect><FormSelect label="Batch" error={errors.batchId?.message} {...register("batchId")}><option value="">Select batch</option>{batches.filter((batch) => !selectedMedicineId || batchMedicineId(batch) === selectedMedicineId).map((item) => <option value={item._id} key={item._id}>{item.batchNumber} - Qty {item.quantity}</option>)}</FormSelect><FormInput label="Quantity" placeholder="10" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} /><FormInput label="Patient Reference" placeholder="Optional patient Mongo ID" error={errors.patientId?.message} {...register("patientId")} /></div> : null}
          <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button><button className="button-primary" type="submit" disabled={busy}><Plus size={16} /> {busy ? "Saving..." : "Save"}</button></div>
        </form>
      </Modal>
    </section>
  );
};
