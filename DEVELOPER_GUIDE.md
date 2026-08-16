DEVELOPER GUIDE — Dastarkhwan ERP
=================================

Purpose
-------
This document is a single source of truth for developers working on Dastarkhwan ERP. It explains project structure, development workflow, build and packaging steps, database details, troubleshooting, and contribution guidelines so no minor detail is missed.

Quick Links
-----------
- Project root: [package.json](package.json#L1)
- Electron main process: [electron/main.js](electron/main.js#L1)
- Database setup: [electron/db.js](electron/db.js#L1)
- React entry: [src/main.jsx](src/main.jsx#L1)
- App root: [src/App.jsx](src/App.jsx#L1)
- API client: [src/api/client.js](src/api/client.js#L1)
- Auth context: [src/auth/AuthContext.jsx](src/auth/AuthContext.jsx#L1)

Requirements
------------
- Node.js (recommended LTS)
- npm (bundled with Node) or Yarn
- For Windows packaging: NSIS (electron-builder handles most via config)

Install Dependencies
--------------------
Run in project root:

```bash
npm install
```

Development
-----------
- Start Vite dev server only:

```bash
npm run dev
```

- Start Electron + Vite for integrated development:

```bash
npm run electron:dev
```

Notes:
- `electron:dev` runs `vite` and then launches Electron with `VITE_DEV_SERVER_URL` pointing to `http://localhost:5173`.
- If port 5173 is in use, either stop the conflicting process or change the dev server port in `vite.config.js`.

Build & Packaging
-----------------
- Build web assets and create distributables:

```bash
npm run electron:build
```

- Windows-only build:

```bash
npm run electron:build:win
```

- Produce an unpacked output directory for manual testing:

```bash
npm run electron:pack
```

Configuration & Metadata
------------------------
- Packaging config and metadata are in `package.json` under the `build` key. Adjust `appId`, `productName`, and `files` as needed.

Database (SQLite)
-----------------
- The app uses a local SQLite database managed from Electron. See [electron/db.js](electron/db.js#L1).
- Typical responsibilities:
  - DB initialization and migrations
  - Data seeding for default configuration
  - Exposing DB access to renderer via secure `preload.js` channels

Backups & Migration Strategy
---------------------------
- Backup the DB file (path configured in `electron/db.js`) regularly.
- Migrations should be deterministic and additive. Store migration scripts with timestamps and run them on app start if needed.

Architecture & Folder Map
-------------------------
- `electron/` — Electron main, preload, and DB glue code. Key files:
  - [electron/main.js](electron/main.js#L1): App lifecycle and IPC handlers.
  - [electron/preload.js](electron/preload.js#L1): Secure renderer bridge.
  - [electron/db.js](electron/db.js#L1): SQLite access and initialization.
- `src/` — React source code:
  - `src/main.jsx` — React bootstrap and router configuration.
  - `src/App.jsx` — App shell and routes.
  - `src/pages/` — Page-level components for features (POS, Inventory, Reports, etc.).
  - `src/components/` — Reusable UI components organized by domain.
  - `src/auth/` — Authentication and lock-screen logic.
  - `src/api/` — Node/HTTP wrappers and client code.
  - `src/context/` — React contexts for app-wide state.

Key Components Reference
------------------------
- Layout and navigation: [src/components/layout/AppLayout.jsx](src/components/layout/AppLayout.jsx#L1), [src/components/layout/Sidebar.jsx](src/components/layout/Sidebar.jsx#L1), [src/components/layout/Topbar.jsx](src/components/layout/Topbar.jsx#L1)
- POS: [src/components/pos/Receipt.jsx](src/components/pos/Receipt.jsx#L1), [src/pages/POS.jsx](src/pages/POS.jsx#L1)
- Reports viewer: [src/components/reports/ReportViewer.jsx](src/components/reports/ReportViewer.jsx#L1)
- Utilities: [src/utils/export.js](src/utils/export.js#L1)

Authentication & Authorization
------------------------------
- `AuthContext` handles user sessions and permissions. For local-only apps, authentication is primarily used to gate actions and log activity.
- Lock screen is implemented in [src/auth/LockScreen.jsx](src/auth/LockScreen.jsx#L1).

Styling
-------
- Tailwind CSS is configured in `tailwind.config.js` and `postcss.config.js`. Main stylesheet: [src/index.css](src/index.css#L1).

APIs & External Integrations
----------------------------
- The project is offline-first; external integrations are minimal. If adding external services, centralize them under `src/api/` and guard network access behind feature flags.

Testing & Linting
-----------------
- Linting is available via `npm run lint` (configured in `package.json`).
- Add unit/component tests using your preferred framework (Jest/Testing Library) and add scripts to `package.json`.

Common Issues & Fixes
---------------------
- Electron dev fails to connect to Vite: ensure `wait-on` completes and `VITE_DEV_SERVER_URL` is set.
- Packaging errors: check versions of `electron` and `electron-builder`; some native modules require rebuilding.

Contribution Guide
------------------
- Branching: use topic branches and open PRs against `main`.
- Commit messages: be descriptive; include issue references when applicable.
- Code style: follow existing conventions (React + functional components). Run `npm run lint` before pushing.

Release Process
---------------
1. Bump version in `package.json`.
2. Run `npm run electron:build` and verify artifacts in `release/`.
3. Upload installer artifacts to your release distribution channel.

Maintenance Tips
----------------
- Keep dependencies up to date but test Electron compatibility when upgrading `react`, `vite`, or `electron`.
- Monitor `electron-builder` release notes for breaking changes to packaging.

Where to get help
-----------------
- Open issues in the repository and tag with `bug` or `help wanted`.
- Ask maintainers or project owner (see `package.json` author field).

Appendix — Useful Commands
-------------------------
- Install deps: `npm install`
- Dev server: `npm run dev`
- Electron dev (integrated): `npm run electron:dev`
- Build packages: `npm run electron:build`
- Lint: `npm run lint`

If you'd like, I can:
- add diagrams or flowcharts for architecture,
- extract a CONTRIBUTING.md and CODE_OF_CONDUCT.md,
- or generate a short onboarding checklist for new developers.
