import { AlertTriangle, Boxes, PackageCheck, Pill, ShoppingCart, Truck } from "lucide-react";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { InventoryWorkspacePanel } from "../../components/epic3_inventory/InventoryWorkspacePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";

export const PharmacistDashboard = () => (
  <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <div className="dashboard-header-banner">
      <div>
        <h1>Pharmacy Workspace</h1>
        <p>Manage medicines, suppliers, batches and dispensing with stock balances protected by the backend.</p>
      </div>
      <div className="dashboard-live-indicator">
        <div className="live-dot" />
        <span>Inventory Synced</span>
      </div>
    </div>

    <div className="dashboard-grid">
      <DashboardCard title="Medicines" value="Catalog" detail="Maintain drug details and pricing" icon={Pill} change="Ready" />
      <DashboardCard title="Stock & Expiry" value="Monitor" detail="Track batches and reorder needs" icon={AlertTriangle} change="Protected" />
      <DashboardCard title="Dispensing" value="Record" detail="Sell medicines with live stock checks" icon={ShoppingCart} change="Real-time" />
    </div>

    <DashboardQuickActions
      actions={[
        { label: "Add Medicine", detail: "Create catalog item", icon: Pill, href: "#pharmacy-inventory" },
        { label: "Receive Batch", detail: "Add stock by batch", icon: Boxes, href: "#pharmacy-inventory" },
        { label: "Record Sale", detail: "Dispense to patient", icon: PackageCheck, href: "#pharmacy-inventory" },
        { label: "Add Supplier", detail: "Manage vendor details", icon: Truck, href: "#pharmacy-inventory" }
      ]}
    />

    <InventoryWorkspacePanel />
    <StaffSelfServicePanel />
  </div>
);
