import DatePicker from "../components/ui/DatePicker";
import { useEffect, useMemo, useState } from "react";
import {
  Receipt as ReceiptIcon, Undo2, Wallet, TrendingUp, Calendar,
  AlertTriangle, CheckCircle2, ArrowLeftRight, PackageX, SlidersHorizontal,
  Search, FileEdit, Trash2
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Badge, { statusTone } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ReceiptView from "../components/pos/Receipt";
import ModuleTable from "../components/ui/ModuleTable";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import { useDataCache } from "../context/DataCacheContext";

const RETURN_REASONS = [
  "Customer complaint",
  "Wrong item served",
  "Quality issue",
  "Order changed",
  "Duplicate charge",
  "Other",
];

const STATUS_OPTIONS = ["All", "paid", "served", "completed"];

const COLUMNS_STORAGE_KEY = "sales_visible_columns_v1";
const SHORTCUTS = [
  { label: "Open filters", keys: ["F"] },
  { label: "Toggle search", keys: ["/"] },
  { label: "Open shortcuts", keys: ["?"] },
];

const COLUMN_DEFS = [
  { key: "id", header: "Order", sortKey: "id", alwaysVisible: true, render: (r) => <span className="font-mono text-xs font-bold">{r.id}</span> },
  { key: "time", header: "Date & Time", sortKey: "created_at", render: (r) => formatDateTime(r.created_at, r.time).datePart + " " + formatDateTime(r.created_at, r.time).timePart },
  { key: "customer", header: "Customer", sortKey: "customer" },
  { key: "type", header: "Type", sortKey: "type" },
  { key: "waiter", header: "Cashier", sortKey: "waiter" },
  { key: "payment_method", header: "Payment", sortKey: "payment_method" },
  { key: "total", header: "Total", sortKey: "total", align: "right", render: (r) => (
      <div className="text-right">
        <span className="font-mono font-semibold">Rs. {r.total.toLocaleString()}</span>
        {r.refunded_total > 0 && <div className="text-[11px] text-paprika-600 font-medium">- Rs. {r.refunded_total.toLocaleString()} refunded</div>}
      </div>
  )},
  { key: "status", header: "Status", sortKey: "status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">{label}</p>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider text-ink-500 pb-1 border-b border-canvas-200 mb-3">
      {children}
    </p>
  );
}

function formatDateTime(iso, fallbackTime) {
  if (!iso) return fallbackTime || "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallbackTime || "—";
  const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { datePart, timePart };
}

export default function Sales({ onNewSale }) {
  const { getData, cacheTick } = useDataCache();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedReturns, setSelectedReturns] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnQtys, setReturnQtys] = useState({});
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [restock, setRestock] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItems, setAdjustItems] = useState([]);
  const [autoTendered, setAutoTendered] = useState(true);
  const [adjustForm, setAdjustForm] = useState({
    discount_percent: 0, discount_reason: "", tax: 0, service_charge: 0,
    payment_method: "Cash", tendered: 0, change_due: 0, status: "paid", payment_details: "",
  });
  const [menuSearch, setMenuSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { getDateRange } = useDashboardFilters();

  const load = () => {
    getData("orders", { orderBy: "created_at DESC" }).then((rows) =>
      setOrders(rows.filter((o) => ["paid", "served", "completed"].includes(o.status)))
    );
    getData("sales_returns").then(setReturns);
    api.getSetting("restaurant_profile").then(setProfile);
    getData("menu_items").then(setMenuItems);
  };

  useEffect(() => { void load(); }, [cacheTick]);



  const todayTotal = orders.reduce((s, o) => s + o.total - (o.refunded_total || 0), 0);
  const totalRefunded = returns.reduce((s, r) => s + r.amount, 0);
  const returnCount = returns.filter((r) => r.kind === "return").length;
  const adjustCount = returns.filter((r) => r.kind === "adjustment").length;

  const typeOptions = useMemo(() => ["All", ...new Set(orders.map((o) => o.type).filter(Boolean))], [orders]);
  const paymentOptions = useMemo(() => ["All", ...new Set(orders.map((o) => o.payment_method).filter(Boolean))], [orders]);

  const activeFilterCount = [statusFilter !== "All", typeFilter !== "All", paymentFilter !== "All"].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("All"); setTypeFilter("All"); setPaymentFilter("All");
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const globalRange = getDateRange();

    return orders.filter((o) => {
      const matchesQuery = !q
        || o.id.toLowerCase().includes(q)
        || (o.customer || "").toLowerCase().includes(q)
        || (o.waiter || "").toLowerCase().includes(q)
        || (o.payment_method || "").toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (typeFilter !== "All" && o.type !== typeFilter) return false;
      if (paymentFilter !== "All" && o.payment_method !== paymentFilter) return false;
      
      const d = o.created_at ? new Date(o.created_at) : null;
      if (dateFrom || dateTo) {
        if (!d) return false;
        if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
      } else if (globalRange.start && globalRange.end) {
        if (!d) return false;
        if (d < globalRange.start || d > globalRange.end) return false;
      }
      return true;
    });
  }, [orders, query, statusFilter, typeFilter, paymentFilter, dateFrom, dateTo, getDateRange]);



  const openSale = async (order) => {
    const [items, rets] = await Promise.all([
      api.list("order_items", { where: { order_id: order.id } }),
      api.list("sales_returns", { where: { order_id: order.id } }),
    ]);
    setSelected(order);
    setSelectedItems(items);
    setSelectedReturns(rets);
  };

  const viewReceipt = async (order) => {
    const [items, rets] = await Promise.all([
      api.list("order_items", { where: { order_id: order.id } }),
      api.list("sales_returns", { where: { order_id: order.id } }),
    ]);
    setReceiptData({ order, items, rets });
  };

  // ── RETURN ──────────────────────────────────────────────────────────────────
  const openReturn = () => {
    setReturnQtys({});
    setReturnReason(RETURN_REASONS[0]);
    setRestock(true);
    setReturnOpen(true);
  };

  const returnableQty = (item) => {
    const alreadyReturned = selectedReturns
      .flatMap((r) => JSON.parse(r.items || "[]"))
      .filter((it) => it.menu_item_id === item.menu_item_id)
      .reduce((s, it) => s + it.qty, 0);
    return Math.max(0, item.qty - alreadyReturned);
  };

  const returnTotal = useMemo(() =>
    selectedItems.reduce((s, it, idx) => s + Number(returnQtys[idx] || 0) * it.price, 0),
    [returnQtys, selectedItems]
  );

  const submitReturn = async () => {
    const items = selectedItems
      .map((it, idx) => ({ menu_item_id: it.menu_item_id, name: it.name, price: it.price, qty: Number(returnQtys[idx] || 0) }))
      .filter((it) => it.qty > 0);
    if (items.length === 0) return;
    const result = await api.processReturn(selected.id, { items, reason: returnReason, restock, kind: "return" }, { user: user?.name });
    setReturnOpen(false);
    load();
    await openSale(result.order || selected);
  };

  // ── ADJUSTMENT ──────────────────────────────────────────────────────────────
  const calcAdjustTotals = (items, form, useAutoTendered) => {
    const subtotal = items.reduce((s, it) => s + Number(it.qty) * Number(it.price), 0);
    const disc = Math.round((subtotal * Number(form.discount_percent || 0)) / 100);
    const total = subtotal - disc + Number(form.tax || 0) + Number(form.service_charge || 0);
    const effectiveTendered = useAutoTendered ? total : Number(form.tendered || 0);
    return {
      subtotal,
      discountAmount: disc,
      total,
      tendered: effectiveTendered,
      change_due: Math.max(0, effectiveTendered - total),
    };
  };

  const openAdjust = () => {
    const items = selectedItems.map((it) => ({ ...it }));
    const isAutoTendered = !selected.tendered || Number(selected.tendered) === Number(selected.total);
    const form = {
      discount_percent: Number(selected.discount_percent || 0),
      discount_reason: selected.discount_reason || "",
      tax: Number(selected.tax || 0),
      service_charge: Number(selected.service_charge || 0),
      payment_method: selected.payment_method || "Cash",
      tendered: Number(selected.total || 0),
      change_due: 0,
      status: selected.status,
      payment_details: selected.payment_details || "",
    };
    setAutoTendered(isAutoTendered);
    setAdjustItems(items);
    setAdjustForm(form);
    setMenuSearch("");
    setAdjustOpen(true);
  };

  const updateAdjustItem = (idx, field, val) => {
    setAdjustItems((prev) => {
      const next = prev.map((it, i) =>
        i === idx ? { ...it, [field]: field === "qty" || field === "price" ? Number(val) : val } : it
      );
      const totals = calcAdjustTotals(next, adjustForm, autoTendered);
      setAdjustForm((f) => ({ ...f, tendered: totals.tendered, change_due: totals.change_due }));
      return next;
    });
  };

  const updateAdjustForm = (field, val) => {
    if (field === "tendered") {
      // User manually entered tendered → lock auto mode
      setAutoTendered(false);
      setAdjustForm((prev) => {
        const next = { ...prev, tendered: Number(val) };
        const change_due = Math.max(0, Number(val) - calcAdjustTotals(adjustItems, next, false).total);
        return { ...next, change_due };
      });
      return;
    }
    setAdjustForm((prev) => {
      const next = { ...prev, [field]: ["discount_percent", "tax", "service_charge"].includes(field) ? Number(val) : val };
      const totals = calcAdjustTotals(adjustItems, next, autoTendered);
      return { ...next, tendered: totals.tendered, change_due: totals.change_due };
    });
  };

  const removeAdjustItem = (idx) => {
    setAdjustItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      const totals = calcAdjustTotals(next, adjustForm, autoTendered);
      setAdjustForm((f) => ({ ...f, tendered: totals.tendered, change_due: totals.change_due }));
      return next;
    });
  };

  const addMenuItemToAdjust = (item) => {
    setAdjustItems((prev) => {
      const existing = prev.find((it) => it.menu_item_id === item.id);
      const next = existing
        ? prev.map((it) => it.menu_item_id === item.id ? { ...it, qty: it.qty + 1 } : it)
        : [...prev, { id: null, menu_item_id: item.id, name: item.name, qty: 1, price: item.price, notes: "" }];
      const totals = calcAdjustTotals(next, adjustForm, autoTendered);
      setAdjustForm((f) => ({ ...f, tendered: totals.tendered, change_due: totals.change_due }));
      return next;
    });
  };

  const saveAdjustment = async () => {
    if (!selected) return;
    const { subtotal, discountAmount, total, tendered, change_due } = calcAdjustTotals(adjustItems, adjustForm, autoTendered);
    const items = adjustItems.filter((it) => Number(it.qty) > 0).map((it) => ({
      id: it.id, order_id: selected.id, menu_item_id: it.menu_item_id,
      name: it.name, qty: Number(it.qty), price: Number(it.price), notes: it.notes || "",
    }));
    const orderUpdates = {
      status: adjustForm.status, payment_method: adjustForm.payment_method,
      payment_details: adjustForm.payment_details || null,
      tendered: autoTendered ? total : adjustForm.tendered,
      change_due,
      subtotal, discount_percent: adjustForm.discount_percent,
      discount_reason: adjustForm.discount_reason || null, tax: adjustForm.tax,
      service_charge: adjustForm.service_charge, total,
      items_count: items.reduce((s, it) => s + it.qty, 0),
      kitchen_status: ["served", "completed"].includes(adjustForm.status) ? "served" : (selected.kitchen_status || "new"),
    };
    const updated = await api.updateOrderWithItems(selected.id, orderUpdates, items);
    setAdjustOpen(false);
    await openSale(updated);
    load();
  };

  const filteredMenu = useMemo(() => {
    const q = menuSearch.toLowerCase().trim();
    if (!q) return menuItems.slice(0, 12);
    return menuItems.filter((m) => m.name.toLowerCase().includes(q) || (m.category || "").toLowerCase().includes(q)).slice(0, 12);
  }, [menuSearch, menuItems]);

  const adjTotals = useMemo(() => calcAdjustTotals(adjustItems, adjustForm, autoTendered), [adjustItems, adjustForm, autoTendered]);

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Sales"
        description="Completed transactions, returns, and post-sale adjustments."
      />

      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Net Sales" value={`Rs. ${todayTotal.toLocaleString()}`} icon={Wallet} sub={`${orders.length} completed`} />
        <StatCard label="Total Refunded" value={`Rs. ${totalRefunded.toLocaleString()}`} icon={Undo2} sub={`${returnCount} returns`} />
        <StatCard label="Adjustments" value={adjustCount} icon={SlidersHorizontal} sub="Post-sale corrections" />
        <StatCard label="Avg. Ticket" value={`Rs. ${orders.length ? Math.round(todayTotal / orders.length).toLocaleString() : 0}`} icon={TrendingUp} />
      </div> */}

      <ModuleTable
        columns={COLUMN_DEFS}
        data={filtered}
        onRowClick={openSale}
        storageKey={COLUMNS_STORAGE_KEY}
        searchPlaceholder="Search order, customer, staff…"
        searchValue={query}
        onSearchChange={setQuery}
        emptyLabel={orders.length === 0 ? "No completed sales yet." : "No orders match your search or filters."}
        activeFilterCount={activeFilterCount + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
        onClearFilters={() => { clearFilters(); setDateFrom(""); setDateTo(""); }}
        actions={
          onNewSale && (
            <Button variant="primary" onClick={onNewSale}>+ New Sale</Button>
          )
        }
        filterContent={
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="From date">
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <DatePicker   value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </Field>
            <Field label="To date">
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <DatePicker   value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </Field>
            <Field label="Status">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
              </select>
            </Field>
            <Field label="Order type">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                {typeOptions.map((t) => <option key={t} value={t}>{t === "All" ? "All types" : t}</option>)}
              </select>
            </Field>
            <Field label="Payment method">
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                {paymentOptions.map((p) => <option key={p} value={p}>{p === "All" ? "All methods" : p}</option>)}
              </select>
            </Field>
          </div>
        }
      />

      {/* ── SALE DETAIL ───────────────────────────────────────────────────────── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Sale ${selected.id}` : ""} width="max-w-2xl"
        footer={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" icon={ReceiptIcon} onClick={() => selected && viewReceipt(selected)}>Receipt</Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" icon={ArrowLeftRight} onClick={openAdjust}>Adjust / Replace</Button>
            <Button variant="danger" size="sm" icon={PackageX} onClick={openReturn}>Process Return</Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[["Customer", selected.customer||"Walk-in"],["Type",selected.type],["Cashier",selected.waiter],["Payment",selected.payment_method||"—"]].map(([l,v])=>(
                <div key={l}><p className="text-[11px] font-semibold text-ink-500 uppercase">{l}</p><p className="font-medium text-ink-900 mt-0.5">{v}</p></div>
              ))}
            </div>
            <div>
              <SectionTitle>Order Items</SectionTitle>
              <div className="rounded-xl border border-canvas-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500">
                    <tr><th className="text-left px-3 py-2.5">Item</th><th className="text-right px-3 py-2.5">Qty</th><th className="text-right px-3 py-2.5">Price</th><th className="text-right px-3 py-2.5">Total</th></tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((it) => (
                      <tr key={it.id} className="border-t border-canvas-100 hover:bg-canvas-50">
                        <td className="px-3 py-2.5"><p className="font-medium text-ink-900">{it.name}</p>{it.notes && <p className="text-[11px] text-paprika-600 mt-0.5">🌶️ {it.notes}</p>}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{it.qty}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink-600">Rs. {it.price.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold">Rs. {(it.qty*it.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {selected.discount_percent > 0 && <div className="flex justify-between text-ink-500"><span>Discount ({selected.discount_percent}%)</span><span className="font-mono text-basil-600">- Rs. {Math.round((selected.subtotal*selected.discount_percent)/100).toLocaleString()}</span></div>}
                {selected.tax > 0 && <div className="flex justify-between text-ink-500"><span>Tax</span><span className="font-mono">Rs. {selected.tax.toLocaleString()}</span></div>}
                {selected.service_charge > 0 && <div className="flex justify-between text-ink-500"><span>Service charge</span><span className="font-mono">Rs. {selected.service_charge.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-ink-900 pt-1 border-t border-canvas-200"><span>Total</span><span className="font-mono">Rs. {selected.total.toLocaleString()}</span></div>
                {selected.refunded_total > 0 && <div className="flex justify-between text-paprika-600 font-medium"><span>Refunded</span><span className="font-mono">- Rs. {selected.refunded_total.toLocaleString()}</span></div>}
              </div>
            </div>
            {selectedReturns.length > 0 && (
              <div>
                <SectionTitle>Transaction History</SectionTitle>
                <div className="space-y-2">
                  {selectedReturns.map((r) => (
                    <div key={r.id} className={`flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-sm border ${r.kind==="adjustment"?"bg-saffron-50 border-saffron-200":"bg-paprika-50 border-paprika-200"}`}>
                      <div className="flex items-center gap-2">
                        {r.kind==="adjustment" ? <SlidersHorizontal size={13} className="text-saffron-600 shrink-0"/> : <PackageX size={13} className="text-paprika-600 shrink-0"/>}
                        <div>
                          <p className={`text-xs font-semibold ${r.kind==="adjustment"?"text-saffron-800":"text-paprika-800"}`}>{r.kind==="adjustment"?"Adjustment":"Return"} · {r.reason}</p>
                          <p className="text-[11px] text-ink-400">{r.time}{r.restock?" · restocked":""}</p>
                        </div>
                      </div>
                      <span className={`font-mono text-sm font-bold shrink-0 ${r.kind==="adjustment"?"text-saffron-700":"text-paprika-700"}`}>- Rs. {r.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── RETURN MODAL ─────────────────────────────────────────────────────── */}
      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Process Return" width="max-w-lg"
        footer={<><Button variant="secondary" onClick={() => setReturnOpen(false)}>Cancel</Button><Button variant="danger" icon={CheckCircle2} onClick={submitReturn} disabled={returnTotal===0}>Confirm Return · Rs. {returnTotal.toLocaleString()}</Button></>}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-xl bg-paprika-50 border border-paprika-200 p-3">
            <AlertTriangle size={16} className="text-paprika-500 shrink-0 mt-0.5" />
            <p className="text-xs text-paprika-800">Returning items will reduce refundable quantity and log an entry in transaction history. Partial returns are allowed.</p>
          </div>
          <div>
            <SectionTitle>Select Items to Return</SectionTitle>
            <div className="space-y-2">
              {selectedItems.map((it, idx) => {
                const maxQty = returnableQty(it);
                const qty = Number(returnQtys[idx] || 0);
                return (
                  <div key={it.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${qty>0?"border-paprika-300 bg-paprika-50":"border-canvas-200 bg-white"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{it.name}</p>
                      <p className="text-[11px] text-ink-400 mt-0.5">Rs. {it.price.toLocaleString()} each · <span className={maxQty===0?"text-paprika-500 font-medium":""}>{maxQty} returnable</span></p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-canvas-200 rounded-lg px-1.5 py-1 shadow-soft">
                      <button onClick={() => setReturnQtys((q) => ({...q,[idx]:Math.max(0,(Number(q[idx])||0)-1)}))} disabled={maxQty===0||qty===0} className="h-6 w-6 flex items-center justify-center text-ink-600 disabled:opacity-30 hover:text-paprika-600 font-bold text-lg">−</button>
                      <span className="w-6 text-center text-sm font-mono font-bold text-ink-900">{qty}</span>
                      <button onClick={() => setReturnQtys((q) => ({...q,[idx]:Math.min(maxQty,(Number(q[idx])||0)+1)}))} disabled={maxQty===0||qty>=maxQty} className="h-6 w-6 flex items-center justify-center text-ink-600 disabled:opacity-30 hover:text-basil-600 font-bold text-lg">+</button>
                    </div>
                    {qty>0 && <span className="text-sm font-mono font-semibold text-paprika-600 shrink-0 w-24 text-right">- Rs. {(qty*it.price).toLocaleString()}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Return Reason">
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30">
                {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Inventory">
              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="rounded accent-basil-500" />
                <span className="text-sm text-ink-700">Restock items to inventory</span>
              </label>
            </Field>
          </div>
          {returnTotal > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-paprika-600 px-4 py-3">
              <p className="text-sm font-semibold text-white">Refund Amount</p>
              <p className="font-mono font-bold text-xl text-white">Rs. {returnTotal.toLocaleString()}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ── ADJUSTMENT MODAL ─────────────────────────────────────────────────── */}
      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title={selected ? `Adjust Sale · ${selected.id}` : "Adjust Sale"} width="max-w-3xl"
        footer={<><Button variant="secondary" onClick={() => setAdjustOpen(false)}>Cancel</Button><Button variant="primary" icon={FileEdit} onClick={saveAdjustment}>Save Adjustment</Button></>}
      >
        <div className="space-y-6 text-sm">
          <div className="flex items-start gap-2.5 rounded-xl bg-saffron-50 border border-saffron-200 p-3">
            <SlidersHorizontal size={15} className="text-saffron-600 shrink-0 mt-0.5" />
            <p className="text-xs text-saffron-900">Use this to <strong>correct errors</strong>, <strong>swap items</strong>, or <strong>reprocess payment</strong>. All changes are saved to the original order.</p>
          </div>

          <div>
            <SectionTitle>Add Items from Menu</SectionTitle>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Search menu by name or category…" className="w-full rounded-lg border border-canvas-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1 sales-scroll">
              {filteredMenu.map((item) => (
                <button key={item.id} type="button" onClick={() => addMenuItemToAdjust(item)} className="rounded-xl border border-canvas-200 bg-white p-2.5 text-left hover:border-basil-400 hover:bg-basil-50 transition-colors">
                  <div className="text-sm font-semibold text-ink-900 truncate">{item.name}</div>
                  <div className="text-[11px] text-ink-400 mt-0.5">{item.category}</div>
                  <div className="mt-1 font-mono text-xs font-bold text-basil-600">Rs. {item.price?.toLocaleString()}</div>
                </button>
              ))}
              {filteredMenu.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-canvas-200 p-4 text-sm text-ink-400 text-center">No items found</div>}
            </div>
          </div>

          <div>
            <SectionTitle>Order Lines</SectionTitle>
            <div className="rounded-xl border border-canvas-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500">
                  <tr><th className="px-3 py-2.5 text-left">Item / Notes</th><th className="px-3 py-2.5 text-right w-20">Qty</th><th className="px-3 py-2.5 text-right w-24">Price</th><th className="px-3 py-2.5 text-right w-24">Total</th><th className="px-3 py-2.5 w-10"></th></tr>
                </thead>
                <tbody>
                  {adjustItems.map((item, idx) => (
                    <tr key={`${item.id||"new"}-${idx}`} className="border-t border-canvas-100">
                      <td className="px-3 py-2">
                        <input type="text" value={item.name} onChange={(e) => updateAdjustItem(idx,"name",e.target.value)} className="w-full rounded-lg border border-canvas-200 bg-white px-2.5 py-1.5 text-sm font-medium outline-none focus:ring-1 focus:ring-paprika-400" />
                        <input type="text" value={item.notes||""} onChange={(e) => updateAdjustItem(idx,"notes",e.target.value)} placeholder="Special instructions…" className="mt-1 w-full rounded-lg border border-canvas-100 bg-canvas-50 px-2.5 py-1 text-[11px] text-ink-500 outline-none focus:ring-1 focus:ring-paprika-300" />
                      </td>
                      <td className="px-3 py-2 text-right"><input type="number" min={0} value={item.qty} onChange={(e) => updateAdjustItem(idx,"qty",e.target.value)} className="w-16 rounded-lg border border-canvas-200 bg-white px-2 py-1.5 text-sm text-right font-mono outline-none focus:ring-1 focus:ring-paprika-400" /></td>
                      <td className="px-3 py-2 text-right"><input type="number" min={0} value={item.price} onChange={(e) => updateAdjustItem(idx,"price",e.target.value)} className="w-20 rounded-lg border border-canvas-200 bg-white px-2 py-1.5 text-sm text-right font-mono outline-none focus:ring-1 focus:ring-paprika-400" /></td>
                      <td className="px-3 py-2 text-right font-mono text-ink-700">Rs. {(Number(item.qty)*Number(item.price)).toLocaleString()}</td>
                      <td className="px-3 py-2 text-center"><button onClick={() => removeAdjustItem(idx)} className="h-7 w-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-paprika-600 hover:bg-paprika-50 transition-colors"><Trash2 size={13}/></button></td>
                    </tr>
                  ))}
                  {adjustItems.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-400 text-sm italic">No items — add from menu above</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <SectionTitle>Payment & Charges</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Payment Method"><select value={adjustForm.payment_method} onChange={(e) => updateAdjustForm("payment_method",e.target.value)} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30">{["Cash","Card","Wallet","Credit","Split"].map((m)=><option key={m}>{m}</option>)}</select></Field>
              <Field label="Status"><select value={adjustForm.status} onChange={(e) => updateAdjustForm("status",e.target.value)} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30">{[["paid","Paid"],["served","Served"],["completed","Completed"],["cancelled","Cancelled"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
              <Field label="Discount %"><input type="number" min={0} max={100} value={adjustForm.discount_percent} onChange={(e) => updateAdjustForm("discount_percent",e.target.value)} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" /></Field>
              <Field label="Discount Note"><input type="text" value={adjustForm.discount_reason} onChange={(e) => updateAdjustForm("discount_reason",e.target.value)} placeholder="e.g. VIP customer" className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" /></Field>
              <Field label="Tax (Rs.)"><input type="number" min={0} value={adjustForm.tax} onChange={(e) => updateAdjustForm("tax",e.target.value)} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" /></Field>
              <Field label="Service Charge (Rs.)"><input type="number" min={0} value={adjustForm.service_charge} onChange={(e) => updateAdjustForm("service_charge",e.target.value)} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" /></Field>
              <Field label="Tendered (Rs.)">
                <div className="mt-1 flex gap-1.5 items-center">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      value={autoTendered ? adjTotals.total : adjustForm.tendered}
                      onChange={(e) => updateAdjustForm("tendered", e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 font-mono ${
                        autoTendered ? "border-basil-400 bg-basil-50 text-basil-800" : "border-canvas-200 bg-white"
                      }`}
                    />
                    {autoTendered && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-basil-600 bg-basil-100 px-1.5 py-0.5 rounded-full pointer-events-none">
                        AUTO
                      </span>
                    )}
                  </div>
                  {!autoTendered && (
                    <button
                      type="button"
                      onClick={() => { setAutoTendered(true); }}
                      className="shrink-0 text-[11px] font-semibold text-basil-600 border border-basil-400 bg-basil-50 hover:bg-basil-100 px-2 py-2 rounded-lg transition-colors whitespace-nowrap"
                      title="Reset tendered to match the new total"
                    >
                      Match Total
                    </button>
                  )}
                </div>
                {!autoTendered && adjTotals.change_due > 0 && (
                  <p className="mt-1 text-[11px] text-basil-700 font-medium">Change due: Rs. {adjTotals.change_due.toLocaleString()}</p>
                )}
              </Field>
              <Field label="Payment Notes"><input type="text" value={adjustForm.payment_details} onChange={(e) => updateAdjustForm("payment_details",e.target.value)} placeholder="Transaction ID, split detail…" className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" /></Field>
            </div>
          </div>

          <div className="rounded-xl bg-[rgb(var(--surface-sidebar))] text-white px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm text-white/70"><span>Subtotal</span><span className="font-mono">Rs. {adjTotals.subtotal.toLocaleString()}</span></div>
            {adjustForm.discount_percent > 0 && <div className="flex justify-between text-sm text-basil-300"><span>Discount ({adjustForm.discount_percent}%)</span><span className="font-mono">- Rs. {adjTotals.discountAmount.toLocaleString()}</span></div>}
            {Number(adjustForm.tax) > 0 && <div className="flex justify-between text-sm text-white/70"><span>Tax</span><span className="font-mono">Rs. {Number(adjustForm.tax).toLocaleString()}</span></div>}
            {Number(adjustForm.service_charge) > 0 && <div className="flex justify-between text-sm text-white/70"><span>Service charge</span><span className="font-mono">Rs. {Number(adjustForm.service_charge).toLocaleString()}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-1 border-t border-white/20"><span>New Total</span><span className="font-mono">Rs. {adjTotals.total.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-white/70">
              <span>Tendered {autoTendered && <span className="text-[10px] text-basil-300 font-bold ml-1">AUTO</span>}</span>
              <span className="font-mono">Rs. {adjTotals.tendered.toLocaleString()}</span>
            </div>
            {adjTotals.change_due > 0 && <div className="flex justify-between text-sm text-basil-300"><span>Change due</span><span className="font-mono">Rs. {adjTotals.change_due.toLocaleString()}</span></div>}
          </div>
        </div>
      </Modal>

      {/* ── KEYBOARD SHORTCUTS MODAL ─────────────────────────────────────────── */}
      <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard Shortcuts" width="max-w-sm">
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-ink-700">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="px-2 py-1 rounded-md border border-canvas-300 bg-canvas-50 text-[11px] font-mono font-semibold text-ink-700 shadow-soft">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {receiptData && (
        <ReceiptView order={receiptData.order} items={receiptData.items} profile={profile} refundLines={receiptData.rets} onClose={() => setReceiptData(null)} />
      )}
    </div>
  );
}