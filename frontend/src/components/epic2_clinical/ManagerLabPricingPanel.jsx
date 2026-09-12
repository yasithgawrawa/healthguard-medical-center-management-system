import { DollarSign, Edit3, FlaskConical, Plus, Search, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clinicalApi } from "../../services/clinicalApi.js";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";

const money = (val) => `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ManagerLabPricingPanel = () => {
  const [labTests, setLabTests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState("lab"); // 'lab' | 'doctors'
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ type: null, record: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [editPrice, setEditPrice] = useState("");
  const [editUrgentPrice, setEditUrgentPrice] = useState("");
  const [editCategory, setEditCategory] = useState("Hematology");
  const [newTestName, setNewTestName] = useState("");
  const [editDoctorFee, setEditDoctorFee] = useState("");

  const load = async () => {
    try {
      const [tests, docs] = await Promise.all([
        clinicalApi.listLabTests().catch(() => []),
        clinicalApi.listDoctors().catch(() => [])
      ]);
      setLabTests(tests || []);
      setDoctors(docs || []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load pricing data" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openLabModal = (test) => {
    setEditPrice(test ? test.price : "");
    setEditUrgentPrice(test ? test.urgentPrice || Math.round(test.price * 1.4) : "");
    setEditCategory(test ? test.category || "Routine Investigation" : "Routine Investigation");
    setNewTestName(test ? test.testName : "");
    setModal({ type: test ? "edit-lab" : "new-lab", record: test });
  };

  const openDoctorModal = (doc) => {
    setEditDoctorFee(doc.consultationFee || 1500);
    setModal({ type: "edit-doctor", record: doc });
  };

  const saveLabPrice = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (modal.type === "new-lab") {
        if (!newTestName || !editPrice) {
          setToast({ type: "error", message: "Test name and price are required" });
          setBusy(false);
          return;
        }
        await clinicalApi.createLabTest({
          testName: newTestName,
          category: editCategory,
          price: Number(editPrice),
          urgentPrice: Number(editUrgentPrice || Math.round(Number(editPrice) * 1.4))
        });
        setToast({ type: "success", message: `Added ${newTestName} to laboratory pricing catalog` });
      } else {
        await clinicalApi.updateLabTestPrice(modal.record._id, {
          price: Number(editPrice),
          urgentPrice: Number(editUrgentPrice || Math.round(Number(editPrice) * 1.4)),
          category: editCategory
        });
        setToast({ type: "success", message: `Updated pricing for ${modal.record.testName}` });
      }
      setModal({ type: null, record: null });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to save lab test pricing" });
    } finally {
      setBusy(false);
    }
  };

  const saveDoctorFee = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fee = Number(editDoctorFee);
      if (isNaN(fee) || fee < 0) {
        setToast({ type: "error", message: "Please enter a valid consultation fee" });
        setBusy(false);
        return;
      }
      await clinicalApi.updateDoctorFee({
        doctorId: modal.record._id,
        consultationFee: fee
      });
      setToast({ type: "success", message: `Updated consultation fee for Dr. ${modal.record.firstName} ${modal.record.lastName} to ${money(fee)}` });
      setModal({ type: null, record: null });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Failed to update doctor fee" });
    } finally {
      setBusy(false);
    }
  };

  const filteredLabTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return labTests.filter((t) => !q || t.testName.toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q));
  }, [labTests, search]);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((d) => !q || [d.firstName, d.lastName, d.email].join(" ").toLowerCase().includes(q));
  }, [doctors, search]);

  return (
    <section className="e1-panel" id="manager-tariffs">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div>
          <h2>Clinical Tariffs & Investigation Pricing</h2>
          <p>Manager controls for Laboratory Investigation rates and Doctor Channelling fees.</p>
        </div>
        <div className="inline-actions">
          {activeTab === "lab" ? (
            <button className="button-primary" type="button" onClick={() => openLabModal(null)}>
              <Plus size={16} /> Add Lab Investigation
            </button>
          ) : null}
        </div>
      </div>

      <div className="e1-tabbar">
        <button className={activeTab === "lab" ? "active" : ""} type="button" onClick={() => setActiveTab("lab")}>
          Laboratory Test Prices ({labTests.length})
        </button>
        <button className={activeTab === "doctors" ? "active" : ""} type="button" onClick={() => setActiveTab("doctors")}>
          Doctor Consultation Fees ({doctors.length})
        </button>
      </div>

      <div className="table-toolbar compact-toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder={activeTab === "lab" ? "Search lab test name or category..." : "Search doctor name..."} />
      </div>

      {activeTab === "lab" ? (
        <DataTable
          rows={filteredLabTests}
          columns={[
            {
              key: "testName",
              header: "Investigation / Test Name",
              render: (item) => (
                <div>
                  <strong style={{ color: "#0f172a", fontSize: "0.86rem" }}>{item.testName}</strong>
                  {item.description ? <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.description}</div> : null}
                </div>
              )
            },
            {
              key: "category",
              header: "Category",
              render: (item) => (
                <span style={{ fontSize: "0.76rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", color: "#334155", fontWeight: 500 }}>
                  {item.category || "Routine"}
                </span>
              )
            },
            {
              key: "price",
              header: "Standard Price",
              render: (item) => (
                <span style={{ fontWeight: 700, color: "#166534", fontSize: "0.88rem" }}>
                  {money(item.price)}
                </span>
              )
            },
            {
              key: "urgentPrice",
              header: "Urgent / Priority Price",
              render: (item) => (
                <span style={{ fontWeight: 600, color: "#ea580c", fontSize: "0.85rem" }}>
                  {money(item.urgentPrice || Math.round(item.price * 1.4))}
                </span>
              )
            },
            {
              key: "actions",
              header: "Actions",
              render: (item) => (
                <button
                  type="button"
                  className="table-link-button"
                  onClick={() => openLabModal(item)}
                  title="Adjust investigation price"
                >
                  <Edit3 size={13} style={{ display: "inline", marginRight: "3px" }} />
                  Adjust Price
                </button>
              )
            }
          ]}
          emptyText="No laboratory tests found."
        />
      ) : (
        <DataTable
          rows={filteredDoctors}
          columns={[
            {
              key: "doctor",
              header: "Doctor",
              render: (item) => (
                <div>
                  <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>Dr. {item.firstName} {item.lastName}</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.email}</div>
                </div>
              )
            },
            {
              key: "fee",
              header: "Current Channelling Fee",
              render: (item) => (
                <span style={{ fontWeight: 700, color: "#0284c7", fontSize: "0.9rem" }}>
                  {money(item.consultationFee || 1500)}
                </span>
              )
            },
            {
              key: "status",
              header: "Status",
              render: (item) => (
                <span style={{ fontSize: "0.75rem", color: item.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                  {item.status === "active" ? "Active Practicing" : "Inactive"}
                </span>
              )
            },
            {
              key: "actions",
              header: "Actions",
              render: (item) => (
                <button
                  type="button"
                  className="table-link-button"
                  onClick={() => openDoctorModal(item)}
                  title="Adjust doctor consultation fee"
                >
                  <Edit3 size={13} style={{ display: "inline", marginRight: "3px" }} />
                  Set Fee
                </button>
              )
            }
          ]}
          emptyText="No doctors found."
        />
      )}

      <Modal
        open={Boolean(modal.type)}
        title={
          modal.type === "new-lab"
            ? "Add Laboratory Investigation"
            : modal.type === "edit-lab"
            ? `Adjust Price: ${modal.record?.testName}`
            : `Set Fee: Dr. ${modal.record?.firstName} ${modal.record?.lastName}`
        }
        subtitle={modal.type === "edit-doctor" ? "This consultation charge will be billed to patient appointments." : "Configured rate will automatically apply to doctor test requests."}
        onClose={() => setModal({ type: null, record: null })}
      >
        {modal.type === "new-lab" || modal.type === "edit-lab" ? (
          <form onSubmit={saveLabPrice} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {modal.type === "new-lab" ? (
              <div className="form-grid">
                <FormInput
                  label="Investigation / Test Name"
                  placeholder="e.g. Thyroid Stimulating Hormone (TSH)"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  required
                />
                <FormSelect
                  label="Category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="Hematology">Hematology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Clinical Pathology">Clinical Pathology</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Serology">Serology</option>
                  <option value="Routine Investigation">Routine Investigation</option>
                </FormSelect>
              </div>
            ) : null}

            <div className="form-grid">
              <FormInput
                label="Standard Investigation Price (Rs.)"
                type="number"
                min="0"
                step="50"
                placeholder="850.00"
                value={editPrice}
                onChange={(e) => {
                  setEditPrice(e.target.value);
                  if (!editUrgentPrice) {
                    setEditUrgentPrice(Math.round(Number(e.target.value) * 1.4));
                  }
                }}
                required
              />
              <FormInput
                label="Urgent / Priority Price (Rs.)"
                type="number"
                min="0"
                step="50"
                placeholder="1200.00"
                value={editUrgentPrice}
                onChange={(e) => setEditUrgentPrice(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
              <button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save Pricing"}</button>
            </div>
          </form>
        ) : null}

        {modal.type === "edit-doctor" ? (
          <form onSubmit={saveDoctorFee} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-grid">
              <FormInput
                label="Doctor Consultation / Channelling Fee (Rs.)"
                type="number"
                min="0"
                step="100"
                placeholder="2000.00"
                value={editDoctorFee}
                onChange={(e) => setEditDoctorFee(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button className="button-secondary" type="button" onClick={() => setModal({ type: null, record: null })} disabled={busy}>Cancel</button>
              <button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Update Fee"}</button>
            </div>
          </form>
        ) : null}
      </Modal>
    </section>
  );
};
