# Features, CRUD and Validation Matrix

## E1 – User & Staff Management

### Patient Registration
Fields:
- firstName
- lastName
- dateOfBirth
- gender
- email
- phone
- address
- password
- confirmPassword

Validations:
- required fields
- valid email
- unique email
- valid phone
- DOB not in future
- password >= 8 with uppercase/lowercase/number/special char
- confirm password matches

### Staff CRUD
Create:
- Admin creates staff

Read:
- Staff list
- Staff detail
- Search/filter by role/status/name

Update:
- Profile/contact/role/department/status

Delete equivalent:
- Deactivate staff rather than destroying important history

Validation:
- unique employee ID
- unique email
- allowed role enum
- employment date valid
- only authorized admin actions

### Shift CRUD
- Create
- Read
- Update
- Delete/cancel

Validation:
- staff exists and active
- end > start
- reject overlapping shifts

### Attendance
- check-in
- check-out
- read own records
- manager monitor

Validation:
- no duplicate check-in
- check-out after check-in
- active staff only

### Leave
- staff creates request
- staff reads requests
- update/cancel pending request where allowed
- manager approves/rejects

Validation:
- end >= start
- no invalid overlap where business rule applies
- only pending requests can be approved/rejected

## E2 – Appointment & Clinical Workflow

### Appointment
CRUD/status workflow:
- view available slots
- create booking
- read appointment/history
- cancel eligible appointment

Validation:
- doctor required
- future/current valid date
- slot exists
- backend re-checks availability
- prevent double booking

### Check-In
Validation:
- appointment exists
- correct day/status
- not cancelled
- not already checked in

### Vitals
Fields may include:
- temperature
- blood pressure
- heart rate
- weight
- height
- SpO2

Validation:
- numeric values where applicable
- positive values where applicable
- SpO2 0–100

### Consultation
- record consultation details
- diagnosis
- clinical notes

Validation:
- valid appointment/patient
- correct doctor authorization
- required diagnosis/notes according to UI design

### Prescription
- medicine
- dosage
- frequency
- duration
- instructions

Validation:
- required dosage/frequency/duration
- only doctor can prescribe

### Laboratory
- create request
- verify request
- update progress
- enter/upload result
- patient/doctor view result

Validation:
- valid request
- valid status transitions
- authorized role
- attachment restrictions if uploads used

## E3 – Inventory & Procurement

### Medicine CRUD
- create
- read/search
- update
- deactivate/delete safely

Validation:
- required name/category/unit
- price >= 0
- reorder level >= 0

### Batch CRUD
- create/read/update/correct

Validation:
- unique batch number as designed
- quantity > 0
- expiry > manufacture date
- expired batch cannot be sold

### Supplier CRUD
- create/read/update/deactivate

Validation:
- valid email/phone
- required supplier name

### Purchase
- supplier
- medicine/batch
- quantity
- purchase price

Validation:
- valid references
- positive quantity/price
- stock update occurs from trusted backend logic

### Pharmacy Sale
Validation:
- quantity > 0
- quantity <= available stock
- batch not expired
- medicine active
- backend calculates price/total
- automatic stock deduction

## E4 – Billing & Payment Management

### Invoice
- generate invoice from trusted finalized services
- read invoices/outstanding balances
- update allowed status/details according to workflow

Validation:
- valid patient/service references
- totals calculated by backend

### Payment
- record
- verify
- reconcile

Validation:
- invoice exists
- amount > 0
- enforce outstanding-balance rules
- valid payment method
- correct state transitions

### Receipt
- generated from successful/verified payment
- view/download
- not manually edited as arbitrary data

### Payroll
- salary setup
- attendance import/reference from E1
- calculation
- review
- approval
- payment
- payslip
- history/reporting

Validation:
- staff exists
- salary >= 0
- one payroll per employee/month unless versioning designed
- calculate from trusted backend values
- only approved payroll can move to paid

## Universal UX Requirements
- inline form errors
- disable submit during request
- loading state
- success feedback
- confirmation dialog for destructive actions
- clear empty states
- search/filter/pagination for major list pages

## Universal API Requirements
- frontend validation
- backend validation
- authentication
- RBAC
- business rule checks
- Mongoose validation/indexes
- consistent HTTP statuses and JSON responses
