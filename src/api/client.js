import * as mock from "../data/mockData";

const STORAGE_KEY = "dastarkhwan-erp-store-v1";
const SETTINGS_STORAGE_KEY = "dastarkhwan-erp-settings-v1";

const MODULES = [
  "Dashboard", "POS Billing", "Sales", "Kitchen Display", "Table Management",
  "Order Management", "Menu Management", "Recipe Management", "Inventory",
  "Suppliers", "Purchases", "Customers", "Employees", "Users & Roles",
  "Expenses", "Accounting", "Reports", "Notifications", "Printing",
  "Backup & Restore", "Audit Log", "Hardware", "Settings",
];

const DEFAULT_PERMISSIONS = {
  Owner: { can_view: 1, can_add: 1, can_edit: 1, can_delete: 1, can_export: 1 },
  Manager: { can_view: 1, can_add: 1, can_edit: 1, can_delete: 0, can_export: 1 },
  Cashier: { can_view: 1, can_add: 1, can_edit: 1, can_delete: 0, can_export: 0 },
  Waiter: { can_view: 1, can_add: 1, can_edit: 1, can_delete: 0, can_export: 0 },
  "Kitchen Staff": { can_view: 1, can_add: 0, can_edit: 1, can_delete: 0, can_export: 0 },
  Accountant: { can_view: 1, can_add: 0, can_edit: 0, can_delete: 0, can_export: 1 },
};

const ROLE_MODULE_ALLOWLIST = {
  Owner: MODULES,
  Manager: [
    "Dashboard", "POS Billing", "Sales", "Kitchen Display", "Table Management", "Order Management",
    "Menu Management", "Inventory", "Suppliers", "Purchases", "Customers", "Employees",
    "Expenses", "Accounting", "Reports", "Notifications", "Printing", "Settings",
  ],
  Cashier: [
    "Dashboard", "POS Billing", "Sales", "Kitchen Display", "Table Management", "Order Management",
    "Customers", "Employees", "Notifications",
  ],
  Waiter: [
    "Dashboard", "POS Billing", "Sales", "Kitchen Display", "Table Management", "Order Management",
    "Customers", "Notifications",
  ],
  "Kitchen Staff": [
    "Dashboard", "Kitchen Display", "Order Management", "Notifications",
  ],
  Accountant: [
    "Dashboard", "Sales", "Expenses", "Accounting", "Reports", "Notifications",
  ],
};

const buildInitialPermissions = () => {
  const rows = [];
  for (const [role, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const module of MODULES) {
      const allowed = ROLE_MODULE_ALLOWLIST[role]?.includes(module) ?? false;
      const row = {
        role,
        module,
        can_view: allowed ? Number(Boolean(perms.can_view)) : 0,
        can_add: allowed ? Number(Boolean(perms.can_add)) : 0,
        can_edit: allowed ? Number(Boolean(perms.can_edit)) : 0,
        can_delete: allowed ? Number(Boolean(perms.can_delete)) : 0,
        can_export: allowed ? Number(Boolean(perms.can_export)) : 0,
      };
      rows.push(row);
    }
  }
  return rows;
};

const buildInitialStore = () => {
  const initialStore = {
    users: [
      { id: 1, employee_id: 1, name: "Hammadullah", role: "Owner", pin: "1234", password: "owner123", email: "owner@dastarkhwan.pk", phone: "0300-0000001", branch: "Main Branch", status: "active", last_login: "Today, 9:02 AM", profile_photo: null },
      { id: 2, employee_id: 2, name: "Bilal Hussain", role: "Cashier", pin: "2345", password: "cashier123", email: "bilal@dastarkhwan.pk", phone: "0300-0000002", branch: "Main Branch", status: "active", last_login: "Today, 11:40 AM", profile_photo: null },
      { id: 3, employee_id: 3, name: "Ahmed Raza", role: "Waiter", pin: "3456", password: "waiter123", email: "ahmed@dastarkhwan.pk", phone: "0300-0000003", branch: "Main Branch", status: "active", last_login: "Today, 11:52 AM", profile_photo: null },
      { id: 4, employee_id: 4, name: "Chef Imran", role: "Kitchen Staff", pin: "4567", password: "kitchen123", email: "imran@dastarkhwan.pk", phone: "0300-0000004", branch: "Main Branch", status: "active", last_login: "Today, 10:15 AM", profile_photo: null },
    ],
    categories: mock.menuCategories.map((c, i) => ({ id: i + 1, name: c, printer_station: "Grill", display_order: i + 1 })),
    menu_items: mock.menuItems.map((m, i) => ({ id: i + 1, name: m.name, category: m.category, price: m.price, cost: m.cost, status: m.status, prep_time: 10, station: "Grill", image: m.img })),
    inventory_items: mock.inventoryItems.map((inv, i) => ({ id: i + 1, name: inv.name, category: inv.category, unit: inv.unit, stock: inv.stock, reorder: inv.reorder, cost: inv.cost, status: inv.status })),
    suppliers: mock.suppliers.map((s, i) => ({ id: i + 1, name: s.name, phone: s.phone, category: s.category, due: s.due, status: s.status })),
    purchase_orders: mock.purchaseOrders.map((p, i) => ({ id: i + 1, supplier: p.supplier, date: new Date().toISOString(), total: p.total, status: p.status })),
    customers: mock.customers.map((c, i) => ({ id: i + 1, name: c.name, phone: c.phone, email: c.email || "", visits: c.visits, points: c.points, credit: c.credit, tier: c.tier, total_billed: 0, total_paid: 0 })),
    employees: [
      { id: 1, user_id: 1, name: "Hammadullah", role: "Owner", phone: "0300-0000001", status: "active", joined: "Jan 2024" },
      { id: 2, user_id: 2, name: "Bilal Hussain", role: "Cashier", phone: "0322-3334445", status: "active", joined: "Mar 2025" },
      { id: 3, user_id: 3, name: "Ahmed Raza", role: "Waiter", phone: "0301-1112223", status: "active", joined: "Jan 2025" },
      { id: 4, user_id: 4, name: "Chef Imran", role: "Kitchen Staff", phone: "0312-7778889", status: "active", joined: "Nov 2024" },
      { id: 5, user_id: null, name: "Hina Aslam", role: "Waiter", phone: "0345-5556667", status: "on_leave", joined: "May 2025" },
    ],
    expenses: mock.expenses.map((e, i) => ({ id: i + 1, category: e.category, amount: e.amount, date: new Date().toISOString(), paid_by: e.paidBy, notes: "" })),
    tables_floor: mock.tables.map((t) => ({ id: t.id, section: t.section, seats: t.seats, status: t.status, order_id: t.order })),
    orders: mock.orders.map((o, i) => ({ id: `ORD-${String(i + 1).padStart(4, "0")}`, type: o.type, table_id: o.table, customer: o.customer, items_count: o.items, total: o.total, status: o.status, waiter: o.waiter, time: o.time, created_at: new Date(Date.now() - (mock.orders.length - i) * 60000).toISOString() })),
    order_items: [],
    kitchen_tickets: [],
    notifications: mock.notifications.map((n, i) => ({ id: i + 1, type: n.type, text: n.text, time: n.time, read: 0, created_at: new Date(Date.now() - (mock.notifications.length - i) * 120000).toISOString() })),
    audit_log: mock.auditLog.map((a, i) => ({ id: i + 1, time: a.time, user: a.user, module: a.module, action: a.action, ip_device: "Browser-Dev", created_at: new Date(Date.now() - (mock.auditLog.length - i) * 300000).toISOString() })),
    sales_returns: [],
    role_permissions: buildInitialPermissions(),
    custom_roles: [],
    recipes: [],
    purchase_order_items: [],
    sequences: {
      users: 4,
      categories: mock.menuCategories.length,
      menu_items: mock.menuItems.length,
      inventory_items: mock.inventoryItems.length,
      suppliers: mock.suppliers.length,
      purchase_orders: mock.purchaseOrders.length,
      customers: mock.customers.length,
      employees: 5,
      expenses: mock.expenses.length,
      orders: mock.orders.length,
      notifications: mock.notifications.length,
      audit_log: mock.auditLog.length,
      sales_returns: 0,
      recipes: 0,
      order_items: 0,
      purchase_order_items: 0,
    }
  };

  initialStore.orders = initialStore.orders.map((o) => ({
    subtotal: o.total,
    discount_percent: 0,
    discount_reason: null,
    tax: 0,
    service_charge: 0,
    payment_method: null,
    payment_details: null,
    tendered: null,
    change_due: null,
    refunded_total: 0,
    order_note: null,
    kitchen_status: (["paid", "served", "completed"].includes(o.status) ? "served" : "new"),
    ...o,
  }));

  return initialStore;
};

