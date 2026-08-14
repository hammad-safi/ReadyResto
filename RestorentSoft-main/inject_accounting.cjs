const fs = require('fs');
let code = fs.readFileSync('src/api/client.js', 'utf8');

const replacement = `    }
    
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
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: bankOrCashCode, account_name: bankOrCashName, debit: tendered, credit: 0, description: \`Partial payment for Order #\${refId}\`, created_by: 'System' });
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '1003', account_name: 'Accounts Receivable', debit: tot - tendered, credit: 0, description: \`Credit for Order #\${refId}\`, created_by: 'System' });
          } else if (tot > tendered && tendered === 0) {
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '1003', account_name: 'Accounts Receivable', debit: tot, credit: 0, description: \`Credit for Order #\${refId}\`, created_by: 'System' });
          } else {
             entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: bankOrCashCode, account_name: bankOrCashName, debit: tot, credit: 0, description: \`Payment for Order #\${refId}\`, created_by: 'System' });
          }
  
          // Revenue
          entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '4001', account_name: 'Food Sales Revenue', debit: 0, credit: rev, description: \`Revenue from Order #\${refId}\`, created_by: 'System' });
          
          // Tax / Service Charge
          if (tTax > 0) {
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '2002', account_name: 'GST/Sales Tax Payable', debit: 0, credit: tTax, description: \`Tax for Order #\${refId}\`, created_by: 'System' });
          }
          if (tSc > 0) {
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '2003', account_name: 'Service Charge Payable', debit: 0, credit: tSc, description: \`Service Charge for Order #\${refId}\`, created_by: 'System' });
          }

          // COGS & Inventory Deduction
          const totalCogs = items.reduce((s, it) => s + (Number(it.cogs) || (Number(it.cost || 0) * Number(it.qty || 1))), 0);
          if (totalCogs > 0) {
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '5001', account_name: 'Cost of Goods Sold', debit: totalCogs, credit: 0, description: \`COGS for Order #\${refId}\`, created_by: 'System' });
              entries.push({ id: nextId(), date: dateNow, reference_type: 'Order', reference_id: refId, account_code: '1004', account_name: 'Inventory Assets', debit: 0, credit: totalCogs, description: \`Inventory cost reduction for Order #\${refId}\`, created_by: 'System' });
          }
          
          store.journal_entries = [...entries, ...(store.journal_entries || [])];
    }
    
    persistStore();
    return delay(full);
  },
  updateOrderWithItems:`;

// We replace exactly the end of createOrderWithItems to avoid multiple matches
const target = `    }
    
    persistStore();
    return delay(full);
  },
  updateOrderWithItems:`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/api/client.js', code);
    console.log('Accounting logic injected.');
} else {
    // try with \r\n
    const targetRN = target.replace(/\n/g, '\r\n');
    if (code.includes(targetRN)) {
        code = code.replace(targetRN, replacement.replace(/\n/g, '\r\n'));
        fs.writeFileSync('src/api/client.js', code);
        console.log('Accounting logic injected (CRLF).');
    } else {
        console.log('Target not found.');
    }
}
