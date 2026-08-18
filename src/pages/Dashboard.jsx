// 


import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
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
import { useDashboardFilters } from "../context/DashboardFilterContext";
import { useDataCache } from "../context/DataCacheContext";

const LazyCharts = lazy(() => import("../components/dashboard/LazyCharts"));

const PIE_COLORS = [
  "rgb(var(--color-primary-500))",
  "rgb(var(--status-warning-text))",
  "rgb(var(--status-success-text))",
  "rgb(var(--color-ink-500))",
  "rgb(var(--color-primary-300))"
];

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
  const { getData } = useDataCache();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [tables, setTables] = useState([]);
  const [notice, setNotice] = useState("");
  const [trendGranularity, setTrendGranularity] = useState("Hourly"); // "Hourly" | "Daily" | "Weekly"
  const { filters } = useDashboardFilters();
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    Promise.all([
      getData("orders", { orderBy: "created_at DESC" }),
      getData("expenses"),
      getData("menu_items"),
      getData("order_items"),
      getData("inventory_items"),
      getData("tables_floor"),
      getData("journal_entries"),
    ]).then(([orderRows, expenseRows, itemRows, itemSaleRows, inventoryRows, tableRows, jeRows]) => {
      setOrders(orderRows || []);
      setExpenses(expenseRows || []);
      setMenuItems(itemRows || []);
      setOrderItems(itemSaleRows || []);
      setJournalEntries(jeRows || []);
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
      const cleaned = v.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        const parts = cleaned.split('-');
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
      const n = Number(v);
      if (!Number.isNaN(n)) return new Date(n < 1e12 ? n * 1000 : n);
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d;

      const fallback = new Date(cleaned.replace(" ", "T"));
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    return null;
  };

  const getOrderDate = (order) => {
    const candidates = [order?.created_at, order?.createdAt, order?.date, order?.order_date, order?.time];
    for (const value of candidates) {
      if (!value) continue;

      if (typeof value === "string") {
        const direct = parseDate(value);
        if (direct) return direct;

        const timeMatch = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
        if (timeMatch) {
          const now = new Date();
          const hour = Number(timeMatch[1]);
          const minute = Number(timeMatch[2] || 0);
          const period = timeMatch[3]?.toUpperCase();
          const normalizedHour = period === "PM" && hour < 12 ? hour + 12 : period === "AM" && hour === 12 ? 0 : hour;
          const fallback = new Date(now);
          fallback.setHours(normalizedHour, minute, 0, 0);
          return fallback;
        }
      }
    }

    return null;
  };

  const getOrderSaleValue = (order) => {
    const total = Number(order?.total ?? order?.amount ?? 0) || 0;
    const refund = Number(order?.refunded_total ?? order?.refund_amount ?? 0) || 0;
    return Math.max(0, total - refund);
  };

  const formatHourLabel = (hour) => {
    const period = hour < 12 ? "AM" : "PM";
    const normalized = hour % 12 || 12;
    return `${normalized} ${period}`;
  };

  // Monday-start week boundary, used for the "Weekly" trend grouping.
  const startOfWeek = (d) => {
    const nd = new Date(d);
    const day = nd.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    nd.setDate(nd.getDate() + diff);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };

  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

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

  useEffect(() => {
    api.getDashboardSummary?.({ start: dateRange.start, end: dateRange.end }).then(data => {
      setSummaryData(data);
    });
  }, [dateRange]);

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
      if (o.status !== "paid") return false;
      if (!start || !end) return true;
      const d = getOrderDate(o);
      return d && d >= start && d <= end;
    });
  }, [orders, dateRange]);

  const currentSalesTotal = useMemo(
    () => currentOrdersList.reduce((s, o) => s + getOrderSaleValue(o), 0),
    [currentOrdersList]
  );

  const currentExpensesTotal = useMemo(() => {
    const { start, end } = dateRange;
    return expenses
      .filter((e) => {
        if (!start || !end) return true;
        const d = parseDate(e.date);
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
        if (o.status !== "paid") return false;
        const d = getOrderDate(o);
        return d && d >= start && d <= end;
      })
      .reduce((s, o) => s + getOrderSaleValue(o), 0);
  }, [orders, prevDateRange]);

  const salesDelta = currentSalesTotal - prevSalesTotal;
  const salesDeltaPct = prevSalesTotal > 0 ? Math.round((salesDelta / prevSalesTotal) * 100) : 0;
  const cogsEstimate = useMemo(() => {
    const currentOrderIds = new Set(currentOrdersList.map(o => o.id));
    let cost = 0;
    orderItems.forEach(item => {
      if (currentOrderIds.has(item.order_id)) {
        const snapshottedCost = Number(item.cost || 0);
        if (snapshottedCost > 0) {
          cost += snapshottedCost * Number(item.qty || 1);
        } else {
          const mi = menuItems.find(m => String(m.id) === String(item.menu_item_id) || (m.name || "").toLowerCase() === (item.name || "").toLowerCase());
          if (mi && mi.cost) {
            cost += Number(mi.cost) * Number(item.qty || 1);
          } else {
            cost += (Number(item.price || 0) * 0.35) * Number(item.qty || 1);
          }
        }
      }
    });
    return Math.round(cost);
  }, [orderItems, currentOrdersList, menuItems]);

  const taxAndServiceTotal = useMemo(() => {
    return currentOrdersList.reduce((s, o) => s + Number(o.tax || 0) + Number(o.service_charge || 0), 0);
  }, [currentOrdersList]);

  const grossProfit = currentSalesTotal - taxAndServiceTotal - cogsEstimate;
  const netProfit = grossProfit - currentExpensesTotal;
  const avgOrderValue = currentOrdersList.length ? Math.round(currentSalesTotal / currentOrdersList.length) : 0;
  
  // Dynamic calculations from flat journal entries
  const cashPosition = useMemo(() => {
    let debits = 0;
    let credits = 0;
    (journalEntries || []).forEach(je => {
      if (je.account_code === '1001' || je.account_code === '1002') {
        debits += Number(je.debit || 0);
        credits += Number(je.credit || 0);
      }
    });
    return debits - credits;
  }, [journalEntries]);

  const accountsReceivable = useMemo(() => {
    let debits = 0;
    let credits = 0;
    (journalEntries || []).forEach(je => {
      if (je.account_code === '1003') {
        debits += Number(je.debit || 0);
        credits += Number(je.credit || 0);
      }
    });
    return debits - credits;
  }, [journalEntries]);

  const accountsPayable = useMemo(() => {
    let debits = 0;
    let credits = 0;
    (journalEntries || []).forEach(je => {
      if (je.account_code === '2001') {
        debits += Number(je.debit || 0);
        credits += Number(je.credit || 0);
      }
    });
    return credits - debits;
  }, [journalEntries]);


  // ── Kitchen summary ─────────────────────────────────────────────────
  const kitchenSummary = useMemo(() => {
    const pending   = currentOrdersList.filter((o) => o.kitchen_status === "new" || o.status === "new").length;
    const preparing = currentOrdersList.filter((o) => o.kitchen_status === "preparing" || o.status === "preparing").length;
    const ready     = currentOrdersList.filter((o) => ["ready", "served", "completed"].includes(o.kitchen_status || o.status)).length;
    return { pending, preparing, ready };
  }, [currentOrdersList]);

  // ── Sales trend — grouping driven by the Hourly / Daily / Weekly / Monthly toggle ──
  const trendData = useMemo(() => {
    if (trendGranularity === "Hourly") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const hours = Array.from({ length: 24 }, (_, i) => ({
        name: formatHourLabel(i),
        sales: 0,
        orders: 0,
      }));

      orders.forEach((o) => {
        if (o.status !== "paid") return;
        const d = getOrderDate(o);
        if (!d || d < todayStart || d > todayEnd) return;
        const idx = d.getHours();
        if (idx >= 0 && idx < 24) {
          hours[idx].sales += getOrderSaleValue(o);
          hours[idx].orders += 1;
        }
      });
      return hours;
    }

    if (trendGranularity === "Daily") {
      const dailyData = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        dailyData.push({
          name: dayLabel,
          key,
          sales: 0,
          orders: 0,
          _t: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
        });
      }

      orders.forEach((o) => {
        if (o.status !== "paid") return;
        const d = getOrderDate(o);
        if (!d) return;
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const match = dailyData.find((item) => item.key === key);
        if (match) {
          match.sales += getOrderSaleValue(o);
          match.orders += 1;
        }
      });
      return dailyData;
    }

    if (trendGranularity === "Weekly") {
      const weeklyData = [];
      const now = new Date();
      const startOfCurrentWeek = startOfWeek(now);
      
      for (let i = 11; i >= 0; i--) {
        const ws = new Date(startOfCurrentWeek.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const key = ws.getTime();
        weeklyData.push({
          name: `Wk of ${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
          key,
          sales: 0,
          orders: 0,
        });
      }

      orders.forEach((o) => {
        if (o.status !== "paid") return;
        const d = getOrderDate(o);
        if (!d) return;
        const ws = startOfWeek(d);
        const key = ws.getTime();
        const match = weeklyData.find((item) => {
          return Math.abs(item.key - key) < 12 * 60 * 60 * 1000;
        });
        if (match) {
          match.sales += getOrderSaleValue(o);
          match.orders += 1;
        }
      });
      return weeklyData;
    }

    if (trendGranularity === "Monthly") {
      const monthlyData = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyData.push({
          name: monthLabel,
          key,
          sales: 0,
          orders: 0,
        });
      }

      orders.forEach((o) => {
        if (o.status !== "paid") return;
        const d = getOrderDate(o);
        if (!d) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const match = monthlyData.find((item) => item.key === key);
        if (match) {
          match.sales += getOrderSaleValue(o);
          match.orders += 1;
        }
      });
      return monthlyData;
    }

    return [];
  }, [orders, trendGranularity]);
  const hasTrendData = trendData.some((h) => h.sales > 0);

  const trendTitle = useMemo(() => {
    if (trendGranularity === "Hourly") return "Today's Hourly Sales Trend";
    if (trendGranularity === "Daily") return "Last 30 Days Daily Sales Trend";
    if (trendGranularity === "Weekly") return "Last 12 Weeks Sales Trend";
    if (trendGranularity === "Monthly") return "Last 12 Months Sales Trend";
    return "Sales Trend";
  }, [trendGranularity]);

  const trendSubtitle = useMemo(() => {
    if (trendGranularity === "Hourly") return "Hourly breakdown for today";
    if (trendGranularity === "Daily") return "Daily trend (independent of topbar range filter)";
    if (trendGranularity === "Weekly") return "Weekly trend (independent of topbar range filter)";
    if (trendGranularity === "Monthly") return "Monthly trend (independent of topbar range filter)";
    return "Sales trend view";
  }, [trendGranularity]);
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
    const allHours = Array.from({ length: 24 }, (_, i) => ({ hour: i, name: formatHourLabel(i), orders: 0 }));
    currentOrdersList.forEach((o) => {
      const d = getOrderDate(o);
      if (!d) return;
      const idx = d.getHours();
      if (idx >= 0 && idx < allHours.length) allHours[idx].orders += 1;
    });

    // Filter for business hours (8 AM - 11 PM)
    const businessHours = allHours.filter((h) => h.hour >= 8 && h.hour <= 23);
    const maxOrders = Math.max(...businessHours.map((h) => h.orders), 1);
    
    return businessHours.map((hour) => ({
      ...hour,
      isPeak: hour.orders >= maxOrders * 0.7,
    }));
  }, [currentOrdersList]);

  const hasPeakData = peakHourData.some((h) => h.orders > 0);
  
  const peakStats = useMemo(() => {
    if (!hasPeakData) return { peak: null, busiest: 0 };
    const busiest = peakHourData.reduce((max, h) => (h.orders > max.orders ? h : max));
    const peak = peakHourData.filter((h) => h.isPeak);
    return { peak, busiest };
  }, [peakHourData, hasPeakData]);

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
          <button onClick={() => navigate('/expenses')} className="bg-white p-3 rounded-xl shadow-soft border border-canvas-200 text-sm">Expense</button>
          <button onClick={() => navigate('/purchases')} className="bg-white p-3 rounded-xl shadow-soft border border-canvas-200 text-sm">Purchase</button>
          <button onClick={() => navigate('/pos')} className="bg-paprika-500 text-white p-3 rounded-xl shadow-soft text-sm">New Order</button>
        </div>
      </div>

      {/* 6 stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border-l-4 border-l-paprika-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-paprika-50 text-paprika-600 rounded-lg flex items-center justify-center text-xs">dY'</span>
            <span className="text-xs font-bold text-paprika-600">+{Math.max(0, salesDeltaPct)}%</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Total Revenue</p>
          <p className="font-display text-2xl font-semibold text-ink-900 truncate">Rs. {formatShort(summaryData?.totalRevenue ?? currentSalesTotal)}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-paprika-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-paprika-50 text-paprika-600 rounded-lg flex items-center justify-center text-xs">dY'</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Real COGS</p>
          <p className="font-display text-2xl font-semibold text-ink-900 truncate">Rs. {formatShort(cogsEstimate)}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-paprika-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-paprika-50 text-paprika-600 rounded-lg flex items-center justify-center text-xs">dY'</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Gross Profit</p>
          <p className="font-display text-2xl font-semibold text-ink-900 truncate">Rs. {formatShort(grossProfit)}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-paprika-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-paprika-600 text-white rounded-lg flex items-center justify-center text-xs shadow-sm">dY'</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Net Profit</p>
          <p className="font-display text-2xl font-semibold text-paprika-600 truncate">Rs. {formatShort(netProfit)}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-ink-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-ink-50 text-ink-600 rounded-lg flex items-center justify-center text-xs">dY'"</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Cash Position</p>
          <p className="font-display text-2xl font-semibold text-ink-900 truncate">Rs. {formatShort(summaryData?.cashPosition ?? cashPosition)}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-ink-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-ink-50 text-ink-600 rounded-lg flex items-center justify-center text-xs">dY'</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Accounts Receivable</p>
          <p className="font-display text-2xl font-semibold text-ink-900 truncate">Rs. {formatShort(summaryData?.accountsReceivable ?? accountsReceivable)}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-ink-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-ink-50 text-ink-600 rounded-lg flex items-center justify-center text-xs">dY'</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Accounts Payable</p>
          <p className="font-display text-2xl font-semibold text-ink-900 truncate">Rs. {formatShort(summaryData?.accountsPayable ?? accountsPayable)}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-ink-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className="h-7 w-7 bg-ink-50 text-ink-600 rounded-lg flex items-center justify-center text-xs">dY'^</span>
          </div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mt-1">Operating Expenses</p>
          <p className="font-display text-2xl font-semibold text-ink-900 truncate">Rs. {formatShort(currentExpensesTotal)}</p>
        </div>
      </div>
      {/* Charts */}
      <Suspense fallback={<div className="h-[450px] w-full bg-canvas-100 rounded-xl2 animate-pulse mb-8" />}>
        <LazyCharts
          trendTitle={trendTitle}
          trendSubtitle={trendSubtitle}
          trendGranularity={trendGranularity}
          setTrendGranularity={setTrendGranularity}
          trendData={trendData}
          hasTrendData={hasTrendData}
          paymentData={summaryData?.revenueByPaymentMethod ?? paymentData}
        />
      </Suspense>

      {/* Operational Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-canvas-100 border border-canvas-200 p-6 rounded-xl2 shadow-soft border-t-4 border-t-paprika-500">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-error">⚠️</span>
            <h3 className="text-lg font-semibold">Inventory Alerts</h3>
          </div>
          <div className="space-y-3">
            {lowStock.slice(0,3).map((it) => (
              <div key={it.id} className="flex justify-between items-center p-3 rounded-xl border border-canvas-200 bg-[rgb(var(--surface-card))] shadow-xs">
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

        <div className="lg:col-span-2 bg-canvas-100 border border-canvas-200 p-6 rounded-xl2 shadow-soft">
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
            <div className="p-3 rounded-xl border border-canvas-200 bg-[rgb(var(--surface-card))] shadow-xs text-center"> <p className="text-xs">Pending</p><p className="text-2xl font-bold">{kitchenSummary.pending}</p></div>
            <div className="p-3 rounded-xl border border-canvas-200 bg-[rgb(var(--surface-card))] shadow-xs text-center"> <p className="text-xs">Preparing</p><p className="text-2xl font-bold">{kitchenSummary.preparing}</p></div>
            <div className="p-3 rounded-xl border border-canvas-200 bg-[rgb(var(--surface-card))] shadow-xs text-center"> <p className="text-xs">Ready</p><p className="text-2xl font-bold">{kitchenSummary.ready}</p></div>
            <div className="p-3 rounded-xl border border-canvas-200 bg-[rgb(var(--surface-card))] shadow-xs text-center"> <p className="text-xs">Delayed</p><p className="text-2xl font-bold text-paprika-500">0</p></div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {tables.slice(0,10).map((t) => (
              <div key={t.id} className={`aspect-square rounded-xl border-2 flex items-center justify-center text-xs font-bold transition-all shadow-sm ${t.status === 'occupied' ? 'bg-paprika-500 border-paprika-600 text-white shadow-paprika-500/20' : 'bg-[rgb(var(--surface-card))] border-canvas-200 text-ink-700 hover:border-canvas-300'}`}>{t.id}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <div className="bg-canvas-100 border border-canvas-200 p-6 rounded-xl2 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {topItemsWithImage.map((it) => (
              <div key={it.name} className="flex items-center justify-between p-3 rounded-xl border border-canvas-200 bg-[rgb(var(--surface-card))] shadow-xs hover:border-paprika-400 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-canvas-100 border border-canvas-200">
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

        <div className="bg-canvas-100 border border-canvas-200 p-6 rounded-xl2 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-semibold">Peak Hours Activity</h3>
              <p className="text-xs text-ink-500 mt-1">Business hours: 8 AM – 11 PM</p>
            </div>
            {hasPeakData && peakStats.busiest && (
              <div className="text-right">
                <p className="text-xs text-ink-500">Busiest hour</p>
                <p className="text-sm font-bold text-paprika-600">{peakStats.busiest.name}</p>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            {hasPeakData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={peakHourData}
                  margin={{ top: 20, right: 8, left: 0, bottom: 8 }}
                  barCategoryGap="8%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#4E5661" }}
                    axisLine={{ stroke: "#E4E7EA" }}
                    tickLine={false}
                  />
                  <YAxis
                    hide={false}
                    tick={{ fontSize: 10, fill: "#4E5661" }}
                    axisLine={{ stroke: "#E4E7EA" }}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{
                      backgroundColor: "rgb(var(--surface-card))",
                      borderColor: "rgb(var(--border-default))",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "rgb(var(--text-base))"
                    }}
                    labelStyle={{ color: 'rgb(var(--text-muted))', fontWeight: 'bold' }}
                    itemStyle={{ color: 'rgb(var(--color-primary-500))' }}
                    formatter={(value) => [value, "Orders"]}
                  />
                  <Bar
                    dataKey="orders"
                    fill="rgb(var(--color-primary-500))"
                    radius={[4, 4, 0, 0]}
                    shape={(props) => {
                      const { x, y, width, height, payload } = props;
                      return (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={payload.isPeak ? "rgb(var(--color-primary-500))" : "rgb(var(--border-default))"}
                            rx={4}
                            ry={4}
                          />
                        </g>
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-ink-400 gap-3">
                <Clock3 size={28} className="opacity-30" />
                <p className="text-sm">No peak hour data available</p>
              </div>
            )}
          </div>

          {hasPeakData && peakStats.peak.length > 0 && (
            <div className="mt-4 p-3 bg-paprika-50 rounded-lg border border-paprika-200">
              <p className="text-xs text-ink-600">
                <span className="font-semibold">Peak hours:</span> {peakStats.peak.map((h) => h.name).join(", ")}
              </p>
            </div>
          )}

          <p className="text-center text-xs text-ink-500 mt-4">Recommend increasing staff during peak activity hours</p>
        </div>
      </div>
    </main>
  );
}