const readStoredState = (key, fallback) => {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStoredState = (key, value) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures in private/incognito modes
  }
};

const store = readStoredState(STORAGE_KEY, buildInitialStore());

// Ensure sequences exist
if (!store.sequences) store.sequences = {};

// Clean up sequence tracking based on maximum existing integer IDs per table
const calculateMaxId = (table) => {
  if (!Array.isArray(store[table])) return 0;
  let max = 0;
  for (const row of store[table]) {
    if (!row) continue;
    let num = 0;
    if (typeof row.id === "number") {
      num = row.id;
    } else if (typeof row.id === "string") {
      const match = row.id.match(/\d+/g);
      if (match) num = parseInt(match[match.length - 1], 10);
    }
    if (!isNaN(num) && num > max) max = num;
  }
  return max;
};

const TABLES_LIST = [
  "users", "categories", "menu_items", "inventory_items", "suppliers",
  "purchase_orders", "customers", "employees", "expenses", "orders",
  "notifications", "audit_log", "sales_returns", "recipe_ingredients", "order_items", "purchase_order_items",
  "cashier_shifts", "accounts", "journal_entries"
];

for (const tbl of TABLES_LIST) { if (!store[tbl]) store[tbl] = [];
  const maxExisting = calculateMaxId(tbl);
  if (!store.sequences[tbl] || store.sequences[tbl] < maxExisting) {
    store.sequences[tbl] = maxExisting;
  }
}

// Clean up legacy/scrambled IDs in audit_log so latest is ALWAYS #N and next is #N+1
if (Array.isArray(store.audit_log) && store.audit_log.length > 0) {
  const hasLegacy = store.audit_log.some(a => !a.id || a.id > 1000 || typeof a.id !== "number");
  if (hasLegacy) {
    const total = store.audit_log.length;
    store.audit_log = store.audit_log.map((entry, idx) => ({
      ...entry,
      id: total - idx,
      ip_device: entry.ip_device || "Browser-Dev"
    }));
    store.sequences.audit_log = total;
    persistStore();
  }
}

// Ensure new fields exist on existing stored data
if (!store.role_permissions) store.role_permissions = buildInitialPermissions();
if (!store.custom_roles) store.custom_roles = [];
store.users = (store.users || []).map((u) => ({
  profile_photo: null, email: "", phone: "", branch: "Main Branch", password: "", employee_id: null,
  ...u,
}));
store.employees = (store.employees || []).map((e) => ({
  user_id: null, phone: "", joined: new Date().toISOString(), status: "active",
  ...e,
}));
store.orders = (store.orders || []).map((o) => ({
  kitchen_status: o.kitchen_status || (["paid", "served", "completed"].includes(o.status) ? "served" : "new"),
  ...o,
}));
store.audit_log = (store.audit_log || []).map((a) => ({ ip_device: "Browser-Dev", ...a }));
if (!store.recipes) store.recipes = [];
if (!store.purchase_order_items) store.purchase_order_items = [];
store.customers = (store.customers || []).map((c) => ({ email: "", ...c }));
if (!store.cashier_shifts) store.cashier_shifts = [];
if (!store.accounts) store.accounts = [{ id: 1, name: "Cash in Hand", type: "Asset", balance: 0 }, { id: 2, name: "Bank Account", type: "Asset", balance: 0 }];
if (!store.journal_entries) store.journal_entries = [];

const settingsStore = readStoredState(SETTINGS_STORAGE_KEY, {
  restaurant_profile: {
    name: "Dastarkhwan Restaurant",
    address: "University Road, Peshawar",
    phone: "091-1234567",
    currency: "PKR",
    taxRate: 0,
    serviceCharge: 0,
    receiptFooter: "Thank you for dining with us — visit again!",
  },
  session_settings: { autoLockMinutes: 0 },
});

function persistStore() { writeStoredState(STORAGE_KEY, store); }
function persistSettings() { writeStoredState(SETTINGS_STORAGE_KEY, settingsStore); }

const delay = (v) => new Promise((res) => setTimeout(() => res(v), 50));

// Sequential ID generator: 1, 2, 3, 4... per table
const nextSeqId = (table = "generic") => {
  if (!store.sequences) store.sequences = {};
  if (typeof store.sequences[table] !== "number") {
    store.sequences[table] = calculateMaxId(table);
  }
  store.sequences[table] += 1;
  persistStore();
  return store.sequences[table];
};

const nextOrderId = () => {
  const seq = nextSeqId("orders");
  return `ORD-${String(seq).padStart(4, "0")}`;
};

const logAudit = (ctx) => {
  if (!ctx || !ctx.user || !ctx.action) return;
  const newId = nextSeqId("audit_log");
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  const entry = {
    id: newId,
    time: timeStr,
    user: ctx.user,
    module: ctx.module || "System",
    action: ctx.action,
    ip_device: "Browser-Dev",
    created_at: now.toISOString()
  };
  store.audit_log = [entry, ...(store.audit_log || [])];
  persistStore();
};

