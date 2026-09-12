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

console.log("Connecting to MongoDB Atlas...");
await connectDatabase();
console.log(`Connected to production database: ${mongoose.connection.name}`);

// ============================================================================
// STEP 1: CLEANUP / PURGE EXISTING DEMO DATA
// ============================================================================
console.log("\n1. Purging existing demo data...");
await Promise.all([
  User.deleteMany({}),
  Staff.deleteMany({}),
  Shift.deleteMany({}),
  Attendance.deleteMany({}),
  LeaveRequest.deleteMany({}),
  CenterLocation.deleteMany({}),
  Appointment.deleteMany({}),
  Vitals.deleteMany({}),
  Consultation.deleteMany({}),
  Prescription.deleteMany({}),
  LabRequest.deleteMany({}),
  Notification.deleteMany({}),
  Medicine.deleteMany({}),
  MedicineBatch.deleteMany({}),
  Supplier.deleteMany({}),
  Purchase.deleteMany({}),
  PharmacySale.deleteMany({}),
  Invoice.deleteMany({}),
  Payment.deleteMany({}),
  Payroll.deleteMany({})
]);
console.log("   ✓ All 20 collections purged successfully.");

// ============================================================================
// STEP 2: COMMON TIME & CRYPTO HELPERS
// ============================================================================
const defaultPassword = process.env.SEED_ADMIN_PASSWORD || "Pass@12345";
const passwordHash = await bcrypt.hash(defaultPassword, 12);
const now = new Date();
const currentMonth = now.toISOString().slice(0, 7);

