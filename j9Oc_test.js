import * as mock from "./src/data/mockData.js";

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
    tables_floor: mock.tables.map((t) => {
      const occupied_seats = [];
      if (t.status === "occupied" && t.order) {
        occupied_seats.push({ order_id: t.order, seats_occupied: t.seats });
      }
      return { id: t.id, section: t.section, seats: t.seats, status: t.status, order_id: t.order, occupied_seats };
    }),
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
    supplier_payments: [],
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
store.tables_floor = (store.tables_floor || []).map((t) => {
  const occupied_seats = t.occupied_seats || [];
  if (occupied_seats.length === 0 && t.status === "occupied" && t.order_id) {
    occupied_seats.push({ order_id: t.order_id, seats_occupied: t.seats });
  }
  return { occupied_seats, ...t };
});
store.audit_log = (store.audit_log || []).map((a) => ({ ip_device: "Browser-Dev", ...a }));
if (!store.recipes) store.recipes = [];
if (!store.purchase_order_items) store.purchase_order_items = [];
if (!store.supplier_payments) store.supplier_payments = [];
store.customers = (store.customers || []).map((c) => ({ email: "", ...c }));
const settingsStore = readStoredState(SETTINGS_STORAGE_KEY, {
  restaurant_profile: {
    name: "Dastarkhwan Restaurant",
    tagline: "Authentic Taste & Hospitality",
    logo: null,
    ownerName: "Hammadullah",
    ownerTitle: "Founder & Owner",
    ownerPhoto: null,
    ownerPhone: "0300-0000001",
    ownerEmail: "owner@dastarkhwan.pk",
    address: "University Road, Peshawar",
    phone: "091-1234567",
    ntn: "1234567-8",
    currency: "PKR",
    taxRate: 0,
    serviceCharge: 0,
    receiptFooter: "Thank you for dining with us — visit again!",
    showLogo: true,
    showOwnerInfo: true,
    showTaxBreakdown: true,
    showCashierName: true,
    showQrCode: false,
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
    if (table === "tables_floor") {
      store.tables_floor = store.tables_floor.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...data };
          if (updated.status !== "occupied") {
            const orders_to_update = (t.occupied_seats || []).map((o) => o.order_id);
            orders_to_update.forEach((orderId) => {
              const order = store.orders.find((o) => o.id === orderId);
              if (order && order.table_assignments) {
                order.table_assignments = order.table_assignments.filter((a) => a.table_id !== id);
                order.table_id = order.table_assignments.length > 0 ? order.table_assignments[0].table_id : null;
              }
            });
            updated.occupied_seats = [];
            updated.order_id = null;
          }
          return updated;
        }
        return t;
      });
      persistStore();
      return delay(store.tables_floor.find((t) => t.id === id));
    }
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
      const assignments = full.table_assignments || [{ table_id: full.table_id, seats_occupied: null }];
      store.tables_floor = store.tables_floor.map((t) => {
        const assignment = assignments.find((a) => a.table_id === t.id);
        if (assignment) {
          const seats_to_occupy = assignment.seats_occupied || t.seats;
          const other_occupied = (t.occupied_seats || []).filter((o) => o.order_id !== full.id);
          return {
            ...t,
            status: "occupied",
            order_id: full.id,
            occupied_seats: [...other_occupied, { order_id: full.id, seats_occupied: seats_to_occupy }]
          };
        } else {
          const new_occupied = (t.occupied_seats || []).filter((o) => o.order_id !== full.id);
          if (new_occupied.length === 0) {
            return t.order_id === full.id ? { ...t, status: "available", order_id: null, occupied_seats: [] } : t;
          } else {
            return { ...t, status: "occupied", order_id: new_occupied[0].order_id, occupied_seats: new_occupied };
          }
        }
      });
    } else {
      store.tables_floor = store.tables_floor.map((t) => {
        const new_occupied = (t.occupied_seats || []).filter((o) => o.order_id !== full.id);
        if (new_occupied.length === 0) {
          return t.order_id === full.id ? { ...t, status: "available", order_id: null, occupied_seats: [] } : t;
        } else {
          return { ...t, status: "occupied", order_id: new_occupied[0].order_id, occupied_seats: new_occupied };
        }
      });
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
          const creditIncrease = billedAmount - actualPaid; // can be negative if customer overpaid
          
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
  restoreInventoryForOrder: (orderId) => {
    const orderItems = store.order_items.filter((it) => it.order_id === orderId && it.qty > 0);
    if (!orderItems.length) return;

    for (const item of orderItems) {
      const recipeLines = store.recipes.filter((r) => r.menu_item_id === item.menu_item_id);
      for (const line of recipeLines) {
        const restoreQty = Number(line.qty || 0) * Number(item.qty || 0);
        if (restoreQty <= 0) continue;

        store.inventory_items = store.inventory_items.map((inv) => {
          if (inv.id !== line.inventory_item_id) return inv;
          const newStock = Number(inv.stock || 0) + restoreQty;
          const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
          return { ...inv, stock: newStock, status: newStatus };
        });
      }
    }
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
      const assignments = updatedOrder.table_assignments || [{ table_id: updatedOrder.table_id, seats_occupied: null }];
      store.tables_floor = store.tables_floor.map((t) => {
        const assignment = assignments.find((a) => a.table_id === t.id);
        if (assignment) {
          const seats_to_occupy = assignment.seats_occupied || t.seats;
          const other_occupied = (t.occupied_seats || []).filter((o) => o.order_id !== updatedOrder.id);
          return {
            ...t,
            status: "occupied",
            order_id: updatedOrder.id,
            occupied_seats: [...other_occupied, { order_id: updatedOrder.id, seats_occupied: seats_to_occupy }]
          };
        } else {
          const new_occupied = (t.occupied_seats || []).filter((o) => o.order_id !== updatedOrder.id);
          if (new_occupied.length === 0) {
            return t.order_id === updatedOrder.id ? { ...t, status: "available", order_id: null, occupied_seats: [] } : t;
          } else {
            return { ...t, status: "occupied", order_id: new_occupied[0].order_id, occupied_seats: new_occupied };
          }
        }
      });
    } else {
      store.tables_floor = store.tables_floor.map((t) => {
        const new_occupied = (t.occupied_seats || []).filter((o) => o.order_id !== updatedOrder.id);
        if (new_occupied.length === 0) {
          return t.order_id === updatedOrder.id ? { ...t, status: "available", order_id: null, occupied_seats: [] } : t;
        } else {
          return { ...t, status: "occupied", order_id: new_occupied[0].order_id, occupied_seats: new_occupied };
        }
      });
    }
    persistStore();
    return delay(updatedOrder);
  },
  processPurchaseOrder: (poData, itemsData) => {
    const poId = poData.id ?? nextId();
    const existingPo = (store.purchase_orders || []).find(p => p.id === poId);
    
    const wasAlreadyReceived = existingPo ? !!existingPo.was_received : false;
    const isNowReceiving = poData.status === "received" && !wasAlreadyReceived;

    const po = {
      id: poId,
      supplier: poData.supplier,
      date: poData.date || new Date().toISOString().split("T")[0],
      status: poData.status || "draft",
      total: Number(poData.total || 0),
      was_received: wasAlreadyReceived || isNowReceiving,
      received_at: isNowReceiving ? new Date().toISOString() : (existingPo?.received_at || null),
      created_at: existingPo?.created_at || new Date().toISOString(),
    };

    if (existingPo) {
      const idx = store.purchase_orders.findIndex(p => p.id === poId);
      store.purchase_orders[idx] = { ...existingPo, ...po };
    } else {
      store.purchase_orders = [po, ...(store.purchase_orders || [])];
    }

    // Save purchase order items
    store.purchase_order_items = [
      ...store.purchase_order_items.filter(it => it.po_id !== poId),
      ...itemsData.map(it => ({
        id: it.id || nextId(),
        po_id: poId,
        inventory_item_id: it.inventory_item_id,
        name: it.name,
        unit: it.unit,
        qty: Number(it.qty || 0),
        cost: Number(it.cost || 0),
        returned_qty: Number(it.returned_qty || 0)
      }))
    ];

    // If transitioned to Received, update inventory stock and supplier due balance
    if (isNowReceiving) {
      for (const item of itemsData) {
        if (!item.inventory_item_id) continue;
        store.inventory_items = store.inventory_items.map(inv => {
          if (inv.id === item.inventory_item_id) {
            const addQty = Number(item.qty || 0);
            const newStock = Number(inv.stock || 0) + addQty;
            const newCost = Number(item.cost || 0) > 0 ? Number(item.cost) : Number(inv.cost || 0);
            const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
            return { ...inv, stock: newStock, cost: newCost, status: newStatus };
          }
          return inv;
        });
      }

      // Update supplier due balance
      if (po.supplier) {
        store.suppliers = store.suppliers.map(s =>
          s.name === po.supplier
            ? { ...s, due: Number(s.due || 0) + Number(po.total) }
            : s
        );
      }

      // Log in Audit Log
      store.audit_log = [{
        id: nextId(),
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        user: "System",
        module: "Purchases",
        action: `Received PO #${poId} from ${po.supplier} (Rs. ${po.total.toLocaleString()})`,
        ip_device: "Browser-Dev"
      }, ...store.audit_log];

      memoryApi.pushNotification("success", `PO #${poId} received. Stock levels and supplier due updated.`);
    }

    persistStore();
    return delay(po);
  },

  deletePurchaseOrder: (poId) => {
    const po = (store.purchase_orders || []).find(p => p.id === poId);
    if (!po) return delay({ success: false, message: "Purchase order not found" });

    // If received, reverse stock additions and supplier dues
    if (po.was_received || po.status === "received") {
      const poItems = (store.purchase_order_items || []).filter(it => it.po_id === poId);
      
      for (const item of poItems) {
        if (!item.inventory_item_id) continue;
        const netReceivedQty = Number(item.qty || 0) - Number(item.returned_qty || 0);
        store.inventory_items = store.inventory_items.map(inv => {
          if (inv.id === item.inventory_item_id) {
            const newStock = Math.max(0, Number(inv.stock || 0) - netReceivedQty);
            const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
            return { ...inv, stock: newStock, status: newStatus };
          }
          return inv;
        });
      }

      // Reverse supplier due balance
      const netDueAdjustment = Number(po.total || 0) - Number(po.returned_amount || 0);
      if (po.supplier && netDueAdjustment > 0) {
        store.suppliers = store.suppliers.map(s =>
          s.name === po.supplier
            ? { ...s, due: Math.max(0, Number(s.due || 0) - netDueAdjustment) }
            : s
        );
      }
    }

    // Remove PO and items
    store.purchase_orders = store.purchase_orders.filter(p => p.id !== poId);
    store.purchase_order_items = store.purchase_order_items.filter(it => it.po_id !== poId);
    
    // Audit Log
    store.audit_log = [{
      id: nextId(),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      user: "System",
      module: "Purchases",
      action: `Deleted PO #${poId} (Stock & dues adjusted)`,
      ip_device: "Browser-Dev"
    }, ...store.audit_log];

    persistStore();
    return delay({ success: true, id: poId });
  },

  returnPurchaseOrder: (poId, returnData) => {
    const po = (store.purchase_orders || []).find(p => p.id === poId);
    if (!po) return delay({ success: false, message: "Purchase order not found" });

    const { itemsToReturn, reason, refundMode } = returnData;
    let totalReturnAmount = 0;

    // Process each return item
    for (const ret of itemsToReturn) {
      const returnQty = Number(ret.qty || 0);
      if (returnQty <= 0) continue;
      const lineAmount = returnQty * Number(ret.cost || 0);
      totalReturnAmount += lineAmount;

      // Deduct returned qty from inventory stock
      store.inventory_items = store.inventory_items.map(inv => {
        if (inv.id === ret.inventory_item_id) {
          const newStock = Math.max(0, Number(inv.stock || 0) - returnQty);
          const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
          return { ...inv, stock: newStock, status: newStatus };
        }
        return inv;
      });

      // Update purchase_order_items returned_qty
      store.purchase_order_items = store.purchase_order_items.map(it => {
        if (it.po_id === poId && it.inventory_item_id === ret.inventory_item_id) {
          return { ...it, returned_qty: Number(it.returned_qty || 0) + returnQty };
        }
        return it;
      });
    }

    // Deduct return amount from supplier due balance (if credit note / deduct due)
    if (po.supplier && totalReturnAmount > 0 && refundMode !== "Cash Refund") {
      store.suppliers = store.suppliers.map(s =>
        s.name === po.supplier
          ? { ...s, due: Math.max(0, Number(s.due || 0) - totalReturnAmount) }
          : s
      );
    }

    // Check if PO is fully or partially returned
    const allPoItems = store.purchase_order_items.filter(it => it.po_id === poId);
    const isFullyReturned = allPoItems.length > 0 && allPoItems.every(it => Number(it.returned_qty || 0) >= Number(it.qty || 0));

    const updatedStatus = isFullyReturned ? "returned" : "partially_returned";
    const updatedPo = {
      ...po,
      status: updatedStatus,
      returned_amount: Number(po.returned_amount || 0) + totalReturnAmount
    };

    store.purchase_orders = store.purchase_orders.map(p => p.id === poId ? updatedPo : p);

    // Save return log
    const returnRecord = {
      id: nextId(),
      po_id: poId,
      supplier: po.supplier,
      total_amount: totalReturnAmount,
      reason: reason || "Returned to supplier",
      refund_mode: refundMode || "Deduct Supplier Due",
      items: JSON.stringify(itemsToReturn),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      created_at: new Date().toISOString(),
    };

    if (!store.purchase_returns) store.purchase_returns = [];
    store.purchase_returns = [returnRecord, ...store.purchase_returns];

    // Audit log
    store.audit_log = [{
      id: nextId(),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      user: "System",
      module: "Purchases",
      action: `Purchase Return for PO #${poId} (Amount: Rs. ${totalReturnAmount.toLocaleString()})`,
      ip_device: "Browser-Dev"
    }, ...store.audit_log];

    memoryApi.pushNotification("info", `Purchase Return recorded for PO #${poId}. Stock & supplier balance updated.`);

    persistStore();
    return delay({ success: true, return: returnRecord, po: updatedPo });
  },

  paySupplier: (supplierId, data, meta = {}) => {
    const supplier = (store.suppliers || []).find(s => s.id === supplierId);
    if (!supplier) return delay({ success: false, message: "Supplier not found" });

    const amount = Number(data.amount || 0);
    if (amount <= 0) return delay({ success: false, message: "Payment amount must be greater than zero" });

    const newDue = Math.max(0, Number(supplier.due || 0) - amount);
    store.suppliers = (store.suppliers || []).map(s => s.id === supplierId ? { ...s, due: newDue } : s);

    const paymentRecord = {
      id: nextId(),
      supplier_id: supplierId,
      supplier_name: supplier.name,
      amount,
      payment_method: data.payment_method || "Cash",
      notes: data.notes || "",
      date: data.date || new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString()
    };
    if (!store.supplier_payments) store.supplier_payments = [];
    store.supplier_payments = [paymentRecord, ...store.supplier_payments];

    const expenseRecord = {
      id: nextId(),
      category: "Supplier Payment",
      amount,
      date: data.date || new Date().toISOString().split("T")[0],
      paid_by: meta.user || "System",
      notes: `Payment to supplier ${supplier.name}. Notes: ${data.notes || "None"}`
    };
    store.expenses = [expenseRecord, ...(store.expenses || [])];

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    store.audit_log = [{
      id: nextId(), time,
      user: meta.user || "System",
      module: "Suppliers",
      action: `Recorded payment of Rs. ${amount.toLocaleString()} to supplier ${supplier.name}`,
      ip_device: "Browser-Dev"
    }, ...(store.audit_log || [])];

    memoryApi.pushNotification("success", `Payment of Rs. ${amount.toLocaleString()} recorded for ${supplier.name}`);
    persistStore();
    return delay({ success: true, supplier: (store.suppliers || []).find(s => s.id === supplierId), payment: paymentRecord });
  },

  processReturn: (orderId, payload) => {
    const { items, reason, restock, kind } = payload;
    const amount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const ret = { id: nextId(), order_id: orderId, kind: kind || "return", items: JSON.stringify(items), amount, reason: reason || "", restock: restock ? 1 : 0, time, created_at: new Date().toISOString() };
    store.sales_returns = [ret, ...store.sales_returns];
    store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, refunded_total: (o.refunded_total || 0) + amount } : o));

    // Reverse customer credit/balance for the refunded amount
    const refundedOrder = store.orders.find((o) => o.id === orderId);
    if (refundedOrder && refundedOrder.customer_id) {
      store.customers = store.customers.map(c => {
        if (c.id === refundedOrder.customer_id) {
          // Reduce credit by refunded amount (customer owes less now)
          const newCredit = Math.max(0, (c.credit || 0) - amount);
          return {
            ...c,
            total_billed: Math.max(0, (c.total_billed || 0) - amount),
            credit: newCredit,
          };
        }
        return c;
      });
    }

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
      store.orders = store.orders.map((o) =>
        o.id === orderId ? { ...o, kitchen_status: "cancelled", status: "cancelled" } : o
      );
    }

    persistStore();
    return delay({ order: store.orders.find((o) => o.id === orderId), return: ret });
  },
  assignTablesAndSeats: (orderId, assignments) => {
    const order = store.orders.find((o) => o.id === orderId);
    if (order) {
      order.table_assignments = assignments;
      order.table_id = assignments.length > 0 ? assignments[0].table_id : null;
    }
    store.tables_floor = store.tables_floor.map((t) => {
      const remaining_occupied = (t.occupied_seats || []).filter((o) => o.order_id !== orderId);
      const assignment = assignments.find((a) => a.table_id === t.id);
      if (assignment) {
        const seats_to_occupy = assignment.seats_occupied || t.seats;
        const new_occupied = [...remaining_occupied, { order_id: orderId, seats_occupied: seats_to_occupy }];
        return {
          ...t,
          status: "occupied",
          order_id: orderId,
          occupied_seats: new_occupied
        };
      } else {
        if (remaining_occupied.length === 0) {
          return t.order_id === orderId
            ? { ...t, status: "available", order_id: null, occupied_seats: [] }
            : t;
        } else {
          return {
            ...t,
            status: "occupied",
            order_id: remaining_occupied[0].order_id,
            occupied_seats: remaining_occupied
          };
        }
      }
    });
    persistStore();
    return delay({ success: true });
  },
  updateOrderStatus: (id, status) => {
    store.orders = store.orders.map((o) => {
      if (o.id !== id) return o;
      const updated = { ...o, status };
      if (status === "cancelled") {
        updated.kitchen_status = "cancelled";
        if (o.status !== "cancelled") {
          api.restoreInventoryForOrder(id);
        }
      }
      return updated;
    });
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },
  updateKitchenStatus: (id, kitchen_status) => {
    store.orders = store.orders.map((o) => {
      if (o.id !== id) return o;
      const updated = { ...o, kitchen_status };
      if (kitchen_status === "cancelled") {
        updated.status = "cancelled";
        if (o.status !== "cancelled") {
          api.restoreInventoryForOrder(id);
        }
      }
      return updated;
    });
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
