# Production-Grade Build Prompt for Codex / Antigravity

You are acting as a senior full-stack engineer and pragmatic software architect. Build a production-minded, multi-tenant sales target tracking application. Work incrementally, inspect the repository first, and treat the Markdown documentation in this directory as the product and architecture baseline.

## Product
Companies use the application to assign sales targets, record daily sales, and monitor performance. Each company has an isolated workspace and its own members, teams, targets, sales entries, metrics, and reports. The product is a lightweight sales performance system; do not build a complete contacts/deals CRM unless explicitly requested.

## First task: inspect and plan
1. Inspect the repository structure, package manifests, existing components, database schema, tests, and deployment configuration.
2. Read `README.md`, `PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `AUTHORIZATION_AND_SECURITY.md`, `DESIGN_SYSTEM.md`, `API_CONTRACT.md`, `DECISION_LOG.md`, and `IMPLEMENTATION_PLAN.md`.
3. Identify existing work that should be preserved.
4. List important unknowns and make safe, reversible assumptions where possible.
5. Propose the stack only if the repository does not already establish one. Explain trade-offs briefly.
6. Produce a phased plan and map the intended files before large code changes.
7. Do not stop after producing a plan: after the plan, implement the first vertical slice unless a truly blocking product decision requires clarification.

## Product requirements
- Multi-tenant company workspaces.
- Roles: platform operator, company admin, team manager if enabled, sales representative.
- Server-enforced role and resource-level permissions.
- Admins can invite/manage members, teams, metrics, and targets within their own company.
- Target scopes can include company, team, and individual.
- Sales reps can view their own assigned target and submit daily sales.
- Self-assigned targets are disabled unless an explicit permission enables them.
- Dashboards show actual, target, attainment, gap, and recent trends.
- Admins can compare representatives and see missing daily submissions.
- Reporting filters must be authorized and consistent.
- Important changes to targets, sales entries, roles, and memberships must be auditable.
- Responsive, minimalist UI with accessible forms, tables, filters, and charts.
- Keep full CRM pipeline features out of MVP.

## Non-negotiable engineering requirements
- Never trust the frontend for authorization.
- Never trust client-supplied company ID, actor ID, role, target amount, or computed KPI.
- Prevent cross-tenant access for list, read, create, update, delete/archive, search, exports, analytics, and background tasks.
- Use server-side schema validation and database constraints.
- Use transactions for writes that require consistent records and audit events.
- Handle duplicate daily entries deterministically with a database uniqueness constraint or documented alternative.
- Use decimal-safe types for monetary values.
- Define company timezone and business-date behavior.
- Preserve historical target meaning using versions/effective dates or another documented policy.
- Do not silently aggregate incompatible metrics or currencies.
- Use secure authentication and session practices from a maintained solution.
- Do not store secrets in source control or log credentials/tokens.
- Use stable error responses, structured logs, and request IDs.
- Add tests for authorization boundaries, target calculations, period boundaries, and concurrent/duplicate writes.
- Avoid needless complexity: no microservices, message broker, cache, or event sourcing without a demonstrated need.

## UI direction
Use Pipedrive as a functional reference for sales goals, HubSpot for reporting hierarchy, Zoho for target meters, and Attio for visual restraint. These are references for interaction patterns only; do not copy their branded assets or exact screens.

Design principles:
- Calm, modern, minimal interface.
- Clear navigation, whitespace, restrained color, and consistent typography.
- Daily sales entry should be reachable in one click and usable on mobile.
- Admin dashboard: company actual vs target, attainment, gap, representative leaderboard, and submission coverage.
- Representative dashboard: assigned target, actual, attainment, gap, and entry history.
- Include loading, empty, error, success, validation, and permission-denied states.
- Use accessible labels, keyboard focus, sufficient contrast, and table alternatives for charts.
- Avoid decorative charts and excessive cards.

## Domain decisions
Before implementing target calculations, document:
- Meaning and unit of each sales metric.
- Whether returns/cancellations are included.
- Target period and effective-date behavior.
- Target precedence if company, team, and user targets overlap.
- Whether company targets are distributed totals or independent objectives.
- Entry edit/approval rules.
- Company timezone and date boundaries.
- Currency and numeric precision.

If these are unknown, choose a conservative assumption, document it in `DECISION_LOG.md`, isolate the rule in domain code, and flag it for confirmation. Do not scatter assumptions throughout UI and database code.

## Execution protocol
Work in small, reviewable phases:
1. Repository assessment and plan.
2. Foundation and tenant-safe authentication.
3. Data model and domain calculations.
4. Daily sales entry vertical slice.
5. Target management and role-based UI.
6. Dashboards and reports.
7. Hardening, testing, and deployment docs.

For each phase:
- State the intended change.
- Implement complete vertical slices, not disconnected mock screens.
- Run formatter, linter, type checker, tests, and build where configured.
- Fix failures caused by your changes.
- Summarize files changed, behavior added, commands run, test results, and known gaps.
- Update relevant Markdown docs and `DECISION_LOG.md`.
- Do not claim a test passed unless you actually ran it.
- Do not replace working infrastructure or rewrite unrelated modules without explaining why.
- Use realistic seed/demo data, clearly separated from production data.
- Avoid shipping fake buttons, placeholder API calls, or dashboards with hardcoded metrics presented as real data.

## Deliverables
- Working frontend and backend connected to a persistent database.
- Versioned schema migrations and a safe seed command.
- Authentication and tenant-safe authorization.
- Daily sales entry and target management workflows.
- Admin and representative dashboards backed by real queries.
- Tests for domain calculations, API behavior, and security boundaries.
- Environment variable example with no real secrets.
- Local setup, test, migration, and deployment instructions.
- Updated product requirements, architecture, data model, API contract, design system, implementation plan, and decision log.

Start by inspecting the repository and reading the documentation. Then report your concise plan and implement the first complete vertical slice.
