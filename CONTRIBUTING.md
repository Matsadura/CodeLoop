# Contributing to CodeLoop

Thanks for helping! This guide covers the workflow and the checks your pull request must pass.

## Setup

Follow the [Quick start](README.md#quick-start-docker) (Docker) or [Running without Docker](README.md#running-without-docker) in the README. Judge0 is needed only if you work on code execution.

## Workflow

1. Create a branch from `master`, e.g. `feature/task-tags` or `fix/login-redirect`.
2. Keep changes focused, and include tests for any behaviour you add or fix.
3. Run the checks below locally.
4. Open a pull request using the template. CI must be green before merging.

## Checks

```bash
# API
cd server && . .venv/bin/activate
flake8
python -m pytest -q

# Frontend
cd client
npm run lint      # zero warnings allowed
npm test
npm run build
```

## Conventions

- **Python:** PEP 8 (enforced by flake8, 79 columns) with docstrings on modules, classes and routes. Validate request input with the helpers in `server/api/validation.py` and accept only explicitly listed fields. Return errors as `{"error": ...}` with the correct status code, and never echo exceptions or SQL to clients.
- **Authorization:** each route must check ownership (see `get_owned_task` / `get_owned_submission`). Add a test showing that another user is rejected.
- **Database changes:** edit the models, then generate a migration with `alembic revision --autogenerate -m "..."` inside `server/` and review it. `python -m pytest tests/test_migrations.py` fails if the migrations and the models differ.
- **JavaScript/React:** single quotes, function components and hooks. Call the API through `requestJson` / `request` from `src/tools/requestModule.jsx`, which handle errors and session expiry, and show loading and error states with `PageStatus` / `FormMessage`.
- **Secrets:** never commit `.env` files or real credentials; update the matching `*.example` file instead.
- **Commits:** short imperative subject lines, optionally prefixed with `feat:`, `fix:`, `docs:`, `ci:` or `build:`.
