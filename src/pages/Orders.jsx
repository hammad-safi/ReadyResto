import { useEffect, useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ModuleTable from "../components/ui/ModuleTable";
import Badge, { statusTone } from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import { useAuth } from "../auth/AuthContext";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import Receipt from "../components/pos/Receipt";
import api from "../api/client";

const TABS = ["All", "Dine-In", "Takeaway", "Delivery", "Phone"];

export default function Orders() {
  const { user } = useAuth();
  const [tab, setTab] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderForm, setOrderForm] = useState({
    status: "new",
    kitchen_status: "new",
    total: 0,
    tendered: 0,
    change_due: 0,
    payment_method: "Cash",
    payment_details: "",
    split_method_1: "Cash",
    split_amount_1: 0,
    split_method_2: "Card",
    split_amount_2: 0,
  });

  const [receiptData, setReceiptData] = useState(null);

  const { getDateRange } = useDashboardFilters();

  const load = () => api.list("orders", { orderBy: "time DESC" }).then(setOrders);
  useEffect(() => {
    void load();
  }, []);

  const loadOrderDetails = async (order) => {
    const items = await api.list("order_items", { where: { order_id: order.id } });
    setSelectedItems(items);
    const tendered = order.tendered != null ? Number(order.tendered) : Number(order.total || 0);
    const total = Number(order.total || 0);
    setOrderForm({
      status: order.status,
      kitchen_status: order.kitchen_status || "new",
      total,
      tendered,
      change_due: Math.max(0, tendered - total),
      payment_method: order.payment_method || "Cash",
      payment_details: order.payment_details || "",
      split_method_1: "Cash",
      split_amount_1: 0,
      split_method_2: "Card",
      split_amount_2: 0,
    });
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

  const saveOrderChanges = async () => {
    if (!selected) return;
    const paymentDetails = orderForm.payment_method === "Split"
      ? JSON.stringify([{ method: orderForm.split_method_1, amount: Number(orderForm.split_amount_1) }, { method: orderForm.split_method_2, amount: Number(orderForm.split_amount_2) }])
      : orderForm.payment_details || null;
      
    await api.update("orders", selected.id, {
      status: orderForm.status,
      kitchen_status: orderForm.kitchen_status,
      total: orderForm.total,
      tendered: orderForm.tendered,
      change_due: orderForm.change_due,
      payment_method: orderForm.payment_method,
      payment_details: paymentDetails,
    });
    await load();
    setSelected(null);
  };

  const filteredRows = useMemo(() => {
    let filtered = orders;
    const globalRange = getDateRange();

    if (tab !== "All") filtered = filtered.filter(o => o.type === tab);
    if (statusFilter !== "All") filtered = filtered.filter(o => o.status === statusFilter);
    
    filtered = filtered.filter(o => {
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
      filtered = filtered.filter(o => 
        String(o.id).toLowerCase().includes(q) ||
        String(o.customer).toLowerCase().includes(q) ||
        String(o.waiter).toLowerCase().includes(q) ||
        String(o.status).toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [orders, tab, searchQuery, statusFilter, dateFrom, dateTo, getDateRange]);

  const activeFilterCount = (statusFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  const columns = [
    { key: "id", header: "Order #", sortKey: "id", render: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span> },
    { key: "type", header: "Type", sortKey: "type" },
    { key: "customer", header: "Customer / Table", sortKey: "customer", render: (r) => r.table_id || r.customer },
    { key: "items_count", header: "Items", sortKey: "items_count" },
    { key: "total", header: "Total", sortKey: "total", render: (r) => <span className="font-mono">Rs. {r.total}</span> },
    { key: "waiter", header: "Waiter", sortKey: "waiter" },
    { key: "order_note", header: "Note", sortKey: "order_note", render: (r) => r.order_note || "—" },
    { key: "time", header: "Time", sortKey: "time" },
    { key: "status", header: "Payment", sortKey: "status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: "kitchen_status", header: "Kitchen", sortKey: "kitchen_status", render: (r) => <Badge tone={statusTone(r.kitchen_status || "new")}>{r.kitchen_status || "new"}</Badge> },
  ];

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
              tab === t ? "bg-ink-900 text-white border-ink-900" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.id} details` : ""}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-ink-500">Type</span><span>{selected.type}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Customer / Table</span><span>{selected.table_id || selected.customer}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Waiter</span><span>{selected.waiter}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Items</span><span>{selected.items_count}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-ink-500">Payment status</span>
                  <select
                    value={orderForm.status}
                    onChange={(e) => updateOrderField("status", e.target.value)}
                    className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    {["unpaid", "paid", "held", "refunded", "cancelled"].map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between"><span className="text-ink-500">Kitchen status</span>
                  <select
                    value={orderForm.kitchen_status}
                    onChange={(e) => updateOrderField("kitchen_status", e.target.value)}
                    className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    {["new", "preparing", "ready", "served", "completed"].map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-start"><span className="text-ink-500 mt-2">Payment method</span>
                  <div className="w-full space-y-2">
                    <select
                      value={orderForm.payment_method}
                      onChange={(e) => updateOrderField("payment_method", e.target.value)}
                      className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm outline-none"
                    >
                      {["Cash", "Card", "Wallet", "Credit", "Split"].map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                    {orderForm.payment_method === "Split" && (
                      <div className="space-y-2 bg-canvas-50 p-2 rounded-lg border border-canvas-200">
                        <div className="flex gap-2">
                          <select
                            value={orderForm.split_method_1}
                            onChange={(e) => updateOrderField("split_method_1", e.target.value)}
                            className="flex-1 rounded-lg border border-canvas-200 bg-white px-2 py-1 text-xs outline-none"
                          >
                            {["Cash", "Card", "Wallet", "Credit"].map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input
                            type="number"
                            value={orderForm.split_amount_1}
                            onChange={(e) => updateOrderField("split_amount_1", e.target.value)}
                            className="flex-1 rounded-lg border border-canvas-200 bg-white px-2 py-1 text-xs outline-none text-right"
                            placeholder="Amount 1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={orderForm.split_method_2}
                            onChange={(e) => updateOrderField("split_method_2", e.target.value)}
                            className="flex-1 rounded-lg border border-canvas-200 bg-white px-2 py-1 text-xs outline-none"
                          >
                            {["Cash", "Card", "Wallet", "Credit"].filter(m => m !== orderForm.split_method_1).map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <div className="flex-1 rounded-lg border border-canvas-200 bg-canvas-100 px-2 py-1 text-xs text-right text-ink-600 font-mono">
                            Rs. {Math.max(0, orderForm.total - (Number(orderForm.split_amount_1) || 0))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-ink-500">Total</span>
                  <input
                    type="number"
                    value={orderForm.total}
                    onChange={(e) => updateOrderField("total", e.target.value)}
                    className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm outline-none text-right"
                  />
                </div>
                <div className="flex justify-between"><span className="text-ink-500">Tendered</span>
                  <input
                    type="number"
                    value={orderForm.tendered}
                    onChange={(e) => updateOrderField("tendered", e.target.value)}
                    className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm outline-none text-right"
                  />
                </div>
                <div className="flex justify-between"><span className="text-ink-500">Change due</span><span className="font-mono">Rs. {orderForm.change_due}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-canvas-200 bg-canvas-50 p-3">
              <div className="flex items-center justify-between mb-3 text-sm font-semibold text-ink-900">Order Items</div>
              {selectedItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center rounded-lg border border-canvas-200 bg-white p-3">
                      <div>
                        <div className="font-medium text-ink-900">{item.name}</div>
                        {item.notes && <div className="text-[11px] text-ink-500">{item.notes}</div>}
                      </div>
                      <div className="text-right text-sm text-ink-600">×{item.qty}</div>
                      <div className="text-right font-mono text-sm text-ink-900">Rs. {(item.qty * item.price).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-ink-500 text-sm">No items found for this order.</div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Payment details</span><span>{selected.payment_method || "—"}</span></div>
              {selected.payment_details && (
                <div className="flex justify-between"><span className="text-ink-500">Split / notes</span><span className="text-right text-ink-700">{selected.payment_details}</span></div>
              )}
              {selected.order_note && (
                <div className="flex justify-between"><span className="text-ink-500">Order note</span><span className="text-right text-ink-700">{selected.order_note}</span></div>
              )}
            </div>

            <div className="pt-3 border-t border-canvas-200 flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setReceiptData({ order: selected, items: selectedItems })}>Print Receipt</Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={saveOrderChanges}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {receiptData && (
        <Receipt
          order={receiptData.order}
          items={receiptData.items}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
