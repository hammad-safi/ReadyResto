import { useEffect, useState, useRef } from "react";
import { Download, Upload, Trash2, Printer, Search, Image as ImageIcon, User, Building2, Check, Camera, Sparkles, Phone, Mail, FileText, Globe, UtensilsCrossed } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import ModuleTable from "../components/ui/ModuleTable";

const TABS = ["General", "Visual Themes", "Tax & Charges", "Hardware & Printing", "Alerts", "Data Management", "Audit Log", "Session & Security"];

const PRESET_LOGOS = [
  { name: "Chef Grill", url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%231e293b"/><path d="M50 20c-10 0-18 8-18 18 0 2-3 4-5 4-6 0-11 5-11 11 0 5 4 10 9 11v11h50V64c5-1 9-6 9-11 0-6-5-11-11-11-2 0-5-2-5-4 0-10-8-18-18-18z" fill="%23e11d48"/><rect x="35" y="67" width="30" height="13" rx="3" fill="%23ffffff"/></svg>' },
  { name: "Gold Crown", url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%230f172a"/><path d="M20 70l10-40 20 20 20-20 10 40z" fill="%23f59e0b"/><circle cx="20" cy="26" r="4" fill="%23fbbf24"/><circle cx="50" cy="46" r="4" fill="%23fbbf24"/><circle cx="80" cy="26" r="4" fill="%23fbbf24"/></svg>' },
  { name: "Emerald Bistro", url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23047857"/><path d="M38 25v22c0 5-4 9-9 9v19h-4V56c-5 0-9-4-9-9V25h4v17h3V25h5v17h4V25h6zm37 0c0 10-6 18-12 21v29h-4V25h16z" fill="%23ffffff"/></svg>' },
  { name: "Warm Cafe", url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2378350f"/><path d="M30 35h40v25c0 8-7 15-15 15h-10c-8 0-15-7-15-15V35zm40 5h8c4 0 7 3 7 7s-3 7-7 7h-8V40z" fill="%23fbbf24"/></svg>' }
];

const PRESET_AVATARS = [
  { name: "Executive 1", url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e293b"/><circle cx="50" cy="38" r="18" fill="%23f8fafc"/><path d="M22 82c0-15 13-24 28-24s28 9 28 24z" fill="%23f8fafc"/></svg>' },
  { name: "Executive 2", url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%237c3aed"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 82c0-15 13-24 28-24s28 9 28 24z" fill="%23ffffff"/></svg>' },
  { name: "Executive 3", url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230284c7"/><circle cx="50" cy="38" r="18" fill="%23ffffff"/><path d="M22 82c0-15 13-24 28-24s28 9 28 24z" fill="%23ffffff"/></svg>' }
];

export default function Settings() {
  const { autoLockMinutes, setAutoLockMinutes } = useAuth();
  const { profile: globalProfile, updateProfile: saveGlobalProfile } = useRestaurant();
  const { filters: globalFilters } = useDashboardFilters();
  const [tab, setTab] = useState(TABS[0]);
  const [profile, setProfile] = useState(null);
  const [alertPreferences, setAlertPreferences] = useState(null);
  const [saved, setSaved] = useState(false);
  const [systemPrinters, setSystemPrinters] = useState([]);
  
  const logoInputRef = useRef(null);
  const ownerPhotoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const userPickedTheme = useRef(false); // only true after user explicitly clicks a theme card

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
    if (globalProfile) {
      setProfile({
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
        receiptPrinter: "System Default Dialog",
        kitchenPrinter: "System Default Dialog",
        qrPrinter: "System Default Dialog",
        reportsPrinter: "System Default Dialog",
        ...globalProfile
      });
    }

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
  }, [globalProfile]);

  const update = (key, value) => {
    if (key === "theme") userPickedTheme.current = true;
    setProfile(p => ({ ...p, [key]: value }));
  };
  const updateAlertPref = (key, value) => setAlertPreferences(p => ({ ...p, [key]: value }));

  // Live-preview theme ONLY when the user explicitly clicked a theme card
  useEffect(() => {
    if (!userPickedTheme.current) return;
    if (profile?.theme) {
      const html = document.documentElement;
      html.className = html.className.split(" ").filter(c => !c.startsWith("theme-")).join(" ");
      html.classList.add(`theme-${profile.theme}`);
    }
  }, [profile?.theme]);

  const save = async () => {
    await saveGlobalProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      update("logo", ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleOwnerPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      update("ownerPhoto", ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
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
            if (parsed.store)    localStorage.setItem(STORE_KEY, JSON.stringify(parsed.store));
            if (parsed.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed.settings));
          } else {
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

  const auditColumns = [
    { key: "time", header: "Time", sortKey: "time", render: (r) => <span className="font-mono text-xs text-ink-500 whitespace-nowrap">{r.time}</span> },
    { key: "user", header: "User", sortKey: "user", render: (r) => <span className="font-medium text-ink-900">{r.user}</span> },
    { key: "module", header: "Module", sortKey: "module", render: (r) => <span className="text-xs bg-canvas-100 text-ink-600 px-2 py-0.5 rounded-md font-semibold">{r.module}</span> },
    { key: "action", header: "Action", sortKey: "action", render: (r) => <span className="text-ink-700">{r.action}</span> },
    { key: "ip_device", header: "Device", sortKey: "ip_device", render: (r) => <span className="text-xs text-ink-400 font-mono">{r.ip_device || "—"}</span> }
  ];

  const activeAuditFilterCount = (filterUser !== "All" ? 1 : 0) + (filterModule !== "All" ? 1 : 0) + (filterAction !== "All" ? 1 : 0);

  const clearAuditFilters = () => {
    setFilterUser("All");
    setFilterModule("All");
    setFilterAction("All");
  };

  const auditActionTypes = ["Login", "Created", "Updated", "Deleted", "Applied", "Marked", "Adjusted", "Reset", "Exported"];
  
  const filteredAudit = auditRows.filter((r) => {
    const query = auditSearch.toLowerCase();
    const ms = !auditSearch || 
      (r.action || "").toLowerCase().includes(query) || 
      (r.module || "").toLowerCase().includes(query) || 
      (r.user || "").toLowerCase().includes(query) ||
      (r.ip_device || "").toLowerCase().includes(query) ||
      (r.time || "").toLowerCase().includes(query);
      
    const mu = filterUser === "All" || (r.user || "").toLowerCase() === filterUser.toLowerCase();
    const mm = filterModule === "All" || (r.module || "").toLowerCase() === filterModule.toLowerCase();
    const ma = filterAction === "All" || (r.action || "").toLowerCase().includes(filterAction.toLowerCase());

    return ms && mu && mm && ma;
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

  if (!profile) return <div className="text-sm text-ink-500 py-10 text-center">Loading settings…</div>;

  const receiptToggles = [
    { label: "Show Logo on Receipt", key: "showLogo" },
    { label: "Show Owner Info on Receipt", key: "showOwnerInfo" },
    { label: "Show Tax Breakdown", key: "showTaxBreakdown" },
    { label: "Show Cashier Name", key: "showCashierName" },
    { label: "Show QR Code", key: "showQrCode" }
  ];

  const kitchenToggles = [
    { label: "Auto-Print KOT from POS", key: "autoPrintKOT" }
  ];

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Restaurant Settings" description="Manage logo, owner profile, business info, tax rules, and receipts." />

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              tab === t ? "bg-ink-900 text-canvas-50 border-ink-900 shadow-sm" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft p-6 w-full">
        {tab === "General" && (
          <div className="space-y-8">
            {/* Top Bar Action */}
            <div className="flex items-center justify-between pb-4 border-b border-canvas-200">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink-900">Business & Owner Profile</h3>
                <p className="text-xs text-ink-500">Configure your restaurant logo, branding, owner picture, and receipt headers.</p>
              </div>
              <Button variant="primary" onClick={save} className="flex items-center gap-1.5">
                {saved ? <span className="flex items-center gap-1"><Check size={16} /> Saved!</span> : "Save Changes"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left & Middle Column: Form Inputs & Uploads */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Logo & Branding Upload Section */}
                <div className="p-5 rounded-xl border border-canvas-200 bg-canvas-50/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={18} className="text-paprika-600" />
                    <h4 className="font-display font-semibold text-sm text-ink-900">Restaurant Logo & Slogan</h4>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                    
                    {/* Logo Box */}
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="h-24 w-24 rounded-xl bg-white border-2 border-dashed border-canvas-300 hover:border-paprika-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shrink-0 relative transition-all shadow-sm"
                    >
                      {profile.logo ? (
                        <>
                          <img src={profile.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                          <div className="absolute inset-0 bg-ink-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                            Change
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-ink-400 group-hover:text-paprika-600">
                          <Camera size={22} />
                          <span className="text-[11px] font-medium">Upload Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => logoInputRef.current?.click()} icon={Upload}>
                          Upload Image
                        </Button>
                        {profile.logo && (
                          <Button variant="secondary" size="sm" onClick={() => update("logo", null)} className="text-paprika-600 hover:bg-paprika-50 border-paprika-200" icon={Trash2}>
                            Remove Logo
                          </Button>
                        )}
                      </div>
                      
                      {/* Presets */}
                      <div>
                        <span className="text-[11px] text-ink-500 font-medium block mb-1">Or choose sample logo preset:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_LOGOS.map((p) => (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => update("logo", p.url)}
                              className="px-2 py-1 rounded bg-white border border-canvas-200 text-[11px] text-ink-700 hover:border-paprika-400 hover:bg-paprika-50/50 flex items-center gap-1 transition-colors"
                            >
                              <img src={p.url} alt={p.name} className="h-4 w-4 rounded object-contain" />
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-ink-700">Restaurant Name</label>
                      <input 
                        value={profile.name || ""} 
                        onChange={(e) => update("name", e.target.value)} 
                        placeholder="e.g. Dastarkhwan Restaurant"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-700">Tagline / Slogan</label>
                      <input 
                        value={profile.tagline || ""} 
                        onChange={(e) => update("tagline", e.target.value)} 
                        placeholder="e.g. Authentic Taste & Hospitality"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 bg-white" 
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Owner Profile & Photo Section */}
                <div className="p-5 rounded-xl border border-canvas-200 bg-canvas-50/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-purple-600" />
                    <h4 className="font-display font-semibold text-sm text-ink-900">Owner Profile & Contact</h4>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input type="file" accept="image/*" className="hidden" ref={ownerPhotoInputRef} onChange={handleOwnerPhotoUpload} />

                    {/* Owner Photo Circle */}
                    <div 
                      onClick={() => ownerPhotoInputRef.current?.click()}
                      className="h-24 w-24 rounded-full bg-white border-2 border-dashed border-canvas-300 hover:border-purple-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shrink-0 relative transition-all shadow-sm"
                    >
                      {profile.ownerPhoto ? (
                        <>
                          <img src={profile.ownerPhoto} alt="Owner" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-ink-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                            Change
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-ink-400 group-hover:text-purple-600">
                          <Camera size={22} />
                          <span className="text-[10px] font-medium">Owner Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => ownerPhotoInputRef.current?.click()} icon={Upload}>
                          Upload Photo
                        </Button>
                        {profile.ownerPhoto && (
                          <Button variant="secondary" size="sm" onClick={() => update("ownerPhoto", null)} className="text-paprika-600 hover:bg-paprika-50 border-paprika-200" icon={Trash2}>
                            Remove Photo
                          </Button>
                        )}
                      </div>

                      {/* Avatar Presets */}
                      <div>
                        <span className="text-[11px] text-ink-500 font-medium block mb-1">Or select avatar preset:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_AVATARS.map((a) => (
                            <button
                              key={a.name}
                              type="button"
                              onClick={() => update("ownerPhoto", a.url)}
                              className="px-2 py-1 rounded bg-white border border-canvas-200 text-[11px] text-ink-700 hover:border-purple-400 hover:bg-purple-50/50 flex items-center gap-1 transition-colors"
                            >
                              <img src={a.url} alt={a.name} className="h-4 w-4 rounded-full object-cover" />
                              {a.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-ink-700">Owner Full Name</label>
                      <input 
                        value={profile.ownerName || ""} 
                        onChange={(e) => update("ownerName", e.target.value)} 
                        placeholder="e.g. Hammadullah"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-700">Title / Designation</label>
                      <input 
                        value={profile.ownerTitle || ""} 
                        onChange={(e) => update("ownerTitle", e.target.value)} 
                        placeholder="e.g. Founder & Managing Director"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-700">Owner Phone Number</label>
                      <input 
                        value={profile.ownerPhone || ""} 
                        onChange={(e) => update("ownerPhone", e.target.value)} 
                        placeholder="e.g. 0300-0000001"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-700">Owner Email</label>
                      <input 
                        value={profile.ownerEmail || ""} 
                        onChange={(e) => update("ownerEmail", e.target.value)} 
                        placeholder="e.g. owner@dastarkhwan.pk"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 bg-white" 
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Address & Business Details */}
                <div className="p-5 rounded-xl border border-canvas-200 bg-canvas-50/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-blue-600" />
                    <h4 className="font-display font-semibold text-sm text-ink-900">Address & Tax Identifiers</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-ink-700">Business Address</label>
                      <textarea 
                        rows={2} 
                        value={profile.address || ""} 
                        onChange={(e) => update("address", e.target.value)} 
                        placeholder="Full street address..."
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-700">Landline / Outlet Phone</label>
                      <input 
                        value={profile.phone || ""} 
                        onChange={(e) => update("phone", e.target.value)} 
                        placeholder="e.g. 091-1234567"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-700">NTN / Registration No.</label>
                      <input 
                        value={profile.ntn || ""} 
                        onChange={(e) => update("ntn", e.target.value)} 
                        placeholder="e.g. 1234567-8"
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-700">Currency Symbol</label>
                      <select 
                        value={profile.currency || "PKR"} 
                        onChange={(e) => update("currency", e.target.value)} 
                        className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                      >
                        <option value="PKR">PKR — Pakistani Rupee</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="AED">AED — UAE Dirham</option>
                        <option value="SAR">SAR — Saudi Riyal</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="GBP">GBP — British Pound</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Thermal Receipt Preview */}
              <div className="space-y-4">
                <div className="sticky top-20 rounded-xl border border-canvas-200 bg-canvas-50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-semibold text-sm text-ink-900 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-500" /> Live Receipt Preview
                    </h4>
                    <span className="text-[10px] bg-canvas-200 font-mono text-ink-600 px-2 py-0.5 rounded">80mm POS</span>
                  </div>

                  {/* Formatting Toggles */}
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-canvas-200 text-xs">
                    <p className="font-medium text-ink-800 mb-1">Receipt Display Options</p>
                    {receiptToggles.map((f) => (
                      <div key={f.key} className="flex items-center justify-between">
                        <span className="text-ink-600">{f.label}</span>
                        <input 
                          type="checkbox" 
                          checked={profile[f.key] ?? true} 
                          onChange={(e) => update(f.key, e.target.checked)} 
                          className="h-3.5 w-3.5 accent-paprika-500 cursor-pointer" 
                        />
                      </div>
                    ))}
                    <div className="pt-2 border-t border-canvas-100">
                      <label className="text-[11px] font-medium text-ink-600 block mb-1">Receipt Footer Message</label>
                      <input 
                        value={profile.receiptFooter || ""} 
                        onChange={(e) => update("receiptFooter", e.target.value)} 
                        className="w-full border border-canvas-200 rounded px-2 py-1 text-[11px] outline-none"
                      />
                    </div>
                  </div>

                  {/* <div className="space-y-2 bg-white p-3 rounded-lg border border-canvas-200 text-xs">
                    <p className="font-medium text-ink-800 mb-1">Kitchen Printing</p>
                    {kitchenToggles.map((f) => (
                      <div key={f.key} className="flex items-center justify-between">
                        <span className="text-ink-600">{f.label}</span>
                        <input 
                          type="checkbox" 
                          checked={profile[f.key] ?? false} 
                          onChange={(e) => update(f.key, e.target.checked)} 
                          className="h-3.5 w-3.5 accent-primary-500 cursor-pointer" 
                        />
                      </div>
                    ))}
                  </div> */}

                  {/* Simulated Receipt Box */}
                  <div className="bg-white border border-canvas-300 rounded-lg p-4 shadow-sm font-mono text-[11px] leading-relaxed text-ink-900">
                    <div className="text-center mb-3">
                      {profile.showLogo !== false && (
                        profile.logo ? (
                          <img src={profile.logo} alt="logo" className="h-10 mx-auto mb-1.5 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-paprika-500 text-white flex items-center justify-center font-display font-bold text-sm mx-auto mb-1.5">
                            {(profile.name || "R")[0]}
                          </div>
                        )
                      )}
                      <p className="font-display font-bold text-xs text-ink-900">{profile.name || "Restaurant Name"}</p>
                      {profile.tagline && <p className="text-[9px] text-ink-500 italic mb-0.5">{profile.tagline}</p>}
                      {profile.address && <p className="text-[10px] text-ink-500">{profile.address}</p>}
                      {profile.phone && <p className="text-[10px] text-ink-500">Ph: {profile.phone}</p>}
                      {profile.ntn && <p className="text-[9px] text-ink-400">NTN: {profile.ntn}</p>}
                      {profile.showOwnerInfo && profile.ownerName && (
                        <p className="text-[9px] text-ink-500 mt-1 pt-0.5 border-t border-dotted border-ink-200">
                          Proprietor: {profile.ownerName}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-dashed border-ink-300 my-1.5" />
                    <div className="flex justify-between text-[10px] text-ink-600"><span>ORD-894201</span><span>12:45 PM</span></div>
                    <div className="flex justify-between text-[10px] text-ink-600"><span>Dine-In · Table 04</span><span>{profile.showCashierName !== false ? "Cashier: Bilal" : ""}</span></div>

                    <div className="border-t border-dashed border-ink-300 my-1.5" />
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>2 × Chicken Karahi</span><span>Rs. 2,400</span></div>
                      <div className="flex justify-between"><span>4 × Naan</span><span>Rs. 160</span></div>
                    </div>

                    <div className="border-t border-dashed border-ink-300 my-1.5" />
                    <div className="flex justify-between font-bold text-xs"><span>TOTAL</span><span>Rs. 2,560</span></div>

                    <div className="border-t border-dashed border-ink-300 my-2" />
                    <p className="text-center text-[10px] text-ink-500">{profile.receiptFooter || "Thank you for dining with us!"}</p>
                  </div>

                  <Button variant="primary" className="w-full" onClick={save}>
                    {saved ? "Saved ✓" : "Save Changes"}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}

        {tab === "Visual Themes" && (
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-canvas-200 pb-4">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink-900">Visual Themes</h3>
                <p className="text-xs text-ink-500">Select a theme to change the appearance of the application. Both light and dark modes are supported.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: "sunset-paprika", name: "Sunset Paprika", desc: "Warm orange primary, light grey background", mode: "Light Mode", accent: "#C1440E", canvas: "#F5F6F7", ink: "#1B1E23" },
                { id: "emerald-basil", name: "Emerald Basil", desc: "Fresh organic green, light background", mode: "Light Mode", accent: "#4C7A51", canvas: "#F5F6F7", ink: "#1B1E23" },
                { id: "royal-saffron", name: "Royal Saffron", desc: "Premium golden saffron, light background", mode: "Light Mode", accent: "#C98A05", canvas: "#F5F6F7", ink: "#1B1E23" },
                { id: "ocean-wave", name: "Ocean Wave", desc: "Cool modern blue, light background", mode: "Light Mode", accent: "#256DB2", canvas: "#F5F6F7", ink: "#1B1E23" },
                { id: "rose-berry", name: "Rose Berry", desc: "Elegant dessert rose pink, light background", mode: "Light Mode", accent: "#C72C4C", canvas: "#F5F6F7", ink: "#1B1E23" },
                { id: "dark-charcoal", name: "Dark Charcoal", desc: "Sleek slate dark theme with neon orange", mode: "Dark Mode", accent: "#F26B27", canvas: "#121214", ink: "#F3F4F6", isDark: true },
                { id: "midnight-indigo", name: "Midnight Indigo", desc: "Deep dark indigo night-time theme", mode: "Dark Mode", accent: "#6366F1", canvas: "#0B0B14", ink: "#F3F4F6", isDark: true },
                { id: "nordic-slate", name: "Nordic Slate", desc: "Clean grey minimalist silver theme", mode: "Light Mode", accent: "#54626F", canvas: "#F8F9FA", ink: "#212327" },
              ].map((t) => {
                const isActive = (profile.theme || "sunset-paprika") === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => update("theme", t.id)}
                    style={{ backgroundColor: t.canvas, borderColor: isActive ? t.ink : 'transparent' }}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all group ${
                      isActive
                        ? "shadow-lg ring-2 ring-offset-2 ring-ink-900 dark:ring-ink-100"
                        : "border-canvas-300 hover:shadow-md hover:scale-[1.02]"
                    }`}
                  >
                    {/* Color Preview Dots */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: t.accent }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: t.canvas }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: t.ink }} />
                    </div>
                    
                    <div className="flex justify-between items-center w-full mb-1">
                      <h4 className="font-semibold text-sm transition-colors" style={{ color: t.ink }}>
                        {t.name}
                      </h4>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5" style={{ backgroundColor: t.ink, color: t.canvas }}>
                          <Check size={10} strokeWidth={3} /> Active
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs line-clamp-2 leading-relaxed flex-grow opacity-80" style={{ color: t.ink }}>
                      {t.desc}
                    </p>
                    
                    <div className="mt-3 pt-2.5 border-t w-full flex items-center justify-between text-[10px]" style={{ borderColor: `${t.ink}20` }}>
                      <span className="px-2 py-0.5 rounded font-medium" style={{ backgroundColor: `${t.ink}15`, color: t.ink }}>
                        {t.mode}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-canvas-200 pt-4">
              <Button variant="primary" onClick={save}>
                {saved ? "Theme Saved ✓" : "Apply & Save Theme"}
              </Button>
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

            <div className="mt-4">
              <Button variant="primary" onClick={save}>{saved ? "Saved ✓" : "Save Changes"}</Button>
            </div>
          </div>
        )}

        {tab === "Alerts" && alertPreferences && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-display font-semibold text-lg text-ink-900">Alert Settings</h3>
              <p className="text-xs text-ink-500">Enable or disable system notifications and set thresholds.</p>
            </div>

            <div className="space-y-4">
              {[
                { key: "low_stock", label: "Low Stock Alerts", desc: "Notify when ingredient quantities fall below the trigger threshold." },
                { key: "expiry", label: "Expiring Items", desc: "Warn when stock batches are near or past their expiration date." },
                { key: "payment", label: "Pending Supplier Payments", desc: "Alert when due balances for suppliers exceed Rs. 15,000." },
                { key: "printer", label: "Printer Status Alerts", desc: "Notify if POS or Kitchen printer connections go offline." },
              ].map((t) => (
                <div key={t.key} className="flex items-start justify-between p-4 rounded-xl border transition-colors hover:brightness-95" style={{ backgroundColor: "rgb(var(--surface-table-header))", borderColor: "rgb(var(--border-default))" }}>
                  <div className="space-y-0.5 max-w-[85%]">
                    <span className="text-sm font-semibold text-ink-800">{t.label}</span>
                    <p className="text-xs text-ink-500">{t.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input 
                      type="checkbox" 
                      checked={alertPreferences[t.key] ?? false} 
                      onChange={(e) => updateAlertPref(t.key, e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-paprika-600" style={{ backgroundColor: "rgb(var(--border-default))", borderColor: "rgb(var(--border-default))" }}></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: "rgb(var(--surface-table-header))", borderColor: "rgb(var(--border-default))" }}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-600">Low Stock Trigger Threshold</label>
                <span className="text-xs font-mono font-bold text-paprika-500 px-2 py-0.5 rounded border" style={{ backgroundColor: "rgb(var(--surface-page))", borderColor: "rgb(var(--border-default))" }}>{alertPreferences.threshold} items</span>
              </div>
              <p className="text-xs text-ink-500">Alerts will be raised for any ingredient whose current stock is less than this value.</p>
              <input 
                type="range" 
                min="1" max="100" 
                value={alertPreferences.threshold || 20}
                onChange={(e) => updateAlertPref("threshold", Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-paprika-600"
                style={{ backgroundColor: "rgb(var(--border-default))" }}
              />
            </div>

            <div className="pt-2">
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
              
              <button onClick={handleExport} className="flex flex-col items-center justify-center p-6 border rounded-xl hover:opacity-80 transition-opacity" style={{ borderColor: "rgb(var(--border-default))" }}>
                <Download className="text-ink-500 mb-3" size={20} />
                <span className="text-sm font-medium" style={{ color: "rgb(var(--text-base))" }}>Export All Data</span>
              </button>
              
              <button onClick={handleImportClick} className="flex flex-col items-center justify-center p-6 border rounded-xl hover:opacity-80 transition-opacity" style={{ borderColor: "rgb(var(--border-default))" }}>
                <Upload className="text-ink-500 mb-3" size={20} />
                <span className="text-sm font-medium" style={{ color: "rgb(var(--text-base))" }}>Import JSON Backup</span>
              </button>

              <button onClick={handleClearData} className="flex flex-col items-center justify-center p-6 border rounded-xl hover:opacity-80 transition-opacity group" style={{ backgroundColor: "rgb(239 68 68 / 0.05)", borderColor: "rgb(239 68 68 / 0.2)" }}>
                <Trash2 className="mb-3 group-hover:scale-110 transition-transform" size={20} style={{ color: "rgb(239 68 68)" }} />
                <span className="text-sm font-medium" style={{ color: "rgb(239 68 68)" }}>Clear All Data</span>
              </button>
              
            </div>
          </div>
        )}

        {tab === "Audit Log" && (
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-canvas-200 pb-4">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink-900">System Audit Log</h3>
                <p className="text-xs text-ink-500">Track all operations, actions, logins, and system changes.</p>
              </div>
            </div>

            <ModuleTable
              columns={auditColumns}
              data={filteredAudit}
              emptyLabel="No audit log entries found."
              storageKey="audit_log_visible_cols"
              searchPlaceholder="Search actions, modules, users, devices..."
              searchValue={auditSearch}
              onSearchChange={setAuditSearch}
              actions={
                <Button variant="secondary" size="sm" onClick={exportAuditCSV} className="flex items-center gap-1.5">
                  <Download size={14} /> Export Log
                </Button>
              }
              filterContent={
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider block mb-1">User</label>
                    <select 
                      value={filterUser} 
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="w-full border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                    >
                      <option value="All">All Users</option>
                      {auditUsers.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider block mb-1">Module</label>
                    <select 
                      value={filterModule} 
                      onChange={(e) => setFilterModule(e.target.value)}
                      className="w-full border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                    >
                      <option value="All">All Modules</option>
                      {auditModules.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider block mb-1">Action Type</label>
                    <select 
                      value={filterAction} 
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="w-full border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                    >
                      <option value="All">All Action Types</option>
                      {auditActionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              }
              activeFilterCount={activeAuditFilterCount}
              onClearFilters={clearAuditFilters}
            />
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
            <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: "rgb(245 158 11 / 0.05)", borderColor: "rgb(245 158 11 / 0.2)" }}>
              <p className="text-xs font-medium" style={{ color: "rgb(245 158 11)" }}>Security Recommendation</p>
              <p className="text-[11px] mt-1" style={{ color: "rgb(245 158 11 / 0.8)" }}>For shared terminals like the POS or Kitchen Display, setting a short auto-lock (e.g., 2 minutes) prevents unauthorized actions when staff step away.</p>
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
