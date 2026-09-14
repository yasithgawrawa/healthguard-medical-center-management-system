// ============================================================================
// Health Guard Medical Center – Sri Lankan Demo Data Seed
// ============================================================================
// Staff: 1 Admin, 1 Manager, 1 Doctor, 2 Nurses, 1 Pharmacist, 2 Lab Assistants, 1 Cashier
// Patients: 6 realistic Sri Lankan patients
// Covers: Epic 1 (Workforce), Epic 2 (Clinical), Epic 3 (Inventory), Epic 4 (Billing)
// ============================================================================

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./shared/config/database.js";
import { ROLES } from "./shared/constants/roles.js";

// Epic 1 Models
import { User } from "./components/epic1_user_staff/models/User.js";
import { Staff } from "./components/epic1_user_staff/models/Staff.js";
import { Shift } from "./components/epic1_user_staff/models/Shift.js";
import { Attendance } from "./components/epic1_user_staff/models/Attendance.js";
import { LeaveRequest } from "./components/epic1_user_staff/models/LeaveRequest.js";
import { CenterLocation } from "./components/epic1_user_staff/models/CenterLocation.js";

// Epic 2 Models
import { Appointment } from "./components/epic2_clinical/models/Appointment.js";
import { Vitals } from "./components/epic2_clinical/models/Vitals.js";
import { Consultation } from "./components/epic2_clinical/models/Consultation.js";
import { Prescription } from "./components/epic2_clinical/models/Prescription.js";
import { LabRequest } from "./components/epic2_clinical/models/LabRequest.js";
import { Notification } from "./components/epic2_clinical/models/Notification.js";
import { LabTestCatalog } from "./components/epic2_clinical/models/LabTestCatalog.js";

// Epic 3 Models
import { Medicine } from "./components/epic3_inventory/models/Medicine.js";
import { MedicineBatch } from "./components/epic3_inventory/models/MedicineBatch.js";
import { Supplier } from "./components/epic3_inventory/models/Supplier.js";
import { Purchase } from "./components/epic3_inventory/models/Purchase.js";
import { PharmacySale } from "./components/epic3_inventory/models/PharmacySale.js";

// Epic 4 Models
import { Invoice } from "./components/epic4_billing/models/Invoice.js";
import { Payment } from "./components/epic4_billing/models/Payment.js";
import { Payroll } from "./components/epic4_billing/models/Payroll.js";

// ============================================================================
// CONNECT
// ============================================================================
console.log("🔌 Connecting to MongoDB...");
await connectDatabase();
console.log(`✅ Connected to database: ${mongoose.connection.name}\n`);

// ============================================================================
// HELPERS
// ============================================================================
const defaultPassword = process.env.SEED_ADMIN_PASSWORD || "Pass@12345";
const passwordHash = await bcrypt.hash(defaultPassword, 12);
const now = new Date();
const currentMonth = now.toISOString().slice(0, 7); // e.g. "2026-09"

