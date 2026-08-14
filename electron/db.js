const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

// Tables the generic CRUD bridge is allowed to touch.
// Every table has an integer `id` primary key unless noted.
const ALLOWED_TABLES = [
  "users",
  "categories",
  "menu_items",
  "recipe_ingredients",
  "inventory_items",
  "suppliers",
  "purchase_orders",
  "purchase_order_items",
  "customers",
  "employees",
  "expenses",
  "tables_floor",
  "orders",
  "order_items",
  "kitchen_tickets",
  "notifications",
  "audit_log",
  "sales_returns",
  "role_permissions",
  "custom_roles",
];

// Default modules used in permissions matrix
const MODULES = [
  "Dashboard",
  "POS Billing",
  "Sales",
  "Kitchen Display",
  "Table Management",
  "Order Management",
  "Menu Management",
  "Recipe Management",
  "Inventory",
  "Suppliers",
  "Purchases",
  "Customers",
  "Employees",
  "Users & Roles",
  "Expenses",
  "Accounting",
  "Reports",
  "Notifications",
  "Printing",
  "Backup & Restore",
  "Audit Log",
  "Hardware",
  "Settings",
];

// Default permissions: [view, add, edit, delete, export]
const DEFAULT_PERMISSIONS = {
  Owner:          [1, 1, 1, 1, 1],
  Manager:        [1, 1, 1, 0, 1],
  Cashier:        [1, 1, 1, 0, 0],
  Waiter:         [1, 1, 1, 0, 0],
  "Kitchen Staff":[1, 0, 1, 0, 0],
  Accountant:     [1, 0, 0, 0, 1],
};

// Per-module overrides (role -> module -> [v,a,e,d,x])
const MODULE_OVERRIDES = {
  Owner: {},   // all full access — defaults apply
  Manager: {
    "Settings":     [0, 0, 0, 0, 0],
    "Users & Roles":[1, 0, 0, 0, 0],
    "Backup & Restore": [0, 0, 0, 0, 0],
  },
  Cashier: {
    "Dashboard":        [1, 0, 0, 0, 0],
    "Kitchen Display":  [0, 0, 0, 0, 0],
    "Table Management": [1, 0, 0, 0, 0],
    "Menu Management":  [1, 0, 0, 0, 0],
    "Recipe Management":[0, 0, 0, 0, 0],
    "Inventory":        [1, 0, 0, 0, 0],
    "Suppliers":        [0, 0, 0, 0, 0],
    "Purchases":        [0, 0, 0, 0, 0],
    "Customers":        [1, 1, 0, 0, 0],
    "Employees":        [0, 0, 0, 0, 0],
    "Users & Roles":    [0, 0, 0, 0, 0],
    "Expenses":         [0, 0, 0, 0, 0],
    "Accounting":       [0, 0, 0, 0, 0],
    "Reports":          [0, 0, 0, 0, 0],
    "Settings":         [0, 0, 0, 0, 0],
    "Backup & Restore": [0, 0, 0, 0, 0],
    "Audit Log":        [0, 0, 0, 0, 0],
    "Hardware":         [0, 0, 0, 0, 0],
  },
  Waiter: {
    "Dashboard":        [1, 0, 0, 0, 0],
    "POS Billing":      [0, 0, 0, 0, 0],
    "Sales":            [0, 0, 0, 0, 0],
    "Kitchen Display":  [1, 0, 0, 0, 0],
    "Menu Management":  [1, 0, 0, 0, 0],
    "Recipe Management":[0, 0, 0, 0, 0],
    "Inventory":        [0, 0, 0, 0, 0],
    "Suppliers":        [0, 0, 0, 0, 0],
    "Purchases":        [0, 0, 0, 0, 0],
    "Customers":        [1, 0, 0, 0, 0],
    "Employees":        [0, 0, 0, 0, 0],
    "Users & Roles":    [0, 0, 0, 0, 0],
    "Expenses":         [0, 0, 0, 0, 0],
    "Accounting":       [0, 0, 0, 0, 0],
    "Reports":          [0, 0, 0, 0, 0],
    "Settings":         [0, 0, 0, 0, 0],
    "Backup & Restore": [0, 0, 0, 0, 0],
    "Audit Log":        [0, 0, 0, 0, 0],
    "Hardware":         [0, 0, 0, 0, 0],
    "Notifications":    [1, 0, 0, 0, 0],
    "Printing":         [0, 0, 0, 0, 0],
  },
  "Kitchen Staff": {
    "Dashboard":        [0, 0, 0, 0, 0],
    "POS Billing":      [0, 0, 0, 0, 0],
    "Sales":            [0, 0, 0, 0, 0],
    "Table Management": [0, 0, 0, 0, 0],
    "Order Management": [0, 0, 0, 0, 0],
    "Menu Management":  [1, 0, 0, 0, 0],
    "Recipe Management":[1, 0, 0, 0, 0],
    "Inventory":        [0, 0, 0, 0, 0],
    "Suppliers":        [0, 0, 0, 0, 0],
    "Purchases":        [0, 0, 0, 0, 0],
    "Customers":        [0, 0, 0, 0, 0],
    "Employees":        [0, 0, 0, 0, 0],
    "Users & Roles":    [0, 0, 0, 0, 0],
    "Expenses":         [0, 0, 0, 0, 0],
    "Accounting":       [0, 0, 0, 0, 0],
    "Reports":          [0, 0, 0, 0, 0],
    "Notifications":    [1, 0, 0, 0, 0],
    "Settings":         [0, 0, 0, 0, 0],
    "Backup & Restore": [0, 0, 0, 0, 0],
    "Audit Log":        [0, 0, 0, 0, 0],
    "Hardware":         [0, 0, 0, 0, 0],
    "Printing":         [0, 0, 0, 0, 0],
  },
  Accountant: {
    "POS Billing":      [1, 0, 0, 0, 0],
    "Kitchen Display":  [0, 0, 0, 0, 0],
    "Table Management": [0, 0, 0, 0, 0],
    "Order Management": [1, 0, 0, 0, 0],
    "Menu Management":  [1, 0, 0, 0, 0],
    "Recipe Management":[0, 0, 0, 0, 0],
    "Suppliers":        [1, 0, 0, 0, 0],
    "Purchases":        [1, 0, 0, 0, 0],
    "Customers":        [1, 0, 0, 0, 0],
    "Employees":        [1, 0, 0, 0, 0],
    "Users & Roles":    [0, 0, 0, 0, 0],
    "Settings":         [0, 0, 0, 0, 0],
    "Backup & Restore": [0, 0, 0, 0, 0],
    "Hardware":         [0, 0, 0, 0, 0],
  },
};

