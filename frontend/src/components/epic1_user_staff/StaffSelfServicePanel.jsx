import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, LogIn, LogOut, MapPin, Plane } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DataTable } from "../shared/DataTable.jsx";
import { Modal } from "../shared/Modal.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { e1Api } from "../../services/e1Api.js";
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

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  });

export const StaffSelfServicePanel = () => {
  const [attendance, setAttendance] = useState([]);
  const [leave, setLeave] = useState([]);
  const [shifts, setShifts] = useState([]);
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
    defaultValues: { leaveType: "", startDate: "", endDate: "", reason: "" }
  });

  const load = async () => {
    try {
      const [attendanceData, leaveData, shiftData] = await Promise.all([
        e1Api.listMyAttendance(),
        e1Api.listMyLeave(),
        e1Api.listMyShifts()
      ]);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setLeave(Array.isArray(leaveData) ? leaveData : []);
      setShifts(Array.isArray(shiftData) ? shiftData : []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load staff self-service data" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = useMemo(
    () => attendance.find((item) => item.workDate === today) || attendance.find((item) => item.status === "checked_in"),
    [attendance, today]
  );

  const runAttendance = async (action) => {
    setBusy(true);
    try {
      if (action === "in") {
        const position = await getCurrentPosition();
        await e1Api.checkIn({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy
        });
        setToast({ type: "success", message: "Checked in successfully" });
      } else {
        await e1Api.checkOut();
        setToast({ type: "success", message: "Checked out successfully" });
      }
      await load();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.errors?.location || error.response?.data?.message || error.message || "Unable to update attendance" });
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

  return (
    <section className="e1-panel" id="staff-self-service">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div>
          <h2>My Workforce</h2>
          <p>Track today's attendance, upcoming shifts and your own leave requests. Check-in is accepted only at the Health Guard center.</p>
        </div>
        <button className="button-secondary" type="button" onClick={() => setLeaveOpen(true)}>
          <Plane size={17} />
          <span>Request Leave</span>
        </button>
      </div>

      <div className="staff-self-grid">
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
        <button className="button-primary" type="button" onClick={() => runAttendance("in")} disabled={busy || todayAttendance?.status === "checked_in"}>
          <MapPin size={17} />
          <span>Check In</span>
        </button>
        <button className="button-secondary" type="button" onClick={() => runAttendance("out")} disabled={busy || todayAttendance?.status !== "checked_in"}>
          <LogOut size={17} />
          <span>Check Out</span>
        </button>
      </div>

      <div className="staff-self-tables">
        <div>
          <h3>Upcoming Shifts</h3>
          <DataTable
            columns={[
              { key: "date", header: "Date", render: (item) => formatDate(item.startTime) },
              { key: "start", header: "Start", render: (item) => formatTime(item.startTime) },
              { key: "end", header: "End", render: (item) => formatTime(item.endTime) },
              { key: "location", header: "Location" },
              { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
            ]}
            rows={shifts.slice(0, 4)}
            emptyText="No shifts scheduled."
          />
        </div>
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
            rows={attendance.slice(0, 4)}
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
            <FormInput label="Start Date" type="date" error={errors.startDate?.message} {...register("startDate")} />
            <FormInput label="End Date" type="date" error={errors.endDate?.message} {...register("endDate")} />
          </div>
          <FormInput label="Reason" error={errors.reason?.message} {...register("reason")} />
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
