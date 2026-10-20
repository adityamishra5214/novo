# Data Model

This is a starting model, not a substitute for validating business rules.

## Core entities
### User
- `id`
- `email` (normalized; unique according to account policy)
- `display_name`
- `auth_provider_subject` or password hash managed by a trusted auth layer
- `status`
- `created_at`, `updated_at`

### Company
- `id`
- `name`
- `slug`
- `timezone` (IANA identifier)
- `status`
- `created_at`, `updated_at`

### Membership
- `id`
- `company_id`
- `user_id`
- `role` or role assignment relation
- `status`
- `joined_at`
- Unique constraint on active membership identity as defined by product policy.

### Team
- `id`
- `company_id`
- `name`
- `status`

### TeamMembership
- `team_id`
- `membership_id`
- `effective_from`, `effective_to` (if historical team assignment matters)

### SalesMetric
- `id`
- `company_id`
- `name`
- `unit` (e.g. INR, orders, units)
- `value_type` and precision policy
- `allows_negative`
- `status`

### Target
- `id`
- `company_id`
- `metric_id`
- `scope_type` (`company`, `team`, `user`)
- `scope_id`
- `period_type` (`day`, `week`, `month`, `quarter`, `custom`)
- `period_start`, `period_end`
- `target_value` using a suitable decimal/numeric type
- `effective_from`, `effective_to`
- `created_by_membership_id`
- `status`, `created_at`, `updated_at`
- `version` or a separate immutable target-version table.

### DailySalesEntry
- `id`
- `company_id`
- `membership_id`
- `metric_id`
- `business_date` (date, interpreted in company timezone)
- `actual_value`
- `note` (optional and length-limited)
- `status` (e.g. submitted, approved, rejected if approval is in scope)
- `created_at`, `updated_at`
- `created_by_membership_id`, `updated_by_membership_id`
- A uniqueness constraint based on the agreed granularity, commonly `(company_id, membership_id, metric_id, business_date)` for one record per metric/day.

### AuditEvent
- `id`
- `company_id` (nullable only for legitimate platform-level events)
- `actor_user_id` or membership reference
- `action`
- `entity_type`, `entity_id`
- `occurred_at`
- `request_id`
- `before` / `after` snapshots or safe change summary
- Avoid storing secrets or excessive personal data in snapshots.

### Invitation (if invite workflow is in MVP)
- `id`, `company_id`, `email`, `role`, `token_hash`, `expires_at`, `accepted_at`, `created_by`, `created_at`
- Store a hash of a high-entropy invitation token, not the raw token.

## Relationships
- User has memberships in companies.
- Company owns teams, metrics, targets, entries, and company-scoped audit events.
- Membership links a user to one company and defines their company role.
- Targets refer to one metric and a company/team/user scope.
- Sales entries refer to one membership and one metric.

## Invariants
- Every company-scoped record must reference a company.
- Every referenced membership, team, metric, and target scope must belong to the same company.
- Actual values and target values use consistent units and numeric precision.
- A report must never sum different metrics or incompatible currencies.
- Effective-date overlaps for targets must be either prohibited or resolved by a documented precedence rule.
- Use database constraints/transactions for concurrency-sensitive rules.
- Define deletion policy explicitly; prefer deactivation/archiving over hard deletion for business records.

## Target resolution
Before coding, define the exact rule for choosing a target when multiple scopes exist. Possible precedence is individual > team > company, but this is a product decision, not an assumed universal rule. Document whether company targets are informational totals or distributed targets. Do not add team targets into company targets if that would double-count the same objective.
