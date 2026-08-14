import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  Box,
  ChefHat,
  Download,
  ReceiptText,
  Store,
  AlertTriangle,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import Badge, { statusTone } from "../components/ui/Badge";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import DayCloseModal from "../components/operations/DayCloseModal";
import { useDashboardFilters } from "../context/DashboardFilterContext";

const PIE_COLORS = ["#C1440E", "#E3A008", "#4C7A51", "#4C5B7A", "#E79A67"];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-ink-400">
      <AlertTriangle size={24} className="text-canvas-300" />
      <p className="text-xs text-center">{message}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [tables, setTables] = useState([]);
  const [dayCloseOpen, setDayCloseOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const { filters } = useDashboardFilters();

  useEffect(() => {
    Promise.all([
      api.list("orders", { orderBy: "created_at DESC" }),
      api.list("expenses"),
      api.list("menu_items"),
      api.list("order_items"),
      api.list("inventory_items"),
      api.list("tables_floor"),
    ]).then(([orderRows, expenseRows, itemRows, itemSaleRows, inventoryRows, tableRows]) => {
      setOrders(orderRows || []);
      setExpenses(expenseRows || []);
      setMenuItems(itemRows || []);
      setOrderItems(itemSaleRows || []);
      setLowStock((inventoryRows || []).filter((r) => r.status === "low" || r.status === "critical"));
      setTables(tableRows || []);
    });
  }, []);

  // ── Date helpers ────────────────────────────────────────────────────
  const parseDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v === 'number') {
      // unix seconds vs ms
      return new Date(v < 1e12 ? v * 1000 : v);
    }
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return new Date(n < 1e12 ? n * 1000 : n);
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const isImageSrc = (s) => {
    if (!s || typeof s !== 'string') return false;
    if (s.startsWith('http') || s.startsWith('https') || s.startsWith('data:') || s.startsWith('/')) return true;
    return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(s);
  };
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (filters.range === "Today") {
      return { start, end };
    } else if (filters.range === "This Week") {
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      return { start, end };
    } else if (filters.range === "This Month") {
      start.setDate(1);
      return { start, end };
    } else if (filters.range === "This Year") {
      start.setMonth(0, 1);
      return { start, end };
    }
    return { start: null, end: null };
  }, [filters.range]);

  const prevDateRange = useMemo(() => {
    const { start: cs, end: ce } = dateRange;
    if (!cs || !ce) return { start: null, end: null };
    const duration = ce.getTime() - cs.getTime();
    return {
      start: new Date(cs.getTime() - duration - 1),
      end: new Date(cs.getTime() - 1),
    };
  }, [dateRange]);

  // ── Current range filtered data ───────────────────────────────────────
  const currentOrdersList = useMemo(() => {
    const { start, end } = dateRange;
    return orders.filter((o) => {
      if (o.status === "cancelled") return false;
      if (!start || !end) return true;
      const d = parseDate(o.created_at);
      return d && d >= start && d <= end;
    });
  }, [orders, dateRange]);

  const currentSalesTotal = useMemo(
    () => currentOrdersList.reduce((s, o) => s + Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0)), 0),
    [currentOrdersList]
  );

  const currentExpensesTotal = useMemo(() => {
    const { start, end } = dateRange;
    return expenses
      .filter((e) => {
        if (!start || !end) return true;
        const d = e.date ? new Date(e.date) : null;
        return d && d >= start && d <= end;
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [expenses, dateRange]);

  // ── Previous range for delta ─────────────────────────────────────────
  const prevSalesTotal = useMemo(() => {
    const { start, end } = prevDateRange;
    if (!start || !end) return 0;
    return orders
      .filter((o) => {
        if (o.status === "cancelled") return false;
        const d = parseDate(o.created_at);
        return d && d >= start && d <= end;
      })
      .reduce((s, o) => s + Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0)), 0);
  }, [orders, prevDateRange]);

  const salesDelta = currentSalesTotal - prevSalesTotal;
  const salesDeltaPct = prevSalesTotal > 0 ? Math.round((salesDelta / prevSalesTotal) * 100) : 0;
  const cogsEstimate = Math.round(currentSalesTotal * 0.35);
  const netProfit = currentSalesTotal - currentExpensesTotal - cogsEstimate;
  const avgOrderValue = currentOrdersList.length ? Math.round(currentSalesTotal / currentOrdersList.length) : 0;

  // ── Kitchen summary ─────────────────────────────────────────────────
  const kitchenSummary = useMemo(() => {
    const pending   = currentOrdersList.filter((o) => o.kitchen_status === "new" || o.status === "new").length;
    const preparing = currentOrdersList.filter((o) => o.kitchen_status === "preparing" || o.status === "preparing").length;
    const ready     = currentOrdersList.filter((o) => ["ready", "served", "completed"].includes(o.kitchen_status || o.status)).length;
    return { pending, preparing, ready };
  }, [currentOrdersList]);

  // ── Sales trend (hourly for Today, daily/monthly otherwise) ──────────
  const trendData = useMemo(() => {
    if (filters.range === "Today") {
      const hours = Array.from({ length: 14 }, (_, i) => ({
        name: `${(i + 8) % 12 || 12}${i + 8 < 12 ? "am" : "pm"}`,
        sales: 0,
        orders: 0,
      }));
      currentOrdersList.forEach((o) => {
        const d = parseDate(o.created_at);
        if (!d) return;
        const idx = d.getHours() - 8;
        if (idx >= 0 && idx < hours.length) {
          hours[idx].sales  += Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0));
          hours[idx].orders += 1;
        }
      });
      return hours;
    }
    const grouped = currentOrdersList.reduce((acc, o) => {
      const d = parseDate(o.created_at);
      if (!d) return acc;
      const name = filters.range === "This Year"
        ? d.toLocaleString("en-US", { month: "short" })
        : d.toLocaleString("en-US", { weekday: "short", day: "numeric" });
      if (!acc[name]) acc[name] = { name, sales: 0, orders: 0 };
      acc[name].sales  += Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0));
      acc[name].orders += 1;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [currentOrdersList, filters.range]);

  const hasTrendData = trendData.some((h) => h.sales > 0);

  // ── Payment split (revenue-based, handles split-payment JSON) ────────
  const paymentData = useMemo(() => {
    const rev = currentOrdersList.reduce((acc, o) => {
      if (o.payment_details && String(o.payment_details).startsWith("[")) {
        try {
          const splits = JSON.parse(o.payment_details);
          splits.forEach((s) => {
            const m = s.method || "Cash";
            acc[m] = (acc[m] || 0) + Number(s.amount || 0);
          });
          return acc;
        } catch (_) {}
      }
      const rawMethod = o.payment_method || "Cash";
      const key = ["Cash", "Card", "Wallet", "Credit"].includes(rawMethod) ? rawMethod : "Cash";
      acc[key] = (acc[key] || 0) + Math.max(0, Number(o.total || 0) - Number(o.refunded_total || 0));
      return acc;
    }, {});
    const total = Object.values(rev).reduce((s, v) => s + v, 0) || 0;
    if (!total) return [];
    return Object.entries(rev)
      .map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [currentOrdersList]);

  // ── Category sales ───────────────────────────────────────────────────
  const currentOrderItemIds = useMemo(
    () => new Set(currentOrdersList.map((o) => o.id)),
    [currentOrdersList]
  );

  const categoryData = useMemo(() => {
    const byCategory = orderItems
      .filter((it) => currentOrderItemIds.has(it.order_id))
      .reduce((acc, item) => {
        const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
        const cat = menuItem?.category || item.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + Number(item.qty || 1);
        return acc;
      }, {});
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0) || 0;
    if (!total) return [];
    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [orderItems, menuItems, currentOrderItemIds]);

  // ── Peak hours ───────────────────────────────────────────────────────
  const peakHourData = useMemo(() => {
    const hours = Array.from({ length: 10 }, (_, i) => ({ name: `${i + 8}:00`, value: 0 }));
    currentOrdersList.forEach((o) => {
      const d = parseDate(o.created_at);
      if (!d) return;
      const idx = d.getHours() - 8;
      if (idx >= 0 && idx < hours.length) hours[idx].value += 1;
    });
    return hours;
  }, [currentOrdersList]);

  const hasPeakData = peakHourData.some((h) => h.value > 0);

  // ── Top selling items ────────────────────────────────────────────────
  const [topView, setTopView] = useState("quantity");

  const topItems = useMemo(() => {
    const grouped = orderItems
      .filter((it) => currentOrderItemIds.has(it.order_id))
      .reduce((acc, item) => {
        const menuId = item.menu_item_id || null;
        const key = menuId ? `id:${menuId}` : `name:${item.name || "Unknown"}`;
        if (!acc[key]) acc[key] = {
          name: menuId ? (menuItems.find((m) => String(m.id) === String(menuId))?.name || item.name || "Unknown") : (item.name || "Unknown"),
          qty: 0,
          revenue: 0,
          menu_item_id: menuId,
        };
        acc[key].qty     += Number(item.qty || 1);
        acc[key].revenue += Number(item.price || 0) * Number(item.qty || 1);
        return acc;
      }, {});
    return Object.values(grouped)
      .sort((a, b) => (topView === "revenue" ? b.revenue - a.revenue : b.qty - a.qty))
      .slice(0, 5);
  }, [orderItems, currentOrderItemIds, topView, menuItems]);

  // attach image from menu items and short-format helper
  const topItemsWithImage = topItems.map((it) => {
    let mi = null;
    if (it.menu_item_id) mi = menuItems.find((m) => String(m.id) === String(it.menu_item_id));
    if (!mi) mi = menuItems.find((m) => (m.name || "").toLowerCase() === (it.name || "").toLowerCase());
    return { ...it, image: mi?.image || mi?.img || null };
  });

  const formatShort = (v) => {
    const n = Number(v) || 0;
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(n);
  };

  const exportCsv = (filename, rows) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((row) => headers.map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${filename}.csv`;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
    setNotice(`Exported ${filename}.csv`);
  };

  const greeting = getGreeting();
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <main className="p-8 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-paprika-500 rounded-xl flex items-center justify-center text-white shadow-soft">
            <Store size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold text-ink-900">{greeting}, {user?.name || ''} 👋</h2>
            <div className="flex items-center gap-3 text-sm text-ink-500">
              <span className="text-xs">{dateLabel}</span>
              <span className="mx-1">•</span>
              <span className="text-sm">Main Branch Terminal</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setDayCloseOpen(true)} className="bg-white p-3 rounded-xl shadow-soft border border-canvas-200 text-sm">Day Close</button>
          <button onClick={() => navigate('/expenses')} className="bg-white p-3 rounded-xl shadow-soft border border-canvas-200 text-sm">Expense</button>
          <button onClick={() => navigate('/purchases')} className="bg-white p-3 rounded-xl shadow-soft border border-canvas-200 text-sm">Purchase</button>
          <button onClick={() => navigate('/pos')} className="bg-paprika-500 text-white p-3 rounded-xl shadow-soft text-sm">New Order</button>
        </div>
      </div>

      {/* 6 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="glass-card p-4 rounded-xl2 shadow-soft">
          <div className="flex justify-between items-start mb-2">
            <span className="p-1 bg-paprika-100 text-paprika-500 rounded-md">⤴</span>
            <span className="text-xs font-bold text-paprika-500">+{Math.max(0, salesDeltaPct)}</span>
          </div>
          <p className="text-xs text-ink-500 uppercase">Total Sales</p>
          <p className="text-lg font-semibold">Rs. {formatShort(currentSalesTotal)}</p>
        </div>

        <div className="glass-card p-4 rounded-xl2 shadow-soft">
          <div className="flex justify-between items-start mb-2">
            <span className="p-1 bg-slateblue-100 text-slateblue-600 rounded-md">🧾</span>
            <span className="text-xs font-bold text-slateblue-600">{currentOrdersList.length}</span>
          </div>
          <p className="text-xs text-ink-500 uppercase">Total Orders</p>
          <p className="text-lg font-semibold">{currentOrdersList.length}</p>
        </div>

        <div className="glass-card p-4 rounded-xl2 shadow-soft border-l-4 border-paprika-500/30">
          <div className="flex justify-between items-start mb-2">
            <span className="p-1 bg-error-container text-error rounded-md">!</span>
            <span className="text-xs font-bold text-error">{salesDeltaPct < 0 ? `${salesDeltaPct}%` : `+${salesDeltaPct}%`}</span>
          </div>
          <p className="text-xs text-ink-500 uppercase">Revenue Delta</p>
          <p className="text-lg font-semibold">Rs. {formatShort(currentSalesTotal - prevSalesTotal)}</p>
        </div>

        <div className="glass-card p-4 rounded-xl2 shadow-soft">
          <div className="flex justify-between items-start mb-2">
            <span className="p-1 bg-canvas-100 text-ink-600 rounded-md">💸</span>
          </div>
          <p className="text-xs text-ink-500 uppercase">Expenses</p>
          <p className="text-lg font-semibold">Rs. {formatShort(currentExpensesTotal)}</p>
        </div>

        <div className="glass-card p-4 rounded-xl2 shadow-soft bg-paprika-50">
          <div className="flex justify-between items-start mb-2">
            <span className="p-1 bg-paprika-500 text-white rounded-md">💰</span>
          </div>
          <p className="text-xs text-ink-500 uppercase">Net Profit</p>
          <p className="text-lg font-semibold text-paprika-500">Rs. {formatShort(netProfit)}</p>
        </div>

        <div className="glass-card p-4 rounded-xl2 shadow-soft">
          <div className="flex justify-between items-start mb-2">
            <span className="p-1 bg-canvas-100 text-ink-600 rounded-md">📈</span>
          </div>
          <p className="text-xs text-ink-500 uppercase">Avg. Order</p>
          <p className="text-lg font-semibold">{avgOrderValue > 0 ? `Rs. ${formatShort(avgOrderValue)}` : '—'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 glass-card p-6 rounded-xl2 shadow-soft min-h-[420px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-display font-semibold">Hourly Sales Trend</h3>
              <p className="text-xs text-ink-500">{filters.range} · {filters.range === 'Today' ? 'hourly view' : 'daily view'}</p>
            </div>
            {/* <div className="flex bg-canvas-100 rounded-md p-1">
              <button className="px-3 py-1 bg-white rounded-md text-xs font-medium">Hourly</button>
              <button className="px-3 py-1 text-xs font-medium text-ink-500">Daily</button>
              <button className="px-3 py-1 text-xs font-medium text-ink-500">Weekly</button>
            </div> */}
          </div>
          <div className="flex-1 relative">
            {hasTrendData ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSales" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#C1440E" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#C1440E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4E5661" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#4E5661" }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#C1440E" strokeWidth={2.5} fill="url(#gradSales)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-ink-400">No sales data</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-6 rounded-xl2 shadow-soft flex flex-col">
          <h3 className="text-lg font-display font-semibold mb-4">Payment Split</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            {paymentData.length > 0 ? (
              <>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full mt-4 space-y-2">
                  {paymentData.map((p, i) => (
                    <div key={p.name} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full`} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>{p.name}</div>
                      <div className="font-mono">{p.value}%</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-ink-400">No payment data</div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-xl2 shadow-soft border-t-4 border-paprika-500/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-error">⚠️</span>
            <h3 className="text-lg font-semibold">Inventory Alerts</h3>
          </div>
          <div className="space-y-3">
            {lowStock.slice(0,3).map((it) => (
              <div key={it.id} className="flex justify-between items-center p-3 bg-[rgba(0,0,0,0.02)] rounded-lg">
                <div>
                  <p className="font-semibold">{it.name}</p>
                  <p className="text-xs text-ink-500">Remaining: {it.stock} {it.unit}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${it.status === 'critical' ? 'bg-paprika-500 text-white' : 'bg-saffron-400 text-white'}`}>{it.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/inventory')} className="mt-4 w-full py-2 border border-canvas-200 rounded-xl">View All Alerts</button>
        </div>

        <div className="lg:col-span-2 glass-card p-6 rounded-xl2 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span>🍽️</span>
              <h3 className="text-lg font-semibold">Live Floor & Kitchen</h3>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-paprika-500"></span> Occupied</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-canvas-100"></span> Vacant</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-canvas-100 text-center"> <p className="text-xs">Pending</p><p className="text-2xl font-bold">{kitchenSummary.pending}</p></div>
            <div className="p-3 rounded-lg bg-paprika-50 text-center"> <p className="text-xs">Preparing</p><p className="text-2xl font-bold">{kitchenSummary.preparing}</p></div>
            <div className="p-3 rounded-lg bg-basil-50 text-center"> <p className="text-xs">Ready</p><p className="text-2xl font-bold">{kitchenSummary.ready}</p></div>
            <div className="p-3 rounded-lg bg-canvas-50 text-center"> <p className="text-xs">Delayed</p><p className="text-2xl font-bold text-paprika-500">0</p></div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {tables.slice(0,10).map((t) => (
              <div key={t.id} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${t.status === 'occupied' ? 'bg-paprika-500 text-white' : 'bg-canvas-100 text-ink-700'}`}>{t.id}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <div className="glass-card p-6 rounded-xl2 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {topItemsWithImage.map((it) => (
              <div key={it.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-canvas-50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-canvas-100">
                    {isImageSrc(it.image)
                      ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">{it.image || '🍽️'}</span>
                    }
                  </div>
                  <div>
                    <p className="font-semibold">{it.name}</p>
                    <p className="text-xs text-ink-500">{it.qty} portions sold</p>
                  </div>
                </div>
                <div className="font-mono">Rs. {formatShort(it.revenue)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl2 shadow-soft flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Peak Hours Activity</h3>
          <div className="flex-1 flex items-end justify-between h-48 gap-2">
            {hasPeakData ? (
              peakHourData.map((h, i) => (
                <div key={i} className="flex-1 bg-canvas-100 rounded-t-md relative">
                  <div className="absolute bottom-0 w-full bg-paprika-500" style={{ height: `${Math.min(100, (h.value || 0) * 10)}%` }} />
                </div>
              ))
            ) : (
              <div className="flex-1 h-full flex items-center justify-center">
                <p className="text-xs text-ink-400">No peak hour activity for selected range.</p>
              </div>
            )}
          </div>
          <p className="text-center text-xs text-ink-500 mt-4">System recommends adding staff during peak hours.</p>
        </div>
      </div>

      <DayCloseModal
        open={dayCloseOpen}
        onClose={() => setDayCloseOpen(false)}
        onComplete={() => setNotice("Day closed successfully. Z-report has been logged.")}
      />
    </main>
  );
}
