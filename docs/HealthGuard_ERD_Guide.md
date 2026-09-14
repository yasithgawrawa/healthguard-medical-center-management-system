# Health Guard Medical Center Management System
## Entity Relationship Diagram (ERD) & Database Schema Guide for Viva

---

## 1. Diagram Files & How to Open

The complete, multi-page Draw.io ERD file has been created at:
📍 **[`docs/HealthGuard_ERD.drawio`](./HealthGuard_ERD.drawio)**

### How to Open & Present in Draw.io:
1. Go to **[https://app.diagrams.net](https://app.diagrams.net)** (or open the **Draw.io Desktop** / VS Code Draw.io extension).
2. Click **File → Open From → Device** (or drag & drop `docs/HealthGuard_ERD.drawio` into the browser window).
3. The file contains **2 complete pages** accessible via the bottom page tabs in Draw.io:
   - **Tab 1: `1. Conceptual ERD (Chen Notation)`** — The classical Chen notation matching your lecture/viva reference (Rectangles for Entities, Red Diamonds for Relationships, Ellipses for Attributes, Red Underlined Ellipses for Primary Keys).
   - **Tab 2: `2. Logical Relational ERD (Schema & Types)`** — The complete relational database schema table layout with column data types, `PK` / `FK` markers, and Crow's Foot cardinality links.
4. To export for submission:
   - Click **File → Export as → PDF** or **PNG** (transparent background, 300 DPI) for slide decks or printed reports.

---

## 2. Interactive Mermaid ER Diagram Preview

```mermaid
erDiagram
    %% ==========================================
    %% EPIC 1: USER & WORKFORCE MANAGEMENT
    %% ==========================================
    USER ||--o| STAFF : "employed as (1:1)"
    USER ||--o{ APPOINTMENT : "books as patient (1:N)"
    USER ||--o{ APPOINTMENT : "conducts as doctor (1:N)"
    STAFF ||--o{ SHIFT : "assigned to (1:N)"
    STAFF ||--o{ ATTENDANCE : "logs attendance (1:N)"
    STAFF ||--o{ LEAVE_REQUEST : "applies for (1:N)"
    STAFF ||--o{ PAYROLL : "receives monthly (1:N)"

    %% ==========================================
    %% EPIC 2: CLINICAL SERVICES
    %% ==========================================
    APPOINTMENT ||--o| VITALS : "assesses (1:1)"
    APPOINTMENT ||--o| CONSULTATION : "documents (1:1)"
    APPOINTMENT ||--o| PRESCRIPTION : "issues (1:1)"
    APPOINTMENT ||--o{ LAB_REQUEST : "orders (1:N)"

    %% ==========================================
    %% EPIC 3: PHARMACY & INVENTORY
    %% ==========================================
    SUPPLIER ||--o{ PURCHASE : "supplies (1:N)"
    MEDICINE ||--o{ MEDICINE_BATCH : "categorizes (1:N)"
    PURCHASE }o--|| MEDICINE_BATCH : "restocks (N:1)"
    MEDICINE_BATCH ||--o{ PHARMACY_SALE : "dispensed from (1:N)"
    PRESCRIPTION ||--o| PHARMACY_SALE : "fulfills digital rx (1:1)"

    %% ==========================================
    %% EPIC 4: BILLING & FINANCE
    %% ==========================================
    APPOINTMENT ||--o| INVOICE : "bills visit charges (1:1)"
    PHARMACY_SALE ||--o| INVOICE : "bills walk-in/rx sale (1:1)"
    INVOICE ||--o{ PAYMENT : "settled by payments (1:N)"

    %% ==========================================
    %% ENTITY DEFINITIONS & CORE ATTRIBUTES
    %% ==========================================
    USER {
        ObjectId _id PK
        string firstName
        string lastName
        string email UK
        string role
        string phone
        string status
    }

    STAFF {
        ObjectId _id PK
        ObjectId userId FK
        string employeeId UK
        string department
        string designation
        number baseSalary
        string employmentStatus
    }

    SHIFT {
        ObjectId _id PK
        ObjectId staffId FK
        date shiftDate
        string startTime
        string endTime
        string type
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId staffId FK
        string workDate
        date checkInTime
        date checkOutTime
        string status
    }

    LEAVE_REQUEST {
        ObjectId _id PK
        ObjectId staffId FK
        date startDate
        date endDate
        string leaveType
        string status
    }

    APPOINTMENT {
        ObjectId _id PK
        ObjectId patientId FK
        ObjectId doctorId FK
        date appointmentDate
        string timeSlot
        string slotLabel
        string type
        string status
    }

    VITALS {
        ObjectId _id PK
        ObjectId appointmentId FK
        ObjectId patientId FK
        number temperature
        string bloodPressure
        number heartRate
        number spo2
    }

    CONSULTATION {
        ObjectId _id PK
        ObjectId appointmentId FK
        ObjectId doctorId FK
        string diagnosis
        string symptoms
        string clinicalNotes
        boolean finalized
    }

    PRESCRIPTION {
        ObjectId _id PK
        ObjectId appointmentId FK
        ObjectId patientId FK
        ObjectId doctorId FK
        array items
        string status
    }

    LAB_REQUEST {
        ObjectId _id PK
        ObjectId appointmentId FK
        ObjectId patientId FK
        string testName
        string priority
        array parameters
        string status
    }

    MEDICINE {
        ObjectId _id PK
        string name UK
        string category
        string unit
        number price
        number reorderLevel
        string status
    }

    MEDICINE_BATCH {
        ObjectId _id PK
        ObjectId medicineId FK
        string batchNumber UK
        number quantity
        number purchasePrice
        date manufactureDate
        date expiryDate
    }

    SUPPLIER {
        ObjectId _id PK
        string name
        string phone
        string email
        string status
    }

    PURCHASE {
        ObjectId _id PK
        ObjectId supplierId FK
        ObjectId medicineId FK
        ObjectId batchId FK
        number quantity
        number purchasePrice
        number totalCost
    }

    PHARMACY_SALE {
        ObjectId _id PK
        ObjectId prescriptionId FK
        ObjectId patientId FK
        ObjectId invoiceId FK
        string saleNumber UK
        string customerName
        number total
        string paymentStatus
    }

    INVOICE {
        ObjectId _id PK
        ObjectId patientId FK
        ObjectId appointmentId FK
        string customerName
        array items
        number subtotal
        number paidAmount
        number outstandingAmount
        string status
    }

    PAYMENT {
        ObjectId _id PK
        ObjectId invoiceId FK
        ObjectId recordedBy FK
        number amount
        string method
        string status
    }

    PAYROLL {
        ObjectId _id PK
        ObjectId staffId FK
        string month
        number baseSalary
        number attendanceDays
        number netSalary
        string status
    }
```

---

## 3. Key Architectural Relationships for Viva Explanations

During your viva presentation, examiners typically ask about cross-epic relationships and data integrity. Here are the key integration points:

| Integration Point | Epics Linked | Relationship & Rule |
|---|---|---|
| **Workforce Attendance → Payroll** | E1 → E4 | `Staff.attendanceDays` calculated dynamically from checked-out `Attendance` records in the month to compute `Payroll.netSalary = (baseSalary / 26) * attendanceDays + allowances - deductions`. |
| **Doctor Prescription → Pharmacy POS** | E2 → E3 | When a doctor writes a `Prescription`, it links via `Prescription._id` to `PharmacySale`. Dispensing automatically marks prescription status as `"dispensed"`. |
| **Clinical Consultation / Vitals → Invoice** | E2 → E4 | When a patient appointment is completed, consultation and lab request items are consolidated into an `Invoice` with line items and subtotal. |
| **Pharmacy Sales → Cashier Billing** | E3 → E4 | Both registered patient and walk-in unregistered sales generate an `Invoice`. When the Cashier records the `Payment`, `PharmacySale.paymentStatus` automatically updates to `"paid"`. |
| **Supplier Delivery → Inventory Batches** | E3 | Recording a supplier `Purchase` auto-generates sequential batch identifiers (e.g. `PCM-LK-2601`) and updates batch inventory stock atomically. |
