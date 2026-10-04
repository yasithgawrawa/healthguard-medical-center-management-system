import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone, MoreVertical, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { e1Api } from "../../services/e1Api.js";
import { ConfirmDialog } from "../shared/ConfirmDialog.jsx";
import { DataTable } from "../shared/DataTable.jsx";
import { FilterSelect } from "../shared/FilterSelect.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { FormTextarea } from "../shared/forms/FormTextarea.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { StatusBadge } from "../shared/StatusBadge.jsx";
import { Toast } from "../shared/Toast.jsx";
import { formatDate, roleLabel, STAFF_ROLES } from "./e1Constants.js";

const targetRoleOptions = [{ value: "all", label: "All Staff" }, ...STAFF_ROLES];

const todayInputValue = () => new Date().toISOString().slice(0, 10);
const dateInputValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const announcementSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Title cannot exceed 120 characters"),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(1000, "Message cannot exceed 1000 characters"),
  publishedDate: z.string().min(1, "Published date is required"),
  expiryDate: z.string().optional(),
  targetRole: z.string().min(1, "Target role is required")
}).refine((data) => !data.expiryDate || new Date(data.expiryDate) >= new Date(data.publishedDate), {
  path: ["expiryDate"],
  message: "Expiry date cannot be earlier than published date"
});

const toFormValues = (announcement) => ({
  title: announcement?.title || "",
  message: announcement?.message || "",
  publishedDate: dateInputValue(announcement?.publishedDate) || todayInputValue(),
  expiryDate: dateInputValue(announcement?.expiryDate),
  targetRole: announcement?.targetRole || "all"
});

const statusForAnnouncement = (announcement) => {
  const now = new Date();
  const published = new Date(announcement.publishedDate);
  const expiry = announcement.expiryDate ? new Date(announcement.expiryDate) : null;
  if (published > now) return "scheduled";
  if (expiry && expiry < now) return "expired";
  return "active";
};

const statusLabel = (status) => {
  if (status === "scheduled") return "Scheduled";
  if (status === "expired") return "Expired";
  return "Current";
};