function openDatabase(userDataPath) {
  const dbPath = path.join(userDataPath, "dastarkhwan-erp.db");
  const isNew = !fs.existsSync(dbPath);
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      pin TEXT,
      password TEXT,
      email TEXT,
      phone TEXT,
      profile_photo TEXT,
      branch TEXT DEFAULT 'Main Branch',
      status TEXT DEFAULT 'active',
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      printer_station TEXT,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'available',
      prep_time INTEGER DEFAULT 10,
      station TEXT,
      image TEXT DEFAULT '🍽️'
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
      ingredient_id INTEGER REFERENCES inventory_items(id),
      qty REAL,
      unit TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT DEFAULT 'kg',
      stock REAL DEFAULT 0,
      reorder REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      status TEXT DEFAULT 'in_stock'
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      category TEXT,
      due REAL DEFAULT 0,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT,
      date TEXT,
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
      ingredient TEXT,
      qty REAL,
      rate REAL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      visits INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      credit REAL DEFAULT 0,
      tier TEXT DEFAULT 'Silver'
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      joined TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      amount REAL DEFAULT 0,
      date TEXT,
      paid_by TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS tables_floor (
      id TEXT PRIMARY KEY,
      section TEXT,
      seats INTEGER DEFAULT 4,
      status TEXT DEFAULT 'available',
      order_id TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      type TEXT,
      table_id TEXT,
      customer TEXT,
      items_count INTEGER DEFAULT 0,
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'new',
      waiter TEXT,
      time TEXT,
      subtotal REAL DEFAULT 0,
      discount_percent REAL DEFAULT 0,
      discount_reason TEXT,
      tax REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      payment_method TEXT,
      payment_details TEXT,
      tendered REAL,
      change_due REAL,
      refunded_total REAL DEFAULT 0,
      order_note TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sales_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT REFERENCES orders(id),
      kind TEXT DEFAULT 'return',
      items TEXT,
      amount REAL DEFAULT 0,
      reason TEXT,
      restock INTEGER DEFAULT 0,
      user TEXT,
      time TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER,
      name TEXT,
      qty INTEGER,
      price REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS kitchen_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      table_label TEXT,
      status TEXT DEFAULT 'new',
      rush INTEGER DEFAULT 0,
      time TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      text TEXT,
      time TEXT,
      read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT,
      user TEXT,
      module TEXT,
      action TEXT,
      ip_device TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT NOT NULL,
      module TEXT NOT NULL,
      can_view INTEGER DEFAULT 0,
      can_add INTEGER DEFAULT 0,
      can_edit INTEGER DEFAULT 0,
      can_delete INTEGER DEFAULT 0,
      can_export INTEGER DEFAULT 0,
      PRIMARY KEY (role, module)
    );

    CREATE TABLE IF NOT EXISTS custom_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  migrate(db);

  if (isNew) {
    seed(db);
  }

  return db;
}

