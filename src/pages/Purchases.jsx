import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, PackagePlus, FileEdit, Truck, CheckCircle2, Calendar } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import ModuleTable from "../components/ui/ModuleTable";
import Badge, { statusTone } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EntityManager from "../components/entity/EntityManager";
import api from "../api/client";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import Modal from "../components/ui/Modal";

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

export default function Purchases() {
  const [pos, setPOs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [query, setQuery] = useState("");
  
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const { getDateRange } = useDashboardFilters();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("draft");
  const [poItems, setPoItems] = useState([]);
  
  const [invSearch, setInvSearch] = useState("");

  const load = async () => {
    const [p, s, i] = await Promise.all([
      api.list("purchase_orders", { orderBy: "id DESC" }),
      api.list("suppliers"),
      api.list("inventory_items"),
    ]);
    setPOs(p);
    setSuppliers(s);
    setInventory(i);
  };

  useEffect(() => { void load(); }, []);

  const totalSpend = pos.reduce((s, p) => s + Number(p.total), 0);
  const receivedCount = pos.filter(p => p.status === "received").length;
  const pendingCount = pos.filter(p => p.status !== "received" && p.status !== "cancelled").length;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const filterFn = (r) => {
      const globalRange = getDateRange();

      if (supplierFilter !== "All" && r.supplier !== supplierFilter) return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      
      const d = r.date ? new Date(r.date) : null;
      if (dateFrom || dateTo) {
        if (!d) return false;
        if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
      } else if (globalRange.start && globalRange.end) {
        if (!d) return false;
        if (d < globalRange.start || d > globalRange.end) return false;
      }
      return true;
    };
    return pos.filter(p => {
      const matchesQuery = String(p.id).toLowerCase().includes(q) || (p.supplier || "").toLowerCase().includes(q);
      return matchesQuery && filterFn(p);
    });
  }, [pos, query, statusFilter, supplierFilter, dateFrom, dateTo, getDateRange]);

  const activeFilterCount = (statusFilter !== "All" ? 1 : 0) + (supplierFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("All");
    setSupplierFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  const openNewPO = () => {
    setSelectedPO(null);
    setSupplier(suppliers[0]?.name || "");
    setDate(new Date().toISOString().split("T")[0]);
    setStatus("draft");
    setPoItems([]);
    setModalOpen(true);
  };

  const openEditPO = async (po) => {
    const items = await api.list("purchase_order_items", { where: { po_id: po.id } });
    setSelectedPO(po);
    setSupplier(po.supplier);
    setDate(po.date);
    setStatus(po.status);
    setPoItems(items.map(it => ({ ...it })));
    setModalOpen(true);
  };

  const filteredInventory = useMemo(() => {
    const q = invSearch.toLowerCase();
    if (!q) return inventory.slice(0, 10);
    return inventory.filter(i => i.name.toLowerCase().includes(q)).slice(0, 10);
  }, [inventory, invSearch]);

  const addInvItem = (item) => {
    setPoItems(prev => {
      const existing = prev.find(it => it.inventory_item_id === item.id);
      if (existing) {
        return prev.map(it => it.inventory_item_id === item.id ? { ...it, qty: Number(it.qty) + 1 } : it);
      }
      return [...prev, { inventory_item_id: item.id, name: item.name, unit: item.unit, qty: 1, cost: item.cost }];
    });
  };

  const updateItem = (idx, field, val) => {
    setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: Number(val) } : it));
  };

  const removeItem = (idx) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const poTotal = poItems.reduce((s, it) => s + (Number(it.qty) * Number(it.cost)), 0);

  const savePO = async () => {
    const poData = {
      id: selectedPO?.id,
      supplier,
      date,
      status,
      total: poTotal,
    };
    await api.processPurchaseOrder(poData, poItems);
    setModalOpen(false);
    load();
  };

  const isReadOnly = selectedPO?.status === "received";

  return (
    <div>
      <PageHeader
        eyebrow="Supply chain"
        title="Purchase Orders"
        description="Create purchase orders, receive stock, and track supplier payments."
        actions={
          <div className="flex gap-3 items-center">
            <Button variant="primary" icon={Plus} onClick={openNewPO}>New PO</Button>
          </div>
        }
      />

      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Spend" value={`Rs. ${totalSpend.toLocaleString()}`} icon={PackagePlus} sub="All time" />
        <StatCard label="Received POs" value={receivedCount} icon={CheckCircle2} />
        <StatCard label="Pending POs" value={pendingCount} icon={Truck} sub="Awaiting delivery" />
      </div> */}

      <ModuleTable
        columns={[
          { key: "id", header: "PO Number", sortKey: "id", render: (r) => <span className="font-mono text-xs font-semibold">PO-{String(r.id).padStart(4, "0")}</span> },
          { key: "supplier", header: "Supplier", sortKey: "supplier" },
          { key: "date", header: "Date", sortKey: "date" },
          { key: "total", header: "Total", sortKey: "total", render: (r) => <span className="font-mono font-semibold">Rs. {Number(r.total).toLocaleString()}</span> },
          { key: "status", header: "Status", sortKey: "status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "_act", header: "", alwaysVisible: true, render: () => <FileEdit size={14} className="text-ink-400" /> },
        ]}
        data={filtered}
        onRowClick={openEditPO}
        storageKey="purchases_visible_cols"
        searchPlaceholder="Search POs…"
        searchValue={query}
        onSearchChange={setQuery}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        filterContent={
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="From date">
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </Field>
            <Field label="To date">
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </Field>
            <Field label="Status">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                <option value="All">All statuses</option>
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
            <Field label="Supplier">
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                <option value="All">All suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
          </div>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPO ? `Purchase Order PO-${String(selectedPO.id).padStart(4, "0")}` : "New Purchase Order"}
        width="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
            {!isReadOnly && (
              <Button variant="primary" onClick={savePO} disabled={poItems.length === 0}>
                {status === "received" ? "Receive & Update Stock" : "Save PO"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          
          {isReadOnly && (
            <div className="bg-basil-50 text-basil-800 border border-basil-200 rounded-xl p-3 text-sm flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-basil-600" />
              <p>This PO has been received. Stock levels and supplier due balances have been updated. It is now read-only.</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Field label="Supplier">
              <select value={supplier} onChange={e => setSupplier(e.target.value)} disabled={isReadOnly} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none disabled:bg-canvas-50 disabled:text-ink-500">
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Order Date">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isReadOnly} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none disabled:bg-canvas-50 disabled:text-ink-500" />
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)} disabled={isReadOnly} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none disabled:bg-canvas-50 disabled:text-ink-500">
                <option value="draft">Draft</option>
                <option value="sent">Sent to Supplier</option>
                <option value="received">Received (Updates Stock)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>

          {!isReadOnly && (
            <div>
              <SectionTitle>Add Ingredients</SectionTitle>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type="text" value={invSearch} onChange={(e) => setInvSearch(e.target.value)} placeholder="Search inventory..." className="w-full rounded-lg border border-canvas-200 bg-white pl-8 pr-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {filteredInventory.map(item => (
                  <button key={item.id} onClick={() => addInvItem(item)} className="shrink-0 rounded-lg border border-canvas-200 bg-white px-3 py-2 text-left hover:border-paprika-400 hover:bg-paprika-50">
                    <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                    <p className="text-[10px] text-ink-400">{item.stock} {item.unit} in stock</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Order Lines</SectionTitle>
            <div className="rounded-xl border border-canvas-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Ingredient</th>
                    <th className="px-3 py-2.5 text-right w-24">Qty</th>
                    <th className="px-3 py-2.5 text-left w-16">Unit</th>
                    <th className="px-3 py-2.5 text-right w-28">Cost / Unit</th>
                    <th className="px-3 py-2.5 text-right w-28">Total</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {poItems.map((item, idx) => (
                    <tr key={idx} className="border-t border-canvas-100">
                      <td className="px-3 py-2 font-medium text-ink-900">{item.name}</td>
                      <td className="px-3 py-2 text-right">
                        {isReadOnly ? <span className="font-mono">{item.qty}</span> : 
                          <input type="number" min={0} value={item.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} className="w-16 rounded-lg border border-canvas-200 px-2 py-1.5 text-sm text-right font-mono outline-none" />
                        }
                      </td>
                      <td className="px-3 py-2 text-ink-500">{item.unit}</td>
                      <td className="px-3 py-2 text-right">
                        {isReadOnly ? <span className="font-mono">Rs. {item.cost}</span> : 
                          <input type="number" min={0} value={item.cost} onChange={(e) => updateItem(idx, "cost", e.target.value)} className="w-20 rounded-lg border border-canvas-200 px-2 py-1.5 text-sm text-right font-mono outline-none" />
                        }
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-ink-900">
                        Rs. {(Number(item.qty) * Number(item.cost)).toLocaleString()}
                      </td>
                      {!isReadOnly && (
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => removeItem(idx)} className="text-ink-400 hover:text-paprika-600"><Trash2 size={14}/></button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {poItems.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-ink-400 text-sm italic">No items added to this PO</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center rounded-xl bg-ink-900 text-white px-5 py-4">
            <span className="font-medium">Total Order Value</span>
            <span className="font-mono text-2xl font-bold">Rs. {poTotal.toLocaleString()}</span>
          </div>

        </div>
      </Modal>
    </div>
  );
}
