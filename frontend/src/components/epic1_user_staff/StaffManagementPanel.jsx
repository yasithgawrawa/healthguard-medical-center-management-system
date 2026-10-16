import { Briefcase, MoreVertical, Shield, UserCheck, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../shared/ConfirmDialog.jsx";
import { DashboardCard } from "../shared/DashboardCard.jsx";
import { DataTable } from "../shared/DataTable.jsx";
import { FilterSelect } from "../shared/FilterSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { Pagination } from "../shared/Pagination.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { e1Api } from "../../services/e1Api.js";
import { formatDate, roleLabel, STAFF_ROLES, staffName } from "./e1Constants.js";
import { StaffFormModal } from "./StaffFormModal.jsx";

const PAGE_SIZE = 8;
// Staff Management | Frontend Logic | Format a numeric amount as Sri Lankan rupees for display.
const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

// Staff Management | Frontend Logic | List staff and coordinate staff creation, editing, and deactivation forms.
export const StaffManagementPanel = () => {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ type: null, staff: null });
  const [menuId, setMenuId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // View Staff | Frontend Logic | Fetch staff profiles and update the staff management list.
  const loadStaff = async () => {
    try {
      // View Staff | Data Loading | Call e1Api.listStaff for this feature and use the returned records
      const data = await e1Api.listStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load staff directory" });
    }
  };

  // Load workspace data on mount and whenever the effect dependencies change.
  useEffect(() => {
    loadStaff();
  }, []);

  // Synchronize component state or external data when the listed dependencies change.
  useEffect(() => {
    setPage(1);
  }, [search, role, department, status]);

  // Staff Management | Derived Data | Cache departments until the listed source values change.
  const departments = useMemo(
    () => [...new Set(staff.map((item) => item.department).filter(Boolean))].sort(),
    [staff]
  );

  // Staff Management | Derived Data | Cache filtered staff until the listed source values change.
  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((item) => {
      const values = [item.employeeId, staffName(item), item.userId?.email, item.role, item.department].join(" ").toLowerCase();
      return (
        (!query || values.includes(query)) &&
        (!role || item.role === role) &&
        (!department || item.department === department) &&
        (!status || item.status === status)
      );
    });
  }, [staff, search, role, department, status]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const visibleStaff = filteredStaff.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = staff.filter((item) => item.status === "active").length;
  const roleCount = new Set(staff.map((item) => item.role)).size;

  const [serverErrors, setServerErrors] = useState(null);

  // Add Staff | Submit Logic | Create or update the selected staff profile and refresh the staff list.
  // Update Staff | Submit Logic | Create or update the selected staff profile and refresh the staff list.
  const submitStaff = async (payload) => {
    setBusy(true);
    setServerErrors(null);
    try {
      if (modal.type === "edit") {
        // Update Staff | Submit Logic | Call e1Api.updateStaff for this feature.
        await e1Api.updateStaff(modal.staff._id, payload);
        setToast({ type: "success", message: "Staff updated successfully" });
      } else {
        // Add Staff | Submit Logic | Call e1Api.createStaff for this feature.
        await e1Api.createStaff(payload);
        setToast({ type: "success", message: "Staff created successfully" });
      }
      setModal({ type: null, staff: null });
      await loadStaff();
    } catch (error) {
      const resData = error.response?.data;
      let errorMsg = resData?.message || "Unable to save staff";
      if (resData?.errors && typeof resData.errors === "object") {
        setServerErrors(resData.errors);
        const detailed = Object.entries(resData.errors)
          .map(([key, err]) => `${key.replace(/^body\./, "")}: ${err}`)
          .join(" • ");
        if (detailed) {
          errorMsg = `Validation failed: ${detailed}`;
        }
      }
      setToast({ type: "error", message: errorMsg });
    } finally {
      setBusy(false);
    }
  };

  // Deactivate Staff | Frontend Logic | Mark the selected staff profile inactive through the staff API.
  const deactivateStaff = async () => {
    setBusy(true);
    try {
      // Deactivate Staff | Submit Logic | Call e1Api.deactivateStaff for this feature.
      await e1Api.deactivateStaff(modal.staff._id);
      setToast({ type: "success", message: `${staffName(modal.staff)} deactivated` });
      setModal({ type: null, staff: null });
      await loadStaff();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to deactivate staff" });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "employeeId", header: "Employee ID" },
    { key: "name", header: "Name", render: staffName },
    { key: "email", header: "Email", render: (item) => item.userId?.email || "-" },
    { key: "role", header: "Role", render: (item) => roleLabel(item.role) },
    { key: "department", header: "Department" },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    {
      key: "actions",
      header: "Actions",
      // Staff Management | Frontend Logic | Format this table cell using the current row's data and available actions.
      render: (item) => (
        <div className="row-actions">
          <button type="button" onClick={() => setMenuId(menuId === item._id ? null : item._id)} aria-label={`Actions for ${staffName(item)}`}>
            <MoreVertical size={18} />
          </button>
          {menuId === item._id ? (
            <div className="row-action-menu">
              <button type="button" onClick={() => setModal({ type: "view", staff: item })}>View</button>
              <button type="button" onClick={() => setModal({ type: "edit", staff: item })}>Edit</button>
              <button type="button" onClick={() => setModal({ type: "edit", staff: item })}>Change Role</button>
              <button type="button" onClick={() => setModal({ type: "deactivate", staff: item })} disabled={item.status === "inactive"}>Deactivate</button>
            </div>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="dashboard-grid">
        <DashboardCard title="Total Staff" value={staff.length} detail="Registered staff accounts" icon={Users} change="Read Staff" href="#staff-directory" actionLabel="Search directory" />
        <DashboardCard title="Active Staff" value={activeCount} detail="Can sign in and work" icon={UserCheck} change="Access enabled" href="#staff-directory" actionLabel="Review active users" />
        <DashboardCard title="Inactive Staff" value={staff.length - activeCount} detail="Historical profiles retained" icon={Briefcase} change="Access disabled" href="#staff-directory" actionLabel="Audit inactive users" priority={staff.length - activeCount > 0 ? "medium" : "normal"} />
        <DashboardCard title="User Roles" value={roleCount} detail="Assigned access groups" icon={Shield} change="Role assignment" href="#staff-directory" actionLabel="Manage access" />
      </div>

      <section className="e1-panel" id="staff-directory">
        <div className="e1-panel-header">
          <div>
            <h2>Staff Directory</h2>
            <p>Create Staff, Read Staff, Update Staff, Deactivate Staff and assign roles.</p>
          </div>
          <button className="button-primary" type="button" onClick={() => setModal({ type: "create", staff: null })}>
            <UserPlus size={17} />
            <span>Add Staff</span>
          </button>
        </div>

        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, role or employee ID" />
          <FilterSelect label="Role" value={role} onChange={setRole} options={STAFF_ROLES} />
          <FilterSelect label="Department" value={department} onChange={setDepartment} options={departments} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={["active", "inactive"]} />
        </div>

        <DataTable columns={columns} rows={visibleStaff} emptyText="No staff match the selected filters." />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </section>

      {/* Add Staff | Dialog | Connect this feature to its shared dialog and action handlers. */}
      {/* Update Staff | Dialog | Connect this feature to its shared dialog and action handlers. */}
      <StaffFormModal
        open={modal.type === "create" || modal.type === "edit"}
        mode={modal.type === "edit" ? "edit" : "create"}
        staff={modal.staff}
        existingStaff={staff}
        serverErrors={serverErrors}
        busy={busy}
        onClose={() => {
          setServerErrors(null);
          setModal({ type: null, staff: null });
        }}
        onSubmit={submitStaff}
      />

      {/* Deactivate Staff | Dialog | Connect this feature to its shared dialog and action handlers. */}
      <ConfirmDialog
        open={modal.type === "deactivate"}
        title={`Deactivate ${modal.staff ? staffName(modal.staff) : "staff member"}?`}
        message="Login access will be disabled, but historical staff, attendance, clinical and billing records will remain."
        confirmLabel="Deactivate"
        busy={busy}
        onCancel={() => setModal({ type: null, staff: null })}
        onConfirm={deactivateStaff}
      />

      <Modal
        open={modal.type === "view"}
        title={modal.staff ? staffName(modal.staff) : "Staff Details"}
        subtitle="Staff profile summary"
        onClose={() => setModal({ type: null, staff: null })}
      >
        {/* View Staff | Dialog | Group the fields or record details for this feature. */}
        {modal.staff ? (
          <div className="detail-grid">
            <div><span>Employee ID</span><strong>{modal.staff.employeeId}</strong></div>
            <div><span>Email</span><strong>{modal.staff.userId?.email || "-"}</strong></div>
            <div><span>Role</span><strong>{roleLabel(modal.staff.role)}</strong></div>
            <div><span>Department</span><strong>{modal.staff.department}</strong></div>
            <div><span>Employment Date</span><strong>{formatDate(modal.staff.employmentDate)}</strong></div>
            <div><span>Status</span><StatusBadge status={modal.staff.status} /></div>
            <div><span>Daily Pay</span><strong>{money(modal.staff.shiftRate || (modal.staff.baseSalary ? Number(modal.staff.baseSalary) / 26 : 0))}</strong></div>
            <div><span>Fixed Allowances</span><strong>{money(modal.staff.allowances)}</strong></div>
            <div><span>Fixed Deductions</span><strong>{money(modal.staff.deductions)}</strong></div>
          </div>
        ) : null}
      </Modal>
    </>
  );
};
