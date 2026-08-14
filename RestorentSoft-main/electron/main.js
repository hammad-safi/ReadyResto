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

function postJournal(entries) {
  const ins = db.prepare("INSERT INTO journal_entries (date, reference_type, reference_id, account_code, account_name, debit, credit, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const e of entries) {
    ins.run(e.date, e.reference_type || '', e.reference_id || '', e.account_code, e.account_name || '', Number(e.debit || 0), Number(e.credit || 0), e.description || '', e.created_by || '');
  }
}

function checkAlerts(db) {
  try {
    const prefRow = db.prepare("SELECT value FROM settings WHERE key = 'alert_preferences'").get();
    const prefs = prefRow ? JSON.parse(prefRow.value) : {
      low_stock: true,
      expiry: true,
      payment: false,
      closing: true,
      printer: true,
      threshold: 20
    };

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    // 1. Low Stock
    if (prefs.low_stock) {
      const threshold = prefs.threshold ?? 20;
      const items = db.prepare("SELECT * FROM inventory_items").all();
      for (const item of items) {
        if (Number(item.stock || 0) < threshold) {
          const alertText = `Low Stock: ${item.name} is at ${item.stock} ${item.unit} (Threshold: ${threshold} ${item.unit})`;
          const exists = db.prepare("SELECT id FROM notifications WHERE type = 'low_stock' AND text = ? AND read = 0").get(alertText);
          if (!exists) {
            db.prepare("INSERT INTO notifications (type, text, time, read) VALUES ('low_stock', ?, ?, 0)").run(alertText, time);
          }
        }
      }
    }

    // 2. Expiry Alerts
    if (prefs.expiry) {
      const batches = db.prepare("SELECT * FROM expiry_batches").all();
      for (const batch of batches) {
        if (!batch.expiry_date) continue;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(batch.expiry_date);
        exp.setHours(0, 0, 0, 0);
        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          const alertText = `Expired: Batch ${batch.batch_number || 'N/A'} of ${batch.name} expired on ${batch.expiry_date}.`;
          const exists = db.prepare("SELECT id FROM notifications WHERE type = 'expiry' AND text = ? AND read = 0").get(alertText);
          if (!exists) {
            db.prepare("INSERT INTO notifications (type, text, time, read) VALUES ('expiry', ?, ?, 0)").run(alertText, time);
          }
        } else if (diffDays <= 3) {
          const alertText = `Expiring Soon: Batch ${batch.batch_number || 'N/A'} of ${batch.name} will expire in ${diffDays} days (${batch.expiry_date}).`;
          const exists = db.prepare("SELECT id FROM notifications WHERE type = 'expiry' AND text = ? AND read = 0").get(alertText);
          if (!exists) {
            db.prepare("INSERT INTO notifications (type, text, time, read) VALUES ('expiry', ?, ?, 0)").run(alertText, time);
          }
        }
      }
    }

    // 3. Pending Supplier Payments
    if (prefs.payment) {
      const suppliers = db.prepare("SELECT * FROM suppliers").all();
      for (const supplier of suppliers) {
        const due = Number(supplier.due || 0);
        if (due > 15000) {
          const alertText = `Pending Payment: Balance of Rs. ${due.toLocaleString()} due for ${supplier.name}.`;
          const exists = db.prepare("SELECT id FROM notifications WHERE type = 'payment' AND text = ? AND read = 0").get(alertText);
          if (!exists) {
            db.prepare("INSERT INTO notifications (type, text, time, read) VALUES ('payment', ?, ?, 0)").run(alertText, time);
          }
        }
      }
    }
  } catch (err) {
    console.error("checkAlerts error:", err);
  }
}

