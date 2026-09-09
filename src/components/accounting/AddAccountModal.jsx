import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

export default function AddAccountModal({ isOpen, onClose, onSubmit, editingAccount, accounts }) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "Asset",
    parent_code: "",
    description: "",
    normal_balance: "Debit",
    opening_balance: 0,
    opening_balance_date: new Date().toISOString().split('T')[0],
    currency: "PKR",
    branch: "Main Branch",
    is_active: 1
  });

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        code: editingAccount.code || "",
        name: editingAccount.name || "",
        type: editingAccount.type || "Asset",
        parent_code: editingAccount.parent_code || "",
        description: editingAccount.description || "",
        normal_balance: editingAccount.normal_balance || "Debit",
        opening_balance: editingAccount.opening_balance || 0,
        opening_balance_date: editingAccount.opening_balance_date || new Date().toISOString().split('T')[0],
        currency: editingAccount.currency || "PKR",
        branch: editingAccount.branch || "Main Branch",
        is_active: editingAccount.is_active ?? 1
      });
    } else {
      setFormData({
        code: "",
        name: "",
        type: "Asset",
        parent_code: "",
        description: "",
        normal_balance: "Debit",
        opening_balance: 0,
        opening_balance_date: new Date().toISOString().split('T')[0],
        currency: "PKR",
        branch: "Main Branch",
        is_active: 1
      });
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal open={true} title={editingAccount ? "Edit Account" : "Add Account"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pb-1">
        
        <h4 className="text-sm font-bold text-ink-900 border-b pb-1">Basic Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Account Name *</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Account Code *</label>
            <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" placeholder="e.g. 1010" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Account Type *</label>
            <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500">
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Parent Account</label>
            <select value={formData.parent_code} onChange={e => setFormData({...formData, parent_code: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500">
              <option value="">None</option>
              {accounts.filter(a => a.type === formData.type && a.code !== formData.code).map(a => (
                <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">Description</label>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" rows={2}></textarea>
        </div>

        <h4 className="text-sm font-bold text-ink-900 border-b pb-1 mt-4">Accounting Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Normal Balance</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input type="radio" name="normal_balance" value="Debit" checked={formData.normal_balance === "Debit"} onChange={e => setFormData({...formData, normal_balance: e.target.value})} /> Debit</label>
              <label className="flex items-center gap-1 text-sm"><input type="radio" name="normal_balance" value="Credit" checked={formData.normal_balance === "Credit"} onChange={e => setFormData({...formData, normal_balance: e.target.value})} /> Credit</label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Active Status</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
              <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${formData.is_active ? 'bg-paprika-500' : 'bg-canvas-300'}`} onClick={() => setFormData({...formData, is_active: formData.is_active ? 0 : 1})}>
                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${formData.is_active ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className={formData.is_active ? "text-ink-900" : "text-ink-500"}>{formData.is_active ? "Active" : "Inactive"}</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Opening Balance</label>
            <input type="number" step="0.01" value={formData.opening_balance} onChange={e => setFormData({...formData, opening_balance: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Opening Balance Date</label>
            <input type="date" value={formData.opening_balance_date} onChange={e => setFormData({...formData, opening_balance_date: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Currency</label>
            <input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Branch</label>
            <input value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-paprika-500" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-canvas-100 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Account</Button>
        </div>
      </form>
    </Modal>
  );
}