/** Return a Date offset by dayOffset from today, at given hour:minute */
const atTime = (dayOffset, hour = 9, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// Maps to hold references
const userMap = new Map();   // email → User doc
const staffMap = new Map();  // employeeId → Staff doc

// ============================================================================
// STEP 1 — CENTER LOCATION (Colombo 07, near Ward Place)
// ============================================================================
console.log("1️⃣  Setting up Center Location...");
const primaryLocation = await CenterLocation.create({
  key: "primary",
  name: "Health Guard Medical Center",
  latitude: 6.9147,
  longitude: 79.8780,
  radiusMeters: 200
});
console.log(`   ✅ ${primaryLocation.name} (Colombo 07)\n`);

// ============================================================================
// STEP 2 — STAFF USER ACCOUNTS
// ============================================================================
console.log("2️⃣  Creating Staff Accounts...");
const staffDefs = [
  {
    firstName: "Kasun", lastName: "Wickramasinghe",
    email: "admin@healthguard.com", phone: "+94112555000",
    role: ROLES.ADMIN, gender: "male",
    dateOfBirth: new Date("1985-03-15"),
    address: "No. 45, Ward Place, Colombo 07",
    employeeId: "HG-ADM-001", department: "Administration",
    employmentDate: new Date("2020-01-15"),
    baseSalary: 195000, allowances: 15000, deductions: 3500,
    emergencyContact: "+94771234000",
    consultationFee: 0
  },
  {
    firstName: "Kavinda", lastName: "Jayawardena",
    email: "manager@healthguard.com", phone: "+94112555001",
    role: ROLES.MANAGER, gender: "male",
    dateOfBirth: new Date("1982-08-22"),
    address: "No. 18, Horton Place, Colombo 07",
    employeeId: "HG-MGR-001", department: "Clinical Operations",
    employmentDate: new Date("2020-03-01"),
    baseSalary: 180000, allowances: 12000, deductions: 3000,
    emergencyContact: "+94771234001",
    consultationFee: 0
  },
  {
    firstName: "Amara", lastName: "Perera",
    email: "doctor@healthguard.com", phone: "+94771234501",
    role: ROLES.DOCTOR, gender: "female",
    dateOfBirth: new Date("1980-06-10"),
    address: "No. 7/A, Rosmead Place, Colombo 07",
    employeeId: "HG-DOC-001", department: "Outpatient Department (OPD)",
    employmentDate: new Date("2019-06-10"),
    baseSalary: 260000, allowances: 20000, deductions: 5000,
    emergencyContact: "+94771234002",
    consultationFee: 2500
  },
  {
    firstName: "Ishara", lastName: "Silva",
    email: "nurse@healthguard.com", phone: "+94771234503",
    role: ROLES.NURSE, gender: "female",
    dateOfBirth: new Date("1993-02-15"),
    address: "No. 112, Baudhaloka Mawatha, Colombo 04",
    employeeId: "HG-NUR-001", department: "Triage & Emergency Nursing",
    employmentDate: new Date("2021-02-15"),
    baseSalary: 105000, allowances: 8000, deductions: 2000,
    emergencyContact: "+94771234004",
    consultationFee: 0
  },
  {
    firstName: "Sanduni", lastName: "Rathnayake",
    email: "nurse2@healthguard.com", phone: "+94771234504",
    role: ROLES.NURSE, gender: "female",
    dateOfBirth: new Date("1995-05-10"),
    address: "No. 58, Wijerama Mawatha, Colombo 07",
    employeeId: "HG-NUR-002", department: "Inpatient Care",
    employmentDate: new Date("2022-05-10"),
    baseSalary: 98000, allowances: 7000, deductions: 1800,
    emergencyContact: "+94771234005",
    consultationFee: 0
  },
  {
    firstName: "Dinesh", lastName: "Gunasekara",
    email: "pharmacist@healthguard.com", phone: "+94771234505",
    role: ROLES.PHARMACIST, gender: "male",
    dateOfBirth: new Date("1988-11-01"),
    address: "No. 23, Thimbirigasyaya Road, Colombo 05",
    employeeId: "HG-PHA-001", department: "Dispensary & Pharmacy",
    employmentDate: new Date("2020-11-01"),
    baseSalary: 135000, allowances: 9000, deductions: 2500,
    emergencyContact: "+94771234006",
    consultationFee: 0
  },
  {
    firstName: "Tharindu", lastName: "Abeysekara",
    email: "lab@healthguard.com", phone: "+94771234507",
    role: ROLES.LAB_ASSISTANT, gender: "male",
    dateOfBirth: new Date("1991-04-01"),
    address: "No. 90, Havelock Road, Colombo 06",
    employeeId: "HG-LAB-001", department: "Clinical Diagnostic Laboratory",
    employmentDate: new Date("2021-04-01"),
    baseSalary: 112000, allowances: 7500, deductions: 2200,
    emergencyContact: "+94771234008",
    consultationFee: 0
  },
  {
    firstName: "Dilini", lastName: "Karunaratne",
    email: "lab2@healthguard.com", phone: "+94771234510",
    role: ROLES.LAB_ASSISTANT, gender: "female",
    dateOfBirth: new Date("1996-04-20"),
    address: "No. 34, Kynsey Road, Colombo 08",
    employeeId: "HG-LAB-002", department: "Sample Collection & Reporting",
    employmentDate: new Date("2023-04-20"),
    baseSalary: 96000, allowances: 6500, deductions: 1600,
    emergencyContact: "+94771234011",
    consultationFee: 0
  },
  {
    firstName: "Malsha", lastName: "Wijesinghe",
    email: "cashier@healthguard.com", phone: "+94771234506",
    role: ROLES.CASHIER, gender: "female",
    dateOfBirth: new Date("1994-08-16"),
    address: "No. 66, Baseline Road, Colombo 09",
    employeeId: "HG-CAS-001", department: "Billing & Revenue",
    employmentDate: new Date("2021-08-16"),
    baseSalary: 92000, allowances: 6000, deductions: 1500,
    emergencyContact: "+94771234007",
    consultationFee: 0
  }
];

for (const s of staffDefs) {
  // Create User
  const user = await User.create({
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phone: s.phone,
    role: s.role,
    gender: s.gender,
    dateOfBirth: s.dateOfBirth,
    address: s.address,
    status: "active",
    passwordHash,
    consultationFee: s.consultationFee
  });
  userMap.set(s.email, user);

  // Create Staff profile
  const staff = await Staff.create({
    userId: user._id,
    employeeId: s.employeeId,
    department: s.department,
    role: s.role,
    status: "active",
    employmentDate: s.employmentDate,
    emergencyContact: s.emergencyContact,
    baseSalary: s.baseSalary,
    shiftRate: Number((s.baseSalary / 26).toFixed(2)),
    allowances: s.allowances,
    deductions: s.deductions
  });
  staffMap.set(s.employeeId, staff);

  console.log(`   ✅ ${s.firstName} ${s.lastName} — ${s.role} (${s.employeeId})`);
}

// Update CenterLocation with admin's ID
primaryLocation.updatedBy = userMap.get("admin@healthguard.com")._id;
await primaryLocation.save();

// ============================================================================
// STEP 3 — PATIENT ACCOUNTS
// ============================================================================
console.log("\n3️⃣  Creating Patient Accounts...");
const patientDefs = [
  {
    firstName: "Saman", lastName: "Kumara",
    email: "saman.kumara@gmail.com", phone: "+94712345671",
    address: "No. 45/2, Galle Road, Colombo 03",
    dateOfBirth: new Date("1984-04-16"), gender: "male"
  },
  {
    firstName: "Nethmi", lastName: "Herath",
    email: "nethmi.herath@gmail.com", phone: "+94712345672",
    address: "No. 18, Peradeniya Road, Kandy",
    dateOfBirth: new Date("1996-10-02"), gender: "female"
  },
  {
    firstName: "Fathima", lastName: "Razeek",
    email: "fathima.razeek@gmail.com", phone: "+94712345673",
    address: "No. 12, Rampart Street, Galle Fort",
    dateOfBirth: new Date("1978-01-22"), gender: "female"
  },
  {
    firstName: "Ruwan", lastName: "Bandara",
    email: "ruwan.bandara@gmail.com", phone: "+94712345674",
    address: "No. 88, Kandy Road, Kurunegala",
    dateOfBirth: new Date("1990-07-09"), gender: "male"
  },
  {
    firstName: "Priyantha", lastName: "Wickramasinghe",
    email: "priyantha.w@gmail.com", phone: "+94712345675",
    address: "No. 14, High Level Road, Nugegoda",
    dateOfBirth: new Date("1972-11-14"), gender: "male"
  },
  {
    firstName: "Anjali", lastName: "Dias",
    email: "anjali.dias@gmail.com", phone: "+94712345676",
    address: "No. 31, Negombo Road, Wattala",
    dateOfBirth: new Date("1988-03-28"), gender: "female"
  }
];

const patients = [];
for (const p of patientDefs) {
  const patient = await User.create({
    ...p,
    role: ROLES.PATIENT,
    status: "active",
    passwordHash
  });
  patients.push(patient);
  userMap.set(p.email, patient);
  console.log(`   ✅ ${p.firstName} ${p.lastName} — patient`);
}

// ============================================================================
// STEP 4 — EPIC 1: SHIFTS, ATTENDANCE & LEAVE
// ============================================================================
console.log("\n4️⃣  Seeding Workforce Shifts, Attendance & Leave (Epic 1)...");

const shiftPatterns = {
  "HG-DOC-001": { startHour: 8,  endHour: 14, location: "OPD Room 1",          notes: "Doctor OPD morning roster" },
  "HG-NUR-001": { startHour: 7,  endHour: 15, location: "Triage Desk",         notes: "Senior nurse triage duty" },
  "HG-NUR-002": { startHour: 13, endHour: 21, location: "Ward Station",        notes: "Afternoon nursing cover" },
  "HG-PHA-001": { startHour: 8,  endHour: 17, location: "Pharmacy Counter",    notes: "Main dispensary counter" },
  "HG-LAB-001": { startHour: 8,  endHour: 16, location: "Laboratory",          notes: "Lab sample processing" },
  "HG-LAB-002": { startHour: 9,  endHour: 17, location: "Sample Collection",   notes: "Sample collection & reporting" },
  "HG-CAS-001": { startHour: 8,  endHour: 17, location: "Billing Counter",     notes: "Billing & revenue counter" }
};

// Create shifts for past 3 days, today, and next 2 days
const shiftsByKey = new Map();
const shiftKey = (empId, date) => `${empId}:${date.toISOString().slice(0, 10)}`;

for (const [empId, pattern] of Object.entries(shiftPatterns)) {
  const staff = staffMap.get(empId);
  if (!staff) continue;
  for (const dayOffset of [-3, -2, -1, 0, 1, 2]) {
    const shift = await Shift.create({
      staffId: staff._id,
      startTime: atTime(dayOffset, pattern.startHour),
      endTime: atTime(dayOffset, pattern.endHour),
      location: pattern.location,
      status: dayOffset < 0 ? "completed" : "scheduled",
      notes: pattern.notes
    });
    shiftsByKey.set(shiftKey(empId, shift.startTime), shift);
  }
}
console.log(`   ✅ ${await Shift.countDocuments()} shifts created`);

// Attendance — past 3 days for all staff, today for currently checked-in staff
const attendanceSeeds = [
  // Past 3 days — everyone checked out
  ...Object.keys(shiftPatterns).flatMap(empId =>
    [-3, -2, -1].map(dayOffset => ({ empId, dayOffset, status: "checked_out" }))
  ),
  // Today — some staff checked in
  { empId: "HG-NUR-001", dayOffset: 0, status: "checked_in" },
  { empId: "HG-PHA-001", dayOffset: 0, status: "checked_in" },
  { empId: "HG-CAS-001", dayOffset: 0, status: "checked_in" },
  { empId: "HG-LAB-001", dayOffset: 0, status: "checked_in" }
];

for (const a of attendanceSeeds) {
  const staff = staffMap.get(a.empId);
  const pattern = shiftPatterns[a.empId];
  const checkInAt = atTime(a.dayOffset, pattern.startHour, 3 + Math.abs(a.dayOffset));
  const checkOutAt = a.status === "checked_out" ? atTime(a.dayOffset, pattern.endHour, 2) : undefined;
  const shift = shiftsByKey.get(shiftKey(a.empId, checkInAt));

  await Attendance.create({
    staffId: staff._id,
    workDate: checkInAt.toISOString().slice(0, 10),
    checkInAt,
    checkOutAt,
    status: a.status,
    shiftId: shift?._id,
    checkInLocation: {
      latitude: 6.91472,
      longitude: 79.87802,
      accuracyMeters: 12,
      distanceFromShiftMeters: 6
    },
    notes: "GPS verified check-in – Health Guard clinic"
  });
}
console.log(`   ✅ ${await Attendance.countDocuments()} attendance records created`);

// Leave Requests
await LeaveRequest.create([
  {
    staffId: staffMap.get("HG-NUR-002")._id,
    leaveType: "annual",
    startDate: atTime(3, 0),
    endDate: atTime(5, 0),
    reason: "Family Dāna ceremony in Galle — need 3 days off",
    status: "pending"
  },
  {
    staffId: staffMap.get("HG-LAB-002")._id,
    leaveType: "sick",
    startDate: atTime(-2, 0),
    endDate: atTime(-1, 0),
    reason: "Viral fever with medical certificate from Kalubowila Hospital",
    status: "approved",
    reviewedBy: userMap.get("manager@healthguard.com")._id,
    reviewNote: "Approved with submitted medical certificate."
  },
  {
    staffId: staffMap.get("HG-CAS-001")._id,
    leaveType: "casual",
    startDate: atTime(7, 0),
    endDate: atTime(7, 0),
    reason: "Personal banking documentation at People's Bank, Borella",
    status: "rejected",
    reviewedBy: userMap.get("manager@healthguard.com")._id,
    reviewNote: "Counter already short-staffed that day. Please reschedule."
  }
]);
console.log(`   ✅ ${await LeaveRequest.countDocuments()} leave requests created\n`);

// ============================================================================
// STEP 5 — EPIC 2: LAB TEST CATALOG
// ============================================================================
console.log("5️⃣  Seeding Lab Test Catalog (Epic 2)...");
const adminId = userMap.get("admin@healthguard.com")._id;

const labCatalog = [
  { testName: "Full Blood Count (FBC)",              category: "Hematology",        price: 750,  urgentPrice: 1000, description: "Hemoglobin, Platelets, WBC differential" },
  { testName: "Fasting Blood Sugar (FBS)",            category: "Biochemistry",      price: 450,  urgentPrice: 600,  description: "Glucose monitoring after 8-10 hour fast" },
  { testName: "Lipid Profile",                        category: "Biochemistry",      price: 1850, urgentPrice: 2300, description: "Total Cholesterol, Triglycerides, HDL, LDL" },
  { testName: "Serum Creatinine & Electrolytes",      category: "Renal Profile",     price: 1200, urgentPrice: 1500, description: "Kidney function: Na, K, Cl" },
  { testName: "Dengue Antigen NS1 & Antibody",        category: "Serology",          price: 2500, urgentPrice: 3200, description: "NS1 antigen + IgM/IgG antibodies" },
  { testName: "ECG 12-Lead",                          category: "Cardiology",        price: 1200, urgentPrice: 1600, description: "Standard 12-lead resting ECG" },
  { testName: "Urine Full Report (UFR)",              category: "Clinical Pathology", price: 400, urgentPrice: 550,  description: "Urine microscopic and biochemical analysis" },
  { testName: "Liver Function Test (LFT)",            category: "Biochemistry",      price: 1800, urgentPrice: 2300, description: "Bilirubin, SGOT, SGPT, ALP, Albumin" },
  { testName: "Thyroid Profile (TSH, T3, T4)",        category: "Endocrinology",     price: 3200, urgentPrice: 3900, description: "Hypothyroid/Hyperthyroid screening" },
  { testName: "HbA1c",                                category: "Diabetes",          price: 1750, urgentPrice: 2200, description: "3-month glycemic control monitoring" },
  { testName: "Chest X-Ray PA View",                  category: "Radiology",         price: 1900, urgentPrice: 2400, description: "Standard posterior-anterior chest radiograph" }
];

for (const item of labCatalog) {
  await LabTestCatalog.create({ ...item, updatedBy: adminId });
}
console.log(`   ✅ ${labCatalog.length} diagnostic tests cataloged\n`);

// ============================================================================
// STEP 6 — EPIC 2: APPOINTMENTS, VITALS, CONSULTATIONS, PRESCRIPTIONS, LAB
// ============================================================================
console.log("6️⃣  Seeding Clinical Workflow (Epic 2)...");

const doctor = userMap.get("doctor@healthguard.com");
const nurse1 = userMap.get("nurse@healthguard.com");
const labUser1 = userMap.get("lab@healthguard.com");
const labUser2 = userMap.get("lab2@healthguard.com");

// --- Appointments ---
// Patient 0 (Saman): Completed yesterday — fever, diagnosed with viral URI
// Patient 1 (Nethmi): Completed yesterday — gastritis follow-up
// Patient 2 (Fathima): Today — checked in, chest discomfort
// Patient 3 (Ruwan): Today — booked for diabetes review
// Patient 4 (Priyantha): Tomorrow — booked for routine check
// Patient 5 (Anjali): Today — in consultation

const appointmentDefs = [
  { patient: patients[0], dayOffset: -1, hour: 9,  slot: "Morning 09:00", reason: "High fever and body aches for 3 days",        status: "completed" },
  { patient: patients[1], dayOffset: -1, hour: 10, slot: "Morning 10:00", reason: "Follow-up for chronic gastritis",             status: "completed" },
  { patient: patients[2], dayOffset: 0,  hour: 9,  slot: "Morning 09:00", reason: "Chest tightness and intermittent pain",       status: "checked_in" },
  { patient: patients[3], dayOffset: 0,  hour: 10, slot: "Morning 10:00", reason: "Type 2 diabetes quarterly review",            status: "booked" },
  { patient: patients[4], dayOffset: 1,  hour: 9,  slot: "Morning 09:00", reason: "Annual general health check-up",              status: "booked" },
  { patient: patients[5], dayOffset: 0,  hour: 11, slot: "Morning 11:00", reason: "Persistent headaches and dizziness",          status: "in_consultation" }
];

const appointments = [];
for (const a of appointmentDefs) {
  const apt = await Appointment.create({
    patientId: a.patient._id,
    doctorId: doctor._id,
    appointmentDate: atTime(a.dayOffset, a.hour),
    slotLabel: a.slot,
    reason: a.reason,
    status: a.status
  });
  appointments.push(apt);
}
console.log(`   ✅ ${appointments.length} appointments created`);

// --- Vitals (for checked-in / completed patients) ---
// Patient 0 (Saman) – completed yesterday
await Vitals.create({
  appointmentId: appointments[0]._id,
  patientId: patients[0]._id,
  temperature: 38.4, bloodPressure: "130/85", heartRate: 96,
  weight: 72, height: 170, spo2: 97,
  recordedBy: nurse1._id
});

// Patient 1 (Nethmi) – completed yesterday
await Vitals.create({
  appointmentId: appointments[1]._id,
  patientId: patients[1]._id,
  temperature: 36.8, bloodPressure: "110/70", heartRate: 78,
  weight: 55, height: 162, spo2: 99,
  recordedBy: nurse1._id
});

// Patient 2 (Fathima) – checked in today
await Vitals.create({
  appointmentId: appointments[2]._id,
  patientId: patients[2]._id,
  temperature: 37.1, bloodPressure: "140/90", heartRate: 88,
  weight: 68, height: 158, spo2: 96,
  recordedBy: nurse1._id
});

// Patient 5 (Anjali) – in consultation today
await Vitals.create({
  appointmentId: appointments[5]._id,
  patientId: patients[5]._id,
  temperature: 36.9, bloodPressure: "118/75", heartRate: 74,
  weight: 60, height: 165, spo2: 98,
  recordedBy: nurse1._id
});

console.log(`   ✅ ${await Vitals.countDocuments()} vitals recorded`);

// --- Consultations (completed appointments) ---
const consultation1 = await Consultation.create({
  appointmentId: appointments[0]._id,
  patientId: patients[0]._id,
  doctorId: doctor._id,
  diagnosis: "Acute Viral Upper Respiratory Tract Infection",
  chiefComplaints: "High-grade fever (38.4°C), body aches, sore throat for 3 days",
  examinationFindings: "Pharyngeal erythema, tender cervical lymph nodes, lungs clear",
  clinicalNotes: "Likely viral URI. No signs of dengue. Symptomatic treatment prescribed. FBC ordered to rule out dengue given current Colombo outbreak season.",
  severity: "moderate",
  patientAdvice: "Rest, adequate fluids, paracetamol for fever. Return if platelet count drops or rash appears.",
  followUpPlan: "Review FBC results in 2 days. Follow-up if symptoms persist beyond 5 days.",
  finalized: true
});

const consultation2 = await Consultation.create({
  appointmentId: appointments[1]._id,
  patientId: patients[1]._id,
  doctorId: doctor._id,
  diagnosis: "Chronic Gastritis – Stable on current regimen",
  chiefComplaints: "Epigastric burning after meals, mild bloating",
  examinationFindings: "Mild epigastric tenderness on palpation, no guarding",
  clinicalNotes: "Symptoms well-controlled with Omeprazole. Continue current medication for another 4 weeks. Diet counseling reinforced — avoid spicy food and late dinners.",
  severity: "mild",
  patientAdvice: "Take Omeprazole 30 minutes before breakfast. Avoid fried kottu and string hoppers with chili paste late at night.",
  followUpPlan: "Review in 4 weeks. Consider stopping PPI if symptom-free.",
  finalized: true
});

console.log(`   ✅ ${await Consultation.countDocuments()} consultations finalized`);

// --- Prescriptions ---
const prescription1 = await Prescription.create({
  appointmentId: appointments[0]._id,
  patientId: patients[0]._id,
  doctorId: doctor._id,
  items: [
    { medicineName: "Paracetamol 500mg", dosage: "500mg", frequency: "Three times daily", duration: "5 days", instructions: "After meals. Maximum 4g per day." },
    { medicineName: "Cetirizine 10mg", dosage: "10mg", frequency: "Once daily at night", duration: "5 days", instructions: "For runny nose and sneezing" },
    { medicineName: "Vitamin C 500mg", dosage: "500mg", frequency: "Twice daily", duration: "7 days", instructions: "Immune support" }
  ],
  status: "dispensed"
});

const prescription2 = await Prescription.create({
  appointmentId: appointments[1]._id,
  patientId: patients[1]._id,
  doctorId: doctor._id,
  items: [
    { medicineName: "Omeprazole 20mg", dosage: "20mg", frequency: "Once daily before breakfast", duration: "28 days", instructions: "Take 30 minutes before meal" },
    { medicineName: "Domperidone 10mg", dosage: "10mg", frequency: "Three times daily", duration: "14 days", instructions: "Before meals for bloating" }
  ],
  status: "active"
});

console.log(`   ✅ ${await Prescription.countDocuments()} prescriptions created`);

// --- Lab Requests ---
// FBC for Saman (completed — dengue screening)
const fbcRequest = await LabRequest.create({
  appointmentId: appointments[0]._id,
  patientId: patients[0]._id,
  doctorId: doctor._id,
  testName: "Full Blood Count (FBC)",
  priority: "urgent",
  status: "completed",
  specimenType: "Venous Blood",
  sampleCollectedAt: atTime(-1, 10, 30),
  reportedAt: atTime(-1, 14, 0),
  verifiedBy: labUser1._id,
  resultSummary: "WBC 6.2, Hb 14.1, Plt 185,000 — within normal limits. No dengue concern.",
  parameters: [
    { parameter: "WBC", value: "6.2", unit: "×10³/µL", referenceRange: "4.0–11.0", flag: "normal" },
    { parameter: "Hemoglobin", value: "14.1", unit: "g/dL", referenceRange: "13.0–17.0", flag: "normal" },
    { parameter: "Platelets", value: "185", unit: "×10³/µL", referenceRange: "150–400", flag: "normal" },
    { parameter: "Neutrophils", value: "62", unit: "%", referenceRange: "40–70", flag: "normal" },
    { parameter: "Lymphocytes", value: "30", unit: "%", referenceRange: "20–40", flag: "normal" }
  ]
});

// ECG for Fathima (in progress — chest discomfort)
const ecgRequest = await LabRequest.create({
  appointmentId: appointments[2]._id,
  patientId: patients[2]._id,
  doctorId: doctor._id,
  testName: "ECG 12-Lead",
  priority: "urgent",
  status: "in_progress",
  specimenType: "N/A",
  verifiedBy: labUser2._id
});

// FBS for Ruwan (requested — diabetes review, not yet collected)
const fbsRequest = await LabRequest.create({
  appointmentId: appointments[3]._id,
  patientId: patients[3]._id,
  doctorId: doctor._id,
  testName: "Fasting Blood Sugar (FBS)",
  priority: "routine",
  status: "requested",
  specimenType: "Venous Blood"
});

console.log(`   ✅ ${await LabRequest.countDocuments()} lab requests created`);

// --- Notifications ---
await Notification.create([
  {
    patientId: patients[0]._id,
    type: "lab_result",
    title: "FBC Result Ready",
    message: "Your Full Blood Count result has been uploaded. Platelet count is normal — no dengue concern.",
    relatedModel: "LabRequest",
    relatedId: fbcRequest._id,
    createdBy: labUser1._id
  },
  {
    patientId: patients[2]._id,
    type: "lab_request",
    title: "ECG Test Requested",
    message: "An ECG 12-Lead test has been requested by Dr. Amara Perera for your chest discomfort evaluation.",
    relatedModel: "LabRequest",
    relatedId: ecgRequest._id,
    createdBy: doctor._id
  },
  {
    patientId: patients[3]._id,
    type: "lab_request",
    title: "FBS Test Requested",
    message: "A Fasting Blood Sugar test has been requested for your diabetes quarterly review.",
    relatedModel: "LabRequest",
    relatedId: fbsRequest._id,
    createdBy: doctor._id
  }
]);
console.log(`   ✅ ${await Notification.countDocuments()} notifications created\n`);

// ============================================================================
// STEP 7 — EPIC 3: SUPPLIERS, MEDICINES, BATCHES, PURCHASES, PHARMACY SALES
// ============================================================================
console.log("7️⃣  Seeding Inventory & Pharmacy (Epic 3)...");

// Suppliers
const spcSupplier = await Supplier.create({
  name: "State Pharmaceuticals Corporation (SPC)",
  email: "supplies@spc.lk",
  phone: "+94112328262",
  address: "No. 75, Sir Baron Jayathilaka Mawatha, Colombo 01",
  status: "active"
});

const hemasSupplier = await Supplier.create({
  name: "Hemas Pharmaceuticals (Pvt) Ltd",
  email: "orders@hemas.com",
  phone: "+94114766666",
  address: "Hemas House, No. 75, Braybrooke Place, Colombo 02",
  status: "active"
});

const baursSupplier = await Supplier.create({
  name: "A. Baur & Co. (Pvt) Ltd – Healthcare",
  email: "healthcare@baurs.com",
  phone: "+94114728700",
  address: "No. 5, Upper Chatham Street, Colombo 01",
  status: "active"
});
console.log(`   ✅ ${await Supplier.countDocuments()} suppliers created`);

// Medicines + Batches + Purchases
const medicineDefs = [
  { name: "Paracetamol 500mg Tablets",     category: "Analgesic",              unit: "tablet",  price: 15,    reorderLevel: 100, batch: "PCM-2601", qty: 500,  purchasePrice: 9.50,  mfg: -90,  exp: 360, supplier: spcSupplier },
  { name: "Amoxicillin 500mg Capsules",    category: "Antibiotic",             unit: "capsule", price: 65,    reorderLevel: 50,  batch: "AMX-2601", qty: 200,  purchasePrice: 42,    mfg: -60,  exp: 300, supplier: hemasSupplier },
  { name: "Omeprazole 20mg Capsules",      category: "Gastrointestinal",       unit: "capsule", price: 24,    reorderLevel: 70,  batch: "OME-2601", qty: 300,  purchasePrice: 16.50, mfg: -75,  exp: 320, supplier: spcSupplier },
  { name: "Metformin HCl 500mg Tablets",   category: "Diabetes",               unit: "tablet",  price: 18,    reorderLevel: 80,  batch: "MET-2601", qty: 400,  purchasePrice: 12,    mfg: -120, exp: 400, supplier: hemasSupplier },
  { name: "Losartan 50mg Tablets",         category: "Cardiology",             unit: "tablet",  price: 26,    reorderLevel: 60,  batch: "LOS-2601", qty: 250,  purchasePrice: 18,    mfg: -60,  exp: 350, supplier: baursSupplier },
  { name: "Atorvastatin 20mg Tablets",     category: "Cardiology",             unit: "tablet",  price: 38,    reorderLevel: 50,  batch: "ATO-2601", qty: 180,  purchasePrice: 26,    mfg: -45,  exp: 380, supplier: baursSupplier },
  { name: "Cetirizine 10mg Tablets",       category: "Antihistamine",          unit: "tablet",  price: 12,    reorderLevel: 50,  batch: "CET-2601", qty: 350,  purchasePrice: 7.50,  mfg: -100, exp: 280, supplier: spcSupplier },
  { name: "Salbutamol Inhaler 100mcg",     category: "Respiratory",            unit: "inhaler", price: 850,   reorderLevel: 15,  batch: "SAL-2601", qty: 8,    purchasePrice: 620,   mfg: -30,  exp: 270, supplier: baursSupplier },
  { name: "Amlodipine 5mg Tablets",        category: "Cardiology",             unit: "tablet",  price: 16,    reorderLevel: 80,  batch: "AML-2601", qty: 300,  purchasePrice: 10,    mfg: -80,  exp: 420, supplier: hemasSupplier },
  { name: "ORS Sachets",                   category: "Emergency",              unit: "sachet",  price: 55,    reorderLevel: 40,  batch: "ORS-2601", qty: 120,  purchasePrice: 34,    mfg: -35,  exp: 300, supplier: spcSupplier },
  { name: "Ferrous Sulphate + Folic Acid", category: "Vitamins & Supplements", unit: "tablet",  price: 10,    reorderLevel: 120, batch: "FER-2601", qty: 400,  purchasePrice: 6,     mfg: -100, exp: 500, supplier: spcSupplier },
  { name: "Vitamin D3 1000IU Tablets",     category: "Vitamins & Supplements", unit: "tablet",  price: 22,    reorderLevel: 60,  batch: "VTD-2601", qty: 200,  purchasePrice: 14,    mfg: -50,  exp: 450, supplier: hemasSupplier }
];

const medicineMap = new Map();  // name → { medicine, batch }

for (const m of medicineDefs) {
  const medicine = await Medicine.create({
    name: m.name,
    category: m.category,
    unit: m.unit,
    price: m.price,
    reorderLevel: m.reorderLevel,
    status: "active"
  });

  const batch = await MedicineBatch.create({
    medicineId: medicine._id,
    batchNumber: m.batch,
    quantity: m.qty,
    purchasePrice: m.purchasePrice,
    manufactureDate: atTime(m.mfg, 0),
    expiryDate: atTime(m.exp, 0)
  });

  await Purchase.create({
    supplierId: m.supplier._id,
    medicineId: medicine._id,
    batchId: batch._id,
    quantity: m.qty,
    purchasePrice: m.purchasePrice,
    purchasedAt: atTime(m.mfg + 5, 10)
  });

  medicineMap.set(m.name, { medicine, batch });
}

console.log(`   ✅ ${await Medicine.countDocuments()} medicines, ${await MedicineBatch.countDocuments()} batches, ${await Purchase.countDocuments()} purchases created`);

// Pharmacy Sales — dispense Saman's prescription (Paracetamol, Cetirizine, Vitamin C)
const pharmacist = userMap.get("pharmacist@healthguard.com");
const paracetamol = medicineMap.get("Paracetamol 500mg Tablets");
const cetirizine = medicineMap.get("Cetirizine 10mg Tablets");

const sale1 = await PharmacySale.create({
  saleNumber: `PH-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
  prescriptionId: prescription1._id,
  patientId: patients[0]._id,
  soldBy: pharmacist._id,
  items: [
    { medicineId: paracetamol.medicine._id, batchId: paracetamol.batch._id, quantity: 15, unitPrice: 15, lineTotal: 225 },
    { medicineId: cetirizine.medicine._id,  batchId: cetirizine.batch._id,  quantity: 5,  unitPrice: 12, lineTotal: 60 }
  ],
  total: 285,
  paymentStatus: "paid",
  billIssuedAt: atTime(-1, 11, 30)
});

console.log(`   ✅ ${await PharmacySale.countDocuments()} pharmacy sales created\n`);

// ============================================================================
// STEP 8 — EPIC 4: INVOICES, PAYMENTS, PAYROLL
// ============================================================================
console.log("8️⃣  Seeding Billing & Payroll (Epic 4)...");
const cashier = userMap.get("cashier@healthguard.com");
const manager = userMap.get("manager@healthguard.com");

// Invoice 1 — Saman's completed visit (consultation + FBC + pharmacy)
const invoice1 = await Invoice.create({
  patientId: patients[0]._id,
  appointmentId: appointments[0]._id,
  items: [
    { description: "OPD Consultation – Dr. Amara Perera", quantity: 1, unitPrice: 2500, lineTotal: 2500 },
    { description: "Full Blood Count (FBC) – Urgent",     quantity: 1, unitPrice: 1000, lineTotal: 1000 },
    { description: "Pharmacy – Paracetamol 500mg × 15",   quantity: 1, unitPrice: 225,  lineTotal: 225 },
    { description: "Pharmacy – Cetirizine 10mg × 5",      quantity: 1, unitPrice: 60,   lineTotal: 60 }
  ],
  subtotal: 3785,
  paidAmount: 3785,
  outstandingAmount: 0,
  status: "paid",
  createdBy: cashier._id
});

await Payment.create({
  invoiceId: invoice1._id,
  amount: 3785,
  method: "cash",
  status: "verified",
  recordedBy: cashier._id,
  verifiedBy: cashier._id
});

// Invoice 2 — Nethmi's follow-up (consultation only, partially paid)
const invoice2 = await Invoice.create({
  patientId: patients[1]._id,
  appointmentId: appointments[1]._id,
  items: [
    { description: "OPD Consultation – Dr. Amara Perera", quantity: 1, unitPrice: 2500, lineTotal: 2500 }
  ],
  subtotal: 2500,
  paidAmount: 1500,
  outstandingAmount: 1000,
  status: "partially_paid",
  createdBy: cashier._id
});

await Payment.create({
  invoiceId: invoice2._id,
  amount: 1500,
  method: "card",
  status: "verified",
  recordedBy: cashier._id,
  verifiedBy: cashier._id
});

console.log(`   ✅ ${await Invoice.countDocuments()} invoices, ${await Payment.countDocuments()} payments created`);

// Payroll — current month for all staff
const staffForPayroll = [
  "HG-DOC-001", "HG-NUR-001", "HG-NUR-002",
  "HG-PHA-001", "HG-LAB-001", "HG-LAB-002", "HG-CAS-001"
];

for (const empId of staffForPayroll) {
  const staff = staffMap.get(empId);
  const staffDef = staffDefs.find(s => s.employeeId === empId);
  const shiftRate = Number((staffDef.baseSalary / 26).toFixed(2));
  const scheduledShifts = 22;
  const payableShifts = empId === "HG-LAB-002" ? 20 : 22; // Lab2 had 2 sick days
  const basePay = shiftRate * payableShifts;
  const net = Math.max(basePay + staffDef.allowances - staffDef.deductions, 0);

  await Payroll.create({
    staffId: staff._id,
    month: currentMonth,
    payBasis: "shift",
    baseSalary: basePay,
    shiftRate,
    scheduledShifts,
    payableShifts,
    attendanceDays: payableShifts,
    allowances: staffDef.allowances,
    deductions: staffDef.deductions,
    netSalary: net,
    status: "reviewed",
    reviewedBy: manager._id
  });
}

console.log(`   ✅ ${await Payroll.countDocuments()} payroll records created\n`);

// ============================================================================
// DONE
// ============================================================================
console.log("═══════════════════════════════════════════════════════════");
console.log("🎉 Sri Lankan demo seed completed successfully!");
console.log("═══════════════════════════════════════════════════════════");
console.log(`\nDefault password for all accounts: ${defaultPassword}`);
console.log("\n📋 Staff Logins:");
console.log("   Admin:          admin@healthguard.com");
console.log("   Manager:        manager@healthguard.com");
console.log("   Doctor:         doctor@healthguard.com");
console.log("   Nurse 1:        nurse@healthguard.com");
console.log("   Nurse 2:        nurse2@healthguard.com");
console.log("   Pharmacist:     pharmacist@healthguard.com");
console.log("   Lab Assistant 1: lab@healthguard.com");
console.log("   Lab Assistant 2: lab2@healthguard.com");
console.log("   Cashier:        cashier@healthguard.com");
console.log("\n📋 Patient Logins:");
for (const p of patientDefs) {
  console.log(`   ${p.firstName} ${p.lastName}: ${p.email}`);
}

await mongoose.connection.close();
process.exit(0);
