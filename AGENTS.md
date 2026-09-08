# AGENTS.md – Health Guard Repository Rules

These instructions apply to coding agents working in this repository.

## 1. Project
Health Guard Medical Center Management System is a MERN application with four epics and shared infrastructure.

## 2. Do Not Break Epic Ownership
- E1 code → `epic1_user_staff`
- E2 code → `epic2_clinical`
- E3 code → `epic3_inventory`
- E4 code → `epic4_billing`
- Cross-cutting reusable code → `shared`

Do not move another member's feature into a different epic folder just for convenience.

## 3. Shared Before Duplicate
Reuse shared:
- auth middleware
- RBAC
- constants/enums
- navbar/sidebar/layouts
- form inputs
- tables/modals
- error helpers
- API client
- validation helpers where appropriate

## 4. Mandatory Validation
Every important form/write endpoint requires frontend + backend validation and appropriate database constraints.

## 5. Mandatory Security
- bcrypt
- JWT
- backend RBAC
- protected frontend routes
- no plaintext passwords
- no secrets in source control
- no password hashes in responses

## 6. Backend Layering
Preferred flow:
`route → auth/RBAC → validator → controller → service → model/database`

Keep routes thin.

## 7. API Consistency
Use consistent success/error structures and correct HTTP status codes.

## 8. Data Integrity
Do not trust client-side totals, stock values, salary calculations, or workflow state transitions. Recalculate/verify on backend.

## 9. Integration
Use shared IDs instead of copying records between epics.

Important links:
- E1 attendance → E4 payroll
- E2 prescription → E3 pharmacy
- E2 finalized service → E4 invoice

## 10. Scope
Do not add external payment gateway, external laboratory-system, or insurance integration unless explicitly requested.

## 11. Change Discipline
When asked to implement a feature:
- inspect first
- change only necessary files
- do not rewrite working code without reason
- keep changes small/reviewable
- document files changed
