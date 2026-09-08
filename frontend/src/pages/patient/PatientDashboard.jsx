import { Calendar, CreditCard, FileText, Pill } from "lucide-react";
import { useState } from "react";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { PatientAppointmentBooking } from "../../components/epic2_clinical/PatientAppointmentBooking.jsx";
import { PatientRecordsPanel } from "../../components/epic2_clinical/PatientRecordsPanel.jsx";

export const PatientDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="dashboard-header-banner">
        <div>
          <h1>Patient Care Portal</h1>
          <p>Book visits and keep your appointments, lab results, prescriptions and bills in one simple care record.</p>
        </div>
        <div className="dashboard-live-indicator">
          <div className="live-dot" />
          <span>Care Record Live</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Appointments"
          value="Book"
          detail="Schedule visits with available doctors"
          icon={Calendar}
          change="Saved Live"
        />
        <DashboardCard
          title="Lab Reports"
          value="View"
          detail="Access diagnostic results and tests"
          icon={FileText}
          change="Patient Scoped"
        />
        <DashboardCard
          title="Billing & Invoices"
          value="Track"
          detail="Review itemized invoices and receipts"
          icon={CreditCard}
          change="MongoDB"
        />
      </div>

      <DashboardQuickActions
        actions={[
          { label: "Book Appointment", detail: "Choose a doctor and time", icon: Calendar, href: "#book-appointment" },
          { label: "View Lab Results", detail: "Check test request updates", icon: FileText, href: "#patient-records" },
          { label: "Review Medicines", detail: "See prescriptions", icon: Pill, href: "#patient-records" },
          { label: "Check Bills", detail: "Track invoices and payments", icon: CreditCard, href: "#patient-records" }
        ]}
      />

      <PatientAppointmentBooking onBooked={() => setRefreshKey((key) => key + 1)} />
      <PatientRecordsPanel refreshKey={refreshKey} />
    </div>
  );
};
