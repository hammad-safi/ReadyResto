import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/client";
import Button from "../components/ui/Button";

const TYPES = [
  { key: "low_stock", label: "Low Stock Alerts" },
  { key: "expiry", label: "Expiring Items" },
  { key: "payment", label: "Pending Supplier Payments" },
  { key: "closing", label: "Daily Closing Reminder" },
  { key: "printer", label: "Printer Errors" },
];

export default function Notifications() {
  const [rows, setRows] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.list("notifications", { orderBy: "id DESC" }).then(setRows);
    
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
  }, []);

  const updatePreference = (key, value) => {
    setPreferences(p => ({ ...p, [key]: value }));
  };

  const savePreferences = async () => {
    await api.setSetting("alert_preferences", preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader eyebrow="System" title="Notifications" description="Recent alerts and what triggers them." />

      <div className="max-w-3xl">
        <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft p-5">
          <p className="font-display font-semibold text-ink-900 mb-3">Recent Alerts</p>
          <div className="space-y-1">
            {rows.map((n) => (
              <div key={n.id} className="px-2 py-3 border-b border-canvas-100 last:border-0">
                <p className="text-sm text-ink-800">{n.text}</p>
                <p className="text-xs text-ink-500 mt-0.5">{n.time}</p>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm text-ink-500 py-6 text-center">No notifications yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
