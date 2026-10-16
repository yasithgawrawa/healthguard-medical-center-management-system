import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { Modal } from "../shared/Modal.jsx";
import { requiredEmployeeId, requiredMoney, requiredName, requiredPhone, requiredTextNoNumbers, stripDigits, stripNonId, stripNonPhone } from "../../utils/validationSchemas.js";
import { STAFF_ROLES } from "./e1Constants.js";

export const ROLE_PREFIX_MAP = {
  admin: "ADM",
  manager: "MGR",
  doctor: "DOC",
  nurse: "NUR",
  pharmacist: "PHA",
  cashier: "CAS",
  lab_assistant: "LAB"
};

// Add Staff | Frontend Logic | Suggest the next role-prefixed employee ID from the currently loaded staff list.
export const generateNextEmployeeId = (role, staffList = []) => {
  if (!role) return "";
  const prefix = ROLE_PREFIX_MAP[role] || "EMP";
  const regex = new RegExp(`^HG-${prefix}-([0-9]+)$`, "i");
  let maxNum = 0;
  for (const s of staffList) {
    const eid = s?.employeeId || "";
    const match = eid.match(regex);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > maxNum) maxNum = parsed;
    }
  }
  return `HG-${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
};

// Add Staff | Frontend Validation | Validate base values including first name, last name, email, phone, employee id.
// Update Staff | Frontend Validation | Validate base values including first name, last name, email, phone, employee id.
const baseSchema = z.object({
  firstName: requiredName("First name"),
  lastName: requiredName("Last name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: requiredPhone,
  employeeId: z.string().optional(),
  department: z.string().optional().default("General"),
  role: z.string().min(1, "Role is required"),
  employmentDate: z
    .string({ required_error: "Employment date is required", invalid_type_error: "Employment date is required" })
    .min(1, "Employment date is required")
    .refine((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !isNaN(selected.getTime()) && selected <= today;
    }, "Employment date must be in the past"),
  shiftRate: requiredMoney("Daily pay").min(0.01, "Daily pay must be greater than 0"),
  allowances: requiredMoney("Fixed allowances"),
  deductions: requiredMoney("Fixed deductions"),
  password: z.string().optional()
});

// Add Staff | Frontend Validation | Validate create values including password.
const createSchema = baseSchema.extend({
  password: z
    .string({ required_error: "Temporary password is required" })
    .min(8, "Temporary password must be at least 8 characters")
    .regex(/[a-z]/, "Must include at least one lowercase letter")
    .regex(/[A-Z]/, "Must include at least one uppercase letter")
    .regex(/[0-9]/, "Must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Must include at least one special character (e.g. @, #, $, !)")
});

// Update Staff | Frontend Validation | Validate edit values including email, employee id, password.
const editSchema = baseSchema.omit({ email: true, employeeId: true }).extend({
  email: z.string().optional(),
  employeeId: z.string().optional(),
  password: z.string().optional()
});

// Add Staff | Form Logic | Convert a staff record and populated user details into editable form values.
// Update Staff | Form Logic | Convert a staff record and populated user details into editable form values.
const toFormValues = (staff) => ({
  firstName: staff?.userId?.firstName || "",
  lastName: staff?.userId?.lastName || "",
  email: staff?.userId?.email || "",
  phone: staff?.userId?.phone || "",
  employeeId: staff?.employeeId || "",
  department: staff?.department || "General",
  role: staff?.role || "",
  employmentDate: staff?.employmentDate ? new Date(staff.employmentDate).toISOString().slice(0, 10) : "",
  shiftRate: staff?.shiftRate ?? (staff?.baseSalary ? Number((Number(staff.baseSalary) / 26).toFixed(2)) : 0),
  allowances: staff?.allowances ?? 0,
  deductions: staff?.deductions ?? 0,
  password: ""
});

// Add Staff | Frontend Logic | Validate and submit staff creation or editing with role-based employee ID defaults.
// Update Staff | Frontend Logic | Validate and submit staff creation or editing with role-based employee ID defaults.
export const StaffFormModal = ({ open, mode = "create", staff, existingStaff = [], serverErrors, onClose, onSubmit, busy }) => {
  const isEdit = mode === "edit";
  const roleOptions = isEdit && staff?.role === "doctor"
    ? STAFF_ROLES
    : STAFF_ROLES.filter((role) => role.value !== "doctor");
  // Connect form fields, validation errors, and submission handling through React Hook Form.
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    mode: "onChange",
    defaultValues: toFormValues(staff)
  });

  const selectedRole = watch("role");

  // Reset the form when its selected record or dialog state changes.
  useEffect(() => {
    reset(toFormValues(staff));
  }, [staff, reset, open]);

  // Synchronize component state or external data when the listed dependencies change.
  useEffect(() => {
    if (serverErrors && typeof serverErrors === "object") {
      Object.entries(serverErrors).forEach(([field, msg]) => {
        const cleanField = field.replace(/^body\./, "");
        setError(cleanField, { type: "server", message: msg });
      });
    }
  }, [serverErrors, setError]);

  // Synchronize dependent form values when the current selection changes.
  useEffect(() => {
    if (!isEdit && open && selectedRole) {
      const nextId = generateNextEmployeeId(selectedRole, existingStaff);
      setValue("employeeId", nextId, { shouldValidate: true });
    }
  }, [selectedRole, isEdit, open, existingStaff, setValue]);

  // Add Staff | Submit Logic | Submit the validated staff form form and show the resulting success or error feedback.
  // Update Staff | Submit Logic | Submit the validated staff form form and show the resulting success or error feedback.
  const submit = (values) => {
    const payload = { ...values };
    if (!payload.employeeId && !isEdit) {
      payload.employeeId = generateNextEmployeeId(values.role, existingStaff);
    }
    if (!payload.department) {
      payload.department = "General";
    }
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
      {/* Add Staff | Dialog | Group the fields or record details for this feature. */}
      {/* Update Staff | Dialog | Group the fields or record details for this feature. */}
      <form onSubmit={handleSubmit(submit)}>
        {/* Add Staff | Form | Render fields, validation feedback, and submission controls for this feature. */}
        {/* Update Staff | Form | Render fields, validation feedback, and submission controls for this feature. */}
        <div className="form-section-title">Personal Information</div>
        <div className="form-grid">
          <FormInput label="First Name" placeholder="Amara" sanitize={stripDigits} error={errors.firstName?.message} {...register("firstName")} />
          <FormInput label="Last Name" placeholder="Perera" sanitize={stripDigits} error={errors.lastName?.message} {...register("lastName")} />
          <FormInput label="Email" type="email" placeholder="doctor@healthguard.com" disabled={isEdit} error={errors.email?.message} {...register("email")} />
          <FormInput label="Phone" placeholder="+94 77 123 4501" inputMode="tel" sanitize={stripNonPhone} error={errors.phone?.message} {...register("phone")} />
        </div>

        <div className="form-section-title">Employment Information</div>
        <div className="form-grid">
          <FormSelect
            label="Role"
            error={errors.role?.message}
            {...register("role", {
              // Add Staff | Frontend Logic | Update the edited field and synchronize its dependent form values.
              // Update Staff | Frontend Logic | Update the edited field and synchronize its dependent form values.
              onChange: (e) => {
                if (!isEdit && e.target.value) {
                  const nextId = generateNextEmployeeId(e.target.value, existingStaff);
                  setValue("employeeId", nextId, { shouldValidate: true });
                }
              }
            })}
          >
            <option value="">Select role</option>
            {roleOptions.map((role) => (
              <option value={role.value} key={role.value}>
                {role.label}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Employee ID (Automated)"
            placeholder="Select role to generate ID"
            readOnly
            style={{ backgroundColor: "#f8fafc", cursor: "not-allowed", fontWeight: 600, color: "#1e40af" }}
            error={errors.employeeId?.message}
            {...register("employeeId")}
          />
          <FormInput
            label="Employment Date"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            error={errors.employmentDate?.message}
            {...register("employmentDate")}
          />
        </div>

        <div className="form-section-title">Simple Salary Setup</div>
        {selectedRole === "doctor" ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px", color: "#166534", fontSize: "0.85rem" }}>
            <strong>Clinic Owner Notice:</strong> The doctor is the clinic owner, compensated per appointment consultation fee, and is exempt from employee salary processing.
          </div>
        ) : (
          <>
            <div className="form-grid-3">
              <FormInput label="Daily Pay (Rs.)" placeholder="3500.00" type="number" min="0" step="0.01" error={errors.shiftRate?.message} {...register("shiftRate")} />
              <FormInput label="Fixed Allowances (Rs.)" placeholder="5000.00" type="number" min="0" step="0.01" error={errors.allowances?.message} {...register("allowances")} />
              <FormInput label="Fixed Deductions (Rs.)" placeholder="1500.00" type="number" min="0" step="0.01" error={errors.deductions?.message} {...register("deductions")} />
            </div>
            <p className="section-description" style={{ margin: "-4px 0 14px" }}>
              Salary uses daily pay x working days + fixed allowances - fixed deductions.
            </p>
          </>
        )}

        {!isEdit ? (
          <>
            <div className="form-section-title">Account</div>
            <FormInput label="Temporary Password" type="password" placeholder="Admin@12345" error={errors.password?.message} {...register("password")} />
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "-6px", marginBottom: "8px" }}>
              Must be at least 8 characters and include uppercase, lowercase, number & special character (e.g. <code>Admin@12345</code>).
            </div>
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
