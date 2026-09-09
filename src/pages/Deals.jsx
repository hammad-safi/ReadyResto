import { useEffect, useRef, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, RefreshCw, Printer, Filter, RotateCcw } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import useStickyState from "../hooks/useStickyState";
import Button from "../components/ui/Button";
import Badge, { statusTone } from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import BarcodePrintModal from "../components/ui/BarcodePrintModal";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useDataCache } from "../context/DataCacheContext";

const emptyForm = {
  name: "", price: 0, status: "available", image: "🍽️", barcode: "",
};

const isImageSource = (value) => typeof value === "string" && (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://"));

const renderItemImage = (image) => {
  if (isImageSource(image)) {
    return <img src={image} alt="Deal item" className="h-full w-full object-cover rounded-lg" />;
  }
  return <span className="text-2xl">{image || "🍽️"}</span>;
};

export default function Deals() {
  const { getData, cacheTick } = useDataCache();
  const { user } = useAuth();
  
  const [deals, setDeals] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  const [includedItems, setIncludedItems] = useState([]);
  const [menuSearch, setMenuSearch] = useStickyState("", "deal_menuSearch");
  
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printItem, setPrintItem] = useState(null);
  
  const [form, setForm] = useStickyState(emptyForm, "deal_form");
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useStickyState("", "deal_query");
  const [statusFilter, setStatusFilter] = useStickyState("All", "deal_statusFilter");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.listDeals(),
      getData("menu_items"),
    ]).then(([d, m]) => {
      setDeals(d || []);
      setMenuItems(m || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    void load();
  }, [cacheTick]);

  const filtered = deals.filter((d) => {
    if (statusFilter !== "All" && d.status !== statusFilter) return false;
    if (query.trim() && !(d.name || "").toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const activeFilterCount = (statusFilter !== "All" ? 1 : 0);
  const clearFilters = () => { setStatusFilter("All"); setQuery(""); };

  const openAdd = () => {
    setForm(emptyForm);
    setIncludedItems([]);
    setEditing(null);
    setImageError("");
    setAddOpen(true);
  };

  const openEdit = (deal) => {
    setForm(deal);
    const initialItems = (deal.groups || []).map(g => ({
      menu_item_id: g.items?.[0]?.menu_item_id || g.menu_item_ids?.[0],
      name: g.name,
      qty: g.qty_required,
      cost: g.items?.[0]?.cost || 0
    }));
    setIncludedItems(initialItems);
    setEditing(deal);
    setImageError("");
    setAddOpen(true);
  };

  const handleImageSelection = (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose a valid image file.");
      return;
    }

    setImageError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        setForm((prev) => ({ ...prev, image: dataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleImageSelection(event.dataTransfer?.files);
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((i) => {
      return (i.name || "").toLowerCase().includes(menuSearch.toLowerCase());
    }).slice(0, 10);
  }, [menuItems, menuSearch]);

  const addMenuItem = (item) => {
    setIncludedItems(prev => {
      const existing = prev.find(it => it.menu_item_id === item.id);
      if (existing) {
        return prev.map(it => it.menu_item_id === item.id ? { ...it, qty: Number(it.qty) + 1 } : it);
      }
      return [...prev, { menu_item_id: item.id, name: item.name, qty: 1, cost: item.cost || 0 }];
    });
  };

  const updateLine = (idx, val) => {
    setIncludedItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Number(val) } : it));
  };

  const removeLine = (idx) => {
    setIncludedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const calculateDealMetrics = (groups, items = menuItems) => {
    const itemMap = new Map(items.map(m => [m.id, m]));
    let totalCost = 0;
    let totalOriginalPrice = 0;
    
    (groups || []).forEach(g => {
      (g.menu_item_ids || []).forEach(id => {
        const item = itemMap.get(id);
        if (item) {
          totalCost += (Number(item.cost) || 0) * (Number(g.qty_required) || 1);
          totalOriginalPrice += (Number(item.price) || 0) * (Number(g.qty_required) || 1);
        }
      });
    });
    return { totalCost, totalOriginalPrice };
  };

  const groupsForMetrics = includedItems.map(item => ({
    name: item.name,
    qty_required: item.qty,
    menu_item_ids: [item.menu_item_id]
  }));

  const { totalCost, totalOriginalPrice } = calculateDealMetrics(groupsForMetrics);
  const suggestedPrice = totalOriginalPrice;
  const profitMargin = form.price > 0 ? Math.round(((form.price - totalCost) / form.price) * 100) : 0;

  const save = async () => {
    const groups = includedItems.map(item => ({
      name: item.name,
      qty_required: item.qty,
      menu_item_ids: [item.menu_item_id]
    }));

    const payload = { ...form, cost: totalCost };
    delete payload.id;
    
    if (editing) {
      await api.updateDeal(editing.id, payload, groups);
    } else {
      await api.createDeal(payload, groups);
    }

    setAddOpen(false);
    load();
  };

  const remove = async () => {
    await api.deleteDeal(confirmDelete.id);
    setConfirmDelete(null);
    load();
  };

  const toggleAvailability = async (deal) => {
    const next = deal.status === "available" ? "out_of_stock" : "available";
    await api.updateDeal(deal.id, { status: next }, deal.groups?.map(g => ({
        ...g,
        menu_item_ids: g.items ? g.items.map(i => i.menu_item_id) : (g.menu_item_ids || [])
    })) || []);
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Deals & Combos"
        description="Manage special offers and fixed combos."
        actions={<Button variant="primary" icon={Plus} onClick={openAdd}>Add New Deal</Button>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("All")}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
              statusFilter === "All" ? "bg-paprika-500 text-white border-paprika-500 shadow-sm" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("available")}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
              statusFilter === "available" ? "bg-paprika-500 text-white border-paprika-500 shadow-sm" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setStatusFilter("out_of_stock")}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
              statusFilter === "out_of_stock" ? "bg-paprika-500 text-white border-paprika-500 shadow-sm" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
            }`}
          >
            Out of Stock
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search deals..."
              className="w-48 pl-7 pr-3 py-1.5 text-xs border border-canvas-200 rounded-lg outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-ink-500 py-10 text-center">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((deal) => {
            const margin = deal.price > 0 ? Math.round(((deal.price - deal.cost) / deal.price) * 100) : 0;
            return (
              <div key={deal.id} className="bg-white border border-canvas-200 rounded-xl2 shadow-soft p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-lg bg-canvas-100 flex items-center justify-center overflow-hidden">
                    {renderItemImage(deal.image)}
                  </div>
                  <button onClick={() => toggleAvailability(deal)}>
                    <Badge tone={statusTone(deal.status || "available")}>{deal.status === "available" || !deal.status ? "Available" : "Out of stock"}</Badge>
                  </button>
                </div>
                <div>
                  <p className="font-medium text-sm text-ink-900">{deal.name}</p>
                  {deal.barcode && (
                    <p className="text-xs font-mono text-ink-500">Barcode: {deal.barcode}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono font-semibold text-paprika-600">Rs. {deal.price}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-ink-500">Cost Rs. {deal.cost}</span>
                    {deal.price > 0 && (
                      <Badge tone={margin >= 50 ? "success" : margin >= 20 ? "warning" : "critical"}>
                        {margin}% margin
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-canvas-100">
                  <Button variant="secondary" size="sm" icon={Pencil} className="flex-1" onClick={() => openEdit(deal)}>Edit</Button>
                  <button
                    onClick={() => {
                      setPrintItem(deal);
                      setPrintModalOpen(true);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-500 hover:text-paprika-600"
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(deal)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-500 hover:text-paprika-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-sm text-ink-500 py-10">No deals found.</div>
          )}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={editing ? "Edit Deal" : "Add New Deal"}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>{editing ? "Save Changes" : "Save Deal"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-ink-600">Deal Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                placeholder="e.g. Zinger Combo"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1 block">Barcode</label>
              <div className="flex flex-col gap-2">
                <input
                  value={form.barcode || ""}
                  onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                  className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 font-mono"
                  placeholder="Scan or enter barcode"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() }))}
                    className="flex-1 px-3 py-2 bg-canvas-100 hover:bg-canvas-200 text-ink-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={14} /> Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrintItem(form);
                      setPrintModalOpen(true);
                    }}
                    disabled={!form.barcode}
                    className="flex-1 px-3 py-2 bg-paprika-500 hover:bg-paprika-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Printer size={14} /> Print Labels
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-600">Deal Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
                className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-center transition ${isDragging ? "border-paprika-500 bg-paprika-50" : "border-canvas-200 bg-canvas-50"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageSelection(event.target.files)}
                />
                {isImageSource(form.image) ? (
                  <>
                    <img src={form.image} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-canvas-200" />
                    <div>
                      <p className="text-sm font-medium text-ink-900">Image selected</p>
                      <p className="text-xs text-ink-500">Drag another image here or click to replace it.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-canvas-200 bg-white text-3xl">
                      {renderItemImage(form.image)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Upload deal image</p>
                      <p className="text-xs text-ink-500">PNG, JPG, or WEBP • drag and drop here</p>
                    </div>
                  </>
                )}
                {imageError && <p className="text-xs text-paprika-600">{imageError}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-600">Selling Price (Rs.)</label>
              <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
            </div>

            <div className="flex flex-col justify-center border border-canvas-200 rounded-lg px-3 py-2 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-600">Available for sale</span>
                <input
                  type="checkbox"
                  checked={form.status === "available"}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked ? "available" : "out_of_stock" }))}
                  className="h-4 w-4 accent-paprika-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Include Items</p>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Search menu..." className="w-full rounded-lg border border-canvas-200 bg-white pl-8 pr-3 py-2 text-sm outline-none" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filteredMenuItems.map(item => (
                <button type="button" key={item.id} onClick={() => addMenuItem(item)} className="shrink-0 rounded-lg border border-canvas-200 bg-white px-3 py-2 text-left hover:border-basil-400 hover:bg-basil-50">
                  <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                  <p className="text-[10px] text-ink-400">Cost: Rs. {item.cost}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-canvas-200 overflow-hidden flex-1 max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Item</th>
                    <th className="px-3 py-2.5 text-right w-24">Qty</th>
                    <th className="px-3 py-2.5 text-right w-24">Cost</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {includedItems.map((line, idx) => (
                    <tr key={idx} className="border-t border-canvas-100">
                      <td className="px-3 py-2 font-medium text-ink-900">{line.name}</td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min={1} value={line.qty} onChange={(e) => updateLine(idx, e.target.value)} className="w-16 rounded-lg border border-canvas-200 px-2 py-1.5 text-sm text-right font-mono outline-none" />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-ink-700">
                        Rs. {(Number(line.qty) * Number(line.cost)).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => removeLine(idx)} className="text-ink-400 hover:text-paprika-600"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {includedItems.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-ink-400 text-sm italic">No items included yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 bg-[rgb(var(--surface-sidebar))] text-white rounded-xl p-4">
              <div>
                <p className="text-[11px] text-white/70">Total Cost</p>
                <p className="font-mono font-bold text-xl">Rs. {totalCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/70">Suggested Price</p>
                <p className="font-mono font-bold text-xl">Rs. {suggestedPrice.toLocaleString()}</p>
              </div>
              <div className="col-span-2 border-t border-white/20 pt-2">
                <p className="text-[11px] text-white/70">Estimated Profit Margin</p>
                <p className={`font-mono font-bold text-xl ${profitMargin < 50 ? "text-paprika-400" : "text-basil-400"}`}>{profitMargin}%</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete deal?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete Permanently</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This will permanently remove <span className="font-medium text-ink-900">{confirmDelete?.name}</span> from deals.
        </p>
      </Modal>

      <BarcodePrintModal 
        isOpen={printModalOpen} 
        onClose={() => setPrintModalOpen(false)} 
        item={printItem} 
      />
    </div>
  );
}
