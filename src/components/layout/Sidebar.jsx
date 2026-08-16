import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useRestaurant } from "../../context/RestaurantContext";
import api from "../../api/client";
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  LayoutGrid,
  ClipboardList,
  Receipt,
  UtensilsCrossed,
  BookOpen,
  Boxes,
  Truck,
  ShoppingBag,
  Users,
  UserCog,
  ShieldCheck,
  Wallet,
  Calculator,
  BarChart3,
  Settings,
  UtensilsCrossed as Logo,
  X,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const groups = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Operations",
    items: [
      { to: "/pos", label: "POS Billing", icon: ShoppingCart },
      { to: "/sales", label: "Sales", icon: Receipt },
      { to: "/kitchen", label: "Kitchen Display", icon: ChefHat },
      { to: "/tables", label: "Table Management", icon: LayoutGrid },
      { to: "/orders", label: "Order Management", icon: ClipboardList },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/menu", label: "Menu Management", icon: UtensilsCrossed },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { to: "/inventory", label: "Inventory", icon: Boxes },
      { to: "/suppliers", label: "Suppliers", icon: Truck },
      { to: "/purchases", label: "Purchases", icon: ShoppingBag },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/employees", label: "Employees", icon: UserCog },
      { to: "/users", label: "Users & Roles", icon: ShieldCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/expenses", label: "Expenses", icon: Wallet },
      { to: "/accounting", label: "Accounting", icon: Calculator },
      // { to: "/reports", label: "Reports", icon: BarChart3 }, // Temporarily hidden
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const { user, lock, logout, canDo } = useAuth();
  const { profile } = useRestaurant();

  const [currentCashier, setCurrentCashier] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (user?.id) {
      api.getCurrentShift(user.id).then((s) => {
        if (mounted) setCurrentCashier(s);
      });
    }
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const userAvatar = user?.profile_photo || (user?.role === "Owner" ? profile?.ownerPhoto : null);

  // Filter groups and items based on permissions
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canDo(item.label, "view")),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink-950/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed z-50 lg:z-0 top-0 left-0 h-full text-white/90 flex flex-col
        transition-all duration-200 lg:static lg:h-screen lg:shrink-0
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        w-[264px] ${collapsed ? "lg:w-[72px]" : "lg:w-[264px]"}`}
        style={{ backgroundColor: "rgb(var(--surface-sidebar))", color: "rgb(var(--text-inverse))" }}
      >
        <div className={`flex items-center h-16 border-b border-white/10 shrink-0 ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            {profile?.logo ? (
              <img
                src={profile.logo}
                alt="Logo"
                className="h-8 w-8 shrink-0 rounded-lg object-cover border border-white/20"
                onClick={collapsed ? onToggleCollapse : undefined}
                style={{ cursor: collapsed ? "pointer" : "default" }}
              />
            ) : (
              <div
                className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center shadow-sm"
                onClick={collapsed ? onToggleCollapse : undefined}
                style={{ cursor: collapsed ? "pointer" : "default", backgroundColor: "rgb(var(--color-primary-500))" }}
              >
                <Logo size={17} className="text-white" strokeWidth={2.2} />
              </div>
            )}
            {!collapsed && (
              <div className="leading-tight min-w-0 flex-1">
                <p className="font-display font-semibold text-sm text-white truncate">
                  {profile?.name || "Dastarkhwan"}
                </p>
                <p className="text-[10px] font-mono text-white/50 tracking-wider truncate uppercase">
                  {profile?.tagline || "ERP · OFFLINE"}
                </p>
                {profile?.showCashierName && !collapsed && (
                  <p className="text-[11px] text-white/60 mt-0.5 truncate font-medium">
                    {currentCashier?.cashier_name ? `Cashier: ${currentCashier.cashier_name}` : "No active cashier"}
                  </p>
                )}
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="hidden lg:flex text-white/50 hover:text-white transition-colors" onClick={onToggleCollapse}>
              <ChevronLeft size={18} />
            </button>
          )}
          <button className="lg:hidden text-white/70 hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto py-4 space-y-5 ${collapsed ? "px-2" : "px-3"}`}>
          {filteredGroups.map((group) => (
            <div key={group.label}>
              {!collapsed ? (
                <p className="px-2.5 text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-1.5 truncate">
                  {group.label}
                </p>
              ) : (
                <div className="h-2" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                        collapsed ? "justify-center p-2" : "px-2.5 py-2"
                      } ${
                        isActive
                          ? "bg-paprika-500 text-white shadow-soft"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <item.icon size={16} strokeWidth={2} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`p-4 border-t border-white/10 shrink-0 ${collapsed ? "flex flex-col items-center gap-3 px-2" : ""}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? "" : "mb-3"}`}>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover shrink-0 border border-saffron-400/40"
                title={user?.name}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-saffron-400/20 text-saffron-400 flex items-center justify-center text-xs font-semibold shrink-0" title={user?.name}>
                {initials}
              </div>
            )}
            {!collapsed && (
              <div className="leading-tight min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <span className="inline-block text-[9px] font-semibold text-saffron-400 bg-saffron-400/10 px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
            )}
          </div>
          <div className={`flex gap-2 ${collapsed ? "flex-col w-full" : ""}`}>
            <button
              onClick={lock}
              title={collapsed ? "Lock" : undefined}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-white/10 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all ${collapsed ? "px-0 w-full" : "flex-1"}`}
            >
              <Lock size={12} /> {!collapsed && "Lock"}
            </button>
            <button
              onClick={logout}
              title={collapsed ? "Log out" : undefined}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-white/10 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all ${collapsed ? "px-0 w-full" : "flex-1"}`}
            >
              <LogOut size={12} /> {!collapsed && "Log out"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
