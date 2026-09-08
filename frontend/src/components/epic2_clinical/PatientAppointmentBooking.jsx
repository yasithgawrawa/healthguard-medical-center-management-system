import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, RefreshCw, Send } from "lucide-react";
import { patientApi } from "../../services/patientApi.js";

const initialForm = {
  doctorId: "",
  appointmentDate: "",
  appointmentDay: "",
  slotLabel: "",
  reason: ""
};

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

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === form.doctorId),
    [doctors, form.doctorId]
  );

  useEffect(() => {
    patientApi
      .getDoctors()
      .then(setDoctors)
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

  const validate = () => {
    const nextErrors = {};
    if (!form.doctorId) nextErrors.doctorId = "Select a doctor";
    if (!form.appointmentDay) nextErrors.appointmentDay = "Appointment date is required";
    if (!form.appointmentDate) nextErrors.appointmentDate = "Select an available slot";
    if (form.reason.trim().length < 5) nextErrors.reason = "Reason must be at least 5 characters";
    if (form.reason.trim().length > 300) nextErrors.reason = "Reason is too long";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!validate()) return;
    setSubmitting(true);

    try {
      await patientApi.bookAppointment({
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        slotLabel: form.slotLabel,
        reason: form.reason
      });
      setMessage("Appointment booked and saved to MongoDB.");
      setForm(initialForm);
      onBooked?.();
    } catch (err) {
      setError(err.response?.data?.message || "Appointment booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="operation-panel" id="book-appointment">
      <div className="operation-header">
        <div>
          <h2>Book An Appointment</h2>
          <p>Select a doctor, appointment time, slot and reason. The booking is saved to MongoDB under your patient account.</p>
        </div>
        <CalendarCheck size={24} color="var(--brand-600)" />
      </div>

      {message ? <div className="success-alert" style={{ marginTop: "16px" }}>{message}</div> : null}
      {error ? <div className="form-alert" style={{ marginTop: "16px" }}>{error}</div> : null}

      <form className="operation-actions-grid" onSubmit={submit}>
        <div className="operation-form-card">
          <h3>Appointment Details</h3>
          <label className={`form-field${fieldErrors.doctorId ? " has-error" : ""}`}>
            <span>Doctor</span>
            <select
              value={form.doctorId}
              onChange={(event) => setField("doctorId", event.target.value)}
              required
              disabled={loading || submitting}
              aria-invalid={Boolean(fieldErrors.doctorId)}
            >
              <option value="">{loading ? "Loading doctors..." : "Select doctor"}</option>
              {doctors.map((doctor) => (
                <option value={doctor._id} key={doctor._id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
            {fieldErrors.doctorId ? <small>{fieldErrors.doctorId}</small> : null}
          </label>
          <label className={`form-field${fieldErrors.appointmentDay ? " has-error" : ""}`}>
            <span>Appointment Date</span>
            <input
              type="date"
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
          <label className={`form-field${fieldErrors.slotLabel ? " has-error" : ""}`}>
            <span>Available Slot</span>
            <select
              value={form.appointmentDate}
              onChange={(event) => {
                const slot = slots.find((item) => item.startsAt === event.target.value);
                setField("appointmentDate", event.target.value);
                setField("slotLabel", slot?.label || "");
              }}
              required
              disabled={submitting || loadingSlots || !slots.length}
              aria-invalid={Boolean(fieldErrors.appointmentDate || fieldErrors.slotLabel)}
            >
              <option value="">{loadingSlots ? "Loading slots..." : "Select available slot"}</option>
              {slots.map((slot) => (
                <option value={slot.startsAt} key={slot.startsAt} disabled={!slot.available}>
                  {slot.label}{slot.available ? "" : " - unavailable"}
                </option>
              ))}
            </select>
            {fieldErrors.appointmentDate || fieldErrors.slotLabel ? <small>{fieldErrors.appointmentDate || fieldErrors.slotLabel}</small> : null}
          </label>
          <label className={`form-field${fieldErrors.reason ? " has-error" : ""}`}>
            <span>Reason</span>
            <textarea
              value={form.reason}
              onChange={(event) => setField("reason", event.target.value)}
              placeholder="Briefly describe your visit reason"
              rows={3}
              required
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.reason)}
            />
            {fieldErrors.reason ? <small>{fieldErrors.reason}</small> : null}
          </label>
          {selectedDoctor ? (
            <p className="section-description" style={{ margin: "0 0 12px" }}>
              Booking with Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
            </p>
          ) : null}
          <button className="submit-button" type="submit" disabled={submitting || loading}>
            {submitting ? <RefreshCw className="spin-animation" size={16} /> : <Send size={16} />}
            <span>{submitting ? "Booking..." : "Book Appointment"}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
