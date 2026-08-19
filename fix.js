const fs = require('fs');

let mainJs = fs.readFileSync('electron/main.js', 'utf-8');

// Fix 1: clearData logic
const oldClear = `      db.exec("BEGIN TRANSACTION;");
      db.exec("PRAGMA defer_foreign_keys = ON;");
      for (const t of tables) {
        if (t.name !== "sqlite_sequence") {
          db.prepare(\`DELETE FROM \${t.name}\`).run();
        }
      }
      db.exec("COMMIT;");
      
      db.exec("PRAGMA foreign_keys = ON;");
      db.exec("VACUUM;");
      
      // Reseed the database with required default rows (Admin user, Accounts, etc.)
      seed(db);

      return { success: true };`;

const newClear = `      db.exec("BEGIN TRANSACTION;");
      db.exec("PRAGMA defer_foreign_keys = ON;");
      for (const t of tables) {
        db.prepare(\`DELETE FROM "\${t.name}"\`).run();
      }
      db.exec("COMMIT;");
      
      db.exec("PRAGMA foreign_keys = ON;");
      db.exec("VACUUM;");
      
      // Reseed ONLY Admin user and default Accounts
      db.exec("BEGIN TRANSACTION;");
      db.prepare(\`INSERT INTO users (name, role, pin, password, email, phone, branch, status, last_login) VALUES ('System Admin', 'Owner', '1234', 'owner123', 'admin@dastarkhwan.pk', '0300-0000000', 'Main Branch', 'active', 'Never')\`).run();
      
      const defaultAccounts = [
        { code: '1000', name: 'Assets', type: 'asset', parent_code: null, is_system: 1 },
        { code: '1001', name: 'Cash in Drawer', type: 'asset', parent_code: '1000', is_system: 1 },
        { code: '1002', name: 'Bank Account (Main)', type: 'asset', parent_code: '1000', is_system: 1 },
        { code: '1003', name: 'Accounts Receivable', type: 'asset', parent_code: '1000', is_system: 1 },
        { code: '1004', name: 'Inventory', type: 'asset', parent_code: '1000', is_system: 1 },
        { code: '1005', name: 'Prepaid Expenses', type: 'asset', parent_code: '1000', is_system: 1 },
        { code: '2000', name: 'Liabilities', type: 'liability', parent_code: null, is_system: 1 },
        { code: '2001', name: 'Accounts Payable', type: 'liability', parent_code: '2000', is_system: 1 },
        { code: '2002', name: 'GST/Sales Tax Payable', type: 'liability', parent_code: '2000', is_system: 1 },
        { code: '2003', name: 'Service Charge Payable', type: 'liability', parent_code: '2000', is_system: 1 },
        { code: '2004', name: 'Employee Salaries Payable', type: 'liability', parent_code: '2000', is_system: 1 },
        { code: '3000', name: 'Equity', type: 'equity', parent_code: null, is_system: 1 },
        { code: '3001', name: 'Owner Capital', type: 'equity', parent_code: '3000', is_system: 1 },
        { code: '3002', name: 'Retained Earnings', type: 'equity', parent_code: '3000', is_system: 1 },
        { code: '4000', name: 'Income', type: 'income', parent_code: null, is_system: 1 },
        { code: '4001', name: 'Food Sales Revenue', type: 'income', parent_code: '4000', is_system: 1 },
        { code: '4002', name: 'Beverage Sales Revenue', type: 'income', parent_code: '4000', is_system: 1 },
        { code: '4003', name: 'Service Charge Income', type: 'income', parent_code: '4000', is_system: 1 },
        { code: '4004', name: 'Other Income', type: 'income', parent_code: '4000', is_system: 1 },
        { code: '5000', name: 'Expenses', type: 'expense', parent_code: null, is_system: 1 },
        { code: '5001', name: 'Cost of Goods Sold', type: 'expense', parent_code: '5000', is_system: 1 },
        { code: '5002', name: 'Electricity', type: 'expense', parent_code: '5000', is_system: 1 },
        { code: '5003', name: 'Gas', type: 'expense', parent_code: '5000', is_system: 1 },
        { code: '5004', name: 'Rent', type: 'expense', parent_code: '5000', is_system: 1 },
        { code: '5005', name: 'Salaries & Wages', type: 'expense', parent_code: '5000', is_system: 1 },
        { code: '5006', name: 'Maintenance & Repairs', type: 'expense', parent_code: '5000', is_system: 1 },
        { code: '5007', name: 'Marketing', type: 'expense', parent_code: '5000', is_system: 1 },
        { code: '5099', name: 'Miscellaneous', type: 'expense', parent_code: '5000', is_system: 1 },
      ];
      const ins = db.prepare('INSERT INTO accounts (code, name, type, parent_code, is_system) VALUES (?, ?, ?, ?, ?)');
      for (const a of defaultAccounts) {
        ins.run(a.code, a.name, a.type, a.parent_code, a.is_system);
      }
      db.exec("COMMIT;");
      
      const { seedPermissions } = require('./db.js');
      seedPermissions(db);

      return { success: true };`;

if (mainJs.includes(oldClear)) {
  mainJs = mainJs.replace(oldClear, newClear);
} else {
  console.log('Failed to replace clearData logic');
}

// Fix 2: Add orders:updateKitchenStatus handler
const oldHandler = `      if (order.table_id) {
        db.prepare("UPDATE tables_floor SET status = 'available', order_id = NULL WHERE id = ?").run(order.table_id);
      }
    }

    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    db.prepare(\`INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)\`).run(
      time, meta.user || "System", "POS Billing", \`Marked Order #\${id} as \${status}\`, meta.device || DEVICE_NAME
    );
    return { ...order, status };
  });`;

const newHandler = `      if (order.table_id) {
        db.prepare("UPDATE tables_floor SET status = 'available', order_id = NULL WHERE id = ?").run(order.table_id);
      }
    }

    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    db.prepare(\`INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)\`).run(
      time, meta.user || "System", "POS Billing", \`Marked Order #\${id} as \${status}\`, meta.device || DEVICE_NAME
    );
    return { ...order, status };
  });
  
  ipcMain.handle("orders:updateKitchenStatus", (e, id, kitchen_status, meta = {}) => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) throw new Error("Order not found");

    db.prepare("UPDATE orders SET kitchen_status = ? WHERE id = ?").run(kitchen_status, id);

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    db.prepare(\`INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)\`).run(
      time, meta.user || "System", "Kitchen Display", \`Marked Order #\${id} as \${kitchen_status}\`, meta.device || DEVICE_NAME
    );
    return { ...order, kitchen_status };
  });`;

if (mainJs.includes(oldHandler)) {
  mainJs = mainJs.replace(oldHandler, newHandler);
} else {
  console.log('Failed to add orders:updateKitchenStatus handler');
}

fs.writeFileSync('electron/main.js', mainJs, 'utf-8');

let preloadJs = fs.readFileSync('electron/preload.js', 'utf-8');
const oldPreload = 'updateOrderStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateStatus", id, status, meta),';
const newPreload = 'updateOrderStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateStatus", id, status, meta),\n  updateKitchenStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateKitchenStatus", id, status, meta),';

if (preloadJs.includes(oldPreload)) {
  preloadJs = preloadJs.replace(oldPreload, newPreload);
} else {
  console.log('Failed to add updateKitchenStatus to preload.js');
}

fs.writeFileSync('electron/preload.js', preloadJs, 'utf-8');
console.log('Done!');
