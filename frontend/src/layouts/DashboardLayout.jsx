import { Activity, Calendar, ClipboardList, Users } from "lucide-react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="dashboard-shell">
        <aside className="sidebar">
          <div>
            <span className="sidebar-label">Signed in as</span>
            <strong>{user?.firstName} {user?.lastName}</strong>
            <small>{user?.role?.replace("_", " ")}</small>
          </div>
          <a href="#overview"><Activity size={18} /> Overview</a>
          <a href="#work"><ClipboardList size={18} /> Work Queue</a>
          <a href="#schedule"><Calendar size={18} /> Schedule</a>
          <a href="#people"><Users size={18} /> People</a>
        </aside>
        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </>
  );
};
