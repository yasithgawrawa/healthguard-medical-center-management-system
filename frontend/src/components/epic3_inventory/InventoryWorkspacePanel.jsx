import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  Boxes,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  Edit2,
  FileText,
  Package,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Truck,
  UserCheck,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { inventoryApi } from "../../services/inventoryApi.js";
import {
  batchNumberPattern,
  requiredMoney,
  requiredPhone,
  requiredQuantity,
  requiredTextNoNumbers,
  stripDigits,
  stripNonBatch,
  stripNonPhone
} from "../../utils/validationSchemas.js";
import { DataTable } from "../shared/DataTable.jsx";
import { FilterSelect } from "../shared/FilterSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { MEDICINE_CATEGORIES } from "./medicineCategories.js";

const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "-");
const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
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
    name: z.string().trim().min(2, "Medicine name is required").max(120),
    category: z.string().min(1, "Select medicine category").refine((value) => MEDICINE_CATEGORIES.includes(value), "Select a valid medicine category"),
    unit: z.string().trim().min(1, "Unit is required").max(30),
    price: requiredMoney("Price"),
    reorderLevel: z.coerce.number().int("Reorder level must be a whole number").min(0).max(100000),
    status: z.enum(["active", "inactive"]).default("active")
  }),
  supplier: z.object({
    name: requiredTextNoNumbers("Supplier name", 120),
    email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
    phone: requiredPhone,
    address: z.string().trim().min(5, "Address is required").max(250),
    status: z.enum(["active", "inactive"]).default("active")
  }),
  batch: z.object({
    medicineId: z.string().min(1, "Select medicine"),
    batchNumber: z.string().trim().min(2, "Batch number is required").max(40).regex(batchNumberPattern, "Batch number can only contain letters, numbers and hyphens"),
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
    batchNumber: z.string().trim().min(2, "Batch number is required").max(40).regex(batchNumberPattern, "Batch number can only contain letters, numbers and hyphens"),
    quantity: z.coerce.number().int("Quantity must be a whole number").min(0).max(100000),
    purchasePrice: requiredMoney("Purchase price"),
    manufactureDate: z.string().min(1, "Manufacture date is required"),
    expiryDate: z.string().min(1, "Expiry date is required")
  }).refine((data) => new Date(data.expiryDate) > new Date(data.manufactureDate), {
    path: ["expiryDate"],
    message: "Expiry date must be after manufacture date"
  })
};

