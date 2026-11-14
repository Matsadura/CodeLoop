# CodeLoop frontend

React 18 + Vite single-page app. See the [root README](../README.md) for the full project documentation.

```bash
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5000/api for local dev
npm ci
npm run dev            # http://localhost:3000
npm run lint           # ESLint, zero warnings allowed
npm test               # Vitest
npm run build          # production bundle in dist/
```

- `src/tools/requestModule.jsx`: the API client. It never throws, normalizes errors and handles session expiry.
- `src/components/Context.jsx`: authentication state (`login`, `logout`, `user`).
- `src/components/PrivateRoute.jsx`: redirects anonymous users to `/login`.
- `Dockerfile`: a `dev` target (Vite) and a `prod` target (unprivileged Nginx serving `dist/` and proxying `/api` to `API_UPSTREAM`).
