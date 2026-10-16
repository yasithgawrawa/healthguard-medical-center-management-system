import { Outlet } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar.jsx";

// Shared Public Layout | Frontend Logic | Render the public navigation and the matched public page.
export const PublicLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
  </>
);
