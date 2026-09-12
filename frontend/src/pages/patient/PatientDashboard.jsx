import { Calendar, CreditCard, FileText, Pill } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { PatientAppointmentBooking } from "../../components/epic2_clinical/PatientAppointmentBooking.jsx";
import { PatientRecordsPanel } from "../../components/epic2_clinical/PatientRecordsPanel.jsx";
import { patientApi } from "../../services/patientApi.js";

const money = (val) => `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PatientDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState({
    upcomingAppts: 0,
    nextApptDate: "",
    completedLabs: 0,
    prescriptionsCount: 0,
    outstandingBalance: 0
  });

  useEffect(() => {
    Promise.all([
      patientApi.getAppointments().catch(() => []),
      patientApi.getLabRequests().catch(() => []),
      patientApi.getPrescriptions().catch(() => []),
      patientApi.getInvoices().catch(() => [])
    ]).then(([appointments, labRequests, prescriptions, invoices]) => {
      const now = new Date();
      const upcoming = (appointments || []).filter((a) => a.status === "booked" && new Date(a.appointmentDate) >= now);
      const nextDate = upcoming[0]?.appointmentDate
        ? new Date(upcoming[0].appointmentDate).toLocaleDateString("en-LK", { month: "short", day: "numeric" })
        : "";

      const completedLabs = (labRequests || []).filter((l) => l.status === "completed");
      const balance = (invoices || []).reduce((sum, i) => sum + Number(i.outstandingAmount || 0), 0);

      setMetrics({
        upcomingAppts: upcoming.length,
        nextApptDate: nextDate,
        completedLabs: completedLabs.length,
        prescriptionsCount: (prescriptions || []).length,
        outstandingBalance: balance
      });
    });
  }, [refreshKey]);

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
          title="Upcoming Appointments"
          value={metrics.upcomingAppts > 0 ? `${metrics.upcomingAppts} Scheduled` : "No upcoming visits"}
          detail={metrics.nextApptDate ? `Next visit: ${metrics.nextApptDate}` : "Book a doctor below"}
          icon={Calendar}
          change={metrics.upcomingAppts > 0 ? "Confirmed" : "Ready to Book"}
        />
        <DashboardCard
          title="Diagnostic Lab Reports"
          value={`${metrics.completedLabs} Available`}
          detail={metrics.completedLabs > 0 ? "Diagnostic results ready to view" : "No lab reports published yet"}
          icon={FileText}
          change={metrics.completedLabs > 0 ? "Verified by Lab" : "Normal"}
        />
        <DashboardCard
          title="Prescriptions"
          value={`${metrics.prescriptionsCount} on File`}
          detail="Doctor medications for pharmacy dispensing"
          icon={Pill}
          change="Doctor Prescribed"
        />
        <DashboardCard
          title="Billing & Balance"
          value={metrics.outstandingBalance > 0 ? money(metrics.outstandingBalance) : "Rs. 0.00 Settled"}
          detail={metrics.outstandingBalance > 0 ? "Outstanding balance due at counter" : "All medical visits paid"}
          icon={CreditCard}
          change={metrics.outstandingBalance > 0 ? "Payment Due" : "Account Good"}
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
