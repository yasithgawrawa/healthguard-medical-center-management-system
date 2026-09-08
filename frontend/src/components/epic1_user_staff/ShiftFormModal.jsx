import { zodResolver } from "@hookform/resolvers/zod";
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
    location: z.string().trim().min(2, "Location is required").max(120, "Location is too long"),
    notes: optionalText("Notes", 250)
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    path: ["endTime"],
    message: "End time must be after start time"
  });

export const ShiftFormModal = ({ open, staff = [], onClose, onSubmit, busy }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(shiftSchema),
    defaultValues: { staffId: "", startTime: "", endTime: "", location: "", notes: "" }
  });

  const submit = async (values) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Modal open={open} title="Create Shift" subtitle="Schedule an active staff member for duty." onClose={onClose}>
      <form onSubmit={handleSubmit(submit)}>
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
          <FormInput label="Location" error={errors.location?.message} {...register("location")} />
          <FormInput label="Start" type="datetime-local" error={errors.startTime?.message} {...register("startTime")} />
          <FormInput label="End" type="datetime-local" error={errors.endTime?.message} {...register("endTime")} />
        </div>
        <FormInput label="Notes" error={errors.notes?.message} {...register("notes")} />
        <div className="modal-actions">
          <button className="button-secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button-primary" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create Shift"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
