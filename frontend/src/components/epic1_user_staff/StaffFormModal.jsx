import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { requiredEmployeeId, requiredMoney, requiredName, requiredPhone, requiredTextNoNumbers, stripDigits, stripNonId, stripNonPhone } from "../../utils/validationSchemas.js";
import { STAFF_ROLES } from "./e1Constants.js";

const baseSchema = z.object({
  firstName: requiredName("First name"),
  lastName: requiredName("Last name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: requiredPhone,
  employeeId: requiredEmployeeId,
  department: requiredTextNoNumbers("Department", 80),
  role: z.string().min(1, "Role is required"),
  employmentDate: z.string().min(1, "Employment date is required"),
  baseSalary: requiredMoney("Base salary").min(0.01, "Base salary must be greater than 0"),
  allowances: requiredMoney("Allowances"),
  deductions: requiredMoney("Deductions"),
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
  baseSalary: staff?.baseSalary ?? 0,
  allowances: staff?.allowances ?? 0,
  deductions: staff?.deductions ?? 0,
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
    mode: "onChange",
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
          <FormInput label="First Name" placeholder="Amara" sanitize={stripDigits} error={errors.firstName?.message} {...register("firstName")} />
          <FormInput label="Last Name" placeholder="Perera" sanitize={stripDigits} error={errors.lastName?.message} {...register("lastName")} />
          <FormInput label="Email" type="email" placeholder="doctor@healthguard.local" disabled={isEdit} error={errors.email?.message} {...register("email")} />
          <FormInput label="Phone" placeholder="+94 77 123 4501" inputMode="tel" sanitize={stripNonPhone} error={errors.phone?.message} {...register("phone")} />
        </div>

        <div className="form-section-title">Employment Information</div>
        <div className="form-grid">
          <FormInput label="Employee ID" placeholder="HG-DOC-001" disabled={isEdit} sanitize={stripNonId} error={errors.employeeId?.message} {...register("employeeId")} />
          <FormInput label="Department" placeholder="OPD" sanitize={stripDigits} error={errors.department?.message} {...register("department")} />
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

        <div className="form-section-title">Salary Information</div>
        <div className="form-grid-3">
          <FormInput label="Base Salary" placeholder="95000.00" type="number" min="0" step="0.01" error={errors.baseSalary?.message} {...register("baseSalary")} />
          <FormInput label="Allowances" placeholder="5000.00" type="number" min="0" step="0.01" error={errors.allowances?.message} {...register("allowances")} />
          <FormInput label="Deductions" placeholder="1500.00" type="number" min="0" step="0.01" error={errors.deductions?.message} {...register("deductions")} />
        </div>

        {!isEdit ? (
          <>
            <div className="form-section-title">Account</div>
            <FormInput label="Temporary Password" type="password" placeholder="Admin@12345" error={errors.password?.message} {...register("password")} />
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
