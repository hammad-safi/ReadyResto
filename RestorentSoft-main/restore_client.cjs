const fs = require('fs');

const missingCode = `
  addInventoryTransaction: (tx) => {
    store.inventory_transactions = [ { id: nextId(), date: new Date().toISOString(), ...tx }, ...(store.inventory_transactions || []) ];
    persistStore();
    return delay(tx);
  },
  submitPhysicalCount: (data) => delay({ success: true }),
  addExpiryBatch: (data) => delay({ success: true }),
  
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
`;

let code = fs.readFileSync('src/api/client.js', 'utf8');

// Also fix the accounting logic in createOrderWithItems using EXACT line replacement
// It should be around line 550, we can replace everything between 'if (['paid', 'completed', 'served'].includes(full.status)) {' and 'store.journal_entries = [...entries, ...(store.journal_entries || [])];'
// But wait, the missingCode insertion is simpler. Let's insert it before getDashboardSummary:

if (!code.includes('getCurrentShift:')) {
    code = code.replace('  getDashboardSummary:', missingCode + '\n  getDashboardSummary:');
    fs.writeFileSync('src/api/client.js', code);
    console.log('client.js restored missing functions');
} else {
    console.log('Functions already exist');
}
