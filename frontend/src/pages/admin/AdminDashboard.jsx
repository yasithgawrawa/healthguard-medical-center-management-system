import { CalendarPlus, CheckCircle2, Lock, Shield, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { StaffManagementPanel } from "../../components/epic1_user_staff/StaffManagementPanel.jsx";
import { WorkforceManagementPanel } from "../../components/epic1_user_staff/WorkforceManagementPanel.jsx";
import { DashboardCard } from "../../components/shared/DashboardCard.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";
import { e1Api } from "../../services/e1Api.js";

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    activeStaffCount: 0,
    roleCount: 0,
    todayAttendanceCount: 0
  });

  useEffect(() => {
    Promise.all([
      e1Api.listStaff().catch(() => []),
      e1Api.listAttendance().catch(() => [])
    ]).then(([staffList, attendanceList]) => {
      const today = new Date().toISOString().slice(0, 10);
      const activeStaff = (staffList || []).filter((s) => s.status === "active");
      const distinctRoles = new Set((staffList || []).map((s) => s.role).filter(Boolean));
      const todayCheckIns = (attendanceList || []).filter((a) => (a.checkInTime || "").slice(0, 10) === today);

      setMetrics({
        activeStaffCount: activeStaff.length,
        roleCount: distinctRoles.size,
        todayAttendanceCount: todayCheckIns.length
      });
    });
  }, []);

  return (
    <div id="overview" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="dashboard-header-banner">
        <div>
          <h1>Admin Workspace</h1>
          <p>Manage staff accounts, roles and login access without exposing database records in daily work.</p>
        </div>
        <div className="dashboard-live-indicator">
          <div className="live-dot" />
          <span>System Online</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Active Medical Staff"
          value={`${metrics.activeStaffCount} Staff`}
          detail="Doctors, nurses, pharmacists & staff"
          icon={Users}
          change="Profiles Synced"
        />
        <DashboardCard
          title="Configured Roles"
          value={`${metrics.roleCount} RBAC Roles`}
          detail="Role-based access permissions"
          icon={Shield}
          change="Access Enforced"
        />
        <DashboardCard
          title="Today's Check-ins"
          value={`${metrics.todayAttendanceCount} Attended`}
          detail="Geofence-verified center arrivals"
          icon={CheckCircle2}
          change="Geo-Verified"
        />
        <DashboardCard
          title="Access Security"
          value="100% Protected"
          detail="Bcrypt hashing & JWT authentication"
          icon={Lock}
          change="Audited Safe"
        />
      </div>

      <DashboardQuickActions
        actions={[
          { label: "Add Staff", detail: "Create a login and staff profile", icon: UserPlus, href: "#staff-directory" },
          { label: "Manage Staff", detail: "Search, edit or deactivate staff", icon: Users, href: "#staff-directory" },
          { label: "Manage Roles", detail: "Change staff access level", icon: Shield, href: "#staff-directory" },
          { label: "Set Center Location", detail: "Use one check-in radius for all staff", icon: CalendarPlus, href: "#manager-workforce" }
        ]}
      />

      <StaffManagementPanel />
      <WorkforceManagementPanel />
    </div>
  );
};
