import { Megaphone, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { e1Api } from "../../services/e1Api.js";
import { formatDate, roleLabel } from "./e1Constants.js";

export const StaffNoticesPanel = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotices = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await e1Api.listMyAnnouncements();
      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load staff notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <section className="e1-panel" id="staff-notices">
      <div className="e1-panel-header">
        <div>
          <h2>Staff Notices</h2>
          <p>Current announcements for your role.</p>
        </div>
        <button className="button-secondary" type="button" onClick={loadNotices} disabled={loading}>
          <RefreshCcw size={16} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {error ? (
        <div className="form-alert error">{error}</div>
      ) : notices.length ? (
        <div style={{ display: "grid", gap: "12px" }}>
          {notices.map((notice) => (
            <article
              key={notice._id || notice.announcementId}
              style={{
                border: "1px solid var(--line-brand)",
                borderRadius: "var(--radius-md)",
                background: "#ffffff",
                padding: "16px",
                display: "grid",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--blue-soft)",
                      color: "var(--accent-sky)"
                    }}
                  >
                    <Megaphone size={18} />
                  </span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--ink-900)" }}>{notice.title}</h3>
                    <small style={{ color: "var(--muted)", fontWeight: 700 }}>
                      {formatDate(notice.publishedDate)} - {notice.targetRole === "all" ? "All Staff" : roleLabel(notice.targetRole)}
                    </small>
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, color: "var(--ink-700)", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{notice.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="data-table-empty" style={{ border: "1px dashed var(--line)", borderRadius: "var(--radius-md)", padding: "18px", textAlign: "center" }}>
          No current notices
        </div>
      )}
    </section>
  );
};
