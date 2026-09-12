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

console.log("Connecting to MongoDB Atlas...");
await connectDatabase();
console.log(`Connected to database: ${mongoose.connection.name}`);

// ============================================================================
// STEP 1: PURGE DEMO OPERATIONAL COLLECTIONS (KEEPING ACCOUNTS)
// ============================================================================
console.log("\n1. Purging demo transactional data (preserving accounts)...");
await Promise.all([
  Shift.deleteMany({}),
  Attendance.deleteMany({}),
  LeaveRequest.deleteMany({}),
  Appointment.deleteMany({}),
  Vitals.deleteMany({}),
  Consultation.deleteMany({}),
  Prescription.deleteMany({}),
  LabRequest.deleteMany({}),
  Notification.deleteMany({}),
  LabTestCatalog.deleteMany({}),
  Medicine.deleteMany({}),
  MedicineBatch.deleteMany({}),
  Supplier.deleteMany({}),
  Purchase.deleteMany({}),
  PharmacySale.deleteMany({}),
  Invoice.deleteMany({}),
  Payment.deleteMany({}),
  Payroll.deleteMany({})
]);
console.log("   ✓ All demo operational records cleared.");

// ============================================================================
// STEP 2: TIME & CRYPTO HELPERS
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
// STEP 3: ENSURE PRIMARY CENTER LOCATION (Colombo 07 - Ward Place)
// ============================================================================
console.log("\n2. Configuring Medical Center Location...");
let primaryLocation = await CenterLocation.findOne({ key: "primary" });
if (!primaryLocation) {
  primaryLocation = await CenterLocation.create({
    key: "primary",
    name: "Health Guard Medical Center - Colombo 07",
    latitude: 6.9147,
    longitude: 79.8780,
    radiusMeters: 1000
  });
}
console.log(`   ✓ Center Location active: ${primaryLocation.name}`);

