import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./shared/config/database.js";
import { ROLES } from "./shared/constants/roles.js";
import { Attendance } from "./components/epic1_user_staff/models/Attendance.js";
import { CenterLocation } from "./components/epic1_user_staff/models/CenterLocation.js";
import { LeaveRequest } from "./components/epic1_user_staff/models/LeaveRequest.js";
import { Shift } from "./components/epic1_user_staff/models/Shift.js";
import { Staff } from "./components/epic1_user_staff/models/Staff.js";
import { User } from "./components/epic1_user_staff/models/User.js";
import { Appointment } from "./components/epic2_clinical/models/Appointment.js";
import { Consultation } from "./components/epic2_clinical/models/Consultation.js";
import { LabRequest } from "./components/epic2_clinical/models/LabRequest.js";
import { Notification } from "./components/epic2_clinical/models/Notification.js";
import { Prescription } from "./components/epic2_clinical/models/Prescription.js";
import { Vitals } from "./components/epic2_clinical/models/Vitals.js";
import { Medicine } from "./components/epic3_inventory/models/Medicine.js";
import { MedicineBatch } from "./components/epic3_inventory/models/MedicineBatch.js";
import { PharmacySale } from "./components/epic3_inventory/models/PharmacySale.js";
import { Purchase } from "./components/epic3_inventory/models/Purchase.js";
import { Supplier } from "./components/epic3_inventory/models/Supplier.js";
import { Invoice } from "./components/epic4_billing/models/Invoice.js";
import { Payment } from "./components/epic4_billing/models/Payment.js";
import { Payroll } from "./components/epic4_billing/models/Payroll.js";

await connectDatabase();

const defaultPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
const passwordHash = await bcrypt.hash(defaultPassword, 12);
const now = new Date();
const month = now.toISOString().slice(0, 7);

