const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  isElectron: true,
  setAppIcon: (dataUrl) => ipcRenderer.send("set-app-icon", dataUrl),

  // Generic CRUD
  list: (table, opts) => ipcRenderer.invoke("db:list", table, opts),
  get: (table, id) => ipcRenderer.invoke("db:get", table, id),
  create: (table, data, meta) => ipcRenderer.invoke("db:create", table, data, meta),
  update: (table, id, data, meta) => ipcRenderer.invoke("db:update", table, id, data, meta),
  remove: (table, id, meta) => ipcRenderer.invoke("db:delete", table, id, meta),

  // Auth
  loginWithPin: (pin) => ipcRenderer.invoke("auth:loginWithPin", pin),
  loginWithPassword: (usernameOrEmail, password) => ipcRenderer.invoke("auth:loginWithPassword", usernameOrEmail, password),
  adminOverride: (ownerPassword) => ipcRenderer.invoke("auth:adminOverride", ownerPassword),
  resetUserPin: (userId, newPin, ownerPassword) => ipcRenderer.invoke("auth:resetPin", userId, newPin, ownerPassword),
  resetUserPassword: (userId, newPassword, ownerPassword) => ipcRenderer.invoke("auth:resetPassword", userId, newPassword, ownerPassword),

  // Permissions
  getPermissions: () => ipcRenderer.invoke("permissions:getAll"),
  savePermissions: (rows, meta) => ipcRenderer.invoke("permissions:save", rows, meta),
  resetDefaultPermissions: (meta) => ipcRenderer.invoke("permissions:resetDefaults", meta),

  // Custom Roles
  listRoles: () => ipcRenderer.invoke("roles:list"),
  createRole: (name, meta) => ipcRenderer.invoke("roles:create", name, meta),
  deleteRole: (name, meta) => ipcRenderer.invoke("roles:delete", name, meta),

  // Settings
  getSetting: (key) => ipcRenderer.invoke("settings:get", key),
  setSetting: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  markAllNotificationsRead: () => ipcRenderer.invoke("notifications:markAllRead"),
  markNotificationRead: (id) => ipcRenderer.invoke("notifications:markRead", id),
  clearNotifications: () => ipcRenderer.invoke("notifications:clear"),

  // Orders
  createOrderWithItems: (order, items, meta) => ipcRenderer.invoke("orders:createWithItems", order, items, meta),
  updateOrderWithItems: (orderId, orderUpdates, items, meta) => ipcRenderer.invoke("orders:createWithItems", { ...orderUpdates, id: orderId }, items, meta),
  updateOrderStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateStatus", id, status, meta),
  updateKitchenStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateKitchenStatus", id, status, meta),

  // Purchases & Payments
  processPurchaseOrder: (po, items, meta) => ipcRenderer.invoke("purchases:processOrder", po, items, meta),
  returnPurchaseOrder: (poId, returnData, meta) => ipcRenderer.invoke("purchases:returnOrder", poId, returnData, meta),
  deletePurchaseOrder: (poId, meta) => ipcRenderer.invoke("purchases:deleteOrder", poId, meta),
  paySupplier: (supplierId, data, meta) => ipcRenderer.invoke("suppliers:paySupplier", supplierId, data, meta),

  // Inventory Custom Actions
  addInventoryTransaction: (tx) => ipcRenderer.invoke("inventory:addTransaction", tx),
  submitPhysicalCount: (count) => ipcRenderer.invoke("inventory:submitPhysicalCount", count),
  addExpiryBatch: (batch) => ipcRenderer.invoke("inventory:addExpiryBatch", batch),

  // Accounting Module
  listAccounts: () => ipcRenderer.invoke("accounts:list"),
  createAccount: (data) => ipcRenderer.invoke("accounts:create", data),
  updateAccount: (id, data) => ipcRenderer.invoke("accounts:update", id, data),
  deleteAccount: (id) => ipcRenderer.invoke("accounts:delete", id),

  postJournal: (entries) => ipcRenderer.invoke("journal:post", entries),
  listJournal: (filters) => ipcRenderer.invoke("journal:list", filters),
  getAccountLedger: (accountCode, startDate, endDate) => ipcRenderer.invoke("journal:getAccountLedger", accountCode, startDate, endDate),

  listBankAccounts: () => ipcRenderer.invoke("bank:list"),
  createBankAccount: (data) => ipcRenderer.invoke("bank:create", data),
  updateBankAccount: (id, data) => ipcRenderer.invoke("bank:update", id, data),
  transferFunds: (data) => ipcRenderer.invoke("bank:transfer", data),

  recordCustomerPayment: (data) => ipcRenderer.invoke("customer:recordPayment", data),

  openShift: (data) => ipcRenderer.invoke("shift:open", data),
  getCurrentShift: (cashierId) => ipcRenderer.invoke("shift:getCurrent", cashierId),
  closeShift: (shiftId, data) => ipcRenderer.invoke("shift:close", shiftId, data),
  listShifts: (filters) => ipcRenderer.invoke("shift:list", filters),

  getProfitLoss: (startDate, endDate) => ipcRenderer.invoke("accounting:profitLoss", startDate, endDate),
  getBalanceSheet: (asOfDate) => ipcRenderer.invoke("accounting:balanceSheet", asOfDate),
  getTrialBalance: (startDate, endDate) => ipcRenderer.invoke("accounting:trialBalance", startDate, endDate),
  getCashFlow: (startDate, endDate) => ipcRenderer.invoke("accounting:cashFlow", startDate, endDate),

  // Sales returns / adjustments
  processReturn: (orderId, payload, meta) => ipcRenderer.invoke("sales:processReturn", orderId, payload, meta),

  // Dashboard
  getDashboardSummary: () => ipcRenderer.invoke("dashboard:summary"),

  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  getDeviceName: () => ipcRenderer.invoke("app:getDeviceName"),
  getPrinters: () => ipcRenderer.invoke("system:getPrinters"),
  clearData: () => ipcRenderer.invoke("system:clearData"),
  exportData: () => ipcRenderer.invoke("system:exportData"),
  importData: (data) => ipcRenderer.invoke("system:importData", data),
});
