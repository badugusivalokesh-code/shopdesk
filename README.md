# ShopDesk

## Status: Phase 1 — Project Analysis & Setup

This repository currently contains **setup/scaffolding only**. There are no
dashboard pages, no CRUD functionality, no authentication, and no API
endpoints yet — see the Phase 1 report in the accompanying chat message for
the full inspection, file-change report, and verification results, and
`DESIGN_TOKENS.md` for how the design tokens were derived.

## Structure

```
shopdesk/
├── client/            React 18 + Vite + TypeScript + Tailwind CSS frontend
│   ├── src/
│   │   ├── api/        Axios client configuration (no endpoint calls yet)
│   │   ├── components/ Reusable UI components (empty — Phase 2)
│   │   ├── context/     ThemeContext (light/dark mode)
│   │   ├── pages/       Route-level pages (placeholder only — Phase 2)
│   │   ├── styles/      Design token constants (tokens.ts)
│   │   ├── types/       Shared TypeScript types (empty — Phase 2)
│   │   ├── App.tsx
│   │   ├── index.css    Tailwind + CSS-variable theme tokens
│   │   └── main.tsx
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
├── server/             Express + Mongoose backend
│   ├── config/db.js     Mongo connection helper (defined, not invoked yet)
│   ├── middleware/      Empty — Phase 2
│   ├── models/          Empty — Phase 2
│   ├── routes/          Empty — Phase 2
│   ├── seed/seed.js      Placeholder — Phase 2
│   ├── server.js         Express bootstrap (no routes mounted, no DB connect)
│   └── package.json
├── DESIGN_TOKENS.md
└── README.md
```

## Tech stack

- **Client:** React 18, Vite, TypeScript, Tailwind CSS, React Router,
  Recharts, Axios
- **Server:** Node.js, Express, MongoDB via Mongoose (this pairing was
  inferred from the brief's mention of "models", "seed script", and
  "MongoDB" — it was not explicitly specified, so confirm before Phase 2)

## Design reference

All visual tokens (color, radius, shadow) are derived from the supplied
Horizon UI screenshots via pixel sampling — not from assumed Figma values.
See `DESIGN_TOKENS.md` for the full source table and what's verified vs.
estimated.

## Running this project

Not yet done in this phase — no dependencies have been installed and no
servers have been started, per Phase 1 scope restrictions. Once reviewed:

```bash
# Client
cd client
npm install
npm run dev

# Server (separate terminal)
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI etc.
npm run dev
```

## Next steps (Phase 2 — not started)

Dashboard pages, CRUD functionality, authentication, and API endpoints,
pending explicit approval.
