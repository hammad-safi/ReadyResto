import { useEffect, useState } from "react";
import { Wallet, Calendar } from "lucide-react";
import EntityManager from "../components/entity/EntityManager";
import StatCard from "../components/ui/StatCard";
import api from "../api/client";
import { useDashboardFilters } from "../context/DashboardFilterContext";

const columns = [
  { key: "id", header: "Ref #", sortKey: "id", render: (r) => <span className="font-mono text-xs">EXP-{r.id}</span> },
  { key: "category", header: "Category", sortKey: "category" },
  { key: "amount", header: "Amount", sortKey: "amount", render: (r) => <span className="font-mono">Rs. {Number(r.amount).toLocaleString()}</span> },
  { key: "date", header: "Date", sortKey: "date" },
  { key: "paid_by", header: "Paid By", sortKey: "paid_by" },
];

const fields = [
  { key: "category", label: "Category", type: "select", options: ["Electricity", "Gas", "Rent", "Salaries", "Maintenance", "Miscellaneous"] },
  { key: "amount", label: "Amount (Rs.)", type: "number" },
  { key: "date", label: "Date", type: "date" },
  { key: "paid_by", label: "Paid By", type: "select", options: ["Owner", "Manager", "Accountant"] },
  { key: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export default function Expenses() {
  const [summary, setSummary] = useState({ total: 0, count: 0 });
  const [stats, setStats] = useState({
    largestCategory: { name: "-", amount: 0 },
    highestExpense: { category: "-", amount: 0 },
    recentCount: 0
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paidByFilter, setPaidByFilter] = useState("All");

  const { getDateRange } = useDashboardFilters();

  const filterFn = (r) => {
    const globalRange = getDateRange();

    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (paidByFilter !== "All" && r.paid_by !== paidByFilter) return false;
    
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

  const activeFilterCount = (categoryFilter !== "All" ? 1 : 0) + (paidByFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const clearFilters = () => { setCategoryFilter("All"); setPaidByFilter("All"); setDateFrom(""); setDateTo(""); };

  useEffect(() => {
    api.list("expenses").then((rows) => {
      let total = 0;
      const categoryTotals = {};
      let highestExp = { category: "-", amount: 0 };
      let recentCount = 0;
      
      const currentMonth = new Date().toLocaleString('default', { month: 'short' });

      rows.forEach(r => {
        const amt = Number(r.amount);
        total += amt;
        
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + amt;
        
        if (amt > highestExp.amount) {
          highestExp = { category: r.category, amount: amt };
        }
        
        if (r.date && r.date.includes(currentMonth)) {
          recentCount++;
        }
      });

      let largestCatName = "-";
      let largestCatAmount = 0;
      Object.entries(categoryTotals).forEach(([cat, amt]) => {
        if (amt > largestCatAmount) {
          largestCatAmount = amt;
          largestCatName = cat;
        }
      });

      setSummary({ total, count: rows.length });
      setStats({
        largestCategory: { name: largestCatName, amount: largestCatAmount },
        highestExpense: highestExp,
        recentCount
      });
    });
  }, []);

  return (
    <div>
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Logged" value={`Rs. ${summary.total.toLocaleString()}`} icon={Wallet} sub={`${summary.count} entries`} />
        <StatCard label="Largest Category" value={stats.largestCategory.name} sub={`Rs. ${stats.largestCategory.amount.toLocaleString()}`} />
        <StatCard label="Highest Single" value={`Rs. ${stats.highestExpense.amount.toLocaleString()}`} sub={stats.highestExpense.category} />
        <StatCard label="Recent Activity" value={`${stats.recentCount} entries`} sub="This month" />
      </div> */}
      <EntityManager
        table="expenses"
        moduleName="Expense"
        eyebrow="Finance"
        title="Expense Management"
        description="Log electricity, gas, rent, salaries, maintenance, and other costs."
        columns={columns}
        fields={fields}
        onFilter={filterFn}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        filterContent={
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Category</p>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                <option value="All">All categories</option>
                {fields.find(f => f.key === "category").options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Paid By</p>
              <select value={paidByFilter} onChange={(e) => setPaidByFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                <option value="All">All roles</option>
                {fields.find(f => f.key === "paid_by").options.map(o => <option key={o} value={o}>{o}</option>)}
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
    </div>
  );
}
