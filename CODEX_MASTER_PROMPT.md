# Health Guard – Codex Master Prompt

You are the coding agent for **Health Guard Medical Center Management System**, a university MERN-stack project.

## Mission
Build one integrated, role-based medical-center management web application while preserving clear epic ownership for viva assessment.

## Mandatory Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- ODM: Mongoose
- Auth: JWT
- Passwords: bcrypt
- Forms: React Hook Form
- Validation: Zod on frontend/backend where practical
- HTTP: Axios
- API testing compatibility: Postman

Do not replace the stack without explicit team instruction.

## Project Epics

### E1 – User & Staff Management
Owner: Gawrawa G H Y (IT24100799)
Features:
- Patient registration/login
- Patient profile
- Staff registration/profile
- Roles/permissions
- Shift scheduling
- Attendance
- Leave request/approval
- Attendance/leave monitoring

### E2 – Appointment & Clinical Workflow
Owner: Perera M U E (IT24101266)
Features:
- Doctor availability/slots
- Appointment booking/cancellation/history
- Check-in
- Vitals
- Consultation/diagnosis
- Prescription
- Lab request/verification/progress/results
- Patient/doctor lab report access

### E3 – Inventory & Procurement
Owner: Bandara N W C D (IT24100264)
Features:
- Medicines
- Batches
- Suppliers
- Purchases
- Stock
- Prices
- Low-stock alerts
- Expiry alerts
- Pharmacy sales
- Automatic stock deduction
- Reports

### E4 – Billing & Payment Management
Owner: Gunasekara W L L (IT24100344)
Features:
- Invoices
- Outstanding balances
- Payments
- Payment verification/reconciliation
- Receipts
- Revenue reports
- Salary information
- Attendance-based payroll
- Payroll review/approval/payment
- Payslips/history/reports

## Role Model
Supported roles:
- patient
- admin
- manager
- doctor
- nurse
- pharmacist
- cashier
- lab_assistant

Every protected frontend route and backend action must enforce authentication and required role/permission.

## Mandatory Folder Ownership

Frontend:
```text
frontend/src/components/
├── shared/
├── epic1_user_staff/
├── epic2_clinical/
├── epic3_inventory/
└── epic4_billing/
```

Backend:
```text
backend/src/components/
├── epic1_user_staff/
├── epic2_clinical/
├── epic3_inventory/
└── epic4_billing/
```

Each backend epic should use:
```text
controllers/
models/
routes/
services/
validators/
```

Shared backend infrastructure belongs in:
```text
backend/src/shared/
├── middleware/
├── config/
├── constants/
└── utils/
```

## Critical Architecture Rules
1. Do not put one epic's business logic inside another epic folder.
2. Do not duplicate authentication, role middleware, navbar, reusable forms, error helpers, or common constants.
3. Do not create separate duplicate patient/staff identities for each epic.
4. Use shared IDs/references for integration.
5. Keep route files thin.
6. Controllers handle HTTP concerns.
7. Services handle significant business rules where needed.
8. Models contain persistence/schema constraints.
9. Validators validate requests before controller/service logic.
10. Do not make unrelated large refactors when implementing a requested feature.

## Cross-Epic Integration Requirements

### E1 → E4 Payroll
Attendance from E1 must be consumable by E4 payroll using shared `staffId` references.

### E2 → E3 Pharmacy
Prescription from E2 must be consumable by E3 pharmacy/dispensing workflow.

### E2 → E4 Billing
Finalized services/appointments should provide trusted references/data to E4 invoice generation.

## Public Home Page
Create a shared public landing page with:
- Navbar
- Hero
- About
- Services
- Why Health Guard
- Contact
- Login
- Patient registration
- Footer

## Role Dashboards
Implement role-specific dashboards that expose only permitted functions:
- Patient
- Admin
- Manager
- Doctor
- Nurse
- Lab Assistant
- Pharmacist
- Cashier

Use shared dashboard cards/tables/layout components where possible.

## Validation Is Mandatory
Every important write operation must have:
1. Frontend validation
2. Backend validation
3. Authentication check
4. RBAC/authorization check
5. Business-rule validation
6. Mongoose constraints/indexes where appropriate
7. User-friendly errors
8. Loading/submission state
9. Duplicate-operation protection where relevant

### Validation Examples
- Unique staff employee ID/email
- Strong password + confirm password
- Valid roles/status enums
- Shift end after start
- No overlapping staff shifts
- No duplicate attendance check-in
- Check-out after check-in
- Leave end >= start
- Only pending leave can be approved/rejected
- Appointment slot must still be free at backend save time
- Expired stock cannot be sold
- Sale quantity cannot exceed stock
- Sale totals calculated on backend, not trusted from client
- Payment amount validated against invoice/outstanding balance
- Payroll state transitions enforced

## API Standards
Success:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

HTTP statuses:
- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error

## Security Baseline
- bcrypt password hashes only
- JWT auth
- Secrets in env variables
- Never expose password hashes
- RBAC on backend, not frontend only
- Validate all incoming data
- Centralized error handling
- Do not commit `.env`
- Avoid trusting client-calculated money, stock, or payroll values

## CRUD Expectations for Viva
Each epic should expose clear CRUD or workflow demonstrations.

E1:
- Staff CRUD/deactivation
- Shift CRUD
- Leave workflow
- Attendance workflow

E2:
- Appointment CRUD/status workflow
- Clinical records
- Prescription/lab requests

E3:
- Medicine CRUD
- Batch CRUD
- Supplier CRUD
- Purchases/sales

E4:
- Invoice CRUD/status lifecycle where appropriate
- Payments
- Receipts
- Payroll lifecycle

## Coding Style
- Prefer readable, maintainable code over clever abstractions.
- Use descriptive names.
- Keep functions reasonably small.
- Avoid duplication.
- Add comments only when logic is not obvious.
- Keep response handling consistent.
- Handle errors explicitly.
- Follow existing project patterns once established.

## When Implementing a Task
Before changing code:
1. Inspect repository structure.
2. Identify target epic and shared dependencies.
3. Reuse existing utilities/middleware/components.
4. Avoid editing unrelated epics.
5. Preserve working functionality.
6. Implement validation + auth + RBAC with the feature.
7. Add or update tests where practical.
8. Report exactly which files were changed and why.

## Scope Boundaries
Do not implement unless explicitly requested:
- External lab-system integration
- Insurance-claim integration
- External payment gateway APIs

## Suggested First Build Order
1. Repository/app skeleton
2. Shared MongoDB config
3. Shared roles/constants
4. User/auth model and JWT auth
5. RBAC/protected routes
6. Shared frontend layout/home/login
7. E1 Sprint 1 features
8. E2 Sprint 1 features
9. E3 Sprint 1 features
10. E4 Sprint 1 features
11. Cross-epic integrations
12. Validation hardening/testing

## Important Instruction
Never generate the entire system in one uncontrolled pass. Implement one logical feature at a time, keep changes reviewable, and preserve epic ownership.
