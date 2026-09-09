import { useState, useMemo } from "react";
import { Plus, Search, Filter, Download, Upload, FileText, CheckCircle, RotateCcw } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { formatCurrency, formatDate } from "../../utils/format";

export default function JournalEntriesList({ journals = [], onNew, onEdit }) {
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let res = journals;
    if (filterType !== "All") res = res.filter(j => j.status === filterType);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(j => 
        (j.entry_number || "").toLowerCase().includes(q) ||
        (j.description || "").toLowerCase().includes(q) ||
        (j.reference_number || "").toLowerCase().includes(q)
      );
    }
    return res.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [journals, filterType, search]);

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {["All", "Draft", "Posted", "Reversed"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterType === type 
                  ? "bg-paprika-50 text-paprika-700" 
                  : "bg-white text-ink-600 border border-canvas-200 hover:bg-canvas-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={onNew}>
          <Plus size={16} /> New Journal Entry
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-canvas-200 shadow-soft">
        <div className="relative w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input 
            type="text" 
            placeholder="Search entries..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-canvas-50 border border-canvas-200 rounded-lg text-sm outline-none focus:border-paprika-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Filter size={16} /> Filter</Button>
          <Button variant="secondary" size="sm"><Upload size={16} /> Import</Button>
          <Button variant="secondary" size="sm"><Download size={16} /> Export</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-canvas-200 rounded-xl overflow-hidden shadow-soft">
        <table className="w-full text-left">
          <thead className="bg-canvas-50 border-b border-canvas-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider">Entry #</th>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider">Reference</th>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider text-right">Debit</th>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider text-right">Credit</th>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider text-center">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-100">
            {filtered.map(j => {
              const totalDebit = (j.lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
              const totalCredit = (j.lines || []).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
              
              return (
                <tr key={j.id} className="hover:bg-canvas-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">{j.entry_number || '-'}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{formatDate(j.date)}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{j.reference_number || '-'}</td>
                  <td className="px-4 py-3 text-sm text-ink-600 max-w-[200px] truncate" title={j.description}>{j.description}</td>
                  <td className="px-4 py-3 text-sm text-ink-900 font-mono text-right">{formatCurrency(totalDebit)}</td>
                  <td className="px-4 py-3 text-sm text-ink-900 font-mono text-right">{formatCurrency(totalCredit)}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <Badge tone={j.status === 'Posted' ? 'success' : j.status === 'Reversed' ? 'danger' : 'warning'}>
                      {j.status || 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" size="sm" onClick={() => onEdit(j)}>
                      {j.status === 'Draft' ? 'Edit' : 'View'}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-ink-500 text-sm">
                  No journal entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
