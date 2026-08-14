const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  isElectron: true,

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

  // Orders
  createOrderWithItems: (order, items, meta) => ipcRenderer.invoke("orders:createWithItems", order, items, meta),
  updateOrderStatus: (id, status, meta) => ipcRenderer.invoke("orders:updateStatus", id, status, meta),

  // Sales returns / adjustments
  processReturn: (orderId, payload, meta) => ipcRenderer.invoke("sales:processReturn", orderId, payload, meta),

  // Dashboard
  getDashboardSummary: () => ipcRenderer.invoke("dashboard:summary"),

  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  getDeviceName: () => ipcRenderer.invoke("app:getDeviceName"),
  getPrinters: () => ipcRenderer.invoke("system:getPrinters"),
});
