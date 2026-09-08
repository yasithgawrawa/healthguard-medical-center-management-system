import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export const UnauthorizedPage = () => (
  <section className="page-status">
    <div className="page-status-card">
      <div className="page-status-icon">
        <ShieldAlert size={36} />
      </div>
      <h1>Access Restricted</h1>
      <p>
        Your account role does not have permission to view this operational zone. Please
        contact the hospital administrator if you believe this is an error.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
        <Link className="button-primary" to="/">
          <ArrowLeft size={16} />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  </section>
);
