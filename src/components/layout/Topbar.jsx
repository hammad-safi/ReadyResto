import { useEffect, useState, useMemo, useRef } from "react";
import { Search, Bell, Menu, Sparkles, CalendarDays, KeyRound, Lock, LogOut, RefreshCw, ShoppingBag, Users, Truck, Package, Archive, Building2, CreditCard, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { useRestaurant } from "../../context/RestaurantContext";
import { useDashboardFilters } from "../../context/DashboardFilterContext";

export default function Topbar({ onMenuClick }) {
  const { user, lock } = useAuth();
  const { profile } = useRestaurant();
  const { filters, updateFilters } = useDashboardFilters();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const searchContainerRef = useRef(null);
  const notifRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [datasets, setDatasets] = useState({
    orders: [],
    menu_items: [],
    customers: [],
    suppliers: [],
    inventory_items: []
  });
  const [loaded, setLoaded] = useState(false);

  const prefetchDatasets = async () => {
    if (loaded) return;
    try {
      const [orders, menu_items, customers, suppliers, inventory_items] = await Promise.all([
        api.list("orders"),
        api.list("menu_items"),
        api.list("customers"),
        api.list("suppliers"),
        api.list("inventory_items")
      ]);
      setDatasets({ orders, menu_items, customers, suppliers, inventory_items });
      setLoaded(true);
    } catch (err) {
      console.error("Prefetch search error:", err);
    }
  };

  useEffect(() => {
    const onClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    if (!searchQuery.trim() || !loaded) return [];
    const q = searchQuery.toLowerCase();
    const list = [];

    // Filter menu items (POS)
    const menuMatches = datasets.menu_items
      .filter(item => item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(item => ({
        type: "menu",
        title: item.name,
        category: "Menu Items",
        subtitle: `${item.category} • Rs. ${Number(item.price).toLocaleString()}`,
        url: `/pos?search=${encodeURIComponent(item.name)}`
      }));
    list.push(...menuMatches);

    // Filter orders
    const orderMatches = datasets.orders
      .filter(o => o.id?.toLowerCase().includes(q) || o.customer?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(o => ({
        type: "order",
        title: `#${o.id}`,
        category: "Orders",
        subtitle: `${o.customer || 'Walk-in'} • Rs. ${Number(o.total).toLocaleString()} • ${o.status}`,
        url: `/orders?search=${encodeURIComponent(o.id)}`
      }));
    list.push(...orderMatches);

    // Filter customers
    const customerMatches = datasets.customers
      .filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q))
      .slice(0, 3)
      .map(c => ({
        type: "customer",
        title: c.name,
        category: "Customers",
        subtitle: `${c.phone || 'No Phone'} • Tier: ${c.tier || 'Silver'}`,
        url: `/customers?search=${encodeURIComponent(c.name)}`
      }));
    list.push(...customerMatches);

    // Filter suppliers
    const supplierMatches = datasets.suppliers
      .filter(s => s.name?.toLowerCase().includes(q) || s.phone?.includes(q))
      .slice(0, 3)
      .map(s => ({
        type: "supplier",
        title: s.name,
        category: "Suppliers",
        subtitle: `${s.category || 'Dry Goods'} • Dues: Rs. ${Number(s.due || 0).toLocaleString()}`,
        url: `/suppliers?search=${encodeURIComponent(s.name)}`
      }));
    list.push(...supplierMatches);

    // Filter inventory
    const inventoryMatches = datasets.inventory_items
      .filter(i => i.name?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(i => ({
        type: "inventory",
        title: i.name,
        category: "Inventory",
        subtitle: `SKU: ${i.sku || 'N/A'} • Stock: ${i.stock} ${i.unit} (${i.warehouse})`,
        url: `/inventory?search=${encodeURIComponent(i.name)}`
      }));
    list.push(...inventoryMatches);

    return list;
  }, [searchQuery, datasets, loaded]);

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  const handleSelect = (item) => {
    setSearchQuery("");
    setShowResults(false);
    setSelectedIndex(0);
    navigate(item.url);
  };

  const userAvatar = user?.profile_photo || (user?.role === "Owner" ? profile?.ownerPhoto : null);

  const loadNotifications = () => {
    api.list("notifications", { orderBy: "id DESC" }).then(setNotifications);
  };

  const handleMarkAllRead = async () => {
    if (api.markAllNotificationsRead) {
      await api.markAllNotificationsRead();
      loadNotifications();
    }
  };

  const handleMarkRead = async (id) => {
    if (api.markNotificationRead) {
      await api.markNotificationRead(id);
      loadNotifications();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [notifOpen]);

  useEffect(() => {
    loadNotifications();
    // In a real app this would be a WebSocket or SSE, polling for demo purposes
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      className="sticky top-0 z-30 h-16 backdrop-blur border-b flex items-center gap-3 px-4 sm:px-6 shrink-0"
      style={{
        backgroundColor: "rgb(var(--surface-topbar) / 0.95)",
        borderColor: "rgb(var(--border-default))",
        color: "rgb(var(--text-base))"
      }}
    >
      <button
        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:opacity-80"
        style={{ color: "rgb(var(--text-muted))" }}
        onClick={onMenuClick}
      >
        <Menu size={20} />
      </button>

      <div ref={searchContainerRef} className="hidden sm:flex items-center flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 text-ink-500" />
        <input
          placeholder="Search orders, items, customers…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            prefetchDatasets();
            setShowResults(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            backgroundColor: "rgb(var(--surface-input))",
            color: "rgb(var(--text-base))",
            borderColor: "rgb(var(--border-default))",
            border: "1px solid rgb(var(--border-default))",
            outlineColor: "rgb(var(--color-primary-500) / 0.3)"
          }}
        />

        {showResults && searchQuery.trim() && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 rounded-xl shadow-lg max-h-[400px] overflow-y-auto z-50 p-2 space-y-3 border"
            style={{
              backgroundColor: "rgb(var(--surface-card))",
              borderColor: "rgb(var(--border-default))",
              color: "rgb(var(--text-base))"
            }}
          >
            {results.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-400">
                No matching results for "{searchQuery}"
              </div>
            ) : (
              ["Menu Items", "Orders", "Customers", "Suppliers", "Inventory"].map((cat) => {
                const catResults = results.filter((r) => r.category === cat);
                if (catResults.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1">
                    <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink-400 bg-canvas-50/50 rounded-md">
                      {cat}
                    </p>
                    <div className="space-y-0.5">
                      {catResults.map((item) => {
                        const globalIndex = results.indexOf(item);
                        const isSelected = selectedIndex === globalIndex;

                        let Icon = Search;
                        let iconColor = "text-ink-500";
                        let iconBg = "bg-canvas-100";
                        if (item.type === "menu") {
                          Icon = ShoppingBag;
                          iconColor = "text-paprika-600";
                          iconBg = "bg-paprika-50";
                        } else if (item.type === "order") {
                          Icon = Receipt;
                          iconColor = "text-blue-600";
                          iconBg = "bg-blue-50";
                        } else if (item.type === "customer") {
                          Icon = Users;
                          iconColor = "text-green-600";
                          iconBg = "bg-green-50";
                        } else if (item.type === "supplier") {
                          Icon = Truck;
                          iconColor = "text-indigo-600";
                          iconBg = "bg-indigo-50";
                        } else if (item.type === "inventory") {
                          Icon = Package;
                          iconColor = "text-saffron-600";
                          iconBg = "bg-saffron-50";
                        }

                        return (
                          <button
                            key={globalIndex}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                              isSelected ? "bg-paprika-50/70" : "hover:bg-canvas-50/50"
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                              <Icon size={16} className={iconColor} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${
                                isSelected ? "text-paprika-900" : "text-ink-800"
                              }`}>
                                {item.title}
                              </p>
                              <p className="text-[10px] text-ink-500 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
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

          <div className="hidden lg:flex items-center gap-3">
            <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">
              {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

        <div ref={notifRef} className="relative">
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

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-canvas-200 rounded-xl2 shadow-card p-2 z-40">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-canvas-100 mb-1.5">
                <p className="text-sm font-semibold text-ink-900">Notifications</p>
                <button 
                  onClick={handleMarkAllRead} 
                  className="text-xs text-paprika-600 font-medium hover:text-paprika-700 transition-colors"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-400">
                    All caught up! No notifications.
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleMarkRead(n.id)}
                      className={`px-3 py-2 rounded-lg hover:bg-canvas-50 flex gap-3 cursor-pointer items-start transition-colors ${
                        !n.read ? "bg-paprika-50/20 border-l-4 border-l-paprika-500 font-semibold" : ""
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        n.type === "low_stock" ? "bg-orange-100 text-orange-600" :
                        n.type === "expiry" ? "bg-yellow-100 text-yellow-600" :
                        n.type === "payment" ? "bg-blue-100 text-blue-600" :
                        "bg-canvas-100 text-ink-500"
                      }`}>
                        {n.type === "low_stock" && <Package size={14} />}
                        {n.type === "expiry" && <CalendarDays size={14} />}
                        {n.type === "payment" && <CreditCard size={14} />}
                        {n.type !== "low_stock" && n.type !== "expiry" && n.type !== "payment" && <Bell size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink-800 leading-snug break-words">{n.text}</p>
                        <p className="text-[10px] text-ink-400 mt-1 font-mono">{n.time}</p>
                      </div>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-paprika-500 mt-2 shrink-0 animate-pulse" />
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-canvas-200 mt-1.5 pt-2 px-2 pb-1 text-center">
                <button 
                  onClick={() => {
                    setNotifOpen(false);
                    navigate("/notifications");
                  }}
                  className="text-xs text-ink-600 hover:text-paprika-600 font-semibold transition-colors block w-full text-center"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 border border-canvas-200 rounded-lg px-2.5 py-1 bg-canvas-50">
          {userAvatar && (
            <img src={userAvatar} alt="Avatar" className="h-6 w-6 rounded-full object-cover border border-canvas-300" />
          )}
          <span className="text-xs font-semibold text-ink-800">{user?.name}</span>
          <span className="text-[10px] font-semibold text-saffron-700 bg-saffron-100 px-2 py-0.5 rounded uppercase tracking-wider">{user?.role}</span>
        </div>

        <button onClick={lock} className="h-9 w-9 hidden sm:flex items-center justify-center rounded-lg text-ink-600 hover:bg-canvas-100" title="Lock Screen">
          <Lock size={17} />
        </button>
      </div>


    </header>
  );
}
