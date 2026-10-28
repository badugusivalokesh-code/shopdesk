# ShopDesk

ShopDesk is a React, TypeScript, Express, and MongoDB inventory dashboard.
It has five application screens: Login, Dashboard, Products, Orders, and
Profile. The UI supports light and dark themes and uses the supplied
Horizon-inspired design tokens.

## Project structure

```
shopdesk/
├── client/  React + Vite + TypeScript frontend
└── server/  Express + Mongoose API and idempotent seed script
```

There is no root package script. Run commands from the relevant package
directory (or use `npm --prefix`).

## Requirements

- Node.js 20 or later
- A MongoDB deployment reachable by the backend

## Configuration

Create `server/.env` from `server/.env.example` and replace every placeholder:

```env
PORT=5000
MONGODB_URI=replace-with-your-mongodb-connection-uri
JWT_SECRET=replace-with-at-least-32-random-characters
CLIENT_ORIGIN=http://localhost:5173
# Optional, only when the system resolver cannot resolve Atlas SRV/TXT records:
DNS_SERVERS=8.8.8.8,8.8.4.4
```

The server validates this configuration before it connects to MongoDB. It
requires a single HTTP(S) `CLIENT_ORIGIN`, a non-empty MongoDB URI, and a JWT
secret of at least 32 characters. `DNS_SERVERS` is optional and must be a
comma-separated list of IP addresses.

For the frontend, copy `client/.env.example` to `client/.env.local` and set
`VITE_API_URL` to the backend API base URL, including `/api`. For example,
`http://localhost:5000/api` during local development or
`https://api.example.com/api` after deployment.

Never commit either local environment file or real credentials.

## Install

```bash
npm ci --prefix client
npm ci --prefix server
```

## Static checks

```bash
npm --prefix client run lint
npm --prefix client run build
node --check server/server.js
node --check server/app.js
node --check server/seed/seed.js
```

## Run locally

Use separate terminals after configuration and installation:

```bash
npm --prefix server run dev
npm --prefix client run dev
```

The API connects to MongoDB before it opens its listener. The frontend reads
its API base URL from `VITE_API_URL`; it is not restricted to localhost when
that variable is set appropriately.

## Seed demo data

After configuring a reachable database, seed with:

```bash
npm --prefix server run seed
```

The seed uses the same environment validation and optional DNS override as
server startup. It uses idempotent upserts, creates the demo admin and 30
products in four categories, and creates 50 demo orders spanning today and
the preceding 13 UTC calendar dates. It does not drop collections or bulk
delete data. The database connection is closed even if seeding fails.

Demo credentials:

```
Email: admin@shopdesk.dev
Password: Admin@123
```

## API overview

`POST /api/auth/login` is public. Authenticated requests use
`Authorization: Bearer <token>`.

- `GET /api/auth/me`
- `GET`, `POST /api/products`; `PUT`, `DELETE /api/products/:id`
- `GET /api/orders`; `PATCH /api/orders/:id/status`
- `GET /api/stats`
- `PUT /api/users/me`

`GET /api/health` returns API and database connection status for operational
health checks.

## Deployment notes

Set `VITE_API_URL` at frontend build time and set the backend's
`CLIENT_ORIGIN` to the exact deployed frontend origin. Keep HTTPS/TLS enabled
for hosted MongoDB deployments. No Docker or remote deployment configuration
is included in this project.

## Known runtime verification

This repository can be checked statically without starting services. A manual
run still needs to verify MongoDB reachability, Atlas DNS behavior in the
target environment, and the authenticated browser flows against the deployed
API.
