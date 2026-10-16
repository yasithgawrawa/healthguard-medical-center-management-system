import { test } from "node:test";
import assert from "node:assert/strict";
import { createAppointment, listAppointmentSlots, rescheduleAppointment } from "../src/components/epic2_clinical/controllers/clinicalController.js";
import { Appointment } from "../src/components/epic2_clinical/models/Appointment.js";
import { User } from "../src/components/epic1_user_staff/models/User.js";
import { Invoice } from "../src/components/epic4_billing/models/Invoice.js";
import { ROLES } from "../src/shared/constants/roles.js";

const patientId = "patient-id";
const doctorId = "doctor-id";
const day = "2099-01-01";
const doctor = { _id: doctorId, firstName: "Test", lastName: "Doctor", consultationFee: 3500 };
const atClinicTime = (time) => new Date(`${day}T${time}:00.000+05:30`);

// View Appointment Slots | Tests | Capture the controller response without starting a server or database.
const response = () => ({ status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("lists 14 hourly Sri Lanka slots through 10 PM and keeps booked slots unavailable", async (t) => {
  t.mock.method(User, "findOne", async () => doctor);
  t.mock.method(Appointment, "find", () => ({ select: async () => [{ appointmentDate: atClinicTime("22:00") }] }));
  const res = response();

  await listAppointmentSlots({ query: { doctorId, date: day } }, res);

  const slots = res.body.data;
  assert.equal(slots.length, 14);
  assert.equal(slots[0].startsAt, atClinicTime("09:00").toISOString());
  assert.equal(slots.at(-1).startsAt, atClinicTime("22:00").toISOString());
  assert.equal(slots.at(-1).label, "Evening 22:00");
  assert.equal(slots.at(-1).available, false);
  assert.equal(slots.filter((slot) => slot.available).length, 13);
});

// Book Appointment | Tests | Mock account and persistence calls while exercising the real clinic-hour validation.
const prepareBooking = (t) => {
  t.mock.method(User, "findOne", (filter) => filter.role === ROLES.PATIENT
    ? { select: async () => ({ _id: patientId }) }
    : Promise.resolve(doctor));
  t.mock.method(Appointment, "findOne", async () => null);
  t.mock.method(Appointment, "create", async (payload) => ({ _id: "appointment-id", ...payload }));
  t.mock.method(Invoice, "create", async () => ({}));
};

// Reschedule Appointment | Tests | Supply an owned future booking and mock its database writes.
const prepareReschedule = (t) => {
  t.mock.method(Appointment, "findById", async () => ({
    _id: "appointment-id", patientId, doctorId, status: "booked",
    appointmentDate: atClinicTime("09:00"), save: async () => {}
  }));
  t.mock.method(Appointment, "findOne", async () => null);
  t.mock.method(User, "findById", () => ({ select: async () => doctor }));
  t.mock.method(Invoice, "findOne", async () => null);
};

const request = (time) => ({
  user: { _id: patientId, role: ROLES.PATIENT }, params: { id: "appointment-id" },
  body: { doctorId, appointmentDate: atClinicTime(time), slotLabel: `Evening ${time}`, reason: "Routine checkup" }
});

for (const [name, handler, prepare] of [
  ["booking", createAppointment, prepareBooking],
  ["rescheduling", rescheduleAppointment, prepareReschedule]
]) {
  test(`${name} accepts every added hourly slot from 5 PM through 10 PM`, async (t) => {
    prepare(t);
    for (let hour = 17; hour <= 22; hour += 1) {
      const res = response();
      await handler(request(`${hour}:00`), res);
      assert.equal(res.body.success, true, `${hour}:00 should be accepted`);
      assert.equal(res.body.data.appointmentDate.toISOString(), atClinicTime(`${hour}:00`).toISOString());
    }
  });

  test(`${name} rejects times before opening, after 10 PM, and between hourly slots`, async (t) => {
    prepare(t);
    for (const time of ["08:00", "23:00", "22:30"]) {
      await assert.rejects(() => handler(request(time), response()), (error) => {
        assert.equal(error.statusCode, 400);
        assert.match(error.message, /Invalid appointment slot/);
        return true;
      });
    }
  });
}
