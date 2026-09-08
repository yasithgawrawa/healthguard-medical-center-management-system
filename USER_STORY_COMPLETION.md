# Health Guard User Story Completion

This document tracks completion of all user stories across E1-E4 after the implementation pass.

## E1 - User & Staff Management

| Story | Status | Completed implementation |
| --- | --- | --- |
| E1-US01 Patient creates own account | Complete | Patient registration with validation, bcrypt password hashing, JWT login and patient dashboard access. |
| E1-US02 Admin registers staff | Complete | Admin staff creation modal and protected staff API with role-based access. |
| E1-US03 Admin updates staff information | Complete | Staff edit flow for personal, department, role and status details. |
| E1-US04 Admin assigns roles and permissions | Complete | Role assignment in staff form, protected routes, backend RBAC middleware and role-aware dashboards. |
| E1-US05 Manager creates/manages shifts | Complete | Manager shift management panel with active staff selection and schedule table. |
| E1-US06 Staff records attendance | Complete | Staff check-in/check-out with center geolocation enforcement. |
| E1-US07 Staff submits leave requests | Complete | Staff self-service leave request modal and API. |
| E1-US08 Manager reviews leave requests | Complete | Manager leave queue with approve/reject workflow. |
| E1-US09 Staff views attendance records | Complete | Staff self-service attendance history table. |
| E1-US10 Manager views attendance information | Complete | Manager attendance table with search, role and date filters. |

## E2 - Appointment & Clinical Workflow

| Story | Status | Completed implementation |
| --- | --- | --- |
| E2-US01 Patient views available slots | Complete | Appointment slot API and patient slot selector exclude booked/unavailable slots. |
| E2-US02 Patient books appointment | Complete | Patient booking flow saves doctor, slot, time and reason through protected API. |
| E2-US03 Patient views current/previous appointments | Complete | Patient records panel lists scoped appointment history. |
| E2-US04 Patient cancels appointment | Complete | Patient cancel action for eligible future booked appointments. |
| E2-US05 Nurse checks in arriving patients | Complete | Nurse clinical workspace status update flow. |
| E2-US06 Nurse records vitals | Complete | Vitals modal with range validation and protected API. |
| E2-US07 Doctor records consultation details | Complete | Doctor consultation modal stores diagnosis, notes and finalization state. |
| E2-US08 Doctor creates prescription | Complete | Doctor prescription workflow and patient/pharmacy prescription visibility. |
| E2-US09 Doctor creates lab request | Complete | Doctor lab request workflow with priority. |
| E2-US10 Patient receives lab request notification | Complete | Doctor lab requests create persisted patient notifications with unread/read state in MongoDB. |
| E2-US11 Lab assistant verifies lab request | Complete | Lab workspace can move requests to verified. |
| E2-US12 Lab assistant updates lab progress | Complete | Lab workspace status updates through requested/verified/in progress/completed/cancelled. |
| E2-US13 Lab assistant enters/uploads results | Complete | Lab result summary and report URL fields. |
| E2-US14 Patient views completed lab reports | Complete | Patient lab records show status, summary and report link. |
| E2-US15 Doctor views requested lab results | Complete | Doctor workspace includes lab results requested by the doctor. |

## E3 - Inventory & Procurement

