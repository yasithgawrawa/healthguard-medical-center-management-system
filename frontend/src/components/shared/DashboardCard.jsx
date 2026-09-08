export const DashboardCard = ({ title, value, detail }) => (
  <article className="dashboard-card">
    <span>{title}</span>
    <strong>{value}</strong>
    {detail ? <p>{detail}</p> : null}
  </article>
);
