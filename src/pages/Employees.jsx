import { useState } from "react";
import EntityManager from "../components/entity/EntityManager";
import Badge, { statusTone } from "../components/ui/Badge";

const fmtDate = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
  } catch { return v; }
};

const columns = [
  { key: "name", header: "Employee", sortKey: "name" },
  { key: "role", header: "Role", sortKey: "role" },
  { key: "phone", header: "Phone", sortKey: "phone" },
  { key: "joined", header: "Joined", sortKey: "joined", render: (r) => fmtDate(r.joined) },
  { key: "status", header: "Status", sortKey: "status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status.replace("_", " ")}</Badge> },
];

const fields = [
  { key: "name", label: "Full Name", type: "text", fullWidth: true },
  { key: "role", label: "Role", type: "select", options: ["Owner", "Manager", "Cashier", "Waiter", "Chef", "Kitchen Staff", "Accountant"] },
  { key: "phone", label: "Phone", type: "text" },
  { key: "joined", label: "Joining Date", type: "date" },
  { key: "status", label: "Status", type: "select", options: ["active", "on_leave", "terminated"] },
];

export default function Employees() {
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { getDateRange: _unused } = { getDateRange: () => ({}) }; // kept for potential future use

  const filterFn = (r) => {
    if (roleFilter !== "All" && r.role !== roleFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    
    const d = r.joined ? new Date(r.joined) : null;
    if (dateFrom || dateTo) {
      if (!d) return false;
      if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
    }
    
    return true;
  };

  const activeFilterCount = (roleFilter !== "All" ? 1 : 0) + (statusFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const clearFilters = () => { setRoleFilter("All"); setStatusFilter("All"); setDateFrom(""); setDateTo(""); };

  return (
    <EntityManager
      table="employees"
      moduleName="Employee"
      eyebrow="Staff"
      title="Employee Management"
      description="Records, attendance, shifts, payroll, and performance."
      columns={columns}
      fields={fields}
      onFilter={filterFn}
      activeFilterCount={activeFilterCount}
      onClearFilters={clearFilters}
      filterContent={
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Role</p>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
              <option value="All">All roles</option>
              {fields.find(f => f.key === "role").options.map(o => <option key={o} value={o}>{o}</option>)}
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
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">From Date</p>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">To Date</p>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
        </div>
      }
    />
  );
}