function registerIpcHandlers() {
  // Generic CRUD ---------------------------------------------------------
  ipcMain.handle("db:list", (e, table, { orderBy, where } = {}) => {
    assertTable(table);
    if (table === "notifications") {
      checkAlerts(db);
    }
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
    
    db.exec("BEGIN");
    try {
      const cols = Object.keys(data);
      const placeholders = cols.map(() => "?").join(",");
      const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`);
      const result = stmt.run(...cols.map((c) => data[c]));
      
      if (meta.user) logAudit(meta.user, meta.module || table, meta.action || `Created new record in ${table}`, meta.device);
      const idCol = table === "orders" || table === "tables_floor" ? data.id : result.lastInsertRowid;

      if (table === "expenses") {
        const expCode = data.expense_account_code || '5099';
        const payCode = data.payment_account_code || '1001';
        const d = data.date || new Date().toISOString().split('T')[0];
        postJournal([
          { date: d, reference_type: 'Expense', reference_id: String(idCol), account_code: expCode, account_name: 'Expense', debit: Number(data.amount || 0), credit: 0, description: data.notes || '', created_by: meta.user || 'System' },
          { date: d, reference_type: 'Expense', reference_id: String(idCol), account_code: payCode, account_name: 'Payment', debit: 0, credit: Number(data.amount || 0), description: data.notes || '', created_by: meta.user || 'System' }
        ]);
      }

      if (table === "customer_payments") {
        const isCash = (data.payment_method || '').toLowerCase().includes('cash');
        const bankOrCashCode = isCash ? '1001' : '1002';
        const bankOrCashName = isCash ? 'Cash in Drawer' : 'Bank Account (Main)';
        const d = data.date || new Date().toISOString().split('T')[0];
        const amt = Number(data.amount || 0);
        postJournal([
          { date: d, reference_type: 'Customer Payment', reference_id: String(idCol), account_code: bankOrCashCode, account_name: bankOrCashName, debit: amt, credit: 0, description: `Credit payment from ${data.customer_name || 'Customer'} (Ref #${idCol})`, created_by: meta.user || 'System' },
          { date: d, reference_type: 'Customer Payment', reference_id: String(idCol), account_code: '1003', account_name: 'Accounts Receivable', debit: 0, credit: amt, description: `Credit payment from ${data.customer_name || 'Customer'} (Ref #${idCol})`, created_by: meta.user || 'System' }
        ]);
      }

      const row = db.prepare(`SELECT * FROM ${table} WHERE ${table === "orders" || table === "tables_floor" ? "id" : "rowid"} = ?`).get(idCol);
      db.exec("COMMIT");
      return row;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
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

  ipcMain.handle("notifications:markAllRead", () => {
    db.prepare("UPDATE notifications SET read = 1 WHERE read = 0").run();
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

      if (['paid', 'completed', 'served'].includes(payload.status)) {
        const isCash = (payload.payment_method || 'cash').toLowerCase().includes('cash');
        const bankOrCashCode = isCash ? '1001' : '1002';
        const bankOrCashName = isCash ? 'Cash in Drawer' : 'Bank Account (Main)';
        const tot = Number(payload.total || 0);
        const tTax = Number(payload.tax || 0);
        const tSc = Number(payload.service_charge || 0);
        const rev = tot - tTax - tSc;
        const tendered = payload.tendered !== null ? Number(payload.tendered) : tot;
        
        let journalEntries = [];
        const dateNow = new Date().toISOString().split('T')[0];
        
        if (tot > tendered && tendered > 0) {
           journalEntries.push({ date: dateNow, reference_type: 'Order', reference_id: payload.id, account_code: bankOrCashCode, account_name: bankOrCashName, debit: tendered, credit: 0, description: `Partial payment for Order #${payload.id}`, created_by: meta.user });
           journalEntries.push({ date: dateNow, reference_type: 'Order', reference_id: payload.id, account_code: '1003', account_name: 'Accounts Receivable', debit: tot - tendered, credit: 0, description: `Credit for Order #${payload.id}`, created_by: meta.user });
        } else if (tot > tendered && tendered === 0) {
           journalEntries.push({ date: dateNow, reference_type: 'Order', reference_id: payload.id, account_code: '1003', account_name: 'Accounts Receivable', debit: tot, credit: 0, description: `Credit for Order #${payload.id}`, created_by: meta.user });
        } else {
           journalEntries.push({ date: dateNow, reference_type: 'Order', reference_id: payload.id, account_code: bankOrCashCode, account_name: bankOrCashName, debit: tot, credit: 0, description: `Payment for Order #${payload.id}`, created_by: meta.user });
        }

        journalEntries.push({ date: dateNow, reference_type: 'Order', reference_id: payload.id, account_code: '4001', account_name: 'Food Sales Revenue', debit: 0, credit: rev, description: `Revenue from Order #${payload.id}`, created_by: meta.user });
        
        if (tTax > 0) {
            journalEntries.push({ date: dateNow, reference_type: 'Order', reference_id: payload.id, account_code: '2002', account_name: 'GST/Sales Tax Payable', debit: 0, credit: tTax, description: `Tax for Order #${payload.id}`, created_by: meta.user });
        }
        if (tSc > 0) {
            journalEntries.push({ date: dateNow, reference_type: 'Order', reference_id: payload.id, account_code: '2003', account_name: 'Service Charge Payable', debit: 0, credit: tSc, description: `Service Charge for Order #${payload.id}`, created_by: meta.user });
        }
        postJournal(journalEntries);
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

      const dateNow = new Date().toISOString().split('T')[0];
      postJournal([
        { date: dateNow, reference_type: 'Sales Return', reference_id: orderId, account_code: '4001', account_name: 'Food Sales Revenue', debit: amount, credit: 0, description: `Refund for Order #${orderId}`, created_by: meta.user || '' },
        { date: dateNow, reference_type: 'Sales Return', reference_id: orderId, account_code: '1001', account_name: 'Cash in Drawer', debit: 0, credit: amount, description: `Refund for Order #${orderId}`, created_by: meta.user || '' }
      ]);

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

  // Purchases & Returns IPC Handlers
  ipcMain.handle("purchases:processOrder", (e, poData, itemsData, meta = {}) => {
    const poId = poData.id ?? null;
    let existingPo = null;
    if (poId) {
      existingPo = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(poId);
    }
    
    const wasAlreadyReceived = existingPo ? !!existingPo.was_received : false;
    const isNowReceiving = poData.status === "received" && !wasAlreadyReceived;

    let invoiceNum = poData.invoice_number;
    if (!invoiceNum) {
      const count = db.prepare("SELECT COUNT(*) as c FROM purchase_orders").get().c;
      invoiceNum = `INV-${String(count + 1).padStart(5, "0")}`;
    }

    db.exec("BEGIN");
    try {
      let finalPoId = poId;
      if (existingPo) {
        db.prepare(
          `UPDATE purchase_orders 
           SET supplier = ?, date = ?, total = ?, status = ?, was_received = ?, received_at = ?,
               invoice_number = ?, special_note = ?, payment_term = ?, payment_details = ?,
               amount_paid_on_receive = ?, payment_method_on_receive = ?
           WHERE id = ?`
        ).run(
          poData.supplier,
          poData.date || new Date().toISOString().split("T")[0],
          Number(poData.total || 0),
          poData.status || "draft",
          wasAlreadyReceived || isNowReceiving ? 1 : 0,
          isNowReceiving ? new Date().toISOString() : (existingPo.received_at || null),
          invoiceNum || null,
          poData.special_note || null,
          poData.payment_term || "Cash",
          poData.payment_details || null,
          Number(poData.amount_paid_on_receive || 0),
          poData.payment_method_on_receive || "Cash",
          poId
        );
      } else {
        const stmt = db.prepare(
          `INSERT INTO purchase_orders (supplier, date, total, status, was_received, received_at, created_at,
                                       invoice_number, special_note, payment_term, payment_details,
                                       amount_paid_on_receive, payment_method_on_receive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const result = stmt.run(
          poData.supplier,
          poData.date || new Date().toISOString().split("T")[0],
          Number(poData.total || 0),
          poData.status || "draft",
          isNowReceiving ? 1 : 0,
          isNowReceiving ? new Date().toISOString() : null,
          new Date().toISOString(),
          invoiceNum || null,
          poData.special_note || null,
          poData.payment_term || "Cash",
          poData.payment_details || null,
          Number(poData.amount_paid_on_receive || 0),
          poData.payment_method_on_receive || "Cash"
        );
        finalPoId = result.lastInsertRowid;
      }

      // Save items
      db.prepare("DELETE FROM purchase_order_items WHERE po_id = ?").run(finalPoId);
      const insertItemStmt = db.prepare(
        `INSERT INTO purchase_order_items (po_id, inventory_item_id, name, unit, qty, cost, returned_qty)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const it of itemsData) {
        insertItemStmt.run(
          finalPoId,
          it.inventory_item_id,
          it.name,
          it.unit,
          Number(it.qty || 0),
          Number(it.cost || 0),
          Number(it.returned_qty || 0)
        );
      }

      // If transitioning to Received, update inventory stock and supplier due balance
      if (isNowReceiving) {
        for (const item of itemsData) {
          if (!item.inventory_item_id) continue;
          
          // Get current stock
          const inv = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(item.inventory_item_id);
          if (inv) {
            const addQty = Number(item.qty || 0);
            const newStock = Number(inv.stock || 0) + addQty;
            const newCost = Number(item.cost || 0) > 0 ? Number(item.cost) : Number(inv.cost || 0);
            const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
            db.prepare(
              `UPDATE inventory_items SET stock = ?, cost = ?, status = ?, updated_at = ? WHERE id = ?`
            ).run(newStock, newCost, newStatus, new Date().toISOString(), item.inventory_item_id);

            // Log entry in inventory_transactions
            db.prepare(
              `INSERT INTO inventory_transactions (ingredient_id, name, type, qty, unit, warehouse, batch_number, reference_number, date, reason, notes, user)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              inv.id,
              inv.name,
              "Purchase Receipt",
              addQty,
              inv.unit,
              inv.warehouse || "Main Kitchen Store",
              invoiceNum || "",
              `PO-${finalPoId}`,
              poData.date || new Date().toISOString().split("T")[0],
              "Purchase Receipt",
              `Received PO #${finalPoId} from ${poData.supplier || "Unknown"}. Invoice: ${invoiceNum || "-"}`,
              meta.user || "System"
            );
          }
        }

        // Update supplier due balance (only add the unpaid amount)
        if (poData.supplier) {
          const supplierRow = db.prepare("SELECT * FROM suppliers WHERE name = ?").get(poData.supplier);
          if (supplierRow) {
            const addDue = Number(poData.total || 0) - Number(poData.amount_paid_on_receive || 0);
            if (addDue > 0) {
              const newDue = Number(supplierRow.due || 0) + addDue;
              db.prepare("UPDATE suppliers SET due = ? WHERE id = ?").run(newDue, supplierRow.id);
            }
          }
        }

        // Log in Audit Log
        const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        db.prepare(
          `INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)`
        ).run(
          time,
          meta.user || "System",
          "Purchases",
          `Received PO #${finalPoId} from ${poData.supplier} (Rs. ${poData.total.toLocaleString()})`,
          meta.device || DEVICE_NAME
        );
        
        const dateNow = new Date().toISOString().split('T')[0];
        const tot = Number(poData.total || 0);
        const paid = Number(poData.amount_paid_on_receive || 0);
        const isCash = (poData.payment_method_on_receive || '').toLowerCase().includes('cash');
        const bankOrCashCode = isCash ? '1001' : '1002';
        const bankOrCashName = isCash ? 'Cash in Drawer' : 'Bank Account (Main)';
        
        let journalEntries = [
          { date: dateNow, reference_type: 'Purchase', reference_id: finalPoId, account_code: '5001', account_name: 'Cost of Goods Sold', debit: tot, credit: 0, description: `PO #${finalPoId}`, created_by: meta.user || '' }
        ];
        
        if (paid > 0) {
          journalEntries.push({ date: dateNow, reference_type: 'Purchase', reference_id: finalPoId, account_code: bankOrCashCode, account_name: bankOrCashName, debit: 0, credit: paid, description: `Payment for PO #${finalPoId}`, created_by: meta.user || '' });
        }
        
        if (tot - paid > 0) {
          journalEntries.push({ date: dateNow, reference_type: 'Purchase', reference_id: finalPoId, account_code: '2001', account_name: 'Accounts Payable', debit: 0, credit: tot - paid, description: `Payable for PO #${finalPoId}`, created_by: meta.user || '' });
        }
        
        postJournal(journalEntries);
      }

      db.exec("COMMIT");
      return db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(finalPoId);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  });

  ipcMain.handle("purchases:returnOrder", (e, poId, returnData, meta = {}) => {
    const po = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(poId);
    if (!po) throw new Error("Purchase order not found");

    const { itemsToReturn, reason, refundMode } = returnData;
    let totalReturnAmount = 0;

    db.exec("BEGIN");
    try {
      // Process each return item
      for (const ret of itemsToReturn) {
        const returnQty = Number(ret.qty || 0);
        if (returnQty <= 0) continue;
        const lineAmount = returnQty * Number(ret.cost || 0);
        totalReturnAmount += lineAmount;

        // Deduct returned qty from inventory stock
        const inv = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(ret.inventory_item_id);
        if (inv) {
          const newStock = Math.max(0, Number(inv.stock || 0) - returnQty);
          const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
          db.prepare(
            `UPDATE inventory_items SET stock = ?, status = ?, updated_at = ? WHERE id = ?`
          ).run(newStock, newStatus, new Date().toISOString(), ret.inventory_item_id);

          // Log return transaction
          db.prepare(
            `INSERT INTO inventory_transactions (ingredient_id, name, type, qty, unit, warehouse, batch_number, reference_number, date, reason, notes, user)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            inv.id,
            inv.name,
            "Stock Out",
            returnQty,
            inv.unit,
            inv.warehouse || "Main Kitchen Store",
            "",
            `RET-PO-${poId}`,
            new Date().toISOString().split("T")[0],
            "Purchase Return",
            `Purchase Return for PO #${poId}. Reason: ${reason || "Supplier Return"}`,
            meta.user || "System"
          );
        }

        // Update purchase_order_items returned_qty
        db.prepare(
          `UPDATE purchase_order_items 
           SET returned_qty = COALESCE(returned_qty, 0) + ? 
           WHERE po_id = ? AND inventory_item_id = ?`
        ).run(returnQty, poId, ret.inventory_item_id);
      }

      // Deduct return amount from supplier due balance (if credit note / deduct due)
      if (po.supplier && totalReturnAmount > 0 && refundMode !== "Cash Refund") {
        const supplierRow = db.prepare("SELECT * FROM suppliers WHERE name = ?").get(po.supplier);
        if (supplierRow) {
          const newDue = Math.max(0, Number(supplierRow.due || 0) - totalReturnAmount);
          db.prepare("UPDATE suppliers SET due = ? WHERE id = ?").run(newDue, supplierRow.id);
        }
      }

      // Check if PO is fully or partially returned
      const allPoItems = db.prepare("SELECT * FROM purchase_order_items WHERE po_id = ?").all(poId);
      const isFullyReturned = allPoItems.length > 0 && allPoItems.every(it => Number(it.returned_qty || 0) >= Number(it.qty || 0));

      const updatedStatus = isFullyReturned ? "returned" : "partially_returned";
      const newReturnedAmount = Number(po.returned_amount || 0) + totalReturnAmount;

      db.prepare(
        `UPDATE purchase_orders SET status = ?, returned_amount = ? WHERE id = ?`
      ).run(updatedStatus, newReturnedAmount, poId);

      // Save return log
      db.prepare(
        `INSERT INTO purchase_returns (po_id, supplier, total_amount, reason, refund_mode, items, time, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        poId,
        po.supplier,
        totalReturnAmount,
        reason || "Returned to supplier",
        refundMode || "Deduct Supplier Due",
        JSON.stringify(itemsToReturn),
        new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        new Date().toISOString()
      );

      // Audit log
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      db.prepare(
        `INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)`
      ).run(
        time,
        meta.user || "System",
        "Purchases",
        `Purchase Return for PO #${poId} (Amount: Rs. ${totalReturnAmount.toLocaleString()})`,
        meta.device || DEVICE_NAME
      );

      if (totalReturnAmount > 0) {
        const isCash = refundMode === "Cash Refund";
        const bankOrCashCode = isCash ? '1001' : '2001';
        const bankOrCashName = isCash ? 'Cash in Drawer' : 'Accounts Payable';
        const dateNow = new Date().toISOString().split('T')[0];
        postJournal([
          { date: dateNow, reference_type: 'Purchase Return', reference_id: String(poId), account_code: bankOrCashCode, account_name: bankOrCashName, debit: totalReturnAmount, credit: 0, description: `Return for PO #${poId} (${reason || 'Supplier Return'})`, created_by: meta.user || '' },
          { date: dateNow, reference_type: 'Purchase Return', reference_id: String(poId), account_code: '5001', account_name: 'Cost of Goods Sold', debit: 0, credit: totalReturnAmount, description: `Return for PO #${poId} (${reason || 'Supplier Return'})`, created_by: meta.user || '' }
        ]);
      }

      db.exec("COMMIT");
      return db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(poId);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  });

  ipcMain.handle("purchases:deleteOrder", (e, poId, meta = {}) => {
    const po = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(poId);
    if (!po) throw new Error("Purchase order not found");

    db.exec("BEGIN");
    try {
      // If received, reverse stock additions and supplier dues
      if (po.was_received || po.status === "received") {
        const poItems = db.prepare("SELECT * FROM purchase_order_items WHERE po_id = ?").all(poId);
        
        for (const item of poItems) {
          if (!item.inventory_item_id) continue;
          const netReceivedQty = Number(item.qty || 0) - Number(item.returned_qty || 0);
          
          const inv = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(item.inventory_item_id);
          if (inv) {
            const newStock = Math.max(0, Number(inv.stock || 0) - netReceivedQty);
            const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
            db.prepare(
              `UPDATE inventory_items SET stock = ?, status = ?, updated_at = ? WHERE id = ?`
            ).run(newStock, newStatus, new Date().toISOString(), item.inventory_item_id);

            // Log PO deletion transaction
            db.prepare(
              `INSERT INTO inventory_transactions (ingredient_id, name, type, qty, unit, warehouse, batch_number, reference_number, date, reason, notes, user)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              inv.id,
              inv.name,
              "Stock Out",
              netReceivedQty,
              inv.unit,
              inv.warehouse || "Main Kitchen Store",
              "",
              `DEL-PO-${poId}`,
              new Date().toISOString().split("T")[0],
              "PO Deleted Reversal",
              `Purchase Order PO #${poId} was DELETED. Stock reversed.`,
              meta.user || "System"
            );
          }
        }

        // Reverse supplier due balance (only deduct unpaid amount)
        const netDueAdjustment = Number(po.total || 0) - Number(po.amount_paid_on_receive || 0) - Number(po.returned_amount || 0);
        if (po.supplier && netDueAdjustment > 0) {
          const supplierRow = db.prepare("SELECT * FROM suppliers WHERE name = ?").get(po.supplier);
          if (supplierRow) {
            const newDue = Math.max(0, Number(supplierRow.due || 0) - netDueAdjustment);
            db.prepare("UPDATE suppliers SET due = ? WHERE id = ?").run(newDue, supplierRow.id);
          }
        }
      }

      // Remove PO and items
      db.prepare("DELETE FROM purchase_orders WHERE id = ?").run(poId);
      db.prepare("DELETE FROM purchase_order_items WHERE po_id = ?").run(poId);
      
      // Audit Log
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      db.prepare(
        `INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)`
      ).run(
        time,
        meta.user || "System",
        "Purchases",
        `Deleted PO #${poId} (Stock & dues adjusted)`,
        meta.device || DEVICE_NAME
      );

      db.exec("COMMIT");
      return { success: true, id: poId };
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  });

  ipcMain.handle("suppliers:paySupplier", (e, supplierId, data, meta = {}) => {
    const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(supplierId);
    if (!supplier) throw new Error("Supplier not found");

    const amount = Number(data.amount || 0);
    if (amount <= 0) throw new Error("Payment amount must be greater than zero");

    db.exec("BEGIN");
    try {
      const newDue = Math.max(0, Number(supplier.due || 0) - amount);
      db.prepare("UPDATE suppliers SET due = ? WHERE id = ?").run(newDue, supplierId);

      // Record supplier payment
      db.prepare(
        `INSERT INTO supplier_payments (supplier_id, supplier_name, amount, payment_method, notes, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        supplierId,
        supplier.name,
        amount,
        data.payment_method || "Cash",
        data.notes || "",
        data.date || new Date().toISOString().split("T")[0],
        new Date().toISOString()
      );

      // Audit log
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      db.prepare(
        `INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)`
      ).run(
        time,
        meta.user || "System",
        "Suppliers",
        `Recorded payment of Rs. ${amount.toLocaleString()} to supplier ${supplier.name}`,
        meta.device || DEVICE_NAME
      );

      const dateNow = data.date || new Date().toISOString().split('T')[0];
      const isCash = (data.payment_method || '').toLowerCase().includes('cash');
      const bankOrCashCode = isCash ? '1001' : '1002';
      const bankOrCashName = isCash ? 'Cash in Drawer' : 'Bank Account (Main)';
      
      postJournal([
        { date: dateNow, reference_type: 'Supplier Payment', reference_id: supplierId, account_code: '2001', account_name: 'Accounts Payable', debit: amount, credit: 0, description: `Payment to ${supplier.name}`, created_by: meta.user || '' },
        { date: dateNow, reference_type: 'Supplier Payment', reference_id: supplierId, account_code: bankOrCashCode, account_name: bankOrCashName, debit: 0, credit: amount, description: `Payment to ${supplier.name}`, created_by: meta.user || '' }
      ]);

      db.exec("COMMIT");
      return db.prepare("SELECT * FROM suppliers WHERE id = ?").get(supplierId);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  });

  // Dashboard aggregates -------------------------------------------------------
  ipcMain.handle("dashboard:summary", () => {
    const todaySales = db.prepare("SELECT COALESCE(SUM(total - COALESCE(refunded_total, 0)),0) as total, COUNT(*) as count FROM orders WHERE status != 'cancelled' AND date(created_at) = date('now','localtime')").get();
    const lowStockCount = db.prepare("SELECT COUNT(*) as count FROM inventory_items WHERE status IN ('low','critical')").get();
    const expensesTotal = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE date = date('now','localtime')").get();
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

  // Inventory Custom Actions
  ipcMain.handle("inventory:addTransaction", (e, tx) => {
    db.exec("BEGIN");
    try {
      const item = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(tx.ingredient_id);
      let finalTx = { ...tx, date: tx.date || new Date().toISOString().split("T")[0] };
      if (item) {
        const adjustQty = Number(tx.qty);
        let newStock = Number(item.stock || 0);
        if (tx.type === "Stock In" || tx.type === "Purchase Receipt") {
          newStock += adjustQty;
        } else if (tx.type === "Stock Out" || tx.type === "Wastage") {
          newStock -= adjustQty;
        } else if (tx.type === "Manual Adjustment") {
          newStock = adjustQty;
        }
        const newStatus = newStock <= 0 ? "critical" : newStock <= (item.reorder || 10) ? "low" : "in_stock";
        db.prepare("UPDATE inventory_items SET stock = ?, status = ?, updated_at = ? WHERE id = ?")
          .run(newStock, newStatus, new Date().toISOString(), item.id);
        
        finalTx.name = item.name;
        finalTx.unit = item.unit;
      }
      
      const cols = ["ingredient_id", "name", "type", "qty", "unit", "warehouse", "batch_number", "reference_number", "date", "reason", "notes", "user"];
      const placeholders = cols.map(() => "?").join(",");
      const stmt = db.prepare(`INSERT INTO inventory_transactions (${cols.join(",")}) VALUES (${placeholders})`);
      const result = stmt.run(...cols.map(c => finalTx[c] ?? null));
      
      db.exec("COMMIT");
      return db.prepare("SELECT * FROM inventory_transactions WHERE id = ?").get(result.lastInsertRowid);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  });

  ipcMain.handle("inventory:submitPhysicalCount", (e, count) => {
    const items = typeof count.items === "string" ? JSON.parse(count.items) : count.items;
    db.exec("BEGIN");
    try {
      const stmt = db.prepare(
        `INSERT INTO physical_counts (date, status, approved_by, notes, items) VALUES (?, ?, ?, ?, ?)`
      );
      const result = stmt.run(
        count.date || new Date().toISOString().split("T")[0],
        count.status || "draft",
        count.approved_by || "Manager",
        count.notes || "",
        JSON.stringify(items)
      );
      const countId = result.lastInsertRowid;

      if (count.status === "completed") {
        for (const it of items) {
          if (Number(it.diff) !== 0) {
            const invItem = db.prepare("SELECT * FROM inventory_items WHERE name = ?").get(it.name);
            if (invItem) {
              const oldStock = Number(invItem.stock || 0);
              const newStock = Number(it.counted_qty);
              const newStatus = newStock <= 0 ? "critical" : newStock <= (invItem.reorder || 10) ? "low" : "in_stock";
              db.prepare("UPDATE inventory_items SET stock = ?, status = ?, updated_at = ? WHERE id = ?")
                .run(newStock, newStatus, new Date().toISOString(), invItem.id);

              // Add entry in inventory_transactions
              db.prepare(
                `INSERT INTO inventory_transactions (ingredient_id, name, type, qty, unit, warehouse, batch_number, reference_number, date, reason, notes, user)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).run(
                invItem.id,
                invItem.name,
                "Manual Adjustment",
                newStock,
                invItem.unit,
                it.warehouse || "Main Kitchen Store",
                "",
                `AUDIT-${countId}`,
                count.date || new Date().toISOString().split("T")[0],
                it.reason || "Physical Audit Adjustment",
                `Counted: ${it.counted_qty} (System: ${oldStock}). Notes: ${it.notes || ""}`,
                count.approved_by
              );
            }
          }
        }
      }
      db.exec("COMMIT");
      return db.prepare("SELECT * FROM physical_counts WHERE id = ?").get(countId);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  });

  ipcMain.handle("inventory:addExpiryBatch", (e, batch) => {
    const expiryDate = batch.expiry_date;
    let status = "Safe";
    if (expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffTime = exp - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        status = "Expired";
      } else if (diffDays <= 7) {
        status = "Expiring Soon";
      }
    }
    const cols = ["name", "batch_number", "supplier", "purchase_date", "expiry_date", "qty", "unit", "warehouse", "status"];
    const placeholders = cols.map(() => "?").join(",");
    const stmt = db.prepare(`INSERT INTO expiry_batches (${cols.join(",")}) VALUES (${placeholders})`);
    const result = stmt.run(
      batch.name,
      batch.batch_number || "",
      batch.supplier || "",
      batch.purchase_date || new Date().toISOString().split("T")[0],
      batch.expiry_date,
      Number(batch.qty || 0),
      batch.unit || "kg",
      batch.warehouse || "Main Kitchen Store",
      status
    );
    return db.prepare("SELECT * FROM expiry_batches WHERE id = ?").get(result.lastInsertRowid);
  });

  // Accounts CRUD
  ipcMain.handle("accounts:list", async () => {
    return db.prepare("SELECT * FROM accounts WHERE is_active = 1 ORDER BY code").all();
  });

  ipcMain.handle("accounts:create", async (evt, data) => {
    const { code, name, type, parent_code, description } = data;
    db.prepare("INSERT INTO accounts (code, name, type, parent_code, description) VALUES (?, ?, ?, ?, ?)")
      .run(code, name, type, parent_code || null, description || null);
    return { success: true };
  });

  ipcMain.handle("accounts:update", async (evt, id, data) => {
    const { name, type, parent_code, description, is_active } = data;
    db.prepare("UPDATE accounts SET name=?, type=?, parent_code=?, description=?, is_active=? WHERE id=? AND is_system=0")
      .run(name, type, parent_code || null, description || null, is_active ?? 1, id);
    return { success: true };
  });

  ipcMain.handle("accounts:delete", async (evt, id) => {
    db.prepare("UPDATE accounts SET is_active = 0 WHERE id = ? AND is_system = 0").run(id);
    return { success: true };
  });

  // Journal Entries
  ipcMain.handle("journal:post", async (evt, entries) => {
    const totalDebit = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + Number(e.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal entry not balanced: Debit ${totalDebit} != Credit ${totalCredit}`);
    }
    const ins = db.prepare("INSERT INTO journal_entries (date, reference_type, reference_id, account_code, account_name, debit, credit, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    db.exec("BEGIN");
    try {
      for (const e of entries) {
        ins.run(e.date, e.reference_type, e.reference_id, e.account_code, e.account_name || '', Number(e.debit || 0), Number(e.credit || 0), e.description || '', e.created_by || '');
      }
      db.exec("COMMIT");
    } catch(err) {
      db.exec("ROLLBACK");
      throw err;
    }
    return { success: true };
  });

  ipcMain.handle("journal:list", async (evt, filters) => {
    let sql = "SELECT * FROM journal_entries WHERE 1=1";
    const params = [];
    if (filters?.startDate) { sql += " AND date >= ?"; params.push(filters.startDate); }
    if (filters?.endDate) { sql += " AND date <= ?"; params.push(filters.endDate); }
    if (filters?.reference_type) { sql += " AND reference_type = ?"; params.push(filters.reference_type); }
    if (filters?.account_code) { sql += " AND account_code = ?"; params.push(filters.account_code); }
    sql += " ORDER BY date DESC, id DESC";
    return db.prepare(sql).all(...params);
  });

  ipcMain.handle("journal:getAccountLedger", async (evt, accountCode, startDate, endDate) => {
    let sql = "SELECT * FROM journal_entries WHERE account_code = ?";
    const params = [accountCode];
    if (startDate) { sql += " AND date >= ?"; params.push(startDate); }
    if (endDate) { sql += " AND date <= ?"; params.push(endDate); }
    sql += " ORDER BY date ASC, id ASC";
    return db.prepare(sql).all(...params);
  });

  // Bank Accounts
  ipcMain.handle("bank:list", async () => {
    return db.prepare("SELECT * FROM bank_accounts WHERE is_active = 1 ORDER BY name").all();
  });

  ipcMain.handle("bank:create", async (evt, data) => {
    const { name, bank_name, account_number, account_code, balance } = data;
    db.prepare("INSERT INTO bank_accounts (name, bank_name, account_number, account_code, balance) VALUES (?, ?, ?, ?, ?)")
      .run(name, bank_name || '', account_number || '', account_code || '1002', Number(balance || 0));
    return { success: true };
  });

  ipcMain.handle("bank:update", async (evt, id, data) => {
    const { name, bank_name, account_number, balance } = data;
    db.prepare("UPDATE bank_accounts SET name=?, bank_name=?, account_number=?, balance=? WHERE id=?")
      .run(name, bank_name || '', account_number || '', Number(balance || 0), id);
    return { success: true };
  });

  ipcMain.handle("bank:transfer", async (evt, data) => {
    const { from_account, to_account, amount, description } = data;
    db.exec("BEGIN");
    try {
      const d = new Date().toISOString().split('T')[0];
      postJournal([
        { date: d, reference_type: 'Transfer', reference_id: '', account_code: to_account, account_name: 'Bank Account', debit: Number(amount), credit: 0, description: description || 'Bank Transfer', created_by: 'System' },
        { date: d, reference_type: 'Transfer', reference_id: '', account_code: from_account, account_name: 'Bank Account', debit: 0, credit: Number(amount), description: description || 'Bank Transfer', created_by: 'System' }
      ]);
      db.exec("COMMIT");
    } catch(err) {
      db.exec("ROLLBACK");
      throw err;
    }
    return { success: true };
  });

  // Customer Payments
  ipcMain.handle("customer:recordPayment", async (evt, data) => {
    const { customer_id, customer_name, amount, payment_method, bank_account_id, notes, date: payDate } = data;
    db.exec("BEGIN");
    try {
      db.prepare("INSERT INTO customer_payments (customer_id, customer_name, amount, payment_method, bank_account_id, notes, date) VALUES (?,?,?,?,?,?,?)")
        .run(customer_id, customer_name, Number(amount), payment_method, bank_account_id || null, notes || '', payDate || new Date().toISOString().split('T')[0]);
      db.prepare("UPDATE customers SET credit = MAX(0, credit - ?), total_paid = total_paid + ? WHERE id = ?")
        .run(Number(amount), Number(amount), customer_id);
      
      const d = payDate || new Date().toISOString().split('T')[0];
      const creditAccount = (payment_method || '').toLowerCase().includes('cash') ? '1001' : '1002';
      const creditName = creditAccount === '1001' ? 'Cash in Drawer' : 'Bank Account';
      const journalIns = db.prepare("INSERT INTO journal_entries (date, reference_type, reference_id, account_code, account_name, debit, credit, description, created_by) VALUES (?,?,?,?,?,?,?,?,?)");
      journalIns.run(d, 'customer_payment', String(customer_id), creditAccount, creditName, Number(amount), 0, `Payment from ${customer_name}`, '');
      journalIns.run(d, 'customer_payment', String(customer_id), '1003', 'Accounts Receivable', 0, Number(amount), `Payment from ${customer_name}`, '');

      db.exec("COMMIT");
    } catch(err) {
      db.exec("ROLLBACK");
      throw err;
    }
    return { success: true };
  });

  // Cashier Shifts
  ipcMain.handle("shift:open", async (evt, data) => {
    const { cashier_id, cashier_name, opening_cash } = data;
    db.prepare("UPDATE cashier_shifts SET status = 'closed', closed_at = datetime('now','localtime') WHERE cashier_id = ? AND status = 'open'").run(cashier_id);
    const result = db.prepare("INSERT INTO cashier_shifts (cashier_id, cashier_name, opened_at, opening_cash, status) VALUES (?, ?, datetime('now','localtime'), ?, 'open')")
      .run(cashier_id, cashier_name, Number(opening_cash || 0));
    return { success: true, shiftId: result.lastInsertRowid };
  });

  ipcMain.handle("shift:getCurrent", async (evt, cashierId) => {
    return db.prepare("SELECT * FROM cashier_shifts WHERE cashier_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1").get(cashierId) || null;
  });

  ipcMain.handle("shift:close", async (evt, shiftId, data) => {
    const { actual_cash, notes } = data;
    const shift = db.prepare("SELECT * FROM cashier_shifts WHERE id = ?").get(shiftId);
    if (!shift) throw new Error('Shift not found');
    
    const shiftOrders = db.prepare("SELECT * FROM orders WHERE shift_id = ? AND status != 'cancelled'").all(shiftId);
    let cashSales = 0, cardSales = 0, onlineSales = 0;
    for (const o of shiftOrders) {
      const net = Number(o.total || 0) - Number(o.refunded_total || 0);
      const pm = (o.payment_method || '').toLowerCase();
      if (pm.includes('cash')) cashSales += net;
      else if (pm.includes('card')) cardSales += net;
      else onlineSales += net;
    }
    const totalSales = cashSales + cardSales + onlineSales;
    
    const cashExpenses = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE payment_account = 'Cash in Drawer' AND datetime(date) >= ? AND datetime(date) <= datetime('now','localtime')").get(shift.opened_at)?.t || 0;
    const cashSupplierPay = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM supplier_payments WHERE payment_method = 'Cash' AND datetime(created_at) >= ? AND datetime(created_at) <= datetime('now','localtime')").get(shift.opened_at)?.t || 0;
    
    const expectedCash = Number(shift.opening_cash) + cashSales - cashExpenses - cashSupplierPay;
    const variance = Number(actual_cash || 0) - expectedCash;
    
    db.prepare("UPDATE cashier_shifts SET closed_at = datetime('now','localtime'), expected_cash=?, actual_cash=?, variance=?, cash_sales=?, card_sales=?, online_sales=?, total_sales=?, cash_expenses=?, cash_supplier_payments=?, status='closed', notes=? WHERE id=?")
      .run(expectedCash, Number(actual_cash || 0), variance, cashSales, cardSales, onlineSales, totalSales, cashExpenses, cashSupplierPay, notes || '', shiftId);
    
    if (Math.abs(variance) > 0.01) {
      const d = new Date().toISOString().split('T')[0];
      const journalIns = db.prepare("INSERT INTO journal_entries (date, reference_type, reference_id, account_code, account_name, debit, credit, description, created_by) VALUES (?,?,?,?,?,?,?,?,?)");
      if (variance < 0) {
        journalIns.run(d, 'shift_close', String(shiftId), '5099', 'Miscellaneous', Math.abs(variance), 0, 'Cash shortage on shift close', shift.cashier_name);
        journalIns.run(d, 'shift_close', String(shiftId), '1001', 'Cash in Drawer', 0, Math.abs(variance), 'Cash shortage on shift close', shift.cashier_name);
      } else {
        journalIns.run(d, 'shift_close', String(shiftId), '1001', 'Cash in Drawer', variance, 0, 'Cash overage on shift close', shift.cashier_name);
        journalIns.run(d, 'shift_close', String(shiftId), '4004', 'Other Income', 0, variance, 'Cash overage on shift close', shift.cashier_name);
      }
    }
    return { success: true, expectedCash, actual_cash: Number(actual_cash), variance };
  });

  ipcMain.handle("shift:list", async (evt, filters) => {
    let sql = "SELECT * FROM cashier_shifts WHERE 1=1";
    const params = [];
    if (filters?.cashier_id) { sql += " AND cashier_id = ?"; params.push(filters.cashier_id); }
    if (filters?.status) { sql += " AND status = ?"; params.push(filters.status); }
    sql += " ORDER BY id DESC LIMIT 100";
    return db.prepare(sql).all(...params);
  });

  // Financial Statements
  ipcMain.handle("accounting:profitLoss", async (evt, startDate, endDate) => {
    const revenue = db.prepare("SELECT account_code, account_name, COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as amount FROM journal_entries WHERE account_code LIKE '4%' AND date >= ? AND date <= ? GROUP BY account_code, account_name").all(startDate, endDate);
    const cogs = db.prepare("SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as amount FROM journal_entries WHERE account_code = '5001' AND date >= ? AND date <= ?").get(startDate, endDate);
    const expenses = db.prepare("SELECT account_code, account_name, COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as amount FROM journal_entries WHERE account_code LIKE '5%' AND account_code != '5001' AND date >= ? AND date <= ? GROUP BY account_code, account_name").all(startDate, endDate);
    
    const totalRevenue = revenue.reduce((s, r) => s + Number(r.amount), 0);
    const totalCOGS = Number(cogs?.amount || 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = grossProfit - totalExpenses;
    
    return { revenue, cogs: totalCOGS, grossProfit, expenses, totalExpenses, netProfit, totalRevenue };
  });

  ipcMain.handle("accounting:balanceSheet", async (evt, asOfDate) => {
    const assets = db.prepare("SELECT account_code, account_name, COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as balance FROM journal_entries WHERE account_code LIKE '1%' AND date <= ? GROUP BY account_code, account_name").all(asOfDate);
    const liabilities = db.prepare("SELECT account_code, account_name, COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as balance FROM journal_entries WHERE account_code LIKE '2%' AND date <= ? GROUP BY account_code, account_name").all(asOfDate);
    const equity = db.prepare("SELECT account_code, account_name, COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as balance FROM journal_entries WHERE account_code LIKE '3%' AND date <= ? GROUP BY account_code, account_name").all(asOfDate);
    
    const netIncome = db.prepare("SELECT (COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit - debit ELSE 0 END),0) - COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit - credit ELSE 0 END),0)) as amount FROM journal_entries WHERE date <= ?").get(asOfDate);
    
    const totalAssets = assets.reduce((s, a) => s + Number(a.balance), 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.balance), 0);
    const totalEquity = equity.reduce((s, e) => s + Number(e.balance), 0) + Number(netIncome?.amount || 0);
    
    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, retainedEarnings: Number(netIncome?.amount || 0) };
  });

  ipcMain.handle("accounting:trialBalance", async (evt, startDate, endDate) => {
    return db.prepare("SELECT account_code, account_name, COALESCE(SUM(debit),0) as total_debit, COALESCE(SUM(credit),0) as total_credit FROM journal_entries WHERE date >= ? AND date <= ? GROUP BY account_code, account_name ORDER BY account_code").all(startDate, endDate);
  });

  ipcMain.handle("accounting:cashFlow", async (evt, startDate, endDate) => {
    const operating = db.prepare("SELECT reference_type, COALESCE(SUM(debit),0) as inflow, COALESCE(SUM(credit),0) as outflow FROM journal_entries WHERE account_code = '1001' AND date >= ? AND date <= ? GROUP BY reference_type").all(startDate, endDate);
    const banking = db.prepare("SELECT reference_type, COALESCE(SUM(debit),0) as inflow, COALESCE(SUM(credit),0) as outflow FROM journal_entries WHERE account_code LIKE '1002%' AND date >= ? AND date <= ? GROUP BY reference_type").all(startDate, endDate);
    return { operating, banking };
  });
}
