import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-status">Loading secure area...</div>;
  }

  if (!user) {
    if (sessionStorage.getItem("healthguard_logout_redirect")) {
      sessionStorage.removeItem("healthguard_logout_redirect");
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
