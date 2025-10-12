# Repository Guidelines

## Project Structure & Module Organization
Backend code lives in `backend/`, a Django 4.2 project with apps under `backend/apps/*` and project settings in `backend/project/settings.py`. Persistent assets such as collected static files sit in `backend/static_root`, while reusable templates are in `backend/templates`. The customer-facing Next.js frontend is in `frontend_new/`, with application routes inside `src/app`, shared UI in `src/components`, and API helpers in `src/lib`. Docker orchestration lives at the repository root through `docker-compose.yml` for local Postgres and the Django server, and `docker-compose.frontend.yml` for previewing the new frontend.

## Build, Test, and Development Commands
Set up the backend with `pip install -r backend/requirements.txt` and run migrations via `python manage.py migrate` from `backend/`. Start the local stack with `docker-compose up --build` to boot Django on :8000 alongside Postgres. For quick development, `python manage.py runserver` works once environment variables in `backend/.env` are populated. The frontend uses Node 20+: run `npm install` inside `frontend_new/`, then `npm run dev` for hot reload, `npm run build` for production verification, and `npm run lint` before committing.

## Coding Style & Naming Conventions
Python modules follow PEP 8: 4-space indentation, snake_case for functions, and PascalCase for Django models. Group imports stdlib → third-party → local, leaving a blank line between blocks. In TypeScript, keep components in PascalCase files (e.g., `ProductGallery.tsx`) and colocate one default export per file. Tailwind utility classes should remain ordered from layout → spacing → color to preserve readability. Commit generated assets (e.g., `static_root/`) only when required for deployment.

## Testing Guidelines
Django tests reside under each app’s `tests` package (e.g., `backend/apps/product/tests`). Execute the full backend suite with `python manage.py test`; target critical paths (catalogue, orders, integrations) before merging. Frontend tests are not yet scaffolded—create colocated Jest/Vitest suites under `src/**/__tests__` and ensure new utilities ship with assertions. Aim for end-to-end coverage of customer journeys once API wiring lands.

## Commit & Pull Request Guidelines
Keep commits small and action-led, mirroring the existing history (`Bug fix`, `Order success`). Reference ticket IDs when available and prefer the imperative mood. Pull requests should outline scope, confirm backend/frontend checks, and attach screenshots or terminal output for UI or CLI changes. Link to related docs such as `frontend_new/BACKEND_INTEGRATION.md` when relevant so reviewers can trace context. EOF