// ============================================================================
// STEP 4: VERIFY / UPSERT FOUNDATION STAFF & PATIENT ACCOUNTS
// ============================================================================
console.log("\n3. Verifying Staff & Patient Accounts...");
const staffAccountDefs = [
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
    firstName: "Amara",
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

for (const s of staffAccountDefs) {
  let user = await User.findOne({ email: s.email });
  if (!user) {
    user = await User.create({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      role: s.role,
      status: "active",
      passwordHash,
      address: "Health Guard Medical Center, Ward Place, Colombo 07"
    });
  }
  staffUserMap.set(s.email, user);

  let staff = await Staff.findOne({ employeeId: s.employeeId });
  if (!staff) {
    staff = await Staff.create({
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
  } else {
    staff.userId = user._id;
    await staff.save();
  }
  staffProfileMap.set(s.employeeId, staff);
}

// Ensure CenterLocation has updatedBy
primaryLocation.updatedBy = staffUserMap.get("admin@healthguard.com")._id;
await primaryLocation.save();

// Patient Accounts
const patientAccountDefs = [
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
for (const p of patientAccountDefs) {
  let patient = await User.findOne({ email: p.email });
  if (!patient) {
    patient = await User.create({
      ...p,
      role: ROLES.PATIENT,
      status: "active",
      passwordHash
    });
  }
  patientUserList.push(patient);
}
console.log(`   ✓ 9 Staff accounts & 5 Patient accounts confirmed active.`);

// ============================================================================
// STEP 5: SEED REAL WORKFORCE SHIFTS, ATTENDANCE & LEAVE (EPIC 1)
// ============================================================================
console.log("\n4. Seeding Workforce Shifts, Geofenced Attendance & Leave...");
const shiftsData = [
  { empId: "HG-DOC-001", dayOffset: 0, startHour: 8, endHour: 16, loc: "OPD Consultation Room 1" },
  { empId: "HG-NUR-001", dayOffset: 0, startHour: 7, endHour: 15, loc: "Triage & Vitals Desk" },
  { empId: "HG-NUR-002", dayOffset: 0, startHour: 13, endHour: 21, loc: "Observation Ward Station" },
  { empId: "HG-PHA-001", dayOffset: 0, startHour: 8, endHour: 17, loc: "Main Dispensary Counter" },
  { empId: "HG-CAS-001", dayOffset: 0, startHour: 8, endHour: 17, loc: "Cashier Counter 01" },
  { empId: "HG-LAB-001", dayOffset: 0, startHour: 8, endHour: 16, loc: "Pathology & Diagnostic Lab" },
  { empId: "HG-DOC-001", dayOffset: 1, startHour: 8, endHour: 16, loc: "OPD Consultation Room 1" },
  { empId: "HG-NUR-001", dayOffset: 1, startHour: 7, endHour: 15, loc: "Triage & Vitals Desk" }
];

for (const s of shiftsData) {
  const staff = staffProfileMap.get(s.empId);
  await Shift.create({
    staffId: staff._id,
    startTime: offsetDate(s.dayOffset, s.startHour),
    endTime: offsetDate(s.dayOffset, s.endHour),
    location: s.loc,
    status: "scheduled",
    notes: "Regular Clinical Roster - Health Guard Colombo 07"
  });
}

// Attendance (Biometric & Geofenced within Ward Place Colombo 07)
const attendanceSeeds = [
  { empId: "HG-NUR-001", dayOffset: -1, inHour: 7, outHour: 15 },
  { empId: "HG-PHA-001", dayOffset: -1, inHour: 8, outHour: 17 },
  { empId: "HG-CAS-001", dayOffset: -1, inHour: 8, outHour: 17 },
  { empId: "HG-LAB-001", dayOffset: -1, inHour: 8, outHour: 16 }
];

for (const a of attendanceSeeds) {
  const staff = staffProfileMap.get(a.empId);
  const checkInAt = offsetDate(a.dayOffset, a.inHour, 5);
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
      accuracyMeters: 10,
      distanceFromShiftMeters: 5
    },
    notes: "GPS verified check-in at Ward Place premises."
  });
}

// Staff Leave Request
const nurse2Staff = staffProfileMap.get("HG-NUR-002");
await LeaveRequest.create({
  staffId: nurse2Staff._id,
  leaveType: "annual",
  startDate: offsetDate(3, 0),
  endDate: offsetDate(5, 0),
  reason: "Family almsgiving (Dāna) ceremony in Galle",
  status: "pending"
});
console.log("   ✓ Seeded duty shifts, geofenced attendance logs, and leave request.");

// ============================================================================
// STEP 6: SEED DIAGNOSTIC LAB TEST CATALOG (EPIC 2)
// ============================================================================
console.log("\n5. Seeding Sri Lankan Diagnostic Test Catalog...");
const adminId = staffUserMap.get("admin@healthguard.com")._id;
const labCatalogDefs = [
  { testName: "Full Blood Count (FBC)", category: "Hematology", price: 750, urgentPrice: 1000, description: "Complete blood count including Hemoglobin, Platelets, WBC, and differential" },
  { testName: "Fasting Blood Sugar (FBS)", category: "Biochemistry", price: 450, urgentPrice: 600, description: "Glucose monitoring after 8-10 hour fast" },
  { testName: "Lipid Profile", category: "Biochemistry", price: 1850, urgentPrice: 2300, description: "Total Cholesterol, Triglycerides, HDL, LDL, and VLDL" },
  { testName: "Serum Creatinine & Electrolytes", category: "Renal Profile", price: 1200, urgentPrice: 1500, description: "Kidney function test with Sodium, Potassium, and Chloride" },
  { testName: "Dengue Antigen NS1 & Antibody", category: "Serology", price: 2500, urgentPrice: 3200, description: "Early dengue antigen detection with IgM and IgG antibodies" },
  { testName: "ECG 12-Lead", category: "Cardiology", price: 1200, urgentPrice: 1600, description: "Standard 12-lead resting electrocardiogram investigation" },
  { testName: "Urine Full Report (UFR)", category: "Clinical Pathology", price: 400, urgentPrice: 550, description: "Urine microscopic and biochemical analysis" }
];

for (const item of labCatalogDefs) {
  await LabTestCatalog.create({ ...item, updatedBy: adminId });
}
console.log(`   ✓ Seeded ${labCatalogDefs.length} standard Sri Lankan diagnostic laboratory tests.`);

// ============================================================================
// STEP 7: SEED SRI LANKAN PHARMACEUTICAL SUPPLIERS (EPIC 3)
// ============================================================================
console.log("\n6. Seeding Pharmaceutical Suppliers...");
const spcSupplier = await Supplier.create({
  name: "State Pharmaceuticals Corporation of Sri Lanka (SPC)",
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

const emerchemieSupplier = await Supplier.create({
  name: "Emerchemie NB (Ceylon) Ltd",
  email: "orders@emerchemie.lk",
  phone: "+94112866866",
  address: "No. 200, Cotta Road, Rajagiriya",
  status: "active"
});

const baursSupplier = await Supplier.create({
  name: "Baurs Healthcare (A. Baur & Co.)",
  email: "healthcare@baurs.com",
  phone: "+94114728700",
  address: "No. 5, Upper Chatham Street, Colombo 01",
  status: "active"
});
console.log(`   ✓ Seeded 4 leading Sri Lankan pharmaceutical suppliers (SPC, Hemas, Emerchemie, Baurs).`);

// ============================================================================
// STEP 8: SEED ESSENTIAL MEDICINES CATALOG & BATCHES (EPIC 3)
// ============================================================================
console.log("\n7. Seeding NMRA Essential Medicines & Tracked Batches...");
const medicineCatalog = [
  {
    name: "Paracetamol 500mg Tablets",
    category: "Analgesic",
    unit: "tablet",
    price: 15.00,
    reorderLevel: 100,
    batchNumber: "PCM-LK-2601",
    quantity: 300,
    purchasePrice: 9.50,
    mfgOffset: -90,
    expOffset: 360,
    supplier: spcSupplier
  },
  {
    name: "Amoxicillin + Clavulanate 625mg Tablets",
    category: "Antibiotic",
    unit: "tablet",
    price: 85.00,
    reorderLevel: 50,
    batchNumber: "AMC-LK-2601",
    quantity: 140,
    purchasePrice: 58.00,
    mfgOffset: -45,
    expOffset: 320,
    supplier: emerchemieSupplier
  },
  {
    name: "Metformin HCl 500mg Tablets",
    category: "Diabetes",
    unit: "tablet",
    price: 18.00,
    reorderLevel: 80,
    batchNumber: "MET-LK-2601",
    quantity: 240,
    purchasePrice: 12.00,
    mfgOffset: -120,
    expOffset: 400,
    supplier: hemasSupplier
  },
  {
    name: "Losartan Potassium 50mg Tablets",
    category: "Cardiology",
    unit: "tablet",
    price: 26.00,
    reorderLevel: 60,
    batchNumber: "LOS-LK-2601",
    quantity: 180,
    purchasePrice: 18.00,
    mfgOffset: -60,
    expOffset: 350,
    supplier: hemasSupplier
  },
  {
    name: "Omeprazole 20mg Capsules",
    category: "Gastrointestinal",
    unit: "capsule",
    price: 24.00,
    reorderLevel: 70,
    batchNumber: "OME-LK-2601",
    quantity: 160,
    purchasePrice: 16.50,
    mfgOffset: -75,
    expOffset: 320,
    supplier: spcSupplier
  },
  {
    name: "Atorvastatin 20mg Tablets",
    category: "Cardiology",
    unit: "tablet",
    price: 38.00,
    reorderLevel: 50,
    batchNumber: "ATO-LK-2601",
    quantity: 120,
    purchasePrice: 26.00,
    mfgOffset: -45,
    expOffset: 380,
    supplier: baursSupplier
  },
  {
    // LOW STOCK ALERT TRIGGER (stock 6 < reorderLevel 15)
    name: "Salbutamol Inhaler 100mcg",
    category: "Respiratory",
    unit: "inhaler",
    price: 850.00,
    reorderLevel: 15,
    batchNumber: "SAL-LK-2601",
    quantity: 6,
    purchasePrice: 620.00,
    mfgOffset: -30,
    expOffset: 270,
    supplier: baursSupplier
  },
  {
    // NEAR EXPIRY ALERT TRIGGER (expiring in 35 days < 60 threshold)
    name: "Cetirizine 10mg Tablets",
    category: "Antihistamine",
    unit: "tablet",
    price: 12.00,
    reorderLevel: 50,
    batchNumber: "CET-LK-2501",
    quantity: 45,
    purchasePrice: 7.50,
    mfgOffset: -300,
    expOffset: 35,
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
    purchasedAt: offsetDate(m.mfgOffset + 3, 10)
  });
}
console.log(`   ✓ Seeded ${medicineCatalog.length} NMRA medicines with batches, purchases, and active alert triggers.`);

// ============================================================================
// STEP 9: SEED CLINICAL VISITS, VITALS, RX & DIAGNOSTICS (EPIC 2)
// ============================================================================
console.log("\n8. Seeding Clinical Encounters, Consultations & Lab Investigations...");
const doc1User = staffUserMap.get("doctor@healthguard.com");
const nurseUser = staffUserMap.get("nurse@healthguard.com");
const labUser = staffUserMap.get("lab@healthguard.com");
const cashierUser = staffUserMap.get("cashier@healthguard.com");
const pharmaUser = staffUserMap.get("pharmacist@healthguard.com");

// 1. Saman Kumara (Today 09:00 - Checked In with Vitals in Triage Queue)
const appt1 = await Appointment.create({
  patientId: patientUserList[0]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(0, 9),
  slotLabel: "Morning 09:00",
  reason: "Elevated blood pressure and recurrent morning occipital headaches",
  status: "checked_in"
});

const vitals1 = await Vitals.create({
  appointmentId: appt1._id,
  patientId: appt1.patientId,
  temperature: 36.9,
  bloodPressure: "145/92",
  heartRate: 82,
  weight: 74,
  height: 172,
  spo2: 98,
  recordedBy: nurseUser._id
});

// 2. Nethmi Herath (Today 10:00 - Booked)
const appt2 = await Appointment.create({
  patientId: patientUserList[1]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(0, 10),
  slotLabel: "Morning 10:00",
  reason: "Epigastric pain, acid regurgitation, and postprandial discomfort",
  status: "booked"
});

// 3. Fathima Razeek (Today 11:00 - In Consultation with Urgent ECG Investigation)
const appt3 = await Appointment.create({
  patientId: patientUserList[2]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(0, 11),
  slotLabel: "Morning 11:00",
  reason: "Palpitations on mild climbing, shortness of breath, and fatigue",
  status: "in_consultation"
});

const ecgLab = await LabRequest.create({
  appointmentId: appt3._id,
  patientId: appt3.patientId,
  doctorId: doc1User._id,
  testName: "ECG 12-Lead",
  priority: "urgent",
  status: "in_progress",
  verifiedBy: labUser._id
});

await Notification.create({
  patientId: ecgLab.patientId,
  type: "lab_request",
  title: "Urgent Diagnostic Investigation Requested",
  message: "Dr. Amara Perera has requested an urgent ECG 12-Lead test for you. Please proceed to the laboratory.",
  relatedModel: "LabRequest",
  relatedId: ecgLab._id,
  createdBy: doc1User._id
});

// 4. Ruwan Bandara (Yesterday - Completed Visit: Finalized Consultation, Convalescence Rx, FBC Lab Result)
const appt4 = await Appointment.create({
  patientId: patientUserList[3]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(-1, 14),
  slotLabel: "Afternoon 02:00",
  reason: "Day 6 post-Dengue fever follow-up & platelet count review",
  status: "completed"
});

const consult4 = await Consultation.create({
  appointmentId: appt4._id,
  patientId: appt4.patientId,
  doctorId: doc1User._id,
  diagnosis: "Post-Dengue Convalescence; Platelet recovery verified (>140,000/μL); Resolving post-viral asthenia",
  clinicalNotes: "Patient afebrile for 72 hours. No warning signs or bleeding manifestations. Full Blood Count shows platelet count recovered to 148,000/μL and hematocrit 41.2%. Prescribed oral hydration and symptomatic recovery medication.",
  finalized: true
});

const rx4 = await Prescription.create({
  appointmentId: appt4._id,
  patientId: appt4.patientId,
  doctorId: doc1User._id,
  items: [
    {
      medicineName: "Paracetamol 500mg Tablets",
      dosage: "500mg (2 tabs)",
      frequency: "6 hourly PRN",
      duration: "3 days",
      instructions: "For headache or body ache. Maximum 8 tablets daily."
    },
    {
      medicineName: "Omeprazole 20mg Capsules",
      dosage: "20mg",
      frequency: "Once daily before breakfast",
      duration: "7 days",
      instructions: "Take 30 minutes before meals"
    }
  ],
  status: "active"
});

const fbcLab = await LabRequest.create({
  appointmentId: appt4._id,
  patientId: appt4.patientId,
  doctorId: doc1User._id,
  testName: "Full Blood Count (FBC)",
  priority: "routine",
  status: "completed",
  resultSummary: "Platelet Count: 148,000/μL (Reference: 150,000-450,000). HCT: 41.2%. WBC: 4,800/μL. Stable post-dengue recovery.",
  resultUrl: "https://healthguard.lk/reports/fbc-ruwan-bandara.pdf",
  verifiedBy: labUser._id
});

await Notification.create({
  patientId: fbcLab.patientId,
  type: "lab_result",
  title: "Laboratory Report Finalized",
  message: "Your Full Blood Count (FBC) investigation report has been verified and is available in your patient portal.",
  relatedModel: "LabRequest",
  relatedId: fbcLab._id,
  createdBy: labUser._id
});

// 5. Priyantha Wickramasinghe (Tomorrow 09:00 - Booked)
const appt5 = await Appointment.create({
  patientId: patientUserList[4]._id,
  doctorId: doc1User._id,
  appointmentDate: offsetDate(1, 9),
  slotLabel: "Morning 09:00",
  reason: "Annual post-stent cardiac evaluation and lipid profile review",
  status: "booked"
});
console.log("   ✓ Clinical visits, vitals, consultation notes, prescriptions, and lab tests recorded.");

// ============================================================================
// STEP 10: SEED PHARMACY SALES & DISPENSING (EPIC 3)
// ============================================================================
console.log("\n9. Seeding Pharmacy POS Sales...");
const pcmMed = medicineMap.get("Paracetamol 500mg Tablets");
const pcmBatch = batchMap.get("PCM-LK-2601");
const omeMed = medicineMap.get("Omeprazole 20mg Capsules");
const omeBatch = batchMap.get("OME-LK-2601");

// Prescription Dispensed Sale for Ruwan Bandara
const rxSale = await PharmacySale.create({
  saleNumber: `PH-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0001`,
  prescriptionId: rx4._id,
  patientId: appt4.patientId,
  soldBy: pharmaUser._id,
  items: [
    {
      medicineId: pcmMed._id,
      batchId: pcmBatch._id,
      quantity: 20,
      unitPrice: pcmMed.price,
      lineTotal: pcmMed.price * 20
    },
    {
      medicineId: omeMed._id,
      batchId: omeBatch._id,
      quantity: 7,
      unitPrice: omeMed.price,
      lineTotal: omeMed.price * 7
    }
  ],
  total: pcmMed.price * 20 + omeMed.price * 7,
  paymentStatus: "paid",
  billIssuedAt: offsetDate(-1, 15, 30)
});

// Walk-in OTC Sale
const otcSale = await PharmacySale.create({
  saleNumber: `PH-${now.toISOString().slice(0, 10).replace(/-/g, "")}-0002`,
  soldBy: pharmaUser._id,
  items: [
    {
      medicineId: pcmMed._id,
      batchId: pcmBatch._id,
      quantity: 10,
      unitPrice: pcmMed.price,
      lineTotal: pcmMed.price * 10
    }
  ],
  total: pcmMed.price * 10,
  paymentStatus: "paid",
  billIssuedAt: offsetDate(0, 11, 15)
});
console.log(`   ✓ Seeded Pharmacy sales: Prescription Dispense (${rxSale.saleNumber}) & Walk-in OTC (${otcSale.saleNumber}).`);

// ============================================================================
// STEP 11: SEED PATIENT INVOICES & PAYMENTS (EPIC 4)
// ============================================================================
console.log("\n10. Seeding Patient Invoices & Payments...");

// 1. Paid Invoice for Ruwan Bandara (Consultation + FBC Lab)
const invoice4 = await Invoice.create({
  patientId: appt4.patientId,
  appointmentId: appt4._id,
  items: [
    { description: "General OPD Consultation (Dr. Amara Perera)", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
    { description: "Full Blood Count (FBC) Investigation", quantity: 1, unitPrice: 750, lineTotal: 750 }
  ],
  subtotal: 2250,
  paidAmount: 2250,
  outstandingAmount: 0,
  status: "paid",
  createdBy: cashierUser._id
});

const payment4 = await Payment.create({
  invoiceId: invoice4._id,
  amount: 2250,
  method: "card",
  status: "reconciled",
  recordedBy: cashierUser._id,
  verifiedBy: cashierUser._id
});

// 2. Unpaid Invoice for Saman Kumara (Consultation + Triage)
const invoice1 = await Invoice.create({
  patientId: appt1.patientId,
  appointmentId: appt1._id,
  items: [
    { description: "Specialist OPD Consultation (Dr. Amara Perera)", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
    { description: "Triage Vitals Assessment", quantity: 1, unitPrice: 300, lineTotal: 300 }
  ],
  subtotal: 1800,
  paidAmount: 0,
  outstandingAmount: 1800,
  status: "issued",
  createdBy: cashierUser._id
});

// 3. Partially Paid Invoice for Fathima Razeek (Consultation + Urgent ECG)
const invoice3 = await Invoice.create({
  patientId: appt3.patientId,
  appointmentId: appt3._id,
  items: [
    { description: "Specialist OPD Consultation (Dr. Amara Perera)", quantity: 1, unitPrice: 1500, lineTotal: 1500 },
    { description: "ECG 12-Lead Investigation", quantity: 1, unitPrice: 1200, lineTotal: 1200 }
  ],
  subtotal: 2700,
  paidAmount: 1500,
  outstandingAmount: 1200,
  status: "partially_paid",
  createdBy: cashierUser._id
});

const payment3 = await Payment.create({
  invoiceId: invoice3._id,
  amount: 1500,
  method: "cash",
  status: "verified",
  recordedBy: cashierUser._id,
  verifiedBy: cashierUser._id
});
console.log("   ✓ Invoices seeded: Paid (Card), Unpaid (Issued), and Partially Paid (Cash).");

// ============================================================================
// STEP 12: SEED STAFF PAYROLLS (EPIC 4)
// ============================================================================
console.log("\n11. Seeding Staff Payroll Records...");
const payrollStaffList = ["HG-NUR-001", "HG-PHA-001", "HG-CAS-001"];

for (const empId of payrollStaffList) {
  const staff = staffProfileMap.get(empId);
  const attendanceDays = 22;
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
    status: empId === "HG-CAS-001" ? "reviewed" : "paid",
    reviewedBy: staffUserMap.get("manager@healthguard.com")._id,
    approvedBy: empId !== "HG-CAS-001" ? staffUserMap.get("manager@healthguard.com")._id : undefined,
    paidAt: empId !== "HG-CAS-001" ? offsetDate(-2, 16) : undefined
  });
}
console.log("   ✓ Seeded 3 monthly payroll records with attendance calculations.");

// ============================================================================
// STEP 13: SYNCHRONIZE STATE TO 'test' DATABASE (For Vercel Deployment Safety)
// ============================================================================
console.log("\n12. Synchronizing dataset to 'test' database...");
try {
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
} catch (syncErr) {
  console.warn("   Notice: could not sync to 'test' database:", syncErr.message);
}

// ============================================================================
// STEP 14: AUDIT REPORT
// ============================================================================
console.log("\n=======================================================");
console.log("SRI LANKAN PRODUCTION REAL DATA AUDIT");
console.log("=======================================================");
const auditCounts = {
  Users: await User.countDocuments(),
  Staff: await Staff.countDocuments(),
  CenterLocation: await CenterLocation.countDocuments(),
  Shifts: await Shift.countDocuments(),
  Attendance: await Attendance.countDocuments(),
  LeaveRequests: await LeaveRequest.countDocuments(),
  Appointments: await Appointment.countDocuments(),
  Vitals: await Vitals.countDocuments(),
  Consultations: await Consultation.countDocuments(),
  Prescriptions: await Prescription.countDocuments(),
  LabRequests: await LabRequest.countDocuments(),
  Notifications: await Notification.countDocuments(),
  LabTestCatalog: await LabTestCatalog.countDocuments(),
  Medicines: await Medicine.countDocuments(),
  MedicineBatches: await MedicineBatch.countDocuments(),
  Suppliers: await Supplier.countDocuments(),
  Purchases: await Purchase.countDocuments(),
  PharmacySales: await PharmacySale.countDocuments(),
  Invoices: await Invoice.countDocuments(),
  Payments: await Payment.countDocuments(),
  Payroll: await Payroll.countDocuments()
};
console.table(auditCounts);

console.log("\nSeed operation finished successfully. All realistic Sri Lankan data is ready for demonstration.");
await mongoose.connection.close();
process.exit(0);
