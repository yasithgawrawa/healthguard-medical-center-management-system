import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
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

const todayInputValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const announcementFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Title cannot exceed 120 characters"),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(1000, "Message cannot exceed 1000 characters"),
  publishedDate: z.string().min(1, "Published date is required"),
  expiryDate: z.string().optional(),
  targetRole: z.enum(["all", ...STAFF_ROLES.map((role) => role.value)])
}).refine((data) => !data.expiryDate || data.expiryDate >= data.publishedDate, {
  path: ["expiryDate"],
  message: "Expiry date cannot be earlier than published date"
});

const createAnnouncementFormSchema = announcementFormSchema
  .refine((data) => data.publishedDate >= todayInputValue(), {
    path: ["publishedDate"],
    message: "Published date cannot be in the past"
  })
  .refine((data) => !data.expiryDate || data.expiryDate >= todayInputValue(), {
    path: ["expiryDate"],
    message: "Expiry date cannot be in the past"
  });

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const formValuesFor = (announcement) => ({
  title: announcement?.title || "",
  message: announcement?.message || "",
  publishedDate: dateInputValue(announcement?.publishedDate) || todayInputValue(),
  expiryDate: dateInputValue(announcement?.expiryDate),
  targetRole: announcement?.targetRole || "all"
});

const announcementStatus = (announcement) => {
  const now = new Date();
  const publishedDate = new Date(announcement.publishedDate);
  const expiryDate = announcement.expiryDate ? new Date(announcement.expiryDate) : null;
  if (publishedDate > now) return "scheduled";
  if (expiryDate && expiryDate < now) return "expired";
  return "active";
};

const statusLabel = (status) => ({ active: "Current", scheduled: "Scheduled", expired: "Expired" }[status] || status);
const targetLabel = (targetRole) => targetRole === "all" ? "All Staff" : roleLabel(targetRole);

