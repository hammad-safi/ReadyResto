import React, { useState, useMemo } from 'react';
import { Printer, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/format';

export default function FinancialStatements({ journal, accounts }) {
  const [subTab, setSubTab] = useState("Profit & Loss");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    branch: ""
  });

  const TABS = ["Profit & Loss", "Balance Sheet", "Cash Flow", "Trial Balance", "Accounts Receivable", "Accounts Payable"];

  const filteredJournal = useMemo(() => {
    let entries = [...journal];
    if (filters.dateFrom) entries = entries.filter(j => new Date(j.date || j.created_at) >= new Date(filters.dateFrom));
    if (filters.dateTo) entries = entries.filter(j => new Date(j.date || j.created_at) <= new Date(filters.dateTo));
    // Branch filtering skipped for now since journal lines don't natively have branch yet, just headers
    return entries;
  }, [journal, filters]);

  // P&L Calculation
  const plData = useMemo(() => {
    const revenue = filteredJournal.filter(j => accounts.find(a => a.code === j.account_code)?.type?.toLowerCase() === "revenue")
                           .reduce((s, j) => s + (Number(j.credit || 0) - Number(j.debit || 0)), 0);
    const cogs = filteredJournal.filter(j => j.account_code === "5001" || accounts.find(a => a.code === j.account_code)?.type?.toLowerCase() === "cogs")
                        .reduce((s, j) => s + (Number(j.debit || 0) - Number(j.credit || 0)), 0);
    const expenses = filteredJournal.filter(j => accounts.find(a => a.code === j.account_code)?.type?.toLowerCase() === "expense" && j.account_code !== "5001")
                            .reduce((s, j) => s + (Number(j.debit || 0) - Number(j.credit || 0)), 0);
    
    return { revenue, cogs, gross: revenue - cogs, expenses, net: (revenue - cogs) - expenses };
  }, [filteredJournal, accounts]);

  // Balance Sheet Calculation
  const bsData = useMemo(() => {
    const assets = accounts.filter(a => a.type?.toLowerCase() === "asset").map(a => {
      const net = filteredJournal.filter(j => j.account_code === a.code).reduce((s, j) => s + (Number(j.debit || 0) - Number(j.credit || 0)), 0);
      return { ...a, balance: Number(a.opening_balance || 0) + net };
    }).filter(a => a.balance !== 0);

    const liabilities = accounts.filter(a => a.type?.toLowerCase() === "liability").map(a => {
      const net = filteredJournal.filter(j => j.account_code === a.code).reduce((s, j) => s + (Number(j.credit || 0) - Number(j.debit || 0)), 0);
      return { ...a, balance: Number(a.opening_balance || 0) + net };
    }).filter(a => a.balance !== 0);

    const equityAccounts = accounts.filter(a => a.type?.toLowerCase() === "equity").map(a => {
      const net = filteredJournal.filter(j => j.account_code === a.code).reduce((s, j) => s + (Number(j.credit || 0) - Number(j.debit || 0)), 0);
      return { ...a, balance: Number(a.opening_balance || 0) + net };
    }).filter(a => a.balance !== 0);

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquityRaw = equityAccounts.reduce((s, a) => s + a.balance, 0);
    const totalEquity = totalEquityRaw + plData.net; // Include current period profit

    return { assets, liabilities, equityAccounts, totalAssets, totalLiabilities, totalEquity, isBalanced: totalAssets === (totalLiabilities + totalEquity) };
  }, [filteredJournal, accounts, plData.net]);

  // Trial Balance Calculation
  const trialBalance = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map(a => {
      const entries = filteredJournal.filter(j => j.account_code === a.code);
      if (entries.length === 0 && !a.opening_balance) return null;

      const isNormalDebit = a.type?.toLowerCase() === "asset" || a.type?.toLowerCase() === "expense";
      const opening = Number(a.opening_balance || 0);
      let debitSum = entries.reduce((s, j) => s + Number(j.debit || 0), 0);
      let creditSum = entries.reduce((s, j) => s + Number(j.credit || 0), 0);

      // Distribute opening balance
      if (isNormalDebit && opening > 0) debitSum += opening;
      if (isNormalDebit && opening < 0) creditSum += Math.abs(opening);
      if (!isNormalDebit && opening > 0) creditSum += opening;
      if (!isNormalDebit && opening < 0) debitSum += Math.abs(opening);

      const netBalance = debitSum - creditSum;
      let finalDebit = 0;
      let finalCredit = 0;

      if (netBalance > 0) finalDebit = netBalance;
      else if (netBalance < 0) finalCredit = Math.abs(netBalance);

      totalDebit += finalDebit;
      totalCredit += finalCredit;

      if (finalDebit === 0 && finalCredit === 0) return null;

      return { account: a, debit: finalDebit, credit: finalCredit };
    }).filter(Boolean);

    return { rows, totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  }, [filteredJournal, accounts]);

  // Simplified Cash Flow (just changes in Cash/Bank)
  const cashFlow = useMemo(() => {
    const cashAccounts = accounts.filter(a => (a.name?.toLowerCase().includes("cash") || a.name?.toLowerCase().includes("bank")) && a.type?.toLowerCase() === "asset");
    let netCashFlow = 0;
    const flows = cashAccounts.map(a => {
      const net = filteredJournal.filter(j => j.account_code === a.code).reduce((s, j) => s + (Number(j.debit || 0) - Number(j.credit || 0)), 0);
      netCashFlow += net;
      return { ...a, net };
    }).filter(a => a.net !== 0);
    return { flows, netCashFlow };
  }, [filteredJournal, accounts]);

  // AR / AP
  const arList = useMemo(() => accounts.filter(a => a.type?.toLowerCase() === "asset" && a.name?.toLowerCase().includes("receivable")), [accounts]);
  const apList = useMemo(() => accounts.filter(a => a.type?.toLowerCase() === "liability" && a.name?.toLowerCase().includes("payable")), [accounts]);


  const handlePrint = () => {
    window.print();
  };

  const handleExportDummy = (type) => {
    alert(`${type} export is coming soon in the next release!`);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${subTab === t ? "bg-paprika-50 text-paprika-700" : "bg-white text-ink-600 border border-canvas-200 hover:bg-canvas-50"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-canvas-200 shadow-sm flex flex-wrap justify-between items-end gap-4 print:hidden">
        <div className="flex flex-wrap gap-4 items-end flex-1">
          <div className="flex items-center gap-2 text-ink-900 font-bold mb-1">
            <Filter size={18} /> Filters:
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Date From</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-paprika-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Date To</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-paprika-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Branch</label>
            <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-paprika-500">
              <option value="">All Branches</option>
              <option value="Main">Main Branch</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleExportDummy("Excel")}><FileSpreadsheet size={16} className="mr-2" /> Excel</Button>
          <Button variant="secondary" onClick={() => handleExportDummy("PDF")}><Download size={16} className="mr-2" /> PDF</Button>
          <Button variant="secondary" onClick={handlePrint}><Printer size={16} className="mr-2" /> Print</Button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-canvas-200 rounded-xl shadow-sm p-8 print:p-0 print:border-none print:shadow-none">
        
        {subTab === "Profit & Loss" && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-ink-900 mb-8">Profit & Loss Statement</h2>
            <div className="space-y-6">
              
              <div>
                <h4 className="font-bold text-ink-900 uppercase tracking-wide border-b-2 border-ink-900 pb-2 mb-3">Revenue</h4>
                <div className="flex justify-between py-2 text-sm text-ink-700">
                  <span>Total Sales Revenue</span>
                  <span className="font-mono">{formatCurrency(plData.revenue)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold bg-canvas-50 px-2 mt-2">
                  <span>Total Revenue</span>
                  <span className="font-mono">{formatCurrency(plData.revenue)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-ink-900 uppercase tracking-wide border-b-2 border-ink-900 pb-2 mb-3">Cost of Goods Sold</h4>
                <div className="flex justify-between py-2 text-sm text-ink-700">
                  <span>COGS</span>
                  <span className="font-mono">{formatCurrency(plData.cogs)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold bg-canvas-50 px-2 mt-2">
                  <span>Gross Profit</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(plData.gross)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-ink-900 uppercase tracking-wide border-b-2 border-ink-900 pb-2 mb-3">Operating Expenses</h4>
                <div className="flex justify-between py-2 text-sm text-ink-700">
                  <span>Total Operating Expenses</span>
                  <span className="font-mono">{formatCurrency(plData.expenses)}</span>
                </div>
              </div>

              <div className="flex justify-between py-4 text-lg font-bold border-t-4 border-double border-ink-900">
                <span>Net Profit</span>
                <span className={`font-mono ${plData.net >= 0 ? "text-emerald-600" : "text-paprika-600"}`}>{formatCurrency(plData.net)}</span>
              </div>

            </div>
          </div>
        )}

        {subTab === "Balance Sheet" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-ink-900 mb-8">Balance Sheet</h2>
            
            <div className="mb-6 flex justify-center">
              {bsData.isBalanced ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium text-sm">
                  <CheckCircle2 size={16} /> Assets = Liabilities + Equity (Balanced)
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-paprika-50 text-paprika-700 px-4 py-2 rounded-lg font-medium text-sm">
                  <AlertTriangle size={16} /> Balance Sheet is Unbalanced! Difference: {formatCurrency(Math.abs(bsData.totalAssets - (bsData.totalLiabilities + bsData.totalEquity)))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Assets */}
              <div>
                <h4 className="font-bold text-ink-900 uppercase tracking-wide border-b-2 border-ink-900 pb-2 mb-3">Assets</h4>
                {bsData.assets.map(a => (
                  <div key={a.code} className="flex justify-between py-2 text-sm text-ink-700 border-b border-canvas-100 last:border-0">
                    <span>{a.name}</span>
                    <span className="font-mono">{formatCurrency(a.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 text-sm font-bold border-t-2 border-ink-200 mt-2">
                  <span>Total Assets</span>
                  <span className="font-mono">{formatCurrency(bsData.totalAssets)}</span>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div>
                <h4 className="font-bold text-ink-900 uppercase tracking-wide border-b-2 border-ink-900 pb-2 mb-3">Liabilities</h4>
                {bsData.liabilities.map(a => (
                  <div key={a.code} className="flex justify-between py-2 text-sm text-ink-700 border-b border-canvas-100 last:border-0">
                    <span>{a.name}</span>
                    <span className="font-mono">{formatCurrency(a.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 text-sm font-bold border-t-2 border-ink-200 mt-2 mb-8">
                  <span>Total Liabilities</span>
                  <span className="font-mono">{formatCurrency(bsData.totalLiabilities)}</span>
                </div>

                <h4 className="font-bold text-ink-900 uppercase tracking-wide border-b-2 border-ink-900 pb-2 mb-3">Equity</h4>
                {bsData.equityAccounts.map(a => (
                  <div key={a.code} className="flex justify-between py-2 text-sm text-ink-700 border-b border-canvas-100 last:border-0">
                    <span>{a.name}</span>
                    <span className="font-mono">{formatCurrency(a.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 text-sm text-ink-700 border-b border-canvas-100">
                  <span>Current Period Profit</span>
                  <span className="font-mono">{formatCurrency(plData.net)}</span>
                </div>
                <div className="flex justify-between py-3 text-sm font-bold border-t-2 border-ink-200 mt-2">
                  <span>Total Equity</span>
                  <span className="font-mono">{formatCurrency(bsData.totalEquity)}</span>
                </div>

                <div className="flex justify-between py-4 text-base font-bold border-t-4 border-double border-ink-900 mt-8">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono">{formatCurrency(bsData.totalLiabilities + bsData.totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === "Trial Balance" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-ink-900 mb-8">Trial Balance</h2>
            
            <div className="mb-6 flex justify-center">
              {trialBalance.isBalanced ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium text-sm">
                  <CheckCircle2 size={16} /> Trial Balance is Balanced
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-paprika-50 text-paprika-700 px-4 py-2 rounded-lg font-medium text-sm">
                  <AlertTriangle size={16} /> Trial Balance is Unbalanced! Difference: {formatCurrency(Math.abs(trialBalance.totalDebit - trialBalance.totalCredit))}
                </div>
              )}
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-ink-900 text-sm tracking-wider text-ink-900">
                  <th className="px-4 py-3 font-bold">Account</th>
                  <th className="px-4 py-3 font-bold text-right w-1/3">Debit</th>
                  <th className="px-4 py-3 font-bold text-right w-1/3">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-200">
                {trialBalance.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-canvas-50">
                    <td className="px-4 py-2 text-sm text-ink-700">{row.account.code} - {row.account.name}</td>
                    <td className="px-4 py-2 text-sm font-mono text-right">{row.debit > 0 ? formatCurrency(row.debit) : ""}</td>
                    <td className="px-4 py-2 text-sm font-mono text-right">{row.credit > 0 ? formatCurrency(row.credit) : ""}</td>
                  </tr>
                ))}
                {trialBalance.rows.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-ink-500 text-sm">No transactions found for this period.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-double border-ink-900 font-bold text-ink-900 bg-canvas-50">
                  <td className="px-4 py-4 text-right">Totals</td>
                  <td className="px-4 py-4 font-mono text-right">{formatCurrency(trialBalance.totalDebit)}</td>
                  <td className="px-4 py-4 font-mono text-right">{formatCurrency(trialBalance.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {subTab === "Cash Flow" && (
          <div className="max-w-3xl mx-auto text-center py-20">
            <h2 className="text-xl font-bold text-ink-900 mb-4">Cash Flow Statement (Simplified)</h2>
            <div className="inline-block text-left w-full max-w-md bg-canvas-50 p-6 rounded-xl border border-canvas-200">
              <h4 className="font-bold border-b border-canvas-300 pb-2 mb-4">Net Changes in Cash & Bank</h4>
              {cashFlow.flows.map(f => (
                <div key={f.code} className="flex justify-between py-2 text-sm border-b border-canvas-100 last:border-0">
                  <span>{f.name}</span>
                  <span className={`font-mono font-medium ${f.net >= 0 ? "text-emerald-600" : "text-paprika-600"}`}>{formatCurrency(f.net)}</span>
                </div>
              ))}
              {cashFlow.flows.length === 0 && <div className="text-ink-500 text-sm text-center py-4">No cash flow activity</div>}
              <div className="flex justify-between py-3 mt-4 text-base font-bold border-t border-ink-900">
                <span>Net Cash Flow</span>
                <span className="font-mono">{formatCurrency(cashFlow.netCashFlow)}</span>
              </div>
            </div>
          </div>
        )}

        {(subTab === "Accounts Receivable" || subTab === "Accounts Payable") && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-ink-900 mb-8">{subTab}</h2>
            <div className="bg-canvas-50 p-6 rounded-xl border border-canvas-200">
               {(subTab === "Accounts Receivable" ? arList : apList).length > 0 ? (
                 <div className="space-y-3">
                   {(subTab === "Accounts Receivable" ? arList : apList).map(a => (
                     <div key={a.code} className="flex justify-between items-center py-3 border-b border-canvas-200 last:border-0">
                       <div>
                         <div className="font-medium text-ink-900">{a.name}</div>
                         <div className="text-xs text-ink-500">{a.code}</div>
                       </div>
                       <div className="font-mono font-bold text-ink-900">
                         {formatCurrency(a.balance || 0)}
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center text-ink-500 py-8">
                   No {subTab.toLowerCase()} accounts configured or active.
                 </div>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
