const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const { openDatabase, ALLOWED_TABLES, MODULES, DEFAULT_PERMISSIONS, MODULE_OVERRIDES } = require("./db");

let mainWindow;
let db;

const isDev = !app.isPackaged;
const DEVICE_NAME = os.hostname();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#F5F6F7",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  db = openDatabase(app.getPath("userData"));
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function assertTable(table) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table "${table}" is not accessible.`);
  }
}

function logAudit(user, module, action, device) {
  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  db.prepare("INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)").run(
    time, user, module, action, device || DEVICE_NAME
  );
}

function registerIpcHandlers() {
  // Generic CRUD ---------------------------------------------------------
  ipcMain.handle("db:list", (e, table, { orderBy, where } = {}) => {
    assertTable(table);
    const order = orderBy ? ` ORDER BY ${orderBy}` : "";
    if (where && Object.keys(where).length) {
      const cols = Object.keys(where);
      const clause = cols.map((c) => `${c} = ?`).join(" AND ");
      return db.prepare(`SELECT * FROM ${table} WHERE ${clause}${order}`).all(...cols.map((c) => where[c]));
    }
    return db.prepare(`SELECT * FROM ${table}${order}`).all();
  });

  ipcMain.handle("db:get", (e, table, id) => {
    assertTable(table);
    return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  });

  ipcMain.handle("db:create", (e, table, data, meta = {}) => {
    assertTable(table);
    const cols = Object.keys(data);
    const placeholders = cols.map(() => "?").join(",");
    const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`);
    const result = stmt.run(...cols.map((c) => data[c]));
    if (meta.user) logAudit(meta.user, meta.module || table, meta.action || `Created new record in ${table}`, meta.device);
    const idCol = table === "orders" || table === "tables_floor" ? data.id : result.lastInsertRowid;
    return db.prepare(`SELECT * FROM ${table} WHERE ${table === "orders" || table === "tables_floor" ? "id" : "rowid"} = ?`).get(idCol);
  });

  ipcMain.handle("db:update", (e, table, id, data, meta = {}) => {
    assertTable(table);
    const cols = Object.keys(data);
    const setClause = cols.map((c) => `${c} = ?`).join(", ");
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...cols.map((c) => data[c]), id);
    if (meta.user) logAudit(meta.user, meta.module || table, meta.action || `Updated record ${id} in ${table}`, meta.device);
    return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  });

  ipcMain.handle("db:delete", (e, table, id, meta = {}) => {
    assertTable(table);
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    if (meta.user) logAudit(meta.user, meta.module || table, meta.action || `Deleted record ${id} from ${table}`, meta.device);
    return { success: true, id };
  });

  // Auth -------------------------------------------------------------------
  ipcMain.handle("auth:loginWithPin", (e, pin) => {
    const user = db.prepare("SELECT * FROM users WHERE pin = ? AND status = 'active'").get(pin);
    if (!user) return { success: false, message: "Invalid PIN" };
    db.prepare("UPDATE users SET last_login = ? WHERE id = ?").run(new Date().toLocaleString(), user.id);
    logAudit(user.name, "Authentication", "Logged in via PIN", DEVICE_NAME);
    return { success: true, user };
  });

  ipcMain.handle("auth:loginWithPassword", (e, usernameOrEmail, password) => {
    const user = db.prepare(
      "SELECT * FROM users WHERE (name = ? OR email = ?) AND password = ? AND status = 'active'"
    ).get(usernameOrEmail, usernameOrEmail, password);
    if (!user) return { success: false, message: "Invalid username or password" };
    db.prepare("UPDATE users SET last_login = ? WHERE id = ?").run(new Date().toLocaleString(), user.id);
    logAudit(user.name, "Authentication", "Logged in via Password", DEVICE_NAME);
    return { success: true, user };
  });

  ipcMain.handle("auth:adminOverride", (e, ownerPassword) => {
    const owner = db.prepare("SELECT * FROM users WHERE role = 'Owner' AND password = ?").get(ownerPassword);
    if (!owner) return { success: false, message: "Incorrect master password" };
    return { success: true, owner };
  });

  ipcMain.handle("auth:resetPin", (e, userId, newPin, ownerPassword) => {
    const owner = db.prepare("SELECT * FROM users WHERE role = 'Owner' AND password = ?").get(ownerPassword);
    if (!owner) return { success: false, message: "Incorrect master password" };
    db.prepare("UPDATE users SET pin = ? WHERE id = ?").run(newPin, userId);
    const target = db.prepare("SELECT name FROM users WHERE id = ?").get(userId);
    logAudit(owner.name, "Users & Roles", `Reset PIN for user: ${target?.name || userId}`, DEVICE_NAME);
    return { success: true };
  });

  ipcMain.handle("auth:resetPassword", (e, userId, newPassword, ownerPassword) => {
    const owner = db.prepare("SELECT * FROM users WHERE role = 'Owner' AND password = ?").get(ownerPassword);
    if (!owner) return { success: false, message: "Incorrect master password" };
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, userId);
    const target = db.prepare("SELECT name FROM users WHERE id = ?").get(userId);
    logAudit(owner.name, "Users & Roles", `Reset password for user: ${target?.name || userId}`, DEVICE_NAME);
    return { success: true };
  });

  // Permissions -----------------------------------------------------------
  ipcMain.handle("permissions:getAll", () => {
    return db.prepare("SELECT * FROM role_permissions").all();
  });

  ipcMain.handle("permissions:save", (e, rows, meta = {}) => {
    const stmt = db.prepare(
      `INSERT INTO role_permissions (role, module, can_view, can_add, can_edit, can_delete, can_export)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(role, module) DO UPDATE SET
         can_view=excluded.can_view, can_add=excluded.can_add, can_edit=excluded.can_edit,
         can_delete=excluded.can_delete, can_export=excluded.can_export`
    );
    db.exec("BEGIN");
    try {
      for (const r of rows) {
        stmt.run(r.role, r.module, r.can_view ? 1 : 0, r.can_add ? 1 : 0, r.can_edit ? 1 : 0, r.can_delete ? 1 : 0, r.can_export ? 1 : 0);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    if (meta.user) logAudit(meta.user, "Users & Roles", "Updated permission matrix", DEVICE_NAME);
    return { success: true };
  });

  ipcMain.handle("permissions:resetDefaults", (e, meta = {}) => {
    db.exec("DELETE FROM role_permissions WHERE role IN ('Owner','Manager','Cashier','Waiter','Kitchen Staff','Accountant')");
    const stmt = db.prepare(
      `INSERT INTO role_permissions (role, module, can_view, can_add, can_edit, can_delete, can_export)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    db.exec("BEGIN");
    try {
      for (const [role, defaults] of Object.entries(DEFAULT_PERMISSIONS)) {
        for (const module of MODULES) {
          const overrides = MODULE_OVERRIDES[role]?.[module];
          const perms = overrides ?? defaults;
          stmt.run(role, module, perms[0], perms[1], perms[2], perms[3], perms[4]);
        }
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    if (meta.user) logAudit(meta.user, "Users & Roles", "Reset permissions to defaults", DEVICE_NAME);
    return { success: true };
  });

  // Custom Roles ----------------------------------------------------------
  ipcMain.handle("roles:list", () => {
    const builtIn = Object.keys(DEFAULT_PERMISSIONS).map((name) => ({ id: null, name, isBuiltIn: true }));
    const custom = db.prepare("SELECT * FROM custom_roles").all().map((r) => ({ ...r, isBuiltIn: false }));
    return [...builtIn, ...custom];
  });

  ipcMain.handle("roles:create", (e, name, meta = {}) => {
    db.prepare("INSERT INTO custom_roles (name) VALUES (?)").run(name);
    // Seed permissions for new custom role (default: no access)
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO role_permissions (role, module, can_view, can_add, can_edit, can_delete, can_export)
       VALUES (?, ?, 0, 0, 0, 0, 0)`
    );
    db.exec("BEGIN");
    try {
      for (const module of MODULES) stmt.run(name, module);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    if (meta.user) logAudit(meta.user, "Users & Roles", `Created custom role: ${name}`, DEVICE_NAME);
    return { success: true };
  });

  ipcMain.handle("roles:delete", (e, name, meta = {}) => {
    db.prepare("DELETE FROM custom_roles WHERE name = ?").run(name);
    db.prepare("DELETE FROM role_permissions WHERE role = ?").run(name);
    if (meta.user) logAudit(meta.user, "Users & Roles", `Deleted custom role: ${name}`, DEVICE_NAME);
    return { success: true };
  });

  // Settings -----------------------------------------------------------------
  ipcMain.handle("settings:get", (e, key) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? JSON.parse(row.value) : null;
  });

  ipcMain.handle("settings:set", (e, key, value) => {
    db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(key, JSON.stringify(value));
    return { success: true };
  });

  // Orders (with line items) --------------------------------------------------
  ipcMain.handle("orders:createWithItems", (e, order, items, meta = {}) => {
    const payload = {
      subtotal: 0, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0,
      payment_method: null, payment_details: null, tendered: null, change_due: null,
      refunded_total: 0, order_note: null, created_at: new Date().toISOString(),
      ...order,
    };
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM order_items WHERE order_id = ?").run(payload.id);
      db.prepare(
        `INSERT INTO orders (id, type, table_id, customer, items_count, total, status, waiter, time,
           subtotal, discount_percent, discount_reason, tax, service_charge, payment_method,
           payment_details, tendered, change_due, refunded_total, order_note, created_at)
         VALUES (@id, @type, @table_id, @customer, @items_count, @total, @status, @waiter, @time,
           @subtotal, @discount_percent, @discount_reason, @tax, @service_charge, @payment_method,
           @payment_details, @tendered, @change_due, @refunded_total, @order_note, @created_at)
         ON CONFLICT(id) DO UPDATE SET
           type=excluded.type, table_id=excluded.table_id, customer=excluded.customer,
           items_count=excluded.items_count, total=excluded.total, status=excluded.status,
           waiter=excluded.waiter, time=excluded.time, subtotal=excluded.subtotal,
           discount_percent=excluded.discount_percent, discount_reason=excluded.discount_reason,
           tax=excluded.tax, service_charge=excluded.service_charge, payment_method=excluded.payment_method,
           payment_details=excluded.payment_details, tendered=excluded.tendered, change_due=excluded.change_due,
           order_note=excluded.order_note`
      ).run(payload);
      const stmt = db.prepare(
        `INSERT INTO order_items (order_id, menu_item_id, name, qty, price, notes) VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const it of items) stmt.run(payload.id, it.menu_item_id, it.name, it.qty, it.price, it.notes || "");
      if (payload.table_id) {
        db.prepare("UPDATE tables_floor SET status = 'occupied', order_id = ? WHERE id = ?").run(payload.id, payload.table_id);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    if (meta.user) logAudit(meta.user, "POS Billing", meta.action || `Created order ${payload.id}`, meta.device);
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(payload.id);
  });

  // Sales returns / adjustments -------------------------------------------
  ipcMain.handle("sales:processReturn", (e, orderId, payload, meta = {}) => {
    const { items, reason, restock, kind } = payload;
    const amount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    db.exec("BEGIN");
    try {
      db.prepare(
        `INSERT INTO sales_returns (order_id, kind, items, amount, reason, restock, user, time, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(orderId, kind || "return", JSON.stringify(items), amount, reason || "", restock ? 1 : 0, meta.user || "", time, new Date().toISOString());

      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
      const newRefunded = (order.refunded_total || 0) + amount;
      db.prepare("UPDATE orders SET refunded_total = ? WHERE id = ?").run(newRefunded, orderId);

      if (restock) {
        for (const it of items) {
          if (!it.menu_item_id) continue;
          const recipeRows = db.prepare("SELECT * FROM recipe_ingredients WHERE menu_item_id = ?").all(it.menu_item_id);
          for (const ing of recipeRows) {
            db.prepare("UPDATE inventory_items SET stock = stock + ? WHERE id = ?").run((ing.qty || 0) * it.qty, ing.ingredient_id);
          }
        }
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    if (meta.user) {
      logAudit(meta.user, "Sales", `${kind === "adjustment" ? "Adjusted" : "Returned"} Rs. ${amount} on ${orderId}${restock ? " (restocked)" : ""}`, meta.device);
    }
    return {
      order: db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId),
      return: db.prepare("SELECT * FROM sales_returns WHERE order_id = ? ORDER BY id DESC LIMIT 1").get(orderId),
    };
  });

  ipcMain.handle("orders:updateStatus", (e, id, status, meta = {}) => {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
    if (status === "cancelled" || status === "served") {
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
      if (order?.table_id) {
        db.prepare("UPDATE tables_floor SET status = 'cleaning', order_id = NULL WHERE id = ?").run(order.table_id);
      }
    }
    if (meta.user) logAudit(meta.user, "Order Management", `Marked ${id} as ${status}`, meta.device);
    return db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  });

  // Dashboard aggregates -------------------------------------------------------
  ipcMain.handle("dashboard:summary", () => {
    const todaySales = db.prepare("SELECT COALESCE(SUM(total - COALESCE(refunded_total, 0)),0) as total, COUNT(*) as count FROM orders WHERE status != 'cancelled'").get();
    const lowStockCount = db.prepare("SELECT COUNT(*) as count FROM inventory_items WHERE status IN ('low','critical')").get();
    const expensesTotal = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses").get();
    return {
      todaySales: todaySales.total,
      todayOrders: todaySales.count,
      lowStockCount: lowStockCount.count,
      expensesTotal: expensesTotal.total,
    };
  });

  ipcMain.handle("app:getVersion", () => app.getVersion());
  ipcMain.handle("app:getDeviceName", () => DEVICE_NAME);
  ipcMain.handle("system:getPrinters", async (e) => await e.sender.getPrintersAsync());
}