const memoryApi = {
  isElectron: false,

  // Sequential ID helpers
  nextSeqId,
  nextOrderId,

  // Notifications
  pushNotification: (type, text) => {
    const newId = nextSeqId("notifications");
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const n = { id: newId, type: type || "system", text, time: timeStr, read: 0, created_at: now.toISOString() };
    store.notifications = [n, ...(store.notifications || [])];
    persistStore();
  },
  markAllNotificationsRead: () => {
    store.notifications = (store.notifications || []).map(n => ({ ...n, read: 1 }));
    persistStore();
    return delay({ success: true });
  },
  markNotificationRead: (id) => {
    store.notifications = (store.notifications || []).map(n => n.id === id ? { ...n, read: 1 } : n);
    persistStore();
    return delay({ success: true });
  },
  clearNotifications: () => {
    store.notifications = [];
    persistStore();
    return delay({ success: true });
  },

  // Generic List with intelligent numeric & timestamp sorting
  list: (table, opts = {}) => {
    let rows = [...(store[table] || [])];
    if (opts.where) {
      rows = rows.filter((r) => Object.entries(opts.where).every(([k, v]) => r[k] === v));
    }
    if (opts.orderBy) {
      const [col, dir] = opts.orderBy.split(" ");
      rows.sort((a, b) => {
        let va = a[col];
        let vb = b[col];

        if (col === "id") {
          const numA = typeof va === "number" ? va : parseInt(String(va).replace(/\D/g, ""), 10) || 0;
          const numB = typeof vb === "number" ? vb : parseInt(String(vb).replace(/\D/g, ""), 10) || 0;
          return dir === "DESC" ? numB - numA : numA - numB;
        }

        if (col === "time" || col === "created_at") {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (tA || tB) return dir === "DESC" ? tB - tA : tA - tB;
        }

        if (va < vb) return dir === "DESC" ? 1 : -1;
        if (va > vb) return dir === "DESC" ? -1 : 1;
        return 0;
      });
    } else {
      // Default: If table has id, sort descending so latest is always at the top
      if (["audit_log", "notifications", "orders", "purchase_orders", "expenses"].includes(table)) {
        rows.sort((a, b) => {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (tA || tB) return tB - tA;

          const numA = typeof a.id === "number" ? a.id : parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
          const numB = typeof b.id === "number" ? b.id : parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
          return numB - numA;
        });
      }
    }
    return delay(rows);
  },

  get: (table, id) => delay((store[table] || []).find((r) => r.id === id)),

  create: (table, data, auditCtx) => {
    const assignedId = data.id !== undefined && data.id !== null ? data.id : nextSeqId(table);
    const row = { id: assignedId, created_at: new Date().toISOString(), ...data };
    
    // Employee <-> User link handling
    if (table === "users" && row.employee_id) {
      store.employees = (store.employees || []).map(e => e.id === row.employee_id ? { ...e, user_id: row.id } : e);
    } else if (table === "employees" && row.user_id) {
      store.users = (store.users || []).map(u => u.id === row.user_id ? { ...u, employee_id: row.id } : u);
    }

    const existingIdx = (store[table] || []).findIndex((r) => r.id === row.id);
    if (existingIdx >= 0) {
      store[table][existingIdx] = { ...store[table][existingIdx], ...row };
    } else {
      store[table] = [row, ...(store[table] || [])];
      
      if (table === "expenses") {
        const expCode = row.expense_account_code || '5099';
        const d = row.date || new Date().toISOString();
        const payCode = row.paid_by === 'Cash' ? '1001' : (row.paid_by === 'Bank' ? '1002' : '2001');
        
        store.journal_entries = [
          ...store.journal_entries,
          { id: nextSeqId("journal_entries"), date: d, reference_type: 'Expense', reference_id: String(row.id), account_code: expCode, account_name: 'Expense', debit: Number(row.amount || 0), credit: 0, description: row.notes || '', created_by: auditCtx?.user || 'System' },
          { id: nextSeqId("journal_entries"), date: d, reference_type: 'Expense', reference_id: String(row.id), account_code: payCode, account_name: 'Payment', debit: 0, credit: Number(row.amount || 0), description: row.notes || '', created_by: auditCtx?.user || 'System' }
        ];
      }
    }
    
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(row);
  },

  update: (table, id, data, auditCtx) => {
    store[table] = (store[table] || []).map((r) => (r.id === id ? { ...r, ...data } : r));
    
    // Employee <-> User sync handling
    if (table === "users") {
      const user = store.users.find(u => u.id === id);
      if (user && user.employee_id) {
        store.employees = (store.employees || []).map(e => e.id === user.employee_id ? { ...e, name: user.name, role: user.role, phone: user.phone, status: user.status } : e);
      }
    } else if (table === "employees") {
      const emp = store.employees.find(e => e.id === id);
      if (emp && emp.user_id) {
        store.users = (store.users || []).map(u => u.id === emp.user_id ? { ...u, name: emp.name, role: emp.role, phone: emp.phone, status: emp.status } : u);
      }
    }

    // Notifications Logic
    if (table === "inventory_items") {
      const item = store[table].find(r => r.id === id);
      if (item && item.stock <= item.reorder) {
        memoryApi.pushNotification("low_stock", `Low stock alert for ${item.name} (${item.stock} left)`);
      }
    }

    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(store[table].find((r) => r.id === id));
  },

  remove: (table, id, auditCtx) => {
    // Unlink if removing
    if (table === "users") {
      store.employees = (store.employees || []).map(e => e.user_id === id ? { ...e, user_id: null } : e);
    } else if (table === "employees") {
      store.users = (store.users || []).map(u => u.employee_id === id ? { ...u, employee_id: null } : u);
    }

    store[table] = (store[table] || []).filter((r) => r.id !== id);
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay({ success: true, id });
  },

  // Auth
  loginWithPin: async (pin) => {
    const user = store.users.find((u) => u.pin === pin && u.status === "active");
    if (user) {
      const idx = store.users.findIndex((u) => u.id === user.id);
      store.users[idx] = { ...user, last_login: new Date().toLocaleString() };
      logAudit({ user: user.name, module: "Authentication", action: "Logged in via PIN" });
      persistStore();
    }
    return { success: !!user, user: user || null, message: user ? "" : "Invalid PIN" };
  },

  loginWithPassword: async (usernameOrEmail, password) => {
    const user = store.users.find((u) => (u.name === usernameOrEmail || u.email === usernameOrEmail) && u.password === password && u.status === "active");
    if (user) {
      const idx = store.users.findIndex((u) => u.id === user.id);
      store.users[idx] = { ...user, last_login: new Date().toLocaleString() };
      logAudit({ user: user.name, module: "Authentication", action: "Logged in via Password" });
      persistStore();
    }
    return { success: !!user, user: user || null, message: user ? "" : "Invalid Credentials" };
  },

  adminOverride: async (ownerPassword) => {
    const owner = store.users.find((u) => u.role === "Owner" && u.password === ownerPassword);
    return { success: !!owner, owner, message: owner ? "" : "Incorrect master password" };
  },

  resetUserPin: async (userId, newPin, ownerPassword) => {
    const owner = store.users.find((u) => u.role === "Owner" && u.password === ownerPassword);
    if (!owner) return { success: false, message: "Incorrect master password" };
    store.users = store.users.map((u) => (u.id === userId ? { ...u, pin: newPin } : u));
    logAudit({ user: owner.name, module: "Authentication", action: `Reset PIN for User ${userId}` });
    persistStore();
    return { success: true };
  },

  resetUserPassword: async (userId, newPassword, ownerPassword) => {
    const owner = store.users.find((u) => u.role === "Owner" && u.password === ownerPassword);
    if (!owner) return { success: false, message: "Incorrect master password" };
    store.users = store.users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u));
    logAudit({ user: owner.name, module: "Authentication", action: `Reset Password for User ${userId}` });
    persistStore();
    return { success: true };
  },

  // Permissions & Roles
  getPermissions: () => delay(store.role_permissions || []),
  
  savePermissions: (rows, auditCtx) => {
    const map = new Map((store.role_permissions || []).map((r) => [`${r.role}:${r.module}`, r]));
    for (const row of rows) {
      map.set(`${row.role}:${row.module}`, { ...map.get(`${row.role}:${row.module}`), ...row });
    }
    store.role_permissions = Array.from(map.values());
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay({ success: true });
  },

  resetDefaultPermissions: (auditCtx) => {
    store.role_permissions = buildInitialPermissions();
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay({ success: true });
  },

  listRoles: () => {
    const builtIn = ["Owner", "Manager", "Cashier", "Waiter", "Kitchen Staff", "Accountant"].map((name) => ({ name, isBuiltIn: true }));
    const custom = (store.custom_roles || []).map((name) => ({ name, isBuiltIn: false }));
    return delay([...builtIn, ...custom]);
  },

  createRole: (roleName, auditCtx) => {
    if (!store.custom_roles) store.custom_roles = [];
    if (!store.custom_roles.includes(roleName)) {
      store.custom_roles.push(roleName);
      const newPerms = MODULES.map((m) => ({ role: roleName, module: m, can_view: 0, can_add: 0, can_edit: 0, can_delete: 0, can_export: 0 }));
      store.role_permissions = [...(store.role_permissions || []), ...newPerms];
      if (auditCtx) logAudit(auditCtx);
      persistStore();
    }
    return delay({ success: true });
  },

  deleteRole: (roleName, auditCtx) => {
    store.custom_roles = (store.custom_roles || []).filter((r) => r !== roleName);
    store.role_permissions = (store.role_permissions || []).filter((p) => p.role !== roleName);
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay({ success: true });
  },

  // Settings
  getSetting: (key) => delay(settingsStore[key] || null),
  setSetting: (key, value, auditCtx) => {
    settingsStore[key] = value;
    if (auditCtx) logAudit(auditCtx);
    persistSettings();
    return delay({ success: true });
  },

  // Orders
  createOrderWithItems: (order, items, auditCtx) => {
    const orderId = order.id || nextOrderId();
    const full = {
      subtotal: order.total, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0,
      payment_method: null, payment_details: null, tendered: null, change_due: null,
      refunded_total: 0, order_note: null, created_at: new Date().toISOString(),
      kitchen_status: ["served", "completed", "paid"].includes(order.status) ? "served" : "new",
      ...order,
      id: orderId,
    };

    const existingIdx = (store.orders || []).findIndex((o) => o.id === full.id);
    if (existingIdx >= 0) store.orders[existingIdx] = { ...store.orders[existingIdx], ...full };
    else store.orders = [full, ...store.orders];

    store.order_items = [
      ...store.order_items.filter((it) => it.order_id !== full.id),
      ...items.map((it) => ({ id: nextSeqId("order_items"), order_id: full.id, ...it }))
    ];

    if (full.table_id) {
      store.tables_floor = store.tables_floor.map((t) =>
        t.id === full.table_id ? { ...t, status: "occupied", order_id: full.id } : t
      );
    }
    
    // Auto-deduct inventory based on recipes
    for (const item of items) {
      if (item.is_deal && Array.isArray(item.sub_items)) {
        for (const sub of item.sub_items) {
          const subMenuItemId = sub.menu_item_id || sub.id;
          const recipeLines = store.recipe_ingredients.filter(r => r.menu_item_id === subMenuItemId);
          for (const line of recipeLines) {
            const deductQty = (line.qty || 0) * (sub.qty || 1) * (item.qty || 1);
            store.inventory_items = store.inventory_items.map(inv => {
              if (inv.id === (line.inventory_item_id || line.ingredient_id)) {
                const newStock = Math.max(0, inv.stock - deductQty);
                if (newStock <= inv.reorder && inv.stock > inv.reorder) {
                  memoryApi.pushNotification("low_stock", `Low Stock: ${inv.name} (${newStock} ${inv.unit} left).`);
                }
                return { ...inv, stock: newStock, status: newStock <= 0 ? "critical" : newStock <= inv.reorder ? "low" : "in_stock" };
              }
              return inv;
            });
          }
        }
      } else {
        const recipeLines = store.recipe_ingredients.filter(r => r.menu_item_id === item.menu_item_id);
        for (const line of recipeLines) {
          const deductQty = (line.qty || 0) * (item.qty || 1);
          store.inventory_items = store.inventory_items.map(inv => {
            if (inv.id === (line.inventory_item_id || line.ingredient_id)) {
              const newStock = Math.max(0, inv.stock - deductQty);
              if (newStock <= inv.reorder && inv.stock > inv.reorder) {
                memoryApi.pushNotification("low_stock", `Low Stock: ${inv.name} (${newStock} ${inv.unit} left).`);
              }
              return { ...inv, stock: newStock, status: newStock <= 0 ? "critical" : newStock <= inv.reorder ? "low" : "in_stock" };
            }
            return inv;
          });
        }
      }
    }
    
    if (full.total > 5000) {
      memoryApi.pushNotification("payment", `High-value order #${full.id} placed for Rs. ${full.total.toLocaleString()}.`);
    }

    // Update Customer Financials if paid
    if (full.status === "paid" && full.customer_id) {
      store.customers = store.customers.map(c => {
        if (c.id === full.customer_id) {
          const actualPaid = (full.tendered !== null ? Number(full.tendered) : Number(full.total)) - (Number(full.change_due) || 0);
          const billedAmount = Number(full.total);
          const creditIncrease = Math.max(0, billedAmount - actualPaid);
          
          return {
            ...c,
            visits: (c.visits || 0) + 1,
            points: (c.points || 0) + Math.floor(billedAmount / 100),
            total_billed: (c.total_billed || 0) + billedAmount,
            total_paid: (c.total_paid || 0) + actualPaid,
            credit: (c.credit || 0) + creditIncrease
          };
        }
        return c;
      });
    }
    
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(full);
  },

  updateOrderWithItems: (orderId, orderUpdates, items, auditCtx) => {
    const existingOrder = store.orders.find((o) => o.id === orderId);
    if (!existingOrder) return delay(null);
    const updatedOrder = { ...existingOrder, ...orderUpdates };
    store.orders = store.orders.map((o) => (o.id === orderId ? updatedOrder : o));
    if (items && Array.isArray(items)) {
      store.order_items = [
        ...store.order_items.filter((it) => it.order_id !== orderId),
        ...items.map((it) => ({ id: it.id || nextSeqId("order_items"), order_id: orderId, ...it }))
      ];

      // Auto-deduct inventory based on recipes
      for (const item of items) {
        if (item.is_deal && Array.isArray(item.sub_items)) {
          for (const sub of item.sub_items) {
            const subMenuItemId = sub.menu_item_id || sub.id;
            const recipeLines = store.recipe_ingredients.filter(r => r.menu_item_id === subMenuItemId);
            for (const line of recipeLines) {
              const deductQty = (line.qty || 0) * (sub.qty || 1) * (item.qty || 1);
              store.inventory_items = store.inventory_items.map(inv => {
                if (inv.id === (line.inventory_item_id || line.ingredient_id)) {
                  const newStock = Math.max(0, inv.stock - deductQty);
                  if (newStock <= inv.reorder && inv.stock > inv.reorder) {
                    memoryApi.pushNotification("low_stock", `Low Stock: ${inv.name} (${newStock} ${inv.unit} left).`);
                  }
                  return { ...inv, stock: newStock, status: newStock <= 0 ? "critical" : newStock <= inv.reorder ? "low" : "in_stock" };
                }
                return inv;
              });
            }
          }
        } else {
          const recipeLines = store.recipe_ingredients.filter(r => r.menu_item_id === item.menu_item_id);
          for (const line of recipeLines) {
            const deductQty = (line.qty || 0) * (item.qty || 1);
            store.inventory_items = store.inventory_items.map(inv => {
              if (inv.id === (line.inventory_item_id || line.ingredient_id)) {
                const newStock = Math.max(0, inv.stock - deductQty);
                if (newStock <= inv.reorder && inv.stock > inv.reorder) {
                  memoryApi.pushNotification("low_stock", `Low Stock: ${inv.name} (${newStock} ${inv.unit} left).`);
                }
                return { ...inv, stock: newStock, status: newStock <= 0 ? "critical" : newStock <= inv.reorder ? "low" : "in_stock" };
              }
              return inv;
            });
          }
        }
      }
    }
    if (updatedOrder.table_id) {
      store.tables_floor = store.tables_floor.map((t) =>
        t.id === updatedOrder.table_id ? { ...t, status: "occupied", order_id: updatedOrder.id } : t
      );
    }
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(updatedOrder);
  },

  processPurchaseOrder: (poData, itemsData, auditCtx) => {
    const poId = poData.id !== undefined && poData.id !== null ? poData.id : nextSeqId("purchase_orders");
    const po = { ...poData, id: poId };
    const existingPoIdx = (store.purchase_orders || []).findIndex(p => p.id === po.id);
    if (existingPoIdx >= 0) {
      store.purchase_orders[existingPoIdx] = { ...store.purchase_orders[existingPoIdx], ...po };
    } else {
      store.purchase_orders = [po, ...(store.purchase_orders || [])];
    }

    store.purchase_order_items = [
      ...(store.purchase_order_items || []).filter(it => it.po_id !== po.id),
      ...itemsData.map(it => ({ id: it.id || nextSeqId("purchase_order_items"), po_id: po.id, ...it }))
    ];
      if (po.status === "received") {
        for (const item of itemsData) {
          store.inventory_items = (store.inventory_items || []).map(inv =>
            inv.id === item.inventory_item_id
              ? { ...inv, stock: Number(inv.stock) + Number(item.qty), cost: Number(item.cost || 0) > 0 ? Number(item.cost) : Number(inv.cost || 0), status: (Number(inv.stock) + Number(item.qty)) <= 0 ? "critical" : (Number(inv.stock) + Number(item.qty)) <= (inv.reorder || 10) ? "low" : "in_stock" }
              : inv
          );
        }
        
        store.suppliers = (store.suppliers || []).map(s => 
          s.name === po.supplier 
            ? { ...s, due: Number(s.due || 0) + (Number(po.total) - Number(po.amount_paid_on_receive || 0)) }
            : s
        );

        const dateNow = po.date || new Date().toISOString();
        const isCash = (po.payment_method_on_receive || '').toLowerCase().includes('cash');
        const bankOrCashCode = isCash ? '1001' : '1002';
        const bankOrCashName = isCash ? 'Cash in Hand' : 'Bank Account';
        
        let journalEntries = [
          {
            id: nextSeqId("journal_entries"),
            date: dateNow,
            reference_type: 'Purchase',
            reference_id: po.id,
            account_code: '5001',
            account_name: 'Cost of Goods Sold',
            debit: Number(po.total || 0),
            credit: 0,
            description: `PO #${po.id}`,
            created_by: 'System'
          }
        ];

        if (Number(po.amount_paid_on_receive) > 0) {
          let deducted = false;
          store.accounts = (store.accounts || []).map(a => {
            if (!deducted && a.name.includes(isCash ? "Cash" : "Bank")) {
              deducted = true;
              return { ...a, balance: Number(a.balance) - Number(po.amount_paid_on_receive) };
            }
            return a;
          });
          
          journalEntries.push({
            id: nextSeqId("journal_entries"),
            date: dateNow,
            reference_type: "Purchase",
            reference_id: po.id,
            account_code: bankOrCashCode,
            account_name: bankOrCashName,
            debit: 0,
            credit: Number(po.amount_paid_on_receive),
            description: `Payment for PO #${po.id}`,
            created_by: "System"
          });
        }

        const payableAmt = Number(po.total || 0) - Number(po.amount_paid_on_receive || 0);
        if (payableAmt > 0) {
          journalEntries.push({
            id: nextSeqId("journal_entries"),
            date: dateNow,
            reference_type: "Purchase",
            reference_id: po.id,
            account_code: '2001',
            account_name: 'Accounts Payable',
            debit: 0,
            credit: payableAmt,
            description: `Payable for PO #${po.id}`,
            created_by: "System"
          });
        }
        store.journal_entries = [...journalEntries, ...(store.journal_entries || [])];
    }
    
    if (po.status === "sent") {
      memoryApi.pushNotification("payment", `Pending payment for PO #${po.id} to ${po.supplier}`);
    }
    
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(po);
  },

  paySupplier: (supplierId, data, auditCtx) => {
    const supplier = (store.suppliers || []).find(s => s.id === supplierId);
    if (!supplier) throw new Error('Supplier not found');
    const amount = Number(data.amount || 0);
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');
    const newDue = Math.max(0, Number(supplier.due || 0) - amount);
    store.suppliers = store.suppliers.map(s => s.id === supplierId ? { ...s, due: newDue } : s);
    const payment = {
      id: nextSeqId('supplier_payments'),
      supplier_id: supplierId,
      supplier_name: supplier.name,
      amount,
      payment_method: data.payment_method || 'Cash',
      notes: data.notes || '',
      date: data.date || new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    store.supplier_payments = [payment, ...(store.supplier_payments || [])];
    
    const isCash = (data.payment_method || '').toLowerCase().includes('cash');
    const bankOrCashCode = isCash ? '1001' : '1002';
    const bankOrCashName = isCash ? 'Cash in Hand' : 'Bank Account';
    const dateNow = data.date || new Date().toISOString();

    const journalEntries = [
      {
        id: nextSeqId("journal_entries"),
        date: dateNow,
        reference_type: 'Supplier Payment',
        reference_id: supplierId,
        account_code: '2001',
        account_name: 'Accounts Payable',
        debit: amount,
        credit: 0,
        description: `Payment to ${supplier.name}`,
        created_by: auditCtx ? auditCtx.user : 'System'
      },
      {
        id: nextSeqId("journal_entries"),
        date: dateNow,
        reference_type: 'Supplier Payment',
        reference_id: supplierId,
        account_code: bankOrCashCode,
        account_name: bankOrCashName,
        debit: 0,
        credit: amount,
        description: `Payment to ${supplier.name}`,
        created_by: auditCtx ? auditCtx.user : 'System'
      }
    ];
    store.journal_entries = [...journalEntries, ...(store.journal_entries || [])];
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(payment);
  },

  processReturn: (orderId, payload, auditCtx) => {
    const { items, reason, restock, kind } = payload;
    const amount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
    const ret = { id: nextSeqId("sales_returns"), order_id: orderId, kind: kind || "return", items: JSON.stringify(items), amount, reason: reason || "", restock: restock ? 1 : 0, time, created_at: now.toISOString() };
    store.sales_returns = [ret, ...store.sales_returns];
    store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, refunded_total: (o.refunded_total || 0) + amount } : o));

    store.order_items = (store.order_items || []).map((it) => {
      if (it.order_id === orderId) {
        const returned = items.find((retItem) => retItem.menu_item_id === it.menu_item_id);
        if (returned) {
          const newQty = Math.max(0, it.qty - returned.qty);
          return { ...it, qty: newQty };
        }
      }
      return it;
    }).filter((it) => it.qty > 0);

    const hasItemsLeft = store.order_items.some((it) => it.order_id === orderId);
    if (!hasItemsLeft) {
      store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, kitchen_status: "cancelled" } : o));
    }

    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay({ order: store.orders.find((o) => o.id === orderId), return: ret });
  },

  updateOrderStatus: (id, status, auditCtx) => {
    store.orders = store.orders.map((o) => (o.id === id ? { ...o, status } : o));
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },

  updateKitchenStatus: (id, kitchen_status, auditCtx) => {
    store.orders = store.orders.map((o) => (o.id === id ? { ...o, kitchen_status } : o));
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },

  getDashboardSummary: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeToday = (store.orders || []).filter((o) => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.created_at);
      return d >= today && d < tomorrow;
    });

    const expensesToday = (store.expenses || []).filter((e) => {
      const d = new Date(e.date);
      return d >= today && d < tomorrow;
    });

    return delay({
      todaySales: activeToday.reduce((s, o) => s + Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0)), 0),
      todayOrders: activeToday.length,
      lowStockCount: (store.inventory_items || []).filter((i) => i.status === "low" || i.status === "critical").length,
      expensesTotal: expensesToday.reduce((s, e) => s + Number(e.amount || 0), 0),
    });
  },

  getCurrentShift: (userId) => {
    const shift = store.cashier_shifts.find(s => s.cashier_id === userId && s.status === "open");
    return delay(shift || null);
  },
  listShifts: () => delay([...store.cashier_shifts].reverse()),
  openShift: (data) => {
    const shift = {
      id: nextSeqId("cashier_shifts"),
      ...data,
      status: "open",
      opened_at: new Date().toISOString(),
    };
    store.cashier_shifts.push(shift);
    persistStore();
    return delay(shift);
  },
  closeShift: (shiftId, data) => {
    const shift = store.cashier_shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error("Shift not found");
    shift.status = "closed";
    shift.closed_at = new Date().toISOString();
    shift.actual_cash = data.actual_cash;
    shift.notes = data.notes;
    shift.total_sales = store.orders
        .filter(o => o.shift_id === shiftId || (!o.shift_id && new Date(o.created_at) >= new Date(shift.opened_at)))
        .reduce((acc, o) => acc + o.total, 0);
    persistStore();
    return delay(shift);
  },

  closeDay: (summary) => {
    const now = new Date();
    logAudit({
      user: summary.user || "System",
      module: "Operations",
      action: `Day Closed. Sales: Rs. ${summary.totalSales}`,
    });
    memoryApi.pushNotification("system", `Day closed successfully by ${summary.user || "System"}. Net Cash: Rs. ${summary.netCash}`);
    persistStore();
    return delay({ success: true });
  },
  processReturn: (orderId, payload, auditCtx) => {
    const { items, reason, restock, kind } = payload;
    const amount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
    const ret = { id: nextSeqId("sales_returns"), order_id: orderId, kind: kind || "return", items: JSON.stringify(items), amount, reason: reason || "", restock: restock ? 1 : 0, time, created_at: now.toISOString() };
    store.sales_returns = [ret, ...store.sales_returns];
    store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, refunded_total: (o.refunded_total || 0) + amount } : o));

    store.order_items = (store.order_items || []).map((it) => {
      if (it.order_id === orderId) {
        const returned = items.find((retItem) => retItem.menu_item_id === it.menu_item_id);
        if (returned) {
          const newQty = Math.max(0, it.qty - returned.qty);
          return { ...it, qty: newQty };
        }
      }
      return it;
    }).filter((it) => it.qty > 0);

    const hasItemsLeft = store.order_items.some((it) => it.order_id === orderId);
    if (!hasItemsLeft) {
      store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, kitchen_status: "cancelled" } : o));
    }

    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay({ order: store.orders.find((o) => o.id === orderId), return: ret });
  },

  updateOrderStatus: (id, status, auditCtx) => {
    store.orders = store.orders.map((o) => (o.id === id ? { ...o, status } : o));
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },

  updateKitchenStatus: (id, kitchen_status, auditCtx) => {
    store.orders = store.orders.map((o) => (o.id === id ? { ...o, kitchen_status } : o));
    if (auditCtx) logAudit(auditCtx);
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },

  getDashboardSummary: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeToday = (store.orders || []).filter((o) => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.created_at);
      return d >= today && d < tomorrow;
    });

    const expensesToday = (store.expenses || []).filter((e) => {
      const d = new Date(e.date);
      return d >= today && d < tomorrow;
    });

    return delay({
      todaySales: activeToday.reduce((s, o) => s + Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0)), 0),
      todayOrders: activeToday.length,
      lowStockCount: (store.inventory_items || []).filter((i) => i.status === "low" || i.status === "critical").length,
      expensesTotal: expensesToday.reduce((s, e) => s + Number(e.amount || 0), 0),
    });
  },

  getCurrentShift: (userId) => {
    const shift = store.cashier_shifts.find(s => s.cashier_id === userId && s.status === "open");
    return delay(shift || null);
  },
  listShifts: () => delay([...store.cashier_shifts].reverse()),
  openShift: (data) => {
    const shift = {
      id: nextSeqId("cashier_shifts"),
      ...data,
      status: "open",
      opened_at: new Date().toISOString(),
    };
    store.cashier_shifts.push(shift);
    persistStore();
    return delay(shift);
  },
  closeShift: (shiftId, data) => {
    const shift = store.cashier_shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error("Shift not found");
    shift.status = "closed";
    shift.closed_at = new Date().toISOString();
    shift.actual_cash = data.actual_cash;
    shift.notes = data.notes;
    shift.total_sales = store.orders
        .filter(o => o.shift_id === shiftId || (!o.shift_id && new Date(o.created_at) >= new Date(shift.opened_at)))
        .reduce((acc, o) => acc + o.total, 0);
    persistStore();
    return delay(shift);
  },

  closeDay: (summary) => {
    const now = new Date();
    logAudit({
      user: summary.user || "System",
      module: "Operations",
      action: `Day Closed. Sales: Rs. ${summary.totalSales}`,
    });
    memoryApi.pushNotification("system", `Day closed successfully by ${summary.user || "System"}. Net Cash: Rs. ${summary.netCash}`);
    persistStore();
    return delay({ success: true });
  },

  listDeals: () => {
    const deals = store.deals || [];
    const groups = store.deal_groups || [];
    const menuItems = store.menu_items || [];
    return delay(deals.map(d => ({
      ...d,
      groups: groups.filter(g => g.deal_id === d.id).map(g => ({
        ...g,
        items: (g.menu_item_ids || []).map(id => {
          const m = menuItems.find(x => x.id === id);
          return { id: Math.random(), menu_item_id: id, name: m ? m.name : "Unknown" };
        })
      }))
    })));
  },
  createDeal: (deal, groups) => {
    const id = nextSeqId("deals");
    const newDeal = {
      ...deal,
      barcode: deal.barcode || null,
      cost: deal.cost || 0,
      id,
      created_at: new Date().toISOString()
    };
    store.deals = [...(store.deals || []), newDeal];
    store.deal_groups = [...(store.deal_groups || []), ...groups.map(g => ({ ...g, deal_id: id, id: nextSeqId("deal_groups") }))];
    persistStore();
    return delay(newDeal);
  },
  updateDeal: (id, deal, groups) => {
    store.deals = (store.deals || []).map(d => d.id === id ? {
      ...d,
      ...deal,
      barcode: deal.barcode !== undefined ? (deal.barcode || null) : (d.barcode || null),
      cost: deal.cost !== undefined ? (deal.cost || 0) : (d.cost || 0)
    } : d);
    store.deal_groups = (store.deal_groups || []).filter(g => g.deal_id !== id);
    store.deal_groups = [...(store.deal_groups || []), ...groups.map(g => ({ ...g, deal_id: id, id: nextSeqId("deal_groups") }))];
    persistStore();
    return delay({ success: true });
  },
  deleteDeal: (id) => {
    store.deals = (store.deals || []).filter(d => d.id !== id);
    store.deal_groups = (store.deal_groups || []).filter(g => g.deal_id !== id);
    persistStore();
    return delay({ success: true });
  },

  exportData: () => {
    return delay({
      __version: 1,
      __exported_at: new Date().toISOString(),
      store: store,
      settings: JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "null")
    });
  },

  importData: (data) => {
    if (data.store) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.store));
      Object.assign(store, data.store);
    }
    if (data.settings) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data.settings));
    }
    return delay({ success: true });
  },

  printHtml: (html, printerName) => {
    console.log(`Printing to ${printerName}:\n`, html);
    const w = window.open('', '_blank', 'width=400,height=600');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); w.close(); }, 250);
    }
    return delay({ success: true });
  },

  createJournal: (data) => {
    const { lines, ...header } = data;
    const headerId = nextSeqId('journal_headers');
    const newHeader = { ...header, id: headerId, entry_number: 'JV-' + Date.now(), status: header.status || 'Draft', created_at: new Date().toISOString() };
    store.journal_headers = [...(store.journal_headers || []), newHeader];
    
    lines.forEach(line => {
      const newLine = { ...line, id: nextSeqId('journal_entries'), header_id: headerId, created_at: new Date().toISOString() };
      store.journal_entries = [...(store.journal_entries || []), newLine];
    });
    persistStore();
    return delay({ success: true, id: headerId });
  },
  updateJournal: (id, data) => {
    const { lines, ...header } = data;
    store.journal_headers = (store.journal_headers || []).map(h => h.id === id ? { ...h, ...header } : h);
    store.journal_entries = (store.journal_entries || []).filter(e => e.header_id !== id);
    lines.forEach(line => {
      const newLine = { ...line, id: nextSeqId('journal_entries'), header_id: id, created_at: new Date().toISOString() };
      store.journal_entries = [...(store.journal_entries || []), newLine];
    });
    persistStore();
    return delay({ success: true });
  },
  reverseJournal: (id, created_by) => {
    const header = (store.journal_headers || []).find(h => h.id === id);
    if (!header) throw new Error("Header not found");
    const revHeaderId = nextSeqId('journal_headers');
    const newHeader = { ...header, id: revHeaderId, entry_number: 'JV-REV-' + Date.now(), description: 'Reversal of ' + header.entry_number, status: 'Posted', created_by };
    store.journal_headers = [...(store.journal_headers || []), newHeader];
    
    const lines = (store.journal_entries || []).filter(e => e.header_id === id);
    lines.forEach(line => {
      const newLine = { ...line, id: nextSeqId('journal_entries'), header_id: revHeaderId, debit: line.credit, credit: line.debit, description: 'Reversal' };
      store.journal_entries = [...(store.journal_entries || []), newLine];
    });
    
    store.journal_headers = (store.journal_headers || []).map(h => h.id === id ? { ...h, status: 'Reversed' } : h);
    persistStore();
    return delay({ success: true });
  },

  listAccounts: () => delay((store.accounts || []).filter(a => a.is_active !== 0)),
  createAccount: (data) => {
    const newAcc = { ...data, id: nextSeqId('accounts'), is_active: 1, is_system: 0 };
    store.accounts = [...(store.accounts || []), newAcc];
    persistStore();
    return delay(newAcc);
  },
  updateAccount: (id, data) => {
    store.accounts = (store.accounts || []).map(a => a.id === id ? { ...a, ...data } : a);
    persistStore();
    return delay({ success: true });
  },
  deleteAccount: (id) => {
    store.accounts = (store.accounts || []).map(a => a.id === id ? { ...a, is_active: 0 } : a);
    persistStore();
    return delay({ success: true });
  },
  settleDriverCash: (driverName, amount, meta) => {
    store.employees = (store.employees || []).map(e => {
      if (e.name === driverName && e.role === 'Driver') {
        return { ...e, cash_balance: Math.max(0, (e.cash_balance || 0) - amount) };
      }
      return e;
    });
    persistStore();
    return delay({ success: true });
  },

  getVersion: () => delay("1.0.0 (production ready)"),
  getDeviceName: () => delay("Browser-Dev"),
  getPrinters: () => delay([]),
};

