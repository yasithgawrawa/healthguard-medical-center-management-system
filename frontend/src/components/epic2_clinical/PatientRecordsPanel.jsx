import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CalendarCheck, CalendarClock, CreditCard, Download, FileText, History, Pill, Printer, RefreshCw } from "lucide-react";
import { patientNoticeApi } from "../../services/patientNoticeApi.js";
import { patientApi } from "../../services/patientApi.js";
import { printInvoicePDF, printLabReportPDF } from "../../utils/invoicePrintTemplate.js";
import { customerLabel, patientLabel } from "../../utils/personLabels.js";
import { Modal } from "../shared/Modal.jsx";

// Format a stored date for display and handle missing or invalid values.
const formatDate = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

// Format just the date portion of an appointment using the slotLabel for the time.
// This avoids timezone display issues (stored UTC != local display time).
// Combine the appointment date and slot label into a readable display.
const formatAppointmentDate = (appointmentDate, slotLabel) => {
  if (!appointmentDate) return "Not set";
  const dateOnly = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(appointmentDate));
  return slotLabel ? `${dateOnly} — ${slotLabel}` : dateOnly;
};


const emptyText = {
  todayAppointments: "No appointments scheduled for today.",
  upcomingAppointments: "No upcoming appointments.",
  pastAppointments: "No past appointments yet.",
  labs: "No laboratory requests found.",
  prescriptions: "No prescriptions found.",
  invoices: "No invoices found.",
  notifications: "No notifications"
};

// Trigger a browser download for a Blob and release its temporary object URL.
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

