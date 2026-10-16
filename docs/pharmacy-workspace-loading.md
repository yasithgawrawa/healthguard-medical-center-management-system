# Pharmacy workspace loading

The workspace previously used one `Promise.all` for ten independent reads. Any failed read discarded all successful results and displayed a global toast without identifying the affected section.

The loader now limits concurrency to three requests, retries temporary read failures once, validates response shapes, and returns successful sections alongside named failures. Failed refreshes preserve previously loaded data. Authorization failures are reported without retrying. Patient and prescription lookup failures are no longer silently treated as empty lists.

Loading failures appear inside the pharmacy workspace with section-specific messages and a Retry loading button. Stale refresh results are ignored after a report-period change, a newer refresh, or unmounting.

## Files changed

- [InventoryWorkspacePanel.jsx](../frontend/src/components/epic3_inventory/InventoryWorkspacePanel.jsx): apply successful updates, retain prior data for failed sections, and show loading and retry controls.
- [loadInventoryWorkspace.js](../frontend/src/components/epic3_inventory/utils/loadInventoryWorkspace.js): section requests, bounded concurrency, temporary retries, and response validation.
- [inventoryWorkspaceLoading.test.js](../frontend/tests/inventoryWorkspaceLoading.test.js): partial failure, recovery, permission errors, malformed responses, retry limits, and concurrency checks.

## Verification

Run `node --test frontend/tests/inventoryWorkspaceLoading.test.js backend/tests/inventoryAlerts.test.js backend/tests/appointmentSlots.test.js` and `npm run build`.

All 13 tests and the production build passed. An isolated browser preview confirmed that the catalog remained visible during a simulated returns-endpoint failure and that Retry loading cleared the warning after recovery.

Unauthenticated checks of the deployed health endpoint passed, and protected inventory endpoints returned HTTP 401 as expected. Authenticated live checks were not performed, so the exact failing deployed request remains unverified. These changes require deployment before affecting the hosted site.