// Network RPC wrapper for mobile/browser usage
const networkInvoke = async (channel, ...args) => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5724`;
    const res = await fetch(`${apiBaseUrl}/api/rpc/${channel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Network Error');
    }
    const json = await res.json();
    return json.result;
  } catch (e) {
    console.error('RPC Call Failed:', channel, e);
    throw e;
  }
};

const buildNetworkApi = () => {
  return {
  isElectron: true,
  setAppIcon: (dataUrl) => networkInvoke("set-app-icon", dataUrl),
  list: (table, opts) => networkInvoke("db:list", table, opts),
  get: (table, id) => networkInvoke("db:get", table, id),
  create: (table, data, meta) => networkInvoke("db:create", table, data, meta),
  update: (table, id, data, meta) => networkInvoke("db:update", table, id, data, meta),
  remove: (table, id, meta) => networkInvoke("db:delete", table, id, meta),
  loginWithPin: (pin) => networkInvoke("auth:loginWithPin", pin),
  loginWithPassword: (usernameOrEmail, password) => networkInvoke("auth:loginWithPassword", usernameOrEmail, password),
  adminOverride: (ownerPassword) => networkInvoke("auth:adminOverride", ownerPassword),
  resetUserPin: (userId, newPin, ownerPassword) => networkInvoke("auth:resetPin", userId, newPin, ownerPassword),
  resetUserPassword: (userId, newPassword, ownerPassword) => networkInvoke("auth:resetPassword", userId, newPassword, ownerPassword),
  getPermissions: () => networkInvoke("permissions:getAll"),
  savePermissions: (rows, meta) => networkInvoke("permissions:save", rows, meta),
  resetDefaultPermissions: (meta) => networkInvoke("permissions:resetDefaults", meta),
  listRoles: () => networkInvoke("roles:list"),
  createRole: (name, meta) => networkInvoke("roles:create", name, meta),
  deleteRole: (name, meta) => networkInvoke("roles:delete", name, meta),
  getSetting: (key) => networkInvoke("settings:get", key),
  setSetting: (key, value) => networkInvoke("settings:set", key, value),
  markAllNotificationsRead: () => networkInvoke("notifications:markAllRead"),
  markNotificationRead: (id) => networkInvoke("notifications:markRead", id),
  clearNotifications: () => networkInvoke("notifications:clear"),
  createOrderWithItems: (order, items, meta) => networkInvoke("orders:createWithItems", order, items, meta),
  updateOrderWithItems: (orderId, orderUpdates, items, meta) => networkInvoke("orders:createWithItems", { ...orderUpdates, id: orderId }, items, meta),
  updateOrderStatus: (id, status, meta) => networkInvoke("orders:updateStatus", id, status, meta),
  updateKitchenStatus: (id, status, meta) => networkInvoke("orders:updateKitchenStatus", id, status, meta),
  processPurchaseOrder: (po, items, meta) => networkInvoke("purchases:processOrder", po, items, meta),
  returnPurchaseOrder: (poId, returnData, meta) => networkInvoke("purchases:returnOrder", poId, returnData, meta),
  deletePurchaseOrder: (poId, meta) => networkInvoke("purchases:deleteOrder", poId, meta),
  paySupplier: (supplierId, data, meta) => networkInvoke("suppliers:paySupplier", supplierId, data, meta),
  addInventoryTransaction: (tx) => networkInvoke("inventory:addTransaction", tx),
  submitPhysicalCount: (count) => networkInvoke("inventory:submitPhysicalCount", count),
  addExpiryBatch: (batch) => networkInvoke("inventory:addExpiryBatch", batch),
  listAccounts: () => networkInvoke("accounts:list"),
  createAccount: (data) => networkInvoke("accounts:create", data),
  updateAccount: (id, data) => networkInvoke("accounts:update", id, data),
  deleteAccount: (id) => networkInvoke("accounts:delete", id),
  settleDriverCash: (driverName, amount, meta) => networkInvoke("accounting:settleDriverCash", driverName, amount, meta),
  postJournal: (entries) => networkInvoke("journal:post", entries),
  listJournal: (filters) => networkInvoke("journal:list", filters),
  getAccountLedger: (accountCode, startDate, endDate) => networkInvoke("journal:getAccountLedger", accountCode, startDate, endDate),
  createJournal: (data) => networkInvoke("journal:create", data),
  updateJournal: (id, data) => networkInvoke("journal:update", id, data),
  reverseJournal: (id, created_by) => networkInvoke("journal:reverse", id, created_by),
  listBankAccounts: () => networkInvoke("bank:list"),
  createBankAccount: (data) => networkInvoke("bank:create", data),
  updateBankAccount: (id, data) => networkInvoke("bank:update", id, data),
  transferFunds: (data) => networkInvoke("bank:transfer", data),
  recordCustomerPayment: (data) => networkInvoke("customer:recordPayment", data),
  openShift: (data) => networkInvoke("shift:open", data),
  getCurrentShift: (cashierId) => networkInvoke("shift:getCurrent", cashierId),
  closeShift: (shiftId, data) => networkInvoke("shift:close", shiftId, data),
  listShifts: (filters) => networkInvoke("shift:list", filters),
  getProfitLoss: (startDate, endDate) => networkInvoke("accounting:profitLoss", startDate, endDate),
  getBalanceSheet: (asOfDate) => networkInvoke("accounting:balanceSheet", asOfDate),
  getTrialBalance: (startDate, endDate) => networkInvoke("accounting:trialBalance", startDate, endDate),
  getCashFlow: (startDate, endDate) => networkInvoke("accounting:cashFlow", startDate, endDate),
  processReturn: (orderId, payload, meta) => networkInvoke("sales:processReturn", orderId, payload, meta),
  getDashboardSummary: () => networkInvoke("dashboard:summary"),
  getStoreVersion: () => networkInvoke("app:getStoreVersion"),
  getVersion: () => networkInvoke("app:getVersion"),
  getDeviceName: () => networkInvoke("app:getDeviceName"),
  getPrinters: () => networkInvoke("system:getPrinters"),
  clearData: () => networkInvoke("system:clearData"),
  exportData: () => networkInvoke("system:exportData"),
  importData: (data) => networkInvoke("system:importData", data),
  printHtml: (html, printerName) => networkInvoke("system:printHtml", html, printerName),
  listDeals: () => networkInvoke("deals:list"),
};
};

