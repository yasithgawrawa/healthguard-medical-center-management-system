// Build consistent names and short references for patients, staff, and walk-in customers.
// Create a short, prefixed display reference from a stored record ID.
export const shortRecordId = (value, prefix = "ID") => {
  const raw = typeof value === "string" ? value : value?._id || value?.id;
  if (!raw) return `${prefix}-PENDING`;
  return `${prefix}-${String(raw).slice(-6).toUpperCase()}`;
};

// Join available first and last names and use a fallback when no name is available.
export const fullName = (user, fallback = "Patient") => {
  if (!user || typeof user === "string") return fallback;
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || fallback;
};

// Build a patient label using available identity and registration details.
export const patientLabel = (patient, fallback = "Patient") => {
  if (!patient) return `${shortRecordId(null, "PAT")} - ${fallback}`;
  if (typeof patient === "string") return `${shortRecordId(patient, "PAT")} - ${fallback}`;
  return `${shortRecordId(patient, "PAT")} - ${fullName(patient, fallback)}`;
};

// Build a label for the registered patient or walk-in customer attached to a record.
export const customerLabel = (record, fallback = "Walk-in Customer") => {
  if (record?.patientId) return patientLabel(record.patientId, "Patient");
  if (record?.customerName) {
    return `${shortRecordId(record, "CUS")} - ${record.customerName}`;
  }
  return `${shortRecordId(record, "CUS")} - ${fallback}`;
};
