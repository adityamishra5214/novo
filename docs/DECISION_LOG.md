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
- **Status:** Accepted
- **Context:** The MVP has a limited domain and needs fast iteration without distributed-system overhead.
- **Decision:** Keep the implementation in one cohesive TypeScript application with clear module boundaries (`src/server` and `src/client`).
- **Alternatives considered:** Microservices, serverless functions split by domain.
- **Consequences:** Simpler deployment and atomic transactions; modules remain well-separated behind service and repository layers.

## ADR-002: Enforce tenant isolation on the server
- **Status:** Accepted
- **Context:** Multiple companies share the platform.
- **Decision:** Every company-scoped request must validate active membership and resource ownership on the server in middleware; query repository explicitly scopes by `company_id`.
- **Alternatives considered:** Client-side filtering only.
- **Consequences:** Mandatory automated security tests prove IDOR/BOLA prevention.

## ADR-003: Version targets or use effective dates
- **Status:** Accepted
- **Context:** Changing a target can otherwise alter historical achievement rates unexpectedly.
- **Decision:** Store target periods, metric ID, and effective dates (`effective_from`, `effective_to`); analytics queries select the target version effective for the analyzed period.
- **Alternatives considered:** Overwrite a single target value in place.
- **Consequences:** Reliable historical reporting without retroactively skewing past performance.

## ADR-004: Keep daily sales tracking separate from full CRM pipeline
- **Status:** Accepted
- **Context:** The primary user problem is tracking actuals against targets.
- **Decision:** MVP includes sales entries, targets, users, teams, dashboards, and audit. Contacts/deals/pipeline CRM features are out of scope.
- **Alternatives considered:** Build a full CRM from the beginning.
- **Consequences:** High clarity, focused delivery, matches Vantage reference design.

## ADR-005: Full-Stack TypeScript Stack & SQLite DB Engine
- **Status:** Accepted
- **Date:** 2026-10-20
- **Context:** Need a fast, dependable, zero-headache local runtime on Windows without missing native binary dependencies or external database daemons, while supporting ACID transactions and strict constraints.
- **Decision:** Use Node 24 with native `node:sqlite` (foreign keys enabled, WAL mode), Express backend with Zod schema validation, and React 19 + Vite frontend.
- **Alternatives considered:** Postgres with Docker (fails if Docker/psql not installed), Prisma with binary engines.
- **Consequences:** Extremely fast cold-start, instant test suite runs, fully portable and zero external prerequisites.

## ADR-006: Financial Precision and Metric Definitions
- **Status:** Accepted
- **Date:** 2026-10-20
- **Context:** Financial values must avoid IEEE-754 floating point inaccuracies.
- **Decision:** Monetary values are handled as integer cents or scaled decimal numbers (2 decimal places for USD). Default primary metric is `New ARR / Revenue`. Supported deal categories: `New ARR`, `Expansion`, `Services`, `Renewal`.
- **Alternatives considered:** Floating point numbers.
- **Consequences:** Eliminates fractional cent drift in aggregations and reconciliations.

## ADR-007: Target Hierarchy and Daily Pacing Derivation
- **Status:** Accepted
- **Date:** 2026-10-20
- **Context:** Dashboards require daily benchmark pacing vs target and representative quotas.
- **Decision:** Monthly/Quarterly targets define a linear daily quota trajectory: `DailyBenchmark = TargetAmount / TotalBusinessDays`. Rep-specific quotas take precedence for individual attainment; company target reflects overall corporate quota ($1.60M target in reference).
- **Alternatives considered:** Arbitrary manual daily quota entry.
- **Consequences:** Clean 7-day output vs quota visualizations, predictable run-rate forecasting.

