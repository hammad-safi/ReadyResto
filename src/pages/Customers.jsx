import DatePicker from "../components/ui/DatePicker";
import {  useEffect, useState, useMemo  } from "react";
import useStickyState from "../hooks/useStickyState";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Pencil, Trash2, X, User, Phone, Mail, MapPin,
  DollarSign, FileText, ChevronRight, Search, ArrowLeft,
  Receipt, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar,
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useDataCache } from "../context/DataCacheContext";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ModuleTable from "../components/ui/ModuleTable";
import Badge from "../components/ui/Badge";

const fmt = (n) => `Rs. ${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}`;

const EMPTY_FORM = { name: "", phone: "", email: "", address: "", credit: "" };

// ─── Stat card used in the ledger view ───────────────────────────────────────
function StatPill({ label, value, color = "ink" }) {
  const colors = {
    ink: "bg-canvas-100 text-ink-700",
    red: "bg-paprika-50 text-paprika-600 border border-paprika-100",
    green: "bg-green-50 text-green-700 border border-green-100",
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${colors[color]}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-70 mb-0.5">{label}</p>
      <p className="text-base font-mono font-bold">{value}</p>
    </div>
  );
}

// ─── Charges Record Panel ─────────────────────────────────────────────────────
function ChargesRecord({ customer, onClose }) {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.list("orders", { where: { customer_id: customer.id } }),
      api.list("sales_returns"),
      api.list("customer_payments", { where: { customer_id: customer.id } })
    ]).then(([ords, rets, pays]) => {
      setOrders(ords.filter(o => o.customer_id === customer.id));
      setReturns(rets);
      setPayments(pays || []);
      setLoading(false);
    });
  }, [customer.id]);

  // Build ledger rows: each paid order + any refunds linked to it
  const ledger = useMemo(() => {
    const rows = [];
    orders.forEach(o => {
      const paid = Number(o.tendered ?? o.total ?? 0) - Number(o.change_due ?? 0);
      const billed = Number(o.total ?? 0);
      const creditAdded = Math.max(0, billed - paid);
      rows.push({
        id: o.id,
        date: o.created_at ? new Date(o.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : o.time || "—",
        type: "sale",
        ref: `Order #${o.id}`,
        billed,
        paid,
        credit: creditAdded,
        status: o.status,
        refunded: Number(o.refunded_total ?? 0),
      });

      // Refunds for this order
      const orderReturns = returns.filter(r => r.order_id === o.id);
      orderReturns.forEach(r => {
        rows.push({
          id: `ret-${r.id}`,
          date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : r.time || "—",
          type: "refund",
          ref: `Refund on #${o.id}`,
          billed: 0,
          paid: 0,
          credit: -Number(r.amount ?? 0),
          status: "refunded",
          refunded: Number(r.amount ?? 0),
        });
      });
    });

    // Add payments
    payments.forEach(p => {
      rows.push({
        id: `pay-${p.id}`,
        date: p.date ? new Date(p.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : (p.created_at ? new Date(p.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"),
        type: "payment",
        ref: p.notes ? `Payment: ${p.notes}` : `Payment (${p.payment_method || 'Cash'})`,
        billed: 0,
        paid: Number(p.amount ?? 0),
        credit: -Number(p.amount ?? 0),
        status: "paid",
        refunded: 0,
      });
    });

    rows.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    return rows;
  }, [orders, returns, payments]);

  const filtered = ledger.filter(r =>
    !search || r.ref.toLowerCase().includes(search.toLowerCase()) || r.date.includes(search)
  );

  const totalBilled = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const totalPaid   = orders.reduce((s, o) => {
    const paid = Number(o.tendered ?? o.total ?? 0) - Number(o.change_due ?? 0);
    return s + paid;
  }, 0) + payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const totalRefunds = returns.filter(r => orders.some(o => o.id === r.order_id))
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const currentCredit = Number(customer.credit ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas-50">
      {/* Top bar */}
      <div className="bg-white border-b border-canvas-200 px-6 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={onClose}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-canvas-200 hover:bg-canvas-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <User size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-ink-900 text-lg leading-tight truncate">{customer.name}</h2>
            <p className="text-xs text-ink-500 truncate">
              {customer.phone && <span className="mr-3">{customer.phone}</span>}
              {customer.email}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentCredit > 0 ? "bg-paprika-50 text-paprika-600" : "bg-green-50 text-green-700"}`}>
            {currentCredit > 0 ? `${fmt(currentCredit)} Due` : "All Clear"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatPill label="Total Orders" value={orders.length} color="blue" />
          <StatPill label="Total Billed" value={fmt(totalBilled)} color="ink" />
          <StatPill label="Total Paid" value={fmt(totalPaid)} color="green" />
          <StatPill label="Balance Due" value={fmt(currentCredit)} color={currentCredit > 0 ? "red" : "green"} />
        </div>

        {/* Title + search */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
            <FileText size={18} className="text-paprika-500" />
            Charges Record
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search records…"
              className="pl-9 pr-3 py-2 text-sm border border-canvas-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 w-52"
            />
          </div>
        </div>

        {/* Ledger table */}
        {loading ? (
          <div className="text-center py-20 text-ink-400 text-sm">Loading records…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Receipt size={36} className="mx-auto text-ink-300 mb-3" />
            <p className="text-sm font-semibold text-ink-500">No charge records found</p>
            <p className="text-xs text-ink-400 mt-1">Orders placed for this customer will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-canvas-200 shadow-soft overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_100px_100px_110px_90px] gap-3 px-4 py-3 bg-canvas-50 border-b border-canvas-200 text-[10px] font-extrabold uppercase tracking-widest text-ink-500">
              <span>Reference</span>
              <span className="text-right">Billed</span>
              <span className="text-right">Paid</span>
              <span className="text-right">Refund</span>
              <span className="text-right">Credit Δ</span>
              <span className="text-center">Status</span>
            </div>

            {filtered.map((row, idx) => (
              <div
                key={row.id}
                className={`grid grid-cols-[1fr_100px_100px_100px_110px_90px] gap-3 px-4 py-3 items-center text-sm border-b border-canvas-100 last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-canvas-50/40"} hover:bg-blue-50/30 transition-colors`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {row.type === "refund"
                      ? <TrendingUp size={14} className="text-green-500 shrink-0 rotate-180" />
                      : row.type === "payment"
                      ? <DollarSign size={14} className="text-green-500 shrink-0" />
                      : <Receipt size={14} className="text-paprika-500 shrink-0" />
                    }
                    <span className="font-semibold text-ink-900 truncate">{row.ref}</span>
                  </div>
                  <span className="text-[11px] text-ink-400 ml-5">{row.date}</span>
                </div>
                <div className="text-right font-mono text-ink-700">{row.billed > 0 ? fmt(row.billed) : "—"}</div>
                <div className="text-right font-mono text-green-700">{row.paid > 0 ? fmt(row.paid) : "—"}</div>
                <div className="text-right font-mono text-blue-600">{row.refunded > 0 ? fmt(row.refunded) : "—"}</div>
                <div className={`text-right font-mono font-bold ${row.credit > 0 ? "text-paprika-600" : row.credit < 0 ? "text-green-600" : "text-ink-400"}`}>
                  {row.credit > 0 ? `+${fmt(row.credit)}` : row.credit < 0 ? `-${fmt(Math.abs(row.credit))}` : "—"}
                </div>
                <div className="flex justify-center">
                  {row.status === "paid" && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-100">
                      <CheckCircle size={9} /> Paid
                    </span>
                  )}
                  {row.status === "refunded" && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                      <ChevronRight size={9} /> Refund
                    </span>
                  )}
                  {row.status === "held" && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-saffron-50 text-saffron-600 text-[10px] font-bold border border-saffron-100">
                      <Clock size={9} /> Held
                    </span>
                  )}
                  {!["paid", "refunded", "held"].includes(row.status) && (
                    <span className="px-2 py-0.5 rounded-full bg-canvas-100 text-ink-500 text-[10px] font-bold capitalize">
                      {row.status}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Running total footer */}
            <div className="grid grid-cols-[1fr_100px_100px_100px_110px_90px] gap-3 px-4 py-3 bg-canvas-100 border-t-2 border-canvas-200 text-sm font-bold text-ink-900">
              <span>Totals</span>
              <span className="text-right font-mono">{fmt(totalBilled)}</span>
              <span className="text-right font-mono text-green-700">{fmt(totalPaid)}</span>
              <span className="text-right font-mono text-blue-600">{fmt(totalRefunds)}</span>
              <span className={`text-right font-mono ${currentCredit > 0 ? "text-paprika-600" : "text-green-700"}`}>
                {currentCredit > 0 ? `${fmt(currentCredit)} Due` : "Settled"}
              </span>
              <span />
            </div>
          </div>
        )}

        {/* Address info */}
        {customer.address && (
          <div className="mt-4 flex items-start gap-2 text-sm text-ink-500">
            <MapPin size={14} className="shrink-0 mt-0.5 text-ink-400" />
            <span>{customer.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit Customer Modal ────────────────────────────────────────────────
function CustomerFormModal({ open, editing, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(editing
        ? { name: editing.name || "", phone: editing.phone || "", email: editing.email || "", address: editing.address || "", credit: editing.credit ?? "" }
        : EMPTY_FORM
      );
    }
  }, [open, editing]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Customer name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    return e;
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        credit: form.credit !== "" ? Number(form.credit) : 0,
      };
      if (editing) {
        await api.update("customers", editing.id, payload, { user: user?.name, module: "Customer", action: `Updated customer ${editing.name}` });
      } else {
        await api.create("customers", { ...payload, visits: 0, points: 0, total_billed: 0, total_paid: 0, tier: "Silver" }, { user: user?.name, module: "Customer", action: "Added new customer" });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, placeholder, type = "text", extra = {}) => (
    <div className={extra.fullWidth ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-bold text-ink-800 mb-1">
        {label}
        {extra.required && <span className="text-paprika-500 ml-0.5">*</span>}
        {extra.optional && <span className="text-ink-400 font-normal ml-1 text-xs">(optional)</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: undefined })); }}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all ${errors[key] ? "border-paprika-400 bg-paprika-50/30" : "border-canvas-200"}`}
      />
      {errors[key] && <p className="text-xs text-paprika-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors[key]}</p>}
    </div>
  );

  return (
   <Modal
  open={open}
  onClose={onClose}
  onSubmit={handleSave}
  title={editing ? "Edit Customer" : "Add New Customer"}
  width="max-w-lg"
  footer={
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end w-full">
      <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={onClose}>Cancel</Button>
      <Button variant="primary" size="sm" className="w-full sm:w-auto" disabled={saving} onClick={handleSave}>
        {saving ? "Saving…" : editing ? "Save Changes" : "Save Customer"}
      </Button>
    </div>
  }
>
  <div className="space-y-4">
    {!editing && (
      <p className="text-xs text-ink-500 -mt-1 mb-2">
        Create a new customer account for tracking details and balance.
      </p>
    )}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {field("name", "Customer Name", "e.g. Ahmad Khan", "text", { fullWidth: true, required: true })}
      {field("phone", "Phone Number", "e.g. 0312-1234567", "text", { required: true })}
      {field("email", "Email", "Optional", "email", {})}
      {field("address", "Address", "Home or business address", "text", { fullWidth: true, optional: true })}
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="opening_balance" className="block text-xs font-medium text-ink-700">
          Opening Balance (Rs)
        </label>
        <input
          id="opening_balance"
          type="number"
          min={0}
          value={form.credit}
          onChange={(e) => setForm((p) => ({ ...p, credit: e.target.value }))}
          placeholder="0"
          className="w-full rounded-lg border border-canvas-200 bg-white px-3 py-2 text-right font-mono text-sm text-ink-900 shadow-sm outline-none transition-all focus:border-paprika-500 focus:ring-1 focus:ring-paprika-500"
        />
        <p className="text-[11px] text-ink-500">If customer already owes money, enter the amount here.</p>
      </div>
    </div>
  </div>
</Modal>
  );
}

// ─── Customer Payment Modal ───────────────────────────────────────────────────
function CustomerPaymentModal({ open, customer, onClose, onSaved }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && customer) {
      setAmount("");
      setPaymentMethod("Cash");
      setNotes("");
      setDate(new Date().toLocaleDateString('en-CA'));
      setError("");
    }
  }, [open, customer]);

  const handleSave = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (Number(amount) > Number(customer?.credit || 0)) {
      setError(`Amount cannot exceed the current balance of ${fmt(customer?.credit)}.`);
      return;
    }
    setSaving(true);
    try {
      // 1. Create payment record
      await api.create("customer_payments", {
        customer_id: customer.id,
        customer_name: customer.name,
        amount: Number(amount),
        payment_method: paymentMethod,
        notes: notes,
        date: date,
      }, { user: user?.name, module: "Customer", action: `Recorded payment for ${customer.name}` });

      // Note: credit and total_paid are updated automatically by the
      // api.create("customer_payments") handler in client.js — no need to update here.

      onSaved();
    } catch (e) {
      setError("Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      width="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end w-full">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white border-transparent" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Record Payment"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-canvas-50 p-3 rounded-xl border border-canvas-200">
          <div>
            <p className="text-xs text-ink-500 font-bold uppercase tracking-wider">Customer</p>
            <p className="font-semibold text-ink-900">{customer.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500 font-bold uppercase tracking-wider">Current Balance</p>
            <p className="font-bold font-mono text-paprika-600">{fmt(customer.credit)}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-800 mb-1">Payment Amount (Rs) <span className="text-paprika-500">*</span></label>
          <input
            type="number"
            min={1}
            max={customer.credit}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            className="w-full border border-canvas-200 rounded-xl px-4 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 font-mono text-right transition-all"
            placeholder="0"
          />
          {error && <p className="text-xs text-paprika-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-ink-800 mb-1">Date</label>
            <DatePicker  
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-canvas-200 rounded-xl px-4 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink-800 mb-1">Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-canvas-200 rounded-xl px-4 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-800 mb-1">Notes <span className="text-ink-400 font-normal ml-1 text-xs">(optional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-canvas-200 rounded-xl px-4 py-2.5 text-sm bg-canvas-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
            placeholder="Reference number or remarks..."
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Customers Page ──────────────────────────────────────────────────────
export default function Customers() {
  const { getData, cacheTick } = useDataCache();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(searchParamVal);

  useEffect(() => {
    setSearchQuery(searchParamVal);
  }, [searchParamVal]);

  const [chargesCustomer, setChargesCustomer] = useState(null);
  const [paymentCustomer, setPaymentCustomer] = useState(null);

  // Filters
  const [balanceFilter, setBalanceFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => {
    setLoading(true);
    getData("customers").then(data => { setRows(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [cacheTick]);

  const handleDelete = async () => {
    await api.remove("customers", confirmDelete.id, { user: user?.name, module: "Customer", action: `Deleted customer ${confirmDelete.name}` });
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
        r.email?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q)
      );
    }
    if (balanceFilter === "Has Balance") data = data.filter(r => Number(r.credit || 0) > 0);
    if (balanceFilter === "Settled")     data = data.filter(r => Number(r.credit || 0) <= 0);
    if (tierFilter !== "All")            data = data.filter(r => r.tier === tierFilter);
    return data;
  }, [rows, searchQuery, balanceFilter, tierFilter]);

  const activeFilterCount =
    (balanceFilter !== "All" ? 1 : 0) +
    (tierFilter !== "All" ? 1 : 0) +
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const clearFilters = () => {
    setBalanceFilter("All");
    setTierFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  const columns = [
    {
      key: "name",
      header: "Customer",
      sortKey: "name",
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0 font-bold text-blue-700 text-sm">
            {r.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 truncate">{r.name}</p>
            {r.address && <p className="text-[10px] text-ink-400 truncate flex items-center gap-0.5"><MapPin size={9} /> {r.address}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      sortKey: "phone",
      render: (r) => (
        <div className="text-ink-600 flex items-center gap-1 text-xs">
          <Phone size={11} className="text-ink-300 shrink-0" />
          {r.phone || "—"}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortKey: "email",
      render: (r) => (
        <div className="text-ink-500 flex items-center gap-1 text-xs truncate max-w-[160px]">
          <Mail size={11} className="text-ink-300 shrink-0" />
          <span className="truncate">{r.email || "—"}</span>
        </div>
      ),
    },
    {
      key: "visits",
      header: "Visits",
      sortKey: "visits",
      align: "center",
      render: (r) => (
        <span className="font-mono text-ink-700 text-xs font-semibold">{r.visits ?? 0}</span>
      ),
    },
    {
      key: "credit",
      header: "Balance Due",
      sortKey: "credit",
      align: "right",
      render: (r) => (
        (r.credit ?? 0) > 0
          ? <span className="text-xs font-mono font-bold text-paprika-600">{fmt(r.credit)}</span>
          : <span className="text-xs font-mono font-semibold text-green-600">Settled</span>
      ),
    },
    {
      key: "total_billed",
      header: "Billed",
      sortKey: "total_billed",
      align: "right",
      render: (r) => <span className="text-xs font-mono text-ink-700">{fmt(r.total_billed ?? 0)}</span>,
    },
    {
      key: "total_paid",
      header: "Paid",
      sortKey: "total_paid",
      align: "right",
      render: (r) => <span className="text-xs font-mono text-green-700">{fmt(r.total_paid ?? 0)}</span>,
    },
    {
      key: "_actions",
      header: "Actions",
      alwaysVisible: true,
      align: "center",
      render: (r) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {(r.credit ?? 0) > 0 && (
            <button
              title="Record Payment"
              onClick={() => setPaymentCustomer(r)}
              className="h-7 px-2 flex items-center gap-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-bold transition-colors border border-green-100"
            >
              <DollarSign size={11} /> Pay
            </button>
          )}
          <button
            title="Charges Record"
            onClick={() => setChargesCustomer(r)}
            className="h-7 px-2 flex items-center gap-1 rounded-lg bg-paprika-50 text-paprika-600 hover:bg-paprika-100 text-[10px] font-bold transition-colors border border-paprika-100"
          >
            <FileText size={11} /> Record
          </button>
          <button
            title="Edit"
            onClick={() => { setEditing(r); setModalOpen(true); }}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-canvas-100 text-ink-500 hover:text-paprika-600 transition-colors border border-canvas-200"
          >
            <Pencil size={13} />
          </button>
          <button
            title="Delete"
            onClick={() => setConfirmDelete(r)}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-paprika-50 text-ink-500 hover:text-paprika-600 transition-colors border border-canvas-200"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  // Show charges record full-screen overlay
  if (chargesCustomer) {
    return (
      <ChargesRecord
        customer={chargesCustomer}
        onClose={() => { setChargesCustomer(null); load(); }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Guests"
        title="Customer Management"
        description="Manage customers, track balances, and view charge records."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Customer
          </Button>
        }
      />

      <ModuleTable
        columns={columns}
        data={filtered}
        storageKey="customers_visible_cols"
        searchPlaceholder="Search name, phone, email, address…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        emptyLabel={loading ? "Loading customers…" : "No customers found. Add one to get started."}
        filterContent={
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Balance Status</p>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30"
              >
                <option value="All">All customers</option>
                <option value="Has Balance">Has Due Balance</option>
                <option value="Settled">Fully Settled</option>
              </select>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Tier</p>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30"
              >
                <option value="All">All tiers</option>
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">From Date</p>
              <div className="relative">
                <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <DatePicker   value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
            </div>
          </div>
        }
      />

      {/* Add / Edit Modal */}
      <CustomerFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />

      {/* Record Payment Modal */}
      <CustomerPaymentModal
        open={!!paymentCustomer}
        customer={paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        onSaved={() => { setPaymentCustomer(null); load(); }}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Customer?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Permanently</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This will permanently remove <span className="font-semibold text-ink-900">{confirmDelete?.name}</span> and all their records. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
