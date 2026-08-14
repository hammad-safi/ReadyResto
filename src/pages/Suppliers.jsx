import { useState } from "react";
import EntityManager from "../components/entity/EntityManager";
import Badge, { statusTone } from "../components/ui/Badge";

const columns = [
  { key: "name", header: "Supplier", sortKey: "name" },
  { key: "phone", header: "Phone", sortKey: "phone" },
  { key: "category", header: "Category", sortKey: "category" },
  { key: "due", header: "Due Balance", sortKey: "due", render: (r) => <span className="font-mono">{r.due ? `Rs. ${r.due}` : "—"}</span> },
  { key: "status", header: "Status", sortKey: "status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

const fields = [
  { key: "name", label: "Supplier / Business Name", type: "text", fullWidth: true },
  { key: "phone", label: "Phone", type: "text" },
  { key: "category", label: "Category", type: "select", options: ["Meat & Poultry", "Vegetables", "Dairy", "Dry Goods", "Beverages"] },
  { key: "due", label: "Opening Due Balance (Rs.)", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["active", "blocked"] },
];

export default function Suppliers() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filterFn = (r) => {
    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    return true;
  };

  const activeFilterCount = (categoryFilter !== "All" ? 1 : 0) + (statusFilter !== "All" ? 1 : 0);
  const clearFilters = () => { setCategoryFilter("All"); setStatusFilter("All"); };

  return (
    <EntityManager
      table="suppliers"
      moduleName="Supplier"
      eyebrow="Supply chain"
      title="Suppliers"
      description="Manage vendor profiles, purchase history, dues, and payments."
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
              {fields.find(f => f.key === "status").options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      }
    />
  );
}
