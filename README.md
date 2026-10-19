# Sales Target Tracking Platform

Documentation starter kit for a multi-tenant sales performance application.

## Purpose
Track daily sales against assigned targets across multiple companies, with role-based access, company dashboards, and an auditable history.

## Documents
- `PRODUCT_REQUIREMENTS.md` — scope, user journeys, MVP acceptance criteria.
- `ARCHITECTURE.md` — recommended system boundaries and technical principles.
- `DATA_MODEL.md` — initial entities, relationships, and data invariants.
- `AUTHORIZATION_AND_SECURITY.md` — tenant isolation, roles, permissions, audit requirements.
- `DESIGN_SYSTEM.md` — UI principles, navigation, and interaction rules.
- `API_CONTRACT.md` — suggested REST API surface and response conventions.
- `DECISION_LOG.md` — ADR template and initial decisions.
- `IMPLEMENTATION_PLAN.md` — phased delivery and definition of done.
- `CODEX_BUILD_PROMPT.md` — copy/paste instruction for a coding agent.

## How to use
1. Review and adjust the assumptions in `PRODUCT_REQUIREMENTS.md`.
2. Choose the final stack based on the existing repository and deployment constraints.
3. Give the agent `CODEX_BUILD_PROMPT.md` and ask it to read all the other documents before editing code.
4. Require the agent to update these documents when implementation decisions change.
5. Keep decisions in `DECISION_LOG.md`; do not rely on chat history as the only record.

## Initial product assumptions
- Multi-tenant SaaS: each company has a separate workspace.
- Roles: platform operator, company admin, manager (optional for MVP), sales representative.
- A daily sales record is scoped to a company, a representative, a business date, and a defined sales metric.
- Targets have a period, owner/scope, metric, and effective dates.
- Admins can assign targets; representatives can self-enter targets only if explicitly permitted.
- The initial product tracks sales performance; a full contacts/deals CRM is not part of the first MVP.

## Design references
- Pipedrive sales dashboard: https://www.pipedrive.com/en/features/sales-dashboard
- Pipedrive goals and permissions: https://support.pipedrive.com/en/article/insights-goals?category=progress
- HubSpot sales reporting: https://www.hubspot.com/products/sales/sales-reports
- HubSpot goal progress reports: https://knowledge.hubspot.com/goals/create-goal-progress-reports
- Zoho CRM target meters: https://www.zoho.com/crm/target-meters.html
- Salesforce sales-target analytics learning module: https://trailhead.salesforce.com/content/learn/modules/crm-analytics-dashboards-for-account-manager-targets/explore-sales-targets
- Attio: https://attio.com/

Use these products as pattern references, not as permission to copy their proprietary UI or assets.
