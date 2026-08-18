import {  useEffect, useState, useMemo  } from "react";
import useStickyState from "../hooks/useStickyState";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Pencil, Trash2, CreditCard,
  AlertCircle, CheckCircle, Building2,
  Phone, Calendar,
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useDataCache } from "../context/DataCacheContext";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Badge, { statusTone } from "../components/ui/Badge";
import ModuleTable from "../components/ui/ModuleTable";
import DatePicker from "../components/ui/DatePicker";

const fmt = (n) => `Rs. ${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}`;

const SUPPLIER_FIELDS = [
  { key: "name", label: "Supplier / Business Name", type: "text", fullWidth: true },
  { key: "phone", label: "Phone", type: "text" },
  { key: "category", label: "Category", type: "select", options: ["Meat & Poultry", "Vegetables", "Dairy", "Dry Goods", "Beverages"] },
  { key: "due", label: "Opening Due Balance (Rs.)", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["active", "blocked"] },
];

const EMPTY_SUPPLIER = { name: "", phone: "", category: "Dry Goods", due: 0, status: "active" };
const EMPTY_PAYMENT  = { amount: "", payment_method: "Cash", notes: "", date: "" };

// ─── Add / Edit Supplier Modal ────────────────────────────────────────────────
function SupplierFormModal({ open, editing, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(editing
        ? { name: editing.name || "", phone: editing.phone || "", category: editing.category || "Dry Goods", due: editing.due ?? 0, status: editing.status || "active" }
        : EMPTY_SUPPLIER
      );
    }
  }, [open, editing]);

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Supplier name is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, due: Number(form.due || 0) };
      if (editing) {
        await api.update("suppliers", editing.id, payload, { user: user?.name, module: "Supplier", action: `Updated supplier ${editing.name}` });
      } else {
        await api.create("suppliers", payload, { user: user?.name, module: "Supplier", action: "Added new supplier" });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Supplier" : "Add New Supplier"}
      width="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Supplier"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SUPPLIER_FIELDS.map(f => (
            <div key={f.key} className={f.fullWidth ? "sm:col-span-2" : ""}>
              <label className="block text-sm font-bold text-ink-800 mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={form[f.key] ?? ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-canvas-200 rounded-xl px-3 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
                >
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={form[f.key] ?? ""}
                  onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: undefined })); }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all ${errors[f.key] ? "border-paprika-400 bg-paprika-50/30" : "border-canvas-200"}`}
                />
              )}
              {errors[f.key] && <p className="text-xs text-paprika-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors[f.key]}</p>}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function PaymentModal({ open, supplier, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_PAYMENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm(EMPTY_PAYMENT); setError(""); }
  }, [open, supplier]);

  const handlePay = async () => {
    const amount = Number(form.amount || 0);
    if (!amount || amount <= 0) { setError("Enter a valid payment amount."); return; }
    if (amount > Number(supplier?.due || 0)) { setError(`Amount exceeds outstanding balance of ${fmt(supplier?.due)}.`); return; }
    setSaving(true);
    try {
      await api.paySupplier(supplier.id, {
        amount,
        payment_method: form.payment_method,
        notes: form.notes,
        date: form.date || new Date().toLocaleDateString('en-CA'),
      }, { user: user?.name });
      onSaved();
    } catch (e) {
      setError(e?.message || "Payment failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const due = Number(supplier?.due || 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Supplier Payment"
      width="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={saving || due <= 0} onClick={handlePay}>
            {saving ? "Recording…" : "Record Payment"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-canvas-50 border border-canvas-200 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 font-bold text-amber-700 text-base">
            {supplier?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <p className="font-bold text-ink-900 text-sm">{supplier?.name}</p>
            <p className="text-xs text-ink-500">{supplier?.category}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider">Outstanding Due</p>
            <p className={`text-base font-mono font-bold ${due > 0 ? "text-paprika-600" : "text-green-600"}`}>
              {fmt(due)}
            </p>
          </div>
        </div>

        {due <= 0 && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle size={16} /> No outstanding balance for this supplier.
          </div>
        )}

        {due > 0 && (
          <>
            <div>
              <label className="block text-sm font-bold text-ink-800 mb-1">Payment Amount (Rs.) *</label>
              <input
                type="number"
                min={1}
                max={due}
                value={form.amount}
                onChange={e => { setForm(p => ({ ...p, amount: e.target.value })); setError(""); }}
                placeholder={`Max: ${due.toLocaleString()}`}
                className="w-full border border-canvas-200 rounded-xl px-3 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink-800 mb-1">Payment Method</label>
              <select
                value={form.payment_method}
                onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                className="w-full border border-canvas-200 rounded-xl px-3 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
              >
                {["Cash", "Bank Transfer", "Cheque", "Mobile Banking", "Other"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-ink-800 mb-1">Payment Date</label>
              <DatePicker  
                value={form.date}
                onChange={e = /> setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-canvas-200 rounded-xl px-3 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink-800 mb-1">Notes <span className="text-ink-400 font-normal text-xs">(optional)</span></label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Invoice #123 payment"
                className="w-full border border-canvas-200 rounded-xl px-3 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
              />
            </div>
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 text-paprika-700 text-sm bg-paprika-50 border border-paprika-100 rounded-xl px-4 py-3">
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Suppliers Page ──────────────────────────────────────────────────────
export default function Suppliers() {
  const { getData } = useDataCache();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(searchParamVal);

  useEffect(() => {
    setSearchQuery(searchParamVal);
  }, [searchParamVal]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [balanceFilter, setBalanceFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [paymentSupplier, setPaymentSupplier] = useState(null);

  const load = () => {
    setLoading(true);
    getData("suppliers").then(data => { setRows(data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    await api.remove("suppliers", confirmDelete.id, { user: user?.name, module: "Supplier", action: `Deleted supplier ${confirmDelete.name}` });
    setConfirmDelete(null);
    load();
  };

  const filtered = useMemo(() => {
    let data = rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.category?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "All") data = data.filter(r => r.category === categoryFilter);
    if (statusFilter !== "All")   data = data.filter(r => r.status === statusFilter);
    if (balanceFilter === "Has Due")  data = data.filter(r => Number(r.due || 0) > 0);
    if (balanceFilter === "Settled")  data = data.filter(r => Number(r.due || 0) <= 0);
    return data;
  }, [rows, searchQuery, categoryFilter, statusFilter, balanceFilter]);

  const activeFilterCount =
    (categoryFilter !== "All" ? 1 : 0) +
    (statusFilter !== "All" ? 1 : 0) +
    (balanceFilter !== "All" ? 1 : 0);

  const clearFilters = () => {
    setCategoryFilter("All");
    setStatusFilter("All");
    setBalanceFilter("All");
  };

  const columns = [
    {
      key: "name",
      header: "Supplier",
      sortKey: "name",
      render: (s) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 font-bold text-amber-700 text-sm">
            {s.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 truncate">{s.name}</p>
            {s.phone && (
              <p className="text-[10px] text-ink-400 flex items-center gap-0.5">
                <Phone size={9} /> {s.phone}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortKey: "category",
      render: (s) => (
        <span className="text-xs bg-canvas-100 text-ink-600 px-2 py-1 rounded-lg font-medium">{s.category || "—"}</span>
      ),
    },
    {
      key: "due",
      header: "Due Balance",
      sortKey: "due",
      align: "right",
      render: (s) => (
        Number(s.due || 0) > 0
          ? <span className="text-xs font-mono font-bold text-paprika-600">{fmt(s.due)}</span>
          : <span className="text-xs font-mono font-semibold text-green-600 flex items-center gap-1 justify-end"><CheckCircle size={11} /> Settled</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (s) => <Badge tone={statusTone(s.status)}>{s.status}</Badge>,
    },
    {
      key: "_actions",
      header: "Actions",
      alwaysVisible: true,
      align: "center",
      render: (s) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            title="Record Payment"
            onClick={() => setPaymentSupplier(s)}
            disabled={Number(s.due || 0) <= 0}
            className={`h-7 px-2 flex items-center gap-1 rounded-lg text-[10px] font-bold transition-colors border ${
              Number(s.due || 0) > 0
                ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                : "bg-canvas-100 text-ink-400 border-canvas-200 cursor-not-allowed opacity-60"
            }`}
          >
            <CreditCard size={11} /> Pay
          </button>
          <button
            title="Edit"
            onClick={() => { setEditing(s); setModalOpen(true); }}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-canvas-100 text-ink-500 hover:text-paprika-600 transition-colors border border-canvas-200"
          >
            <Pencil size={13} />
          </button>
          <button
            title="Delete"
            onClick={() => setConfirmDelete(s)}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-paprika-50 text-ink-500 hover:text-paprika-600 transition-colors border border-canvas-200"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Supply Chain"
        title="Suppliers"
        description="Manage vendor profiles, purchase history, dues, and payments."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Supplier
          </Button>
        }
      />

      <ModuleTable
        columns={columns}
        data={filtered}
        storageKey="suppliers_visible_cols"
        searchPlaceholder="Search supplier name, phone, or category…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        emptyLabel={loading ? "Loading suppliers…" : "No suppliers found. Add one to get started."}
        filterContent={
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Category</p>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30"
              >
                <option value="All">All categories</option>
                {["Meat & Poultry", "Vegetables", "Dairy", "Dry Goods", "Beverages"].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Status</p>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30"
              >
                <option value="All">All statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Balance</p>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30"
              >
                <option value="All">All suppliers</option>
                <option value="Has Due">Has Outstanding Due</option>
                <option value="Settled">Fully Settled</option>
              </select>
            </div>
          </div>
        }
      />

      {/* Add / Edit Modal */}
      <SupplierFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={!!paymentSupplier}
        supplier={paymentSupplier}
        onClose={() => setPaymentSupplier(null)}
        onSaved={() => { setPaymentSupplier(null); load(); }}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Supplier?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Permanently</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This will permanently remove <span className="font-semibold text-ink-900">{confirmDelete?.name}</span>. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
