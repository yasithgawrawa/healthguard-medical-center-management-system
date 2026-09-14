import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { optionalText, requiredFutureDateTime } from "../../utils/validationSchemas.js";
import { roleLabel, staffName } from "./e1Constants.js";

const shiftSchema = z
  .object({
    staffId: z.string().min(1, "Select an active staff member"),
    startTime: requiredFutureDateTime("Start time"),
    endTime: z.string().min(1, "End time is required"),
    notes: optionalText("Notes", 250)
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    path: ["endTime"],
    message: "End time must be after start time"
  });

const bulkShiftSchema = z
  .object({
    staffIds: z.array(z.string()).min(1, "Select at least one active staff member"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    weekdays: z.array(z.coerce.number()).min(1, "Select at least one weekday"),
    notes: optionalText("Notes", 250)
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    path: ["endDate"],
    message: "End date must be on or after start date"
  })
  .refine((data) => data.endTime > data.startTime, {
    path: ["endTime"],
    message: "End time must be after start time"
  });

const weekdays = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" }
];

const today = () => new Date().toISOString().slice(0, 10);

export const ShiftFormModal = ({ open, staff = [], onClose, onSubmit, onBulkSubmit, busy }) => {
  const [mode, setMode] = useState("single");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(mode === "bulk" ? bulkShiftSchema : shiftSchema),
    mode: "onChange",
    defaultValues: {
      staffId: "",
      startTime: "",
      endTime: "",
      notes: "",
      staffIds: [],
      startDate: today(),
      endDate: today(),
      weekdays: [1, 2, 3, 4, 5]
    }
  });

  const selectedStaffIds = watch("staffIds") || [];
  const selectedWeekdays = watch("weekdays") || [];

  const submit = async (values) => {
    if (mode === "bulk") {
      await onBulkSubmit(values);
    } else {
      await onSubmit(values);
    }
    reset();
  };

  const toggleStaff = (id) => {
    const next = selectedStaffIds.includes(id)
      ? selectedStaffIds.filter((item) => item !== id)
      : [...selectedStaffIds, id];
    setValue("staffIds", next, { shouldValidate: true, shouldDirty: true });
  };

  const toggleWeekday = (day) => {
    const next = selectedWeekdays.map(Number).includes(day)
      ? selectedWeekdays.filter((item) => Number(item) !== day)
      : [...selectedWeekdays, day];
    setValue("weekdays", next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Modal open={open} title="Create Shift" subtitle="All staff attendance is checked against the single Health Guard clinic location." onClose={onClose}>
      <form onSubmit={handleSubmit(submit)}>
        <div className="e1-tabbar" style={{ marginBottom: "16px" }}>
          <button className={mode === "single" ? "active" : ""} type="button" onClick={() => setMode("single")}>
            <UserPlus size={15} /> Single Shift
          </button>
          <button className={mode === "bulk" ? "active" : ""} type="button" onClick={() => setMode("bulk")}>
            <CalendarDays size={15} /> Bulk Roster
          </button>
        </div>

        {mode === "single" ? (
          <div className="form-grid">
            <FormSelect label="Employee" error={errors.staffId?.message} {...register("staffId")}>
              <option value="">Search or select employee</option>
              {staff
                .filter((item) => item.status === "active")
                .map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.employeeId} - {staffName(item)} - {roleLabel(item.role)}
                  </option>
                ))}
            </FormSelect>
            <FormInput label="Start" type="datetime-local" error={errors.startTime?.message} {...register("startTime")} />
            <FormInput label="End" type="datetime-local" error={errors.endTime?.message} {...register("endTime")} />
          </div>
        ) : (
          <>
            <div className="form-grid">
              <FormInput label="Start Date" type="date" min={today()} error={errors.startDate?.message} {...register("startDate")} />
              <FormInput label="End Date" type="date" min={today()} error={errors.endDate?.message} {...register("endDate")} />
              <FormInput label="Start Time" type="time" error={errors.startTime?.message} {...register("startTime")} />
              <FormInput label="End Time" type="time" error={errors.endTime?.message} {...register("endTime")} />
            </div>
            <div className="form-section-title">Working Days</div>
            <div className="inline-actions" style={{ gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
              {weekdays.map((day) => (
                <button
                  className={selectedWeekdays.map(Number).includes(day.value) ? "button-primary" : "button-secondary"}
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  style={{ minWidth: "58px", justifyContent: "center" }}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {errors.weekdays ? <p className="form-error">{errors.weekdays.message}</p> : null}
            <div className="form-section-title">Staff To Schedule</div>
            <div style={{ maxHeight: "220px", overflow: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px" }}>
              {staff.filter((item) => item.status === "active").map((item) => (
                <label key={item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "8px 10px", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                  <span>
                    <strong>{item.employeeId}</strong> - {staffName(item)}
                    <small style={{ display: "block", color: "#64748b" }}>{roleLabel(item.role)} - {item.department || "General"}</small>
                  </span>
                  <input type="checkbox" checked={selectedStaffIds.includes(item._id)} onChange={() => toggleStaff(item._id)} />
                </label>
              ))}
            </div>
            {errors.staffIds ? <p className="form-error">{errors.staffIds.message}</p> : null}
          </>
        )}
        <FormInput label="Notes" placeholder="Morning OPD coverage" error={errors.notes?.message} {...register("notes")} />
        <div className="modal-actions">
          <button className="button-secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button-primary" type="submit" disabled={busy}>
            {busy ? "Creating..." : mode === "bulk" ? "Create Roster" : "Create Shift"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
