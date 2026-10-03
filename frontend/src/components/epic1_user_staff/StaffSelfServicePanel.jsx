import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Clock, LogIn, LogOut, Plane, Printer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { e1Api } from "../../services/e1Api.js";
import { billingApi } from "../../services/billingApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { printPayslipPDF } from "../../utils/invoicePrintTemplate.js";
import { formatDate, formatTime, LEAVE_TYPES } from "./e1Constants.js";

const leaveRequestSchema = z
  .object({
    leaveType: z.string().min(1, "Leave type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(5, "Reason is required").max(300, "Reason is too long")
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    path: ["endDate"],
    message: "End date must be on or after start date"
  });

const workedHours = (item) => {
  if (!item.checkInAt || !item.checkOutAt) return "-";
  return `${Math.max((new Date(item.checkOutAt) - new Date(item.checkInAt)) / 36e5, 0).toFixed(1)}h`;
};

export const StaffSelfServicePanel = ({ isVisible, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const outletContext = useOutletContext();

  const isAttendanceActive =
    isVisible !== undefined
      ? isVisible
      : (outletContext?.activeHash === "#attendance-leave" ||
         outletContext?.activeHash === "#staff-self-service" ||
         location.hash === "#attendance-leave" ||
         location.hash === "#staff-self-service");

  const [attendance, setAttendance] = useState([]);
  const [leave, setLeave] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(leaveRequestSchema),
    mode: "onChange",
    defaultValues: { leaveType: "", startDate: "", endDate: "", reason: "" }
  });

  const load = async () => {
    try {
      const [attendanceData, leaveData, payrollData] = await Promise.all([
        e1Api.listMyAttendance(),
        e1Api.listMyLeave(),
        billingApi.payroll()
      ]);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setLeave(Array.isArray(leaveData) ? leaveData : []);
      setPayroll(Array.isArray(payrollData) ? payrollData : []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load staff self-service data" });
    }
  };

  useEffect(() => {
    if (isAttendanceActive) {
      load();
      const timer = setTimeout(() => {
        const el = document.getElementById("staff-self-service") || document.getElementById("attendance-leave");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isAttendanceActive]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      if (outletContext?.setActiveHash) {
        outletContext.setActiveHash("#work");
      }
      window.location.hash = "#work";
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = useMemo(
    () => attendance.find((item) => item.workDate === today) || attendance.find((item) => item.status === "checked_in"),
    [attendance, today]
  );

  const runAttendance = async (action) => {
    setBusy(true);
    try {
      if (action === "in") {
        await e1Api.checkIn({});
        setToast({ type: "success", message: "Checked in successfully" });
      } else {
        await e1Api.checkOut();
        setToast({ type: "success", message: "Checked out successfully" });
      }
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || error.message || "Unable to update attendance" });
    } finally {
      setBusy(false);
    }
  };

  const requestLeave = async (values) => {
    setBusy(true);
    try {
      await e1Api.requestLeave(values);
      setToast({ type: "success", message: "Leave request submitted" });
      setLeaveOpen(false);
      reset();
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to submit leave request" });
    } finally {
      setBusy(false);
    }
  };

  if (!isAttendanceActive) {
    return null;
  }

  return (
    <section className="e1-panel" id="staff-self-service">
      <div id="attendance-leave" style={{ position: "relative", top: "-10px" }} />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2>My Workforce</h2>
            <span className="badge badge-success" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>Attendance & Leave</span>
          </div>
          <p>Track today's attendance and your own leave requests with a simple check-in and check-out flow.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="button-secondary" type="button" onClick={() => setLeaveOpen(true)}>
            <Plane size={17} />
            <span>Request Leave</span>
          </button>
          <button
            className="button-secondary"
            type="button"
            onClick={handleClose}
            title="Close Attendance & Leave section"
            style={{ padding: "8px 12px" }}
          >
            <X size={17} />
            <span>Close</span>
          </button>
        </div>
      </div>

      <div className="staff-self-grid">
        <div className="staff-self-card">
          <CalendarDays size={22} />
          <span>Today</span>
          <strong>{formatDate(today)}</strong>
        </div>
        <div className="staff-self-card">
          <Clock size={22} />
          <span>Current Status</span>
          <strong>{todayAttendance?.status ? todayAttendance.status.replace(/_/g, " ") : "Not checked in"}</strong>
        </div>
        <div className="staff-self-card">
          <LogIn size={22} />
          <span>Check-in Time</span>
          <strong>{formatTime(todayAttendance?.checkInAt)}</strong>
        </div>
        <div className="staff-self-card">
          <LogOut size={22} />
          <span>Check-out Time</span>
          <strong>{formatTime(todayAttendance?.checkOutAt)}</strong>
        </div>
      </div>

      <div className="staff-self-actions">
        <button className="button-primary" type="button" onClick={() => runAttendance("in")} disabled={busy || Boolean(todayAttendance)}>
          <LogIn size={17} />
          <span>{busy ? "Checking..." : "Check In Today"}</span>
        </button>
        <button className="button-secondary" type="button" onClick={() => runAttendance("out")} disabled={busy || todayAttendance?.status !== "checked_in"}>
          <LogOut size={17} />
          <span>Check Out</span>
        </button>
      </div>

      <div className="staff-self-tables">
        <div>
          <h3>Attendance History</h3>
          <DataTable
            columns={[
              { key: "date", header: "Date", render: (item) => formatDate(item.workDate) },
              { key: "checkIn", header: "Check In", render: (item) => formatTime(item.checkInAt) },
              { key: "checkOut", header: "Check Out", render: (item) => formatTime(item.checkOutAt) },
              { key: "hours", header: "Worked Hours", render: workedHours },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
            ]}
            rows={attendance.slice(0, 6)}
            emptyText="No attendance history yet."
          />
        </div>
      </div>

      <div className="staff-self-leave">
        <h3>My Leave Requests</h3>
        <DataTable
          columns={[
            { key: "leaveType", header: "Type", render: (item) => String(item.leaveType).replace(/_/g, " ") },
            { key: "startDate", header: "Start Date", render: (item) => formatDate(item.startDate) },
            { key: "endDate", header: "End Date", render: (item) => formatDate(item.endDate) },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
          ]}
          rows={leave.slice(0, 5)}
          emptyText="No leave requests submitted."
        />
      </div>

      {user?.role === "doctor" ? (
        <div className="staff-self-leave" style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "12px", padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>🩺</span>
            <h3 style={{ margin: 0, color: "#0369a1" }}>Clinic Owner & Appointment Compensation</h3>
          </div>
          <p style={{ margin: 0, color: "#0f172a", fontSize: "0.88rem", lineHeight: 1.5 }}>
            As the clinic owner, you are compensated per completed appointment consultation fee and are exempt from standard employee salary processing.
            Detailed consultation fee earnings and invoice breakdowns are tracked in real time on your <strong>Doctor Workspace</strong>.
          </p>
        </div>
      ) : (
        <div className="staff-self-leave">
          <h3>My Payslips & Salary History</h3>
          <DataTable
            columns={[
              { key: "month", header: "Month" },
              { key: "workingDays", header: "Working Days", render: (item) => item.workingDays ?? item.payableShifts ?? item.attendanceDays },
              { key: "dailyPay", header: "Daily Pay", render: (item) => `Rs. ${Number(item.dailyPay ?? item.shiftRate ?? 0).toFixed(2)}` },
              { key: "netSalary", header: "Net Salary", render: (item) => `Rs. ${Number(item.netSalary || 0).toFixed(2)}` },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
              { key: "actions", header: "Actions", render: (item) => (
                <button
                  className="table-link-button"
                  type="button"
                  onClick={() => printPayslipPDF(item)}
                  title="View & Print payslip as PDF"
                >
                  <Printer size={13} style={{ display: "inline", marginRight: "4px" }} />
                  Payslip PDF
                </button>
              ) }
            ]}
            rows={payroll.slice(0, 5)}
            emptyText="No payslips available yet."
          />
        </div>
      )}

      <Modal open={leaveOpen} title="Request Leave" subtitle="Submit your leave request for manager review." onClose={() => setLeaveOpen(false)}>
        <form onSubmit={handleSubmit(requestLeave)}>
          <div className="form-grid">
            <FormSelect label="Type" error={errors.leaveType?.message} {...register("leaveType")}>
              <option value="">Select type</option>
              {LEAVE_TYPES.map((type) => (
                <option value={type.value} key={type.value}>
                  {type.label}
                </option>
              ))}
            </FormSelect>
            <FormInput label="Start Date" type="date" min={new Date().toISOString().slice(0, 10)} error={errors.startDate?.message} {...register("startDate")} />
            <FormInput label="End Date" type="date" min={new Date().toISOString().slice(0, 10)} error={errors.endDate?.message} {...register("endDate")} />
          </div>
          <FormInput label="Reason" placeholder="Family commitment in Matara" error={errors.reason?.message} {...register("reason")} />
          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setLeaveOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button className="button-primary" type="submit" disabled={busy}>
              {busy ? "Submitting..." : "Request Leave"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
