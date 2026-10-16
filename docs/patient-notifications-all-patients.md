# All-patient notification recipients

New manager-created notifications always target All Patients. The creation form displays the recipient as a read-only field, submits `recipient: "all"` with no individual patient ID, and no longer searches for patients.

Request validation, the creation service, and model validation reject new individual-patient notices. Existing private notices retain their original audience and remain editable without becoming broadcasts. No existing records are migrated or broadened.

## Files changed

- [PatientNotificationManagementPanel.jsx](../frontend/src/components/epic2_clinical/PatientNotificationManagementPanel.jsx): fixed recipient display and broadcast-only submission; remove patient selection and search.
- [patientNoticeValidators.js](../backend/src/components/epic2_clinical/validators/patientNoticeValidators.js): allow only the `all` recipient and a null or omitted patient ID on creation.
- [patientNoticeService.js](../backend/src/components/epic2_clinical/services/patientNoticeService.js): enforce broadcast creation and store only supported fields.
- [PatientNotice.js](../backend/src/components/epic2_clinical/models/PatientNotice.js): reject new private documents while retaining legacy document integrity.
- [patientNotices.test.js](../backend/tests/patientNotices.test.js): verify broadcast delivery, rejected individual targeting, and legacy privacy.

## Validation

All nine notification integration tests pass using a temporary local database. The frontend production build passes.
