import { useEffect, useState } from "react";
import { ArrowLeftRight, ClipboardCheck } from "lucide-react";
import EntityManager from "../components/entity/EntityManager";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import ModuleTable from "../components/ui/ModuleTable";
import Badge, { statusTone } from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import api from "../api/client";

const TABS = ["All Ingredients", "Stock In / Adjustments", "Physical Count", "Expiry Tracking"];

const columns = [
  { key: "name", header: "Ingredient", sortKey: "name" },
  { key: "category", header: "Category", sortKey: "category" },
  { key: "stock", header: "Current Stock", sortKey: "stock", render: (r) => `${r.stock} ${r.unit}` },
  { key: "reorder", header: "Reorder Level", sortKey: "reorder", render: (r) => `${r.reorder} ${r.unit}` },
  { key: "cost", header: "Cost / Unit", sortKey: "cost", render: (r) => <span className="font-mono">Rs. {r.cost}</span> },
  { key: "status", header: "Status", sortKey: "status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status.replace("_", " ")}</Badge> },
];

const fields = [
  { key: "name", label: "Ingredient Name", type: "text", fullWidth: true },
  { key: "category", label: "Category", type: "select", options: ["Meat & Poultry", "Vegetables", "Dairy", "Dry Goods", "Beverages"] },
  { key: "unit", label: "Unit", type: "select", options: ["kg", "g", "ltr", "ml", "pcs"] },
  { key: "stock", label: "Current Stock", type: "number" },
  { key: "reorder", label: "Reorder Level", type: "number" },
  { key: "cost", label: "Cost per Unit (Rs.)", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["in_stock", "low", "critical"] },
];

export default function Inventory() {
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (tab !== "All Ingredients") api.list("inventory_items").then(setItems);
  }, [tab]);

  const filterFn = (r) => {
    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    return true;
  };

  const activeFilterCount = (categoryFilter !== "All" ? 1 : 0) + (statusFilter !== "All" ? 1 : 0);
  const clearFilters = () => { setCategoryFilter("All"); setStatusFilter("All"); };

  return (
    <div>
      <PageHeader
        eyebrow="Stock control"
        title="Inventory Management"
        description="Track ingredients across warehouses with low-stock and expiry alerts."
        actions={<Button variant="secondary" icon={ArrowLeftRight} onClick={() => setTransferOpen(true)}>Transfer Stock</Button>}
      />

      <div className="flex gap-2 mb-5 overflow-x-auto">
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

      {tab === "All Ingredients" && (
        <EntityManager 
          table="inventory_items" 
          moduleName="Ingredient" 
          columns={columns} 
          fields={fields} 
          onFilter={filterFn}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          filterContent={
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Category</p>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                  <option value="All">All categories</option>
                  {fields.find(f => f.key === "category").options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Status</p>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                  <option value="All">All statuses</option>
                  {fields.find(f => f.key === "status").options.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>
          }
        />
      )}

      {tab === "Physical Count" && (
        <div className="bg-white border border-canvas-200 rounded-xl2 shadow-soft p-6 text-center">
          <ClipboardCheck size={28} className="mx-auto text-paprika-500 mb-3" />
          <p className="font-medium text-ink-900 mb-1">No stock count in progress</p>
          <p className="text-sm text-ink-500 mb-4">Start a new physical count to reconcile system stock with what's on the shelf.</p>
          <Button variant="primary" className="mx-auto" onClick={() => setCountOpen(true)}>Start Stock Count</Button>
        </div>
      )}

      {tab === "Stock In / Adjustments" && (
        <div className="bg-white border border-canvas-200 rounded-xl2 shadow-soft p-6 text-center text-sm text-ink-500">
          Goods-received entries and wastage/adjustment records are created from a Purchase Order receipt or logged manually here.
        </div>
      )}

      {tab === "Expiry Tracking" && (
        <ModuleTable
          columns={[
            { key: "name", header: "Ingredient", sortKey: "name" },
            { key: "stock", header: "Batch Qty", render: (r) => `${r.stock} ${r.unit}` },
            { key: "status", header: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status.replace("_", " ")}</Badge> },
          ]}
          data={items.filter((i) => i.status !== "in_stock")}
        />
      )}

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer Stock"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setTransferOpen(false)}>Confirm Transfer</Button>
          </>
        }
      >
        <label className="text-xs font-medium text-ink-600">From Warehouse</label>
        <select className="w-full mt-1 mb-3 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none">
          <option>Main Kitchen Store</option><option>Cold Storage</option>
        </select>
        <label className="text-xs font-medium text-ink-600">To Warehouse</label>
        <select className="w-full mt-1 mb-3 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none">
          <option>Cold Storage</option><option>Main Kitchen Store</option>
        </select>
        <label className="text-xs font-medium text-ink-600">Quantity</label>
        <input className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
      </Modal>

      <Modal
        open={countOpen}
        onClose={() => setCountOpen(false)}
        title="Physical Stock Count"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCountOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setCountOpen(false)}>Submit Count</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">A count sheet is generated for every ingredient. Enter the counted quantity — variances auto-create adjustment entries.</p>
      </Modal>
    </div>
  );
}
