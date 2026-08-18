import { useEffect, useState } from "react";
import { 
  Plus, Search, ClipboardCheck, History, Calendar, AlertTriangle, 
  Check, FileSpreadsheet, X, Eye, PlusCircle, RefreshCw, Layers 
} from "lucide-react";
import EntityManager from "../components/entity/EntityManager";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge, { statusTone } from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import api from "../api/client";
import { useDataCache } from "../context/DataCacheContext";


// SearchableSelect Helper Component
function SearchableSelect({ value, onChange, options, placeholder = "Select...", displayKey = "name", valueKey = "id", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(opt => {
    const val = String(opt[displayKey] || "").toLowerCase();
    return val.includes(search.toLowerCase());
  });

  const selectedOpt = options.find(opt => String(opt[valueKey]) === String(value));

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none text-left focus:ring-2 focus:ring-paprika-500/30"
      >
        <span className={selectedOpt ? "text-ink-900 font-medium" : "text-ink-400"}>
          {selectedOpt ? selectedOpt[displayKey] : placeholder}
        </span>
        <span className="text-[10px] text-ink-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-canvas-200 rounded-lg shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full border border-canvas-200 bg-white rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-paprika-500/50"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {filtered.map((opt) => (
              <button
                key={String(opt[valueKey])}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-paprika-50 hover:text-paprika-700 transition-colors ${
                  String(opt[valueKey]) === String(value) ? "bg-paprika-50/50 text-paprika-700 font-bold" : "text-ink-700"
                }`}
              >
                {opt[displayKey]}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-[11px] text-ink-400 py-2">No options found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Columns for All Ingredients manager
const columns = [
  { key: "sku", header: "SKU", sortKey: "sku", render: (r) => <span className="font-mono text-xs font-semibold text-ink-600">{r.sku}</span> },
  { key: "name", header: "Ingredient", sortKey: "name" },
  { key: "category", header: "Category", sortKey: "category" },
  { key: "stock", header: "Current Stock", sortKey: "stock", render: (r) => <span className="font-semibold font-mono text-ink-800">{r.stock} {r.unit}</span> },
  { key: "min_stock", header: "Min Stock", sortKey: "min_stock", render: (r) => <span className="font-mono text-ink-500">{r.min_stock} {r.unit}</span> },
  { key: "reorder", header: "Reorder Level", sortKey: "reorder", render: (r) => <span className="font-mono text-ink-500">{r.reorder} {r.unit}</span> },
  { key: "cost", header: "Avg Cost", sortKey: "cost", render: (r) => <span className="font-mono text-ink-700">Rs. {Number(r.cost || 0).toLocaleString()}</span> },
  { key: "warehouse", header: "Warehouse", sortKey: "warehouse" },
  { key: "expiry_date", header: "Expiry Date", sortKey: "expiry_date", render: (r) => <span className="font-mono text-ink-600 text-xs">{r.expiry_date || "-"}</span> },
  { key: "status", header: "Status", sortKey: "status", render: (r) => {
      let tone = "success";
      let text = "In Stock";
      if (r.status === "critical") {
        tone = "critical";
        text = "No Stock";
      } else if (r.status === "low") {
        tone = "warning";
        text = "Low Stock";
      }
      return <Badge tone={tone}>{text}</Badge>;
    }
  },
  { key: "updated_at", header: "Last Updated", sortKey: "updated_at", render: (r) => <span className="text-[10px] text-ink-400 font-medium">{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "-"}</span> }
];

export default function Inventory() {
  const { getData } = useDataCache();
  
  // Ingredients list for selectors
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // Transactions tab states
  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("All");
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    ingredient_id: "",
    type: "Stock In",
    qty: "",
    warehouse: "",
    batch_number: "",
    reference_number: "",
    reason: "Purchase Receipt",
    notes: "",
    user: "Hammadullah"
  });

  // Physical Counts states
  const [countsList, setCountsList] = useState([]);
  const [countFormOpen, setCountFormOpen] = useState(false);
  const [activeCountItems, setActiveCountItems] = useState([]);
  const [countWarehouse, setCountWarehouse] = useState("");
  const [countApprovedBy, setCountApprovedBy] = useState("Hammadullah");
  const [countNotes, setCountNotes] = useState("");
  const [selectedCountDetails, setSelectedCountDetails] = useState(null);

  // Expiry Tracking states
  const [expiryList, setExpiryList] = useState([]);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [newExp, setNewExp] = useState({
    name: "",
    batch_number: "",
    supplier: "Metro Cash & Carry",
    purchase_date: new Date().toLocaleDateString('en-CA'),
    expiry_date: "",
    qty: "",
    unit: "kg",
    warehouse: ""
  });

  // All Ingredients Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("All");

  const fields = [
    { key: "sku", label: "SKU / Code", type: "text", placeholder: "e.g. SKU-1005" },
    { key: "name", label: "Ingredient Name", type: "text" },
    {
      key: "category",
      label: "Category",
      render: (form, setForm) => (
        <div className="flex gap-2 mt-1 items-center w-full">
          <select
            value={form.category ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className="flex-1 border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
          >
            <option value="">Select Category...</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={async () => {
              const newCat = prompt("Enter new Category name:");
              if (newCat && newCat.trim()) {
                const trimmed = newCat.trim();
                if (!categories.includes(trimmed)) {
                  const updated = [...categories, trimmed];
                  setCategories(updated);
                  await api.setSetting("custom_inventory_categories", updated);
                  setForm(p => ({ ...p, category: trimmed }));
                } else {
                  setForm(p => ({ ...p, category: trimmed }));
                }
              }
            }}
            className="flex items-center justify-center p-2 rounded-lg bg-paprika-50 border border-paprika-200 text-paprika-600 hover:bg-paprika-100 transition-colors shrink-0"
            title="Add new Category"
          >
            <Plus size={18} />
          </button>
        </div>
      )
    },
    { key: "unit", label: "Unit", type: "select", options: ["kg", "g", "ltr", "ml", "pcs", "bags", "boxes"] },
    { key: "stock", label: "Current Stock", type: "number" },
    { key: "reorder", label: "Reorder Level", type: "number" },
    { key: "cost", label: "Average Purchase Cost (Rs.)", type: "number", disabled: true, placeholder: "(Calculated from Purchases)" },

    {
      key: "warehouse",
      label: "Storage Location (Warehouse)",
      render: (form, setForm) => (
        <div className="flex gap-2 mt-1 items-center w-full">
          <select
            value={form.warehouse ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, warehouse: e.target.value }))}
            className="flex-1 border border-canvas-200 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
          >
            <option value="">Select Warehouse...</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={async () => {
              const newLoc = prompt("Enter new Storage Location name:");
              if (newLoc && newLoc.trim()) {
                const trimmed = newLoc.trim();
                if (!warehouses.includes(trimmed)) {
                  const updated = [...warehouses, trimmed];
                  setWarehouses(updated);
                  await api.setSetting("custom_inventory_warehouses", updated);
                  setForm(p => ({ ...p, warehouse: trimmed }));
                } else {
                  setForm(p => ({ ...p, warehouse: trimmed }));
                }
              }
            }}
            className="flex items-center justify-center p-2 rounded-lg bg-paprika-50 border border-paprika-200 text-paprika-600 hover:bg-paprika-100 transition-colors shrink-0"
            title="Add new Location"
          >
            <Plus size={18} />
          </button>
        </div>
      )
    },
    { key: "expiry_date", label: "Expiry Date (Optional)", type: "date" }
  ];

  const loadData = () => {
    getData("inventory_items").then(setIngredients);
    getData("inventory_transactions").then(res => setTransactions(res || []));
    getData("physical_counts").then(res => setCountsList(res || []));
    getData("expiry_batches").then(res => setExpiryList(res || []));
    getData("suppliers").then(res => setSuppliers(res || []));
    api.getSetting("custom_inventory_categories").then(res => {
      const permanent = ["Vegetables", "Meat & Poultry", "Seafood", "Dairy & Eggs", "Fruits", "Spices & Herbs", "Grains & Pasta", "Bakery", "Beverages", "Packaging", "Cleaning"];
      const custom = res || [];
      setCategories([...new Set([...permanent, ...custom])]);
    });
    api.getSetting("custom_inventory_warehouses").then(res => {
      if (res) setWarehouses(res);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterFn = (r) => {
    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (warehouseFilter !== "All" && r.warehouse !== warehouseFilter) return false;
    return true;
  };

  const activeFilterCount = (categoryFilter !== "All" ? 1 : 0) + (statusFilter !== "All" ? 1 : 0) + (warehouseFilter !== "All" ? 1 : 0);
  const clearFilters = () => { setCategoryFilter("All"); setStatusFilter("All"); setWarehouseFilter("All"); };

  // Export CSV Helper
  const exportToCSV = (dataList, filename) => {
    if (!dataList || dataList.length === 0) return;
    const headers = Object.keys(dataList[0]).join(",");
    const rows = dataList.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Adjustments Form handler
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!newTx.ingredient_id || !newTx.qty) return;
    await api.addInventoryTransaction(newTx);
    setTxModalOpen(false);
    setNewTx({
      ingredient_id: "",
      type: "Stock In",
      qty: "",
      warehouse: "Main Kitchen Store",
      batch_number: "",
      reference_number: "",
      reason: "Purchase Receipt",
      notes: "",
      user: "Hammadullah"
    });
    loadData();
  };

  // Physical count handlers
  const handleStartCount = () => {
    const warehouseItems = ingredients
      .filter(i => i.warehouse === countWarehouse)
      .map(i => ({
        name: i.name,
        warehouse: countWarehouse,
        system_qty: i.stock,
        counted_qty: i.stock,
        diff: 0,
        variance: 0,
        reason: "",
        notes: ""
      }));
    setActiveCountItems(warehouseItems);
    setCountFormOpen(true);
  };

  const updateCountItemQty = (idx, value) => {
    const next = [...activeCountItems];
    const valNum = Number(value);
    next[idx].counted_qty = value;
    const diff = valNum - Number(next[idx].system_qty);
    next[idx].diff = diff;
    next[idx].variance = next[idx].system_qty > 0 ? (diff / next[idx].system_qty) * 100 : 0;
    setActiveCountItems(next);
  };

  const updateCountItemField = (idx, key, value) => {
    const next = [...activeCountItems];
    next[idx][key] = value;
    setActiveCountItems(next);
  };

  const handleSaveCountDraft = async () => {
    await api.submitPhysicalCount({
      date: new Date().toLocaleDateString('en-CA'),
      status: "draft",
      approved_by: countApprovedBy,
      notes: countNotes,
      items: activeCountItems
    });
    setCountFormOpen(false);
    loadData();
  };

  const handleSubmitCountFinal = async () => {
    await api.submitPhysicalCount({
      date: new Date().toLocaleDateString('en-CA'),
      status: "completed",
      approved_by: countApprovedBy,
      notes: countNotes,
      items: activeCountItems
    });
    setCountFormOpen(false);
    loadData();
  };

  // Expiry handler
  const handleSaveExpiry = async (e) => {
    e.preventDefault();
    if (!newExp.name || !newExp.expiry_date || !newExp.qty) return;
    await api.addExpiryBatch(newExp);
    setExpModalOpen(false);
    setNewExp({
      name: "",
      batch_number: "",
      supplier: "Metro Cash & Carry",
      purchase_date: new Date().toLocaleDateString('en-CA'),
      expiry_date: "",
      qty: "",
      unit: "kg",
      warehouse: "Main Kitchen Store"
    });
    loadData();
  };

  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <PageHeader
        eyebrow="Stock Control & Audits"
        title="Inventory Operations"
        description="Monitor physical counts, expiry batch notifications, and manual stock movements."
      />

      {/* ── TAB 1: ALL INGREDIENTS ──────────────────────────────────────────────── */}
        <div>
          <EntityManager 
            table="inventory_items" 
            moduleName="Ingredient" 
            columns={columns} 
            fields={fields} 
            actions={
              <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={() => exportToCSV(ingredients, "ingredients_inventory.csv")}>
                Export CSV
              </Button>
            }
            onFilter={filterFn}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            filterContent={
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Category</p>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                    <option value="All">All categories</option>
                    {categories.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Status</p>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                    <option value="All">All statuses</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="critical">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Warehouse</p>
                  <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}
                    className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
                    <option value="All">All warehouses</option>
                    {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            }
          />
        </div>



    </div>
  );
}
