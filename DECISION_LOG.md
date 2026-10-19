# Architecture Decision Log

Record material decisions here. Keep entries short but specific enough that a future developer understands the context and consequences.

## Status values
- Proposed
- Accepted
- Superseded
- Rejected

## ADR template
### ADR-NNN: <short title>
- **Status:** Proposed
- **Date:** YYYY-MM-DD
- **Context:** What problem or constraint prompted this decision?
- **Decision:** What are we choosing?
- **Alternatives considered:** What else was evaluated?
- **Consequences:** Benefits, trade-offs, and follow-up work.
- **Validation:** How will we know this decision is working?

---

## ADR-001: Start with a modular monolith
- **Status:** Proposed
- **Context:** The MVP has a limited domain and needs fast iteration without distributed-system overhead.
- **Decision:** Keep the first implementation in one deployable application with clear module boundaries.
- **Alternatives considered:** Microservices, serverless functions split by domain.
- **Consequences:** Simpler deployment and transactions; modules must remain well-separated to support future extraction.

## ADR-002: Enforce tenant isolation on the server
- **Status:** Proposed
- **Context:** Multiple companies share the platform.
- **Decision:** Every company-scoped request must validate active membership and resource ownership on the server; consider database row-level security as defense in depth.
- **Alternatives considered:** Client-side filtering only.
- **Consequences:** Requires explicit authorization tests and careful analytics/export query design.

## ADR-003: Version targets or use effective dates
- **Status:** Proposed
- **Context:** Changing a target can otherwise alter historical achievement rates unexpectedly.
- **Decision:** Store target periods and effective dates or immutable target versions; define which version applies to each reporting date.
- **Alternatives considered:** Overwrite a single target value in place.
- **Consequences:** More deliberate target queries but reliable historical reporting.

## ADR-004: Keep daily sales tracking separate from full CRM pipeline
- **Status:** Proposed
- **Context:** The primary user problem is tracking actuals against targets.
- **Decision:** MVP includes sales entries, targets, users, teams, dashboards, and audit. Contacts/deals/pipeline are deferred.
- **Alternatives considered:** Build a full CRM from the beginning.
- **Consequences:** Smaller scope and faster validation; future CRM entities can be introduced as a separate phase.

## Decisions to resolve
- Final frontend/backend stack and hosting.
- Authentication provider and session model.
- Single workspace membership versus multi-workspace membership.
- Supported sales metric types and currencies.
- Target precedence and distribution rules.
- Sales entry approval/edit policy.
- Workspace timezone and period-boundary policy.
- Data retention, export, and deletion rules.
