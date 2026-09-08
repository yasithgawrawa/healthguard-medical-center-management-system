import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import healthGuardLogo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext.jsx";
import { DASHBOARD_PATH_BY_ROLE } from "../../utils/roles.js";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardPath = user ? DASHBOARD_PATH_BY_ROLE[user.role] : "/";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <header className="navbar">
        <Link className="brand" to="/">
          <img className="brand-logo" src={healthGuardLogo} alt="Health Guard" />
        </Link>

        <nav>
          <NavLink to="/" end>Home</NavLink>
          <a href="/#about">About</a>
          <a href="/#services">Services</a>
          <a href="/#contact">Contact</a>
          {user ? (
            <NavLink to={dashboardPath} className="dashboard-nav-link">
              Dashboard
            </NavLink>
          ) : null}
        </nav>

        <div className="nav-tools">
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link to={dashboardPath} className="user-chip">
                <div className="user-avatar-sm">
                  {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                </div>
                <span className="user-chip-name">{user.firstName || "User"}</span>
                <span className="user-chip-role">{user.role?.replace("_", " ")}</span>
              </Link>
              <button
                className="icon-text-button"
                type="button"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <NavLink to="/login" className="button-secondary" style={{ padding: "8px 18px", fontSize: "0.88rem" }}>
                Login
              </NavLink>
              <NavLink className="button-primary" to="/register" style={{ padding: "8px 18px", fontSize: "0.88rem" }}>
                Register
              </NavLink>
            </div>
          )}

          <button
            type="button"
            className="nav-icon-btn"
            aria-label="Toggle Menu"
            style={{ display: "none" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
    </>
  );
};