export const StaffAnnouncementManagementPanel = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState({ type: null, announcement: null });
  const [menuId, setMenuId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(announcementSchema),
    mode: "onChange",
    defaultValues: toFormValues()
  });

  const loadAnnouncements = async () => {
    try {
      const data = await e1Api.listAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load announcements" });
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    if (modal.type === "create" || modal.type === "edit") {
      reset(toFormValues(modal.announcement));
    }
  }, [modal, reset]);

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return announcements.filter((announcement) => {
      const announcementStatus = statusForAnnouncement(announcement);
      const values = [
        announcement.announcementId,
        announcement.title,
        announcement.message,
        announcement.targetRole === "all" ? "All Staff" : roleLabel(announcement.targetRole)
      ].join(" ").toLowerCase();
      return (!query || values.includes(query)) && (!status || announcementStatus === status);
    });
  }, [announcements, search, status]);

  const openView = async (announcement) => {
    setBusy(true);
    try {
      const details = await e1Api.getAnnouncementDetails(announcement._id);
      setModal({ type: "view", announcement: details });
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load announcement details" });
    } finally {
      setBusy(false);
      setMenuId(null);
    }
  };

  const submitAnnouncement = async (values) => {
    setBusy(true);
    try {
      const payload = {
        title: values.title.trim(),
        message: values.message.trim(),
        publishedDate: values.publishedDate,
        expiryDate: values.expiryDate || null,
        targetRole: values.targetRole
      };

      if (modal.type === "edit") {
        await e1Api.updateAnnouncement(modal.announcement._id, payload);
        setToast({ type: "success", message: "Announcement updated" });
      } else {
        await e1Api.createAnnouncement(payload);
        setToast({ type: "success", message: "Announcement published" });
      }
      setModal({ type: null, announcement: null });
      await loadAnnouncements();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to save announcement" });
    } finally {
      setBusy(false);
    }
  };

  const deleteAnnouncement = async () => {
    setBusy(true);
    try {
      await e1Api.deleteAnnouncement(modal.announcement._id);
      setToast({ type: "success", message: "Announcement deleted" });
      setModal({ type: null, announcement: null });
      await loadAnnouncements();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to delete announcement" });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "announcementId", header: "Announcement ID" },
    { key: "title", header: "Title" },
    { key: "targetRole", header: "Target", render: (item) => (item.targetRole === "all" ? "All Staff" : roleLabel(item.targetRole)) },
    { key: "publishedDate", header: "Published", render: (item) => formatDate(item.publishedDate) },
    { key: "expiryDate", header: "Expiry", render: (item) => formatDate(item.expiryDate) },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const itemStatus = statusForAnnouncement(item);
        return itemStatus === "active" ? <StatusBadge status="active" /> : <span>{statusLabel(itemStatus)}</span>;
      }
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="row-actions">
          <button type="button" onClick={() => setMenuId(menuId === item._id ? null : item._id)} aria-label={`Actions for ${item.title}`}>
            <MoreVertical size={18} />
          </button>
          {menuId === item._id ? (
            <div className="row-action-menu">
              <button type="button" onClick={() => openView(item)}>View</button>
              <button type="button" onClick={() => { setModal({ type: "edit", announcement: item }); setMenuId(null); }}>Edit</button>
              <button type="button" onClick={() => { setModal({ type: "delete", announcement: item }); setMenuId(null); }}>Delete</button>
            </div>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <section className="e1-panel" id="staff-announcements">
        <div className="e1-panel-header">
          <div>
            <h2>Staff Announcement Management</h2>
            <p>Create, update and remove notices shown on staff dashboards.</p>
          </div>
          <button className="button-primary" type="button" onClick={() => setModal({ type: "create", announcement: null })}>
            <Plus size={17} />
            <span>New Announcement</span>
          </button>
        </div>

        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search announcement, message or role" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "active", label: "Current" },
              { value: "scheduled", label: "Scheduled" },
              { value: "expired", label: "Expired" }
            ]}
          />
        </div>

        <DataTable columns={columns} rows={filteredAnnouncements} emptyText="No announcements match the selected filters." />
      </section>

      <Modal
        open={modal.type === "create" || modal.type === "edit"}
        title={modal.type === "edit" ? "Edit Staff Announcement" : "Create Staff Announcement"}
        subtitle="Notices appear only for matching staff roles and active dates."
        onClose={() => setModal({ type: null, announcement: null })}
      >
        <form onSubmit={handleSubmit(submitAnnouncement)}>
          <div className="form-grid">
            <FormInput label="Title" required error={errors.title?.message} {...register("title")} />
            <FormSelect label="Target Role" required error={errors.targetRole?.message} {...register("targetRole")}>
              {targetRoleOptions.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </FormSelect>
            <FormInput label="Published Date" type="date" required error={errors.publishedDate?.message} {...register("publishedDate")} />
            <FormInput label="Expiry Date" type="date" error={errors.expiryDate?.message} {...register("expiryDate")} />
          </div>
          <FormTextarea label="Message" rows={5} required error={errors.message?.message} {...register("message")} />
          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, announcement: null })} disabled={busy}>
              Cancel
            </button>
            <button className="button-primary" type="submit" disabled={busy}>
              <Megaphone size={17} />
              <span>{busy ? "Saving..." : modal.type === "edit" ? "Update Announcement" : "Publish Announcement"}</span>
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal.type === "view"}
        title={modal.announcement?.title || "Announcement Details"}
        subtitle={modal.announcement?.announcementId || ""}
        onClose={() => setModal({ type: null, announcement: null })}
      >
        {modal.announcement ? (
          <div className="detail-grid">
            <div><span>Target</span><strong>{modal.announcement.targetRole === "all" ? "All Staff" : roleLabel(modal.announcement.targetRole)}</strong></div>
            <div><span>Published</span><strong>{formatDate(modal.announcement.publishedDate)}</strong></div>
            <div><span>Expiry</span><strong>{formatDate(modal.announcement.expiryDate)}</strong></div>
            <div><span>Status</span><strong>{statusLabel(statusForAnnouncement(modal.announcement))}</strong></div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span>Message</span>
              <strong style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{modal.announcement.message}</strong>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={modal.type === "delete"}
        title={`Delete ${modal.announcement?.announcementId || "announcement"}?`}
        message="This announcement will disappear from staff dashboards after refresh."
        confirmLabel="Delete"
        busy={busy}
        onCancel={() => setModal({ type: null, announcement: null })}
        onConfirm={deleteAnnouncement}
      />
    </>
  );
};
