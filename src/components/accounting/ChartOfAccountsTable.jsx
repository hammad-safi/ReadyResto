import { useState, useMemo } from "react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { Plus, Edit3, Trash2, Search, Lock, List, BookOpen, ToggleRight } from "lucide-react";
import AddAccountModal from "./AddAccountModal";
import api from "../../api/client";

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

export default function ChartOfAccountsTable({ accounts, onRefresh, confirm, fullJournal, onViewLedger }) {
  const [filterType, setFilterType] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const filteredAccounts = useMemo(() => {
    let accs = accounts.filter(a => a.is_active !== 0);
    if (filterType !== "All") accs = accs.filter(a => a.type?.toLowerCase() === filterType.toLowerCase());
    return accs.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [accounts, filterType]);

  const handleSubmit = async (formData) => {
    if (editingAccount) {
      await api.updateAccount(editingAccount.id, { ...formData });
    } else {
      await api.createAccount({ ...formData, is_system: 0 });
    }
    setIsModalOpen(false);
    onRefresh();
  };

  const handleEdit = (acc) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleDisable = async (id) => {
    if (await confirm("Are you sure you want to disable this account? It will be hidden from the active list.")) {
      await api.deleteAccount(id);
      onRefresh();
    }
  };

  const getAccountBalance = (acc) => {
    const entries = (fullJournal || []).filter(j => j.account_code === acc.code);
    let bal = Number(acc.opening_balance || 0);
    entries.forEach(j => {
      if (acc.type?.toLowerCase() === "asset" || acc.type?.toLowerCase() === "expense") {
        bal += (Number(j.debit || 0) - Number(j.credit || 0));
      } else {
        bal += (Number(j.credit || 0) - Number(j.debit || 0));
      }
    });
    return bal;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {["All", ...ACCOUNT_TYPES].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === type ? 'bg-paprika-100 text-paprika-700' : 'bg-canvas-50 text-ink-600 hover:bg-canvas-100'}`}
            >
              {type}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}>
          <Plus size={16} /> Add Account
        </Button>
      </div>

      <div className="bg-white border border-canvas-200 rounded-xl overflow-hidden shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-canvas-50 text-ink-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Account Code</th>
              <th className="px-4 py-3 font-medium">Account Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-100">
            {filteredAccounts.map(acc => {
              const balance = getAccountBalance(acc.code, acc.type);
              return (
                <tr key={acc.id} className="hover:bg-canvas-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-ink-900">{acc.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink-900 flex items-center gap-2">
                    {acc.is_system ? <Lock size={12} className="text-ink-400" /> : null} {acc.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">
                    <Badge tone={acc.type?.toLowerCase() === "asset" ? "success" : acc.type?.toLowerCase() === "liability" ? "danger" : acc.type?.toLowerCase() === "equity" ? "primary" : acc.type?.toLowerCase() === "revenue" ? "success" : "warning"}>
                      {acc.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-500">{acc.parent_code || "-"}</td>
                  <td className="px-4 py-3 text-sm text-ink-900 font-mono font-semibold text-right">
                    PKR {getAccountBalance(acc).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <Badge tone={acc.is_active ? "success" : "neutral"}>{acc.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3 flex justify-end gap-2">
                    <button onClick={() => onViewLedger && onViewLedger(acc.id)} title="View Ledger" className="p-1.5 text-ink-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <BookOpen size={16} />
                    </button>
                    <button onClick={() => handleEdit(acc)} title="Edit" className="p-1.5 text-ink-400 hover:text-paprika-600 hover:bg-paprika-50 rounded transition-colors" disabled={acc.is_system}>
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDisable(acc.id)} title="Disable" className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" disabled={acc.is_system}>
                      <ToggleRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-ink-500 text-sm">
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddAccountModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingAccount={editingAccount}
        accounts={accounts}
      />
    </div>
  );
}
