import { CalendarPlus, Shield, UserPlus, Users } from "lucide-react";
import { StaffAnnouncementManagementPanel } from "../../components/epic1_user_staff/StaffAnnouncementManagementPanel.jsx";
import { StaffManagementPanel } from "../../components/epic1_user_staff/StaffManagementPanel.jsx";
import { StaffNoticesPanel } from "../../components/epic1_user_staff/StaffNoticesPanel.jsx";
import { WorkforceManagementPanel } from "../../components/epic1_user_staff/WorkforceManagementPanel.jsx";
import { DashboardQuickActions } from "../../components/shared/DashboardQuickActions.jsx";

export const AdminDashboard = () => {
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

      <DashboardQuickActions
        actions={[
          { label: "Add Staff", detail: "Create a login and staff profile", icon: UserPlus, href: "#staff-directory" },
          { label: "Manage Staff", detail: "Search, edit or deactivate staff", icon: Users, href: "#staff-directory" },
          { label: "Manage Roles", detail: "Change staff access level", icon: Shield, href: "#staff-directory" },
          { label: "Review Attendance", detail: "Check daily staff attendance", icon: CalendarPlus, href: "#manager-workforce", command: { workspace: "workforce", tab: "attendance", date: "", role: "", search: "" } }
        ]}
      />

      <StaffNoticesPanel />
      <StaffManagementPanel />
      <StaffAnnouncementManagementPanel />
      <WorkforceManagementPanel />
    </div>
  );
};
