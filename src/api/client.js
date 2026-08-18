import * as mock from "../data/mockData.js";

// ---- In-memory fallback store (used only when not running inside Electron) ----
let memId = 10000;
const nextId = () => ++memId;

const getLocalISODate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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

const MODULE_OVERRIDES = {
  Owner: {},
  Manager: {
    "Settings":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Users & Roles":    { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Backup & Restore": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
  },
  Cashier: {
    "Dashboard":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Kitchen Display":  { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Table Management": { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Menu Management":  { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Recipe Management":{ can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Inventory":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Suppliers":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Purchases":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Customers":        { can_view:1, can_add:1, can_edit:0, can_delete:0, can_export:0 },
    "Employees":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Users & Roles":    { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Expenses":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Accounting":       { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Reports":          { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Settings":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Backup & Restore": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Audit Log":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Hardware":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
  },
  Waiter: {
    "Dashboard":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "POS Billing":      { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Sales":            { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Kitchen Display":  { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Menu Management":  { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Recipe Management":{ can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Inventory":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Suppliers":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Purchases":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Customers":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Employees":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Users & Roles":    { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Expenses":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Accounting":       { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Reports":          { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Settings":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Backup & Restore": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Audit Log":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Hardware":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Notifications":    { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Printing":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
  },
  "Kitchen Staff": {
    "Dashboard":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "POS Billing":      { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Sales":            { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Table Management": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Order Management": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Menu Management":  { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Recipe Management":{ can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Inventory":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Suppliers":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Purchases":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Customers":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Employees":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Users & Roles":    { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Expenses":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Accounting":       { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Reports":          { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Notifications":    { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Settings":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Backup & Restore": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Audit Log":        { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Hardware":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Printing":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
  },
  Accountant: {
    "POS Billing":      { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Kitchen Display":  { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Table Management": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Order Management": { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Menu Management":  { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Recipe Management":{ can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Suppliers":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Purchases":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Customers":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Employees":        { can_view:1, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Users & Roles":    { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Settings":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Backup & Restore": { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
    "Hardware":         { can_view:0, can_add:0, can_edit:0, can_delete:0, can_export:0 },
  },
};

const buildInitialPermissions = () => {
  const rows = [];
  for (const [role, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const module of MODULES) {
      const overrides = MODULE_OVERRIDES[role]?.[module];
      rows.push({ role, module, ...(overrides || perms) });
    }
  }
  return rows;
};

const buildInitialStore = () => {
  const initialStore = {
    users: [
      { id: nextId(), name: "Hammadullah", role: "Owner", pin: "123456", password: "owner123", email: "owner@dastarkhwan.pk", phone: "0300-0000001", status: "active", last_login: "Today, 9:02 AM", profile_photo: null },
      { id: nextId(), name: "Bilal Hussain", role: "Cashier", pin: "2345", password: "cashier123", email: "bilal@dastarkhwan.pk", phone: "0300-0000002", status: "active", last_login: "Today, 11:40 AM", profile_photo: null },
      { id: nextId(), name: "Ahmed Raza", role: "Waiter", pin: "3456", password: "waiter123", email: "ahmed@dastarkhwan.pk", phone: "0300-0000003", status: "active", last_login: "Today, 11:52 AM", profile_photo: null },
      { id: nextId(), name: "Chef Imran", role: "Kitchen Staff", pin: "4567", password: "kitchen123", email: "imran@dastarkhwan.pk", phone: "0300-0000004", status: "active", last_login: "Today, 10:15 AM", profile_photo: null },
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
    accounts: [
      { id: 101, code: '1001', name: 'Cash in Drawer', type: 'Asset', status: 'Active' },
      { id: 102, code: '1002', name: 'Bank Account (Main)', type: 'Asset', status: 'Active' },
      { id: 103, code: '1003', name: 'Accounts Receivable', type: 'Asset', status: 'Active' },
      { id: 104, code: '1004', name: 'Inventory Assets', type: 'Asset', status: 'Active' },
      { id: 201, code: '2001', name: 'Accounts Payable', type: 'Liability', status: 'Active' },
      { id: 202, code: '2002', name: 'GST/Sales Tax Payable', type: 'Liability', status: 'Active' },
      { id: 203, code: '2003', name: 'Service Charge Payable', type: 'Liability', status: 'Active' },
      { id: 301, code: '3001', name: 'Owner Equity', type: 'Equity', status: 'Active' },
      { id: 401, code: '4001', name: 'Food Sales Revenue', type: 'Revenue', status: 'Active' },
      { id: 402, code: '4002', name: 'Beverage Sales Revenue', type: 'Revenue', status: 'Active' },
      { id: 501, code: '5001', name: 'Cost of Goods Sold', type: 'Expense', status: 'Active' },
      { id: 601, code: '6001', name: 'Electricity', type: 'Expense', status: 'Active' },
      { id: 602, code: '6002', name: 'Gas', type: 'Expense', status: 'Active' },
      { id: 603, code: '6003', name: 'Rent', type: 'Expense', status: 'Active' },
      { id: 604, code: '6004', name: 'Salaries', type: 'Expense', status: 'Active' },
      { id: 605, code: '6005', name: 'Maintenance', type: 'Expense', status: 'Active' },
      { id: 606, code: '6006', name: 'Miscellaneous', type: 'Expense', status: 'Active' },
    ],
    journal_entries: [],
    cashier_shifts: [],
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

// MIGRATION: Force update demo owner PIN and strip branches for existing databases
if (store.users) {
  const owner = store.users.find(u => u.role === "Owner" && u.email === "owner@dastarkhwan.pk");
  if (owner && owner.pin === "1234") {
    owner.pin = "123456";
  }
  store.users.forEach(u => {
    if (u.branch) delete u.branch;
  });
  writeStoredState(STORAGE_KEY, store);
}

const findMaxId = (storeObj) => {
  let max = 10000;
  if (!storeObj) return max;
  for (const table in storeObj) {
    if (Array.isArray(storeObj[table])) {
      for (const row of storeObj[table]) {
        if (row && typeof row.id === "number") {
          if (row.id > max) max = row.id;
        } else if (row && typeof row.id === "string") {
          const num = parseInt(row.id.replace(/\D/g, ""), 10);
          if (!isNaN(num) && num > max) max = num;
        }
      }
    }
  }
  return max;
};
memId = findMaxId(store);

// Ensure new fields exist on existing stored data
if (!store.accounts || store.accounts.length === 0) {
  store.accounts = [
    { id: 101, code: '1001', name: 'Cash in Drawer', type: 'Asset', status: 'Active' },
    { id: 102, code: '1002', name: 'Bank Account (Main)', type: 'Asset', status: 'Active' },
    { id: 103, code: '1003', name: 'Accounts Receivable', type: 'Asset', status: 'Active' },
    { id: 104, code: '1004', name: 'Inventory Assets', type: 'Asset', status: 'Active' },
    { id: 201, code: '2001', name: 'Accounts Payable', type: 'Liability', status: 'Active' },
    { id: 202, code: '2002', name: 'GST/Sales Tax Payable', type: 'Liability', status: 'Active' },
    { id: 203, code: '2003', name: 'Service Charge Payable', type: 'Liability', status: 'Active' },
    { id: 301, code: '3001', name: 'Owner Equity', type: 'Equity', status: 'Active' },
    { id: 401, code: '4001', name: 'Food Sales Revenue', type: 'Revenue', status: 'Active' },
    { id: 402, code: '4002', name: 'Beverage Sales Revenue', type: 'Revenue', status: 'Active' },
    { id: 501, code: '5001', name: 'Cost of Goods Sold', type: 'Expense', status: 'Active' },
    { id: 601, code: '6001', name: 'Electricity', type: 'Expense', status: 'Active' },
    { id: 602, code: '6002', name: 'Gas', type: 'Expense', status: 'Active' },
    { id: 603, code: '6003', name: 'Rent', type: 'Expense', status: 'Active' },
    { id: 604, code: '6004', name: 'Salaries', type: 'Expense', status: 'Active' },
    { id: 605, code: '6005', name: 'Maintenance', type: 'Expense', status: 'Active' },
    { id: 606, code: '6006', name: 'Miscellaneous', type: 'Expense', status: 'Active' },
  ];
  writeStoredState(STORAGE_KEY, store);
}
if (!store.role_permissions) {
  store.role_permissions = buildInitialPermissions();
} else {
  const cashierSettings = store.role_permissions.find((p) => p.role === "Cashier" && p.module === "Settings");
  if (cashierSettings && cashierSettings.can_view === 1) {
    const builtInRows = buildInitialPermissions();
    const customRows = [];
    for (const r of store.custom_roles || []) {
      for (const module of MODULES) {
        customRows.push({ role: r.name, module, can_view: 0, can_add: 0, can_edit: 0, can_delete: 0, can_export: 0 });
      }
    }
    store.role_permissions = [...builtInRows, ...customRows];
    writeStoredState(STORAGE_KEY, store);
  }
}
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
store.inventory_items = (store.inventory_items || []).map(inv => {
  if (!inv.batches || inv.batches.length === 0) {
    inv.batches = [{
      id: nextId(),
      qty: Number(inv.stock || 0),
      cost: Number(inv.cost || 0),
      date: new Date().toISOString()
    }];
  }
  return inv;
});
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

// Debounced persistence — batches rapid writes into a single localStorage call
if (!store._version) store._version = 0;

let _persistTimer = null;
const persistStore = () => {
  store._version = (store._version || 0) + 1;
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => {
    writeStoredState(STORAGE_KEY, store);
    _persistTimer = null;
  }, 300);
};

// Force-flush for critical moments (app close, etc.)
const flushStore = () => {
  if (_persistTimer) {
    clearTimeout(_persistTimer);
    _persistTimer = null;
  }
  writeStoredState(STORAGE_KEY, store);
};

// Guarantee no data loss on app close
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushStore);
}

let _settingsTimer = null;
const persistSettings = () => {
  if (_settingsTimer) clearTimeout(_settingsTimer);
  _settingsTimer = setTimeout(() => {
    writeStoredState(SETTINGS_STORAGE_KEY, settingsStore);
    _settingsTimer = null;
  }, 300);
};

const delay = (v) => Promise.resolve(v);

const memoryApi = {
  isElectron: false,
  getStoreVersion: () => store._version || 0,
  flushStore,
  logAction: (user, module, action) => {
    store.audit_log = [{ 
      id: nextId(), 
      time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }), 
      user: user || "System", 
      module, 
      action, 
      ip_device: "Browser-Dev" 
    }, ...(store.audit_log || [])];
    persistStore();
  },
  pushNotification: (type, text) => {
    const n = { 
      id: nextId(), 
      type, 
      text, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      read: 0,
      created_at: new Date().toISOString()
    };
    store.notifications = [n, ...(store.notifications || [])];
    persistStore();
  },
  markAllNotificationsRead: () => {
    store.notifications = (store.notifications || []).map(n => ({ ...n, read: 1 }));
    persistStore();
    return delay(true);
  },
  markNotificationRead: (id) => {
    store.notifications = (store.notifications || []).map(n => n.id === id ? { ...n, read: 1 } : n);
    persistStore();
    return delay(true);
  },
  clearNotifications: () => {
    store.notifications = [];
    persistStore();
    return delay(true);
  },
  list: (table, opts = {}) => {
    if (table === "notifications") {
      try {
        const prefs = settingsStore?.alert_preferences || {
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
          const items = store.inventory_items || [];
          for (const item of items) {
            if (Number(item.stock || 0) < threshold) {
              const alertText = `Low Stock: ${item.name} is at ${item.stock} ${item.unit} (Threshold: ${threshold} ${item.unit})`;
              const exists = (store.notifications || []).some(n => n.type === 'low_stock' && n.text === alertText);
              if (!exists) {
                const n = { id: nextId(), type: 'low_stock', text: alertText, time, read: 0, created_at: new Date().toISOString() };
                store.notifications = [n, ...(store.notifications || [])];
              }
            }
          }
        }

        // 2. Expiry Alerts
        if (prefs.expiry) {
          const items = store.inventory_items || [];
          items.forEach(item => {
            const batches = item.batches || [];
            batches.forEach(batch => {
              if (!batch.expiry_date) return;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const exp = new Date(batch.expiry_date);
              exp.setHours(0, 0, 0, 0);
              const diffTime = exp - today;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays <= 0) {
                const alertText = `Expired: Batch ${batch.batch_number || 'N/A'} of ${item.name} expired on ${batch.expiry_date}.`;
                const exists = (store.notifications || []).some(n => n.type === 'expiry' && n.text === alertText);
                if (!exists) {
                  const n = { id: nextId(), type: 'expiry', text: alertText, time, read: 0, created_at: new Date().toISOString() };
                  store.notifications = [n, ...(store.notifications || [])];
                }
              } else if (diffDays <= 3) {
                const alertText = `Expiring Soon: Batch ${batch.batch_number || 'N/A'} of ${item.name} will expire in ${diffDays} days (${batch.expiry_date}).`;
                const exists = (store.notifications || []).some(n => n.type === 'expiry' && n.text === alertText && !n.read);
                if (!exists) {
                  const n = { id: nextId(), type: 'expiry', text: alertText, time, read: 0, created_at: new Date().toISOString() };
                  store.notifications = [n, ...(store.notifications || [])];
                }
              }
            });
          });
        }

        // 3. Pending Supplier Payments
        if (prefs.payment) {
          const suppliers = store.suppliers || [];
          for (const supplier of suppliers) {
            const due = Number(supplier.due || 0);
            if (due > 15000) {
              const alertText = `Pending Payment: Balance of Rs. ${due.toLocaleString()} due for ${supplier.name}.`;
              const exists = (store.notifications || []).some(n => n.type === 'payment' && n.text === alertText && !n.read);
              if (!exists) {
                const n = { id: nextId(), type: 'payment', text: alertText, time, read: 0, created_at: new Date().toISOString() };
                store.notifications = [n, ...(store.notifications || [])];
              }
            }
          }
        }
        persistStore();
      } catch (err) {
        console.error("checkAlerts error:", err);
      }
    }
    let rows = [...(store[table] || [])];
    if (table === "notifications") {
      const prefs = settingsStore?.alert_preferences || {
        low_stock: true,
        expiry: true,
        payment: false,
        closing: true,
        printer: true,
        threshold: 20
      };
      rows = rows.filter(n => {
        if (n.type === "low_stock" && !prefs.low_stock) return false;
        if (n.type === "expiry" && !prefs.expiry) return false;
        if (n.type === "payment" && !prefs.payment) return false;
        if (n.type === "printer" && !prefs.printer) return false;
        if (n.type === "closing" && !prefs.closing) return false;
        return true;
      });
    }
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
        if (va < vb) return dir === "DESC" ? 1 : -1;
        if (va > vb) return dir === "DESC" ? -1 : 1;
        return 0;
      });
    } else {
      // Default: If table is notifications or audit_log, sort latest first
      if (["notifications", "audit_log", "orders"].includes(table)) {
        rows.sort((a, b) => {
          const numA = typeof a.id === "number" ? a.id : parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
          const numB = typeof b.id === "number" ? b.id : parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
          return numB - numA;
        });
      }
    }
    return delay(rows);
  },
  get: (table, id) => delay((store[table] || []).find((r) => r.id === id)),
  create: (table, data, opts = {}) => {
    const user = opts.user || data.user || data.created_by || "System";
    memoryApi.logAction(user, table, `Created new record in ${table}`);
    const row = { id: data.id ?? nextId(), ...data };
    const existingIdx = (store[table] || []).findIndex((r) => r.id === row.id);
    if (existingIdx >= 0) {
      store[table][existingIdx] = { ...store[table][existingIdx], ...row };
    } else {
      store[table] = [row, ...(store[table] || [])];
      
      // Integrate expense into Journal
      if (table === "expenses") {
        const amount = Number(row.amount);
        if (amount > 0 && row.expense_account_code && row.payment_account_code) {
          const expAccName = (store.accounts || []).find(a => a.code === row.expense_account_code)?.name || row.category || 'Expense';
          const payAccName = (store.accounts || []).find(a => a.code === row.payment_account_code)?.name || 'Cash';
          const dateStr = row.date || getLocalISODate();
          
          const desc = row.expense_account_code === '6004' && row.employee_name
            ? `Salary paid to ${row.employee_name} - ${row.notes || ''}`
            : `Expense: ${row.category || 'General'} - ${row.notes || ''}`;

          const debitLine = {
            id: nextId(),
            date: dateStr,
            reference_type: 'Expense',
            reference_id: row.id,
            reference: `EXP-${row.id}`,
            account_code: row.expense_account_code,
            account_name: expAccName,
            debit: amount,
            credit: 0,
            description: desc,
            created_by: 'System'
          };
          
          const creditLine = {
            id: nextId(),
            date: dateStr,
            reference_type: 'Expense',
            reference_id: row.id,
            reference: `EXP-${row.id}`,
            account_code: row.payment_account_code,
            account_name: payAccName,
            debit: 0,
            credit: amount,
            description: desc,
            created_by: 'System'
          };
          
          store.journal_entries = [debitLine, creditLine, ...(store.journal_entries || [])];
        }
      }

      if (table === "customer_payments") {
        const amt = Number(row.amount || 0);
        const custId = row.customer_id;
        
        // Update customer credit/debt
        const cust = (store.customers || []).find(c => String(c.id) === String(custId));
        if (cust) {
          cust.credit = Math.max(0, Number(cust.credit || 0) - amt);
          cust.total_paid = Number(cust.total_paid || 0) + amt;
        }

        // Add journal entries
        const isCash = (row.payment_method || "").toLowerCase().includes("cash");
        const bankOrCashCode = isCash ? "1001" : "1002";
        const bankOrCashName = isCash ? "Cash in Drawer" : "Bank Account (Main)";
        const d = row.date || getLocalISODate();
        
        const journalEntries = [
          {
            id: nextId(),
            date: d,
            reference_type: "Customer Payment",
            reference_id: row.id,
            reference: `PAY-${row.id}`,
            account_code: bankOrCashCode,
            account_name: bankOrCashName,
            debit: amt,
            credit: 0,
            description: `Credit payment from ${row.customer_name || "Customer"} (Ref #${row.id})`,
            created_by: user,
            created_at: new Date().toISOString()
          },
          {
            id: nextId(),
            date: d,
            reference_type: "Customer Payment",
            reference_id: row.id,
            reference: `PAY-${row.id}`,
            account_code: "1003",
            account_name: "Accounts Receivable",
            debit: 0,
            credit: amt,
            description: `Credit payment from ${row.customer_name || "Customer"} (Ref #${row.id})`,
            created_by: user,
            created_at: new Date().toISOString()
          }
        ];
        
        if (!store.journal_entries) store.journal_entries = [];
        store.journal_entries = [journalEntries[0], journalEntries[1], ...store.journal_entries];
      }
    }
    persistStore();
    return delay(row);
  },
  update: (table, id, data, opts = {}) => {
    const user = opts.user || data.user || data.updated_by || "System";
    memoryApi.logAction(user, table, `Updated record #${id} in ${table}`);
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
    
    if (table === "inventory_items") {
      store.inventory_items = (store.inventory_items || []).map((inv) => {
        if (inv.id === id) {
          const updated = { ...inv, ...data };
          updated.cost = inv.cost; // NEVER change average cost from manual edits
          
          const oldStock = Number(inv.stock || 0);
          const newStock = Number(updated.stock || 0);
          const diff = newStock - oldStock;
          
          if (diff !== 0) {
            let updatedBatches = [...(inv.batches || [])];
            if (diff > 0) {
              // Adding stock: zero financial cost
              updatedBatches.push({
                id: nextId(),
                qty: diff,
                cost: 0,
                reference: "Manual Edit Addition",
                date: new Date().toISOString()
              });
            } else if (diff < 0) {
              // Subtracting stock: uses existing cost price (consume FIFO batches)
              let needed = Math.abs(diff);
              updatedBatches = updatedBatches.map(b => {
                if (needed <= 0) return b;
                const take = Math.min(b.qty || 0, needed);
                b.qty -= take;
                needed -= take;
                return b;
              }).filter(b => b.qty > 0);
            }
            updated.batches = updatedBatches;
          }
          
          // PHASE 2 FIX: Auto-calculate inventory status based on stock levels (Issue 4.1)
          const currentStock = Number(updated.stock || 0);
          const minStock = Number(updated.min_stock || 0);
          const reorderLevel = Number(updated.reorder || 0);
          
          if (currentStock <= 0) {
            updated.status = "critical";
          } else if (currentStock <= minStock) {
            updated.status = "critical";
          } else if (currentStock <= reorderLevel) {
            updated.status = "low";
          } else {
            updated.status = "in_stock";
          }
          updated.updated_at = new Date().toISOString();
          
          if (diff !== 0) {
            const txRecord = {
              id: nextId(),
              date: getLocalISODate(),
              ingredient_id: inv.id,
              name: inv.name,
              type: "Adjustment",
              qty: Math.abs(diff),
              unit: inv.unit,
              warehouse: inv.warehouse,
              reason: diff > 0 ? "Manual Addition" : "Manual Deduction",
              notes: "Manual form edit",
              user: "System"
            };
            store.inventory_transactions = [txRecord, ...(store.inventory_transactions || [])];
          }
          return updated;
        }
        return inv;
      });
      persistStore();
      return delay(store.inventory_items.find((r) => r.id === id));
    }

    store[table] = (store[table] || []).map((r) => (r.id === id ? { ...r, ...data } : r));
    persistStore();
    return delay(store[table].find((r) => r.id === id));
  },
  remove: (table, id, opts = {}) => {
    const user = opts.user || "System";
    memoryApi.logAction(user, table, `Deleted record #${id} from ${table}`);
    store[table] = (store[table] || []).filter((r) => r.id !== id);
    if (table === "expenses") {
      store.journal_entries = (store.journal_entries || []).filter((j) => j.reference !== `EXP-${id}`);
    }
    persistStore();
    return delay({ success: true, id });
  },

  // Auth
  loginWithPin: (pin) => {
    const user = store.users.find((u) => u.pin === pin && u.status === "active");
    if (user) {
      const idx = store.users.findIndex((u) => u.id === user.id);
      store.users[idx] = { ...user, last_login: new Date().toLocaleString() };
      memoryApi.logAction(user.name, "Authentication", "Logged in via PIN");
      persistStore();
    }
    return delay(user ? { success: true, user: store.users.find((u) => u.id === user.id) } : { success: false, message: "Invalid PIN" });
  },
  loginWithPassword: (usernameOrEmail, password) => {
    const user = store.users.find((u) => (u.name === usernameOrEmail || u.email === usernameOrEmail) && u.password === password && u.status === "active");
    if (user) {
      const idx = store.users.findIndex((u) => u.id === user.id);
      store.users[idx] = { ...user, last_login: new Date().toLocaleString() };
      memoryApi.logAction(user.name, "Authentication", "Logged in via Password");
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
    const builtInRows = buildInitialPermissions();
    const customRows = [];
    for (const r of store.custom_roles || []) {
      for (const module of MODULES) {
        customRows.push({ role: r.name, module, can_view: 0, can_add: 0, can_edit: 0, can_delete: 0, can_export: 0 });
      }
    }
    store.role_permissions = [...builtInRows, ...customRows];
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
    const existingOrder = existingIdx >= 0 ? store.orders[existingIdx] : null;

    // Validate and adjust inventory on a copy
    let tempInventory = JSON.parse(JSON.stringify(store.inventory_items || []));

    // 1. Revert previous stock if already deducted
    if (existingOrder && existingOrder.inventory_deducted) {
      const oldItems = store.order_items.filter(it => it.order_id === full.id);
      for (const item of oldItems) {
        const recipeLines = (store.recipes || []).filter(r => r.menu_item_id === item.menu_item_id);
        for (const line of recipeLines) {
          const restoreQty = Number(line.qty) * Number(item.qty);
          tempInventory = tempInventory.map(inv => {
            if (inv.id === line.inventory_item_id) {
              const restoreCost = Number(inv.cost || 0);
              const updatedBatches = [
                { id: nextId(), qty: restoreQty, cost: restoreCost, date: new Date().toISOString() },
                ...(inv.batches || [])
              ];
              const newStock = Number(inv.stock || 0) + restoreQty;
              return { ...inv, stock: newStock, batches: updatedBatches };
            }
            return inv;
          });
        }
      }
    }

    // 2. Validate and deduct new stock using FIFO (if not cancelled/refunded)
    const shouldDeduct = full.status !== "cancelled" && full.status !== "returned" && full.status !== "refunded";
    
    const processedItems = items.map(item => {
      let totalItemCogs = 0;
      
      if (shouldDeduct) {
        const recipeLines = (store.recipes || []).filter(r => r.menu_item_id === item.menu_item_id);
        
        for (const line of recipeLines) {
          const needed = Number(line.qty) * Number(item.qty);
          let remainingNeeded = needed;
          let costForThisIngredient = 0;
          
          // Find the ingredient in tempInventory
          tempInventory = tempInventory.map(inv => {
            if (inv.id === line.inventory_item_id) {
              // Ensure batches exist
              if (!inv.batches || inv.batches.length === 0) {
                inv.batches = [{
                  id: nextId(),
                  qty: Number(inv.stock || 0),
                  cost: Number(inv.cost || 0),
                  date: new Date().toISOString()
                }];
              }
              
              // Validate stock level
              const currentStock = inv.batches.reduce((sum, b) => sum + (b.qty || 0), 0);
              if (currentStock < needed) {
                throw new Error(`Insufficient stock for ingredient: ${inv.name}. Current stock: ${currentStock}, Required: ${needed}`);
              }
              
              // Deduct using FIFO
              const updatedBatches = inv.batches.map(b => {
                if (remainingNeeded <= 0 || b.qty <= 0) return b;
                const take = Math.min(b.qty, remainingNeeded);
                b.qty -= take;
                remainingNeeded -= take;
                costForThisIngredient += take * Number(b.cost || 0);
                return b;
              }).filter(b => b.qty > 0); // Clean up fully exhausted batches
              
              const newStock = Math.max(0, currentStock - needed);
              const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
              
              if (newStock <= (inv.reorder || 10) && currentStock > (inv.reorder || 10)) {
                memoryApi.pushNotification("alert", `Low Stock: ${inv.name} has fallen below its reorder point.`);
              }
              
              return { ...inv, stock: newStock, status: newStatus, batches: updatedBatches };
            }
            return inv;
          });
          
          totalItemCogs += costForThisIngredient;
        }
      }
      
      const unitCogs = item.qty > 0 ? (totalItemCogs / item.qty) : 0;
      
      // If we didn't deduct stock (e.g. order is cancelled) or if there's no recipe,
      // fallback to the item's current cost
      const finalCost = unitCogs > 0 ? unitCogs : (item.cost || 0);
      const finalCogs = finalCost * Number(item.qty || 0);
      const finalGp = Number(item.net_revenue || (item.price * item.qty)) - finalCogs;
      
      return {
        ...item,
        cost: finalCost,
        cogs: finalCogs,
        gross_profit: finalGp
      };
    });

    if (shouldDeduct) {
      full.inventory_deducted = true;
    } else {
      full.inventory_deducted = false;
    }

    // --- Commit changes since validation passed ---
    store.inventory_items = tempInventory;

    if (existingIdx >= 0) store.orders[existingIdx] = { ...store.orders[existingIdx], ...full };
    else store.orders = [full, ...store.orders];
    store.order_items = [...store.order_items.filter((it) => it.order_id !== full.id), ...processedItems.map((it) => ({ id: nextId(), order_id: full.id, ...it }))];

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
    
    if (['paid', 'completed', 'served'].includes(full.status)) {
          const isCash = (full.payment_method || 'cash').toLowerCase().includes('cash');
          const bankOrCashCode = isCash ? '1001' : '1002';
          const bankOrCashName = isCash ? 'Cash in Drawer' : 'Bank Account (Main)';
          const tot = Number(full.total || 0);
          const tTax = Number(full.tax || 0);
          const tSc = Number(full.service_charge || 0);
          const rev = tot - tTax - tSc;
          const tendered = full.tendered !== null ? Number(full.tendered) : tot;
          
          let entries = [];
          const dateNow = getLocalISODate();
          const refId = full.id;
          
          // Payment / Receivables
          if (tot > tendered && tendered > 0) {
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: bankOrCashCode, account_name: bankOrCashName, debit: tendered, credit: 0, description: `Partial payment for Order #${refId}`, created_by: 'System' });
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '1003', account_name: 'Accounts Receivable', debit: tot - tendered, credit: 0, description: `Credit for Order #${refId}`, created_by: 'System' });
          } else if (tot > tendered && tendered === 0) {
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '1003', account_name: 'Accounts Receivable', debit: tot, credit: 0, description: `Credit for Order #${refId}`, created_by: 'System' });
          } else {
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: bankOrCashCode, account_name: bankOrCashName, debit: tot, credit: 0, description: `Payment for Order #${refId}`, created_by: 'System' });
          }
  
          // Revenue
          entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '4001', account_name: 'Food Sales Revenue', debit: 0, credit: rev, description: `Revenue from Order #${refId}`, created_by: 'System' });
          
          // Tax / Service Charge
          if (tTax > 0) {
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '2002', account_name: 'GST/Sales Tax Payable', debit: 0, credit: tTax, description: `Tax for Order #${refId}`, created_by: 'System' });
          }
          if (tSc > 0) {
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '2003', account_name: 'Service Charge Payable', debit: 0, credit: tSc, description: `Service Charge for Order #${refId}`, created_by: 'System' });
          }

          // COGS & Inventory Deduction
          const totalCogs = processedItems.reduce((s, it) => s + (Number(it.cogs) || (Number(it.cost || 0) * Number(it.qty || 1))), 0);
          if (totalCogs > 0) {
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '5001', account_name: 'Cost of Goods Sold', debit: totalCogs, credit: 0, description: `COGS for Order #${refId}`, created_by: 'System' });
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '1004', account_name: 'Inventory Assets', debit: 0, credit: totalCogs, description: `Inventory cost reduction for Order #${refId}`, created_by: 'System' });
          }
          
          store.journal_entries = [...entries, ...(store.journal_entries || [])];
    }
    
    persistStore();
    return delay(full);
  },
  updateOrderWithItems: (orderId, orderUpdates, items) => {
    const existingOrder = store.orders.find((o) => o.id === orderId);
    if (!existingOrder) return delay(null);

    if (orderUpdates.status === "cancelled" && existingOrder.status !== "cancelled") {
      if (existingOrder.kitchen_status && existingOrder.kitchen_status !== "new") {
        throw new Error("Only new orders can be cancelled.");
      }
      if (existingOrder.customer_id && ['paid', 'completed', 'served'].includes(existingOrder.status)) {
        store.customers = store.customers.map(c => {
          if (c.id === existingOrder.customer_id) {
            const actualPaid = (existingOrder.tendered !== null ? Number(existingOrder.tendered) : Number(existingOrder.total)) - (Number(existingOrder.change_due) || 0);
            const billedAmount = Number(existingOrder.total);
            const creditIncrease = billedAmount - actualPaid;
            
            return {
              ...c,
              visits: Math.max(0, (c.visits || 0) - 1),
              points: Math.max(0, (c.points || 0) - Math.floor(billedAmount / 100)),
              total_billed: Math.max(0, (c.total_billed || 0) - billedAmount),
              total_paid: Math.max(0, (c.total_paid || 0) - actualPaid),
              credit: Math.max(0, (c.credit || 0) - creditIncrease)
            };
          }
          return c;
        });
      }
    }

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
      date: poData.date || getLocalISODate(),
      status: poData.status || "draft",
      total: Number(poData.total || 0),
      was_received: wasAlreadyReceived || isNowReceiving,
      received_at: isNowReceiving ? new Date().toISOString() : (existingPo?.received_at || null),
      created_at: existingPo?.created_at || new Date().toISOString(),
      amount_paid_on_receive: Number(poData.amount_paid_on_receive || 0),
      payment_method_on_receive: poData.payment_method_on_receive || "Cash",
      payment_term: poData.payment_term || "Cash",
      invoice_number: poData.invoice_number || null,
      special_note: poData.special_note || null,
      payment_details: poData.payment_details || null,
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
            
            const newBatches = [...(inv.batches || [])];
            newBatches.push({
              id: nextId(),
              qty: addQty,
              cost: newCost,
              reference: `PO-${poId}`,
              date: new Date().toISOString()
            });
            
            return { ...inv, stock: newStock, cost: newCost, status: newStatus, batches: newBatches };
          }
          return inv;
        });
      }

      // Update supplier due balance and post journal entries
      if (po.supplier) {
        const addDue = Number(po.total) - Number(po.amount_paid_on_receive || 0);
        store.suppliers = store.suppliers.map(s =>
          s.name === po.supplier
            ? { ...s, due: Number(s.due || 0) + addDue }
            : s
        );
        
        // Post journal entries
        const dateNow = po.date || getLocalISODate();
        const poTot = Number(po.total || 0);
        const paid = Number(po.amount_paid_on_receive || 0);
        const isCash = (po.payment_method_on_receive || '').toLowerCase().includes('cash');
        const bankOrCashCode = isCash ? '1001' : '1002';
        const bankOrCashName = isCash ? 'Cash in Drawer' : 'Bank Account (Main)';

        if (poTot > 0) {
          const journalEntries = [
            {
              id: nextId(),
              date: dateNow,
              reference_type: 'PO',
              reference_id: poId,
              reference: `PO-${poId}`,
              account_code: '1004',
              account_name: 'Inventory Assets',
              debit: poTot,
              credit: 0,
              description: `Received PO #${poId} from ${po.supplier}`,
              created_by: 'System'
            }
          ];

          if (paid > 0) {
            journalEntries.push({
              id: nextId(),
              date: dateNow,
              reference_type: 'PO',
              reference_id: poId,
              reference: `PO-${poId}`,
              account_code: bankOrCashCode,
              account_name: bankOrCashName,
              debit: 0,
              credit: paid,
              description: `Payment for PO #${poId}`,
              created_by: 'System'
            });
          }

          if (poTot - paid > 0) {
            journalEntries.push({
              id: nextId(),
              date: dateNow,
              reference_type: 'PO',
              reference_id: poId,
              reference: `PO-${poId}`,
              account_code: '2001',
              account_name: 'Accounts Payable',
              debit: 0,
              credit: poTot - paid,
              description: `Payable for PO #${poId}`,
              created_by: 'System'
            });
          }

          store.journal_entries = [...journalEntries, ...(store.journal_entries || [])];
        }
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
            const updatedBatches = (inv.batches || []).filter(b => b.reference !== `PO-${poId}`);
            const newStock = Math.max(0, Number(inv.stock || 0) - netReceivedQty);
            const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
            return { ...inv, stock: newStock, status: newStatus, batches: updatedBatches };
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

    // Remove PO, items, and reverse journal entries
    store.purchase_orders = store.purchase_orders.filter(p => p.id !== poId);
    store.purchase_order_items = store.purchase_order_items.filter(it => it.po_id !== poId);
    store.journal_entries = (store.journal_entries || []).filter(j => j.reference !== `PO-${poId}`);
    
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

      // Validate stock before deducting
      const invItem = store.inventory_items.find(inv => inv.id === ret.inventory_item_id);
      if (!invItem || Number(invItem.stock || 0) < returnQty) {
        throw new Error(`Cannot return "${ret.name}". Available stock is ${invItem ? invItem.stock : 0}, which is less than the return quantity (${returnQty}).`);
      }

      // Deduct returned qty from inventory stock
      store.inventory_items = store.inventory_items.map(inv => {
        if (inv.id === ret.inventory_item_id) {
          const updatedBatches = (inv.batches || []).map(b => {
            if (b.reference === `PO-${poId}`) {
              return { ...b, qty: Math.max(0, Number(b.qty || 0) - returnQty) };
            }
            return b;
          }).filter(b => b.qty > 0);
          
          const newStock = Math.max(0, Number(inv.stock || 0) - returnQty);
          const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
          return { ...inv, stock: newStock, status: newStatus, batches: updatedBatches };
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

    // Calculate how much goes to reducing supplier due vs cash refund
    let dueDeducted = 0;
    let cashRefunded = 0;

    if (refundMode === "Cash Refund" || !po.supplier) {
      cashRefunded = totalReturnAmount;
    } else if (po.supplier && totalReturnAmount > 0) {
      let supplierFound = false;
      store.suppliers = store.suppliers.map(s => {
        if (s.name === po.supplier) {
          supplierFound = true;
          const currentDue = Number(s.due || 0);
          dueDeducted = Math.min(currentDue, totalReturnAmount);
          cashRefunded = totalReturnAmount - dueDeducted;
          return { ...s, due: Math.max(0, currentDue - totalReturnAmount) };
        }
        return s;
      });
      if (!supplierFound) {
        cashRefunded = totalReturnAmount;
      }
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

    // Post journal entries for this purchase return
    if (totalReturnAmount > 0) {
      const dateNow = getLocalISODate();
      const journalEntries = [];

      // Debit: reduce Accounts Payable
      if (dueDeducted > 0) {
        journalEntries.push({
          id: nextId(),
          date: dateNow,
          reference_type: "Purchase Return",
          reference_id: returnRecord.id,
          account_code: "2001",
          account_name: "Accounts Payable",
          debit: dueDeducted,
          credit: 0,
          description: `Purchase Return for PO #${poId} (Due settled)`,
          created_by: "System"
        });
      }

      // Debit: increase Cash (excess over due, or full cash refund)
      if (cashRefunded > 0) {
        journalEntries.push({
          id: nextId(),
          date: dateNow,
          reference_type: "Purchase Return",
          reference_id: returnRecord.id,
          account_code: "1001",
          account_name: "Cash in Drawer",
          debit: cashRefunded,
          credit: 0,
          description: `Purchase Return for PO #${poId} (Cash refund)`,
          created_by: "System"
        });
      }

      // Credit: reduce COGS (goods are back, cost is reversed)
      journalEntries.push({
        id: nextId(),
        date: dateNow,
        reference_type: "Purchase Return",
        reference_id: returnRecord.id,
        account_code: "5001",
        account_name: "Cost of Goods Sold",
        debit: 0,
        credit: totalReturnAmount,
        description: `Purchase Return for PO #${poId} — stock reversed`,
        created_by: "System"
      });
      if (!store.journal_entries) store.journal_entries = [];
      store.journal_entries = [...store.journal_entries, ...journalEntries];
    }

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
      date: data.date || getLocalISODate(),
      created_at: new Date().toISOString()
    };
    if (!store.supplier_payments) store.supplier_payments = [];
    store.supplier_payments = [paymentRecord, ...store.supplier_payments];


    // Post journal entry for supplier payment
    const dateNow = data.date || getLocalISODate();
    const isCash = (data.payment_method || 'Cash').toLowerCase().includes('cash');
    const bankOrCashCode = isCash ? '1001' : '1002';
    const bankOrCashName = isCash ? 'Cash in Drawer' : 'Bank Account (Main)';
    
    const debitLine = {
      id: nextId(),
      date: dateNow,
      reference_type: 'Supplier Payment',
      reference_id: paymentRecord.id,
      reference: `PAY-${paymentRecord.id}`,
      account_code: '2001',
      account_name: 'Accounts Payable',
      debit: amount,
      credit: 0,
      description: `Payment to supplier ${supplier.name}. Notes: ${data.notes || "None"}`,
      created_by: meta.user || 'System'
    };
    
    const creditLine = {
      id: nextId(),
      date: dateNow,
      reference_type: 'Supplier Payment',
      reference_id: paymentRecord.id,
      reference: `PAY-${paymentRecord.id}`,
      account_code: bankOrCashCode,
      account_name: bankOrCashName,
      debit: 0,
      credit: amount,
      description: `Payment to supplier ${supplier.name}. Notes: ${data.notes || "None"}`,
      created_by: meta.user || 'System'
    };
    
    store.journal_entries = [debitLine, creditLine, ...(store.journal_entries || [])];

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
      const orderTotal = Number(refundedOrder.total || 0);
      const actualPaid = (refundedOrder.tendered !== null ? Number(refundedOrder.tendered) : orderTotal) - (Number(refundedOrder.change_due) || 0);
      const creditOnOrder = Math.max(0, orderTotal - actualPaid);
      const returnRatio = orderTotal > 0 ? amount / orderTotal : 1;

      // Proportional amounts for this return
      const paidToReverse = Math.round(actualPaid * returnRatio);
      const creditToReverse = Math.round(creditOnOrder * returnRatio);

      store.customers = store.customers.map(c => {
        if (c.id === refundedOrder.customer_id) {
          return {
            ...c,
            total_billed: Math.max(0, (c.total_billed || 0) - amount),
            total_paid: Math.max(0, (c.total_paid || 0) - paidToReverse),
            credit: Math.max(0, (c.credit || 0) - creditToReverse),
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
      store.orders = store.orders.map((o) => (o.id === orderId ? { ...o, kitchen_status: "cancelled" } : o));
    }

    // Restock returned items back to inventory if selected
    if (restock) {
      for (const item of items) {
        const recipeLines = (store.recipes || []).filter(r => r.menu_item_id === item.menu_item_id);
        for (const line of recipeLines) {
          const restoreQty = Number(line.qty) * Number(item.qty);
          store.inventory_items = (store.inventory_items || []).map(inv => {
            if (inv.id === line.inventory_item_id) {
              const newStock = Number(inv.stock || 0) + restoreQty;
              const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
              return { ...inv, stock: newStock, status: newStatus };
            }
            return inv;
          });
        }
      }
    }

    // Post smart journal entries for sales return
    // Look up what was actually paid in cash vs. credit for this order
    if (amount > 0) {
      const dateNow = getLocalISODate();
      const orderTotal = Number(refundedOrder.total || 0);
      const returnRatio = orderTotal > 0 ? amount / orderTotal : 1;

      // Find original cash/bank received for this order from journal entries
      let originalCashReceived = 0;
      let originalArRecorded = 0;
      let arSettled = 0; // AR credits from customer payments
      (store.journal_entries || []).forEach(je => {
        if (je.reference_type === 'Order' && String(je.reference_id) === String(orderId)) {
          if (je.account_code === '1001' || je.account_code === '1002') {
            originalCashReceived += Number(je.debit || 0);
          }
          if (je.account_code === '1003') {
            originalArRecorded += Number(je.debit || 0);
          }
        }
        // Customer payments that settled this order's AR
        if (je.reference_type === 'Customer Payment' && je.account_code === '1003') {
          arSettled += Number(je.credit || 0);
        }
      });

      // If customer settled AR, that money is now in cash — must be refunded from cash too
      // Cap arSettled to what was originally recorded for this order's AR
      const arSettledForThisOrder = Math.min(arSettled, originalArRecorded);
      const unsettledAr = Math.max(0, originalArRecorded - arSettledForThisOrder);

      // Proportional amounts based on return ratio
      const cashToRefund = Math.round((originalCashReceived + arSettledForThisOrder) * returnRatio);
      const arToReverse = Math.round(unsettledAr * returnRatio);

      const salesReturnEntries = [
        // Debit: Revenue reversed
        {
          id: nextId(),
          date: dateNow,
          reference_type: "Sales Return",
          reference_id: ret.id,
          account_code: "4001",
          account_name: "Food Sales Revenue",
          debit: amount,
          credit: 0,
          description: `Sales Return on Order #${orderId}`,
          created_by: "System"
        }
      ];

      // Credit: Cash/Bank — only the amount actually received as cash
      if (cashToRefund > 0) {
        const isCash = (refundedOrder.payment_method || 'cash').toLowerCase().includes('cash');
        salesReturnEntries.push({
          id: nextId(),
          date: dateNow,
          reference_type: "Sales Return",
          reference_id: ret.id,
          account_code: isCash ? "1001" : "1002",
          account_name: isCash ? "Cash in Drawer" : "Bank Account (Main)",
          debit: 0,
          credit: cashToRefund,
          description: `Refund paid for Order #${orderId}`,
          created_by: "System"
        });
      }

      // Credit: AR — clear unsettled receivable (customer no longer owes this)
      if (arToReverse > 0) {
        salesReturnEntries.push({
          id: nextId(),
          date: dateNow,
          reference_type: "Sales Return",
          reference_id: ret.id,
          account_code: "1003",
          account_name: "Accounts Receivable",
          debit: 0,
          credit: arToReverse,
          description: `Receivable cleared for returned Order #${orderId}`,
          created_by: "System"
        });
      }

      if (!store.journal_entries) store.journal_entries = [];
      store.journal_entries = [...store.journal_entries, ...salesReturnEntries];
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
    const order = store.orders.find((o) => o.id === id);
    if (!order) return delay(null);

    if (status === "cancelled") {
      if (order.kitchen_status && order.kitchen_status !== "new") {
        throw new Error("Only new orders can be cancelled.");
      }
      if (order.status !== "cancelled") {
        if (order.customer_id && ['paid', 'completed', 'served'].includes(order.status)) {
          store.customers = store.customers.map(c => {
            if (c.id === order.customer_id) {
              const actualPaid = (order.tendered !== null ? Number(order.tendered) : Number(order.total)) - (Number(order.change_due) || 0);
              const billedAmount = Number(order.total);
              const creditIncrease = billedAmount - actualPaid;
              
              return {
                ...c,
                visits: Math.max(0, (c.visits || 0) - 1),
                points: Math.max(0, (c.points || 0) - Math.floor(billedAmount / 100)),
                total_billed: Math.max(0, (c.total_billed || 0) - billedAmount),
                total_paid: Math.max(0, (c.total_paid || 0) - actualPaid),
                credit: Math.max(0, (c.credit || 0) - creditIncrease)
              };
            }
            return c;
          });
        }
      }

      // Post reversal journal entries for cancelled paid orders
      if (['paid', 'completed', 'served'].includes(order.status)) {
        const cancelTotal = Number(order.total || 0);
        if (cancelTotal > 0) {
          const dateNow = getLocalISODate();

          // Find original cash/bank received and AR for this order
          let originalCashReceived = 0;
          let originalArRecorded = 0;
          let arSettled = 0;
          (store.journal_entries || []).forEach(je => {
            if (je.reference_type === 'Order' && String(je.reference_id) === String(id)) {
              if (je.account_code === '1001' || je.account_code === '1002') {
                originalCashReceived += Number(je.debit || 0);
              }
              if (je.account_code === '1003') {
                originalArRecorded += Number(je.debit || 0);
              }
            }
            if (je.reference_type === 'Customer Payment' && je.account_code === '1003') {
              arSettled += Number(je.credit || 0);
            }
          });

          const arSettledForThisOrder = Math.min(arSettled, originalArRecorded);
          const unsettledAr = Math.max(0, originalArRecorded - arSettledForThisOrder);
          const cashToRefund = originalCashReceived + arSettledForThisOrder;

          const cancelEntries = [
            // Debit: Revenue reversed
            {
              id: nextId(),
              date: dateNow,
              reference_type: "Order Cancel",
              reference_id: id,
              account_code: "4001",
              account_name: "Food Sales Revenue",
              debit: cancelTotal,
              credit: 0,
              description: `Cancelled Order #${id} — revenue reversed`,
              created_by: "System"
            }
          ];

          if (cashToRefund > 0) {
            const isCash = (order.payment_method || 'cash').toLowerCase().includes('cash');
            cancelEntries.push({
              id: nextId(),
              date: dateNow,
              reference_type: "Order Cancel",
              reference_id: id,
              account_code: isCash ? "1001" : "1002",
              account_name: isCash ? "Cash in Drawer" : "Bank Account (Main)",
              debit: 0,
              credit: cashToRefund,
              description: `Refund for cancelled Order #${id}`,
              created_by: "System"
            });
          }

          if (unsettledAr > 0) {
            cancelEntries.push({
              id: nextId(),
              date: dateNow,
              reference_type: "Order Cancel",
              reference_id: id,
              account_code: "1003",
              account_name: "Accounts Receivable",
              debit: 0,
              credit: unsettledAr,
              description: `Receivable cleared for cancelled Order #${id}`,
              created_by: "System"
            });
          }

          // Reverse tax entries if present
          const tTax = Number(order.tax || 0);
          const tSc = Number(order.service_charge || 0);
          if (tTax > 0) {
            cancelEntries.push({
              id: nextId(),
              date: dateNow,
              reference_type: "Order Cancel",
              reference_id: id,
              account_code: "2002",
              account_name: "GST/Sales Tax Payable",
              debit: tTax,
              credit: 0,
              description: `Tax reversed for cancelled Order #${id}`,
              created_by: "System"
            });
          }
          if (tSc > 0) {
            cancelEntries.push({
              id: nextId(),
              date: dateNow,
              reference_type: "Order Cancel",
              reference_id: id,
              account_code: "2003",
              account_name: "Service Charge Payable",
              debit: tSc,
              credit: 0,
              description: `Service charge reversed for cancelled Order #${id}`,
              created_by: "System"
            });
          }

          if (!store.journal_entries) store.journal_entries = [];
          store.journal_entries = [...cancelEntries, ...(store.journal_entries || [])];
        }
      }
    }

    store.orders = store.orders.map((o) => (o.id === id ? { ...o, status } : o));
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },
  updateKitchenStatus: (id, kitchen_status) => {
    store.orders = store.orders.map((o) => (o.id === id ? { ...o, kitchen_status } : o));
    persistStore();
    return delay(store.orders.find((o) => o.id === id));
  },

  addInventoryTransaction: (tx) => {
    // 1. Log the transaction
    const newTx = { id: nextId(), date: getLocalISODate(), ...tx };
    store.inventory_transactions = [ newTx, ...(store.inventory_transactions || []) ];

    // 2. Adjust inventory stock & batches
    const inv = (store.inventory_items || []).find(i => i.id === tx.ingredient_id);
    if (inv) {
      const qty = Number(tx.qty || 0);
      if (tx.type === "Stock In" || tx.type === "Purchase Receipt") {
        const newStock = Number(inv.stock || 0) + qty;
        const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
        
        const newBatches = [...(inv.batches || [])];
        newBatches.push({
          id: nextId(),
          qty: qty,
          cost: Number(inv.cost || 0),
          date: new Date().toISOString()
        });
        
        Object.assign(inv, { stock: newStock, status: newStatus, batches: newBatches });
      } else if (tx.type === "Stock Out" || tx.type === "Wastage") {
        const newStock = Math.max(0, Number(inv.stock || 0) - qty);
        const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
        
        let needed = qty;
        const updatedBatches = (inv.batches || []).map(b => {
          if (needed <= 0) return b;
          const take = Math.min(b.qty || 0, needed);
          b.qty -= take;
          needed -= take;
          return b;
        }).filter(b => b.qty > 0);
        
        Object.assign(inv, { stock: newStock, status: newStatus, batches: updatedBatches });
      } else if (tx.type === "Adjustment") {
        // Manual override: set stock exactly to qty
        const oldStock = Number(inv.stock || 0);
        const diff = qty - oldStock;
        const newStatus = qty <= 0 ? "critical" : qty <= (inv.reorder || 10) ? "low" : "in_stock";
        
        let updatedBatches = [...(inv.batches || [])];
        if (diff > 0) {
          // Increase: add batch
          updatedBatches.push({
            id: nextId(),
            qty: diff,
            cost: 0, // Per rules: manual additions have 0 cost impact
            date: new Date().toISOString()
          });
        } else if (diff < 0) {
          // Decrease: consume FIFO
          let needed = Math.abs(diff);
          updatedBatches = updatedBatches.map(b => {
            if (needed <= 0) return b;
            const take = Math.min(b.qty || 0, needed);
            b.qty -= take;
            needed -= take;
            return b;
          }).filter(b => b.qty > 0);
        }
        
        Object.assign(inv, { stock: qty, status: newStatus, batches: updatedBatches });
      }
    }

    persistStore();
    return delay(newTx);
  },
  transferStock: (data) => {
    const qty = Number(data.qty);
    if (qty <= 0) throw new Error("Transfer quantity must be greater than zero.");

    // Find Source
    const sourceInv = (store.inventory_items || []).find(i => i.name === data.ingredient_name && i.warehouse === data.source_warehouse);
    if (!sourceInv) throw new Error("Ingredient not found in source warehouse.");

    const sourceStock = Number(sourceInv.stock || 0);
    if (sourceStock < qty) throw new Error(`Insufficient stock in source warehouse. Current stock: ${sourceStock}`);

    // Deduct from Source & Capture FIFO batches
    let needed = qty;
    const transferBatches = [];
    const newSourceBatches = (sourceInv.batches || []).map(b => {
      if (needed <= 0 || b.qty <= 0) return b;
      const take = Math.min(b.qty, needed);
      b.qty -= take;
      needed -= take;
      transferBatches.push({ id: nextId(), qty: take, cost: b.cost, date: new Date().toISOString() });
      return b;
    }).filter(b => b.qty > 0);

    const newSourceStock = Math.max(0, sourceStock - qty);
    const newSourceStatus = newSourceStock <= 0 ? "critical" : newSourceStock <= (sourceInv.reorder || 10) ? "low" : "in_stock";
    Object.assign(sourceInv, { stock: newSourceStock, status: newSourceStatus, batches: newSourceBatches });

    // Find or Create Target
    let targetInv = (store.inventory_items || []).find(i => i.name === data.ingredient_name && i.warehouse === data.target_warehouse);
    if (targetInv) {
      const targetStock = Number(targetInv.stock || 0);
      const newTargetStock = targetStock + qty;
      const newTargetStatus = newTargetStock <= 0 ? "critical" : newTargetStock <= (targetInv.reorder || 10) ? "low" : "in_stock";
      const newTargetBatches = [...(targetInv.batches || []), ...transferBatches];
      Object.assign(targetInv, { stock: newTargetStock, status: newTargetStatus, batches: newTargetBatches });
    } else {
      targetInv = {
        ...sourceInv,
        id: nextId(),
        warehouse: data.target_warehouse,
        stock: qty,
        status: qty <= (sourceInv.reorder || 10) ? "low" : "in_stock",
        batches: transferBatches
      };
      store.inventory_items = [targetInv, ...store.inventory_items];
    }

    // Log Transactions
    const dateStr = getLocalISODate();
    const txOut = {
      id: nextId(),
      date: dateStr,
      ingredient_id: sourceInv.id,
      name: sourceInv.name,
      type: "Transfer Out",
      qty: qty,
      warehouse: data.source_warehouse,
      reason: `Transfer to ${data.target_warehouse}`,
      notes: data.notes,
      user: "System"
    };
    const txIn = {
      id: nextId(),
      date: dateStr,
      ingredient_id: targetInv.id,
      name: targetInv.name,
      type: "Transfer In",
      qty: qty,
      warehouse: data.target_warehouse,
      reason: `Transfer from ${data.source_warehouse}`,
      notes: data.notes,
      user: "System"
    };

    if (!store.inventory_transactions) store.inventory_transactions = [];
    store.inventory_transactions = [txIn, txOut, ...store.inventory_transactions];

    persistStore();
    return delay(true);
  },
  submitPhysicalCount: (data) => {
    // 1. Log the audit record
    const record = {
      id: nextId(),
      date: data.date || getLocalISODate(),
      status: data.status || "draft",
      approved_by: data.approved_by || "Hammadullah",
      notes: data.notes || "",
      items: JSON.stringify(data.items || [])
    };
    if (!store.physical_counts) store.physical_counts = [];
    store.physical_counts = [record, ...store.physical_counts];

    // 2. If completed, adjust inventory stock levels and write discrepancy transactions
    if (data.status === "completed") {
      (data.items || []).forEach(item => {
        const inv = (store.inventory_items || []).find(i => i.name === item.name && i.warehouse === item.warehouse);
        if (inv) {
          const sysQty = Number(item.system_qty || 0);
          const countedQty = Number(item.counted_qty || 0);
          const diff = countedQty - sysQty;

          if (diff !== 0) {
            const newStatus = countedQty <= 0 ? "critical" : countedQty <= (inv.reorder || 10) ? "low" : "in_stock";
            
            // Adjust batches
            let updatedBatches = [...(inv.batches || [])];
            if (diff > 0) {
              updatedBatches.push({
                id: nextId(),
                qty: diff,
                cost: 0, // Per rules: manual additions have 0 cost impact
                date: new Date().toISOString()
              });
            } else {
              let needed = Math.abs(diff);
              updatedBatches = updatedBatches.map(b => {
                if (needed <= 0) return b;
                const take = Math.min(b.qty || 0, needed);
                b.qty -= take;
                needed -= take;
                return b;
              }).filter(b => b.qty > 0);
            }

            Object.assign(inv, { stock: countedQty, status: newStatus, batches: updatedBatches });

            // Automatically log an adjustment transaction
            const txRecord = {
              id: nextId(),
              date: getLocalISODate(),
              ingredient_id: inv.id,
              name: inv.name,
              type: "Adjustment",
              qty: Math.abs(diff),
              unit: inv.unit,
              warehouse: inv.warehouse,
              reason: item.reason || "Physical count reconciliation",
              notes: item.notes || `Discrepancy: system (${sysQty}) vs counted (${countedQty})`,
              user: data.approved_by || "Hammadullah"
            };
            store.inventory_transactions = [txRecord, ...(store.inventory_transactions || [])];
          }
        }
      });
    }

    persistStore();
    return delay({ success: true, count: record });
  },
  addExpiryBatch: (data) => {
    const record = {
      id: nextId(),
      name: data.name,
      batch_number: data.batch_number || `BATCH-${Date.now().toString().slice(-4)}`,
      supplier: data.supplier || "Metro Cash & Carry",
      purchase_date: data.purchase_date || getLocalISODate(),
      expiry_date: data.expiry_date,
      qty: Number(data.qty || 0),
      unit: data.unit,
      warehouse: data.warehouse || "Main Kitchen Store",
      created_at: new Date().toISOString()
    };
    if (!store.expiry_batches) store.expiry_batches = [];
    store.expiry_batches = [record, ...store.expiry_batches];

    // Optionally: register this batch's expiry in the inventory items batches queue
    const inv = (store.inventory_items || []).find(i => i.name === data.name);
    if (inv) {
      inv.batches = inv.batches || [];
      inv.batches.push({
        id: nextId(),
        qty: Number(data.qty || 0),
        cost: Number(inv.cost || 0),
        expiry_date: data.expiry_date,
        batch_number: record.batch_number,
        date: new Date().toISOString()
      });
      const newStock = Number(inv.stock || 0) + Number(data.qty || 0);
      const newStatus = newStock <= 0 ? "critical" : newStock <= (inv.reorder || 10) ? "low" : "in_stock";
      Object.assign(inv, { stock: newStock, status: newStatus });
      
      // Auto-log a stock transaction for the expiry batch arrival
      const txRecord = {
        id: nextId(),
        date: getLocalISODate(),
        ingredient_id: inv.id,
        name: inv.name,
        type: "Stock In",
        qty: Number(data.qty || 0),
        unit: inv.unit,
        warehouse: record.warehouse,
        reason: "Expiry tracking batch registration",
        notes: `Batch: ${record.batch_number}, Expiry: ${record.expiry_date}`,
        user: "System"
      };
      store.inventory_transactions = [txRecord, ...(store.inventory_transactions || [])];
    }

    persistStore();
    return delay({ success: true, expiry: record });
  },
  
  listAccounts: () => delay(store.accounts || []),
  createAccount: (acc) => {
    const newAcc = { id: nextId(), ...acc };
    store.accounts = [newAcc, ...(store.accounts || [])];
    persistStore();
    return delay(newAcc);
  },
  updateAccount: (id, acc) => delay(acc),
  deleteAccount: (id) => delay({ success: true }),
  
  postJournal: (entry) => {
    store.journal_entries = [{ id: nextId(), date: new Date().toISOString(), ...entry }, ...(store.journal_entries || [])];
    persistStore();
    return delay(entry);
  },
  listJournal: () => delay(store.journal_entries || []),
  getAccountLedger: (code) => delay((store.journal_entries || []).filter(e => e.account_code === code)),
  
  listBankAccounts: () => delay(store.bank_accounts || []),
  createBankAccount: (acc) => delay(acc),
  updateBankAccount: (id, acc) => delay(acc),
  transferFunds: (data) => delay({ success: true }),
  
  recordCustomerPayment: (data) => delay({ success: true }),
  
  openShift: (data) => {
    const shift = { id: nextId(), status: 'open', opening_time: new Date().toISOString(), ...data };
    store.cashier_shifts = [shift, ...(store.cashier_shifts || [])];
    persistStore();
    return delay(shift);
  },
  getCurrentShift: () => delay((store.cashier_shifts || []).find(s => s.status === 'open') || null),
  closeShift: (id, data) => {
    store.cashier_shifts = (store.cashier_shifts || []).map(s => s.id === id ? { ...s, status: 'closed', closing_time: new Date().toISOString(), ...data } : s);
    persistStore();
    return delay({ success: true });
  },
  listShifts: () => delay(store.cashier_shifts || []),
  
  getProfitLoss: () => delay({ revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 }),
  getBalanceSheet: () => delay({ assets: 0, liabilities: 0, equity: 0 }),
  getTrialBalance: () => delay([]),
  getCashFlow: () => delay({ operating: 0, investing: 0, financing: 0, net: 0 }),

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

    let cashSales = 0;
    let cardSales = 0;
    let totalSales = 0;
    
    activeToday.forEach(o => {
      const amt = Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0));
      totalSales += amt;
      const pm = (o.payment_method || "cash").toLowerCase();
      if (pm.includes("card") || pm.includes("bank")) cardSales += amt;
      else cashSales += amt;
    });

    const expensesToday = store.expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= today && d < tomorrow;
    });

    let cashExpenses = 0;
    let totalExpenses = 0;
    expensesToday.forEach(e => {
       const amt = Number(e.amount || 0);
       totalExpenses += amt;
       const pm = (e.payment_method || "cash").toLowerCase();
       if (pm.includes("cash")) cashExpenses += amt;
    });

    return delay({
      todaySales: totalSales,
      cashSales: cashSales,
      cardSales: cardSales,
      todayOrders: activeToday.length,
      lowStockCount: store.inventory_items.filter((i) => i.status === "low" || i.status === "critical").length,
      expensesTotal: totalExpenses,
      cashExpenses: cashExpenses
    });
  },
  getVersion: () => delay("0.1.0 (browser preview)"),
  getDeviceName: () => delay("Browser-Dev"),
  getPrinters: () => delay([]),
  clearData: () => {
    store.orders = [];
    store.order_items = [];
    store.kitchen_tickets = [];
    store.notifications = [];
    store.audit_log = [];
    store.physical_counts = [];
    store.inventory_transactions = [];
    store.expiry_batches = [];
    store.purchase_orders = [];
    store.purchase_order_items = [];
    store.purchase_returns = [];
    store.sales_returns = [];
    store.supplier_payments = [];
    store.customer_payments = [];
    store.cashier_shifts = [];
    store.journal_entries = [];
    store.expenses = [];
    store.menu_items = [];
    store.categories = [];
    store.inventory_items = [];
    store.suppliers = [];
    store.customers = [];
    store.employees = [];
    store.recipes = [];
    store.sequences = {};

    store.users = (store.users || []).filter(u => u.role === "Owner");
    if (store.users.length === 0) {
      store.users = [
        { id: 10001, name: "Hammadullah", role: "Owner", pin: "123456", password: "owner123", email: "owner@dastarkhwan.pk", phone: "0300-0000001", status: "active", last_login: "Just now", profile_photo: null }
      ];
    } else {
      store.users[0].pin = "123456";
      store.users[0].password = "owner123";
    }

    if (settingsStore) {
      settingsStore.alert_preferences = {
        low_stock: true,
        expiry: true,
        payment: false,
        closing: true,
        printer: true,
        threshold: 20
      };
      settingsStore.session_settings = { autoLockMinutes: 0 };
      settingsStore.restaurant_profile = {
        name: "Dastarkhwan Restaurant",
        address: "University Road, Peshawar",
        phone: "091-1234567",
        ntn: "1234567-8",
        currency: "PKR",
        taxRate: 0,
        serviceCharge: 0,
        taxCalculationMethod: "after_discount",
        receiptFooter: "Thank you for dining with us — visit again!",
        showLogo: true,
        showOwnerInfo: true,
        showTaxBreakdown: true,
        showCashierName: true,
        showQrCode: false,
      };
    }

    persistStore();
    persistSettings();
    memId = 10000;

    localStorage.removeItem("dastarkhwan-remembered-user");
    localStorage.removeItem("active_pos_order_id");
    localStorage.removeItem("theme-preference");
    localStorage.removeItem("kitchen_soundEnabled");
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("dastarkhwan-") || key.endsWith("_visible_cols"))) {
        localStorage.removeItem(key);
      }
    }
    return delay({ success: true });
  },

  getDashboardSummary: (dateRange) => {
    const { start, end } = dateRange || {};

    const orders = store.orders || [];
    const expenses = store.expenses || [];
    const menuItems = store.menu_items || [];
    const orderItems = store.order_items || [];
    const journalEntries = store.journal_entries || [];

    const parseDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v);
      if (typeof v === 'string') {
        const cleaned = v.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
          const parts = cleaned.split('-');
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        const n = Number(v);
        if (!Number.isNaN(n)) return new Date(n < 1e12 ? n * 1000 : n);
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) return d;
        const fallback = new Date(cleaned.replace(" ", "T"));
        return Number.isNaN(fallback.getTime()) ? null : fallback;
      }
      return null;
    };

    const getOrderDate = (order) => {
      const candidates = [order?.created_at, order?.createdAt, order?.date, order?.order_date, order?.time];
      for (const value of candidates) {
        if (!value) continue;
        if (typeof value === "string") {
          const direct = parseDate(value);
          if (direct) return direct;
          const timeMatch = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
          if (timeMatch) {
            const now = new Date();
            const hour = Number(timeMatch[1]);
            const minute = Number(timeMatch[2] || 0);
            const period = timeMatch[3]?.toUpperCase();
            const normalizedHour = period === "PM" && hour < 12 ? hour + 12 : period === "AM" && hour === 12 ? 0 : hour;
            const fallback = new Date(now);
            fallback.setHours(normalizedHour, minute, 0, 0);
            return fallback;
          }
        }
      }
      return null;
    };

    const getOrderSaleValue = (order) => {
      const total = Number(order?.total ?? order?.amount ?? 0) || 0;
      const refund = Number(order?.refunded_total ?? order?.refund_amount ?? 0) || 0;
      return Math.max(0, total - refund);
    };

    const currentOrdersList = orders.filter((o) => {
      if (o.status !== "paid") return false;
      if (!start || !end) return true;
      const d = getOrderDate(o);
      return d && d >= start && d <= end;
    });

    const totalRevenue = currentOrdersList.reduce((s, o) => s + getOrderSaleValue(o), 0);
    const orderCount = currentOrdersList.length;
    const avgOrderValue = orderCount ? Math.round(totalRevenue / orderCount) : 0;

    let cashPosition = 0;
    let accountsReceivable = 0;
    let accountsPayable = 0;

    journalEntries.forEach(je => {
      const debit = Number(je.debit || 0);
      const credit = Number(je.credit || 0);
      if (je.account_code === '1001' || je.account_code === '1002') cashPosition += debit - credit;
      if (je.account_code === '1003') accountsReceivable += debit - credit;
      if (je.account_code === '2001') accountsPayable += credit - debit;
    });

    const currentOrderItemIds = new Set(currentOrdersList.map((o) => o.id));
    const grouped = orderItems
      .filter((it) => currentOrderItemIds.has(it.order_id))
      .reduce((acc, item) => {
        const menuId = item.menu_item_id || null;
        const key = menuId ? `id:${menuId}` : `name:${item.name || "Unknown"}`;
        if (!acc[key]) acc[key] = {
          name: menuId ? (menuItems.find((m) => String(m.id) === String(menuId))?.name || item.name || "Unknown") : (item.name || "Unknown"),
          qty: 0,
          revenue: 0,
          menu_item_id: menuId,
        };
        acc[key].qty     += Number(item.qty || 1);
        acc[key].revenue += Number(item.price || 0) * Number(item.qty || 1);
        return acc;
      }, {});
      
    const topSellingItems = Object.values(grouped)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
      
    const rev = currentOrdersList.reduce((acc, o) => {
      if (o.payment_details && String(o.payment_details).startsWith("[")) {
        try {
          const splits = JSON.parse(o.payment_details);
          splits.forEach((s) => {
            const m = s.method || "Cash";
            acc[m] = (acc[m] || 0) + Number(s.amount || 0);
          });
          return acc;
        } catch (_) {}
      }
      const rawMethod = o.payment_method || "Cash";
      const key = ["Cash", "Card", "Wallet", "Credit"].includes(rawMethod) ? rawMethod : "Cash";
      acc[key] = (acc[key] || 0) + Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0));
      return acc;
    }, {});
    const rTotal = Object.values(rev).reduce((s, v) => s + v, 0) || 0;
    const revenueByPaymentMethod = rTotal ? Object.entries(rev)
      .map(([name, value]) => ({ name, value: Math.round((value / rTotal) * 100) }))
      .sort((a, b) => b.value - a.value) : [];

    const pendingOrders = currentOrdersList.filter((o) => o.kitchen_status === "new" || o.status === "new").length;

    return delay({
      totalRevenue,
      orderCount,
      avgOrderValue,
      cashPosition,
      accountsReceivable,
      accountsPayable,
      topSellingItems,
      revenueByPaymentMethod,
      pendingOrders
    });
  },
};

