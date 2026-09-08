export const commonId = { name: "id", label: "Record ID", required: true, pathParam: true };

export const e1StaffActions = [
  {
    label: "Create Staff",
    method: "post",
    path: "/e1/staff",
    fields: [
      { name: "firstName", label: "First name", required: true },
      { name: "lastName", label: "Last name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", required: true },
      { name: "employeeId", label: "Employee ID", required: true },
      { name: "department", label: "Department", required: true },
      { name: "role", label: "Role", type: "select", required: true, options: [
        { value: "admin", label: "Admin" },
        { value: "manager", label: "Manager" },
        { value: "doctor", label: "Doctor" },
        { value: "nurse", label: "Nurse" },
        { value: "pharmacist", label: "Pharmacist" },
        { value: "cashier", label: "Cashier" },
        { value: "lab_assistant", label: "Lab Assistant" }
      ] },
      { name: "employmentDate", label: "Employment date", type: "date", required: true },
      { name: "password", label: "Password", type: "password", required: true }
    ]
  },
  {
    label: "Deactivate Staff",
    method: "delete",
    path: "/e1/staff/:id",
    fields: [commonId]
  }
];

export const e1WorkforceActions = [
  { label: "Create Shift", method: "post", path: "/e1/workforce/shifts", fields: [
    { name: "staffId", label: "Staff ID", required: true },
    { name: "startTime", label: "Start time", type: "datetime-local", required: true },
    { name: "endTime", label: "End time", type: "datetime-local", required: true },
    { name: "location", label: "Location", required: true }
  ] },
  { label: "Check In", method: "post", path: "/e1/workforce/attendance/check-in", fields: [
    { name: "staffId", label: "Staff ID", required: true },
    { name: "notes", label: "Notes" }
  ] },
  { label: "Check Out", method: "patch", path: "/e1/workforce/attendance/:id/check-out", fields: [commonId] },
  { label: "Create Leave", method: "post", path: "/e1/workforce/leave", fields: [
    { name: "staffId", label: "Staff ID", required: true },
    { name: "leaveType", label: "Type", type: "select", required: true, options: [
      { value: "annual", label: "Annual" }, { value: "sick", label: "Sick" }, { value: "casual", label: "Casual" }, { value: "unpaid", label: "Unpaid" }
    ] },
    { name: "startDate", label: "Start date", type: "date", required: true },
    { name: "endDate", label: "End date", type: "date", required: true },
    { name: "reason", label: "Reason", required: true }
  ] }
];

export const e2Actions = [
  { label: "Book Appointment", method: "post", path: "/e2/clinical/appointments", fields: [
    { name: "patientId", label: "Patient ID", required: true },
    { name: "doctorId", label: "Doctor User ID", required: true },
    { name: "appointmentDate", label: "Date/time", type: "datetime-local", required: true },
    { name: "slotLabel", label: "Slot", required: true },
    { name: "reason", label: "Reason", required: true }
  ] },
  { label: "Update Appointment", method: "patch", path: "/e2/clinical/appointments/:id/status", fields: [
    commonId,
    { name: "status", label: "Status", type: "select", required: true, options: [
      { value: "checked_in", label: "Checked in" }, { value: "in_consultation", label: "In consultation" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }
    ] }
  ] },
  { label: "Record Vitals", method: "post", path: "/e2/clinical/vitals", fields: [
    { name: "appointmentId", label: "Appointment ID", required: true },
    { name: "patientId", label: "Patient ID", required: true },
    { name: "temperature", label: "Temperature", type: "number" },
    { name: "heartRate", label: "Heart rate", type: "number" },
    { name: "spo2", label: "SpO2", type: "number" }
  ] },
  { label: "Save Consultation", method: "post", path: "/e2/clinical/consultations", fields: [
    { name: "appointmentId", label: "Appointment ID", required: true },
    { name: "patientId", label: "Patient ID", required: true },
    { name: "doctorId", label: "Doctor ID", required: true },
    { name: "diagnosis", label: "Diagnosis", required: true },
    { name: "clinicalNotes", label: "Clinical notes", required: true }
  ] },
  { label: "Create Prescription", method: "post", path: "/e2/clinical/prescriptions", fields: [
    { name: "appointmentId", label: "Appointment ID", required: true },
    { name: "patientId", label: "Patient ID", required: true },
    { name: "doctorId", label: "Doctor ID", required: true },
    { name: "items", label: "Items JSON", type: "json", required: true, defaultValue: "[{\"medicineName\":\"Paracetamol\",\"dosage\":\"500mg\",\"frequency\":\"Twice daily\",\"duration\":\"3 days\",\"instructions\":\"After meals\"}]" }
  ] },
  { label: "Create Lab Request", method: "post", path: "/e2/clinical/lab-requests", fields: [
    { name: "appointmentId", label: "Appointment ID", required: true },
    { name: "patientId", label: "Patient ID", required: true },
    { name: "doctorId", label: "Doctor ID", required: true },
    { name: "testName", label: "Test name", required: true }
  ] }
];

