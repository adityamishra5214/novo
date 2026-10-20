# Implementation Plan

## Phase 0 — Repository and requirements
- Inspect repository, package manifests, existing conventions, and deployment files.
- Identify missing product decisions and state assumptions explicitly.
- Update this document and `DECISION_LOG.md` before making irreversible choices.
- Produce a short implementation plan and file map.

**Exit criteria:** stack and assumptions are documented; no unexplained wholesale rewrite.

## Phase 1 — Foundation
- Configure app structure, environment validation, linting, formatting, type checking, and tests.
- Configure database, migrations, seed data, and error handling.
- Implement authentication and workspace membership.
- Implement tenant-scoped authorization primitives.

**Exit criteria:** tests prove a member of one company cannot access another company's records.

## Phase 2 — Core domain
- Implement metrics, targets, and daily sales entries.
- Add database constraints and transaction-safe writes.
- Add audit events for sensitive changes.
- Implement target resolution and attainment calculations as tested domain functions.

**Exit criteria:** edge cases for period boundaries, duplicates, edits, and target versioning are tested.

## Phase 3 — User workflows
- Representative dashboard and daily-entry form.
- Admin dashboard, member management, target management.
- Filtering, pagination, empty/loading/error states.
- Responsive layouts and accessibility review.

**Exit criteria:** the primary daily-entry journey works end to end on desktop and mobile.

## Phase 4 — Reporting
- Company/representative aggregates.
- Date range and metric filters.
- Reconciliation tests comparing aggregate results to source entries.
- CSV export only if authorized and included in MVP.

**Exit criteria:** report totals reconcile and exports enforce tenant scope.

## Phase 5 — Hardening and release
- Integration and browser tests.
- Security review and dependency audit.
- Rate limiting, logging, health checks, backup/restore procedure.
- CI checks, staging deployment, production configuration, migration runbook.
- Update README, API contract, data model, and decision log to match reality.

**Exit criteria:** reproducible deployment, no known critical authorization defects, and documented rollback/recovery process.

## Definition of done for every feature
- Acceptance criteria are met.
- Server-side validation and authorization exist.
- Loading, empty, error, and success states are handled.
- Tests cover normal behavior and relevant edge cases.
- No secrets or production data are committed.
- Documentation reflects actual behavior.
- No unrelated code or architecture changes are bundled in.
