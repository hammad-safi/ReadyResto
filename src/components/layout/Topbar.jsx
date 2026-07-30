import { useEffect, useState } from "react";
import { Menu, Search, Bell, Lock, Building2, CalendarDays, Archive } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { useDashboardFilters } from "../../context/DashboardFilterContext";
import DayCloseModal from "../operations/DayCloseModal";

export default function Topbar({ onMenuClick }) {
  const { user, lock } = useAuth();
  const { filters, updateFilters } = useDashboardFilters();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dayCloseOpen, setDayCloseOpen] = useState(false);

  const loadNotifications = () => {
    api.list("notifications", { orderBy: "id DESC" }).then(setNotifications);
  };

  useEffect(() => {
    loadNotifications();
    // In a real app this would be a WebSocket or SSE, polling for demo purposes
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-canvas-200 flex items-center gap-3 px-4 sm:px-6 shrink-0">
      <button
        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-ink-600 hover:bg-canvas-100"
        onClick={onMenuClick}
      >
        <Menu size={20} />
      </button>

      <div className="hidden sm:flex items-center flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 text-ink-500" />
        <input
          placeholder="Search orders, items, customers…"
          className="w-full bg-canvas-100 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-ink-500/60 outline-none focus:ring-2 focus:ring-paprika-500/30"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2 ml-auto">
        <label className="hidden md:flex items-center gap-1.5 text-xs font-medium text-ink-700 border border-canvas-200 rounded-lg px-3 py-2 hover:bg-canvas-100">
          <CalendarDays size={14} />
          <select
            value={filters.range}
            onChange={(e) => updateFilters({ range: e.target.value })}
            className="bg-transparent outline-none"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
        </label>

        {/* <label className="hidden md:flex items-center gap-1.5 text-xs font-medium text-ink-700 border border-canvas-200 rounded-lg px-3 py-2 hover:bg-canvas-100">
          <Building2 size={14} />
          <select
            value={filters.branch}
            onChange={(e) => updateFilters({ branch: e.target.value })}
            className="bg-transparent outline-none"
          >
            <option>All Branches</option>
            <option>Main Branch</option>
            <option>Downtown</option>
          </select>
        </label> */}

        <button
          onClick={() => setDayCloseOpen(true)}
          className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2 hover:bg-paprika-100 transition-colors"
        >
          <Archive size={14} />
          Day Close
        </button>

        <button
          className="h-9 w-9 relative flex items-center justify-center rounded-lg text-ink-600 hover:bg-canvas-100"
          onClick={() => {
            setNotifOpen((v) => !v);
            if (!notifOpen) loadNotifications();
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-paprika-500 animate-pulse" />
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 border border-canvas-200 rounded-lg px-2.5 py-1 bg-canvas-50">
          <span className="text-xs font-semibold text-ink-800">{user?.name}</span>
          <span className="text-[10px] font-semibold text-saffron-700 bg-saffron-100 px-2 py-0.5 rounded uppercase tracking-wider">{user?.role}</span>
        </div>

        <button onClick={lock} className="h-9 w-9 hidden sm:flex items-center justify-center rounded-lg text-ink-600 hover:bg-canvas-100" title="Lock Screen">
          <Lock size={17} />
        </button>

        {notifOpen && (
          <div className="absolute right-4 sm:right-6 top-16 w-80 bg-white border border-canvas-200 rounded-xl2 shadow-card p-2 z-40">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-semibold text-ink-900">Notifications</p>
              <button className="text-xs text-paprika-600 font-medium">Mark all read</button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-0.5">
              {notifications.map((n) => (
                <div key={n.id} className="px-2 py-2.5 rounded-lg hover:bg-canvas-50 flex flex-col gap-0.5">
                  <p className="text-xs text-ink-800">{n.text}</p>
                  <p className="text-[11px] text-ink-500">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DayCloseModal 
        open={dayCloseOpen} 
        onClose={() => setDayCloseOpen(false)} 
        onComplete={() => {
          // Additional logic on complete could go here
        }}
      />
    </header>
  );
}