const rawApi = typeof window !== "undefined" && window.api
  ? { ...memoryApi, ...window.api }
  : (import.meta.env.VITE_API_URL ? { ...memoryApi, ...buildNetworkApi() } : memoryApi);

const listeners = [];
const notify = (table) => {
  listeners.forEach((cb) => cb(table));
};

const api = { ...rawApi };

api.onInvalidate = (cb) => {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
};

const mutators = [
  "create", "update", "remove", "clearTable", "removeMultiple", 
  "paySupplier", "processPurchaseOrder", "createDeal", "updateDeal", "deleteDeal", "processReturn", "createOrderWithItems", "returnPurchaseOrder",
  "updateOrderWithItems", "updateOrderStatus", "updateKitchenStatus", "markNotificationRead", 
  "markAllNotificationsRead", "clearNotifications", "setSetting", "deleteSetting", "saveInventory",
  "openShift", "closeShift", "createAccount", "updateAccount", "deleteAccount",
  "createJournal", "updateJournal", "reverseJournal"
];

mutators.forEach(method => {
  if (rawApi[method]) {
    api[method] = async (...args) => {
      const res = await rawApi[method](...args);
      // Invalidate everything after a mutation to keep UI perfectly synced
      notify("*");
      return res;
    };
  }
});

api.clearData = async () => {
  const emptyStore = {
    users: [{ id: 1, name: "System Admin", username: "admin", password: "password", role: "Owner", status: "active", branch: "Main Branch", pin: "1234" }],
    accounts: [{ id: 1, name: "Cash in Hand", type: "Asset", balance: 0 }],
    sequences: {}
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyStore));
  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  if (rawApi.clearData) {
    await rawApi.clearData();
  }
  return { success: true };
};

export default api;