export const e3Actions = [
  { label: "Create Medicine", method: "post", path: "/e3/inventory/medicines", fields: [
    { name: "name", label: "Name", required: true },
    { name: "category", label: "Category", required: true },
    { name: "unit", label: "Unit", required: true },
    { name: "price", label: "Price", type: "number", required: true },
    { name: "reorderLevel", label: "Reorder level", type: "number", required: true }
  ] },
  { label: "Create Supplier", method: "post", path: "/e3/inventory/suppliers", fields: [
    { name: "name", label: "Name", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", required: true },
    { name: "address", label: "Address" }
  ] },
  { label: "Create Batch", method: "post", path: "/e3/inventory/batches", fields: [
    { name: "medicineId", label: "Medicine ID", required: true },
    { name: "batchNumber", label: "Batch number", required: true },
    { name: "quantity", label: "Quantity", type: "number", required: true },
    { name: "purchasePrice", label: "Purchase price", type: "number", required: true },
    { name: "manufactureDate", label: "Manufacture date", type: "date", required: true },
    { name: "expiryDate", label: "Expiry date", type: "date", required: true }
  ] },
  { label: "Record Purchase", method: "post", path: "/e3/inventory/purchases", fields: [
    { name: "supplierId", label: "Supplier ID", required: true },
    { name: "medicineId", label: "Medicine ID", required: true },
    { name: "batchId", label: "Batch ID", required: true },
    { name: "quantity", label: "Quantity", type: "number", required: true },
    { name: "purchasePrice", label: "Purchase price", type: "number", required: true }
  ] },
  { label: "Pharmacy Sale", method: "post", path: "/e3/inventory/sales", fields: [
    { name: "patientId", label: "Patient ID" },
    { name: "items", label: "Items JSON", type: "json", required: true, defaultValue: "[{\"medicineId\":\"\",\"batchId\":\"\",\"quantity\":1}]" }
  ] }
];

export const e4Actions = [
  { label: "Create Invoice", method: "post", path: "/e4/billing/invoices", fields: [
    { name: "patientId", label: "Patient ID", required: true },
    { name: "appointmentId", label: "Appointment ID" },
    { name: "items", label: "Items JSON", type: "json", required: true, defaultValue: "[{\"description\":\"Consultation\",\"quantity\":1,\"unitPrice\":1500}]" }
  ] },
  { label: "Record Payment", method: "post", path: "/e4/billing/payments", fields: [
    { name: "invoiceId", label: "Invoice ID", required: true },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "method", label: "Method", type: "select", required: true, options: [
      { value: "cash", label: "Cash" }, { value: "card", label: "Card" }, { value: "bank_transfer", label: "Bank transfer" }
    ] }
  ] },
  { label: "Create Payroll", method: "post", path: "/e4/billing/payroll", fields: [
    { name: "staffId", label: "Staff ID", required: true },
    { name: "month", label: "Month YYYY-MM", required: true },
    { name: "baseSalary", label: "Base salary", type: "number", required: true },
    { name: "allowances", label: "Allowances", type: "number", defaultValue: "0" },
    { name: "deductions", label: "Deductions", type: "number", defaultValue: "0" }
  ] }
];