// Adds any new columns this version introduced to an already-existing database file.
// Safe to run every launch — ignores "duplicate column" errors.
function migrate(db) {
  const newOrderColumns = [
    "subtotal REAL DEFAULT 0",
    "discount_percent REAL DEFAULT 0",
    "discount_reason TEXT",
    "tax REAL DEFAULT 0",
    "service_charge REAL DEFAULT 0",
    "payment_method TEXT",
    "payment_details TEXT",
    "tendered REAL",
    "change_due REAL",
    "refunded_total REAL DEFAULT 0",
    "order_note TEXT",
    "created_at TEXT",
  ];
  for (const col of newOrderColumns) {
    try { db.exec(`ALTER TABLE orders ADD COLUMN ${col}`); } catch { /* exists */ }
  }

  // Module 2 user columns
  const newUserColumns = [
    "email TEXT",
    "phone TEXT",
    "profile_photo TEXT",
    "branch TEXT DEFAULT 'Main Branch'",
    "password TEXT",
  ];
  for (const col of newUserColumns) {
    try { db.exec(`ALTER TABLE users ADD COLUMN ${col}`); } catch { /* exists */ }
  }

  // Audit log device column
  try { db.exec("ALTER TABLE audit_log ADD COLUMN ip_device TEXT"); } catch { /* exists */ }

  // Ensure role_permissions and custom_roles tables exist (idempotent via CREATE IF NOT EXISTS above)
  // Seed default permissions if none exist yet
  const count = db.prepare("SELECT COUNT(*) as c FROM role_permissions").get();
  if (count.c === 0) {
    seedPermissions(db);
  }
}

function seedPermissions(db) {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO role_permissions (role, module, can_view, can_add, can_edit, can_delete, can_export)
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
}

