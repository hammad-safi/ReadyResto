import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, UserRound, Banknote, CreditCard, Wallet, Split, X, Mail, Phone, AlertCircle, Check
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import api from "../../api/client";
import { playWhatsAppSound } from "../../utils/soundHelper";

const PAYMENT_METHODS = [
  { key: "Cash", icon: Banknote },
  { key: "Card", icon: CreditCard },
  { key: "Wallet", icon: Wallet },
  { key: "Credit", icon: UserRound },
];

const CASH_ROUND_STEPS = [50, 100, 500, 1000, 5000];

const fmt = (n) => `Rs. ${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}`;

export default function CheckoutModal({
  open,
  onClose,
  total,
  initialCustomer = null,
  onConfirm,
  confirmLabel = "Confirm & Print Receipt",
}) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const [customerSearch, setCustomerSearch] = useState(initialCustomer ? initialCustomer.name : "");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [amountPayingNow, setAmountPayingNow] = useState(total.toString());
  
  // Payment states
  const [payMethod, setPayMethod] = useState("Cash");
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState([{ method: "Cash", amount: "" }]);
  const [tendered, setTendered] = useState(total.toString());

  // Add-new-customer form state
  const [addCustMode, setAddCustMode] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustOpening, setNewCustOpening] = useState("");
  const [savingCust, setSavingCust] = useState(false);
  
  const customerSearchRef = useRef(null);

  // Load customers
  const loadCustomers = () => {
    api.list("customers").then(setCustomers);
  };

  useEffect(() => {
    if (open) {
      loadCustomers();
      setSelectedCustomer(initialCustomer);
      setCustomerSearch(initialCustomer ? initialCustomer.name : "");
      setAmountPayingNow(total.toString());
      setPayMethod("Cash");
      setSplitMode(false);
      setSplits([{ method: "Cash", amount: "" }]);
      setTendered(total.toString());
      setAddCustMode(false);
    }
  }, [open, initialCustomer]);

  // Derived customer account values
  const previousBalance = selectedCustomer ? (selectedCustomer.credit || 0) : 0;
  const newPurchase = total;
  const totalAfterSale = previousBalance + newPurchase;
  const parsedAmountPayingNow = amountPayingNow !== "" ? Number(amountPayingNow) : null;
  const amountPayingNowValid =
    parsedAmountPayingNow === null || (parsedAmountPayingNow >= 0 && parsedAmountPayingNow <= totalAfterSale);

  const targetPayment = (selectedCustomer && parsedAmountPayingNow !== null) ? parsedAmountPayingNow : total;
  const sumOfSplits = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  const remainingToAllocate = targetPayment - sumOfSplits;
  const splitValid = !splitMode || (splits.length > 0 && splits.every(s => s.amount !== "" && Number(s.amount) > 0) && Math.abs(remainingToAllocate) < 0.01);
  const changeDue = tendered !== "" ? Math.max(0, Number(tendered) - targetPayment) : 0;

  // Quick cash suggestions
  const cashSuggestions = useMemo(() => {
    if (targetPayment <= 0) return [];
    const rounded = CASH_ROUND_STEPS.map((step) => Math.ceil(targetPayment / step) * step);
    return [...new Set([targetPayment, ...rounded])].sort((a, b) => a - b).slice(0, 4);
  }, [targetPayment]);

  // Validation
  const paymentConfirmDisabled =
    (!!selectedCustomer && !amountPayingNowValid) ||
    (splitMode && !splitValid) ||
    (!splitMode && !selectedCustomer && payMethod === "Cash" && (tendered === "" || Number(tendered) < targetPayment));

  const handleConfirm = () => {
    if (paymentConfirmDisabled) return;

    const paymentDetails = splitMode
      ? JSON.stringify(splits.map(s => ({ method: s.method, amount: Number(s.amount) || 0 })))
      : null;

    const effectiveTendered = selectedCustomer && parsedAmountPayingNow !== null
      ? parsedAmountPayingNow
      : (payMethod === "Cash" && !splitMode && tendered !== "" ? Number(tendered) : total);

    const effectiveChange = selectedCustomer && parsedAmountPayingNow !== null
      ? 0
      : (payMethod === "Cash" && !splitMode ? changeDue : 0);

    const chosenPaymentMethod = splitMode
      ? splits.map(s => s.method).join(" + ")
      : payMethod;

    onConfirm({
      paymentMethod: chosenPaymentMethod,
      paymentDetails,
      tendered: effectiveTendered,
      changeDue: effectiveChange,
      customer: selectedCustomer,
      amountPayingNow: parsedAmountPayingNow,
    });
  };

  // Sound: small bell using Web Audio API
  const audioCtxRef = useRef(null);
  const playBell = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ac = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ac;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, ac.currentTime);
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.16, ac.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.28);
      o.stop(ac.currentTime + 0.29);
    } catch (err) {
      // ignore audio errors
    }
  };

  const toggleSplitMode = () => {
    if (!splitMode) {
      const half = Math.round(targetPayment / 2);
      setSplits([
        { method: "Cash", amount: String(half) },
        { method: "Card", amount: String(targetPayment - half) }
      ]);
      setSplitMode(true);
    } else {
      setSplitMode(false);
    }
  };

  const addSplit = () => {
    const currentSum = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const remaining = Math.max(0, targetPayment - currentSum);
    const usedMethods = splits.map((s) => s.method);
    const unusedMethod = PAYMENT_METHODS.find((m) => !usedMethods.includes(m.key))?.key || "Card";
    setSplits([...splits, { method: unusedMethod, amount: remaining > 0 ? String(remaining) : "" }]);
  };

  // Save a newly created customer
  const saveNewCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    setSavingCust(true);
    try {
      const newC = await api.create("customers", {
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        email: newCustEmail.trim() || "",
        address: newCustAddress.trim() || "",
        credit: newCustOpening !== "" ? Number(newCustOpening) : 0,
        visits: 0, points: 0, total_billed: 0, total_paid: 0, tier: "Silver",
      });
      loadCustomers();
      setSelectedCustomer(newC);
      setCustomerSearch(newC.name);
      setAddCustMode(false);
      setNewCustName(""); setNewCustPhone(""); setNewCustEmail("");
      setNewCustAddress(""); setNewCustOpening("");
    } finally {
      setSavingCust(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setAddCustMode(false);
      }}
      title="Checkout"
      width="max-w-4xl"
      footer={
        <div className="flex items-center justify-end w-full gap-2 pt-2 border-t border-canvas-200">
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              setAddCustMode(false);
            }}
            className="text-xs 2xl:text-sm font-bold"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={(e) => {
              playWhatsAppSound();
              handleConfirm(e);
            }}
            onPointerDown={(e) => {
              // immediate feedback on press
              playWhatsAppSound();
            }}
            onPointerUp={(e) => {
              // keep default click handler to confirm
            }}
            disabled={paymentConfirmDisabled}
            className="bg-paprika-500 hover:bg-paprika-600 text-white text-xs 2xl:text-sm font-bold shadow-md shadow-paprika-500/20 disabled:opacity-50"
          >
            <Check size={16} className="mr-1.5 inline" /> {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
        {/* ── LEFT COLUMN: Customer Selection & Account Summary ── */}
        <div className="space-y-3">
          <p className="text-[10px] 2xl:text-xs font-extrabold uppercase tracking-wider text-ink-500 mb-1">
            Customer (Optional)
          </p>

          {addCustMode ? (
            /* ── ADD NEW CUSTOMER FORM ── */
            <div className="space-y-3 bg-canvas-50/50 p-3.5 rounded-2xl border border-canvas-200">
              <div>
                <label className="text-xs font-bold text-ink-700">
                  Customer Name <span className="text-paprika-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ahmad Khan"
                  className="w-full mt-1 border border-canvas-200 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink-700">
                    Phone Number <span className="text-paprika-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="0312-1234567"
                    className="w-full mt-1 border border-canvas-200 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-700">
                    Email <span className="text-ink-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="Optional"
                    className="w-full mt-1 border border-canvas-200 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-ink-700">
                  Address <span className="text-ink-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Home or business address"
                  className="w-full mt-1 border border-canvas-200 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink-700">Opening Balance (Rs)</label>
                <input
                  type="number"
                  min={0}
                  value={newCustOpening}
                  onChange={(e) => setNewCustOpening(e.target.value)}
                  placeholder="0"
                  className="w-full mt-1 border border-canvas-200 bg-white rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  Initial debt balance before current transaction
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddCustMode(false)}
                  className="flex-1 py-2 rounded-xl border border-canvas-200 text-xs font-bold text-ink-600 hover:bg-canvas-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNewCustomer}
                  disabled={savingCust || !newCustName.trim() || !newCustPhone.trim()}
                  className="flex-1 py-2 rounded-xl bg-paprika-500 text-white text-xs font-bold hover:bg-paprika-600 transition-colors disabled:opacity-50 shadow-md shadow-paprika-500/20"
                >
                  {savingCust ? "Saving…" : "Save Customer"}
                </button>
              </div>
            </div>
          ) : (
            /* ── SEARCH / SELECTED CUSTOMER ── */
            <div className="space-y-3" ref={customerSearchRef}>
              {selectedCustomer ? (
                <div className="bg-paprika-50/60 border border-paprika-200 rounded-2xl p-3 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-paprika-100 flex items-center justify-center shrink-0">
                    <UserRound size={16} className="text-paprika-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink-900 leading-tight">{selectedCustomer.name}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5">
                      {selectedCustomer.phone && `Phone: ${selectedCustomer.phone}`}
                      {selectedCustomer.phone && selectedCustomer.email && " | "}
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                      setAmountPayingNow(total.toString());
                    }}
                    aria-label="Remove customer"
                    className="text-ink-400 hover:text-paprika-600 transition-colors shrink-0 mt-0.5"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <UserRound
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setCustomerDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 200)}
                    placeholder="Search customer name or phone…"
                    aria-label="Search customers"
                    className="w-full text-sm border border-canvas-200 bg-white rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all shadow-sm"
                  />
                  {customerDropdownOpen && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-canvas-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {customers
                        .filter((c) => {
                          const q = customerSearch.toLowerCase();
                          return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
                        })
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedCustomer(c);
                              setCustomerSearch(c.name);
                              setCustomerDropdownOpen(false);
                              setAmountPayingNow(total.toString());
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-canvas-50 border-b border-canvas-100 last:border-0 transition-colors"
                          >
                            <p className="text-sm font-semibold text-ink-900">{c.name}</p>
                            <p className="text-xs text-ink-400">
                              {c.phone}
                              {c.credit > 0 ? ` · ${fmt(c.credit)} credit due` : ""}
                            </p>
                          </button>
                        ))}
                      {customers.filter((c) => {
                        const q = customerSearch.toLowerCase();
                        return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
                      }).length === 0 && (
                        <p className="px-4 py-3 text-xs text-ink-400 text-center">No customers found</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* + New Customer Button */}
              {!selectedCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    setAddCustMode(true);
                    setCustomerSearch("");
                    setCustomerDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-canvas-300 text-paprika-600 text-xs sm:text-sm font-bold hover:bg-paprika-50 hover:border-paprika-300 transition-all"
                >
                  <Plus size={15} /> Add New Customer
                </button>
              )}

              {/* Customer Account Summary Ledger */}
              {selectedCustomer && (
                <div className="rounded-2xl border border-canvas-200 bg-canvas-50/50 overflow-hidden shadow-sm">
                  <div className="px-4 py-2 border-b border-canvas-200 bg-white">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-500">
                      Customer Account Ledger
                    </p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-ink-500">Previous Balance:</span>
                      <span
                        className={`font-mono font-bold ${
                          previousBalance > 0 ? "text-paprika-600" : "text-basil-600"
                        }`}
                      >
                        Rs {previousBalance.toLocaleString()}.00
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-ink-500">New Purchase:</span>
                      <span className="font-mono font-bold text-ink-800">
                        +Rs {newPurchase.toLocaleString()}.00
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm pt-2 border-t border-canvas-200">
                      <span className="font-bold text-ink-900">Total Account Debt:</span>
                      <span
                        className={`font-mono font-extrabold text-sm sm:text-base ${
                          totalAfterSale > 0 ? "text-paprika-600" : "text-basil-600"
                        }`}
                      >
                        Rs {totalAfterSale.toLocaleString()}.00
                      </span>
                    </div>
                    <div className="pt-2">
                      <label className="text-xs font-bold text-ink-700">Amount Paying Now (Rs)</label>
                      <input
                        type="number"
                        min={0}
                        max={totalAfterSale}
                        value={amountPayingNow}
                        onChange={(e) => setAmountPayingNow(e.target.value)}
                        placeholder="Enter amount"
                        className={`mt-1 w-full text-sm font-mono border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-paprika-500/20 transition-all ${
                          parsedAmountPayingNow !== null && !amountPayingNowValid
                            ? "border-paprika-400 bg-paprika-50"
                            : "border-canvas-200 bg-white"
                        }`}
                      />
                      {parsedAmountPayingNow !== null && !amountPayingNowValid && (
                        <p className="flex items-center gap-1 text-xs text-paprika-600 mt-1 font-medium">
                          <AlertCircle size={12} /> Enter between Rs 0 and {fmt(totalAfterSale)}
                        </p>
                      )}
                      {amountPayingNowValid &&
                        amountPayingNow !== "" &&
                        Number(amountPayingNow) < totalAfterSale && (
                          <p className="text-xs text-saffron-600 mt-1 font-medium bg-saffron-50 p-2 rounded-lg border border-saffron-200">
                            ⚠ {fmt(totalAfterSale - Number(amountPayingNow))} will remain on customer's ledger
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Payment Method Selection ── */}
        <div>
          <p className="text-[10px] 2xl:text-xs font-extrabold uppercase tracking-wider text-ink-500 mb-3">
            Payment Method
          </p>

          {/* Payment Selection Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setPayMethod(m.key)}
                aria-pressed={payMethod === m.key}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  payMethod === m.key
                    ? "border-paprika-500 text-paprika-600 bg-paprika-50 shadow-sm"
                    : "border-canvas-200 text-ink-700 bg-white hover:bg-canvas-50"
                }`}
              >
                <m.icon size={18} /> {m.key}
              </button>
            ))}
          </div>

          {/* Split Payment Toggle */}
          <button
            type="button"
            onClick={toggleSplitMode}
            className={`w-full flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold py-2.5 rounded-xl border mb-3 transition-colors ${
              splitMode
                ? "border-slateblue-500 text-slateblue-600 bg-slateblue-50"
                : "border-canvas-200 text-ink-600 bg-white hover:bg-canvas-50"
            }`}
          >
            <Split size={14} /> {splitMode ? "Cancel Split Payment" : "Split Across Multiple Methods"}
          </button>

          {/* Split Payment Options OR Single Tender Inputs */}
          {splitMode ? (
            <div className="space-y-3 mb-3 bg-canvas-50/50 p-3 rounded-xl border border-canvas-200">
              <div className="flex justify-between items-center pb-2 border-b border-canvas-200">
                <span className="text-xs font-bold text-ink-600">Split Allocation</span>
                <span className="text-xs font-mono font-bold text-ink-500">
                  Target: {fmt(targetPayment)}
                </span>
              </div>
              
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {splits.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={s.method}
                      onChange={(e) => {
                        const next = [...splits];
                        next[idx].method = e.target.value;
                        setSplits(next);
                      }}
                      className="text-xs font-bold border border-canvas-200 bg-white rounded-xl py-2 px-1 outline-none w-24 shrink-0"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.key}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1 flex items-center">
                      <span className="absolute left-2.5 font-mono text-xs text-ink-400 font-bold">Rs</span>
                      <input
                        type="number"
                        min={0}
                        value={s.amount}
                        onChange={(e) => {
                          const next = [...splits];
                          next[idx].amount = e.target.value;
                          setSplits(next);
                        }}
                        placeholder="0"
                        className="w-full border border-canvas-200 bg-white rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400"
                      />
                    </div>

                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSplits(splits.filter((_, i) => i !== idx));
                        }}
                        className="p-2 rounded-xl border border-canvas-200 text-ink-400 hover:text-paprika-600 hover:border-paprika-200 hover:bg-paprika-50 transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSplit}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-canvas-200 bg-white text-ink-700 text-xs font-bold hover:bg-canvas-50 transition-colors"
              >
                <Plus size={14} /> Add Payment Method
              </button>

              <div className="pt-2 border-t border-canvas-200 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-ink-600">
                  <span>Total Allocated:</span>
                  <span className="font-mono font-bold">{fmt(sumOfSplits)}</span>
                </div>
                {Math.abs(remainingToAllocate) > 0.01 ? (
                  <div className="flex justify-between text-xs font-semibold items-center">
                    <span className="text-ink-500">Remaining:</span>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                      remainingToAllocate > 0 ? "bg-saffron-50 text-saffron-600 border border-saffron-200" : "bg-paprika-50 text-paprika-600 border border-paprika-200"
                    }`}>
                      {remainingToAllocate > 0 ? `${fmt(remainingToAllocate)} remaining` : `${fmt(Math.abs(remainingToAllocate))} over`}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs font-bold items-center text-basil-600 bg-basil-50 border border-basil-200 rounded-lg px-2 py-1 mt-0.5">
                    <span>✓ Split Complete</span>
                    <span className="font-mono">Allocated perfectly</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            payMethod === "Cash" &&
            !selectedCustomer && (
              <div className="space-y-2 mb-3">
                <label className="text-xs font-bold text-ink-600 uppercase tracking-wide block">
                  Cash Tendered
                </label>
                <input
                  type="number"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={fmt(targetPayment)}
                  className="w-full border border-canvas-200 bg-white rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all shadow-sm"
                />
                {cashSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cashSuggestions.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTendered(String(amt))}
                        className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                          Number(tendered) === amt
                            ? "bg-paprika-500 text-white border-paprika-500 shadow-sm"
                            : "border-canvas-200 text-ink-700 bg-white hover:bg-canvas-100"
                        }`}
                      >
                        {amt === targetPayment ? `Exact (${fmt(amt)})` : fmt(amt)}
                      </button>
                    ))}
                  </div>
                )}
                {tendered !== "" && Number(tendered) >= targetPayment && (
                  <div className="flex justify-between items-center text-sm font-bold mt-2 p-2.5 bg-basil-50 border border-basil-200 rounded-xl text-basil-700">
                    <span>Change Due:</span>
                    <span className="font-mono text-base">{fmt(changeDue)}</span>
                  </div>
                )}
                {tendered !== "" && Number(tendered) < targetPayment && (
                  <p className="flex items-center gap-1 text-xs text-paprika-600 font-medium mt-1.5">
                    <AlertCircle size={12} /> Tendered amount is less than total due
                  </p>
                )}
              </div>
            )
          )}

          {/* Final Total Summary Card */}
          <div className="flex justify-between items-center text-sm mt-4 pt-3 border-t-2 border-dashed border-canvas-300">
            <span className="text-ink-500 font-bold">Total Due</span>
            <span className="font-mono font-black text-xl text-ink-900">{fmt(total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
