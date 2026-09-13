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
  baseSalary: requiredMoney("Base salary").min(0.01, "Base salary must be greater than 0"),
  allowances: requiredMoney("Allowances"),
  deductions: requiredMoney("Deductions"),
  password: z.string().optional()
});

const createSchema = baseSchema.extend({
  password: z
    .string({ required_error: "Temporary password is required" })
    .min(8, "Temporary password must be at least 8 characters")
    .regex(/[a-z]/, "Must include at least one lowercase letter")
    .regex(/[A-Z]/, "Must include at least one uppercase letter")
    .regex(/[0-9]/, "Must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Must include at least one special character (e.g. @, #, $, !)")
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
  department: staff?.department || "General",
  role: staff?.role || "",
  employmentDate: staff?.employmentDate ? new Date(staff.employmentDate).toISOString().slice(0, 10) : "",
  baseSalary: staff?.baseSalary ?? 0,
  allowances: staff?.allowances ?? 0,
  deductions: staff?.deductions ?? 0,
  password: ""
});

export const StaffFormModal = ({ open, mode = "create", staff, existingStaff = [], serverErrors, onClose, onSubmit, busy }) => {
  const isEdit = mode === "edit";
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

  useEffect(() => {
    reset(toFormValues(staff));
  }, [staff, reset, open]);

  useEffect(() => {
    if (serverErrors && typeof serverErrors === "object") {
      Object.entries(serverErrors).forEach(([field, msg]) => {
        const cleanField = field.replace(/^body\./, "");
        setError(cleanField, { type: "server", message: msg });
      });
    }
  }, [serverErrors, setError]);

  useEffect(() => {
    if (!isEdit && open && selectedRole) {
      const nextId = generateNextEmployeeId(selectedRole, existingStaff);
      setValue("employeeId", nextId, { shouldValidate: true });
    }
  }, [selectedRole, isEdit, open, existingStaff, setValue]);

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
      <form onSubmit={handleSubmit(submit)}>
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
              onChange: (e) => {
                if (!isEdit && e.target.value) {
                  const nextId = generateNextEmployeeId(e.target.value, existingStaff);
                  setValue("employeeId", nextId, { shouldValidate: true });
                }
              }
            })}
          >
            <option value="">Select role</option>
            {STAFF_ROLES.map((role) => (
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
