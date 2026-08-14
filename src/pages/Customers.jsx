import { useState } from "react";
import EntityManager from "../components/entity/EntityManager";

const columns = [
  { key: "name", header: "Customer", sortKey: "name" },
  { key: "phone", header: "Phone", sortKey: "phone" },
  { key: "email", header: "Email", sortKey: "email" },
  { key: "visits", header: "Visits", sortKey: "visits" },
  { key: "total_billed", header: "Total Billed", sortKey: "total_billed", render: (r) => <span className="font-mono">Rs. {r.total_billed || 0}</span> },
  { key: "total_paid", header: "Total Paid", sortKey: "total_paid", render: (r) => <span className="font-mono text-basil-600">Rs. {r.total_paid || 0}</span> },
  { key: "credit", header: "Credit Due", sortKey: "credit", render: (r) => <span className="font-mono text-paprika-600">{r.credit ? `Rs. ${r.credit}` : "—"}</span> },
  { key: "points", header: "Points", sortKey: "points", render: (r) => <span className="font-mono">{r.points}</span> },
  { key: "tier", header: "Tier", sortKey: "tier" },
];

const fields = [
  { key: "name", label: "Customer Name", type: "text", fullWidth: true },
  { key: "phone", label: "Phone", type: "text" },
  { key: "email", label: "Email Address", type: "text" },
  { key: "tier", label: "Loyalty Tier", type: "select", options: ["Silver", "Gold", "Platinum"] },
  { key: "points", label: "Loyalty Points", type: "number" },
  { key: "credit", label: "Credit Balance (Rs.)", type: "number" },
  { key: "total_billed", label: "Total Billed (Rs.)", type: "number" },
  { key: "total_paid", label: "Total Paid (Rs.)", type: "number" },
  { key: "visits", label: "Total Visits", type: "number" },
];

export default function Customers() {
  const [tierFilter, setTierFilter] = useState("All");

  const filterFn = (r) => {
    if (tierFilter !== "All" && r.tier !== tierFilter) return false;
    return true;
  };

  const activeFilterCount = tierFilter !== "All" ? 1 : 0;
  const clearFilters = () => setTierFilter("All");

  return (
    <EntityManager
      table="customers"
      moduleName="Customer"
      eyebrow="Guests"
      title="Customer Management"
      description="Order history, loyalty points, credit accounts, and preferences."
      columns={columns}
      fields={fields}
      onFilter={filterFn}
      activeFilterCount={activeFilterCount}
      onClearFilters={clearFilters}
      filterContent={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Loyalty Tier</p>
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
              <option value="All">All tiers</option>
              {fields.find(f => f.key === "tier").options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      }
    />
  );
}
