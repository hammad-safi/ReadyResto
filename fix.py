import os

with open('electron/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: clearData logic
old_clear = '''      db.exec("BEGIN TRANSACTION;");
      db.exec("PRAGMA defer_foreign_keys = ON;");
      for (const t of tables) {
        if (t.name !== "sqlite_sequence") {
          db.prepare(`DELETE FROM ${t.name}`).run();
        }
      }
      db.exec("COMMIT;");
      
      db.exec("PRAGMA foreign_keys = ON;");
      db.exec("VACUUM;");
      
      // Reseed the database with required default rows (Admin user, Accounts, etc.)
      seed(db);

      return { success: true };'''

new_clear = '''      db.exec("BEGIN TRANSACTION;");
      db.exec("PRAGMA defer_foreign_keys = ON;");
      for (const t of tables) {
        db.prepare(`DELETE FROM "${t.name}"`).run();
      }
      db.exec("COMMIT;");
      
      db.exec("PRAGMA foreign_keys = ON;");
      db.exec("VACUUM;");
      
      // Reseed ONLY Admin user and default Accounts
      db.exec("BEGIN TRANSACTION;");
      db.prepare(`INSERT INTO users (name, role, pin, password, email, phone, branch, status, last_login) VALUES ('System Admin', 'Owner', '1234', 'owner123', 'admin@dastarkhwan.pk', '0300-0000000', 'Main Branch', 'active', 'Never')`).run();
      
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

      return { success: true };'''
      
if old_clear in content:
    content = content.replace(old_clear, new_clear)
else:
    print('Failed to replace clearData logic')
    
# Fix 2: Add orders:updateKitchenStatus handler
old_handler = '''      if (order.table_id) {
        db.prepare("UPDATE tables_floor SET status = 'available', order_id = NULL WHERE id = ?").run(order.table_id);
      }
    }

    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    db.prepare(`INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)`).run(
      time, meta.user || "System", "POS Billing", `Marked Order #${id} as ${status}`, meta.device || DEVICE_NAME
    );
    return { ...order, status };
  });'''
  
new_handler = '''      if (order.table_id) {
        db.prepare("UPDATE tables_floor SET status = 'available', order_id = NULL WHERE id = ?").run(order.table_id);
      }
    }

    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    db.prepare(`INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)`).run(
      time, meta.user || "System", "POS Billing", `Marked Order #${id} as ${status}`, meta.device || DEVICE_NAME
    );
    return { ...order, status };
  });
  
  ipcMain.handle("orders:updateKitchenStatus", (e, id, kitchen_status, meta = {}) => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) throw new Error("Order not found");

    db.prepare("UPDATE orders SET kitchen_status = ? WHERE id = ?").run(kitchen_status, id);

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    db.prepare(`INSERT INTO audit_log (time, user, module, action, ip_device) VALUES (?, ?, ?, ?, ?)`).run(
      time, meta.user || "System", "Kitchen Display", `Marked Order #${id} as ${kitchen_status}`, meta.device || DEVICE_NAME
    );
    return { ...order, kitchen_status };
  });'''

if old_handler in content:
    content = content.replace(old_handler, new_handler)
else:
    print('Failed to add orders:updateKitchenStatus handler')

with open('electron/main.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('electron/preload.js', 'r', encoding='utf-8') as f:
    preload = f.read()
    
old_preload = 'updateOrderStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateStatus", id, status, meta),'
new_preload = 'updateOrderStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateStatus", id, status, meta),\n  updateKitchenStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateKitchenStatus", id, status, meta),'

if old_preload in preload:
    preload = preload.replace(old_preload, new_preload)
else:
    print('Failed to add updateKitchenStatus to preload.js')
    
with open('electron/preload.js', 'w', encoding='utf-8') as f:
    f.write(preload)
print('Done!')
