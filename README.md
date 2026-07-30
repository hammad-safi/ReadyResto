# Dastarkhwan ERP — Full-Stack Offline Restaurant Management System

A complete offline restaurant ERP: React (Vite) frontend + Electron desktop shell +
a real SQLite database (via Node's built-in `node:sqlite` — no native compilation
required). Ships as a Windows installer (.exe) you can hand to a restaurant and
install like any other desktop app — no internet, no cloud, no subscriptions.

## What's actually working end-to-end (not just UI mockups)

Every module below reads and writes real rows in a local SQLite database file
(`dastarkhwan-erp.db`, created automatically on first launch in the app's user
data folder):

- **Add / Edit / Delete** on: Menu Items, Inventory, Suppliers, Purchase Orders,
  Customers, Employees, Users & Roles, Expenses, Tables.
- **POS Billing** creates a real order + order line items in the database and
  marks the dine-in table as occupied.
- **Kitchen Display** reads live orders and moves them through
  New → Preparing → Ready → Served by updating the order's status in the DB.
- **Table Management** — mark available / occupied / reserved / cleaning,
  all persisted.
- **Order Management** — cancel an order, which also frees up its table.
- **Settings** — the restaurant profile (name, address, tax rate, receipt
  footer, etc.) is saved to a `settings` table and reloaded on next launch.
- **Audit Log** — every create/update/delete anywhere in the app writes a row
  here automatically (who, what, when).
- **PIN login / lock screen** — the sidebar "lock" button locks the app; you
  unlock with a 4-digit PIN checked against the `users` table.

### What's still simplified (by design, not by accident)
A handful of the deepest sub-screens are intentionally left as UI-only or
lightly wired, since they involve heavier workflow logic (multi-step wizards,
approvals, hardware I/O) that depends on your actual restaurant's process:
- Recipe Management's ingredient picker uses a static dropdown rather than a
  live-linked ingredient search (the table exists — `recipe_ingredients` — so
  this is a small follow-up, not a redesign).
- Physical Stock Count, Stock Transfer, and Purchase-Order receiving are
  modeled as forms but don't yet post adjustments back into `inventory_items`.
  Printing, Hardware, and Backup & Restore are UI + settings only, since they
  depend on the printer/USB hardware actually attached to the target PC.
- Reports pages show layout/navigation only (no aggregation queries yet).

All of these read/write against the same `db:list / db:create / db:update /
db:delete` bridge already in `electron/main.js` — extending them is adding a
form + a table name, not new plumbing.

## Installing on Windows

1. Download **`Dastarkhwan-ERP-Setup-1.0.0.exe`** (installer) — double-click,
   choose an install folder, done. A Start Menu and Desktop shortcut are
   created for you.
   - Prefer not to install anything? Use **`Dastarkhwan-ERP-Portable-1.0.0.exe`**
     instead — a single file, no installation, just run it (data still saves
     locally next to your Windows user profile).
2. Launch **Dastarkhwan ERP** from the Start Menu.
3. You'll land straight on the Dashboard as the Owner. Try the lock icon in
   the top bar, then unlock with PIN **1234** (Owner), **2345** (Cashier),
   **3456** (Waiter), or **4567** (Kitchen Staff) — these are seeded demo
   accounts; edit or add real ones under Users & Roles.

Nothing here phones home — there's no server, no internet check, no license
key. Everything runs from the .exe alone.

## Developing further

```bash
npm install
npm run electron:dev        # Vite dev server + Electron window, hot reload
npm run build                # frontend production build only
npm run electron:build:win   # full Windows installer + portable exe
npm run electron:pack        # unpacked build for quick local testing
```

### Project structure
```
electron/
  main.js       Electron main process — window creation + all IPC handlers
  preload.js    contextBridge — the only thing exposed to the renderer (window.api)
  db.js         SQLite schema + seed data (node:sqlite, no native build step)
src/
  api/client.js Frontend API wrapper — calls window.api in Electron, falls
                back to an in-memory store if opened in a plain browser tab
  auth/         PIN login / lock screen + current-user context
  components/
    layout/     Sidebar, Topbar, AppLayout (responsive shell)
    entity/     EntityManager — generic list + add + edit + delete used by
                most simple CRUD modules (Suppliers, Customers, Employees, …)
    ui/         Button, Badge, DataTable, Modal, StatCard, PageHeader
  pages/        One page per module (22 modules + settings)
```

### Why `node:sqlite` instead of `better-sqlite3`
`better-sqlite3` is a native addon — cross-compiling it for Windows from a
non-Windows build machine requires either a Windows CI runner or a Windows
build toolchain, which isn't always available. Node 22+ (bundled inside
recent Electron versions) ships a built-in SQLite module, `node:sqlite`, with
an almost identical prepare/run/get/all API — so the app gets a real embedded
SQL database with zero native compilation, and the same source builds
cleanly for Windows, Linux, or Mac from any machine.

## Design system
- Sidebar: charcoal `#1B1E23` with a paprika-red `#C1440E` accent.
- Type: Space Grotesk (headings/numbers), Inter (body), IBM Plex Mono
  (order IDs, prices, receipt-style tags).
- Fully responsive: sidebar collapses into a slide-over drawer under `lg`;
  tables scroll horizontally on small screens; POS cart stacks above the
  menu grid on mobile.
