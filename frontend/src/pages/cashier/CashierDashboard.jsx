import { CheckCircle, CreditCard, DollarSign, FileCheck, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { BillingWorkspacePanel } from "../../components/epic4_billing/BillingWorkspacePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { billingApi } from "../../services/billingApi.js";
import { clinicalApi } from "../../services/clinicalApi.js";

const money = (val) => `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const CashierDashboard = () => {
  const [metrics, setMetrics] = useState({
    pendingInvoicesCount: 0,
    outstandingSum: 0,
    todayCollections: 0,
    unbilledVisits: 0,
    settledCount: 0
  });

  useEffect(() => {
    Promise.all([
      billingApi.invoices().catch(() => []),
      billingApi.payments().catch(() => []),
      clinicalApi.listAppointments().catch(() => [])
    ]).then(([invoiceList, paymentList, apptList]) => {
      const invoices = invoiceList || [];
      const payments = paymentList || [];
      const appts = apptList || [];

      const today = new Date().toISOString().slice(0, 10);
      const pending = invoices.filter((i) => i.status !== "paid");
      const outSum = pending.reduce((sum, i) => sum + Number(i.outstandingAmount || 0), 0);

      const todayPayments = payments.filter((p) => (p.createdAt || "").slice(0, 10) === today && p.status !== "rejected");
      const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const billedApptIds = new Set(invoices.map((i) => (i.appointmentId?._id || i.appointmentId)));
      const completedUnbilled = appts.filter((a) => a.status === "completed" && !billedApptIds.has(a._id));

      const settled = invoices.filter((i) => i.status === "paid");

      setMetrics({
        pendingInvoicesCount: pending.length,
        outstandingSum: outSum,
        todayCollections: todayTotal,
        unbilledVisits: completedUnbilled.length,
        settledCount: settled.length
      });
    });
  }, []);

  return (
    <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="dashboard-header-banner">
        <div>
          <h1>Cashier Workspace</h1>
          <p>Create invoices, collect payments and keep receipts aligned with backend-calculated balances.</p>
        </div>
        <div className="dashboard-live-indicator">
          <div className="live-dot" />
          <span>Cashier Active</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Pending Invoices"
          value={`${metrics.pendingInvoicesCount} Invoices`}
          detail={metrics.outstandingSum > 0 ? `${money(metrics.outstandingSum)} outstanding` : "All accounts settled"}
          icon={Receipt}
          change={metrics.pendingInvoicesCount > 0 ? "Awaiting Payment" : "All Clear"}
        />
        <DashboardCard
          title="Today's Collections"
          value={money(metrics.todayCollections)}
          detail="Cash, card & transfer payments received today"
          icon={CreditCard}
          change="Collections Synced"
        />
        <DashboardCard
          title="Unbilled Consultations"
          value={`${metrics.unbilledVisits} Ready`}
          detail={metrics.unbilledVisits > 0 ? "Completed doctor visits ready to bill" : "All visits invoiced"}
          icon={DollarSign}
          change={metrics.unbilledVisits > 0 ? "Ready to Bill" : "Up To Date"}
        />
        <DashboardCard
          title="Settled Paid Bills"
          value={`${metrics.settledCount} Settled`}
          detail="Fully paid invoices with official receipts"
          icon={CheckCircle}
          change="Audited & Paid"
        />
      </div>

      <DashboardQuickActions
        actions={[
          { label: "Create Invoice", detail: "Add billable services", icon: Receipt, href: "#billing-payments" },
          { label: "Record Payment", detail: "Settle an invoice", icon: CreditCard, href: "#billing-payments" },
          { label: "Review Revenue", detail: "Check recent invoices", icon: DollarSign, href: "#billing-payments" },
          { label: "Verify Receipt", detail: "Confirm paid status", icon: FileCheck, href: "#billing-payments" }
        ]}
      />

      <BillingWorkspacePanel />
      <StaffSelfServicePanel />
    </div>
  );
};
