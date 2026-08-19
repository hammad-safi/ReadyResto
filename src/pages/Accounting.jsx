import DatePicker from "../components/ui/DatePicker";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { useDialog } from "../context/DialogContext";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import { useDataCache } from "../context/DataCacheContext";
import { 
  BookOpen, TrendingUp, TrendingDown, DollarSign, BarChart3, Building2, 
  CreditCard, Plus, Edit3, Trash2, Search, Filter, Calendar, ChevronDown, 
  Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, FileText, Layers, Scale, 
  Banknote, Receipt, CircleDollarSign, Landmark, Download, RefreshCw, Lock, 
  Eye, X, PlusCircle, CheckCircle2 
} from "lucide-react";

// --- Helpers ---
const parseDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v);
  if (typeof v === 'string') {
    const cleaned = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      const parts = cleaned.split('-');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    const n = Number(v);
    if (!Number.isNaN(n)) return new Date(n < 1e12 ? n * 1000 : n);
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
    const fallback = new Date(cleaned.replace(" ", "T"));
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return null;
};

const getOrderDate = (order) => {
  const candidates = [order?.created_at, order?.createdAt, order?.date, order?.order_date, order?.time];
  for (const value of candidates) {
    if (!value) continue;
    if (typeof value === "string") {
      const direct = parseDate(value);
      if (direct) return direct;
      const timeMatch = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (timeMatch) {
        const now = new Date();
        const hour = Number(timeMatch[1]);
        const minute = Number(timeMatch[2] || 0);
        const period = timeMatch[3]?.toUpperCase();
        const normalizedHour = period === "PM" && hour < 12 ? hour + 12 : period === "AM" && hour === 12 ? 0 : hour;
        const fallback = new Date(now);
        fallback.setHours(normalizedHour, minute, 0, 0);
        return fallback;
      }
    }
  }
  return null;
};

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString()}`;
const TABS = ["Dashboard Overview", "Chart of Accounts", "Journal Entries", "General Ledger", "Financial Statements", "Bank Accounts"];
const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"];

// --- Default Accounts for Seeding ---
const DEFAULT_ACCOUNTS = [
  { code: "1001", name: "Cash in Drawer", type: "asset", is_system: 1, is_active: 1 },
  { code: "1002", name: "Bank Account", type: "asset", is_system: 0, is_active: 1 },
  { code: "1200", name: "Accounts Receivable", type: "asset", is_system: 1, is_active: 1 },
  { code: "2000", name: "Accounts Payable", type: "liability", is_system: 1, is_active: 1 },
  { code: "3000", name: "Owner's Equity", type: "equity", is_system: 1, is_active: 1 },
  { code: "4000", name: "Sales Revenue", type: "income", is_system: 1, is_active: 1 },
  { code: "5001", name: "Cost of Goods Sold", type: "expense", is_system: 1, is_active: 1 },
  { code: "6000", name: "Operating Expenses", type: "expense", is_system: 1, is_active: 1 },
];

// --- Subcomponents ---

function SearchableSelect({ value, onChange, options, placeholder = "Select...", displayKey = "name", valueKey = "id", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(opt => {
    const val = String(opt[displayKey] || opt.name || "").toLowerCase();
    const code = String(opt.code || "").toLowerCase();
    return val.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  const selectedOpt = options.find(opt => String(opt[valueKey]) === String(value));

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none text-left focus:ring-2 focus:ring-paprika-500/30"
      >
        <span className={selectedOpt ? "text-ink-900 font-medium truncate" : "text-ink-400"}>
          {selectedOpt ? (selectedOpt.code ? `${selectedOpt.code} - ${selectedOpt[displayKey]}` : selectedOpt[displayKey]) : placeholder}
        </span>
        <ChevronDown size={14} className="text-ink-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 mt-1 w-full bg-white border border-canvas-200 rounded-lg shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full border border-canvas-200 bg-white rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-paprika-500/50"
              autoFocus
            />
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {filtered.map((opt) => (
                <button
                  key={String(opt[valueKey])}
                  type="button"
                  onClick={() => {
                    onChange(opt[valueKey]);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-paprika-50 hover:text-paprika-700 transition-colors ${
                    String(opt[valueKey]) === String(value) ? "bg-paprika-50/50 text-paprika-700 font-bold" : "text-ink-700"
                  }`}
                >
                  {opt.code ? `${opt.code} - ` : ""}{opt[displayKey]}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-[11px] text-ink-400 py-2">No options found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getOrderSaleValue(order) {
  if (order.status !== "paid") return 0;
  return Number(order.total || 0) - Number(order.tax || 0) - Number(order.service_charge || 0) - Number(order.refunded_total || 0);
}