export const StaffAnnouncementManagementPanel = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [modal, setModal] = useState({ type: null, announcement: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(modal.type === "create" ? createAnnouncementFormSchema : announcementFormSchema),
    mode: "onChange",
    defaultValues: formValuesFor()
  });
  const selectedPublishedDate = watch("publishedDate");
  const minimumCreateDate = todayInputValue();
  const minimumCreateExpiryDate = selectedPublishedDate && selectedPublishedDate > minimumCreateDate
    ? selectedPublishedDate
    : minimumCreateDate;

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
    if (["create", "edit"].includes(modal.type)) reset(formValuesFor(modal.announcement));
  }, [modal, reset]);

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return announcements.filter((announcement) => {
      const values = [announcement.announcementId, announcement.title, announcement.message, targetLabel(announcement.targetRole)]
        .join(" ")
        .toLowerCase();
      return (
        (!query || values.includes(query)) &&
        (!status || announcementStatus(announcement) === status) &&
        (!targetRole || announcement.targetRole === targetRole)
      );
    });
  }, [announcements, search, status, targetRole]);

  const openDetails = async (announcement) => {
    setBusy(true);
    try {
      const details = await e1Api.getAnnouncement(announcement._id);
      setModal({ type: "view", announcement: details });
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load announcement details" });
    } finally {
      setBusy(false);
    }
  };

  const saveAnnouncement = async (values) => {
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
        setToast({ type: "success", message: "Announcement updated successfully" });
      } else {
        await e1Api.createAnnouncement(payload);
        setToast({ type: "success", message: "Announcement published successfully" });
      }
      setModal({ type: null, announcement: null });
      await loadAnnouncements();
    } catch (error) {
      const response = error.response?.data;
      Object.entries(response?.errors || {}).forEach(([field, message]) => {
        setError(field.replace(/^body\./, ""), { type: "server", message });
      });
      setToast({ type: "error", message: response?.message || "Unable to save announcement" });
    } finally {
      setBusy(false);
    }
  };

  const removeAnnouncement = async () => {
    setBusy(true);
    try {
      await e1Api.deleteAnnouncement(modal.announcement._id);
      setToast({ type: "success", message: "Announcement deleted successfully" });
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
    { key: "targetRole", header: "Target", render: (item) => targetLabel(item.targetRole) },
    { key: "publishedDate", header: "Published", render: (item) => formatDate(item.publishedDate) },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const currentStatus = announcementStatus(item);
        return currentStatus === "active" ? <StatusBadge status="active" /> : <span className={`announcement-status ${currentStatus}`}>{statusLabel(currentStatus)}</span>;
      }
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="announcement-row-actions">
          <button type="button" title="View announcement" aria-label={`View ${item.title}`} onClick={() => openDetails(item)} disabled={busy}>
            <Eye size={17} />
          </button>
          <button type="button" title="Edit announcement" aria-label={`Edit ${item.title}`} onClick={() => setModal({ type: "edit", announcement: item })}>
            <Pencil size={17} />
          </button>
          <button className="danger-icon-button" type="button" title="Delete announcement" aria-label={`Delete ${item.title}`} onClick={() => setModal({ type: "delete", announcement: item })}>
            <Trash2 size={17} />
          </button>
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
            <p>Publish notices for all staff or a selected staff role.</p>
          </div>
          <button className="button-primary" type="button" onClick={() => setModal({ type: "create", announcement: null })}>
            <Plus size={17} />
            <span>New Announcement</span>
          </button>
        </div>

        <div className="table-toolbar announcement-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search ID, title or message" />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[
            { value: "active", label: "Current" },
            { value: "scheduled", label: "Scheduled" },
            { value: "expired", label: "Expired" }
          ]} />
          <FilterSelect label="Target" value={targetRole} onChange={setTargetRole} options={targetRoleOptions} />
        </div>

        <DataTable columns={columns} rows={filteredAnnouncements} emptyText="No announcements match the selected filters." />
      </section>

      <Modal
        open={["create", "edit"].includes(modal.type)}
        title={modal.type === "edit" ? "Edit Staff Announcement" : "Create Staff Announcement"}
        subtitle="The notice will appear only during its active dates and for its selected audience."
        onClose={() => setModal({ type: null, announcement: null })}
      >
        <form onSubmit={handleSubmit(saveAnnouncement)}>
          <div className="form-grid">
            <FormInput label="Title" maxLength={120} required error={errors.title?.message} {...register("title")} />
            <FormSelect label="Target Role" required error={errors.targetRole?.message} {...register("targetRole")}>
              {targetRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </FormSelect>
            <FormInput
              label="Published Date"
              type="date"
              min={modal.type === "create" ? minimumCreateDate : undefined}
              required
              error={errors.publishedDate?.message}
              {...register("publishedDate")}
            />
            <FormInput
              label="Expiry Date"
              type="date"
              min={modal.type === "create" ? minimumCreateExpiryDate : undefined}
              error={errors.expiryDate?.message}
              {...register("expiryDate")}
            />
          </div>
          <FormTextarea label="Message" rows={5} maxLength={1000} required error={errors.message?.message} {...register("message")} />
          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, announcement: null })} disabled={busy}>Cancel</button>
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
            <div><span>Target</span><strong>{targetLabel(modal.announcement.targetRole)}</strong></div>
            <div><span>Published</span><strong>{formatDate(modal.announcement.publishedDate)}</strong></div>
            <div><span>Expiry</span><strong>{formatDate(modal.announcement.expiryDate)}</strong></div>
            <div><span>Status</span><strong>{statusLabel(announcementStatus(modal.announcement))}</strong></div>
            <div className="announcement-detail-message"><span>Message</span><strong>{modal.announcement.message}</strong></div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={modal.type === "delete"}
        title={`Delete ${modal.announcement?.announcementId || "announcement"}?`}
        message="This notice will be permanently removed and will disappear from staff dashboards after refresh."
        confirmLabel="Delete Announcement"
        busy={busy}
        onCancel={() => setModal({ type: null, announcement: null })}
        onConfirm={removeAnnouncement}
      />
    </>
  );
};
