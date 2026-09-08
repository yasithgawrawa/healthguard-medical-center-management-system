import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/shared/ProtectedRoute.jsx";
import { DashboardLayout } from "./layouts/DashboardLayout.jsx";
import { PublicLayout } from "./layouts/PublicLayout.jsx";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { CashierDashboard } from "./pages/cashier/CashierDashboard.jsx";
import { DoctorDashboard } from "./pages/doctor/DoctorDashboard.jsx";
import { LabDashboard } from "./pages/lab/LabDashboard.jsx";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard.jsx";
import { NurseDashboard } from "./pages/nurse/NurseDashboard.jsx";
import { PatientDashboard } from "./pages/patient/PatientDashboard.jsx";
import { PharmacistDashboard } from "./pages/pharmacist/PharmacistDashboard.jsx";
import { HomePage } from "./pages/public/HomePage.jsx";
import { LoginPage } from "./pages/public/LoginPage.jsx";
import { RegisterPage } from "./pages/public/RegisterPage.jsx";
import { UnauthorizedPage } from "./pages/public/UnauthorizedPage.jsx";
import { ROLES } from "./utils/roles.js";

const protectedRoutes = [
  ["/patient", [ROLES.PATIENT], <PatientDashboard />],
  ["/admin", [ROLES.ADMIN], <AdminDashboard />],
  ["/manager", [ROLES.MANAGER], <ManagerDashboard />],
  ["/doctor", [ROLES.DOCTOR], <DoctorDashboard />],
  ["/nurse", [ROLES.NURSE], <NurseDashboard />],
  ["/pharmacist", [ROLES.PHARMACIST], <PharmacistDashboard />],
  ["/cashier", [ROLES.CASHIER], <CashierDashboard />],
  ["/lab", [ROLES.LAB_ASSISTANT], <LabDashboard />]
];

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {protectedRoutes.map(([path, roles, element]) => (
        <Route key={path} element={<ProtectedRoute allowedRoles={roles} />}>
          <Route element={<DashboardLayout />}>
            <Route path={path} element={element} />
          </Route>
        </Route>
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
