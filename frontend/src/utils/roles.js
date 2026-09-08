export const ROLES = Object.freeze({
  PATIENT: "patient",
  ADMIN: "admin",
  MANAGER: "manager",
  DOCTOR: "doctor",
  NURSE: "nurse",
  PHARMACIST: "pharmacist",
  CASHIER: "cashier",
  LAB_ASSISTANT: "lab_assistant"
});

export const DASHBOARD_PATH_BY_ROLE = Object.freeze({
  [ROLES.PATIENT]: "/patient",
  [ROLES.ADMIN]: "/admin",
  [ROLES.MANAGER]: "/manager",
  [ROLES.DOCTOR]: "/doctor",
  [ROLES.NURSE]: "/nurse",
  [ROLES.PHARMACIST]: "/pharmacist",
  [ROLES.CASHIER]: "/cashier",
  [ROLES.LAB_ASSISTANT]: "/lab"
});