| Story | Status | Completed implementation |
| --- | --- | --- |
| E3-US01 Pharmacist adds medicines | Complete | Add medicine modal and protected create medicine API. |
| E3-US02 Pharmacist records batches | Complete | Receive batch modal with manufacture/expiry and quantity data. |
| E3-US03 Pharmacist views medicines and quantities | Complete | Catalog and batch tabs show medicine and stock quantities. |
| E3-US04 Pharmacist searches medicines | Complete | Catalog search by medicine, category, unit and status. |
| E3-US05 Pharmacist views individual batches | Complete | Batches tab lists batch number, quantity, purchase price and expiry. |
| E3-US06 Pharmacist updates medicine information | Complete | Edit medicine action and validated update API. |
| E3-US07 Pharmacist updates stock quantities | Complete | Edit stock action and purchase workflow update batch quantities. |
| E3-US08 Pharmacist updates batch information | Complete | Edit stock/batch modal and validated update API. |
| E3-US09 Pharmacist updates medicine prices | Complete | Medicine edit includes price update. |
| E3-US10 Pharmacist records supplier information | Complete | Supplier modal and protected supplier API. |
| E3-US11 Pharmacist records purchases | Complete | Record purchase workflow increases trusted backend stock. |
| E3-US12 Manager receives low-stock alerts | Complete | Inventory alerts tab available to manager. |
| E3-US13 Manager receives expiry alerts | Complete | Inventory alerts tab shows expiring batches. |
| E3-US14 Pharmacist/Manager views low-stock medicines | Complete | Low-stock count and alert data through shared inventory panel. |
| E3-US15 Pharmacist/Manager views expiry information | Complete | Expiry alert data and batch expiry table. |
| E3-US16 Pharmacist sells medicines | Complete | Record sale workflow with stock and expiry validation. |
| E3-US17 Pharmacist generates bill for medicine sale | Complete | Pharmacy sale creates a bill number and protected backend-generated downloadable bill. |
| E3-US18 System reduces stock after sale | Complete | Backend sale controller deducts batch quantity after validated sale. |
| E3-US19 Pharmacist views previous sales | Complete | Sales tab lists previous pharmacy sales. |
| E3-US20 Pharmacist/Manager views sales reports | Complete | Pharmacy sales report tab shows total sales, revenue and top medicine. |

## E4 - Billing & Payment Management

| Story | Status | Completed implementation |
| --- | --- | --- |
| E4-US01 Cashier generates invoice | Complete | Cashier invoice workflow creates backend-calculated invoices from appointments. |
| E4-US02 Patient views invoices | Complete | Patient records panel lists scoped bills and receipts. |
| E4-US03 Patient views outstanding balance | Complete | Patient invoice cards show outstanding amount. |
| E4-US04 Cashier records payments | Complete | Cashier payment modal records cash/card/bank transfer payments. |
| E4-US05 Cashier verifies payments | Complete | Payments tab supports recorded to verified transition. |
| E4-US06 Cashier reconciles payments | Complete | Payments tab supports verified to reconciled transition. |
| E4-US07 System generates receipt after payment | Complete | Fully paid invoices expose a protected backend-generated receipt endpoint. |
| E4-US08 Patient views/downloads receipt | Complete | Patient paid invoice card downloads the real backend receipt for their invoice. |
| E4-US09 Manager views revenue reports | Complete | Revenue tab shows invoiced, collected, outstanding and payroll expense totals. |
| E4-US10 Manager views outstanding invoices | Complete | Manager invoice table includes outstanding balances and statuses. |
| E4-US11 Admin/Manager maintains salary information | Complete | Staff profiles store base salary, allowances and deductions; payroll can auto-fill from salary master data. |
| E4-US12 System obtains attendance records for salary | Complete | Payroll calculation counts checked-out E1 attendance records by staff/month. |
| E4-US13 System calculates monthly salary | Complete | Backend computes attendance days, daily rate and net salary. |
| E4-US14 Manager reviews salaries | Complete | Payroll status transition supports draft to reviewed. |
| E4-US15 Manager approves salary payments | Complete | Payroll status transition supports reviewed to approved. |
| E4-US16 Manager records completed salary payments | Complete | Payroll status transition supports approved to paid with paid date. |
| E4-US17 System generates payslip | Complete | Payroll records expose a protected backend-generated downloadable payslip. |
| E4-US18 Staff views monthly payslip | Complete | Staff self-service panel includes payslip table and own-payslip download action. |
| E4-US19 Staff views salary payment history | Complete | Staff self-service payroll table lists salary history. |
| E4-US20 Manager views payroll reports | Complete | Manager payroll tab lists payroll records and payroll expense summary. |

## Verification

- Frontend production build passes.
- Backend route imports pass for E2, E3 and E4.
- Backend validator imports pass for E3 and E4.
- Frontend and backend validation remain active across write workflows.
