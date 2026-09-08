import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, CreditCard, FileText, Pill, RefreshCw } from "lucide-react";
import { patientApi } from "../../services/patientApi.js";

const formatDate = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

const emptyText = {
  appointments: "No appointments saved yet.",
  labs: "No laboratory requests found.",
  prescriptions: "No prescriptions found.",
  invoices: "No invoices found."
};

export const PatientRecordsPanel = ({ refreshKey = 0 }) => {
  const [data, setData] = useState({
    appointments: [],
    labs: [],
    prescriptions: [],
    invoices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appointments, labs, prescriptions, invoices] = await Promise.all([
        patientApi.getAppointments(),
        patientApi.getLabRequests(),
        patientApi.getPrescriptions(),
        patientApi.getInvoices()
      ]);
      setData({ appointments, labs, prescriptions, invoices });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load patient records from MongoDB");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const sections = [
    {
      key: "appointments",
      title: "My Appointments",
      icon: CalendarCheck,
      records: data.appointments,
      render: (item) => (
        <>
          <strong>{formatDate(item.appointmentDate)}</strong>
          <span>{item.doctorId ? `Dr. ${item.doctorId.firstName} ${item.doctorId.lastName}` : "Doctor pending"}</span>
          <small>{item.reason}</small>
        </>
      )
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
          <span>{item.status}</span>
          <small>Total: Rs. {Number(item.subtotal || 0).toFixed(2)}</small>
        </>
      )
    }
  ];

  return (
    <section className="operation-panel" id="patient-records">
      <div className="operation-header">
        <div>
          <h2>My Health Guard Records</h2>
          <p>Live patient data loaded from MongoDB through protected APIs.</p>
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
            <article className="patient-record-card" key={section.key}>
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
