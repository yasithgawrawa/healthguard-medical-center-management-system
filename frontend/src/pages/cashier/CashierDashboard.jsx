import { CheckCircle, CreditCard, DollarSign, FileCheck, Receipt } from "lucide-react";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { BillingWorkspacePanel } from "../../components/epic4_billing/BillingWorkspacePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";

export const CashierDashboard = () => (
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
      <DashboardCard title="Invoices" value="Create" detail="Build itemized bills for care" icon={Receipt} change="Calculated" />
      <DashboardCard title="Payments" value="Collect" detail="Record cash, card or transfer" icon={CreditCard} change="Balanced" />
      <DashboardCard title="Receipts" value="Issue" detail="Confirm paid invoices" icon={FileCheck} change="Audited" />
    </div>

    <DashboardQuickActions
      actions={[
        { label: "Create Invoice", detail: "Add billable services", icon: Receipt, href: "#billing-payments" },
        { label: "Record Payment", detail: "Settle an invoice", icon: CreditCard, href: "#billing-payments" },
        { label: "Review Revenue", detail: "Check recent invoices", icon: DollarSign, href: "#billing-payments" },
        { label: "Verify Receipt", detail: "Confirm paid status", icon: CheckCircle, href: "#billing-payments" }
      ]}
    />

    <BillingWorkspacePanel />
    <StaffSelfServicePanel />
  </div>
);
