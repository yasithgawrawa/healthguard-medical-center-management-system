import {
  Activity,
  Calendar,
  ClipboardList,
  CreditCard,
  PackageSearch,
  Shield,
  UserRoundCheck,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
      { href: "#manager-workforce", label: "Attendance & Leave", icon: UserRoundCheck },
      { href: "#pharmacy-inventory", label: "Inventory Reports", icon: PackageSearch },
      { href: "#billing-payments", label: "Finance & Payroll", icon: CreditCard }
    ];
  }

  if (staffSelfServiceRoles.includes(role)) {
    return [
      { href: "#overview", label: "Overview", icon: Activity },
      { href: "#work", label: "Work Queue", icon: ClipboardList },
      { href: "#attendance-leave", label: "Attendance & Leave", icon: UserRoundCheck }
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
  const location = useLocation();
  const navItems = roleNavItems(user?.role);

  const getInitialHash = () => {
    if (location.hash) return location.hash;
    return navItems[0]?.href ?? "#overview";
  };

  const [activeHash, setActiveHash] = useState(getInitialHash);

  useEffect(() => {
    if (location.hash) {
      setActiveHash(location.hash);
    }
  }, [location.hash]);

  const isItemActive = (href) => {
    if (activeHash === href) return true;
    if (href === "#attendance-leave" && (activeHash === "#attendance-leave" || activeHash === "#staff-self-service")) {
      return true;
    }
    if (href === "#staff-self-service" && (activeHash === "#attendance-leave" || activeHash === "#staff-self-service")) {
      return true;
    }
    if (
      href === "#work" &&
      ["#clinical-workflow", "#patient-check-in-vitals", "#laboratory-results", "#pharmacy-inventory", "#billing-payments"].includes(activeHash)
    ) {
      return true;
    }
    return false;
  };

  const handleNavClick = (href) => {
    setActiveHash(href);
  };

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
            {navItems.map(({ href, label, icon: Icon }) => (
              <a
                href={href}
                className={isItemActive(href) ? "active" : ""}
                key={`${href}-${label}`}
                onClick={() => handleNavClick(href)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </aside>

        <section className="dashboard-content">
          <Outlet context={{ activeHash, setActiveHash }} />
        </section>
      </main>
    </>
  );
};
