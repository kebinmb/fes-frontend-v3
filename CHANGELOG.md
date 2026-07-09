# Changelog

All notable frontend changes should be documented in this file.

This project follows a simple semantic versioning style:

- `MAJOR` for breaking route, auth, or API-contract changes.
- `MINOR` for new backward-compatible screens or features.
- `PATCH` for bug fixes, optimizations, and documentation.

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
