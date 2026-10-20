# API Contract (Proposed)

Use `/api/v1` as the versioned prefix unless the repository already has a consistent convention. This is a proposed surface; adapt to the chosen framework and document the final contract.

## Conventions
- JSON request and response bodies.
- Validate all input against shared schemas.
- Stable error format: `{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message", "requestId": "..." } }`.
- Paginate list endpoints.
- Use ISO 8601 timestamps for instants and `YYYY-MM-DD` for business dates.
- Use decimal-safe serialization for currency/financial values; document whether numeric values are strings.
- Derive actor identity and authorized company scope from the authenticated context.

## Authentication and workspace
- `GET /api/v1/me`
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces` (if self-service workspace creation is in scope)
- `POST /api/v1/workspaces/:workspaceId/invitations`
- `POST /api/v1/invitations/accept`

## Team and members
- `GET /api/v1/workspaces/:workspaceId/members`
- `PATCH /api/v1/workspaces/:workspaceId/members/:membershipId`
- `POST /api/v1/workspaces/:workspaceId/teams`
- `GET /api/v1/workspaces/:workspaceId/teams`
- `PATCH /api/v1/workspaces/:workspaceId/teams/:teamId`

## Metrics and targets
- `GET /api/v1/workspaces/:workspaceId/metrics`
- `POST /api/v1/workspaces/:workspaceId/metrics`
- `GET /api/v1/workspaces/:workspaceId/targets`
- `POST /api/v1/workspaces/:workspaceId/targets`
- `GET /api/v1/workspaces/:workspaceId/targets/:targetId`
- `PATCH /api/v1/workspaces/:workspaceId/targets/:targetId`
- `POST /api/v1/workspaces/:workspaceId/targets/:targetId/archive`

## Sales entries
- `GET /api/v1/workspaces/:workspaceId/sales-entries?from=YYYY-MM-DD&to=YYYY-MM-DD&metricId=...&membershipId=...`
- `POST /api/v1/workspaces/:workspaceId/sales-entries`
- `GET /api/v1/workspaces/:workspaceId/sales-entries/:entryId`
- `PATCH /api/v1/workspaces/:workspaceId/sales-entries/:entryId`
- Prefer void/archive over hard delete if auditability is required.

## Analytics
- `GET /api/v1/workspaces/:workspaceId/analytics/overview?from=...&to=...`
- `GET /api/v1/workspaces/:workspaceId/analytics/representatives?from=...&to=...`
- `GET /api/v1/workspaces/:workspaceId/analytics/submission-coverage?date=...`
- All analytics endpoints must apply the same authorization and tenant constraints as record endpoints.

## Audit
- `GET /api/v1/workspaces/:workspaceId/audit-events` (restricted; paginated and filtered)

## Error codes
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## API requirements
- Avoid leaking whether a cross-tenant record exists; return a consistent not-found/forbidden policy.
- Use transactions for multi-record mutations.
- Add idempotency keys where retrying a write could create duplicate effects.
- Document sorting, filtering, pagination, and maximum page size.
- Generate an OpenAPI specification if supported by the selected stack.
- Keep API authorization tests alongside route/service tests.
