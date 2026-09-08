# Health Guard Medical Center Management System

A role-based **MERN stack Medical Center Management System** developed for the SLIIT Information Systems Project Management integrated project.

**Project ID:** `ISE_WE_0201_62`  
**Project:** Health Guard Medical Center Management System  
**Development approach:** Agile / Scrum, iterative 13-week implementation  
**Architecture:** One integrated web application with four clearly separated epic/component areas plus shared services.

## Project Idea

Health Guard Medical Center currently depends on manual or fragmented processes for appointments, prescriptions, clinical records, medicine inventory, staff information, billing, payments and payroll. This can cause repeated data entry, communication delays, long waiting times, stock shortages, expired medicines, payment errors and limited management visibility.

The Health Guard system brings these workflows into **one centralized, traceable and role-based web application**.

The final MVP is organized into four major epics:

1. **E1 – User & Staff Management**
2. **E2 – Appointment & Clinical Workflow**
3. **E3 – Inventory & Procurement**
4. **E4 – Billing & Payment Management**

The modules are separately owned for development and viva demonstration, but must operate as **one integrated system** through shared users, identifiers, authentication, roles and cross-module data flows.

## Team and Epic Ownership

| Epic | Module | Owner | Student ID |
|---|---|---|---|
| E1 | User & Staff Management | Gawrawa G H Y | IT24100799 |
| E2 | Appointment & Clinical Workflow | Perera M U E | IT24101266 |
| E3 | Inventory & Procurement | Bandara N W C D | IT24100264 |
| E4 | Billing & Payment Management | Gunasekara W L L | IT24100344 |

Sprint 0 roles:
- **Gawrawa G H Y** – Scrum Master
- **Bandara N W C D** – Product Owner
- Other members – Team Members

## Final Technology Stack

### Frontend
- React
- Vite
- React Router
- React Hook Form
- Zod validation
- Axios
- Shared reusable UI components

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Zod/backend request validation

### Development Tools
- Git and GitHub
- Codex as coding agent
- Postman
- Figma
- Draw.io / PlantUML
- VS Code or equivalent

> Sprint 0 proposed PostgreSQL/MySQL as an implementation option. The team later selected MERN, so the actual implementation uses **MongoDB + Mongoose**. Final project documentation should be updated to match the implemented stack.

## System Roles

- `patient`
- `admin`
- `manager`
- `doctor`
- `nurse`
- `pharmacist`
- `cashier`
- `lab_assistant`

```text
Login
  ↓
JWT Authentication
  ↓
Role Identification
  ↓
Protected Route / API Authorization
  ↓
Correct Role Dashboard
```

## Public Home Page

Recommended sections:
- Navbar
- Hero section
- About Health Guard
- Services
  - Appointments
  - Consultations
  - Laboratory services
  - Pharmacy
  - Billing
- Why Health Guard
- Contact
- Login
- Patient Registration
- Footer

The public home page belongs to the **shared frontend**.

## Role-Based Dashboards

### Patient Dashboard
- My Profile – E1
- Book Appointment – E2
- My Appointments – E2
- Laboratory Reports – E2
- My Invoices – E4
- Outstanding Balance – E4
- Receipts – E4

### Admin Dashboard
Primary E1 dashboard:
- Total staff
- Active users
- Role summary
- Add Staff
- Manage Staff
- Manage roles/permissions
- View staff profiles
- Search/filter staff
- Activate/deactivate staff

### Manager Dashboard
Cross-module dashboard:
- Workforce: shifts, attendance, leave approvals
- Inventory: low-stock/expiry alerts, reports
- Finance: revenue, outstanding invoices, payroll

### Doctor Dashboard
- Today's appointments
- Patients waiting
- Consultation
- Diagnosis
- Prescription
- Lab requests
- Lab results

### Nurse Dashboard
- Patient queue
- Patient check-in
- Vital signs
- Checked-in patients

