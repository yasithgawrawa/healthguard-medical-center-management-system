import { Megaphone, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { e1Api } from "../../services/e1Api.js";
import { formatDate, roleLabel } from "./e1Constants.js";

const targetLabel = (targetRole) => targetRole === "all" ? "All Staff" : roleLabel(targetRole);

export const StaffNoticesPanel = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotices = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await e1Api.listCurrentAnnouncements();
      setNotices(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load staff notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <section className="e1-panel staff-notices-panel" id="staff-notices">
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
      ) : loading ? (
        <div className="staff-notices-empty">Loading notices...</div>
      ) : !loading && notices.length === 0 ? (
        <div className="staff-notices-empty">No current notices</div>
      ) : (
        <div className="staff-notices-list" aria-live="polite">
          {notices.map((notice) => (
            <article className="staff-notice" key={notice._id || notice.announcementId}>
              <span className="staff-notice-icon" aria-hidden="true"><Megaphone size={18} /></span>
              <div className="staff-notice-content">
                <div className="staff-notice-heading">
                  <h3>{notice.title}</h3>
                  <span>{formatDate(notice.publishedDate)}</span>
                </div>
                <p>{notice.message}</p>
                <small>{targetLabel(notice.targetRole)}</small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
