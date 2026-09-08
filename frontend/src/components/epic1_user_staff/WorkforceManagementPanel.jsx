import { CalendarPlus, ClipboardList, Clock, Plane, UserCheck } from "lucide-react";
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
import { CenterLocationPanel } from "./CenterLocationPanel.jsx";
import { formatDate, formatTime, roleLabel, staffName } from "./e1Constants.js";
import { ShiftFormModal } from "./ShiftFormModal.jsx";

const PAGE_SIZE = 7;

const workedHours = (item) => {
  if (!item.checkInAt || !item.checkOutAt) return "-";
  const hours = (new Date(item.checkOutAt) - new Date(item.checkInAt)) / 36e5;
  return `${Math.max(hours, 0).toFixed(1)}h`;
};

const shiftDate = (item) => (item.startTime ? new Date(item.startTime).toISOString().slice(0, 10) : "");

export const WorkforceManagementPanel = () => {
  const [activeTab, setActiveTab] = useState("shifts");
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leave, setLeave] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [reviewLeave, setReviewLeave] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    try {
      const [staffData, shiftData, attendanceData, leaveData] = await Promise.all([
        e1Api.listWorkforceStaff(),
        e1Api.listShifts(),
        e1Api.listAttendance(),
        e1Api.listLeave()
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setShifts(Array.isArray(shiftData) ? shiftData : []);
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
    setPage(1);
  }, [activeTab, search, role, date]);

  const today = new Date().toISOString().slice(0, 10);
  const todayShifts = shifts.filter((item) => shiftDate(item) === today);
  const pendingLeave = leave.filter((item) => item.status === "pending");

  const staffTodayIds = new Set(todayShifts.map((item) => item.staffId?._id || item.staffId));
  const presentIds = new Set(attendance.filter((item) => item.workDate === today && item.checkInAt).map((item) => item.staffId?._id || item.staffId));
  const onLeaveIds = new Set(
    leave
      .filter((item) => item.status === "approved" && new Date(item.startDate) <= new Date() && new Date(item.endDate) >= new Date())
      .map((item) => item.staffId?._id || item.staffId)
  );

  const filteredRows = useMemo(() => {
    const source = activeTab === "shifts" ? shifts : activeTab === "attendance" ? attendance : leave;
    const query = search.trim().toLowerCase();
    return source.filter((item) => {
      const person = item.staffId && typeof item.staffId === "object" ? item.staffId : null;
      const text = [person?.employeeId, staffName(person), person?.role, person?.department, item.location, item.status, item.leaveType].join(" ").toLowerCase();
      const itemDate = activeTab === "shifts" ? shiftDate(item) : activeTab === "attendance" ? item.workDate : item.startDate?.slice(0, 10);
      return (!query || text.includes(query)) && (!role || person?.role === role) && (!date || itemDate === date);
    });
  }, [activeTab, shifts, attendance, leave, search, role, date]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const rows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createShift = async (payload) => {
    setBusy(true);
    try {
      await e1Api.createShift(payload);
      setShiftOpen(false);
      setToast({ type: "success", message: "Shift created successfully" });
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to create shift" });
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

  const shiftColumns = [
    { key: "employee", header: "Employee", render: (item) => staffName(item.staffId) },
    { key: "role", header: "Role", render: (item) => roleLabel(item.staffId?.role) },
    { key: "date", header: "Date", render: (item) => formatDate(item.startTime) },
    { key: "start", header: "Start", render: (item) => formatTime(item.startTime) },
    { key: "end", header: "End", render: (item) => formatTime(item.endTime) },
    { key: "location", header: "Location" },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
  ];

  const attendanceColumns = [
    { key: "date", header: "Date", render: (item) => formatDate(item.workDate) },
    { key: "employee", header: "Employee", render: (item) => staffName(item.staffId) },
    { key: "checkIn", header: "Check In", render: (item) => formatTime(item.checkInAt) },
    { key: "checkOut", header: "Check Out", render: (item) => formatTime(item.checkOutAt) },
    { key: "hours", header: "Worked Hours", render: workedHours },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
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

  const activeColumns = activeTab === "shifts" ? shiftColumns : activeTab === "attendance" ? attendanceColumns : leaveColumns;

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="dashboard-grid">
        <DashboardCard title="Staff Today" value={staffTodayIds.size} detail="Scheduled for duty today" icon={Clock} change="Shift management" />
        <DashboardCard title="Present" value={presentIds.size} detail="Checked in today" icon={UserCheck} change="Attendance" />
        <DashboardCard title="On Leave" value={onLeaveIds.size} detail="Approved current leave" icon={Plane} change="Leave calendar" />
        <DashboardCard title="Pending Leave Requests" value={pendingLeave.length} detail="Waiting for review" icon={ClipboardList} change="Approval queue" />
      </div>

      <section className="e1-panel" id="manager-workforce">
        <div className="e1-tabbar">
          {[
            ["dashboard", "Dashboard"],
            ["shifts", "Shift Management"],
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
            <div><strong>{todayShifts.length}</strong><span>scheduled shifts today</span></div>
            <div><strong>{attendance.filter((item) => item.status === "checked_in").length}</strong><span>currently checked in</span></div>
            <div><strong>{pendingLeave.length}</strong><span>leave requests need action</span></div>
          </div>
        ) : (
          <>
            <div className="e1-panel-header compact">
              <div>
                <h2>{activeTab === "shifts" ? "Shift Schedule" : activeTab === "attendance" ? "Attendance History" : "Leave Requests"}</h2>
                <p>{activeTab === "shifts" ? "Create and monitor staff duty schedules." : activeTab === "attendance" ? "Review staff attendance with search and filters." : "Approve or reject staff leave requests."}</p>
              </div>
              {activeTab === "shifts" ? (
                <button className="button-primary" type="button" onClick={() => setShiftOpen(true)}>
                  <CalendarPlus size={17} />
                  <span>Create Shift</span>
                </button>
              ) : null}
            </div>

            {activeTab === "shifts" ? <CenterLocationPanel onToast={setToast} /> : null}

            <div className="table-toolbar">
              <SearchBar value={search} onChange={setSearch} placeholder="Search employee, role, location or status" />
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

      <ShiftFormModal open={shiftOpen} staff={staff} busy={busy} onClose={() => setShiftOpen(false)} onSubmit={createShift} />

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
