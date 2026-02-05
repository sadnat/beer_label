# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beer Label Editor — a full-stack React/TypeScript application for designing beer bottle and can labels. Fabric.js handles canvas editing, jsPDF generates high-resolution PDF exports, Express.js backend with PostgreSQL provides auth and project storage. **All UI text is in French.**

## Development Commands

### Frontend
```bash
npm run dev          # Vite dev server on port 5173
npm run build        # tsc + Vite production build
npm run lint         # ESLint
```

### Backend
```bash
cd backend
npm run dev          # ts-node-dev with hot reload (port 3000)
npm run build        # TypeScript compilation to dist/
npm run typecheck    # Type check without emitting
```

### Testing

**Frontend (Vitest + React Testing Library):**
```bash
npm run test                 # Interactive watch mode
npm run test:run             # Single run (CI)
npm run test:coverage        # With v8 coverage report
npm run test:ui              # Vitest browser UI
```

**Backend (Jest + Supertest):**
```bash
cd backend
npm run test                 # Unit tests only (excludes integration)
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage report
npm run test:integration     # Integration tests only
npm run test:all             # Unit + integration tests
```

**E2E (Playwright):**
```bash
npm run test:e2e             # Headless against http://localhost:8080
npm run test:e2e:headed      # With browser visible
npm run test:e2e:ui          # Playwright UI mode
```

**Docker-based tests (isolated with test DB):**
```bash
npm run test:docker                # All tests
npm run test:docker:backend        # Backend only
npm run test:docker:frontend       # Frontend only
npm run test:docker:down           # Cleanup
```

Coverage threshold is 70% (statements, branches, functions, lines) for both frontend and backend.

### Docker Deployment
```bash
docker compose up -d --build       # Build and start all services
docker compose logs -f api         # API logs
docker compose restart api         # Restart API after changes
docker compose exec postgres psql -U beer_label -d beer_label_db  # DB shell
```

Note: Use `docker compose` (V2, no hyphen).

## Architecture

### System Layout
```
Docker Compose
├── PostgreSQL :5432
├── API (Express) :3000
└── Frontend (Nginx) :80  →  /api/* proxied to API
```

In development, frontend runs on Vite (:5173) and backend on Express (:3000) separately — there is no dev proxy configured in Vite, so the frontend API client uses a configurable `API_BASE_URL`.

### Key Architectural Patterns

**Canvas system:** The `useCanvas` hook (`src/hooks/useCanvas.ts`) wraps Fabric.js and exposes all canvas operations via a ref (`canvasActionsRef`). The Editor page and sidebar panels call methods on this ref — never manipulate the Fabric canvas directly. The hook manages undo/redo history (max 50 states) and auto-save (30s inactivity trigger).

**Two JSON loading paths:** `loadFromJSON` scales template content to fit the current format dimensions. `loadFromJSONRaw` loads saved projects as-is without scaling. Using the wrong one will produce incorrectly sized labels.

**Auth flow:** `AuthContext` manages JWT tokens in localStorage. `ProtectedRoute` wraps authenticated pages. The API client (`src/services/api.ts`) automatically attaches the token to requests and handles 401 responses.

**Backend layering:** Routes → Controllers → Services → Database (pg pool). Each layer has its own directory. The auth middleware (`backend/src/middleware/auth.ts`) provides both `authenticateToken` and `requireAdmin` middleware.

**Export pipeline:** Canvas renders at 4x resolution multiplier for print quality. `MultiLabelExport` component handles laying out multiple labels on an A4 sheet for printing.

### Database

PostgreSQL 16 with tables: `users`, `projects`, `plans`, `subscriptions`, `audit_log`. Migrations live in `backend/migrations/` (001–003). Projects store canvas state as TEXT (`canvas_json`) and beer-specific data as JSONB (`beer_data`). Thumbnails are base64 in the DB. User deletion cascades to projects.

### Test Structure

Frontend tests: `src/**/__tests__/*.test.ts(x)` — mocks are in `src/test/setup.ts` (localStorage, fetch, Canvas API, ResizeObserver, IntersectionObserver).

Backend tests: `backend/src/**/__tests__/*.test.ts` — database mocking via `backend/src/test/mocks/database.ts`, test helpers in `backend/src/test/helpers.ts`. Integration tests use `*.integration.test.ts` pattern and are excluded from the default `npm test` run.

E2E tests: `e2e/user-journey.spec.ts` — runs against `http://localhost:8080` (set `BASE_URL` env to override).

## Environment Configuration

Root `.env` file with: `DB_PASSWORD`, `JWT_SECRET`, and optionally SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`), `APP_URL`, `ADMIN_EMAIL`. Without SMTP, users auto-verify on registration. The `ADMIN_EMAIL` user gets admin role on registration.

## Important Conventions

- Path alias: `@/*` → `src/*` (configured in both vite.config.ts and tsconfig.json)
- Frontend: React 18, React Router 6, Fabric.js 6.5, Tailwind CSS 3.4, Vite 6
- Backend: Express 4.18, CommonJS modules, pg for PostgreSQL, Jest for tests
- Frontend uses ES modules; backend uses CommonJS
- Custom Tailwind colors: `beer-light`, `beer-amber`, `beer-dark`, `beer-foam`
- Admin routes require `role = 'admin'` — admin panel is at `/admin/*`
