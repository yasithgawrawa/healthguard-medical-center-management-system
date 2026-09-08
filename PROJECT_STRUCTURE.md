# Project Structure and Ownership

## Goal
Keep every member's frontend/backend work visibly separated for viva demonstration while maintaining one integrated application.

## Root Structure
```text
frontend/
backend/
shared/
docs/
AGENTS.md
CODEX_MASTER_PROMPT.md
README.md
```

## Frontend
```text
frontend/src/
├── components/
│   ├── shared/
│   ├── epic1_user_staff/
│   ├── epic2_clinical/
│   ├── epic3_inventory/
│   └── epic4_billing/
├── pages/
│   ├── public/
│   ├── patient/
│   ├── admin/
│   ├── manager/
│   ├── doctor/
│   ├── nurse/
│   ├── pharmacist/
│   ├── cashier/
│   └── lab/
├── services/
├── context/
├── hooks/
├── layouts/
└── utils/
```

## Backend
```text
backend/src/
├── components/
│   ├── epic1_user_staff/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   ├── epic2_clinical/
│   ├── epic3_inventory/
│   └── epic4_billing/
├── shared/
│   ├── middleware/
│   ├── config/
│   ├── constants/
│   └── utils/
└── server.js
```

## E1 Suggested Files
Frontend:
```text
components/epic1_user_staff/
├── auth/
├── staff/
├── shifts/
├── attendance/
├── leave/
└── dashboard/
```

Backend:
```text
components/epic1_user_staff/
├── controllers/
│   ├── authController.js
│   ├── staffController.js
│   ├── shiftController.js
│   ├── attendanceController.js
│   └── leaveController.js
├── models/
│   ├── User.js
│   ├── Staff.js
│   ├── Shift.js
│   ├── Attendance.js
│   └── LeaveRequest.js
├── routes/
├── services/
└── validators/
```

## Shared Frontend Components
```text
components/shared/
├── Navbar.jsx
├── Sidebar.jsx
├── DashboardCard.jsx
├── DataTable.jsx
├── SearchBar.jsx
├── Pagination.jsx
├── Modal.jsx
├── ConfirmDialog.jsx
├── Loader.jsx
├── ProtectedRoute.jsx
└── forms/
    ├── FormInput.jsx
    ├── FormSelect.jsx
    ├── FormTextarea.jsx
    ├── FormError.jsx
    └── SubmitButton.jsx
```

## Shared Identity Rule
Never create separate patient/staff copies per module. Other epics reference shared IDs.

## Branches
```text
main
develop
epic1-user-staff
epic2-clinical
epic3-inventory
epic4-billing
```
