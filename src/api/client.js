import * as mock from "../data/mockData.js";

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

const persistStore = () => writeStoredState(STORAGE_KEY, store);
const persistSettings = () => writeStoredState(SETTINGS_STORAGE_KEY, settingsStore);

const delay = (v) => new Promise((res) => setTimeout(() => res(v), 80));

const memoryApi = {
  isElectron: false,
  logAction: (user, module, action) => {
    store.audit_log = [{ 
      id: nextId(), 
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), 
      user: user || "System", 
      module, 
      action, 
      ip_device: "Browser-Dev" 
    }, ...(store.audit_log || [])];
    persistStore();
  },
  pushNotification: (type, text) => {
    const n = { id: nextId(), type, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), read: 0 };
    store.notifications = [n, ...(store.notifications || [])];
    persistStore();
  },
  markAllNotificationsRead: () => {
    store.notifications = (store.notifications || []).map(n => ({ ...n, read: 1 }));
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
        const prefs = store.settings?.alert_preferences || {
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
              const exists = (store.notifications || []).some(n => n.type === 'low_stock' && n.text === alertText && !n.read);
              if (!exists) {
                const n = { id: nextId(), type: 'low_stock', text: alertText, time, read: 0 };
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
                const exists = (store.notifications || []).some(n => n.type === 'expiry' && n.text === alertText && !n.read);
                if (!exists) {
                  const n = { id: nextId(), type: 'expiry', text: alertText, time, read: 0 };
                  store.notifications = [n, ...(store.notifications || [])];
                }
              } else if (diffDays <= 3) {
                const alertText = `Expiring Soon: Batch ${batch.batch_number || 'N/A'} of ${item.name} will expire in ${diffDays} days (${batch.expiry_date}).`;
                const exists = (store.notifications || []).some(n => n.type === 'expiry' && n.text === alertText && !n.read);
                if (!exists) {
                  const n = { id: nextId(), type: 'expiry', text: alertText, time, read: 0 };
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
                const n = { id: nextId(), type: 'payment', text: alertText, time, read: 0 };
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
          const dateStr = row.date || new Date().toISOString().split('T')[0];
          
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
            updated.status = newStock <= 0 ? "critical" : newStock <= (updated.reorder || 10) ? "low" : "in_stock";
            
            const txRecord = {
              id: nextId(),
              date: new Date().toISOString().split("T")[0],
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
          const dateNow = new Date().toISOString().split('T')[0];
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
        store.suppliers = store.suppliers.map(s =>
          s.name === po.supplier
            ? { ...s, due: Number(s.due || 0) + Number(po.total) }
            : s
        );
        
        // Post journal entries
        const dateNow = po.date || new Date().toISOString().split("T")[0];
        const poTot = Number(po.total || 0);
        if (poTot > 0) {
          const debitLine = {
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
          };
          
          const creditLine = {
            id: nextId(),
            date: dateNow,
            reference_type: 'PO',
            reference_id: poId,
            reference: `PO-${poId}`,
            account_code: '2001',
            account_name: 'Accounts Payable',
            debit: 0,
            credit: poTot,
            description: `Received PO #${poId} from ${po.supplier}`,
            created_by: 'System'
          };
          
          store.journal_entries = [debitLine, creditLine, ...(store.journal_entries || [])];
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

    // Post journal entry for supplier payment
    const dateNow = data.date || new Date().toISOString().split("T")[0];
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
    const newTx = { id: nextId(), date: new Date().toISOString().split("T")[0], ...tx };
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
    const dateStr = new Date().toISOString().split("T")[0];
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
      date: data.date || new Date().toISOString().split("T")[0],
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
              date: new Date().toISOString().split("T")[0],
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
      purchase_date: data.purchase_date || new Date().toISOString().split("T")[0],
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
        date: new Date().toISOString().split("T")[0],
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
};

const api = typeof window !== "undefined" && window.api ? window.api : memoryApi;

export default api;
