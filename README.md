Dastarkhwan ERP
=================

Offline Restaurant Management — POS, kitchen display, inventory, staff, accounting, and reports.

Overview
--------
Dastarkhwan ERP is a full-stack, offline-first desktop application built with a Vite + React frontend wrapped in Electron. It uses a local SQLite database (via Node) so restaurants can run the app without internet, cloud services, or subscriptions. The project is designed to be packaged into a Windows installer or cross-platform desktop bundles.

Key Features
------------
- Point of Sale (POS) with receipt printing
- Kitchen display and order routing
- Inventory management and purchases
- Staff and user management
- Accounting and shift management
- Reports and exports (PDF/CSV)
- Designed for offline use with a bundled SQLite DB

Tech Stack
----------
- Frontend: React (Vite)
- Desktop shell: Electron
- Database: SQLite (accessed from Node/Electron)
- Build & Packaging: electron-builder
- Styling: Tailwind CSS

Repository Layout
-----------------
- electron/: Electron main/preload and database integration
- public/: Static assets
- src/: React app source (components, pages, utils)
- release/: Build output for packaged installers
- package.json: root scripts for development and packaging

Quick Start (Development)
-------------------------
1. Install dependencies:

   npm install

2. Run the app in development (Vite + Electron):

   npm run electron:dev

   This runs the Vite dev server and launches Electron pointed at the dev server.

3. Open the app in your browser (optional):

   npm run dev

Production Build & Packaging
----------------------------
- Build the web assets and produce distributables:

  npm run electron:build

- Build Windows-only installers:

  npm run electron:build:win

- Produce an unpacked directory (handy for testing the packaged app):

  npm run electron:pack

Database
--------
The app uses a SQLite database managed from the Electron process. See [electron/db.js](electron/db.js#L1) for the initialization and migrations. Because the DB lives locally, you can back it up or move it between installations.

Environment & Configuration
---------------------------
- Development server URL is configured via `VITE_DEV_SERVER_URL` when running Electron in dev mode.
- Packaging and app metadata live in `package.json` under the `build` key.

Contributing
------------
- Fork and open a pull request for bug fixes or improvements.
- Follow the existing code style and run `npm run lint` before submitting.

Troubleshooting
---------------
- If Electron fails to start in dev mode, ensure no process is already using port 5173.
- For build issues, check that native dependencies (if any) are compatible with your Electron version and rebuild them if needed.

Where to Look Next
------------------
- App entry: [src/main.jsx](src/main.jsx#L1)
- Electron main: [electron/main.js](electron/main.js#L1)
- Database: [electron/db.js](electron/db.js#L1)

License
-------
See `package.json` for project metadata. Add or update a LICENSE file as needed.

Contact
-------
If you need help understanding any part of the codebase, tell me which area you want explained and I will open the relevant files and summarize them.