### Laboratory Assistant Dashboard
- New lab requests
- Verify request
- Update progress
- Enter/upload result
- Completed tests

### Pharmacist Dashboard
- Medicines
- Batches
- Suppliers
- Purchases
- Low-stock alerts
- Expiry alerts
- Pharmacy sales
- Automatic stock deduction
- Sales reports

### Cashier Dashboard
- Generate invoice
- View invoices
- Record payment
- Verify payment
- Reconcile payments
- Generate receipt
- Revenue summary
- Outstanding invoices

### Staff Self-Service
- My Profile
- My Shift
- My Attendance
- Submit Leave Request
- My Leave Requests
- My Payslips
- Salary History

## Epic Features

### E1 – User & Staff Management
**Owner:** Gawrawa G H Y – IT24100799

Approved scope:
- Patient registration/login
- Patient profile management
- Staff registration/profile management
- Roles and permissions
- Shift scheduling
- Attendance management
- Leave request/approval
- Attendance and leave monitoring

Main CRUDs:
- Staff CRUD (prefer deactivate over permanent delete)
- Shift CRUD
- Leave workflow CRUD/status actions
- Attendance check-in/check-out/read/monitor

Sprint 1 priority:
- E1-US01 Patient account creation
- E1-US02 Staff registration
- E1-US03 Staff information update
- E1-US04 Roles and permissions
- E1-US05 Shift management

### E2 – Appointment & Clinical Workflow
**Owner:** Perera M U E – IT24101266

Approved scope:
- Doctor availability and slots
- Appointment booking/cancellation/history
- Patient check-in
- Vital signs
- Consultation/diagnosis
- Prescription
- Lab request/verification/progress/results
- Patient/doctor lab result access
- Patient lab-request notification

### E3 – Inventory & Procurement
**Owner:** Bandara N W C D – IT24100264

Approved scope:
- Medicine CRUD
- Medicine batch CRUD
- Supplier CRUD
- Medicine purchases
- Stock quantities/prices
- Low-stock/expiry notifications
- Pharmacy sales
- Automatic stock deduction
- Inventory/sales reports

### E4 – Billing & Payment Management
**Owner:** Gunasekara W L L – IT24100344

Approved scope:
- Invoice generation/viewing
- Outstanding balances
- Payment recording/verification/reconciliation
- Receipts
- Revenue/outstanding reports
- Staff salary info
- Attendance-based payroll
- Salary review/approval/payment
- Payslips/history/reports

## Core Cross-Epic Integrations

### E1 → E4 Payroll
```text
E1 Staff
  ↓
E1 Attendance
  ↓ shared staffId
E4 Payroll Calculation
  ↓
Review / Approval
  ↓
Payslip
```

### E2 → E3 Pharmacy
```text
Doctor Consultation
  ↓
Prescription
  ↓
E3 Pharmacy
  ↓
Medicine Sale / Dispensing
  ↓
Automatic Stock Deduction
```

### E2 → E4 Billing
```text
Completed Medical Service
  ↓
E4 Invoice
  ↓
Payment
  ↓
Receipt
```

### Shared Identity
Do not duplicate users per epic. Reference shared IDs:

```js
Appointment { patientId, doctorId }
Prescription { patientId, doctorId, appointmentId }
Invoice { patientId, appointmentId }
Attendance { staffId }
Payroll { staffId }
```

## Folder Structure

