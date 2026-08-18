import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { useDialog } from "../context/DialogContext";
import api from "../api/client";
import { useDataCache } from "../context/DataCacheContext";
import Button from "../components/ui/Button";
import { 
  Bell, Trash2, CheckCheck, Layers, Calendar, CreditCard, 
  Settings, Sparkles, Sliders, BellOff
} from "lucide-react";

export default function Notifications() {
  const { getData, invalidate } = useDataCache();
  const { confirm } = useDialog();
  const [rows, setRows] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [saved, setSaved] = useState(false);

  const loadNotifications = () => {
    getData("notifications", { orderBy: "id DESC" }).then(setRows);
  };

  useEffect(() => {
    loadNotifications();
    
    api.getSetting("alert_preferences").then(res => {
      setPreferences({
        low_stock: true,
        expiry: true,
        payment: false,
        closing: true,
        printer: true,
        threshold: 20,
        ...res
      });
    });

    const interval = setInterval(() => {
      invalidate("notifications");
      loadNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const updatePreference = (key, value) => {
    setPreferences(p => ({ ...p, [key]: value }));
  };

  const savePreferences = async () => {
    await api.setSetting("alert_preferences", preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    invalidate("notifications");
    loadNotifications(); // Reload to apply any new alert triggers immediately
  };

  const handleMarkAllRead = async () => {
    if (api.markAllNotificationsRead) {
      await api.markAllNotificationsRead();
      invalidate("notifications");
      loadNotifications();
    }
  };

  const handleMarkRead = async (id) => {
    if (api.markNotificationRead) {
      await api.markNotificationRead(id);
      invalidate("notifications");
      loadNotifications();
    }
  };

  const handleClearAll = async () => {
    if (await confirm("Are you sure you want to clear all notifications? This cannot be undone.")) {
      if (api.clearNotifications) {
        await api.clearNotifications();
        invalidate("notifications");
        setRows([]);
      }
    }
  };

  const unreadCount = rows.filter(n => !n.read).length;

  return (
    <div>
      <PageHeader 
        eyebrow="System Alerts" 
        title="Notifications" 
        description="Monitor system alerts, logs, and configure trigger preferences." 
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleMarkAllRead} 
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5"
            >
              <CheckCheck size={14} /> Mark All Read
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={handleClearAll} 
              disabled={rows.length === 0}
              className="flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Clear All
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        
        {/* Left Column: Recent Alerts List */}
        <div className="bg-white rounded-2xl border border-canvas-200 shadow-soft overflow-hidden">
          <div className="border-b border-canvas-100 bg-canvas-50/50 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="text-ink-600" size={16} />
              <span className="font-display font-semibold text-ink-900 text-sm">Recent Activity Log</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-paprika-100 text-paprika-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {unreadCount} Unread
              </span>
            )}
          </div>

          <div className="divide-y divide-canvas-100 max-h-[600px] overflow-y-auto">
            {rows.map((n) => (
              <div 
                key={n.id} 
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`px-5 py-4 flex items-start justify-between gap-4 transition-colors ${
                  !n.read ? "bg-paprika-50/20 border-l-4 border-l-paprika-500 cursor-pointer hover:bg-paprika-50/35" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    n.type === "low_stock" ? "bg-orange-100 text-orange-600" :
                    n.type === "expiry" ? "bg-yellow-100 text-yellow-600" :
                    n.type === "payment" ? "bg-blue-100 text-blue-600" :
                    "bg-canvas-100 text-ink-500"
                  }`}>
                    {n.type === "low_stock" && <Layers size={14} />}
                    {n.type === "expiry" && <Calendar size={14} />}
                    {n.type === "payment" && <CreditCard size={14} />}
                    {n.type !== "low_stock" && n.type !== "expiry" && n.type !== "payment" && <Bell size={14} />}
                  </div>
                  <div>
                    <p className={`text-sm text-ink-800 ${!n.read ? "font-semibold" : ""}`}>{n.text}</p>
                    <p className="text-xs text-ink-500 mt-1 font-mono">{n.time}</p>
                  </div>
                </div>
                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-paprika-500 animate-pulse mt-2 shrink-0" />
                )}
              </div>
            ))}
            {rows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-ink-400 gap-2">
                <BellOff size={32} className="opacity-30" />
                <p className="text-sm">No notifications or logs recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preferences Panel */}
        <div className="space-y-6">
          {preferences && (
            <div className="bg-white rounded-2xl border border-canvas-200 shadow-soft p-5 space-y-5">
              <div className="flex items-center gap-2 border-b border-canvas-100 pb-3">
                <Settings className="text-ink-600" size={16} />
                <h3 className="font-display font-semibold text-sm text-ink-900">Alert Preferences</h3>
              </div>

              <div className="space-y-4">
                {[
                  { key: "low_stock", label: "Low Stock Alerts", desc: "Trigger low stock notifications when quantities drop." },
                  { key: "expiry", label: "Expiring Items", desc: "Warn when stock batches are near expiration." },
                  { key: "payment", label: "Pending Payments", desc: "Alert when supplier due is high (exceeds Rs. 15,000)." },
                  { key: "printer", label: "Printer Alerts", desc: "Notify if printer connections go offline." },
                ].map((t) => (
                  <div key={t.key} className="space-y-1 bg-canvas-50 border border-canvas-100 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-800 uppercase tracking-wider">{t.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={preferences[t.key] ?? false} 
                          onChange={(e) => updatePreference(t.key, e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4 bg-canvas-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-paprika-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-ink-500 leading-normal">{t.desc}</p>
                  </div>
                ))}
              </div>

              {preferences.low_stock && (
                <div className="bg-canvas-50 border border-canvas-100 p-3.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-ink-600">Trigger Threshold</label>
                    <span className="text-xs font-mono font-bold text-paprika-500 bg-white border border-canvas-200 px-2 py-0.5 rounded">
                      {preferences.threshold} items
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={preferences.threshold || 20}
                    onChange={(e) => updatePreference("threshold", Number(e.target.value))}
                    className="w-full h-1 bg-canvas-300 rounded-lg appearance-none cursor-pointer accent-paprika-600"
                  />
                </div>
              )}

              <Button variant="primary" className="w-full text-xs font-semibold py-2" onClick={savePreferences}>
                {saved ? "Preferences Saved ✓" : "Save Preferences"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
