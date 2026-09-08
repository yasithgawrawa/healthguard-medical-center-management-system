import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, Search, ShieldPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { DASHBOARD_PATH_BY_ROLE } from "../../utils/roles.js";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const dashboardPath = user ? DASHBOARD_PATH_BY_ROLE[user.role] : "/";

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <ShieldPlus size={26} />
        <span>Health Guard</span>
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        {user ? (
          <>
            <NavLink to={dashboardPath}>Dashboard</NavLink>
            <button className="icon-text-button" type="button" onClick={logout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink className="primary-link" to="/register">
              Register
            </NavLink>
          </>
        )}
      </nav>
      <div className="nav-tools" aria-label="Navigation tools">
        <button type="button" aria-label="Search">
          <Search size={20} />
        </button>
        <button type="button" aria-label="Menu">
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
};