```text
healthguard-medical-center-management-system/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── shared/
│       │   ├── epic1_user_staff/
│       │   ├── epic2_clinical/
│       │   ├── epic3_inventory/
│       │   └── epic4_billing/
│       ├── pages/
│       ├── services/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       └── utils/
├── backend/
│   └── src/
│       ├── components/
│       │   ├── epic1_user_staff/
│       │   │   ├── controllers/
│       │   │   ├── models/
│       │   │   ├── routes/
│       │   │   ├── services/
│       │   │   └── validators/
│       │   ├── epic2_clinical/
│       │   ├── epic3_inventory/
│       │   └── epic4_billing/
│       ├── shared/
│       │   ├── middleware/
│       │   ├── config/
│       │   ├── constants/
│       │   └── utils/
│       └── server.js
├── shared/
│   ├── constants/
│   ├── validation/
│   ├── enums/
│   └── helpers/
├── docs/
│   ├── FEATURES_AND_CRUD.md
│   └── PROJECT_STRUCTURE.md
├── AGENTS.md
├── CODEX_MASTER_PROMPT.md
└── README.md
```

## Validation Standard

Every important form/API uses layered validation:

```text
User Input
  ↓
Frontend Validation
  ↓
Backend Validation
  ↓
Authentication / Authorization
  ↓
Business Rules
  ↓
Mongoose Validation
  ↓
MongoDB
```

Frontend validation improves UX; **backend validation is authoritative**.

Examples:
- Unique staff employee ID/email
- Password complexity and confirmation
- Valid role enums
- Shift overlap rejection
- Duplicate attendance prevention
- Leave date/status rules
- Appointment slot re-check on backend
- Expired stock cannot be sold
- Sale totals calculated by backend
- Payment amounts validated
- Payroll calculated from trusted attendance data

## API Response Standard

Success:
```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email already exists"
  }
}
```

Recommended HTTP statuses:
- 200 Successful request
- 201 Created
- 400 Validation error
- 401 Not authenticated
- 403 Not authorized
- 404 Not found
- 409 Conflict/duplicate
- 500 Unexpected server error

## Backend Request Flow

```text
Request
  ↓
Authentication Middleware
  ↓
Role Authorization
  ↓
Request Validation
  ↓
Controller
  ↓
Service / Business Logic
  ↓
Mongoose Model
  ↓
MongoDB
```

## Security Baseline

- bcrypt password hashing
- JWT authentication
- Environment variables for secrets
- Protected frontend routes
- Protected backend APIs
- RBAC
- Input validation
- Never return password hashes
- Centralized error handling
- Never commit `.env`
- Restrict sensitive actions by role

## Git Branch Strategy

```text
main
develop
epic1-user-staff
epic2-clinical
epic3-inventory
epic4-billing
```

Workflow:
```text
Epic Branch → Pull Request → develop → Integration Testing → main
```

## Definition of Done

A feature should include:
- Working UI
- Working API
- Database persistence
- Frontend validation
- Backend validation
- Mongoose constraints where appropriate
- Authentication
- RBAC
- Useful errors
- Loading/submission states
- Normal/boundary/error-case testing
- Cross-module integration where required
- No known critical defects
- Correct epic/shared folder placement

## Viva Demonstration Strategy

Each member should be able to show:
1. Correct role dashboard
2. Epic responsibility
3. Frontend epic folder
4. Backend epic folder
5. Mongoose model(s)
6. API route/controller/service
7. CREATE
8. READ
9. UPDATE
10. DELETE/Deactivate where appropriate
11. Validation
12. Backend validation/Postman
13. RBAC
14. One cross-epic integration

## MVP Scope Boundaries

The approved MVP does not require:
- External laboratory-system integration
- Insurance claim integration
- External payment-gateway API integration

## Project Milestones

- Week 3 – Sprint 0 evaluation
- Week 4 – Sprint 0 report submission
- Week 7 – Sprint 1 evaluation
- Week 10 – Sprint 2 evaluation
- Week 12 – Final report preparation
- Week 13 – Sprint 3 final evaluation and integrated MVP demonstration

## Codex Usage

See:
- `AGENTS.md`
- `CODEX_MASTER_PROMPT.md`
- `docs/FEATURES_AND_CRUD.md`
- `docs/PROJECT_STRUCTURE.md`

Use Codex with small, controlled implementation tasks. Do not ask it to generate the whole application blindly.