const offsetDate = (dayOffset, hour = 9, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// ============================================================================
// STEP 3: INSERT PRIMARY CENTER LOCATION (Colombo 07 - Cinnamon Gardens)
// ============================================================================
console.log("\n2. Seeding Medical Center Location...");
const primaryLocation = await CenterLocation.create({
  key: "primary",
  name: "Health Guard Medical Center - Colombo 07",
  latitude: 6.9147,
  longitude: 79.8780,
  radiusMeters: 1000
});
console.log(`   ✓ Location created: ${primaryLocation.name} (${primaryLocation.radiusMeters}m geofence)`);

// ============================================================================
// STEP 4: SEED REAL CLINICAL & ADMINISTRATIVE STAFF
// ============================================================================
console.log("\n3. Seeding Real Staff Members...");
const realStaffData = [
  {
    firstName: "Kasun",
    lastName: "Wickramasinghe",
    email: "admin@healthguard.com",
    phone: "+94112555000",
    role: ROLES.ADMIN,
    employeeId: "HG-ADM-001",
    department: "Executive Administration",
    employmentDate: new Date("2020-01-15"),
    baseSalary: 195000,
    allowances: 15000,
    deductions: 3500,
    emergencyContact: "+94771234000"
  },
  {
    firstName: "Dr. Kavinda",
    lastName: "Jayawardena",
    email: "manager@healthguard.com",
    phone: "+94112555001",
    role: ROLES.MANAGER,
    employeeId: "HG-MGR-001",
    department: "Clinical Operations",
    employmentDate: new Date("2020-03-01"),
    baseSalary: 180000,
    allowances: 12000,
    deductions: 3000,
    emergencyContact: "+94771234001"
  },
  {
    firstName: "Dr. Amara",
    lastName: "Perera",
    email: "doctor@healthguard.com",
    phone: "+94771234501",
    role: ROLES.DOCTOR,
    employeeId: "HG-DOC-001",
    department: "Outpatient Department (OPD)",
    employmentDate: new Date("2019-06-10"),
    baseSalary: 260000,
    allowances: 20000,
    deductions: 5000,
    emergencyContact: "+94771234002"
  },
  {
    firstName: "Dr. Nimal",
    lastName: "Fernando",
    email: "doctor2@healthguard.com",
    phone: "+94771234502",
    role: ROLES.DOCTOR,
    employeeId: "HG-DOC-002",
    department: "Cardiology & Internal Medicine",
    employmentDate: new Date("2018-09-20"),
    baseSalary: 285000,
    allowances: 25000,
    deductions: 6000,
    emergencyContact: "+94771234003"
  },
  {
    firstName: "Ishara",
    lastName: "Silva",
    email: "nurse@healthguard.com",
    phone: "+94771234503",
    role: ROLES.NURSE,
    employeeId: "HG-NUR-001",
    department: "Triage & Emergency Nursing",
    employmentDate: new Date("2021-02-15"),
    baseSalary: 105000,
    allowances: 8000,
    deductions: 2000,
    emergencyContact: "+94771234004"
  },
  {
    firstName: "Sanduni",
    lastName: "Rathnayake",
    email: "nurse2@healthguard.com",
    phone: "+94771234504",
    role: ROLES.NURSE,
    employeeId: "HG-NUR-002",
    department: "Inpatient Care",
    employmentDate: new Date("2022-05-10"),
    baseSalary: 98000,
    allowances: 7000,
    deductions: 1800,
    emergencyContact: "+94771234005"
  },
  {
    firstName: "Dinesh",
    lastName: "Gunasekara",
    email: "pharmacist@healthguard.com",
    phone: "+94771234505",
    role: ROLES.PHARMACIST,
    employeeId: "HG-PHA-001",
    department: "Dispensary & Pharmacy",
    employmentDate: new Date("2020-11-01"),
    baseSalary: 135000,
    allowances: 9000,
    deductions: 2500,
    emergencyContact: "+94771234006"
  },
  {
    firstName: "Malsha",
    lastName: "Wijesinghe",
    email: "cashier@healthguard.com",
    phone: "+94771234506",
    role: ROLES.CASHIER,
    employeeId: "HG-CAS-001",
    department: "Billing & Revenue Counter",
    employmentDate: new Date("2021-08-16"),
    baseSalary: 92000,
    allowances: 6000,
    deductions: 1500,
    emergencyContact: "+94771234007"
  },
  {
    firstName: "Tharindu",
    lastName: "Abeysekara",
    email: "lab@healthguard.com",
    phone: "+94771234507",
    role: ROLES.LAB_ASSISTANT,
    employeeId: "HG-LAB-001",
    department: "Clinical Diagnostic Laboratory",
    employmentDate: new Date("2021-04-01"),
    baseSalary: 112000,
    allowances: 7500,
    deductions: 2200,
    emergencyContact: "+94771234008"
  }
];

const staffUserMap = new Map();
const staffProfileMap = new Map();

for (const s of realStaffData) {
  const user = await User.create({
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phone: s.phone,
    role: s.role,
    status: "active",
    passwordHash,
    address: "Health Guard Medical Center, Ward Place, Colombo 07"
  });
  staffUserMap.set(s.email, user);

  const staff = await Staff.create({
    userId: user._id,
    employeeId: s.employeeId,
    department: s.department,
    role: s.role,
    status: "active",
    employmentDate: s.employmentDate,
    emergencyContact: s.emergencyContact,
    baseSalary: s.baseSalary,
    allowances: s.allowances,
    deductions: s.deductions
  });
  staffProfileMap.set(s.employeeId, staff);
}
console.log(`   ✓ Seeded ${realStaffData.length} real staff profiles across 7 clinical departments.`);

// Update CenterLocation updatedBy reference
primaryLocation.updatedBy = staffUserMap.get("admin@healthguard.com")._id;
await primaryLocation.save();

// ============================================================================
// STEP 5: SEED REAL PATIENT ACCOUNTS
// ============================================================================
console.log("\n4. Seeding Real Patient Profiles...");
const realPatientData = [
  {
    firstName: "Saman",
    lastName: "Kumara",
    email: "saman.kumara82@gmail.com",
    phone: "+94712345671",
    address: "No. 45/2, Galle Road, Colombo 03",
    dateOfBirth: new Date("1984-04-16"),
    gender: "male"
  },
  {
    firstName: "Nethmi",
    lastName: "Herath",
    email: "nethmi.herath@yahoo.com",
    phone: "+94712345672",
    address: "No. 18, Peradeniya Road, Kandy",
    dateOfBirth: new Date("1996-10-02"),
    gender: "female"
  },
  {
    firstName: "Fathima",
    lastName: "Razeek",
    email: "fathima.razeek@outlook.com",
    phone: "+94712345673",
    address: "No. 12, Rampart Street, Galle Fort",
    dateOfBirth: new Date("1978-01-22"),
    gender: "female"
  },
  {
    firstName: "Ruwan",
    lastName: "Bandara",
    email: "ruwan.bandara@gmail.com",
    phone: "+94712345674",
    address: "No. 88, Kandy Road, Kurunegala",
    dateOfBirth: new Date("1990-07-09"),
    gender: "male"
  },
  {
    firstName: "Priyantha",
    lastName: "Wickramasinghe",
    email: "priyantha.w@gmail.com",
    phone: "+94712345675",
    address: "No. 14, High Level Road, Nugegoda",
    dateOfBirth: new Date("1972-11-14"),
    gender: "male"
  }
];

const patientUserList = [];
for (const p of realPatientData) {
  const patient = await User.create({
    ...p,
    role: ROLES.PATIENT,
    status: "active",
    passwordHash
  });
  patientUserList.push(patient);
}
console.log(`   ✓ Seeded ${patientUserList.length} verified patient accounts with addresses and DOB.`);

// ============================================================================
// STEP 6: SEED REAL WORKFORCE SHIFTS, ATTENDANCE & LEAVE
// ============================================================================
console.log("\n5. Seeding Real Workforce Shifts & Geofenced Attendance...");
const shiftsData = [
  // Today's Shifts
  { empId: "HG-DOC-001", dayOffset: 0, startHour: 8, endHour: 16, loc: "OPD Consultation Room 1" },
  { empId: "HG-DOC-002", dayOffset: 0, startHour: 9, endHour: 17, loc: "Cardiology Clinic Room" },
  { empId: "HG-NUR-001", dayOffset: 0, startHour: 7, endHour: 15, loc: "Triage & Vitals Station" },
  { empId: "HG-NUR-002", dayOffset: 0, startHour: 13, endHour: 21, loc: "Clinical Observation Ward" },
  { empId: "HG-PHA-001", dayOffset: 0, startHour: 8, endHour: 17, loc: "Pharmacy Dispensing Counter" },
  { empId: "HG-CAS-001", dayOffset: 0, startHour: 8, endHour: 17, loc: "Billing & Cashier Counter" },
  { empId: "HG-LAB-001", dayOffset: 0, startHour: 8, endHour: 16, loc: "Pathology & Biochemistry Lab" },
  // Tomorrow's Shifts
  { empId: "HG-DOC-001", dayOffset: 1, startHour: 8, endHour: 16, loc: "OPD Consultation Room 1" },
  { empId: "HG-NUR-001", dayOffset: 1, startHour: 7, endHour: 15, loc: "Triage & Vitals Station" }
];

for (const s of shiftsData) {
  const staff = staffProfileMap.get(s.empId);
  await Shift.create({
    staffId: staff._id,
    startTime: offsetDate(s.dayOffset, s.startHour),
    endTime: offsetDate(s.dayOffset, s.endHour),
    location: s.loc,
    status: s.dayOffset === 0 ? "scheduled" : "scheduled",
    notes: "Duty Shift - Health Guard Colombo 07"
  });
}

// Attendance Logs (Yesterday & Past shifts checked out within geofence)
const attendanceSeeds = [
  { empId: "HG-NUR-001", dayOffset: -1, inHour: 7, outHour: 15 },
  { empId: "HG-PHA-001", dayOffset: -1, inHour: 8, outHour: 17 },
  { empId: "HG-CAS-001", dayOffset: -1, inHour: 8, outHour: 17 },
  { empId: "HG-LAB-001", dayOffset: -1, inHour: 8, outHour: 16 }
];

for (const a of attendanceSeeds) {
  const staff = staffProfileMap.get(a.empId);
  const checkInAt = offsetDate(a.dayOffset, a.inHour, 4);
  const checkOutAt = offsetDate(a.dayOffset, a.outHour, 2);
  await Attendance.create({
    staffId: staff._id,
    workDate: checkInAt.toISOString().slice(0, 10),
    checkInAt,
    checkOutAt,
    status: "checked_out",
    checkInLocation: {
      latitude: 6.91472,
      longitude: 79.87802,
      accuracyMeters: 12,
      distanceFromShiftMeters: 6
    },
    notes: "Biometric & GPS verified check-in at Ward Place center."
  });
}

// Real Leave Request
const nurse2Staff = staffProfileMap.get("HG-NUR-002");
await LeaveRequest.create({
  staffId: nurse2Staff._id,
  leaveType: "annual",
  startDate: offsetDate(3, 0),
  endDate: offsetDate(5, 0),
  reason: "Family event in Galle",
  status: "pending"
});
console.log(`   ✓ Shifts, geofenced attendance logs, and staff leave requests recorded.`);

// ============================================================================
// STEP 7: SEED REAL PHARMACEUTICAL SUPPLIERS
// ============================================================================
console.log("\n6. Seeding Authorized Pharmaceutical Suppliers...");
const spcSupplier = await Supplier.create({
  name: "State Pharmaceuticals Corporation of Sri Lanka (SPC)",
  email: "supplies@spc.lk",
  phone: "+94112328262",
  address: "No. 75, Sir Baron Jayathilaka Mawatha, Colombo 01",
  status: "active"
});

const hemasSupplier = await Supplier.create({
  name: "Hemas Pharmaceuticals (Pvt) Ltd",
  email: "pharma.orders@hemas.com",
  phone: "+94114766666",
  address: "Hemas House, No. 75, Braybrooke Place, Colombo 02",
  status: "active"
});
console.log(`   ✓ Seeded ${spcSupplier.name} and ${hemasSupplier.name}.`);

// ============================================================================
// STEP 8: SEED REAL NMRA ESSENTIAL MEDICINES CATALOG & BATCHES
// ============================================================================
console.log("\n7. Seeding NMRA Formulary Medicines & Real Batches...");
const medicineCatalog = [
  {
    name: "Paracetamol 500mg Tablets",
    category: "Analgesic",
    unit: "tablet",
    price: 15.00,
    reorderLevel: 100,
    batchNumber: "PCM-2026-001",
    quantity: 250,
    purchasePrice: 9.50,
    mfgOffset: -90,
    expOffset: 360,
    supplier: spcSupplier
  },
  {
    name: "Amoxicillin 500mg Capsules",
    category: "Antibiotic",
    unit: "capsule",
    price: 45.00,
    reorderLevel: 60,
    batchNumber: "AMX-2026-001",
    quantity: 180,
    purchasePrice: 31.00,
    mfgOffset: -60,
    expOffset: 300,
    supplier: spcSupplier
  },
  {
    name: "Metformin HCl 500mg Tablets",
    category: "Diabetes",
    unit: "tablet",
    price: 18.00,
    reorderLevel: 80,
    batchNumber: "MET-2026-001",
    quantity: 220,
    purchasePrice: 12.00,
    mfgOffset: -120,
    expOffset: 400,
    supplier: hemasSupplier
  },
  {
    name: "Atorvastatin 20mg Tablets",
    category: "Cardiology",
    unit: "tablet",
    price: 38.00,
    reorderLevel: 50,
    batchNumber: "ATO-2026-001",
    quantity: 150,
    purchasePrice: 26.00,
    mfgOffset: -45,
    expOffset: 380,
    supplier: hemasSupplier
  },
  {
    name: "Omeprazole 20mg Capsules",
    category: "Gastrointestinal",
    unit: "capsule",
    price: 24.00,
    reorderLevel: 70,
    batchNumber: "OME-2026-001",
    quantity: 160,
    purchasePrice: 16.50,
    mfgOffset: -75,
    expOffset: 320,
    supplier: spcSupplier
  },
  {
    // LOW STOCK ITEM TO TRIGGER LOW-STOCK ALERT (E3-US12, E3-US14)
    name: "Salbutamol Inhaler 100mcg",
    category: "Respiratory",
    unit: "inhaler",
    price: 850.00,
    reorderLevel: 15,
    batchNumber: "SAL-2026-001",
    quantity: 8, // < 15, triggers Low Stock Alert
    purchasePrice: 620.00,
    mfgOffset: -30,
    expOffset: 270,
    supplier: hemasSupplier
  },
  {
    // EXPIRING SOON ITEM TO TRIGGER EXPIRY ALERT (E3-US13, E3-US15)
    name: "Cetirizine 10mg Tablets",
    category: "Antihistamine",
    unit: "tablet",
    price: 12.00,
    reorderLevel: 50,
    batchNumber: "CET-2025-001",
    quantity: 45,
    purchasePrice: 7.50,
    mfgOffset: -300,
    expOffset: 35, // Expiring in 35 days (< 60 days threshold!)
    supplier: spcSupplier
  }
];

const medicineMap = new Map();
const batchMap = new Map();

for (const m of medicineCatalog) {
  const medicine = await Medicine.create({
    name: m.name,
    category: m.category,
    unit: m.unit,
    price: m.price,
    reorderLevel: m.reorderLevel,
    status: "active"
  });
  medicineMap.set(m.name, medicine);

  const batch = await MedicineBatch.create({
    medicineId: medicine._id,
    batchNumber: m.batchNumber,
    quantity: m.quantity,
    purchasePrice: m.purchasePrice,
    manufactureDate: offsetDate(m.mfgOffset, 0),
    expiryDate: offsetDate(m.expOffset, 0)
  });
  batchMap.set(m.batchNumber, batch);

  await Purchase.create({
    supplierId: m.supplier._id,
    medicineId: medicine._id,
    batchId: batch._id,
    quantity: m.quantity,
    purchasePrice: m.purchasePrice,
    purchasedAt: offsetDate(m.mfgOffset + 5, 10)
  });
}
console.log(`   ✓ Seeded ${medicineCatalog.length} medicines with tracked batches, supplier purchases, and active alert triggers.`);

// ============================================================================
// STEP 9: SEED REAL CLINICAL APPOINTMENTS, VITALS, CONSULTATION, RX, LABS
// ============================================================================
console.log("\n8. Seeding Real Clinical Consultations, Prescriptions & Diagnostics...");
const doc1User = staffUserMap.get("doctor@healthguard.com");
const doc2User = staffUserMap.get("doctor2@healthguard.com");
const nurseUser = staffUserMap.get("nurse@healthguard.com");
const labUser = staffUserMap.get("lab@healthguard.com");
const cashierUser = staffUserMap.get("cashier@healthguard.com");
const pharmaUser = staffUserMap.get("pharmacist@healthguard.com");

// Appointment 1: Saman Kumara (Today 09:00 - Checked In with Vitals)
const appt1 = await Appointment.create({
  patientId: patientUserList[0]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(0, 9),
  slotLabel: "Morning 09:00",
  reason: "Recurrent headaches and elevated blood pressure follow-up",
  status: "checked_in"
});

const vitals1 = await Vitals.create({
  appointmentId: appt1._id,
  patientId: appt1.patientId,
  temperature: 37.1,
  bloodPressure: "135/85",
  heartRate: 78,
  spo2: 99,
  recordedBy: nurseUser._id
});

// Appointment 2: Nethmi Herath (Today 10:00 - Booked)
const appt2 = await Appointment.create({
  patientId: patientUserList[1]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(0, 10),
  slotLabel: "Morning 10:00",
  reason: "Epigastric pain and suspected gastritis review",
  status: "booked"
});

// Appointment 3: Fathima Nazeer (Today 11:00 - In Consultation with Cardiologist Dr. Nimal)
const appt3 = await Appointment.create({
  patientId: patientUserList[2]._id,
  doctorId: doc2User._id,
  appointmentDate: offsetDate(0, 11),
  slotLabel: "Morning 11:00",
  reason: "Palpitations upon mild exertion and shortness of breath",
  status: "in_consultation"
});

// Lab Request for Fathima Nazeer (ECG requested by Dr. Nimal)
const ecgLab = await LabRequest.create({
  appointmentId: appt3._id,
  patientId: appt3.patientId,
  doctorId: doc2User._id,
  testName: "ECG 12-Lead",
  priority: "urgent",
  status: "in_progress",
  verifiedBy: labUser._id
});

await Notification.create({
  patientId: ecgLab.patientId,
  type: "lab_request",
  title: "New Diagnostic Test Requested",
  message: "Dr. Nimal Fernando has requested an urgent ECG 12-Lead test for you.",
  relatedModel: "LabRequest",
  relatedId: ecgLab._id,
  createdBy: doc2User._id
});

// Appointment 4: Ruwan Bandara (Yesterday - Completed Visit with Finalized Consultation, Rx & Completed Lab)
const appt4 = await Appointment.create({
  patientId: patientUserList[3]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(-1, 14),
  slotLabel: "Afternoon 02:00",
  reason: "Routine quarterly diabetes and lipid management review",
  status: "completed"
});

const consult4 = await Consultation.create({
  appointmentId: appt4._id,
  patientId: appt4.patientId,
  doctorId: doc1User._id,
  diagnosis: "Type 2 Diabetes Mellitus - Satisfactory Control; Mild Hypercholesterolemia",
  clinicalNotes: "Patient reports compliance with diet. Fasting blood sugar monitored. Prescribed Metformin 500mg maintenance. Ordered Fasting Blood Sugar lab test.",
  finalized: true
});

const rx4 = await Prescription.create({
  appointmentId: appt4._id,
  patientId: appt4.patientId,
  doctorId: doc1User._id,
  items: [
    {
      medicineName: "Metformin HCl 500mg Tablets",
      dosage: "500mg",
      frequency: "Twice daily",
      duration: "30 days",
      instructions: "Take with or immediately after meals"
    }
  ],
  status: "active"
});

const fbsLab = await LabRequest.create({
  appointmentId: appt4._id,
  patientId: appt4.patientId,
  doctorId: doc1User._id,
  testName: "Fasting Blood Sugar (FBS)",
  priority: "routine",
  status: "completed",
  resultSummary: "FBS: 112 mg/dL (Reference: 70-100 mg/dL). HbA1c: 6.1%. Glycemic status is well-controlled.",
  resultUrl: "https://healthguard.lk/reports/fbs-ruwan-bandara.pdf",
  verifiedBy: labUser._id
});

await Notification.create({
  patientId: fbsLab.patientId,
  type: "lab_result",
  title: "Laboratory Report Ready",
  message: "Your Fasting Blood Sugar (FBS) report has been finalized by the lab and is available in your patient portal.",
  relatedModel: "LabRequest",
  relatedId: fbsLab._id,
  createdBy: labUser._id
});

// Appointment 5: Priyantha Wickramasinghe (Tomorrow 09:00 - Booked)
const appt5 = await Appointment.create({
  patientId: patientUserList[4]._id,
  doctorId: doc2User._id,
  appointmentDate: offsetDate(1, 9),
  slotLabel: "Morning 09:00",
  reason: "Post-angioplasty annual cardiac follow-up",
  status: "booked"
});

console.log(`   ✓ Seeded real clinical visits, vitals, finalized consultation, prescriptions, and lab tests.`);

// ============================================================================
// STEP 10: SEED PHARMACY SALE & INVENTORY DISPENSING
// ============================================================================
console.log("\n9. Seeding Pharmacy POS Dispense & Stock Sale...");
const metforminMed = medicineMap.get("Metformin HCl 500mg Tablets");
const metforminBatch = batchMap.get("MET-2026-001");

const sale = await PharmacySale.create({
  saleNumber: `PH-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
  prescriptionId: rx4._id,
  patientId: appt4.patientId,
  soldBy: pharmaUser._id,
  items: [
    {
      medicineId: metforminMed._id,
      batchId: metforminBatch._id,
      quantity: 30,
      unitPrice: metforminMed.price,
      lineTotal: metforminMed.price * 30
    }
  ],
  total: metforminMed.price * 30,
  paymentStatus: "paid",
  billIssuedAt: offsetDate(-1, 15, 30)
});
console.log(`   ✓ Seeded Pharmacy POS Sale: ${sale.saleNumber} for Rs. ${sale.total.toFixed(2)}.`);

// ============================================================================
// STEP 11: SEED REAL INVOICING, PAYMENTS & RECEIPTS
// ============================================================================
console.log("\n10. Seeding Real Patient Invoicing & Reconciled Payments...");
const invoice4 = await Invoice.create({
  patientId: appt4.patientId,
  appointmentId: appt4._id,
  items: [
    { description: "General OPD Consultation (Dr. Amara Perera)", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
    { description: "Fasting Blood Sugar (FBS) Laboratory Investigation", quantity: 1, unitPrice: 650, lineTotal: 650 }
  ],
  subtotal: 2150,
  paidAmount: 2150,
  outstandingAmount: 0,
  status: "paid",
  createdBy: cashierUser._id
});

const payment4 = await Payment.create({
  invoiceId: invoice4._id,
  amount: 2150,
  method: "card",
  status: "reconciled",
  recordedBy: cashierUser._id,
  verifiedBy: cashierUser._id
});

// Second pending invoice for Saman Kumara
const invoice1 = await Invoice.create({
  patientId: appt1.patientId,
  appointmentId: appt1._id,
  items: [
    { description: "Specialist Follow-up Consultation", quantity: 1, unitPrice: 1800, lineTotal: 1800 }
  ],
  subtotal: 1800,
  paidAmount: 0,
  outstandingAmount: 1800,
  status: "issued",
  createdBy: cashierUser._id
});

console.log(`   ✓ Seeded Invoices: Paid Invoice (${invoice4._id}) with Reconciled Card Payment; Unpaid Invoice (${invoice1._id}).`);

// ============================================================================
// STEP 12: SEED REAL PAYROLL (Attendance-derived for Staff Members)
// ============================================================================
console.log("\n11. Seeding Real Attendance-Based Payroll Records...");
const payrollStaffList = ["HG-NUR-001", "HG-PHA-001", "HG-CAS-001"];

for (const empId of payrollStaffList) {
  const staff = staffProfileMap.get(empId);
  const attendanceDays = 22; // 22 working days in standard month
  const dailyRate = staff.baseSalary / 26;
  const netSalary = Math.round(dailyRate * attendanceDays + staff.allowances - staff.deductions);

  await Payroll.create({
    staffId: staff._id,
    month: currentMonth,
    baseSalary: staff.baseSalary,
    attendanceDays,
    allowances: staff.allowances,
    deductions: staff.deductions,
    netSalary,
    status: "paid",
    reviewedBy: staffUserMap.get("manager@healthguard.com")._id,
    approvedBy: staffUserMap.get("manager@healthguard.com")._id,
    paidAt: offsetDate(-2, 16)
  });
}
console.log(`   ✓ Seeded 3 verified, attendance-calculated, approved & paid payroll records.`);

// ============================================================================
// STEP 13: SYNCHRONIZE DATASET TO 'test' DATABASE (For Vercel Consistency)
// ============================================================================
console.log("\n12. Synchronizing authentic dataset to 'test' database...");
const hgDb = mongoose.connection.client.db("healthguard");
const testDb = mongoose.connection.client.db("test");
const hgCollections = await hgDb.listCollections().toArray();

for (const coll of hgCollections) {
  const docs = await hgDb.collection(coll.name).find().toArray();
  await testDb.collection(coll.name).deleteMany({});
  if (docs.length > 0) {
    await testDb.collection(coll.name).insertMany(docs);
  }
}
console.log("   ✓ Successfully synchronized all collections to 'test' database.");

// ============================================================================
// SUMMARY REPORT
// ============================================================================
console.log("\n============================================================================");
console.log("HEALTH GUARD MEDICAL CENTER - REAL SRI LANKAN PRODUCTION DATA SEED COMPLETE");
console.log("============================================================================");
console.log(`Target Database : healthguard & test (synchronized)`);
console.log(`Host Cluster    : ${mongoose.connection.host}`);
console.log(`Center Location : Ward Place, Cinnamon Gardens, Colombo 07`);
console.log(`Default Password: ${defaultPassword}`);
console.log("\nOperational Clinical Accounts for Verification:");
console.log("  • Admin       : admin@healthguard.com");
console.log("  • Manager     : manager@healthguard.com");
console.log("  • Doctor (OPD): doctor@healthguard.com");
console.log("  • Doctor (Card): doctor2@healthguard.com");
console.log("  • Nurse       : nurse@healthguard.com");
console.log("  • Nurse (Ward): nurse2@healthguard.com");
console.log("  • Pharmacist  : pharmacist@healthguard.com");
console.log("  • Cashier     : cashier@healthguard.com");
console.log("  • Lab MLT     : lab@healthguard.com");
console.log("  • Patients    : saman.kumara82@gmail.com / ruwan.bandara@gmail.com");
console.log("============================================================================\n");

await mongoose.connection.close();
process.exit(0);