export const InventoryWorkspacePanel = () => {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
  const [report, setReport] = useState({ totalSales: 0, totalRevenue: 0, totalItemsSold: 0, averageOrderValue: 0, topMedicines: [] });
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [activeTab, setActiveTab] = useState("catalog");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("");
  const [reportPeriod, setReportPeriod] = useState("all");

  const [modal, setModal] = useState({ type: null, record: null });
  const [selectedBill, setSelectedBill] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // POS / Dispensing State
  const [posPatientType, setPosPatientType] = useState("walk_in");
  const [posPatientId, setPosPatientId] = useState("");
  const [posPrescriptionId, setPosPrescriptionId] = useState("");
  const [posCart, setPosCart] = useState([]);
  const [posMedId, setPosMedId] = useState("");
  const [posBatchId, setPosBatchId] = useState("");
  const [posQty, setPosQty] = useState(1);

  // Purchase Form State
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseMedId, setPurchaseMedId] = useState("");
  const [purchaseIsNewBatch, setPurchaseIsNewBatch] = useState(true);
  const [purchaseBatchId, setPurchaseBatchId] = useState("");
  const [purchaseBatchNumber, setPurchaseBatchNumber] = useState("");
  const [purchaseMfgDate, setPurchaseMfgDate] = useState("");
  const [purchaseExpDate, setPurchaseExpDate] = useState("");
  const [purchaseQty, setPurchaseQty] = useState(100);
  const [purchasePrice, setPurchasePrice] = useState("");

  const formSchema = modal.type === "batch" && modal.record ? schemas.batchUpdate : schemas[modal.type] || schemas.medicine;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange"
  });

  const loadData = async () => {
    try {
      const [meds, sups, bts, sls, prchs, alrts, rpt, pts, rx] = await Promise.all([
        inventoryApi.medicines(),
        inventoryApi.suppliers(),
        inventoryApi.batches(),
        inventoryApi.sales(),
        inventoryApi.purchases(),
        inventoryApi.alerts(),
        inventoryApi.salesReport(reportPeriod),
        inventoryApi.patients().catch(() => []),
        inventoryApi.prescriptions().catch(() => [])
      ]);
      setMedicines(meds || []);
      setSuppliers(sups || []);
      setBatches(bts || []);
      setSales(sls || []);
      setPurchases(prchs || []);
      setAlerts(alrts || { lowStock: [], expiring: [] });
      setReport(rpt || { totalSales: 0, totalRevenue: 0, totalItemsSold: 0, averageOrderValue: 0, topMedicines: [] });
      setPatients(pts || []);
      setPrescriptions(rx || []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load pharmacy workspace" });
    }
  };

  useEffect(() => {
    loadData();
  }, [reportPeriod]);

  // Open Standard Modal (Medicine, Batch, Supplier)
  const openStandardModal = (type, record = null) => {
    const defaults = record
      ? {
          ...record,
          medicineId: record.medicineId?._id || record.medicineId || "",
          manufactureDate: dateOnly(record.manufactureDate),
          expiryDate: dateOnly(record.expiryDate)
        }
      : { status: "active" };
    reset(defaults);
    setModal({ type, record });
  };

  // Open Purchase Modal
  const openPurchaseModal = (prefillMed = null) => {
    setPurchaseSupplierId(suppliers[0]?._id || "");
    const medId = prefillMed?._id || medicines[0]?._id || "";
    setPurchaseMedId(medId);
    setPurchaseIsNewBatch(true);
    setPurchaseBatchId("");
    setPurchaseBatchNumber("");
    setPurchaseMfgDate(new Date().toISOString().slice(0, 10));
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 2);
    setPurchaseExpDate(nextYear.toISOString().slice(0, 10));
    setPurchaseQty(100);
    const med = medicines.find((m) => m._id === medId);
    setPurchasePrice(med ? Math.round(med.price * 0.7) : "");
    setModal({ type: "purchase", record: prefillMed });
  };

  // Open POS / Dispense Modal
  const openPosModal = (prefillRx = null) => {
    setPosCart([]);
    if (prefillRx) {
      setPosPatientType("registered");
      setPosPatientId(prefillRx.patientId?._id || prefillRx.patientId || "");
      setPosPrescriptionId(prefillRx._id);
    } else {
      setPosPatientType("walk_in");
      setPosPatientId("");
      setPosPrescriptionId("");
    }
    setPosMedId(medicines[0]?._id || "");
    const medBatches = batches.filter((b) => (b.medicineId?._id || b.medicineId) === medicines[0]?._id && b.quantity > 0 && b.expiryStatus !== "expired");
    setPosBatchId(medBatches[0]?._id || "");
    setPosQty(1);
    setModal({ type: "pos", record: prefillRx });
  };

  // Form Submits
  const submitStandard = async (values) => {
    setBusy(true);
    try {
      if (modal.type === "medicine") {
        modal.record ? await inventoryApi.updateMedicine(modal.record._id, values) : await inventoryApi.createMedicine(values);
        setToast({ type: "success", message: `Medicine ${modal.record ? "updated" : "added"} successfully` });
      } else if (modal.type === "supplier") {
        modal.record ? await inventoryApi.updateSupplier(modal.record._id, values) : await inventoryApi.createSupplier(values);
        setToast({ type: "success", message: `Supplier ${modal.record ? "updated" : "added"} successfully` });
      } else if (modal.type === "batch") {
        modal.record ? await inventoryApi.updateBatch(modal.record._id, values) : await inventoryApi.createBatch(values);
        setToast({ type: "success", message: `Medicine batch ${modal.record ? "updated" : "received"} successfully` });
      }
      setModal({ type: null, record: null });
      await loadData();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to save record" });
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivateMedicine = async (med) => {
    if (!window.confirm(`Are you sure you want to deactivate ${med.name}?`)) return;
    try {
      await inventoryApi.deleteMedicine(med._id);
      setToast({ type: "success", message: `${med.name} marked as inactive` });
      await loadData();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to deactivate medicine" });
    }
  };

  const handleDeactivateSupplier = async (sup) => {
    if (!window.confirm(`Are you sure you want to deactivate supplier ${sup.name}?`)) return;
    try {
      await inventoryApi.deleteSupplier(sup._id);
      setToast({ type: "success", message: `${sup.name} marked as inactive` });
      await loadData();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to deactivate supplier" });
    }
  };

  // Record Purchase Submit
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseSupplierId) return setToast({ type: "error", message: "Please select a supplier" });
    if (!purchaseMedId) return setToast({ type: "error", message: "Please select a medicine" });
    if (!purchaseQty || purchaseQty <= 0) return setToast({ type: "error", message: "Enter a valid quantity" });
    if (!purchasePrice || purchasePrice <= 0) return setToast({ type: "error", message: "Enter a valid purchase price" });

    const payload = {
      supplierId: purchaseSupplierId,
      medicineId: purchaseMedId,
      quantity: Number(purchaseQty),
      purchasePrice: Number(purchasePrice)
    };

    if (purchaseIsNewBatch) {
      if (!purchaseBatchNumber.trim()) return setToast({ type: "error", message: "Batch number is required for new batch" });
      if (!purchaseMfgDate || !purchaseExpDate) return setToast({ type: "error", message: "Dates are required for new batch" });
      if (new Date(purchaseExpDate) <= new Date(purchaseMfgDate)) {
        return setToast({ type: "error", message: "Expiry date must be after manufacture date" });
      }
      payload.batchNumber = purchaseBatchNumber.trim().toUpperCase();
      payload.manufactureDate = purchaseMfgDate;
      payload.expiryDate = purchaseExpDate;
    } else {
      if (!purchaseBatchId) return setToast({ type: "error", message: "Please select an existing batch to top up" });
      payload.batchId = purchaseBatchId;
    }

    setBusy(true);
    try {
      await inventoryApi.createPurchase(payload);
      setToast({ type: "success", message: "Purchase recorded and stock updated" });
      setModal({ type: null, record: null });
      await loadData();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to record purchase" });
    } finally {
      setBusy(false);
    }
  };

  // Add Item to POS Cart
  const handleAddToCart = () => {
    const med = medicines.find((m) => m._id === posMedId);
    const batch = batches.find((b) => b._id === posBatchId);
    if (!med || !batch) return setToast({ type: "error", message: "Please select both a valid medicine and batch" });
    if (batch.expiryStatus === "expired") return setToast({ type: "error", message: "Cannot dispense expired batch" });
    if (posQty <= 0 || posQty > batch.quantity) {
      return setToast({ type: "error", message: `Quantity must be between 1 and available stock (${batch.quantity})` });
    }

    // Check if already in cart
    const existingIndex = posCart.findIndex((item) => item.batchId === batch._id);
    if (existingIndex > -1) {
      const updated = [...posCart];
      const newQty = updated[existingIndex].quantity + Number(posQty);
      if (newQty > batch.quantity) {
        return setToast({ type: "error", message: `Total cart quantity exceeds batch stock of ${batch.quantity}` });
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].lineTotal = newQty * med.price;
      setPosCart(updated);
    } else {
      setPosCart([
        ...posCart,
        {
          medicineId: med._id,
          medicineName: med.name,
          unit: med.unit,
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          availableStock: batch.quantity,
          quantity: Number(posQty),
          unitPrice: med.price,
          lineTotal: Number(posQty) * med.price
        }
      ]);
    }
    setPosQty(1);
  };

  const handleRemoveFromCart = (index) => {
    setPosCart(posCart.filter((_, i) => i !== index));
  };

  const posGrandTotal = useMemo(() => posCart.reduce((sum, item) => sum + item.lineTotal, 0), [posCart]);

  // Submit POS Sale
  const handleCheckoutSale = async () => {
    if (posCart.length === 0) return setToast({ type: "error", message: "Cart is empty. Add at least one medicine item." });
    if (posPatientType === "registered" && !posPatientId) {
      return setToast({ type: "error", message: "Please select a registered patient" });
    }

    setBusy(true);
    try {
      const sale = await inventoryApi.createSale({
        patientId: posPatientType === "registered" ? posPatientId : undefined,
        prescriptionId: posPrescriptionId || undefined,
        items: posCart.map((item) => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: item.quantity
        }))
      });
      setToast({ type: "success", message: `Sale ${sale.saleNumber} completed! Stock deducted.` });
      setModal({ type: null, record: null });
      await loadData();
      // Open Bill modal immediately for printing/downloading
      setSelectedBill(sale);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to complete pharmacy sale" });
    } finally {
      setBusy(false);
    }
  };

  // View & Download Bill
  const handleViewBill = async (sale) => {
    setBusy(true);
    try {
      const details = await inventoryApi.getSaleDetails(sale._id);
      setSelectedBill(details);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to load bill details" });
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadBillFile = async (sale) => {
    setBusy(true);
    try {
      const billBlob = await inventoryApi.downloadSaleBill(sale._id);
      saveBlob(billBlob, `${sale.saleNumber || "pharmacy-bill"}.txt`);
    } catch (error) {
      setToast({ type: "error", message: "Unable to download bill text" });
    } finally {
      setBusy(false);
    }
  };

  // Filtered Rows for Catalog
  const catalogRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((item) => {
      const matchesSearch = [item.name, item.category, item.unit, item.status].join(" ").toLowerCase().includes(q);
      const matchesCat = !categoryFilter || item.category === categoryFilter;
      const matchesStock = !stockStatusFilter || item.stockStatus === stockStatusFilter;
      return matchesSearch && matchesCat && matchesStock;
    });
  }, [medicines, search, categoryFilter, stockStatusFilter]);

  // Filtered Batches
  const batchRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return batches.filter((b) => {
      const medName = b.medicineId?.name || "";
      return [b.batchNumber, medName].join(" ").toLowerCase().includes(q);
    });
  }, [batches, search]);

  // Filtered Suppliers
  const supplierRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => [s.name, s.phone, s.email, s.address, s.status].join(" ").toLowerCase().includes(q));
  }, [suppliers, search]);

  // Filtered Purchases
  const purchaseRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return purchases.filter((p) => {
      const sName = p.supplierId?.name || "";
      const mName = p.medicineId?.name || "";
      const bNum = p.batchId?.batchNumber || "";
      return [sName, mName, bNum].join(" ").toLowerCase().includes(q);
    });
  }, [purchases, search]);

  // Filtered Sales
  const salesRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      const pName = [s.patientId?.firstName, s.patientId?.lastName].filter(Boolean).join(" ");
      return [s.saleNumber, pName].join(" ").toLowerCase().includes(q);
    });
  }, [sales, search]);

  return (
    <section className="e1-panel" id="pharmacy-inventory">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="e1-panel-header">
        <div>
          <h2>Pharmacy & Inventory Workspace</h2>
          <p>Complete medicine catalog, batch tracking, supplier management, procurement, dispensing POS, alerts and sales reports.</p>
        </div>
        <div className="inline-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
          <button type="button" onClick={() => openStandardModal("medicine")} className="button-secondary">
            <Pill size={16} /> Add Medicine
          </button>
          <button type="button" onClick={() => openStandardModal("batch")} className="button-secondary">
            <Boxes size={16} /> Receive Batch
          </button>
          <button type="button" onClick={() => openStandardModal("supplier")} className="button-secondary">
            <Truck size={16} /> Add Supplier
          </button>
          <button type="button" onClick={() => openPurchaseModal()} className="button-secondary">
            <ArrowDownCircle size={16} /> Record Purchase
          </button>
          <button type="button" onClick={() => openPosModal()} className="button-primary" style={{ fontWeight: 600 }}>
            <ShoppingCart size={16} /> Dispense / POS
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="e1-tabbar">
        {[
          { id: "catalog", label: "Medicine Catalog", icon: Pill, badge: medicines.length },
          { id: "batches", label: "Batches & Stock", icon: Boxes, badge: batches.length },
          { id: "suppliers", label: "Suppliers", icon: Truck, badge: suppliers.length },
          { id: "purchases", label: "Purchases", icon: ArrowDownCircle, badge: purchases.length },
          { id: "alerts", label: "Stock & Expiry Alerts", icon: AlertTriangle, badge: alerts.lowStock.length + alerts.expiring.length, badgeWarn: true },
          { id: "sales", label: "Sales & Invoices", icon: ShoppingCart, badge: sales.length },
          { id: "reports", label: "Sales Analytics", icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSearch("");
              }}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 ? (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "10px",
                    background: tab.badgeWarn ? "var(--danger-bg)" : "var(--brand-100)",
                    color: tab.badgeWarn ? "var(--danger)" : "var(--brand-700)"
                  }}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MEDICINE CATALOG */}
      {activeTab === "catalog" ? (
        <>
          <div className="table-toolbar compact-toolbar" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search medicines by name, unit, category..." />
            </div>
            <FilterSelect
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={MEDICINE_CATEGORIES}
            />
            <FilterSelect
              label="Stock Level"
              value={stockStatusFilter}
              onChange={setStockStatusFilter}
              options={[
                { value: "in_stock", label: "In Stock" },
                { value: "low_stock", label: "Low Stock" },
                { value: "out_of_stock", label: "Out of Stock" }
              ]}
            />
          </div>

          <DataTable
            rows={catalogRows}
            columns={[
              { key: "name", header: "Medicine Name" },
              { key: "category", header: "Category" },
              { key: "unit", header: "Unit" },
              { key: "price", header: "Price", render: (item) => money(item.price) },
              {
                key: "totalStock",
                header: "Available Stock",
                render: (item) => (
                  <span style={{ fontWeight: 600, color: item.totalStock === 0 ? "var(--danger)" : item.totalStock <= item.reorderLevel ? "var(--warning)" : "var(--success)" }}>
                    {item.totalStock} {item.unit}s
                  </span>
                )
              },
              { key: "reorderLevel", header: "Reorder Lvl", render: (item) => `${item.reorderLevel} ${item.unit}s` },
              {
                key: "stockStatus",
                header: "Stock Status",
                render: (item) => {
                  if (item.totalStock === 0) return <span style={{ color: "var(--danger)", fontWeight: 600, background: "var(--danger-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>Out of Stock</span>;
                  if (item.totalStock <= item.reorderLevel) return <span style={{ color: "var(--warning)", fontWeight: 600, background: "var(--warning-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>Low Stock</span>;
                  return <span style={{ color: "var(--success)", fontWeight: 600, background: "var(--success-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>In Stock</span>;
                }
              },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              {
                key: "actions",
                header: "Actions",
                render: (item) => (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="table-link-button" type="button" onClick={() => openStandardModal("medicine", item)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    {item.status === "active" ? (
                      <button className="table-link-button" type="button" onClick={() => handleDeactivateMedicine(item)} style={{ color: "var(--danger)" }}>
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                )
              }
            ]}
          />
        </>
      ) : null}

      {/* TAB 2: BATCHES & STOCK */}
      {activeTab === "batches" ? (
        <>
          <div className="table-toolbar compact-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by batch number or medicine name..." />
          </div>
          <DataTable
            rows={batchRows}
            columns={[
              { key: "batchNumber", header: "Batch No", render: (item) => <strong>{item.batchNumber}</strong> },
              { key: "medicine", header: "Medicine", render: (item) => item.medicineId?.name || "Unknown" },
              { key: "category", header: "Category", render: (item) => item.medicineId?.category || "-" },
              {
                key: "quantity",
                header: "Stock Qty",
                render: (item) => (
                  <span style={{ fontWeight: 600, color: item.quantity === 0 ? "var(--danger)" : "inherit" }}>
                    {item.quantity} {item.medicineId?.unit || "units"}
                  </span>
                )
              },
              { key: "purchasePrice", header: "Purchase Cost", render: (item) => money(item.purchasePrice) },
              { key: "manufactureDate", header: "Mfg Date", render: (item) => dateOnly(item.manufactureDate) },
              { key: "expiryDate", header: "Expiry Date", render: (item) => dateOnly(item.expiryDate) },
              {
                key: "expiryStatus",
                header: "Expiry Status",
                render: (item) => {
                  if (item.expiryStatus === "expired") {
                    return <span style={{ color: "var(--danger)", fontWeight: 600, background: "var(--danger-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>Expired</span>;
                  }
                  if (item.expiryStatus === "expiring_soon") {
                    return <span style={{ color: "var(--warning)", fontWeight: 600, background: "var(--warning-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>Expiring Soon</span>;
                  }
                  return <span style={{ color: "var(--success)", fontWeight: 600, background: "var(--success-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>Valid</span>;
                }
              },
              {
                key: "actions",
                header: "Actions",
                render: (item) => (
                  <button className="table-link-button" type="button" onClick={() => openStandardModal("batch", item)}>
                    <Edit2 size={14} /> Adjust Stock / Edit
                  </button>
                )
              }
            ]}
          />
        </>
      ) : null}

      {/* TAB 3: SUPPLIERS */}
      {activeTab === "suppliers" ? (
        <>
          <div className="table-toolbar compact-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, maxWidth: "360px" }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search suppliers by name, phone, address..." />
            </div>
            <button type="button" onClick={() => openStandardModal("supplier")} className="button-primary">
              <Plus size={16} /> Add Supplier
            </button>
          </div>
          <DataTable
            rows={supplierRows}
            columns={[
              { key: "name", header: "Supplier Name", render: (item) => <strong>{item.name}</strong> },
              { key: "phone", header: "Phone" },
              { key: "email", header: "Email", render: (item) => item.email || "-" },
              { key: "address", header: "Address" },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              {
                key: "actions",
                header: "Actions",
                render: (item) => (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="table-link-button" type="button" onClick={() => openStandardModal("supplier", item)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    {item.status === "active" ? (
                      <button className="table-link-button" type="button" onClick={() => handleDeactivateSupplier(item)} style={{ color: "var(--danger)" }}>
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                )
              }
            ]}
          />
        </>
      ) : null}

      {/* TAB 4: PURCHASES */}
      {activeTab === "purchases" ? (
        <>
          <div className="table-toolbar compact-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, maxWidth: "360px" }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search purchase records by supplier or drug..." />
            </div>
            <button type="button" onClick={() => openPurchaseModal()} className="button-primary">
              <ArrowDownCircle size={16} /> Record New Purchase
            </button>
          </div>
          <DataTable
            rows={purchaseRows}
            columns={[
              { key: "purchasedAt", header: "Purchase Date", render: (item) => dateOnly(item.purchasedAt) },
              { key: "supplier", header: "Supplier", render: (item) => <strong>{item.supplierId?.name || "Unknown"}</strong> },
              { key: "medicine", header: "Medicine", render: (item) => item.medicineId?.name || "Unknown" },
              { key: "batch", header: "Batch No", render: (item) => item.batchId?.batchNumber || "-" },
              { key: "quantity", header: "Qty Purchased", render: (item) => `${item.quantity} ${item.medicineId?.unit || "units"}` },
              { key: "purchasePrice", header: "Unit Cost", render: (item) => money(item.purchasePrice) },
              { key: "totalCost", header: "Total Cost", render: (item) => <strong>{money(item.quantity * item.purchasePrice)}</strong> }
            ]}
          />
        </>
      ) : null}

      {/* TAB 5: ALERTS */}
      {activeTab === "alerts" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Summary Stat Cards */}
          <div className="manager-summary-grid">
            <div style={{ borderLeft: "4px solid var(--danger)" }}>
              <AlertCircle size={24} color="var(--danger)" />
              <strong>{alerts.lowStock.length}</strong>
              <span>Medicines Below Reorder Level</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--warning)" }}>
              <AlertTriangle size={24} color="var(--warning)" />
              <strong>{alerts.expiring.length}</strong>
              <span>Batches Expiring in 60 Days / Expired</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--brand-500)" }}>
              <Truck size={24} color="var(--brand-500)" />
              <strong>{suppliers.length}</strong>
              <span>Active Suppliers for Reordering</span>
            </div>
          </div>

          {/* Section: Low Stock Table */}
          <div style={{ background: "#fff", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={18} color="var(--danger)" /> Low Stock Inventory Shortages
              </h3>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>Requires immediate reordering from suppliers</span>
            </div>

            {alerts.lowStock.length === 0 ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                All medicines are currently above their reorder levels. Inventory is healthy.
              </p>
            ) : (
              <DataTable
                rows={alerts.lowStock}
                columns={[
                  { key: "name", header: "Medicine Name", render: (item) => <strong>{item.name}</strong> },
                  { key: "category", header: "Category" },
                  {
                    key: "currentStock",
                    header: "Available Stock",
                    render: (item) => (
                      <span style={{ fontWeight: 700, color: item.isOutOfStock ? "var(--danger)" : "var(--warning)" }}>
                        {item.currentStock} {item.unit}s
                      </span>
                    )
                  },
                  { key: "reorderLevel", header: "Reorder Threshold", render: (item) => `${item.reorderLevel} ${item.unit}s` },
                  {
                    key: "deficit",
                    header: "Deficit",
                    render: (item) => (
                      <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                        -{item.deficit} {item.unit}s
                      </span>
                    )
                  },
                  {
                    key: "severity",
                    header: "Shortage Level",
                    render: (item) => (
                      item.isOutOfStock ? (
                        <span style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "3px 10px", borderRadius: "12px", fontWeight: 700, fontSize: "12px" }}>
                          CRITICAL: OUT OF STOCK
                        </span>
                      ) : (
                        <span style={{ background: "var(--warning-bg)", color: "var(--warning)", padding: "3px 10px", borderRadius: "12px", fontWeight: 600, fontSize: "12px" }}>
                          LOW STOCK
                        </span>
                      )
                    )
                  },
                  {
                    key: "action",
                    header: "Action",
                    render: (item) => (
                      <button className="button-primary" type="button" onClick={() => openPurchaseModal(item)} style={{ padding: "4px 10px", fontSize: "12px" }}>
                        <ArrowDownCircle size={14} /> Reorder Stock
                      </button>
                    )
                  }
                ]}
              />
            )}
          </div>

          {/* Section: Expiry Alert Table */}
          <div style={{ background: "#fff", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} color="var(--warning)" /> Medicine Expiry & Wastage Tracking
              </h3>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>Batches expiring within 60 days or already expired</span>
            </div>

            {alerts.expiring.length === 0 ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                No batches are expiring in the next 60 days.
              </p>
            ) : (
              <DataTable
                rows={alerts.expiring}
                columns={[
                  { key: "batchNumber", header: "Batch No", render: (item) => <strong>{item.batchNumber}</strong> },
                  { key: "medicine", header: "Medicine Name" },
                  { key: "quantity", header: "Units at Risk", render: (item) => <strong>{item.quantity} {item.unit || "units"}</strong> },
                  { key: "valueAtRisk", header: "Value at Risk", render: (item) => money(item.valueAtRisk) },
                  { key: "expiryDate", header: "Expiry Date", render: (item) => dateOnly(item.expiryDate) },
                  {
                    key: "daysRemaining",
                    header: "Time to Expiry",
                    render: (item) => (
                      item.daysRemaining <= 0 ? (
                        <span style={{ color: "var(--danger)", fontWeight: 700, background: "var(--danger-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                          EXPIRED ({Math.abs(item.daysRemaining)} days ago)
                        </span>
                      ) : item.daysRemaining <= 30 ? (
                        <span style={{ color: "var(--danger)", fontWeight: 600, background: "var(--danger-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                          {item.daysRemaining} days left (Urgent)
                        </span>
                      ) : (
                        <span style={{ color: "var(--warning)", fontWeight: 600, background: "var(--warning-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                          {item.daysRemaining} days left
                        </span>
                      )
                    )
                  },
                  {
                    key: "actions",
                    header: "Action",
                    render: (item) => (
                      <button className="table-link-button" type="button" onClick={() => openStandardModal("batch", item)}>
                        <Edit2 size={14} /> Adjust / Quarantine
                      </button>
                    )
                  }
                ]}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* TAB 6: SALES & BILLS */}
      {activeTab === "sales" ? (
        <>
          <div className="table-toolbar compact-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, maxWidth: "360px" }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search sales by bill number or patient..." />
            </div>
            <button type="button" onClick={() => openPosModal()} className="button-primary">
              <ShoppingCart size={16} /> New Sale / Dispense
            </button>
          </div>
          <DataTable
            rows={salesRows}
            columns={[
              { key: "createdAt", header: "Date & Time", render: (item) => new Date(item.createdAt).toLocaleString("en-LK") },
              { key: "saleNumber", header: "Bill Number", render: (item) => <strong>{item.saleNumber || `PH-${item._id.slice(-6).toUpperCase()}`}</strong> },
              {
                key: "patient",
                header: "Patient",
                render: (item) => [item.patientId?.firstName, item.patientId?.lastName].filter(Boolean).join(" ") || "Walk-in Patient"
              },
              { key: "items", header: "Items Dispensed", render: (item) => `${item.items?.length || 0} item(s)` },
              { key: "total", header: "Bill Total", render: (item) => <strong>{money(item.total)}</strong> },
              { key: "paymentStatus", header: "Payment", render: () => <span style={{ color: "var(--success)", fontWeight: 700, background: "var(--success-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>PAID</span> },
              {
                key: "actions",
                header: "Actions",
                render: (item) => (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="table-link-button" type="button" onClick={() => handleViewBill(item)}>
                      <FileText size={14} /> View & Print
                    </button>
                    <button className="table-link-button" type="button" onClick={() => handleDownloadBillFile(item)}>
                      <Download size={14} /> Txt
                    </button>
                  </div>
                )
              }
            ]}
          />
        </>
      ) : null}

      {/* TAB 7: REPORTS & ANALYTICS */}
      {activeTab === "reports" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Period Selector Tabs */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink-700)" }}>Report Timeframe:</span>
            {["all", "today", "week", "month"].map((p) => (
              <button
                key={p}
                type="button"
                className={reportPeriod === p ? "button-primary" : "button-secondary"}
                onClick={() => setReportPeriod(p)}
                style={{ padding: "6px 14px", fontSize: "13px", textTransform: "capitalize" }}
              >
                {p === "all" ? "All Time" : p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>

          {/* Key Metrics Grid */}
          <div className="manager-summary-grid">
            <div style={{ borderLeft: "4px solid var(--accent-emerald)" }}>
              <DollarSign size={24} color="var(--accent-emerald)" />
              <strong>{money(report.totalRevenue)}</strong>
              <span>Total Pharmacy Sales Revenue</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--accent-sky)" }}>
              <ShoppingCart size={24} color="var(--accent-sky)" />
              <strong>{report.totalSales}</strong>
              <span>Completed Transactions / Bills</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--accent-teal)" }}>
              <Package size={24} color="var(--accent-teal)" />
              <strong>{report.totalItemsSold || 0}</strong>
              <span>Total Drug Units Dispensed</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--accent-amber)" }}>
              <TrendingUp size={24} color="var(--accent-amber)" />
              <strong>{money(report.averageOrderValue || 0)}</strong>
              <span>Average Basket / Sale Value</span>
            </div>
          </div>

          {/* Top Selling Medicines Breakdown */}
          <div style={{ background: "#fff", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} color="var(--brand-600)" /> Top Selling Medicines by Revenue
            </h3>

            {(!report.topMedicines || report.topMedicines.length === 0) ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                No sales data recorded for the selected timeframe.
              </p>
            ) : (
              <DataTable
                rows={report.topMedicines}
                columns={[
                  { key: "medicine", header: "Medicine", render: (item) => <strong>{item.medicine}</strong> },
                  { key: "category", header: "Category", render: (item) => item.category || "-" },
                  { key: "quantity", header: "Quantity Sold", render: (item) => `${item.quantity} units` },
                  { key: "revenue", header: "Revenue Generated", render: (item) => <strong>{money(item.revenue)}</strong> },
                  {
                    key: "sharePercentage",
                    header: "Revenue Share",
                    render: (item) => (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "140px" }}>
                        <div style={{ flex: 1, height: "8px", background: "var(--line-light)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, item.sharePercentage || 0)}%`, height: "100%", background: "var(--brand-500)", borderRadius: "4px" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>{item.sharePercentage || 0}%</span>
                      </div>
                    )
                  }
                ]}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* MODAL 1: MEDICINE (ADD / EDIT) */}
      {/* ========================================================================= */}
      <Modal
        open={modal.type === "medicine"}
        title={modal.record ? "Update Medicine Record" : "Add New Medicine"}
        subtitle={modal.record ? "Modify pharmaceutical specifications, pricing, and stock thresholds." : "Register a new medicine item in the dispensary catalog."}
        onClose={() => setModal({ type: null, record: null })}
      >
        <form onSubmit={handleSubmit(submitStandard)}>
          <div className="form-section-title" style={{ marginTop: 0 }}>Medicine Specifications</div>
          <div className="form-grid">
            <FormInput label="Medicine Name" placeholder="e.g. Paracetamol 500mg" error={errors.name?.message} {...register("name")} />
            <FormSelect label="Category" error={errors.category?.message} {...register("category")}>
              <option value="">Select Category</option>
              {MEDICINE_CATEGORIES.map((cat) => (
                <option value={cat} key={cat}>{cat}</option>
              ))}
            </FormSelect>
            <FormInput label="Unit of Measurement" placeholder="tablet, capsule, bottle, syrup" error={errors.unit?.message} {...register("unit")} />
            <FormSelect label="Status" error={errors.status?.message} {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
          </div>

          <div className="form-section-title">Pricing & Inventory Controls</div>
          <div className="form-grid">
            <FormInput label="Selling Price (Rs.)" placeholder="15.00" type="number" min="0" step="0.01" error={errors.price?.message} {...register("price")} />
            <FormInput label="Reorder Threshold" placeholder="100" type="number" min="0" step="1" error={errors.reorderLevel?.message} {...register("reorderLevel")} />
          </div>

          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busy}>
              <CheckCircle2 size={16} /> {busy ? "Saving..." : "Save Medicine"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: BATCH (RECEIVE / EDIT STOCK) */}
      {/* ========================================================================= */}
      <Modal
        open={modal.type === "batch"}
        title={modal.record ? "Adjust Stock / Update Batch" : "Receive New Medicine Batch"}
        subtitle={modal.record ? "Update batch quantity, batch identifier, or expiration date." : "Record inbound medicine batch with tracking code and shelf life."}
        onClose={() => setModal({ type: null, record: null })}
      >
        <form onSubmit={handleSubmit(submitStandard)}>
          <div className="form-section-title" style={{ marginTop: 0 }}>Batch Identification</div>
          <div className="form-grid">
            <FormSelect label="Medicine" error={errors.medicineId?.message} {...register("medicineId")}>
              <option value="">Select Medicine</option>
              {medicines.map((m) => (
                <option value={m._id} key={m._id}>{m.name} ({m.category})</option>
              ))}
            </FormSelect>
            <FormInput label="Batch Number" placeholder="PARA-LK-001" sanitize={stripNonBatch} error={errors.batchNumber?.message} {...register("batchNumber")} />
          </div>

          <div className="form-section-title">Stock & Procurement</div>
          <div className="form-grid">
            <FormInput label="Quantity in Stock" placeholder="100" type="number" min="0" step="1" error={errors.quantity?.message} {...register("quantity")} />
            <FormInput label="Purchase Price (Rs.)" placeholder="10.50" type="number" min="0" step="0.01" error={errors.purchasePrice?.message} {...register("purchasePrice")} />
            <FormInput label="Manufacture Date" type="date" error={errors.manufactureDate?.message} {...register("manufactureDate")} />
            <FormInput label="Expiry Date" type="date" error={errors.expiryDate?.message} {...register("expiryDate")} />
          </div>

          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busy}>
              <CheckCircle2 size={16} /> {busy ? "Saving..." : "Save Batch"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: SUPPLIER (ADD / EDIT) */}
      {/* ========================================================================= */}
      <Modal
        open={modal.type === "supplier"}
        title={modal.record ? "Update Supplier Information" : "Add Medicine Supplier"}
        subtitle={modal.record ? "Update supplier contact information and active vendor status." : "Register an authorized pharmaceutical distributor for procurement."}
        onClose={() => setModal({ type: null, record: null })}
      >
        <form onSubmit={handleSubmit(submitStandard)}>
          <div className="form-section-title" style={{ marginTop: 0 }}>Supplier Profile</div>
          <div className="form-grid">
            <FormInput label="Supplier / Company Name" placeholder="State Pharmaceuticals Corp" sanitize={stripDigits} error={errors.name?.message} {...register("name")} />
            <FormInput label="Phone Number" placeholder="+94 11 232 8262" inputMode="tel" sanitize={stripNonPhone} error={errors.phone?.message} {...register("phone")} />
            <FormInput label="Email Address (Optional)" placeholder="supplies@spc.lk" type="email" error={errors.email?.message} {...register("email")} />
            <FormSelect label="Status" error={errors.status?.message} {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
          </div>
          <div style={{ marginTop: "14px" }}>
            <FormInput label="Office / Warehouse Address" placeholder="No. 75, Sir Baron Jayathilaka Mawatha, Colombo 01" error={errors.address?.message} {...register("address")} />
          </div>

          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busy}>
              <CheckCircle2 size={16} /> {busy ? "Saving..." : "Save Supplier"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD PURCHASE FROM SUPPLIER */}
      {/* ========================================================================= */}
      <Modal
        open={modal.type === "purchase"}
        title="Record Medicine Purchase from Supplier"
        subtitle="Log newly received stock deliveries from verified pharmaceutical suppliers."
        onClose={() => setModal({ type: null, record: null })}
      >
        <form onSubmit={handlePurchaseSubmit}>
          <div className="form-section-title" style={{ marginTop: 0 }}>Vendor & Drug Selection</div>
          <div className="form-grid">
            <FormSelect
              label="Supplier"
              value={purchaseSupplierId}
              onChange={(e) => setPurchaseSupplierId(e.target.value)}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.filter((s) => s.status === "active").map((s) => (
                <option value={s._id} key={s._id}>{s.name} ({s.phone})</option>
              ))}
            </FormSelect>

            <FormSelect
              label="Medicine"
              value={purchaseMedId}
              onChange={(e) => {
                setPurchaseMedId(e.target.value);
                const m = medicines.find((x) => x._id === e.target.value);
                if (m) setPurchasePrice(Math.round(m.price * 0.7));
              }}
              required
            >
              <option value="">Select Medicine</option>
              {medicines.filter((m) => m.status === "active").map((m) => (
                <option value={m._id} key={m._id}>{m.name} ({m.category})</option>
              ))}
            </FormSelect>
          </div>

          <div style={{ margin: "16px 0 10px" }}>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={purchaseIsNewBatch}
                onChange={(e) => setPurchaseIsNewBatch(e.target.checked)}
              />
              <span>This is a NEW delivery batch (create new batch record)</span>
            </label>
          </div>

          <div className="form-section-title">Batch & Stock Details</div>
          <div className="form-grid">
            {purchaseIsNewBatch ? (
              <>
                <FormInput
                  label="New Batch Number"
                  placeholder="e.g. BATCH-2026-001"
                  value={purchaseBatchNumber}
                  onChange={(e) => setPurchaseBatchNumber(e.target.value)}
                  sanitize={stripNonBatch}
                  required
                />
                <FormInput
                  label="Manufacture Date"
                  type="date"
                  value={purchaseMfgDate}
                  onChange={(e) => setPurchaseMfgDate(e.target.value)}
                  required
                />
                <FormInput
                  label="Expiry Date"
                  type="date"
                  value={purchaseExpDate}
                  onChange={(e) => setPurchaseExpDate(e.target.value)}
                  required
                />
              </>
            ) : (
              <FormSelect
                label="Existing Batch to Top Up"
                value={purchaseBatchId}
                onChange={(e) => setPurchaseBatchId(e.target.value)}
                required
              >
                <option value="">Select Batch</option>
                {batches
                  .filter((b) => (b.medicineId?._id || b.medicineId) === purchaseMedId)
                  .map((b) => (
                    <option value={b._id} key={b._id}>
                      {b.batchNumber} (Current Stock: {b.quantity})
                    </option>
                  ))}
              </FormSelect>
            )}

            <FormInput
              label="Purchase Quantity"
              type="number"
              min="1"
              step="1"
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(e.target.value)}
              required
            />

            <FormInput
              label="Unit Purchase Cost (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: "18px", padding: "14px 18px", background: "var(--brand-50)", border: "1.5px solid var(--brand-200)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "var(--brand-900)", fontSize: "0.92rem" }}>Estimated Total Purchase Cost:</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--brand-800)" }}>{money(Number(purchaseQty || 0) * Number(purchasePrice || 0))}</strong>
          </div>

          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busy}>
              <ArrowDownCircle size={16} /> {busy ? "Recording..." : "Record Purchase & Increase Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: PHARMACY POS / DISPENSING */}
      {/* ========================================================================= */}
      <Modal
        open={modal.type === "pos"}
        title="Pharmacy Point of Sale & Dispensing Counter"
        subtitle="Dispense medicines to walk-in or registered patients and link doctor prescriptions."
        onClose={() => setModal({ type: null, record: null })}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Patient & Prescription Link Section */}
          <div className="pos-card pos-card-highlight">
            <div className="pos-type-selector">
              <label className={`pos-type-pill ${posPatientType === "walk_in" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="posPatientType"
                  value="walk_in"
                  checked={posPatientType === "walk_in"}
                  onChange={() => {
                    setPosPatientType("walk_in");
                    setPosPatientId("");
                    setPosPrescriptionId("");
                  }}
                />
                <UserCheck size={16} />
                <span>Walk-in Patient</span>
              </label>
              <label className={`pos-type-pill ${posPatientType === "registered" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="posPatientType"
                  value="registered"
                  checked={posPatientType === "registered"}
                  onChange={() => setPosPatientType("registered")}
                />
                <Users size={16} />
                <span>Registered Patient</span>
              </label>
            </div>

            {posPatientType === "registered" ? (
              <div className="form-grid">
                <FormSelect
                  label="Select Patient"
                  value={posPatientId}
                  onChange={(e) => {
                    setPosPatientId(e.target.value);
                    const patientRx = prescriptions.find((r) => (r.patientId?._id || r.patientId) === e.target.value);
                    if (patientRx) setPosPrescriptionId(patientRx._id);
                  }}
                >
                  <option value="">Choose Patient</option>
                  {patients.map((p) => (
                    <option value={p._id} key={p._id}>
                      {p.firstName} {p.lastName} ({p.phone || p.email})
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  label="Doctor Prescription (Optional E2 Link)"
                  value={posPrescriptionId}
                  onChange={(e) => {
                    setPosPrescriptionId(e.target.value);
                    const selectedRx = prescriptions.find((r) => r._id === e.target.value);
                    if (selectedRx && selectedRx.patientId?._id) {
                      setPosPatientId(selectedRx.patientId._id);
                    }
                  }}
                >
                  <option value="">No Prescription / Direct Sale</option>
                  {prescriptions
                    .filter((r) => !posPatientId || (r.patientId?._id || r.patientId) === posPatientId)
                    .map((r) => (
                      <option value={r._id} key={r._id}>
                        Dr. {r.doctorId?.lastName || "Doctor"} - {r.items?.map((i) => i.medicineName).join(", ")}
                      </option>
                    ))}
                </FormSelect>
              </div>
            ) : null}

            {/* Prescribed Items helper banner */}
            {posPrescriptionId ? (
              <div className="pos-rx-banner">
                <strong>Linked Doctor Prescription:</strong>
                <div className="pos-rx-pills">
                  {prescriptions.find((r) => r._id === posPrescriptionId)?.items?.map((i, idx) => (
                    <span className="pos-rx-tag" key={idx}>
                      {i.medicineName} &bull; {i.dosage} &bull; {i.frequency}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Add Medicine to Cart Section */}
          <div className="pos-card">
            <div className="form-section-title" style={{ marginTop: 0 }}>Add Medicine To Cart</div>
            <div className="pos-add-grid">
              <FormSelect
                label="Medicine"
                value={posMedId}
                onChange={(e) => {
                  setPosMedId(e.target.value);
                  const avail = batches.filter((b) => (b.medicineId?._id || b.medicineId) === e.target.value && b.quantity > 0 && b.expiryStatus !== "expired");
                  setPosBatchId(avail[0]?._id || "");
                }}
              >
                <option value="">Select Medicine</option>
                {medicines.filter((m) => m.status === "active").map((m) => (
                  <option value={m._id} key={m._id}>
                    {m.name} ({m.category}) - {money(m.price)}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Available Batch"
                value={posBatchId}
                onChange={(e) => setPosBatchId(e.target.value)}
              >
                <option value="">Select Batch</option>
                {batches
                  .filter((b) => (b.medicineId?._id || b.medicineId) === posMedId && b.quantity > 0 && b.expiryStatus !== "expired")
                  .map((b) => (
                    <option value={b._id} key={b._id}>
                      {b.batchNumber} (Stock: {b.quantity} {b.medicineId?.unit || "units"}, Exp: {dateOnly(b.expiryDate)})
                    </option>
                  ))}
              </FormSelect>

              <FormInput
                label="Qty"
                type="number"
                min="1"
                step="1"
                value={posQty}
                onChange={(e) => setPosQty(e.target.value)}
              />

              <button
                type="button"
                onClick={handleAddToCart}
                className="button-primary"
                style={{ height: "46px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Cart Table */}
          <div className="pos-cart-wrap">
            <table className="data-table" style={{ width: "100%", margin: 0 }}>
              <thead>
                <tr>
                  <th>Medicine Item</th>
                  <th>Batch Number</th>
                  <th style={{ textAlign: "center" }}>Qty Dispensed</th>
                  <th style={{ textAlign: "right" }}>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Line Total</th>
                  <th style={{ width: "40px" }}></th>
                </tr>
              </thead>
              <tbody>
                {posCart.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "28px", color: "var(--muted)", fontStyle: "italic" }}>
                      No items added to cart yet. Select a medicine and batch above.
                    </td>
                  </tr>
                ) : (
                  posCart.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--brand-900)" }}>{item.medicineName}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>Unit: {item.unit}</div>
                      </td>
                      <td>
                        <span className="pos-rx-tag">{item.batchNumber}</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {item.quantity} {item.unit}s
                      </td>
                      <td style={{ textAlign: "right" }}>{money(item.unitPrice)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--brand-900)" }}>{money(item.lineTotal)}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="table-link-button"
                          style={{ color: "var(--danger)" }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Cart Total Summary */}
            <div className="pos-total-banner">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: 600 }}>Items in Cart:</span>
                <span style={{ background: "var(--brand-100)", color: "var(--brand-800)", padding: "2px 10px", borderRadius: "12px", fontWeight: 700, fontSize: "0.85rem" }}>
                  {posCart.length}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ fontSize: "0.95rem", color: "var(--ink-700)", fontWeight: 700 }}>Grand Total:</span>
                <span className="pos-total-badge">{money(posGrandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
            <button
              className="button-primary"
              type="button"
              onClick={handleCheckoutSale}
              disabled={busy || posCart.length === 0}
              style={{ minHeight: "46px", padding: "0 24px", fontSize: "0.95rem" }}
            >
              <ShoppingCart size={18} /> {busy ? "Processing Sale..." : "Complete Sale & Print Bill"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: INTERACTIVE BILL PREVIEW & PRINT */}
      {/* ========================================================================= */}
      <Modal
        open={Boolean(selectedBill)}
        title="Pharmacy Bill & Receipt"
        subtitle="Official dispensary sale record and verified payment receipt."
        onClose={() => setSelectedBill(null)}
      >
        {selectedBill ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Printable Receipt Box */}
            <div id="printable-pharmacy-bill" className="bill-preview-card">
              <div className="bill-preview-header">
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand-900)", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  HEALTH GUARD MEDICAL CENTER
                </h3>
                <p style={{ margin: "0 0 4px 0", fontSize: "0.88rem", fontWeight: 600, color: "var(--brand-700)" }}>
                  Pharmacy & Dispensary Services
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                  No. 128, Galle Road, Colombo 03 &bull; Hotline: +94 11 2555000
                </p>
              </div>

              <div className="bill-preview-meta">
                <div><strong>Bill Reference:</strong> {selectedBill.saleNumber}</div>
                <div><strong>Issued Date:</strong> {new Date(selectedBill.billIssuedAt || selectedBill.createdAt).toLocaleString("en-LK")}</div>
                <div><strong>Patient:</strong> {[selectedBill.patientId?.firstName, selectedBill.patientId?.lastName].filter(Boolean).join(" ") || "Walk-in Patient"}</div>
                <div><strong>Dispensed By:</strong> {[selectedBill.soldBy?.firstName, selectedBill.soldBy?.lastName].filter(Boolean).join(" ") || "Pharmacist"}</div>
              </div>

              <table className="data-table" style={{ width: "100%", fontSize: "0.88rem", marginBottom: "16px" }}>
                <thead>
                  <tr>
                    <th>Medicine Item</th>
                    <th>Batch</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.medicineId?.name || "Medicine"}</td>
                      <td><span className="pos-rx-tag">{item.batchId?.batchNumber || "-"}</span></td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{money(item.unitPrice)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{money(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: "right", borderTop: "1.5px solid var(--line)", paddingTop: "12px" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-900)" }}>
                  TOTAL PAID: <span style={{ color: "var(--accent-emerald)" }}>{money(selectedBill.total)}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "4px" }}>
                  Payment Method: Cash / Card &bull; Status: Verified & Completed
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "20px", borderTop: "1px dashed var(--line)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--muted)" }}>
                Thank you for choosing Health Guard Medical Center. We wish you good health!
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: "space-between" }}>
              <button
                className="button-secondary"
                type="button"
                onClick={() => handleDownloadBillFile(selectedBill)}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={16} /> Download Text
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => setSelectedBill(null)}
                >
                  Close
                </button>
                <button
                  className="button-primary"
                  type="button"
                  onClick={() => window.print()}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Printer size={16} /> Print Bill
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
};
