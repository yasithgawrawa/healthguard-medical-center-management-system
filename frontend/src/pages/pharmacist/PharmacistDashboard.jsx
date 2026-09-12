import { AlertCircle, AlertTriangle, Boxes, PackageCheck, Pill, ShoppingCart, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { StaffSelfServicePanel } from "../../components/epic1_user_staff/StaffSelfServicePanel.jsx";
import { InventoryWorkspacePanel } from "../../components/epic3_inventory/InventoryWorkspacePanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { inventoryApi } from "../../services/inventoryApi.js";

const money = (val) => `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PharmacistDashboard = () => {
  const [metrics, setMetrics] = useState({
    activeMeds: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todaySalesCount: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    Promise.all([
      inventoryApi.medicines().catch(() => []),
      inventoryApi.alerts().catch(() => ({ lowStock: [], expiring: [] })),
      inventoryApi.sales().catch(() => [])
    ]).then(([meds, alertsData, salesData]) => {
      const today = new Date().toISOString().slice(0, 10);
      const todaySales = (salesData || []).filter((s) => (s.createdAt || "").slice(0, 10) === today);
      const revenue = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

      setMetrics({
        activeMeds: (meds || []).filter((m) => m.status === "active").length,
        lowStockCount: (alertsData?.lowStock || []).length,
        expiringCount: (alertsData?.expiring || []).length,
        todaySalesCount: todaySales.length,
        todayRevenue: revenue
      });
    });
  }, []);

  return (
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
        <DashboardCard
          title="Catalog Medicines"
          value={`${metrics.activeMeds} Active`}
          detail="Formulary items in dispensary"
          icon={Pill}
          change="Catalog Synced"
        />
        <DashboardCard
          title="Low-Stock Shortages"
          value={`${metrics.lowStockCount} Items`}
          detail={metrics.lowStockCount > 0 ? "Below reorder threshold" : "All stock levels healthy"}
          icon={AlertCircle}
          change={metrics.lowStockCount > 0 ? "Replenish Soon" : "Optimal"}
        />
        <DashboardCard
          title="Batches At Risk"
          value={`${metrics.expiringCount} Batches`}
          detail={metrics.expiringCount > 0 ? "Expiring within 60 days / expired" : "No batches near expiry"}
          icon={AlertTriangle}
          change={metrics.expiringCount > 0 ? "Action Required" : "Shelf-Life OK"}
        />
        <DashboardCard
          title="Today's Dispensing"
          value={money(metrics.todayRevenue)}
          detail={`${metrics.todaySalesCount} sales dispensed today`}
          icon={ShoppingCart}
          change="POS Live"
        />
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
};
