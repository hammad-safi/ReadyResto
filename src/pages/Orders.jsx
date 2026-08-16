import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, Trash2, Plus, Minus, Search, AlertTriangle, CheckCircle2, UserRound, X, ChevronDown } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ModuleTable from "../components/ui/ModuleTable";
import Badge, { statusTone } from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import { useAuth } from "../auth/AuthContext";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import Receipt from "../components/pos/Receipt";
import CheckoutModal from "../components/pos/CheckoutModal";
import api from "../api/client";

const TABS = ["All", "Dine-In", "Takeaway", "Delivery", "Phone"];
const RETURN_REASONS = [
  "Customer complaint",
  "Wrong item served",
  "Quality issue",
  "Order changed",
  "Duplicate charge",
  "Other",
];

const fmt = (n) => `Rs. ${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}`;

// ─── Searchable Combobox ──────────────────────────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder, displayKey = "name", valueKey = "id", renderOption, renderSelected, className = "" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o[valueKey]) === String(value));
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options.slice(0, 20);
    return options.filter((o) => {
      const label = typeof displayKey === "function" ? displayKey(o) : o[displayKey] || "";
      return label.toLowerCase().includes(q);
    });
  }, [query, options, displayKey]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {selected && !open ? (
        <div
          onClick={() => { setOpen(true); setQuery(""); }}
          className="flex items-center gap-2 w-full border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-paprika-400 transition-colors"
        >
          {renderSelected ? renderSelected(selected) : (
            <span className="flex-1 text-ink-900 font-medium truncate">{typeof displayKey === "function" ? displayKey(selected) : selected[displayKey]}</span>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="shrink-0 text-ink-400 hover:text-paprika-600">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full border border-canvas-200 bg-white rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
          />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
      )}
      {open && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-white border border-canvas-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {/* Clear option */}
          <button
            type="button"
            onMouseDown={() => { onChange(null); setOpen(false); setQuery(""); }}
            className="w-full text-left px-4 py-2.5 text-xs text-ink-400 italic hover:bg-canvas-50 border-b border-canvas-100"
          >
            {placeholder}
          </button>
          {filtered.map((opt) => (
            <button
              key={opt[valueKey]}
              type="button"
              onMouseDown={() => { onChange(opt); setOpen(false); setQuery(""); }}
              className={`w-full text-left px-4 py-2.5 hover:bg-paprika-50 hover:text-paprika-700 border-b border-canvas-100 last:border-0 transition-colors text-sm ${String(opt[valueKey]) === String(value) ? "bg-paprika-50/50 font-semibold" : ""}`}
            >
              {renderOption ? renderOption(opt) : (typeof displayKey === "function" ? displayKey(opt) : opt[displayKey])}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-xs text-ink-400 text-center italic">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const [tab, setTab] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [orders, setOrders] = useState([]);
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(searchParamVal);

  useEffect(() => {
    setSearchQuery(searchParamVal);
  }, [searchParamVal]);

  const [selected, setSelected] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderForm, setOrderForm] = useState({
    status: "unpaid",
    kitchen_status: "new",
    customer: "",
    total: 0,
    tendered: 0,
    change_due: 0,
    payment_method: "Cash",
    payment_details: "",
    type: "Dine-In",
    table_id: "",
    waiter: "",
    waiter_id: "",
    customer_id: null,
    discount_percent: 0,
    discount_reason: "",
    tax: 0,
    service_charge: 0,
  });

  const [receiptData, setReceiptData] = useState(null);
  const [profile, setProfile] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");

  // Checkout modal state
  const [payOpen, setPayOpen] = useState(false);

  // Return/Refund modal state
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnQtys, setReturnQtys] = useState({});
  const [returnReason, setReturnReason] = useState("Customer complaint");
  const [restock, setRestock] = useState(true);
  const [selectedReturns, setSelectedReturns] = useState([]);

  const { getDateRange } = useDashboardFilters();

  const load = () => {
    api.list("orders", { orderBy: "time DESC" }).then(setOrders);
    api.getSetting("restaurant_profile").then(setProfile);
    api.list("customers").then(setCustomers);
    api.list("employees", { where: { role: "Waiter" } }).then(setWaiters);
    api.list("tables_floor").then(setTables);
    api.list("menu_items").then(setMenuItems);
  };
  useEffect(() => {
    void load();
  }, []);

  const loadOrderDetails = async (order) => {
    const [items, rets] = await Promise.all([
      api.list("order_items", { where: { order_id: order.id } }),
      api.list("sales_returns", { where: { order_id: order.id } }),
    ]);
    setSelectedItems(items);
    setSelectedReturns(rets);

    const tendered = order.tendered != null ? Number(order.tendered) : Number(order.total || 0);
    const total = Number(order.total || 0);
    setOrderForm({
      status: order.status,
      kitchen_status: order.kitchen_status || "new",
      customer: order.customer || "",
      customer_id: order.customer_id || null,
      type: order.type || "Dine-In",
      table_id: order.table_id || "",
      waiter: order.waiter || "",
      waiter_id: order.waiter_id || "",
      total,
      tendered,
      change_due: Math.max(0, tendered - total),
      payment_method: order.payment_method || "Cash",
      payment_details: order.payment_details || "",
      discount_percent: order.discount_percent || 0,
      discount_reason: order.discount_reason || "",
      tax: order.tax || 0,
      service_charge: order.service_charge || 0,
    });
    setMenuSearch("");
  };

  const handleOrderClick = async (row) => {
    setSelected(row);
    await loadOrderDetails(row);
  };

  const updateOrderField = (field, value) => {
    setOrderForm((prev) => {
      const updated = { ...prev, [field]: field === "total" || field === "tendered" ? Number(value) : value };
      if (field === "total" || field === "tendered") {
        updated.change_due = Math.max(0, Number(updated.tendered) - Number(updated.total));
      }
      return updated;
    });
  };

  const recalcTotals = (items, discountPercent = 0) => {
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const taxable = subtotal - discountAmount;
    const taxRate = profile?.taxRate ?? 0;
    const serviceRate = orderForm.type === "Dine-In" ? (profile?.serviceCharge ?? 0) : 0;
    const taxAmt = Math.round((taxable * taxRate) / 100);
    const serviceChargeAmt = Math.round((taxable * serviceRate) / 100);
    const total = taxable + taxAmt + serviceChargeAmt;
    return { subtotal, tax: taxAmt, service_charge: serviceChargeAmt, total };
  };

  const updateItemQty = (idx, delta) => {
    setSelectedItems((prev) => {
      const updated = prev
        .map((item, i) => i === idx ? { ...item, qty: Math.max(0, item.qty + delta) } : item)
        .filter((item) => item.qty > 0);
      const newTotals = recalcTotals(updated, orderForm.discount_percent);
      setOrderForm((prevForm) => ({
        ...prevForm,
        total: newTotals.total,
        tax: newTotals.tax,
        service_charge: newTotals.service_charge,
        change_due: Math.max(0, prevForm.tendered - newTotals.total),
      }));
      return updated;
    });
  };

  const removeOrderItem = (idx) => {
    setSelectedItems((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      const newTotals = recalcTotals(updated, orderForm.discount_percent);
      setOrderForm((prevForm) => ({
        ...prevForm,
        total: newTotals.total,
        tax: newTotals.tax,
        service_charge: newTotals.service_charge,
        change_due: Math.max(0, prevForm.tendered - newTotals.total),
      }));
      return updated;
    });
  };

  const addMenuItem = (menuItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((it) => it.menu_item_id === menuItem.id);
      const updated = existing
        ? prev.map((it) => it.menu_item_id === menuItem.id ? { ...it, qty: it.qty + 1 } : it)
        : [...prev, { menu_item_id: menuItem.id, name: menuItem.name, qty: 1, price: menuItem.price, notes: "" }];
      const newTotals = recalcTotals(updated, orderForm.discount_percent);
      setOrderForm((prevForm) => ({
        ...prevForm,
        total: newTotals.total,
        tax: newTotals.tax,
        service_charge: newTotals.service_charge,
        change_due: Math.max(0, prevForm.tendered - newTotals.total),
      }));
      return updated;
    });
  };

  const filteredMenu = useMemo(() => {
    const q = menuSearch.toLowerCase().trim();
    if (!q) return menuItems.slice(0, 12);
    return menuItems
      .filter((m) => m.name.toLowerCase().includes(q) || (m.category || "").toLowerCase().includes(q))
      .slice(0, 12);
  }, [menuSearch, menuItems]);

  // Only show available or the currently-assigned table
  const availableTables = useMemo(() => {
    return tables.filter((t) => t.status === "available" || String(t.id) === String(orderForm.table_id));
  }, [tables, orderForm.table_id]);

  const saveOrderChanges = async () => {
    if (!selected) return;
    const itemsCount = selectedItems.reduce((sum, it) => sum + it.qty, 0);
    const subtotal = selectedItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    const orderUpdates = {
      status: orderForm.status,
      kitchen_status: orderForm.kitchen_status,
      type: orderForm.type,
      table_id: orderForm.type === "Dine-In" ? orderForm.table_id || null : null,
      customer: orderForm.customer,
      customer_id: orderForm.customer_id,
      waiter: orderForm.waiter,
      waiter_id: orderForm.waiter_id || null,
      total: orderForm.total,
      subtotal,
      tax: orderForm.tax,
      service_charge: orderForm.service_charge,
      items_count: itemsCount,
    };
    const itemsPayload = selectedItems.map((it) => ({
      id: it.id,
      menu_item_id: it.menu_item_id,
      name: it.name,
      qty: it.qty,
      price: it.price,
      notes: it.notes || "",
    }));
    await api.updateOrderWithItems(selected.id, orderUpdates, itemsPayload);
    await load();
    setSelected(null);
  };

  const confirmCheckoutPayment = async ({ paymentMethod, paymentDetails, tendered: effectiveTendered, changeDue: effectiveChange, customer: chosenCustomer }) => {
    if (!selected) return;
    const itemsCount = selectedItems.reduce((sum, it) => sum + it.qty, 0);
    const subtotal = selectedItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    const orderUpdates = {
      status: "paid",
      kitchen_status: orderForm.kitchen_status,
      type: orderForm.type,
      table_id: orderForm.type === "Dine-In" ? orderForm.table_id || null : null,
      customer: chosenCustomer ? chosenCustomer.name : orderForm.customer,
      customer_id: chosenCustomer ? chosenCustomer.id : orderForm.customer_id,
      waiter: orderForm.waiter,
      waiter_id: orderForm.waiter_id || null,
      total: orderForm.total,
      subtotal,
      tax: orderForm.tax,
      service_charge: orderForm.service_charge,
      items_count: itemsCount,
      payment_method: paymentMethod,
      payment_details: paymentDetails,
      tendered: effectiveTendered,
      change_due: effectiveChange,
    };
    const itemsPayload = selectedItems.map((it) => ({
      id: it.id,
      menu_item_id: it.menu_item_id,
      name: it.name,
      qty: it.qty,
      price: it.price,
      notes: it.notes || "",
    }));
    await api.updateOrderWithItems(selected.id, orderUpdates, itemsPayload);
    const customerToUpdate = chosenCustomer || (orderForm.customer_id ? customers.find((c) => c.id === orderForm.customer_id) : null);
    if (customerToUpdate) {
      const actualPaid = effectiveTendered - effectiveChange;
      const billedAmount = orderForm.total;
      const creditIncrease = billedAmount - actualPaid;
      await api.update("customers", customerToUpdate.id, {
        visits: (customerToUpdate.visits || 0) + 1,
        points: (customerToUpdate.points || 0) + Math.floor(billedAmount / 100),
        total_billed: (customerToUpdate.total_billed || 0) + billedAmount,
        total_paid: (customerToUpdate.total_paid || 0) + actualPaid,
        credit: (customerToUpdate.credit || 0) + creditIncrease,
      });
    }
    setPayOpen(false);
    setSelected(null);
    await load();
  };

  // Per-item: compute how many have ALREADY been returned from prior return records
  const alreadyReturnedQtyFor = (item) => {
    return selectedReturns
      .flatMap((r) => { try { return JSON.parse(r.items || "[]"); } catch { return []; } })
      .filter((it) => it.menu_item_id === item.menu_item_id)
      .reduce((s, it) => s + Number(it.qty || 0), 0);
  };
  const returnableQty = (item) => Math.max(0, item.qty - alreadyReturnedQtyFor(item));

  // Return total is calculated proportionally to include tax, service charge, and discounts
  const returnTotal = useMemo(() => {
    if (!selected) return 0;
    const itemsSubtotal = selectedItems.reduce((s, it, idx) => s + Number(returnQtys[idx] || 0) * it.price, 0);
    if (selected.subtotal > 0) {
      const proportion = itemsSubtotal / selected.subtotal;
      return Math.round(selected.total * proportion);
    }
    return itemsSubtotal;
  }, [selectedItems, returnQtys, selected]);

  // Total already refunded across all prior return records
  const totalAlreadyRefunded = useMemo(() =>
    selectedReturns.reduce((s, r) => s + Number(r.amount || 0), 0),
  [selectedReturns]);

  const submitReturn = async () => {
    const items = selectedItems
      .map((it, idx) => ({ menu_item_id: it.menu_item_id, name: it.name, price: it.price, qty: Number(returnQtys[idx] || 0) }))
      .filter((it) => it.qty > 0);
    if (items.length === 0) return;
    await api.processReturn(selected.id, { items, reason: returnReason, restock, kind: "return", amount: returnTotal }, { user: user?.name });
    setReturnOpen(false);
    setSelected(null);
    await load();
  };

  const filteredRows = useMemo(() => {
    let filtered = orders;
    const globalRange = getDateRange();
    if (tab !== "All") filtered = filtered.filter((o) => o.type === tab);
    if (statusFilter !== "All") filtered = filtered.filter((o) => o.status === statusFilter);
    filtered = filtered.filter((o) => {
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((o) =>
        String(o.id).toLowerCase().includes(q) ||
        String(o.customer || "").toLowerCase().includes(q) ||
        String(o.waiter || "").toLowerCase().includes(q) ||
        String(o.status || "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [orders, tab, searchQuery, statusFilter, dateFrom, dateTo, getDateRange]);

  const activeFilterCount = (statusFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const clearFilters = () => { setStatusFilter("All"); setDateFrom(""); setDateTo(""); };

  // Compute payment status label: if has refunds, show "Paid + Refunded" or "Refunded" 
  const getPaymentStatusLabel = (order) => {
    const refundedTotal = Number(order.refunded_total || 0);
    const orderTotal = Number(order.total || 0);
    if (order.status === "paid" && refundedTotal > 0) {
      if (refundedTotal >= orderTotal) return { label: "Refunded", tone: "purple" };
      return { label: `Paid · -${fmt(refundedTotal)}`, tone: "orange" }; // partial refund
    }
    return { label: order.status, tone: statusTone(order.status) };
  };

  const columns = [
    { key: "id", header: "Order #", sortKey: "id", render: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span> },
    { key: "created_at", header: "Date", sortKey: "created_at", render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
    { key: "type", header: "Type", sortKey: "type" },
    { key: "customer", header: "Customer / Table", sortKey: "customer", render: (r) => r.table_id ? `Table ${r.table_id}` : (r.customer || "Walk-in") },
    { key: "items_count", header: "Items", sortKey: "items_count" },
    { key: "total", header: "Total", sortKey: "total", render: (r) => {
      const refundedTotal = Number(r.refunded_total || 0);
      return (
        <span className="font-mono">
          {fmt(r.total)}
          {refundedTotal > 0 && <span className="text-paprika-600 text-[10px] ml-1">(-{fmt(refundedTotal)})</span>}
        </span>
      );
    }},
    { key: "waiter", header: "Waiter", sortKey: "waiter" },
    { key: "time", header: "Time", sortKey: "time" },
    { key: "status", header: "Payment", sortKey: "status", render: (r) => {
      const { label, tone } = getPaymentStatusLabel(r);
      return <Badge tone={tone}>{label}</Badge>;
    }},
    { key: "kitchen_status", header: "Kitchen", sortKey: "kitchen_status", render: (r) => <Badge tone={statusTone(r.kitchen_status || "new")}>{r.kitchen_status || "new"}</Badge> },
  ];

  const isPartiallyRefunded = selected && Number(selected.refunded_total || 0) > 0 && selected.status === "paid";
  const isFullyRefunded = selected && Number(selected.refunded_total || 0) >= Number(selected.total || 1) && selected.status !== "paid";

  return (
    <div>
      <PageHeader
        eyebrow="Live orders"
        title="Order Management"
        description="Track every dine-in, takeaway, delivery, and phone order in one place."
      />

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
              tab === t ? "bg-paprika-500 text-white border-paprika-500 shadow-sm" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <ModuleTable
        columns={columns}
        data={filteredRows}
        onRowClick={handleOrderClick}
        storageKey="orders_visible_cols"
        searchPlaceholder="Search orders..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        filterContent={
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">From date</p>
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">To date</p>
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Status</p>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                <option value="All">All statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="new">New</option>
                <option value="held">Held</option>
                <option value="paid">Paid</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        }
      />

      {/* ── Order Detail Modal ── */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Order #${selected.id}` : ""}
        width="max-w-2xl"
      >
        {selected && (
          <div className="space-y-5 text-sm">

            {/* ── Refund / Partial Refund Banner ── */}
            {(isPartiallyRefunded || isFullyRefunded) && (
              <div className={`flex items-center gap-2.5 rounded-xl p-3 border ${isFullyRefunded ? "bg-purple-50 border-purple-200" : "bg-orange-50 border-orange-200"}`}>
                <AlertTriangle size={15} className={isFullyRefunded ? "text-purple-500 shrink-0" : "text-orange-500 shrink-0"} />
                <div className="flex-1">
                  {isFullyRefunded ? (
                    <p className="text-xs font-bold text-purple-800">This order has been fully refunded.</p>
                  ) : (
                    <p className="text-xs font-bold text-orange-800">
                      Partial refund: {fmt(selected.refunded_total)} of {fmt(selected.total)} refunded.
                      Net paid: <span className="font-mono">{fmt(Number(selected.total) - Number(selected.refunded_total))}</span>
                    </p>
                  )}
                  <p className="text-[10px] mt-0.5 text-ink-500">{selectedReturns.length} return record(s) on file</p>
                </div>
              </div>
            )}

            {/* ── Order Information ── */}
            <div className="space-y-4 rounded-xl border border-canvas-200 bg-white p-4 shadow-sm">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Order Information</h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Order Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-ink-700">Order Type</label>
                  <select
                    value={orderForm.type}
                    onChange={(e) => updateOrderField("type", e.target.value)}
                    className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-paprika-400 focus:ring-1 focus:ring-paprika-400/30"
                  >
                    {["Dine-In", "Takeaway", "Delivery", "Phone"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Table — only available tables + current */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-ink-700">
                    Table {orderForm.type === "Dine-In" ? <span className="text-ink-400">(Available only)</span> : ""}
                  </label>
                  {orderForm.type === "Dine-In" ? (
                    <select
                      value={orderForm.table_id || ""}
                      onChange={(e) => updateOrderField("table_id", e.target.value)}
                      className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-paprika-400 focus:ring-1 focus:ring-paprika-400/30"
                    >
                      <option value="">No Table Assigned</option>
                      {availableTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          Table {t.id} — {t.section} · {t.seats} seats
                          {String(t.id) === String(orderForm.table_id) && " (Current)"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-lg border border-canvas-100 bg-canvas-50 px-3 py-2 text-xs text-ink-400">
                      Table not applicable for {orderForm.type}
                    </div>
                  )}
                </div>

                {/* Customer — POS-style typeahead search */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-ink-700">Customer</label>
                  <SearchableSelect
                    value={orderForm.customer_id || ""}
                    onChange={(cust) => setOrderForm((prev) => ({
                      ...prev,
                      customer_id: cust ? cust.id : null,
                      customer: cust ? cust.name : "Walk-in",
                    }))}
                    options={customers}
                    placeholder="Search customer name or phone…"
                    displayKey={(c) => c.name}
                    valueKey="id"
                    renderOption={(c) => (
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{c.name}</p>
                        <p className="text-xs text-ink-400">{c.phone}{c.credit > 0 ? ` · Rs. ${c.credit.toLocaleString()} credit` : ""}</p>
                      </div>
                    )}
                    renderSelected={(c) => (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-paprika-100 flex items-center justify-center shrink-0">
                          <UserRound size={12} className="text-paprika-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">{c.name}</p>
                          {c.phone && <p className="text-[10px] text-ink-400 truncate">{c.phone}</p>}
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* Waiter — searchable */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-ink-700">Waiter</label>
                  {orderForm.type === "Dine-In" ? (
                    <SearchableSelect
                      value={orderForm.waiter_id || ""}
                      onChange={(w) => setOrderForm((prev) => ({
                        ...prev,
                        waiter_id: w ? w.id : "",
                        waiter: w ? w.name : "",
                      }))}
                      options={waiters}
                      placeholder="Search waiter name…"
                      displayKey={(w) => w.name}
                      valueKey="id"
                      renderOption={(w) => (
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{w.name}</p>
                          <p className="text-xs text-ink-400">{w.role} · {w.phone || "No phone"}</p>
                        </div>
                      )}
                      renderSelected={(w) => (
                        <span className="flex-1 text-sm font-medium text-ink-900">{w.name}</span>
                      )}
                    />
                  ) : (
                    <div className="rounded-lg border border-canvas-100 bg-canvas-50 px-3 py-2 text-xs text-ink-400">
                      Waiter not applicable for {orderForm.type}
                    </div>
                  )}
                </div>

                {/* Payment Status */}
                <div className="space-y-1.5">
                  <label htmlFor="payment_status" className="block text-xs font-medium text-ink-700">Payment Status</label>
                  <select
                    id="payment_status"
                    value={orderForm.status}
                    disabled={orderForm.status === "paid" || orderForm.status === "refunded"}
                    onChange={(e) => updateOrderField("status", e.target.value)}
                    className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-paprika-400 focus:ring-1 focus:ring-paprika-400/30 disabled:opacity-60 disabled:bg-canvas-50"
                  >
                    {orderForm.status === "paid" && <option value="paid">Paid</option>}
                    {orderForm.status === "refunded" && <option value="refunded">Refunded</option>}
                    {["unpaid", "held", "cancelled"].map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                  {(orderForm.status === "paid" || orderForm.status === "refunded") && (
                    <p className="text-[10px] text-ink-400">Charged orders cannot be manually updated — use Refund.</p>
                  )}
                </div>

                {/* Kitchen Status */}
                <div className="space-y-1.5">
                  <label htmlFor="kitchen_status" className="block text-xs font-medium text-ink-700">Kitchen Status</label>
                  <select
                    id="kitchen_status"
                    value={orderForm.kitchen_status}
                    onChange={(e) => updateOrderField("kitchen_status", e.target.value)}
                    className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-paprika-400 focus:ring-1 focus:ring-paprika-400/30"
                  >
                    {["new", "preparing", "ready", "served", "completed"].map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* ── Payment Info (if paid) ── */}
            {(selected.payment_method || selected.payment_details || selected.order_note) && (() => {
              let splitDetails = null;
              try {
                if (selected.payment_details && selected.payment_details.startsWith("[")) {
                  splitDetails = JSON.parse(selected.payment_details);
                }
              } catch (_) {}

              return (
                <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-3 space-y-1.5 text-xs">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Payment & Notes</h5>
                  {selected.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">Method</span>
                      <span className="font-semibold">{splitDetails ? "Split Payment" : selected.payment_method}</span>
                    </div>
                  )}
                  {splitDetails ? (
                    <div className="pl-2.5 py-1 space-y-1 border-l-2 border-dashed border-canvas-300 text-ink-600">
                      {splitDetails.map((s, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {s.method}</span>
                          <span className="font-mono">{fmt(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {selected.tendered != null && (
                        <div className="flex justify-between"><span className="text-ink-500">Tendered</span><span className="font-mono">{fmt(selected.tendered)}</span></div>
                      )}
                      {selected.change_due > 0 && (
                        <div className="flex justify-between"><span className="text-ink-500">Change Given</span><span className="font-mono">{fmt(selected.change_due)}</span></div>
                      )}
                      {selected.payment_details && (
                        <div className="flex justify-between"><span className="text-ink-500">Details</span><span>{selected.payment_details}</span></div>
                      )}
                    </>
                  )}
                  {selected.order_note && (
                    <div className="flex justify-between"><span className="text-ink-500">Note</span><span>{selected.order_note}</span></div>
                  )}
                </div>
              );
            })()}

            {/* ── Editable Items List ── */}
            <div className="rounded-xl border border-canvas-200 bg-white p-4 shadow-sm space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Order Items</h4>

              {selectedItems.length > 0 ? (
                <div className="divide-y divide-canvas-100 border border-canvas-200 rounded-lg overflow-hidden">
                  {selectedItems.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-3 p-3 bg-white hover:bg-canvas-50">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink-900">{item.name}</p>
                        {item.notes && <p className="text-xs text-ink-400">{item.notes}</p>}
                        <p className="font-mono text-xs text-ink-400 mt-0.5">{fmt(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-canvas-100 rounded-lg p-0.5 border border-canvas-200">
                          <button type="button" onClick={() => updateItemQty(idx, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:bg-paprika-50 hover:text-paprika-600">
                            <Minus size={11} />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-ink-900">{item.qty}</span>
                          <button type="button" onClick={() => updateItemQty(idx, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:bg-basil-50 hover:text-basil-600">
                            <Plus size={11} />
                          </button>
                        </div>
                        <span className="w-20 font-mono text-sm font-semibold text-right text-ink-900">{fmt(item.qty * item.price)}</span>
                        <button type="button" onClick={() => removeOrderItem(idx)}
                          className="p-1 rounded text-ink-400 hover:text-paprika-600 hover:bg-paprika-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-ink-400">No items — add from menu below.</p>
              )}

              {/* Totals breakdown */}
              <div className="bg-canvas-50 rounded-xl p-3 border border-canvas-200 space-y-1.5">
                <div className="flex justify-between text-xs text-ink-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{fmt(selectedItems.reduce((s, it) => s + it.qty * it.price, 0))}</span>
                </div>
                {orderForm.discount_percent > 0 && (
                  <div className="flex justify-between text-xs text-basil-600">
                    <span>Discount ({orderForm.discount_percent}%)</span>
                    <span className="font-mono">-{fmt(Math.round((selectedItems.reduce((s, it) => s + it.qty * it.price, 0) * orderForm.discount_percent) / 100))}</span>
                  </div>
                )}
                {orderForm.tax > 0 && (
                  <div className="flex justify-between text-xs text-ink-500">
                    <span>Tax</span><span className="font-mono">{fmt(orderForm.tax)}</span>
                  </div>
                )}
                {orderForm.service_charge > 0 && (
                  <div className="flex justify-between text-xs text-ink-500">
                    <span>Service Charge</span><span className="font-mono">{fmt(orderForm.service_charge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-ink-900 pt-1.5 border-t border-dashed border-canvas-300">
                  <span>Calculated Total</span>
                  <span className="font-mono text-paprika-600">{fmt(orderForm.total)}</span>
                </div>
              </div>

              {/* Add menu items */}
              <div className="pt-1 border-t border-canvas-100">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-ink-400 block mb-1.5">Add Menu Items</label>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search by name or category…"
                    className="w-full rounded-lg border border-canvas-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-0.5">
                  {filteredMenu.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addMenuItem(item)}
                      className="rounded-lg border border-canvas-200 bg-white p-2 text-left hover:border-paprika-400 hover:bg-paprika-50 transition-colors"
                    >
                      <div className="text-xs font-semibold text-ink-900 truncate">{item.name}</div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[10px] text-ink-400 truncate">{item.category}</span>
                        <span className="font-mono text-xs font-bold text-basil-600 shrink-0 ml-1">{fmt(item.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex items-center gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setReceiptData({ order: selected, items: selectedItems })}>
                Print Receipt
              </Button>
              <div className="flex-1" />

              {/* Refund — only for paid orders */}
              {orderForm.status === "paid" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setReturnQtys({});
                    setReturnReason("Customer complaint");
                    setRestock(true);
                    setReturnOpen(true);
                  }}
                >
                  Refund / Return
                </Button>
              )}

              {/* Charge — only for uncharged orders */}
              {orderForm.status !== "paid" && orderForm.status !== "refunded" && (
                <button
                  type="button"
                  onClick={() => setPayOpen(true)}
                  disabled={selectedItems.length === 0}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-basil-600 hover:bg-basil-700 text-white disabled:opacity-50 transition-colors shadow-sm"
                >
                  Charge (Checkout)
                </button>
              )}

              <Button variant="primary" size="sm" onClick={saveOrderChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Global Checkout Modal ── */}
      <CheckoutModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={orderForm.total}
        initialCustomer={orderForm.customer_id ? customers.find((c) => c.id === orderForm.customer_id) : null}
        onConfirm={confirmCheckoutPayment}
      />

      {/* ── Process Return / Refund Modal ── */}
      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Process Return / Refund"
        width="max-w-lg"
        footer={
          <div className="flex gap-2 justify-end pt-2 border-t border-canvas-200">
            <Button variant="secondary" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              icon={CheckCircle2}
              onClick={submitReturn}
              disabled={returnTotal === 0}
            >
              Confirm Return · {fmt(returnTotal)}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-xl bg-paprika-50 border border-paprika-200 p-3">
            <AlertTriangle size={15} className="text-paprika-500 shrink-0 mt-0.5" />
            <p className="text-xs text-paprika-800">
              Only the selected item quantities will be refunded. The refund amount is calculated from the unit price × qty returned — not from the full order total.
              {totalAlreadyRefunded > 0 && <span className="block mt-0.5 font-semibold">Already refunded: {fmt(totalAlreadyRefunded)}</span>}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Select Items to Return</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedItems.map((it, idx) => {
                const maxQty = returnableQty(it);
                const alreadyRet = alreadyReturnedQtyFor(it);
                const qty = Number(returnQtys[idx] || 0);
                return (
                  <div
                    key={it.id || idx}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${qty > 0 ? "border-paprika-300 bg-paprika-50" : "border-canvas-200 bg-white"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{it.name}</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {fmt(it.price)} each · Qty in order: {it.qty}
                        {alreadyRet > 0 && <span className="text-paprika-500 ml-1">· Already returned: {alreadyRet}</span>}
                        {maxQty === 0 && <span className="text-paprika-600 font-bold ml-1">· Fully returned</span>}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 rounded-lg px-1.5 py-1 border ${maxQty === 0 ? "opacity-40 pointer-events-none border-canvas-200 bg-canvas-50" : "border-canvas-200 bg-white"}`}>
                      <button
                        type="button"
                        onClick={() => setReturnQtys((q) => ({ ...q, [idx]: Math.max(0, (Number(q[idx]) || 0) - 1) }))}
                        disabled={maxQty === 0 || qty === 0}
                        className="h-6 w-6 flex items-center justify-center text-ink-600 disabled:opacity-30 hover:text-paprika-600 font-bold text-lg leading-none"
                      >−</button>
                      <span className="w-6 text-center text-sm font-mono font-bold text-ink-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setReturnQtys((q) => ({ ...q, [idx]: Math.min(maxQty, (Number(q[idx]) || 0) + 1) }))}
                        disabled={maxQty === 0 || qty >= maxQty}
                        className="h-6 w-6 flex items-center justify-center text-ink-600 disabled:opacity-30 hover:text-basil-600 font-bold text-lg leading-none"
                      >+</button>
                    </div>
                    {qty > 0 && (
                      <span className="text-sm font-mono font-semibold text-paprika-600 shrink-0 w-24 text-right">
                        -{fmt(qty * it.price)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-600 uppercase tracking-wide mb-1">Return Reason</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
              >
                {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 uppercase tracking-wide mb-1">Inventory</label>
              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="rounded accent-basil-500" />
                <span className="text-sm text-ink-700">Restock items to inventory</span>
              </label>
            </div>
          </div>

          {returnTotal > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-paprika-600 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Refund Amount</p>
                {totalAlreadyRefunded > 0 && (
                  <p className="text-xs text-paprika-200 mt-0.5">Total after this: {fmt(totalAlreadyRefunded + returnTotal)}</p>
                )}
              </div>
              <p className="font-mono font-bold text-xl text-white">{fmt(returnTotal)}</p>
            </div>
          )}
        </div>
      </Modal>

      {receiptData && (
        <Receipt
          order={receiptData.order}
          items={receiptData.items}
          profile={profile}
          refundLines={selectedReturns}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
