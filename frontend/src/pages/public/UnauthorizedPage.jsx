import { Link } from "react-router-dom";

export const UnauthorizedPage = () => (
  <section className="page-status">
    <h1>Not authorized</h1>
    <p>Your account does not have access to that area.</p>
    <Link className="button-primary" to="/">Return home</Link>
  </section>
);
