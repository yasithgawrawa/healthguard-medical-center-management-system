import { ClipboardList, Clock, Plane, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardCard } from "../shared/DashboardCard.jsx";
import { DataTable } from "../shared/DataTable.jsx";
import { FilterSelect } from "../shared/FilterSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { Pagination } from "../shared/Pagination.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { e1Api } from "../../services/e1Api.js";
import { DASHBOARD_COMMAND_EVENT } from "../../utils/dashboardCommands.js";
import { formatDate, formatTime, roleLabel, staffName } from "./e1Constants.js";

const PAGE_SIZE = 7;

const workedHours = (item) => {
  if (!item.checkInAt || !item.checkOutAt) return "-";
  const hours = (new Date(item.checkOutAt) - new Date(item.checkInAt)) / 36e5;
  return `${Math.max(hours, 0).toFixed(1)}h`;
};

export const WorkforceManagementPanel = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leave, setLeave] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [reviewLeave, setReviewLeave] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    try {
      const [staffData, attendanceData, leaveData] = await Promise.all([
        e1Api.listWorkforceStaff(),
        e1Api.listAttendance(),
        e1Api.listLeave()
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setLeave(Array.isArray(leaveData) ? leaveData : []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load workforce data" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleDashboardCommand = (event) => {
      const command = event.detail || {};
      if (command.workspace !== "workforce") return;
      if (command.tab) setActiveTab(command.tab);
      if (command.date !== undefined) setDate(command.date);
      if (command.role !== undefined) setRole(command.role);
      if (command.search !== undefined) setSearch(command.search);
    };

    window.addEventListener(DASHBOARD_COMMAND_EVENT, handleDashboardCommand);
    return () => window.removeEventListener(DASHBOARD_COMMAND_EVENT, handleDashboardCommand);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, role, date]);

  const today = new Date().toISOString().slice(0, 10);
  const pendingLeave = leave.filter((item) => item.status === "pending");

  const presentIds = new Set(attendance.filter((item) => item.workDate === today && item.checkInAt).map((item) => item.staffId?._id || item.staffId));
  const onLeaveIds = new Set(
    leave
      .filter((item) => item.status === "approved" && new Date(item.startDate) <= new Date() && new Date(item.endDate) >= new Date())
      .map((item) => item.staffId?._id || item.staffId)
  );

  const filteredRows = useMemo(() => {
    const source = activeTab === "attendance" ? attendance : leave;
    const query = search.trim().toLowerCase();
    return source.filter((item) => {
      const person = item.staffId && typeof item.staffId === "object" ? item.staffId : null;
      const text = [person?.employeeId, staffName(person), person?.role, person?.department, item.status, item.leaveType].join(" ").toLowerCase();
      const itemDate = activeTab === "attendance" ? item.workDate : item.startDate?.slice(0, 10);
      return (!query || text.includes(query)) && (!role || person?.role === role) && (!date || itemDate === date);
    });
  }, [activeTab, attendance, leave, search, role, date]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const rows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const checkoutAttendance = async (item) => {
    setBusy(true);
    try {
      await e1Api.checkOutAttendance(item._id);
      setToast({ type: "success", message: "Attendance checked out" });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to check out attendance" });
    } finally {
      setBusy(false);
    }
  };

  const submitLeaveReview = async (status) => {
    setBusy(true);
    try {
      await e1Api.reviewLeave(reviewLeave._id, { status, reviewNote: "" });
      setReviewLeave(null);
      setToast({ type: "success", message: `Leave request ${status}` });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to review leave request" });
    } finally {
      setBusy(false);
    }
  };

  const attendanceColumns = [
    { key: "date", header: "Date", render: (item) => formatDate(item.workDate) },
    { key: "employee", header: "Employee", render: (item) => staffName(item.staffId) },
    { key: "checkIn", header: "Check In", render: (item) => formatTime(item.checkInAt) },
    { key: "checkOut", header: "Check Out", render: (item) => formatTime(item.checkOutAt) },
    { key: "hours", header: "Worked Hours", render: workedHours },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (item) => item.status === "checked_in" ? (
        <button className="table-link-button" type="button" onClick={() => checkoutAttendance(item)} disabled={busy}>
          Check Out
        </button>
      ) : null
    }
  ];

  const leaveColumns = [
    { key: "employee", header: "Employee", render: (item) => staffName(item.staffId) },
    { key: "leaveType", header: "Leave Type", render: (item) => String(item.leaveType).replace(/_/g, " ") },
    { key: "dates", header: "Dates", render: (item) => `${formatDate(item.startDate)} - ${formatDate(item.endDate)}` },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <button className="table-link-button" type="button" onClick={() => setReviewLeave(item)}>
          Review
        </button>
      )
    }
  ];

  const activeColumns = activeTab === "attendance" ? attendanceColumns : leaveColumns;

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="dashboard-grid">
        <DashboardCard title="Active Staff" value={staff.length} detail="Available workforce profiles" icon={Clock} change="Simple attendance" href="#manager-workforce" command={{ workspace: "workforce", tab: "attendance", date: "", role: "", search: "" }} actionLabel="Open attendance" />
        <DashboardCard title="Present" value={presentIds.size} detail="Checked in today" icon={UserCheck} change="Attendance" href="#manager-workforce" command={{ workspace: "workforce", tab: "attendance", date: today, role: "", search: "" }} actionLabel="Review attendance" />
        <DashboardCard title="On Leave" value={onLeaveIds.size} detail="Approved current leave" icon={Plane} change="Leave calendar" href="#manager-workforce" command={{ workspace: "workforce", tab: "leave", date: "", role: "", search: "approved" }} actionLabel="Open leave calendar" />
        <DashboardCard title="Pending Leave Requests" value={pendingLeave.length} detail="Waiting for review" icon={ClipboardList} change="Approval queue" href="#manager-workforce" command={{ workspace: "workforce", tab: "leave", date: "", role: "", search: "pending" }} actionLabel={pendingLeave.length ? "Review requests" : "View leave"} priority={pendingLeave.length ? "high" : "normal"} />
      </div>

      <section className="e1-panel" id="manager-workforce">
        <div className="e1-tabbar">
          {[
            ["dashboard", "Dashboard"],
            ["attendance", "Attendance"],
            ["leave", "Leave Requests"]
          ].map(([key, label]) => (
            <button className={activeTab === key ? "active" : ""} type="button" onClick={() => setActiveTab(key)} key={key}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" ? (
          <div className="manager-summary-grid">
            <div><strong>{staff.length}</strong><span>active staff profiles</span></div>
            <div><strong>{attendance.filter((item) => item.status === "checked_in").length}</strong><span>currently checked in</span></div>
            <div><strong>{pendingLeave.length}</strong><span>leave requests need action</span></div>
          </div>
        ) : (
          <>
            <div className="e1-panel-header compact">
              <div>
                <h2>{activeTab === "attendance" ? "Attendance History" : "Leave Requests"}</h2>
                <p>{activeTab === "attendance" ? "Review staff check-ins and check-outs with search and filters." : "Approve or reject staff leave requests."}</p>
              </div>
            </div>

            <div className="table-toolbar">
              <SearchBar value={search} onChange={setSearch} placeholder="Search employee, role or status" />
              <FilterSelect label="Role" value={role} onChange={setRole} options={[...new Set(staff.map((item) => item.role))].map((item) => ({ value: item, label: roleLabel(item) }))} />
              <label className="filter-select">
                <span>Date</span>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
            </div>

            <DataTable columns={activeColumns} rows={rows} emptyText="No records match the selected filters." />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </section>

      <Modal
        open={Boolean(reviewLeave)}
        title="Review Leave Request"
        subtitle={reviewLeave ? `${staffName(reviewLeave.staffId)} - ${String(reviewLeave.leaveType).replace(/_/g, " ")}` : ""}
        onClose={() => setReviewLeave(null)}
      >
        {reviewLeave ? (
          <>
            <div className="detail-grid">
              <div><span>Dates</span><strong>{formatDate(reviewLeave.startDate)} - {formatDate(reviewLeave.endDate)}</strong></div>
              <div><span>Status</span><StatusBadge status={reviewLeave.status} /></div>
              <div className="detail-wide"><span>Reason</span><strong>{reviewLeave.reason}</strong></div>
            </div>
            <div className="modal-actions">
              <button className="button-secondary" type="button" onClick={() => setReviewLeave(null)} disabled={busy}>Close</button>
              <button className="button-secondary danger-action" type="button" onClick={() => submitLeaveReview("rejected")} disabled={busy || reviewLeave.status !== "pending"}>Reject</button>
              <button className="button-primary" type="button" onClick={() => submitLeaveReview("approved")} disabled={busy || reviewLeave.status !== "pending"}>Approve</button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
};
