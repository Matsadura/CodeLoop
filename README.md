# CodeLoop 🔄

![CodeLoop workspace](https://github.com/user-attachments/assets/3868c37e-9ce7-4e24-8b5f-e11ed98eaf98)

> A community-driven coding platform where everyone is both a student and an educator.

[![CI](https://github.com/Matsadura/CodeLoop/actions/workflows/ci.yml/badge.svg)](https://github.com/Matsadura/CodeLoop/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

CodeLoop lets users create coding challenges (a Markdown description plus input/expected-output test cases), group them into catalogs, and solve each other's challenges in a browser-based Monaco editor. Submissions are run in a [Judge0](https://judge0.com/) sandbox against every test case, and users see per-test results and track their progress per catalog.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick start (Docker)](#quick-start-docker)
- [Running without Docker](#running-without-docker)
- [Configuration](#configuration)
- [Database](#database)
- [Judge0 (code execution)](#judge0-code-execution)
- [Tests and quality checks](#tests-and-quality-checks)
- [Deployment](#deployment)
- [API overview](#api-overview)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)

## Features

- **Accounts:** registration and login with salted PBKDF2 password hashes and JWT access tokens. Expired sessions send the user back to the login page.
- **Catalogs:** themed groups of tasks with a difficulty level and a cover image.
- **Task authoring:** Markdown descriptions and any number of test cases (up to 50). Only a task's author can edit or delete it, or view its test cases.
- **In-browser editor:** a Monaco-based workspace with a split view on desktop and tabbed panels on mobile.
- **Graded submissions:** code runs against every test case in Judge0. Each test case is reported as pass, fail or error, with stdout, stderr and compiler output.
- **Favorites and progress:** like tasks, sort them by likes, and see your success rate per catalog on the dashboard.

## Architecture

```mermaid
flowchart LR
    B[Browser<br/>React + Vite SPA] -->|HTTPS /api| N[Nginx<br/>static files + reverse proxy]
    N -->|/api| A[Flask API<br/>Gunicorn]
    A -->|SQLAlchemy / PyMySQL| M[(MySQL 8)]
    A -->|HTTPS batch API<br/>timeouts + retries| J[Judge0 CE<br/>separate VM or hosted]
```

| Part | Location | Stack |
| --- | --- | --- |
| Frontend | [`client/`](client) | React 18, Vite 5, Tailwind CSS, React Router 6, Monaco Editor, Vitest |
| API | [`server/api/`](server/api) | Flask 3 app factory, Flask-JWT-Extended, Flask-CORS, Gunicorn |
| Data layer | [`server/models/`](server/models) | SQLAlchemy 2 models + `DBStorage` facade, Alembic migrations in [`server/migrations/`](server/migrations) |
| Code execution | [`server/api/judge0.py`](server/api/judge0.py), [`server/api/grading.py`](server/api/grading.py), [`judge0/`](judge0) | Judge0 CE 1.13.1 batch API |
| Orchestration | [`docker-compose.yml`](docker-compose.yml) (dev), [`docker-compose.prod.yml`](docker-compose.prod.yml) | Docker Compose |
| CI | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | GitHub Actions |

**How a submission is graded.** `POST /api/tasks/<id>/submit` stores the submission as `pending` and sends every test case to Judge0 in a single batch request. The API then waits for results for at most `JUDGE0_SYNC_WAIT` seconds:

- **201:** the submission was graded as `correct` or `incorrect`.
- **202:** Judge0 is still running. The client polls `GET /api/submissions/<id>`, and each poll fetches fresh results from Judge0.
- **503:** Judge0 could not be reached. The submission is kept with status `error` and a `status_detail` explaining why, and the user can resubmit.

Every Judge0 call has a request timeout and a bounded number of retries, so an API request can never hang forever.

## Quick start (Docker)

Requirements: Docker Engine 24+ with the Compose plugin.

```bash
git clone https://github.com/Matsadura/CodeLoop.git
cd CodeLoop
cp .env.example .env            # optional: dev defaults work out of the box
docker compose up --build
```

| Service | URL |
| --- | --- |
| Frontend (Vite, hot reload) | http://localhost:3000 |
| API | http://localhost:5000/api (health: http://localhost:5000/api/health) |
| MySQL | `127.0.0.1:3306` (dev only) |

The API container waits until MySQL is ready, applies migrations, and then starts the Flask development server with auto-reload.

**Create the first user and sample data.** Either register at http://localhost:3000/register, or seed a demo account with one catalog, one task and three test cases:

```bash
docker compose exec -e SEED_USER_PASSWORD='choose-a-password' api python manage.py seed
# log in as demo@codeloop.dev (override with SEED_USER_EMAIL)
```

**Code execution** needs Judge0, which runs as its own Compose project. See [Judge0](#judge0-code-execution). Without it, the rest of the app works normally and submissions report that the execution service is unavailable.

> On Docker Desktop for Windows/WSL bind mounts, set `CHOKIDAR_USEPOLLING=true` in `.env` if hot reload does not pick up changes.

## Running without Docker

Requirements: Python 3.10+, Node.js 20+, and MySQL 8 (for example `docker compose up -d mysql`).

**API**

```bash
cd server
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # set APP_ENV=development and the DB credentials
python manage.py wait-db
python manage.py migrate
python -m api.app               # http://localhost:5000, dev server (APP_ENV=development only)
```

**Frontend**

```bash
cd client
cp .env.example .env            # VITE_API_BASE_URL=http://localhost:5000/api
npm ci
npm run dev                     # http://localhost:3000
```

## Configuration

The API validates all of its settings at startup (`python manage.py check-config`) and refuses to start if any are missing or unsafe. `APP_ENV` defaults to `production`, which applies the strictest checks.

### API (`server/.env.example`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `APP_ENV` | no | `production` | `development`, `testing` or `production`. The Flask debug server runs only in `development`. |
| `DATABASE_URL` | one of | – | SQLAlchemy URL, e.g. `mysql+pymysql://user:pass@host:3306/CODE_DB`. A plain `mysql://` is also accepted. |
| `CODE_DB_HOST`, `CODE_DB_USER`, `CODE_DB_PASSWORD`, `CODE_DB_NAME`, `CODE_DB_PORT` | one of | port `3306` | Alternative to `DATABASE_URL`. |
| `JWT_SECRET_KEY` | **yes** | – | Must be at least 32 characters in production. |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | no | `24` | Token lifetime. |
| `CORS_ORIGINS` | no | dev: `http://localhost:3000,http://127.0.0.1:3000`; prod: none | Comma-separated allowlist. `*` is rejected in production. Leave it empty when the frontend is served from the same origin. |
| `JUDGE0_URL` | **yes** in prod | dev: `http://localhost:2358` | Base URL of the Judge0 API. |
| `JUDGE0_AUTH_TOKEN` | no | – | Sent as `X-Auth-Token`; must match `AUTHN_TOKEN` in `judge0.conf`. |
| `JUDGE0_RAPIDAPI_KEY`, `JUDGE0_RAPIDAPI_HOST` | no | – | For hosted Judge0 CE on RapidAPI. |
| `JUDGE0_REQUEST_TIMEOUT` | no | `10` | Seconds per HTTP call to Judge0. |
| `JUDGE0_MAX_RETRIES` | no | `2` | Retries for connection errors, and for 502/503/504 responses on reads. |
| `JUDGE0_SYNC_WAIT` | no | `15` | Maximum seconds a submit request waits before answering 202. |
| `JUDGE0_POLL_INTERVAL` | no | `1` | Seconds between result polls during that wait. |
| `JUDGE0_BATCH_SIZE` | no | `20` | Test cases per batch request (Judge0's default maximum is 20). |
| `JUDGE0_LANGUAGE_IDS` | no | `python=71,c=50` | Language name → Judge0 language id. The UI currently submits Python. |
| `MAX_CONTENT_LENGTH` | no | `1048576` | Maximum request body size in bytes. |
| `LOG_LEVEL` | no | `INFO` | Python log level. |
| `PORT`, `WEB_CONCURRENCY`, `GUNICORN_THREADS`, `GUNICORN_TIMEOUT`, `FORWARDED_ALLOW_IPS` | no | `5000`, ≤4, `4`, `60`, `127.0.0.1` | Gunicorn settings ([`server/gunicorn.conf.py`](server/gunicorn.conf.py)). |
| `RUN_MIGRATIONS`, `DB_WAIT_TIMEOUT` | no | `1`, `90` | Container entrypoint behaviour. |

### Frontend (`client/.env.example`)

Vite compiles these into the JavaScript bundle at build time, so they are public. Never put secrets in them.

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API base URL including `/api`. Use `http://localhost:5000/api` in dev and `/api` behind the bundled Nginx. |
| `VITE_APP_NAME` | `codeLoop` | Display name. |
| `VITE_DEFAULT_AVATAR` | DiceBear identicon | Avatar used for new profiles. |

The production web image also reads `API_UPSTREAM` (default `http://api:5000`), the address Nginx proxies `/api` to.

## Database

- **Schema management:** [Alembic](https://alembic.sqlalchemy.org/) migrations live in `server/migrations/versions/`. `python manage.py migrate` applies them; the container entrypoint runs it on every start, and running it again is safe.
- **Databases created before migrations existed** (tables already present, no `alembic_version` table) are detected and stamped at the baseline revision before upgrading. Revision `0002_hardening` adds unique constraints on emails, catalog titles, task titles, one profile per user and one favorite per user and task. If that step fails with a duplicate-key error, delete the duplicate rows and run `migrate` again. Users with legacy unsalted SHA-256 password hashes can still log in, and their hash is upgraded on that first login.
- **New migrations:** change the models, then run `alembic revision --autogenerate -m "describe change"` inside `server/`. Review the generated file, then run `python manage.py check-schema`, which CI also runs against MySQL.
- **Startup readiness:** `python manage.py wait-db` retries until MySQL accepts queries. `GET /api/health` (and `/health`) returns 503 while the database is unreachable.
- **Persistence and backups:** the Compose stacks store MySQL data in the `mysql_data` volume. `docker compose down -v` deletes it. With managed MySQL, enable the provider's automated backups. When self-hosting, schedule a dump, for example:

  ```bash
  docker compose -f docker-compose.prod.yml --env-file .env.production exec -T mysql \
    sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' > backup-$(date +%F).sql
  ```

  Copy the dumps off the host. Run them nightly, keep several days, and test a restore.

## Judge0 (code execution)

Judge0 CE runs untrusted code inside the `isolate` sandbox. It needs **privileged containers** and, for version 1.13.1, a Linux host with **cgroup v1**. It therefore cannot run on serverless or ordinary PaaS platforms, and it will not run on a default Ubuntu 22.04+/WSL2 kernel, which uses cgroup v2.

**Local development**

```bash
docker compose up -d                       # starts the app and creates the codeloop-judge0 network
cd judge0
cp judge0.conf.example judge0.conf         # set REDIS_PASSWORD and POSTGRES_PASSWORD
docker compose up -d db redis && sleep 10 && docker compose up -d
curl http://127.0.0.1:2358/about
```

Judge0 is published on `127.0.0.1:2358` only and joins the dev stack's `codeloop-judge0` network as `http://judge0:2358`, which is the dev default for `JUDGE0_URL`. If the API runs outside Docker, use `JUDGE0_URL=http://localhost:2358`, and run `docker network create codeloop-judge0` before starting Judge0.

To switch a cgroup v2 host to cgroup v1, add `systemd.unified_cgroup_hierarchy=0` to `GRUB_CMDLINE_LINUX` in `/etc/default/grub`, then run `sudo update-grub` and reboot. Under WSL2, add `kernelCommandLine = systemd.unified_cgroup_hierarchy=0` to the `[wsl2]` section of `%UserProfile%\.wslconfig`, then run `wsl --shutdown`. Without this, every execution ends with status `error` (Judge0 "Internal Error").

**Production options**

1. **Recommended: a small dedicated VM** (for example a 2 vCPU / 4 GB Ubuntu 20.04 host, or 22.04 switched to cgroup v1) running `judge0/docker-compose.yml`. On that VM:
   - Set a long random `AUTHN_TOKEN` in `judge0.conf`, and set the same value as `JUDGE0_AUTH_TOKEN` on the API.
   - Put a TLS reverse proxy such as Caddy or Nginx in front of port 2358.
   - Allow only the API's egress IPs through the firewall, if your host has static IPs.
2. **Hosted Judge0 CE (RapidAPI).** Set `JUDGE0_URL=https://judge0-ce.p.rapidapi.com` and `JUDGE0_RAPIDAPI_KEY`. This needs no servers, but plans are quota-limited, and each test case counts as one submission.

Language IDs depend on the Judge0 version; adjust `JUDGE0_LANGUAGE_IDS` to match `GET /languages`.

## Tests and quality checks

| Command | Directory | What it checks |
| --- | --- | --- |
| `flake8` | `server/` | Python style and errors |
| `python -m pytest -q` | `server/` | 45 API tests (auth, authorization, validation, health, config, submissions with a mocked Judge0, migrations vs. models), with warnings treated as errors |
| `python manage.py check-schema` | `server/` | Live database schema matches the models |
| `npm run lint` | `client/` | ESLint with zero warnings allowed |
| `npm test` | `client/` | Vitest: API client error handling, session expiry, protected routes, form validation |
| `npm run build` | `client/` | Production bundle |

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs all of the above on every pull request, including migrations against a MySQL 8 service, and builds both production Docker images.

## Deployment

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for step-by-step instructions. In short:

- **Recommended:** [Railway](https://railway.app) for the API container, the web container and managed MySQL, plus Judge0 on a small VM.
- **Alternative:** a single Docker host running `docker-compose.prod.yml`, with Judge0 alongside it or on its own VM.

The production images use Gunicorn behind unprivileged Nginx. They have health checks, no development bind mounts, and do not publish the database port.

## API overview

All routes are under `/api`. Every route except `status`, `health`, `stats`, `register` and `login` requires `Authorization: Bearer <token>`. Errors always look like `{"error": "message"}`, sometimes with a `field`.

| Method & path | Description |
| --- | --- |
| `GET /status`, `GET /health` | Liveness, and readiness including the database |
| `POST /register`, `POST /login` | Create an account / get a JWT |
| `GET/PUT/DELETE /users` | Current account |
| `GET/POST/PUT /users/profile` | Bio and avatar |
| `GET /users/statistics`, `GET /users/statistics/categories` | Progress statistics |
| `GET/POST/DELETE /users/favorites` | Favorites (`task_id`, or `title` for compatibility) |
| `GET/POST /categories`, `GET /categories/<id>/tasks` | Catalogs and their tasks |
| `GET/POST /tasks`, `GET/PUT/DELETE /tasks/<id>` | Tasks; changes are limited to the author |
| `GET/POST /tasks/<id>/test_cases`, `GET/PUT/DELETE /tasks/<id>/test_cases/<tc>` | Test cases, author only |
| `POST /tasks/<id>/submit` | Submit code: 201 graded, 202 pending, 503 Judge0 unavailable |
| `GET /tasks/<id>/submissions`, `GET /submissions/<id>`, `GET /submissions/<id>/results` | Your own submissions and their per-test results |

## Security notes

- **Credentials committed in earlier history must be rotated.** Earlier commits tracked `server/api/.env`, which contained a JWT secret, and `judge0/judge0.conf`, which contained the Redis and Postgres passwords. These files are no longer tracked, but their values remain in git history. Treat them as public and generate new ones. Changing the JWT secret logs out every user. Rewriting history (for example with `git filter-repo`) is optional and needs a force-push coordinated with every collaborator.
- Secrets come only from the environment. `.env*` files are git-ignored except the `*.example` templates.
- Passwords are stored as salted PBKDF2-SHA256 hashes (600k iterations).
- CORS uses an explicit allowlist, and tokens travel in the `Authorization` header, never in cookies.
- The Flask debugger never runs outside `APP_ENV=development`. Errors are returned as generic JSON, without stack traces or SQL.
- Every write route validates its input and accepts only an explicit list of fields, so clients cannot set ids, owners or timestamps. Authors alone can change their tasks and test cases, and submissions and results are visible only to their owner.
- Nginx rate-limits `/api/login` and `/api/register` (10 requests/minute per IP, burst 5), and sets basic security headers.
- Judge0 executes arbitrary code. Never expose it without `AUTHN_TOKEN` and TLS.

## Known limitations

- There are no roles: any signed-in user can create catalogs, and catalogs cannot be edited or deleted through the API.
- Tasks are kept when their author deletes their account, and can no longer be edited after that.
- The editor submits Python only. The backend also accepts `c` if Judge0 supports it, but the UI does not offer it yet.
- Rate limiting happens only in the bundled Nginx. If you deploy the API without it, add rate limiting at your edge.
- Grading is synchronous up to `JUDGE0_SYNC_WAIT`, then the client polls. Very heavy workloads would benefit from a job queue.
- The JWT is stored in `localStorage`, where an XSS bug could read it. Task descriptions are rendered with `react-markdown`, which does not render raw HTML.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Acknowledgments

- [Judge0](https://github.com/judge0/judge0) for sandboxed code execution.

---

Made with ❤️ by the CodeLoop Team ([AUTHORS](AUTHORS.md))