const atTime = (dayOffset, hour, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const staffUsers = [
  ["System", "Admin", process.env.SEED_ADMIN_EMAIL || "admin@healthguard.local", "+94112555000", ROLES.ADMIN, "HG-ADM-001", "Administration", "2021-01-04"],
  ["Kavinda", "Jayawardena", "manager@healthguard.local", "+94112555001", ROLES.MANAGER, "HG-MGR-001", "Operations", "2021-02-15"],
  ["Amara", "Perera", "doctor@healthguard.local", "+94771234501", ROLES.DOCTOR, "HG-DOC-001", "OPD", "2020-08-10"],
  ["Ishara", "Silva", "nurse@healthguard.local", "+94771234503", ROLES.NURSE, "HG-NUR-001", "Triage", "2022-03-12"],
  ["Sanduni", "Rathnayake", "nurse2@healthguard.local", "+94771234504", ROLES.NURSE, "HG-NUR-002", "Ward", "2023-01-18"],
  ["Dinesh", "Gunasekara", "pharmacist@healthguard.local", "+94771234505", ROLES.PHARMACIST, "HG-PHA-001", "Pharmacy", "2021-09-01"],
  ["Malsha", "Wijesinghe", "cashier@healthguard.local", "+94771234506", ROLES.CASHIER, "HG-CAS-001", "Billing", "2022-11-07"],
  ["Tharindu", "Abeysekara", "lab@healthguard.local", "+94771234507", ROLES.LAB_ASSISTANT, "HG-LAB-001", "Laboratory", "2022-06-21"]
];

const salaryByEmployeeId = {
  "HG-ADM-001": { baseSalary: 180000, allowances: 10000, deductions: 2500 },
  "HG-MGR-001": { baseSalary: 165000, allowances: 9000, deductions: 2200 },
  "HG-DOC-001": { baseSalary: 240000, allowances: 15000, deductions: 4000 },
  "HG-DOC-002": { baseSalary: 260000, allowances: 16000, deductions: 4200 },
  "HG-NUR-001": { baseSalary: 95000, allowances: 5000, deductions: 1500 },
  "HG-NUR-002": { baseSalary: 92000, allowances: 4500, deductions: 1300 },
  "HG-PHA-001": { baseSalary: 120000, allowances: 5000, deductions: 1500 },
  "HG-CAS-001": { baseSalary: 85000, allowances: 4000, deductions: 1200 },
  "HG-LAB-001": { baseSalary: 98000, allowances: 4500, deductions: 1400 }
};

const patientUsers = [
  ["Saman", "Kumara", "saman.kumara@example.lk", "+94712345671", "No. 24, Galle Road, Colombo 03", "1984-04-16", "male"],
  ["Nethmi", "Herath", "nethmi.herath@example.lk", "+94712345672", "No. 12, Lake Road, Kandy", "1996-10-02", "female"],
  ["Fathima", "Nazeer", "fathima.nazeer@example.lk", "+94712345673", "Main Street, Galle Fort", "1978-01-22", "female"],
  ["Ruwan", "Bandara", "ruwan.bandara@example.lk", "+94712345674", "Temple Road, Kurunegala", "1990-07-09", "male"]
];

const userByEmail = new Map();
const staffByEmployeeId = new Map();

const upsertUser = async ({ firstName, lastName, email, phone, role, address, dateOfBirth, gender }) => {
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: { firstName, lastName, phone, role, status: "active", address, dateOfBirth, gender },
      $setOnInsert: { passwordHash }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  userByEmail.set(email, user);
  return user;
};

for (const [firstName, lastName, email, phone, role, employeeId, department, employmentDate] of staffUsers) {
  const user = await upsertUser({ firstName, lastName, email, phone, role, address: "Health Guard Medical Center, Colombo 07" });
  const salary = salaryByEmployeeId[employeeId];
  let staff = await Staff.findOne({ userId: user._id });
  if (staff) {
    staff.employeeId = employeeId;
    staff.department = department;
    staff.role = role;
    staff.status = "active";
    staff.employmentDate = new Date(employmentDate);
    staff.emergencyContact = "+94112555999";
    staff.baseSalary = salary.baseSalary;
    staff.allowances = salary.allowances;
    staff.deductions = salary.deductions;
    await staff.save();
  } else {
    staff = await Staff.findOneAndUpdate(
      { employeeId },
      { userId: user._id, employeeId, department, role, status: "active", employmentDate: new Date(employmentDate), emergencyContact: "+94112555999", ...salary },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }
  staffByEmployeeId.set(employeeId, staff);
}

for (const [firstName, lastName, email, phone, address, dateOfBirth, gender] of patientUsers) {
  await upsertUser({ firstName, lastName, email, phone, address, dateOfBirth: new Date(dateOfBirth), gender, role: ROLES.PATIENT });
}

await CenterLocation.findOneAndUpdate(
  { key: "primary" },
  {
    key: "primary",
    name: "Health Guard Medical Center - Colombo 07",
    latitude: 6.9147,
    longitude: 79.878,
    radiusMeters: 1000,
    updatedBy: userByEmail.get(process.env.SEED_ADMIN_EMAIL || "admin@healthguard.local")._id
  },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const upsertShift = async (employeeId, dayOffset, startHour, endHour, location) => {
  const staff = staffByEmployeeId.get(employeeId);
  return Shift.findOneAndUpdate(
    { staffId: staff._id, startTime: atTime(dayOffset, startHour), location },
    { staffId: staff._id, startTime: atTime(dayOffset, startHour), endTime: atTime(dayOffset, endHour), location, status: "scheduled", notes: "Sri Lankan demo shift" },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

await Promise.all([
  upsertShift("HG-DOC-001", 0, 8, 16, "OPD Room 1"),
  upsertShift("HG-DOC-002", 0, 10, 18, "Cardiology Room"),
  upsertShift("HG-NUR-001", 0, 7, 15, "Triage Desk"),
  upsertShift("HG-NUR-002", 0, 13, 21, "Ward Station"),
  upsertShift("HG-PHA-001", 0, 8, 17, "Pharmacy Counter"),
  upsertShift("HG-CAS-001", 0, 8, 17, "Billing Counter"),
  upsertShift("HG-LAB-001", 0, 8, 16, "Laboratory"),
  upsertShift("HG-DOC-001", 1, 8, 16, "OPD Room 1"),
  upsertShift("HG-NUR-001", 1, 7, 15, "Triage Desk")
]);

for (const [employeeId, dayOffset, inHour, outHour] of [["HG-NUR-001", -1, 7, 15], ["HG-PHA-001", -1, 8, 17], ["HG-CAS-001", -1, 8, 16], ["HG-LAB-001", -1, 8, 16]]) {
  const staff = staffByEmployeeId.get(employeeId);
  const checkInAt = atTime(dayOffset, inHour, 5);
  await Attendance.findOneAndUpdate(
    { staffId: staff._id, workDate: checkInAt.toISOString().slice(0, 10) },
    {
      staffId: staff._id,
      workDate: checkInAt.toISOString().slice(0, 10),
      checkInAt,
      checkOutAt: atTime(dayOffset, outHour, 2),
      status: "checked_out",
      checkInLocation: { latitude: 6.91472, longitude: 79.87802, accuracyMeters: 15, distanceFromShiftMeters: 4 },
      notes: "Seeded attendance"
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

await LeaveRequest.findOneAndUpdate(
  { staffId: staffByEmployeeId.get("HG-NUR-002")._id, startDate: atTime(2, 0), leaveType: "annual" },
  { staffId: staffByEmployeeId.get("HG-NUR-002")._id, leaveType: "annual", startDate: atTime(2, 0), endDate: atTime(3, 0), reason: "Family commitment in Matara", status: "pending" },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const patients = patientUsers.map(([, , email]) => userByEmail.get(email));
const doctor1 = userByEmail.get("doctor@healthguard.local");
const nurse = userByEmail.get("nurse@healthguard.local");
const labUser = userByEmail.get("lab@healthguard.local");
const cashier = userByEmail.get("cashier@healthguard.local");
const pharmacist = userByEmail.get("pharmacist@healthguard.local");

const appointmentSeeds = [
  [patients[0], doctor1, 0, 9, "Morning 09:00", "Fever and body aches", "checked_in"],
  [patients[1], doctor1, 0, 10, "Morning 10:00", "Follow-up for gastritis", "booked"],
  [patients[2], doctor1, 0, 11, "Morning 11:00", "Chest discomfort", "in_consultation"],
  [patients[3], doctor1, -1, 14, "Afternoon 02:00", "Diabetes review", "completed"]
];

const appointments = [];
for (const [patient, doctor, dayOffset, hour, slotLabel, reason, status] of appointmentSeeds) {
  appointments.push(await Appointment.findOneAndUpdate(
    { doctorId: doctor._id, appointmentDate: atTime(dayOffset, hour), slotLabel },
    { patientId: patient._id, doctorId: doctor._id, appointmentDate: atTime(dayOffset, hour), slotLabel, reason, status },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ));
}

await Vitals.findOneAndUpdate(
  { appointmentId: appointments[0]._id },
  { appointmentId: appointments[0]._id, patientId: appointments[0].patientId, temperature: 38.2, bloodPressure: "120/80", heartRate: 92, weight: 68, height: 171, spo2: 98, recordedBy: nurse._id },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

await Consultation.findOneAndUpdate(
  { appointmentId: appointments[3]._id },
  { appointmentId: appointments[3]._id, patientId: appointments[3].patientId, doctorId: appointments[3].doctorId, diagnosis: "Type 2 diabetes follow-up", clinicalNotes: "Reviewed fasting blood sugar and adjusted diet plan.", finalized: true },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const prescription = await Prescription.findOneAndUpdate(
  { appointmentId: appointments[3]._id },
  {
    appointmentId: appointments[3]._id,
    patientId: appointments[3].patientId,
    doctorId: appointments[3].doctorId,
    items: [{ medicineName: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "30 days", instructions: "After meals" }],
    status: "active"
  },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const ecgRequest = await LabRequest.findOneAndUpdate(
  { appointmentId: appointments[2]._id, testName: "ECG" },
  { appointmentId: appointments[2]._id, patientId: appointments[2].patientId, doctorId: appointments[2].doctorId, testName: "ECG", priority: "urgent", status: "in_progress", verifiedBy: labUser._id },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const fbsRequest = await LabRequest.findOneAndUpdate(
  { appointmentId: appointments[3]._id, testName: "Fasting Blood Sugar" },
  { appointmentId: appointments[3]._id, patientId: appointments[3].patientId, doctorId: appointments[3].doctorId, testName: "Fasting Blood Sugar", priority: "routine", status: "completed", resultSummary: "FBS 112 mg/dL. Continue monitoring.", resultUrl: "https://healthguard.local/reports/fbs-demo.pdf", verifiedBy: labUser._id },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

await Notification.findOneAndUpdate(
  { patientId: ecgRequest.patientId, relatedId: ecgRequest._id, type: "lab_request" },
  { patientId: ecgRequest.patientId, type: "lab_request", title: "New lab test requested", message: "ECG has been requested by your doctor.", relatedModel: "LabRequest", relatedId: ecgRequest._id, createdBy: doctor1._id },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

await Notification.findOneAndUpdate(
  { patientId: fbsRequest.patientId, relatedId: fbsRequest._id, type: "lab_result" },
  { patientId: fbsRequest.patientId, type: "lab_result", title: "Lab result is ready", message: "Fasting Blood Sugar result has been uploaded to your patient portal.", relatedModel: "LabRequest", relatedId: fbsRequest._id, createdBy: labUser._id },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const supplier = await Supplier.findOneAndUpdate(
  { name: "State Pharmaceuticals Corporation" },
  { name: "State Pharmaceuticals Corporation", email: "supplies@spc.lk", phone: "+94112328262", address: "Colombo 07", status: "active" },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const medicineSeeds = [
  ["Paracetamol 500mg", "Analgesic", "tablet", 12, 100],
  ["Amoxicillin 500mg", "Antibiotic", "capsule", 45, 60],
  ["Metformin 500mg", "Diabetes", "tablet", 18, 80],
  ["Salbutamol Inhaler", "Respiratory", "inhaler", 850, 10]
];

const medicines = [];
for (const [name, category, unit, price, reorderLevel] of medicineSeeds) {
  const medicine = await Medicine.findOneAndUpdate(
    { name },
    { name, category, unit, price, reorderLevel, status: "active" },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  medicines.push(medicine);
  const batch = await MedicineBatch.findOneAndUpdate(
    { batchNumber: `${name.split(" ")[0].toUpperCase()}-LK-001` },
    { medicineId: medicine._id, batchNumber: `${name.split(" ")[0].toUpperCase()}-LK-001`, quantity: name.includes("Salbutamol") ? 8 : 180, purchasePrice: Math.round(price * 0.72), manufactureDate: atTime(-90, 0), expiryDate: atTime(240, 0) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await Purchase.findOneAndUpdate(
    { supplierId: supplier._id, medicineId: medicine._id, batchId: batch._id },
    { supplierId: supplier._id, medicineId: medicine._id, batchId: batch._id, quantity: 100, purchasePrice: batch.purchasePrice, purchasedAt: atTime(-12, 10) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

const metformin = medicines.find((medicine) => medicine.name.startsWith("Metformin"));
const metforminBatch = await MedicineBatch.findOne({ medicineId: metformin._id });
await PharmacySale.findOneAndUpdate(
  { prescriptionId: prescription._id },
  {
    saleNumber: `PH-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
    prescriptionId: prescription._id,
    patientId: prescription.patientId,
    soldBy: pharmacist._id,
    items: [{ medicineId: metformin._id, batchId: metforminBatch._id, quantity: 20, unitPrice: metformin.price, lineTotal: metformin.price * 20 }],
    total: metformin.price * 20,
    paymentStatus: "paid",
    billIssuedAt: atTime(-1, 15)
  },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const invoice = await Invoice.findOneAndUpdate(
  { appointmentId: appointments[3]._id },
  {
    patientId: appointments[3].patientId,
    appointmentId: appointments[3]._id,
    items: [
      { description: "Consultation", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
      { description: "Fasting Blood Sugar", quantity: 1, unitPrice: 650, lineTotal: 650 }
    ],
    subtotal: 2150,
    paidAmount: 1500,
    outstandingAmount: 650,
    status: "partially_paid",
    createdBy: cashier._id
  },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

await Payment.findOneAndUpdate(
  { invoiceId: invoice._id, amount: 1500 },
  { invoiceId: invoice._id, amount: 1500, method: "cash", status: "verified", recordedBy: cashier._id, verifiedBy: cashier._id },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

for (const employeeId of ["HG-NUR-001", "HG-PHA-001", "HG-CAS-001"]) {
  const staff = staffByEmployeeId.get(employeeId);
  const salary = salaryByEmployeeId[employeeId];
  await Payroll.findOneAndUpdate(
    { staffId: staff._id, month },
    { staffId: staff._id, month, baseSalary: salary.baseSalary, attendanceDays: 20, allowances: salary.allowances, deductions: salary.deductions, netSalary: Math.max((salary.baseSalary / 26) * 20 + salary.allowances - salary.deductions, 0), status: "reviewed", reviewedBy: userByEmail.get("manager@healthguard.local")._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

console.log("Sri Lankan Health Guard demo seed complete.");
console.log(`Default password for seeded users: ${defaultPassword}`);
console.log("Demo logins: admin@healthguard.local, manager@healthguard.local, doctor@healthguard.local, nurse@healthguard.local, pharmacist@healthguard.local, cashier@healthguard.local, lab@healthguard.local");

await mongoose.connection.close();
process.exit(0);
