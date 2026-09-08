import {
  Activity,
  Calendar,
  ClipboardList,
  Shield,
  UserRoundCheck,
  Users
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../utils/roles.js";

const staffSelfServiceRoles = [
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.PHARMACIST,
  ROLES.CASHIER,
  ROLES.LAB_ASSISTANT
];

const roleNavItems = (role) => {
  if (role === ROLES.ADMIN) {
    return [
      { href: "#overview", label: "Overview", icon: Activity },
      { href: "#work", label: "Quick Actions", icon: ClipboardList },
      { href: "#staff-directory", label: "Staff Directory", icon: Users },
      { href: "#staff-directory", label: "Roles & Access", icon: Shield },
      { href: "#manager-workforce", label: "Schedule & Shifts", icon: Calendar }
    ];
  }

  if (role === ROLES.MANAGER) {
    return [
      { href: "#overview", label: "Overview", icon: Activity },
      { href: "#work", label: "Quick Actions", icon: ClipboardList },
      { href: "#manager-workforce", label: "Schedule & Shifts", icon: Calendar },
      { href: "#manager-workforce", label: "Attendance & Leave", icon: UserRoundCheck }
    ];
  }

  if (staffSelfServiceRoles.includes(role)) {
    return [
      { href: "#overview", label: "Overview", icon: Activity },
      { href: "#work", label: "Work Queue", icon: ClipboardList },
      { href: "#staff-self-service", label: "Schedule & Shifts", icon: Calendar },
      { href: "#staff-self-service", label: "Attendance & Leave", icon: UserRoundCheck }
    ];
  }

  return [
    { href: "#overview", label: "Overview", icon: Activity },
    { href: "#book-appointment", label: "Appointments", icon: Calendar },
    { href: "#patient-records", label: "My Records", icon: ClipboardList }
  ];
};

export const DashboardLayout = () => {
  const { user } = useAuth();
  const navItems = roleNavItems(user?.role);

  return (
    <>
      <Navbar />
      <main className="dashboard-shell">
        <aside className="sidebar">
          <div className="sidebar-profile">
            <span className="sidebar-label">Signed in as</span>
            <strong>{user?.firstName} {user?.lastName}</strong>
            <div className="sidebar-role-badge">
              <Shield size={12} />
              <span>{user?.role?.replace("_", " ")}</span>
            </div>
          </div>

          <div className="sidebar-nav">
            {navItems.map(({ href, label, icon: Icon }, index) => (
              <a href={href} className={index === 0 ? "active" : ""} key={`${href}-${label}`}>
                <Icon size={18} />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </aside>

        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </>
  );
};
