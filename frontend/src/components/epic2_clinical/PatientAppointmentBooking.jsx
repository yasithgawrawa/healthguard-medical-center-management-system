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

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const selectSlot = (slot) => {
    if (!slot.available) return;
    setForm((current) => ({
      ...current,
      appointmentDate: slot.startsAt,
      slotLabel: slot.label
    }));
    setFieldErrors((current) => ({ ...current, appointmentDate: "" }));
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

  const reasonLength = form.reason.length;
  const reasonOverLimit = reasonLength > REASON_MAX;

  // Format the slot hour for display e.g. "09:00" → "9:00 AM", "14:00" → "2:00 PM"
  const formatSlotTime = (label) => {
    // label is like "Morning 09:00" or "Afternoon 14:00" — extract the hour part
    const parts = label.split(" ");
    const timePart = parts[parts.length - 1]; // "09:00"
    const [hourStr] = timePart.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour < 12 ? "AM" : "PM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  return (
    <section className="operation-panel" id="book-appointment">
      <div className="operation-header">
        <div>
          <h2>Book An Appointment</h2>
          <p>Select a doctor, pick a date, then choose from the available time slots.</p>
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

          {/* Slot picker grid */}
          {form.doctorId && form.appointmentDay ? (
            <div style={{ marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary, #1a202c)" }}>
                  Available Time Slots
                </span>
                {loadingSlots ? (
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #5a6577)" }}>Loading slots...</span>
                ) : (
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #5a6577)" }}>
                    {slots.filter(s => s.available).length} of {slots.length} available
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{
                      height: "52px",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      animation: "pulse 1.5s ease-in-out infinite"
                    }} />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary, #5a6577)", fontSize: "0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #e2e8f0" }}>
                  No slots available for this date
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {slots.map((slot) => {
                    const isSelected = form.appointmentDate === slot.startsAt;
                    const isAvailable = slot.available;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        disabled={!isAvailable || submitting}
                        onClick={() => selectSlot(slot)}
                        title={isAvailable ? `Book ${slot.label}` : "This slot is already booked"}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "2px",
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: isSelected
                            ? "2px solid var(--brand-600, #4f46e5)"
                            : isAvailable
                              ? "1px solid #d1d5db"
                              : "1px solid #e5e7eb",
                          background: isSelected
                            ? "var(--brand-600, #4f46e5)"
                            : isAvailable
                              ? "#ffffff"
                              : "#f3f4f6",
                          color: isSelected
                            ? "#ffffff"
                            : isAvailable
                              ? "var(--text-primary, #1a202c)"
                              : "#9ca3af",
                          cursor: isAvailable ? "pointer" : "not-allowed",
                          fontSize: "0.8rem",
                          fontWeight: isSelected ? 700 : isAvailable ? 500 : 400,
                          transition: "all 0.15s ease",
                          boxShadow: isSelected ? "0 2px 8px rgba(79,70,229,0.3)" : isAvailable ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        <Clock size={12} style={{ opacity: isAvailable ? 1 : 0.4 }} />
                        <span style={{ fontSize: "0.82rem", fontWeight: isSelected ? 700 : 600, lineHeight: 1.2 }}>
                          {formatSlotTime(slot.label)}
                        </span>
                        {!isAvailable ? (
                          <span style={{ fontSize: "0.65rem", color: "#9ca3af", lineHeight: 1 }}>Booked</span>
                        ) : isSelected ? (
                          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>Selected ✓</span>
                        ) : (
                          <span style={{ fontSize: "0.65rem", color: "#6b7280", lineHeight: 1 }}>Available</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected slot confirmation */}
              {form.appointmentDate && form.slotLabel ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  fontSize: "0.84rem", color: "var(--brand-600)", marginTop: "10px",
                  fontWeight: 500, background: "#eef2ff", borderRadius: "6px",
                  padding: "6px 10px", border: "1px solid #c7d2fe"
                }}>
                  <CheckCircle2 size={14} />
                  <span>
                    <strong>{form.slotLabel}</strong> — {new Date(form.appointmentDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              ) : null}

              {fieldErrors.appointmentDate ? (
                <small style={{ color: "var(--danger, #e53e3e)", display: "block", marginTop: "4px" }}>{fieldErrors.appointmentDate}</small>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="operation-form-card">
          <h3>Visit Reason</h3>

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

          {/* Booking summary before submit */}
          {form.appointmentDate && form.slotLabel && selectedDoctor ? (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px",
              padding: "12px 14px", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "6px"
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Booking Summary
              </div>
              <div style={{ fontSize: "0.84rem", color: "#166534", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span>👨‍⚕️ {doctorDisplayName(selectedDoctor)}</span>
                <span>📅 {new Date(form.appointmentDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                <span>⏰ {form.slotLabel}</span>
                <span>💰 Consultation Fee: <strong>{money(selectedDoctor.consultationFee)}</strong></span>
              </div>
            </div>
          ) : null}

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
