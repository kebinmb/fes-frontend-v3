# Changelog

All notable frontend changes should be documented in this file.

This project follows a simple semantic versioning style:

- `MAJOR` for breaking route, auth, or API-contract changes.
- `MINOR` for new backward-compatible screens or features.
- `PATCH` for bug fixes, optimizations, and documentation.

## [0.3.0] - 2026-07-21

### Added

- Added the Faculty Reports dashboard for Admin and HR users.
- Added Ready-to-Print faculty visibility for faculty with both Student Evaluation and Supervisor Evaluation score records.
- Added a lightweight Ready-to-Print faculty ID endpoint used by filtered bulk printing.

### Changed

- HR sidebar access is now limited to Faculty Dashboard, Supervisor Evaluations, and Faculty Reports.
- Filtered bulk printing now prepares reports in smaller batches instead of one oversized backend response.
- Printed Faculty Evaluation reports now show the logged-in user account's first name and last name for Name of Staff.
- Removed the digital signature and QR verification block from the Faculty Evaluation print template.

### Performance And Reliability

- Ready-to-Print faculty data now uses an optimized summary table instead of repeatedly aggregating the full score table.
- Ready-to-Print dashboard and faculty ID results are cached and evicted when new evaluations are submitted.
- Added a database collation alignment migration for the Ready-to-Print summary table.
- Client-aborted print responses are handled quietly so cancelled browser requests do not appear as application failures.

## [0.2.2] - 2026-07-14

### Changed

- Aligned the frontend idle-session timer to the ten-minute backend policy.
- Improved the Faculty Dashboard bulk-print action so it is disabled until a campus or college print filter is selected.
- Included the bulk-print college filter in the clear-filter workflow.
- Removed an unused CSRF helper allocation from the auth interceptor.

### User Impact

- Active users should no longer see a five-minute local timeout when the intended policy is ten minutes.
- Bulk printing now communicates the required filter state before the administrator starts the action.

## [0.2.1] - 2026-07-10

### Changed

- Updated authenticated session expiration from five minutes to ten minutes of user inactivity.
- Session activity is now based on real user interaction such as keyboard, pointer, touch, scroll, focus, and tab visibility checks.
- Protected API requests no longer count as user activity by themselves, preventing background requests from keeping an idle session alive.
- Protected requests now send a short-lived activity signal to the backend only when recent user interaction is detected.

### Security And Session Handling

- The frontend now expires the session locally before sending protected requests after the ten-minute inactivity limit.
- The frontend and backend now coordinate session renewal so active users remain signed in, while AFK users are signed out consistently.

## [0.2.0] - 2026-07-09

### Added

- Added a dedicated **Class Assignments** administrator sidebar option and workspace.
- Added current-term class browsing with debounced search, campus filtering, server-side pagination, responsive table states, and clear loading and empty feedback.
- Added a faculty reassignment confirmation dialog limited to active faculty from the class's source database.
- Added five-minute inactivity-based session expiration using keyboard, pointer, touch, API, focus, reload, and cross-tab activity.

### Changed

- Successful faculty reassignment replaces the affected table row immediately without requiring a page refresh.
- Faculty option responses are cached by source database while the assignment workspace is open.
- Session expiration now reacts to authentication failures (`401`) without treating normal authorization failures (`403`) as expired sessions.
- Audit-log response handling now preserves structured previous and new values supplied by the backend.

### Security And Data Integrity

- The reassignment dialog clearly states that student loads, evaluation records, and migrated source data are not rewritten.
- Stale assignment submissions are rejected by the backend and surfaced through the existing error notification flow.

## [0.1.0] - 2026-07-08

### Added

- Added an in-app patch notification that shows the latest frontend changelog once per release version.
- Added admin faculty campus filtering using backend `legacyDatabase` values with user-facing campus labels.
- Added faculty workload UI integration for listing, saving, class options, coverage, and workload-by-ID editing.
- Added audit-log UI route and service integration.
- Added frontend changelog for coordinated releases with the backend.

### Changed

- Improved the in-app patch notification copy and layout so release notes are easier for users to understand.
- Faculty list uses backend-owned filtering and excludes `FOR_MIGRATION` records through the backend response.
- Faculty workload Edit now fetches the latest record from the backend before filling the form.
- Removed unused frontend calls to unsupported student summary/list/distribution endpoints.

### Notes

- The backend integration contract is tracked in `C:\Users\jkmor\Documents\git\fes\docs\FRONTEND_BACKEND_INTEGRATION.md`.
- The coordinated version-control guide is tracked in `C:\Users\jkmor\Documents\git\fes\docs\VERSION_CONTROL.md`.
