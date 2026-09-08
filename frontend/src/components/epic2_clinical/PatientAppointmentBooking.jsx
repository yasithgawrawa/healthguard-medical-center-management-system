import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, RefreshCw, Send } from "lucide-react";
import { patientApi } from "../../services/patientApi.js";

const initialForm = {
  doctorId: "",
  appointmentDate: "",
  slotLabel: "",
  reason: ""
};

export const PatientAppointmentBooking = ({ onBooked }) => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      await patientApi.bookAppointment(form);
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
          <label className="form-field">
            <span>Doctor</span>
            <select
              value={form.doctorId}
              onChange={(event) => setField("doctorId", event.target.value)}
              required
              disabled={loading || submitting}
            >
              <option value="">{loading ? "Loading doctors..." : "Select doctor"}</option>
              {doctors.map((doctor) => (
                <option value={doctor._id} key={doctor._id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Date and Time</span>
            <input
              type="datetime-local"
              value={form.appointmentDate}
              onChange={(event) => setField("appointmentDate", event.target.value)}
              required
              disabled={submitting}
            />
          </label>
        </div>

        <div className="operation-form-card">
          <h3>Visit Reason</h3>
          <label className="form-field">
            <span>Slot</span>
            <input
              value={form.slotLabel}
              onChange={(event) => setField("slotLabel", event.target.value)}
              placeholder="Morning Slot"
              required
              disabled={submitting}
            />
          </label>
          <label className="form-field">
            <span>Reason</span>
            <textarea
              value={form.reason}
              onChange={(event) => setField("reason", event.target.value)}
              placeholder="Briefly describe your visit reason"
              rows={3}
              required
              disabled={submitting}
            />
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
