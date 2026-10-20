# Architecture

## 1. Architectural direction
Start with a modular monolith unless scale or team structure provides a demonstrated reason to split services. It is simpler to deploy, test, and operate while preserving clear domain boundaries.

## 2. Logical modules
- Identity: authentication, sessions, recovery.
- Workspaces: companies, memberships, invitations, settings.
- Authorization: roles, permissions, policy checks.
- Teams: team membership and management scope.
- Targets: target creation, assignment, versioning, effective dates.
- Sales entries: daily actuals, validation, edit rules.
- Analytics: target attainment, gaps, aggregates, leaderboards.
- Audit: immutable record of sensitive actions.
- Notifications (later): reminders for missing submissions and target changes.

## 3. Stack selection
The coding agent must inspect the existing repository before selecting or replacing a stack. If the repository is empty, propose one coherent stack and explain the trade-offs before implementing.

Reasonable example stack:
- Frontend: TypeScript + React + a maintained routing solution.
- Backend: TypeScript + Node.js framework with schema validation.
- Database: PostgreSQL.
- ORM/query layer: a maintained typed ORM or query builder.
- Authentication: secure, maintained library/provider; do not implement cryptography from scratch.
- UI: accessible component primitives and a small design-token layer.
- Testing: unit, integration, and browser-level tests.
- Deployment: environment-driven configuration, managed database, automated migrations.

Do not introduce microservices, Kafka, Redis, or event sourcing solely to appear production-grade. Add infrastructure only for a concrete requirement.

## 4. Data and transaction boundaries
- Persist source records; compute dashboard aggregates from a consistent query or cache with explicit invalidation.
- Sales entry create/update and its audit event should be transactionally consistent.
- Target version changes must preserve effective dates and attribution.
- Use database constraints for invariants where possible, not only frontend validation.
- Store timestamps in UTC; store the workspace's IANA timezone separately for business-date interpretation.
- Use decimal/numeric types for money, not binary floating point.
- Define indexes from real query patterns; document each non-obvious index.

## 5. Request flow
1. Authenticate the user.
2. Resolve the active workspace membership.
3. Authorize the requested action and record scope.
4. Validate input schema.
5. Execute a transaction for writes.
6. Write audit event for sensitive mutations.
7. Return a stable response shape.
8. Log request correlation ID and safe operational metadata, excluding secrets and unnecessary personal data.

## 6. Reliability and operations
- Structured logs with request/correlation IDs.
- Centralized error handling and stable error codes.
- Health/readiness endpoints without leaking sensitive configuration.
- Database migrations and a repeatable seed process.
- Backups and a tested restoration procedure before production.
- Rate limiting on authentication and other abuse-prone endpoints.
- Monitoring for error rates, latency, and failed jobs.
- Secrets only in environment/secret management; never commit `.env`.
- CI should run formatting, linting, type checks, tests, and build.

## 7. Security principles
- Deny by default.
- Enforce tenant scope server-side and, where appropriate, with database row-level security.
- Never trust `companyId`, `role`, `userId`, target amount, or computed totals supplied by the client without authorization and validation.
- Avoid logging tokens, passwords, or sensitive payloads.
- Protect against CSRF if using cookie-based authentication; use secure, HttpOnly, SameSite cookies.
- Validate origin/CORS configuration; do not use unrestricted production CORS.
- Use dependency scanning and keep packages updated.

## 8. Scalability path
First optimize indexed queries and pagination. Then measure bottlenecks. Consider caching or background jobs only when metrics justify them. Keep analytics queries isolated behind a service/repository boundary so they can later be optimized without changing UI contracts.