// Show patient appointments, clinical records, invoices, and notifications with permitted actions.
export const PatientRecordsPanel = ({ refreshKey = 0, onChanged }) => {
  const [data, setData] = useState({
    appointments: [],
    labs: [],
    prescriptions: [],
    invoices: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null });
  const [rescheduleDay, setRescheduleDay] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load get appointments, get lab requests, get prescriptions, get invoices and update the displayed state.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appointments, labs, prescriptions, invoices, notifications] = await Promise.all([
        patientApi.getAppointments(),
        patientApi.getLabRequests(),
        patientApi.getPrescriptions(),
        patientApi.getInvoices(),
        Promise.all([patientApi.getNotifications(), patientNoticeApi.mine()]).then(([labs, notices]) => [...labs.map(item => ({ ...item, source: "lab" })), ...notices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      ]);
      setData({ appointments, labs, prescriptions, invoices, notifications });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load patient records");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load workspace data on mount and whenever the effect dependencies change.
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Register browser event listeners and remove them when this effect is cleaned up.
  useEffect(() => {
    let active = true;
    // Reload the current patient's combined notification list.
    const refreshNotifications = async () => {
      try {
        const [labs, notices] = await Promise.all([patientApi.getNotifications(), patientNoticeApi.mine()]);
        if (active) setData(previous => ({ ...previous, notifications: [...labs.map(item => ({ ...item, source: "lab" })), ...notices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) }));
      } catch { if (active) setError("Unable to refresh notifications. Please refresh your records."); }
    };
    const timer = setInterval(refreshNotifications, 30000);
    window.addEventListener("focus", refreshNotifications);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refreshNotifications); };
  }, []);

  // Schedule feedback dismissal or periodic updates and clear timers during cleanup.
  useEffect(() => {
    const expiries = data.notifications.map(item => item.expiryDate ? new Date(item.expiryDate).getTime() : 0).filter(time => time > Date.now());
    if (!expiries.length) return;
    const timer = setTimeout(() => {
      setData(previous => ({ ...previous, notifications: previous.notifications.filter(item => !item.expiryDate || new Date(item.expiryDate) > new Date()) }));
    }, Math.min(Math.max(1, Math.min(...expiries) - Date.now()), 2147483647));
    return () => clearTimeout(timer);
  }, [data.notifications]);

  // Submit cancellation for the selected appointment and refresh the displayed records.
  const cancelAppointment = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await patientApi.cancelAppointment(id);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel appointment");
    } finally {
      setBusyId("");
    }
  };

  // Check the appointment status and date before offering cancellation in the interface.
  const canCancel = (item) => item.status === "booked" && new Date(item.appointmentDate) > new Date();

  // Open rescheduling with the selected appointment's current doctor and date.
  const openReschedule = (appointment) => {
    setError("");
    setRescheduleModal({ open: true, appointment });
    setRescheduleDay(new Date(appointment.appointmentDate).toISOString().slice(0, 10));
    setRescheduleSlot({ startsAt: new Date(appointment.appointmentDate).toISOString(), label: appointment.slotLabel });
    setRescheduleSlots([]);
  };

  // Reload available appointment slots when the selected doctor or calendar day changes.
  useEffect(() => {
    const appointment = rescheduleModal.appointment;
    const doctorId = appointment?.doctorId?._id || appointment?.doctorId;
    if (!rescheduleModal.open || !appointment || !doctorId || !rescheduleDay) {
      setRescheduleSlots([]);
      return;
    }

    setLoadingSlots(true);
    patientApi
      .getAppointmentSlots({ doctorId, date: rescheduleDay })
      .then((slots) => {
        const currentIso = new Date(appointment.appointmentDate).toISOString();
        const normalized = (slots || []).map((slot) => (
          slot.startsAt === currentIso ? { ...slot, available: true } : slot
        ));
        setRescheduleSlots(normalized);
        const stillSelected = normalized.find((slot) => slot.startsAt === rescheduleSlot?.startsAt && slot.available);
        if (!stillSelected) setRescheduleSlot(null);
      })
      .catch(() => setError("Unable to load appointment slots for the selected date."))
      .finally(() => setLoadingSlots(false));
  }, [rescheduleModal.open, rescheduleModal.appointment, rescheduleDay]);

  // Save the selected appointment's replacement slot and refresh patient records.
  const saveReschedule = async () => {
    if (!rescheduleModal.appointment || !rescheduleSlot) {
      setError("Select an available date and time slot.");
      return;
    }

    setBusyId(rescheduleModal.appointment._id);
    setError("");
    try {
      await patientApi.rescheduleAppointment(rescheduleModal.appointment._id, {
        appointmentDate: rescheduleSlot.startsAt,
        slotLabel: rescheduleSlot.label
      });
      setRescheduleModal({ open: false, appointment: null });
      setRescheduleSlot(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update appointment date and time");
    } finally {
      setBusyId("");
    }
  };

  // Cache appointment buckets until the listed source values change.
  const appointmentBuckets = useMemo(() => {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday);
    endToday.setDate(endToday.getDate() + 1);

    return data.appointments.reduce((buckets, item) => {
      const appointmentDate = new Date(item.appointmentDate);
      if (appointmentDate >= startToday && appointmentDate < endToday) {
        buckets.todayAppointments.push(item);
      } else if (appointmentDate >= endToday && !["completed", "cancelled"].includes(item.status)) {
        buckets.upcomingAppointments.push(item);
      } else {
        buckets.pastAppointments.push(item);
      }
      return buckets;
    }, { todayAppointments: [], upcomingAppointments: [], pastAppointments: [] });
  }, [data.appointments]);

  // Download the selected paid invoice's receipt and save it in the browser.
  const downloadReceipt = async (invoice) => {
    setBusyId(invoice._id);
    try {
      saveBlob(await patientApi.downloadReceipt(invoice._id), `healthguard-receipt-${invoice._id}.txt`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to download receipt");
    } finally {
      setBusyId("");
    }
  };

  // Open the selected invoice using the shared printable invoice template.
  const printInvoice = (invoice) => {
    printInvoicePDF(invoice);
  };

  // Record that the current patient has read an eligible notification.
  const markNotificationRead = async (item) => {
    const id = item._id;
    setBusyId(id);
    try {
      await (item.source === "manager" ? patientNoticeApi.markRead(id) : patientApi.markNotificationRead(id));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update notification");
    } finally {
      setBusyId("");
    }
  };

  // Render one appointment card with its available patient actions.
  const renderAppointment = (item) => (
    <>
      <div className="patient-record-main">
        <strong>{formatAppointmentDate(item.appointmentDate, item.slotLabel)}</strong>
        <span>{item.doctorId ? `Dr. ${item.doctorId.firstName} ${item.doctorId.lastName}` : "Doctor pending"}</span>
      </div>
      <div className="patient-record-meta">
        <span>{patientLabel(item.patientId)}</span>
        <small>{item.reason}</small>
      </div>
      {item.consultation?.diagnosis ? (
        <div className="patient-appointment-note">
          <strong>Diagnosis: </strong>
          <span>{item.consultation.diagnosis}</span>
          {item.consultation.patientAdvice ? <em>Care Advice: {item.consultation.patientAdvice}</em> : null}
          {item.consultation.followUpPlan ? <b>Follow-up: {item.consultation.followUpPlan}</b> : null}
        </div>
      ) : null}
      <div className="record-item-header">
        <small className={`status-badge status-${item.status?.replace(/_/g, "-")}`}>{item.status?.replace(/_/g, " ")}</small>
        {canCancel(item) ? (
          <>
            <button className="table-link-button" type="button" onClick={() => openReschedule(item)} disabled={busyId === item._id}>
              Update Date/Time
            </button>
            <button className="table-link-button danger-action" type="button" onClick={() => cancelAppointment(item._id)} disabled={busyId === item._id}>
              {busyId === item._id ? "Cancelling..." : "Cancel"}
            </button>
          </>
        ) : null}
      </div>
    </>
  );

  const sections = [
    {
      key: "notifications",
      title: "Notifications",
      icon: Bell,
      records: data.notifications.filter(item => !item.expiryDate || new Date(item.expiryDate) > new Date()),
      // Format this table cell using the current row's data and available actions.
      render: (item) => (
        <>
          <strong>{item.title}</strong>
          <span className="notice-message">{item.message}</span>
          <small>{formatDate(item.createdAt)}</small>
          {!item.readAt ? (
            <button className="table-link-button" type="button" onClick={() => markNotificationRead(item)} disabled={busyId === item._id}>
              Mark as read
            </button>
          ) : null}
        </>
      )
    },
    {
      key: "todayAppointments",
      title: "Today",
      icon: CalendarCheck,
      records: appointmentBuckets.todayAppointments,
      render: renderAppointment
    },
    {
      key: "upcomingAppointments",
      title: "Upcoming Bookings",
      icon: CalendarClock,
      records: appointmentBuckets.upcomingAppointments,
      render: renderAppointment
    },
    {
      key: "pastAppointments",
      title: "Past Bookings",
      icon: History,
      records: appointmentBuckets.pastAppointments,
      render: renderAppointment
    },
    {
      key: "labs",
      title: "Lab Reports",
      icon: FileText,
      records: data.labs,
      // Format this table cell using the current row's data and available actions.
      render: (item) => (
        <>
          <strong>{item.testName}</strong>
          <span>{item.status}</span>
          <small>{item.resultSummary || "Result not uploaded yet"}</small>
          {item.status === "requested" ? <small>New lab request from your doctor</small> : null}
          <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
            {["completed", "verified"].includes(item.status) ? (
              <button
                className="table-link-button"
                type="button"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#0284c7", fontWeight: 600 }}
                onClick={() => printLabReportPDF(item)}
              >
                <Download size={12} />
                Download Report PDF
              </button>
            ) : null}
            {item.resultUrl ? <a className="table-link-button" href={item.resultUrl} target="_blank" rel="noreferrer">External link</a> : null}
          </div>
        </>
      )
    },
    {
      key: "prescriptions",
      title: "Prescriptions",
      icon: Pill,
      records: data.prescriptions,
      // Format this table cell using the current row's data and available actions.
      render: (item) => (
        <>
          <strong>{item.items?.[0]?.medicineName || "Prescription"}</strong>
          <span>{item.status}</span>
          <small>{item.items?.length || 0} medicine item(s)</small>
        </>
      )
    },
    {
      key: "invoices",
      title: "Bills & Receipts",
      icon: CreditCard,
      records: data.invoices,
      // Format this table cell using the current row's data and available actions.
      render: (item) => (
        <>
          <strong>Rs. {Number(item.outstandingAmount || 0).toFixed(2)} outstanding</strong>
          <span>{customerLabel(item)}</span>
          <span>{item.status}</span>
          <small>Total: Rs. {Number(item.subtotal || 0).toFixed(2)}</small>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
            <button
              className="table-link-button"
              type="button"
              onClick={() => printInvoice(item)}
              title="View & Print as PDF"
            >
              <Printer size={12} style={{ display: "inline", marginRight: "3px" }} />
              {item.status === "paid" ? "Receipt PDF" : "Invoice PDF"}
            </button>
          </div>
        </>
      )
    }
  ];

  return (
    <section className="operation-panel" id="patient-records">
      <div className="operation-header">
        <div>
          <h2>My Health Guard Records</h2>
          <p>Live patient care records loaded through protected health APIs.</p>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin-animation" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error ? <div className="form-alert" style={{ marginTop: "16px" }}>{error}</div> : null}

      <div className="patient-record-grid">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <article className="patient-record-card" id={`patient-records-${section.key}`} key={section.key}>
              <div className="record-title-row">
                <div className="dashboard-card-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <h3>{section.title}</h3>
                  <span>{section.records.length} record(s)</span>
                </div>
              </div>

              <div className="patient-record-list">
                {section.records.length ? (
                  (section.key === "notifications" ? section.records : section.records.slice(0, 4)).map((item) => (
                    <div className={`patient-record-item${section.key === "notifications" && !item.readAt ? " notice-unread" : ""}`} key={`${item.source || section.key}-${item._id}`}>
                      {section.key === "notifications" && !item.readAt ? <small className="notice-unread-label">Unread</small> : null}
                      {section.render(item)}
                    </div>
                  ))
                ) : (
                  <p>{loading ? "Loading..." : emptyText[section.key]}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={rescheduleModal.open}
        title="Update Booking Date & Time"
        subtitle={rescheduleModal.appointment ? formatAppointmentDate(rescheduleModal.appointment.appointmentDate, rescheduleModal.appointment.slotLabel) : ""}
        onClose={() => setRescheduleModal({ open: false, appointment: null })}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label className="form-field">
            <span>Appointment Date</span>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={rescheduleDay}
              onChange={(event) => {
                setRescheduleDay(event.target.value);
                setRescheduleSlot(null);
              }}
            />
          </label>

          <div>
            <strong style={{ display: "block", marginBottom: "8px" }}>Available Time Slots</strong>
            {loadingSlots ? (
              <p style={{ color: "#64748b" }}>Loading available slots...</p>
            ) : rescheduleSlots.length === 0 ? (
              <p style={{ color: "#64748b" }}>No slots available for this date.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
                {rescheduleSlots.map((slot) => {
                  const selected = rescheduleSlot?.startsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      className={selected ? "button-primary" : "button-secondary"}
                      disabled={!slot.available || busyId === rescheduleModal.appointment?._id}
                      onClick={() => setRescheduleSlot(slot)}
                      style={{ justifyContent: "center" }}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setRescheduleModal({ open: false, appointment: null })} disabled={Boolean(busyId)}>
              Cancel
            </button>
            <button className="button-primary" type="button" onClick={saveReschedule} disabled={!rescheduleSlot || Boolean(busyId)}>
              {busyId ? "Updating..." : "Update Booking"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
