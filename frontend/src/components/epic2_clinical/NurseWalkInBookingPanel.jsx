import { CalendarPlus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { clinicalApi } from "../../services/clinicalApi.js";
import { e1Api } from "../../services/e1Api.js";
import { stripNonPhone } from "../../utils/validationSchemas.js";
import { Toast } from "../shared/Toast.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormTextarea } from "../shared/forms/FormTextarea.jsx";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  doctorId: "",
  appointmentDay: "",
  appointmentDate: "",
  slotLabel: "",
  reason: ""
};

const REASON_MIN = 5;
const REASON_MAX = 300;
const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(?:\+94|0)?[1-9]\d{8}$/;

const localDateKey = (value) => {
  const date = value ? new Date(value) : new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isValidLocalPhone = (value) => PHONE_PATTERN.test(String(value || "").replace(/[\s\-().]/g, ""));
const isWithinBirthDateRange = (value) => {
  if (!value) return true;
  const selected = new Date(value);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const oldest = new Date();
  oldest.setFullYear(oldest.getFullYear() - 120);
  oldest.setHours(0, 0, 0, 0);
  return selected <= today && selected >= oldest;
};

export const NurseWalkInBookingPanel = ({ onBooked }) => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    clinicalApi
      .listDoctors()
      .then((data) => {
        const nextDoctors = data || [];
        setDoctors(nextDoctors);
        if (nextDoctors.length >= 1) {
          setForm((current) => ({ ...current, doctorId: nextDoctors[0]._id }));
        }
      })
      .catch(() => setToast({ type: "error", message: "Unable to load doctors for walk-in booking" }));
  }, []);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDay) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    clinicalApi
      .getAppointmentSlots({ doctorId: form.doctorId, date: form.appointmentDay })
      .then((data) => setSlots(data || []))
      .catch(() => {
        setSlots([]);
        setToast({ type: "error", message: "Unable to load available slots" });
      })
      .finally(() => setLoadingSlots(false));
  }, [form.doctorId, form.appointmentDay]);

  const setField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "doctorId" || field === "appointmentDay") {
        next.appointmentDate = "";
        next.slotLabel = "";
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const selectSlot = (slot) => {
    if (!slot.available) return;
    setForm((current) => ({
      ...current,
      appointmentDate: slot.startsAt,
      slotLabel: slot.label
    }));
    setErrors((current) => ({ ...current, appointmentDate: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const reason = form.reason.trim();
    const address = form.address.trim();

    if (!firstName) nextErrors.firstName = "First name is required";
    else if (firstName.length < 2) nextErrors.firstName = "First name must be at least 2 characters";
    else if (firstName.length > 60) nextErrors.firstName = "First name is too long";
    else if (!NAME_PATTERN.test(firstName)) nextErrors.firstName = "First name can only contain letters, spaces, apostrophes, periods or hyphens";

    if (!lastName) nextErrors.lastName = "Last name is required";
    else if (lastName.length < 2) nextErrors.lastName = "Last name must be at least 2 characters";
    else if (lastName.length > 60) nextErrors.lastName = "Last name is too long";
    else if (!NAME_PATTERN.test(lastName)) nextErrors.lastName = "Last name can only contain letters, spaces, apostrophes, periods or hyphens";

    if (!form.phone.trim()) nextErrors.phone = "Phone number is required";
    else if (!isValidLocalPhone(form.phone)) nextErrors.phone = "Enter a valid phone number, e.g. 0712175244";

    if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) nextErrors.email = "Enter a valid email";
    if (address.length > 250) nextErrors.address = "Address is too long";
    if (form.dateOfBirth && !isWithinBirthDateRange(form.dateOfBirth)) nextErrors.dateOfBirth = "Date of birth cannot be in the future or older than 120 years";
    if (!form.doctorId) nextErrors.doctorId = "No active doctor is available for booking";
    if (!form.appointmentDay) nextErrors.appointmentDay = "Appointment date is required";
    else if (form.appointmentDay < localDateKey()) nextErrors.appointmentDay = "Appointment date cannot be in the past";
    if (!form.appointmentDate) nextErrors.appointmentDate = "Select an available slot";
    if (!reason) nextErrors.reason = "Reason / complaint is required";
    else if (reason.length < REASON_MIN) nextErrors.reason = `Reason must be at least ${REASON_MIN} characters`;
    else if (reason.length > REASON_MAX) nextErrors.reason = `Reason cannot exceed ${REASON_MAX} characters`;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      const created = await e1Api.createQuickPatient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined
      });
      const patientId = created.patient?._id || created.patient?.id;

      await clinicalApi.createAppointment({
        patientId,
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        slotLabel: form.slotLabel,
        reason: form.reason.trim()
      });

      setToast({ type: "success", message: "Walk-in appointment created as an internal patient record." });
      setForm({ ...initialForm, doctorId: doctors[0]?._id || "" });
      setSlots([]);
      onBooked?.();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to create walk-in booking" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="e1-panel" id="walk-in-booking">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="e1-panel-header">
        <div>
          <h2>Walk-In Booking</h2>
          <p>Create a doctor appointment only when an unregistered patient visits the clinic and asks for a slot.</p>
        </div>
        <CalendarPlus size={24} color="#0f4c81" />
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="form-grid">
          <FormInput label="First Name" required maxLength={60} value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} error={errors.firstName} />
          <FormInput label="Last Name" required maxLength={60} value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} error={errors.lastName} />
          <FormInput label="Phone" required value={form.phone} onChange={(event) => setField("phone", stripNonPhone(event.target.value))} error={errors.phone} placeholder="0712175244" />
          <FormInput label="Email" type="email" maxLength={120} value={form.email} onChange={(event) => setField("email", event.target.value)} error={errors.email} placeholder="Optional patient email" />
          <FormInput label="Date of Birth" type="date" max={localDateKey()} value={form.dateOfBirth} onChange={(event) => setField("dateOfBirth", event.target.value)} error={errors.dateOfBirth} />
          <label className="form-field">
            <span>Gender</span>
            <select value={form.gender} onChange={(event) => setField("gender", event.target.value)}>
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </label>
          <FormInput label="Address" value={form.address} onChange={(event) => setField("address", event.target.value)} error={errors.address} maxLength={250} containerStyle={{ gridColumn: "1 / -1" }} />
        </div>

        <div className="form-grid">
          <FormInput
            label="Appointment Date"
            type="date"
            required
            min={localDateKey()}
            value={form.appointmentDay}
            onChange={(event) => setField("appointmentDay", event.target.value)}
            error={errors.appointmentDay}
          />
          {errors.doctorId ? <p className="form-error" style={{ alignSelf: "end", margin: 0 }}>{errors.doctorId}</p> : null}
        </div>

        {form.doctorId && form.appointmentDay ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#0f172a" }}>Available Slots</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
              {loadingSlots ? (
                <span style={{ color: "#64748b", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <RefreshCw size={13} /> Loading slots...
                </span>
              ) : slots.length ? slots.map((slot) => {
                const selected = form.appointmentDate === slot.startsAt;
                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    className={selected ? "button-primary" : "button-secondary"}
                    disabled={!slot.available || busy}
                    onClick={() => selectSlot(slot)}
                    style={{ padding: "8px 10px", fontSize: "0.84rem", opacity: slot.available ? 1 : 0.5 }}
                  >
                    {slot.label}
                  </button>
                );
              }) : (
                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No available slots for this date.</span>
              )}
            </div>
            {errors.appointmentDate ? <small style={{ color: "var(--danger, #e11d48)" }}>{errors.appointmentDate}</small> : null}
          </div>
        ) : null}

        <FormTextarea
          label="Reason / Complaint"
          rows={3}
          required
          maxLength={REASON_MAX}
          value={form.reason}
          onChange={(event) => setField("reason", event.target.value)}
          error={errors.reason}
          placeholder="Short reason for this doctor appointment"
        />

        <div className="modal-actions">
          <button className="button-secondary" type="button" disabled={busy} onClick={() => setForm({ ...initialForm, doctorId: doctors[0]?._id || "" })}>
            Clear
          </button>
          <button className="button-primary" type="submit" disabled={busy || loadingSlots}>
            {busy ? "Creating..." : "Create Walk-In Appointment"}
          </button>
        </div>
      </form>
    </section>
  );
};
