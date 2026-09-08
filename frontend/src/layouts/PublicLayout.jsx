import { Outlet } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar.jsx";

export const PublicLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
  </>
);
