import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { STAFF_ROLES } from "./e1Constants.js";

const baseSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Phone is required"),
  employeeId: z.string().trim().min(2, "Employee ID is required"),
  department: z.string().trim().min(2, "Department is required"),
  role: z.string().min(1, "Role is required"),
  employmentDate: z.string().min(1, "Employment date is required"),
  password: z.string().optional()
});

const createSchema = baseSchema.extend({
  password: z.string().min(8, "Temporary password must be at least 8 characters")
});

const editSchema = baseSchema.omit({ email: true, employeeId: true }).extend({
  email: z.string().optional(),
  employeeId: z.string().optional(),
  password: z.string().optional()
});

const toFormValues = (staff) => ({
  firstName: staff?.userId?.firstName || "",
  lastName: staff?.userId?.lastName || "",
  email: staff?.userId?.email || "",
  phone: staff?.userId?.phone || "",
  employeeId: staff?.employeeId || "",
  department: staff?.department || "",
  role: staff?.role || "",
  employmentDate: staff?.employmentDate ? new Date(staff.employmentDate).toISOString().slice(0, 10) : "",
  password: ""
});

export const StaffFormModal = ({ open, mode = "create", staff, onClose, onSubmit, busy }) => {
  const isEdit = mode === "edit";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: toFormValues(staff)
  });

  useEffect(() => {
    reset(toFormValues(staff));
  }, [staff, reset, open]);

  const submit = (values) => {
    const payload = { ...values };
    if (isEdit) {
      delete payload.email;
      delete payload.employeeId;
      delete payload.password;
    }
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Staff" : "Add Staff"}
      subtitle={isEdit ? "Update staff profile and role details." : "Create staff profile and temporary login access."}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(submit)}>
        <div className="form-section-title">Personal Information</div>
        <div className="form-grid">
          <FormInput label="First Name" error={errors.firstName?.message} {...register("firstName")} />
          <FormInput label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
          <FormInput label="Email" type="email" disabled={isEdit} error={errors.email?.message} {...register("email")} />
          <FormInput label="Phone" error={errors.phone?.message} {...register("phone")} />
        </div>

        <div className="form-section-title">Employment Information</div>
        <div className="form-grid">
          <FormInput label="Employee ID" disabled={isEdit} error={errors.employeeId?.message} {...register("employeeId")} />
          <FormInput label="Department" error={errors.department?.message} {...register("department")} />
          <FormSelect label="Role" error={errors.role?.message} {...register("role")}>
            <option value="">Select role</option>
            {STAFF_ROLES.map((role) => (
              <option value={role.value} key={role.value}>
                {role.label}
              </option>
            ))}
          </FormSelect>
          <FormInput label="Employment Date" type="date" error={errors.employmentDate?.message} {...register("employmentDate")} />
        </div>

        {!isEdit ? (
          <>
            <div className="form-section-title">Account</div>
            <FormInput label="Temporary Password" type="password" error={errors.password?.message} {...register("password")} />
          </>
        ) : null}

        <div className="modal-actions">
          <button className="button-secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button-primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : isEdit ? "Update Staff" : "Create Staff"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
