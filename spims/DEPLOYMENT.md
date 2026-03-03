# SPIMS Deployment Guide

## Local Production via Docker

From the `spims` folder:

```bash
docker compose up --build
```

Services:

- Backend API: `http://localhost:5000`
- Admin Dashboard: `http://localhost:3000`
- Public Website: `http://localhost:3001`
- Enterprise Dashboard: `http://localhost:4200`
- PostgreSQL: `localhost:5432`

Default seeded users:

- `admin` / `admin123` (role: `ADMIN`)
- `operator` / `operator123` (role: `OPERATOR`)

## Backend on Render

1. Create a PostgreSQL instance on Render.
2. Create a Web Service from `spims/backend-service`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Set env vars from `backend-service/.env.example` (especially `DATABASE_URL`, JWT secrets, and CORS origins).

## Next.js Apps on Vercel

Deploy both folders separately:

- `spims/admin-dashboard`
- `spims/public-website`

Set environment variable:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-render-backend>/api`

## Angular Enterprise Hosting

Recommended options: Render static/Node service, Netlify (static), or Firebase Hosting.

Current project is SSR-enabled; deploy the Node server output:

1. Run `npm run build` in `spims/enterprise-dashboard`
2. Start server with:

```bash
node dist/enterprise-dashboard/server/server.mjs
```

Set `PORT` env var provided by host.
