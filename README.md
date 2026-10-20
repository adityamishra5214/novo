# Vantage — Sales Target Tracking Platform

Production-grade, multi-tenant sales target tracking and performance platform.

## Purpose
Track daily sales against assigned quotas across multiple companies, with server-enforced role-based access, interactive company executive dashboards, sales representative portals, and an immutable audit trail.

---

## Repository Structure

```
sales-target-platform-docs/
├── docs/                               # Architecture & Domain Specifications
│   ├── API_CONTRACT.md                 # REST API conventions and error schema
│   ├── ARCHITECTURE.md                 # Modular monolith architecture & boundaries
│   ├── AUTHORIZATION_AND_SECURITY.md   # Multi-tenant isolation & RBAC matrix
│   ├── CODEX_BUILD_PROMPT.md           # Engineering baseline and build guidelines
│   ├── DATA_MODEL.md                   # Relational schema and entity invariants
│   ├── DECISION_LOG.md                 # Architecture Decision Records (ADR-001 - ADR-007)
│   ├── DESIGN_SYSTEM.md                # UI tokens, typography, and accessibility rules
│   ├── IMPLEMENTATION_PLAN.md          # Phased delivery roadmap and exit criteria
│   └── PRODUCT_REQUIREMENTS.md         # MVP scope, personas, and acceptance criteria
├── src/
│   ├── server/                         # Backend (Node.js 24 + Express + TypeScript)
│   │   ├── index.ts                    # Server entry, routing, and static file serving
│   │   ├── db/
│   │   │   ├── client.ts               # SQLite client with WAL mode and transactions
│   │   │   ├── migrations.ts           # Versioned schema migrations
│   │   │   └── seed.ts                 # Realistic seed data (Acme Corp & Beta Dynamics)
│   │   ├── domain/
│   │   │   ├── calculations.ts         # Attainment, pacing, buffer, and projection algorithms
│   │   │   └── targetResolver.ts       # Hierarchical target resolution (User > Team > Company)
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # Multi-tenant context and session resolution
│   │   │   ├── authorize.ts            # RBAC guards and audit logging
│   │   │   └── errorHandler.ts         # RFC-standard error response handler
│   │   └── routes/                     # API routers (auth, workspaces, targets, sales, analytics, audit)
│   ├── client/                         # Frontend (React 19 + TypeScript + Vite)
│   │   ├── index.css                   # Vantage design system & CSS variables
│   │   ├── types.ts                    # Strongly typed API responses and entities
│   │   ├── api.ts                      # Client API service with persona switcher headers
│   │   ├── components/                 # Reusable UI components (Sidebar, Navbar, Modals)
│   │   └── pages/                      # Primary pages (ExecutiveOverview, SalesRepPortal, Team, Targets, Audit)
│   └── tests/                          # Automated Test Suite (Vitest + Supertest)
│       ├── calculations.test.ts        # Unit tests for domain calculations & edge cases
│       ├── security.test.ts            # Multi-tenant isolation & IDOR prevention tests
│       └── sales.test.ts               # Daily deal logging & transaction workflow tests
├── .env.example                        # Safe environment variable template
├── .gitignore                          # Excludes node_modules, build artifacts, sqlite files, env secrets
├── package.json                        # Dependencies, scripts, and build configuration
├── tsconfig.json                       # TypeScript compiler options
└── vite.config.ts                      # Vite build and proxy configuration
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v20 or later (v24 LTS recommended)
- **npm**: v10 or later

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Running the Application

- **Production / Full-Stack Server** (Runs API + built frontend on port 3001):
  ```bash
  npm run build
  npm start
  ```
  Open [http://localhost:3001](http://localhost:3001) in your browser.

- **Vite Development Server** (with HMR):
  ```bash
  npm run dev
  ```

### 5. Running Automated Tests
```bash
npm test
```
Runs the 14 automated tests covering domain calculations, multi-tenant security boundaries, IDOR prevention, and sales entry workflows.

### 6. Seeding Demo Data
To re-seed the SQLite database with the demo workspaces (Acme Corp and Beta Dynamics):
```bash
npm run db:seed
```

---

## Documentation Index
- [Product Requirements](docs/PRODUCT_REQUIREMENTS.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Data Model & Entities](docs/DATA_MODEL.md)
- [Authorization & Security Matrix](docs/AUTHORIZATION_AND_SECURITY.md)
- [API Contract](docs/API_CONTRACT.md)
- [Design System & UI Tokens](docs/DESIGN_SYSTEM.md)
- [Architecture Decision Log](docs/DECISION_LOG.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Codex Build Prompt](docs/CODEX_BUILD_PROMPT.md)
