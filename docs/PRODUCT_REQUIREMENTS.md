# Product Requirements

## 1. Product summary
A multi-company sales target tracking tool that lets sales representatives record daily performance and lets authorized managers compare actuals against targets.

## 2. Goals
- Make daily sales submission fast and low-friction.
- Show target attainment at representative, team, and company levels.
- Support controlled target assignment with role-based permissions.
- Preserve a reliable history of sales entries and target changes.
- Provide a foundation for future reports and integrations.

## 3. Non-goals for MVP
- Full lead/contact/deal pipeline CRM.
- Commission or payroll calculation.
- Forecasting powered by machine learning.
- Complex workflow builder.
- Public dashboards or anonymous sharing.
- Cross-company reporting for ordinary company users.

## 4. Personas
### Platform operator
Operates the SaaS platform and handles workspace-level administration. Access to customer business data should be minimized and audited.

### Company admin
Manages their company workspace, members, roles, targets, and company reports.

### Team manager (optional MVP)
Views and manages only assigned teams, subject to explicit permissions.

### Sales representative
Views personal targets and performance and creates or edits permitted daily entries.

## 5. Core journeys
1. Company admin creates/configures a workspace.
2. Admin invites a representative and assigns a role.
3. Admin creates a target with metric, amount, period, scope, and effective dates.
4. Representative signs in and sees assigned target and current progress.
5. Representative submits actual sales for a business date.
6. The app validates the entry, saves it, and recalculates affected summaries.
7. Admin filters performance by date range, team, representative, and metric.
8. Authorized user reviews audit history when an entry or target changes.

## 6. Functional requirements
### Identity and workspace
- Sign-in and sign-out; secure session/token lifecycle.
- Workspace membership is explicit.
- A user may belong to multiple workspaces only if the product deliberately supports it.
- Invite acceptance and account recovery must not disclose whether an email exists.
- Workspace context must be validated on every protected request.

### Daily sales entry
- Capture business date, metric, actual value, optional note, and source.
- Validate non-negative numeric values unless a metric explicitly permits negatives.
- Prevent accidental duplicate submissions for the same representative/date/metric when the business rule expects one entry.
- Support edit rules and preserve audit history.
- Use server-side timestamps and a clearly defined company timezone.
- Make loading, validation, empty, success, and failure states explicit.

### Targets
- Target has metric, amount, scope, period, effective dates, creator, and status.
- Scopes may include company, team, or individual.
- Define target precedence when company/team/individual targets coexist.
- Target edits must not silently rewrite historical reporting. Prefer versioned/effective-dated target records.
- Self-entered targets are disabled by default and enabled through a permission.
- Define whether targets are daily, weekly, monthly, quarterly, or custom-period. Avoid deriving daily targets by naïvely dividing monthly targets unless the policy explicitly says so.

### Dashboards and reports
- Personal dashboard: today's target, actual, attainment, gap, and recent history.
- Admin dashboard: company actual vs target, attainment, gap, submission coverage, and representative comparison.
- Date range, team, representative, and metric filters where authorized.
- Clearly label currency and unit; never aggregate incompatible metrics or currencies.
- Show the reporting period and data freshness.
- Empty states should explain how to get started.

### Administration
- Invite, deactivate, and manage members.
- Assign roles and team membership.
- Create, update, archive, and inspect targets.
- Company settings include display name, timezone, and supported sales metrics.
- Destructive actions require confirmation and should be auditable.

## 7. Key business rules to decide before launch
- What does “sales” mean: revenue, orders, units, or a configurable metric?
- Are entries net or gross of returns/cancellations?
- Can users enter historical dates?
- Can entries be edited after a cutoff?
- Do admins approve entries or are submissions immediately final?
- How do targets prorate for partial months, holidays, leave, or new hires?
- How should target changes affect past periods?
- What is the source of truth if sales data is imported later?
- Are amounts decimal, integer, or currency-specific?
- What timezone determines a business date?

## 8. MVP acceptance criteria
- A user cannot read or change another company's data by manipulating IDs or request payloads.
- Representatives can only view and edit their own permitted records.
- Company admins can manage members and targets only within their workspace.
- Target attainment and gaps are calculated consistently on the server.
- Duplicate submissions are handled deterministically.
- All important target and sales-entry mutations are auditable.
- Dashboard totals reconcile with the underlying records for the same filters.
- Forms have validation and accessible labels.
- Automated tests cover authorization boundaries and calculation edge cases.
- The application has setup, migration, seed, test, and deployment instructions.
