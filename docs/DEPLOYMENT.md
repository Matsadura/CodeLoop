# Deploying CodeLoop

CodeLoop has four runtime pieces with very different hosting needs:

| Piece | Needs | Where it fits |
| --- | --- | --- |
| Frontend | Static files (or the Nginx image) | Any static host or container platform |
| API | A long-running container (Gunicorn) | Container PaaS |
| MySQL 8 | Persistent storage and backups | Managed MySQL |
| Code runner | Piston: **privileged** Docker and cgroup v2. Judge0: **privileged** Docker, cgroup v1, Postgres and Redis | The app's own server (Piston), its own VM, or hosted Judge0 |

Code execution is the deciding constraint. Judge0 and Piston both run untrusted code in a privileged sandbox, which serverless platforms and ordinary PaaS containers do not allow. Production therefore runs the sandbox on a server you control: either a Judge0 VM next to a PaaS (option A), or Piston on the same single server as the app (option B, the cheapest).

## Option A (recommended): Railway + a Judge0 VM

Why Railway: it builds Dockerfiles from subdirectories of a monorepo, offers managed MySQL in the same project with private networking, injects `PORT`, and supports health checks. All of CodeLoop except Judge0 fits in one project. Render has no managed MySQL, and Fly.io would need a self-managed MySQL machine.

> These steps follow Railway's documented features. They have not been executed against a live Railway project as part of this repository's checks; the same images were verified locally with `docker-compose.prod.yml`.

### 1. Judge0 VM

1. Create a small Linux VM (2 vCPU / 4 GB RAM is enough for a demo) with Docker Engine and the Compose plugin. Use Ubuntu 20.04, or switch Ubuntu 22.04+ to cgroup v1: add `systemd.unified_cgroup_hierarchy=0` to `GRUB_CMDLINE_LINUX` in `/etc/default/grub`, run `sudo update-grub`, then reboot.
2. Copy the `judge0/` directory to the VM and create the configuration:
   ```bash
   cp judge0.conf.example judge0.conf
   # set REDIS_PASSWORD, POSTGRES_PASSWORD and AUTHN_TOKEN to long random values:
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
3. The compose file joins an external `codeloop-judge0` network. Create it once on the VM, then start Judge0:
   ```bash
   docker network create codeloop-judge0
   docker compose up -d db redis && sleep 10 && docker compose up -d
   curl -H "X-Auth-Token: $AUTHN_TOKEN" http://127.0.0.1:2358/about
   ```
4. Expose it over HTTPS with a reverse proxy, e.g. Caddy (`judge0.example.com { reverse_proxy 127.0.0.1:2358 }`). Leave port 2358 closed in the firewall.
5. Check the language ids with `GET https://judge0.example.com/languages` (send the `X-Auth-Token` header).

### 2. Railway project

1. **MySQL:** add the MySQL database service. Railway exposes a connection URL variable on it (`MYSQL_URL`).
2. **API service:** deploy from this GitHub repo with **Root Directory** `server`. Railway detects `server/Dockerfile` and builds its last stage, `prod`. Set these variables:
   ```text
   APP_ENV=production
   DATABASE_URL=${{MySQL.MYSQL_URL}}
   JWT_SECRET_KEY=<64+ random characters>
   JUDGE0_URL=https://judge0.example.com
   JUDGE0_AUTH_TOKEN=<AUTHN_TOKEN from judge0.conf>
   CORS_ORIGINS=https://<web-domain>
   FORWARDED_ALLOW_IPS=*
   ```
   Set the health check path to `/api/health` and generate a public domain. The entrypoint waits for MySQL and runs migrations on every deploy. If you run more than one replica, set `RUN_MIGRATIONS=0` and run `python manage.py migrate` as a pre-deploy command instead.
3. **Web service:** deploy the same repo again with **Root Directory** `client`. It builds `client/Dockerfile`, stage `prod`. Set these variables:
   ```text
   API_UPSTREAM=https://<api-public-domain>
   PORT=8080
   ```
   `VITE_API_BASE_URL` defaults to `/api` at build time, so the browser calls the web domain and Nginx forwards `/api/*` to the API, which keeps everything on one origin. Set the health check path to `/nginx-health` and generate a public domain. This domain is the URL users visit.