const callbacks = [];
export const onInvalidate = (cb) => {
  callbacks.push(cb);
  return () => {
    const idx = callbacks.indexOf(cb);
    if (idx !== -1) callbacks.splice(idx, 1);
  };
};

const notify = (table) => {
  callbacks.forEach((cb) => cb(table));
};

const rawApi = typeof window !== "undefined" && window.api ? window.api : memoryApi;

const api = { ...rawApi, onInvalidate };

if (typeof window !== "undefined" && window.api) {
  // Wrap simple modifiers
  const overrides = ["create", "update", "remove"];
  overrides.forEach((method) => {
    if (rawApi[method]) {
      api[method] = async (table, ...args) => {
        const res = await rawApi[method](table, ...args);
        notify(table);
        return res;
      };
    }
  });

  // Wrap custom modifiers
  const customOverrides = [
    { method: "createOrderWithItems", tables: ["orders", "order_items", "tables_floor", "customers"] },
    { method: "processPurchaseOrder", tables: ["purchase_orders", "purchase_order_items", "inventory_items", "inventory_transactions", "suppliers"] },
    { method: "processReturn", tables: ["orders", "sales_returns", "inventory_items", "inventory_transactions"] },
    { method: "processPurchaseReturn", tables: ["purchase_orders", "purchase_returns", "inventory_items", "inventory_transactions", "suppliers"] },
    { method: "updateOrderStatus", tables: ["orders", "tables_floor"] },
    { method: "clearData", tables: ["*"] }
  ];

  customOverrides.forEach(({ method, tables }) => {
    if (rawApi[method]) {
      api[method] = async (...args) => {
        const res = await rawApi[method](...args);
        tables.forEach(t => notify(t));
        return res;
      };
    }
  });
}

export default api;