function seed(db) {
  const insertMany = (table, cols, rows) => {
    const placeholders = cols.map(() => "?").join(",");
    const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`);
    db.exec("BEGIN");
    try {
      for (const item of rows) stmt.run(...cols.map((c) => item[c] ?? null));
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  };

  insertMany("users", ["name", "role", "pin", "password", "email", "phone", "branch", "status", "last_login"], [
    { name: "Hammadullah", role: "Owner", pin: "1234", password: "owner123", email: "owner@dastarkhwan.pk", phone: "0300-0000001", branch: "Main Branch", status: "active", last_login: "Today, 9:02 AM" },
    { name: "Bilal Hussain", role: "Cashier", pin: "2345", password: "cashier123", email: "bilal@dastarkhwan.pk", phone: "0300-0000002", branch: "Main Branch", status: "active", last_login: "Today, 11:40 AM" },
    { name: "Ahmed Raza", role: "Waiter", pin: "3456", password: "waiter123", email: "ahmed@dastarkhwan.pk", phone: "0300-0000003", branch: "Main Branch", status: "active", last_login: "Today, 11:52 AM" },
    { name: "Chef Imran", role: "Kitchen Staff", pin: "4567", password: "kitchen123", email: "imran@dastarkhwan.pk", phone: "0300-0000004", branch: "Main Branch", status: "active", last_login: "Today, 10:15 AM" },
  ]);

  insertMany("categories", ["name", "printer_station", "display_order"], [
    { name: "Fast Food", printer_station: "Fry", display_order: 1 },
    { name: "BBQ & Grill", printer_station: "Grill", display_order: 2 },
    { name: "Rice & Karahi", printer_station: "Grill", display_order: 3 },
    { name: "Beverages", printer_station: "Bar", display_order: 4 },
    { name: "Desserts", printer_station: "Dessert", display_order: 5 },
  ]);

  insertMany("menu_items", ["name", "category", "price", "cost", "status", "prep_time", "station", "image"], [
    { name: "Zinger Burger", category: "Fast Food", price: 650, cost: 240, status: "available", prep_time: 12, station: "Fry", image: "🍔" },
    { name: "Chicken Wings (6pc)", category: "Fast Food", price: 780, cost: 310, status: "available", prep_time: 15, station: "Fry", image: "🍗" },
    { name: "Chicken Seekh Kebab", category: "BBQ & Grill", price: 500, cost: 190, status: "available", prep_time: 18, station: "Grill", image: "🍢" },
    { name: "Beef Chapli Kebab", category: "BBQ & Grill", price: 550, cost: 220, status: "out_of_stock", prep_time: 18, station: "Grill", image: "🥩" },
    { name: "Beef Karahi (Full)", category: "Rice & Karahi", price: 2400, cost: 980, status: "available", prep_time: 25, station: "Grill", image: "🍲" },
    { name: "Chicken Biryani", category: "Rice & Karahi", price: 380, cost: 140, status: "available", prep_time: 10, station: "Grill", image: "🍛" },
    { name: "Kashmiri Chai", category: "Beverages", price: 180, cost: 55, status: "available", prep_time: 5, station: "Bar", image: "🍵" },
    { name: "Fresh Lime Soda", category: "Beverages", price: 150, cost: 40, status: "available", prep_time: 3, station: "Bar", image: "🥤" },
    { name: "Gulab Jamun (2pc)", category: "Desserts", price: 220, cost: 70, status: "available", prep_time: 3, station: "Dessert", image: "🍮" },
  ]);

  insertMany("inventory_items", ["name", "category", "unit", "stock", "reorder", "cost", "status"], [
    { name: "Chicken Boneless", category: "Meat & Poultry", unit: "kg", stock: 42, reorder: 20, cost: 620, status: "in_stock" },
    { name: "Chicken Boneless (Frozen)", category: "Meat & Poultry", unit: "kg", stock: 8, reorder: 20, cost: 580, status: "low" },
    { name: "Mozzarella Cheese", category: "Dairy", unit: "kg", stock: 3.2, reorder: 10, cost: 1450, status: "low" },
    { name: "Basmati Rice", category: "Dry Goods", unit: "kg", stock: 120, reorder: 40, cost: 320, status: "in_stock" },
    { name: "Cooking Oil", category: "Dry Goods", unit: "ltr", stock: 14, reorder: 25, cost: 480, status: "low" },
    { name: "Coriander (Fresh)", category: "Vegetables", unit: "kg", stock: 1.1, reorder: 5, cost: 180, status: "critical" },
    { name: "Tomatoes", category: "Vegetables", unit: "kg", stock: 0, reorder: 15, cost: 140, status: "critical" },
  ]);

  insertMany("suppliers", ["name", "phone", "category", "due", "status"], [
    { name: "Al-Madina Meat Suppliers", phone: "0300-1234567", category: "Meat & Poultry", due: 84500, status: "active" },
    { name: "Fresh Valley Vegetables", phone: "0333-9988776", category: "Vegetables", due: 12300, status: "active" },
    { name: "Khyber Dairy Co.", phone: "0345-1122334", category: "Dairy", due: 0, status: "active" },
    { name: "Metro Dry Goods", phone: "0312-4455667", category: "Dry Goods", due: 45200, status: "blocked" },
  ]);

  insertMany("purchase_orders", ["supplier", "date", "total", "status"], [
    { supplier: "Al-Madina Meat Suppliers", date: "Jul 08, 2026", total: 68500, status: "received" },
    { supplier: "Fresh Valley Vegetables", date: "Jul 09, 2026", total: 22400, status: "sent" },
    { supplier: "Metro Dry Goods", date: "Jul 10, 2026", total: 51200, status: "draft" },
    { supplier: "Khyber Dairy Co.", date: "Jul 11, 2026", total: 18900, status: "received" },
  ]);

  insertMany("customers", ["name", "phone", "visits", "points", "credit", "tier"], [
    { name: "Sara Khan", phone: "0301-2223344", visits: 24, points: 1280, credit: 0, tier: "Gold" },
    { name: "Usman Tariq", phone: "0322-5566778", visits: 11, points: 540, credit: 0, tier: "Silver" },
    { name: "Faisal Iqbal", phone: "0345-9988001", visits: 6, points: 180, credit: 3200, tier: "Silver" },
    { name: "Ayesha Noor", phone: "0333-1230984", visits: 42, points: 3450, credit: 0, tier: "Platinum" },
  ]);

  insertMany("employees", ["name", "role", "phone", "status", "joined"], [
    { name: "Ahmed Raza", role: "Waiter", phone: "0301-1112223", status: "active", joined: "Jan 2025" },
    { name: "Bilal Hussain", role: "Cashier", phone: "0322-3334445", status: "active", joined: "Mar 2025" },
    { name: "Hina Aslam", role: "Waiter", phone: "0345-5556667", status: "on_leave", joined: "May 2025" },
    { name: "Chef Imran", role: "Chef", phone: "0312-7778889", status: "active", joined: "Nov 2024" },
  ]);

  insertMany("expenses", ["category", "amount", "date", "paid_by", "notes"], [
    { category: "Electricity", amount: 42000, date: "Jul 05, 2026", paid_by: "Owner", notes: "" },
    { category: "Gas", amount: 18500, date: "Jul 06, 2026", paid_by: "Manager", notes: "" },
    { category: "Maintenance", amount: 7200, date: "Jul 08, 2026", paid_by: "Manager", notes: "AC repair" },
    { category: "Salaries", amount: 285000, date: "Jul 01, 2026", paid_by: "Owner", notes: "" },
  ]);

  insertMany("tables_floor", ["id", "section", "seats", "status", "order_id"], [
    { id: "T-01", section: "Ground Floor", seats: 4, status: "occupied", order_id: "ORD-1042" },
    { id: "T-02", section: "Ground Floor", seats: 2, status: "available", order_id: null },
    { id: "T-03", section: "Ground Floor", seats: 6, status: "reserved", order_id: null },
    { id: "T-04", section: "Ground Floor", seats: 4, status: "cleaning", order_id: null },
    { id: "T-05", section: "Rooftop", seats: 4, status: "occupied", order_id: "ORD-1045" },
    { id: "T-06", section: "Rooftop", seats: 8, status: "available", order_id: null },
    { id: "T-07", section: "Rooftop", seats: 2, status: "occupied", order_id: "ORD-1046" },
    { id: "T-08", section: "VIP", seats: 10, status: "available", order_id: null },
  ]);

  insertMany("orders", ["id", "type", "table_id", "customer", "items_count", "total", "status", "waiter", "time", "subtotal", "discount_percent", "discount_reason", "tax", "service_charge", "payment_method", "tendered", "change_due", "refunded_total", "created_at"], [
    { id: "ORD-1042", type: "Dine-In", table_id: "T-01", customer: "Walk-in", items_count: 4, total: 2140, status: "preparing", waiter: "Ahmed", time: "12:14 PM", subtotal: 2140, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0, payment_method: null, tendered: null, change_due: null, refunded_total: 0, created_at: new Date().toISOString() },
    { id: "ORD-1043", type: "Takeaway", table_id: null, customer: "Sara Khan", items_count: 2, total: 980, status: "ready", waiter: "Bilal", time: "12:22 PM", subtotal: 980, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0, payment_method: null, tendered: null, change_due: null, refunded_total: 0, created_at: new Date().toISOString() },
    { id: "ORD-1044", type: "Delivery", table_id: null, customer: "Usman Tariq", items_count: 5, total: 3120, status: "served", waiter: "Hina", time: "12:30 PM", subtotal: 2950, discount_percent: 0, discount_reason: null, tax: 170, service_charge: 0, payment_method: "Cash", tendered: 3200, change_due: 80, refunded_total: 0, created_at: new Date().toISOString() },
    { id: "ORD-1045", type: "Dine-In", table_id: "T-05", customer: "Walk-in", items_count: 3, total: 1650, status: "preparing", waiter: "Ahmed", time: "12:40 PM", subtotal: 1650, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0, payment_method: null, tendered: null, change_due: null, refunded_total: 0, created_at: new Date().toISOString() },
    { id: "ORD-1046", type: "Dine-In", table_id: "T-07", customer: "Walk-in", items_count: 2, total: 890, status: "new", waiter: "Bilal", time: "12:55 PM", subtotal: 890, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0, payment_method: null, tendered: null, change_due: null, refunded_total: 0, created_at: new Date().toISOString() },
    { id: "ORD-1047", type: "Phone Order", table_id: null, customer: "Faisal Iqbal", items_count: 6, total: 4200, status: "cancelled", waiter: "Hina", time: "1:05 PM", subtotal: 4200, discount_percent: 0, discount_reason: null, tax: 0, service_charge: 0, payment_method: null, tendered: null, change_due: null, refunded_total: 0, created_at: new Date().toISOString() },
    { id: "ORD-1038", type: "Dine-In", table_id: null, customer: "Ayesha Noor", items_count: 3, total: 1580, status: "paid", waiter: "Bilal", time: "11:20 AM", subtotal: 1500, discount_percent: 0, discount_reason: null, tax: 80, service_charge: 0, payment_method: "Card", tendered: 1580, change_due: 0, refunded_total: 0, created_at: new Date().toISOString() },
    { id: "ORD-1039", type: "Takeaway", table_id: null, customer: "Walk-in", items_count: 2, total: 830, status: "paid", waiter: "Ahmed", time: "11:35 AM", subtotal: 790, discount_percent: 0, discount_reason: null, tax: 40, service_charge: 0, payment_method: "Cash", tendered: 1000, change_due: 170, refunded_total: 0, created_at: new Date().toISOString() },
  ]);

  insertMany("order_items", ["order_id", "menu_item_id", "name", "qty", "price", "notes"], [
    { order_id: "ORD-1038", menu_item_id: 6, name: "Chicken Biryani", qty: 3, price: 380, notes: "" },
    { order_id: "ORD-1039", menu_item_id: 7, name: "Kashmiri Chai", qty: 2, price: 180, notes: "" },
    { order_id: "ORD-1039", menu_item_id: 9, name: "Gulab Jamun (2pc)", qty: 2, price: 220, notes: "" },
  ]);

  insertMany("notifications", ["type", "text", "time", "read"], [
    { type: "low_stock", text: "Coriander (Fresh) is below reorder level", time: "5 min ago", read: 0 },
    { type: "expiry", text: "Mozzarella Cheese batch #B-220 expires in 2 days", time: "42 min ago", read: 0 },
    { type: "payment", text: "Metro Dry Goods payment of Rs. 45,200 is overdue", time: "2 hr ago", read: 0 },
    { type: "system", text: "Daily closing reminder — Z-Report not yet generated", time: "3 hr ago", read: 0 },
  ]);

  insertMany("audit_log", ["time", "user", "module", "action", "ip_device"], [
    { time: "12:41 PM", user: "Bilal Hussain", module: "POS Billing", action: "Applied 10% discount on ORD-1042", ip_device: "POS-Terminal-1" },
    { time: "12:20 PM", user: "Ahmed Raza", module: "Table Management", action: "Marked T-03 as Reserved", ip_device: "Tablet-Floor-1" },
    { time: "11:58 AM", user: "Hammadullah", module: "Inventory", action: "Adjusted stock for Cooking Oil (-4 ltr, wastage)", ip_device: "Office-PC" },
    { time: "11:30 AM", user: "Chef Imran", module: "Kitchen Display", action: "Marked ORD-1039 as Served", ip_device: "Kitchen-Screen" },
  ]);

  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
    "restaurant_profile",
    JSON.stringify({
      name: "Dastarkhwan Restaurant",
      address: "University Road, Peshawar",
      phone: "091-1234567",
      currency: "PKR",
      taxRate: 5,
      serviceCharge: 10,
      receiptFooter: "Thank you for dining with us — visit again!",
    })
  );

  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
    "session_settings",
    JSON.stringify({ autoLockMinutes: 0 })
  );

  // Seed default permissions
  seedPermissions(db);
}

module.exports = { openDatabase, ALLOWED_TABLES, MODULES, DEFAULT_PERMISSIONS, MODULE_OVERRIDES };
