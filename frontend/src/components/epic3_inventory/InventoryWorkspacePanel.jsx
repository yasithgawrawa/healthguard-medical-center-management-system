import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Pill, Plus, ShoppingCart, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { inventoryApi } from "../../services/inventoryApi.js";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { batchNumberPattern, requiredMoney, requiredPhone, requiredQuantity, requiredTextNoNumbers, stripDigits, stripNonBatch, stripNonPhone } from "../../utils/validationSchemas.js";

const schemas = {
  medicine: z.object({
    name: z.string().trim().min(2, "Medicine name is required").max(120, "Medicine name is too long"),
    category: requiredTextNoNumbers("Category", 80),
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
  sale: z.object({
    medicineId: z.string().min(1, "Select medicine"),
    batchId: z.string().min(1, "Select batch"),
    quantity: requiredQuantity(),
    patientId: z.string().trim().optional()
  })
};

export const InventoryWorkspacePanel = () => {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(schemas[modal] || schemas.medicine) });
  const selectedMedicineId = watch("medicineId");

  const load = async () => {
    try {
      const [medicineData, supplierData, batchData, saleData] = await Promise.all([
        inventoryApi.medicines(),
        inventoryApi.suppliers(),
        inventoryApi.batches(),
        inventoryApi.sales()
      ]);
      setMedicines(medicineData || []);
      setSuppliers(supplierData || []);
      setBatches(batchData || []);
      setSales(saleData || []);
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

  const open = (type) => {
    reset({});
    setModal(type);
  };

  const submit = async (values) => {
    setBusy(true);
    try {
      if (modal === "medicine") await inventoryApi.createMedicine(values);
      if (modal === "supplier") await inventoryApi.createSupplier(values);
      if (modal === "batch") await inventoryApi.createBatch(values);
      if (modal === "sale") await inventoryApi.createSale({ patientId: values.patientId || undefined, items: [{ medicineId: values.medicineId, batchId: values.batchId, quantity: values.quantity }] });
      setToast({ type: "success", message: "Pharmacy workflow saved" });
      setModal(null);
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to save pharmacy workflow" });
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
          <p>Manage catalog, batches, suppliers and dispensing from clean workflow actions.</p>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={() => open("medicine")}><Pill size={16} /> Add Medicine</button>
          <button type="button" onClick={() => open("batch")}><Boxes size={16} /> Receive Batch</button>
          <button type="button" onClick={() => open("supplier")}><Truck size={16} /> Add Supplier</button>
          <button type="button" onClick={() => open("sale")}><ShoppingCart size={16} /> Record Sale</button>
        </div>
      </div>
      <div className="table-toolbar compact-toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search medicines, category or status" />
      </div>
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Medicine" },
          { key: "category", header: "Category" },
          { key: "unit", header: "Unit" },
          { key: "price", header: "Price", render: (item) => `Rs. ${Number(item.price || 0).toFixed(2)}` },
          { key: "reorderLevel", header: "Reorder Level" },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
        ]}
      />
      <div className="manager-summary-grid">
        <div><strong>{batches.length}</strong><span>medicine batches</span></div>
        <div><strong>{suppliers.length}</strong><span>suppliers</span></div>
        <div><strong>{sales.length}</strong><span>dispensing sales</span></div>
      </div>

      <Modal open={Boolean(modal)} title={modal ? `${modal[0].toUpperCase()}${modal.slice(1)} Workflow` : ""} onClose={() => setModal(null)}>
        <form onSubmit={handleSubmit(submit)}>
          {modal === "medicine" ? <div className="form-grid"><FormInput label="Name" error={errors.name?.message} {...register("name")} /><FormInput label="Category" sanitize={stripDigits} error={errors.category?.message} {...register("category")} /><FormInput label="Unit" error={errors.unit?.message} {...register("unit")} /><FormInput label="Price" type="number" min="0" step="0.01" error={errors.price?.message} {...register("price")} /><FormInput label="Reorder Level" type="number" min="0" step="1" error={errors.reorderLevel?.message} {...register("reorderLevel")} /></div> : null}
          {modal === "supplier" ? <div className="form-grid"><FormInput label="Name" sanitize={stripDigits} error={errors.name?.message} {...register("name")} /><FormInput label="Email" type="email" error={errors.email?.message} {...register("email")} /><FormInput label="Phone" inputMode="tel" sanitize={stripNonPhone} error={errors.phone?.message} {...register("phone")} /><FormInput label="Address" error={errors.address?.message} {...register("address")} /></div> : null}
          {modal === "batch" ? <div className="form-grid"><FormSelect label="Medicine" error={errors.medicineId?.message} {...register("medicineId")}><option value="">Select medicine</option>{medicines.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</FormSelect><FormInput label="Batch Number" sanitize={stripNonBatch} error={errors.batchNumber?.message} {...register("batchNumber")} /><FormInput label="Quantity" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} /><FormInput label="Purchase Price" type="number" min="0" step="0.01" error={errors.purchasePrice?.message} {...register("purchasePrice")} /><FormInput label="Manufacture Date" type="date" error={errors.manufactureDate?.message} {...register("manufactureDate")} /><FormInput label="Expiry Date" type="date" error={errors.expiryDate?.message} {...register("expiryDate")} /></div> : null}
          {modal === "sale" ? <div className="form-grid"><FormSelect label="Medicine" error={errors.medicineId?.message} {...register("medicineId")}><option value="">Select medicine</option>{medicines.map((item) => <option value={item._id} key={item._id}>{item.name}</option>)}</FormSelect><FormSelect label="Batch" error={errors.batchId?.message} {...register("batchId")}><option value="">Select batch</option>{batches.filter((batch) => !selectedMedicineId || batch.medicineId === selectedMedicineId).map((item) => <option value={item._id} key={item._id}>{item.batchNumber} - Qty {item.quantity}</option>)}</FormSelect><FormInput label="Quantity" type="number" min="1" step="1" error={errors.quantity?.message} {...register("quantity")} /><FormInput label="Patient Reference" error={errors.patientId?.message} {...register("patientId")} /></div> : null}
          <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button className="button-primary" type="submit" disabled={busy}><Plus size={16} /> {busy ? "Saving..." : "Save"}</button></div>
        </form>
      </Modal>
    </section>
  );
};
