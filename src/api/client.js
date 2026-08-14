import * as mock from "../data/mockData";

// ---- In-memory fallback store (used only when not running inside Electron) ----
let memId = 10000;
const nextId = () => ++memId;

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
  Owner:          { can_view:1, can_add:1, can_edit:1, can_delete:1, can_export:1 },
  Manager:        { can_view:1, can_add:1, can_edit:1, can_delete:0, can_export:1 },
  Cashier:        { can_view:1, can_add:1, can_edit:1, can_delete:0, can_export:0 },
  Waiter:         { can_view:1, can_add:1, can_edit:1, can_delete:0, can_export:0 },
  "Kitchen Staff":{ can_view:1, can_add:0, can_edit:1, can_delete:0, can_export:0 },
  Accountant:     { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:1 },
};

const buildInitialPermissions = () => {
  const rows = [];
  for (const [role, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const module of MODULES) {
      rows.push({ role, module, ...perms });
    }
  }
  return rows;
};

const buildInitialStore = () => {
  const initialStore = {
    users: [
      { id: nextId(), name: "Hammadullah", role: "Owner", pin: "1234", password: "owner123", email: "owner@dastarkhwan.pk", phone: "0300-0000001", branch: "Main Branch", status: "active", last_login: "Today, 9:02 AM", profile_photo: null },
      { id: nextId(), name: "Bilal Hussain", role: "Cashier", pin: "2345", password: "cashier123", email: "bilal@dastarkhwan.pk", phone: "0300-0000002", branch: "Main Branch", status: "active", last_login: "Today, 11:40 AM", profile_photo: null },
      { id: nextId(), name: "Ahmed Raza", role: "Waiter", pin: "3456", password: "waiter123", email: "ahmed@dastarkhwan.pk", phone: "0300-0000003", branch: "Main Branch", status: "active", last_login: "Today, 11:52 AM", profile_photo: null },
      { id: nextId(), name: "Chef Imran", role: "Kitchen Staff", pin: "4567", password: "kitchen123", email: "imran@dastarkhwan.pk", phone: "0300-0000004", branch: "Main Branch", status: "active", last_login: "Today, 10:15 AM", profile_photo: null },
    ],
    categories: mock.menuCategories.map((c) => ({ id: nextId(), name: c, printer_station: "Grill", display_order: 1 })),
    menu_items: mock.menuItems.map((m) => ({ id: nextId(), name: m.name, category: m.category, price: m.price, cost: m.cost, status: m.status, prep_time: 10, station: "Grill", image: m.img })),
    inventory_items: mock.inventoryItems.map((i) => ({ id: nextId(), name: i.name, category: i.category, unit: i.unit, stock: i.stock, reorder: i.reorder, cost: i.cost, status: i.status })),
    suppliers: mock.suppliers.map((s) => ({ id: nextId(), name: s.name, phone: s.phone, category: s.category, due: s.due, status: s.status })),
    purchase_orders: mock.purchaseOrders.map((p) => ({ id: nextId(), supplier: p.supplier, date: new Date().toISOString(), total: p.total, status: p.status })),
    customers: mock.customers.map((c) => ({ id: nextId(), name: c.name, phone: c.phone, email: c.email || "", visits: c.visits, points: c.points, credit: c.credit, tier: c.tier, total_billed: 0, total_paid: 0 })),
    employees: mock.employees.map((e) => ({ id: nextId(), name: e.name, role: e.role, phone: e.phone, status: e.status, joined: new Date().toISOString() })),
    expenses: mock.expenses.map((e) => ({ id: nextId(), category: e.category, amount: e.amount, date: new Date().toISOString(), paid_by: e.paidBy, notes: "" })),
    tables_floor: mock.tables.map((t) => ({ id: t.id, section: t.section, seats: t.seats, status: t.status, order_id: t.order })),
    orders: mock.orders.map((o) => ({ id: o.id, type: o.type, table_id: o.table, customer: o.customer, items_count: o.items, total: o.total, status: o.status, waiter: o.waiter, time: o.time, created_at: new Date().toISOString() })),
    order_items: [],
    kitchen_tickets: [],
    notifications: mock.notifications.map((n) => ({ id: nextId(), type: n.type, text: n.text, time: n.time, read: 0 })),
    audit_log: mock.auditLog.map((a) => ({ id: nextId(), time: a.time, user: a.user, module: a.module, action: a.action, ip_device: "Browser-Dev" })),
    sales_returns: [],
    role_permissions: buildInitialPermissions(),
    custom_roles: [],
    recipes: [],
    purchase_order_items: [],
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
    created_at: new Date().toISOString(),
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

// Ensure new fields exist on existing stored data
if (!store.role_permissions) store.role_permissions = buildInitialPermissions();
if (!store.custom_roles) store.custom_roles = [];
store.users = store.users.map((u) => ({
  profile_photo: null, email: "", phone: "", branch: "Main Branch", password: "",
  ...u,
}));
store.orders = (store.orders || []).map((o) => ({
  kitchen_status: o.kitchen_status || (["paid", "served", "completed"].includes(o.status) ? "served" : "new"),
  ...o,
}));
store.audit_log = (store.audit_log || []).map((a) => ({ ip_device: "Browser-Dev", ...a }));
if (!store.recipes) store.recipes = [];
if (!store.purchase_order_items) store.purchase_order_items = [];
store.customers = (store.customers || []).map((c) => ({ email: "", ...c }));
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

const persistStore = () => writeStoredState(STORAGE_KEY, store);
const persistSettings = () => writeStoredState(SETTINGS_STORAGE_KEY, settingsStore);

const delay = (v) => new Promise((res) => setTimeout(() => res(v), 80));

const memoryApi = {
  isElectron: false,
  pushNotification: (type, text) => {
    const n = { id: nextId(), type, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), read: 0 };
    store.notifications = [n, ...(store.notifications || [])];
    persistStore();
  },
  list: (table, opts = {}) => {
    let rows = [...(store[table] || [])];
    if (opts.where) {
      rows = rows.filter((r) => Object.entries(opts.where).every(([k, v]) => r[k] === v));
    }
    if (opts.orderBy) {
      const [col, dir] = opts.orderBy.split(" ");
      rows.sort((a, b) => {
        if (a[col] < b[col]) return dir === "DESC" ? 1 : -1;
        if (a[col] > b[col]) return dir === "DESC" ? -1 : 1;
        return 0;
      });
    }
    return delay(rows);
  },
  get: (table, id) => delay((store[table] || []).find((r) => r.id === id)),
  create: (table, data) => {
    const row = { id: data.id ?? nextId(), ...data };
    const existingIdx = (store[table] || []).findIndex((r) => r.id === row.id);
    if (existingIdx >= 0) {
      store[table][existingIdx] = { ...store[table][existingIdx], ...row };
    } else {
      store[table] = [row, ...(store[table] || [])];
    }
    persistStore();
    return delay(row);
  },
  update: (table, id, data) => {
    store[table] = (store[table] || []).map((r) => (r.id === id ? { ...r, ...data } : r));
    persistStore();
    return delay(store[table].find((r) => r.id === id));
  },
  remove: (table, id) => {
    store[table] = (store[table] || []).filter((r) => r.id !== id);
    persistStore();
    return delay({ success: true, id });
  },

  // Auth
  loginWithPin: (pin) => {
    const user = store.users.find((u) => u.pin === pin && u.status === "active");
    if (user) {
      const idx = store.users.findIndex((u) => u.id === user.id);
      store.users[idx] = { ...user, last_login: new Date().toLocaleString() };
      store.audit_log = [{ id: nextId(), time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), user: user.name, module: "Authentication", action: "Logged in via PIN", ip_device: "Browser-Dev" }, ...store.audit_log];
      persistStore();
    }
    return delay(user ? { success: true, user: store.users.find((u) => u.id === user.id) } : { success: false, message: "Invalid PIN" });
  },
  loginWithPassword: (usernameOrEmail, password) => {
    const user = store.users.find((u) => (u.name === usernameOrEmail || u.email === usernameOrEmail) && u.password === password && u.status === "active");
    if (user) {
      const idx = store.users.findIndex((u) => u.id === user.id);
      store.users[idx] = { ...user, last_login: new Date().toLocaleString() };
      store.audit_log = [{ id: nextId(), time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), user: user.name, module: "Authentication", action: "Logged in via Password", ip_device: "Browser-Dev" }, ...store.audit_log];
      persistStore();
    }
    return delay(user ? { success: true, user: store.users.find((u) => u.id === user.id) } : { success: false, message: "Invalid username or password" });
  },
  adminOverride: (ownerPassword) => {
    const owner = store.users.find((u) => u.role === "Owner" && u.password === ownerPassword);
    return delay(owner ? { success: true, owner } : { success: false, message: "Incorrect master password" });
  },
  resetUserPin: (userId, newPin, ownerPassword) => {
    const owner = store.users.find((u) => u.role === "Owner" && u.password === ownerPassword);
    if (!owner) return delay({ success: false, message: "Incorrect master password" });
    store.users = store.users.map((u) => (u.id === userId ? { ...u, pin: newPin } : u));
    persistStore();
    return delay({ success: true });
  },
  resetUserPassword: (userId, newPassword, ownerPassword) => {
    const owner = store.users.find((u) => u.role === "Owner" && u.password === ownerPassword);
    if (!owner) return delay({ success: false, message: "Incorrect master password" });
    store.users = store.users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u));
    persistStore();
    return delay({ success: true });
  },

  // Permissions
  getPermissions: () => delay([...(store.role_permissions || [])]),
  savePermissions: (rows) => {
    for (const r of rows) {
      const idx = store.role_permissions.findIndex((p) => p.role === r.role && p.module === r.module);
      if (idx >= 0) store.role_permissions[idx] = { ...store.role_permissions[idx], ...r };
      else store.role_permissions.push(r);
    }
    persistStore();
    return delay({ success: true });
  },
  resetDefaultPermissions: () => {
    store.role_permissions = buildInitialPermissions();
    persistStore();
    return delay({ success: true });
  },

  // Custom Roles
  listRoles: () => {
    const builtIn = Object.keys(DEFAULT_PERMISSIONS).map((name) => ({ id: null, name, isBuiltIn: true }));
    const custom = (store.custom_roles || []).map((r) => ({ ...r, isBuiltIn: false }));
    return delay([...builtIn, ...custom]);
  },
  createRole: (name) => {
    if (store.custom_roles.find((r) => r.name === name)) return delay({ success: false, message: "Role already exists" });
    const newRole = { id: nextId(), name };
    store.custom_roles = [...store.custom_roles, newRole];
    // Seed no-access permissions for new role
    for (const module of MODULES) {
      store.role_permissions.push({ role: name, module, can_view: 0, can_add: 0, can_edit: 0, can_delete: 0, can_export: 0 });
    }
    persistStore();
    return delay({ success: true });
  },
  deleteRole: (name) => {
    store.custom_roles = store.custom_roles.filter((r) => r.name !== name);
    store.role_permissions = store.role_permissions.filter((r) => r.role !== name);
    persistStore();
    return delay({ success: true });
  },

  // Settings
  getSetting: (key) => delay(settingsStore[key] || null),
  setSetting: (key, value) => {
    settingsStore[key] = value;
    persistSettings();
    return delay({ success: true });
  },

  // Orders
  createOrderWithItems: (order, items) => {
    const full = {
      subtotal: order.total, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0,
      payment_method: null, payment_details: null, tendered: null, change_due: null,
      refunded_total: 0, order_note: null, created_at: new Date().toISOString(),
      ...order,
    };
    if (full.kitchen_status == null) {
      full.kitchen_status = ["served", "completed"].includes(full.status) ? "served" : "new";
    }
    const existingIdx = store.orders.findIndex((o) => o.id === full.id);
    if (existingIdx >= 0) store.orders[existingIdx] = { ...store.orders[existingIdx], ...full };
    else store.orders = [full, ...store.orders];
    store.order_items = [...store.order_items.filter((it) => it.order_id !== full.id), ...items.map((it) => ({ id: nextId(), order_id: full.id, ...it }))];
    if (full.table_id) {
      store.tables_floor = store.tables_floor.map((t) =>
        t.id === full.table_id ? { ...t, status: "occupied", order_id: full.id } : t
      );
    }
    
    // Auto-deduct inventory based on recipes
    for (const item of items) {
      const recipeLines = store.recipes.filter(r => r.menu_item_id === item.menu_item_id);
      for (const line of recipeLines) {
        const deductQty = line.qty * item.qty;
        store.inventory_items = store.inventory_items.map(inv => {
          if (inv.id === line.inventory_item_id) {
            const newStock = inv.stock - deductQty;
            if (newStock <= inv.reorder && inv.stock > inv.reorder) {
              memoryApi.pushNotification("alert", `Low Stock: ${inv.name} has fallen below its reorder point.`);
            }
            return { ...inv, stock: newStock, status: newStock <= 0 ? "critical" : newStock <= inv.reorder ? "low" : "in_stock" };
          }
          return inv;
        });
      }
    }
    
    if (full.total > 5000) {
      memoryApi.pushNotification("info", `High-value order #${full.id} placed for Rs. ${full.total.toLocaleString()}.`);
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
    
    persistStore();
    return delay(full);
  },
  updateOrderWithItems: (orderId, orderUpdates, items) => {
    const existingOrder = store.orders.find((o) => o.id === orderId);
    if (!existingOrder) return delay(null);
    const updatedOrder = { ...existingOrder, ...orderUpdates };
    store.orders = store.orders.map((o) => (o.id === orderId ? updatedOrder : o));
    store.order_items = [
      ...store.order_items.filter((it) => it.order_id !== orderId),
      ...items.map((it) => ({ id: it.id || nextId(), order_id: orderId, ...it }))
    ];
    if (updatedOrder.table_id) {
      store.tables_floor = store.tables_floor.map((t) =>
        t.id === updatedOrder.table_id ? { ...t, status: "occupied", order_id: updatedOrder.id } : t
      );
    }
    persistStore();
    return delay(updatedOrder);
  },
  processPurchaseOrder: (poData, itemsData) => {
    // 1. Create or Update PO
    const po = { id: poData.id ?? nextId(), ...poData };
    const existingPoIdx = store.purchase_orders.findIndex(p => p.id === po.id);
    if (existingPoIdx >= 0) store.purchase_orders[existingPoIdx] = { ...store.purchase_orders[existingPoIdx], ...po };
    else store.purchase_orders = [po, ...store.purchase_orders];

    // 2. Save items
    store.purchase_order_items = [
      ...store.purchase_order_items.filter(it => it.po_id !== po.id),
      ...itemsData.map(it => ({ id: it.id || nextId(), po_id: po.id, ...it }))
    ];

    // 3. If Received, update inventory stock and supplier due balance
    if (po.status === "received") {
      // Update inventory stock
      for (const item of itemsData) {
        store.inventory_items = store.inventory_items.map(inv =>
          inv.id === item.inventory_item_id
            ? { ...inv, stock: Number(inv.stock) + Number(item.qty) }
            : inv
        );
      }
      
      // Update supplier due balance (add PO total to due)
      // Assuming payment happens separately, but for now we increase the debt
      store.suppliers = store.suppliers.map(s => 
        s.name === po.supplier 
          ? { ...s, due: Number(s.due || 0) + Number(po.total) }
          : s
      );
    }
    
    persistStore();
    return delay(po);
  },
  processReturn: (orderId, payload) => {
    const { items, reason, restock, kind } = payload;
    const amount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const ret = { id: nextId(), order_id: orderId, kind: kind || "return", items: JSON.stringify(items), amount, reason: reason || "", restock: restock ? 1 : 0, time, created_at: new Date().toISOString() };
    store.sales_returns = [ret, ...store.sales_returns];
    store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, refunded_total: (o.refunded_total || 0) + amount } : o));

    // Adjust kitchen order items
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

    // Check if there are any items left in the kitchen for this order
    const hasItemsLeft = store.order_items.some((it) => it.order_id === orderId);
    if (!hasItemsLeft) {
      store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, kitchen_status: "cancelled" } : o));
    }

    persistStore();
    return delay({ order: store.orders.find((o) => o.id === orderId), return: ret });
  },
  updateOrderStatus: (id, status) => {
    store.orders = store.orders.map((o) => (o.id === id ? { ...o, status } : o));
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },
  updateKitchenStatus: (id, kitchen_status) => {
    store.orders = store.orders.map((o) => (o.id === id ? { ...o, kitchen_status } : o));
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },
  getDashboardSummary: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeToday = store.orders.filter((o) => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.created_at);
      return d >= today && d < tomorrow;
    });

    const expensesToday = store.expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= today && d < tomorrow;
    });

    return delay({
      todaySales: activeToday.reduce((s, o) => s + Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0)), 0),
      todayOrders: activeToday.length,
      lowStockCount: store.inventory_items.filter((i) => i.status === "low" || i.status === "critical").length,
      expensesTotal: expensesToday.reduce((s, e) => s + Number(e.amount || 0), 0),
    });
  },
  closeDay: (summary) => {
    // summary contains: { cashSales, cardSales, expenses, totalSales, netCash, ... }
    const now = new Date();
    store.audit_log = [{ id: nextId(), time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), user: summary.user || "System", module: "Operations", action: `Day Closed. Sales: Rs. ${summary.totalSales}`, ip_device: "Browser-Dev" }, ...store.audit_log];
    memoryApi.pushNotification("success", `Day closed successfully by ${summary.user || "System"}. Net Cash: Rs. ${summary.netCash}`);
    
    // Optionally archive/reset today's orders (mock implementation keeps them for history)
    persistStore();
    return delay({ success: true });
  },
  getVersion: () => delay("0.1.0 (browser preview)"),
  getDeviceName: () => delay("Browser-Dev"),
  getPrinters: () => delay([]),
};

const api = typeof window !== "undefined" && window.api ? window.api : memoryApi;

export default api;