function DashboardOverview({ journal, fullJournal, orders, expenses, orderItems, menuItems }) {
  const stats = useMemo(() => {
    // 1. Revenue
    const paidOrders = orders.filter(o => o.status === "paid");
    const revenue = paidOrders.reduce((sum, o) => sum + getOrderSaleValue(o), 0);

    // 2. COGS (using the same estimate logic as Dashboard.jsx)
    const currentOrderIds = new Set(paidOrders.map(o => o.id));
    let cogs = 0;
    (orderItems || []).forEach(item => {
      if (currentOrderIds.has(item.order_id)) {
        const snapshottedCost = Number(item.cost || 0);
        if (snapshottedCost > 0) {
          cogs += snapshottedCost * Number(item.qty || 1);
        } else {
          const mi = (menuItems || []).find(m => String(m.id) === String(item.menu_item_id) || (m.name || "").toLowerCase() === (item.name || "").toLowerCase());
          if (mi && mi.cost) {
            cogs += Number(mi.cost) * Number(item.qty || 1);
          } else {
            cogs += (Number(item.price || 0) * 0.35) * Number(item.qty || 1);
          }
        }
      }
    });
    cogs = Math.round(cogs);

    // 3. Gross Profit
    const taxAndServiceTotal = paidOrders.reduce((s, o) => s + Number(o.tax || 0) + Number(o.service_charge || 0), 0);
    const grossProfit = revenue - taxAndServiceTotal - cogs;

    // 4. Net Profit
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = grossProfit - totalExpenses;

    // 5. Cash Position (1001 & 1002) - Uses FULL journal, not date filtered
    let cashPos = 0;
    (fullJournal || []).forEach(je => {
      if (je.account_code === '1001' || je.account_code === '1002') {
        cashPos += (Number(je.debit || 0) - Number(je.credit || 0));
      }
    });

    // 6. Accounts Receivable (1003) - Uses FULL journal
    let ar = 0;
    (fullJournal || []).forEach(je => {
      if (je.account_code === '1003') {
        ar += (Number(je.debit || 0) - Number(je.credit || 0));
      }
    });

    // 7. Accounts Payable (2001) - Uses FULL journal
    let ap = 0;
    (fullJournal || []).forEach(je => {
      if (je.account_code === '2001') {
        ap += (Number(je.credit || 0) - Number(je.debit || 0));
      }
    });

    return { revenue, cogs, grossProfit, totalExpenses, netProfit, cashPos, ar, ap };
  }, [fullJournal, orders, expenses, orderItems, menuItems]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-ink-900">Financial Overview</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(stats.revenue)} icon={TrendingUp} deltaTone="success" />
        <StatCard label="Real COGS" value={formatCurrency(stats.cogs)} icon={Layers} deltaTone="neutral" />
        <StatCard label="Gross Profit" value={formatCurrency(stats.grossProfit)} icon={CircleDollarSign} deltaTone={stats.grossProfit >= 0 ? "success" : "danger"} />
        <StatCard label="Net Profit" value={formatCurrency(stats.netProfit)} icon={Scale} deltaTone={stats.netProfit >= 0 ? "success" : "danger"} />
        <StatCard label="Cash Position" value={formatCurrency(stats.cashPos)} icon={Wallet} />
        <StatCard label="Accounts Receivable" value={formatCurrency(stats.ar)} icon={ArrowUpRight} deltaTone="success" />
        <StatCard label="Accounts Payable" value={formatCurrency(stats.ap)} icon={ArrowDownRight} deltaTone="danger" />
        <StatCard label="Operating Expenses" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} deltaTone="danger" />
      </div>

      <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft p-5 max-w-2xl">
        <div className="flex items-center gap-2 mb-4 text-ink-900 font-semibold text-lg">
          <FileText size={20} className="text-paprika-500" />
          Mini P&L Summary
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-ink-800">
            <span>Sales Revenue</span>
            <span className="font-mono">{formatCurrency(stats.revenue)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-800">
            <span>Cost of Goods Sold (COGS)</span>
            <span className="font-mono text-paprika-600">-{formatCurrency(stats.cogs)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-canvas-200 pt-2 mt-1">
            <span>Gross Profit</span>
            <span className="font-mono">{formatCurrency(stats.grossProfit)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-800">
            <span>Operating Expenses</span>
            <span className="font-mono text-paprika-600">-{formatCurrency(stats.totalExpenses)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t-2 border-canvas-200 pt-2 mt-1 text-ink-900">
            <span>Net Profit</span>
            <span className={`font-mono ${stats.netProfit < 0 ? "text-paprika-600" : "text-green-600"}`}>
              {formatCurrency(stats.netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartOfAccounts({ accounts, onRefresh }) {
  const { alert, confirm } = useDialog();
  const [filterType, setFilterType] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "", type: "Asset", parent: "", description: "" });

  const filteredAccounts = useMemo(() => {
    let accs = accounts.filter(a => a.is_active !== 0);
    if (filterType !== "All") accs = accs.filter(a => a.type?.toLowerCase() === filterType.toLowerCase());
    return accs.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [accounts, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.update("accounts", editingId, { ...formData });
    } else {
      await api.create("accounts", { ...formData, is_system: 0, is_active: 1 });
    }
    setIsModalOpen(false);
    onRefresh();
  };

  const handleEdit = (acc) => {
    setFormData({ code: acc.code, name: acc.name, type: acc.type, parent: acc.parent || "", description: acc.description || "" });
    setEditingId(acc.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (await confirm("Are you sure you want to delete this account?")) {
      await api.update("accounts", id, { is_active: 0 });
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {["All", ...ACCOUNT_TYPES].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === type ? "bg-paprika-100 text-paprika-700" : "bg-canvas-50 text-ink-600 hover:bg-canvas-100"}`}
            >
              {type}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => { setFormData({ code: "", name: "", type: "Asset", parent: "", description: "" }); setEditingId(null); setIsModalOpen(true); }}>
          <Plus size={16} /> Add Account
        </Button>
      </div>

      <div className="bg-white border border-canvas-200 rounded-xl overflow-hidden shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-canvas-50 text-ink-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">System</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-100">
            {filteredAccounts.map(acc => (
              <tr key={acc.id} className="hover:bg-canvas-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-ink-900">{acc.code}</td>
                <td className="px-4 py-3 text-sm font-medium text-ink-900">{acc.name}</td>
                <td className="px-4 py-3 text-sm text-ink-600">
                  <Badge tone={acc.type?.toLowerCase() === "asset" ? "success" : acc.type?.toLowerCase() === "liability" ? "danger" : acc.type?.toLowerCase() === "equity" ? "primary" : acc.type?.toLowerCase() === "income" ? "success" : "warning"}>
                    {acc.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-ink-500">{acc.parent || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  {acc.is_system ? <Badge tone="neutral" icon={<Lock size={12}/>}>System</Badge> : <span className="text-ink-400 text-xs">Custom</span>}
                </td>
                <td className="px-4 py-3 flex justify-end gap-2">
                  <button onClick={() => handleEdit(acc)} className="p-1.5 text-ink-400 hover:text-paprika-600 hover:bg-paprika-50 rounded transition-colors" disabled={acc.is_system}>
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" disabled={acc.is_system}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-ink-500 text-sm">
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal title={editingId ? "Edit Account" : "Add Account"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Account Code</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" placeholder="e.g. 1010" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Account Type</label>
                <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500">
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Account Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Parent Account (Optional)</label>
              <SearchableSelect 
                value={formData.parent} 
                onChange={(val) => setFormData({...formData, parent: val})} 
                options={accounts.filter(a => a.type?.toLowerCase() === formData.type?.toLowerCase())} 
                displayKey="name" 
                valueKey="code" 
                placeholder="Select parent..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" rows={3}></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-canvas-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Account</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function JournalEntries({ journal, accounts, onRefresh }) {
  const { alert, confirm } = useDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // New Entry State
  const [entryDate, setEntryDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [entryDesc, setEntryDesc] = useState("");
  const [rows, setRows] = useState([
    { id: 1, account_id: "", debit: "", credit: "" },
    { id: 2, account_id: "", debit: "", credit: "" }
  ]);

  const filteredJournal = useMemo(() => {
    return journal
      .filter(j => 
        (j.account_name || "").toLowerCase().includes(search.toLowerCase()) || 
        (j.reference || "").toLowerCase().includes(search.toLowerCase()) ||
        (j.description || "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [journal, search]);

  const totalDebit = rows.reduce((sum, r) => sum + Number(r.debit || 0), 0);
  const totalCredit = rows.reduce((sum, r) => sum + Number(r.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleAddRow = () => {
    setRows([...rows, { id: Date.now(), account_id: "", debit: "", credit: "" }]);
  };

  const handleRowChange = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) return await alert("Total Debit must equal Total Credit.");
    
    const validRows = rows.filter(r => r.account_id && (Number(r.debit) > 0 || Number(r.credit) > 0));
    if (validRows.length < 2) return await alert("At least two valid rows are required.");

    const ref = `JRN-${Date.now().toString().slice(-6)}`;
    const promises = validRows.map(r => {
      const acc = accounts.find(a => String(a.id) === String(r.account_id));
      return api.create("journal_entries", {
        date: entryDate,
        reference_type: 'Manual',
        reference_id: ref,
        account_code: acc?.code || "",
        account_name: acc?.name || "",
        debit: Number(r.debit || 0),
        credit: Number(r.credit || 0),
        description: entryDesc
      });
    });

    await Promise.all(promises);
    setIsModalOpen(false);
    onRefresh();
    // reset
    setEntryDesc("");
    setRows([{ id: 1, account_id: "", debit: "", credit: "" }, { id: 2, account_id: "", debit: "", credit: "" }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-canvas-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Manual Entry
        </Button>
      </div>

      <div className="bg-white border border-canvas-200 rounded-xl overflow-hidden shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-canvas-50 text-ink-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium text-right">Debit</th>
              <th className="px-4 py-3 font-medium text-right">Credit</th>
              <th className="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-100">
            {filteredJournal.map(j => (
              <tr key={j.id} className="hover:bg-canvas-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-ink-600">{j.date}</td>
                <td className="px-4 py-3 text-sm font-mono text-ink-900">{j.reference || (j.reference_type ? `${j.reference_type} #${j.reference_id}` : '—')}</td>
                <td className="px-4 py-3 text-sm text-ink-900 font-medium">
                  <span className="text-ink-500 font-mono text-xs mr-2">{j.account_code}</span>
                  {j.account_name}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-green-600 text-right">
                  {Number(j.debit) > 0 ? formatCurrency(j.debit) : "-"}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-red-600 text-right">
                  {Number(j.credit) > 0 ? formatCurrency(j.credit) : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-ink-600 truncate max-w-xs">{j.description}</td>
              </tr>
            ))}
            {filteredJournal.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-ink-500 text-sm">
                  No journal entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal title="New Journal Entry" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Date</label>
                <DatePicker   required value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Description</label>
                <input required value={entryDesc} onChange={e => setEntryDesc(e.target.value)} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" placeholder="Reason for entry..." />
              </div>
            </div>

            <div className="mt-4 border border-canvas-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-canvas-50 border-b border-canvas-200">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium text-ink-600 w-1/2">Account</th>
                    <th className="px-3 py-2 text-xs font-medium text-ink-600 w-1/4">Debit</th>
                    <th className="px-3 py-2 text-xs font-medium text-ink-600 w-1/4">Credit</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-100">
                  {rows.map((r, i) => (
                    <tr key={r.id}>
                      <td className="px-2 py-2">
                        <SearchableSelect 
                          value={r.account_id}
                          onChange={(val) => handleRowChange(r.id, "account_id", val)}
                          options={accounts.filter(a => a.is_active !== 0)}
                          placeholder="Select Account"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" step="0.01" value={r.debit} onChange={(e) => { handleRowChange(r.id, "debit", e.target.value); handleRowChange(r.id, "credit", ""); }} className="w-full border border-canvas-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-paprika-500 text-right" placeholder="0.00" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" step="0.01" value={r.credit} onChange={(e) => { handleRowChange(r.id, "credit", e.target.value); handleRowChange(r.id, "debit", ""); }} className="w-full border border-canvas-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-paprika-500 text-right" placeholder="0.00" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => setRows(rows.filter(row => row.id !== r.id))} className="text-ink-400 hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-canvas-50 border-t border-canvas-200">
                  <tr>
                    <td className="px-3 py-2">
                      <button type="button" onClick={handleAddRow} className="text-sm text-paprika-600 font-medium flex items-center gap-1 hover:text-paprika-700">
                        <PlusCircle size={14} /> Add Line
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-ink-900">{formatCurrency(totalDebit)}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-ink-900">{formatCurrency(totalCredit)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${isBalanced ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {isBalanced ? <CheckCircle2 size={16} /> : <BarChart3 size={16} />}
              {isBalanced ? "Entry is balanced and ready to post." : `Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-canvas-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={!isBalanced}>Post Entry</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function GeneralLedger({ journal, accounts }) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [dateRange, setDateRange] = useState("This Month"); // simplified

  const ledgerData = useMemo(() => {
    if (!selectedAccountId) return [];
    const acc = accounts.find(a => String(a.id) === String(selectedAccountId));
    if (!acc) return [];
    
    let entries = journal.filter(j => j.account_code === acc.code).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    
    let balance = 0;
    const isNormalDebit = acc.type?.toLowerCase() === "asset" || acc.type?.toLowerCase() === "expense";

    return entries.map(j => {
      const d = Number(j.debit || 0);
      const c = Number(j.credit || 0);
      if (isNormalDebit) {
        balance += (d - c);
      } else {
        balance += (c - d);
      }
      return { ...j, runningBalance: balance };
    });
  }, [journal, accounts, selectedAccountId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end bg-canvas-50 p-4 rounded-xl border border-canvas-200">
        <div className="w-64">
          <label className="block text-xs font-medium text-ink-700 mb-1">Select Account</label>
          <SearchableSelect 
            value={selectedAccountId} 
            onChange={setSelectedAccountId} 
            options={accounts.filter(a => a.is_active !== 0)} 
            placeholder="Choose an account..."
          />
        </div>
        <Button variant="secondary" size="sm" className="h-[38px]">
          <Download size={16} /> Export
        </Button>
      </div>

      {selectedAccountId ? (
        <div className="bg-white border border-canvas-200 rounded-xl overflow-hidden shadow-soft">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-50 text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Debit</th>
                <th className="px-4 py-3 font-medium text-right">Credit</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-100">
              {ledgerData.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-canvas-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink-600">{row.date}</td>
                  <td className="px-4 py-3 text-sm font-mono text-ink-900">{row.reference}</td>
                  <td className="px-4 py-3 text-sm text-ink-800">{row.description}</td>
                  <td className="px-4 py-3 text-sm font-mono text-green-600 text-right">{Number(row.debit) > 0 ? formatCurrency(row.debit) : "-"}</td>
                  <td className="px-4 py-3 text-sm font-mono text-red-600 text-right">{Number(row.credit) > 0 ? formatCurrency(row.credit) : "-"}</td>
                  <td className="px-4 py-3 text-sm font-mono font-medium text-ink-900 text-right">{formatCurrency(row.runningBalance)}</td>
                </tr>
              ))}
              {ledgerData.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-ink-400 text-sm">
                    No transactions found for this account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-canvas-200 rounded-xl shadow-soft text-ink-400">
          <BookOpen size={48} className="mb-4 opacity-50 text-paprika-500" />
          <p>Please select an account to view its ledger.</p>
        </div>
      )}
    </div>
  );
}

function FinancialStatements({ journal, accounts }) {
  const [subTab, setSubTab] = useState("P&L");

  const plData = useMemo(() => {
    // simplified for visual
    const revenue = journal.filter(j => accounts.find(a => a.code === j.account_code)?.type?.toLowerCase() === "income")
                           .reduce((s, j) => s + (Number(j.credit || 0) - Number(j.debit || 0)), 0);
    const cogs = journal.filter(j => j.account_code === "5001")
                        .reduce((s, j) => s + (Number(j.debit || 0) - Number(j.credit || 0)), 0);
    const expenses = journal.filter(j => accounts.find(a => a.code === j.account_code)?.type?.toLowerCase() === "expense" && j.account_code !== "5001")
                            .reduce((s, j) => s + (Number(j.debit || 0) - Number(j.credit || 0)), 0);
    
    return { revenue, cogs, gross: revenue - cogs, expenses, net: (revenue - cogs) - expenses };
  }, [journal, accounts]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {["P&L", "Balance Sheet", "Trial Balance"].map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === t ? "bg-paprika-50 text-paprika-700" : "bg-white text-ink-600 border border-canvas-200 hover:bg-canvas-50"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "P&L" && (
        <div className="max-w-2xl bg-white border border-canvas-200 rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-bold text-ink-900 mb-6 text-center">Profit & Loss Statement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-ink-900">Total Sales Revenue</span>
              <span className="font-mono">{formatCurrency(plData.revenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-ink-600 pl-4 border-l-2 border-canvas-200">
              <span>Less: Cost of Goods Sold</span>
              <span className="font-mono text-paprika-600">({formatCurrency(plData.cogs)})</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-y border-canvas-200 py-3 bg-canvas-50/50 px-2 rounded">
              <span>Gross Profit</span>
              <span className="font-mono">{formatCurrency(plData.gross)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-ink-600 pl-4 border-l-2 border-canvas-200">
              <span>Less: Operating Expenses</span>
              <span className="font-mono text-paprika-600">({formatCurrency(plData.expenses)})</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold border-t-2 border-ink-900 pt-3 text-ink-900 px-2">
              <span>Net Profit</span>
              <span className="font-mono text-green-700">{formatCurrency(plData.net)}</span>
            </div>
          </div>
        </div>
      )}

      {subTab !== "P&L" && (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-canvas-200 rounded-xl shadow-soft text-ink-400">
          <Scale size={48} className="mb-4 opacity-50" />
          <p>More detailed reports like Balance Sheet and Trial Balance will render here based on full journal data.</p>
        </div>
      )}
    </div>
  );
}

function BankAccounts({ banks, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", bank_name: "", account_number: "", balance: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.create("bank_accounts", formData);
    setIsModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-ink-900">Bank Accounts</h3>
        <Button variant="primary" size="sm" onClick={() => { setFormData({ name: "", bank_name: "", account_number: "", balance: 0 }); setIsModalOpen(true); }}>
          <Plus size={16} /> Add Bank Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banks.map(b => (
          <div key={b.id} className="bg-gradient-to-br from-white to-canvas-50 border border-canvas-200 rounded-xl p-5 shadow-soft hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-paprika-100/50 rounded-bl-full -z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-ink-900">{b.name}</h4>
                  <p className="text-xs text-ink-500">{b.bank_name}</p>
                </div>
                <Landmark className="text-paprika-500" size={24} />
              </div>
              <p className="text-sm font-mono text-ink-600 tracking-wider mb-4">**** {b.account_number.slice(-4) || "****"}</p>
              <div>
                <p className="text-xs text-ink-400 mb-1">Available Balance</p>
                <p className="text-xl font-bold font-mono text-ink-900">{formatCurrency(b.balance)}</p>
              </div>
            </div>
          </div>
        ))}
        {banks.length === 0 && (
          <div className="col-span-full py-8 text-center text-ink-500 text-sm border-2 border-dashed border-canvas-200 rounded-xl">
            No bank accounts added yet.
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal title="Add Bank Account" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Account Display Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" placeholder="e.g. Main Operations Account" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Bank Name</label>
              <input required value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" placeholder="e.g. HBL" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Account Number</label>
              <input required value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1">Opening Balance</label>
              <input type="number" required value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-canvas-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Bank Account</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function Accounting() {
  const { user } = useAuth();
  const { alert, confirm } = useDialog();
  const { getData, cacheTick } = useDataCache();
  const { filters } = useDashboardFilters();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    accounts: [], journal: [], orders: [], expenses: [], customers: [], suppliers: [], banks: [], orderItems: [], menuItems: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [accounts, journal, orders, expenses, customers, suppliers, banks, orderItems, menuItems] = await Promise.all([
        getData("accounts"),
        getData("journal_entries"),
        getData("orders"),
        getData("expenses"),
        getData("customers"),
        getData("suppliers"),
        getData("bank_accounts"),
        getData("order_items"),
        getData("menu_items")
      ]);

      // Auto-seed default accounts if empty (mock support)
      let finalAccounts = accounts || [];
      if (finalAccounts.length === 0) {
        for (const acc of DEFAULT_ACCOUNTS) {
          await api.create("accounts", acc);
        }
        finalAccounts = await getData("accounts");
      }

      setData({ 
        accounts: finalAccounts || [], 
        journal: journal || [], 
        orders: orders || [], 
        expenses: expenses || [], 
        customers: customers || [], 
        suppliers: suppliers || [], 
        banks: banks || [],
        orderItems: orderItems || [],
        menuItems: menuItems || []
      });
    } catch (e) {
      console.error("Error loading accounting data", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (filters.range === "Today") {
      return { start, end };
    } else if (filters.range === "This Week") {
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      return { start, end };
    } else if (filters.range === "This Month") {
      start.setDate(1);
      return { start, end };
    } else if (filters.range === "This Year") {
      start.setMonth(0, 1);
      return { start, end };
    }
    return { start: null, end: null };
  }, [filters.range]);

  const filteredData = useMemo(() => {
    const { start, end } = dateRange;
    if (!start || !end) return data;

    const filterByDate = (dateStr) => {
      if (!dateStr) return false;
      const d = parseDate(dateStr);
      return d && d >= start && d <= end;
    };

    return {
      ...data,
      journal: data.journal.filter(j => filterByDate(j.date || j.created_at)),
      orders: data.orders.filter(o => filterByDate(o.created_at || o.time)),
      expenses: data.expenses.filter(e => filterByDate(e.date)),
    };
  }, [data, dateRange]);

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="Books"
        title="Accounting & Finance"
        description="Manage chart of accounts, journal entries, and financial statements."
        actions={<Button variant="primary" onClick={loadData}><RefreshCw size={16} /> Sync</Button>}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20 text-ink-400">
          <RefreshCw className="animate-spin mr-2" size={24} /> Loading accounting data...
        </div>
      ) : (
        <div className="animate-fade-in">
          <DashboardOverview {...filteredData} fullJournal={data.journal} />
        </div>
      )}
    </div>
  );
}
