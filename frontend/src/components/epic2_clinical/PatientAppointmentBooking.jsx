import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CalendarCheck, CheckCircle2, Clock, RefreshCw, Send, Stethoscope } from "lucide-react";
import { patientApi } from "../../services/patientApi.js";
import { ConfirmDialog } from "../shared/ConfirmDialog.jsx";

const initialForm = {
  doctorId: "",
  appointmentDate: "",
  appointmentDay: "",
  slotLabel: "",
  reason: ""
};

const REASON_MIN = 5;
const REASON_MAX = 300;
const ALERT_DISMISS_MS = 6000;

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

export const PatientAppointmentBooking = ({ onBooked }) => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const messageTimer = useRef(null);
  const errorTimer = useRef(null);

  // Auto-dismiss alerts
  useEffect(() => {
    if (message) {
      clearTimeout(messageTimer.current);
      messageTimer.current = setTimeout(() => setMessage(""), ALERT_DISMISS_MS);
    }
    return () => clearTimeout(messageTimer.current);
  }, [message]);

  useEffect(() => {
    if (error) {
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setError(""), ALERT_DISMISS_MS);
    }
    return () => clearTimeout(errorTimer.current);
  }, [error]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === form.doctorId),
    [doctors, form.doctorId]
  );

  useEffect(() => {
    patientApi
      .getDoctors()
      .then((data) => {
        setDoctors(data || []);
        if (data && data.length === 1) {
          setForm((prev) => ({ ...prev, doctorId: data[0]._id }));
        }
      })
      .catch(() => setError("Unable to load doctors. Ask an admin to seed or create doctor accounts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDay) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    patientApi
      .getAppointmentSlots({ doctorId: form.doctorId, date: form.appointmentDay })
      .then(setSlots)
      .catch(() => setError("Unable to load appointment slots for the selected date."))
      .finally(() => setLoadingSlots(false));
  }, [form.doctorId, form.appointmentDay]);

  const availableSlots = useMemo(() => slots.filter((slot) => slot.available), [slots]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.doctorId) nextErrors.doctorId = "Select a doctor";
    if (!form.appointmentDay) nextErrors.appointmentDay = "Appointment date is required";
    if (!form.appointmentDate) nextErrors.appointmentDate = "Select an available slot";
    if (form.reason.trim().length < REASON_MIN) nextErrors.reason = `Reason must be at least ${REASON_MIN} characters`;
    if (form.reason.trim().length > REASON_MAX) nextErrors.reason = "Reason is too long";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitClick = (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const confirmBooking = async () => {
    setConfirmOpen(false);
    setSubmitting(true);

    try {
      await patientApi.bookAppointment({
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        slotLabel: form.slotLabel,
        reason: form.reason
      });
      setMessage("Appointment booked successfully! You will receive an invoice for the consultation fee.");
      setForm(doctors.length === 1 ? { ...initialForm, doctorId: doctors[0]._id } : initialForm);
      setSlots([]);
      onBooked?.();
    } catch (err) {
      setError(err.response?.data?.message || "Appointment booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const doctorDisplayName = (doctor) => {
    const fullName = `${doctor.firstName} ${doctor.lastName}`.trim();
    return fullName.startsWith("Dr.") ? fullName : `Dr. ${fullName}`;
  };

  const selectedSlot = slots.find((s) => s.startsAt === form.appointmentDate);
  const reasonLength = form.reason.length;
  const reasonOverLimit = reasonLength > REASON_MAX;

  return (
    <section className="operation-panel" id="book-appointment">
      <div className="operation-header">
        <div>
          <h2>Book An Appointment</h2>
          <p>Select a doctor, appointment time, slot and reason. The booking is saved under your patient account.</p>
        </div>
        <CalendarCheck size={24} color="var(--brand-600)" />
      </div>

      {message ? (
        <div className="success-alert" style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      ) : null}
      {error ? (
        <div className="form-alert" style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <form className="operation-actions-grid" onSubmit={handleSubmitClick}>
        <div className="operation-form-card">
          <h3>Appointment Details</h3>
          <label className={`form-field${fieldErrors.doctorId ? " has-error" : ""}`}>
            <span>Doctor</span>
            <select
              value={form.doctorId}
              onChange={(event) => setField("doctorId", event.target.value)}
              required
              disabled={loading || submitting || doctors.length === 1}
              aria-invalid={Boolean(fieldErrors.doctorId)}
            >
              <option value="">{loading ? "Loading doctors..." : "Select doctor"}</option>
              {doctors.map((doctor) => (
                <option value={doctor._id} key={doctor._id}>
                  {doctorDisplayName(doctor)}
                </option>
              ))}
            </select>
            {fieldErrors.doctorId ? <small>{fieldErrors.doctorId}</small> : null}
          </label>

          {/* Doctor info card */}
          {selectedDoctor ? (
            <div style={{
              background: "var(--surface-raised, #f0f4ff)",
              border: "1px solid var(--border-subtle, #d0d7e6)",
              borderRadius: "10px",
              padding: "14px 16px",
              margin: "4px 0 8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Stethoscope size={16} color="var(--brand-600)" />
                <strong style={{ fontSize: "0.95rem" }}>{doctorDisplayName(selectedDoctor)}</strong>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary, #5a6577)" }}>
                <span>💰 Consultation Fee: <strong style={{ color: "var(--text-primary, #1a202c)" }}>{money(selectedDoctor.consultationFee)}</strong></span>
              </div>
            </div>
          ) : null}

          <label className={`form-field${fieldErrors.appointmentDay ? " has-error" : ""}`}>
            <span>Appointment Date</span>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={form.appointmentDay}
              onChange={(event) => {
                setField("appointmentDay", event.target.value);
                setField("appointmentDate", "");
                setField("slotLabel", "");
              }}
              required
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.appointmentDay)}
            />
            {fieldErrors.appointmentDay ? <small>{fieldErrors.appointmentDay}</small> : null}
          </label>
        </div>

        <div className="operation-form-card">
          <h3>Visit Reason</h3>
          <label className={`form-field${fieldErrors.appointmentDate ? " has-error" : ""}`}>
            <span>Available Slot {availableSlots.length > 0 ? <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "var(--text-secondary, #5a6577)" }}>({availableSlots.length} available)</span> : null}</span>
            <select
              value={form.appointmentDate}
              onChange={(event) => {
                const slot = slots.find((item) => item.startsAt === event.target.value);
                setField("appointmentDate", event.target.value);
                setField("slotLabel", slot?.label || "");
              }}
              required
              disabled={submitting || loadingSlots || !availableSlots.length}
              aria-invalid={Boolean(fieldErrors.appointmentDate)}
            >
              <option value="">
                {loadingSlots ? "Loading slots..." : availableSlots.length === 0 && form.appointmentDay ? "No slots available for this date" : "Select available slot"}
              </option>
              {availableSlots.map((slot) => (
                <option value={slot.startsAt} key={slot.startsAt}>
                  {slot.label}
                </option>
              ))}
            </select>
            {fieldErrors.appointmentDate ? <small>{fieldErrors.appointmentDate}</small> : null}
          </label>

          {/* Selected slot preview */}
          {selectedSlot ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--brand-600)", margin: "0 0 6px", fontWeight: 500 }}>
              <Clock size={14} />
              <span>{selectedSlot.label} — {new Date(form.appointmentDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          ) : null}

          <label className={`form-field${fieldErrors.reason ? " has-error" : ""}`}>
            <span>Reason</span>
            <textarea
              value={form.reason}
              onChange={(event) => setField("reason", event.target.value)}
              placeholder="Briefly describe your visit reason"
              rows={3}
              required
              disabled={submitting}
              maxLength={REASON_MAX + 10}
              aria-invalid={Boolean(fieldErrors.reason)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "18px" }}>
              {fieldErrors.reason ? <small>{fieldErrors.reason}</small> : <span />}
              <small style={{
                color: reasonOverLimit ? "var(--danger, #e53e3e)" : reasonLength >= REASON_MAX * 0.85 ? "var(--warning, #d69e2e)" : "var(--text-secondary, #5a6577)",
                fontWeight: reasonOverLimit ? 600 : 400,
                fontSize: "0.78rem",
                flexShrink: 0
              }}>
                {reasonLength}/{REASON_MAX}
              </small>
            </div>
          </label>

          <button className="submit-button" type="submit" disabled={submitting || loading}>
            {submitting ? <RefreshCw className="spin-animation" size={16} /> : <Send size={16} />}
            <span>{submitting ? "Booking..." : "Book Appointment"}</span>
          </button>
        </div>
      </form>

      {/* Booking confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Appointment Booking"
        message={
          selectedDoctor && form.appointmentDay
            ? `Book appointment with ${doctorDisplayName(selectedDoctor)} on ${new Date(form.appointmentDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${form.slotLabel || "selected slot"}?\n\nConsultation Fee: ${money(selectedDoctor.consultationFee)}\n\nAn invoice will be generated automatically.`
            : "Confirm this appointment booking?"
        }
        confirmLabel="Confirm Booking"
        busy={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmBooking}
      />
    </section>
  );
};
