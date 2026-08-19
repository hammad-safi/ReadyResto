import DatePicker from "../components/ui/DatePicker";
import { useEffect, useMemo, useState, useRef } from "react";
import { Search, Plus, Trash2, PackagePlus, FileEdit, Truck, CheckCircle2, Calendar, RotateCcw, AlertTriangle, ArrowLeftRight, Check, X, ShieldAlert, ChevronDown, Printer } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { useDialog } from "../context/DialogContext";
import StatCard from "../components/ui/StatCard";
import ModuleTable from "../components/ui/ModuleTable";
import Badge, { statusTone } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import api from "../api/client";
import { useDashboardFilters } from "../context/DashboardFilterContext";
import { useDataCache } from "../context/DataCacheContext";
import Modal from "../components/ui/Modal";
import PurchaseReceipt from "../components/pos/PurchaseReceipt";

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  displayKey = "name",
  valueKey = "id",
  renderOption,
  renderSelected,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o[valueKey]) === String(value)) || 
                   (value ? { [valueKey]: value, [displayKey]: value } : null);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options.slice(0, 20);
    return options.filter((o) => {
      const label = typeof displayKey === "function" ? displayKey(o) : o[displayKey] || "";
      return label.toLowerCase().includes(q);
    });
  }, [query, options, displayKey]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {selected && !open ? (
        <div
          onClick={() => { setOpen(true); setQuery(""); }}
          className="flex items-center gap-2 w-full border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-paprika-400 transition-colors"
        >
          {renderSelected ? renderSelected(selected) : (
            <span className="flex-1 text-ink-900 font-medium truncate">{typeof displayKey === "function" ? displayKey(selected) : selected[displayKey]}</span>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="shrink-0 text-ink-400 hover:text-paprika-600">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full border border-canvas-200 bg-white rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
          />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
      )}
      {open && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-white border border-canvas-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          <button
            type="button"
            onMouseDown={() => { onChange(null); setOpen(false); setQuery(""); }}
            className="w-full text-left px-4 py-2.5 text-xs text-ink-400 italic hover:bg-canvas-50 border-b border-canvas-100"
          >
            {placeholder}
          </button>
          {query.trim() && !options.some(o => String(o[displayKey]).toLowerCase() === query.toLowerCase().trim()) && (
            <button
              type="button"
              onMouseDown={() => {
                onChange({ [valueKey]: query.trim(), [displayKey]: query.trim() });
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-paprika-700 font-semibold hover:bg-paprika-50 border-b border-canvas-100 flex items-center gap-1.5"
            >
              <Plus size={12} className="shrink-0" /> Use custom: "{query.trim()}"
            </button>
          )}
          {filtered.map((opt) => (
            <button
              key={opt[valueKey]}
              type="button"
              onMouseDown={() => { onChange(opt); setOpen(false); setQuery(""); }}
              className={`w-full text-left px-4 py-2.5 hover:bg-paprika-50 hover:text-paprika-700 border-b border-canvas-100 last:border-0 transition-colors text-sm ${String(opt[valueKey]) === String(value) ? "bg-paprika-50/50 font-semibold" : ""}`}
            >
              {renderOption ? renderOption(opt) : (typeof displayKey === "function" ? displayKey(opt) : opt[displayKey])}
            </button>
          ))}
          {filtered.length === 0 && !query.trim() && (
            <p className="px-4 py-3 text-xs text-ink-400 text-center italic">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">{label}</p>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider text-ink-500 pb-1 border-b border-canvas-200 mb-3">
      {children}
    </p>
  );
}

// Safely parse date strings (e.g. "2026-07-31") as local midnight date object to avoid UTC timezone offset bugs
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const parts = String(dateStr).split("T")[0].split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

const TABS = ["Purchase Orders", "Purchase Returns"];
const RETURN_REASONS = [
  "Damaged / Defective Stock",
  "Expired Goods",
  "Wrong Item Received",
  "Quality Below Standard",
  "Over-supplied Quantity",
  "Other Reason"
];

export default function Purchases() {
  const { getData, cacheTick } = useDataCache();
  const { confirm } = useDialog();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [pos, setPOs] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [query, setQuery] = useState("");
  
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const { getDateRange } = useDashboardFilters();

  // New / Edit PO Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [status, setStatus] = useState("draft");
  const [poItems, setPoItems] = useState([]);
  const [invSearch, setInvSearch] = useState("");

  // Purchase Return Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnPO, setReturnPO] = useState(null);
  const [returnPOItems, setReturnPOItems] = useState([]);
  const [returnQtys, setReturnQtys] = useState({}); // { inventory_item_id: qty }
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [refundMode, setRefundMode] = useState("Deduct Supplier Due");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  // Payment at Receive
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethodPO, setPaymentMethodPO] = useState("Cash");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("Cash");
  const [splits, setSplits] = useState([{ id: 1, method: "Cash", amount: "" }]);

  // Returns Tab Filters
  const [returnSearch, setReturnSearch] = useState("");
  const [returnReasonFilter, setReturnReasonFilter] = useState("All");
  const [returnRefundFilter, setReturnRefundFilter] = useState("All");

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState(null);

  // Printing states
  const [printPOData, setPrintPOData] = useState(null);
  const [printPOItems, setPrintPOItems] = useState([]);
  const [profile, setProfile] = useState(null);

  const load = async () => {
    const [p, s, i, ret, prof] = await Promise.all([
      getData("purchase_orders", { orderBy: "id DESC" }),
      getData("suppliers"),
      getData("inventory_items"),
      getData("purchase_returns", { orderBy: "id DESC" }),
      api.getSetting("restaurant_profile")
    ]);
    setPOs(p || []);
    setSuppliers(s || []);
    setInventory(i || []);
    setPurchaseReturns(ret || []);
    setProfile(prof);
  };

  const handlePrintPOReceipt = async (po, e) => {
    e?.stopPropagation();
    const items = await api.list("purchase_order_items", { where: { po_id: po.id } });
    setPrintPOData(po);
    setPrintPOItems(items);
  };

  useEffect(() => { void load(); }, [cacheTick]);

  const totalSpend = pos.reduce((s, p) => s + Number(p.total || 0), 0);
  const receivedCount = pos.filter(p => p.status === "received").length;
  const pendingCount = pos.filter(p => ["draft", "sent", "ordered"].includes(p.status)).length;
  const totalReturnedAmount = purchaseReturns.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  const filteredPOs = useMemo(() => {
    const q = query.toLowerCase().trim();
    const globalRange = getDateRange();

    return pos.filter(p => {
      const matchesQuery = 
        String(p.id).toLowerCase().includes(q) || 
        `po-${String(p.id).padStart(4, "0")}`.toLowerCase().includes(q) ||
        `*po-${String(p.id).padStart(4, "0")}*`.toLowerCase().includes(q) ||
        String(p.invoice_number || "").toLowerCase().includes(q) ||
        (p.supplier || "").toLowerCase().includes(q);
      if (!matchesQuery) return false;

      if (supplierFilter !== "All" && p.supplier !== supplierFilter) return false;
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      
      const d = parseLocalDate(p.date);
      if (dateFrom || dateTo) {
        if (!d) return false;
        const fromD = dateFrom ? parseLocalDate(dateFrom) : null;
        const toD = dateTo ? parseLocalDate(dateTo) : null;
        if (fromD && d < fromD) return false;
        if (toD && d > toD) return false;
      } else if (globalRange.start && globalRange.end) {
        if (!d) return false;
        const startDay = new Date(globalRange.start);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(globalRange.end);
        endDay.setHours(23, 59, 59, 999);
        if (d < startDay || d > endDay) return false;
      }
      return true;
    });
  }, [pos, query, statusFilter, supplierFilter, dateFrom, dateTo, getDateRange]);

  const activeFilterCount = (statusFilter !== "All" ? 1 : 0) + (supplierFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("All");
    setSupplierFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  const openNewPO = () => {
    setSelectedPO(null);
    setSupplier("Walk-in / Unregistered Supplier");
    setDate(new Date().toLocaleDateString('en-CA'));
    setStatus("draft");
    setPoItems([]);
    setAmountPaid(0);
    setPaymentMethodPO("Cash");
    const nextInvoiceNum = `INV-${String(pos.length + 1).padStart(5, "0")}`;
    setInvoiceNumber(nextInvoiceNum);
    setSpecialNote("");
    setPaymentTerm("Cash");
    setSplits([{ id: 1, method: "Cash", amount: "" }]);
    setModalOpen(true);
  };

  const openEditPO = async (po) => {
    const items = await api.list("purchase_order_items", { where: { po_id: po.id } });
    setSelectedPO(po);
    setSupplier(po.supplier);
    setDate(po.date);
    setStatus(po.status);
    setPoItems(items.map(it => ({ ...it })));
    setAmountPaid(Number(po.amount_paid_on_receive || 0));
    setPaymentMethodPO(po.payment_method_on_receive || "Cash");
    setInvoiceNumber(po.invoice_number || "");
    setSpecialNote(po.special_note || "");
    setPaymentTerm(po.payment_term || "Cash");
    try {
      if (po.payment_details && String(po.payment_details).startsWith("[")) {
        const parsed = JSON.parse(po.payment_details);
        setSplits(parsed.map((s, idx) => ({ id: idx + 1, method: s.method, amount: s.amount })));
      } else {
        setSplits([{ id: 1, method: po.payment_method_on_receive || "Cash", amount: po.amount_paid_on_receive || "" }]);
      }
    } catch (_) {
      setSplits([{ id: 1, method: "Cash", amount: "" }]);
    }
    setModalOpen(true);
  };

  // Open Return Purchase Modal
  const openReturnModal = async (po, e) => {
    e?.stopPropagation();
    const items = await api.list("purchase_order_items", { where: { po_id: po.id } });
    setReturnPO(po);
    setReturnPOItems(items);
    
    // Initialize return quantities
    const initialQtys = {};
    items.forEach(it => {
      initialQtys[it.inventory_item_id] = 0;
    });
    setReturnQtys(initialQtys);
    setReturnReason(RETURN_REASONS[0]);
    setRefundMode("Deduct Supplier Due");
    setReturnModalOpen(true);
  };

  // Process Purchase Return Submit
  const handleReturnSubmit = async () => {
    if (!returnPO) return;
    
    const itemsToReturn = returnPOItems
      .filter(it => (returnQtys[it.inventory_item_id] || 0) > 0)
      .map(it => ({
        inventory_item_id: it.inventory_item_id,
        name: it.name,
        qty: Number(returnQtys[it.inventory_item_id]),
        cost: Number(it.cost || 0),
        unit: it.unit
      }));

    if (itemsToReturn.length === 0) {
      alert("Please enter a return quantity greater than 0 for at least one item.");
      return;
    }

    // Double check available stock
    for (const it of itemsToReturn) {
      const invItem = inventory.find(inv => inv.id === it.inventory_item_id);
      const available = invItem ? Number(invItem.stock || 0) : 0;
      if (available < it.qty) {
        alert(`Cannot return "${it.name}". Requested return qty (${it.qty}) exceeds available stock (${available} ${it.unit}).`);
        return;
      }
    }

    setSubmittingReturn(true);
    try {
      await api.returnPurchaseOrder(returnPO.id, {
        itemsToReturn,
        reason: returnReason,
        refundMode
      });
      setReturnModalOpen(false);
      load();
    } catch (err) {
      alert(err.message || "Failed to process purchase return.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Confirm Delete PO
  const confirmDeletePO = (po, e) => {
    e?.stopPropagation();
    setPoToDelete(po);
    setDeleteModalOpen(true);
  };

  const handleDeletePO = async () => {
    if (!poToDelete) return;
    await api.deletePurchaseOrder(poToDelete.id);
    setDeleteModalOpen(false);
    setPoToDelete(null);
    load();
  };

  // Direct Receive Action from table
  const handleQuickReceive = async (po, e) => {
    e?.stopPropagation();
    if (await confirm(`Receive PO #${String(po.id).padStart(4, "0")}? This will update stock levels and supplier due balances.`)) {
      const items = await api.list("purchase_order_items", { where: { po_id: po.id } });
      await api.processPurchaseOrder({ ...po, status: "received" }, items);
      load();
    }
  };

  const filteredInventory = useMemo(() => {
    const q = invSearch.toLowerCase().trim();
    let list = [...inventory];
    if (q) {
      list = list.filter(i => 
        i.name.toLowerCase().includes(q) || 
        String(i.sku || "").toLowerCase().includes(q)
      );
    }
    
    // Sort so items below reorder level (low stock) are placed first
    list.sort((a, b) => {
      const lowA = Number(a.stock || 0) <= Number(a.reorder || 0) ? 1 : 0;
      const lowB = Number(b.stock || 0) <= Number(b.reorder || 0) ? 1 : 0;
      return lowB - lowA;
    });
    
    return list.slice(0, 10);
  }, [inventory, invSearch]);

  // Handle SKU exact match in inventory search (for barcode scanner)
  useEffect(() => {
    const q = invSearch.trim();
    if (!q) return;
    const exactMatch = inventory.find(
      i => String(i.sku || "").toLowerCase() === q.toLowerCase()
    );
    if (exactMatch) {
      addInvItem(exactMatch);
      setInvSearch(""); // Clear search to be ready for next scan
    }
  }, [invSearch, inventory]);

  const addInvItem = (item) => {
    setPoItems(prev => {
      const existing = prev.find(it => it.inventory_item_id === item.id);
      if (existing) {
        return prev.map(it => it.inventory_item_id === item.id ? { ...it, qty: Number(it.qty) + 1 } : it);
      }
      return [...prev, { inventory_item_id: item.id, name: item.name, unit: item.unit, qty: 1, cost: item.cost }];
    });
  };

  const updateItem = (idx, field, val) => {
    setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: Number(val) } : it));
  };

  const removeItem = (idx) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const poTotal = poItems.reduce((s, it) => s + (Number(it.qty) * Number(it.cost)), 0);

  const sumOfSplits = useMemo(() => {
    return splits.reduce((acc, s) => acc + Number(s.amount || 0), 0);
  }, [splits]);

  const remainingToAllocate = useMemo(() => {
    return poTotal - sumOfSplits;
  }, [poTotal, sumOfSplits]);

  const addSplit = () => {
    const nextId = splits.length ? Math.max(...splits.map(s => s.id)) + 1 : 1;
    const remaining = Math.max(0, remainingToAllocate);
    setSplits([...splits, { id: nextId, method: "Cash", amount: remaining > 0 ? remaining : "" }]);
  };

  const selectedSupplierObj = useMemo(() => {
    return suppliers.find(s => s.name === supplier) || null;
  }, [suppliers, supplier]);

  const supplierOptions = useMemo(() => {
    return [
      { id: "walk-in", name: "Walk-in / Unregistered Supplier" },
      ...suppliers
    ];
  }, [suppliers]);

  const supplierStats = useMemo(() => {
    if (!supplier) return { due: 0, purchased: 0, paid: 0 };
    const supplierPOs = pos.filter(p => p.supplier === supplier && (p.status === "received" || p.status === "partially_returned" || p.status === "returned"));
    const purchased = supplierPOs.reduce((acc, p) => acc + Number(p.total || 0), 0);
    const due = selectedSupplierObj ? Number(selectedSupplierObj.due || 0) : 0;
    const paid = Math.max(0, purchased - due);
    return { due, purchased, paid };
  }, [pos, supplier, selectedSupplierObj]);

  const savePO = async () => {
    const paid = status === "received"
      ? (paymentTerm === "Split" ? sumOfSplits : (paymentTerm === "Credit" ? 0 : Number(amountPaid || 0)))
      : 0;
    const poData = {
      id: selectedPO?.id,
      supplier,
      date,
      status,
      total: poTotal,
      amount_paid_on_receive: paid,
      payment_method_on_receive: paymentMethodPO,
      invoice_number: invoiceNumber,
      special_note: specialNote,
      payment_term: paymentTerm,
      payment_details: paymentTerm === "Split" ? JSON.stringify(splits) : null,
    };
    await api.processPurchaseOrder(poData, poItems);
    setModalOpen(false);
    load();
  };

  const isReadOnly = selectedPO?.was_received || selectedPO?.status === "received" || selectedPO?.status === "returned";

  // Calculate return modal totals
  const currentReturnTotal = useMemo(() => {
    return returnPOItems.reduce((s, it) => {
      const rQty = Number(returnQtys[it.inventory_item_id] || 0);
      return s + (rQty * Number(it.cost || 0));
    }, 0);
  }, [returnPOItems, returnQtys]);

  return (
    <div>
      <PageHeader
        eyebrow="Supply chain"
        title="Purchases & Vendor Orders"
        description="Create purchase orders, receive stock, record purchase returns, and track vendor balances."
        actions={
          <div className="flex gap-3 items-center">
            <Button variant="primary" icon={Plus} onClick={openNewPO}>New Purchase Order</Button>
          </div>
        }
      />

      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Spend" value={`Rs. ${totalSpend.toLocaleString()}`} icon={PackagePlus} sub="All purchases" />
        <StatCard label="Received POs" value={receivedCount} icon={CheckCircle2} sub="Inventory updated" />
        <StatCard label="Pending POs" value={pendingCount} icon={Truck} sub="Awaiting delivery" />
        <StatCard label="Total Returns" value={`Rs. ${totalReturnedAmount.toLocaleString()}`} icon={RotateCcw} sub="Returned to suppliers" />
      </div> */}

      {(() => {
        const tabsActions = (
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeTab === t ? "bg-paprika-500 text-white border-paprika-500 shadow-sm" : "border-canvas-200 text-ink-600 bg-[rgb(var(--surface-card))] hover:bg-canvas-100"
                }`}
              >
                {t} {t === "Purchase Returns" && purchaseReturns.length > 0 ? `(${purchaseReturns.length})` : ""}
              </button>
            ))}
          </div>
        );

        return (
          <>
            {activeTab === "Purchase Orders" && (
        <ModuleTable
          actions={tabsActions}
          columns={[
            { 
              key: "id", 
              header: "PO Number", 
              sortKey: "id", 
              render: (r) => <span className="font-mono text-xs font-bold text-ink-900">PO-#{String(r.id).padStart(4, "0")}</span> 
            },
            { key: "supplier", header: "Supplier", sortKey: "supplier" },
            { key: "date", header: "Order Date", sortKey: "date" },
            { 
              key: "total", 
              header: "Total Value", 
              sortKey: "total", 
              render: (r) => (
                <div className="leading-tight">
                  <span className="font-mono font-bold text-ink-900">Rs. {Number(r.total).toLocaleString()}</span>
                  {r.returned_amount > 0 && (
                    <p className="text-[10px] text-paprika-600">Returned: -Rs. {r.returned_amount.toLocaleString()}</p>
                  )}
                </div>
              ) 
            },
            { 
              key: "status", 
              header: "Status", 
              sortKey: "status", 
              render: (r) => <Badge tone={statusTone(r.status)}>{r.status.replace("_", " ")}</Badge> 
            },
            { 
              key: "_act", 
              header: "Actions", 
              alwaysVisible: true, 
              render: (r) => (
                <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                  {/* Return Action */}
                  {(r.status === "received" || r.status === "partially_returned") && (
                    <button 
                      onClick={(e) => openReturnModal(r, e)} 
                      title="Return items to supplier"
                      className="status-badge status-warning rounded hover:opacity-80"
                    >
                      <RotateCcw size={12} /> Return Items
                    </button>
                  )}
                  {/* Edit Action */}
                  <button 
                    onClick={() => openEditPO(r)} 
                    title="View / Edit PO"
                    className="p-1 text-ink-500 hover:text-ink-900 rounded hover:bg-canvas-100"
                  >
                    <FileEdit size={15} />
                  </button>

                  {/* Print Invoice Action */}
                  <button
                    onClick={(e) => handlePrintPOReceipt(r, e)}
                    title="Print Purchase Invoice & Barcode"
                    className="p-1 text-ink-500 hover:text-paprika-600 rounded hover:bg-canvas-100"
                  >
                    <Printer size={15} />
                  </button>
                  {/* Delete Action */}
                  <button 
                    onClick={(e) => confirmDeletePO(r, e)} 
                    title="Delete PO"
                    className="p-1 text-ink-400 hover:text-paprika-600 rounded hover:bg-paprika-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) 
            },
          ]}
          data={filteredPOs}
          onRowClick={openEditPO}
          storageKey="purchases_visible_cols"
          searchPlaceholder="Search PO number or supplier name…"
          searchValue={query}
          onSearchChange={setQuery}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          filterContent={
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="From date">
                <div className="relative">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  <DatePicker   value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
                </div>
              </Field>
              <Field label="To date">
                <div className="relative">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  <DatePicker   value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
                </div>
              </Field>
              <Field label="Status">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                  <option value="All">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                  <option value="partially_returned">Partially Returned</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <Field label="Supplier">
                <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                  <option value="All">All suppliers</option>
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          }
        />
      )}

      {/* Purchase Returns Tab */}
      {activeTab === "Purchase Returns" && (
        <div className="space-y-4">
          <ModuleTable
            actions={tabsActions}
            columns={[
              { 
                key: "id", 
                header: "Return Log ID",
                sortKey: "id",
                render: (r) => <span className="font-mono text-xs font-bold text-ink-900">RET-#{String(r.id).padStart(4, "0")}</span> 
              },
              { 
                key: "po_id", 
                header: "PO Reference", 
                render: (r) => <span className="font-mono text-xs text-ink-700">PO-#{String(r.po_id).padStart(4, "0")}</span> 
              },
              { key: "supplier", header: "Supplier", sortKey: "supplier" },
              { key: "time", header: "Date", sortKey: "created_at", render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : r.time },
              { key: "reason", header: "Return Reason", render: (r) => <Badge status="warning">{r.reason}</Badge> },
              { key: "refund_mode", header: "Refund Mode", render: (r) => r.refund_mode ? <Badge status="neutral">{r.refund_mode}</Badge> : "—" },
              { 
                key: "total_amount", 
                header: "Amount Refunded",
                sortKey: "total_amount",
                align: "right",
                render: (r) => <span className="font-mono font-bold text-paprika-600">- Rs. {Number(r.total_amount).toLocaleString()}</span> 
              },
            ]}
            data={purchaseReturns.filter(r => {
              const q = returnSearch.toLowerCase();
              if (q && !String(r.po_id).includes(q) && !(r.supplier || "").toLowerCase().includes(q)) return false;
              if (returnReasonFilter !== "All" && r.reason !== returnReasonFilter) return false;
              if (returnRefundFilter !== "All" && r.refund_mode !== returnRefundFilter) return false;
              return true;
            })}
            searchPlaceholder="Search by PO number or supplier…"
            searchValue={returnSearch}
            onSearchChange={setReturnSearch}
            activeFilterCount={(returnReasonFilter !== "All" ? 1 : 0) + (returnRefundFilter !== "All" ? 1 : 0)}
            onClearFilters={() => { setReturnReasonFilter("All"); setReturnRefundFilter("All"); }}
            storageKey="purchase_returns_visible_cols"
            emptyLabel="No purchase returns found."
            filterContent={
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Return Reason</p>
                  <select value={returnReasonFilter} onChange={(e) => setReturnReasonFilter(e.target.value)}
                    className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                    <option value="All">All reasons</option>
                    {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Refund Mode</p>
                  <select value={returnRefundFilter} onChange={(e) => setReturnRefundFilter(e.target.value)}
                    className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                    <option value="All">All modes</option>
                    <option value="Deduct Supplier Due">Deduct Supplier Due</option>
                    <option value="Cash Refund">Cash Refund</option>
                  </select>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* ── Create / Edit Purchase Order Modal ────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPO ? `Purchase Order PO-#{String(selectedPO.id).padStart(4, "0")}` : "New Purchase Order"}
        width="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
            {!isReadOnly && (
              <Button
                variant="primary"
                onClick={savePO}
                disabled={
                  poItems.length === 0 ||
                  (status === "received" && paymentTerm === "Split" && Math.abs(remainingToAllocate) > 0.01) ||
                  !supplier ||
                  (status === "received" && supplier === "Walk-in / Unregistered Supplier" && (paymentTerm === "Credit" || Number(paymentTerm === "Split" ? sumOfSplits : amountPaid) < poTotal))
                }
              >
                {status === "received" ? "Receive & Update Stock" : "Save PO"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          
          {isReadOnly && (
            <div className="bg-basil-50 text-basil-800 border border-basil-200 rounded-xl p-3 text-sm flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-basil-600" />
              <div>
                <p className="font-semibold">This Purchase Order has been Received</p>
                <p className="text-xs text-basil-700">Stock levels and supplier payable dues have been updated automatically.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Supplier">
              {isReadOnly ? (
                <div className="mt-1 w-full border border-canvas-200 bg-canvas-50 rounded-lg px-3 py-2 text-sm text-ink-500 font-semibold font-mono">
                  {supplier}
                </div>
              ) : (
                <SearchableSelect
                  value={supplier}
                  onChange={(opt) => setSupplier(opt ? opt.name : "")}
                  options={supplierOptions}
                  placeholder="Search and select supplier..."
                  displayKey="name"
                  valueKey="name"
                  className="mt-1"
                />
              )}
            </Field>
            <Field label="Order Date">
              <DatePicker   value={date} onChange={e => setDate(e.target.value)} disabled={isReadOnly} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none disabled:bg-canvas-50 disabled:text-ink-500" />
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)} disabled={isReadOnly} className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none disabled:bg-canvas-50 disabled:text-ink-500 font-medium">
                <option value="draft">Draft</option>
                <option value="sent">Sent to Supplier</option>
                <option value="received">Received (Updates Stock & Dues)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>

          {selectedSupplierObj && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-canvas-50 border border-canvas-200 rounded-xl2 p-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Outstanding Payable Due</span>
                <span className={`text-base font-mono font-bold mt-1 ${supplierStats.due > 0 ? "text-paprika-600" : "text-green-600"}`}>
                  Rs. {supplierStats.due.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-canvas-200 pt-2 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">All-Time Purchased (Billed)</span>
                <span className="text-base font-mono font-bold text-ink-800 mt-1">
                  Rs. {supplierStats.purchased.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-canvas-200 pt-2 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">All-Time Paid</span>
                <span className="text-base font-mono font-bold text-green-700 mt-1">
                  Rs. {supplierStats.paid.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Invoice / Reference #">
              <input
                type="text"
                value={invoiceNumber}
                disabled={true}
                placeholder="Auto-generating..."
                className="mt-1 w-full border border-canvas-200 bg-canvas-50 rounded-lg px-3 py-2 text-sm outline-none text-ink-500 font-mono"
              />
            </Field>
            <Field label="Special Notes">
              <input
                type="text"
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value)}
                disabled={isReadOnly}
                placeholder="Special notes about this order..."
                className="mt-1 w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none disabled:bg-canvas-50 disabled:text-ink-500"
              />
            </Field>
          </div>
          {!isReadOnly && (
            <div>
              <SectionTitle>Add Ingredients to Purchase</SectionTitle>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type="text" value={invSearch} onChange={(e) => setInvSearch(e.target.value)} placeholder="Search inventory by name..." className="w-full rounded-lg border border-canvas-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {filteredInventory.map(item => {
                  const isBelowReorder = Number(item.stock || 0) <= Number(item.reorder || 0);
                  return (
                    <button 
                      key={item.id} 
                      type="button" 
                      onClick={() => addInvItem(item)} 
                      className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                        isBelowReorder 
                          ? "border-paprika-200 bg-paprika-50 hover:bg-paprika-100 hover:border-paprika-400" 
                          : "border-canvas-200 bg-white hover:border-paprika-400 hover:bg-paprika-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
                        {item.name}
                        {isBelowReorder && <span className="inline-block h-2 w-2 rounded-full bg-paprika-500" title="Below Reorder Level" />}
                      </p>
                      <p className="text-[10px] text-ink-400">
                        {item.stock} {item.unit} in stock 
                        {isBelowReorder && <span className="text-paprika-600 font-bold ml-1">(Reorder Level: {item.reorder})</span>}
                        {!isBelowReorder && ` · Rs. ${item.cost}/${item.unit}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Order Items</SectionTitle>
            <div className="rounded-xl border border-canvas-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Ingredient</th>
                    <th className="px-3 py-2.5 text-right w-24">Qty</th>
                    <th className="px-3 py-2.5 text-left w-16">Unit</th>
                    <th className="px-3 py-2.5 text-right w-28">Cost / Unit</th>
                    <th className="px-3 py-2.5 text-right w-28">Total</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {poItems.map((item, idx) => {
                    const invItem = inventory.find(i => i.id === item.inventory_item_id || i.name === item.name);
                    const stockStr = invItem ? `${invItem.stock} ${invItem.unit}` : "";

                    return (
                      <tr key={idx} className="border-t border-canvas-100">
                        <td className="px-3 py-2 font-medium text-ink-900">
                          {item.name}
                          {stockStr && <span className="text-[10px] font-semibold text-ink-400 block">Stock: {stockStr}</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                        {isReadOnly ? <span className="font-mono">{item.qty}</span> : 
                          <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} className="w-16 rounded-lg border border-canvas-200 px-2 py-1.5 text-sm text-right font-mono outline-none" />
                        }
                      </td>
                      <td className="px-3 py-2 text-ink-500">{item.unit}</td>
                      <td className="px-3 py-2 text-right">
                        {isReadOnly ? <span className="font-mono">Rs. {item.cost}</span> : 
                          <input type="number" min={0} value={item.cost} onChange={(e) => updateItem(idx, "cost", e.target.value)} className="w-20 rounded-lg border border-canvas-200 px-2 py-1.5 text-sm text-right font-mono outline-none" />
                        }
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-ink-900">
                        Rs. {(Number(item.qty) * Number(item.cost)).toLocaleString()}
                      </td>
                      {!isReadOnly && (
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => removeItem(idx)} className="text-ink-400 hover:text-paprika-600"><Trash2 size={14}/></button>
                        </td>
                      )}
                    </tr>
                    );
                  })}
                  {poItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-ink-400 text-sm italic">
                        No items added to this PO
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment at Receive Section */}
          {status === "received" && !isReadOnly && (
            <div className="rounded-xl border border-canvas-200 overflow-hidden bg-white">
              <div className="bg-canvas-50 border-b border-canvas-200 px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-700">Payment at Receipt</span>
                  <span className="text-[10px] text-ink-400 block sm:inline sm:ml-2">(Specify how this received order was funded)</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Term Selector */}
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Payment Term</label>
                  <select
                    value={paymentTerm}
                    onChange={e => {
                      const val = e.target.value;
                      setPaymentTerm(val);
                      if (val === "Cash") {
                        setAmountPaid(poTotal);
                      } else if (val === "Credit") {
                        setAmountPaid(0);
                      } else if (val === "Split") {
                        setSplits([{ id: 1, method: "Cash", amount: poTotal }]);
                      }
                    }}
                    className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                  >
                    <option value="Cash">Cash / Immediate Payment</option>
                    <option value="Credit">Credit (Add to Supplier Payable Due)</option>
                    <option value="Split">Split Across Multiple Methods</option>
                  </select>
                </div>

                {paymentTerm === "Cash" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">Amount Paid Now (Rs.)</label>
                      <input
                        type="number"
                        min={0}
                        max={poTotal}
                        value={amountPaid}
                        onChange={e => setAmountPaid(Math.min(poTotal, Math.max(0, Number(e.target.value))))}
                        className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-paprika-500/30"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">Payment Method</label>
                      <select
                        value={paymentMethodPO}
                        onChange={e => setPaymentMethodPO(e.target.value)}
                        className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                      >
                        {["Cash", "Bank Transfer", "Cheque", "Mobile Banking"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {paymentTerm === "Credit" && (
                  <div className="bg-paprika-50 border border-paprika-200 rounded-lg p-3 text-xs text-paprika-800">
                    ℹ️ The entire order total (<strong>Rs. {poTotal.toLocaleString()}</strong>) will be recorded as outstanding credit and added to the supplier's payable due balance.
                  </div>
                )}

                {paymentTerm === "Split" && (
                  <div className="space-y-3 bg-canvas-50/50 p-3 rounded-xl border border-canvas-200">
                    <div className="flex justify-between items-center pb-2 border-b border-canvas-200">
                      <span className="text-xs font-bold text-ink-600">Split Allocation</span>
                      <span className="text-xs font-mono font-bold text-ink-500">
                        Target: Rs. {poTotal.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2.5">
                      {splits.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <select
                            value={s.method}
                            onChange={(e) => {
                              const next = [...splits];
                              next[idx].method = e.target.value;
                              setSplits(next);
                            }}
                            className="text-xs font-bold border border-canvas-200 bg-white rounded-lg py-2 px-1 outline-none w-32 shrink-0"
                          >
                            {["Cash", "Bank Transfer", "Cheque", "Mobile Banking"].map(m => (
                              <option key={m} value={m}>{m}</option>
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
                              className="w-full border border-canvas-200 bg-white rounded-lg pl-8 pr-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-paprika-500/20"
                            />
                          </div>

                          {splits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSplits(splits.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-lg border border-canvas-200 text-ink-400 hover:text-paprika-600 hover:border-paprika-200 hover:bg-paprika-50 transition-colors shrink-0"
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
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-canvas-200 bg-white text-ink-700 text-xs font-bold hover:bg-canvas-50 transition-colors"
                    >
                      <Plus size={12} /> Add Payment Method
                    </button>

                    <div className="pt-2 border-t border-canvas-200 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-ink-600">
                        <span>Total Allocated:</span>
                        <span className="font-mono font-bold">Rs. {sumOfSplits.toLocaleString()}</span>
                      </div>
                      {Math.abs(remainingToAllocate) > 0.01 ? (
                        <div className="flex justify-between text-xs font-semibold items-center">
                          <span className="text-ink-500">Remaining:</span>
                          <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                            remainingToAllocate > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-paprika-50 text-paprika-700 border border-paprika-200"
                          }`}>
                            {remainingToAllocate > 0 ? `Rs. ${remainingToAllocate.toLocaleString()} left` : `Rs. ${Math.abs(remainingToAllocate).toLocaleString()} over`}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-basil-50 text-basil-800 border border-basil-200 rounded-lg p-2 text-xs flex items-center gap-1.5">
                          <Check size={12} className="text-basil-600 font-bold" /> Allocations match target perfectly!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dynamic summary footer for payment breakdown */}
              <div className="grid grid-cols-3 gap-px bg-canvas-200">
                <div className="bg-white px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Total PO</p>
                  <p className="font-mono font-bold text-ink-900 text-sm mt-0.5">Rs. {poTotal.toLocaleString()}</p>
                </div>
                <div className="bg-white px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">Paid Now</p>
                  <p className="font-mono font-bold text-green-700 text-sm mt-0.5">
                    Rs. {(paymentTerm === "Split" ? sumOfSplits : (paymentTerm === "Credit" ? 0 : Number(amountPaid || 0))).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-paprika-600">Remaining Due</p>
                  <p className="font-mono font-bold text-paprika-600 text-sm mt-0.5">
                    Rs. {Math.max(0, poTotal - (paymentTerm === "Split" ? sumOfSplits : (paymentTerm === "Credit" ? 0 : Number(amountPaid || 0)))).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center rounded-xl bg-[rgb(var(--surface-sidebar))] text-white px-5 py-4">
            <span className="font-medium">Total Order Value</span>
            <span className="font-mono text-2xl font-bold">Rs. {poTotal.toLocaleString()}</span>
          </div>

        </div>
      </Modal>

      {/* ── Return Purchase Items Modal ───────────────────────────────────────────── */}
      <Modal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title={`Purchase Return — PO #${returnPO ? String(returnPO.id).padStart(4, "0") : ""}`}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleReturnSubmit} 
              disabled={currentReturnTotal === 0 || submittingReturn}
              className="bg-paprika-600 hover:bg-paprika-700"
            >
              {submittingReturn ? "Processing..." : `Confirm Return (Rs. ${currentReturnTotal.toLocaleString()})`}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex gap-2">
            <RotateCcw size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Return Stock to {returnPO?.supplier}</p>
              <p className="mt-0.5">Returned quantities will be automatically deducted from your Inventory Stock and your Supplier Payable Due balance will be reduced.</p>
            </div>
          </div>

          {/* Reason & Refund Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-700">Reason for Return</label>
              <select 
                value={returnReason} 
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
              >
                {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700">Refund / Credit Adjustment</label>
              <select 
                value={refundMode} 
                onChange={(e) => setRefundMode(e.target.value)}
                className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
              >
                <option value="Deduct Supplier Due">Deduct from Supplier Payable Due</option>
                <option value="Cash Refund">Received Cash Refund</option>
              </select>
            </div>
          </div>

          {/* Items Selection */}
          <div>
            <SectionTitle>Select Quantities to Return</SectionTitle>
            <div className="rounded-xl border border-canvas-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Ingredient</th>
                    <th className="px-3 py-2.5 text-right">Received</th>
                    <th className="px-3 py-2.5 text-right">Prev. Returned</th>
                    <th className="px-3 py-2.5 text-right w-28">Return Qty</th>
                    <th className="px-3 py-2.5 text-right">Unit Cost</th>
                    <th className="px-3 py-2.5 text-right">Refund Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-100">
                  {returnPOItems.map((item) => {
                    const receivedQty = Number(item.qty || 0);
                    const prevReturned = Number(item.returned_qty || 0);
                    const maxReturnable = Math.max(0, receivedQty - prevReturned);
                    const available = inventory.find(i => i.id === item.inventory_item_id)?.stock || 0;
                    const currentReturnQty = returnQtys[item.inventory_item_id] || 0;
                    const lineRefund = currentReturnQty * Number(item.cost || 0);

                    return (
                      <tr key={item.inventory_item_id} className="hover:bg-canvas-50">
                        <td className="px-3 py-2 font-medium text-ink-900">
                          {item.name}
                          <span className="text-[10px] text-ink-400 block">{item.unit} · Available: {available}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink-700">{receivedQty}</td>
                        <td className="px-3 py-2 text-right font-mono text-paprika-600">{prevReturned}</td>
                        <td className="px-3 py-2 text-right">
                          <input 
                            type="number" 
                            min={0} 
                            max={Math.min(maxReturnable, available)}
                            value={currentReturnQty}
                            onChange={(e) => {
                              const val = Math.min(maxReturnable, available, Math.max(0, Number(e.target.value)));
                              setReturnQtys(prev => ({ ...prev, [item.inventory_item_id]: val }));
                            }}
                            className="w-20 rounded-lg border border-canvas-200 px-2 py-1 text-sm text-right font-mono outline-none focus:ring-2 focus:ring-paprika-500/30"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink-600">Rs. {item.cost}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-paprika-600">
                          Rs. {lineRefund.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center rounded-xl bg-paprika-900 text-white px-5 py-4">
            <span className="font-medium">Total Return Refund Amount</span>
            <span className="font-mono text-2xl font-bold">Rs. {currentReturnTotal.toLocaleString()}</span>
          </div>
        </div>
      </Modal>

      {/* ── Delete Purchase Confirmation Modal ────────────────────────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Purchase Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-paprika-600 hover:bg-paprika-700" onClick={handleDeletePO}>
              Delete PO & Adjust Dues
            </Button>
          </>
        }
      >
        <div className="flex gap-3 items-start p-2">
          <div className="h-10 w-10 rounded-full bg-paprika-100 text-paprika-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="font-semibold text-ink-900">Are you sure you want to delete PO-#{poToDelete ? String(poToDelete.id).padStart(4, "0") : ""}</p>
            <p className="text-xs text-ink-600 mt-1">
              If this PO was marked as <strong>Received</strong>, deleting it will automatically reverse the added inventory stock and subtract the amount from the supplier's payable due balance.
            </p>
          </div>
        </div>
      </Modal>

      {printPOData && (
        <PurchaseReceipt
          po={printPOData}
          items={printPOItems}
          profile={profile}
          onClose={() => {
            setPrintPOData(null);
            setPrintPOItems([]);
          }}
        />
      )}

          </>
        );
      })()}

    </div>
  );
}
