import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CalendarCheck, CalendarClock, CreditCard, Download, FileText, History, Pill, Printer, RefreshCw } from "lucide-react";
import { patientApi } from "../../services/patientApi.js";
import { printInvoicePDF, printLabReportPDF } from "../../utils/invoicePrintTemplate.js";
import { customerLabel, patientLabel } from "../../utils/personLabels.js";

const formatDate = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

const emptyText = {
  todayAppointments: "No appointments scheduled for today.",
  upcomingAppointments: "No upcoming appointments.",
  pastAppointments: "No past appointments yet.",
  labs: "No laboratory requests found.",
  prescriptions: "No prescriptions found.",
  invoices: "No invoices found.",
  notifications: "No notifications yet."
};

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const PatientRecordsPanel = ({ refreshKey = 0 }) => {
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appointments, labs, prescriptions, invoices, notifications] = await Promise.all([
        patientApi.getAppointments(),
        patientApi.getLabRequests(),
        patientApi.getPrescriptions(),
        patientApi.getInvoices(),
        patientApi.getNotifications()
      ]);
      setData({ appointments, labs, prescriptions, invoices, notifications });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load patient records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const cancelAppointment = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await patientApi.cancelAppointment(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel appointment");
    } finally {
      setBusyId("");
    }
  };

  const canCancel = (item) => item.status === "booked" && new Date(item.appointmentDate) > new Date();

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

  const printInvoice = (invoice) => {
    printInvoicePDF(invoice);
  };

  const markNotificationRead = async (id) => {
    setBusyId(id);
    try {
      await patientApi.markNotificationRead(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update notification");
    } finally {
      setBusyId("");
    }
  };

  const renderAppointment = (item) => (
    <>
      <div className="patient-record-main">
        <strong>{formatDate(item.appointmentDate)}</strong>
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
          <button className="table-link-button danger-action" type="button" onClick={() => cancelAppointment(item._id)} disabled={busyId === item._id}>
            {busyId === item._id ? "Cancelling..." : "Cancel"}
          </button>
        ) : null}
      </div>
    </>
  );

  const sections = [
    {
      key: "notifications",
      title: "Notifications",
      icon: Bell,
      records: data.notifications,
      render: (item) => (
        <>
          <strong>{item.title}</strong>
          <span>{item.message}</span>
          <small>{formatDate(item.createdAt)}</small>
          {!item.readAt ? (
            <button className="table-link-button" type="button" onClick={() => markNotificationRead(item._id)} disabled={busyId === item._id}>
              Mark read
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
                  section.records.slice(0, 4).map((item) => (
                    <div className="patient-record-item" key={item._id}>
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
    </section>
  );
};
