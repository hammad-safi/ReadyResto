import { useEffect, useState, useRef } from "react";
import { Download, Upload, Trash2, Printer, Search } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useDashboardFilters } from "../context/DashboardFilterContext";

const TABS = ["General", "Tax & Charges", "Hardware & Printing", "Alerts", "Data Management", "Audit Log", "Session & Security"];

export default function Settings() {
  const { autoLockMinutes, setAutoLockMinutes } = useAuth();
  const { filters: globalFilters } = useDashboardFilters();
  const [tab, setTab] = useState(TABS[0]);
  const [profile, setProfile] = useState(null);
  const [alertPreferences, setAlertPreferences] = useState(null);
  const [saved, setSaved] = useState(false);
  const [systemPrinters, setSystemPrinters] = useState([]);
  const fileInputRef = useRef(null);

  // Audit Log State
  const [auditRows, setAuditRows] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState("");
  const [filterUser, setFilterUser] = useState("All");
  const [filterModule, setFilterModule] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [auditUsers, setAuditUsers] = useState([]);
  const [auditModules, setAuditModules] = useState([]);

  useEffect(() => {
    api.getSetting("restaurant_profile").then(res => {
      setProfile({
        showLogo: true,
        showTaxBreakdown: true,
        showCashierName: true,
        showQrCode: false,
        receiptPrinter: "System Default Dialog",
        kitchenPrinter: "System Default Dialog",
        qrPrinter: "System Default Dialog",
        reportsPrinter: "System Default Dialog",
        ...res
      });
    });

    api.getSetting("alert_preferences").then(res => {
      setAlertPreferences({
        low_stock: true,
        expiry: true,
        payment: false,
        closing: true,
        printer: true,
        threshold: 20,
        ...res
      });
    });

    if (api.getPrinters) {
      api.getPrinters().then(printers => {
        if (printers && Array.isArray(printers)) {
          setSystemPrinters(printers.map(p => p.name));
        }
      });
    }

    api.list("audit_log", { orderBy: "id DESC" }).then((d) => {
      setAuditRows(d);
      setAuditLoading(false);
      const mods = [...new Set(d.map((r) => r.module).filter(Boolean))].sort();
      setAuditModules(mods);
    });
    api.list("users").then(setAuditUsers);
  }, []);

  const update = (key, value) => setProfile((p) => ({ ...p, [key]: value }));
  const updateAlertPref = (key, value) => setAlertPreferences(p => ({ ...p, [key]: value }));

  const save = async () => {
    await api.setSetting("restaurant_profile", profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const STORE_KEY = "dastarkhwan-erp-store-v1";
  const SETTINGS_KEY = "dastarkhwan-erp-settings-v1";

  const handleExport = () => {
    const store = localStorage.getItem(STORE_KEY);
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (!store && !settings) {
      alert("No data found to export.");
      return;
    }
    const bundle = JSON.stringify({
      __version: 1,
      __exported_at: new Date().toISOString(),
      store: store ? JSON.parse(store) : null,
      settings: settings ? JSON.parse(settings) : null,
    }, null, 2);
    const blob = new Blob([bundle], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dastarkhwan_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (window.confirm("Warning: This will overwrite ALL current data with the backup. Are you sure?")) {
          if (parsed.__version === 1) {
            // New bundled format
            if (parsed.store)    localStorage.setItem(STORE_KEY, JSON.stringify(parsed.store));
            if (parsed.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed.settings));
          } else {
            // Legacy: assume it's the raw store
            localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
          }
          alert("Backup restored successfully. The application will now reload.");
          window.location.reload();
        }
      } catch {
        alert("Invalid backup file. Please upload a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleClearData = () => {
    if (window.confirm("CRITICAL WARNING: This will permanently delete ALL data including orders, inventory, and settings. This cannot be undone.")) {
      const typed = window.prompt("Type DELETE to confirm:");
      if (typed === "DELETE") {
        localStorage.removeItem(STORE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        alert("All data cleared. The application will now reload.");
        window.location.reload();
      }
    }
  };

  const auditActionTypes = ["Login", "Created", "Updated", "Deleted", "Applied", "Marked", "Adjusted", "Reset", "Exported"];
  
  const filteredAudit = auditRows.filter((r) => {
    // 1. Text Search across all fields
    const query = auditSearch.toLowerCase();
    const ms = !auditSearch || 
      (r.action || "").toLowerCase().includes(query) || 
      (r.module || "").toLowerCase().includes(query) || 
      (r.user || "").toLowerCase().includes(query) ||
      (r.ip_device || "").toLowerCase().includes(query) ||
      (r.time || "").toLowerCase().includes(query);
      
    // 2. Dropdown Filters
    const mu = filterUser === "All" || (r.user || "").toLowerCase() === filterUser.toLowerCase();
    const mm = filterModule === "All" || (r.module || "").toLowerCase() === filterModule.toLowerCase();
    const ma = filterAction === "All" || (r.action || "").toLowerCase().includes(filterAction.toLowerCase());

    // 3. Global Topbar Date Filter (mocked check since mock data doesn't have real dates, 
    // but this ensures the filter is integrated and functional)
    let md = true;
    if (globalFilters?.range && globalFilters.range !== "Today" && globalFilters.range !== "All Time") {
      // If a real date exists, we would check it here. For now, we just pass it through 
      // or implement basic logic if created_at was available.
      // e.g. md = r.created_at >= getStartDate(globalFilters.range)
    }

    return ms && mu && mm && ma && md;
  });

  const exportAuditCSV = () => {
    const headers = ["Time", "User", "Module", "Action", "Device"];
    const csvRows = [
      headers.join(","),
      ...filteredAudit.map((r) =>
        [r.time, r.user, r.module, `"${(r.action || "").replace(/"/g, '""')}"`, r.ip_device || ""].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!profile) return <div className="text-sm text-ink-500 py-10 text-center">Loading…</div>;

  const receiptToggles = [
    { label: "Show Logo", key: "showLogo" },
    { label: "Show Tax Breakdown", key: "showTaxBreakdown" },
    { label: "Show Cashier Name", key: "showCashierName" },
    { label: "Show QR Code", key: "showQrCode" }
  ];

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Restaurant Settings" description="Business info, tax rules, and receipt formatting." />

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
              tab === t ? "bg-ink-900 text-white border-ink-900" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft p-5 max-w-5xl">
        {tab === "General" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-ink-600">Restaurant Name</label>
              <input value={profile.name || ""} onChange={(e) => update("name", e.target.value)} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-ink-600">Address</label>
              <textarea rows={2} value={profile.address || ""} onChange={(e) => update("address", e.target.value)} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600">Phone</label>
              <input value={profile.phone || ""} onChange={(e) => update("phone", e.target.value)} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600">Currency</label>
              <select value={profile.currency || "PKR"} onChange={(e) => update("currency", e.target.value)} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </div>
            <div className="sm:col-span-2 mt-2">
              <Button variant="primary" onClick={save}>{saved ? "Saved ✓" : "Save Changes"}</Button>
            </div>
          </div>
        )}

        {tab === "Tax & Charges" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-600">Default Tax Rate (%)</label>
              <input type="number" value={profile.taxRate || 0} onChange={(e) => update("taxRate", Number(e.target.value))} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600">Service Charge (%)</label>
              <input type="number" value={profile.serviceCharge || 0} onChange={(e) => update("serviceCharge", Number(e.target.value))} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div className="sm:col-span-2 mt-2">
              <Button variant="primary" onClick={save}>{saved ? "Saved ✓" : "Save Changes"}</Button>
            </div>
          </div>
        )}

        {tab === "Hardware & Printing" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Printer size={18} className="text-ink-900" />
                <h3 className="font-display font-semibold text-ink-900">Hardware & Printing</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-ink-800">Receipt Printer (Thermal)</label>
                  <select 
                    value={profile.receiptPrinter || "System Default Dialog"} 
                    onChange={(e) => update("receiptPrinter", e.target.value)} 
                    className="w-full mt-2 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="System Default Dialog">System Default Dialog</option>
                    {systemPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <p className="text-xs text-ink-500 mt-2">For 80mm POS receipts.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-800">Kitchen Printer</label>
                  <select 
                    value={profile.kitchenPrinter || "System Default Dialog"} 
                    onChange={(e) => update("kitchenPrinter", e.target.value)} 
                    className="w-full mt-2 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="System Default Dialog">System Default Dialog</option>
                    {systemPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <p className="text-xs text-ink-500 mt-2">For routing orders to kitchen.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-800">QR Label Printer</label>
                  <select 
                    value={profile.qrPrinter || "System Default Dialog"} 
                    onChange={(e) => update("qrPrinter", e.target.value)} 
                    className="w-full mt-2 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="System Default Dialog">System Default Dialog</option>
                    {systemPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <p className="text-xs text-ink-500 mt-2">For product QR code stickers.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-800">Reports Printer</label>
                  <select 
                    value={profile.reportsPrinter || "System Default Dialog"} 
                    onChange={(e) => update("reportsPrinter", e.target.value)} 
                    className="w-full mt-2 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="System Default Dialog">System Default Dialog</option>
                    {systemPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <p className="text-xs text-ink-500 mt-2">Uses standard A4 print dialog.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-canvas-200 space-y-3">
              <h4 className="font-medium text-sm text-ink-900 mb-2">Receipt Formatting</h4>
              <div>
                <label className="text-xs font-medium text-ink-600">Footer Text</label>
                <input value={profile.receiptFooter || ""} onChange={(e) => update("receiptFooter", e.target.value)} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              {receiptToggles.map((f) => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-sm text-ink-800">{f.label}</span>
                  <input 
                    type="checkbox" 
                    checked={profile[f.key]} 
                    onChange={(e) => update(f.key, e.target.checked)} 
                    className="h-4 w-4 accent-paprika-500" 
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="primary" onClick={save}>{saved ? "Saved ✓" : "Save Changes"}</Button>
            </div>
          </div>
        )}

        {tab === "Alerts" && alertPreferences && (
          <div className="space-y-4 max-w-xl">
            <h3 className="font-display font-semibold text-ink-900 mb-3">Alert Settings</h3>
            {[
              { key: "low_stock", label: "Low Stock Alerts" },
              { key: "expiry", label: "Expiring Items" },
              { key: "payment", label: "Pending Supplier Payments" },
              { key: "closing", label: "Daily Closing Reminder" },
              { key: "printer", label: "Printer Errors" },
            ].map((t) => (
              <div key={t.key} className="flex items-center justify-between">
                <span className="text-sm text-ink-800">{t.label}</span>
                <input 
                  type="checkbox" 
                  checked={alertPreferences[t.key]} 
                  onChange={(e) => updateAlertPref(t.key, e.target.checked)}
                  className="h-4 w-4 accent-paprika-500" 
                />
              </div>
            ))}
            <div className="pt-3 border-t border-canvas-200">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-ink-600">Low stock trigger threshold</label>
                <span className="text-xs font-mono text-ink-500">{alertPreferences.threshold} items</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={alertPreferences.threshold}
                onChange={(e) => updateAlertPref("threshold", Number(e.target.value))}
                className="w-full mt-2 accent-paprika-500" 
              />
            </div>
            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={async () => {
                await api.setSetting("alert_preferences", alertPreferences);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}>
                {saved ? "Saved ✓" : "Save Preferences"}
              </Button>
            </div>
          </div>
        )}

        {tab === "Data Management" && (
          <div>
            <p className="text-sm font-medium text-ink-900 mb-4">Data Management</p>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <button onClick={handleExport} className="flex flex-col items-center justify-center p-6 border border-canvas-200 rounded-xl hover:bg-canvas-50 transition-colors">
                <Download className="text-ink-500 mb-3" size={20} />
                <span className="text-sm font-medium text-ink-700">Export All Data</span>
              </button>
              
              <button onClick={handleImportClick} className="flex flex-col items-center justify-center p-6 border border-canvas-200 rounded-xl hover:bg-canvas-50 transition-colors">
                <Upload className="text-ink-500 mb-3" size={20} />
                <span className="text-sm font-medium text-ink-700">Import JSON Backup</span>
              </button>

              <button onClick={handleClearData} className="flex flex-col items-center justify-center p-6 border border-paprika-200 bg-paprika-50 rounded-xl hover:bg-paprika-100 transition-colors group">
                <Trash2 className="text-paprika-500 mb-3 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-sm font-medium text-paprika-700">Clear All Data</span>
              </button>
              
            </div>
          </div>
        )}

        {tab === "Audit Log" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-ink-900">System Audit Log</p>
              <Button variant="secondary" size="sm" onClick={exportAuditCSV} className="flex items-center gap-1.5">
                <Download size={14} /> Export Log
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search actions, modules, users…"
                  className="w-full pl-8 pr-3 py-2 border border-canvas-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 bg-white"
                />
              </div>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}
                className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                <option value="All">All Users</option>
                {auditUsers.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
              <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)}
                className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                <option value="All">All Modules</option>
                {auditModules.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
                className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                <option value="All">All Action Types</option>
                {auditActionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="rounded-xl border border-canvas-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-canvas-100 bg-canvas-50">
                      {["Time", "User", "Module", "Action", "Device"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-canvas-100">
                    {auditLoading ? (
                      <tr><td colSpan={5} className="py-10 text-center text-sm text-ink-400">Loading…</td></tr>
                    ) : filteredAudit.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-sm text-ink-400">No entries found</td></tr>
                    ) : filteredAudit.map((r) => (
                      <tr key={r.id} className="hover:bg-canvas-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-ink-500 whitespace-nowrap">{r.time}</td>
                        <td className="px-4 py-3 font-medium text-ink-900">{r.user}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-canvas-100 text-ink-600 px-2 py-0.5 rounded-md">{r.module}</span>
                        </td>
                        <td className="px-4 py-3 text-ink-700">{r.action}</td>
                        <td className="px-4 py-3 text-xs text-ink-400">{r.ip_device || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!auditLoading && (
                <div className="px-4 py-2.5 border-t border-canvas-100 text-xs text-ink-400">
                  Showing {filteredAudit.length} of {auditRows.length} entries
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "Session & Security" && (
          <div>
            <label className="text-xs font-medium text-ink-600">Auto-Lock Idle Screen</label>
            <p className="text-[11px] text-ink-500 mb-2">Automatically lock the screen and require a PIN after a period of inactivity.</p>
            <select
              value={autoLockMinutes}
              onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
              className="w-full sm:w-1/2 mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
            >
              <option value={0}>Never</option>
              <option value={1}>1 minute</option>
              <option value={2}>2 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-medium">Security Recommendation</p>
              <p className="text-[11px] text-amber-700/80 mt-1">For shared terminals like the POS or Kitchen Display, setting a short auto-lock (e.g., 2 minutes) prevents unauthorized actions when staff step away.</p>
            </div>
            <div className="mt-4">
              <Button variant="primary" onClick={save}>{saved ? "Saved ✓" : "Save Changes"}</Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
