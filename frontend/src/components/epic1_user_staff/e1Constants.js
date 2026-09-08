export const STAFF_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "cashier", label: "Cashier" },
  { value: "lab_assistant", label: "Lab Assistant" }
];

export const LEAVE_TYPES = [
  { value: "annual", label: "Annual" },
  { value: "sick", label: "Sick" },
  { value: "casual", label: "Casual" },
  { value: "unpaid", label: "Unpaid" }
];

export const SHIFT_STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

export const roleLabel = (role) => STAFF_ROLES.find((item) => item.value === role)?.label || role;

export const staffName = (staff) => {
  const user = staff?.userId || {};
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unassigned Staff";
};

export const formatDate = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
};

export const formatTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(new Date(value));
};
