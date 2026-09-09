import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, FileSpreadsheet, Filter } from 'lucide-react';
import Button from '../ui/Button';
import SearchableSelect from '../ui/SearchableSelect';
import { formatCurrency, formatDate } from '../../utils/format';

export default function GeneralLedger({ journal, accounts, selectedAccountId, setSelectedAccountId }) {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    branch: "",
    reference: "",
    type: ""
  });

  const selectedAccount = useMemo(() => {
    return accounts.find(a => String(a.id) === String(selectedAccountId)) || null;
  }, [accounts, selectedAccountId]);

  const { ledgerEntries, summary } = useMemo(() => {
    if (!selectedAccount) return { ledgerEntries: [], summary: { opening: 0, totalDebit: 0, totalCredit: 0, closing: 0 } };
    
    let entries = journal.filter(j => j.account_code === selectedAccount.code).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    
    // Apply filters
    if (filters.dateFrom) {
      entries = entries.filter(j => new Date(j.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      entries = entries.filter(j => new Date(j.date) <= new Date(filters.dateTo));
    }
    if (filters.reference) {
      entries = entries.filter(j => (j.reference_id || "").toLowerCase().includes(filters.reference.toLowerCase()));
    }
    
    let balance = Number(selectedAccount.opening_balance || 0);
    const isNormalDebit = selectedAccount.type?.toLowerCase() === "asset" || selectedAccount.type?.toLowerCase() === "expense";

    const ledgerEntries = [];
    
    let openingDebit = (isNormalDebit && balance > 0) || (!isNormalDebit && balance < 0) ? Math.abs(balance) : 0;
    let openingCredit = (!isNormalDebit && balance > 0) || (isNormalDebit && balance < 0) ? Math.abs(balance) : 0;

    if (balance !== 0) {
      ledgerEntries.push({
        id: 'opening',
        date: selectedAccount.opening_balance_date || selectedAccount.created_at?.split(' ')[0] || new Date().toISOString().split('T')[0],
        description: 'Opening Balance',
        reference_type: '-',
        reference_id: '-',
        debit: openingDebit,
        credit: openingCredit,
        runningBalance: balance
      });
    }

    let totalDebit = openingDebit;
    let totalCredit = openingCredit;

    entries.forEach(j => {
      const d = Number(j.debit || 0);
      const c = Number(j.credit || 0);
      totalDebit += d;
      totalCredit += c;

      if (isNormalDebit) {
        balance += (d - c);
      } else {
        balance += (c - d);
      }
      ledgerEntries.push({ ...j, runningBalance: balance });
    });

    return { 
      ledgerEntries, 
      summary: {
        opening: Number(selectedAccount.opening_balance || 0),
        totalDebit,
        totalCredit,
        closing: balance
      }
    };
  }, [journal, selectedAccount, filters]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportDummy = (type) => {
    alert(`${type} export is coming soon in the next release!`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-canvas-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-ink-900 font-bold mb-2">
          <Filter size={18} /> Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-ink-700 mb-1">Account *</label>
            <SearchableSelect 
              value={selectedAccountId} 
              onChange={setSelectedAccountId} 
              options={accounts.filter(a => a.is_active !== 0)} 
              placeholder="Choose an account..."
              displayKey="name"
              valueKey="id"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Date From</label>
            <input 
              type="date" 
              value={filters.dateFrom} 
              onChange={e => setFilters({...filters, dateFrom: e.target.value})} 
              className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Date To</label>
            <input 
              type="date" 
              value={filters.dateTo} 
              onChange={e => setFilters({...filters, dateTo: e.target.value})} 
              className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Reference</label>
            <input 
              type="text" 
              placeholder="e.g. SALE-1001"
              value={filters.reference} 
              onChange={e => setFilters({...filters, reference: e.target.value})} 
              className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" 
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setFilters({dateFrom: "", dateTo: "", branch: "", reference: "", type: ""})}>Clear</Button>
            <Button variant="primary" className="flex-1">Apply</Button>
          </div>
        </div>
      </div>

      {/* Actions & Export */}
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-bold text-ink-900">{selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : "General Ledger"}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleExportDummy("Excel")}><FileSpreadsheet size={16} className="mr-2" /> Excel</Button>
          <Button variant="secondary" onClick={() => handleExportDummy("PDF")}><Download size={16} className="mr-2" /> PDF</Button>
          <Button variant="secondary" onClick={handlePrint}><Printer size={16} className="mr-2" /> Print</Button>
        </div>
      </div>

      {selectedAccount ? (
        <>
          {/* Account Details Summary Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-canvas-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs font-medium text-ink-500 mb-1">Opening Balance</div>
              <div className="text-lg font-bold font-mono text-ink-900">{formatCurrency(summary.opening)}</div>
            </div>
            <div className="bg-white border border-canvas-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs font-medium text-ink-500 mb-1">+ Total Debit</div>
              <div className="text-lg font-bold font-mono text-emerald-600">{formatCurrency(summary.totalDebit)}</div>
            </div>
            <div className="bg-white border border-canvas-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs font-medium text-ink-500 mb-1">- Total Credit</div>
              <div className="text-lg font-bold font-mono text-paprika-600">{formatCurrency(summary.totalCredit)}</div>
            </div>
            <div className="bg-paprika-50 border border-paprika-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs font-medium text-paprika-800 mb-1">Closing Balance</div>
              <div className="text-lg font-bold font-mono text-paprika-900">{formatCurrency(summary.closing)}</div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-canvas-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas-50 border-b border-canvas-200 text-xs uppercase tracking-wider text-ink-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium text-right">Debit</th>
                    <th className="px-4 py-3 font-medium text-right">Credit</th>
                    <th className="px-4 py-3 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-200">
                  {ledgerEntries.length > 0 ? (
                    ledgerEntries.map((row, i) => (
                      <tr key={row.id || i} className="hover:bg-canvas-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink-600">{formatDate(row.date)}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{row.reference_id || "-"}</td>
                        <td className="px-4 py-3 text-sm text-ink-900">{row.description}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{selectedAccount.name}</td>
                        <td className="px-4 py-3 text-sm text-ink-900 font-mono text-right">{row.debit ? formatCurrency(row.debit) : "-"}</td>
                        <td className="px-4 py-3 text-sm text-ink-900 font-mono text-right">{row.credit ? formatCurrency(row.credit) : "-"}</td>
                        <td className="px-4 py-3 text-sm text-ink-900 font-mono text-right font-semibold">{formatCurrency(row.runningBalance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-ink-500 text-sm">
                        No transactions found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white border border-canvas-200 rounded-xl shadow-sm text-ink-500">
          <Search size={48} className="mx-auto text-canvas-300 mb-4" />
          <p className="text-lg font-medium text-ink-900 mb-1">Select an account to view ledger</p>
          <p className="text-sm">Use the dropdown above to choose an account and view its transaction history.</p>
        </div>
      )}
    </div>
  );
}
