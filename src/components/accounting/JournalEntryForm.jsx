import { useState, useMemo, useEffect } from "react";
import { PlusCircle, X, CheckCircle2, BarChart3, ArrowLeft, RotateCcw } from "lucide-react";
import Button from "../ui/Button";
import SearchableSelect from "../ui/SearchableSelect";
import { formatCurrency } from "../../utils/format";

export default function JournalEntryForm({ accounts, initialData = null, onSave, onCancel, onReverse, isReversing = false }) {
  const [header, setHeader] = useState({
    date: new Date().toISOString().split('T')[0],
    reference_number: "",
    description: "",
    branch: "Main Branch",
    currency: "PKR",
    exchange_rate: 1.0,
    attachment_path: "",
    status: "Draft",
    ...initialData
  });

  const [lines, setLines] = useState(
    initialData?.lines?.length > 0 ? initialData.lines : [
      { id: Date.now() + 1, account_code: "", debit: "", credit: "", description: "" },
      { id: Date.now() + 2, account_code: "", debit: "", credit: "", description: "" }
    ]
  );

  const totalDebit = useMemo(() => lines.reduce((sum, r) => sum + (Number(r.debit) || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, r) => sum + (Number(r.credit) || 0), 0), [lines]);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;
  const isPosted = header.status === "Posted";
  const isReversed = header.status === "Reversed";
  const isReadOnly = isPosted || isReversed || isReversing;

  const handleRowChange = (id, field, val) => {
    setLines(lines.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleAddRow = () => {
    setLines([...lines, { id: Date.now(), account_code: "", debit: "", credit: "", description: "" }]);
  };

  const handleSave = (status) => {
    if (lines.some(l => !l.account_code && (Number(l.debit) > 0 || Number(l.credit) > 0))) {
      alert("Please select an account for all lines with amounts.");
      return;
    }
    
    const cleanLines = lines.filter(l => Number(l.debit) > 0 || Number(l.credit) > 0).map(l => ({
      account_code: l.account_code,
      account_name: accounts.find(a => a.code === l.account_code)?.name || "",
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      description: l.description
    }));

    if (cleanLines.length < 2) {
      alert("A journal entry requires at least two lines.");
      return;
    }

    onSave({ ...header, status, lines: cleanLines });
  };

  return (
    <div className="bg-white border border-canvas-200 rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-canvas-200 bg-canvas-50">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-ink-500 hover:text-ink-900 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-display font-semibold text-ink-900">
              {header.entry_number ? `Journal Entry: ${header.entry_number}` : "New Journal Entry"}
            </h2>
            <p className="text-sm text-ink-500">
              Status: <span className={`font-medium ${header.status === 'Posted' ? 'text-green-600' : header.status === 'Reversed' ? 'text-red-600' : 'text-yellow-600'}`}>{header.status}</span>
            </p>
          </div>
        </div>
        {isPosted && !isReversed && !isReversing && (
          <Button variant="danger" onClick={() => onReverse(header.id)}>
            <RotateCcw size={16} /> Reverse Entry
          </Button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Form Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Date *</label>
            <input type="date" required disabled={isReadOnly} value={header.date} onChange={e => setHeader({...header, date: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500 disabled:bg-canvas-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Reference Number</label>
            <input disabled={isReadOnly} value={header.reference_number} onChange={e => setHeader({...header, reference_number: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500 disabled:bg-canvas-50" placeholder="e.g. INV-1002" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-ink-700 mb-1">Description *</label>
            <input required disabled={isReadOnly} value={header.description} onChange={e => setHeader({...header, description: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500 disabled:bg-canvas-50" placeholder="Reason for entry..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Branch</label>
            <input disabled={isReadOnly} value={header.branch} onChange={e => setHeader({...header, branch: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500 disabled:bg-canvas-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Currency</label>
            <input disabled={isReadOnly} value={header.currency} onChange={e => setHeader({...header, currency: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500 disabled:bg-canvas-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Exchange Rate</label>
            <input type="number" step="0.0001" disabled={isReadOnly} value={header.exchange_rate} onChange={e => setHeader({...header, exchange_rate: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500 disabled:bg-canvas-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Attachment Path</label>
            <input disabled={isReadOnly} value={header.attachment_path} onChange={e => setHeader({...header, attachment_path: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500 disabled:bg-canvas-50" placeholder="C:/docs/receipt.pdf" />
          </div>
        </div>

        {/* Lines */}
        <div className="border border-canvas-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-canvas-50 border-b border-canvas-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-ink-600 w-1/3">Account</th>
                <th className="px-4 py-3 text-xs font-semibold text-ink-600 w-1/3">Line Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-ink-600 text-right w-32">Debit</th>
                <th className="px-4 py-3 text-xs font-semibold text-ink-600 text-right w-32">Credit</th>
                {!isReadOnly && <th className="px-4 py-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-100">
              {lines.map((r) => (
                <tr key={r.id} className="hover:bg-canvas-50/50">
                  <td className="px-4 py-2">
                    <SearchableSelect 
                      value={r.account_code}
                      onChange={(val) => handleRowChange(r.id, "account_code", val)}
                      options={accounts.filter(a => a.is_active !== 0).map(a => ({ id: a.code, name: `${a.code} - ${a.name}` }))}
                      placeholder="Select Account"
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input disabled={isReadOnly} value={r.description} onChange={(e) => handleRowChange(r.id, "description", e.target.value)} className="w-full border-none bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-paprika-500 rounded disabled:opacity-75" placeholder="Optional details..." />
                  </td>
                  <td className="px-4 py-2">
                    <input disabled={isReadOnly} type="number" min="0" step="0.01" value={r.debit} onChange={(e) => { handleRowChange(r.id, "debit", e.target.value); handleRowChange(r.id, "credit", ""); }} className="w-full border border-canvas-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-paprika-500 text-right disabled:bg-canvas-50 font-mono" placeholder="0.00" />
                  </td>
                  <td className="px-4 py-2">
                    <input disabled={isReadOnly} type="number" min="0" step="0.01" value={r.credit} onChange={(e) => { handleRowChange(r.id, "credit", e.target.value); handleRowChange(r.id, "debit", ""); }} className="w-full border border-canvas-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-paprika-500 text-right disabled:bg-canvas-50 font-mono" placeholder="0.00" />
                  </td>
                  {!isReadOnly && (
                    <td className="px-4 py-2 text-center">
                      <button type="button" onClick={() => setLines(lines.filter(row => row.id !== r.id))} className="text-ink-400 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-canvas-50 border-t border-canvas-200">
              <tr>
                <td colSpan={2} className="px-4 py-3">
                  {!isReadOnly && (
                    <button type="button" onClick={handleAddRow} className="text-sm text-paprika-600 font-medium flex items-center gap-1 hover:text-paprika-700">
                      <PlusCircle size={14} /> Add Line
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-ink-900">{formatCurrency(totalDebit)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-ink-900">{formatCurrency(totalCredit)}</td>
                {!isReadOnly && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer info & actions */}
        <div className="flex items-center justify-between pt-4 border-t border-canvas-200">
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${isBalanced ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {isBalanced ? <CheckCircle2 size={18} /> : <BarChart3 size={18} />}
            {isBalanced ? "Entry is balanced and ready to post." : `Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
          </div>
          
          {!isReadOnly && (
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
              {header.status !== 'Posted' && (
                <Button type="button" variant="secondary" onClick={() => handleSave("Draft")}>Save Draft</Button>
              )}
              <Button type="button" variant="primary" disabled={!isBalanced} onClick={() => handleSave("Posted")}>Post Entry</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
