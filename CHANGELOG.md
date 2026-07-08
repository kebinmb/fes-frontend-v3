# Changelog

All notable frontend changes should be documented in this file.

This project follows a simple semantic versioning style:

- `MAJOR` for breaking route, auth, or API-contract changes.
- `MINOR` for new backward-compatible screens or features.
- `PATCH` for bug fixes, optimizations, and documentation.

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
