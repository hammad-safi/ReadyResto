import { useEffect, useState, useRef } from "react";
import {
  Menu, Search, Bell, Lock, Building2, CalendarDays, Archive,
  CheckCheck, Package, CreditCard, AlertTriangle, Info, ArrowRight, X
} from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { useDashboardFilters } from "../../context/DashboardFilterContext";
import DayCloseModal from "../operations/DayCloseModal";

export default function Topbar({ onMenuClick }) {
  const { user, lock } = useAuth();
  const { filters, updateFilters } = useDashboardFilters();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const loadNotifications = () => {
    api.list("notifications", { orderBy: "id DESC" }).then(setNotifications);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  const handleItemClick = async (n) => {
    if (!n.read) {
      await api.markNotificationRead(n.id);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: 1 } : item)));
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "low_stock":
        return <Package size={14} className="text-amber-600" />;
      case "payment":
        return <CreditCard size={14} className="text-blue-600" />;
      case "expiry":
        return <AlertTriangle size={14} className="text-purple-600" />;
      case "system":
      case "success":
        return <CheckCheck size={14} className="text-green-600" />;
      default:
        return <Info size={14} className="text-ink-500" />;
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (tA || tB) return tB - tA;
    return Number(b.id || 0) - Number(a.id || 0);
  });

  // Show only the latest 8 notifications in the dropdown and keep a View All shortcut
  const displayedNotifications = sortedNotifications.slice(0, 8);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white backdrop-blur border-b border-canvas-200 flex items-center gap-3 px-4 sm:px-6 shrink-0">
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
        <label className="hidden md:flex items-center gap-1.5 text-xs font-medium text-ink-700 border border-canvas-200 rounded-lg px-3 py-2 hover:bg-canvas-100 cursor-pointer">
          <CalendarDays size={14} />
          <select
            value={filters.range}
            onChange={(e) => updateFilters({ range: e.target.value })}
            className="bg-transparent outline-none cursor-pointer"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
        </label>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            className={`h-9 w-9 relative flex items-center justify-center rounded-lg transition-colors ${
              notifOpen ? "bg-canvas-100 text-ink-900" : "text-ink-600 hover:bg-canvas-100"
            }`}
            onClick={() => {
              setNotifOpen((v) => !v);
              if (!notifOpen) loadNotifications();
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-paprika-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-canvas-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-100 bg-canvas-50/50">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink-900">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-paprika-100 text-paprika-700 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-paprika-600 hover:text-paprika-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-canvas-100">
                {displayedNotifications.length === 0 ? (
                  <div className="py-8 text-center text-ink-400 text-xs flex flex-col items-center gap-2">
                    <Bell size={24} className="opacity-20 text-ink-500" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-[11px] text-ink-400">No new alerts or notifications.</p>
                  </div>
                ) : (
                  displayedNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`px-3.5 py-2.5 hover:bg-canvas-50 cursor-pointer transition-colors flex items-start gap-2.5 ${
                        !n.read ? "bg-paprika-50/30" : ""
                      }`}
                    >
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-canvas-100 flex items-center justify-center shrink-0 border border-canvas-200">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-ink-800 leading-snug ${!n.read ? "font-semibold text-ink-900" : ""}`}>
                          {n.text}
                        </p>
                        <p className="text-[11px] text-ink-400 font-mono mt-0.5">{n.time}</p>
                      </div>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-paprika-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-canvas-100 bg-canvas-50 flex items-center justify-between text-xs">
                <span className="text-ink-400 font-medium">
                  Showing {displayedNotifications.length} of {notifications.length}
                </span>
                {notifications.length > 8 && (
                  <button
                    type="button"
                    onClick={() => { setNotifOpen(false); window.location.hash = "#/notifications"; }}
                    className="font-semibold text-paprika-600 hover:text-paprika-700 flex items-center gap-1 hover:underline"
                  >
                    View All <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="hidden sm:flex items-center gap-2 border border-canvas-200 rounded-lg px-2.5 py-1 bg-canvas-50">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt={user.name} className="w-6 h-6 rounded-full object-cover border border-canvas-200" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-paprika-100 text-paprika-700 flex items-center justify-center text-[10px] font-bold border border-paprika-200">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-ink-800">{user?.name}</span>
          <span className="text-[10px] font-semibold text-saffron-700 bg-saffron-100 px-2 py-0.5 rounded uppercase tracking-wider">
            {user?.role}
          </span>
        </div>

        <button
          onClick={lock}
          className="h-9 w-9 hidden sm:flex items-center justify-center rounded-lg text-ink-600 hover:bg-canvas-100"
          title="Lock Screen"
        >
          <Lock size={17} />
        </button>
      </div>
    </header>
  );
}