4. Open the web domain, register the first user, and optionally seed demo data from the API service shell:
   ```bash
   SEED_USER_PASSWORD='choose-a-password' python manage.py seed
   ```

### 3. Verify

```bash
curl https://<web-domain>/api/health          # {"database":"ok","status":"ok"}
curl https://<api-domain>/api/status          # {"status":"OK"}
```

Then log in, open the seeded task and submit a correct solution. It should come back `correct`, and the "Output & Tests" panel should list each test case.

## Option B: a single Docker host

On any VM with Docker (for example a VPS from Hetzner, DigitalOcean or AWS Lightsail):

```bash
git clone https://github.com/Matsadura/CodeLoop.git && cd CodeLoop
cp .env.production.example .env.production      # fill in every value
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

- The web container listens on `${WEB_PORT:-8080}`. Put a TLS terminator such as Caddy, Traefik or a cloud load balancer in front of it, or use the bundled overlay described below.
- **Small VPS with automatic HTTPS and code execution:** [`deploy/docker-compose.vps.yml`](../deploy/docker-compose.vps.yml) adds Caddy, which gets a Let's Encrypt certificate for `DOMAIN`. It also adds a private Piston sandbox for running code (amd64 or arm64), and tunes MySQL and Gunicorn for about 1 GB of RAM. Piston needs pure cgroup v2. On Ubuntu 20.04, enable it once:
  ```bash
  sudo sed -i 's/^GRUB_CMDLINE_LINUX="\(.*\)"/GRUB_CMDLINE_LINUX="\1 systemd.unified_cgroup_hierarchy=1"/' /etc/default/grub
  sudo update-grub && sudo reboot
  # after reboot: stat -fc %T /sys/fs/cgroup  ->  cgroup2fs
  ``` Point the domain's DNS at the server, open ports 80 and 443, set `DOMAIN` in `.env.production`, then run:
  ```bash
  docker compose -f docker-compose.prod.yml -f deploy/docker-compose.vps.yml \
    --env-file .env.production up -d --build
  ```
  On hosts with 1 GB of RAM, add swap before building: the frontend build needs more memory than that.
- MySQL is not published to the host. Its data lives in the `codeloop-prod_mysql_data` volume; back it up with `mysqldump` (see the README).
- Point `JUDGE0_URL` at a Judge0 VM set up as in option A, step 1. Running Judge0 on the same host is possible if that host uses cgroup v1, but it is not wired up by default. You would need to attach the `api` service to Judge0's network and set `JUDGE0_URL=http://judge0:2358`. Keep in mind that Judge0's privileged containers then share a kernel with your database.

## Required production environment variables

| Service | Variable | Notes |
| --- | --- | --- |
| API | `APP_ENV=production` | Default when unset |
| API | `DATABASE_URL` *or* `CODE_DB_HOST`/`CODE_DB_USER`/`CODE_DB_PASSWORD`/`CODE_DB_NAME` | |
| API | `JWT_SECRET_KEY` | ≥ 32 characters, random |
| API | `CODE_RUNNER` | `piston` (single server) or `judge0` |
| API | `PISTON_URL` | With Piston; the VPS overlay sets `http://piston:2000` |
| API | `JUDGE0_URL` | With Judge0: HTTPS URL of Judge0 |
| API | `JUDGE0_AUTH_TOKEN` or `JUDGE0_RAPIDAPI_KEY` | With Judge0: effectively required, since Judge0 must not be open |
| API | `CORS_ORIGINS` | Only when the frontend is on another origin |
| Web image | `API_UPSTREAM` | Where Nginx proxies `/api` |
| Web build | `VITE_API_BASE_URL` | Defaults to `/api` |
| Compose | `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` | For `docker-compose.prod.yml` only |

The API refuses to start if any required value is missing or unsafe. Run `python manage.py check-config` to see every problem at once.

## Operations checklist

- [ ] Rotate any secret that was ever committed (see README > Security notes).
- [ ] Enable automated MySQL backups and test a restore.
- [ ] Monitor `/api/health` (API and database) and `GET /about` on Judge0.
- [ ] Keep Judge0 behind TLS with `AUTHN_TOKEN` set, and restrict its firewall.
- [ ] Review Gunicorn `WEB_CONCURRENCY` and `JUDGE0_SYNC_WAIT` under real load.
