import { AlertTriangle, CalendarPlus, ClipboardCheck, ClipboardList, DollarSign, FlaskConical, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { BillingWorkspacePanel } from "../../components/epic4_billing/BillingWorkspacePanel.jsx";
import { InventoryWorkspacePanel } from "../../components/epic3_inventory/InventoryWorkspacePanel.jsx";
import { ManagerLabPricingPanel } from "../../components/epic2_clinical/ManagerLabPricingPanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { WorkforceManagementPanel } from "../../components/epic1_user_staff/WorkforceManagementPanel.jsx";
import { billingApi } from "../../services/billingApi.js";
import { e1Api } from "../../services/e1Api.js";
import { inventoryApi } from "../../services/inventoryApi.js";

const money = (val) => `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ManagerDashboard = () => {
  const [metrics, setMetrics] = useState({
    onDutyStaff: 0,
    pendingLeaves: 0,
    collectedRevenue: 0,
    totalAlerts: 0
  });

  useEffect(() => {
    Promise.all([
      e1Api.listAttendance().catch(() => []),
      e1Api.listLeave().catch(() => []),
      billingApi.summary().catch(() => ({ collected: 0 })),
      inventoryApi.alerts().catch(() => ({ lowStock: [], expiring: [] }))
    ]).then(([attendanceData, leaveData, summaryData, alertsData]) => {
      const today = new Date().toISOString().slice(0, 10);
      const todayCheckIns = (attendanceData || []).filter((a) => (a.checkInTime || "").slice(0, 10) === today);
      const pendingLeaves = (leaveData || []).filter((l) => l.status === "pending");
      const lowStockCount = alertsData?.lowStock?.length || 0;
      const expiringCount = alertsData?.expiring?.length || 0;

      setMetrics({
        onDutyStaff: todayCheckIns.length,
        pendingLeaves: pendingLeaves.length,
        collectedRevenue: summaryData?.collected || 0,
        totalAlerts: lowStockCount + expiringCount
      });
    });
  }, []);

  return (
    <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="dashboard-header-banner">
        <div>
          <h1>Manager Overview</h1>
          <p>Plan shifts, monitor attendance, review leave requests, adjust investigation pricing, and track clinic finances.</p>
        </div>
        <div className="dashboard-live-indicator">
          <div className="live-dot" />
          <span>Operations Normal</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Staff On Duty Today"
          value={`${metrics.onDutyStaff} Check-ins`}
          detail="Verified check-ins at medical center"
          icon={Users}
          change="Workforce Active"
        />
        <DashboardCard
          title="Pending Leave Queue"
          value={`${metrics.pendingLeaves} Pending`}
          detail={metrics.pendingLeaves > 0 ? "Staff leave requests awaiting review" : "All leave requests processed"}
          icon={ClipboardList}
          change={metrics.pendingLeaves > 0 ? "Review Required" : "Up To Date"}
        />
        <DashboardCard
          title="Revenue Collected"
          value={money(metrics.collectedRevenue)}
          detail="Total payments collected across services"
          icon={DollarSign}
          change="Billing Synced"
        />
        <DashboardCard
          title="Stock & Expiry Alerts"
          value={`${metrics.totalAlerts} Alerts`}
          detail={metrics.totalAlerts > 0 ? "Pharmacy shortages / expiring batches" : "Dispensary stock healthy"}
          icon={AlertTriangle}
          change={metrics.totalAlerts > 0 ? "Critical" : "Protected"}
        />
      </div>

      <DashboardQuickActions
        actions={[
          { label: "Lab Tariffs & Pricing", detail: "Adjust test prices & doctor fees", icon: FlaskConical, href: "#manager-tariffs" },
          { label: "Create Shift", detail: "Schedule active staff", icon: CalendarPlus, href: "#manager-workforce" },
          { label: "Review Attendance", detail: "Search staff attendance records", icon: ClipboardCheck, href: "#manager-workforce" },
          { label: "Review Leave", detail: "Approve or reject requests", icon: ClipboardList, href: "#manager-workforce" },
          { label: "Finance Reports", detail: "Revenue, outstanding and payroll", icon: ClipboardCheck, href: "#billing-payments" }
        ]}
      />

      <WorkforceManagementPanel />
      <ManagerLabPricingPanel />
      <InventoryWorkspacePanel />
      <BillingWorkspacePanel />
    </div>
  );
};
