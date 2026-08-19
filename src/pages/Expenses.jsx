import DatePicker from "../components/ui/DatePicker";
import { useEffect, useState, useMemo } from "react";
import { Wallet, Calendar } from "lucide-react";
import EntityManager from "../components/entity/EntityManager";
import StatCard from "../components/ui/StatCard";
import api from "../api/client";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import { useDataCache } from "../context/DataCacheContext";

export default function Expenses() {
  const { getData, cacheTick } = useDataCache();
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
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const { getDateRange } = useDashboardFilters();

  useEffect(() => {
    getData("accounts").then(setAccounts);
    getData("employees").then(setEmployees);
  }, [cacheTick]);

  const expenseAccounts = useMemo(() => {
    return accounts.filter(a => a.type?.toLowerCase() === 'expense');
  }, [accounts]);

  const paymentAccounts = useMemo(() => {
    return accounts.filter(a => a.type?.toLowerCase() === 'asset' && a.code?.startsWith('100'));
  }, [accounts]);

  const columns = useMemo(() => [
    { key: "id", header: "Ref #", sortKey: "id", render: (r) => <span className="font-mono text-xs">EXP-{r.id}</span> },
    { key: "category", header: "Category", sortKey: "category" },
    { key: "employee_name", header: "Employee Paid", sortKey: "employee_name", render: (r) => r.employee_name || "—" },
    { key: "amount", header: "Amount", sortKey: "amount", render: (r) => <span className="font-mono">Rs. {Number(r.amount).toLocaleString()}</span> },
    { key: "date", header: "Date", sortKey: "date" },
    { key: "paid_by", header: "Paid By", sortKey: "paid_by" },
    { key: "payment_account_code", header: "Paid Via", sortKey: "payment_account_code", render: (r) => {
      const acc = paymentAccounts.find(a => a.code === r.payment_account_code);
      return acc ? acc.name : (r.payment_account_code || "-");
    }},
  ], [paymentAccounts]);

  const fields = useMemo(() => [
    {
      key: "category",
      label: "Category",
      options: expenseAccounts.length > 0 ? expenseAccounts.map(a => a.name) : ["Electricity", "Gas", "Rent", "Salaries", "Maintenance", "Miscellaneous"],
      render: (form, setForm) => (
        <select
          value={form.expense_account_code || ""}
          onChange={(e) => {
            const acc = expenseAccounts.find(a => a.code === e.target.value);
            setForm(p => ({ ...p, expense_account_code: e.target.value, category: acc ? acc.name : "" }));
          }}
          className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
        >
          <option value="">Select Expense Account</option>
          {expenseAccounts.map(a => (
            <option key={a.code} value={a.code}>{a.name}</option>
          ))}
        </select>
      )
    },
    { key: "amount", label: "Amount (Rs.)", type: "number" },
    {
      key: "employee_id",
      label: "Select Employee",
      hide: (form) => form.expense_account_code !== "6004", // 6004 is Salaries
      render: (form, setForm) => (
        <select
          value={form.employee_id || ""}
          onChange={(e) => {
            const emp = employees.find(emp => String(emp.id) === String(e.target.value));
            setForm(p => ({ ...p, employee_id: e.target.value, employee_name: emp ? emp.name : "" }));
          }}
          className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
        >
          <option value="">Select Employee</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
          ))}
        </select>
      )
    },
    { key: "date", label: "Date", type: "date", defaultValue: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })() },
    { key: "paid_by", label: "Paid By", type: "select", options: ["Owner", "Manager", "Accountant"] },
    {
      key: "payment_account_code",
      label: "Payment Account",
      defaultValue: "1001",
      render: (form, setForm) => (
        <select
          value={form.payment_account_code || "1001"}
          onChange={(e) => setForm(p => ({ ...p, payment_account_code: e.target.value }))}
          className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
        >
          {paymentAccounts.map(a => (
            <option key={a.code} value={a.code}>{a.name}</option>
          ))}
        </select>
      )
    },
    { key: "notes", label: "Notes", type: "textarea", fullWidth: true },
  ], [expenseAccounts, paymentAccounts, employees]);

  const filterFn = (r) => {
    const globalRange = getDateRange();

    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (paidByFilter !== "All" && r.paid_by !== paidByFilter) return false;
    
    let d = null;
    if (r.date) {
      const parts = r.date.split('-');
      if (parts.length === 3) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        d = new Date(r.date);
      }
    }
    if (dateFrom || dateTo) {
      if (!d) return false;
      if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
    } else if (globalRange.start && globalRange.end) {
      if (!d) return false;
      // Compare only date parts to avoid hour offset mismatches
      const dStart = new Date(globalRange.start);
      dStart.setHours(0,0,0,0);
      const dEnd = new Date(globalRange.end);
      dEnd.setHours(23,59,59,999);
      if (d < dStart || d > dEnd) return false;
    }
    return true;
  };

  const activeFilterCount = (categoryFilter !== "All" ? 1 : 0) + (paidByFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const clearFilters = () => { setCategoryFilter("All"); setPaidByFilter("All"); setDateFrom(""); setDateTo(""); };

  useEffect(() => {
    getData("expenses").then((rows) => {
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
                <DatePicker   value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">To date</p>
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <DatePicker   value={dateTo} onChange={(e) => setDateTo(e.target.value)}
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
            <DatePicker   value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">To Date</p>
            <DatePicker   value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
        </div>
        }
      />
    </div>
  );
}
