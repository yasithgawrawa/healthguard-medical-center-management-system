export const shortRecordId = (value, prefix = "ID") => {
  const raw = typeof value === "string" ? value : value?._id || value?.id;
  if (!raw) return `${prefix}-PENDING`;
  return `${prefix}-${String(raw).slice(-6).toUpperCase()}`;
};

export const fullName = (user, fallback = "Patient") => {
  if (!user || typeof user === "string") return fallback;
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || fallback;
};

export const patientLabel = (patient, fallback = "Patient") => {
  if (!patient) return `${shortRecordId(null, "PAT")} - ${fallback}`;
  if (typeof patient === "string") return `${shortRecordId(patient, "PAT")} - ${fallback}`;
  return `${shortRecordId(patient, "PAT")} - ${fullName(patient, fallback)}`;
};

export const customerLabel = (record, fallback = "Walk-in Customer") => {
  if (record?.patientId) return patientLabel(record.patientId, "Patient");
  if (record?.customerName) {
    return `${shortRecordId(record, "CUS")} - ${record.customerName}`;
  }
  return `${shortRecordId(record, "CUS")} - ${fallback}`;
};
