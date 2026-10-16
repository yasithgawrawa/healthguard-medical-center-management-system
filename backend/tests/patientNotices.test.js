// Patient Notification Tests | Shared Logic | Verify patient notice authorization, visibility, validation, and read-receipt behavior.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import { env } from "../src/shared/config/env.js";
import { User } from "../src/components/epic1_user_staff/models/User.js";
import { PatientNotice } from "../src/components/epic2_clinical/models/PatientNotice.js";
import { PatientNoticeRead } from "../src/components/epic2_clinical/models/PatientNoticeRead.js";
import { Notification } from "../src/components/epic2_clinical/models/Notification.js";
import { clinicToday, expiryInstant, createPatientNoticeSchema, updatePatientNoticeSchema } from "../src/components/epic2_clinical/validators/patientNoticeValidators.js";

const base = "/api/e2/patient-notices";
let mongo, server, origin;
const actors = {};
// Patient Notification Tests | Shared Logic | Call the test API with the selected method, token, and JSON body.
const request = async (actor, method, path, body) => {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(actor ? { Authorization: `Bearer ${actors[actor].token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return { status: response.status, ...await response.json() };
};
// Create Patient Notification | Shared Logic | Create a test notice through the authenticated notice endpoint.
const create = (actor = "manager", body = {}) => request(actor, "POST", base, { title: "Clinic notice", message: "Please check the clinic opening times.", recipient: "all", ...body });

before(async () => {
  // An ephemeral database only: never connect to MONGODB_URI or production data.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "patient_notice_tests" });
  await Promise.all([User.init(), PatientNotice.init(), PatientNoticeRead.init(), Notification.init()]);
  const passwordHash = await bcrypt.hash("Integration-test-password", 4);
  for (const [name, role] of Object.entries({ manager: "manager", manager2: "manager", patient: "patient", patient2: "patient", admin: "admin", doctor: "doctor", nurse: "nurse", pharmacist: "pharmacist", cashier: "cashier", lab: "lab_assistant" })) {
    const user = await User.create({ firstName: name, lastName: "Tester", email: `${name}@test.invalid`, phone: "0771234567", role, passwordHash });
    actors[name] = { user, token: jwt.sign({ sub: String(user._id) }, env.JWT_SECRET) };
  }
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("manager CRUD, ownership, automatic fields, expiry removal and immutable recipients", async () => {
  const result = await create();
  assert.equal(result.status, 201);
  const notice = result.data;
  assert.match(notice.notificationId, /^PN-[A-F0-9]{24}$/);
  assert.ok(notice.createdAt);
  assert.equal(notice.createdBy, String(actors.manager.user._id));
  assert.ok((await request("manager", "GET", base)).data.some(item => item._id === notice._id));
  assert.deepEqual((await request("manager2", "GET", base)).data, []);
  for (const method of ["PATCH", "DELETE"]) assert.equal((await request("manager2", method, `${base}/${notice._id}`, method === "PATCH" ? { title: "Hijacked" } : undefined)).status, 404);
  const changed = await request("manager", "PATCH", `${base}/${notice._id}`, { title: "Updated", message: "Updated message", expiryDate: clinicToday() });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.title, "Updated");
  assert.equal(changed.data.message, "Updated message");
  assert.equal(changed.data.expiryDate, expiryInstant(clinicToday()).toISOString());
  assert.equal((await request("manager", "PATCH", `${base}/${notice._id}`, { expiryDate: null })).data.expiryDate, null);
  assert.equal((await request("manager", "PATCH", `${base}/${notice._id}`, { recipient: "one", patientId: String(actors.patient.user._id) })).status, 400);
  assert.equal((await request("manager", "DELETE", `${base}/${notice._id}`)).status, 200);
  assert.equal((await request("manager", "DELETE", `${base}/${notice._id}`)).status, 404);
});

test("management and patient endpoints enforce every role", async () => {
  assert.equal((await request(null, "GET", base)).status, 401);
  assert.equal((await request(null, "GET", `${base}/mine`)).status, 401);
  const notice = (await create()).data;
  for (const actor of ["patient", "admin", "doctor", "nurse", "pharmacist", "cashier", "lab"]) {
    assert.equal((await create(actor)).status, 403);
    assert.equal((await request(actor, "GET", base)).status, 403);
    assert.equal((await request(actor, "GET", `${base}/patients`)).status, 403);
    assert.equal((await request(actor, "PATCH", `${base}/${notice._id}`, { title: "Denied" })).status, 403);
    assert.equal((await request(actor, "DELETE", `${base}/${notice._id}`)).status, 403);
  }
  for (const actor of ["manager", "admin", "doctor"]) {
    assert.equal((await request(actor, "GET", `${base}/mine`)).status, 403);
    assert.equal((await request(actor, "PATCH", `${base}/${notice._id}/read`)).status, 403);
  }
});

test("selected-patient privacy, forged identity, and unavailable reads", async () => {
  const privateNotice = (await create("manager", { recipient: "one", patientId: String(actors.patient.user._id) })).data;
  assert.ok((await request("patient", "GET", `${base}/mine`)).data.some(item => item._id === privateNotice._id));
  assert.ok(!(await request("patient2", "GET", `${base}/mine?patientId=${actors.patient.user._id}`)).data.some(item => item._id === privateNotice._id));
  assert.equal((await request("patient2", "PATCH", `${base}/${privateNotice._id}/read`, { patientId: String(actors.patient.user._id) })).status, 404);
  const ownRead = await request("patient", "PATCH", `${base}/${privateNotice._id}/read`, { patientId: String(actors.patient2.user._id) });
  assert.equal(ownRead.status, 200);
  assert.equal(await PatientNoticeRead.countDocuments({ noticeId: privateNotice._id, patientId: actors.patient2.user._id }), 0);
  const visible = (await request("patient", "GET", `${base}/mine`)).data.find(item => item._id === privateNotice._id);
  assert.ok(!("patientId" in visible));
  assert.ok(!("createdBy" in visible));
});

test("broadcast read status is individual, persistent, and idempotent under concurrency", async () => {
  const notice = (await create()).data;
  for (const actor of ["patient", "patient2"]) assert.equal((await request(actor, "GET", `${base}/mine`)).data.find(item => item._id === notice._id).readAt, null);
  const reads = await Promise.all(Array.from({ length: 5 }, () => request("patient", "PATCH", `${base}/${notice._id}/read`)));
  reads.forEach(result => assert.equal(result.status, 200));
  assert.equal(new Set(reads.map(result => result.data.readAt)).size, 1);
  assert.equal(await PatientNoticeRead.countDocuments({ noticeId: notice._id }), 1);
  assert.equal((await request("patient2", "GET", `${base}/mine`)).data.find(item => item._id === notice._id).readAt, null);
  await request("manager", "PATCH", `${base}/${notice._id}`, { title: "Edited after reading" });
  assert.equal((await request("patient", "GET", `${base}/mine`)).data.find(item => item._id === notice._id).readAt, reads[0].data.readAt);
  await request("patient2", "PATCH", `${base}/${notice._id}/read`);
  assert.equal(await PatientNoticeRead.countDocuments({ noticeId: notice._id }), 2);
  await request("manager", "DELETE", `${base}/${notice._id}`);
  assert.equal(await PatientNoticeRead.countDocuments({ noticeId: notice._id }), 0);
  assert.equal((await request("patient", "PATCH", `${base}/${notice._id}/read`)).status, 404);
});

test("expiry filtering, today boundary, and newest-first ordering", async () => {
  const old = await PatientNotice.create({ title: "Old", message: "Old notice", recipient: "all", createdBy: actors.manager.user._id, expiryDate: new Date(Date.now() - 1000) });
  const today = (await create("manager", { title: "Expires today", expiryDate: clinicToday() })).data;
  const newest = (await create("manager", { title: "Newest" })).data;
  const visible = (await request("patient", "GET", `${base}/mine`)).data;
  assert.ok(!visible.some(item => item._id === String(old._id)));
  assert.ok(visible.some(item => item._id === today._id));
  assert.equal(visible[0]._id, newest._id);
  assert.equal((await request("patient", "PATCH", `${base}/${old._id}/read`)).status, 404);
  assert.ok((await request("manager", "GET", base)).data.some(item => item._id === String(old._id)));
});

test("validation rejects invalid writes and limits patient lookup fields", async () => {
  for (const body of [ { title: " " }, { message: " " }, { recipient: "invalid" }, { recipient: "one" }, { recipient: "one", patientId: "invalid" }, { recipient: "one", patientId: String(actors.doctor.user._id) }, { recipient: "one", patientId: String(new mongoose.Types.ObjectId()) }, { patientId: String(actors.patient.user._id) }, { expiryDate: "2000-01-01" }, { expiryDate: "2099-02-30" }, { title: "x".repeat(121) }, { message: "x".repeat(1001) }, { createdBy: String(actors.manager2.user._id) }, { readAt: new Date().toISOString() } ]) {
    assert.equal((await create("manager", body)).status, 400, JSON.stringify(body));
  }
  const notice = (await create()).data;
  for (const body of [{}, { title: " " }, { expiryDate: "2000-01-01" }, { notificationId: "forged" }]) assert.equal((await request("manager", "PATCH", `${base}/${notice._id}`, body)).status, 400);
  assert.equal((await request("manager", "PATCH", `${base}/invalid`, { title: "Hello" })).status, 400);
  const patients = (await request("manager", "GET", `${base}/patients?search=patient2`)).data;
  assert.equal(patients.length, 1);
  assert.deepEqual(Object.keys(patients[0]).sort(), ["_id", "firstName", "lastName"]);
  assert.deepEqual((await request("manager", "GET", `${base}/patients?search=%2E%2A`)).data, []);
  await User.updateOne({ _id: actors.patient2.user._id }, { status: "inactive" });
  assert.equal((await create("manager", { recipient: "one", patientId: String(actors.patient2.user._id) })).status, 400);
  await User.updateOne({ _id: actors.patient2.user._id }, { status: "active" });
});

test("lab notification listing and reading remain compatible", async () => {
  const lab = await Notification.create({ patientId: actors.patient.user._id, type: "lab_result", title: "Result ready", message: "Your result is ready", relatedModel: "LabRequest", relatedId: new mongoose.Types.ObjectId(), createdBy: actors.doctor.user._id });
  const path = "/api/e2/clinical/notifications";
  assert.ok((await request("patient", "GET", path)).data.some(item => item._id === String(lab._id)));
  assert.ok(!(await request("patient2", "GET", path)).data.some(item => item._id === String(lab._id)));
  assert.equal((await request("patient2", "PATCH", `${path}/${lab._id}/read`)).status, 404);
  assert.equal((await request("patient", "PATCH", `${path}/${lab._id}/read`)).status, 200);
});

test("schema enforces recipient integrity and unique read constraint", async () => {
  await assert.rejects(new PatientNotice({ title: "Title", message: "Message", recipient: "one", createdBy: actors.manager.user._id }).validate());
  await assert.rejects(new PatientNotice({ title: "Title", message: "Message", recipient: "all", patientId: actors.patient.user._id, createdBy: actors.manager.user._id }).validate());
  const notice = (await create()).data;
  await PatientNoticeRead.create({ noticeId: notice._id, patientId: actors.patient.user._id });
  await assert.rejects(PatientNoticeRead.create({ noticeId: notice._id, patientId: actors.patient.user._id }), error => error.code === 11000);
  assert.ok(createPatientNoticeSchema.safeParse({ body: { title: "Title", message: "Message", recipient: "all", expiryDate: clinicToday() } }).success);
  assert.ok(!updatePatientNoticeSchema.safeParse({ params: { id: notice._id }, body: { expiryDate: "2099-02-30" } }).success);
});
